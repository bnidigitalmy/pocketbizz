/**
 * BCL Webhook Tests
 * 
 * Tests idempotency, duplicate payments, trial termination, and subscription extension
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { setupTestApp } from '../server/index';
import { db } from '../server/db';
import { users, userSubscriptions, billingHistory, subscriptionPlans } from '@shared/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

describe('BCL Webhook Integration', () => {
  let app: any;
  let testUser: any;
  let standardPlan: any;

  beforeAll(async () => {
    // Set test environment variable
    process.env.BCL_WEBHOOK_SECRET = 'test-webhook-secret-12345';
    process.env.NODE_ENV = 'test';
    
    // Setup app with routes
    app = await setupTestApp();
    
    // Create standard plan if not exists
    const existingPlan = await db.query.subscriptionPlans.findFirst({
      where: eq(subscriptionPlans.name, 'standard'),
    });

    if (!existingPlan) {
      [standardPlan] = await db.insert(subscriptionPlans).values({
        name: 'standard',
        displayName: 'PocketBizz Standard',
        monthlyPrice: '27.00',
        maxProducts: 100,
        maxCustomers: 500,
        maxStockItems: 200,
        maxVendors: 20,
      } as any).returning();
    } else {
      standardPlan = existingPlan;
    }
  });

  beforeEach(async () => {
    // Clean up previous test user
    if (testUser) {
      await db.delete(userSubscriptions).where(eq(userSubscriptions.userId, testUser.id));
      await db.delete(billingHistory).where(eq(billingHistory.userId, testUser.id));
      await db.delete(users).where(eq(users.id, testUser.id));
    }

    // Create fresh test user on trial
    const email = `test-webhook-${Date.now()}@example.com`;
    const hashedPassword = await bcrypt.hash('Test123!@#', 10);

    [testUser] = await db.insert(users).values({
      email,
      password: hashedPassword,
      name: 'Test User',
      businessName: 'Test Business',
      isOnTrial: 1,
      trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    }).returning();
  });

  afterAll(async () => {
    // Cleanup
    if (testUser) {
      await db.delete(userSubscriptions).where(eq(userSubscriptions.userId, testUser.id));
      await db.delete(billingHistory).where(eq(billingHistory.userId, testUser.id));
      await db.delete(users).where(eq(users.id, testUser.id));
    }
  });

  describe('Payment Success Flow', () => {
    it('should activate subscription for trial user (3 months)', async () => {
      const payload = {
        event: 'payment-success',
        data: {
          form_id: 123,
          form_slug: '3-bulan',
          form_title: 'Langganan 3 Bulan',
          record_type: 'Transaction',
          record_id: 'LINK-TEST-001',
          main_data: {
            id: 'tx-001',
            form_id: 123,
            payer_email: testUser.email,
            payer_name: 'Test User',
            payer_telephone_number: '0123456789',
            order_number: 'ORDER-TEST-001',
            amount: '79',
            is_paid: '1',
            status: 'completed',
            payment_channel: 'FPX',
            currency: 'MYR',
          },
        },
      };

      const response = await request(app)
        .post('/api/webhooks/bcl')
        .send(payload);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.isNewSubscription).toBe(true);
      expect(response.body.data.wasOnTrial).toBe(true);
      expect(response.body.data.extendedMonths).toBe(3);

      // Verify user trial terminated
      const updatedUser = await db.query.users.findFirst({
        where: eq(users.id, testUser.id),
      });
      expect(updatedUser?.isOnTrial).toBe(0);

      // Verify subscription created
      const subscription = await db.query.userSubscriptions.findFirst({
        where: eq(userSubscriptions.userId, testUser.id),
      });
      expect(subscription).toBeDefined();
      expect(subscription?.durationMonths).toBe(3);
      expect(subscription?.status).toBe('active');
      expect(subscription?.externalTransactionId).toBe('ORDER-TEST-001');

      // Verify billing history
      const billing = await db.query.billingHistory.findFirst({
        where: eq(billingHistory.userId, testUser.id),
      });
      expect(billing).toBeDefined();
      expect(billing?.amount).toBe('79.00'); // Decimal field includes .00
      expect(billing?.status).toBe('succeeded');
    });

    it('should return idempotent response for duplicate webhook', async () => {
      const payload = {
        event: 'payment-success',
        data: {
          form_id: 123,
          form_slug: '3-bulan',
          form_title: 'Langganan 3 Bulan',
          record_type: 'Transaction',
          record_id: 'LINK-DUP-001',
          main_data: {
            id: 'tx-dup-001',
            form_id: 123,
            payer_email: testUser.email,
            payer_name: 'Test User',
            order_number: 'ORDER-DUP-001',
            amount: '79',
            is_paid: '1',
            status: 'completed',
            payment_channel: 'FPX',
            currency: 'MYR',
          },
        },
      };

      // First request
      const response1 = await request(app)
        .post('/api/webhooks/bcl')
        .send(payload);

      expect(response1.status).toBe(200);
      expect(response1.body.data.isNewSubscription).toBe(true);

      const firstSubscriptionId = response1.body.data.subscriptionId;

      // Duplicate request (same order_number)
      const response2 = await request(app)
        .post('/api/webhooks/bcl')
        .send(payload);

      expect(response2.status).toBe(200);
      expect(response2.body.success).toBe(true);
      expect(response2.body.data.isNewSubscription).toBe(false);
      expect(response2.body.data.subscriptionId).toBe(firstSubscriptionId);
      expect(response2.body.message).toContain('already processed');

      // Verify only one subscription exists
      const subscriptions = await db.select()
        .from(userSubscriptions)
        .where(eq(userSubscriptions.userId, testUser.id));

      expect(subscriptions.length).toBe(1);
    });

    it('should extend existing subscription when user pays again', async () => {
      // First payment (3 months)
      const payload1 = {
        event: 'payment-success',
        data: {
          form_id: 123,
          form_title: 'Langganan 3 Bulan',
          record_id: 'LINK-EXT-001',
          main_data: {
            payer_email: testUser.email,
            order_number: 'ORDER-EXT-001',
            amount: '79',
            is_paid: '1',
            status: 'completed',
            currency: 'MYR',
          },
        },
      };

      const response1 = await request(app)
        .post('/api/webhooks/bcl')
        .send(payload1);

      expect(response1.status).toBe(200);
      const firstEndsAt = new Date(response1.body.data.newEndsAt);

      // Second payment (6 months) - should extend
      const payload2 = {
        event: 'payment-success',
        data: {
          form_id: 456,
          form_title: 'Langganan 6 Bulan',
          record_id: 'LINK-EXT-002',
          main_data: {
            payer_email: testUser.email,
            order_number: 'ORDER-EXT-002',
            amount: '146',
            is_paid: '1',
            status: 'completed',
            currency: 'MYR',
          },
        },
      };

      const response2 = await request(app)
        .post('/api/webhooks/bcl')
        .send(payload2);

      expect(response2.status).toBe(200);
      expect(response2.body.data.isNewSubscription).toBe(false);
      expect(response2.body.data.extendedMonths).toBe(6);
      
      const previousEndsAt = new Date(response2.body.data.previousEndsAt);
      const newEndsAt = new Date(response2.body.data.newEndsAt);

      // Verify extension (should be ~6 months after first end date)
      const monthsDiff = (newEndsAt.getTime() - previousEndsAt.getTime()) / (1000 * 60 * 60 * 24 * 30);
      expect(Math.abs(monthsDiff - 6)).toBeLessThan(1); // Allow some variance

      // Verify total months updated
      expect(response2.body.data.totalMonths).toBe(9); // 3 + 6

      // Verify that a linked audit record was created with status 'superseded'
      const supersededRecord = await db.query.userSubscriptions.findFirst({
        where: eq(userSubscriptions.externalTransactionId, 'ORDER-EXT-002'),
      });

      expect(supersededRecord).toBeDefined();
      expect(supersededRecord?.status).toBe('superseded');
      expect(supersededRecord?.previousSubscriptionId).toBeDefined();
    });
  });

  describe('Validation & Security', () => {
    it('should reject payment with wrong currency', async () => {
      const payload = {
        event: 'payment-success',
        data: {
          form_title: 'Langganan 3 Bulan',
          record_id: 'LINK-ERR-001',
          main_data: {
            payer_email: testUser.email,
            order_number: 'ORDER-ERR-001',
            amount: '79',
            is_paid: '1',
            status: 'completed',
            currency: 'USD', // Wrong currency
          },
        },
      };

      const response = await request(app)
        .post('/api/webhooks/bcl')
        .send(payload);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid currency');
    });

    it('should reject payment with mismatched amount', async () => {
      const payload = {
        event: 'payment-success',
        data: {
          form_title: 'Langganan 3 Bulan',
          record_id: 'LINK-ERR-002',
          main_data: {
            payer_email: testUser.email,
            order_number: 'ORDER-ERR-002',
            amount: '50', // Wrong amount (should be 79)
            is_paid: '1',
            status: 'completed',
            currency: 'MYR',
          },
        },
      };

      const response = await request(app)
        .post('/api/webhooks/bcl')
        .send(payload);

      expect(response.status).toBe(500);
      expect(response.body.error).toContain('Amount mismatch');
    });

    it('should reject payment for non-existent user', async () => {
      const payload = {
        event: 'payment-success',
        data: {
          form_title: 'Langganan 3 Bulan',
          record_id: 'LINK-ERR-003',
          main_data: {
            payer_email: 'nonexistent@example.com',
            order_number: 'ORDER-ERR-003',
            amount: '79',
            is_paid: '1',
            status: 'completed',
            currency: 'MYR',
          },
        },
      };

      const response = await request(app)
        .post('/api/webhooks/bcl')
        .send(payload);

      expect(response.status).toBe(500);
      expect(response.body.error).toContain('User not found');
    });

    it('should reject non-payment-success events', async () => {
      const payload = {
        event: 'form-submit', // Wrong event
        data: {
          form_title: 'Langganan 3 Bulan',
          main_data: {
            payer_email: testUser.email,
            amount: '79',
            is_paid: '0',
            currency: 'MYR',
          },
        },
      };

      const response = await request(app)
        .post('/api/webhooks/bcl')
        .send(payload);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('ignored');
    });

    it('should reject unpaid payments', async () => {
      const payload = {
        event: 'payment-success',
        data: {
          form_title: 'Langganan 3 Bulan',
          main_data: {
            payer_email: testUser.email,
            order_number: 'ORDER-ERR-004',
            amount: '79',
            is_paid: '0', // Not paid
            status: 'pending',
            currency: 'MYR',
          },
        },
      };

      const response = await request(app)
        .post('/api/webhooks/bcl')
        .send(payload);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('not confirmed');
    });
  });

  describe('Package Detection', () => {
    it('should detect 1-month package from form title', async () => {
      const payload = {
        event: 'payment-success',
        data: {
          form_title: 'Langganan 1 Bulan',
          record_id: 'LINK-1M-001',
          main_data: {
            payer_email: testUser.email,
            order_number: 'ORDER-1M-001',
            amount: '27',
            is_paid: '1',
            status: 'completed',
            currency: 'MYR',
          },
        },
      };

      const response = await request(app)
        .post('/api/webhooks/bcl')
        .send(payload);

      expect(response.status).toBe(200);
      expect(response.body.data.extendedMonths).toBe(1);
    });

    it('should detect 12-month package from exact amount', async () => {
      const payload = {
        event: 'payment-success',
        data: {
          form_title: 'Unknown Title', // No months in title
          record_id: 'LINK-12M-001',
          main_data: {
            payer_email: testUser.email,
            order_number: 'ORDER-12M-001',
            amount: '259', // Exact 12-month price
            is_paid: '1',
            status: 'completed',
            currency: 'MYR',
          },
        },
      };

      const response = await request(app)
        .post('/api/webhooks/bcl')
        .send(payload);

      expect(response.status).toBe(200);
      expect(response.body.data.extendedMonths).toBe(12);
    });
  });
});

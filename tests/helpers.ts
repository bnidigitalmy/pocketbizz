import type { Express } from 'express';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { db } from '../server/db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { mockData } from './factories';

/**
 * Authentication helper for tests
 */
export class TestAuthHelper {
  private app: Express;
  private testUsers: Map<string, { user: any; cookie: string }> = new Map();

  constructor(app: Express) {
    this.app = app;
  }

  /**
   * Create a test user and return authentication cookie
   */
  async createAuthenticatedUser(overrides = {}) {
    const userData = mockData.user(overrides);
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    // Create user in database
    const [user] = await db
      .insert(users)
      .values({
        email: userData.email,
        password: hashedPassword,
        fullName: userData.fullName,
        businessName: userData.businessName,
        isAdmin: userData.isAdmin,
      })
      .returning();

    // Login to get session cookie
    const loginResponse = await request(this.app)
      .post('/api/auth/login')
      .send({
        email: userData.email,
        password: userData.password,
      });

    const cookie = loginResponse.headers['set-cookie'];

    this.testUsers.set(user.id, { user, cookie });

    return { user, cookie, password: userData.password };
  }

  /**
   * Get authenticated request agent
   */
  getAuthenticatedAgent(cookie: string) {
    return {
      get: (url: string) => request(this.app).get(url).set('Cookie', cookie),
      post: (url: string) => request(this.app).post(url).set('Cookie', cookie),
      put: (url: string) => request(this.app).put(url).set('Cookie', cookie),
      patch: (url: string) => request(this.app).patch(url).set('Cookie', cookie),
      delete: (url: string) => request(this.app).delete(url).set('Cookie', cookie),
    };
  }

  /**
   * Cleanup all test users
   */
  async cleanup() {
    for (const [userId] of this.testUsers) {
      await db.delete(users).where(eq(users.id, userId));
    }
    this.testUsers.clear();
  }
}

/**
 * Database helper for test cleanup
 */
export class TestDbHelper {
  /**
   * Clean up specific user's data
   */
  static async cleanupUserData(userId: string) {
    // Delete in order of dependencies
    const { sales, salesItems, deliveries, deliveryItems, products, vendors, suppliers } = await import('@shared/schema');
    
    await db.delete(salesItems).where(eq(salesItems.userId, userId));
    await db.delete(sales).where(eq(sales.userId, userId));
    await db.delete(deliveryItems).where(eq(deliveryItems.deliveryId, userId)); // This is a simplification
    await db.delete(deliveries).where(eq(deliveries.userId, userId));
    await db.delete(products).where(eq(products.userId, userId));
    await db.delete(vendors).where(eq(vendors.userId, userId));
    await db.delete(suppliers).where(eq(suppliers.userId, userId));
    await db.delete(users).where(eq(users.id, userId));
  }

  /**
   * Verify database connection
   */
  static async verifyConnection() {
    try {
      await db.execute('SELECT 1');
      return true;
    } catch (error) {
      console.error('Database connection failed:', error);
      return false;
    }
  }
}

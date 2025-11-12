/**
 * Seed Pricing Plans for PocketBizz
 * 
 * Creates 4 subscription tiers:
 * - Trial: RM0 (14 days)
 * - Basic: RM39/month
 * - Pro: RM89/month (most popular)
 * - Premium: RM159/month
 */

import { db } from '../server/db.js';
import { subscriptionPlans } from '../shared/schema.js';
import { eq } from 'drizzle-orm';

const pricingPlans = [
  {
    name: 'trial',
    displayName: 'Free Trial',
    description: '14 days to test all features - no credit card required',
    monthlyPrice: '0.00',
    annualPrice: '0.00',
    currency: 'MYR',
    
    // Limits
    maxUsers: 1,
    maxProducts: 10,
    maxCustomers: 50,
    maxStockItems: 20,
    maxVendors: 2,
    maxResellers: 0,
    maxDeliveriesPerMonth: 10,
    storageQuotaMB: 100,
    whatsappMessagesPerMonth: 0,
    smsPerMonth: 0,
    
    // Features
    hasVendorClaims: 0,
    hasResellerNetwork: 0,
    hasAdvancedAnalytics: 0,
    hasLoyaltyPoints: 0,
    hasBookings: 0,
    hasWhatsappBroadcast: 0,
    hasSmsBroadcast: 0,
    hasPublicStore: 0,
    hasApiAccess: 0,
    hasCustomDomain: 0,
    hasPrioritySupport: 0,
    hasAccountManager: 0,
    
    discount6Months: '0.00',
    discount12Months: '0.00',
    isActive: 0, // Hidden from pricing page - auto-assigned on registration
    sortOrder: 0,
    
    features: JSON.stringify([
      'Basic inventory management',
      'POS & sales tracking',
      'Stock management (20 items max)',
      'Production batches',
      'Basic reports',
      '10 products max',
      '50 customers max',
      '2 vendors max',
      '10 deliveries/month',
      '100MB storage'
    ])
  },
  
  {
    name: 'basic',
    displayName: '🥉 Basic',
    description: 'Perfect for solo home bakers and weekend sellers',
    monthlyPrice: '39.00',
    annualPrice: '390.00', // Save RM78 (17% off)
    currency: 'MYR',
    
    // Limits
    maxUsers: 1,
    maxProducts: 50,
    maxCustomers: 200,
    maxStockItems: 100,
    maxVendors: 5,
    maxResellers: 0,
    maxDeliveriesPerMonth: 50,
    storageQuotaMB: 500,
    whatsappMessagesPerMonth: 0,
    smsPerMonth: 0,
    
    // Features
    hasVendorClaims: 0,
    hasResellerNetwork: 0,
    hasAdvancedAnalytics: 0,
    hasLoyaltyPoints: 0,
    hasBookings: 0,
    hasWhatsappBroadcast: 0,
    hasSmsBroadcast: 0,
    hasPublicStore: 0,
    hasApiAccess: 0,
    hasCustomDomain: 0,
    hasPrioritySupport: 0,
    hasAccountManager: 0,
    
    discount6Months: '0.00',
    discount12Months: '17.00',
    isActive: 1,
    sortOrder: 2,
    
    features: JSON.stringify([
      'Inventory & stock management',
      'POS & sales tracking',
      'Production batches',
      'Purchase orders',
      'Supplier management',
      'Delivery scheduling',
      'Invoice generation',
      'Basic reports & analytics',
      'Low stock alerts',
      'Expense tracking',
      'Data export (Excel/CSV)',
      'Email support'
    ])
  },
  
  {
    name: 'pro',
    displayName: '🥈 Pro',
    description: 'Most popular! For growing bakeries with vendor consignment',
    monthlyPrice: '89.00',
    annualPrice: '890.00', // Save RM178 (17% off)
    currency: 'MYR',
    
    // Limits
    maxUsers: 3,
    maxProducts: 200,
    maxCustomers: 1000,
    maxStockItems: 500,
    maxVendors: 20,
    maxResellers: 10,
    maxDeliveriesPerMonth: 200,
    storageQuotaMB: 2048, // 2GB
    whatsappMessagesPerMonth: 500,
    smsPerMonth: 0,
    
    // Features (MOST POWERFUL!)
    hasVendorClaims: 1, // ⭐ KILLER FEATURE
    hasResellerNetwork: 1, // ⭐ KILLER FEATURE
    hasAdvancedAnalytics: 1,
    hasLoyaltyPoints: 1,
    hasBookings: 1,
    hasWhatsappBroadcast: 1,
    hasSmsBroadcast: 0,
    hasPublicStore: 0,
    hasApiAccess: 0,
    hasCustomDomain: 0,
    hasPrioritySupport: 1,
    hasAccountManager: 0,
    
    discount6Months: '0.00',
    discount12Months: '17.00',
    isActive: 1,
    sortOrder: 3,
    
    features: JSON.stringify([
      'Everything in Basic',
      '3 users (multi-location access)',
      'Vendor Claims System',
      'Vendor stock balance tracking',
      'Reseller/Agent network',
      'Commission tracking',
      'Advanced analytics & forecasting',
      'Loyalty points & rewards',
      'Voucher & promo codes',
      'Booking system (pre-orders)',
      'PO templates',
      'Multi-user access',
      'Audit trail',
      'Custom branding',
      'Priority support (24h)'
    ])
  },
  
  {
    name: 'premium',
    displayName: '🥇 Premium',
    description: 'For large bakeries with multiple outlets and online presence',
    monthlyPrice: '159.00',
    annualPrice: '1590.00', // Save RM318 (17% off)
    currency: 'MYR',
    
    // Limits (UNLIMITED!)
    maxUsers: 10,
    maxProducts: 999999, // Unlimited
    maxCustomers: 999999,
    maxStockItems: 999999,
    maxVendors: 999999,
    maxResellers: 999999,
    maxDeliveriesPerMonth: 999999,
    storageQuotaMB: 10240, // 10GB
    whatsappMessagesPerMonth: 5000,
    smsPerMonth: 500,
    
    // Features (EVERYTHING!)
    hasVendorClaims: 1,
    hasResellerNetwork: 1,
    hasAdvancedAnalytics: 1,
    hasLoyaltyPoints: 1,
    hasBookings: 1,
    hasWhatsappBroadcast: 1,
    hasSmsBroadcast: 1,
    hasPublicStore: 1, // ⭐ PREMIUM EXCLUSIVE
    hasApiAccess: 1, // ⭐ PREMIUM EXCLUSIVE
    hasCustomDomain: 1, // ⭐ PREMIUM EXCLUSIVE
    hasPrioritySupport: 1,
    hasAccountManager: 1, // ⭐ PREMIUM EXCLUSIVE
    
    discount6Months: '0.00',
    discount12Months: '17.00',
    isActive: 1,
    sortOrder: 4,
    
    features: JSON.stringify([
    features: JSON.stringify([
      'UNLIMITED products, customers, vendors',
      '10 users (multi-location)',
      'Advanced role-based permissions',
      'Branch management',
      'Consolidated reports',
      '2FA security',
      'Vendor Claims System',
      'Reseller Network',
      'Booking System',
      'Dedicated account manager',
      'WhatsApp support hotline',
      'Priority support (4h response)',
      'Monthly business review call',
      'Custom feature requests'
    ])
  }
];

async function seedPricingPlans() {
  try {
    console.log('🌱 Seeding pricing plans...');
    
    for (const plan of pricingPlans) {
      // Check if plan already exists
      const existing = await db
        .select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.name, plan.name))
        .limit(1);
      
      if (existing.length > 0) {
        // Update existing plan
        await db
          .update(subscriptionPlans)
          .set({
            ...plan,
            updatedAt: new Date()
          })
          .where(eq(subscriptionPlans.name, plan.name));
        
        console.log(`✅ Updated: ${plan.displayName} (${plan.name})`);
      } else {
        // Insert new plan
        await db.insert(subscriptionPlans).values(plan);
        console.log(`✅ Created: ${plan.displayName} (${plan.name})`);
      }
    }
    
    console.log('\n🎉 Pricing plans seeded successfully!');
    console.log('\n📊 Plans created:');
    console.log('   🎁 Trial:   RM0 (14 days, 10 products)');
    console.log('   🥉 Basic:   RM39/month (50 products)');
    console.log('   🥈 Pro:     RM89/month (200 products) ⭐ Most Popular');
    console.log('   🥇 Premium: RM159/month (unlimited)');
    console.log('\n💡 Annual pricing saves 17% (2 months free!)');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding pricing plans:', error);
    process.exit(1);
  }
}

// Run the seed function
seedPricingPlans();

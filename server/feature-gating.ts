/**
 * Feature Gating Middleware
 * 
 * Controls access to premium features based on subscription plan.
 * Checks limits and blocks actions when exceeded.
 */

import type { Request, Response, NextFunction } from "express";
import { storage } from "./storage";

/**
 * Get user's active subscription plan with limits
 */
export async function getUserPlan(userId: string) {
  // First check if user is on active trial
  const user = await storage.getUserById(userId);
  if (user && user.isOnTrial && user.trialEndsAt && new Date(user.trialEndsAt) > new Date()) {
    // User on active trial - return "premium trial" plan
    return {
      id: 'trial',
      displayName: '🎁 Free Trial (Full Access)',
      // All premium features unlocked during trial!
      hasVendorClaims: 1,
      hasResellerNetwork: 1,
      hasAdvancedAnalytics: 1,
      hasLoyaltyPoints: 1,
      hasBookings: 1,
      hasWhatsappBroadcast: 1,
      hasSmsBroadcast: 1,
      hasPublicStore: 1,
      hasApiAccess: 1,
      hasCustomDomain: 1,
      hasPrioritySupport: 0,
      hasAccountManager: 0,
      // Generous limits for trial
      maxProducts: 100,
      maxCustomers: 500,
      maxStockItems: 200,
      maxVendors: 20,
      maxResellers: 20,
      maxDeliveriesPerMonth: 200,
      maxUsers: 3,
      storageLimit: 2147483648, // 2GB
    };
  }
  
  const subscriptions = await storage.getUserSubscriptions(userId);
  const now = new Date();
  
  // Find active subscription
  const activeSub = subscriptions.find(sub => 
    sub.status === 'active' && 
    sub.subscriptionEndsAt && 
    new Date(sub.subscriptionEndsAt) > now
  );
  
  if (activeSub) {
    // Get plan details
    const plan = await storage.getSubscriptionPlanById(activeSub.planId);
    return plan;
  }
  
  return null;
}

/**
 * Check if user has access to a specific feature
 */
export async function hasFeatureAccess(
  userId: string, 
  feature: string
): Promise<boolean> {
  const plan = await getUserPlan(userId);
  
  if (!plan) {
    // No active subscription AND not on trial = no access
    return false;
  }
  
  // Map feature names to plan columns
  const featureMap: Record<string, string> = {
    'vendor_claims': 'hasVendorClaims',
    'reseller_network': 'hasResellerNetwork',
    'advanced_analytics': 'hasAdvancedAnalytics',
    'loyalty_points': 'hasLoyaltyPoints',
    'bookings': 'hasBookings',
    'whatsapp_broadcast': 'hasWhatsappBroadcast',
    'sms_broadcast': 'hasSmsBroadcast',
    'public_store': 'hasPublicStore',
    'api_access': 'hasApiAccess',
    'custom_domain': 'hasCustomDomain',
    'priority_support': 'hasPrioritySupport',
    'account_manager': 'hasAccountManager',
  };
  
  const column = featureMap[feature];
  if (!column) return false;
  
  return plan[column] === 1;
}

/**
 * Middleware: Require specific feature access
 */
export function requireFeature(feature: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const hasAccess = await hasFeatureAccess(req.user.id, feature);
    
    if (!hasAccess) {
      return res.status(403).json({ 
        message: "This feature requires a premium subscription",
        feature,
        upgradeRequired: true
      });
    }
    
    next();
  };
}

/**
 * Check if user has reached limit for a resource
 */
export async function checkLimit(
  userId: string,
  resource: 'products' | 'customers' | 'vendors' | 'resellers' | 'stock_items'
): Promise<{ allowed: boolean; current: number; limit: number; plan: string }> {
  const plan = await getUserPlan(userId);
  
  // Default to trial limits if no plan
  const limits = {
    products: plan?.maxProducts || 10,
    customers: plan?.maxCustomers || 50,
    vendors: plan?.maxVendors || 2,
    resellers: plan?.maxResellers || 0,
    stock_items: plan?.maxStockItems || 20,
  };
  
  // Get current count
  let current = 0;
  switch (resource) {
    case 'products':
      current = await storage.getProductCount(userId);
      break;
    case 'customers':
      current = (await storage.getCustomers(userId)).length;
      break;
    case 'vendors':
      current = (await storage.getVendors(userId)).length;
      break;
    case 'resellers':
      current = (await storage.getResellers(userId)).length;
      break;
    case 'stock_items':
      current = (await storage.getStockItems(userId)).length;
      break;
  }
  
  const limit = limits[resource];
  const allowed = current < limit;
  
  return {
    allowed,
    current,
    limit,
    plan: plan?.displayName || '🎁 Free Trial'
  };
}

/**
 * Middleware: Block if limit reached
 */
export function enforceLimit(resource: 'products' | 'customers' | 'vendors' | 'resellers' | 'stock_items') {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const check = await checkLimit(req.user.id, resource);
    
    if (!check.allowed) {
      // User-friendly messages in Bahasa Malaysia
      const resourceNames: Record<string, string> = {
        products: 'produk',
        customers: 'pelanggan',
        vendors: 'vendor',
        resellers: 'reseller',
        stock_items: 'item stok'
      };
      
      const resourceName = resourceNames[resource] || resource;
      
      return res.status(403).json({
        message: `Had ${resourceName} anda telah dicapai (${check.current}/${check.limit}). Upgrade untuk tambah lebih banyak!`,
        current: check.current,
        limit: check.limit,
        plan: check.plan,
        upgradeRequired: true,
        resource
      });
    }
    
    next();
  };
}

/**
 * Middleware: Block premium features for trial/basic users
 */
export const requireVendorClaims = requireFeature('vendor_claims');
export const requireResellerNetwork = requireFeature('reseller_network');
export const requireAdvancedAnalytics = requireFeature('advanced_analytics');
export const requireLoyaltyPoints = requireFeature('loyalty_points');
export const requireBookings = requireFeature('bookings');
export const requireWhatsappBroadcast = requireFeature('whatsapp_broadcast');
export const requireSmsBroadcast = requireFeature('sms_broadcast');
export const requirePublicStore = requireFeature('public_store');
export const requireApiAccess = requireFeature('api_access');

/**
 * Middleware: Enforce resource limits
 */
export const enforceProductLimit = enforceLimit('products');
export const enforceCustomerLimit = enforceLimit('customers');
export const enforceVendorLimit = enforceLimit('vendors');
export const enforceResellerLimit = enforceLimit('resellers');
export const enforceStockLimit = enforceLimit('stock_items');

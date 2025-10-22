import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { deliveryItems, earlyBirdTracking, billingHistory } from "@shared/schema";
import { eq, sql } from "drizzle-orm";
import { 
  insertProductSchema,
  insertProductionBatchSchema,
  insertVendorSchema,
  insertDeliverySchema,
  insertSaleSchema,
  insertSalesItemSchema,
  insertExpenseSchema,
  insertBusinessProfileSchema,
  insertGoogleDriveSyncLogSchema,
  insertStockItemSchema,
  insertCategorySchema,
  convertUnit,
  insertUserSchema,
  insertSubscriptionPlanSchema,
  insertPricingTierSchema,
  insertResellerSchema,
  insertResellerTransferSchema,
} from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { uploadPDFToGoogleDrive, listManisBizzFiles } from "./google-drive";

// Auth middleware - adds user object to request if logged in
async function loadUser(req: Request, res: Response, next: NextFunction) {
  if (req.session.userId) {
    const user = await storage.getUserById(req.session.userId);
    if (user) {
      // Auto-disable expired trials
      if (user.isOnTrial && user.trialEndsAt && new Date(user.trialEndsAt) < new Date()) {
        await storage.updateUser(user.id, { isOnTrial: 0 });
        user.isOnTrial = 0;
      }
      
      // Auto-expire subscriptions that have passed their end date
      const subscriptions = await storage.getUserSubscriptions(user.id);
      const now = new Date();
      
      for (const sub of subscriptions) {
        if (sub.status === 'active' && sub.subscriptionEndsAt && new Date(sub.subscriptionEndsAt) < now) {
          // Mark subscription as expired
          await storage.updateUserSubscription(sub.id, { status: 'expired' });
        }
      }
      
      req.user = user;
    }
  }
  next();
}

// Middleware to require authentication
function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized - please login" });
  }
  next();
}

// Helper: Get user's current active subscription
async function getUserActiveSubscription(userId: string) {
  const subscriptions = await storage.getUserSubscriptions(userId);
  const now = new Date();
  
  // Find active subscription that hasn't expired
  const activeSub = subscriptions.find(sub => 
    sub.status === 'active' && 
    sub.subscriptionEndsAt && 
    new Date(sub.subscriptionEndsAt) > now
  );
  
  return activeSub;
}

// Helper: Check if user's trial has expired (regardless of isOnTrial flag)
function isTrialExpired(user: any): boolean {
  if (!user.trialEndsAt) return false;
  
  // Trial is expired if trialEndsAt is in the past
  return new Date(user.trialEndsAt) < new Date();
}

// Helper: Get user's product limit based on subscription status
async function getUserProductLimit(user: any): Promise<number> {
  // Trial users: 10 products max
  if (user.isOnTrial) {
    return 10;
  }
  
  // Paid users: check subscription plan
  const activeSub = await getUserActiveSubscription(user.id);
  if (activeSub) {
    const plan = await storage.getSubscriptionPlanById(activeSub.planId);
    return plan?.maxProducts || 100; // Default to 100 if plan not found
  }
  
  // Expired trial or no subscription: 0 products (read-only)
  return 0;
}

// Middleware: Block expired trial users and auto-disable trial
async function blockExpiredTrial(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized - please login" });
  }
  
  if (isTrialExpired(req.user)) {
    // Auto-disable trial access
    await storage.updateUser(req.user.id, {
      isOnTrial: 0,
    });
    
    // Update req.user to reflect changes
    req.user.isOnTrial = 0;
    
    return res.status(403).json({ 
      message: "Your trial has expired. Please upgrade to continue using PocketBizz.",
      trialExpired: true 
    });
  }
  
  next();
}

// Middleware: Block trial users from premium features
async function requirePaidSubscription(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized - please login" });
  }
  
  // Block if on trial
  if (req.user.isOnTrial) {
    return res.status(403).json({ 
      message: "This feature requires a paid subscription. Upgrade to unlock.",
      requiresUpgrade: true 
    });
  }
  
  // Verify user has an active paid subscription (not just trial=0)
  const activeSub = await getUserActiveSubscription(req.user.id);
  if (!activeSub) {
    return res.status(403).json({ 
      message: "Your subscription has expired. Please renew to access premium features.",
      requiresUpgrade: true,
      subscriptionExpired: true
    });
  }
  
  next();
}

// Middleware: Require Pro or Premium plan for advanced features
async function requireProPlan(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized - please login" });
  }
  
  // Block if on trial
  if (req.user.isOnTrial) {
    return res.status(403).json({ 
      message: "This premium feature requires a Pro or Premium plan. Upgrade to unlock.",
      requiresUpgrade: true,
      requiredPlan: "pro"
    });
  }
  
  // Verify user has an active subscription
  const activeSub = await getUserActiveSubscription(req.user.id);
  if (!activeSub) {
    return res.status(403).json({ 
      message: "Your subscription has expired. Please renew to access premium features.",
      requiresUpgrade: true,
      subscriptionExpired: true
    });
  }
  
  // Check if plan is Pro or Premium (not Basic)
  const plan = await storage.getSubscriptionPlanById(activeSub.planId);
  if (!plan || (plan.name !== 'pro' && plan.name !== 'premium')) {
    return res.status(403).json({ 
      message: "This premium feature is only available on Pro and Premium plans. Upgrade to unlock.",
      requiresUpgrade: true,
      currentPlan: plan?.name || 'unknown',
      requiredPlan: "pro"
    });
  }
  
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Load user for all requests
  app.use(loadUser);
  
  // ==================== AUTHENTICATION ROUTES ====================
  
  // Register new user
  app.post("/api/auth/register", async (req, res) => {
    try {
      const registerSchema = insertUserSchema.omit({
        isAdmin: true,
        toyyibpayUserCode: true,
      });
      const body = registerSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(body.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(body.password, 10);
      
      // Calculate trial end date (7 days from now)
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 7);
      
      // Create user with auto-activated free trial
      const user = await storage.createUser({
        ...body,
        password: hashedPassword,
        isAdmin: 0, // Explicitly prevent privilege escalation
        isOnTrial: 1, // Auto-activate 7-day trial
        trialEndsAt,
        toyyibpayUserCode: null,
      });
      
      // Track early bird slot (first 100 signups) - atomic slot assignment
      // TODO: For high-concurrency scenarios, consider using a dedicated counter table
      // or retry logic to handle unique constraint violations more gracefully
      try {
        // Atomic INSERT with auto-calculated slot number using MAX + 1
        // Only inserts if slot_number <= 100 (enforced in query)
        await db.execute(sql`
          INSERT INTO early_bird_tracking (user_id, slot_number, email, has_subscribed, signup_date, created_at)
          SELECT 
            ${user.id},
            COALESCE(MAX(slot_number), 0) + 1,
            ${user.email},
            0,
            NOW(),
            NOW()
          FROM early_bird_tracking
          WHERE (SELECT COUNT(*) FROM early_bird_tracking) < 100
          HAVING COALESCE(MAX(slot_number), 0) + 1 <= 100
        `);
      } catch (earlyBirdError: any) {
        // Expected errors: unique constraint violation (race condition) or no rows inserted (slots full)
        // These are safe to ignore - just log for monitoring
        if (!earlyBirdError.message?.includes('unique') && !earlyBirdError.message?.includes('UNIQUE')) {
          console.error("Early bird tracking error:", earlyBirdError);
        }
      }
      
      // Set session
      req.session.userId = user.id;
      
      // Return user without password
      const { password, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Registration failed" });
    }
  });
  
  // Login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const loginSchema = z.object({
        email: z.string().email(),
        password: z.string().min(1),
      });
      const { email, password } = loginSchema.parse(req.body);
      
      // Find user
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      
      // Verify password
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      
      // Set session
      req.session.userId = user.id;
      
      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Login failed" });
    }
  });
  
  // Logout
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });
  
  // Get current user
  app.get("/api/auth/me", (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const { password, ...userWithoutPassword } = req.user;
    res.json({ user: userWithoutPassword });
  });
  
  // Get current user's early bird status
  app.get("/api/auth/early-bird-status", requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      
      const earlyBirdSlot = await db.query.earlyBirdTracking.findFirst({
        where: (tracking, { eq }) => eq(tracking.userId, user.id),
      });
      
      res.json({
        hasSlot: !!earlyBirdSlot,
        slotNumber: earlyBirdSlot?.slotNumber || null,
        hasSubscribed: earlyBirdSlot?.hasSubscribed === 1,
      });
    } catch (error: any) {
      console.error("Early bird status error:", error);
      res.status(500).json({ message: "Failed to get early bird status" });
    }
  });
  
  // ==================== SUBSCRIPTION PLANS ====================
  
  // Get all active subscription plans
  app.get("/api/subscription-plans", async (req, res) => {
    try {
      const plans = await storage.getSubscriptionPlans();
      res.json(plans);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch plans" });
    }
  });
  
  // Get single subscription plan
  app.get("/api/subscription-plans/:id", async (req, res) => {
    try {
      const plan = await storage.getSubscriptionPlan(req.params.id);
      if (!plan) {
        return res.status(404).json({ message: "Plan not found" });
      }
      res.json(plan);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch plan" });
    }
  });
  
  // Create subscription plan (admin only)
  app.post("/api/subscription-plans", requireAuth, async (req, res) => {
    try {
      // Check admin permission
      if (req.user?.isAdmin !== 1) {
        return res.status(403).json({ message: "Forbidden - admin access required" });
      }
      
      const body = insertSubscriptionPlanSchema.parse(req.body);
      const plan = await storage.createSubscriptionPlan(body);
      res.json(plan);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create plan" });
    }
  });
  
  // Update subscription plan (admin only)
  app.patch("/api/subscription-plans/:id", requireAuth, async (req, res) => {
    try {
      // Check admin permission
      if (req.user?.isAdmin !== 1) {
        return res.status(403).json({ message: "Forbidden - admin access required" });
      }
      
      // Validate request body
      const updateSchema = insertSubscriptionPlanSchema.partial();
      const body = updateSchema.parse(req.body);
      
      const plan = await storage.updateSubscriptionPlan(req.params.id, body);
      if (!plan) {
        return res.status(404).json({ message: "Plan not found" });
      }
      res.json(plan);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to update plan" });
    }
  });
  
  // Delete subscription plan (admin only)
  app.delete("/api/subscription-plans/:id", requireAuth, async (req, res) => {
    try {
      // Check admin permission
      if (req.user?.isAdmin !== 1) {
        return res.status(403).json({ message: "Forbidden - admin access required" });
      }
      
      // Check if plan exists before deleting
      const plan = await storage.getSubscriptionPlan(req.params.id);
      if (!plan) {
        return res.status(404).json({ message: "Plan not found" });
      }
      
      await storage.deleteSubscriptionPlan(req.params.id);
      res.json({ message: "Plan deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to delete plan" });
    }
  });
  
  // Get early bird stats (slots remaining)
  app.get("/api/early-bird/stats", async (req, res) => {
    try {
      const result = await db
        .select({ count: sql<number>`count(*)` })
        .from(earlyBirdTracking);
      
      const slotsUsed = Number(result[0]?.count || 0);
      const slotsRemaining = Math.max(0, 100 - slotsUsed);
      const isAvailable = slotsRemaining > 0;
      
      res.json({
        slotsUsed,
        slotsRemaining,
        totalSlots: 100,
        isAvailable,
        discountPercent: 70,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch early bird stats" });
    }
  });
  
  // ==================== TOYYIBPAY / SUBSCRIPTION ROUTES ====================
  
  // Create ToyyibPay bill for subscription payment
  app.post("/api/subscription/create-bill", requireAuth, async (req, res) => {
    try {
      const schema = z.object({
        planId: z.string(),
        durationMonths: z.number().refine(val => [3, 6, 12].includes(val), {
          message: "Duration must be 3, 6, or 12 months"
        }),
        promoCode: z.string().optional(),
      });
      
      const { planId, durationMonths, promoCode } = schema.parse(req.body);
      
      // Get subscription plan
      const plan = await storage.getSubscriptionPlanById(planId);
      if (!plan) {
        return res.status(404).json({ message: "Subscription plan not found" });
      }
      
      // Calculate base price for duration
      const monthlyPrice = parseFloat(plan.monthlyPrice);
      let totalPrice = monthlyPrice * durationMonths;
      
      // Apply duration discount
      if (durationMonths === 6) {
        const discount = parseFloat(plan.discount6Months || "10");
        totalPrice = totalPrice * (1 - discount / 100);
      } else if (durationMonths === 12) {
        const discount = parseFloat(plan.discount12Months || "20");
        totalPrice = totalPrice * (1 - discount / 100);
      }
      
      // Check if user has early bird slot (auto-apply 70% discount for first 100 signups)
      let hasEarlyBird = false;
      try {
        const earlyBirdSlot = await db.query.earlyBirdTracking.findFirst({
          where: (tracking, { eq }) => eq(tracking.userId, user.id),
        });
        
        // Auto-apply 70% early bird discount if user has a slot and hasn't subscribed yet
        if (earlyBirdSlot && !earlyBirdSlot.hasSubscribed) {
          totalPrice = totalPrice * (1 - 70 / 100);
          hasEarlyBird = true;
        }
      } catch (earlyBirdError) {
        console.error("Error checking early bird status:", earlyBirdError);
      }
      
      // Apply promo code if provided
      let appliedPromo = null;
      if (promoCode) {
        const promo = await storage.getPromoCodeByCode(promoCode);
        if (promo && promo.isActive) {
          // Check if user already used this promo
          const hasUsed = await storage.hasUserUsedPromoCode(user.id, promo.id);
          if (!hasUsed) {
            // Check usage limit
            const usageCount = await storage.getPromoCodeUsageCount(promo.id);
            if (usageCount < (promo.maxUses || Infinity)) {
              // Check expiry
              if (!promo.expiresAt || new Date(promo.expiresAt) > new Date()) {
                // Apply discount
                if (promo.discountType === 'percentage') {
                  totalPrice = totalPrice * (1 - parseFloat(promo.discountValue) / 100);
                } else {
                  totalPrice = totalPrice - parseFloat(promo.discountValue);
                }
                appliedPromo = promo;
              }
            }
          }
        }
      }
      
      // Ensure minimum price
      totalPrice = Math.max(totalPrice, 1);
      
      // Type assertion for req.user (requireAuth ensures it exists)
      const user = req.user!;
      
      // Generate unique order reference
      const orderRef = `SUB-${user.id.slice(0, 8)}-${Date.now()}`;
      
      // Import ToyyibPay helper
      const { createBill, getBillUrl, rmToCents } = await import('./toyyibpay');
      
      // Create bill
      const billParams = {
        billName: `${plan.displayName} - ${durationMonths} months`,
        billDescription: `PocketBizz ${plan.displayName} subscription for ${durationMonths} months`,
        billAmount: rmToCents(totalPrice),
        billTo: user.name,
        billEmail: user.email,
        billPhone: user.phone || '0000000000',
        billExternalReferenceNo: orderRef,
        billReturnUrl: `${process.env.REPLIT_DEV_DOMAIN || 'http://localhost:5000'}/payment/callback`,
        billCallbackUrl: `${process.env.REPLIT_DEV_DOMAIN || 'http://localhost:5000'}/api/subscription/webhook`,
        billExpiryDays: 7, // Bill expires in 7 days
      };
      
      const billResponse = await createBill(billParams);
      
      if (!billResponse.BillCode) {
        return res.status(500).json({ message: "Failed to create payment bill" });
      }
      
      // Calculate total discount amount for metadata
      const discountAmount = (monthlyPrice * durationMonths) - totalPrice;
      
      // Store bill metadata in pending_bills table for webhook processing
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 7); // Bill expires in 7 days
      
      await storage.createPendingBill({
        userId: user.id,
        billCode: billResponse.BillCode,
        orderRef,
        planId: plan.id,
        planName: plan.displayName,
        durationMonths,
        totalAmount: totalPrice.toString(),
        promoCodeId: appliedPromo?.id,
        promoCode: appliedPromo?.code,
        discountApplied: discountAmount.toString(),
        expiresAt: expiryDate,
      });
      
      res.json({
        billCode: billResponse.BillCode,
        billUrl: getBillUrl(billResponse.BillCode),
        orderRef,
        totalAmount: totalPrice,
        planName: plan.displayName,
        durationMonths,
        hasEarlyBird,
        earlyBirdDiscount: hasEarlyBird ? 70 : 0,
        promoApplied: appliedPromo ? {
          code: appliedPromo.code,
          discountType: appliedPromo.discountType,
          discountValue: appliedPromo.discountValue,
        } : null,
      });
    } catch (error: any) {
      console.error("Create bill error:", error);
      res.status(400).json({ message: error.message || "Failed to create payment bill" });
    }
  });
  
  // Create renewal bill for existing subscription
  app.post("/api/subscription/renew", requireAuth, async (req, res) => {
    try {
      const schema = z.object({
        subscriptionId: z.string().optional(), // If not provided, use active subscription
        durationMonths: z.number().refine(val => [3, 6, 12].includes(val), {
          message: "Duration must be 3, 6, or 12 months"
        }),
        promoCode: z.string().optional(),
      });
      
      const { subscriptionId, durationMonths, promoCode } = schema.parse(req.body);
      const user = req.user!;
      
      // Get subscription to renew
      let subscriptionToRenew;
      if (subscriptionId) {
        subscriptionToRenew = await storage.getUserSubscriptionById(subscriptionId);
        if (!subscriptionToRenew || subscriptionToRenew.userId !== user.id) {
          return res.status(404).json({ message: "Subscription not found" });
        }
      } else {
        // Try to get active subscription first
        subscriptionToRenew = await getUserActiveSubscription(user.id);
        
        // If no active subscription, get most recent subscription (even if expired)
        if (!subscriptionToRenew) {
          const allSubscriptions = await storage.getUserSubscriptions(user.id);
          if (allSubscriptions.length > 0) {
            // Get the most recent subscription
            subscriptionToRenew = allSubscriptions[allSubscriptions.length - 1];
          }
        }
        
        if (!subscriptionToRenew) {
          return res.status(404).json({ message: "No subscription found to renew" });
        }
      }
      
      // Get subscription plan
      const plan = await storage.getSubscriptionPlanById(subscriptionToRenew.planId);
      if (!plan) {
        return res.status(404).json({ message: "Subscription plan not found" });
      }
      
      // Calculate base price for duration
      const monthlyPrice = parseFloat(plan.monthlyPrice);
      let totalPrice = monthlyPrice * durationMonths;
      
      // Apply duration discount
      if (durationMonths === 6) {
        const discount = parseFloat(plan.discount6Months || "10");
        totalPrice = totalPrice * (1 - discount / 100);
      } else if (durationMonths === 12) {
        const discount = parseFloat(plan.discount12Months || "20");
        totalPrice = totalPrice * (1 - discount / 100);
      }
      
      // Check if user has early bird slot (auto-apply 70% discount for first 100 signups)
      let hasEarlyBird = false;
      try {
        const earlyBirdSlot = await db.query.earlyBirdTracking.findFirst({
          where: (tracking, { eq }) => eq(tracking.userId, user.id),
        });
        
        // Auto-apply 70% early bird discount if user has a slot and hasn't subscribed yet
        if (earlyBirdSlot && !earlyBirdSlot.hasSubscribed) {
          totalPrice = totalPrice * (1 - 70 / 100);
          hasEarlyBird = true;
        }
      } catch (earlyBirdError) {
        console.error("Error checking early bird status:", earlyBirdError);
      }
      
      // Apply promo code if provided
      let appliedPromo = null;
      if (promoCode) {
        const promo = await storage.getPromoCodeByCode(promoCode);
        if (promo && promo.isActive) {
          // Check if user already used this promo
          const hasUsed = await storage.hasUserUsedPromoCode(user.id, promo.id);
          if (!hasUsed) {
            // Check usage limit
            const usageCount = await storage.getPromoCodeUsageCount(promo.id);
            if (usageCount < (promo.maxUses || Infinity)) {
              // Check expiry
              if (!promo.expiresAt || new Date(promo.expiresAt) > new Date()) {
                // Apply discount
                if (promo.discountType === 'percentage') {
                  totalPrice = totalPrice * (1 - parseFloat(promo.discountValue) / 100);
                } else {
                  totalPrice = totalPrice - parseFloat(promo.discountValue);
                }
                appliedPromo = promo;
              }
            }
          }
        }
      }
      
      // Ensure minimum price
      totalPrice = Math.max(totalPrice, 1);
      
      // Generate unique order reference
      const orderRef = `REN-${user.id.slice(0, 8)}-${Date.now()}`;
      
      // Import ToyyibPay helper
      const { createBill, getBillUrl, rmToCents } = await import('./toyyibpay');
      
      // Create bill
      const billParams = {
        billName: `${plan.displayName} Renewal - ${durationMonths} months`,
        billDescription: `PocketBizz ${plan.displayName} subscription renewal for ${durationMonths} months`,
        billAmount: rmToCents(totalPrice),
        billTo: user.name,
        billEmail: user.email,
        billPhone: user.phone || '0000000000',
        billExternalReferenceNo: orderRef,
        billReturnUrl: `${process.env.REPLIT_DEV_DOMAIN || 'http://localhost:5000'}/payment/callback`,
        billCallbackUrl: `${process.env.REPLIT_DEV_DOMAIN || 'http://localhost:5000'}/api/subscription/webhook`,
        billExpiryDays: 7,
      };
      
      const billResponse = await createBill(billParams);
      
      if (!billResponse.BillCode) {
        return res.status(500).json({ message: "Failed to create renewal bill" });
      }
      
      // Calculate total discount amount
      const discountAmount = (monthlyPrice * durationMonths) - totalPrice;
      
      // Store bill metadata with renewal flag
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 7);
      
      await storage.createPendingBill({
        userId: user.id,
        billCode: billResponse.BillCode,
        orderRef,
        planId: plan.id,
        planName: plan.displayName,
        durationMonths,
        totalAmount: totalPrice.toString(),
        promoCodeId: appliedPromo?.id,
        promoCode: appliedPromo?.code,
        discountApplied: discountAmount.toString(),
        expiresAt: expiryDate,
        isRenewal: 1,
        renewalSubscriptionId: subscriptionToRenew.id,
      });
      
      res.json({
        billCode: billResponse.BillCode,
        billUrl: getBillUrl(billResponse.BillCode),
        orderRef,
        totalAmount: totalPrice,
        planName: plan.displayName,
        durationMonths,
        isRenewal: true,
        subscriptionId: subscriptionToRenew.id,
        hasEarlyBird,
        earlyBirdDiscount: hasEarlyBird ? 70 : 0,
        promoApplied: appliedPromo ? {
          code: appliedPromo.code,
          discountType: appliedPromo.discountType,
          discountValue: appliedPromo.discountValue,
        } : null,
      });
    } catch (error: any) {
      console.error("Create renewal bill error:", error);
      res.status(400).json({ message: error.message || "Failed to create renewal bill" });
    }
  });
  
  // Get early bird slots remaining
  app.get("/api/subscription/early-bird-slots", async (req, res) => {
    try {
      const totalSlots = 100;
      const usedSlots = await storage.getEarlyBirdUsedSlots();
      const remaining = Math.max(0, totalSlots - usedSlots);
      
      res.json({
        total: totalSlots,
        used: usedSlots,
        remaining,
      });
    } catch (error: any) {
      console.error("Early bird slots error:", error);
      res.status(500).json({ message: "Failed to get early bird slots" });
    }
  });
  
  // Validate promo code (check expiry, usage limits, user-specific usage)
  app.post("/api/promo-codes/validate", requireAuth, async (req, res) => {
    try {
      const schema = z.object({
        code: z.string(),
      });
      
      const { code } = schema.parse(req.body);
      const userId = req.user!.id;
      
      // Get promo code
      const promo = await storage.getPromoCodeByCode(code);
      
      if (!promo) {
        return res.status(404).json({ 
          valid: false, 
          message: "Kod promo tidak wujud" 
        });
      }
      
      // Check if active
      if (!promo.isActive) {
        return res.status(400).json({ 
          valid: false, 
          message: "Kod promo tidak aktif" 
        });
      }
      
      // Check expiry
      if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) {
        return res.status(400).json({ 
          valid: false, 
          message: "Kod promo telah tamat tempoh" 
        });
      }
      
      // Check global usage limit
      const usageCount = await storage.getPromoCodeUsageCount(promo.id);
      if (promo.maxUses && usageCount >= promo.maxUses) {
        return res.status(400).json({ 
          valid: false, 
          message: "Kod promo telah mencapai had penggunaan" 
        });
      }
      
      // Check if user already used this promo (user-specific check)
      const hasUsed = await storage.hasUserUsedPromoCode(userId, promo.id);
      if (hasUsed) {
        return res.status(400).json({ 
          valid: false, 
          message: "Anda telah menggunakan kod promo ini" 
        });
      }
      
      // Valid promo code!
      res.json({
        valid: true,
        promo: {
          id: promo.id,
          code: promo.code,
          name: promo.name,
          discountType: promo.discountType,
          discountValue: promo.discountValue,
        },
      });
    } catch (error: any) {
      console.error("Promo validation error:", error);
      res.status(500).json({ message: error.message || "Failed to validate promo code" });
    }
  });
  
  // ToyyibPay webhook callback (server-side notification)
  app.get("/api/subscription/webhook", async (req, res) => {
    try {
      const { refno, status, billcode, order_id, amount, reason } = req.query;
      
      console.log('ToyyibPay webhook received:', {
        refno,
        status,
        billcode,
        order_id,
        amount,
        reason,
      });
      
      if (!billcode || !status) {
        return res.status(400).send('Invalid callback parameters');
      }
      
      // Check if already processed to prevent duplicate subscriptions
      const existingBill = await storage.getPendingBillByBillCode(billcode as string);
      if (!existingBill) {
        console.error('No pending bill found for billcode:', billcode);
        return res.status(200).send('OK');
      }
      
      if (existingBill.isProcessed) {
        console.log('Bill already processed:', billcode);
        return res.status(200).send('OK');
      }
      
      // Verify payment with ToyyibPay API
      const { getBillTransactions, centsToRm } = await import('./toyyibpay');
      const transactions = await getBillTransactions(billcode as string, status as string);
      
      if (transactions.length === 0) {
        console.error('No transactions found for billcode:', billcode);
        return res.status(200).send('OK'); // Still acknowledge to prevent retries
      }
      
      const transaction = transactions[0];
      
      // Only process successful payments
      if (transaction.billpaymentStatus === '1' && status === '1') {
        // Create billing history record
        const billingRecord = await db.insert(billingHistory).values({
          userId: existingBill.userId,
          amount: existingBill.totalAmount,
          currency: 'MYR',
          status: 'succeeded',
          toyyibpayBillCode: billcode as string,
          toyyibpayTransactionId: refno as string,
          paymentMethod: transaction.billpaymentChannel,
          description: existingBill.isRenewal 
            ? `${existingBill.planName} - ${existingBill.durationMonths} months renewal`
            : `${existingBill.planName} - ${existingBill.durationMonths} months subscription`,
          paidAt: new Date(),
        }).returning();
        
        let subscriptionId: string;
        
        // Handle renewal vs new subscription
        if (existingBill.isRenewal && existingBill.renewalSubscriptionId) {
          // RENEWAL: Extend existing subscription
          const existingSubscription = await storage.getUserSubscriptionById(existingBill.renewalSubscriptionId);
          if (existingSubscription) {
            // Calculate new end date from current end date (or now if expired)
            const currentEndDate = new Date(existingSubscription.subscriptionEndsAt || new Date());
            const now = new Date();
            const extensionStartDate = currentEndDate > now ? currentEndDate : now;
            
            const newEndDate = new Date(extensionStartDate);
            newEndDate.setMonth(newEndDate.getMonth() + existingBill.durationMonths);
            
            // Update subscription: extend end date, set status to active if expired
            await storage.updateUserSubscription(existingBill.renewalSubscriptionId, {
              subscriptionEndsAt: newEndDate,
              status: 'active',
              totalPaid: (parseFloat(existingSubscription.totalPaid) + parseFloat(existingBill.totalAmount)).toString(),
            });
            
            subscriptionId = existingBill.renewalSubscriptionId;
            
            console.log('Subscription renewed successfully:', {
              userId: existingBill.userId,
              subscriptionId,
              planName: existingBill.planName,
              durationMonths: existingBill.durationMonths,
              newEndDate,
              amount: existingBill.totalAmount,
            });
          }
        } else {
          // NEW SUBSCRIPTION: Create subscription
          const startDate = new Date();
          const endDate = new Date();
          endDate.setMonth(endDate.getMonth() + existingBill.durationMonths);
          
          const newSubscription = await storage.createUserSubscription({
            userId: existingBill.userId,
            planId: existingBill.planId,
            planName: existingBill.planName,
            status: 'active',
            durationMonths: existingBill.durationMonths,
            subscriptionStartsAt: startDate,
            subscriptionEndsAt: endDate,
            totalPaid: existingBill.totalAmount,
            toyyibpayBillCode: billcode as string,
            paymentMethod: transaction.billpaymentChannel,
          });
          
          subscriptionId = newSubscription.id;
          
          // Update user: turn off trial
          await storage.updateUser(existingBill.userId, {
            isOnTrial: 0,
            trialEndsAt: null,
          });
          
          // Update early bird tracking if applicable
          if (existingBill.promoCode?.toUpperCase().includes('EARLYBIRD')) {
            await db.update(earlyBirdTracking)
              .set({ 
                hasSubscribed: 1,
                subscriptionId: newSubscription.id,
              })
              .where(eq(earlyBirdTracking.userId, existingBill.userId));
          }
          
          console.log('Subscription activated successfully:', {
            userId: existingBill.userId,
            subscriptionId: newSubscription.id,
            planName: existingBill.planName,
            durationMonths: existingBill.durationMonths,
            amount: existingBill.totalAmount,
          });
        }
        
        // Increment promo code usage if applicable
        if (existingBill.promoCodeId) {
          await storage.incrementPromoCodeUsage(existingBill.promoCodeId);
          // Track user-specific usage to prevent duplicate usage
          await storage.trackPromoCodeUsage(existingBill.userId, existingBill.promoCodeId);
        }
        
        // Mark bill as processed
        await storage.markBillAsProcessed(billcode as string);
      } else {
        // Payment failed - create failed billing record
        await db.insert(billingHistory).values({
          userId: existingBill.userId,
          amount: existingBill.totalAmount,
          currency: 'MYR',
          status: 'failed',
          toyyibpayBillCode: billcode as string,
          toyyibpayTransactionId: refno as string,
          description: `${existingBill.planName} - ${existingBill.durationMonths} months subscription (failed)`,
        }).returning();
        
        console.log('Payment failed:', {
          billcode,
          status,
          reason,
        });
      }
      
      // Always return 200 OK to acknowledge webhook
      res.status(200).send('OK');
    } catch (error: any) {
      console.error('Webhook processing error:', error);
      res.status(200).send('OK'); // Acknowledge even on error to prevent retries
    }
  });
  
  // Global Search - Search across all entities
  app.get("/api/search", async (req, res) => {
    try {
      const query = (req.query.q as string || '').toLowerCase().trim();
      
      if (!query || query.length < 2) {
        return res.json({ results: [] });
      }

      const [products, vendors, stockItems, sales, deliveriesResult] = await Promise.all([
        storage.getProducts(),
        storage.getVendors(),
        storage.getStockItems(),
        storage.getSales(),
        storage.getDeliveries(1000, 0), // Get all for search (up to 1000)
      ]);
      
      const deliveries = deliveriesResult.data;

      const results = [];

      // Search Products
      products.forEach(product => {
        if (product.name.toLowerCase().includes(query) || 
            product.category.toLowerCase().includes(query)) {
          results.push({
            id: product.id,
            type: 'product',
            title: product.name,
            subtitle: `${product.category} • RM${product.sellingPrice}`,
            url: '/products',
            icon: 'Cake',
          });
        }
      });

      // Search Vendors
      vendors.forEach(vendor => {
        if (vendor.name.toLowerCase().includes(query) ||
            (vendor.contactPerson && vendor.contactPerson.toLowerCase().includes(query))) {
          results.push({
            id: vendor.id,
            type: 'vendor',
            title: vendor.name,
            subtitle: vendor.contactPerson || vendor.phoneNumber || '',
            url: '/vendors',
            icon: 'Store',
          });
        }
      });

      // Search Stock Items
      stockItems.forEach(item => {
        if (item.name.toLowerCase().includes(query)) {
          results.push({
            id: item.id,
            type: 'stock',
            title: item.name,
            subtitle: `${item.currentQuantity} ${item.unit} • RM${item.purchasePrice}`,
            url: '/stock',
            icon: 'Package',
          });
        }
      });

      // Search Sales (by product name or vendor name)
      sales.forEach(sale => {
        if (sale.productName.toLowerCase().includes(query) ||
            (sale.vendorName && sale.vendorName.toLowerCase().includes(query))) {
          results.push({
            id: sale.id,
            type: 'sale',
            title: `Jualan: ${sale.productName}`,
            subtitle: `${sale.vendorName || 'Tunai'} • RM${sale.totalAmount}`,
            url: '/sales',
            icon: 'DollarSign',
          });
        }
      });

      // Search Deliveries (by vendor name)
      deliveries.forEach(delivery => {
        if (delivery.vendorName.toLowerCase().includes(query)) {
          results.push({
            id: delivery.id,
            type: 'delivery',
            title: `Hantar: ${delivery.vendorName}`,
            subtitle: `RM${delivery.totalAmount} • ${delivery.status}`,
            url: '/deliveries',
            icon: 'Truck',
          });
        }
      });

      // Limit to top 20 results
      res.json({ results: results.slice(0, 20) });
    } catch (error) {
      console.error('Search error:', error);
      res.status(500).json({ error: "Failed to search" });
    }
  });
  
  // Products
  app.get("/api/products", async (req, res) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  app.post("/api/products", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      // Check product limit for trial users
      if (req.user) {
        const currentProducts = await storage.getProducts();
        const userProductCount = currentProducts.length;
        const productLimit = await getUserProductLimit(req.user);
        
        if (productLimit > 0 && userProductCount >= productLimit) {
          return res.status(403).json({ 
            message: req.user.isOnTrial 
              ? `Trial users are limited to ${productLimit} products. Upgrade to add more!`
              : `Your plan allows up to ${productLimit} products. Upgrade to add more!`,
            requiresUpgrade: true,
            currentCount: userProductCount,
            limit: productLimit
          });
        }
      }
      
      const productSchema = insertProductSchema.extend({
        unitsPerBatch: z.string(),
        labourCost: z.string(),
        otherCosts: z.string(),
        sellingPrice: z.string(),
        recipeItems: z.array(z.object({
          stockItemId: z.string(),
          quantityNeeded: z.string(),
          usageUnit: z.string(), // Unit used in recipe (e.g., "gram")
        })),
      }).omit({
        materialsCost: true,
        totalCostPerBatch: true,
        costPerUnit: true,
      });
      
      const data = productSchema.parse(req.body);
      const { recipeItems, ...productData } = data;
      
      // Calculate materials cost from recipe items WITH UNIT CONVERSION
      let materialsCost = 0;
      const recipeItemsWithCost = [];
      
      for (const item of recipeItems) {
        const stockItem = await storage.getStockItem(item.stockItemId);
        if (stockItem) {
          const recipeQuantity = parseFloat(item.quantityNeeded) || 0;
          const usageUnit = item.usageUnit || stockItem.unit; // Default to stock unit if not provided
          
          // Convert recipe quantity to stock's purchase unit for accurate pricing
          // Example: Recipe uses 500 gram, stock purchased in kg -> convert 500g to 0.5kg
          const convertedQuantity = convertUnit(recipeQuantity, usageUnit, stockItem.unit);
          
          // Calculate unit price from package price
          // Example: RM21.90 for 500gram package -> RM21.90 / 500 = RM0.0438 per gram
          const packagePrice = parseFloat(stockItem.purchasePrice) || 0;
          const packageSize = parseFloat(stockItem.packageSize) || 1;
          const unitPrice = packagePrice / packageSize;
          
          const cost = convertedQuantity * unitPrice;
          materialsCost += cost;
          
          recipeItemsWithCost.push({
            stockItemId: item.stockItemId,
            quantityNeeded: recipeQuantity.toFixed(2),
            usageUnit: usageUnit,
            costPerRecipe: cost.toFixed(2),
            productId: "", // Will be set in storage
          });
        }
      }
      
      // Calculate total cost per batch
      const labourCost = parseFloat(productData.labourCost) || 0;
      const otherCosts = parseFloat(productData.otherCosts) || 0;
      const totalCostPerBatch = materialsCost + labourCost + otherCosts;
      
      // Calculate cost per unit
      const unitsPerBatch = parseInt(productData.unitsPerBatch) || 1;
      const costPerUnit = unitsPerBatch > 0 ? totalCostPerBatch / unitsPerBatch : 0;
      
      const product = await storage.createProduct(
        {
          ...productData,
          unitsPerBatch: unitsPerBatch,
          labourCost: labourCost.toFixed(2),
          otherCosts: otherCosts.toFixed(2),
          materialsCost: materialsCost.toFixed(2),
          totalCostPerBatch: totalCostPerBatch.toFixed(2),
          costPerUnit: costPerUnit.toFixed(2),
        },
        recipeItemsWithCost
      );
      
      res.json(product);
    } catch (error) {
      console.error("Product creation error:", error);
      res.status(400).json({ error: "Invalid product data" });
    }
  });

  app.put("/api/products/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const productSchema = insertProductSchema.extend({
        unitsPerBatch: z.string(),
        labourCost: z.string(),
        otherCosts: z.string(),
        sellingPrice: z.string(),
        recipeItems: z.array(z.object({
          stockItemId: z.string(),
          quantityNeeded: z.string(),
          usageUnit: z.string(), // Unit used in recipe
        })),
      }).omit({
        materialsCost: true,
        totalCostPerBatch: true,
        costPerUnit: true,
      }).partial();
      
      const data = productSchema.parse(req.body);
      const { recipeItems, ...productData } = data;
      
      // Calculate materials cost from recipe items WITH UNIT CONVERSION if provided
      let materialsCost = 0;
      let recipeItemsWithCost: any[] = [];
      
      if (recipeItems && recipeItems.length > 0) {
        for (const item of recipeItems) {
          const stockItem = await storage.getStockItem(item.stockItemId);
          if (stockItem) {
            const recipeQuantity = parseFloat(item.quantityNeeded) || 0;
            const usageUnit = item.usageUnit || stockItem.unit;
            
            // Convert recipe quantity to stock's purchase unit
            const convertedQuantity = convertUnit(recipeQuantity, usageUnit, stockItem.unit);
            
            // Calculate unit price from package price
            // Example: RM21.90 for 500gram package -> RM21.90 / 500 = RM0.0438 per gram
            const packagePrice = parseFloat(stockItem.purchasePrice) || 0;
            const packageSize = parseFloat(stockItem.packageSize) || 1;
            const unitPrice = packagePrice / packageSize;
            
            const cost = convertedQuantity * unitPrice;
            materialsCost += cost;
            
            recipeItemsWithCost.push({
              stockItemId: item.stockItemId,
              quantityNeeded: recipeQuantity.toFixed(2),
              usageUnit: usageUnit,
              costPerRecipe: cost.toFixed(2),
              productId: id,
            });
          }
        }
        
        // Calculate total cost per batch
        const labourCost = parseFloat(productData.labourCost as string) || 0;
        const otherCosts = parseFloat(productData.otherCosts as string) || 0;
        const totalCostPerBatch = materialsCost + labourCost + otherCosts;
        
        // Calculate cost per unit
        const unitsPerBatch = parseInt(productData.unitsPerBatch as string) || 1;
        const costPerUnit = unitsPerBatch > 0 ? totalCostPerBatch / unitsPerBatch : 0;
        
        const updateData: any = {
          ...productData,
          unitsPerBatch: unitsPerBatch,
          labourCost: labourCost.toFixed(2),
          otherCosts: otherCosts.toFixed(2),
          materialsCost: materialsCost.toFixed(2),
          totalCostPerBatch: totalCostPerBatch.toFixed(2),
          costPerUnit: costPerUnit.toFixed(2),
        };
        
        const product = await storage.updateProduct(
          id,
          updateData,
          recipeItemsWithCost.length > 0 ? recipeItemsWithCost : undefined
        );
        
        res.json(product);
      } else {
        // No recipe items update, just update product data
        const updateData: any = { ...productData };
        if (productData.unitsPerBatch) {
          updateData.unitsPerBatch = parseInt(productData.unitsPerBatch as string);
        }
        
        const product = await storage.updateProduct(id, updateData, undefined);
        res.json(product);
      }
    } catch (error) {
      console.error("Product update error:", error);
      res.status(400).json({ error: "Invalid product data" });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteProduct(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Product deletion error:", error);
      res.status(500).json({ error: "Failed to delete product" });
    }
  });

  app.get("/api/recipe-items/:productId", async (req, res) => {
    try {
      const { productId } = req.params;
      const items = await storage.getRecipeItems(productId);
      res.json(items);
    } catch (error) {
      console.error("Recipe items fetch error:", error);
      res.status(500).json({ error: "Failed to fetch recipe items" });
    }
  });

  // Production
  app.get("/api/production", async (req, res) => {
    try {
      const batches = await storage.getProductionBatches();
      res.json(batches);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch production batches" });
    }
  });

  app.post("/api/production", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const data = insertProductionBatchSchema.parse(req.body);
      const batch = await storage.createProductionBatch(data);
      res.json(batch);
    } catch (error) {
      res.status(400).json({ error: "Invalid batch data" });
    }
  });

  // Production Planning - Preview materials needed and check stock
  app.post("/api/production/plan-preview", async (req, res) => {
    try {
      const { productId, quantity } = req.body;
      
      if (!productId || !quantity) {
        return res.status(400).json({ error: "Product ID and quantity are required" });
      }

      // Get product details
      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      // Get recipe items for this product
      const recipeItems = await storage.getRecipeItems(productId);
      if (recipeItems.length === 0) {
        return res.status(400).json({ error: "No recipe found for this product" });
      }

      // Calculate materials needed based on quantity
      const materialsNeeded = [];
      let allStockSufficient = true;

      for (const item of recipeItems) {
        const stockItem = await storage.getStockItem(item.stockItemId);
        if (!stockItem) continue;

        // Calculate quantity needed for production
        const quantityNeeded = parseFloat(item.quantityNeeded) * quantity;
        
        // Convert to stock item's unit for comparison
        const { convertUnit } = await import("@shared/schema");
        const convertedQuantity = convertUnit(
          quantityNeeded, 
          item.usageUnit.toLowerCase(), 
          stockItem.unit.toLowerCase()
        );

        const currentStock = parseFloat(stockItem.currentQuantity);
        const isSufficient = currentStock >= convertedQuantity;
        const shortage = isSufficient ? 0 : convertedQuantity - currentStock;

        if (!isSufficient) {
          allStockSufficient = false;
        }

        materialsNeeded.push({
          stockItemId: item.stockItemId,
          stockItemName: stockItem.name,
          quantityNeeded: quantityNeeded,
          usageUnit: item.usageUnit,
          currentStock: currentStock,
          stockUnit: stockItem.unit,
          isSufficient,
          shortage: shortage,
          convertedQuantity: convertedQuantity
        });
      }

      res.json({
        product: {
          id: product.id,
          name: product.name,
          unitsPerBatch: product.unitsPerBatch,
          totalCostPerBatch: product.totalCostPerBatch
        },
        quantity,
        materialsNeeded,
        allStockSufficient,
        totalProductionCost: parseFloat(product.totalCostPerBatch) * quantity
      });
    } catch (error) {
      console.error("Production plan preview error:", error);
      res.status(500).json({ error: "Failed to generate production plan" });
    }
  });

  // Production Planning - Confirm production and deduct stock
  app.post("/api/production/confirm", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const { productId, quantity, batchDate, expiryDate, notes, materialsNeeded } = req.body;

      if (!productId || !quantity || !batchDate) {
        return res.status(400).json({ error: "Product ID, quantity, and batch date are required" });
      }

      // Get product details
      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      // Verify stock availability again before deduction
      const recipeItems = await storage.getRecipeItems(productId);
      const { convertUnit } = await import("@shared/schema");

      for (const item of recipeItems) {
        const stockItem = await storage.getStockItem(item.stockItemId);
        if (!stockItem) {
          return res.status(400).json({ error: `Stock item not found: ${item.stockItemId}` });
        }

        const quantityNeeded = parseFloat(item.quantityNeeded) * quantity;
        const convertedQuantity = convertUnit(
          quantityNeeded,
          item.usageUnit.toLowerCase(),
          stockItem.unit.toLowerCase()
        );

        const currentStock = parseFloat(stockItem.currentQuantity);
        if (currentStock < convertedQuantity) {
          return res.status(400).json({ 
            error: `Insufficient stock for ${stockItem.name}. Required: ${convertedQuantity} ${stockItem.unit}, Available: ${currentStock} ${stockItem.unit}` 
          });
        }
      }

      // Create production batch
      const batchData = {
        productId,
        productName: product.name,
        quantity,
        remainingQty: quantity.toString(), // Initialize with full quantity as finished goods
        batchDate,
        expiryDate: expiryDate || null,
        totalCost: (parseFloat(product.totalCostPerBatch) * quantity).toString(),
        notes: notes || null
      };

      const batch = await storage.createProductionBatch(batchData);

      // Deduct stock for each material
      for (const item of recipeItems) {
        const stockItem = await storage.getStockItem(item.stockItemId);
        if (!stockItem) continue;

        const quantityNeeded = parseFloat(item.quantityNeeded) * quantity;
        const convertedQuantity = convertUnit(
          quantityNeeded,
          item.usageUnit.toLowerCase(),
          stockItem.unit.toLowerCase()
        );

        const newQuantity = parseFloat(stockItem.currentQuantity) - convertedQuantity;

        await storage.updateStockItem(item.stockItemId, {
          currentQuantity: newQuantity.toString()
        });
      }

      res.json({ 
        success: true, 
        batch,
        message: "Production batch created and stock deducted successfully"
      });
    } catch (error) {
      console.error("Production confirmation error:", error);
      res.status(500).json({ error: "Failed to confirm production" });
    }
  });

  // Finished Products (Finished Goods Inventory)
  app.get("/api/finished-products", async (req, res) => {
    try {
      const summary = await storage.getFinishedProductsSummary();
      res.json(summary);
    } catch (error) {
      console.error("Finished products summary error:", error);
      res.status(500).json({ error: "Failed to fetch finished products summary" });
    }
  });

  // Get low finished products (total quantity < 10)
  app.get("/api/finished-products/low", async (req, res) => {
    try {
      const summary = await storage.getFinishedProductsSummary();
      // Filter products with low total quantity (< 10 units)
      const lowProducts = summary.filter((product: any) => {
        const totalQty = parseFloat(product.totalQuantity || "0");
        return totalQty > 0 && totalQty < 10;
      });
      res.json(lowProducts);
    } catch (error) {
      console.error("Low finished products error:", error);
      res.status(500).json({ error: "Failed to fetch low finished products" });
    }
  });

  app.get("/api/finished-products/:productId/batches", async (req, res) => {
    try {
      const { productId } = req.params;
      const batches = await storage.getBatchesByProduct(productId);
      res.json(batches);
    } catch (error) {
      console.error("Batches by product error:", error);
      res.status(500).json({ error: "Failed to fetch batches" });
    }
  });

  // Preview batch deduction (FIFO simulation without actual deduction)
  app.post("/api/batches/preview", async (req, res) => {
    try {
      const { productId, quantity } = req.body;
      
      if (!productId || !quantity) {
        return res.status(400).json({ error: "Product ID and quantity are required" });
      }
      
      const preview = await storage.previewBatchDeduction(productId, parseFloat(quantity));
      res.json(preview);
    } catch (error) {
      console.error("Batch preview error:", error);
      res.status(500).json({ error: "Failed to preview batch deduction" });
    }
  });

  // Vendors
  app.get("/api/vendors", async (req, res) => {
    try {
      const vendors = await storage.getVendors();
      res.json(vendors);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch vendors" });
    }
  });

  app.post("/api/vendors", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const data = insertVendorSchema.parse(req.body);
      const vendor = await storage.createVendor(data);
      res.json(vendor);
    } catch (error) {
      res.status(400).json({ error: "Invalid vendor data" });
    }
  });

  // Vendor Commissions
  app.get("/api/vendors/:vendorId/commission", requireProPlan, async (req, res) => {
    try {
      const { vendorId } = req.params;
      const commission = await storage.getVendorCommission(vendorId);
      res.json(commission || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch vendor commission" });
    }
  });

  app.post("/api/vendors/:vendorId/commission", requireProPlan, async (req, res) => {
    try {
      const { vendorId } = req.params;
      
      // Validate commission data
      const commissionSchema = z.object({
        commissionType: z.enum(['fixed_range', 'percentage']),
        percentage: z.string().nullable().optional().transform(val => {
          if (val === null || val === undefined) return null;
          const num = parseFloat(val);
          if (isNaN(num) || num < 0 || num > 100) {
            throw new Error('Percentage must be between 0 and 100');
          }
          return val;
        }),
        ranges: z.string().nullable().optional().transform(val => {
          if (val === null || val === undefined) return null;
          try {
            const parsed = JSON.parse(val);
            if (!Array.isArray(parsed)) throw new Error('Ranges must be an array');
            
            // Validate each range
            for (const range of parsed) {
              const min = parseFloat(range.min);
              const max = parseFloat(range.max);
              const amount = parseFloat(range.amount);
              
              if (isNaN(min) || isNaN(max) || isNaN(amount)) {
                throw new Error('Range values must be numeric');
              }
              if (min < 0 || max < 0 || amount < 0) {
                throw new Error('Range values must be non-negative');
              }
              if (min >= max) {
                throw new Error('Range min must be less than max');
              }
            }
            
            return val;
          } catch (e: any) {
            throw new Error(`Invalid ranges: ${e.message}`);
          }
        }),
      });
      
      const validatedData = commissionSchema.parse(req.body);
      
      const data = {
        ...validatedData,
        vendorId,
      };
      
      const commission = await storage.createOrUpdateVendorCommission(data);
      res.json(commission);
    } catch (error: any) {
      console.error("Commission update error:", error);
      res.status(400).json({ error: "Invalid commission data", message: error.message });
    }
  });

  app.delete("/api/vendors/:vendorId/commission", requireProPlan, async (req, res) => {
    try {
      const { vendorId } = req.params;
      await storage.deleteVendorCommission(vendorId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete commission" });
    }
  });

  // Stock Items (Warehouse Inventory)
  app.get("/api/stock", async (req, res) => {
    try {
      const items = await storage.getStockItems();
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stock items" });
    }
  });

  app.get("/api/stock/low", async (req, res) => {
    try {
      const items = await storage.getLowStockItems();
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch low stock items" });
    }
  });

  app.get("/api/stock/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const item = await storage.getStockItem(id);
      if (!item) {
        return res.status(404).json({ error: "Stock item not found" });
      }
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stock item" });
    }
  });

  app.post("/api/stock", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const data = insertStockItemSchema.parse(req.body);
      const item = await storage.createStockItem(data);
      res.json(item);
    } catch (error: any) {
      res.status(400).json({ error: "Invalid stock item data", message: error.message });
    }
  });

  app.patch("/api/stock/:id", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const { id } = req.params;
      const data = insertStockItemSchema.partial().parse(req.body);
      const item = await storage.updateStockItem(id, data);
      res.json(item);
    } catch (error: any) {
      res.status(400).json({ error: "Invalid stock item data", message: error.message });
    }
  });

  // Replenish stock - add additional quantity to existing stock
  app.post("/api/stock/:id/replenish", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const { id } = req.params;
      const replenishSchema = z.object({
        additionalQuantity: z.string()
          .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
            message: "Additional quantity must be a positive number",
          }),
        newPurchasePrice: z.string()
          .optional()
          .refine((val) => !val || (!isNaN(parseFloat(val)) && parseFloat(val) > 0), {
            message: "Purchase price must be a positive number",
          }),
        newPackageSize: z.string()
          .optional()
          .refine((val) => !val || (!isNaN(parseFloat(val)) && parseFloat(val) > 0), {
            message: "Package size must be a positive number",
          }),
      });
      
      const validationResult = replenishSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "Invalid input", 
          details: validationResult.error.errors 
        });
      }

      const { additionalQuantity, newPurchasePrice, newPackageSize } = validationResult.data;

      // Get current stock item
      const currentItem = await storage.getStockItem(id);
      if (!currentItem) {
        return res.status(404).json({ error: "Stock item not found" });
      }

      // Calculate new quantity
      const currentQty = parseFloat(currentItem.currentQuantity);
      const additionalQty = parseFloat(additionalQuantity);
      
      // Double-check for safety
      if (isNaN(currentQty) || isNaN(additionalQty) || additionalQty <= 0) {
        return res.status(400).json({ error: "Invalid quantity values" });
      }
      
      const newQuantity = (currentQty + additionalQty).toFixed(2);

      // Prepare update data
      const updateData: any = {
        currentQuantity: newQuantity,
      };

      // Update price if provided and valid
      if (newPurchasePrice && newPurchasePrice.trim() !== "") {
        const newPrice = parseFloat(newPurchasePrice);
        if (isNaN(newPrice) || newPrice <= 0) {
          return res.status(400).json({ error: "Invalid purchase price" });
        }
        updateData.purchasePrice = newPrice.toFixed(2);
      }

      // Update package size if provided and valid
      if (newPackageSize && newPackageSize.trim() !== "") {
        const newSize = parseFloat(newPackageSize);
        if (isNaN(newSize) || newSize <= 0) {
          return res.status(400).json({ error: "Invalid package size" });
        }
        updateData.packageSize = newSize.toFixed(2);
      }

      // Update the stock item
      const updatedItem = await storage.updateStockItem(id, updateData);
      res.json(updatedItem);
    } catch (error: any) {
      console.error("Stock replenishment error:", error);
      res.status(400).json({ error: "Failed to replenish stock", message: error.message });
    }
  });

  app.delete("/api/stock/:id", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteStockItem(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete stock item" });
    }
  });

  // Categories
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  app.post("/api/categories", async (req, res) => {
    try {
      const data = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(data);
      res.json(category);
    } catch (error: any) {
      res.status(400).json({ error: "Invalid category data", message: error.message });
    }
  });

  // Deliveries
  app.get("/api/deliveries", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const result = await storage.getDeliveries(limit, offset);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch deliveries" });
    }
  });

  app.get("/api/deliveries/recent", async (req, res) => {
    try {
      const result = await storage.getDeliveries(5, 0);
      res.json(result.data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch recent deliveries" });
    }
  });

  app.get("/api/deliveries/last/:vendorId", async (req, res) => {
    try {
      const { vendorId } = req.params;
      const lastDelivery = await storage.getLastDeliveryForVendor(vendorId);
      
      if (!lastDelivery) {
        return res.status(404).json({ error: "No previous delivery found for this vendor" });
      }
      
      res.json(lastDelivery);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch last delivery" });
    }
  });

  app.post("/api/deliveries", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const deliverySchema = insertDeliverySchema.extend({
        items: z.array(z.object({
          productId: z.string(),
          productName: z.string(),
          quantity: z.number(),
          unitPrice: z.string(),
          rejectedQty: z.number().optional(),
          rejectionReason: z.string().optional(),
        })),
        force: z.boolean().optional(), // Allow bypassing duplicate check
      });
      
      const data = deliverySchema.parse(req.body);
      const { items, force, ...deliveryData } = data;
      
      // Check for duplicate delivery (same vendor + same date)
      if (!force) {
        const existingDelivery = await storage.checkDuplicateDelivery(
          deliveryData.vendorId,
          deliveryData.deliveryDate
        );
        
        if (existingDelivery) {
          return res.status(409).json({
            duplicate: true,
            existingDelivery: {
              id: existingDelivery.id,
              vendorName: existingDelivery.vendorName,
              totalAmount: existingDelivery.totalAmount,
              invoiceNumber: existingDelivery.invoiceNumber,
            },
            message: `Dah ada penghantaran untuk ${existingDelivery.vendorName} pada ${new Date(existingDelivery.deliveryDate).toLocaleDateString('ms-MY')} (RM ${existingDelivery.totalAmount}). Nak sambung?`
          });
        }
      }
      
      const deliveryItems = items.map(item => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: (item.quantity * parseFloat(item.unitPrice)).toFixed(2),
        rejectedQty: item.rejectedQty || 0,
        rejectionReason: item.rejectionReason || null,
        deliveryId: "", // Will be set in storage
      }));
      
      // Deduct from finished goods batches using FIFO
      for (const item of items) {
        const deductionResult = await storage.deductFromBatches(item.productId, item.quantity);
        if (!deductionResult.success) {
          return res.status(400).json({ 
            error: `Insufficient finished goods stock for ${item.productName}`,
            details: deductionResult
          });
        }
      }
      
      const delivery = await storage.createDelivery(deliveryData, deliveryItems);
      res.json(delivery);
    } catch (error) {
      console.error("Delivery creation error:", error);
      res.status(400).json({ error: "Invalid delivery data" });
    }
  });

  app.patch("/api/deliveries/:id/status", async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      await storage.updateDeliveryStatus(id, status);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: "Failed to update status" });
    }
  });

  app.patch("/api/delivery-items/:itemId/rejection", async (req, res) => {
    try {
      const { itemId } = req.params;
      
      // Get the delivery item to check quantity
      const items = await db.select().from(deliveryItems).where(eq(deliveryItems.id, itemId));
      if (items.length === 0) {
        return res.status(404).json({ error: "Delivery item not found" });
      }
      
      const item = items[0];
      
      // Validate rejection data
      const rejectionSchema = z.object({
        rejectedQty: z.coerce.number().int().min(0).max(item.quantity),
        rejectionReason: z.string().nullable().optional(),
      });
      
      const validatedData = rejectionSchema.parse(req.body);
      
      await storage.updateDeliveryItemRejection(
        itemId,
        validatedData.rejectedQty,
        validatedData.rejectionReason || null
      );
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("Update rejection error:", error);
      res.status(400).json({ 
        error: "Invalid rejection data", 
        message: error.message || "Rejected quantity must be between 0 and delivered quantity"
      });
    }
  });

  // POS Sales - New transaction-based sales system
  app.get("/api/sales", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const result = await storage.getSales(limit, offset);
      res.json(result);
    } catch (error) {
      console.error('[ERROR] GET /api/sales failed:', error);
      res.status(500).json({ error: "Failed to fetch sales" });
    }
  });

  app.get("/api/sales/:id", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const { id } = req.params;
      const sale = await storage.getSale(id);
      
      if (!sale) {
        return res.status(404).json({ error: "Sale not found" });
      }
      
      res.json(sale);
    } catch (error) {
      console.error('[ERROR] GET /api/sales/:id failed:', error);
      res.status(500).json({ error: "Failed to fetch sale" });
    }
  });

  app.post("/api/sales", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      // Validate sale and items structure
      const saleCreateSchema = z.object({
        sale: insertSaleSchema,
        items: z.array(insertSalesItemSchema).min(1, "At least one item required"),
      });
      
      const validated = saleCreateSchema.parse(req.body);
      
      // Create sale with FIFO stock deduction (atomic transaction)
      const sale = await storage.createSale(validated.sale, validated.items);
      
      res.json(sale);
    } catch (error: any) {
      console.error('[ERROR] POST /api/sales failed:', error);
      
      if (error.message?.includes('Insufficient stock')) {
        return res.status(400).json({ 
          error: "Insufficient stock", 
          message: error.message 
        });
      }
      
      res.status(400).json({ 
        error: "Invalid sale data",
        message: error.message || "Failed to create sale"
      });
    }
  });

  // Expenses
  app.get("/api/expenses", async (req, res) => {
    try {
      const expenses = await storage.getExpenses();
      res.json(expenses);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch expenses" });
    }
  });

  app.post("/api/expenses", async (req, res) => {
    try {
      const data = insertExpenseSchema.parse(req.body);
      const expense = await storage.createExpense(data);
      res.json(expense);
    } catch (error) {
      res.status(400).json({ error: "Invalid expense data" });
    }
  });

  // Dashboard
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  // Reports
  app.get("/api/reports/profit-loss", requireProPlan, async (req, res) => {
    try {
      const report = await storage.getProfitLossReport();
      res.json(report);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch profit/loss report" });
    }
  });

  // Weekly profit summary with week-over-week comparison
  app.get("/api/reports/weekly-summary", async (req, res) => {
    try {
      const summary = await storage.getWeeklyProfitSummary();
      res.json(summary);
    } catch (error) {
      console.error("Weekly summary error:", error);
      res.status(500).json({ error: "Failed to fetch weekly summary" });
    }
  });

  // Daily Task Checklist - auto-generate today's tasks
  app.get("/api/tasks/daily", async (req, res) => {
    try {
      const tasks = [];
      const today = new Date().toISOString().split('T')[0];

      // 1. Low stock items need restocking
      const lowStock = await storage.getLowStockItems();
      if (lowStock.length > 0) {
        tasks.push({
          id: "restock",
          type: "restock",
          title: `Tambah ${lowStock.length} stok bahan rendah`,
          description: lowStock.slice(0, 3).map((s: any) => s.name).join(", ") + (lowStock.length > 3 ? "..." : ""),
          priority: "high",
          actionUrl: "/shopping-cart",
        });
      }

      // 2. Low finished products need production
      const finishedProducts = await storage.getFinishedProductsSummary();
      const lowFinished = finishedProducts.filter((p: any) => {
        const qty = parseFloat(p.totalQuantity || "0");
        return qty > 0 && qty < 10;
      });
      if (lowFinished.length > 0) {
        tasks.push({
          id: "production",
          type: "production",
          title: `Produksi ${lowFinished.length} produk hampir habis`,
          description: lowFinished.slice(0, 3).map((p: any) => p.productName).join(", ") + (lowFinished.length > 3 ? "..." : ""),
          priority: "high",
          actionUrl: "/production",
        });
      }

      // 3. Pending/Claimed deliveries (need to collect payment)
      const claimsResult = await storage.getClaimsSummary(100, 0);
      const pendingPayments = claimsResult.data.filter((claim: any) => {
        const pending = parseFloat(claim.pendingAmount || "0");
        const partial = parseFloat(claim.partialAmount || "0");
        return pending > 0 || partial > 0;
      });
      if (pendingPayments.length > 0) {
        const totalOutstanding = pendingPayments.reduce((sum: number, claim: any) => {
          return sum + parseFloat(claim.pendingAmount || "0") + parseFloat(claim.partialAmount || "0");
        }, 0);
        tasks.push({
          id: "claims",
          type: "claims",
          title: `Kutip bayaran dari ${pendingPayments.length} vendor`,
          description: `Total: RM ${totalOutstanding.toFixed(2)}`,
          priority: "medium",
          actionUrl: "/claims",
        });
      }

      // 4. Check for expiring batches (< 3 days)
      const stats = await storage.getDashboardStats();
      if (stats.expiringSoonCount > 0) {
        tasks.push({
          id: "expiry",
          type: "expiry",
          title: `${stats.expiringSoonCount} batch hampir expired`,
          description: "Jual atau promo segera untuk elak kerugian",
          priority: "high",
          actionUrl: "/finished-products",
        });
      }

      res.json(tasks);
    } catch (error) {
      console.error("Daily tasks error:", error);
      res.status(500).json({ error: "Failed to fetch daily tasks" });
    }
  });

  // CSV/Excel Export Endpoints
  app.get("/api/reports/export-sales", async (req, res) => {
    try {
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      
      const sales = await storage.getAllSales(startDate, endDate);
      
      // CSV headers
      const headers = ['No.', 'Tarikh', 'No. Resit', 'Jumlah Produk', 'Jumlah (RM)', 'Kos (RM)', 'Untung (RM)', 'Kaedah Bayaran', 'Pelanggan'];
      
      // CSV rows
      const rows = sales.map((sale: any, index: number) => [
        index + 1,
        new Date(sale.saleDate).toLocaleDateString('ms-MY'),
        sale.receiptNumber,
        sale.totalItems,
        Number(sale.totalAmount || 0).toFixed(2),
        Number(sale.totalCost || 0).toFixed(2),
        Number(sale.totalProfit || 0).toFixed(2),
        sale.paymentMethod || 'Tunai',
        sale.customerName || '-'
      ]);
      
      // Build CSV content
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');
      
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=PocketBizz_Jualan_${new Date().toISOString().split('T')[0]}.csv`);
      res.send('\uFEFF' + csvContent); // BOM for Excel UTF-8 support
    } catch (error) {
      console.error("Export sales error:", error);
      res.status(500).json({ error: "Failed to export sales" });
    }
  });

  app.get("/api/reports/export-deliveries", async (req, res) => {
    try {
      const deliveries = await storage.getAllDeliveries();
      
      // CSV headers
      const headers = ['No.', 'Tarikh', 'Vendor', 'Produk', 'Kuantiti', 'Jumlah (RM)', 'Status', 'Bayaran', 'Catatan'];
      
      // CSV rows
      const rows = deliveries.map((delivery: any, index: number) => [
        index + 1,
        new Date(delivery.deliveryDate).toLocaleDateString('ms-MY'),
        delivery.vendorName,
        delivery.productName,
        delivery.quantity,
        Number(delivery.totalAmount || 0).toFixed(2),
        delivery.deliveryStatus === 'delivered' ? 'Dihantar' :
        delivery.deliveryStatus === 'claimed' ? 'Dituntut' :
        delivery.deliveryStatus === 'pending' ? 'Pending' : 'Tolakan',
        delivery.paymentStatus === 'full' ? 'Penuh' :
        delivery.paymentStatus === 'partial' ? 'Sebahagian' : 'Belum',
        delivery.notes || '-'
      ]);
      
      // Build CSV content
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');
      
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=PocketBizz_Penghantaran_${new Date().toISOString().split('T')[0]}.csv`);
      res.send('\uFEFF' + csvContent);
    } catch (error) {
      console.error("Export deliveries error:", error);
      res.status(500).json({ error: "Failed to export deliveries" });
    }
  });

  app.get("/api/reports/export-claims", async (req, res) => {
    try {
      const claimsResult = await storage.getClaimsSummary(1000, 0);
      
      // CSV headers
      const headers = ['No.', 'Vendor', 'Jumlah Hantar', 'Jumlah Tuntut', 'Pending', 'Sebahagian', 'Penuh', 'Tolakan', 'Belum Bayar (RM)', 'Status'];
      
      // CSV rows
      const rows = claimsResult.data.map((claim: any, index: number) => [
        index + 1,
        claim.vendorName,
        claim.totalDeliveries,
        claim.totalClaimed,
        claim.pendingCount,
        claim.partialCount,
        claim.fullCount,
        claim.rejectedCount,
        (Number(claim.pendingAmount || 0) + Number(claim.partialAmount || 0)).toFixed(2),
        Number(claim.pendingAmount || 0) + Number(claim.partialAmount || 0) > 0 ? 'Belum Selesai' : 'Selesai'
      ]);
      
      // Build CSV content
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');
      
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=PocketBizz_Tuntutan_${new Date().toISOString().split('T')[0]}.csv`);
      res.send('\uFEFF' + csvContent);
    } catch (error) {
      console.error("Export claims error:", error);
      res.status(500).json({ error: "Failed to export claims" });
    }
  });

  app.get("/api/reports/top-products", requireProPlan, async (req, res) => {
    try {
      const topProducts = await storage.getTopProducts();
      res.json(topProducts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch top products" });
    }
  });

  app.get("/api/reports/top-vendors", requireProPlan, async (req, res) => {
    try {
      const topVendors = await storage.getTopVendors();
      res.json(topVendors);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch top vendors" });
    }
  });

  app.get("/api/reports/monthly", requireProPlan, async (req, res) => {
    try {
      const monthlyData = await storage.getMonthlyData();
      res.json(monthlyData);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch monthly data" });
    }
  });

  // Advanced Analytics Endpoints
  app.get("/api/analytics/product-performance", async (req, res) => {
    try {
      const analytics = await storage.getProductPerformanceAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error("Product performance error:", error);
      res.status(500).json({ error: "Failed to fetch product performance analytics" });
    }
  });

  app.get("/api/analytics/vendor-leaderboard", async (req, res) => {
    try {
      const leaderboard = await storage.getVendorPerformanceLeaderboard();
      res.json(leaderboard);
    } catch (error) {
      console.error("Vendor leaderboard error:", error);
      res.status(500).json({ error: "Failed to fetch vendor leaderboard" });
    }
  });

  app.get("/api/analytics/agent-leaderboard", async (req, res) => {
    try {
      const leaderboard = await storage.getAgentPerformanceLeaderboard();
      res.json(leaderboard);
    } catch (error) {
      console.error("Agent leaderboard error:", error);
      res.status(500).json({ error: "Failed to fetch agent leaderboard" });
    }
  });

  app.get("/api/analytics/sales-trend", async (req, res) => {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const trendData = await storage.getSalesTrendData(days);
      res.json(trendData);
    } catch (error) {
      console.error("Sales trend error:", error);
      res.status(500).json({ error: "Failed to fetch sales trend data" });
    }
  });

  // Goals Routes (Monthly targets and progress tracking)
  app.get("/api/goals", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const userId = req.user!.id;
      const goalsList = await storage.getGoals(userId);
      res.json(goalsList);
    } catch (error) {
      console.error("Get goals error:", error);
      res.status(500).json({ error: "Failed to fetch goals" });
    }
  });

  app.get("/api/goals/:month", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { month } = req.params;
      const goal = await storage.getGoalByMonth(userId, month);
      res.json(goal || null);
    } catch (error) {
      console.error("Get goal by month error:", error);
      res.status(500).json({ error: "Failed to fetch goal" });
    }
  });

  app.get("/api/goals/:month/progress", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { month } = req.params;
      const progress = await storage.getGoalProgress(userId, month);
      res.json(progress);
    } catch (error) {
      console.error("Get goal progress error:", error);
      res.status(500).json({ error: "Failed to fetch goal progress" });
    }
  });

  app.post("/api/goals", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const userId = req.user!.id;
      const goalData = { ...req.body, userId };
      const newGoal = await storage.createGoal(goalData);
      res.json(newGoal);
    } catch (error) {
      console.error("Create goal error:", error);
      res.status(500).json({ error: "Failed to create goal" });
    }
  });

  app.patch("/api/goals/:id", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const { id } = req.params;
      const updatedGoal = await storage.updateGoal(id, req.body);
      res.json(updatedGoal);
    } catch (error) {
      console.error("Update goal error:", error);
      res.status(500).json({ error: "Failed to update goal" });
    }
  });

  app.delete("/api/goals/:id", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteGoal(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete goal error:", error);
      res.status(500).json({ error: "Failed to delete goal" });
    }
  });

  // Claims
  app.get("/api/claims", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const result = await storage.getClaimsSummary(limit, offset);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch claims summary" });
    }
  });

  app.get("/api/claims/:vendorId/details", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const { vendorId } = req.params;
      const claimDetails = await storage.getClaimDetailsByVendor(vendorId);
      res.json(claimDetails);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch claim details" });
    }
  });

  app.patch("/api/deliveries/:id/payment-status", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const { id } = req.params;
      const { paymentStatus } = req.body;
      const delivery = await storage.updateDeliveryPaymentStatus(id, paymentStatus);
      res.json(delivery);
    } catch (error) {
      res.status(400).json({ error: "Failed to update payment status" });
    }
  });

  // Business Profile
  app.get("/api/business-profile", async (req, res) => {
    try {
      const profile = await storage.getBusinessProfile();
      res.json(profile || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch business profile" });
    }
  });

  app.post("/api/business-profile", async (req, res) => {
    try {
      const data = insertBusinessProfileSchema.parse(req.body);
      const profile = await storage.createOrUpdateBusinessProfile(data);
      res.json(profile);
    } catch (error) {
      res.status(400).json({ error: "Invalid business profile data" });
    }
  });

  // Google Drive Sync
  app.post("/api/google-drive/upload", requireAuth, requirePaidSubscription, async (req, res) => {
    try {
      const { pdfBase64, fileName, deliveryId, vendorId, vendorName, fileType } = req.body;
      
      if (!pdfBase64 || !fileName) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Convert base64 to buffer
      const pdfBuffer = Buffer.from(pdfBase64, 'base64');
      
      // Upload to Google Drive
      const driveFile = await uploadPDFToGoogleDrive(pdfBuffer, fileName);
      
      // Log sync to database
      const syncLog = await storage.logGoogleDriveSync({
        deliveryId: deliveryId || null,
        fileName,
        fileType: fileType || 'invoice',
        driveFileId: driveFile.id,
        driveWebViewLink: driveFile.webViewLink,
        vendorId: vendorId || null,
        vendorName: vendorName || null,
      });

      res.json({ 
        success: true, 
        driveFile,
        syncLog 
      });
    } catch (error: any) {
      console.error('Google Drive upload error:', error);
      res.status(500).json({ 
        error: "Failed to upload to Google Drive",
        message: error.message 
      });
    }
  });

  app.get("/api/google-drive/files", async (req, res) => {
    try {
      const files = await listManisBizzFiles();
      res.json(files);
    } catch (error: any) {
      res.status(500).json({ 
        error: "Failed to fetch Google Drive files",
        message: error.message 
      });
    }
  });

  app.get("/api/google-drive/sync-logs", async (req, res) => {
    try {
      const logs = await storage.getGoogleDriveSyncLogs();
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch sync logs" });
    }
  });

  app.get("/api/google-drive/sync-logs/:deliveryId", async (req, res) => {
    try {
      const { deliveryId } = req.params;
      const logs = await storage.getGoogleDriveSyncLogsByDelivery(deliveryId);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch delivery sync logs" });
    }
  });

  // ==================== RESELLER MODULE ROUTES ====================
  
  // ========== Pricing Tiers Routes ==========
  
  // Get all pricing tiers for current user
  app.get("/api/pricing-tiers", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const allTiers = await storage.getPricingTiers();
      // Filter by current user
      const userTiers = allTiers.filter(tier => tier.userId === req.user!.id);
      res.json(userTiers);
    } catch (error: any) {
      console.error("Get pricing tiers error:", error);
      res.status(500).json({ message: error.message || "Failed to fetch pricing tiers" });
    }
  });
  
  // Create new pricing tier
  app.post("/api/pricing-tiers", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const validatedData = insertPricingTierSchema.parse(req.body);
      
      // Add userId from authenticated user
      const tierData = {
        ...validatedData,
        userId: req.user!.id,
      };
      
      const tier = await storage.createPricingTier(tierData);
      res.status(201).json(tier);
    } catch (error: any) {
      console.error("Create pricing tier error:", error);
      if (error.name === 'ZodError') {
        const { fromError } = await import('zod-validation-error');
        const validationError = fromError(error);
        return res.status(400).json({ message: validationError.toString() });
      }
      res.status(400).json({ message: error.message || "Failed to create pricing tier" });
    }
  });
  
  // Update pricing tier
  app.patch("/api/pricing-tiers/:id", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertPricingTierSchema.partial().parse(req.body);
      
      // Verify tier belongs to user
      const allTiers = await storage.getPricingTiers();
      const existingTier = allTiers.find(t => t.id === id && t.userId === req.user!.id);
      
      if (!existingTier) {
        return res.status(404).json({ message: "Pricing tier not found" });
      }
      
      const updatedTier = await storage.updatePricingTier(id, validatedData);
      res.json(updatedTier);
    } catch (error: any) {
      console.error("Update pricing tier error:", error);
      if (error.name === 'ZodError') {
        const { fromError } = await import('zod-validation-error');
        const validationError = fromError(error);
        return res.status(400).json({ message: validationError.toString() });
      }
      res.status(400).json({ message: error.message || "Failed to update pricing tier" });
    }
  });
  
  // ========== Resellers Routes ==========
  
  // Get all resellers for current user
  app.get("/api/resellers", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const allResellers = await storage.getResellers();
      // Filter by current user
      const userResellers = allResellers.filter(reseller => reseller.userId === req.user!.id);
      res.json(userResellers);
    } catch (error: any) {
      console.error("Get resellers error:", error);
      res.status(500).json({ message: error.message || "Failed to fetch resellers" });
    }
  });
  
  // Create new reseller
  app.post("/api/resellers", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const validatedData = insertResellerSchema.parse(req.body);
      
      // Add userId from authenticated user
      const resellerData = {
        ...validatedData,
        userId: req.user!.id,
      };
      
      const reseller = await storage.createReseller(resellerData);
      res.status(201).json(reseller);
    } catch (error: any) {
      console.error("Create reseller error:", error);
      if (error.name === 'ZodError') {
        const { fromError } = await import('zod-validation-error');
        const validationError = fromError(error);
        return res.status(400).json({ message: validationError.toString() });
      }
      res.status(400).json({ message: error.message || "Failed to create reseller" });
    }
  });
  
  // Update reseller
  app.patch("/api/resellers/:id", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertResellerSchema.partial().parse(req.body);
      
      // Verify reseller belongs to user
      const allResellers = await storage.getResellers();
      const existingReseller = allResellers.find(r => r.id === id && r.userId === req.user!.id);
      
      if (!existingReseller) {
        return res.status(404).json({ message: "Reseller not found" });
      }
      
      const updatedReseller = await storage.updateReseller(id, validatedData);
      res.json(updatedReseller);
    } catch (error: any) {
      console.error("Update reseller error:", error);
      if (error.name === 'ZodError') {
        const { fromError } = await import('zod-validation-error');
        const validationError = fromError(error);
        return res.status(400).json({ message: validationError.toString() });
      }
      res.status(400).json({ message: error.message || "Failed to update reseller" });
    }
  });
  
  // Delete reseller
  app.delete("/api/resellers/:id", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const { id } = req.params;
      
      // Verify reseller belongs to user
      const allResellers = await storage.getResellers();
      const existingReseller = allResellers.find(r => r.id === id && r.userId === req.user!.id);
      
      if (!existingReseller) {
        return res.status(404).json({ message: "Reseller not found" });
      }
      
      await storage.deleteReseller(id);
      res.json({ message: "Reseller deleted successfully" });
    } catch (error: any) {
      console.error("Delete reseller error:", error);
      res.status(500).json({ message: error.message || "Failed to delete reseller" });
    }
  });
  
  // Get reseller stats
  app.get("/api/resellers/:id/stats", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const { id } = req.params;
      
      // Verify reseller belongs to user
      const allResellers = await storage.getResellers();
      const existingReseller = allResellers.find(r => r.id === id && r.userId === req.user!.id);
      
      if (!existingReseller) {
        return res.status(404).json({ message: "Reseller not found" });
      }
      
      const stats = await storage.getResellerStats(id);
      res.json(stats);
    } catch (error: any) {
      console.error("Get reseller stats error:", error);
      res.status(500).json({ message: error.message || "Failed to fetch reseller stats" });
    }
  });
  
  // ========== Reseller Transfers Routes ==========
  
  // Get all reseller transfers with pagination
  app.get("/api/reseller-transfers", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const result = await storage.getResellerTransfers(limit, offset);
      
      // Filter by current user
      const userTransfers = result.data.filter(transfer => transfer.userId === req.user!.id);
      
      res.json({
        data: userTransfers,
        hasMore: result.hasMore,
        total: userTransfers.length,
      });
    } catch (error: any) {
      console.error("Get reseller transfers error:", error);
      res.status(500).json({ message: error.message || "Failed to fetch reseller transfers" });
    }
  });
  
  // Get single reseller transfer with items
  app.get("/api/reseller-transfers/:id", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const { id } = req.params;
      const transfer = await storage.getResellerTransferById(id);
      
      if (!transfer) {
        return res.status(404).json({ message: "Transfer not found" });
      }
      
      // Verify transfer belongs to user
      if (transfer.userId !== req.user!.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(transfer);
    } catch (error: any) {
      console.error("Get reseller transfer error:", error);
      res.status(500).json({ message: error.message || "Failed to fetch reseller transfer" });
    }
  });
  
  // Create new reseller transfer with FIFO stock deduction
  app.post("/api/reseller-transfers", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      // Validate request body
      const transferSchema = z.object({
        resellerId: z.string().min(1, "Reseller is required"),
        transferDate: z.string().min(1, "Transfer date is required"),
        items: z.array(z.object({
          productId: z.string().min(1, "Product ID is required"),
          productName: z.string().min(1, "Product name is required"),
          quantity: z.number().int().positive("Quantity must be positive"),
        })).min(1, "At least one item is required"),
        paymentStatus: z.enum(["paid", "pending"]).default("pending"),
        notes: z.string().optional(),
      });
      
      const validatedData = transferSchema.parse(req.body);
      
      // Verify reseller belongs to user
      const allResellers = await storage.getResellers();
      const reseller = allResellers.find(r => r.id === validatedData.resellerId && r.userId === req.user!.id);
      
      if (!reseller) {
        return res.status(404).json({ message: "Reseller not found" });
      }
      
      // Get reseller's pricing tier
      let tier = null;
      if (reseller.pricingTierId) {
        const allTiers = await storage.getPricingTiers();
        tier = allTiers.find(t => t.id === reseller.pricingTierId);
      }
      
      // Process each item and deduct from batches using FIFO
      const processedItems = [];
      
      for (const item of validatedData.items) {
        // Deduct from batches using FIFO
        const deductionResult = await storage.deductFromBatches(item.productId, item.quantity);
        
        if (!deductionResult.success) {
          return res.status(400).json({ 
            error: "Insufficient stock",
            message: `Insufficient stock for product: ${item.productName}. Available quantity is less than ${item.quantity}.`,
            productName: item.productName,
          });
        }
        
        // Get product to calculate tier price
        const product = await storage.getProduct(item.productId);
        if (!product) {
          return res.status(404).json({ message: `Product not found: ${item.productName}` });
        }
        
        // Calculate tier price: product.sellingPrice * (1 - tier.discountPercent/100)
        const discountPercent = tier ? parseFloat(tier.discountPercent.toString()) : 0;
        const tierPrice = parseFloat(product.sellingPrice.toString()) * (1 - discountPercent / 100);
        const subtotal = item.quantity * tierPrice;
        
        // Get batch ID from first deduction for tracking
        const batchId = deductionResult.deductions.length > 0 ? deductionResult.deductions[0].batchId : null;
        
        processedItems.push({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          tierPrice,
          subtotal,
          batchId,
        });
      }
      
      // Calculate total amount
      const totalAmount = processedItems.reduce((sum, item) => sum + item.subtotal, 0);
      
      // Generate receipt number
      const receiptNumber = await storage.generateTransferReceiptNumber();
      
      // Create transfer
      const transferData = {
        userId: req.user!.id,
        resellerId: validatedData.resellerId,
        transferDate: validatedData.transferDate,
        totalAmount,
        paymentStatus: validatedData.paymentStatus,
        notes: validatedData.notes || null,
        receiptNumber,
      };
      
      const createdTransfer = await storage.createResellerTransfer(transferData, processedItems);
      
      res.status(201).json(createdTransfer);
    } catch (error: any) {
      console.error("Create reseller transfer error:", error);
      if (error.name === 'ZodError') {
        const { fromError } = await import('zod-validation-error');
        const validationError = fromError(error);
        return res.status(400).json({ message: validationError.toString() });
      }
      res.status(400).json({ message: error.message || "Failed to create reseller transfer" });
    }
  });

  // Shopping Cart Routes
  app.post("/api/shopping-cart", async (req, res) => {
    try {
      const { insertShoppingCartSchema } = await import("@shared/schema");
      const data = insertShoppingCartSchema.parse(req.body);
      const item = await storage.addToShoppingCart(data);
      res.json(item);
    } catch (error: any) {
      res.status(400).json({ error: "Invalid shopping cart data", message: error.message });
    }
  });

  app.get("/api/shopping-cart", async (req, res) => {
    try {
      const items = await storage.getShoppingCartItems();
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch shopping cart items" });
    }
  });

  app.delete("/api/shopping-cart/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.removeFromCart(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to remove item from cart" });
    }
  });

  app.delete("/api/shopping-cart", async (req, res) => {
    try {
      await storage.clearCart();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to clear cart" });
    }
  });

  app.post("/api/shopping-cart/purchase", async (req, res) => {
    try {
      const { cartItemIds } = req.body;
      
      if (!Array.isArray(cartItemIds) || cartItemIds.length === 0) {
        return res.status(400).json({ error: "Cart item IDs are required" });
      }
      
      await storage.bulkPurchaseAndUpdateStock(cartItemIds);
      res.json({ success: true, message: "Stock updated and cart items removed" });
    } catch (error: any) {
      console.error("Bulk purchase error:", error);
      res.status(500).json({ error: "Failed to complete purchase", message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

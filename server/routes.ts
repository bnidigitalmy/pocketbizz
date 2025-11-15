import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import rateLimit from "express-rate-limit";
import crypto from "crypto";
import { storage } from "./storage";
import { db } from "./db";
import { cache } from "./cache";
import { processBCLWebhook, testBCLWebhook, testBCLWebhookSigned } from "./bcl-webhook";
import {
  enforceProductLimit,
  enforceVendorLimit,
  enforceResellerLimit,
  enforceStockLimit,
  requireVendorClaims,
  requireResellerNetwork,
  requireAdvancedAnalytics,
  requireLoyaltyPoints,
  requireWhatsappBroadcast,
  requirePublicStore,
  getUserPlan,
} from "./feature-gating";
import { deliveryItems, earlyBirdTracking, billingHistory, customers, users, passwordResetTokens, adminActivityLogs } from "@shared/schema";
import { eq, sql } from "drizzle-orm";
import { 
  insertProductSchema,
  insertProductionBatchSchema,
  insertVendorSchema,
  insertSupplierSchema,
  insertDeliverySchema,
  insertSaleSchema,
  insertSalesItemSchema,
  insertExpenseSchema,
  insertBusinessProfileSchema,
  insertGoogleDriveSyncLogSchema,
  insertStockItemSchema,
  insertCategorySchema,
  insertCustomerVoucherSchema,
  convertUnit,
  UNIT_CONVERSIONS,
  insertUserSchema,
  insertSubscriptionPlanSchema,
  insertPricingTierSchema,
  insertResellerSchema,
  insertResellerTransferSchema,
} from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { uploadPDFToGoogleDrive, listManisBizzFiles } from "./google-drive";

// Security: Auth rate limiter - prevent brute force attacks
// Note: Using in-memory store for now. For distributed rate limiting across multiple instances,
// consider using external store like Redis with compatible adapter (e.g., rate-limiter-flexible)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per 15 minutes
  message: 'Too many login attempts from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful logins
});

// Security: Password complexity schema
const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

// Auth middleware - adds user object to request if logged in
async function loadUser(req: Request, res: Response, next: NextFunction) {
  try {
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
      } else {
        // User ID exists in session but user not found in DB - destroy session
        req.session.destroy(() => {});
      }
    }
  } catch (error) {
    console.error('[Auth] loadUser error:', error);
    // Don't block request on loadUser error
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

// Middleware to require admin access
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized - please login" });
  }
  if (!req.user.isAdmin) {
    return res.status(403).json({ message: "Forbidden - admin access required" });
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

// Helper: Check if user's trial has expired (no grace period)
function isTrialExpired(user: any): boolean {
  if (!user.trialEndsAt) return false;
  const now = new Date();
  return new Date(user.trialEndsAt) < now;
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
  
  // ==================== WEBHOOK ROUTES (NO AUTH REQUIRED) ====================
  // Webhooks must be registered BEFORE loadUser middleware
  // Payment gateways don't send session cookies
  
  app.post("/api/webhooks/bcl", processBCLWebhook);
  
  // Test endpoint for simulating BCL.my webhooks (dev only)
  if (process.env.NODE_ENV !== "production") {
    app.post("/api/webhooks/bcl/test", testBCLWebhook);
    // Dev-only signed test (uses BCL_WEBHOOK_SECRET)
    if (process.env.NODE_ENV !== "production") {
      app.post("/api/webhooks/bcl/test-signed", testBCLWebhookSigned);
    }
  }
  
  // Load user for all requests
  app.use(loadUser);
  
  // ==================== TEST ROUTES ====================
  
  // Test Sentry error tracking (only in development)
  if (process.env.NODE_ENV !== "production") {
    app.get("/api/test/sentry-error", (_req, _res) => {
      throw new Error("Sentry test error - this is intentional!");
    });
  }
  
  // ==================== AUTHENTICATION ROUTES ====================
  
  // Register new user
  app.post("/api/auth/register", authLimiter, async (req, res) => {
    try {
      const registerSchema = insertUserSchema.omit({
        isAdmin: true,
        toyyibpayUserCode: true,
      });
      const body = registerSchema.parse(req.body);
      
      // Validate password complexity
      try {
        passwordSchema.parse(body.password);
      } catch (error: any) {
        return res.status(400).json({ 
          message: "Password does not meet security requirements",
          errors: error.errors.map((e: any) => e.message)
        });
      }
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(body.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }
      
      // Hash password with strong cost factor
      const hashedPassword = await bcrypt.hash(body.password, 12);
      
      // Calculate trial end date (7 days from now - Simple Trial)
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 7);
      
      // Create user with auto-activated 7-day trial
      const user = await storage.createUser({
        ...body,
        password: hashedPassword,
        isAdmin: 0, // Explicitly prevent privilege escalation
        isOnTrial: 1, // Auto-activate 7-day trial
        trialEndsAt,
        // No grace period; strict 7-day trial
        toyyibpayUserCode: null,
      });
      
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
  app.post("/api/auth/login", authLimiter, async (req, res) => {
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
      
      // Security: Regenerate session to prevent session fixation attacks
      const oldSessionData = req.session;
      req.session.regenerate((err) => {
        if (err) {
          console.error('Session regeneration error:', err);
          return res.status(500).json({ message: "Login failed. Please try again." });
        }
        
        // Restore session data after regeneration
        Object.assign(req.session, oldSessionData);
        
        // Set user ID in new session
        req.session.userId = user.id;
        
        // Save session explicitly
        req.session.save((saveErr) => {
          if (saveErr) {
            console.error('Session save error:', saveErr);
            return res.status(500).json({ message: "Login failed. Please try again." });
          }
          
          // Return user without password
          const { password: _, ...userWithoutPassword } = user;
          res.json({ user: userWithoutPassword });
        });
      });
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

  // Forgot Password - Send reset email
  app.post("/api/auth/forgot-password", authLimiter, async (req, res) => {
    try {
      const { email } = z.object({ email: z.string().email() }).parse(req.body);
      
      // Find user
      const user = await storage.getUserByEmail(email);
      if (!user) {
        // Don't reveal if email exists - security best practice
        return res.json({ message: "If that email exists, we've sent a reset link" });
      }

      // Generate reset token (crypto random)
      const crypto = await import('crypto');
      const resetToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = await bcrypt.hash(resetToken, 10);
      
      // Save token to database (expires in 1 hour)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1);
      
      await db.insert(passwordResetTokens).values({
        userId: user.id,
        token: hashedToken,
        expiresAt,
      });

      // Send email with reset link
      try {
        const { getUncachableResendClient } = await import("./resend-client");
        const client = await getUncachableResendClient();
        
        const resetUrl = `${process.env.APP_URL || 'http://localhost:5000'}/auth/reset-password?token=${resetToken}`;
        
        // Use Resend's test domain for development
        const fromEmail = process.env.NODE_ENV === 'production' 
          ? 'PocketBizz <noreply@pocketbizz.my>'
          : 'PocketBizz <onboarding@resend.dev>';
        
        console.log('Sending reset email to:', email, 'from:', fromEmail);
        
        const result = await client.emails.send({
          from: fromEmail,
          to: email,
          subject: 'Reset Password - PocketBizz',
          html: `
            <h2>Reset Password</h2>
            <p>Hi ${user.name},</p>
            <p>Anda telah request untuk reset password. Klik link di bawah untuk reset:</p>
            <p><a href="${resetUrl}" style="background: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a></p>
            <p>Link ini akan expire dalam 1 jam.</p>
            <p>Kalau anda tidak request reset ni, abaikan email ini.</p>
            <br />
            <p>Best regards,<br />PocketBizz Team</p>
          `
        });
        
        console.log('Email sent successfully:', result);
      } catch (emailError: any) {
        console.error("Failed to send reset email:", emailError);
        return res.status(500).json({ message: "Failed to send reset email. Please try again later." });
      }

      res.json({ message: "If that email exists, we've sent a reset link" });
    } catch (error: any) {
      console.error("Forgot password error:", error);
      res.status(400).json({ message: error.message || "Failed to process request" });
    }
  });

  // Reset Password - Update password with token
  app.post("/api/auth/reset-password", authLimiter, async (req, res) => {
    try {
      const { token, password } = z.object({
        token: z.string(),
        password: z.string().min(6),
      }).parse(req.body);

      // Find all reset tokens and check which one matches
      const allTokens = await db.select().from(passwordResetTokens)
        .where(sql`${passwordResetTokens.expiresAt} > NOW()`);
      
      let validToken: any = null;
      for (const dbToken of allTokens) {
        const isValid = await bcrypt.compare(token, dbToken.token);
        if (isValid) {
          validToken = dbToken;
          break;
        }
      }

      if (!validToken) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }

      // Update user password
      const hashedPassword = await bcrypt.hash(password, 10);
      await db.update(users)
        .set({ 
          password: hashedPassword,
          updatedAt: new Date()
        })
        .where(eq(users.id, validToken.userId));

      // Delete used token
      await db.delete(passwordResetTokens)
        .where(eq(passwordResetTokens.id, validToken.id));

      // Delete all other tokens for this user (security)
      await db.delete(passwordResetTokens)
        .where(eq(passwordResetTokens.userId, validToken.userId));

      res.json({ message: "Password reset successfully" });
    } catch (error: any) {
      console.error("Reset password error:", error);
      res.status(400).json({ message: error.message || "Failed to reset password" });
    }
  });
  
  // Get current user
  app.get("/api/auth/me", (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    // Touch session to keep it alive
    req.session.touch();
    
    const { password, ...userWithoutPassword } = req.user;
    res.json({ user: userWithoutPassword });
  });
  
  // Session health check endpoint
  app.get("/api/auth/session-check", (req, res) => {
    const hasSession = !!req.session.userId;
    const hasUser = !!req.user;
    
    res.json({
      authenticated: hasUser,
      sessionId: hasSession ? req.sessionID : null,
      userId: req.session.userId || null,
    });
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

  // Get trial impact stats for current user
  app.get("/api/user/trial-impact", requireAuth, async (req, res) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Calculate days used in trial
      const trialStartDate = new Date(user.createdAt);
      const now = new Date();
      const daysUsed = Math.floor((now.getTime() - trialStartDate.getTime()) / (1000 * 60 * 60 * 24));
      const daysRemaining = user.trialEndsAt 
        ? Math.max(0, Math.floor((new Date(user.trialEndsAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
        : 0;

      // Get sales data
      const salesData = await db.query.sales.findMany({
        where: (sales, { eq }) => eq(sales.userId, user.id),
      });

      const totalSales = salesData.reduce((sum, sale) => sum + parseFloat(sale.totalAmount), 0);
      const salesCount = salesData.length;

      // Get products count
      const productsData = await db.query.products.findMany({
        where: (products, { eq }) => eq(products.userId, user.id),
      });
      const productsCount = productsData.length;

      // Get customers count
      const customersData = await db.query.customers.findMany({
        where: (customers, { eq }) => eq(customers.userId, user.id),
      });
      const customersCount = customersData.length;

      // Get stock movements (for waste prevention estimate)
      const stockMovements = await db.query.stockMovements.findMany({
        where: (movements, { eq }) => eq(movements.userId, user.id),
      });
      const stockMovementsCount = stockMovements.length;

      // Estimate time saved (rough calculation)
      // Average 2 min per sale entry, 5 min per product setup, 3 min per customer
      const timeSavedMinutes = (salesCount * 2) + (productsCount * 5) + (customersCount * 3);
      const timeSavedHours = Math.round(timeSavedMinutes / 60 * 10) / 10; // Round to 1 decimal

      // Estimate stock waste prevented (if using FIFO/expiry tracking)
      // Rough estimate: RM30 per expired item caught, assume 5% of stock movements are preventions
      const wastePreventionEstimate = Math.round(stockMovementsCount * 0.05 * 30);

      // Calculate potential monthly projection
      const avgDailySales = daysUsed > 0 ? totalSales / daysUsed : 0;
      const projectedMonthlySales = Math.round(avgDailySales * 30);

      // Time saved per week (extrapolate from days used)
      const avgDailyTimeSaved = daysUsed > 0 ? timeSavedHours / daysUsed : 0;
      const weeklyTimeSaved = Math.round(avgDailyTimeSaved * 7 * 10) / 10;

      res.json({
        daysUsed,
        daysRemaining,
        isOnTrial: user.isOnTrial === 1,
        trialEndsAt: user.trialEndsAt,
        stats: {
          totalSales: Math.round(totalSales),
          salesCount,
          productsCount,
          customersCount,
          stockMovementsCount,
          timeSavedHours,
          weeklyTimeSaved,
          wastePreventionEstimate,
          projectedMonthlySales,
        }
      });
    } catch (error: any) {
      console.error("Trial impact stats error:", error);
      res.status(500).json({ message: "Failed to get trial impact stats" });
    }
  });
  
  // ==================== SUBSCRIPTION PLANS ====================
  
  // Get all active subscription plans
  app.get("/api/subscription-plans", async (_req, res) => {
    try {
      // Fetch actual active plans from DB and adapt to our single-plan launch display
      const plans = await storage.getSubscriptionPlans();
      if (!plans || plans.length === 0) {
        return res.json([]);
      }
      const p = plans[0];
      const singlePlan = [{
        // Use real DB id for consistency with billing endpoints
        id: p.id,
        name: p.name,
        displayName: 'PocketBizz Plan',
        description: 'RM27/bulan (RM0.90 sehari). Trial 7 hari. Diskaun: 3% (3 bulan), 10% (6 bulan), 20% (12 bulan). Jumlah dibundarkan tanpa sen.',
        monthlyPrice: '27.00',
        annualPrice: null,
        currency: 'MYR',
        features: JSON.stringify([]),
        // Unlimited plan - all limits set to 999999 (effectively unlimited)
        maxUsers: 1,
        maxProducts: 999999,
        maxCustomers: 999999,
        maxStockItems: 999999,
        maxVendors: 999999,
        maxResellers: 999999,
        maxDeliveriesPerMonth: 999999,
        storageQuotaMB: 500,
        whatsappMessagesPerMonth: 0,
        smsPerMonth: 0,
        hasVendorClaims: 1,
        hasResellerNetwork: 0,
        hasAdvancedAnalytics: 1,
        hasLoyaltyPoints: 0,
        hasBookings: 0,
        hasWhatsappBroadcast: 0,
        hasSmsBroadcast: 0,
        hasPublicStore: 0,
        hasApiAccess: 0,
        hasCustomDomain: 0,
        hasPrioritySupport: 0,
        hasAccountManager: 0,
        discount6Months: '10.00',
        discount12Months: '20.00',
        isActive: 1,
        sortOrder: 0,
        createdAt: p.createdAt || new Date(),
      }];
      res.json(singlePlan);
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
      console.log("[CREATE-BILL] Request body:", JSON.stringify(req.body));
      
      const schema = z.object({
        planId: z.string(),
        durationMonths: z.number().refine(val => [1, 3, 6, 12].includes(val), {
          message: "Duration must be 1, 3, 6, or 12 months"
        }),
        promoCode: z.string().optional(),
      });
      
      const { planId, durationMonths, promoCode } = schema.parse(req.body);
      console.log("[CREATE-BILL] Parsed data - planId:", planId, "duration:", durationMonths);
      
      // Get subscription plan
      console.log("[CREATE-BILL] Fetching plan with ID:", planId);
      const plan = await storage.getSubscriptionPlanById(planId);
      if (!plan) {
        console.log("[CREATE-BILL] Plan not found for ID:", planId);
        return res.status(404).json({ message: "Subscription plan not found" });
      }
      console.log("[CREATE-BILL] Plan found:", plan.displayName);
      
      // Calculate base price for duration (launch pricing: RM27/month)
      const monthlyPrice = 27;
      let totalPrice = monthlyPrice * durationMonths;
      
      // Apply duration discount (launch: 3%=3m, 10%=6m, 20%=12m)
      if (durationMonths === 3) {
        totalPrice = totalPrice * (1 - 3 / 100);
      } else if (durationMonths === 6) {
        totalPrice = totalPrice * (1 - 10 / 100);
      } else if (durationMonths === 12) {
        totalPrice = totalPrice * (1 - 20 / 100);
      }
      
      // Check if user has early bird slot (auto-apply 70% discount for first 100 signups)
      let hasEarlyBird = false;
      try {
        const earlyBirdSlot = await db.query.earlyBirdTracking.findFirst({
          where: (tracking, { eq }) => eq(tracking.userId, req.user!.id),
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
          const hasUsed = await storage.hasUserUsedPromoCode(req.user!.id, promo.id);
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
      
      // Ensure minimum price then round to whole MYR (no cents)
      totalPrice = Math.max(totalPrice, 1);
      totalPrice = Math.round(totalPrice);
      
      // Type assertion for req.user (requireAuth ensures it exists)
      const user = req.user!;
      
      // Generate unique order reference
      const orderRef = `SUB-${user.id.slice(0, 8)}-${Date.now()}`;
      
      // Import ToyyibPay helper
      const { createBill, getBillUrl, rmToCents } = await import('./toyyibpay');
      
      // Create bill
      // Get base URL - use PUBLIC_URL env var or fallback to production domain
      const baseUrl = process.env.PUBLIC_URL || 'https://app.pocketbizz.my';
      console.log('[CREATE-BILL] Using callback base URL:', baseUrl);
      
      const billParams = {
        billName: `${plan.displayName} - ${durationMonths} months`,
        billDescription: `PocketBizz ${plan.displayName} subscription for ${durationMonths} months`,
        billAmount: rmToCents(totalPrice),
        billTo: user.name,
        billEmail: user.email,
        billPhone: user.phone || '0000000000',
        billExternalReferenceNo: orderRef,
        billReturnUrl: `${baseUrl}/payment/callback`,
        billCallbackUrl: `${baseUrl}/api/subscription/webhook`,
        billExpiryDays: 7, // Bill expires in 7 days
      };
      
      const billResponse = await createBill(billParams);
      
      if (!billResponse.BillCode) {
        return res.status(500).json({ message: "Failed to create payment bill" });
      }
      
      // Calculate total discount amount for metadata (includes rounding effect)
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
      console.error("[CREATE-BILL] Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name,
        issues: error.issues // Zod validation errors
      });
      res.status(400).json({ message: error.message || "Failed to create payment bill" });
    }
  });
  
  // Create renewal bill for existing subscription
  app.post("/api/subscription/renew", requireAuth, async (req, res) => {
    try {
      const schema = z.object({
        subscriptionId: z.string().optional(), // If not provided, use active subscription
        durationMonths: z.number().refine(val => [1, 3, 6, 12].includes(val), {
          message: "Duration must be 1, 3, 6, or 12 months"
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
      
      // Calculate base price for duration (launch pricing: RM27/month)
      const monthlyPrice = 27;
      let totalPrice = monthlyPrice * durationMonths;
      
      // Apply duration discount (launch: 3%=3m, 10%=6m, 20%=12m)
      if (durationMonths === 3) {
        totalPrice = totalPrice * (1 - 3 / 100);
      } else if (durationMonths === 6) {
        totalPrice = totalPrice * (1 - 10 / 100);
      } else if (durationMonths === 12) {
        totalPrice = totalPrice * (1 - 20 / 100);
      }
      
      // Check if user has early bird slot (auto-apply 70% discount for first 100 signups)
      let hasEarlyBird = false;
      try {
        const earlyBirdSlot = await db.query.earlyBirdTracking.findFirst({
          where: (tracking, { eq }) => eq(tracking.userId, req.user!.id),
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
          const hasUsed = await storage.hasUserUsedPromoCode(req.user!.id, promo.id);
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
      
      // Ensure minimum price then round to whole MYR (no cents)
      totalPrice = Math.max(totalPrice, 1);
      totalPrice = Math.round(totalPrice);
      
      // Generate unique order reference
      const orderRef = `REN-${user.id.slice(0, 8)}-${Date.now()}`;
      
      // Import ToyyibPay helper
      const { createBill, getBillUrl, rmToCents } = await import('./toyyibpay');
      
      // Create bill
      // Get base URL - use PUBLIC_URL env var or fallback to production domain
      const baseUrl = process.env.PUBLIC_URL || 'https://app.pocketbizz.my';
      console.log('[RENEW-BILL] Using callback base URL:', baseUrl);
      
      const billParams = {
        billName: `${plan.displayName} Renewal - ${durationMonths} months`,
        billDescription: `PocketBizz ${plan.displayName} subscription renewal for ${durationMonths} months`,
        billAmount: rmToCents(totalPrice),
        billTo: user.name,
        billEmail: user.email,
        billPhone: user.phone || '0000000000',
        billExternalReferenceNo: orderRef,
        billReturnUrl: `${baseUrl}/payment/callback`,
        billCallbackUrl: `${baseUrl}/api/subscription/webhook`,
        billExpiryDays: 7,
      };
      
      const billResponse = await createBill(billParams);
      
      if (!billResponse.BillCode) {
        return res.status(500).json({ message: "Failed to create renewal bill" });
      }
      
      // Calculate total discount amount (includes rounding effect)
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

  // Get subscription usage stats (for frontend progress bars)
  app.get("/api/subscription/usage", requireAuth, async (req, res) => {
    try {
      const { checkLimit } = await import('./feature-gating');
      const userId = req.user!.id;
      
      // Check all resource limits in parallel
      const [products, vendors, resellers, stockItems] = await Promise.all([
        checkLimit(userId, 'products'),
        checkLimit(userId, 'vendors'),
        checkLimit(userId, 'resellers'),
        checkLimit(userId, 'stock_items'),
      ]);
      
      res.json({
        plan: products.plan, // All will have the same plan
        usage: {
          products: {
            current: products.current,
            limit: products.limit,
            percentage: Math.round((products.current / products.limit) * 100),
            canAdd: products.allowed,
          },
          vendors: {
            current: vendors.current,
            limit: vendors.limit,
            percentage: Math.round((vendors.current / vendors.limit) * 100),
            canAdd: vendors.allowed,
          },
          resellers: {
            current: resellers.current,
            limit: resellers.limit,
            percentage: Math.round((resellers.current / resellers.limit) * 100),
            canAdd: resellers.allowed,
          },
          stockItems: {
            current: stockItems.current,
            limit: stockItems.limit,
            percentage: Math.round((stockItems.current / stockItems.limit) * 100),
            canAdd: stockItems.allowed,
          },
        },
      });
    } catch (error) {
      console.error('Failed to fetch usage stats:', error);
      res.status(500).json({ error: "Failed to fetch usage stats" });
    }
  });
  
  // Global Search - Search across all entities
  app.get("/api/search", async (req, res) => {
    try {
      const query = (req.query.q as string || '').toLowerCase().trim();
      
      if (!query || query.length < 2) {
        return res.json({ results: [] });
      }

      const userId = req.user!.id;
      const [products, vendors, stockItems, salesResult, deliveriesResult] = await Promise.all([
        storage.getProducts(userId),
        storage.getVendors(userId),
        storage.getStockItems(userId),
        storage.getSales(userId),
        storage.getDeliveries(userId, 1000, 0), // Get all for search (up to 1000)
      ]);
      
      const sales = salesResult.data;
      const deliveries = deliveriesResult.data;

      const results: any[] = [];

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
            (vendor.phone && vendor.phone.toLowerCase().includes(query))) {
          results.push({
            id: vendor.id,
            type: 'vendor',
            title: vendor.name,
            subtitle: vendor.phone || vendor.address || '',
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
  app.get("/api/products", requireAuth, async (req, res) => {
    try {
      const cacheKey = cache.KEYS.PRODUCTS_LIST + `:${req.user!.id}`;
      
      // Try to get from cache first
      const cached = await cache.get(cacheKey);
      if (cached) {
        return res.json(cached);
      }
      
      // Cache miss - fetch from database
      const products = await storage.getProducts(req.user!.id);
      
      // Store in cache for 5 minutes
      await cache.set(cacheKey, products, cache.TTL.MEDIUM);
      
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  app.post("/api/products", requireAuth, blockExpiredTrial, enforceProductLimit, async (req, res) => {
    try {
      // enforceProductLimit middleware already checks limits - no need for duplicate check here
      
      const productSchema = insertProductSchema.extend({
        unitsPerBatch: z.string(),
        labourCost: z.string(),
        otherCosts: z.string(),
        packagingCost: z.string(),
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
      
      // Validate recipe before processing
      const validation = await storage.validateRecipe(req.user!.id, recipeItems);
      if (!validation.valid) {
        return res.status(400).json({ 
          error: "Recipe validation failed", 
          details: validation.errors.filter(e => !e.startsWith("Warning:"))
        });
      }
      
      // Calculate materials cost from recipe items WITH UNIT CONVERSION
      let materialsCost = 0;
      const recipeItemsWithCost = [];
      
      // Batch fetch all stock items first (optimization: 1 query instead of N)
      const stockItemIds = recipeItems.map(item => item.stockItemId);
      const stockItemsData = await storage.getStockItemsByIds(stockItemIds, req.user!.id);
      const stockItemsMap = Object.fromEntries(stockItemsData.map(s => [s.id, s]));
      
      for (const item of recipeItems) {
        const stockItem = stockItemsMap[item.stockItemId];
        if (stockItem) {
          const recipeQuantity = parseFloat(item.quantityNeeded) || 0;
          const usageUnit = item.usageUnit || stockItem.unit; // Default to stock unit if not provided
          
          // VALIDATION: Check if unit conversion is possible
          const from = usageUnit.toLowerCase().trim();
          const to = stockItem.unit.toLowerCase().trim();
          
          if (from !== to && (!UNIT_CONVERSIONS[from] || !UNIT_CONVERSIONS[from][to])) {
            return res.status(400).json({
              error: `Unit conversion error: Cannot convert from "${usageUnit}" to "${stockItem.unit}" for ingredient "${stockItem.name}". Please use compatible units.`,
              invalidRecipeItem: {
                stockItemName: stockItem.name,
                recipeUnit: usageUnit,
                stockUnit: stockItem.unit,
              }
            });
          }
          
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
      
      // Calculate total cost per batch (including packaging)
      const labourCost = parseFloat(productData.labourCost) || 0;
      const otherCosts = parseFloat(productData.otherCosts) || 0;
      const packagingCost = parseFloat(productData.packagingCost) || 0;
      const unitsPerBatch = parseInt(productData.unitsPerBatch) || 1;
      
      // Packaging cost is per unit, so multiply by units per batch
      const totalPackagingCost = packagingCost * unitsPerBatch;
      
      const totalCostPerBatch = materialsCost + labourCost + otherCosts + totalPackagingCost;
      
      // Calculate cost per unit
      const costPerUnit = unitsPerBatch > 0 ? totalCostPerBatch / unitsPerBatch : 0;
      
      const product = await storage.createProduct(
        req.user!.id,
        {
          ...productData,
          unitsPerBatch: unitsPerBatch,
          labourCost: labourCost.toFixed(2),
          otherCosts: otherCosts.toFixed(2),
          packagingCost: packagingCost.toFixed(2),
          materialsCost: materialsCost.toFixed(2),
          totalCostPerBatch: totalCostPerBatch.toFixed(2),
          costPerUnit: costPerUnit.toFixed(2),
        },
        recipeItemsWithCost
      );
      
      // Invalidate products cache
      await cache.del(`${cache.KEYS.PRODUCTS_LIST}:${req.user!.id}`);
      await cache.del(`${cache.KEYS.DASHBOARD_STATS}:${req.user!.id}`);
      
      res.json(product);
    } catch (error) {
      console.error("Product creation error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: error.errors 
        });
      }
      res.status(400).json({ error: "Invalid product data" });
    }
  });

  app.put("/api/products/:id", requireAuth, async (req, res) => {
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
      
      // Validate recipe if provided
      if (recipeItems && recipeItems.length > 0) {
        const validation = await storage.validateRecipe(req.user!.id, recipeItems);
        if (!validation.valid) {
          return res.status(400).json({ 
            error: "Recipe validation failed", 
            details: validation.errors.filter(e => !e.startsWith("Warning:"))
          });
        }
      }
      
      // Calculate materials cost from recipe items WITH UNIT CONVERSION if provided
      let materialsCost = 0;
      let recipeItemsWithCost: any[] = [];
      
      if (recipeItems && recipeItems.length > 0) {
        // Batch fetch all stock items first (optimization: 1 query instead of N)
        const stockItemIds = recipeItems.map(item => item.stockItemId);
        const stockItemsData = await storage.getStockItemsByIds(stockItemIds, req.user!.id);
        const stockItemsMap = Object.fromEntries(stockItemsData.map(s => [s.id, s]));
        
        for (const item of recipeItems) {
          const stockItem = stockItemsMap[item.stockItemId];
          if (stockItem) {
            const recipeQuantity = parseFloat(item.quantityNeeded) || 0;
            const usageUnit = item.usageUnit || stockItem.unit;
            
            // VALIDATION: Check if unit conversion is possible
            const from = usageUnit.toLowerCase().trim();
            const to = stockItem.unit.toLowerCase().trim();
            
            if (from !== to && (!UNIT_CONVERSIONS[from] || !UNIT_CONVERSIONS[from][to])) {
              return res.status(400).json({
                error: `Unit conversion error: Cannot convert from "${usageUnit}" to "${stockItem.unit}" for ingredient "${stockItem.name}". Please use compatible units.`,
                invalidRecipeItem: {
                  stockItemName: stockItem.name,
                  recipeUnit: usageUnit,
                  stockUnit: stockItem.unit,
                }
              });
            }
            
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
        
        // Calculate total cost per batch (including packaging)
        const labourCost = parseFloat(productData.labourCost as string) || 0;
        const otherCosts = parseFloat(productData.otherCosts as string) || 0;
        const packagingCost = parseFloat(productData.packagingCost as string) || 0;
        const unitsPerBatch = parseInt(productData.unitsPerBatch as string) || 1;
        
        // Packaging cost is per unit, so multiply by units per batch
        const totalPackagingCost = packagingCost * unitsPerBatch;
        
        const totalCostPerBatch = materialsCost + labourCost + otherCosts + totalPackagingCost;
        
        // Calculate cost per unit
        const costPerUnit = unitsPerBatch > 0 ? totalCostPerBatch / unitsPerBatch : 0;
        
        const updateData: any = {
          ...productData,
          unitsPerBatch: unitsPerBatch,
          labourCost: labourCost.toFixed(2),
          otherCosts: otherCosts.toFixed(2),
          packagingCost: packagingCost.toFixed(2),
          materialsCost: materialsCost.toFixed(2),
          totalCostPerBatch: totalCostPerBatch.toFixed(2),
          costPerUnit: costPerUnit.toFixed(2),
        };
        
        const product = await storage.updateProduct(
          req.user!.id,
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
        
        const product = await storage.updateProduct(req.user!.id, id, updateData, undefined);
        res.json(product);
      }
    } catch (error) {
      console.error("Product update error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: error.errors 
        });
      }
      res.status(400).json({ error: "Invalid product data" });
    }
  });

  app.delete("/api/products/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteProduct(req.user!.id, id);
      
      // Invalidate products cache
      await cache.del(`${cache.KEYS.PRODUCTS_LIST}:${req.user!.id}`);
      await cache.del(`${cache.KEYS.DASHBOARD_STATS}:${req.user!.id}`);
      
      res.json({ success: true });
    } catch (error) {
      console.error("Product deletion error:", error);
      res.status(500).json({ error: "Failed to delete product" });
    }
  });

  app.get("/api/recipe-items/:productId", requireAuth, async (req, res) => {
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
  app.get("/api/production", requireAuth, async (req, res) => {
    try {
      const batches = await storage.getProductionBatches(req.user!.id);
      
      // Enrich batches with product details (unitsPerBatch) for display
      const enrichedBatches = await Promise.all(
        batches.map(async (batch) => {
          const product = await storage.getProduct(req.user!.id, batch.productId);
          return {
            ...batch,
            unitsPerBatch: product?.unitsPerBatch || 1,
          };
        })
      );
      
      res.json(enrichedBatches);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch production batches" });
    }
  });

  app.post("/api/production", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const data = insertProductionBatchSchema.parse(req.body);
      const batch = await storage.createProductionBatch(req.user!.id, data);
      res.json(batch);
    } catch (error) {
      res.status(400).json({ error: "Invalid batch data" });
    }
  });

  // Production Planning - Preview materials needed and check stock
  app.post("/api/production/plan-preview", requireAuth, async (req, res) => {
    try {
      const { productId, quantity } = req.body;
      
      if (!productId || !quantity) {
        return res.status(400).json({ error: "Product ID and quantity are required" });
      }

      // Get product details
      const product = await storage.getProduct(req.user!.id, productId);
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
        const stockItem = await storage.getStockItem(req.user!.id, item.stockItemId);
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
        quantity, // Number of batches
        totalUnits: quantity * product.unitsPerBatch, // Total units to be produced
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
      const product = await storage.getProduct(req.user!.id, productId);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      // Verify stock availability again before deduction
      const recipeItems = await storage.getRecipeItems(productId);
      const { convertUnit } = await import("@shared/schema");

      for (const item of recipeItems) {
        const stockItem = await storage.getStockItem(req.user!.id, item.stockItemId);
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
      // quantity = number of batches to produce
      // totalUnits = total units produced (quantity * unitsPerBatch)
      const totalUnits = quantity * product.unitsPerBatch;
      
      const batchData = {
        productId,
        productName: product.name,
        quantity: totalUnits, // Store total units produced
        remainingQty: totalUnits.toString(), // Initialize with full quantity in units
        batchDate,
        expiryDate: expiryDate || null,
        totalCost: (parseFloat(product.totalCostPerBatch) * quantity).toString(),
        notes: notes || null
      };

      const batch = await storage.createProductionBatch(req.user!.id, batchData);

      // Deduct stock for each material
      for (const item of recipeItems) {
        const stockItem = await storage.getStockItem(req.user!.id, item.stockItemId);
        if (!stockItem) continue;

        const quantityNeeded = parseFloat(item.quantityNeeded) * quantity;
        const convertedQuantity = convertUnit(
          quantityNeeded,
          item.usageUnit.toLowerCase(),
          stockItem.unit.toLowerCase()
        );

        const newQuantity = parseFloat(stockItem.currentQuantity) - convertedQuantity;

        await storage.updateStockItem(req.user!.id, item.stockItemId, {
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
  app.get("/api/finished-products", requireAuth, async (req, res) => {
    try {
      const summary = await storage.getFinishedProductsSummary(req.user!.id);
      
      // Enrich with product details (unitsPerBatch)
      const enrichedSummary = await Promise.all(
        summary.map(async (item) => {
          const product = await storage.getProduct(req.user!.id, item.productId);
          return {
            ...item,
            unitsPerBatch: product?.unitsPerBatch || 1,
          };
        })
      );
      
      res.json(enrichedSummary);
    } catch (error) {
      console.error("Finished products summary error:", error);
      res.status(500).json({ error: "Failed to fetch finished products summary" });
    }
  });

  // Get low finished products (total quantity < 10)
  app.get("/api/finished-products/low", requireAuth, async (req, res) => {
    try {
      const summary = await storage.getFinishedProductsSummary(req.user!.id);
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

  app.get("/api/finished-products/:productId/batches", requireAuth, async (req, res) => {
    try {
      const { productId } = req.params;
      const batches = await storage.getBatchesByProduct(req.user!.id, productId);
      
      // Enrich with product details
      const product = await storage.getProduct(req.user!.id, productId);
      const enrichedBatches = batches.map(batch => ({
        ...batch,
        unitsPerBatch: product?.unitsPerBatch || 1,
      }));
      
      res.json(enrichedBatches);
    } catch (error) {
      console.error("Batches by product error:", error);
      res.status(500).json({ error: "Failed to fetch batches" });
    }
  });

  // Preview batch deduction (FIFO simulation without actual deduction)
  app.post("/api/batches/preview", requireAuth, async (req, res) => {
    try {
      const { productId, quantity } = req.body;
      
      if (!productId || !quantity) {
        return res.status(400).json({ error: "Product ID and quantity are required" });
      }
      
      const preview = await storage.previewBatchDeduction(req.user!.id, productId, parseFloat(quantity));
      res.json(preview);
    } catch (error) {
      console.error("Batch preview error:", error);
      res.status(500).json({ error: "Failed to preview batch deduction" });
    }
  });

  // Vendors
  app.get("/api/vendors", requireAuth, async (req, res) => {
    try {
      const vendors = await storage.getVendors(req.user!.id);
      res.json(vendors);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch vendors" });
    }
  });

  app.post("/api/vendors", requireAuth, blockExpiredTrial, enforceVendorLimit, async (req, res) => {
    try {
      const data = insertVendorSchema.parse(req.body);
      const vendor = await storage.createVendor(req.user!.id, data);
      res.json(vendor);
    } catch (error) {
      res.status(400).json({ error: "Invalid vendor data" });
    }
  });

  // Suppliers (Pembekal untuk Purchase Orders)
  app.get("/api/suppliers", requireAuth, async (req, res) => {
    try {
      const suppliers = await storage.getSuppliers(req.user!.id);
      res.json(suppliers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch suppliers" });
    }
  });

  app.post("/api/suppliers", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const data = insertSupplierSchema.parse(req.body);
      const supplier = await storage.createSupplier(req.user!.id, data);
      res.json(supplier);
    } catch (error) {
      res.status(400).json({ error: "Invalid supplier data" });
    }
  });

  app.patch("/api/suppliers/:id", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const { id } = req.params;
      const data = insertSupplierSchema.partial().parse(req.body);
      const supplier = await storage.updateSupplier(req.user!.id, id, data);
      res.json(supplier);
    } catch (error) {
      res.status(400).json({ error: "Invalid supplier data" });
    }
  });

  app.delete("/api/suppliers/:id", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteSupplier(req.user!.id, id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete supplier" });
    }
  });

  // Vendor Commissions
  app.get("/api/vendors/:vendorId/commission", requireAuth, async (req, res) => {
    try {
      const { vendorId } = req.params;
      const commission = await storage.getVendorCommission(req.user!.id, vendorId);
      res.json(commission || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch vendor commission" });
    }
  });

  app.post("/api/vendors/:vendorId/commission", requireAuth, async (req, res) => {
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
      
      const commission = await storage.createOrUpdateVendorCommission(req.user!.id, data);
      res.json(commission);
    } catch (error: any) {
      console.error("Commission update error:", error);
      res.status(400).json({ error: "Invalid commission data", message: error.message });
    }
  });

  app.delete("/api/vendors/:vendorId/commission", requireAuth, async (req, res) => {
    try {
      const { vendorId } = req.params;
      await storage.deleteVendorCommission(req.user!.id, vendorId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete commission" });
    }
  });

  // Stock Items (Warehouse Inventory)
  app.get("/api/stock", requireAuth, async (req, res) => {
    try {
      const items = await storage.getStockItems(req.user!.id);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stock items" });
    }
  });

  app.get("/api/stock/low", requireAuth, async (req, res) => {
    try {
      const items = await storage.getLowStockItems(req.user!.id);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch low stock items" });
    }
  });

  app.get("/api/stock/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const item = await storage.getStockItem(req.user!.id, id);
      if (!item) {
        return res.status(404).json({ error: "Stock item not found" });
      }
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stock item" });
    }
  });

  app.post("/api/stock", requireAuth, blockExpiredTrial, enforceStockLimit, async (req, res) => {
    try {
      console.log("📦 POST /api/stock - Request body:", JSON.stringify(req.body, null, 2));
      const data = insertStockItemSchema.parse(req.body);
      console.log("✅ Validation passed, creating stock item...");
      const item = await storage.createStockItem(req.user!.id, data);
      console.log("✅ Stock item created:", item.id);
      res.json(item);
    } catch (error: any) {
      console.error("❌ POST /api/stock error:", error.message);
      if (error.issues) {
        console.error("Validation issues:", JSON.stringify(error.issues, null, 2));
      }
      res.status(400).json({ error: "Invalid stock item data", message: error.message, issues: error.issues });
    }
  });

  app.patch("/api/stock/:id", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const { id } = req.params;
      const { expectedVersion, ...data } = req.body;
      const parsedData = insertStockItemSchema.partial().parse(data);
      const item = await storage.updateStockItem(req.user!.id, id, parsedData, expectedVersion);
      res.json(item);
    } catch (error: any) {
      if (error.message?.includes('modified by another user')) {
        return res.status(409).json({ error: "Conflict", message: error.message });
      }
      res.status(400).json({ error: "Invalid stock item data", message: error.message });
    }
  });
  
  // Stock Movement History (Audit Trail)
  app.get("/api/stock/:id/movements", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const movements = await storage.getStockMovements(req.user!.id, id);
      res.json(movements);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stock movements" });
    }
  });
  
  app.get("/api/stock-movements", requireAuth, async (req, res) => {
    try {
      const movements = await storage.getStockMovements(req.user!.id);
      res.json(movements);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stock movements" });
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
      const currentItem = await storage.getStockItem(req.user!.id, id);
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
      const updatedItem = await storage.updateStockItem(req.user!.id, id, updateData);
      res.json(updatedItem);
    } catch (error: any) {
      console.error("Stock replenishment error:", error);
      res.status(400).json({ error: "Failed to replenish stock", message: error.message });
    }
  });

  app.delete("/api/stock/:id", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteStockItem(req.user!.id, id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete stock item" });
    }
  });

  // Stock Import/Export
  app.get("/api/stock/export/excel", requireAuth, async (req, res) => {
    try {
      const items = await storage.getStockItems(req.user!.id);
      
      // Prepare data for Excel export
      const exportData = items.map(item => ({
        'Item Name': item.name,
        'Unit': item.unit,
        'Package Size': item.packageSize,
        'Purchase Price (RM)': item.purchasePrice,
        'Current Quantity': item.currentQuantity,
        'Low Stock Threshold': item.lowStockThreshold,
        'Notes': item.notes || '',
      }));

      res.json({
        data: exportData,
        filename: `stock-items-${new Date().toISOString().split('T')[0]}.xlsx`
      });
    } catch (error: any) {
      console.error("Export error:", error);
      res.status(500).json({ error: "Failed to export stock items", message: error.message });
    }
  });

  app.post("/api/stock/import", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const importSchema = z.object({
        items: z.array(z.object({
          name: z.string().min(1, "Item name is required"),
          unit: z.string().min(1, "Unit is required"),
          packageSize: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
            message: "Package size must be a positive number",
          }),
          purchasePrice: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
            message: "Purchase price must be a positive number",
          }),
          currentQuantity: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
            message: "Current quantity must be a non-negative number",
          }),
          lowStockThreshold: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
            message: "Low stock threshold must be a non-negative number",
          }),
          notes: z.string().optional(),
        })),
        mode: z.enum(['replace', 'append']).default('append'),
      });

      const { items: importItems, mode } = importSchema.parse(req.body);

      // If mode is 'replace', delete existing items first (OPTIMIZED: batch delete)
      if (mode === 'replace') {
        await storage.deleteAllStockItems(req.user!.id);
      }

      // Import new items
      const results = {
        success: 0,
        failed: 0,
        errors: [] as any[],
      };

      for (let i = 0; i < importItems.length; i++) {
        try {
          const item = importItems[i];
          
          // Check for duplicates when appending
          if (mode === 'append') {
            const existingItems = await storage.getStockItems(req.user!.id);
            const duplicate = existingItems.find(
              existing => existing.name.toLowerCase() === item.name.toLowerCase()
            );
            
            if (duplicate) {
              results.errors.push({
                row: i + 2, // +2 because row 1 is header and array is 0-indexed
                name: item.name,
                error: 'Item already exists (duplicate name)',
              });
              results.failed++;
              continue;
            }
          }

          await storage.createStockItem(req.user!.id, {
            name: item.name,
            unit: item.unit,
            packageSize: item.packageSize,
            purchasePrice: item.purchasePrice,
            currentQuantity: item.currentQuantity,
            lowStockThreshold: item.lowStockThreshold,
            notes: item.notes || null,
          });
          
          results.success++;
        } catch (error: any) {
          results.failed++;
          results.errors.push({
            row: i + 2,
            name: importItems[i].name,
            error: error.message,
          });
        }
      }

      res.json({
        message: `Import completed: ${results.success} success, ${results.failed} failed`,
        results,
      });
    } catch (error: any) {
      console.error("Import error:", error);
      
      // Check if it's a validation error
      if (error.errors && Array.isArray(error.errors)) {
        return res.status(400).json({ 
          error: "Invalid import data format", 
          details: error.errors 
        });
      }
      
      res.status(400).json({ 
        error: "Failed to import stock items", 
        message: error.message 
      });
    }
  });

  // Categories
  app.get("/api/categories", requireAuth, async (req, res) => {
    try {
      const categories = await storage.getCategories(req.user!.id);
      res.json(categories);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  app.post("/api/categories", requireAuth, async (req, res) => {
    try {
      const data = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(req.user!.id, data);
      res.json(category);
    } catch (error: any) {
      res.status(400).json({ error: "Invalid category data", message: error.message });
    }
  });

  // Deliveries
  app.get("/api/deliveries", requireAuth, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const result = await storage.getDeliveries(req.user!.id, limit, offset);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch deliveries" });
    }
  });

  app.get("/api/deliveries/recent", requireAuth, async (req, res) => {
    try {
      const result = await storage.getDeliveries(req.user!.id, 5, 0);
      res.json(result.data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch recent deliveries" });
    }
  });

  app.get("/api/deliveries/last/:vendorId", requireAuth, async (req, res) => {
    try {
      const { vendorId } = req.params;
      const lastDelivery = await storage.getLastDeliveryForVendor(req.user!.id, vendorId);
      
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
      });
      
      const data = deliverySchema.parse(req.body);
      const { items, ...deliveryData } = data;
      
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
        const deductionResult = await storage.deductFromBatches(req.user!.id, item.productId, item.quantity);
        if (!deductionResult.success) {
          return res.status(400).json({ 
            error: `Stok siap tidak mencukupi untuk ${item.productName}. Diperlukan: ${item.quantity}`,
            details: deductionResult
          });
        }
      }
      
      const newDelivery = await storage.createDelivery(req.user!.id, deliveryData, deliveryItems);
      
      // Fetch full delivery with items and vendor details for invoice dialog
      const deliveryWithItems = await storage.getDelivery(req.user!.id, newDelivery.id);
      const vendor = await storage.getVendor(req.user!.id, newDelivery.vendorId);
      
      // Return delivery with vendor phone and items for invoice dialog
      res.json({
        ...deliveryWithItems,
        vendorPhone: vendor?.phone,
        vendorAddress: vendor?.address,
      });
    } catch (error: any) {
      // Handle duplicate invoice number (concurrent requests)
      // This is expected when user clicks multiple times - don't log error
      if (error.code === '23505' && error.constraint === 'deliveries_invoice_number_unique') {
        return res.status(409).json({ 
          error: "Penghantaran sedang diproses. Sila tunggu sebentar.",
          code: "DUPLICATE_REQUEST"
        });
      }
      
      // Log other errors only
      console.error("Delivery creation error:", error);
      
      if (error.message) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(400).json({ error: "Data penghantaran tidak sah atau stok tidak mencukupi" });
      }
    }
  });

  app.patch("/api/deliveries/:id/status", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      await storage.updateDeliveryStatus(req.user!.id, id, status);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: "Failed to update status" });
    }
  });

  app.patch("/api/delivery-items/:itemId/rejection", requireAuth, async (req, res) => {
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
        req.user!.id,
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
      
      const result = await storage.getSales(req.user!.id, limit, offset);
      res.json(result);
    } catch (error) {
      console.error('[ERROR] GET /api/sales failed:', error);
      res.status(500).json({ error: "Failed to fetch sales" });
    }
  });

  app.get("/api/sales/:id", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const { id } = req.params;
      const sale = await storage.getSale(req.user!.id, id);
      
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
        pointsRedemption: z.object({
          customerId: z.string(),
          points: z.number().positive(),
          discount: z.number().positive(),
        }).nullable().optional(),
        voucherRedemption: z.object({
          voucherId: z.string(),
          customerId: z.string().nullable().optional(),
          code: z.string(),
          originalAmount: z.number().positive(),
          discount: z.number().positive(),
        }).nullable().optional(),
      });
      
      const validated = saleCreateSchema.parse(req.body);
      
      // Validate and redeem points BEFORE creating sale
      if (validated.pointsRedemption) {
        const { customerId, points, discount } = validated.pointsRedemption;
        
        // Verify customer exists and has enough points
        const [customer] = await db.select().from(customers).where(eq(customers.id, customerId));
        if (!customer) {
          return res.status(400).json({ error: "Customer not found" });
        }
        if (customer.loyaltyPoints < points) {
          return res.status(400).json({ error: "Insufficient loyalty points" });
        }
        
        // Redeem points before sale creation
        try {
          await storage.redeemPoints(req.user!.id, customerId, points, `Tebusan diskaun: RM${discount.toFixed(2)}`);
        } catch (redeemError: any) {
          console.error('Failed to redeem points:', redeemError);
          return res.status(400).json({ error: redeemError.message || "Failed to redeem points" });
        }
      }

      // Validate and redeem voucher BEFORE creating sale
      let voucherRedemptionData: any = null;
      if (validated.voucherRedemption) {
        // Vouchers are disabled for launch
        return res.status(403).json({ message: "Voucher feature is currently disabled for launch" });
        const { voucherId, customerId, originalAmount, discount } = validated.voucherRedemption;
        
        try {
          // Redeem voucher atomically
          const finalAmount = originalAmount - discount;
          await storage.redeemVoucher(
            req.user!.id,
            voucherId,
            customerId || null,
            null, // saleId will be null initially, could update later if needed
            originalAmount,
            finalAmount,
            discount
          );
          voucherRedemptionData = validated.voucherRedemption;
        } catch (voucherError: any) {
          console.error('Failed to redeem voucher:', voucherError);
          
          // If voucher redemption fails after points redemption, refund points
          if (validated.pointsRedemption) {
            const { customerId, points } = validated.pointsRedemption;
            try {
              await storage.awardPoints(
                req.user!.id,
                customerId,
                points,
                null,
                "Refund - voucher gagal ditebus"
              );
            } catch (refundError) {
              console.error('Failed to refund points after voucher error:', refundError);
            }
          }
          
          return res.status(400).json({ error: voucherError.message || "Failed to redeem voucher" });
        }
      }
      
      // Create sale with FIFO stock deduction (atomic transaction)
      let sale;
      try {
        sale = await storage.createSale(req.user!.id, validated.sale, validated.items);
      } catch (saleError: any) {
        // If sale creation fails after redemption, we need to reverse the redemption
        if (validated.pointsRedemption) {
          const { customerId, points } = validated.pointsRedemption;
          try {
            await storage.awardPoints(
              req.user!.id,
              customerId,
              points,
              null,
              "Refund - sale gagal dibuat"
            );
          } catch (refundError) {
            console.error('Failed to refund points after sale error:', refundError);
          }
        }
        
        // Note: Voucher redemption cannot be easily reversed since it updates usage count
        // In production, you might want to implement a more sophisticated reversal mechanism
        // For now, voucher usage is atomic and will remain counted even if sale fails
        
        throw saleError;
      }
      
      // Auto-award loyalty points if customer is linked (RM1 = 1 point)
      if (validated.sale.customerId) {
        const totalAmount = parseFloat(validated.sale.totalAmount || "0");
        const pointsToAward = Math.floor(totalAmount); // RM1 = 1 point
        
        if (pointsToAward > 0) {
          try {
            await storage.awardPoints(
              req.user!.id,
              validated.sale.customerId,
              pointsToAward,
              sale.id,
              `Pembelian #${sale.receiptNumber}: RM${totalAmount.toFixed(2)}`
            );
          } catch (pointsError) {
            console.error('Failed to award loyalty points:', pointsError);
            // Don't fail the sale if points award fails
          }
        }
      }
      
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
  app.get("/api/expenses", requireAuth, async (req, res) => {
    try {
      const expenses = await storage.getExpenses(req.user!.id);
      res.json(expenses);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch expenses" });
    }
  });

  app.post("/api/expenses", requireAuth, async (req, res) => {
    try {
      const data = insertExpenseSchema.parse(req.body);
      const expense = await storage.createExpense(req.user!.id, data);
      res.json(expense);
    } catch (error) {
      res.status(400).json({ error: "Invalid expense data" });
    }
  });

  // Dashboard
  app.get("/api/dashboard/stats", requireAuth, async (req, res) => {
    try {
      const cacheKey = cache.KEYS.DASHBOARD_STATS + `:${req.user!.id}`;
      
      // Try to get from cache first
      const cached = await cache.get(cacheKey);
      if (cached) {
        return res.json(cached);
      }
      
      // Cache miss - fetch from database
      const stats = await storage.getDashboardStats(req.user!.id);
      
      // Store in cache for 2 minutes (dashboard data changes frequently)
      await cache.set(cacheKey, stats, cache.TTL.SHORT * 2); // 2 minutes
      
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  // Get user's current usage stats (for plan recommendations)
  app.get("/api/user/usage-stats", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      
      // Get counts of all resources
      const [
        productsCount,
        customersCount,
        vendorsCount,
        resellersCount,
        stockItemsCount,
      ] = await Promise.all([
        storage.getProductCount(userId),
        storage.getCustomers(userId).then(c => c.filter(x => !x.isArchived).length),
        storage.getVendors(userId).then(v => v.filter(x => !x.isArchived).length),
        storage.getResellers(userId).then(r => r.filter(x => !x.isArchived).length),
        storage.getStockItems(userId).then(s => s.filter(x => !x.isArchived).length),
      ]);

      // Get user's current plan
      const currentPlan = await getUserPlan(userId);
      
      // Determine recommended plan based on usage
      let recommendedPlan = 'basic';
      if (resellersCount > 0 || vendorsCount > 5 || productsCount > 50) {
        recommendedPlan = 'pro';
      }
      if (productsCount > 200 || vendorsCount > 20 || resellersCount > 10) {
        recommendedPlan = 'premium';
      }

      res.json({
        usage: {
          products: productsCount,
          customers: customersCount,
          vendors: vendorsCount,
          resellers: resellersCount,
          stockItems: stockItemsCount,
        },
        currentPlan: currentPlan?.displayName || 'No active plan',
        recommendedPlan,
        limits: {
          basic: { products: 50, customers: 200, vendors: 5, resellers: 0, stockItems: 100 },
          pro: { products: 200, customers: 1000, vendors: 20, resellers: 10, stockItems: 500 },
          premium: { products: 'Unlimited', customers: 'Unlimited', vendors: 'Unlimited', resellers: 'Unlimited', stockItems: 'Unlimited' },
        },
      });
    } catch (error) {
      console.error("Usage stats error:", error);
      res.status(500).json({ error: "Failed to fetch usage stats" });
    }
  });

  // Export products to CSV
  app.get("/api/export/products", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const products = await storage.getProducts(userId);
      
      // Generate CSV
      const headers = ['ID', 'Name', 'SKU', 'Category', 'Price', 'Cost', 'Stock', 'Unit', 'Status', 'Created At'];
      const rows = products.map(p => [
        p.id,
        p.name,
        p.sku || '',
        p.category || '',
        p.price,
        p.cost || '',
        p.stockQuantity || '',
        p.unit || '',
        p.isArchived ? 'Archived' : 'Active',
        p.createdAt?.toISOString() || '',
      ]);
      
      const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="products-${Date.now()}.csv"`);
      res.send(csv);
    } catch (error) {
      console.error("Export products error:", error);
      res.status(500).json({ error: "Failed to export products" });
    }
  });

  // Export vendors to CSV
  app.get("/api/export/vendors", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const vendors = await storage.getVendors(userId);
      
      const headers = ['ID', 'Name', 'Email', 'Phone', 'Company', 'Status', 'Created At'];
      const rows = vendors.map(v => [
        v.id,
        v.name,
        v.email || '',
        v.phone || '',
        v.company || '',
        v.isArchived ? 'Archived' : 'Active',
        v.createdAt?.toISOString() || '',
      ]);
      
      const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="vendors-${Date.now()}.csv"`);
      res.send(csv);
    } catch (error) {
      console.error("Export vendors error:", error);
      res.status(500).json({ error: "Failed to export vendors" });
    }
  });

  // Export customers to CSV
  app.get("/api/export/customers", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const customers = await storage.getCustomers(userId);
      
      const headers = ['ID', 'Name', 'Email', 'Phone', 'Address', 'Loyalty Points', 'Status', 'Created At'];
      const rows = customers.map(c => [
        c.id,
        c.name,
        c.email || '',
        c.phone || '',
        c.address || '',
        c.loyaltyPoints || 0,
        c.isArchived ? 'Archived' : 'Active',
        c.createdAt?.toISOString() || '',
      ]);
      
      const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="customers-${Date.now()}.csv"`);
      res.send(csv);
    } catch (error) {
      console.error("Export customers error:", error);
      res.status(500).json({ error: "Failed to export customers" });
    }
  });

  // Export resellers to CSV
  app.get("/api/export/resellers", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const resellers = await storage.getResellers(userId);
      
      const headers = ['ID', 'Name', 'Email', 'Phone', 'Commission %', 'Status', 'Created At'];
      const rows = resellers.map(r => [
        r.id,
        r.name,
        r.email || '',
        r.phone || '',
        r.commissionPercentage || 0,
        r.isArchived ? 'Archived' : 'Active',
        r.createdAt?.toISOString() || '',
      ]);
      
      const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="resellers-${Date.now()}.csv"`);
      res.send(csv);
    } catch (error) {
      console.error("Export resellers error:", error);
      res.status(500).json({ error: "Failed to export resellers" });
    }
  });

  // Restore archived data (when user upgrades)
  app.post("/api/user/restore-data", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { restoreUserData } = await import("./archiving");
      
      const result = await restoreUserData(userId);
      
      res.json({
        success: true,
        restored: result,
        message: `Restored ${result.productsArchived} products, ${result.vendorsArchived} vendors, ${result.resellersArchived} resellers, ${result.customersArchived} customers, ${result.stockItemsArchived} stock items`,
      });
    } catch (error) {
      console.error("Restore data error:", error);
      res.status(500).json({ error: "Failed to restore data" });
    }
  });

  // Reports
  app.get("/api/reports/profit-loss", requireProPlan, async (req, res) => {
    try {
      const report = await storage.getProfitLossReport(req.user!.id);
      res.json(report);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch profit/loss report" });
    }
  });

  // Weekly profit summary with week-over-week comparison
  app.get("/api/reports/weekly-summary", requireAuth, async (req, res) => {
    try {
      const summary = await storage.getWeeklyProfitSummary(req.user!.id);
      res.json(summary);
    } catch (error) {
      console.error("Weekly summary error:", error);
      res.status(500).json({ error: "Failed to fetch weekly summary" });
    }
  });

  // Daily Task Checklist - auto-generate today's tasks
  app.get("/api/tasks/daily", requireAuth, async (req, res) => {
    try {
      const tasks = [];
      const today = new Date().toISOString().split('T')[0];

      // 1. Low stock items need restocking
      const lowStock = await storage.getLowStockItems(req.user!.id);
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
      const finishedProducts = await storage.getFinishedProductsSummary(req.user!.id);
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
      const claimsResult = await storage.getClaimsSummary(req.user!.id, 100, 0);
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
      const stats = await storage.getDashboardStats(req.user!.id);
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
  app.get("/api/reports/export-sales", requireAuth, async (req, res) => {
    try {
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      
      const sales = await storage.getAllSales(req.user!.id, startDate, endDate);
      
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

  app.get("/api/reports/export-deliveries", requireAuth, async (req, res) => {
    try {
      const deliveries = await storage.getAllDeliveries(req.user!.id);
      
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

  app.get("/api/reports/export-claims", requireAuth, async (req, res) => {
    try {
      const claimsResult = await storage.getClaimsSummary(req.user!.id, 1000, 0);
      
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
      const topProducts = await storage.getTopProducts(req.user!.id);
      res.json(topProducts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch top products" });
    }
  });

  app.get("/api/reports/top-vendors", requireProPlan, async (req, res) => {
    try {
      const topVendors = await storage.getTopVendors(req.user!.id);
      res.json(topVendors);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch top vendors" });
    }
  });

  app.get("/api/reports/monthly", requireAuth, async (req, res) => {
    try {
      // Return empty data for trial users instead of 403
      if (req.user!.isOnTrial) {
        return res.json([]);
      }
      
      const monthlyData = await storage.getMonthlyData(req.user!.id);
      res.json(monthlyData);
    } catch (error) {
      console.error("Monthly data error:", error);
      res.status(500).json({ error: "Failed to fetch monthly data" });
    }
  });

  // Advanced Analytics Endpoints
  app.get("/api/analytics/product-performance", requireAuth, requireAdvancedAnalytics, async (req, res) => {
    try {
      const analytics = await storage.getProductPerformanceAnalytics(req.user!.id);
      // Return empty structure if no data
      res.json(analytics || { mostProfitable: [], fastestSelling: [], mostRejected: [], allProducts: [] });
    } catch (error) {
      console.error("Product performance error:", error);
      // Return empty structure instead of 500 error
      res.json({ mostProfitable: [], fastestSelling: [], mostRejected: [], allProducts: [] });
    }
  });

  app.get("/api/analytics/vendor-leaderboard", requireAuth, requireAdvancedAnalytics, async (req, res) => {
    try {
      const leaderboard = await storage.getVendorPerformanceLeaderboard(req.user!.id);
      res.json(leaderboard);
    } catch (error) {
      console.error("Vendor leaderboard error:", error);
      res.status(500).json({ error: "Failed to fetch vendor leaderboard" });
    }
  });

  app.get("/api/analytics/agent-leaderboard", requireAuth, requireAdvancedAnalytics, async (req, res) => {
    try {
      const leaderboard = await storage.getAgentPerformanceLeaderboard(req.user!.id);
      res.json(leaderboard);
    } catch (error) {
      console.error("Agent leaderboard error:", error);
      res.status(500).json({ error: "Failed to fetch agent leaderboard" });
    }
  });

  app.get("/api/analytics/sales-trend", requireAuth, requireAdvancedAnalytics, async (req, res) => {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const trendData = await storage.getSalesTrendData(req.user!.id, days);
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
      
      const result = await storage.getClaimsSummary(req.user!.id, limit, offset);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch claims summary" });
    }
  });

  app.get("/api/claims/:vendorId/details", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const { vendorId } = req.params;
      const claimDetails = await storage.getClaimDetailsByVendor(req.user!.id, vendorId);
      res.json(claimDetails);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch claim details" });
    }
  });

  app.patch("/api/deliveries/:id/payment-status", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const { id } = req.params;
      const { paymentStatus } = req.body;
      const delivery = await storage.updateDeliveryPaymentStatus(req.user!.id, id, paymentStatus);
      res.json(delivery);
    } catch (error) {
      res.status(400).json({ error: "Failed to update payment status" });
    }
  });

  // Business Profile
  app.get("/api/business-profile", requireAuth, async (req, res) => {
    try {
      const profile = await storage.getBusinessProfile(req.user!.id);
      res.json(profile || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch business profile" });
    }
  });

  app.post("/api/business-profile", requireAuth, async (req, res) => {
    try {
      const data = insertBusinessProfileSchema.parse(req.body);
      const profile = await storage.createOrUpdateBusinessProfile(req.user!.id, data);
      res.json(profile);
    } catch (error) {
      res.status(400).json({ error: "Invalid business profile data" });
    }
  });

  // User Profile Management
  app.get("/api/user/profile", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUserById(req.user!.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      // Don't send password hash
      const { password, ...userProfile } = user;
      res.json(userProfile);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user profile" });
    }
  });

  // Get user subscriptions
  app.get("/api/user/subscriptions", requireAuth, async (req, res) => {
    try {
      const { userSubscriptions } = await import("@shared/schema");
      const { eq, desc } = await import("drizzle-orm");
      
      const subscriptions = await db
        .select()
        .from(userSubscriptions)
        .where(eq(userSubscriptions.userId, req.user!.id))
        .orderBy(desc(userSubscriptions.createdAt));
      
      res.json(subscriptions);
    } catch (error) {
      console.error("Failed to fetch subscriptions:", error);
      res.status(500).json({ error: "Failed to fetch subscriptions" });
    }
  });

  // Get user plan limits and usage
  app.get("/api/user/plan-limits", requireAuth, async (req, res) => {
    try {
      const { products: productsTable, stockItems, sales } = await import("@shared/schema");
      const { eq, count } = await import("drizzle-orm");
      
      // Get current usage
      const [productsCount] = await db
        .select({ count: count() })
        .from(productsTable)
        .where(eq(productsTable.userId, req.user!.id));

      const [stockCount] = await db
        .select({ count: count() })
        .from(stockItems)
        .where(eq(stockItems.userId, req.user!.id));

      const [transactionsCount] = await db
        .select({ count: count() })
        .from(sales)
        .where(eq(sales.userId, req.user!.id));

      // Get plan limits from feature gating
      const { getPlanLimits } = await import("./feature-gating");
      const limits = await getPlanLimits(req.user!.id);

      res.json({
        products: {
          current: productsCount.count,
          max: limits.maxProducts,
        },
        stockItems: {
          current: stockCount.count,
          max: limits.maxStockItems,
        },
        transactions: {
          current: transactionsCount.count,
          max: limits.maxTransactions,
        },
      });
    } catch (error) {
      console.error("Failed to fetch plan limits:", error);
      res.status(500).json({ error: "Failed to fetch plan limits" });
    }
  });

  app.patch("/api/user/profile", requireAuth, async (req, res) => {
    try {
      const updateSchema = z.object({
        fullName: z.string().min(1, "Nama penuh diperlukan").optional(),
        email: z.string().email("Email tidak sah").optional(),
      });
      
      const data = updateSchema.parse(req.body);
      
      // Map fullName to name (database field)
      const updateData: any = {};
      if (data.fullName) updateData.name = data.fullName;
      if (data.email) updateData.email = data.email;
      
      // Check if email already exists (if changing email)
      if (data.email && data.email !== req.user!.email) {
        const existingUser = await storage.getUserByEmail(data.email);
        if (existingUser) {
          return res.status(400).json({ error: "Email sudah digunakan" });
        }
      }
      
      const updatedUser = await storage.updateUserProfile(req.user!.id, updateData);
      const { password, ...userProfile } = updatedUser;
      res.json(userProfile);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Gagal mengemaskini profil" });
    }
  });

  app.post("/api/user/change-password", requireAuth, async (req, res) => {
    try {
      const passwordSchema = z.object({
        currentPassword: z.string().min(1, "Kata laluan semasa diperlukan"),
        newPassword: z.string().min(8, "Kata laluan baru mestilah sekurang-kurangnya 8 aksara"),
      });
      
      const { currentPassword, newPassword } = passwordSchema.parse(req.body);
      
      // Verify current password
      const user = await storage.getUserById(req.user!.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const validPassword = await bcrypt.compare(currentPassword, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: "Kata laluan semasa tidak tepat" });
      }
      
      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await storage.updateUserPassword(req.user!.id, hashedPassword);
      
      res.json({ message: "Kata laluan berjaya dikemaskini" });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Gagal menukar kata laluan" });
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
      const syncLog = await storage.logGoogleDriveSync(req.user!.id, {
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

  app.get("/api/google-drive/files", requireAuth, async (req, res) => {
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

  app.get("/api/google-drive/sync-logs", requireAuth, async (req, res) => {
    try {
      const logs = await storage.getGoogleDriveSyncLogs(req.user!.id);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch sync logs" });
    }
  });

  app.get("/api/google-drive/sync-logs/:deliveryId", requireAuth, async (req, res) => {
    try {
      const { deliveryId } = req.params;
      const logs = await storage.getGoogleDriveSyncLogsByDelivery(req.user!.id, deliveryId);
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
      const userTiers = await storage.getPricingTiers(req.user!.id);
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
      
      const tier = await storage.createPricingTier(req.user!.id, tierData);
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
      const allTiers = await storage.getPricingTiers(req.user!.id);
      const existingTier = allTiers.find(t => t.id === id);
      
      if (!existingTier) {
        return res.status(404).json({ message: "Pricing tier not found" });
      }
      
      const updatedTier = await storage.updatePricingTier(req.user!.id, id, validatedData);
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
  app.get("/api/resellers", requireAuth, blockExpiredTrial, requireResellerNetwork, async (req, res) => {
    try {
      const userResellers = await storage.getResellers(req.user!.id);
      res.json(userResellers);
    } catch (error: any) {
      console.error("Get resellers error:", error);
      res.status(500).json({ message: error.message || "Failed to fetch resellers" });
    }
  });
  
  // Create new reseller
  app.post("/api/resellers", requireAuth, blockExpiredTrial, requireResellerNetwork, enforceResellerLimit, async (req, res) => {
    try {
      const validatedData = insertResellerSchema.parse(req.body);
      
      // Add userId from authenticated user
      const resellerData = {
        ...validatedData,
        userId: req.user!.id,
      };
      
      const reseller = await storage.createReseller(req.user!.id, resellerData);
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
  app.patch("/api/resellers/:id", requireAuth, blockExpiredTrial, requireResellerNetwork, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertResellerSchema.partial().parse(req.body);
      
      // Verify reseller belongs to user
      const allResellers = await storage.getResellers(req.user!.id);
      const existingReseller = allResellers.find(r => r.id === id);
      
      if (!existingReseller) {
        return res.status(404).json({ message: "Reseller not found" });
      }
      
      const updatedReseller = await storage.updateReseller(req.user!.id, id, validatedData);
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
  app.delete("/api/resellers/:id", requireAuth, blockExpiredTrial, requireResellerNetwork, async (req, res) => {
    try {
      const { id } = req.params;
      
      // Verify reseller belongs to user
      const allResellers = await storage.getResellers(req.user!.id);
      const existingReseller = allResellers.find(r => r.id === id);
      
      if (!existingReseller) {
        return res.status(404).json({ message: "Reseller not found" });
      }
      
      await storage.deleteReseller(req.user!.id, id);
      res.json({ message: "Reseller deleted successfully" });
    } catch (error: any) {
      console.error("Delete reseller error:", error);
      res.status(500).json({ message: error.message || "Failed to delete reseller" });
    }
  });
  
  // Get reseller stats
  app.get("/api/resellers/:id/stats", requireAuth, blockExpiredTrial, requireResellerNetwork, async (req, res) => {
    try {
      const { id } = req.params;
      
      // Verify reseller belongs to user
      const allResellers = await storage.getResellers(req.user!.id);
      const existingReseller = allResellers.find(r => r.id === id);
      
      if (!existingReseller) {
        return res.status(404).json({ message: "Reseller not found" });
      }
      
      const stats = await storage.getResellerStats(req.user!.id, id);
      res.json(stats);
    } catch (error: any) {
      console.error("Get reseller stats error:", error);
      res.status(500).json({ message: error.message || "Failed to fetch reseller stats" });
    }
  });
  
  // ========== Reseller Transfers Routes ==========
  
  // Get all reseller transfers with pagination
  app.get("/api/reseller-transfers", requireAuth, blockExpiredTrial, requireResellerNetwork, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const result = await storage.getResellerTransfers(req.user!.id, limit, offset);
      
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
  app.get("/api/reseller-transfers/:id", requireAuth, blockExpiredTrial, requireResellerNetwork, async (req, res) => {
    try {
      const { id } = req.params;
      const transfer = await storage.getResellerTransferById(req.user!.id, id);
      
      if (!transfer) {
        return res.status(404).json({ message: "Transfer not found" });
      }
      
      res.json(transfer);
    } catch (error: any) {
      console.error("Get reseller transfer error:", error);
      res.status(500).json({ message: error.message || "Failed to fetch reseller transfer" });
    }
  });
  
  // Create new reseller transfer with FIFO stock deduction
  app.post("/api/reseller-transfers", requireAuth, blockExpiredTrial, requireResellerNetwork, async (req, res) => {
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
      const allResellers = await storage.getResellers(req.user!.id);
      const reseller = allResellers.find(r => r.id === validatedData.resellerId);
      
      if (!reseller) {
        return res.status(404).json({ message: "Reseller not found" });
      }
      
      // Get reseller's pricing tier
      let tier = null;
      if (reseller.pricingTierId) {
        const allTiers = await storage.getPricingTiers(req.user!.id);
        tier = allTiers.find(t => t.id === reseller.pricingTierId);
      }
      
      // Process each item and deduct from batches using FIFO
      const processedItems = [];
      
      for (const item of validatedData.items) {
        // Deduct from batches using FIFO
        const deductionResult = await storage.deductFromBatches(req.user!.id, item.productId, item.quantity);
        
        if (!deductionResult.success) {
          return res.status(400).json({ 
            error: "Insufficient stock",
            message: `Insufficient stock for product: ${item.productName}. Available quantity is less than ${item.quantity}.`,
            productName: item.productName,
          });
        }
        
        // Get product to calculate tier price
        const product = await storage.getProduct(req.user!.id, item.productId);
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
      const receiptNumber = await storage.generateTransferReceiptNumber(req.user!.id);
      
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
      
      const createdTransfer = await storage.createResellerTransfer(req.user!.id, transferData, processedItems);
      
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
  app.post("/api/shopping-cart", requireAuth, async (req, res) => {
    try {
      const { insertShoppingCartSchema } = await import("@shared/schema");
      const data = insertShoppingCartSchema.parse(req.body);
      const item = await storage.addToShoppingCart(req.user!.id, data);
      res.json(item);
    } catch (error: any) {
      res.status(400).json({ error: "Invalid shopping cart data", message: error.message });
    }
  });

  // Bulk add to shopping cart (for stock page selection)
  app.post("/api/shopping-cart/bulk", requireAuth, async (req, res) => {
    try {
      const schema = z.object({
        items: z.array(z.object({
          stockItemId: z.string().uuid(),
          shortageQty: z.string(),
          notes: z.string().optional(),
        })),
      });

      const { items } = schema.parse(req.body);
      const userId = req.user!.id;

      // Get stock items details
      const stockItemIds = items.map(item => item.stockItemId);
      const stockItemsData = await storage.getStockItemsByIds(stockItemIds, userId);

      // Check for duplicates in cart
      const existingCartItems = await storage.getShoppingCartItems(userId);
      const existingStockIds = new Set(existingCartItems.map((item: any) => item.stockItemId));

      const results = {
        added: [] as string[],
        skipped: [] as string[],
        errors: [] as { stockItemId: string; error: string }[],
      };

      // Add items to cart
      for (const item of items) {
        try {
          // Check if already in cart
          if (existingStockIds.has(item.stockItemId)) {
            results.skipped.push(item.stockItemId);
            continue;
          }

          // Get stock item details
          const stockItem = stockItemsData.find((s: any) => s.id === item.stockItemId);
          if (!stockItem) {
            results.errors.push({
              stockItemId: item.stockItemId,
              error: "Stock item not found",
            });
            continue;
          }

          // Insert into cart
          await storage.addToShoppingCart(userId, {
            stockItemId: item.stockItemId,
            stockItemName: stockItem.name,
            shortageQty: item.shortageQty,
            unit: stockItem.unit,
            notes: item.notes || null,
            productionBatchId: null,
            productName: null,
          });

          results.added.push(item.stockItemId);
        } catch (error: any) {
          results.errors.push({
            stockItemId: item.stockItemId,
            error: error.message,
          });
        }
      }

      res.json({
        success: true,
        message: `${results.added.length} items added to shopping list`,
        results,
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/shopping-cart", requireAuth, async (req, res) => {
    try {
      const items = await storage.getShoppingCartItems(req.user!.id);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch shopping cart items" });
    }
  });

  app.delete("/api/shopping-cart/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.removeFromCart(req.user!.id, id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to remove item from cart" });
    }
  });

  app.delete("/api/shopping-cart", requireAuth, async (req, res) => {
    try {
      await storage.clearCart(req.user!.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to clear cart" });
    }
  });

  app.post("/api/shopping-cart/purchase", requireAuth, async (req, res) => {
    try {
      const { cartItemIds } = req.body;
      
      if (!Array.isArray(cartItemIds) || cartItemIds.length === 0) {
        return res.status(400).json({ error: "Cart item IDs are required" });
      }
      
      await storage.bulkPurchaseAndUpdateStock(req.user!.id, cartItemIds);
      res.json({ success: true, message: "Stock updated and cart items removed" });
    } catch (error: any) {
      console.error("Bulk purchase error:", error);
      res.status(500).json({ error: "Failed to complete purchase", message: error.message });
    }
  });

  // ==================== PURCHASE ORDERS (Smart Supplier Order Hub) ====================
  
  // Create PO from cart items
  app.post("/api/purchase-orders/from-cart", requireAuth, async (req, res) => {
    try {
      const { 
        supplierId, 
        supplierName, 
        supplierPhone, 
        supplierEmail,
        supplierAddress,
        deliveryAddress,
        notes, 
        cartItemIds 
      } = req.body;
      
      if (!supplierName || !Array.isArray(cartItemIds) || cartItemIds.length === 0) {
        return res.status(400).json({ error: "Supplier name and cart items are required" });
      }
      
      const order = await storage.createPurchaseOrderFromCart(
        req.user!.id,
        supplierId || null,
        supplierName,
        supplierPhone || null,
        supplierEmail || null,
        supplierAddress || null,
        deliveryAddress || null,
        notes || null,
        cartItemIds
      );
      
      res.json(order);
    } catch (error: any) {
      console.error("Create PO from cart error:", error);
      res.status(500).json({ error: "Failed to create purchase order", message: error.message });
    }
  });
  
  // Get all purchase orders
  app.get("/api/purchase-orders", requireAuth, async (req, res) => {
    try {
      const orders = await storage.getPurchaseOrders(req.user!.id);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch purchase orders" });
    }
  });
  
  // Get single purchase order
  app.get("/api/purchase-orders/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const order = await storage.getPurchaseOrder(req.user!.id, id);
      
      if (!order) {
        return res.status(404).json({ error: "Purchase order not found" });
      }
      
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch purchase order" });
    }
  });
  
  // Update PO status
  app.patch("/api/purchase-orders/:id/status", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;
      
      if (!status) {
        return res.status(400).json({ error: "Status is required" });
      }
      
      const additionalData: any = {};
      if (notes) additionalData.notes = notes;
      
      const updated = await storage.updatePurchaseOrderStatus(req.user!.id, id, status, additionalData);
      res.json(updated);
    } catch (error: any) {
      console.error("Update PO status error:", error);
      res.status(500).json({ error: "Failed to update purchase order status", message: error.message });
    }
  });
  
  // Mark PO as received (auto-create expense & update stock)
  app.post("/api/purchase-orders/:id/receive", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { actualPrices } = req.body; // Optional: [{ itemId, price }]
      
      await storage.markPurchaseOrderReceived(req.user!.id, id, actualPrices);
      res.json({ success: true, message: "Purchase order marked as received, stock updated, and expense created" });
    } catch (error: any) {
      console.error("Mark PO received error:", error);
      res.status(500).json({ error: "Failed to mark purchase order as received", message: error.message });
    }
  });
  
  // Delete PO
  app.delete("/api/purchase-orders/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deletePurchaseOrder(req.user!.id, id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete purchase order" });
    }
  });

  // Send PO via email
  app.post("/api/purchase-orders/:id/send-email", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { recipientEmail, recipientName, message, pdfBase64 } = req.body;
      
      if (!recipientEmail) {
        return res.status(400).json({ error: "Recipient email is required" });
      }

      if (!pdfBase64) {
        return res.status(400).json({ error: "PDF data is required" });
      }
      
      const order = await storage.getPurchaseOrder(req.user!.id, id);
      if (!order) {
        return res.status(404).json({ error: "Purchase order not found" });
      }

      // Get business profile for sender info
      const businessProfile = await storage.getBusinessProfile(req.user!.id);
      const businessName = businessProfile?.businessName || "PocketBizz";
      const businessEmail = businessProfile?.email;
      
      if (!businessEmail) {
        return res.status(400).json({ 
          error: "Business email not configured", 
          message: "Please add your business email in Settings > Business Profile to send emails." 
        });
      }
      
      // Get resend client
      const { getUncachableResendClient } = await import("./resend-client");
      
      let client;
      try {
        client = await getUncachableResendClient();
      } catch (emailError: any) {
        console.error("Email service configuration error:", emailError.message);
        return res.status(503).json({ 
          error: "Email service not configured", 
          message: "Please configure RESEND_API_KEY in environment variables to enable email features. Get your API key from https://resend.com/api-keys" 
        });
      }
      
      // Determine sender strategy based on email domain
      // Free email providers (Gmail, Yahoo, Outlook) cannot be used as sender in Resend
      // Use reply-to for these, custom domains can be sender (if verified)
      const freeEmailProviders = /@(gmail|googlemail|yahoo|ymail|hotmail|outlook|live|msn|icloud|me|aol)\./i;
      const isCustomDomain = !freeEmailProviders.test(businessEmail);
      
      let emailFrom: string;
      let emailReplyTo: string | undefined;
      
      if (isCustomDomain) {
        // Custom domain - use as sender (requires domain verification in Resend)
        emailFrom = businessEmail;
      } else {
        // Free email provider - use platform email with reply-to
        emailFrom = `${businessName} <noreply@pocketbizz.my>`;
        emailReplyTo = businessEmail;
      }
      
      // Convert base64 to buffer
      const pdfBuffer = Buffer.from(pdfBase64, 'base64');
      
      // Prepare email content with business branding
      const emailSubject = `Purchase Order: ${order.poNumber} - ${businessName}`;
      const emailHtml = `
        <h2>Purchase Order</h2>
        <p>Dear ${recipientName || order.supplierName},</p>
        ${message ? `<p>${message}</p>` : ''}
        <p>Sila semak Purchase Order yang dilampirkan. Terima kasih!</p>
        <hr />
        <p><strong>PO Number:</strong> ${order.poNumber}</p>
        <p><strong>Supplier:</strong> ${order.supplierName}</p>
        <p><strong>Jumlah:</strong> RM ${parseFloat(order.totalAmount).toFixed(2)}</p>
        <p><strong>Bilangan Item:</strong> ${order.items.length}</p>
        <br />
        <p>Best regards,<br />${businessName}</p>
        ${businessProfile?.phone ? `<p style="color: #666; font-size: 0.9em;">Tel: ${businessProfile.phone}</p>` : ''}
        ${emailReplyTo ? `<p style="color: #666; font-size: 0.9em;">Email: ${businessEmail}</p>` : ''}
      `;
      
      // Send email with PDF attachment
      const emailOptions: any = {
        from: emailFrom,
        to: recipientEmail,
        subject: emailSubject,
        html: emailHtml,
        attachments: [
          {
            filename: `${order.poNumber}.pdf`,
            content: pdfBuffer,
          }
        ]
      };
      
      // Add reply-to for free email providers
      if (emailReplyTo) {
        emailOptions.reply_to = emailReplyTo;
      }
      
      await client.emails.send(emailOptions);
      
      res.json({ success: true, message: "Email sent successfully" });
    } catch (error: any) {
      console.error("Send PO email error:", error);
      res.status(500).json({ error: "Failed to send email", message: error.message });
    }
  });

  // Update PO (items, supplier, notes) - only allowed for draft status
  app.patch("/api/purchase-orders/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      
      // Validate request body
      const updatePOSchema = z.object({
        supplierName: z.string().optional(),
        supplierPhone: z.string().nullable().optional(),
        supplierEmail: z.string().nullable().optional(),
        supplierAddress: z.string().nullable().optional(),
        deliveryAddress: z.string().nullable().optional(),
        notes: z.string().nullable().optional(),
        expectedDeliveryDate: z.string().nullable().optional(),
        paymentTerms: z.string().nullable().optional(),
        paymentMethod: z.string().nullable().optional(),
        requestedBy: z.string().nullable().optional(),
        discount: z.string().nullable().optional(),
        tax: z.string().nullable().optional(),
        shippingCharges: z.string().nullable().optional(),
        items: z.array(z.object({
          id: z.string().optional(),
          stockItemId: z.string().nullable().optional(),
          itemName: z.string(),
          quantity: z.string(),
          unit: z.string(),
          estimatedPrice: z.string().nullable().optional(),
          notes: z.string().nullable().optional(),
        })).optional(),
      });
      
      const validatedData = updatePOSchema.parse(req.body);
      
      const order = await storage.getPurchaseOrder(req.user!.id, id);
      if (!order) {
        return res.status(404).json({ error: "Purchase order not found" });
      }
      
      // Only allow editing draft POs
      if (order.status !== 'draft') {
        return res.status(400).json({ error: "Only draft purchase orders can be edited" });
      }
      
      // Update PO using storage method
      const updated = await storage.updatePurchaseOrder(req.user!.id, id, validatedData);
      
      res.json(updated);
    } catch (error: any) {
      console.error("Update PO error:", error);
      res.status(500).json({ error: "Failed to update purchase order", message: error.message });
    }
  });

  // Duplicate PO (create new draft from existing PO)
  app.post("/api/purchase-orders/:id/duplicate", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      
      const originalPO = await storage.getPurchaseOrder(req.user!.id, id);
      if (!originalPO) {
        return res.status(404).json({ error: "Purchase order not found" });
      }
      
      // Create new PO with same supplier and items but as draft
      const duplicatedPO = await storage.duplicatePurchaseOrder(req.user!.id, id);
      
      res.json(duplicatedPO);
    } catch (error: any) {
      console.error("Duplicate PO error:", error);
      res.status(500).json({ error: "Failed to duplicate purchase order", message: error.message });
    }
  });
  
  // ==================== PO TEMPLATE ROUTES ====================
  
  // Get all PO templates
  app.get("/api/po-templates", requireAuth, async (req, res) => {
    try {
      const templates = await storage.getAllPOTemplates(req.user!.id);
      res.json(templates);
    } catch (error: any) {
      console.error("Get templates error:", error);
      res.status(500).json({ error: "Failed to fetch templates" });
    }
  });
  
  // Create PO template from existing PO
  app.post("/api/po-templates/from-po/:poId", requireAuth, async (req, res) => {
    try {
      const { poId } = req.params;
      const { templateName } = req.body;
      
      if (!templateName) {
        return res.status(400).json({ error: "Template name is required" });
      }
      
      const po = await storage.getPurchaseOrder(req.user!.id, poId);
      if (!po) {
        return res.status(404).json({ error: "Purchase order not found" });
      }
      
      const template = await storage.createPOTemplate(req.user!.id, {
        templateName,
        supplierId: po.supplierId,
        supplierName: po.supplierName,
        supplierPhone: po.supplierPhone,
        notes: po.notes,
        items: po.items || [],
      });
      
      res.json(template);
    } catch (error: any) {
      console.error("Create template error:", error);
      res.status(500).json({ error: "Failed to create template", message: error.message });
    }
  });
  
  // Create new PO from template
  app.post("/api/po-templates/:templateId/create-po", requireAuth, async (req, res) => {
    try {
      const { templateId } = req.params;
      const po = await storage.createPOFromTemplate(req.user!.id, templateId);
      res.json(po);
    } catch (error: any) {
      console.error("Create PO from template error:", error);
      res.status(500).json({ error: "Failed to create PO from template", message: error.message });
    }
  });
  
  // Delete PO template
  app.delete("/api/po-templates/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deletePOTemplate(req.user!.id, id);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Delete template error:", error);
      res.status(500).json({ error: "Failed to delete template" });
    }
  });

  // ==================== ADMIN ROUTES ====================
  
  // Admin: Get dashboard statistics
  app.get("/api/admin/stats", requireAdmin, async (req, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      const now = new Date();
      
      // User statistics - properly categorize users
      const totalUsers = allUsers.length;
      const activeTrialUsers = allUsers.filter(u => 
        u.isOnTrial === 1 && u.trialEndsAt && new Date(u.trialEndsAt) > now
      ).length;
      
      // Expired trial: Users who HAD trial but it expired (not paid)
      const expiredTrialUsers = allUsers.filter(u => 
        u.isOnTrial === 0 && u.trialEndsAt && new Date(u.trialEndsAt) < now
      ).length;
      
      // Subscription statistics
      const allSubscriptions = await storage.getAllUserSubscriptions();
      const activeSubscriptions = allSubscriptions.filter(s => 
        s.status === 'active' && s.subscriptionEndsAt && new Date(s.subscriptionEndsAt) > now
      );
      
      // Paid users: Users with active paid subscriptions
      const paidUserIds = new Set(activeSubscriptions.map(s => s.userId));
      const paidUsers = paidUserIds.size;
      
      // Revenue calculation (monthly recurring revenue)
      let totalMRR = 0;
      for (const sub of activeSubscriptions) {
        const plan = await storage.getSubscriptionPlanById(sub.planId);
        if (plan) {
          totalMRR += parseFloat(plan.monthlyPrice || '0');
        }
      }
      
      res.json({
        users: {
          total: totalUsers,
          activeTrial: activeTrialUsers,
          expiredTrial: expiredTrialUsers,
          paid: paidUsers,
        },
        subscriptions: {
          active: activeSubscriptions.length,
          total: allSubscriptions.length,
        },
        revenue: {
          mrr: totalMRR.toFixed(2),
          currency: 'MYR',
        },
      });
    } catch (error) {
      console.error("Admin stats error:", error);
      res.status(500).json({ error: "Failed to fetch admin statistics" });
    }
  });
  
  // Admin: Get all users with pagination
  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;
      
      const allUsers = await storage.getAllUsers();
      const total = allUsers.length;
      const users = allUsers.slice(offset, offset + limit);
      
      // Enrich users with subscription info
      const enrichedUsers = await Promise.all(users.map(async (user) => {
        const subscriptions = await storage.getUserSubscriptions(user.id);
        const activeSub = subscriptions.find(s => 
          s.status === 'active' && s.subscriptionEndsAt && new Date(s.subscriptionEndsAt) > new Date()
        );
        
        let plan = null;
        if (activeSub) {
          plan = await storage.getSubscriptionPlanById(activeSub.planId);
        }
        
        return {
          ...user,
          password: undefined, // Don't send password hash
          currentPlan: plan?.displayName || (user.isOnTrial ? 'Trial' : 'None'),
          subscriptionStatus: activeSub ? 'active' : (user.isOnTrial ? 'trial' : 'inactive'),
        };
      }));
      
      res.json({
        users: enrichedUsers,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error("Admin users list error:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });
  
  // Admin: Get user details
  app.get("/api/admin/users/:userId", requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const user = await storage.getUserById(userId);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const subscriptions = await storage.getUserSubscriptions(userId);
      const products = await storage.getProducts();
      const userProducts = products.filter((p: any) => p.userId === userId);
      
      res.json({
        ...user,
        password: undefined,
        subscriptions,
        stats: {
          totalProducts: userProducts.length,
          totalSubscriptions: subscriptions.length,
        },
      });
    } catch (error) {
      console.error("Admin user details error:", error);
      res.status(500).json({ error: "Failed to fetch user details" });
    }
  });
  
  // Admin: Update user subscription
  app.patch("/api/admin/users/:userId/subscription", requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const { action, planId, durationMonths } = req.body;
      
      if (action === 'activate') {
        // Create new subscription
        const plan = await storage.getSubscriptionPlanById(planId);
        if (!plan) {
          return res.status(404).json({ error: "Plan not found" });
        }
        
        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + (durationMonths || 1));
        
        // Package pricing
        const PACKAGE_PRICES: Record<number, number> = {
          1: 27,
          3: 79,
          6: 146,
          12: 259,
        };
        const totalPaid = PACKAGE_PRICES[durationMonths || 1] || 27;
        
        const subscription = await storage.createUserSubscription({
          userId,
          planId,
          planName: plan.name,
          status: 'active',
          subscriptionStartsAt: startDate,
          subscriptionEndsAt: endDate,
          totalPaid: totalPaid.toFixed(2),
          durationMonths: durationMonths || 1,
          paymentProvider: 'manual',
        });
        
        // Disable trial if active
        await storage.updateUser(userId, { isOnTrial: 0 });
        
        res.json({ success: true, subscription });
      } else if (action === 'cancel') {
        // Find active subscription and cancel it
        const subscriptions = await storage.getUserSubscriptions(userId);
        const activeSub = subscriptions.find(s => s.status === 'active');
        
        if (activeSub) {
          await storage.updateUserSubscription(activeSub.id, { status: 'canceled' });
        }
        
        res.json({ success: true });
      } else {
        res.status(400).json({ error: "Invalid action" });
      }
    } catch (error) {
      console.error("Admin subscription update error:", error);
      res.status(500).json({ error: "Failed to update subscription" });
    }
  });

  // Admin: Manual subscription activation (backup from BCL payment)
  app.post("/api/admin/subscriptions/manual-activate", requireAdmin, async (req, res) => {
    try {
      const { userId, planId, durationMonths, notes } = req.body;

      // Validate duration options (1, 3, 6, 12 months)
      if (![1, 3, 6, 12].includes(durationMonths)) {
        return res.status(400).json({ error: "Invalid duration. Must be 1, 3, 6, or 12 months" });
      }

      // Get user and plan
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const plan = await storage.getSubscriptionPlanById(planId);
      if (!plan) {
        return res.status(404).json({ error: "Plan not found" });
      }

      // Calculate subscription dates
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + durationMonths);

      // Package pricing (matching subscription.tsx)
      const PACKAGE_PRICES: Record<number, number> = {
        1: 27,
        3: 79,
        6: 146,
        12: 259,
      };
      const totalAmount = PACKAGE_PRICES[durationMonths] || 0;

      // Create subscription
      const subscription = await storage.createUserSubscription({
        userId,
        planId,
        planName: plan.name,
        status: 'active',
        subscriptionStartsAt: startDate,
        subscriptionEndsAt: endDate,
        totalPaid: totalAmount.toFixed(2),
        durationMonths,
        paymentProvider: 'manual_admin',
        activationSource: 'manual_admin',
        metadata: JSON.stringify({ 
          activatedBy: req.user!.email,
          adminNotes: notes || '',
          activatedAt: new Date().toISOString()
        }),
      });

      // Disable trial if active
      if (user.isOnTrial === 1) {
        await storage.updateUser(userId, { isOnTrial: 0 });
      }

      // Log admin action
      await db.insert(adminActivityLogs).values({
        adminId: req.user!.id,
        action: 'manual_subscription_activate',
        targetUserId: userId,
        details: `Manually activated ${plan.name} for ${durationMonths} months (${user.email})${notes ? ` - Notes: ${notes}` : ''}`,
        createdAt: new Date(),
      });

      res.json({ 
        success: true, 
        subscription,
        message: `Successfully activated ${plan.name} for ${user.email} (${durationMonths} months)`
      });
    } catch (error) {
      console.error("Manual subscription activation error:", error);
      res.status(500).json({ error: "Failed to activate subscription" });
    }
  });

  // Admin: Extend existing subscription
  app.patch("/api/admin/subscriptions/:subscriptionId/extend", requireAdmin, async (req, res) => {
    try {
      const { subscriptionId } = req.params;
      const { extensionMonths, notes } = req.body;

      // Validate extension duration
      if (![1, 3, 6, 12].includes(extensionMonths)) {
        return res.status(400).json({ error: "Invalid extension. Must be 1, 3, 6, or 12 months" });
      }

      // Get existing subscription
      const subscriptions = await storage.getAllUserSubscriptions();
      const subscription = subscriptions.find(s => s.id === subscriptionId);
      
      if (!subscription) {
        return res.status(404).json({ error: "Subscription not found" });
      }

      // Get user
      const user = await storage.getUserById(subscription.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Calculate new end date (extend from current end date, not from today)
      const currentEndDate = new Date(subscription.subscriptionEndsAt);
      const newEndDate = new Date(currentEndDate);
      newEndDate.setMonth(newEndDate.getMonth() + extensionMonths);

      // Package pricing for extension
      const PACKAGE_PRICES: Record<number, number> = {
        1: 27,
        3: 79,
        6: 146,
        12: 259,
      };
      const extensionAmount = PACKAGE_PRICES[extensionMonths] || 0;
      const newTotalPaid = parseFloat(subscription.totalPaid || '0') + extensionAmount;

      // Update subscription
      const updated = await storage.updateUserSubscription(subscriptionId, {
        subscriptionEndsAt: newEndDate,
        totalPaid: newTotalPaid.toFixed(2),
        status: 'active', // Reactivate if it was expired
        durationMonths: subscription.durationMonths + extensionMonths,
        metadata: JSON.stringify({
          ...JSON.parse(subscription.metadata || '{}'),
          lastExtension: {
            extendedBy: req.user!.email,
            extensionMonths,
            extensionAmount,
            adminNotes: notes || '',
            extendedAt: new Date().toISOString()
          }
        }),
      });

      // Log admin action
      await db.insert(adminActivityLogs).values({
        adminId: req.user!.id,
        action: 'manual_subscription_extend',
        targetUserId: subscription.userId,
        details: `Extended subscription by ${extensionMonths} months for ${user.email} (${subscription.planName})${notes ? ` - Notes: ${notes}` : ''}`,
        createdAt: new Date(),
      });

      res.json({ 
        success: true, 
        subscription: updated,
        message: `Successfully extended subscription by ${extensionMonths} months. New end date: ${newEndDate.toLocaleDateString()}`
      });
    } catch (error) {
      console.error("Subscription extension error:", error);
      res.status(500).json({ error: "Failed to extend subscription" });
    }
  });

  // Admin: Get all subscriptions with user details
  app.get("/api/admin/subscriptions", requireAdmin, async (req, res) => {
    try {
      const allSubscriptions = await storage.getAllUserSubscriptions();
      const allUsers = await storage.getAllUsers();
      
      // Create user map for quick lookup
      const userMap = new Map(allUsers.map(u => [u.id, u]));
      
      // Enrich subscriptions with user info
      const enrichedSubscriptions = allSubscriptions.map(sub => {
        const user = userMap.get(sub.userId);
        return {
          ...sub,
          userEmail: user?.email,
          userName: user?.fullName,
          isExpired: new Date(sub.subscriptionEndsAt) < new Date(),
        };
      });

      // Sort by creation date (newest first)
      enrichedSubscriptions.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      res.json(enrichedSubscriptions);
    } catch (error) {
      console.error("Admin subscriptions list error:", error);
      res.status(500).json({ error: "Failed to fetch subscriptions" });
    }
  });
  
  // Admin: Reset user password
  app.post("/api/admin/users/:userId/reset-password", requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      
      // Get user
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Generate random temporary password (8 characters)
      const crypto = await import('crypto');
      const tempPassword = crypto.randomBytes(4).toString('hex'); // 8 char hex
      
      // Hash the temporary password
      const hashedPassword = await bcrypt.hash(tempPassword, 10);
      
      // Update user password
      await storage.updateUser(userId, { 
        password: hashedPassword,
        updatedAt: new Date()
      });
      
      // Log admin action
      await db.insert(adminActivityLogs).values({
        adminId: req.user!.id,
        action: 'reset_password',
        targetUserId: userId,
        details: `Reset password for ${user.email}`,
        createdAt: new Date(),
      });
      
      // Return the temporary password (only shown once to admin)
      res.json({ 
        success: true, 
        tempPassword,
        message: `Password reset successful. Temporary password: ${tempPassword}`,
        userId: user.id,
        userEmail: user.email
      });
    } catch (error) {
      console.error("Admin password reset error:", error);
      res.status(500).json({ error: "Failed to reset password" });
    }
  });

  // Admin: Delete user
  app.delete("/api/admin/users/:userId", requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      
      // Prevent deleting yourself
      if (userId === req.user!.id) {
        return res.status(400).json({ error: "Cannot delete your own account" });
      }
      
      // Get user for logging
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Delete user (cascade deletes will handle related records)
      await db.delete(users).where(eq(users.id, userId));
      
      // Log admin action
      await db.insert(adminActivityLogs).values({
        adminId: req.user!.id,
        action: 'delete_user',
        targetUserId: userId,
        details: `Deleted user ${user.email}`,
        createdAt: new Date(),
      });
      
      res.json({ success: true, message: "User deleted successfully" });
    } catch (error) {
      console.error("Admin delete user error:", error);
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  // Admin: Suspend/Activate user
  app.post("/api/admin/users/:userId/toggle-status", requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const { suspended } = req.body;
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Update user suspended status
      await storage.updateUser(userId, { 
        suspended: suspended ? 1 : 0,
        updatedAt: new Date()
      });
      
      // Log admin action
      await db.insert(adminActivityLogs).values({
        adminId: req.user!.id,
        action: suspended ? 'suspend_user' : 'activate_user',
        targetUserId: userId,
        details: `${suspended ? 'Suspended' : 'Activated'} user ${user.email}`,
        createdAt: new Date(),
      });
      
      res.json({ success: true, message: `User ${suspended ? 'suspended' : 'activated'} successfully` });
    } catch (error) {
      console.error("Admin toggle user status error:", error);
      res.status(500).json({ error: "Failed to update user status" });
    }
  });

  // Admin: Direct subscription change
  app.post("/api/admin/users/:userId/change-plan", requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const { planId, durationMonths } = req.body;
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const plan = await db.query.subscriptionPlans.findFirst({
        where: eq(subscriptionPlans.id, planId)
      });
      
      if (!plan) {
        return res.status(404).json({ error: "Plan not found" });
      }
      
      // Check existing subscription
      const existingSub = await db.query.userSubscriptions.findFirst({
        where: and(
          eq(userSubscriptions.userId, userId),
          eq(userSubscriptions.status, 'active')
        )
      });
      
      const now = new Date();
      const endDate = new Date(now);
      endDate.setMonth(endDate.getMonth() + parseInt(durationMonths));
      
      if (existingSub) {
        // Update existing subscription
        await db.update(userSubscriptions)
          .set({
            planId,
            status: 'active',
            startDate: now,
            endDate,
            updatedAt: now,
          })
          .where(eq(userSubscriptions.id, existingSub.id));
      } else {
        // Create new subscription
        await db.insert(userSubscriptions).values({
          userId,
          planId,
          status: 'active',
          startDate: now,
          endDate,
          createdAt: now,
          updatedAt: now,
        });
      }
      
      // Log admin action
      await db.insert(adminActivityLogs).values({
        adminId: req.user!.id,
        action: 'change_subscription',
        targetUserId: userId,
        details: `Changed ${user.email} to ${plan.name} for ${durationMonths} months`,
        createdAt: new Date(),
      });
      
      res.json({ success: true, message: "Subscription changed successfully" });
    } catch (error) {
      console.error("Admin change plan error:", error);
      res.status(500).json({ error: "Failed to change plan" });
    }
  });

  // Admin: Add manual payment record
  app.post("/api/admin/users/:userId/add-payment", requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const { amount, method, notes } = req.body;
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Create billing record
      await db.insert(billingHistory).values({
        userId,
        amount: amount.toString(),
        currency: 'MYR',
        paymentMethod: method || 'manual',
        status: 'completed',
        description: notes || 'Manual payment added by admin',
        createdAt: new Date(),
      });
      
      // Log admin action
      await db.insert(adminActivityLogs).values({
        adminId: req.user!.id,
        action: 'add_payment',
        targetUserId: userId,
        details: `Added manual payment RM ${amount} for ${user.email}`,
        createdAt: new Date(),
      });
      
      res.json({ success: true, message: "Payment record added successfully" });
    } catch (error) {
      console.error("Admin add payment error:", error);
      res.status(500).json({ error: "Failed to add payment record" });
    }
  });

  // Admin: Get user activity logs
  app.get("/api/admin/users/:userId/activity", requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      
      // Get recent activity (last 50 actions)
      const activity = await db.select()
        .from(adminActivityLogs)
        .where(eq(adminActivityLogs.targetUserId, userId))
        .orderBy(desc(adminActivityLogs.createdAt))
        .limit(50);
      
      res.json(activity);
    } catch (error) {
      console.error("Admin get activity error:", error);
      res.status(500).json({ error: "Failed to fetch activity logs" });
    }
  });

  // Admin: Get all admin actions (audit trail)
  app.get("/api/admin/activity-logs", requireAdmin, async (req, res) => {
    try {
      const { page = 1, limit = 50 } = req.query;
      const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
      
      const logs = await db.select({
        id: adminActivityLogs.id,
        adminId: adminActivityLogs.adminId,
        adminEmail: users.email,
        action: adminActivityLogs.action,
        targetUserId: adminActivityLogs.targetUserId,
        details: adminActivityLogs.details,
        createdAt: adminActivityLogs.createdAt,
      })
        .from(adminActivityLogs)
        .leftJoin(users, eq(adminActivityLogs.adminId, users.id))
        .orderBy(desc(adminActivityLogs.createdAt))
        .limit(parseInt(limit as string))
        .offset(offset);
      
      const total = await db.select({ count: sql<number>`count(*)` })
        .from(adminActivityLogs);
      
      res.json({
        logs,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total: total[0]?.count || 0,
          totalPages: Math.ceil((total[0]?.count || 0) / parseInt(limit as string)),
        }
      });
    } catch (error) {
      console.error("Admin get logs error:", error);
      res.status(500).json({ error: "Failed to fetch activity logs" });
    }
  });

  // Admin: Bulk actions
  app.post("/api/admin/users/bulk-action", requireAdmin, async (req, res) => {
    try {
      const { userIds, action, data } = req.body;
      
      if (!Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({ error: "No users selected" });
      }
      
      let successCount = 0;
      const errors = [];
      
      for (const userId of userIds) {
        try {
          switch (action) {
            case 'suspend':
              await storage.updateUser(userId, { suspended: 1, updatedAt: new Date() });
              break;
            case 'activate':
              await storage.updateUser(userId, { suspended: 0, updatedAt: new Date() });
              break;
            case 'delete':
              if (userId !== req.user!.id) {
                await db.delete(users).where(eq(users.id, userId));
              }
              break;
            case 'change_plan':
              // Implement bulk plan change if needed
              break;
          }
          successCount++;
        } catch (err: any) {
          errors.push({ userId, error: err.message });
        }
      }
      
      // Log bulk action
      await db.insert(adminActivityLogs).values({
        adminId: req.user!.id,
        action: `bulk_${action}`,
        details: `Bulk ${action} on ${successCount} users`,
        createdAt: new Date(),
      });
      
      res.json({ 
        success: true, 
        successCount, 
        failedCount: errors.length,
        errors 
      });
    } catch (error) {
      console.error("Admin bulk action error:", error);
      res.status(500).json({ error: "Failed to perform bulk action" });
    }
  });
  
  // Admin: Revenue analytics
  app.get("/api/admin/analytics/revenue", requireAdmin, async (req, res) => {
    try {
      const billingHistory = await db.select().from(billingHistory as any);
      
      // Group by month
      const revenueByMonth: { [key: string]: number } = {};
      billingHistory.forEach((record: any) => {
        const month = new Date(record.createdAt).toISOString().substring(0, 7); // YYYY-MM
        revenueByMonth[month] = (revenueByMonth[month] || 0) + parseFloat(record.amount || '0');
      });
      
      // Format for chart
      const chartData = Object.entries(revenueByMonth)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-12) // Last 12 months
        .map(([month, amount]) => ({
          month,
          revenue: amount,
        }));
      
      res.json(chartData);
    } catch (error) {
      console.error("Admin revenue analytics error:", error);
      res.status(500).json({ error: "Failed to fetch revenue analytics" });
    }
  });

  // ========================================
  // LOYALTY PROGRAM ROUTES
  // ========================================
  
  // Get customer by phone
  app.get("/api/loyalty/customer/:phone", requireAuth, blockExpiredTrial, requireLoyaltyPoints, async (req, res) => {
    try {
      const { phone } = req.params;
      const customer = await storage.getCustomerByPhone(req.user!.id, phone);
      res.json(customer || null);
    } catch (error) {
      console.error("Get customer error:", error);
      res.status(500).json({ error: "Failed to get customer" });
    }
  });

  // Create new customer
  app.post("/api/loyalty/customer", requireAuth, blockExpiredTrial, requireLoyaltyPoints, async (req, res) => {
    try {
      const customerSchema = z.object({
        name: z.string().min(1),
        phone: z.string().min(1),
      });
      
      const data = customerSchema.parse(req.body);
      
      // Check if phone already exists
      const existing = await storage.getCustomerByPhone(req.user!.id, data.phone);
      if (existing) {
        return res.status(400).json({ error: "Nombor telefon sudah didaftarkan" });
      }
      
      const customer = await storage.createCustomer(req.user!.id, {
        ...data,
        loyaltyPoints: 0,
      });
      
      res.json(customer);
    } catch (error) {
      console.error("Create customer error:", error);
      res.status(500).json({ error: "Failed to create customer" });
    }
  });

  // Get all customers
  app.get("/api/loyalty/customers", requireAuth, blockExpiredTrial, requireLoyaltyPoints, async (req, res) => {
    try {
      const customers = await storage.getCustomers(req.user!.id);
      res.json(customers);
    } catch (error) {
      console.error("Get customers error:", error);
      res.status(500).json({ error: "Failed to get customers" });
    }
  });

  // Get customer points history
  app.get("/api/loyalty/history/:customerId", requireAuth, blockExpiredTrial, requireLoyaltyPoints, async (req, res) => {
    try {
      const { customerId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      const history = await storage.getPointsHistory(req.user!.id, customerId, limit);
      res.json(history);
    } catch (error) {
      console.error("Get points history error:", error);
      res.status(500).json({ error: "Failed to get points history" });
    }
  });

  // Redeem points
  app.post("/api/loyalty/redeem", requireAuth, blockExpiredTrial, requireLoyaltyPoints, async (req, res) => {
    try {
      const redeemSchema = z.object({
        customerId: z.string(),
        points: z.number().positive(),
        description: z.string(),
      });
      
      const data = redeemSchema.parse(req.body);
      await storage.redeemPoints(req.user!.id, data.customerId, data.points, data.description);
      
      // Return updated customer
      const customerRecord = (await db.select().from(customers).where(eq(customers.id, data.customerId)))[0];
      const customer = await storage.getCustomerByPhone(req.user!.id, customerRecord?.phone || '');
      res.json(customer);
    } catch (error: any) {
      console.error("Redeem points error:", error);
      if (error.message === "Insufficient points") {
        return res.status(400).json({ error: "Mata ganjaran tidak mencukupi" });
      }
      res.status(500).json({ error: "Failed to redeem points" });
    }
  });

  // ========================================
  // BROADCAST SYSTEM ROUTES
  // ========================================

  // Get message templates
  app.get("/api/broadcast/templates", requireAuth, blockExpiredTrial, requireWhatsappBroadcast, async (req, res) => {
    try {
      const channel = req.query.channel as string | undefined;
      const templates = await storage.getMessageTemplates(req.user!.id, channel);
      res.json(templates);
    } catch (error) {
      console.error("Get templates error:", error);
      res.status(500).json({ error: "Failed to get templates" });
    }
  });

  // Create message template
  app.post("/api/broadcast/templates", requireAuth, blockExpiredTrial, requireWhatsappBroadcast, async (req, res) => {
    try {
      const templateSchema = z.object({
        name: z.string().min(1),
        type: z.enum(["promo", "new_product", "voucher", "general"]),
        subject: z.string().optional(),
        message: z.string().min(1),
        channel: z.enum(["email", "whatsapp", "sms"]),
      });
      
      const data = templateSchema.parse(req.body);
      const template = await storage.createMessageTemplate(req.user!.id, data);
      res.json(template);
    } catch (error) {
      console.error("Create template error:", error);
      res.status(500).json({ error: "Failed to create template" });
    }
  });

  // Update message template
  app.put("/api/broadcast/templates/:id", requireAuth, blockExpiredTrial, requireWhatsappBroadcast, async (req, res) => {
    try {
      const { id } = req.params;
      const template = await storage.updateMessageTemplate(req.user!.id, id, req.body);
      res.json(template);
    } catch (error) {
      console.error("Update template error:", error);
      res.status(500).json({ error: "Failed to update template" });
    }
  });

  // Delete message template
  app.delete("/api/broadcast/templates/:id", requireAuth, blockExpiredTrial, requireWhatsappBroadcast, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteMessageTemplate(req.user!.id, id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete template error:", error);
      res.status(500).json({ error: "Failed to delete template" });
    }
  });

  // Create broadcast campaign
  app.post("/api/broadcast/campaigns", requireAuth, blockExpiredTrial, requireWhatsappBroadcast, async (req, res) => {
    try {
      const campaignSchema = z.object({
        name: z.string().min(1),
        channel: z.enum(["email", "whatsapp", "sms"]),
        subject: z.string().optional(),
        message: z.string().min(1),
        targetSegment: z.enum(["all", "high_points", "recent_buyers", "custom"]),
        targetCustomerIds: z.array(z.string()).optional(),
        status: z.enum(["draft", "pending", "sending", "sent", "failed"]).default("draft"),
        scheduledAt: z.string().optional(),
      });
      
      const data = campaignSchema.parse(req.body);
      
      // Validate targetCustomerIds if custom segment
      if (data.targetSegment === "custom" && (!data.targetCustomerIds || data.targetCustomerIds.length === 0)) {
        return res.status(400).json({ error: "Custom segment requires customer IDs" });
      }
      
      const campaign = await storage.createBroadcastCampaign(req.user!.id, data);
      res.json(campaign);
    } catch (error) {
      console.error("Create campaign error:", error);
      res.status(500).json({ error: "Failed to create campaign" });
    }
  });

  // Get broadcast campaigns
  app.get("/api/broadcast/campaigns", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const campaigns = await storage.getBroadcastCampaigns(req.user!.id, limit);
      res.json(campaigns);
    } catch (error) {
      console.error("Get campaigns error:", error);
      res.status(500).json({ error: "Failed to get campaigns" });
    }
  });

  // Get single campaign
  app.get("/api/broadcast/campaigns/:id", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const { id } = req.params;
      const campaign = await storage.getBroadcastCampaignById(req.user!.id, id);
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }
      res.json(campaign);
    } catch (error) {
      console.error("Get campaign error:", error);
      res.status(500).json({ error: "Failed to get campaign" });
    }
  });

  // Update campaign
  app.put("/api/broadcast/campaigns/:id", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const { id } = req.params;
      const campaign = await storage.updateBroadcastCampaign(req.user!.id, id, req.body);
      res.json(campaign);
    } catch (error) {
      console.error("Update campaign error:", error);
      res.status(500).json({ error: "Failed to update campaign" });
    }
  });

  // Delete campaign
  app.delete("/api/broadcast/campaigns/:id", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteBroadcastCampaign(req.user!.id, id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete campaign error:", error);
      res.status(500).json({ error: "Failed to delete campaign" });
    }
  });

  // Get customer segment (preview)
  app.get("/api/broadcast/segments/:segment", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const { segment } = req.params;
      const customIds = req.query.ids ? (req.query.ids as string).split(',') : undefined;
      const customers = await storage.getCustomerSegment(req.user!.id, segment, customIds);
      res.json({ count: customers.length, customers });
    } catch (error) {
      console.error("Get segment error:", error);
      res.status(500).json({ error: "Failed to get segment" });
    }
  });

  // Send broadcast campaign
  app.post("/api/broadcast/campaigns/:id/send", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const { id } = req.params;
      
      // Prepare and send broadcast
      await storage.sendBroadcast(req.user!.id, id);
      
      // Get updated campaign
      const campaign = await storage.getBroadcastCampaignById(req.user!.id, id);
      
      // TODO: Integrate with Twilio/Resend to actually send messages
      // For now, we just create the message records
      
      res.json({ 
        success: true, 
        message: `Broadcast sedang dihantar kepada ${campaign.totalRecipients} pelanggan`,
        campaign 
      });
    } catch (error: any) {
      console.error("Send broadcast error:", error);
      res.status(500).json({ error: error.message || "Failed to send broadcast" });
    }
  });

  // Get broadcast messages (recipients)
  app.get("/api/broadcast/campaigns/:id/messages", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const { id } = req.params;
      const messages = await storage.getBroadcastMessages(id);
      res.json(messages);
    } catch (error) {
      console.error("Get broadcast messages error:", error);
      res.status(500).json({ error: "Failed to get messages" });
    }
  });

  // ========================================
  // VOUCHER SYSTEM ROUTES
  // ========================================

  app.post("/api/vouchers", requireAuth, blockExpiredTrial, requireLoyaltyPoints, async (req, res) => {
    try {
      const voucherSchema = insertCustomerVoucherSchema.extend({
        validFrom: z.string().optional(),
        validUntil: z.string().optional().nullable(),
      });
      
      const data = voucherSchema.parse(req.body);
      
      // Convert date strings to Date objects for Drizzle
      const voucherData = {
        ...data,
        validFrom: data.validFrom ? new Date(data.validFrom) : new Date(),
        validUntil: data.validUntil ? new Date(data.validUntil) : null,
      };
      
      const voucher = await storage.createVoucher(req.user!.id, voucherData);
      res.json(voucher);
    } catch (error: any) {
      console.error("Create voucher error:", error);
      if (error.issues) {
        // Zod validation error
        return res.status(400).json({ 
          error: "Data voucher tidak sah",
          details: error.issues.map((i: any) => `${i.path.join('.')}: ${i.message}`)
        });
      }
      res.status(500).json({ error: error.message || "Failed to create voucher" });
    }
  });

  app.get("/api/vouchers", requireAuth, blockExpiredTrial, requireLoyaltyPoints, async (req, res) => {
    try {
      const vouchers = await storage.getVouchers(req.user!.id);
      res.json(vouchers);
    } catch (error) {
      console.error("Get vouchers error:", error);
      res.status(500).json({ error: "Failed to get vouchers" });
    }
  });

  app.get("/api/vouchers/:id", requireAuth, blockExpiredTrial, requireLoyaltyPoints, async (req, res) => {
    try {
      const voucher = await storage.getVoucherById(req.user!.id, req.params.id);
      if (!voucher) return res.status(404).json({ error: "Voucher not found" });
      res.json(voucher);
    } catch (error) {
      console.error("Get voucher error:", error);
      res.status(500).json({ error: "Failed to get voucher" });
    }
  });

  app.put("/api/vouchers/:id", requireAuth, blockExpiredTrial, requireLoyaltyPoints, async (req, res) => {
    try {
      const voucher = await storage.updateVoucher(req.user!.id, req.params.id, req.body);
      res.json(voucher);
    } catch (error) {
      console.error("Update voucher error:", error);
      res.status(500).json({ error: "Failed to update voucher" });
    }
  });

  app.delete("/api/vouchers/:id", requireAuth, blockExpiredTrial, requireLoyaltyPoints, async (req, res) => {
    try {
      await storage.deleteVoucher(req.user!.id, req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete voucher error:", error);
      res.status(500).json({ error: "Failed to delete voucher" });
    }
  });

  app.post("/api/vouchers/validate", requireAuth, blockExpiredTrial, requireLoyaltyPoints, async (req, res) => {
    try {
      const { code, customerId, totalAmount } = req.body;
      const result = await storage.validateVoucher(req.user!.id, code, customerId || null, parseFloat(totalAmount));
      res.json(result);
    } catch (error) {
      console.error("Validate voucher error:", error);
      res.status(500).json({ error: "Failed to validate voucher" });
    }
  });

  app.get("/api/vouchers/:id/usage", requireAuth, blockExpiredTrial, requireLoyaltyPoints, async (req, res) => {
    try {
      const usage = await storage.getVoucherUsageHistory(req.user!.id, req.params.id);
      res.json(usage);
    } catch (error) {
      console.error("Get voucher usage error:", error);
      res.status(500).json({ error: "Failed to get usage history" });
    }
  });

  // ========================================
  // BOOKING SYSTEM ROUTES
  // ========================================

  app.post("/api/bookings", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const { items, ...booking } = req.body;
      const newBooking = await storage.createBooking(req.user!.id, booking, items || []);
      res.json(newBooking);
    } catch (error) {
      console.error("Create booking error:", error);
      res.status(500).json({ error: "Failed to create booking" });
    }
  });

  app.get("/api/bookings", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const status = req.query.status as string | undefined;
      const bookings = await storage.getBookings(req.user!.id, limit, status);
      res.json(bookings);
    } catch (error) {
      console.error("Get bookings error:", error);
      res.status(500).json({ error: "Failed to get bookings" });
    }
  });

  app.get("/api/bookings/upcoming", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const daysAhead = parseInt(req.query.days as string) || 7;
      const bookings = await storage.getUpcomingBookings(req.user!.id, daysAhead);
      res.json(bookings);
    } catch (error) {
      console.error("Get upcoming bookings error:", error);
      res.status(500).json({ error: "Failed to get upcoming bookings" });
    }
  });

  app.get("/api/bookings/:id", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const booking = await storage.getBookingById(req.user!.id, req.params.id);
      if (!booking) return res.status(404).json({ error: "Booking not found" });
      res.json(booking);
    } catch (error) {
      console.error("Get booking error:", error);
      res.status(500).json({ error: "Failed to get booking" });
    }
  });

  app.put("/api/bookings/:id", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const booking = await storage.updateBooking(req.user!.id, req.params.id, req.body);
      res.json(booking);
    } catch (error) {
      console.error("Update booking error:", error);
      res.status(500).json({ error: "Failed to update booking" });
    }
  });

  app.delete("/api/bookings/:id", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      await storage.deleteBooking(req.user!.id, req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete booking error:", error);
      res.status(500).json({ error: "Failed to delete booking" });
    }
  });

  app.post("/api/bookings/:id/reminder", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      await storage.markReminderSent(req.user!.id, req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Mark reminder sent error:", error);
      res.status(500).json({ error: "Failed to mark reminder sent" });
    }
  });

  // ========================================
  // VENDOR SALES TRACKING ROUTES
  // ========================================
  
  // Create vendor sale
  app.post("/api/vendor-sales", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const sale = await storage.createVendorSale(req.user!.id, req.body);
      res.json(sale);
    } catch (error) {
      console.error("Create vendor sale error:", error);
      res.status(500).json({ error: "Failed to create vendor sale" });
    }
  });
  
  // Get vendor sales (with filters)
  app.get("/api/vendor-sales", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const { vendorId, startDate, endDate, productId } = req.query;
      const filters: any = {};
      
      if (startDate) filters.startDate = startDate as string;
      if (endDate) filters.endDate = endDate as string;
      if (productId) filters.productId = productId as string;
      
      const sales = await storage.getVendorSales(
        req.user!.id, 
        vendorId as string | undefined,
        filters
      );
      res.json(sales);
    } catch (error) {
      console.error("Get vendor sales error:", error);
      res.status(500).json({ error: "Failed to get vendor sales" });
    }
  });
  
  // Get specific vendor sale
  app.get("/api/vendor-sales/:id", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const sale = await storage.getVendorSaleById(req.user!.id, req.params.id);
      if (!sale) return res.status(404).json({ error: "Vendor sale not found" });
      res.json(sale);
    } catch (error) {
      console.error("Get vendor sale error:", error);
      res.status(500).json({ error: "Failed to get vendor sale" });
    }
  });
  
  // Update vendor sale
  app.put("/api/vendor-sales/:id", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const sale = await storage.updateVendorSale(req.user!.id, req.params.id, req.body);
      res.json(sale);
    } catch (error) {
      console.error("Update vendor sale error:", error);
      res.status(500).json({ error: "Failed to update vendor sale" });
    }
  });
  
  // Delete vendor sale
  app.delete("/api/vendor-sales/:id", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      await storage.deleteVendorSale(req.user!.id, req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete vendor sale error:", error);
      res.status(500).json({ error: "Failed to delete vendor sale" });
    }
  });
  
  // Get sales for specific vendor
  app.get("/api/vendors/:vendorId/sales", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const filters: any = {};
      if (startDate) filters.startDate = startDate as string;
      if (endDate) filters.endDate = endDate as string;
      
      const sales = await storage.getVendorSales(req.user!.id, req.params.vendorId, filters);
      res.json(sales);
    } catch (error) {
      console.error("Get vendor sales error:", error);
      res.status(500).json({ error: "Failed to get vendor sales" });
    }
  });
  
  // ========================================
  // VENDOR STOCK BALANCE ROUTES
  // ========================================
  
  // Get stock balance for vendor
  app.get("/api/vendors/:vendorId/stock-balance", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const balance = await storage.getVendorStockBalance(req.params.vendorId, req.user!.id);
      res.json(balance);
    } catch (error) {
      console.error("Get stock balance error:", error);
      res.status(500).json({ error: "Failed to get stock balance" });
    }
  });
  
  // Get stock balance for specific product at vendor
  app.get("/api/vendors/:vendorId/stock/:productId", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const balance = await storage.getStockBalanceByProduct(
        req.params.vendorId, 
        req.params.productId
      );
      if (!balance) return res.status(404).json({ error: "Stock balance not found" });
      res.json(balance);
    } catch (error) {
      console.error("Get stock balance error:", error);
      res.status(500).json({ error: "Failed to get stock balance" });
    }
  });

  // ========================================
  // VENDOR CLAIMS ROUTES
  // ========================================
  
  // Create vendor claim
  app.post("/api/vendor-claims", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const { claimData, items, photos } = req.body;
      
      if (!items || items.length === 0) {
        return res.status(400).json({ error: "Claim must have at least one item" });
      }
      
      if (!photos || photos.length === 0) {
        return res.status(400).json({ error: "Claim must have at least one photo" });
      }
      
      const claim = await storage.createVendorClaim(req.user!.id, claimData, items, photos);
      res.json(claim);
    } catch (error) {
      console.error("Create vendor claim error:", error);
      res.status(500).json({ error: "Failed to create vendor claim" });
    }
  });
  
  // Get vendor claims (with filters)
  app.get("/api/vendor-claims", requireAuth, blockExpiredTrial, requireVendorClaims, async (req, res) => {
    try {
      const { vendorId, status, startDate, endDate } = req.query;
      const filters: any = {};
      
      if (vendorId) filters.vendorId = vendorId as string;
      if (status) filters.status = status as string;
      if (startDate) filters.startDate = startDate as string;
      if (endDate) filters.endDate = endDate as string;
      
      const claims = await storage.getVendorClaims(req.user!.id, filters);
      res.json(claims);
    } catch (error) {
      console.error("Get vendor claims error:", error);
      res.status(500).json({ error: "Failed to get vendor claims" });
    }
  });
  
  // Get specific vendor claim (with items and photos)
  app.get("/api/vendor-claims/:id", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const claim = await storage.getVendorClaimById(req.user!.id, req.params.id);
      if (!claim) return res.status(404).json({ error: "Claim not found" });
      res.json(claim);
    } catch (error) {
      console.error("Get vendor claim error:", error);
      res.status(500).json({ error: "Failed to get vendor claim" });
    }
  });
  
  // Approve vendor claim
  app.patch("/api/vendor-claims/:id/approve", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const { reviewNotes } = req.body;
      const claim = await storage.approveVendorClaim(req.user!.id, req.params.id, reviewNotes);
      res.json(claim);
    } catch (error: any) {
      console.error("Approve claim error:", error);
      res.status(500).json({ error: error.message || "Failed to approve claim" });
    }
  });
  
  // Reject vendor claim
  app.patch("/api/vendor-claims/:id/reject", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const { reviewNotes } = req.body;
      
      if (!reviewNotes) {
        return res.status(400).json({ error: "Review notes required for rejection" });
      }
      
      const claim = await storage.rejectVendorClaim(req.user!.id, req.params.id, reviewNotes);
      res.json(claim);
    } catch (error: any) {
      console.error("Reject claim error:", error);
      res.status(500).json({ error: error.message || "Failed to reject claim" });
    }
  });
  
  // Get claims for specific vendor
  app.get("/api/vendors/:vendorId/claims", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const { status, startDate, endDate } = req.query;
      const filters: any = { vendorId: req.params.vendorId };
      
      if (status) filters.status = status as string;
      if (startDate) filters.startDate = startDate as string;
      if (endDate) filters.endDate = endDate as string;
      
      const claims = await storage.getVendorClaims(req.user!.id, filters);
      res.json(claims);
    } catch (error) {
      console.error("Get vendor claims error:", error);
      res.status(500).json({ error: "Failed to get vendor claims" });
    }
  });

  // ===================================================================
  // PAYMENT CLAIMS ROUTES (Vendor Payment Claims based on actual sales)
  // ===================================================================
  
  // Create payment claim
  app.post("/api/payment-claims", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const { vendorId, vendorName, claimDate, status, items, deliveryIds, notes } = req.body;
      
      if (!vendorId || !vendorName || !items || items.length === 0) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      
      const claim = await storage.createPaymentClaim(
        req.user!.id,
        { vendorId, vendorName, claimDate, status, notes },
        items,
        deliveryIds || []
      );
      
      res.json(claim);
    } catch (error: any) {
      console.error("Create payment claim error:", error);
      res.status(500).json({ error: error.message || "Failed to create payment claim" });
    }
  });
  
  // Get payment claims
  app.get("/api/payment-claims", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const { vendorId, status, startDate, endDate } = req.query;
      const filters: any = {};
      
      if (vendorId) filters.vendorId = vendorId as string;
      if (status) filters.status = status as string;
      if (startDate) filters.startDate = startDate as string;
      if (endDate) filters.endDate = endDate as string;
      
      const claims = await storage.getPaymentClaims(req.user!.id, filters);
      res.json(claims);
    } catch (error) {
      console.error("Get payment claims error:", error);
      res.status(500).json({ error: "Failed to get payment claims" });
    }
  });
  
  // Get single payment claim
  app.get("/api/payment-claims/:id", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const claim = await storage.getPaymentClaimById(req.user!.id, req.params.id);
      if (!claim) {
        return res.status(404).json({ error: "Claim not found" });
      }
      res.json(claim);
    } catch (error) {
      console.error("Get payment claim error:", error);
      res.status(500).json({ error: "Failed to get payment claim" });
    }
  });
  
  // Update payment claim
  app.patch("/api/payment-claims/:id", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const claim = await storage.updatePaymentClaim(req.user!.id, req.params.id, req.body);
      res.json(claim);
    } catch (error: any) {
      console.error("Update payment claim error:", error);
      res.status(500).json({ error: error.message || "Failed to update payment claim" });
    }
  });
  
  // Delete payment claim (draft only)
  app.delete("/api/payment-claims/:id", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      await storage.deletePaymentClaim(req.user!.id, req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Delete payment claim error:", error);
      res.status(400).json({ error: error.message || "Failed to delete payment claim" });
    }
  });
  
  // Mark payment claim as paid
  app.patch("/api/payment-claims/:id/mark-paid", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const claim = await storage.markPaymentClaimAsPaid(req.user!.id, req.params.id);
      res.json(claim);
    } catch (error: any) {
      console.error("Mark paid error:", error);
      res.status(500).json({ error: error.message || "Failed to mark as paid" });
    }
  });

  // ===================================================================
  // ONLINE STORE CATALOG ROUTES
  // ===================================================================
  
  // Get store settings for current user
  app.get("/api/store-settings", requireAuth, requirePublicStore, async (req, res) => {
    try {
      const settings = await storage.getStoreSettings(req.user!.id);
      res.json(settings || null);
    } catch (error) {
      console.error("Get store settings error:", error);
      res.status(500).json({ error: "Failed to get store settings" });
    }
  });
  
  // Create store settings
  app.post("/api/store-settings", requireAuth, requirePublicStore, async (req, res) => {
    try {
      const { insertStoreSettingsSchema } = await import("@shared/schema");
      const validatedData = insertStoreSettingsSchema.parse(req.body);
      
      const settings = await storage.createStoreSettings(req.user!.id, validatedData);
      res.json(settings);
    } catch (error: any) {
      console.error("Create store settings error:", error);
      
      if (error.message?.includes("already exist")) {
        return res.status(400).json({ error: error.message });
      }
      if (error.message?.includes("already taken")) {
        return res.status(400).json({ error: error.message });
      }
      
      res.status(500).json({ error: "Failed to create store settings" });
    }
  });
  
  // Update store settings
  app.put("/api/store-settings", requireAuth, requirePublicStore, async (req, res) => {
    try {
      const settings = await storage.updateStoreSettings(req.user!.id, req.body);
      res.json(settings);
    } catch (error: any) {
      console.error("Update store settings error:", error);
      
      if (error.message?.includes("not found")) {
        return res.status(404).json({ error: error.message });
      }
      if (error.message?.includes("already taken")) {
        return res.status(400).json({ error: error.message });
      }
      
      res.status(500).json({ error: "Failed to update store settings" });
    }
  });
  
  // Delete store settings
  app.delete("/api/store-settings", requireAuth, requirePublicStore, async (req, res) => {
    try {
      await storage.deleteStoreSettings(req.user!.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete store settings error:", error);
      res.status(500).json({ error: "Failed to delete store settings" });
    }
  });
  
  // PUBLIC ROUTES (no auth required)
  
  // Get public store by slug
  app.get("/api/public/store/:slug", async (req, res) => {
    try {
      // Public store is disabled for launch
      return res.status(403).json({ message: "Public store feature is disabled for launch" });
      const { slug } = req.params;
      
      // Get store settings
      const store = await storage.getStoreSettingsBySlug(slug);
      if (!store) {
        return res.status(404).json({ error: "Store not found or inactive" });
      }
      
      // Get products for this store (user's products)
      const allProducts = await storage.getProducts(store.userId);
      
      // Filter based on store settings
      let products = allProducts;
      if (!store.showOutOfStock) {
        // Hide out of stock products (products with 0 selling price or marked as unavailable)
        products = products.filter(p => parseFloat(p.sellingPrice) > 0);
      }
      
      // Get categories
      const categories = await storage.getCategories(store.userId);
      
      // Track view analytics
      const visitorId = req.headers['x-visitor-id'] as string;
      const referrer = req.headers.referer || req.headers.referrer;
      const userAgent = req.headers['user-agent'];
      
      await storage.trackStoreAnalytics(store.id, 'view', {
        visitorId,
        referrer: referrer as string,
        userAgent: userAgent as string,
      });
      
      res.json({
        store: {
          slug: store.slug,
          businessName: store.businessName,
          description: store.description,
          logoUrl: store.logoUrl,
          coverImageUrl: store.coverImageUrl,
          whatsappNumber: store.whatsappNumber,
          instagramHandle: store.instagramHandle,
          facebookUrl: store.facebookUrl,
          businessHours: store.businessHours,
          address: store.address,
          deliveryInfo: store.deliveryInfo,
          pickupInfo: store.pickupInfo,
          theme: store.theme,
          accentColor: store.accentColor,
        },
        products,
        categories,
      });
    } catch (error) {
      console.error("Get public store error:", error);
      res.status(500).json({ error: "Failed to load store" });
    }
  });
  
  // Track product click
  app.post("/api/public/store/:slug/track", async (req, res) => {
    try {
      // Public store is disabled for launch
      return res.status(403).json({ message: "Public store feature is disabled for launch" });
      const { slug } = req.params;
      const { eventType, productId } = req.body;
      
      const store = await storage.getStoreSettingsBySlug(slug);
      if (!store) {
        return res.status(404).json({ error: "Store not found" });
      }
      
      const visitorId = req.headers['x-visitor-id'] as string;
      const referrer = req.headers.referer || req.headers.referrer;
      const userAgent = req.headers['user-agent'];
      
      await storage.trackStoreAnalytics(store.id, eventType, {
        productId,
        visitorId,
        referrer: referrer as string,
        userAgent: userAgent as string,
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error("Track store analytics error:", error);
      res.status(500).json({ error: "Failed to track event" });
    }
  });

  // ===================================================================
  // CRON JOB ENDPOINTS
  // ===================================================================
  
  const { registerCronEndpoints } = await import("./cron");
  registerCronEndpoints(app);

  const httpServer = createServer(app);
  return httpServer;
}

import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { deliveryItems, earlyBirdTracking } from "@shared/schema";
import { eq, sql } from "drizzle-orm";
import { 
  insertProductSchema,
  insertProductionBatchSchema,
  insertVendorSchema,
  insertDeliverySchema,
  insertSaleSchema,
  insertExpenseSchema,
  insertBusinessProfileSchema,
  insertGoogleDriveSyncLogSchema,
  insertStockItemSchema,
  insertCategorySchema,
  convertUnit,
  insertUserSchema,
  insertSubscriptionPlanSchema,
} from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { uploadPDFToGoogleDrive, listManisBizzFiles } from "./google-drive";

// Auth middleware - adds user object to request if logged in
async function loadUser(req: Request, res: Response, next: NextFunction) {
  if (req.session.userId) {
    const user = await storage.getUserById(req.session.userId);
    if (user) {
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

// Helper: Check if user is on trial and if it's expired
function isTrialExpired(user: any): boolean {
  if (!user.isOnTrial) return false;
  if (!user.trialEndsAt) return false;
  
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

// Middleware: Block expired trial users
async function blockExpiredTrial(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized - please login" });
  }
  
  if (isTrialExpired(req.user)) {
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
      
      // Apply promo code if provided
      let appliedPromo = null;
      if (promoCode) {
        const promo = await storage.getPromoCodeByCode(promoCode);
        if (promo && promo.isActive) {
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
      
      // Store bill reference in session or temporary table
      // For now, we'll return it to frontend
      
      res.json({
        billCode: billResponse.BillCode,
        billUrl: getBillUrl(billResponse.BillCode),
        orderRef,
        totalAmount: totalPrice,
        planName: plan.displayName,
        durationMonths,
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
        // Extract subscription details from order reference
        const orderRef = order_id as string;
        
        // Parse order reference to get user ID and timestamp
        // Format: SUB-{userId}-{timestamp}
        const parts = orderRef.split('-');
        if (parts.length < 3) {
          console.error('Invalid order reference format:', orderRef);
          return res.status(200).send('OK');
        }
        
        const userIdPrefix = parts[1];
        
        // Find user by ID prefix (first 8 chars)
        // In production, you'd store the bill metadata in a temporary table
        // For now, we'll respond with success and handle subscription creation
        // via the return URL callback where we have full context
        
        console.log('Payment verified successfully:', {
          orderRef,
          amount: transaction.billpaymentAmount,
          channel: transaction.billpaymentChannel,
          invoiceNo: transaction.billpaymentInvoiceNo,
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

  app.post("/api/production", async (req, res) => {
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
  app.post("/api/production/confirm", async (req, res) => {
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

  // Vendors
  app.get("/api/vendors", async (req, res) => {
    try {
      const vendors = await storage.getVendors();
      res.json(vendors);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch vendors" });
    }
  });

  app.post("/api/vendors", async (req, res) => {
    try {
      const data = insertVendorSchema.parse(req.body);
      const vendor = await storage.createVendor(data);
      res.json(vendor);
    } catch (error) {
      res.status(400).json({ error: "Invalid vendor data" });
    }
  });

  // Vendor Commissions
  app.get("/api/vendors/:vendorId/commission", async (req, res) => {
    try {
      const { vendorId } = req.params;
      const commission = await storage.getVendorCommission(vendorId);
      res.json(commission || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch vendor commission" });
    }
  });

  app.post("/api/vendors/:vendorId/commission", async (req, res) => {
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

  app.delete("/api/vendors/:vendorId/commission", async (req, res) => {
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

  app.post("/api/stock", async (req, res) => {
    try {
      const data = insertStockItemSchema.parse(req.body);
      const item = await storage.createStockItem(data);
      res.json(item);
    } catch (error: any) {
      res.status(400).json({ error: "Invalid stock item data", message: error.message });
    }
  });

  app.patch("/api/stock/:id", async (req, res) => {
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
  app.post("/api/stock/:id/replenish", async (req, res) => {
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

  app.delete("/api/stock/:id", async (req, res) => {
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

  app.post("/api/deliveries", async (req, res) => {
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

  // Sales
  app.get("/api/sales", async (req, res) => {
    try {
      const sales = await storage.getSales();
      res.json(sales);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch sales" });
    }
  });

  app.post("/api/sales", async (req, res) => {
    try {
      // Extract force flag (it's not part of schema, so remove it before validation)
      const force = req.body.force === true;
      const { force: _, ...bodyWithoutForce } = req.body; // Remove force from body
      
      // Coerce numeric string fields to numbers (HTML forms send numbers as strings)
      if (bodyWithoutForce.quantity) bodyWithoutForce.quantity = Number(bodyWithoutForce.quantity);
      if (bodyWithoutForce.isPaid) bodyWithoutForce.isPaid = Number(bodyWithoutForce.isPaid);
      
      const data = insertSaleSchema.parse(bodyWithoutForce);
      
      // Check for duplicate sale (same product + vendor on same date)
      if (!force && data.productId && data.saleDate) {
        const duplicate = await storage.checkDuplicateSale(
          data.productId, 
          data.vendorId || null, 
          data.saleDate
        );
        
        if (duplicate) {
          return res.status(409).json({
            error: "Duplicate sale detected",
            duplicate: {
              productName: duplicate.productName,
              vendorName: duplicate.vendorName,
              quantity: duplicate.quantity,
              saleDate: duplicate.saleDate,
              totalAmount: duplicate.totalAmount
            }
          });
        }
      }
      
      // Deduct from finished goods batches using FIFO if productId is provided
      if (data.productId && data.quantity) {
        const deductionResult = await storage.deductFromBatches(data.productId, data.quantity);
        if (!deductionResult.success) {
          return res.status(400).json({ 
            error: `Insufficient finished goods stock for ${data.productName}`,
            details: deductionResult
          });
        }
      }
      
      const sale = await storage.createSale(data);
      res.json(sale);
    } catch (error: any) {
      console.error('[ERROR] POST /api/sales failed:', error);
      res.status(400).json({ error: "Invalid sale data" });
    }
  });

  app.patch("/api/sales/:id/paid", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.markSalePaid(id);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: "Failed to mark as paid" });
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
  app.get("/api/reports/profit-loss", async (req, res) => {
    try {
      const report = await storage.getProfitLossReport();
      res.json(report);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch profit/loss report" });
    }
  });

  app.get("/api/reports/top-products", async (req, res) => {
    try {
      const topProducts = await storage.getTopProducts();
      res.json(topProducts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch top products" });
    }
  });

  app.get("/api/reports/top-vendors", async (req, res) => {
    try {
      const topVendors = await storage.getTopVendors();
      res.json(topVendors);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch top vendors" });
    }
  });

  app.get("/api/reports/monthly", async (req, res) => {
    try {
      const monthlyData = await storage.getMonthlyData();
      res.json(monthlyData);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch monthly data" });
    }
  });

  // Claims
  app.get("/api/claims", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const result = await storage.getClaimsSummary(limit, offset);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch claims summary" });
    }
  });

  app.get("/api/claims/:vendorId/details", async (req, res) => {
    try {
      const { vendorId } = req.params;
      const claimDetails = await storage.getClaimDetailsByVendor(vendorId);
      res.json(claimDetails);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch claim details" });
    }
  });

  app.patch("/api/deliveries/:id/payment-status", async (req, res) => {
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

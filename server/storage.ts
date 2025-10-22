// Database integration from blueprint:javascript_database
import { 
  products, 
  ingredients,
  productionBatches,
  vendors,
  deliveries,
  deliveryItems,
  sales,
  salesItems,
  expenses,
  businessProfile,
  googleDriveSyncLog,
  vendorCommissions,
  stockItems,
  recipeItems,
  categories,
  shoppingCart,
  type Product, 
  type InsertProduct,
  type Ingredient,
  type InsertIngredient,
  type ProductionBatch,
  type InsertProductionBatch,
  type Vendor,
  type InsertVendor,
  type Delivery,
  type InsertDelivery,
  type DeliveryItem,
  type InsertDeliveryItem,
  type Sale,
  type InsertSale,
  type SalesItem,
  type InsertSalesItem,
  type Expense,
  type InsertExpense,
  type BusinessProfile,
  type InsertBusinessProfile,
  type GoogleDriveSyncLog,
  type InsertGoogleDriveSyncLog,
  type VendorCommission,
  type InsertVendorCommission,
  type StockItem,
  type InsertStockItem,
  type RecipeItem,
  type InsertRecipeItem,
  type Category,
  type InsertCategory,
  type ShoppingCart,
  type InsertShoppingCart,
  users,
  type User,
  type InsertUser,
  subscriptionPlans,
  type SubscriptionPlan,
  type InsertSubscriptionPlan,
  userSubscriptions,
  type UserSubscription,
  type InsertUserSubscription,
  promoCodes,
  type PromoCode,
  type InsertPromoCode,
  promoCodeUsage,
  earlyBirdTracking,
  pendingBills,
  type PendingBill,
  type InsertPendingBill,
  pricingTiers,
  resellers,
  resellerTransfers,
  resellerTransferItems,
  type PricingTier,
  type InsertPricingTier,
  type Reseller,
  type InsertReseller,
  type ResellerTransfer,
  type InsertResellerTransfer,
  type ResellerTransferItem,
  type InsertResellerTransferItem,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, sql, inArray } from "drizzle-orm";

export interface IStorage {
  // Products
  getProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct, recipeItemsList: any[]): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>, recipeItemsList?: any[]): Promise<Product>;
  deleteProduct(id: string): Promise<void>;
  
  // Recipe Items
  getRecipeItems(productId: string): Promise<any[]>;
  
  // Ingredients (legacy)
  getIngredients(productId: string): Promise<Ingredient[]>;
  
  // Production
  getProductionBatches(): Promise<ProductionBatch[]>;
  createProductionBatch(batch: InsertProductionBatch): Promise<ProductionBatch>;
  
  // Finished Products (Finished Goods Inventory)
  getFinishedProductsSummary(): Promise<any[]>;
  getBatchesByProduct(productId: string): Promise<any[]>;
  deductFromBatches(productId: string, quantity: number): Promise<{ success: boolean; deductions: any[] }>;
  previewBatchDeduction(productId: string, quantity: number): Promise<{ success: boolean; deductions: any[]; totalAvailable: number }>;
  
  // Vendors
  getVendors(): Promise<Vendor[]>;
  getVendor(id: string): Promise<Vendor | undefined>;
  createVendor(vendor: InsertVendor): Promise<Vendor>;
  
  // Deliveries
  getDeliveries(limit?: number, offset?: number): Promise<{ data: any[], hasMore: boolean, total: number }>;
  getDelivery(id: string): Promise<any>;
  getLastDeliveryForVendor(vendorId: string): Promise<any | null>;
  checkDuplicateDelivery(vendorId: string, deliveryDate: string): Promise<any | null>;
  createDelivery(delivery: InsertDelivery, items: InsertDeliveryItem[]): Promise<Delivery>;
  updateDeliveryStatus(id: string, status: string): Promise<void>;
  updateDeliveryPaymentStatus(id: string, paymentStatus: string): Promise<any>;
  updateDeliveryItemRejection(itemId: string, rejectedQty: number, rejectionReason: string | null): Promise<void>;
  
  // POS Sales
  getSales(limit?: number, offset?: number): Promise<{ data: any[], hasMore: boolean, total: number }>;
  getSale(id: string): Promise<any>;
  createSale(sale: InsertSale, items: InsertSalesItem[]): Promise<Sale>;
  generateReceiptNumber(): Promise<string>;
  
  // Expenses
  getExpenses(): Promise<Expense[]>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  
  // Reports
  getDashboardStats(): Promise<any>;
  getProfitLossReport(): Promise<any>;
  getWeeklyProfitSummary(): Promise<any>;
  getTopProducts(): Promise<any[]>;
  getTopVendors(): Promise<any[]>;
  getMonthlyData(): Promise<any[]>;
  
  // Claims
  getClaimsSummary(limit?: number, offset?: number): Promise<{ data: any[], hasMore: boolean, total: number }>;
  getClaimDetailsByVendor(vendorId: string): Promise<any>;
  
  // Business Profile
  getBusinessProfile(): Promise<BusinessProfile | undefined>;
  createOrUpdateBusinessProfile(profile: InsertBusinessProfile): Promise<BusinessProfile>;
  
  // Google Drive Sync
  logGoogleDriveSync(log: InsertGoogleDriveSyncLog): Promise<GoogleDriveSyncLog>;
  getGoogleDriveSyncLogs(): Promise<GoogleDriveSyncLog[]>;
  getGoogleDriveSyncLogsByDelivery(deliveryId: string): Promise<GoogleDriveSyncLog[]>;
  
  // Vendor Commissions
  getVendorCommission(vendorId: string): Promise<VendorCommission | undefined>;
  createOrUpdateVendorCommission(commission: InsertVendorCommission): Promise<VendorCommission>;
  deleteVendorCommission(vendorId: string): Promise<void>;
  
  // Stock Items (Warehouse Inventory)
  getStockItems(): Promise<StockItem[]>;
  getStockItem(id: string): Promise<StockItem | undefined>;
  createStockItem(item: InsertStockItem): Promise<StockItem>;
  updateStockItem(id: string, item: Partial<InsertStockItem>): Promise<StockItem>;
  deleteStockItem(id: string): Promise<void>;
  getLowStockItems(): Promise<StockItem[]>;
  
  // Categories
  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  
  // Recipe Items
  getRecipeItems(productId: string): Promise<RecipeItem[]>;
  createRecipeItem(item: InsertRecipeItem): Promise<RecipeItem>;
  deleteRecipeItems(productId: string): Promise<void>;
  
  // Shopping Cart
  addToShoppingCart(item: InsertShoppingCart): Promise<ShoppingCart>;
  getShoppingCartItems(): Promise<ShoppingCart[]>;
  removeFromCart(id: string): Promise<void>;
  clearCart(): Promise<void>;
  bulkPurchaseAndUpdateStock(cartItemIds: string[]): Promise<void>;
  
  // Users & Authentication
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserById(id: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User>;
  
  // Subscription Plans
  getSubscriptionPlans(): Promise<SubscriptionPlan[]>;
  getSubscriptionPlan(id: string): Promise<SubscriptionPlan | undefined>;
  getSubscriptionPlanById(id: string): Promise<SubscriptionPlan | undefined>; // Alias for consistency
  createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan>;
  updateSubscriptionPlan(id: string, plan: Partial<InsertSubscriptionPlan>): Promise<SubscriptionPlan | undefined>;
  deleteSubscriptionPlan(id: string): Promise<void>;
  
  // User Subscriptions
  getUserSubscriptions(userId: string): Promise<UserSubscription[]>;
  getUserSubscriptionById(id: string): Promise<UserSubscription | undefined>;
  getUserActiveSubscription(userId: string): Promise<UserSubscription | undefined>;
  createUserSubscription(subscription: InsertUserSubscription): Promise<UserSubscription>;
  updateUserSubscription(id: string, data: Partial<InsertUserSubscription>): Promise<UserSubscription | undefined>;
  
  // Promo Codes
  getPromoCodeByCode(code: string): Promise<PromoCode | undefined>;
  getPromoCodeUsageCount(promoCodeId: string): Promise<number>;
  incrementPromoCodeUsage(promoCodeId: string): Promise<void>;
  hasUserUsedPromoCode(userId: string, promoCodeId: string): Promise<boolean>;
  trackPromoCodeUsage(userId: string, promoCodeId: string): Promise<void>;
  
  // Pending Bills
  createPendingBill(bill: InsertPendingBill): Promise<PendingBill>;
  getPendingBillByBillCode(billCode: string): Promise<PendingBill | undefined>;
  markBillAsProcessed(billCode: string): Promise<void>;
  
  // Pricing Tiers (Reseller Module)
  getPricingTiers(): Promise<any[]>;
  createPricingTier(tier: any): Promise<any>;
  updatePricingTier(id: string, tier: any): Promise<any>;
  
  // Resellers
  getResellers(): Promise<any[]>;
  getReseller(id: string): Promise<any | undefined>;
  createReseller(reseller: any): Promise<any>;
  updateReseller(id: string, reseller: any): Promise<any>;
  deleteReseller(id: string): Promise<void>;
  getResellerStats(resellerId: string): Promise<any>;
  
  // Reseller Transfers
  createResellerTransfer(transfer: any, items: any[]): Promise<any>;
  getResellerTransfers(limit?: number, offset?: number): Promise<{ data: any[], hasMore: boolean, total: number }>;
  getResellerTransferById(id: string): Promise<any>;
  generateTransferReceiptNumber(): Promise<string>;
}

export class DatabaseStorage implements IStorage {
  // Products
  async getProducts(): Promise<Product[]> {
    const result = await db.select().from(products).orderBy(desc(products.createdAt));
    
    // Get ingredients for each product
    const productsWithIngredients = await Promise.all(
      result.map(async (product) => {
        const productIngredients = await db.select().from(ingredients).where(eq(ingredients.productId, product.id));
        return { ...product, ingredients: productIngredients };
      })
    );
    
    return productsWithIngredients as any;
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product || undefined;
  }

  async createProduct(product: InsertProduct, recipeItemsList: any[]): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    
    // Insert recipe items (new stock-based system)
    if (recipeItemsList.length > 0) {
      const recipeItemsWithProductId = recipeItemsList.map(item => ({
        ...item,
        productId: newProduct.id,
      }));
      await db.insert(recipeItems).values(recipeItemsWithProductId);
    }
    
    return newProduct;
  }

  async updateProduct(id: string, product: Partial<InsertProduct>, recipeItemsList?: any[]): Promise<Product> {
    const [updatedProduct] = await db.update(products).set(product).where(eq(products.id, id)).returning();
    
    // Update recipe items if provided
    if (recipeItemsList && recipeItemsList.length > 0) {
      // Delete existing recipe items
      await db.delete(recipeItems).where(eq(recipeItems.productId, id));
      
      // Insert new recipe items
      const recipeItemsWithProductId = recipeItemsList.map(item => ({
        ...item,
        productId: id,
      }));
      await db.insert(recipeItems).values(recipeItemsWithProductId);
    }
    
    return updatedProduct;
  }

  async deleteProduct(id: string): Promise<void> {
    // Delete recipe items first (foreign key constraint)
    await db.delete(recipeItems).where(eq(recipeItems.productId, id));
    
    // Delete the product
    await db.delete(products).where(eq(products.id, id));
  }

  // Ingredients
  async getIngredients(productId: string): Promise<Ingredient[]> {
    return await db.select().from(ingredients).where(eq(ingredients.productId, productId));
  }

  // Production
  async getProductionBatches(): Promise<ProductionBatch[]> {
    return await db.select().from(productionBatches).orderBy(desc(productionBatches.batchDate));
  }

  async createProductionBatch(batch: InsertProductionBatch): Promise<ProductionBatch> {
    const [newBatch] = await db.insert(productionBatches).values(batch).returning();
    return newBatch;
  }

  // Finished Products (Finished Goods Inventory)
  async getFinishedProductsSummary(): Promise<any[]> {
    // Aggregate batches by product, sum remaining quantities, get nearest expiry
    const summary = await db
      .select({
        productId: productionBatches.productId,
        productName: productionBatches.productName,
        totalRemaining: sql<string>`COALESCE(SUM(${productionBatches.remainingQty}), 0)`,
        nearestExpiry: sql<string>`MIN(${productionBatches.expiryDate})`,
        batchCount: sql<string>`COUNT(*)`,
      })
      .from(productionBatches)
      .where(sql`${productionBatches.remainingQty} > 0`)
      .groupBy(productionBatches.productId, productionBatches.productName);
    
    return summary;
  }

  async getBatchesByProduct(productId: string): Promise<any[]> {
    // Get all batches for a product with expiry status
    // Order by: non-null expiry dates first (ascending), then null expiry, then by creation date for deterministic ordering
    const batches = await db
      .select()
      .from(productionBatches)
      .where(
        and(
          eq(productionBatches.productId, productId),
          sql`${productionBatches.remainingQty} > 0`
        )
      )
      .orderBy(
        sql`CASE WHEN ${productionBatches.expiryDate} IS NULL THEN 1 ELSE 0 END`,
        productionBatches.expiryDate,
        productionBatches.createdAt
      ); // FIFO: earliest expiry first, nulls last, then by creation date
    
    return batches;
  }

  async previewBatchDeduction(productId: string, quantity: number): Promise<{ success: boolean; deductions: any[]; totalAvailable: number }> {
    // Preview FIFO deduction WITHOUT modifying database - read-only simulation
    // Get batches ordered by FIFO (same logic as actual deduction)
    const batches = await db
      .select()
      .from(productionBatches)
      .where(
        and(
          eq(productionBatches.productId, productId),
          sql`${productionBatches.remainingQty} > 0`
        )
      )
      .orderBy(
        sql`CASE WHEN ${productionBatches.expiryDate} IS NULL THEN 1 ELSE 0 END`,
        productionBatches.expiryDate,
        productionBatches.createdAt
      );
    
    // Calculate total availability
    const totalAvailable = batches.reduce((sum, batch) => sum + parseFloat(batch.remainingQty), 0);
    
    if (totalAvailable < quantity) {
      // Insufficient stock
      return {
        success: false,
        deductions: [],
        totalAvailable,
      };
    }
    
    // Simulate FIFO deduction (read-only)
    let remainingToDeduct = quantity;
    const deductions: any[] = [];
    
    for (const batch of batches) {
      if (remainingToDeduct <= 0) break;
      
      const batchRemaining = parseFloat(batch.remainingQty);
      const deductAmount = Math.min(remainingToDeduct, batchRemaining);
      const newRemaining = batchRemaining - deductAmount;
      
      // Calculate days until expiry for warnings
      let daysUntilExpiry: number | null = null;
      if (batch.expiryDate) {
        const today = new Date();
        const expiry = new Date(batch.expiryDate);
        daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      }
      
      deductions.push({
        batchId: batch.id,
        batchDate: batch.batchDate,
        expiryDate: batch.expiryDate,
        deductedQty: deductAmount,
        remainingBefore: batchRemaining,
        remainingAfter: newRemaining,
        daysUntilExpiry,
      });
      
      remainingToDeduct -= deductAmount;
    }
    
    return {
      success: true,
      deductions,
      totalAvailable,
    };
  }

  async deductFromBatches(productId: string, quantity: number): Promise<{ success: boolean; deductions: any[] }> {
    // FIFO deduction with transaction and locking to prevent race conditions and data loss
    return await db.transaction(async (tx) => {
      // Step 1: Lock and get batches ordered by FIFO
      const batches = await tx
        .select()
        .from(productionBatches)
        .where(
          and(
            eq(productionBatches.productId, productId),
            sql`${productionBatches.remainingQty} > 0`
          )
        )
        .orderBy(
          sql`CASE WHEN ${productionBatches.expiryDate} IS NULL THEN 1 ELSE 0 END`,
          productionBatches.expiryDate,
          productionBatches.createdAt
        )
        .for('update'); // Row-level lock to prevent concurrent modifications
      
      // Step 2: Check total availability before any mutation
      const totalAvailable = batches.reduce((sum, batch) => sum + parseFloat(batch.remainingQty), 0);
      
      if (totalAvailable < quantity) {
        // Insufficient stock - rollback transaction (automatic on throw)
        return {
          success: false,
          deductions: [],
        };
      }
      
      // Step 3: Perform FIFO deduction
      let remainingToDeduct = quantity;
      const deductions: any[] = [];
      
      for (const batch of batches) {
        if (remainingToDeduct <= 0) break;
        
        const batchRemaining = parseFloat(batch.remainingQty);
        const deductAmount = Math.min(remainingToDeduct, batchRemaining);
        const newRemaining = batchRemaining - deductAmount;
        
        // Update batch remaining quantity within transaction
        await tx
          .update(productionBatches)
          .set({ remainingQty: newRemaining.toString() })
          .where(eq(productionBatches.id, batch.id));
        
        deductions.push({
          batchId: batch.id,
          batchDate: batch.batchDate,
          expiryDate: batch.expiryDate,
          deductedQty: deductAmount,
          remainingAfter: newRemaining,
        });
        
        remainingToDeduct -= deductAmount;
      }
      
      // Transaction commits automatically if we return successfully
      return {
        success: true,
        deductions,
      };
    });
  }

  // Vendors
  async getVendors(): Promise<Vendor[]> {
    return await db.select().from(vendors).orderBy(desc(vendors.createdAt));
  }

  async getVendor(id: string): Promise<Vendor | undefined> {
    const [vendor] = await db.select().from(vendors).where(eq(vendors.id, id));
    return vendor || undefined;
  }

  async createVendor(vendor: InsertVendor): Promise<Vendor> {
    const [newVendor] = await db.insert(vendors).values(vendor).returning();
    return newVendor;
  }

  // Deliveries
  async getDeliveries(limit: number = 20, offset: number = 0): Promise<{ data: any[], hasMore: boolean, total: number }> {
    // Get total count
    const totalResult = await db.select({ count: sql<number>`count(*)` }).from(deliveries);
    const total = Number(totalResult[0]?.count || 0);
    
    // Get paginated deliveries
    const result = await db
      .select()
      .from(deliveries)
      .orderBy(desc(deliveries.deliveryDate))
      .limit(limit + 1) // Fetch one extra to check if there's more
      .offset(offset);
    
    const hasMore = result.length > limit;
    const deliveriesToReturn = hasMore ? result.slice(0, limit) : result;
    
    // Get items for each delivery with commission breakdown
    const deliveriesWithItems = await Promise.all(
      deliveriesToReturn.map(async (delivery) => {
        const items = await db.select().from(deliveryItems).where(eq(deliveryItems.deliveryId, delivery.id));
        
        // Calculate gross, rejected, net amounts
        let grossAmount = 0;
        let rejectedAmount = 0;
        
        items.forEach(item => {
          const itemGross = item.quantity * parseFloat(item.unitPrice);
          const itemRejected = (item.rejectedQty || 0) * parseFloat(item.unitPrice);
          
          grossAmount += itemGross;
          rejectedAmount += itemRejected;
        });
        
        const netAmount = grossAmount - rejectedAmount;
        const commission = await this.calculateCommission(delivery.vendorId, netAmount);
        const claimableAmount = netAmount - commission;
        
        return { 
          ...delivery, 
          items,
          grossAmount: grossAmount.toFixed(2),
          rejectedAmount: rejectedAmount.toFixed(2),
          netAmount: netAmount.toFixed(2),
          commission: commission.toFixed(2),
          claimableAmount: claimableAmount.toFixed(2),
        };
      })
    );
    
    return {
      data: deliveriesWithItems,
      hasMore,
      total
    };
  }

  async getDelivery(id: string): Promise<any> {
    const [delivery] = await db.select().from(deliveries).where(eq(deliveries.id, id));
    if (!delivery) return undefined;
    
    const items = await db.select().from(deliveryItems).where(eq(deliveryItems.deliveryId, id));
    
    // Calculate gross, rejected, net amounts, and commission
    let grossAmount = 0;
    let rejectedAmount = 0;
    
    items.forEach(item => {
      const itemGross = item.quantity * parseFloat(item.unitPrice);
      const itemRejected = (item.rejectedQty || 0) * parseFloat(item.unitPrice);
      
      grossAmount += itemGross;
      rejectedAmount += itemRejected;
    });
    
    const netAmount = grossAmount - rejectedAmount;
    const commission = await this.calculateCommission(delivery.vendorId, netAmount);
    const claimableAmount = netAmount - commission;
    
    return { 
      ...delivery, 
      items,
      grossAmount: grossAmount.toFixed(2),
      rejectedAmount: rejectedAmount.toFixed(2),
      netAmount: netAmount.toFixed(2),
      commission: commission.toFixed(2),
      claimableAmount: claimableAmount.toFixed(2),
    };
  }

  async getLastDeliveryForVendor(vendorId: string): Promise<any | null> {
    const [lastDelivery] = await db
      .select()
      .from(deliveries)
      .where(eq(deliveries.vendorId, vendorId))
      .orderBy(desc(deliveries.deliveryDate))
      .limit(1);
    
    if (!lastDelivery) return null;
    
    // Get items for this delivery
    const items = await db
      .select()
      .from(deliveryItems)
      .where(eq(deliveryItems.deliveryId, lastDelivery.id));
    
    return {
      ...lastDelivery,
      items
    };
  }

  async checkDuplicateDelivery(vendorId: string, deliveryDate: string): Promise<any | null> {
    const [existing] = await db
      .select()
      .from(deliveries)
      .where(
        and(
          eq(deliveries.vendorId, vendorId),
          eq(deliveries.deliveryDate, deliveryDate)
        )
      )
      .limit(1);
    
    return existing || null;
  }

  async createDelivery(delivery: InsertDelivery, items: InsertDeliveryItem[]): Promise<Delivery> {
    // Use transaction with advisory lock to prevent race conditions in invoice number generation
    return await db.transaction(async (tx) => {
      // Format: INV-YYYYMMDD-XXXX
      const date = new Date(delivery.deliveryDate);
      const dateStr = date.toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD
      
      // Use PostgreSQL advisory lock to serialize invoice generation per date
      // Convert date string to integer for advisory lock (e.g., 20251015 -> numeric)
      const lockId = parseInt(dateStr);
      
      // Acquire advisory lock for this date (automatically released at transaction end)
      await tx.execute(sql`SELECT pg_advisory_xact_lock(${lockId})`);
      
      // Now safely find the latest invoice number for this date
      const latestInvoice = await tx
        .select()
        .from(deliveries)
        .where(sql`${deliveries.invoiceNumber} LIKE ${'INV-' + dateStr + '-%'}`)
        .orderBy(desc(deliveries.invoiceNumber))
        .limit(1);
      
      let sequenceNumber = 1;
      if (latestInvoice.length > 0 && latestInvoice[0].invoiceNumber) {
        // Extract sequence number from INV-YYYYMMDD-XXXX
        const parts = latestInvoice[0].invoiceNumber.split('-');
        if (parts.length === 3) {
          sequenceNumber = parseInt(parts[2]) + 1;
        }
      }
      
      // Format sequence number with leading zeros (4 digits)
      const sequenceStr = sequenceNumber.toString().padStart(4, '0');
      const invoiceNumber = `INV-${dateStr}-${sequenceStr}`;
      
      // Insert delivery with generated invoice number
      const [newDelivery] = await tx.insert(deliveries).values({
        ...delivery,
        invoiceNumber,
      }).returning();
      
      // Insert delivery items
      if (items.length > 0) {
        const itemsWithDeliveryId = items.map(item => ({
          ...item,
          deliveryId: newDelivery.id,
        }));
        await tx.insert(deliveryItems).values(itemsWithDeliveryId);
      }
      
      return newDelivery;
    });
  }

  async updateDeliveryStatus(id: string, status: string): Promise<void> {
    await db.update(deliveries)
      .set({ status: status as any })
      .where(eq(deliveries.id, id));
  }

  async updateDeliveryPaymentStatus(id: string, paymentStatus: string): Promise<any> {
    const [updated] = await db.update(deliveries)
      .set({ paymentStatus: paymentStatus as any })
      .where(eq(deliveries.id, id))
      .returning();
    return updated;
  }

  async updateDeliveryItemRejection(itemId: string, rejectedQty: number, rejectionReason: string | null): Promise<void> {
    await db.update(deliveryItems)
      .set({ 
        rejectedQty,
        rejectionReason 
      })
      .where(eq(deliveryItems.id, itemId));
  }

  // POS Sales
  async generateReceiptNumber(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD
    
    // Get today's sales count for sequence number
    const todaySales = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(sales)
      .where(eq(sales.saleDate, today.toISOString().split('T')[0]));
    
    const sequence = (todaySales[0]?.count || 0) + 1;
    const paddedSequence = sequence.toString().padStart(4, '0');
    
    return `RES-${dateStr}-${paddedSequence}`;
  }

  async getSales(limit: number = 50, offset: number = 0): Promise<{ data: any[], hasMore: boolean, total: number }> {
    // Get total count
    const countResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(sales);
    const total = countResult[0]?.count || 0;

    // Get sales with items
    const salesData = await db
      .select()
      .from(sales)
      .orderBy(desc(sales.saleDate), desc(sales.createdAt))
      .limit(limit + 1)
      .offset(offset);

    const hasMore = salesData.length > limit;
    const data = salesData.slice(0, limit);

    // Fetch items for each sale
    const salesWithItems = await Promise.all(
      data.map(async (sale) => {
        const items = await db
          .select()
          .from(salesItems)
          .where(eq(salesItems.saleId, sale.id));
        
        return {
          ...sale,
          items,
        };
      })
    );

    return {
      data: salesWithItems,
      hasMore,
      total,
    };
  }

  async getSale(id: string): Promise<any> {
    const [sale] = await db
      .select()
      .from(sales)
      .where(eq(sales.id, id))
      .limit(1);

    if (!sale) return null;

    const items = await db
      .select()
      .from(salesItems)
      .where(eq(salesItems.saleId, id));

    return {
      ...sale,
      items,
    };
  }

  async createSale(sale: InsertSale, items: InsertSalesItem[]): Promise<Sale> {
    // Use transaction for atomic sale creation with FIFO stock deduction
    return await db.transaction(async (tx) => {
      // Step 1: Generate receipt number
      const receiptNumber = await this.generateReceiptNumber();
      
      // Step 2: Create the sale record
      const [newSale] = await tx.insert(sales).values({
        ...sale,
        receiptNumber,
      }).returning();

      // Step 3: Process each item with FIFO deduction
      const createdItems: SalesItem[] = [];
      
      for (const item of items) {
        // Deduct from finished goods using FIFO
        const deductionResult = await this.deductFromBatches(item.productId, item.quantity);
        
        if (!deductionResult.success) {
          // Rollback transaction if insufficient stock
          throw new Error(`Insufficient stock for product ${item.productName}. Required: ${item.quantity}, available less.`);
        }

        // Create sales item records (one per batch used in FIFO)
        for (const deduction of deductionResult.deductions) {
          const unitPrice = parseFloat(item.unitPrice || "0");
          const unitCost = parseFloat(item.unitCost || "0");
          const quantity = Math.floor(deduction.deductedQty);
          
          const [salesItem] = await tx.insert(salesItems).values({
            ...item,
            saleId: newSale.id,
            quantity, // Quantity from this batch
            totalPrice: (unitPrice * deduction.deductedQty).toFixed(2),
            totalCost: (unitCost * deduction.deductedQty).toFixed(2),
            profitAmount: ((unitPrice - unitCost) * deduction.deductedQty).toFixed(2),
            batchId: deduction.batchId,
          }).returning();
          
          createdItems.push(salesItem);
        }
      }

      // Transaction commits automatically if we return successfully
      return newSale;
    });
  }

  // Expenses
  async getExpenses(): Promise<Expense[]> {
    return await db.select().from(expenses).orderBy(desc(expenses.expenseDate));
  }

  async createExpense(expense: InsertExpense): Promise<Expense> {
    const [newExpense] = await db.insert(expenses).values(expense).returning();
    return newExpense;
  }

  // Reports
  async getDashboardStats(): Promise<any> {
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Today's production
    const todayProduction = await db.select({
      total: sql<number>`COALESCE(SUM(${productionBatches.quantity}), 0)`,
    })
      .from(productionBatches)
      .where(eq(productionBatches.batchDate, today));

    // Today's production cost
    const todayProductionCost = await db.select({
      total: sql<string>`COALESCE(SUM(${productionBatches.totalCost}), 0)`,
    })
      .from(productionBatches)
      .where(eq(productionBatches.batchDate, today));

    // Today's sales (value)
    const todaySales = await db.select({
      total: sql<string>`COALESCE(SUM(${sales.totalAmount}), 0)`,
    })
      .from(sales)
      .where(eq(sales.saleDate, today));

    // Today's sales (quantity) - sum from salesItems
    const todaySalesQty = await db.select({
      total: sql<number>`COALESCE(SUM(${salesItems.quantity}), 0)`,
    })
      .from(salesItems)
      .leftJoin(sales, eq(salesItems.saleId, sales.id))
      .where(eq(sales.saleDate, today));

    // Today's deliveries (quantity delivered to vendors)
    const todayDeliveries = await db.select({
      total: sql<number>`COALESCE(SUM(${deliveryItems.quantity}), 0)`,
    })
      .from(deliveryItems)
      .leftJoin(deliveries, eq(deliveryItems.deliveryId, deliveries.id))
      .where(eq(deliveries.deliveryDate, today));

    // Today's expenses (Modal Hari Ini)
    const todayExpenses = await db.select({
      total: sql<string>`COALESCE(SUM(${expenses.amount}), 0)`,
    })
      .from(expenses)
      .where(eq(expenses.expenseDate, today));

    // Today's rejections
    const todayRejections = await db.select({
      count: sql<number>`COALESCE(SUM(${deliveryItems.rejectedQty}), 0)`,
      value: sql<string>`COALESCE(SUM(${deliveryItems.rejectedQty} * ${deliveryItems.unitPrice}), 0)`,
    })
      .from(deliveryItems)
      .leftJoin(deliveries, eq(deliveryItems.deliveryId, deliveries.id))
      .where(eq(deliveries.deliveryDate, today));

    // Week's sales
    const weekSales = await db.select({
      total: sql<string>`COALESCE(SUM(${sales.totalAmount}), 0)`,
    })
      .from(sales)
      .where(gte(sales.saleDate, weekAgo));

    // Total revenue and costs
    const totalRevenue = await db.select({
      total: sql<string>`COALESCE(SUM(${sales.totalAmount}), 0)`,
    }).from(sales);

    const totalProductionCost = await db.select({
      total: sql<string>`COALESCE(SUM(${productionBatches.totalCost}), 0)`,
    }).from(productionBatches);

    const totalExpenses = await db.select({
      total: sql<string>`COALESCE(SUM(${expenses.amount}), 0)`,
    }).from(expenses);

    const revenue = parseFloat(totalRevenue[0]?.total || "0");
    const prodCost = parseFloat(totalProductionCost[0]?.total || "0");
    const expCost = parseFloat(totalExpenses[0]?.total || "0");
    const netProfit = revenue - prodCost - expCost;

    // Today's profit calculation
    const todaySalesValue = parseFloat(todaySales[0]?.total || "0");
    const todayProdCost = parseFloat(todayProductionCost[0]?.total || "0");
    const todayExpValue = parseFloat(todayExpenses[0]?.total || "0");
    const todayProfit = todaySalesValue - todayProdCost - todayExpValue;

    // Calculate flow metrics
    const productionQty = todayProduction[0]?.total || 0;
    const deliveredQty = todayDeliveries[0]?.total || 0;
    const soldQty = todaySalesQty[0]?.total || 0;
    const balanceQty = productionQty - deliveredQty;

    // Finished Goods Inventory Metrics
    const totalReadyStock = await db.select({
      total: sql<string>`COALESCE(SUM(${productionBatches.remainingQty}), 0)`,
    })
      .from(productionBatches)
      .where(sql`${productionBatches.remainingQty} > 0`);

    const expiringSoon = await db.select({
      count: sql<number>`COUNT(*)`,
    })
      .from(productionBatches)
      .where(
        and(
          sql`${productionBatches.remainingQty} > 0`,
          sql`${productionBatches.expiryDate} IS NOT NULL`,
          sql`${productionBatches.expiryDate} <= CURRENT_DATE + INTERVAL '3 days'`,
          sql`${productionBatches.expiryDate} >= CURRENT_DATE`
        )
      );

    // Current month's commission projection - removed as commission calculation is separate
    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const monthlyCommission = [{ total: "0" }]; // TODO: Calculate from vendor commissions if needed

    return {
      todayProduction: productionQty,
      todaySales: todaySalesValue.toFixed(2),
      weekSales: parseFloat(weekSales[0]?.total || "0").toFixed(2),
      netProfit: netProfit.toFixed(2),
      // New metrics
      todayExpenses: todayExpValue.toFixed(2),
      todayProfit: todayProfit.toFixed(2),
      todayRejectionsCount: todayRejections[0]?.count || 0,
      todayRejectionsValue: parseFloat(todayRejections[0]?.value || "0").toFixed(2),
      monthlyCommission: parseFloat(monthlyCommission[0]?.total || "0").toFixed(2),
      // Production-Delivery-Sales Flow
      todayProductionQty: productionQty,
      todayDeliveredQty: deliveredQty,
      todaySoldQty: soldQty,
      todayBalanceQty: balanceQty,
      // Finished Goods Inventory
      totalReadyStock: parseFloat(totalReadyStock[0]?.total || "0"),
      expiringSoonCount: expiringSoon[0]?.count || 0,
      alerts: [],
    };
  }

  async getProfitLossReport(): Promise<any> {
    const totalSalesResult = await db.select({
      total: sql<string>`COALESCE(SUM(${sales.totalAmount}), 0)`,
    }).from(sales);

    const totalCostsResult = await db.select({
      production: sql<string>`COALESCE(SUM(${productionBatches.totalCost}), 0)`,
      expenses: sql<string>`COALESCE(SUM(${expenses.amount}), 0)`,
    }).from(productionBatches).fullJoin(expenses, sql`1=1`);

    // Calculate total rejection losses (value of rejected items)
    const rejectionLossResult = await db.select({
      total: sql<string>`COALESCE(SUM(${deliveryItems.rejectedQty} * ${deliveryItems.unitPrice}), 0)`,
    }).from(deliveryItems);

    const totalSales = parseFloat(totalSalesResult[0]?.total || "0");
    const productionCost = parseFloat(totalCostsResult[0]?.production || "0");
    const expensesCost = parseFloat(totalCostsResult[0]?.expenses || "0");
    const rejectionLoss = parseFloat(rejectionLossResult[0]?.total || "0");
    const totalCosts = productionCost + expensesCost + rejectionLoss;
    const netProfit = totalSales - totalCosts;
    const profitMargin = totalSales > 0 ? ((netProfit / totalSales) * 100).toFixed(1) : "0";

    return {
      totalSales: totalSales.toFixed(2),
      totalCosts: totalCosts.toFixed(2),
      rejectionLoss: rejectionLoss.toFixed(2),
      netProfit: netProfit.toFixed(2),
      profitMargin,
    };
  }

  async getWeeklyProfitSummary(): Promise<any> {
    const now = new Date();
    
    // Calculate date ranges for current week (Monday to Sunday)
    const currentDay = now.getDay();
    const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1; // Sunday = 0, adjust to Monday-based week
    const currentWeekStart = new Date(now);
    currentWeekStart.setDate(now.getDate() - daysFromMonday);
    currentWeekStart.setHours(0, 0, 0, 0);
    
    const currentWeekEnd = new Date(currentWeekStart);
    currentWeekEnd.setDate(currentWeekStart.getDate() + 6);
    currentWeekEnd.setHours(23, 59, 59, 999);
    
    // Previous week dates
    const lastWeekStart = new Date(currentWeekStart);
    lastWeekStart.setDate(currentWeekStart.getDate() - 7);
    
    const lastWeekEnd = new Date(currentWeekStart);
    lastWeekEnd.setDate(currentWeekStart.getDate() - 1);
    lastWeekEnd.setHours(23, 59, 59, 999);

    // Current week sales (from POS + deliveries claimed)
    const currentWeekSales = await db.select({
      pos: sql<string>`COALESCE(SUM(CASE WHEN ${sales.saleDate} >= ${currentWeekStart.toISOString()} AND ${sales.saleDate} <= ${currentWeekEnd.toISOString()} THEN ${sales.totalAmount} ELSE 0 END), 0)`,
      deliveries: sql<string>`COALESCE(SUM(CASE WHEN ${deliveries.deliveryDate} >= ${currentWeekStart.toISOString()} AND ${deliveries.deliveryDate} <= ${currentWeekEnd.toISOString()} AND ${deliveries.status} = 'claimed' THEN ${deliveries.totalAmount} ELSE 0 END), 0)`,
    }).from(sales).fullJoin(deliveries, sql`1=1`);

    // Last week sales
    const lastWeekSales = await db.select({
      pos: sql<string>`COALESCE(SUM(CASE WHEN ${sales.saleDate} >= ${lastWeekStart.toISOString()} AND ${sales.saleDate} <= ${lastWeekEnd.toISOString()} THEN ${sales.totalAmount} ELSE 0 END), 0)`,
      deliveries: sql<string>`COALESCE(SUM(CASE WHEN ${deliveries.deliveryDate} >= ${lastWeekStart.toISOString()} AND ${deliveries.deliveryDate} <= ${lastWeekEnd.toISOString()} AND ${deliveries.status} = 'claimed' THEN ${deliveries.totalAmount} ELSE 0 END), 0)`,
    }).from(sales).fullJoin(deliveries, sql`1=1`);

    // Current week costs
    const currentWeekCosts = await db.select({
      production: sql<string>`COALESCE(SUM(CASE WHEN ${productionBatches.batchDate} >= ${currentWeekStart.toISOString()} AND ${productionBatches.batchDate} <= ${currentWeekEnd.toISOString()} THEN ${productionBatches.totalCost} ELSE 0 END), 0)`,
      expenses: sql<string>`COALESCE(SUM(CASE WHEN ${expenses.expenseDate} >= ${currentWeekStart.toISOString()} AND ${expenses.expenseDate} <= ${currentWeekEnd.toISOString()} THEN ${expenses.amount} ELSE 0 END), 0)`,
    }).from(productionBatches).fullJoin(expenses, sql`1=1`);

    // Last week costs
    const lastWeekCosts = await db.select({
      production: sql<string>`COALESCE(SUM(CASE WHEN ${productionBatches.batchDate} >= ${lastWeekStart.toISOString()} AND ${productionBatches.batchDate} <= ${lastWeekEnd.toISOString()} THEN ${productionBatches.totalCost} ELSE 0 END), 0)`,
      expenses: sql<string>`COALESCE(SUM(CASE WHEN ${expenses.expenseDate} >= ${lastWeekStart.toISOString()} AND ${expenses.expenseDate} <= ${lastWeekEnd.toISOString()} THEN ${expenses.amount} ELSE 0 END), 0)`,
    }).from(productionBatches).fullJoin(expenses, sql`1=1`);

    // Calculate totals
    const currentRevenue = parseFloat(currentWeekSales[0]?.pos || "0") + parseFloat(currentWeekSales[0]?.deliveries || "0");
    const lastRevenue = parseFloat(lastWeekSales[0]?.pos || "0") + parseFloat(lastWeekSales[0]?.deliveries || "0");
    
    const currentCosts = parseFloat(currentWeekCosts[0]?.production || "0") + parseFloat(currentWeekCosts[0]?.expenses || "0");
    const lastCosts = parseFloat(lastWeekCosts[0]?.production || "0") + parseFloat(lastWeekCosts[0]?.expenses || "0");
    
    const currentProfit = currentRevenue - currentCosts;
    const lastProfit = lastRevenue - lastCosts;
    
    // Calculate week-over-week change
    const revenueChange = lastRevenue > 0 ? ((currentRevenue - lastRevenue) / lastRevenue) * 100 : 0;
    const profitChange = lastProfit > 0 ? ((currentProfit - lastProfit) / lastProfit) * 100 : 0;
    
    // Profit margin
    const profitMargin = currentRevenue > 0 ? (currentProfit / currentRevenue) * 100 : 0;

    return {
      currentWeek: {
        revenue: currentRevenue.toFixed(2),
        costs: currentCosts.toFixed(2),
        profit: currentProfit.toFixed(2),
        profitMargin: profitMargin.toFixed(1),
      },
      lastWeek: {
        revenue: lastRevenue.toFixed(2),
        costs: lastCosts.toFixed(2),
        profit: lastProfit.toFixed(2),
      },
      comparison: {
        revenueChange: revenueChange.toFixed(1),
        profitChange: profitChange.toFixed(1),
        isGrowth: profitChange >= 0,
      },
      weekRange: {
        start: currentWeekStart.toISOString().split('T')[0],
        end: currentWeekEnd.toISOString().split('T')[0],
      },
    };
  }

  async getTopProducts(): Promise<any[]> {
    // Use salesItems instead of sales to get product-level stats
    const topProducts = await db.select({
      id: products.id,
      name: products.name,
      totalSold: sql<number>`COALESCE(SUM(${salesItems.quantity}), 0)`,
      totalRevenue: sql<string>`COALESCE(SUM(${salesItems.totalPrice}), 0)`,
      totalCost: sql<string>`COALESCE(SUM(${salesItems.totalCost}), 0)`,
      totalProfit: sql<string>`COALESCE(SUM(${salesItems.profitAmount}), 0)`,
    })
      .from(products)
      .leftJoin(salesItems, eq(products.id, salesItems.productId))
      .groupBy(products.id, products.name)
      .orderBy(sql`COALESCE(SUM(${salesItems.totalPrice}), 0) DESC`)
      .limit(5);

    return topProducts.map(p => ({
      id: p.id,
      name: p.name,
      totalSold: p.totalSold,
      totalRevenue: parseFloat(p.totalRevenue || "0").toFixed(2),
      totalCost: parseFloat(p.totalCost || "0").toFixed(2),
      totalProfit: parseFloat(p.totalProfit || "0").toFixed(2),
    }));
  }

  async getTopVendors(): Promise<any[]> {
    const topVendors = await db.select({
      id: vendors.id,
      name: vendors.name,
      totalDeliveries: sql<number>`COUNT(${deliveries.id})`,
      totalAmount: sql<string>`COALESCE(SUM(${deliveries.totalAmount}), 0)`,
    })
      .from(vendors)
      .leftJoin(deliveries, eq(vendors.id, deliveries.vendorId))
      .groupBy(vendors.id, vendors.name)
      .orderBy(sql`COALESCE(SUM(${deliveries.totalAmount}), 0) DESC`)
      .limit(5);

    return topVendors;
  }

  async getMonthlyData(): Promise<any[]> {
    // This is a simplified version - in production, you'd want proper date grouping
    return [];
  }

  // Helper function to calculate commission
  private async calculateCommission(vendorId: string, amount: number): Promise<number> {
    const commission = await this.getVendorCommission(vendorId);
    
    if (!commission) {
      return 0;
    }

    if (commission.commissionType === 'percentage') {
      const percentage = parseFloat(commission.percentage || '0');
      return (amount * percentage) / 100;
    } else if (commission.commissionType === 'fixed_range') {
      try {
        const ranges = JSON.parse(commission.ranges || '[]');
        // Find the applicable range
        for (const range of ranges) {
          if (amount >= parseFloat(range.min) && amount <= parseFloat(range.max)) {
            return parseFloat(range.amount);
          }
        }
        // If no range matches, check if amount exceeds all ranges
        if (ranges.length > 0) {
          const maxRange = ranges[ranges.length - 1];
          if (amount > parseFloat(maxRange.max)) {
            return parseFloat(maxRange.amount);
          }
        }
      } catch {
        return 0;
      }
    }

    return 0;
  }

  // Claims
  async getClaimsSummary(limit: number = 20, offset: number = 0): Promise<{ data: any[], hasMore: boolean, total: number }> {
    // Get all unique vendors from deliveries
    const uniqueVendors = await db.selectDistinct({
      vendorId: deliveries.vendorId,
      vendorName: deliveries.vendorName,
    })
      .from(deliveries);

    // Calculate detailed claims for each vendor with latest delivery date
    const claimsSummary = await Promise.all(
      uniqueVendors.map(async (vendor) => {
        const details = await this.getClaimDetailsByVendor(vendor.vendorId);
        
        // Get latest delivery date for this vendor
        const latestDelivery = details.deliveries && details.deliveries.length > 0 
          ? new Date(details.deliveries[0].deliveryDate).getTime() 
          : 0;
        
        return {
          vendorId: vendor.vendorId,
          vendorName: vendor.vendorName,
          totalDeliveries: details.totalDeliveries,
          totalAmount: details.claimableAmount, // Use claimable amount (after commission & rejections)
          pendingAmount: details.pendingAmount,
          settledAmount: details.settledAmount,
          partialAmount: details.partialAmount,
          latestDeliveryDate: latestDelivery,
        };
      })
    );

    // Sort by latest delivery date descending (most recent first)
    const sortedClaims = claimsSummary.sort((a, b) => b.latestDeliveryDate - a.latestDeliveryDate);
    
    const total = sortedClaims.length;
    const paginatedClaims = sortedClaims.slice(offset, offset + limit);
    const hasMore = offset + limit < total;

    return {
      data: paginatedClaims,
      hasMore,
      total
    };
  }

  async getClaimDetailsByVendor(vendorId: string): Promise<any> {
    // Get all deliveries for this vendor
    const vendorDeliveries = await db.select()
      .from(deliveries)
      .where(eq(deliveries.vendorId, vendorId))
      .orderBy(desc(deliveries.deliveryDate));

    // Get items for each delivery with detailed per-item calculation
    const deliveriesWithItems = await Promise.all(
      vendorDeliveries.map(async (delivery) => {
        const items = await db.select()
          .from(deliveryItems)
          .where(eq(deliveryItems.deliveryId, delivery.id));
        
        // Calculate gross, rejected, and net amounts for this delivery
        let grossAmount = 0;
        let rejectedAmount = 0;
        
        items.forEach(item => {
          const itemGross = item.quantity * parseFloat(item.unitPrice);
          const itemRejected = (item.rejectedQty || 0) * parseFloat(item.unitPrice);
          
          grossAmount += itemGross;
          rejectedAmount += itemRejected;
        });

        const netAmount = grossAmount - rejectedAmount;
        const commission = await this.calculateCommission(vendorId, netAmount);
        const claimableAmount = netAmount - commission;

        // Calculate per-item commission and claimable amounts
        const itemsWithCommission = items.map(item => {
          const itemGross = item.quantity * parseFloat(item.unitPrice);
          const itemRejected = (item.rejectedQty || 0) * parseFloat(item.unitPrice);
          const itemNet = itemGross - itemRejected;
          
          // Proportionally distribute commission based on item's net amount
          const itemCommission = netAmount > 0 ? (itemNet / netAmount) * commission : 0;
          const itemClaimable = itemNet - itemCommission;
          
          return {
            ...item,
            itemGross: itemGross.toFixed(2),
            itemRejected: itemRejected.toFixed(2),
            itemNet: itemNet.toFixed(2),
            itemCommission: itemCommission.toFixed(2),
            itemClaimable: itemClaimable.toFixed(2),
          };
        });

        return {
          ...delivery,
          items: itemsWithCommission,
          grossAmount: grossAmount.toFixed(2),
          rejectedAmount: rejectedAmount.toFixed(2),
          netAmount: netAmount.toFixed(2),
          commission: commission.toFixed(2),
          claimableAmount: claimableAmount.toFixed(2),
        };
      })
    );

    // Calculate overall summary
    let totalGross = 0;
    let totalRejected = 0;
    let totalCommission = 0;
    
    deliveriesWithItems.forEach(d => {
      totalGross += parseFloat(d.grossAmount);
      totalRejected += parseFloat(d.rejectedAmount);
      totalCommission += parseFloat(d.commission);
    });

    const totalNet = totalGross - totalRejected;
    const totalClaimable = totalNet - totalCommission;

    const pendingAmount = deliveriesWithItems
      .filter(d => d.paymentStatus === 'pending')
      .reduce((sum, d) => sum + parseFloat(d.claimableAmount), 0);
    const settledAmount = deliveriesWithItems
      .filter(d => d.paymentStatus === 'settled')
      .reduce((sum, d) => sum + parseFloat(d.claimableAmount), 0);
    const partialAmount = deliveriesWithItems
      .filter(d => d.paymentStatus === 'partial')
      .reduce((sum, d) => sum + parseFloat(d.claimableAmount), 0);

    return {
      vendorId,
      vendorName: vendorDeliveries[0]?.vendorName || '',
      totalDeliveries: vendorDeliveries.length,
      grossAmount: totalGross.toFixed(2),
      rejectedAmount: totalRejected.toFixed(2),
      commissionAmount: totalCommission.toFixed(2),
      netAmount: totalNet.toFixed(2),
      claimableAmount: totalClaimable.toFixed(2),
      pendingAmount: pendingAmount.toFixed(2),
      settledAmount: settledAmount.toFixed(2),
      partialAmount: partialAmount.toFixed(2),
      deliveries: deliveriesWithItems,
    };
  }

  // Business Profile
  async getBusinessProfile(): Promise<BusinessProfile | undefined> {
    const [profile] = await db.select().from(businessProfile).limit(1);
    return profile || undefined;
  }

  async createOrUpdateBusinessProfile(profile: InsertBusinessProfile): Promise<BusinessProfile> {
    // Check if profile exists
    const existing = await this.getBusinessProfile();
    
    if (existing) {
      // Update existing profile
      const [updated] = await db.update(businessProfile)
        .set({ ...profile, updatedAt: new Date() })
        .where(eq(businessProfile.id, existing.id))
        .returning();
      return updated;
    } else {
      // Create new profile
      const [newProfile] = await db.insert(businessProfile).values(profile).returning();
      return newProfile;
    }
  }

  // Google Drive Sync
  async logGoogleDriveSync(log: InsertGoogleDriveSyncLog): Promise<GoogleDriveSyncLog> {
    const [syncLog] = await db.insert(googleDriveSyncLog).values(log).returning();
    return syncLog;
  }

  async getGoogleDriveSyncLogs(): Promise<GoogleDriveSyncLog[]> {
    const logs = await db.select()
      .from(googleDriveSyncLog)
      .orderBy(desc(googleDriveSyncLog.syncedAt))
      .limit(100);
    return logs;
  }

  async getGoogleDriveSyncLogsByDelivery(deliveryId: string): Promise<GoogleDriveSyncLog[]> {
    const logs = await db.select()
      .from(googleDriveSyncLog)
      .where(eq(googleDriveSyncLog.deliveryId, deliveryId))
      .orderBy(desc(googleDriveSyncLog.syncedAt));
    return logs;
  }

  // Vendor Commissions
  async getVendorCommission(vendorId: string): Promise<VendorCommission | undefined> {
    const [commission] = await db.select()
      .from(vendorCommissions)
      .where(eq(vendorCommissions.vendorId, vendorId))
      .limit(1);
    return commission || undefined;
  }

  async createOrUpdateVendorCommission(commission: InsertVendorCommission): Promise<VendorCommission> {
    // Check if commission exists for this vendor
    const existing = await this.getVendorCommission(commission.vendorId);
    
    if (existing) {
      // Update existing commission
      const [updated] = await db.update(vendorCommissions)
        .set({ ...commission, updatedAt: new Date() })
        .where(eq(vendorCommissions.vendorId, commission.vendorId))
        .returning();
      return updated;
    } else {
      // Create new commission
      const [newCommission] = await db.insert(vendorCommissions).values(commission).returning();
      return newCommission;
    }
  }

  async deleteVendorCommission(vendorId: string): Promise<void> {
    await db.delete(vendorCommissions).where(eq(vendorCommissions.vendorId, vendorId));
  }
  
  // Stock Items (Warehouse Inventory)
  async getStockItems(): Promise<StockItem[]> {
    return await db.select().from(stockItems).orderBy(desc(stockItems.createdAt));
  }
  
  async getStockItem(id: string): Promise<StockItem | undefined> {
    const result = await db.select().from(stockItems).where(eq(stockItems.id, id));
    return result[0];
  }
  
  async createStockItem(item: InsertStockItem): Promise<StockItem> {
    const result = await db.insert(stockItems).values(item).returning();
    return result[0];
  }
  
  async updateStockItem(id: string, item: Partial<InsertStockItem>): Promise<StockItem> {
    const result = await db.update(stockItems)
      .set({ ...item, updatedAt: new Date() })
      .where(eq(stockItems.id, id))
      .returning();
    return result[0];
  }
  
  async deleteStockItem(id: string): Promise<void> {
    await db.delete(stockItems).where(eq(stockItems.id, id));
  }
  
  async getLowStockItems(): Promise<StockItem[]> {
    return await db.select().from(stockItems)
      .where(sql`${stockItems.currentQuantity} <= ${stockItems.lowStockThreshold}`)
      .orderBy(stockItems.currentQuantity);
  }
  
  // Categories
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories).orderBy(categories.name);
  }
  
  async createCategory(category: InsertCategory): Promise<Category> {
    const result = await db.insert(categories).values(category).returning();
    return result[0];
  }
  
  // Recipe Items
  async getRecipeItems(productId: string): Promise<RecipeItem[]> {
    return await db.select().from(recipeItems).where(eq(recipeItems.productId, productId));
  }
  
  async createRecipeItem(item: InsertRecipeItem): Promise<RecipeItem> {
    const result = await db.insert(recipeItems).values(item).returning();
    return result[0];
  }
  
  async deleteRecipeItems(productId: string): Promise<void> {
    await db.delete(recipeItems).where(eq(recipeItems.productId, productId));
  }
  
  // Shopping Cart
  async addToShoppingCart(item: InsertShoppingCart): Promise<ShoppingCart> {
    const result = await db.insert(shoppingCart).values(item).returning();
    return result[0];
  }
  
  async getShoppingCartItems(): Promise<ShoppingCart[]> {
    return await db.select().from(shoppingCart).orderBy(desc(shoppingCart.createdAt));
  }
  
  async removeFromCart(id: string): Promise<void> {
    await db.delete(shoppingCart).where(eq(shoppingCart.id, id));
  }
  
  async clearCart(): Promise<void> {
    await db.delete(shoppingCart);
  }
  
  async bulkPurchaseAndUpdateStock(cartItemIds: string[]): Promise<void> {
    // Start transaction
    await db.transaction(async (tx) => {
      // Get all cart items using inArray
      const items = await tx.select().from(shoppingCart).where(
        inArray(shoppingCart.id, cartItemIds)
      );
      
      // Update stock for each item
      for (const item of items) {
        const stockItem = await tx.select().from(stockItems).where(
          eq(stockItems.id, item.stockItemId)
        ).limit(1);
        
        if (stockItem.length > 0) {
          const currentQty = parseFloat(stockItem[0].currentQuantity);
          const shortage = parseFloat(item.shortageQty);
          const newQty = currentQty + shortage;
          
          await tx.update(stockItems)
            .set({ 
              currentQuantity: newQty.toString(),
              updatedAt: new Date()
            })
            .where(eq(stockItems.id, item.stockItemId));
        }
      }
      
      // Remove purchased items from cart using inArray
      await tx.delete(shoppingCart).where(
        inArray(shoppingCart.id, cartItemIds)
      );
    });
  }
  
  // Users & Authentication
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }
  
  async getUserById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }
  
  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }
  
  async updateUser(id: string, userData: Partial<InsertUser>): Promise<User> {
    const [updatedUser] = await db.update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }
  
  // Subscription Plans
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return await db.select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.isActive, 1))
      .orderBy(subscriptionPlans.sortOrder);
  }
  
  async getSubscriptionPlan(id: string): Promise<SubscriptionPlan | undefined> {
    const [plan] = await db.select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.id, id));
    return plan || undefined;
  }
  
  async createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan> {
    const [newPlan] = await db.insert(subscriptionPlans).values(plan).returning();
    return newPlan;
  }
  
  async updateSubscriptionPlan(id: string, planData: Partial<InsertSubscriptionPlan>): Promise<SubscriptionPlan | undefined> {
    const [updatedPlan] = await db.update(subscriptionPlans)
      .set(planData)
      .where(eq(subscriptionPlans.id, id))
      .returning();
    return updatedPlan || undefined;
  }
  
  async deleteSubscriptionPlan(id: string): Promise<void> {
    await db.delete(subscriptionPlans).where(eq(subscriptionPlans.id, id));
  }
  
  async getSubscriptionPlanById(id: string): Promise<SubscriptionPlan | undefined> {
    return this.getSubscriptionPlan(id); // Alias for consistency
  }
  
  // User Subscriptions
  async getUserSubscriptions(userId: string): Promise<UserSubscription[]> {
    return await db.select()
      .from(userSubscriptions)
      .where(eq(userSubscriptions.userId, userId))
      .orderBy(userSubscriptions.createdAt);
  }
  
  async getUserSubscriptionById(id: string): Promise<UserSubscription | undefined> {
    const [subscription] = await db.select()
      .from(userSubscriptions)
      .where(eq(userSubscriptions.id, id))
      .limit(1);
    return subscription;
  }
  
  async getUserActiveSubscription(userId: string): Promise<UserSubscription | undefined> {
    const now = new Date();
    const [activeSub] = await db.select()
      .from(userSubscriptions)
      .where(
        and(
          eq(userSubscriptions.userId, userId),
          eq(userSubscriptions.status, 'active')
        )
      )
      .orderBy(userSubscriptions.subscriptionEndsAt);
    
    // Check if subscription is still valid (not expired)
    if (activeSub && activeSub.subscriptionEndsAt && new Date(activeSub.subscriptionEndsAt) > now) {
      return activeSub;
    }
    
    return undefined;
  }
  
  async createUserSubscription(subscription: InsertUserSubscription): Promise<UserSubscription> {
    const [newSubscription] = await db.insert(userSubscriptions).values(subscription).returning();
    return newSubscription;
  }
  
  async updateUserSubscription(id: string, data: Partial<InsertUserSubscription>): Promise<UserSubscription | undefined> {
    const [updated] = await db.update(userSubscriptions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(userSubscriptions.id, id))
      .returning();
    return updated || undefined;
  }
  
  // Promo Codes
  async getPromoCodeByCode(code: string): Promise<PromoCode | undefined> {
    const [promo] = await db.select()
      .from(promoCodes)
      .where(eq(promoCodes.code, code.toUpperCase()));
    return promo || undefined;
  }
  
  async getPromoCodeUsageCount(promoCodeId: string): Promise<number> {
    const [promo] = await db.select()
      .from(promoCodes)
      .where(eq(promoCodes.id, promoCodeId));
    return promo?.currentUses || 0;
  }
  
  async incrementPromoCodeUsage(promoCodeId: string): Promise<void> {
    await db.update(promoCodes)
      .set({ currentUses: sql`${promoCodes.currentUses} + 1` })
      .where(eq(promoCodes.id, promoCodeId));
  }
  
  async hasUserUsedPromoCode(userId: string, promoCodeId: string): Promise<boolean> {
    const [usage] = await db.select()
      .from(promoCodeUsage)
      .where(
        and(
          eq(promoCodeUsage.userId, userId),
          eq(promoCodeUsage.promoCodeId, promoCodeId)
        )
      );
    return !!usage;
  }
  
  async trackPromoCodeUsage(userId: string, promoCodeId: string): Promise<void> {
    await db.insert(promoCodeUsage).values({
      userId,
      promoCodeId,
    });
  }
  
  // Pending Bills
  async createPendingBill(bill: InsertPendingBill): Promise<PendingBill> {
    const [newBill] = await db.insert(pendingBills).values(bill).returning();
    return newBill;
  }
  
  async getPendingBillByBillCode(billCode: string): Promise<PendingBill | undefined> {
    const [bill] = await db.select()
      .from(pendingBills)
      .where(eq(pendingBills.billCode, billCode));
    return bill || undefined;
  }
  
  async markBillAsProcessed(billCode: string): Promise<void> {
    await db.update(pendingBills)
      .set({ 
        isProcessed: 1, 
        processedAt: new Date() 
      })
      .where(eq(pendingBills.billCode, billCode));
  }
  
  async getEarlyBirdUsedSlots(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(earlyBirdTracking);
    return result[0]?.count || 0;
  }
  
  // Pricing Tiers (Reseller Module)
  async getPricingTiers(): Promise<any[]> {
    const tiers = await db.select()
      .from(pricingTiers)
      .orderBy(desc(pricingTiers.createdAt));
    return tiers;
  }
  
  async createPricingTier(tier: any): Promise<any> {
    const [newTier] = await db.insert(pricingTiers).values(tier).returning();
    return newTier;
  }
  
  async updatePricingTier(id: string, tier: any): Promise<any> {
    const [updatedTier] = await db.update(pricingTiers)
      .set(tier)
      .where(eq(pricingTiers.id, id))
      .returning();
    return updatedTier;
  }
  
  // Resellers
  async getResellers(): Promise<any[]> {
    const resellerList = await db.select({
      reseller: resellers,
      tier: pricingTiers
    })
      .from(resellers)
      .leftJoin(pricingTiers, eq(resellers.pricingTierId, pricingTiers.id))
      .orderBy(desc(resellers.createdAt));
    
    return resellerList.map(r => ({
      ...r.reseller,
      pricingTier: r.tier
    }));
  }
  
  async getReseller(id: string): Promise<any | undefined> {
    const [result] = await db.select({
      reseller: resellers,
      tier: pricingTiers
    })
      .from(resellers)
      .leftJoin(pricingTiers, eq(resellers.pricingTierId, pricingTiers.id))
      .where(eq(resellers.id, id));
    
    if (!result) return undefined;
    
    return {
      ...result.reseller,
      pricingTier: result.tier
    };
  }
  
  async createReseller(reseller: any): Promise<any> {
    const [newReseller] = await db.insert(resellers).values(reseller).returning();
    return newReseller;
  }
  
  async updateReseller(id: string, reseller: any): Promise<any> {
    const [updatedReseller] = await db.update(resellers)
      .set(reseller)
      .where(eq(resellers.id, id))
      .returning();
    return updatedReseller;
  }
  
  async deleteReseller(id: string): Promise<void> {
    await db.delete(resellers).where(eq(resellers.id, id));
  }
  
  async getResellerStats(resellerId: string): Promise<any> {
    // Get total transfers
    const transfers = await db.select()
      .from(resellerTransfers)
      .where(eq(resellerTransfers.resellerId, resellerId));
    
    // Get last transfer date
    const [lastTransfer] = await db.select()
      .from(resellerTransfers)
      .where(eq(resellerTransfers.resellerId, resellerId))
      .orderBy(desc(resellerTransfers.transferDate))
      .limit(1);
    
    return {
      totalTransfers: transfers.length,
      totalAmount: transfers.reduce((sum, t) => sum + parseFloat(t.totalAmount || '0'), 0),
      lastTransferDate: lastTransfer?.transferDate || null
    };
  }
  
  // Reseller Transfers
  async generateTransferReceiptNumber(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD
    
    // Get count of transfers today
    const todayTransfers = await db.select()
      .from(resellerTransfers)
      .where(sql`DATE(${resellerTransfers.createdAt}) = CURRENT_DATE`);
    
    const nextNumber = todayTransfers.length + 1;
    const paddedNumber = nextNumber.toString().padStart(4, '0');
    
    return `TRF-${dateStr}-${paddedNumber}`;
  }
  
  async createResellerTransfer(transfer: any, items: any[]): Promise<any> {
    // Start transaction
    const [newTransfer] = await db.insert(resellerTransfers).values(transfer).returning();
    
    // Insert transfer items
    if (items.length > 0) {
      const itemsWithTransferId = items.map(item => ({
        ...item,
        transferId: newTransfer.id
      }));
      await db.insert(resellerTransferItems).values(itemsWithTransferId);
    }
    
    // Update reseller total purchases
    await db.update(resellers)
      .set({ 
        totalPurchases: sql`${resellers.totalPurchases} + ${transfer.totalAmount}` 
      })
      .where(eq(resellers.id, transfer.resellerId));
    
    return newTransfer;
  }
  
  async getResellerTransfers(limit: number = 50, offset: number = 0): Promise<{ data: any[], hasMore: boolean, total: number }> {
    const transfers = await db.select({
      transfer: resellerTransfers,
      reseller: resellers
    })
      .from(resellerTransfers)
      .leftJoin(resellers, eq(resellerTransfers.resellerId, resellers.id))
      .orderBy(desc(resellerTransfers.transferDate))
      .limit(limit + 1)
      .offset(offset);
    
    const hasMore = transfers.length > limit;
    const data = transfers.slice(0, limit).map(t => ({
      ...t.transfer,
      reseller: t.reseller
    }));
    
    // Get total count
    const [countResult] = await db.select({ count: sql<number>`count(*)` })
      .from(resellerTransfers);
    
    return {
      data,
      hasMore,
      total: countResult?.count || 0
    };
  }
  
  async getResellerTransferById(id: string): Promise<any> {
    const [result] = await db.select({
      transfer: resellerTransfers,
      reseller: resellers
    })
      .from(resellerTransfers)
      .leftJoin(resellers, eq(resellerTransfers.resellerId, resellers.id))
      .where(eq(resellerTransfers.id, id));
    
    if (!result) return undefined;
    
    // Get transfer items
    const items = await db.select()
      .from(resellerTransferItems)
      .where(eq(resellerTransferItems.transferId, id));
    
    return {
      ...result.transfer,
      reseller: result.reseller,
      items
    };
  }
}

export const storage = new DatabaseStorage();

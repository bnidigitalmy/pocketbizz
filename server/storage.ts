// Database integration from blueprint:javascript_database
import { 
  products, 
  ingredients,
  productionBatches,
  vendors,
  suppliers,
  deliveries,
  deliveryItems,
  sales,
  salesItems,
  expenses,
  businessProfile,
  googleDriveSyncLog,
  vendorCommissions,
  stockItems,
  stockMovements,
  recipeItems,
  categories,
  shoppingCart,
  purchaseOrders,
  purchaseOrderItems,
  poTemplates,
  poTemplateItems,
  type Product, 
  type InsertProduct,
  type Ingredient,
  type InsertIngredient,
  type ProductionBatch,
  type InsertProductionBatch,
  type Vendor,
  type InsertVendor,
  type Supplier,
  type InsertSupplier,
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
  type StockMovement,
  type InsertStockMovement,
  type RecipeItem,
  type InsertRecipeItem,
  type Category,
  type InsertCategory,
  type ShoppingCart,
  type InsertShoppingCart,
  type PurchaseOrder,
  type InsertPurchaseOrder,
  type PurchaseOrderItem,
  type InsertPurchaseOrderItem,
  users,
  type User,
  type InsertUser,
  notifications,
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
  goals,
  type Goal,
  type InsertGoal,
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
  customers,
  loyaltyPointsHistory,
  type Customer,
  type InsertCustomer,
  type LoyaltyPointsHistory,
  type InsertLoyaltyPointsHistory,
  messageTemplates,
  broadcastCampaigns,
  broadcastMessages,
  type MessageTemplate,
  type InsertMessageTemplate,
  type BroadcastCampaign,
  type InsertBroadcastCampaign,
  type BroadcastMessage,
  type InsertBroadcastMessage,
  customerVouchers,
  voucherUsage,
  type CustomerVoucher,
  type InsertCustomerVoucher,
  type VoucherUsage,
  type InsertVoucherUsage,
  bookings,
  bookingItems,
  type Booking,
  type InsertBooking,
  type BookingItem,
  type InsertBookingItem,
  vendorSales,
  vendorStockBalance,
  vendorClaims,
  claimItems,
  claimPhotos,
  paymentClaims,
  paymentClaimItems,
  paymentClaimDeliveries,
  type VendorSale,
  type InsertVendorSale,
  type VendorStockBalance,
  type InsertVendorStockBalance,
  type VendorClaim,
  type InsertVendorClaim,
  type ClaimItem,
  type InsertClaimItem,
  type ClaimPhoto,
  type InsertClaimPhoto,
  type PaymentClaim,
  type InsertPaymentClaim,
  type PaymentClaimItem,
  type InsertPaymentClaimItem,
  type PaymentClaimDelivery,
  type InsertPaymentClaimDelivery,
  storeSettings,
  storeAnalytics,
  type StoreSettings,
  type InsertStoreSettings,
  type StoreAnalytics,
  type InsertStoreAnalytics,
} from "../shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, gt, asc, sql, inArray, like } from "drizzle-orm";

export interface IStorage {
  // Products
  getProducts(userId: string): Promise<Product[]>;
  getProduct(userId: string, id: string): Promise<Product | undefined>;
  getProductCount(userId: string): Promise<number>;
  createProduct(userId: string, product: InsertProduct, recipeItemsList: any[]): Promise<Product>;
  updateProduct(userId: string, id: string, product: Partial<InsertProduct>, recipeItemsList?: any[]): Promise<Product>;
  deleteProduct(userId: string, id: string): Promise<void>;
  
  // Recipe Items
  getRecipeItems(productId: string): Promise<any[]>;
  validateRecipe(userId: string, recipeItems: any[]): Promise<{valid: boolean; errors: string[]}>;
  
  // Ingredients (legacy)
  getIngredients(userId: string, productId: string): Promise<Ingredient[]>;
  
  // Production
  getProductionBatches(userId: string): Promise<ProductionBatch[]>;
  createProductionBatch(userId: string, batch: InsertProductionBatch): Promise<ProductionBatch>;
  
  // Finished Products (Finished Goods Inventory)
  getFinishedProductsSummary(userId: string): Promise<any[]>;
  getBatchesByProduct(userId: string, productId: string): Promise<any[]>;
  deductFromBatches(userId: string, productId: string, quantity: number): Promise<{ success: boolean; deductions: any[] }>;
  previewBatchDeduction(userId: string, productId: string, quantity: number): Promise<{ success: boolean; deductions: any[]; totalAvailable: number }>;
  
  // Vendors
  getVendors(userId: string): Promise<Vendor[]>;
  getVendor(userId: string, id: string): Promise<Vendor | undefined>;
  createVendor(userId: string, vendor: InsertVendor): Promise<Vendor>;
  
  // Suppliers
  getSuppliers(userId: string): Promise<Supplier[]>;
  getSupplier(userId: string, id: string): Promise<Supplier | undefined>;
  createSupplier(userId: string, supplier: InsertSupplier): Promise<Supplier>;
  updateSupplier(userId: string, id: string, supplier: Partial<InsertSupplier>): Promise<Supplier>;
  deleteSupplier(userId: string, id: string): Promise<void>;
  
  // Deliveries
  getDeliveries(userId: string, limit?: number, offset?: number): Promise<{ data: any[], hasMore: boolean, total: number }>;
  getDelivery(userId: string, id: string): Promise<any>;
  getLastDeliveryForVendor(userId: string, vendorId: string): Promise<any | null>;
  checkDuplicateDelivery(userId: string, vendorId: string, deliveryDate: string): Promise<any | null>;
  createDelivery(userId: string, delivery: InsertDelivery, items: InsertDeliveryItem[]): Promise<Delivery>;
  updateDeliveryStatus(userId: string, id: string, status: string): Promise<void>;
  updateDeliveryPaymentStatus(userId: string, id: string, paymentStatus: string): Promise<any>;
  updateDeliveryItemRejection(userId: string, itemId: string, rejectedQty: number, rejectionReason: string | null): Promise<void>;
  getAllDeliveries(userId: string): Promise<any[]>;
  
  // POS Sales
  getSales(userId: string, limit?: number, offset?: number): Promise<{ data: any[], hasMore: boolean, total: number }>;
  getSale(userId: string, id: string): Promise<any>;
  createSale(userId: string, sale: InsertSale, items: InsertSalesItem[]): Promise<Sale>;
  generateReceiptNumber(userId: string): Promise<string>;
  getAllSales(userId: string, startDate?: string, endDate?: string): Promise<any[]>;
  
  // Expenses
  getExpenses(userId: string): Promise<Expense[]>;
  createExpense(userId: string, expense: InsertExpense): Promise<Expense>;
  
  // Reports
  getDashboardStats(userId: string): Promise<any>;
  getProfitLossReport(userId: string): Promise<any>;
  getWeeklyProfitSummary(userId: string): Promise<any>;
  getTopProducts(userId: string): Promise<any[]>;
  getTopVendors(userId: string): Promise<any[]>;
  getMonthlyData(userId: string): Promise<any[]>;
  
  // Advanced Analytics
  getProductPerformanceAnalytics(userId: string): Promise<any>;
  getVendorPerformanceLeaderboard(userId: string): Promise<any[]>;
  getAgentPerformanceLeaderboard(userId: string): Promise<any[]>;
  getSalesTrendData(userId: string, days: number): Promise<any[]>;
  
  // Claims
  getClaimsSummary(userId: string, limit?: number, offset?: number): Promise<{ data: any[], hasMore: boolean, total: number }>;
  getClaimDetailsByVendor(userId: string, vendorId: string): Promise<any>;
  
  // Business Profile
  getBusinessProfile(userId: string): Promise<BusinessProfile | undefined>;
  createOrUpdateBusinessProfile(userId: string, profile: InsertBusinessProfile): Promise<BusinessProfile>;
  
  // Google Drive Sync
  logGoogleDriveSync(userId: string, log: InsertGoogleDriveSyncLog): Promise<GoogleDriveSyncLog>;
  getGoogleDriveSyncLogs(userId: string): Promise<GoogleDriveSyncLog[]>;
  getGoogleDriveSyncLogsByDelivery(userId: string, deliveryId: string): Promise<GoogleDriveSyncLog[]>;
  
  // Vendor Commissions
  getVendorCommission(userId: string, vendorId: string): Promise<VendorCommission | undefined>;
  createOrUpdateVendorCommission(userId: string, commission: InsertVendorCommission): Promise<VendorCommission>;
  deleteVendorCommission(userId: string, vendorId: string): Promise<void>;
  
  // Stock Items (Warehouse Inventory)
  getStockItems(userId: string): Promise<StockItem[]>;
  getStockItem(userId: string, id: string): Promise<StockItem | undefined>;
  getStockItemsByIds(ids: string[], userId: string): Promise<StockItem[]>;
  createStockItem(userId: string, item: InsertStockItem): Promise<StockItem>;
  updateStockItem(userId: string, id: string, item: Partial<InsertStockItem>, expectedVersion?: number): Promise<StockItem>;
  deleteStockItem(userId: string, id: string): Promise<void>;
  deleteAllStockItems(userId: string): Promise<void>;
  getLowStockItems(userId: string): Promise<StockItem[]>;
  
  // Stock Movements (Audit Trail)
  logStockMovement(movement: InsertStockMovement): Promise<StockMovement>;
  getStockMovements(userId: string, stockItemId?: string): Promise<StockMovement[]>;
  
  // Categories
  getCategories(userId: string): Promise<Category[]>;
  createCategory(userId: string, category: InsertCategory): Promise<Category>;
  
  // Recipe Items
  getRecipeItems(productId: string): Promise<RecipeItem[]>;
  createRecipeItem(item: InsertRecipeItem): Promise<RecipeItem>;
  deleteRecipeItems(productId: string): Promise<void>;
  
  // Shopping Cart
  addToShoppingCart(userId: string, item: InsertShoppingCart): Promise<ShoppingCart>;
  getShoppingCartItems(userId: string): Promise<ShoppingCart[]>;
  removeFromCart(userId: string, id: string): Promise<void>;
  clearCart(userId: string): Promise<void>;
  bulkPurchaseAndUpdateStock(userId: string, cartItemIds: string[]): Promise<void>;
  
  // Purchase Orders (Smart Supplier Order Hub)
  createPurchaseOrder(userId: string, order: InsertPurchaseOrder, items: InsertPurchaseOrderItem[]): Promise<PurchaseOrder>;
  getPurchaseOrders(userId: string): Promise<any[]>; // Returns orders with items
  getPurchaseOrder(userId: string, id: string): Promise<any | undefined>; // Returns order with items
  updatePurchaseOrderStatus(userId: string, id: string, status: string, additionalData?: Partial<InsertPurchaseOrder>): Promise<PurchaseOrder>;
  updatePurchaseOrder(userId: string, id: string, data: { 
    supplierName?: string; 
    supplierPhone?: string | null; 
    supplierEmail?: string | null;
    supplierAddress?: string | null;
    deliveryAddress?: string | null;
    notes?: string | null;
    expectedDeliveryDate?: string | null;
    paymentTerms?: string | null;
    paymentMethod?: string | null;
    requestedBy?: string | null;
    discount?: string | null;
    tax?: string | null;
    shippingCharges?: string | null;
    items?: any[] 
  }): Promise<any>;
  duplicatePurchaseOrder(userId: string, id: string): Promise<any>;
  deletePurchaseOrder(userId: string, id: string): Promise<void>;
  createPurchaseOrderFromCart(
    userId: string, 
    supplierId: string | null, 
    supplierName: string, 
    supplierPhone: string | null,
    supplierEmail: string | null,
    supplierAddress: string | null,
    deliveryAddress: string | null,
    notes: string | null, 
    cartItemIds: string[]
  ): Promise<PurchaseOrder>;
  markPurchaseOrderReceived(userId: string, id: string, actualPrices?: { itemId: string; price: number }[]): Promise<void>;
  
  // Users & Authentication
  getAllUsers(): Promise<User[]>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserById(id: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User>;
  updateUserProfile(id: string, data: { name?: string; email?: string }): Promise<User>;
  updateUserPassword(id: string, hashedPassword: string): Promise<void>;
  
  // Online Store Catalog
  getStoreSettings(userId: string): Promise<StoreSettings | undefined>;
  getStoreSettingsBySlug(slug: string): Promise<StoreSettings | undefined>;
  createStoreSettings(userId: string, data: InsertStoreSettings): Promise<StoreSettings>;
  updateStoreSettings(userId: string, data: Partial<InsertStoreSettings>): Promise<StoreSettings>;
  deleteStoreSettings(userId: string): Promise<void>;
  trackStoreAnalytics(storeId: string, eventType: string, data?: { productId?: string; visitorId?: string; referrer?: string; userAgent?: string }): Promise<void>;
  
  // Subscription Plans
  getSubscriptionPlans(): Promise<SubscriptionPlan[]>;
  getSubscriptionPlan(id: string): Promise<SubscriptionPlan | undefined>;
  getSubscriptionPlanById(id: string): Promise<SubscriptionPlan | undefined>; // Alias for consistency
  createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan>;
  updateSubscriptionPlan(id: string, plan: Partial<InsertSubscriptionPlan>): Promise<SubscriptionPlan | undefined>;
  deleteSubscriptionPlan(id: string): Promise<void>;
  
  // User Subscriptions
  getAllUserSubscriptions(): Promise<UserSubscription[]>;
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
  
  // Goals (Monthly targets and progress tracking)
  getGoals(userId: string): Promise<Goal[]>;
  getGoalByMonth(userId: string, targetMonth: string): Promise<Goal | undefined>;
  createGoal(goal: InsertGoal): Promise<Goal>;
  updateGoal(id: string, goal: Partial<InsertGoal>): Promise<Goal>;
  deleteGoal(id: string): Promise<void>;
  getGoalProgress(userId: string, targetMonth: string): Promise<any>;
  
  // Loyalty Program
  getCustomerByPhone(userId: string, phone: string): Promise<any | undefined>;
  createCustomer(userId: string, customer: any): Promise<any>;
  updateCustomer(id: string, customer: any): Promise<any>;
  getCustomers(userId: string): Promise<any[]>;
  awardPoints(customerId: string, points: number, saleId: string | null, description: string): Promise<void>;
  redeemPoints(userId: string, customerId: string, points: number, description: string): Promise<void>;
  getPointsHistory(userId: string, customerId: string, limit?: number): Promise<any[]>;
  
  // Broadcast System
  getMessageTemplates(userId: string, channel?: string): Promise<any[]>;
  createMessageTemplate(userId: string, template: any): Promise<any>;
  updateMessageTemplate(userId: string, id: string, template: any): Promise<any>;
  deleteMessageTemplate(userId: string, id: string): Promise<void>;
  
  createBroadcastCampaign(userId: string, campaign: any): Promise<any>;
  getBroadcastCampaigns(userId: string, limit?: number): Promise<any[]>;
  getBroadcastCampaignById(userId: string, id: string): Promise<any>;
  updateBroadcastCampaign(userId: string, id: string, campaign: any): Promise<any>;
  deleteBroadcastCampaign(userId: string, id: string): Promise<void>;
  
  getCustomerSegment(userId: string, segment: string, customIds?: string[]): Promise<any[]>;
  sendBroadcast(userId: string, campaignId: string): Promise<void>;
  getBroadcastMessages(userId: string, campaignId: string): Promise<any[]>;
  
  // Voucher System
  createVoucher(userId: string, voucher: any): Promise<any>;
  getVouchers(userId: string): Promise<any[]>;
  getVoucherById(userId: string, id: string): Promise<any | undefined>;
  getVoucherByCode(code: string): Promise<any | undefined>;
  updateVoucher(userId: string, id: string, voucher: any): Promise<any>;
  deleteVoucher(userId: string, id: string): Promise<void>;
  validateVoucher(userId: string, code: string, customerId: string | null, totalAmount: number): Promise<{ valid: boolean; voucher?: any; discount?: number; error?: string }>;
  redeemVoucher(voucherId: string, customerId: string | null, saleId: string | null, originalAmount: number, finalAmount: number, discountApplied: number): Promise<void>;
  getVoucherUsageHistory(userId: string, voucherId: string): Promise<any[]>;
  getCustomerVoucherUsage(customerId: string, voucherId: string): Promise<number>;
  
  // Booking System
  createBooking(userId: string, booking: any, items: any[]): Promise<any>;
  getBookings(userId: string, limit?: number, status?: string): Promise<any[]>;
  getBookingById(userId: string, id: string): Promise<any | undefined>;
  updateBooking(userId: string, id: string, booking: any): Promise<any>;
  deleteBooking(userId: string, id: string): Promise<void>;
  generateBookingNumber(): Promise<string>;
  getUpcomingBookings(userId: string, daysAhead: number): Promise<any[]>;
  markReminderSent(userId: string, bookingId: string): Promise<void>;
  getBookingItems(bookingId: string): Promise<any[]>;
  
  // PO Templates
  getAllPOTemplates(userId: string): Promise<any[]>;
  createPOTemplate(userId: string, data: any): Promise<any>;
  deletePOTemplate(userId: string, id: string): Promise<void>;
  createPOFromTemplate(userId: string, templateId: string): Promise<any>;
  
  // Vendor Sales Tracking
  createVendorSale(userId: string, sale: any): Promise<any>;
  getVendorSales(userId: string, vendorId?: string, filters?: any): Promise<any[]>;
  getVendorSaleById(userId: string, id: string): Promise<any | undefined>;
  updateVendorSale(userId: string, id: string, sale: any): Promise<any>;
  deleteVendorSale(userId: string, id: string): Promise<void>;
  
  // Vendor Stock Balance
  getVendorStockBalance(vendorId: string, userId: string): Promise<any[]>;
  getStockBalanceByProduct(vendorId: string, productId: string, tx?: any): Promise<any | undefined>;
  updateStockBalance(vendorId: string, productId: string, change: { delivered?: number; sold?: number; returned?: number }, tx?: any): Promise<void>;
  
  // Vendor Claims
  createVendorClaim(userId: string, claimData: any, items: any[], photos: string[]): Promise<any>;
  getVendorClaims(userId: string, filters?: any): Promise<any[]>;
  getVendorClaimById(userId: string, id: string): Promise<any | undefined>;
  approveVendorClaim(userId: string, claimId: string, reviewNotes?: string): Promise<any>;
  rejectVendorClaim(userId: string, claimId: string, reviewNotes: string): Promise<any>;
  getClaimItems(claimId: string): Promise<any[]>;
  getClaimPhotos(claimId: string): Promise<any[]>;
  generateClaimNumber(userId: string): Promise<string>;
  
  // Payment Claims
  createPaymentClaim(userId: string, claimData: any, items: any[], deliveryIds: string[]): Promise<any>;
  getPaymentClaims(userId: string, filters?: any): Promise<any[]>;
  getPaymentClaimById(userId: string, id: string): Promise<any | undefined>;
  updatePaymentClaim(userId: string, claimId: string, data: any): Promise<any>;
  deletePaymentClaim(userId: string, claimId: string): Promise<void>;
  markPaymentClaimAsPaid(userId: string, claimId: string): Promise<any>;
  generatePaymentClaimNumber(userId: string): Promise<string>;
}

export class DatabaseStorage implements IStorage {
  // Products
  async getProducts(userId: string): Promise<Product[]> {
    // Query 1: Get all products
    const allProducts = await db.select().from(products)
      .where(eq(products.userId, userId))
      .orderBy(desc(products.createdAt));
    
    // Early return if no products
    if (allProducts.length === 0) {
      return [];
    }
    
    // Query 2: Get all ingredients for these products in one batch query
    const productIds = allProducts.map(p => p.id);
    const allIngredients = await db.select().from(ingredients)
      .where(and(
        inArray(ingredients.productId, productIds),
        eq(ingredients.userId, userId)
      ));
    
    // Group ingredients by product ID in JavaScript (efficient in-memory operation)
    const ingredientsMap = allIngredients.reduce((acc, ingredient) => {
      if (!acc[ingredient.productId]) {
        acc[ingredient.productId] = [];
      }
      acc[ingredient.productId].push(ingredient);
      return acc;
    }, {} as Record<string, any[]>);
    
    // Combine products with their ingredients
    return allProducts.map(product => ({
      ...product,
      ingredients: ingredientsMap[product.id] || [],
    })) as any;
  }

  async getProduct(userId: string, id: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products)
      .where(and(eq(products.id, id), eq(products.userId, userId)));
    return product || undefined;
  }

  async getProductCount(userId: string): Promise<number> {
    const [result] = await db.select({ count: sql<number>`count(*)` })
      .from(products)
      .where(eq(products.userId, userId));
    return result.count;
  }

  async createProduct(userId: string, product: InsertProduct, recipeItemsList: any[]): Promise<Product> {
    const [newProduct] = await db.insert(products).values({ ...product, userId }).returning();
    
    // Insert recipe items (new stock-based system)
    if (recipeItemsList.length > 0) {
      const recipeItemsWithProductId = recipeItemsList.map(item => ({
        ...item,
        productId: newProduct.id,
        userId,
      }));
      await db.insert(recipeItems).values(recipeItemsWithProductId);
    }
    
    return newProduct;
  }

  async updateProduct(userId: string, id: string, product: Partial<InsertProduct>, recipeItemsList?: any[]): Promise<Product> {
    const [updatedProduct] = await db.update(products).set(product)
      .where(and(eq(products.id, id), eq(products.userId, userId)))
      .returning();
    
    // Update recipe items if provided
    if (recipeItemsList && recipeItemsList.length > 0) {
      // Delete existing recipe items (product ownership already validated above)
      await db.delete(recipeItems)
        .where(eq(recipeItems.productId, id));
      
      // Insert new recipe items (no userId needed - linked via productId)
      const recipeItemsWithProductId = recipeItemsList.map(item => ({
        ...item,
        productId: id,
      }));
      await db.insert(recipeItems).values(recipeItemsWithProductId);
    }
    
    return updatedProduct;
  }

  async deleteProduct(userId: string, id: string): Promise<void> {
    // CASCADE delete will automatically remove:
    // - recipeItems (onDelete: "cascade" on productId)
    // - ingredients (onDelete: "cascade" on productId)
    // - productionBatches (onDelete: "cascade" on productId)
    // - deliveryItems (onDelete: "cascade" on productId)
    // - salesItems (onDelete: "cascade" on productId)
    // - vendorSales (onDelete: "cascade" on productId)
    // - claimItems (onDelete: "cascade" on productId)
    
    // Just delete the product - database handles the rest
    await db.delete(products)
      .where(and(eq(products.id, id), eq(products.userId, userId)));
  }

  // Ingredients
  async getIngredients(userId: string, productId: string): Promise<Ingredient[]> {
    return await db.select().from(ingredients)
      .where(and(eq(ingredients.productId, productId), eq(ingredients.userId, userId)));
  }

  // Production
  async getProductionBatches(userId: string): Promise<ProductionBatch[]> {
    return await db.select().from(productionBatches)
      .where(eq(productionBatches.userId, userId))
      .orderBy(desc(productionBatches.batchDate));
  }

  async createProductionBatch(userId: string, batch: InsertProductionBatch): Promise<ProductionBatch> {
    const [newBatch] = await db.insert(productionBatches).values({ ...batch, userId }).returning();
    return newBatch;
  }

  // Finished Products (Finished Goods Inventory)
  async getFinishedProductsSummary(userId: string): Promise<any[]> {
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
      .where(and(
        eq(productionBatches.userId, userId),
        sql`${productionBatches.remainingQty} > 0`
      ))
      .groupBy(productionBatches.productId, productionBatches.productName);
    
    return summary;
  }

  async getBatchesByProduct(userId: string, productId: string): Promise<any[]> {
    // Get all batches for a product with expiry status
    // Order by: non-null expiry dates first (ascending), then null expiry, then by creation date for deterministic ordering
    const batches = await db
      .select()
      .from(productionBatches)
      .where(
        and(
          eq(productionBatches.userId, userId),
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

  async previewBatchDeduction(userId: string, productId: string, quantity: number): Promise<{ success: boolean; deductions: any[]; totalAvailable: number }> {
    // Preview FIFO deduction WITHOUT modifying database - read-only simulation
    // Get batches ordered by FIFO (same logic as actual deduction)
    const batches = await db
      .select()
      .from(productionBatches)
      .where(
        and(
          eq(productionBatches.userId, userId),
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

  async deductFromBatches(userId: string, productId: string, quantity: number): Promise<{ success: boolean; deductions: any[] }> {
    // FIFO deduction with transaction and locking to prevent race conditions and data loss
    return await db.transaction(async (tx) => {
      // Step 1: Lock and get batches ordered by FIFO
      const batches = await tx
        .select()
        .from(productionBatches)
        .where(
          and(
            eq(productionBatches.userId, userId),
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
  async getVendors(userId: string): Promise<Vendor[]> {
    return await db.select().from(vendors)
      .where(eq(vendors.userId, userId))
      .orderBy(desc(vendors.createdAt));
  }

  async getVendor(userId: string, id: string): Promise<Vendor | undefined> {
    const [vendor] = await db.select().from(vendors)
      .where(and(eq(vendors.id, id), eq(vendors.userId, userId)));
    return vendor || undefined;
  }

  async createVendor(userId: string, vendor: InsertVendor): Promise<Vendor> {
    const [newVendor] = await db.insert(vendors).values({ ...vendor, userId }).returning();
    return newVendor;
  }

  // Suppliers (for Purchase Orders - beli bahan mentah)
  async getSuppliers(userId: string): Promise<Supplier[]> {
    return await db.select().from(suppliers)
      .where(eq(suppliers.userId, userId))
      .orderBy(desc(suppliers.createdAt));
  }

  async getSupplier(userId: string, id: string): Promise<Supplier | undefined> {
    const [supplier] = await db.select().from(suppliers)
      .where(and(eq(suppliers.id, id), eq(suppliers.userId, userId)));
    return supplier || undefined;
  }

  async createSupplier(userId: string, supplier: InsertSupplier): Promise<Supplier> {
    const [newSupplier] = await db.insert(suppliers).values({ ...supplier, userId }).returning();
    return newSupplier;
  }

  async updateSupplier(userId: string, id: string, supplier: Partial<InsertSupplier>): Promise<Supplier> {
    const [updated] = await db.update(suppliers)
      .set(supplier)
      .where(and(eq(suppliers.id, id), eq(suppliers.userId, userId)))
      .returning();
    return updated;
  }

  async deleteSupplier(userId: string, id: string): Promise<void> {
    await db.delete(suppliers)
      .where(and(eq(suppliers.id, id), eq(suppliers.userId, userId)));
  }

  // Deliveries
  async getDeliveries(userId: string, limit: number = 20, offset: number = 0): Promise<{ data: any[], hasMore: boolean, total: number }> {
    // Get total count
    const totalResult = await db.select({ count: sql<number>`count(*)` }).from(deliveries)
      .where(eq(deliveries.userId, userId));
    const total = Number(totalResult[0]?.count || 0);
    
    // Get paginated deliveries
    const result = await db
      .select()
      .from(deliveries)
      .where(eq(deliveries.userId, userId))
      .orderBy(desc(deliveries.deliveryDate))
      .limit(limit + 1) // Fetch one extra to check if there's more
      .offset(offset);
    
    const hasMore = result.length > limit;
    const deliveriesToReturn = hasMore ? result.slice(0, limit) : result;
    
    // Get items for each delivery with commission breakdown
    const deliveriesWithItems = await Promise.all(
      deliveriesToReturn.map(async (delivery) => {
        const itemsData = await db.select({
          deliveryItem: deliveryItems,
          productUnit: products.unit,
        })
          .from(deliveryItems)
          .leftJoin(products, eq(deliveryItems.productId, products.id))
          .where(eq(deliveryItems.deliveryId, delivery.id));
        
        // Calculate gross, rejected, net amounts
        let grossAmount = 0;
        let rejectedAmount = 0;
        
        itemsData.forEach(({ deliveryItem }) => {
          const itemGross = deliveryItem.quantity * parseFloat(deliveryItem.unitPrice);
          const itemRejected = (deliveryItem.rejectedQty || 0) * parseFloat(deliveryItem.unitPrice);
          
          grossAmount += itemGross;
          rejectedAmount += itemRejected;
        });
        
        const netAmount = grossAmount - rejectedAmount;
        
        // Calculate commission with error handling
        let commission = 0;
        try {
          commission = await this.calculateCommission(userId, delivery.vendorId, netAmount);
        } catch (error) {
          console.error(`Failed to calculate commission for delivery ${delivery.id}:`, error);
          // Continue with 0 commission if calculation fails
        }
        
        const claimableAmount = netAmount - commission;
        
        // Calculate per-item commission and claimable amounts
        const itemsWithBreakdown = itemsData.map(({ deliveryItem, productUnit }) => {
          const itemGross = deliveryItem.quantity * parseFloat(deliveryItem.unitPrice);
          const itemRejected = (deliveryItem.rejectedQty || 0) * parseFloat(deliveryItem.unitPrice);
          const itemNet = itemGross - itemRejected;
          
          // Proportionally distribute commission based on item's net amount
          const itemCommission = netAmount > 0 ? (itemNet / netAmount) * commission : 0;
          const itemClaimable = itemNet - itemCommission;
          
          return {
            ...deliveryItem,
            unit: productUnit || 'pcs', // Add unit from product, default to 'pcs'
            itemGross: itemGross.toFixed(2),
            itemRejected: itemRejected.toFixed(2),
            itemNet: itemNet.toFixed(2),
            itemCommission: itemCommission.toFixed(2),
            itemClaimable: itemClaimable.toFixed(2),
          };
        });
        
        return { 
          ...delivery, 
          items: itemsWithBreakdown,
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

  async getDelivery(userId: string, id: string): Promise<any> {
    const [delivery] = await db.select().from(deliveries)
      .where(and(eq(deliveries.id, id), eq(deliveries.userId, userId)));
    if (!delivery) return undefined;
    
    const itemsData = await db.select({
      deliveryItem: deliveryItems,
      productUnit: products.unit,
    })
      .from(deliveryItems)
      .leftJoin(products, eq(deliveryItems.productId, products.id))
      .where(eq(deliveryItems.deliveryId, id));
    
    // Calculate gross, rejected, net amounts, and commission
    let grossAmount = 0;
    let rejectedAmount = 0;
    
    itemsData.forEach(({ deliveryItem }) => {
      const itemGross = deliveryItem.quantity * parseFloat(deliveryItem.unitPrice);
      const itemRejected = (deliveryItem.rejectedQty || 0) * parseFloat(deliveryItem.unitPrice);
      
      grossAmount += itemGross;
      rejectedAmount += itemRejected;
    });
    
    const netAmount = grossAmount - rejectedAmount;
    
    // Calculate commission with error handling
    let commission = 0;
    try {
      commission = await this.calculateCommission(userId, delivery.vendorId, netAmount);
    } catch (error) {
      console.error(`Failed to calculate commission for delivery ${delivery.id}:`, error);
      // Continue with 0 commission if calculation fails
    }
    
    const claimableAmount = netAmount - commission;
    
    // Calculate per-item commission and claimable amounts
    const itemsWithBreakdown = itemsData.map(({ deliveryItem, productUnit }) => {
      const itemGross = deliveryItem.quantity * parseFloat(deliveryItem.unitPrice);
      const itemRejected = (deliveryItem.rejectedQty || 0) * parseFloat(deliveryItem.unitPrice);
      const itemNet = itemGross - itemRejected;
      
      // Proportionally distribute commission based on item's net amount
      const itemCommission = netAmount > 0 ? (itemNet / netAmount) * commission : 0;
      const itemClaimable = itemNet - itemCommission;
      
      return {
        ...deliveryItem,
        unit: productUnit || 'pcs', // Add unit from product, default to 'pcs'
        itemGross: itemGross.toFixed(2),
        itemRejected: itemRejected.toFixed(2),
        itemNet: itemNet.toFixed(2),
        itemCommission: itemCommission.toFixed(2),
        itemClaimable: itemClaimable.toFixed(2),
      };
    });
    
    return { 
      ...delivery, 
      items: itemsWithBreakdown,
      grossAmount: grossAmount.toFixed(2),
      rejectedAmount: rejectedAmount.toFixed(2),
      netAmount: netAmount.toFixed(2),
      commission: commission.toFixed(2),
      claimableAmount: claimableAmount.toFixed(2),
    };
  }

  async getLastDeliveryForVendor(userId: string, vendorId: string): Promise<any | null> {
    const [lastDelivery] = await db
      .select()
      .from(deliveries)
      .where(and(eq(deliveries.vendorId, vendorId), eq(deliveries.userId, userId)))
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

  async checkDuplicateDelivery(userId: string, vendorId: string, deliveryDate: string): Promise<any | null> {
    const [existing] = await db
      .select()
      .from(deliveries)
      .where(
        and(
          eq(deliveries.userId, userId),
          eq(deliveries.vendorId, vendorId),
          eq(deliveries.deliveryDate, deliveryDate)
        )
      )
      .limit(1);
    
    return existing || null;
  }

  async createDelivery(userId: string, delivery: InsertDelivery, items: InsertDeliveryItem[]): Promise<Delivery> {
    // Use transaction with advisory lock (global per date) + retry loop to ensure unique invoice numbers across ALL users
    return await db.transaction(async (tx) => {
      // Format: INV-YYYYMMDD-XXXX (global sequence per date, not per user)
      const date = new Date(delivery.deliveryDate);
      const dateStr = date.toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD

      // Global advisory lock per date only (serialize across all users)
      const lockId = parseInt(dateStr); // Simple integer ID for the date
      await tx.execute(sql`SELECT pg_advisory_xact_lock(${lockId})`);
      
      // CRITICAL: Deduct FIFO batches FIRST within same transaction to prevent duplicate stock deductions
      for (const item of items) {
        // Lock production batches for update to prevent concurrent modifications
        const batches = await tx
          .select()
          .from(productionBatches)
          .where(and(
            eq(productionBatches.userId, userId),
            eq(productionBatches.productId, item.productId),
            gt(productionBatches.remainingQty, 0)
          ))
          .orderBy(asc(productionBatches.createdAt)) // FIFO
          .for('update'); // Row-level lock
        
        let remainingToDeduct = item.quantity;
        
        for (const batch of batches) {
          if (remainingToDeduct <= 0) break;
          
          const deductQty = Math.min(batch.remainingQty, remainingToDeduct);
          
          await tx
            .update(productionBatches)
            .set({ remainingQty: batch.remainingQty - deductQty })
            .where(eq(productionBatches.id, batch.id));
          
          remainingToDeduct -= deductQty;
        }
        
        // Check if we deducted enough
        if (remainingToDeduct > 0) {
          throw new Error(`Stok siap tidak mencukupi untuk ${item.productName}. Diperlukan: ${item.quantity}`);
        }
      }
      
      // Retry loop in case of rare race (extra safety even with advisory lock)
      let attempts = 0;
      const maxAttempts = 5;
      let newDelivery: Delivery | undefined;

      while (attempts < maxAttempts && !newDelivery) {
        attempts++;
        // Find latest invoice number for this DATE (global, not scoped to user)
        const latestInvoice = await tx
          .select()
          .from(deliveries)
          .where(sql`${deliveries.invoiceNumber} LIKE ${'INV-' + dateStr + '-%'} `)
          .orderBy(desc(deliveries.invoiceNumber))
          .limit(1);

        let sequenceNumber = 1;
        if (latestInvoice.length > 0 && latestInvoice[0].invoiceNumber) {
          const parts = latestInvoice[0].invoiceNumber.split('-');
            if (parts.length === 3) {
              sequenceNumber = parseInt(parts[2]) + 1;
            }
        }

        const sequenceStr = sequenceNumber.toString().padStart(4, '0');
        const invoiceNumber = `INV-${dateStr}-${sequenceStr}`;

        try {
          const inserted = await tx.insert(deliveries).values({
            ...delivery,
            userId,
            invoiceNumber,
          }).returning();
          newDelivery = inserted[0];
        } catch (err: any) {
          // Unique constraint hit: another transaction slipped in; retry
          if (err.code === '23505' && err.constraint === 'deliveries_invoice_number_unique') {
            continue; // loop again
          }
          throw err; // other errors propagate
        }
      }

      if (!newDelivery) {
        throw new Error('Gagal menjana invoice unik selepas beberapa percubaan. Sila cuba semula.');
      }
      
      // Insert delivery items
      if (items.length > 0) {
        const itemsWithDeliveryId = items.map(item => ({
          ...item,
          deliveryId: newDelivery.id,
          userId,
        }));
        await tx.insert(deliveryItems).values(itemsWithDeliveryId);
        
        // Update vendor stock balance for each delivered item
        for (const item of itemsWithDeliveryId) {
          await this.updateStockBalance(delivery.vendorId, item.productId, {
            delivered: item.quantity
          }, tx);
          
          // If there are rejected items, treat them as returned immediately
          if (item.rejectedQty > 0) {
            await this.updateStockBalance(delivery.vendorId, item.productId, {
              returned: item.rejectedQty
            }, tx);
          }
        }
      }
      
      return newDelivery;
    });
  }

  async updateDeliveryStatus(userId: string, id: string, status: string): Promise<void> {
    await db.update(deliveries)
      .set({ status: status as any })
      .where(and(eq(deliveries.id, id), eq(deliveries.userId, userId)));
  }

  async updateDeliveryPaymentStatus(userId: string, id: string, paymentStatus: string): Promise<any> {
    const [updated] = await db.update(deliveries)
      .set({ paymentStatus: paymentStatus as any })
      .where(and(eq(deliveries.id, id), eq(deliveries.userId, userId)))
      .returning();
    return updated;
  }

  async updateDeliveryItemRejection(userId: string, itemId: string, rejectedQty: number, rejectionReason: string | null): Promise<void> {
    return await db.transaction(async (tx) => {
      // Verify ownership through deliveries table
      const [result] = await tx.select()
        .from(deliveryItems)
        .innerJoin(deliveries, eq(deliveryItems.deliveryId, deliveries.id))
        .where(and(eq(deliveryItems.id, itemId), eq(deliveries.userId, userId)));
      
      if (!result) {
        throw new Error("Delivery item not found or access denied");
      }
      
      const { delivery_items: item, deliveries: delivery } = result;
      const oldRejectedQty = item.rejectedQty || 0;
      const diff = rejectedQty - oldRejectedQty;
      
      await tx.update(deliveryItems)
        .set({ 
          rejectedQty,
          rejectionReason 
        })
        .where(eq(deliveryItems.id, itemId));
        
      // Update stock balance if rejection quantity changed
      if (diff !== 0) {
        await this.updateStockBalance(delivery.vendorId, item.productId, {
          returned: diff
        }, tx);
      }
    });
  }

  // POS Sales
  async generateReceiptNumber(userId: string): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD
    
    // Get today's sales count for sequence number FOR THIS USER
    const todaySales = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(sales)
      .where(and(
        eq(sales.saleDate, today.toISOString().split('T')[0]),
        eq(sales.userId, userId)
      ));
    
    const sequence = (todaySales[0]?.count || 0) + 1;
    const paddedSequence = sequence.toString().padStart(4, '0');
    
    return `RES-${dateStr}-${paddedSequence}`;
  }

  async getAllSales(userId: string, startDate?: string, endDate?: string): Promise<any[]> {
    let query = db
      .select({
        id: sales.id,
        saleDate: sales.saleDate,
        receiptNumber: sales.receiptNumber,
        totalAmount: sales.totalAmount,
        totalCost: sales.totalCost,
        totalProfit: sales.totalProfit,
        paymentMethod: sales.paymentMethod,
        customerName: sales.customerName,
        totalItems: sql<number>`COUNT(${salesItems.id})`,
      })
      .from(sales)
      .leftJoin(salesItems, and(eq(sales.id, salesItems.saleId), eq(salesItems.userId, userId)))
      .where(eq(sales.userId, userId))
      .groupBy(sales.id, sales.saleDate, sales.receiptNumber)
      .orderBy(desc(sales.saleDate));

    if (startDate) {
      query = query.where(and(eq(sales.userId, userId), sql`${sales.saleDate} >= ${startDate}`));
    }
    if (endDate) {
      query = query.where(and(eq(sales.userId, userId), sql`${sales.saleDate} <= ${endDate}`));
    }

    return await query;
  }

  async getAllDeliveries(userId: string): Promise<any[]> {
    const result = await db
      .select({
        id: deliveries.id,
        deliveryDate: deliveries.deliveryDate,
        vendorId: deliveries.vendorId,
        vendorName: vendors.name,
        productId: deliveryItems.productId,
        productName: products.name,
        quantity: deliveryItems.quantity,
        rejectedQuantity: deliveryItems.rejectedQuantity,
        rejectionReason: deliveryItems.rejectionReason,
        unitPrice: deliveryItems.unitPrice,
        totalAmount: deliveryItems.totalAmount,
        deliveryStatus: deliveries.deliveryStatus,
        paymentStatus: deliveries.paymentStatus,
        notes: deliveries.notes,
      })
      .from(deliveries)
      .innerJoin(vendors, and(eq(deliveries.vendorId, vendors.id), eq(vendors.userId, userId)))
      .innerJoin(deliveryItems, eq(deliveries.id, deliveryItems.deliveryId))
      .innerJoin(products, and(eq(deliveryItems.productId, products.id), eq(products.userId, userId)))
      .where(eq(deliveries.userId, userId))
      .orderBy(desc(deliveries.deliveryDate));

    return result;
  }

  async getSales(userId: string, limit: number = 50, offset: number = 0): Promise<{ data: any[], hasMore: boolean, total: number }> {
    // Get total count
    const countResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(sales)
      .where(eq(sales.userId, userId));
    const total = countResult[0]?.count || 0;

    // Get sales with items
    const salesData = await db
      .select()
      .from(sales)
      .where(eq(sales.userId, userId))
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
          .where(and(eq(salesItems.saleId, sale.id), eq(salesItems.userId, userId)));
        
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

  async getSale(userId: string, id: string): Promise<any> {
    const [sale] = await db
      .select()
      .from(sales)
      .where(and(eq(sales.id, id), eq(sales.userId, userId)))
      .limit(1);

    if (!sale) return null;

    const items = await db
      .select()
      .from(salesItems)
      .where(and(eq(salesItems.saleId, id), eq(salesItems.userId, userId)));

    return {
      ...sale,
      items,
    };
  }

  async createSale(userId: string, sale: InsertSale, items: InsertSalesItem[]): Promise<Sale> {
    // Use transaction for atomic sale creation with FIFO stock deduction
    return await db.transaction(async (tx) => {
      // Step 1: Generate receipt number
      const receiptNumber = await this.generateReceiptNumber(userId);
      
      // Step 2: Create the sale record
      const [newSale] = await tx.insert(sales).values({
        ...sale,
        userId,
        receiptNumber,
      }).returning();

      // Step 3: Process each item with FIFO deduction
      const createdItems: SalesItem[] = [];
      
      for (const item of items) {
        // Deduct from finished goods using FIFO
        const deductionResult = await this.deductFromBatches(userId, item.productId, item.quantity);
        
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
            userId,
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
  async getExpenses(userId: string): Promise<Expense[]> {
    return await db.select().from(expenses)
      .where(eq(expenses.userId, userId))
      .orderBy(desc(expenses.expenseDate));
  }

  async createExpense(userId: string, expense: InsertExpense): Promise<Expense> {
    const [newExpense] = await db.insert(expenses).values({ ...expense, userId }).returning();
    return newExpense;
  }

  // Reports
  async getDashboardStats(userId: string): Promise<any> {
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Today's production
    const todayProduction = await db.select({
      total: sql<number>`COALESCE(SUM(${productionBatches.quantity}), 0)`,
    })
      .from(productionBatches)
      .where(and(eq(productionBatches.batchDate, today), eq(productionBatches.userId, userId)));

    // Today's production cost
    const todayProductionCost = await db.select({
      total: sql<string>`COALESCE(SUM(${productionBatches.totalCost}), 0)`,
    })
      .from(productionBatches)
      .where(and(eq(productionBatches.batchDate, today), eq(productionBatches.userId, userId)));

    // Today's sales (value)
    const todaySales = await db.select({
      total: sql<string>`COALESCE(SUM(${sales.totalAmount}), 0)`,
    })
      .from(sales)
      .where(and(eq(sales.saleDate, today), eq(sales.userId, userId)));

    // Today's sales (quantity) - sum from salesItems
    const todaySalesQty = await db.select({
      total: sql<number>`COALESCE(SUM(${salesItems.quantity}), 0)`,
    })
      .from(salesItems)
      .leftJoin(sales, eq(salesItems.saleId, sales.id))
      .where(and(eq(sales.saleDate, today), eq(sales.userId, userId)));

    // Today's deliveries (quantity delivered to vendors)
    const todayDeliveries = await db.select({
      total: sql<number>`COALESCE(SUM(${deliveryItems.quantity}), 0)`,
    })
      .from(deliveryItems)
      .leftJoin(deliveries, eq(deliveryItems.deliveryId, deliveries.id))
      .where(and(eq(deliveries.deliveryDate, today), eq(deliveries.userId, userId)));

    // Today's expenses (Modal Hari Ini)
    const todayExpenses = await db.select({
      total: sql<string>`COALESCE(SUM(${expenses.amount}), 0)`,
    })
      .from(expenses)
      .where(and(eq(expenses.expenseDate, today), eq(expenses.userId, userId)));

    // Today's rejections
    const todayRejections = await db.select({
      count: sql<number>`COALESCE(SUM(${deliveryItems.rejectedQty}), 0)`,
      value: sql<string>`COALESCE(SUM(${deliveryItems.rejectedQty} * ${deliveryItems.unitPrice}), 0)`,
    })
      .from(deliveryItems)
      .leftJoin(deliveries, eq(deliveryItems.deliveryId, deliveries.id))
      .where(and(eq(deliveries.deliveryDate, today), eq(deliveries.userId, userId)));

    // Week's sales
    const weekSales = await db.select({
      total: sql<string>`COALESCE(SUM(${sales.totalAmount}), 0)`,
    })
      .from(sales)
      .where(and(gte(sales.saleDate, weekAgo), eq(sales.userId, userId)));

    // Total revenue and costs
    const totalRevenue = await db.select({
      total: sql<string>`COALESCE(SUM(${sales.totalAmount}), 0)`,
    }).from(sales)
      .where(eq(sales.userId, userId));

    const totalProductionCost = await db.select({
      total: sql<string>`COALESCE(SUM(${productionBatches.totalCost}), 0)`,
    }).from(productionBatches)
      .where(eq(productionBatches.userId, userId));

    const totalExpenses = await db.select({
      total: sql<string>`COALESCE(SUM(${expenses.amount}), 0)`,
    }).from(expenses)
      .where(eq(expenses.userId, userId));

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
      .where(and(
        eq(productionBatches.userId, userId),
        sql`${productionBatches.remainingQty} > 0`
      ));

    const expiringSoon = await db.select({
      count: sql<number>`COUNT(*)`,
    })
      .from(productionBatches)
      .where(
        and(
          eq(productionBatches.userId, userId),
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

  async getProfitLossReport(userId: string): Promise<any> {
    const totalSalesResult = await db.select({
      total: sql<string>`COALESCE(SUM(${sales.totalAmount}), 0)`,
    }).from(sales)
      .where(eq(sales.userId, userId));

    const totalCostsResult = await db.select({
      production: sql<string>`COALESCE(SUM(${productionBatches.totalCost}), 0)`,
      expenses: sql<string>`COALESCE(SUM(${expenses.amount}), 0)`,
    }).from(productionBatches)
      .fullJoin(expenses, sql`1=1`)
      .where(and(eq(productionBatches.userId, userId), eq(expenses.userId, userId)));

    // Calculate total rejection losses (value of rejected items)
    const rejectionLossResult = await db.select({
      total: sql<string>`COALESCE(SUM(${deliveryItems.rejectedQty} * ${deliveryItems.unitPrice}), 0)`,
    }).from(deliveryItems)
      .innerJoin(deliveries, eq(deliveryItems.deliveryId, deliveries.id))
      .where(eq(deliveries.userId, userId));

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

  async getWeeklyProfitSummary(userId: string): Promise<any> {
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
      deliveries: sql<string>`COALESCE(SUM(CASE WHEN ${deliveries.deliveryDate} >= ${currentWeekStart.toISOString()} AND ${deliveries.deliveryDate} <= ${currentWeekEnd.toISOString()} AND ${deliveries.status}::text = 'claimed' THEN ${deliveries.totalAmount} ELSE 0 END), 0)`,
    }).from(sales)
      .fullJoin(deliveries, sql`1=1`)
      .where(and(eq(sales.userId, userId), eq(deliveries.userId, userId)));

    // Last week sales
    const lastWeekSales = await db.select({
      pos: sql<string>`COALESCE(SUM(CASE WHEN ${sales.saleDate} >= ${lastWeekStart.toISOString()} AND ${sales.saleDate} <= ${lastWeekEnd.toISOString()} THEN ${sales.totalAmount} ELSE 0 END), 0)`,
      deliveries: sql<string>`COALESCE(SUM(CASE WHEN ${deliveries.deliveryDate} >= ${lastWeekStart.toISOString()} AND ${deliveries.deliveryDate} <= ${lastWeekEnd.toISOString()} AND ${deliveries.status}::text = 'claimed' THEN ${deliveries.totalAmount} ELSE 0 END), 0)`,
    }).from(sales)
      .fullJoin(deliveries, sql`1=1`)
      .where(and(eq(sales.userId, userId), eq(deliveries.userId, userId)));

    // Current week costs
    const currentWeekCosts = await db.select({
      production: sql<string>`COALESCE(SUM(CASE WHEN ${productionBatches.batchDate} >= ${currentWeekStart.toISOString()} AND ${productionBatches.batchDate} <= ${currentWeekEnd.toISOString()} THEN ${productionBatches.totalCost} ELSE 0 END), 0)`,
      expenses: sql<string>`COALESCE(SUM(CASE WHEN ${expenses.expenseDate} >= ${currentWeekStart.toISOString()} AND ${expenses.expenseDate} <= ${currentWeekEnd.toISOString()} THEN ${expenses.amount} ELSE 0 END), 0)`,
    }).from(productionBatches)
      .fullJoin(expenses, sql`1=1`)
      .where(and(eq(productionBatches.userId, userId), eq(expenses.userId, userId)));

    // Last week costs
    const lastWeekCosts = await db.select({
      production: sql<string>`COALESCE(SUM(CASE WHEN ${productionBatches.batchDate} >= ${lastWeekStart.toISOString()} AND ${productionBatches.batchDate} <= ${lastWeekEnd.toISOString()} THEN ${productionBatches.totalCost} ELSE 0 END), 0)`,
      expenses: sql<string>`COALESCE(SUM(CASE WHEN ${expenses.expenseDate} >= ${lastWeekStart.toISOString()} AND ${expenses.expenseDate} <= ${lastWeekEnd.toISOString()} THEN ${expenses.amount} ELSE 0 END), 0)`,
    }).from(productionBatches)
      .fullJoin(expenses, sql`1=1`)
      .where(and(eq(productionBatches.userId, userId), eq(expenses.userId, userId)));

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

  async getTopProducts(userId: string): Promise<any[]> {
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
      .leftJoin(salesItems, and(eq(products.id, salesItems.productId), eq(salesItems.userId, userId)))
      .where(eq(products.userId, userId))
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

  async getTopVendors(userId: string): Promise<any[]> {
    const topVendors = await db.select({
      id: vendors.id,
      name: vendors.name,
      totalDeliveries: sql<number>`COUNT(${deliveries.id})`,
      totalAmount: sql<string>`COALESCE(SUM(${deliveries.totalAmount}), 0)`,
    })
      .from(vendors)
      .leftJoin(deliveries, and(eq(vendors.id, deliveries.vendorId), eq(deliveries.userId, userId)))
      .where(eq(vendors.userId, userId))
      .groupBy(vendors.id, vendors.name)
      .orderBy(sql`COALESCE(SUM(${deliveries.totalAmount}), 0) DESC`)
      .limit(5);

    return topVendors;
  }

  async getMonthlyData(userId: string): Promise<any[]> {
    // This is a simplified version - in production, you'd want proper date grouping
    return [];
  }

  // Advanced Analytics Methods
  async getProductPerformanceAnalytics(userId: string): Promise<any> {
    try {
      // Get all products
      const allProducts = await db.select().from(products)
        .where(eq(products.userId, userId));
      
      // If no products, return empty structure
      if (!allProducts || allProducts.length === 0) {
        return {
          mostProfitable: [],
          fastestSelling: [],
          mostRejected: [],
          allProducts: [],
        };
      }
      
      // Calculate performance metrics for each product
      const productMetrics = await Promise.all(
        allProducts.map(async (product) => {
          // Sales data (POS)
          const salesData = await db.select({
            totalQuantity: sql<number>`COALESCE(SUM(${salesItems.quantity}), 0)`,
            totalRevenue: sql<string>`COALESCE(SUM(CAST(${salesItems.quantity} AS DECIMAL) * CAST(${salesItems.unitPrice} AS DECIMAL)), 0)`,
          })
          .from(salesItems)
          .innerJoin(sales, eq(salesItems.saleId, sales.id))
          .where(and(eq(salesItems.productId, product.id), eq(sales.userId, userId)));

        // Delivery data (vendors)
        const deliveryData = await db.select({
          totalQuantity: sql<number>`COALESCE(SUM(${deliveryItems.quantity}), 0)`,
          totalRevenue: sql<string>`COALESCE(SUM(CAST(${deliveryItems.quantity} AS DECIMAL) * CAST(${deliveryItems.unitPrice} AS DECIMAL)), 0)`,
          totalRejected: sql<number>`COALESCE(SUM(${deliveryItems.rejectedQty}), 0)`,
        })
        .from(deliveryItems)
        .innerJoin(deliveries, eq(deliveryItems.deliveryId, deliveries.id))
        .where(and(eq(deliveryItems.productId, product.id), eq(deliveries.userId, userId)));

        const totalQtySold = Number(salesData[0]?.totalQuantity || 0) + Number(deliveryData[0]?.totalQuantity || 0);
        const totalRevenue = parseFloat(salesData[0]?.totalRevenue || "0") + parseFloat(deliveryData[0]?.totalRevenue || "0");
        const totalRejected = Number(deliveryData[0]?.totalRejected || 0);
        const costPerUnit = parseFloat(product.costPerUnit);
        const totalProfit = totalRevenue - (totalQtySold * costPerUnit);
        const profitMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100) : 0;
        const rejectionRate = totalQtySold > 0 ? ((totalRejected / (totalQtySold + totalRejected)) * 100) : 0;

        return {
          productId: product.id,
          productName: product.name,
          category: product.category,
          totalQtySold,
          totalRevenue: totalRevenue.toFixed(2),
          totalProfit: totalProfit.toFixed(2),
          profitMargin: profitMargin.toFixed(1),
          totalRejected,
          rejectionRate: rejectionRate.toFixed(1),
          costPerUnit: costPerUnit.toFixed(2),
        };
      })
    );

    // Sort by different metrics
    const mostProfitable = [...productMetrics]
      .filter(p => parseFloat(p.totalProfit) > 0)
      .sort((a, b) => parseFloat(b.totalProfit) - parseFloat(a.totalProfit))
      .slice(0, 5);

    const fastestSelling = [...productMetrics]
      .filter(p => p.totalQtySold > 0)
      .sort((a, b) => b.totalQtySold - a.totalQtySold)
      .slice(0, 5);

    const mostRejected = [...productMetrics]
      .filter(p => p.totalRejected > 0)
      .sort((a, b) => parseFloat(b.rejectionRate) - parseFloat(a.rejectionRate))
      .slice(0, 5);

      return {
        mostProfitable,
        fastestSelling,
        mostRejected,
        allProducts: productMetrics,
      };
    } catch (error) {
      console.error("Product performance analytics error:", error);
      return {
        mostProfitable: [],
        fastestSelling: [],
        mostRejected: [],
        allProducts: [],
      };
    }
  }

  async getVendorPerformanceLeaderboard(userId: string): Promise<any[]> {
    // Get all vendors
    const allVendors = await db.select().from(vendors)
      .where(eq(vendors.userId, userId));
    
    const vendorMetrics = await Promise.all(
      allVendors.map(async (vendor) => {
        // Get deliveries stats
        const deliveriesData = await db.select({
          totalDeliveries: sql<number>`COUNT(*)`,
          totalAmount: sql<string>`COALESCE(SUM(${deliveries.totalAmount}), 0)`,
          settledCount: sql<number>`COUNT(CASE WHEN CAST(${deliveries.paymentStatus} AS TEXT) = 'settled' THEN 1 END)`,
          pendingCount: sql<number>`COUNT(CASE WHEN CAST(${deliveries.paymentStatus} AS TEXT) = 'pending' THEN 1 END)`,
        })
        .from(deliveries)
        .where(and(eq(deliveries.vendorId, vendor.id), eq(deliveries.userId, userId)));

        const stats = deliveriesData[0];
        const totalDeliveries = Number(stats?.totalDeliveries || 0);
        const settledCount = Number(stats?.settledCount || 0);
        const paymentRate = totalDeliveries > 0 ? ((settledCount / totalDeliveries) * 100) : 0;

        // Calculate average days to payment for settled deliveries
        const settledDeliveries = await db.select({
          deliveryDate: deliveries.deliveryDate,
          createdAt: deliveries.createdAt,
        })
        .from(deliveries)
        .where(
          and(
            eq(deliveries.vendorId, vendor.id),
            eq(deliveries.paymentStatus, 'settled'),
            eq(deliveries.userId, userId)
          )
        );

        let avgDaysToPayment = 0;
        if (settledDeliveries.length > 0) {
          const totalDays = settledDeliveries.reduce((sum, d) => {
            const deliveryDate = new Date(d.deliveryDate);
            const paidDate = new Date(d.createdAt);
            const days = Math.ceil((paidDate.getTime() - deliveryDate.getTime()) / (1000 * 60 * 60 * 24));
            return sum + days;
          }, 0);
          avgDaysToPayment = totalDays / settledDeliveries.length;
        }

        return {
          vendorId: vendor.id,
          vendorName: vendor.name,
          state: vendor.state,
          totalDeliveries,
          totalAmount: parseFloat(stats?.totalAmount || "0").toFixed(2),
          settledCount,
          pendingCount: Number(stats?.pendingCount || 0),
          paymentRate: paymentRate.toFixed(1),
          avgDaysToPayment: avgDaysToPayment.toFixed(0),
          score: paymentRate - (avgDaysToPayment * 2), // Higher payment rate, lower days = higher score
        };
      })
    );

    // Sort by score (best performers first)
    return vendorMetrics
      .filter(v => v.totalDeliveries > 0)
      .sort((a, b) => b.score - a.score);
  }

  async getAgentPerformanceLeaderboard(userId: string): Promise<any[]> {
    // Get all resellers/agents
    const allResellers = await db.select().from(resellers)
      .where(eq(resellers.userId, userId));
    
    const resellerMetrics = await Promise.all(
      allResellers.map(async (reseller) => {
        // Get transfer stats
        const transfersData = await db.select({
          totalTransfers: sql<number>`COUNT(*)`,
          totalAmount: sql<string>`COALESCE(SUM(${resellerTransfers.totalAmount}), 0)`,
          paidCount: sql<number>`COUNT(CASE WHEN CAST(${resellerTransfers.paymentStatus} AS TEXT) = 'paid' THEN 1 END)`,
        })
        .from(resellerTransfers)
        .where(and(eq(resellerTransfers.resellerId, reseller.id), eq(resellerTransfers.userId, userId)));

        // Get total quantities transferred
        const quantityData = await db.select({
          totalQty: sql<number>`COALESCE(SUM(${resellerTransferItems.quantity}), 0)`,
        })
        .from(resellerTransferItems)
        .innerJoin(resellerTransfers, eq(resellerTransferItems.transferId, resellerTransfers.id))
        .where(and(eq(resellerTransfers.resellerId, reseller.id), eq(resellerTransfers.userId, userId)));

        const stats = transfersData[0];
        const totalTransfers = Number(stats?.totalTransfers || 0);
        const paidCount = Number(stats?.paidCount || 0);
        const paymentRate = totalTransfers > 0 ? ((paidCount / totalTransfers) * 100) : 0;

        return {
          resellerId: reseller.id,
          resellerName: reseller.name,
          state: reseller.state,
          pricingTier: reseller.pricingTier,
          totalTransfers,
          totalAmount: parseFloat(stats?.totalAmount || "0").toFixed(2),
          totalQty: Number(quantityData[0]?.totalQty || 0),
          paidCount,
          paymentRate: paymentRate.toFixed(1),
          score: parseFloat(stats?.totalAmount || "0") + (paymentRate * 10), // Higher revenue + payment rate = higher score
        };
      })
    );

    // Sort by score (best performers first)
    return resellerMetrics
      .filter(r => r.totalTransfers > 0)
      .sort((a, b) => b.score - a.score);
  }

  async getSalesTrendData(userId: string, days: number = 30): Promise<any[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    // Get daily sales totals (POS + Deliveries)
    const dailyData = [];
    
    for (let i = 0; i < days; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const dateStr = currentDate.toISOString().split('T')[0];
      
      const nextDate = new Date(currentDate);
      nextDate.setDate(currentDate.getDate() + 1);

      // POS sales for this day
      const posSales = await db.select({
        total: sql<string>`COALESCE(SUM(${sales.totalAmount}), 0)`,
      })
      .from(sales)
      .where(
        and(
          eq(sales.userId, userId),
          gte(sales.saleDate, currentDate.toISOString()),
          lte(sales.saleDate, nextDate.toISOString())
        )
      );

      // Delivery sales for this day
      const deliverySales = await db.select({
        total: sql<string>`COALESCE(SUM(${deliveries.totalAmount}), 0)`,
      })
      .from(deliveries)
      .where(
        and(
          eq(deliveries.userId, userId),
          gte(deliveries.deliveryDate, currentDate.toISOString()),
          lte(deliveries.deliveryDate, nextDate.toISOString())
        )
      );

      // Production costs for this day
      const productionCosts = await db.select({
        total: sql<string>`COALESCE(SUM(${productionBatches.totalCost}), 0)`,
      })
      .from(productionBatches)
      .where(
        and(
          eq(productionBatches.userId, userId),
          gte(productionBatches.batchDate, currentDate.toISOString()),
          lte(productionBatches.batchDate, nextDate.toISOString())
        )
      );

      // Expenses for this day
      const expensesCosts = await db.select({
        total: sql<string>`COALESCE(SUM(${expenses.amount}), 0)`,
      })
      .from(expenses)
      .where(
        and(
          eq(expenses.userId, userId),
          gte(expenses.expenseDate, currentDate.toISOString()),
          lte(expenses.expenseDate, nextDate.toISOString())
        )
      );

      const revenue = parseFloat(posSales[0]?.total || "0") + parseFloat(deliverySales[0]?.total || "0");
      const costs = parseFloat(productionCosts[0]?.total || "0") + parseFloat(expensesCosts[0]?.total || "0");
      const profit = revenue - costs;

      dailyData.push({
        date: dateStr,
        revenue: revenue.toFixed(2),
        costs: costs.toFixed(2),
        profit: profit.toFixed(2),
      });
    }

    return dailyData;
  }

  // Helper function to calculate commission
  private async calculateCommission(userId: string, vendorId: string, amount: number): Promise<number> {
    const commission = await this.getVendorCommission(userId, vendorId);
    
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
  async getClaimsSummary(userId: string, limit: number = 20, offset: number = 0): Promise<{ data: any[], hasMore: boolean, total: number }> {
    // Get all unique vendors from deliveries FOR THIS USER
    const uniqueVendors = await db.selectDistinct({
      vendorId: deliveries.vendorId,
      vendorName: deliveries.vendorName,
    })
      .from(deliveries)
      .where(eq(deliveries.userId, userId));

    // Calculate detailed claims for each vendor with latest delivery date and overdue days
    const claimsSummary = await Promise.all(
      uniqueVendors.map(async (vendor) => {
        const details = await this.getClaimDetailsByVendor(userId, vendor.vendorId);
        
        // Get latest delivery date for this vendor
        const latestDelivery = details.deliveries && details.deliveries.length > 0 
          ? new Date(details.deliveries[0].deliveryDate).getTime() 
          : 0;
        
        // Calculate oldest unpaid delivery date for overdue tracking
        let oldestUnpaidDate = 0;
        let daysOverdue = 0;
        
        if (details.deliveries && details.deliveries.length > 0) {
          const unpaidDeliveries = details.deliveries.filter((d: any) => 
            d.paymentStatus === 'pending' || d.paymentStatus === 'partial'
          );
          
          if (unpaidDeliveries.length > 0) {
            // Find the oldest unpaid delivery (last in the sorted array since it's desc by date)
            const oldestUnpaid = unpaidDeliveries[unpaidDeliveries.length - 1];
            oldestUnpaidDate = new Date(oldestUnpaid.deliveryDate).getTime();
            
            // Calculate days overdue
            const today = new Date();
            const diffTime = Math.abs(today.getTime() - oldestUnpaidDate);
            daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          }
        }
        
        return {
          vendorId: vendor.vendorId,
          vendorName: vendor.vendorName,
          totalDeliveries: details.totalDeliveries,
          totalAmount: details.claimableAmount, // Use claimable amount (after commission & rejections)
          pendingAmount: details.pendingAmount,
          settledAmount: details.settledAmount,
          partialAmount: details.partialAmount,
          latestDeliveryDate: latestDelivery,
          daysOverdue,
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

  async getClaimDetailsByVendor(userId: string, vendorId: string): Promise<any> {
    // Get all deliveries for this vendor FOR THIS USER
    const vendorDeliveries = await db.select()
      .from(deliveries)
      .where(and(eq(deliveries.vendorId, vendorId), eq(deliveries.userId, userId)))
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
        const commission = await this.calculateCommission(userId, vendorId, netAmount);
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
  async getBusinessProfile(userId: string): Promise<BusinessProfile | undefined> {
    const [profile] = await db.select().from(businessProfile)
      .where(eq(businessProfile.userId, userId))
      .limit(1);
    return profile || undefined;
  }

  async createOrUpdateBusinessProfile(userId: string, profile: InsertBusinessProfile): Promise<BusinessProfile> {
    // Check if profile exists
    const existing = await this.getBusinessProfile(userId);
    
    if (existing) {
      // Update existing profile
      const [updated] = await db.update(businessProfile)
        .set({ ...profile, updatedAt: new Date() })
        .where(and(eq(businessProfile.id, existing.id), eq(businessProfile.userId, userId)))
        .returning();
      return updated;
    } else {
      // Create new profile
      const [newProfile] = await db.insert(businessProfile).values({ ...profile, userId }).returning();
      return newProfile;
    }
  }

  // Google Drive Sync
  async logGoogleDriveSync(userId: string, log: InsertGoogleDriveSyncLog): Promise<GoogleDriveSyncLog> {
    const [syncLog] = await db.insert(googleDriveSyncLog).values({ ...log, userId }).returning();
    return syncLog;
  }

  async getGoogleDriveSyncLogs(userId: string): Promise<GoogleDriveSyncLog[]> {
    const logs = await db.select()
      .from(googleDriveSyncLog)
      .where(eq(googleDriveSyncLog.userId, userId))
      .orderBy(desc(googleDriveSyncLog.syncedAt))
      .limit(100);
    return logs;
  }

  async getGoogleDriveSyncLogsByDelivery(userId: string, deliveryId: string): Promise<GoogleDriveSyncLog[]> {
    const logs = await db.select()
      .from(googleDriveSyncLog)
      .where(and(eq(googleDriveSyncLog.deliveryId, deliveryId), eq(googleDriveSyncLog.userId, userId)))
      .orderBy(desc(googleDriveSyncLog.syncedAt));
    return logs;
  }

  // Vendor Commissions
  async getVendorCommission(userId: string, vendorId: string): Promise<VendorCommission | undefined> {
    const [commission] = await db.select()
      .from(vendorCommissions)
      .where(and(eq(vendorCommissions.vendorId, vendorId), eq(vendorCommissions.userId, userId)))
      .limit(1);
    return commission || undefined;
  }

  async createOrUpdateVendorCommission(userId: string, commission: InsertVendorCommission): Promise<VendorCommission> {
    // Check if commission exists for this vendor
    const existing = await this.getVendorCommission(userId, commission.vendorId);
    
    if (existing) {
      // Update existing commission
      const [updated] = await db.update(vendorCommissions)
        .set({ ...commission, updatedAt: new Date() })
        .where(and(eq(vendorCommissions.vendorId, commission.vendorId), eq(vendorCommissions.userId, userId)))
        .returning();
      return updated;
    } else {
      // Create new commission
      const [newCommission] = await db.insert(vendorCommissions).values({ ...commission, userId }).returning();
      return newCommission;
    }
  }

  async deleteVendorCommission(userId: string, vendorId: string): Promise<void> {
    await db.delete(vendorCommissions)
      .where(and(eq(vendorCommissions.vendorId, vendorId), eq(vendorCommissions.userId, userId)));
  }
  
  // Stock Items (Warehouse Inventory)
  async getStockItems(userId: string): Promise<StockItem[]> {
    return await db.select().from(stockItems)
      .where(eq(stockItems.userId, userId))
      .orderBy(desc(stockItems.createdAt));
  }
  
  async getStockItem(userId: string, id: string): Promise<StockItem | undefined> {
    const result = await db.select().from(stockItems)
      .where(and(eq(stockItems.id, id), eq(stockItems.userId, userId)));
    return result[0];
  }

  async getStockItemsByIds(ids: string[], userId: string): Promise<StockItem[]> {
    return await db.select().from(stockItems)
      .where(and(
        inArray(stockItems.id, ids),
        eq(stockItems.userId, userId)
      ));
  }
  
  async createStockItem(userId: string, item: InsertStockItem): Promise<StockItem> {
    return await db.transaction(async (tx) => {
      // Create the stock item
      const [created] = await tx.insert(stockItems).values({ ...item, userId }).returning();
      
      // Log the initial stock movement
      await tx.insert(stockMovements).values({
        userId,
        stockItemId: created.id,
        movementType: 'purchase',
        quantityBefore: '0',
        quantityChange: created.currentQuantity,
        quantityAfter: created.currentQuantity,
        reason: `Initial stock: ${created.name}`,
        referenceType: 'initial_stock',
        createdBy: userId,
      });
      
      return created;
    });
  }
  
  async updateStockItem(userId: string, id: string, item: Partial<InsertStockItem>, expectedVersion?: number): Promise<StockItem> {
    return await db.transaction(async (tx) => {
      // Get current state
      const [current] = await tx.select().from(stockItems)
        .where(and(eq(stockItems.id, id), eq(stockItems.userId, userId)))
        .for('update'); // Lock row to prevent concurrent modifications
      
      if (!current) {
        throw new Error('Stock item not found');
      }
      
      // Check version if optimistic locking is enabled
      if (expectedVersion !== undefined && current.version !== expectedVersion) {
        throw new Error('Stock item was modified by another user. Please refresh and try again.');
      }
      
      // Prepare update data
      const updateData: any = { 
        ...item, 
        updatedAt: new Date(),
        version: current.version + 1, // Increment version
      };
      
      // Update the stock item
      const [updated] = await tx.update(stockItems)
        .set(updateData)
        .where(and(eq(stockItems.id, id), eq(stockItems.userId, userId)))
        .returning();
      
      // Log stock movement if quantity changed
      if (item.currentQuantity && item.currentQuantity !== current.currentQuantity) {
        const qtyBefore = parseFloat(current.currentQuantity);
        const qtyAfter = parseFloat(item.currentQuantity);
        const qtyChange = qtyAfter - qtyBefore;
        
        await tx.insert(stockMovements).values({
          userId,
          stockItemId: id,
          movementType: qtyChange > 0 ? 'replenish' : 'adjust',
          quantityBefore: current.currentQuantity,
          quantityChange: qtyChange.toFixed(2),
          quantityAfter: item.currentQuantity,
          reason: (item as any).notes || 'Stock quantity updated',
          referenceType: 'manual_update',
          createdBy: userId,
        });
      }
      
      return updated;
    });
  }
  
  async deleteStockItem(userId: string, id: string): Promise<void> {
    await db.delete(stockItems)
      .where(and(eq(stockItems.id, id), eq(stockItems.userId, userId)));
    // Note: stockMovements will be cascaded deleted automatically due to foreign key
  }
  
  async deleteAllStockItems(userId: string): Promise<void> {
    // Batch delete - much faster than sequential deletes
    await db.delete(stockItems).where(eq(stockItems.userId, userId));
  }
  
  async getLowStockItems(userId: string): Promise<StockItem[]> {
    return await db.select().from(stockItems)
      .where(and(
        eq(stockItems.userId, userId),
        sql`${stockItems.currentQuantity} <= ${stockItems.lowStockThreshold}`
      ))
      .orderBy(stockItems.currentQuantity);
  }
  
  // Stock Movements (Audit Trail)
  async logStockMovement(movement: InsertStockMovement): Promise<StockMovement> {
    const [created] = await db.insert(stockMovements).values(movement).returning();
    return created;
  }
  
  async getStockMovements(userId: string, stockItemId?: string): Promise<StockMovement[]> {
    if (stockItemId) {
      return await db.select().from(stockMovements)
        .where(and(
          eq(stockMovements.userId, userId),
          eq(stockMovements.stockItemId, stockItemId)
        ))
        .orderBy(desc(stockMovements.createdAt));
    }
    
    return await db.select().from(stockMovements)
      .where(eq(stockMovements.userId, userId))
      .orderBy(desc(stockMovements.createdAt));
  }
  
  // Categories
  async getCategories(userId: string): Promise<Category[]> {
    return await db.select().from(categories)
      .where(eq(categories.userId, userId))
      .orderBy(categories.name);
  }
  
  async createCategory(userId: string, category: InsertCategory): Promise<Category> {
    const result = await db.insert(categories).values({ ...category, userId }).returning();
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

  async validateRecipe(userId: string, recipeItemsList: any[]): Promise<{valid: boolean; errors: string[]}> {
    const errors: string[] = [];
    
    // Check 1: Recipe must have at least one item
    if (!recipeItemsList || recipeItemsList.length === 0) {
      errors.push("Recipe must have at least one ingredient");
      return { valid: false, errors };
    }
    
    // Check 2: Stock items exist and batch fetch them
    const stockItemIds = recipeItemsList.map(r => r.stockItemId);
    const existingStockItems = await this.getStockItemsByIds(stockItemIds, userId);
    const existingIds = new Set(existingStockItems.map(s => s.id));
    
    recipeItemsList.forEach((item, index) => {
      if (!existingIds.has(item.stockItemId)) {
        errors.push(`Recipe item ${index + 1}: Stock item no longer exists or does not belong to you`);
      }
    });
    
    // Check 3: Quantities are positive numbers
    recipeItemsList.forEach((item, index) => {
      const qty = parseFloat(item.quantityNeeded);
      if (isNaN(qty) || qty <= 0) {
        errors.push(`Recipe item ${index + 1}: Quantity must be a positive number (got "${item.quantityNeeded}")`);
      }
    });
    
    // Check 4: No duplicate stock items
    const uniqueIds = new Set(stockItemIds);
    if (uniqueIds.size !== stockItemIds.length) {
      errors.push("Recipe contains duplicate ingredients. Each stock item can only be used once per product.");
    }
    
    // Check 5: Stock availability warnings (not errors, just warnings)
    const warnings: string[] = [];
    recipeItemsList.forEach((item, index) => {
      const stockItem = existingStockItems.find(s => s.id === item.stockItemId);
      if (stockItem) {
        const currentQty = parseFloat(stockItem.currentQuantity);
        if (currentQty <= 0) {
          warnings.push(`Warning: Recipe item ${index + 1} ("${stockItem.name}") is currently out of stock`);
        } else if (currentQty < parseFloat(item.quantityNeeded)) {
          warnings.push(`Warning: Recipe item ${index + 1} ("${stockItem.name}") has insufficient stock (available: ${currentQty}${stockItem.unit}, needed: ${item.quantityNeeded}${item.usageUnit})`);
        }
      }
    });
    
    // Add warnings to errors array but don't fail validation
    if (warnings.length > 0) {
      errors.push(...warnings);
    }
    
    // Validation passes if no critical errors (only warnings are okay)
    const hasCriticalErrors = errors.some(e => !e.startsWith("Warning:"));
    
    return {
      valid: !hasCriticalErrors,
      errors,
    };
  }
  
  // Shopping Cart
  async addToShoppingCart(userId: string, item: InsertShoppingCart): Promise<ShoppingCart> {
    const result = await db.insert(shoppingCart).values({ ...item, userId }).returning();
    return result[0];
  }
  
  async getShoppingCartItems(userId: string): Promise<ShoppingCart[]> {
    return await db.select().from(shoppingCart)
      .where(eq(shoppingCart.userId, userId))
      .orderBy(desc(shoppingCart.createdAt));
  }
  
  async removeFromCart(userId: string, id: string): Promise<void> {
    await db.delete(shoppingCart)
      .where(and(eq(shoppingCart.id, id), eq(shoppingCart.userId, userId)));
  }
  
  async clearCart(userId: string): Promise<void> {
    await db.delete(shoppingCart).where(eq(shoppingCart.userId, userId));
  }
  
  async bulkPurchaseAndUpdateStock(userId: string, cartItemIds: string[]): Promise<void> {
    // Start transaction
    await db.transaction(async (tx) => {
      // Get all cart items using inArray
      const items = await tx.select().from(shoppingCart).where(
        and(inArray(shoppingCart.id, cartItemIds), eq(shoppingCart.userId, userId))
      );
      
      // Update stock for each item
      for (const item of items) {
        const stockItem = await tx.select().from(stockItems).where(
          and(eq(stockItems.id, item.stockItemId), eq(stockItems.userId, userId))
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
            .where(and(eq(stockItems.id, item.stockItemId), eq(stockItems.userId, userId)));
        }
      }
      
      // Remove purchased items from cart using inArray
      await tx.delete(shoppingCart).where(
        and(inArray(shoppingCart.id, cartItemIds), eq(shoppingCart.userId, userId))
      );
    });
  }
  
  // Purchase Orders (Smart Supplier Order Hub)
  async createPurchaseOrder(userId: string, orderData: InsertPurchaseOrder, items: InsertPurchaseOrderItem[]): Promise<PurchaseOrder> {
    return await db.transaction(async (tx) => {
      // Create PO
      const [order] = await tx.insert(purchaseOrders).values({ ...orderData, userId }).returning();
      
      // Create PO items
      const itemsWithPoId = items.map(item => ({ ...item, poId: order.id, userId }));
      await tx.insert(purchaseOrderItems).values(itemsWithPoId);
      
      return order;
    });
  }
  
  async getPurchaseOrders(userId: string): Promise<any[]> {
    const orders = await db.select().from(purchaseOrders)
      .where(eq(purchaseOrders.userId, userId))
      .orderBy(desc(purchaseOrders.createdAt));
    
    // Get items for each order (PO ownership already validated)
    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const items = await db.select()
          .from(purchaseOrderItems)
          .where(eq(purchaseOrderItems.poId, order.id));
        return { ...order, items };
      })
    );
    
    return ordersWithItems;
  }
  
  async getPurchaseOrder(userId: string, id: string): Promise<any | undefined> {
    const [order] = await db.select().from(purchaseOrders)
      .where(and(eq(purchaseOrders.id, id), eq(purchaseOrders.userId, userId)));
    
    if (!order) return undefined;
    
    const items = await db.select()
      .from(purchaseOrderItems)
      .where(eq(purchaseOrderItems.poId, id));
    
    return { ...order, items };
  }
  
  async updatePurchaseOrderStatus(userId: string, id: string, status: string, additionalData?: Partial<InsertPurchaseOrder>): Promise<PurchaseOrder> {
    const updateData: any = { status, updatedAt: new Date() };
    
    if (status === 'sent') {
      updateData.sentAt = new Date();
    } else if (status === 'received') {
      updateData.receivedAt = new Date();
    }
    
    if (additionalData) {
      Object.assign(updateData, additionalData);
    }
    
    const [updated] = await db.update(purchaseOrders)
      .set(updateData)
      .where(and(eq(purchaseOrders.id, id), eq(purchaseOrders.userId, userId)))
      .returning();
    
    return updated;
  }
  
  async updatePurchaseOrder(userId: string, id: string, data: { 
    supplierName?: string; 
    supplierPhone?: string | null; 
    supplierEmail?: string | null;
    supplierAddress?: string | null;
    deliveryAddress?: string | null;
    notes?: string | null;
    expectedDeliveryDate?: string | null;
    paymentTerms?: string | null;
    paymentMethod?: string | null;
    requestedBy?: string | null;
    discount?: string | null;
    tax?: string | null;
    shippingCharges?: string | null;
    items?: any[] 
  }): Promise<any> {
    return await db.transaction(async (tx) => {
      // Update PO basic info
      const updateData: any = { updatedAt: new Date() };
      if (data.supplierName !== undefined) updateData.supplierName = data.supplierName;
      if (data.supplierPhone !== undefined) updateData.supplierPhone = data.supplierPhone;
      if (data.supplierEmail !== undefined) updateData.supplierEmail = data.supplierEmail;
      if (data.supplierAddress !== undefined) updateData.supplierAddress = data.supplierAddress;
      if (data.deliveryAddress !== undefined) updateData.deliveryAddress = data.deliveryAddress;
      if (data.notes !== undefined) updateData.notes = data.notes;
      if (data.expectedDeliveryDate !== undefined) updateData.expectedDeliveryDate = data.expectedDeliveryDate;
      if (data.paymentTerms !== undefined) updateData.paymentTerms = data.paymentTerms;
      if (data.paymentMethod !== undefined) updateData.paymentMethod = data.paymentMethod;
      if (data.requestedBy !== undefined) updateData.requestedBy = data.requestedBy;
      if (data.discount !== undefined) updateData.discount = data.discount;
      if (data.tax !== undefined) updateData.tax = data.tax;
      if (data.shippingCharges !== undefined) updateData.shippingCharges = data.shippingCharges;
      
      await tx
        .update(purchaseOrders)
        .set(updateData)
        .where(and(eq(purchaseOrders.id, id), eq(purchaseOrders.userId, userId)));
      
      // Update items if provided (including empty array to clear items)
      if (data.items !== undefined) {
        // Delete old items (PO ownership already validated)
        await tx.delete(purchaseOrderItems)
          .where(eq(purchaseOrderItems.poId, id));
        
        // Insert new items if any
        if (data.items.length > 0) {
          await tx.insert(purchaseOrderItems).values(
            data.items.map((item: any) => ({
              poId: id,
              stockItemId: item.stockItemId || null,
              itemName: item.itemName,
              quantity: item.quantity,
              unit: item.unit,
              estimatedPrice: item.estimatedPrice || null,
              notes: item.notes || null,
              userId,
            }))
          );
        }
        
        // Recalculate total with discount, shipping, and tax
        const subtotal = data.items.reduce((sum: number, item: any) => {
          const price = parseFloat(item.estimatedPrice || "0");
          const qty = parseFloat(item.quantity || "0");
          return sum + (price * qty);
        }, 0);
        
        const discount = parseFloat(data.discount || "0");
        const shipping = parseFloat(data.shippingCharges || "0");
        const tax = parseFloat(data.tax || "0");
        const totalAmount = subtotal - discount + shipping + tax;
        
        await tx
          .update(purchaseOrders)
          .set({ totalAmount: totalAmount.toString() })
          .where(and(eq(purchaseOrders.id, id), eq(purchaseOrders.userId, userId)));
      }
      
      // Return fresh updated PO with items
      const [updatedPO] = await tx.select().from(purchaseOrders)
        .where(and(eq(purchaseOrders.id, id), eq(purchaseOrders.userId, userId)));
      const items = await tx.select()
        .from(purchaseOrderItems)
        .where(eq(purchaseOrderItems.poId, id));
      
      return { ...updatedPO, items };
    });
  }

  async deletePurchaseOrder(userId: string, id: string): Promise<void> {
    await db.delete(purchaseOrders)
      .where(and(eq(purchaseOrders.id, id), eq(purchaseOrders.userId, userId)));
  }

  async duplicatePurchaseOrder(userId: string, id: string): Promise<any> {
    return await db.transaction(async (tx) => {
      // Get original PO
      const [originalPO] = await tx.select().from(purchaseOrders)
        .where(and(eq(purchaseOrders.id, id), eq(purchaseOrders.userId, userId)));
      
      if (!originalPO) {
        throw new Error("Purchase order not found");
      }

      // Get original items
      const originalItems = await tx.select()
        .from(purchaseOrderItems)
        .where(eq(purchaseOrderItems.poId, id));

      // Generate new PO number with advisory lock to prevent race conditions
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
      
      // Use PostgreSQL advisory lock to serialize PO generation per date per user
      const userHash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const lockId = parseInt(dateStr) * 1000000 + (userHash % 1000000) + 100000;
      
      // Acquire advisory lock for this user+date (automatically released at transaction end)
      await tx.execute(sql`SELECT pg_advisory_xact_lock(${lockId})`);
      
      // Now safely find the latest PO number for this date FOR THIS USER
      const latestPO = await tx
        .select()
        .from(purchaseOrders)
        .where(and(
          eq(purchaseOrders.userId, userId),
          sql`${purchaseOrders.poNumber} LIKE ${'PO-' + dateStr + '-%'}`
        ))
        .orderBy(desc(purchaseOrders.poNumber))
        .limit(1);
      
      let sequenceNumber = 1;
      if (latestPO.length > 0 && latestPO[0].poNumber) {
        // Extract sequence number from PO-YYYYMMDD-XXX
        const parts = latestPO[0].poNumber.split('-');
        if (parts.length === 3) {
          sequenceNumber = parseInt(parts[2]) + 1;
        }
      }
      
      const poNumber = `PO-${dateStr}-${String(sequenceNumber).padStart(3, '0')}`;

      // Create new PO as draft
      const [newPO] = await tx.insert(purchaseOrders).values({
        userId,
        poNumber,
        supplierId: originalPO.supplierId,
        supplierName: originalPO.supplierName,
        supplierPhone: originalPO.supplierPhone,
        supplierEmail: originalPO.supplierEmail,
        supplierAddress: originalPO.supplierAddress,
        deliveryAddress: originalPO.deliveryAddress,
        totalAmount: originalPO.totalAmount,
        status: 'draft', // Always create as draft
        notes: originalPO.notes,
      }).returning();

      // Copy items
      if (originalItems.length > 0) {
        await tx.insert(purchaseOrderItems).values(
          originalItems.map(item => ({
            poId: newPO.id,
            stockItemId: item.stockItemId,
            itemName: item.itemName,
            quantity: item.quantity,
            unit: item.unit,
            estimatedPrice: item.estimatedPrice,
            notes: item.notes,
            userId,
          }))
        );
      }

      // Return new PO with items
      const items = await tx.select()
        .from(purchaseOrderItems)
        .where(eq(purchaseOrderItems.poId, newPO.id));

      return { ...newPO, items };
    });
  }
  
  // PO Template Management
  async getAllPOTemplates(userId: string): Promise<any[]> {
    const templates = await db.select().from(poTemplates)
      .where(eq(poTemplates.userId, userId))
      .orderBy(desc(poTemplates.createdAt));
    
    // Fetch items for each template
    const templatesWithItems = await Promise.all(
      templates.map(async (template) => {
        const items = await db.select()
          .from(poTemplateItems)
          .where(and(eq(poTemplateItems.templateId, template.id), eq(poTemplateItems.userId, userId)));
        return { ...template, items };
      })
    );
    
    return templatesWithItems;
  }
  
  async createPOTemplate(userId: string, data: {
    templateName: string;
    supplierId?: string | null;
    supplierName: string;
    supplierPhone?: string | null;
    notes?: string | null;
    items: any[];
  }): Promise<any> {
    return await db.transaction(async (tx) => {
      const [template] = await tx.insert(poTemplates).values({
        templateName: data.templateName,
        supplierId: data.supplierId || null,
        supplierName: data.supplierName,
        supplierPhone: data.supplierPhone || null,
        notes: data.notes || null,
        userId,
      }).returning();
      
      if (data.items && data.items.length > 0) {
        await tx.insert(poTemplateItems).values(
          data.items.map((item: any) => ({
            templateId: template.id,
            stockItemId: item.stockItemId || null,
            itemName: item.itemName,
            quantity: item.quantity,
            unit: item.unit,
            estimatedPrice: item.estimatedPrice || "0",
            notes: item.notes || null,
            userId,
          }))
        );
      }
      
      const items = await tx.select()
        .from(poTemplateItems)
        .where(and(eq(poTemplateItems.templateId, template.id), eq(poTemplateItems.userId, userId)));
      
      return { ...template, items };
    });
  }
  
  async deletePOTemplate(userId: string, id: string): Promise<void> {
    await db.delete(poTemplates)
      .where(and(eq(poTemplates.id, id), eq(poTemplates.userId, userId)));
  }
  
  async createPOFromTemplate(userId: string, templateId: string): Promise<any> {
    return await db.transaction(async (tx) => {
      const [template] = await tx.select()
        .from(poTemplates)
        .where(and(eq(poTemplates.id, templateId), eq(poTemplates.userId, userId)));
      
      if (!template) {
        throw new Error("Template not found");
      }
      
      const templateItems = await tx.select()
        .from(poTemplateItems)
        .where(and(eq(poTemplateItems.templateId, templateId), eq(poTemplateItems.userId, userId)));
      
      // Generate PO number with advisory lock to prevent race conditions
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
      
      // Use PostgreSQL advisory lock to serialize PO generation per date per user
      const userHash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const lockId = parseInt(dateStr) * 1000000 + (userHash % 1000000) + 100000;
      
      // Acquire advisory lock for this user+date (automatically released at transaction end)
      await tx.execute(sql`SELECT pg_advisory_xact_lock(${lockId})`);
      
      // Now safely find the latest PO number for this date FOR THIS USER
      const latestPO = await tx
        .select()
        .from(purchaseOrders)
        .where(and(
          eq(purchaseOrders.userId, userId),
          sql`${purchaseOrders.poNumber} LIKE ${'PO-' + dateStr + '-%'}`
        ))
        .orderBy(desc(purchaseOrders.poNumber))
        .limit(1);
      
      let sequenceNumber = 1;
      if (latestPO.length > 0 && latestPO[0].poNumber) {
        // Extract sequence number from PO-YYYYMMDD-XXX
        const parts = latestPO[0].poNumber.split('-');
        if (parts.length === 3) {
          sequenceNumber = parseInt(parts[2]) + 1;
        }
      }
      
      const poNumber = `PO-${dateStr}-${String(sequenceNumber).padStart(3, '0')}`;
      
      // Calculate total from template items
      const totalAmount = templateItems.reduce((sum, item) => {
        const price = parseFloat(item.estimatedPrice || "0");
        const qty = parseFloat(item.quantity || "0");
        return sum + (price * qty);
      }, 0);
      
      // Create PO with calculated total
      const [order] = await tx.insert(purchaseOrders).values({
        poNumber,
        supplierId: template.supplierId,
        supplierName: template.supplierName,
        supplierPhone: template.supplierPhone,
        totalAmount: totalAmount.toFixed(2),
        notes: template.notes,
        status: 'draft',
        userId,
      }).returning();
      
      // Create PO items from template (no userId - linked via poId)
      if (templateItems.length > 0) {
        await tx.insert(purchaseOrderItems).values(
          templateItems.map((item) => ({
            poId: order.id,
            stockItemId: item.stockItemId,
            itemName: item.itemName,
            quantity: item.quantity,
            unit: item.unit,
            estimatedPrice: item.estimatedPrice,
            notes: item.notes,
          }))
        );
      }
      
      const items = await tx.select()
        .from(purchaseOrderItems)
        .where(eq(purchaseOrderItems.poId, order.id));
      
      return { ...order, items };
    });
  }
  
  async createPurchaseOrderFromCart(
    userId: string,
    supplierId: string | null,
    supplierName: string,
    supplierPhone: string | null,
    supplierEmail: string | null,
    supplierAddress: string | null,
    deliveryAddress: string | null,
    notes: string | null,
    cartItemIds: string[]
  ): Promise<PurchaseOrder> {
    return await db.transaction(async (tx) => {
      // Get cart items
      const cartItems = await tx.select().from(shoppingCart).where(
        and(inArray(shoppingCart.id, cartItemIds), eq(shoppingCart.userId, userId))
      );
      
      // Generate PO number with advisory lock to prevent race conditions
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD
      
      // Use PostgreSQL advisory lock to serialize PO generation per date per user
      const userHash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const lockId = parseInt(dateStr) * 1000000 + (userHash % 1000000) + 100000; // +100000 to differentiate from invoice locks
      
      // Acquire advisory lock for this user+date (automatically released at transaction end)
      await tx.execute(sql`SELECT pg_advisory_xact_lock(${lockId})`);
      
      // Now safely find the latest PO number for this date FOR THIS USER
      const latestPO = await tx
        .select()
        .from(purchaseOrders)
        .where(and(
          eq(purchaseOrders.userId, userId),
          sql`${purchaseOrders.poNumber} LIKE ${'PO-' + dateStr + '-%'}`
        ))
        .orderBy(desc(purchaseOrders.poNumber))
        .limit(1);
      
      let sequenceNumber = 1;
      if (latestPO.length > 0 && latestPO[0].poNumber) {
        // Extract sequence number from PO-YYYYMMDD-XXX
        const parts = latestPO[0].poNumber.split('-');
        if (parts.length === 3) {
          sequenceNumber = parseInt(parts[2]) + 1;
        }
      }
      
      const poNumber = `PO-${dateStr}-${String(sequenceNumber).padStart(3, '0')}`;
      
      // Auto-save supplier if new (manual input without supplierId)
      let finalSupplierId = supplierId;
      if (!supplierId && supplierName.trim()) {
        // Check if supplier with same name already exists
        const existingSupplier = await tx.select().from(suppliers).where(
          and(
            eq(suppliers.userId, userId),
            sql`LOWER(${suppliers.name}) = LOWER(${supplierName})`
          )
        ).limit(1);

        if (existingSupplier.length > 0) {
          // Use existing supplier
          finalSupplierId = existingSupplier[0].id;
        } else {
          // Create new supplier
          const [newSupplier] = await tx.insert(suppliers).values({
            userId,
            name: supplierName,
            phone: supplierPhone,
          }).returning();
          finalSupplierId = newSupplier.id;
        }
      }
      
      // Calculate total
      let total = 0;
      for (const item of cartItems) {
        const stockItem = await tx.select().from(stockItems).where(
          and(eq(stockItems.id, item.stockItemId), eq(stockItems.userId, userId))
        ).limit(1);
        
        if (stockItem.length > 0) {
          const price = parseFloat(stockItem[0].purchasePrice);
          const qty = parseFloat(item.shortageQty);
          total += price * qty;
        }
      }
      
      // Create PO
      const [order] = await tx.insert(purchaseOrders).values({
        poNumber,
        supplierId: finalSupplierId,
        supplierName,
        supplierPhone,
        supplierEmail,
        supplierAddress,
        deliveryAddress,
        totalAmount: total.toFixed(2),
        notes,
        status: 'draft',
        userId,
      }).returning();
      
      // Create PO items from cart (no userId - linked via poId)
      const poItems = await Promise.all(cartItems.map(async (cartItem) => {
        const stockItem = await tx.select().from(stockItems).where(
          and(eq(stockItems.id, cartItem.stockItemId), eq(stockItems.userId, userId))
        ).limit(1);
        
        const estimatedPrice = stockItem.length > 0 
          ? parseFloat(stockItem[0].purchasePrice) 
          : 0;
        
        return {
          poId: order.id,
          stockItemId: cartItem.stockItemId,
          itemName: cartItem.stockItemName,
          quantity: cartItem.shortageQty,
          unit: cartItem.unit,
          estimatedPrice: estimatedPrice.toFixed(2),
          notes: cartItem.notes,
        };
      }));
      
      await tx.insert(purchaseOrderItems).values(poItems);
      
      // Optional: Clear cart items
      await tx.delete(shoppingCart).where(
        and(inArray(shoppingCart.id, cartItemIds), eq(shoppingCart.userId, userId))
      );
      
      return order;
    });
  }
  
  async markPurchaseOrderReceived(userId: string, id: string, actualPrices?: { itemId: string; price: number }[]): Promise<void> {
    await db.transaction(async (tx) => {
      const [order] = await tx.select().from(purchaseOrders)
        .where(and(eq(purchaseOrders.id, id), eq(purchaseOrders.userId, userId)));
      
      if (!order) throw new Error('Purchase order not found');
      
      // Update item actual prices if provided
      if (actualPrices) {
        for (const { itemId, price } of actualPrices) {
          await tx.update(purchaseOrderItems)
            .set({ actualPrice: price.toFixed(2) })
            .where(eq(purchaseOrderItems.id, itemId));
        }
      }
      
      // Get all items (PO ownership already validated)
      const items = await tx.select()
        .from(purchaseOrderItems)
        .where(eq(purchaseOrderItems.poId, id));
      
      // Update stock for each item
      for (const item of items) {
        if (item.stockItemId) {
          const [stockItem] = await tx.select().from(stockItems).where(
            and(eq(stockItems.id, item.stockItemId), eq(stockItems.userId, userId))
          );
          
          if (stockItem) {
            const currentQty = parseFloat(stockItem.currentQuantity);
            const addedQty = parseFloat(item.quantity);
            const newQty = currentQty + addedQty;
            
            await tx.update(stockItems)
              .set({ 
                currentQuantity: newQty.toString(),
                updatedAt: new Date()
              })
              .where(and(eq(stockItems.id, item.stockItemId), eq(stockItems.userId, userId)));
          }
        }
      }
      
      // Calculate actual total
      let actualTotal = parseFloat(order.totalAmount);
      if (actualPrices && actualPrices.length > 0) {
        actualTotal = 0;
        for (const item of items) {
          const price = item.actualPrice ? parseFloat(item.actualPrice) : parseFloat(item.estimatedPrice || '0');
          actualTotal += price * parseFloat(item.quantity);
        }
      }
      
      // Create expense record
      const [expense] = await tx.insert(expenses).values({
        category: 'bahan',
        description: `Pembelian bahan - ${order.poNumber} (${order.supplierName})`,
        amount: actualTotal.toFixed(2),
        expenseDate: new Date().toISOString().split('T')[0],
        userId,
      }).returning();
      
      // Update PO status to received and link expense
      await tx.update(purchaseOrders)
        .set({ 
          status: 'received',
          receivedAt: new Date(),
          expenseId: expense.id,
          totalAmount: actualTotal.toFixed(2),
          updatedAt: new Date()
        })
        .where(and(eq(purchaseOrders.id, id), eq(purchaseOrders.userId, userId)));
    });
  }
  
  // Users & Authentication
  async getAllUsers(): Promise<User[]> {
    const allUsers = await db.select().from(users);
    return allUsers;
  }
  
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

  async updateUserProfile(id: string, data: { name?: string; email?: string }): Promise<User> {
    const [updatedUser] = await db.update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async updateUserPassword(id: string, hashedPassword: string): Promise<void> {
    await db.update(users)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(users.id, id));
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
  async getAllUserSubscriptions(): Promise<UserSubscription[]> {
    return await db.select()
      .from(userSubscriptions)
      .orderBy(userSubscriptions.createdAt);
  }
  
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
  async getPricingTiers(userId: string): Promise<any[]> {
    const tiers = await db.select()
      .from(pricingTiers)
      .where(eq(pricingTiers.userId, userId))
      .orderBy(desc(pricingTiers.createdAt));
    return tiers;
  }
  
  async createPricingTier(userId: string, tier: any): Promise<any> {
    const [newTier] = await db.insert(pricingTiers).values({ ...tier, userId }).returning();
    return newTier;
  }
  
  async updatePricingTier(userId: string, id: string, tier: any): Promise<any> {
    const [updatedTier] = await db.update(pricingTiers)
      .set(tier)
      .where(and(eq(pricingTiers.id, id), eq(pricingTiers.userId, userId)))
      .returning();
    return updatedTier;
  }
  
  // Resellers
  async getResellers(userId: string): Promise<any[]> {
    const resellerList = await db.select({
      reseller: resellers,
      tier: pricingTiers
    })
      .from(resellers)
      .leftJoin(pricingTiers, and(eq(resellers.pricingTierId, pricingTiers.id), eq(pricingTiers.userId, userId)))
      .where(eq(resellers.userId, userId))
      .orderBy(desc(resellers.createdAt));
    
    return resellerList.map(r => ({
      ...r.reseller,
      pricingTier: r.tier
    }));
  }
  
  async getReseller(userId: string, id: string): Promise<any | undefined> {
    const [result] = await db.select({
      reseller: resellers,
      tier: pricingTiers
    })
      .from(resellers)
      .leftJoin(pricingTiers, and(eq(resellers.pricingTierId, pricingTiers.id), eq(pricingTiers.userId, userId)))
      .where(and(eq(resellers.id, id), eq(resellers.userId, userId)));
    
    if (!result) return undefined;
    
    return {
      ...result.reseller,
      pricingTier: result.tier
    };
  }
  
  async createReseller(userId: string, reseller: any): Promise<any> {
    const [newReseller] = await db.insert(resellers).values({ ...reseller, userId }).returning();
    return newReseller;
  }
  
  async updateReseller(userId: string, id: string, reseller: any): Promise<any> {
    const [updatedReseller] = await db.update(resellers)
      .set(reseller)
      .where(and(eq(resellers.id, id), eq(resellers.userId, userId)))
      .returning();
    return updatedReseller;
  }
  
  async deleteReseller(userId: string, id: string): Promise<void> {
    await db.delete(resellers)
      .where(and(eq(resellers.id, id), eq(resellers.userId, userId)));
  }
  
  async getResellerStats(userId: string, resellerId: string): Promise<any> {
    // Get total transfers
    const transfers = await db.select()
      .from(resellerTransfers)
      .where(and(eq(resellerTransfers.resellerId, resellerId), eq(resellerTransfers.userId, userId)));
    
    // Get last transfer date
    const [lastTransfer] = await db.select()
      .from(resellerTransfers)
      .where(and(eq(resellerTransfers.resellerId, resellerId), eq(resellerTransfers.userId, userId)))
      .orderBy(desc(resellerTransfers.transferDate))
      .limit(1);
    
    return {
      totalTransfers: transfers.length,
      totalAmount: transfers.reduce((sum, t) => sum + parseFloat(t.totalAmount || '0'), 0),
      lastTransferDate: lastTransfer?.transferDate || null
    };
  }
  
  // Reseller Transfers
  async generateTransferReceiptNumber(userId: string): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD
    
    // Get count of transfers today for this user
    const todayTransfers = await db.select()
      .from(resellerTransfers)
      .where(and(
        sql`DATE(${resellerTransfers.createdAt}) = CURRENT_DATE`,
        eq(resellerTransfers.userId, userId)
      ));
    
    const nextNumber = todayTransfers.length + 1;
    const paddedNumber = nextNumber.toString().padStart(4, '0');
    
    return `TRF-${dateStr}-${paddedNumber}`;
  }
  
  async createResellerTransfer(userId: string, transfer: any, items: any[]): Promise<any> {
    // Start transaction
    const [newTransfer] = await db.insert(resellerTransfers).values({ ...transfer, userId }).returning();
    
    // Insert transfer items
    if (items.length > 0) {
      const itemsWithTransferId = items.map(item => ({
        ...item,
        transferId: newTransfer.id,
        userId,
      }));
      await db.insert(resellerTransferItems).values(itemsWithTransferId);
    }
    
    // Update reseller total purchases
    await db.update(resellers)
      .set({ 
        totalPurchases: sql`${resellers.totalPurchases} + ${transfer.totalAmount}` 
      })
      .where(and(eq(resellers.id, transfer.resellerId), eq(resellers.userId, userId)));
    
    return newTransfer;
  }
  
  async getResellerTransfers(userId: string, limit: number = 50, offset: number = 0): Promise<{ data: any[], hasMore: boolean, total: number }> {
    const transfers = await db.select({
      transfer: resellerTransfers,
      reseller: resellers
    })
      .from(resellerTransfers)
      .leftJoin(resellers, and(eq(resellerTransfers.resellerId, resellers.id), eq(resellers.userId, userId)))
      .where(eq(resellerTransfers.userId, userId))
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
      .from(resellerTransfers)
      .where(eq(resellerTransfers.userId, userId));
    
    return {
      data,
      hasMore,
      total: countResult?.count || 0
    };
  }
  
  async getResellerTransferById(userId: string, id: string): Promise<any> {
    const [result] = await db.select({
      transfer: resellerTransfers,
      reseller: resellers
    })
      .from(resellerTransfers)
      .leftJoin(resellers, and(eq(resellerTransfers.resellerId, resellers.id), eq(resellers.userId, userId)))
      .where(and(eq(resellerTransfers.id, id), eq(resellerTransfers.userId, userId)));
    
    if (!result) return undefined;
    
    // Get transfer items
    const items = await db.select()
      .from(resellerTransferItems)
      .where(and(eq(resellerTransferItems.transferId, id), eq(resellerTransferItems.userId, userId)));
    
    return {
      ...result.transfer,
      reseller: result.reseller,
      items
    };
  }
  
  // Goals (Monthly targets and progress tracking)
  async getGoals(userId: string): Promise<Goal[]> {
    const result = await db.select()
      .from(goals)
      .where(eq(goals.userId, userId))
      .orderBy(desc(goals.targetMonth));
    return result;
  }
  
  async getGoalByMonth(userId: string, targetMonth: string): Promise<Goal | undefined> {
    const [result] = await db.select()
      .from(goals)
      .where(and(
        eq(goals.userId, userId),
        eq(goals.targetMonth, targetMonth)
      ));
    return result || undefined;
  }
  
  async createGoal(goal: InsertGoal): Promise<Goal> {
    const [newGoal] = await db.insert(goals).values(goal).returning();
    return newGoal;
  }
  
  async updateGoal(id: string, goal: Partial<InsertGoal>): Promise<Goal> {
    const [updatedGoal] = await db.update(goals)
      .set({ ...goal, updatedAt: new Date() })
      .where(eq(goals.id, id))
      .returning();
    return updatedGoal;
  }
  
  async deleteGoal(id: string): Promise<void> {
    await db.delete(goals).where(eq(goals.id, id));
  }
  
  async getGoalProgress(userId: string, targetMonth: string): Promise<any> {
    try {
      // Get goal
      const goal = await this.getGoalByMonth(userId, targetMonth);
      if (!goal) {
        return { goal: null, progress: null };
      }
      
      // Calculate actual performance for the month
      const monthStart = new Date(targetMonth);
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      
      // Get sales and deliveries for the month
      const salesData = await db.select({
        totalRevenue: sql<number>`COALESCE(SUM(${sales.totalAmount}::decimal), 0)`,
        totalProfit: sql<number>`COALESCE(SUM(${sales.profitAmount}::decimal), 0)`,
        salesCount: sql<number>`COUNT(*)`
      })
        .from(sales)
        .where(and(
          eq(sales.userId, userId),
          sql`${sales.saleDate} >= ${monthStart.toISOString().split('T')[0]}`,
          sql`${sales.saleDate} < ${monthEnd.toISOString().split('T')[0]}`
        ));
      
      const deliveriesData = await db.select({
        totalRevenue: sql<number>`COALESCE(SUM(${deliveries.totalAmount}::decimal), 0)`,
        deliveryCount: sql<number>`COUNT(*)`
      })
        .from(deliveries)
        .where(and(
          eq(deliveries.userId, userId),
          sql`${deliveries.deliveryDate} >= ${monthStart.toISOString().split('T')[0]}`,
          sql`${deliveries.deliveryDate} < ${monthEnd.toISOString().split('T')[0]}`
        ));
      
      const actualRevenue = Number(salesData[0]?.totalRevenue || 0) + Number(deliveriesData[0]?.totalRevenue || 0);
      const actualProfit = Number(salesData[0]?.totalProfit || 0); // Only sales have profit tracking
      const actualSalesVolume = Number(salesData[0]?.salesCount || 0) + Number(deliveriesData[0]?.deliveryCount || 0);
      
      return {
        goal,
        progress: {
          actualRevenue,
          actualProfit,
          actualSalesVolume,
          revenueProgress: goal.revenueTarget > 0 ? (actualRevenue / parseFloat(goal.revenueTarget)) * 100 : 0,
          profitProgress: goal.profitTarget > 0 ? (actualProfit / parseFloat(goal.profitTarget)) * 100 : 0,
          salesVolumeProgress: goal.salesVolumeTarget > 0 ? (actualSalesVolume / goal.salesVolumeTarget) * 100 : 0,
        }
      };
    } catch (error) {
      console.error('[Storage] getGoalProgress error:', error);
      // Return safe default instead of throwing
      return { goal: null, progress: null };
    }
  }

  // ========================================
  // LOYALTY PROGRAM METHODS
  // ========================================

  async getCustomerByPhone(userId: string, phone: string): Promise<any | undefined> {
    const [customer] = await db.select().from(customers)
      .where(and(eq(customers.phone, phone), eq(customers.userId, userId)));
    return customer || undefined;
  }

  async createCustomer(userId: string, customer: any): Promise<any> {
    const [newCustomer] = await db.insert(customers).values({ ...customer, userId }).returning();
    return newCustomer;
  }

  async updateCustomer(userId: string, id: string, customerData: any): Promise<any> {
    const [updated] = await db.update(customers)
      .set({ ...customerData, updatedAt: new Date() })
      .where(and(eq(customers.id, id), eq(customers.userId, userId)))
      .returning();
    return updated;
  }

  async getCustomers(userId: string): Promise<any[]> {
    const result = await db.select().from(customers)
      .where(eq(customers.userId, userId))
      .orderBy(desc(customers.createdAt));
    return result;
  }

  async awardPoints(userId: string, customerId: string, points: number, saleId: string | null, description: string): Promise<void> {
    // Get current customer points
    const [customer] = await db.select().from(customers)
      .where(and(eq(customers.id, customerId), eq(customers.userId, userId)));
    if (!customer) throw new Error("Customer not found");

    const newBalance = (customer.loyaltyPoints || 0) + points;

    // Update customer points
    await db.update(customers)
      .set({ 
        loyaltyPoints: newBalance,
        updatedAt: new Date()
      })
      .where(and(eq(customers.id, customerId), eq(customers.userId, userId)));

    // Log transaction
    await db.insert(loyaltyPointsHistory).values({
      customerId,
      saleId,
      pointsChange: points,
      balanceAfter: newBalance,
      transactionType: "earned",
      description,
      userId,
    });
  }

  async redeemPoints(userId: string, customerId: string, points: number, description: string): Promise<void> {
    // Get current customer points
    const [customer] = await db.select().from(customers)
      .where(and(eq(customers.id, customerId), eq(customers.userId, userId)));
    if (!customer) throw new Error("Customer not found");

    const currentPoints = customer.loyaltyPoints || 0;
    if (currentPoints < points) {
      throw new Error("Insufficient points");
    }

    const newBalance = currentPoints - points;

    // Update customer points
    await db.update(customers)
      .set({ 
        loyaltyPoints: newBalance,
        updatedAt: new Date()
      })
      .where(and(eq(customers.id, customerId), eq(customers.userId, userId)));

    // Log transaction (negative points for redemption)
    await db.insert(loyaltyPointsHistory).values({
      customerId,
      saleId: null,
      pointsChange: -points,
      balanceAfter: newBalance,
      transactionType: "redeemed",
      description,
      userId,
    });
  }

  async getPointsHistory(userId: string, customerId: string, limit: number = 50): Promise<any[]> {
    const history = await db.select()
      .from(loyaltyPointsHistory)
      .where(and(eq(loyaltyPointsHistory.customerId, customerId), eq(loyaltyPointsHistory.userId, userId)))
      .orderBy(desc(loyaltyPointsHistory.createdAt))
      .limit(limit);
    
    return history;
  }

  // ========================================
  // Broadcast System Methods
  // ========================================

  async getMessageTemplates(userId: string, channel?: string): Promise<any[]> {
    if (channel) {
      return await db.select()
        .from(messageTemplates)
        .where(and(
          eq(messageTemplates.userId, userId),
          eq(messageTemplates.channel, channel as any),
          eq(messageTemplates.isActive, 1)
        ))
        .orderBy(desc(messageTemplates.createdAt));
    }
    return await db.select()
      .from(messageTemplates)
      .where(and(eq(messageTemplates.userId, userId), eq(messageTemplates.isActive, 1)))
      .orderBy(desc(messageTemplates.createdAt));
  }

  async createMessageTemplate(userId: string, template: any): Promise<any> {
    const [newTemplate] = await db.insert(messageTemplates).values({ ...template, userId }).returning();
    return newTemplate;
  }

  async updateMessageTemplate(userId: string, id: string, template: any): Promise<any> {
    const [updated] = await db.update(messageTemplates)
      .set({ ...template, updatedAt: new Date() })
      .where(and(eq(messageTemplates.id, id), eq(messageTemplates.userId, userId)))
      .returning();
    return updated;
  }

  async deleteMessageTemplate(userId: string, id: string): Promise<void> {
    await db.update(messageTemplates)
      .set({ isActive: 0, updatedAt: new Date() })
      .where(and(eq(messageTemplates.id, id), eq(messageTemplates.userId, userId)));
  }

  async createBroadcastCampaign(userId: string, campaign: any): Promise<any> {
    const [newCampaign] = await db.insert(broadcastCampaigns).values({ ...campaign, userId }).returning();
    return newCampaign;
  }

  async getBroadcastCampaigns(userId: string, limit: number = 50): Promise<any[]> {
    return await db.select()
      .from(broadcastCampaigns)
      .where(eq(broadcastCampaigns.userId, userId))
      .orderBy(desc(broadcastCampaigns.createdAt))
      .limit(limit);
  }

  async getBroadcastCampaignById(userId: string, id: string): Promise<any> {
    const [campaign] = await db.select()
      .from(broadcastCampaigns)
      .where(and(eq(broadcastCampaigns.id, id), eq(broadcastCampaigns.userId, userId)));
    return campaign;
  }

  async updateBroadcastCampaign(userId: string, id: string, campaign: any): Promise<any> {
    const [updated] = await db.update(broadcastCampaigns)
      .set({ ...campaign, updatedAt: new Date() })
      .where(and(eq(broadcastCampaigns.id, id), eq(broadcastCampaigns.userId, userId)))
      .returning();
    return updated;
  }

  async deleteBroadcastCampaign(userId: string, id: string): Promise<void> {
    await db.delete(broadcastCampaigns)
      .where(and(eq(broadcastCampaigns.id, id), eq(broadcastCampaigns.userId, userId)));
  }

  async getCustomerSegment(userId: string, segment: string, customIds?: string[]): Promise<any[]> {
    // Custom segment with specific customer IDs
    if (segment === "custom" && customIds && customIds.length > 0) {
      return await db.select()
        .from(customers)
        .where(and(inArray(customers.id, customIds), eq(customers.userId, userId)));
    }

    // High points customers (500+ points)
    if (segment === "high_points") {
      return await db.select()
        .from(customers)
        .where(and(gte(customers.loyaltyPoints, 500), eq(customers.userId, userId)))
        .orderBy(desc(customers.loyaltyPoints));
    }

    // Recent buyers (purchased in last 30 days)
    if (segment === "recent_buyers") {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentCustomerIds = await db.selectDistinct({ customerId: sales.customerId })
        .from(sales)
        .where(
          and(
            eq(sales.userId, userId),
            gte(sales.createdAt, thirtyDaysAgo),
            sql`${sales.customerId} IS NOT NULL`
          )
        );

      const ids = recentCustomerIds
        .map(r => r.customerId)
        .filter(id => id !== null) as string[];

      if (ids.length === 0) return [];

      return await db.select()
        .from(customers)
        .where(and(inArray(customers.id, ids), eq(customers.userId, userId)));
    }

    // Default: all customers
    return await db.select()
      .from(customers)
      .where(eq(customers.userId, userId))
      .orderBy(desc(customers.createdAt));
  }

  async sendBroadcast(userId: string, campaignId: string): Promise<void> {
    // Get campaign details
    const campaign = await this.getBroadcastCampaignById(userId, campaignId);
    if (!campaign) throw new Error("Campaign not found");

    // Get target customers
    const targetCustomers = await this.getCustomerSegment(
      userId,
      campaign.targetSegment,
      campaign.targetCustomerIds
    );

    if (targetCustomers.length === 0) {
      throw new Error("No customers in target segment");
    }

    // Update campaign status to sending
    await db.update(broadcastCampaigns)
      .set({ 
        status: "sending",
        totalRecipients: targetCustomers.length,
        updatedAt: new Date()
      })
      .where(eq(broadcastCampaigns.id, campaignId));

    // Create broadcast message records (actual sending will be handled by external service)
    const messages = targetCustomers.map(customer => ({
      campaignId,
      customerId: customer.id,
      channel: campaign.channel,
      recipient: campaign.channel === "email" 
        ? customer.email || ""
        : customer.phone,
      status: "pending",
    }));

    if (messages.length > 0) {
      await db.insert(broadcastMessages).values(messages);
    }

    // Note: Actual sending via Twilio/Resend will be done in routes.ts
  }

  async getBroadcastMessages(campaignId: string): Promise<any[]> {
    return await db.select()
      .from(broadcastMessages)
      .where(eq(broadcastMessages.campaignId, campaignId))
      .orderBy(desc(broadcastMessages.createdAt));
  }

  // ========================================
  // VOUCHER SYSTEM METHODS
  // ========================================

  async createVoucher(userId: string, voucher: any): Promise<any> {
    const [newVoucher] = await db.insert(customerVouchers).values({ ...voucher, userId }).returning();
    return newVoucher;
  }

  async getVouchers(userId: string): Promise<any[]> {
    return await db.select()
      .from(customerVouchers)
      .where(eq(customerVouchers.userId, userId))
      .orderBy(desc(customerVouchers.createdAt));
  }

  async getVoucherById(userId: string, id: string): Promise<any | undefined> {
    const [voucher] = await db.select()
      .from(customerVouchers)
      .where(and(eq(customerVouchers.id, id), eq(customerVouchers.userId, userId)));
    return voucher || undefined;
  }

  async getVoucherByCode(userId: string, code: string): Promise<any | undefined> {
    const [voucher] = await db.select()
      .from(customerVouchers)
      .where(and(eq(customerVouchers.code, code.toUpperCase()), eq(customerVouchers.userId, userId)));
    return voucher || undefined;
  }

  async updateVoucher(userId: string, id: string, voucher: any): Promise<any> {
    const [updated] = await db.update(customerVouchers)
      .set({ ...voucher, updatedAt: new Date() })
      .where(and(eq(customerVouchers.id, id), eq(customerVouchers.userId, userId)))
      .returning();
    return updated;
  }

  async deleteVoucher(userId: string, id: string): Promise<void> {
    await db.update(customerVouchers)
      .set({ isActive: 0, updatedAt: new Date() })
      .where(and(eq(customerVouchers.id, id), eq(customerVouchers.userId, userId)));
  }

  async validateVoucher(
    userId: string,
    code: string, 
    customerId: string | null, 
    totalAmount: number
  ): Promise<{ valid: boolean; voucher?: any; discount?: number; error?: string }> {
    // Find voucher
    const voucher = await this.getVoucherByCode(userId, code);
    
    if (!voucher) {
      return { valid: false, error: "Kod voucher tidak sah" };
    }

    // Check if active
    if (!voucher.isActive) {
      return { valid: false, error: "Voucher tidak aktif" };
    }

    // Check validity dates
    const now = new Date();
    if (voucher.validFrom && new Date(voucher.validFrom) > now) {
      return { valid: false, error: "Voucher belum bermula" };
    }
    if (voucher.validUntil && new Date(voucher.validUntil) < now) {
      return { valid: false, error: "Voucher telah tamat tempoh" };
    }

    // Check minimum purchase
    if (totalAmount < parseFloat(voucher.minPurchase)) {
      return { 
        valid: false, 
        error: `Pembelian minimum RM${voucher.minPurchase} diperlukan` 
      };
    }

    // Check total usage limit
    if (voucher.maxTotalUsage && voucher.currentUsage >= voucher.maxTotalUsage) {
      return { valid: false, error: "Voucher telah habis digunakan" };
    }

    // Check customer usage limit (if customerId provided)
    if (customerId) {
      const customerUsageCount = await this.getCustomerVoucherUsage(userId, customerId, voucher.id);
      if (customerUsageCount >= voucher.maxUsagePerCustomer) {
        return { 
          valid: false, 
          error: "Anda telah mencapai had penggunaan voucher ini" 
        };
      }
    }

    // Calculate discount
    let discount = 0;
    if (voucher.voucherType === "percentage") {
      discount = totalAmount * (parseFloat(voucher.discountValue) / 100);
      // Apply max discount cap if set
      if (voucher.maxDiscount) {
        discount = Math.min(discount, parseFloat(voucher.maxDiscount));
      }
    } else {
      discount = parseFloat(voucher.discountValue);
    }

    // Ensure discount doesn't exceed total
    discount = Math.min(discount, totalAmount);

    return { 
      valid: true, 
      voucher, 
      discount: parseFloat(discount.toFixed(2))
    };
  }

  async redeemVoucher(
    userId: string,
    voucherId: string, 
    customerId: string | null,
    saleId: string | null,
    originalAmount: number,
    finalAmount: number, 
    discountApplied: number
  ): Promise<void> {
    // Record usage
    await db.insert(voucherUsage).values({
      voucherId,
      customerId,
      saleId,
      originalAmount: originalAmount.toString(),
      finalAmount: finalAmount.toString(),
      discountApplied: discountApplied.toString(),
      userId,
    });

    // Increment usage count
    await db.update(customerVouchers)
      .set({ 
        currentUsage: sql`${customerVouchers.currentUsage} + 1`,
        updatedAt: new Date()
      })
      .where(and(eq(customerVouchers.id, voucherId), eq(customerVouchers.userId, userId)));
  }

  async getVoucherUsageHistory(userId: string, voucherId: string): Promise<any[]> {
    const usage = await db.select({
      id: voucherUsage.id,
      customerId: voucherUsage.customerId,
      customerName: customers.name,
      customerPhone: customers.phone,
      saleId: voucherUsage.saleId,
      discountApplied: voucherUsage.discountApplied,
      originalAmount: voucherUsage.originalAmount,
      finalAmount: voucherUsage.finalAmount,
      usedAt: voucherUsage.usedAt,
    })
    .from(voucherUsage)
    .leftJoin(customers, and(eq(voucherUsage.customerId, customers.id), eq(customers.userId, userId)))
    .where(and(eq(voucherUsage.voucherId, voucherId), eq(voucherUsage.userId, userId)))
    .orderBy(desc(voucherUsage.usedAt));

    return usage;
  }

  async getCustomerVoucherUsage(userId: string, customerId: string, voucherId: string): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(voucherUsage)
      .where(
        and(
          eq(voucherUsage.customerId, customerId),
          eq(voucherUsage.voucherId, voucherId),
          eq(voucherUsage.userId, userId)
        )
      );
    
    return result[0]?.count || 0;
  }

  // ========================================
  // BOOKING SYSTEM METHODS
  // ========================================

  async generateBookingNumber(userId: string): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    
    // Get count of bookings today for this user
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(bookings)
      .where(and(gte(bookings.createdAt, today), eq(bookings.userId, userId)));
    
    const count = (result[0]?.count || 0) + 1;
    return `BK-${year}-${String(count).padStart(4, '0')}`;
  }

  async createBooking(userId: string, booking: any, items: any[]): Promise<any> {
    // Generate booking number
    const bookingNumber = await this.generateBookingNumber(userId);
    
    // Create booking
    const [newBooking] = await db.insert(bookings)
      .values({ ...booking, bookingNumber, userId })
      .returning();

    // Create booking items
    if (items.length > 0) {
      await db.insert(bookingItems).values(
        items.map(item => ({
          ...item,
          bookingId: newBooking.id,
          userId,
        }))
      );
    }

    // Return booking with items
    const bookingWithItems = {
      ...newBooking,
      items: await this.getBookingItems(userId, newBooking.id),
    };

    return bookingWithItems;
  }

  async getBookings(userId: string, limit: number = 50, status?: string): Promise<any[]> {
    let query = db.select()
      .from(bookings)
      .where(eq(bookings.userId, userId))
      .orderBy(desc(bookings.createdAt))
      .limit(limit);

    if (status) {
      query = query.where(and(eq(bookings.status, status as any), eq(bookings.userId, userId)));
    }

    const allBookings = await query;

    // Get items for each booking
    const bookingsWithItems = await Promise.all(
      allBookings.map(async (booking) => ({
        ...booking,
        items: await this.getBookingItems(userId, booking.id),
      }))
    );

    return bookingsWithItems;
  }

  async getBookingById(userId: string, id: string): Promise<any | undefined> {
    const [booking] = await db.select()
      .from(bookings)
      .where(and(eq(bookings.id, id), eq(bookings.userId, userId)));
    
    if (!booking) return undefined;

    const items = await this.getBookingItems(userId, id);
    return { ...booking, items };
  }

  async updateBooking(userId: string, id: string, booking: any): Promise<any> {
    const [updated] = await db.update(bookings)
      .set({ ...booking, updatedAt: new Date() })
      .where(and(eq(bookings.id, id), eq(bookings.userId, userId)))
      .returning();
    return updated;
  }

  async deleteBooking(userId: string, id: string): Promise<void> {
    await db.delete(bookings)
      .where(and(eq(bookings.id, id), eq(bookings.userId, userId)));
  }

  async getBookingItems(userId: string, bookingId: string): Promise<any[]> {
    return await db.select()
      .from(bookingItems)
      .where(and(eq(bookingItems.bookingId, bookingId), eq(bookingItems.userId, userId)))
      .orderBy(bookingItems.createdAt);
  }

  async getUpcomingBookings(userId: string, daysAhead: number = 7): Promise<any[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + daysAhead);

    return await db.select()
      .from(bookings)
      .where(
        and(
          gte(bookings.deliveryDate, today.toISOString().split('T')[0]),
          lte(bookings.deliveryDate, futureDate.toISOString().split('T')[0]),
          sql`${bookings.status} != 'completed' AND ${bookings.status} != 'cancelled'`,
          eq(bookings.userId, userId)
        )
      )
      .orderBy(bookings.deliveryDate, bookings.deliveryTime);
  }

  async markReminderSent(userId: string, bookingId: string): Promise<void> {
    await db.update(bookings)
      .set({ 
        reminderSent: 1, 
        reminderSentAt: new Date(),
        updatedAt: new Date()
      })
      .where(and(eq(bookings.id, bookingId), eq(bookings.userId, userId)));
  }

  // ========================================
  // VENDOR SALES TRACKING
  // ========================================
  
  async createVendorSale(userId: string, sale: any): Promise<any> {
    const [result] = await db.insert(vendorSales).values({
      userId,
      vendorId: sale.vendorId,
      vendorName: sale.vendorName,
      deliveryId: sale.deliveryId || null,
      productId: sale.productId,
      productName: sale.productName,
      quantitySold: sale.quantitySold,
      saleDate: sale.saleDate,
      notes: sale.notes || null,
    }).returning();
    
    // Update stock balance
    await this.updateStockBalance(sale.vendorId, sale.productId, { sold: sale.quantitySold });
    
    return result;
  }
  
  async getVendorSales(userId: string, vendorId?: string, filters?: any): Promise<any[]> {
    const conditions = [eq(vendorSales.userId, userId)];
    
    if (vendorId) {
      conditions.push(eq(vendorSales.vendorId, vendorId));
    }
    
    if (filters?.startDate) {
      conditions.push(gte(vendorSales.saleDate, filters.startDate));
    }
    
    if (filters?.endDate) {
      conditions.push(lte(vendorSales.saleDate, filters.endDate));
    }
    
    if (filters?.productId) {
      conditions.push(eq(vendorSales.productId, filters.productId));
    }
    
    return await db.select()
      .from(vendorSales)
      .where(and(...conditions))
      .orderBy(desc(vendorSales.saleDate), desc(vendorSales.createdAt));
  }
  
  async getVendorSaleById(userId: string, id: string): Promise<any | undefined> {
    const [result] = await db.select()
      .from(vendorSales)
      .where(and(eq(vendorSales.id, id), eq(vendorSales.userId, userId)));
    
    return result;
  }
  
  async updateVendorSale(userId: string, id: string, sale: any): Promise<any> {
    // Get original sale to calculate stock difference
    const original = await this.getVendorSaleById(userId, id);
    if (!original) {
      throw new Error("Vendor sale not found");
    }
    
    const [updated] = await db.update(vendorSales)
      .set({
        quantitySold: sale.quantitySold,
        saleDate: sale.saleDate,
        notes: sale.notes,
      })
      .where(and(eq(vendorSales.id, id), eq(vendorSales.userId, userId)))
      .returning();
    
    // Update stock balance if quantity changed
    if (sale.quantitySold && sale.quantitySold !== original.quantitySold) {
      const difference = sale.quantitySold - original.quantitySold;
      await this.updateStockBalance(original.vendorId, original.productId, { sold: difference });
    }
    
    return updated;
  }
  
  async deleteVendorSale(userId: string, id: string): Promise<void> {
    const sale = await this.getVendorSaleById(userId, id);
    if (!sale) {
      throw new Error("Vendor sale not found");
    }
    
    // Reverse stock balance
    await this.updateStockBalance(sale.vendorId, sale.productId, { sold: -sale.quantitySold });
    
    await db.delete(vendorSales)
      .where(and(eq(vendorSales.id, id), eq(vendorSales.userId, userId)));
  }

  // ========================================
  // VENDOR STOCK BALANCE
  // ========================================
  
  async getVendorStockBalance(vendorId: string, userId: string): Promise<any[]> {
    return await db.select()
      .from(vendorStockBalance)
      .where(eq(vendorStockBalance.vendorId, vendorId))
      .orderBy(desc(vendorStockBalance.updatedAt));
  }
  
  async getStockBalanceByProduct(vendorId: string, productId: string, tx?: any): Promise<any | undefined> {
    const executor = tx || db;
    const [result] = await executor.select()
      .from(vendorStockBalance)
      .where(
        and(
          eq(vendorStockBalance.vendorId, vendorId),
          eq(vendorStockBalance.productId, productId)
        )
      );
    
    return result;
  }
  
  async updateStockBalance(
    vendorId: string, 
    productId: string, 
    change: { delivered?: number; sold?: number; returned?: number },
    tx?: any
  ): Promise<void> {
    const executor = tx || db;
    const existing = await this.getStockBalanceByProduct(vendorId, productId, executor);
    
    if (existing) {
      // Update existing record
      const newStock = existing.currentStock + 
        (change.delivered || 0) - 
        (change.sold || 0) - 
        (change.returned || 0);
      
      await executor.update(vendorStockBalance)
        .set({
          currentStock: newStock,
          lastDeliveryDate: change.delivered ? new Date().toISOString().split('T')[0] : existing.lastDeliveryDate,
          lastSaleDate: change.sold ? new Date().toISOString().split('T')[0] : existing.lastSaleDate,
          updatedAt: new Date(),
        })
        .where(eq(vendorStockBalance.id, existing.id));
    } else {
      // Create new record
      const newStock = (change.delivered || 0) - (change.sold || 0) - (change.returned || 0);
      
      await executor.insert(vendorStockBalance).values({
        vendorId,
        productId,
        currentStock: newStock,
        lastDeliveryDate: change.delivered ? new Date().toISOString().split('T')[0] : null,
        lastSaleDate: change.sold ? new Date().toISOString().split('T')[0] : null,
      });
    }
  }

  // ========================================
  // VENDOR CLAIMS
  // ========================================
  
  async generateClaimNumber(userId: string): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
    
    const count = await db.select()
      .from(vendorClaims)
      .where(and(
        eq(vendorClaims.userId, userId),
        sql`DATE(${vendorClaims.createdAt}) = CURRENT_DATE`
      ));
    
    return `CLM-${dateStr}-${String(count.length + 1).padStart(4, '0')}`;
  }
  
  async createVendorClaim(userId: string, claimData: any, items: any[], photos: string[]): Promise<any> {
    return await db.transaction(async (tx) => {
      // Generate claim number
      const claimNumber = await this.generateClaimNumber(userId);
      
      // Calculate total amount
      const totalAmount = items.reduce((sum, item) => 
        sum + (parseFloat(item.unitPrice) * parseInt(item.quantityClaimed)), 0
      );
      
      // Create claim
      const [claim] = await tx.insert(vendorClaims).values({
        userId,
        vendorId: claimData.vendorId,
        vendorName: claimData.vendorName,
        deliveryId: claimData.deliveryId || null,
        claimNumber,
        claimDate: claimData.claimDate || new Date().toISOString().split('T')[0],
        status: 'pending',
        totalClaimAmount: totalAmount.toFixed(2),
        approvedAmount: '0',
      }).returning();
      
      // Create claim items
      if (items.length > 0) {
        await tx.insert(claimItems).values(
          items.map((item: any) => ({
            claimId: claim.id,
            productId: item.productId,
            productName: item.productName,
            quantityClaimed: item.quantityClaimed,
            unitPrice: item.unitPrice,
            totalAmount: (parseFloat(item.unitPrice) * parseInt(item.quantityClaimed)).toFixed(2),
            claimReason: item.claimReason,
            approvedQty: 0,
          }))
        );
      }
      
      // Create claim photos
      if (photos.length > 0) {
        await tx.insert(claimPhotos).values(
          photos.map((photoUrl: string) => ({
            claimId: claim.id,
            photoUrl,
          }))
        );
      }
      
      return claim;
    });
  }
  
  async getVendorClaims(userId: string, filters?: any): Promise<any[]> {
    const conditions = [eq(vendorClaims.userId, userId)];
    
    if (filters?.vendorId) {
      conditions.push(eq(vendorClaims.vendorId, filters.vendorId));
    }
    
    if (filters?.status) {
      conditions.push(eq(vendorClaims.status, filters.status));
    }
    
    if (filters?.startDate) {
      conditions.push(gte(vendorClaims.claimDate, filters.startDate));
    }
    
    if (filters?.endDate) {
      conditions.push(lte(vendorClaims.claimDate, filters.endDate));
    }
    
    return await db.select()
      .from(vendorClaims)
      .where(and(...conditions))
      .orderBy(desc(vendorClaims.createdAt));
  }
  
  async getVendorClaimById(userId: string, id: string): Promise<any | undefined> {
    const [claim] = await db.select()
      .from(vendorClaims)
      .where(and(eq(vendorClaims.id, id), eq(vendorClaims.userId, userId)));
    
    if (!claim) return undefined;
    
    // Get claim items
    const items = await this.getClaimItems(id);
    
    // Get claim photos
    const photos = await this.getClaimPhotos(id);
    
    return { ...claim, items, photos };
  }
  
  async getClaimItems(claimId: string): Promise<any[]> {
    return await db.select()
      .from(claimItems)
      .where(eq(claimItems.claimId, claimId));
  }
  
  async getClaimPhotos(claimId: string): Promise<any[]> {
    return await db.select()
      .from(claimPhotos)
      .where(eq(claimPhotos.claimId, claimId))
      .orderBy(claimPhotos.uploadedAt);
  }
  
  async approveVendorClaim(userId: string, claimId: string, reviewNotes?: string): Promise<any> {
    return await db.transaction(async (tx) => {
      // Get claim details
      const [claim] = await tx.select()
        .from(vendorClaims)
        .where(and(eq(vendorClaims.id, claimId), eq(vendorClaims.userId, userId)));
      
      if (!claim) {
        throw new Error("Claim not found");
      }
      
      if (claim.status !== 'pending') {
        throw new Error("Claim already processed");
      }
      
      // Get claim items
      const items = await tx.select()
        .from(claimItems)
        .where(eq(claimItems.claimId, claimId));
      
      // Update claim status
      const [updated] = await tx.update(vendorClaims)
        .set({
          status: 'approved',
          approvedAmount: claim.totalClaimAmount,
          reviewNotes: reviewNotes || null,
          reviewedAt: new Date(),
          reviewedBy: userId,
        })
        .where(eq(vendorClaims.id, claimId))
        .returning();
      
      // Update claim items approved quantity
      for (const item of items) {
        await tx.update(claimItems)
          .set({ approvedQty: item.quantityClaimed })
          .where(eq(claimItems.id, item.id));
        
        // Update stock balance - reduce by returned quantity
        await this.updateStockBalance(claim.vendorId, item.productId, { 
          returned: item.quantityClaimed 
        }, tx);
      }
      
      // ========================================
      // AUTO-ADJUST INVOICE IF DELIVERY LINKED
      // ========================================
      if (claim.deliveryId) {
        // Get delivery details
        const [delivery] = await tx.select()
          .from(deliveries)
          .where(eq(deliveries.id, claim.deliveryId));
        
        if (delivery) {
          // Calculate adjustment amount from approved claim
          const adjustmentAmount = parseFloat(claim.totalClaimAmount);
          
          // Calculate new total (subtract returned items)
          const currentTotal = parseFloat(delivery.totalAmount);
          const newTotal = Math.max(0, currentTotal - adjustmentAmount); // Don't go negative
          
          // Update delivery total amount
          await tx.update(deliveries)
            .set({
              totalAmount: newTotal.toFixed(2),
            })
            .where(eq(deliveries.id, claim.deliveryId));
          
          console.log(`✅ Auto-adjusted invoice ${delivery.invoiceNumber}: RM ${currentTotal.toFixed(2)} → RM ${newTotal.toFixed(2)} (Claim: -RM ${adjustmentAmount.toFixed(2)})`);
        }
      }
      
      return updated;
    });
  }
  
  async rejectVendorClaim(userId: string, claimId: string, reviewNotes: string): Promise<any> {
    const [claim] = await db.select()
      .from(vendorClaims)
      .where(and(eq(vendorClaims.id, claimId), eq(vendorClaims.userId, userId)));
    
    if (!claim) {
      throw new Error("Claim not found");
    }
    
    if (claim.status !== 'pending') {
      throw new Error("Claim already processed");
    }
    
    const [updated] = await db.update(vendorClaims)
      .set({
        status: 'rejected',
        approvedAmount: '0',
        reviewNotes,
        reviewedAt: new Date(),
        reviewedBy: userId,
      })
      .where(eq(vendorClaims.id, claimId))
      .returning();
    
    return updated;
  }
  
  // ===================================================================
  // ONLINE STORE CATALOG
  // ===================================================================
  
  async getStoreSettings(userId: string): Promise<StoreSettings | undefined> {
    const [settings] = await db.select()
      .from(storeSettings)
      .where(eq(storeSettings.userId, userId));
    
    return settings;
  }
  
  async getStoreSettingsBySlug(slug: string): Promise<StoreSettings | undefined> {
    const [settings] = await db.select()
      .from(storeSettings)
      .where(and(
        eq(storeSettings.slug, slug),
        eq(storeSettings.isActive, 1)
      ));
    
    return settings;
  }
  
  async createStoreSettings(userId: string, data: InsertStoreSettings): Promise<StoreSettings> {
    // Check if user already has store settings
    const existing = await this.getStoreSettings(userId);
    if (existing) {
      throw new Error("Store settings already exist for this user");
    }
    
    // Check if slug is already taken
    const slugExists = await db.select()
      .from(storeSettings)
      .where(eq(storeSettings.slug, data.slug))
      .limit(1);
    
    if (slugExists.length > 0) {
      throw new Error("This store URL is already taken. Please choose a different one.");
    }
    
    const [settings] = await db.insert(storeSettings)
      .values({
        ...data,
        userId,
      })
      .returning();
    
    return settings;
  }
  
  async updateStoreSettings(userId: string, data: Partial<InsertStoreSettings>): Promise<StoreSettings> {
    const existing = await this.getStoreSettings(userId);
    if (!existing) {
      throw new Error("Store settings not found");
    }
    
    // If updating slug, check if it's available
    if (data.slug && data.slug !== existing.slug) {
      const slugExists = await db.select()
        .from(storeSettings)
        .where(eq(storeSettings.slug, data.slug))
        .limit(1);
      
      if (slugExists.length > 0) {
        throw new Error("This store URL is already taken. Please choose a different one.");
      }
    }
    
    const [updated] = await db.update(storeSettings)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(storeSettings.userId, userId))
      .returning();
    
    return updated;
  }
  
  async deleteStoreSettings(userId: string): Promise<void> {
    await db.delete(storeSettings)
      .where(eq(storeSettings.userId, userId));
  }
  
  async trackStoreAnalytics(
    storeId: string, 
    eventType: string, 
    data?: { 
      productId?: string; 
      visitorId?: string; 
      referrer?: string; 
      userAgent?: string;
    }
  ): Promise<void> {
    await db.insert(storeAnalytics).values({
      storeId,
      eventType,
      productId: data?.productId || null,
      visitorId: data?.visitorId || null,
      referrer: data?.referrer || null,
      userAgent: data?.userAgent || null,
    });
  }

  // ====== PAYMENT CLAIMS ======
  async generatePaymentClaimNumber(userId: string): Promise<string> {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const dateStr = `${year}${month}${day}`;
    const prefix = `CLM-PAY-${dateStr}`;
    
    // Get latest claim number for today
    const latestClaim = await db.select()
      .from(paymentClaims)
      .where(and(
        eq(paymentClaims.userId, userId),
        like(paymentClaims.claimNumber, `${prefix}%`)
      ))
      .orderBy(desc(paymentClaims.claimNumber))
      .limit(1);
    
    if (latestClaim.length === 0) {
      return `${prefix}-0001`;
    }
    
    const lastNumber = parseInt(latestClaim[0].claimNumber!.split('-').pop() || '0');
    const nextNumber = (lastNumber + 1).toString().padStart(4, '0');
    return `${prefix}-${nextNumber}`;
  }

  async createPaymentClaim(userId: string, claimData: any, items: any[], deliveryIds: string[]): Promise<any> {
    return await db.transaction(async (tx) => {
      // Generate claim number
      const claimNumber = await this.generatePaymentClaimNumber(userId);
      
      // Calculate totals from items
      const totalGross = items.reduce((sum, item) => sum + parseFloat(item.grossAmount || '0'), 0);
      const totalCommission = items.reduce((sum, item) => sum + parseFloat(item.commissionAmount || '0'), 0);
      const totalClaimable = items.reduce((sum, item) => sum + parseFloat(item.claimableAmount || '0'), 0);
      
      // Create claim
      const [claim] = await tx.insert(paymentClaims).values({
        userId,
        vendorId: claimData.vendorId,
        vendorName: claimData.vendorName,
        claimNumber,
        claimDate: claimData.claimDate || new Date().toISOString().split('T')[0],
        status: claimData.status || 'draft',
        totalGross: totalGross.toFixed(2),
        totalCommission: totalCommission.toFixed(2),
        totalClaimable: totalClaimable.toFixed(2),
        notes: claimData.notes || null,
      }).returning();
      
      // Create claim items
      if (items.length > 0) {
        await tx.insert(paymentClaimItems).values(
          items.map((item: any) => ({
            claimId: claim.id,
            deliveryItemId: item.deliveryItemId || null,
            productId: item.productId,
            productName: item.productName,
            unit: item.unit || item.productUnit || 'pcs',
            quantityDelivered: item.quantity || item.quantityDelivered || 0,
            quantitySold: item.quantitySold || 0,
            quantityExpired: item.quantityExpired || 0,
            quantityReturned: item.quantityReturned || 0,
            unitPrice: item.unitPrice || '0',
            commissionRate: item.commissionRate || 0,
            commissionAmount: item.commissionAmount || '0',
            grossAmount: item.grossAmount || '0',
            claimableAmount: item.claimableAmount || '0',
          }))
        );
      }
      
      // Link deliveries
      if (deliveryIds.length > 0) {
        await tx.insert(paymentClaimDeliveries).values(
          deliveryIds.map((deliveryId: string) => ({
            claimId: claim.id,
            deliveryId,
          }))
        );
      }
      
      return claim;
    });
  }

  async getPaymentClaims(userId: string, filters?: any): Promise<any[]> {
    const conditions = [eq(paymentClaims.userId, userId)];
    
    if (filters?.vendorId) {
      conditions.push(eq(paymentClaims.vendorId, filters.vendorId));
    }
    
    if (filters?.status) {
      conditions.push(eq(paymentClaims.status, filters.status));
    }
    
    if (filters?.startDate) {
      conditions.push(gte(paymentClaims.claimDate, filters.startDate));
    }
    
    if (filters?.endDate) {
      conditions.push(lte(paymentClaims.claimDate, filters.endDate));
    }
    
    return await db.select()
      .from(paymentClaims)
      .where(and(...conditions))
      .orderBy(desc(paymentClaims.createdAt));
  }

  async getPaymentClaimById(userId: string, id: string): Promise<any | undefined> {
    const [claim] = await db.select()
      .from(paymentClaims)
      .where(and(eq(paymentClaims.id, id), eq(paymentClaims.userId, userId)));
    
    if (!claim) return undefined;
    
    // Get claim items
    const items = await db.select()
      .from(paymentClaimItems)
      .where(eq(paymentClaimItems.claimId, id));
    
    // Get linked delivery IDs
    const deliveryLinks = await db.select()
      .from(paymentClaimDeliveries)
      .where(eq(paymentClaimDeliveries.claimId, id));
    
    const deliveryIds = deliveryLinks.map(link => link.deliveryId);
    
    return { ...claim, items, deliveryIds };
  }

  async updatePaymentClaim(userId: string, claimId: string, data: any): Promise<any> {
    const [updated] = await db.update(paymentClaims)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(and(eq(paymentClaims.id, claimId), eq(paymentClaims.userId, userId)))
      .returning();
    
    return updated;
  }

  async deletePaymentClaim(userId: string, claimId: string): Promise<void> {
    // Only allow deleting draft claims
    const claim = await this.getPaymentClaimById(userId, claimId);
    if (!claim) {
      throw new Error("Claim not found");
    }
    if (claim.status !== 'draft') {
      throw new Error("Only draft claims can be deleted");
    }
    
    await db.delete(paymentClaims)
      .where(and(eq(paymentClaims.id, claimId), eq(paymentClaims.userId, userId)));
  }

  async markPaymentClaimAsPaid(userId: string, claimId: string): Promise<any> {
    const [updated] = await db.update(paymentClaims)
      .set({
        status: 'paid',
        updatedAt: new Date(),
      })
      .where(and(eq(paymentClaims.id, claimId), eq(paymentClaims.userId, userId)))
      .returning();
    
    return updated;
  }

  // ===========================
  // NOTIFICATIONS METHODS
  // ===========================

  async getUserNotifications(userId: string, limit: number = 50): Promise<any[]> {
    return db.select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.read, 0)
      ));
    
    return Number(result[0]?.count || 0);
  }

  async createNotification(data: {
    userId: string;
    type: string;
    priority?: string;
    title: string;
    message: string;
    actionUrl?: string;
    metadata?: any;
  }): Promise<any> {
    const [notification] = await db.insert(notifications)
      .values({
        userId: data.userId,
        type: data.type as any,
        priority: (data.priority as any) || 'medium',
        title: data.title,
        message: data.message,
        actionUrl: data.actionUrl,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
        read: 0,
      })
      .returning();
    
    return notification;
  }

  async markNotificationAsRead(userId: string, notificationId: string): Promise<any> {
    const [updated] = await db.update(notifications)
      .set({
        read: 1,
        readAt: new Date(),
      })
      .where(and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, userId)
      ))
      .returning();
    
    return updated;
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await db.update(notifications)
      .set({
        read: 1,
        readAt: new Date(),
      })
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.read, 0)
      ));
  }

  async deleteNotification(userId: string, notificationId: string): Promise<void> {
    await db.delete(notifications)
      .where(and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, userId)
      ));
  }
}

export const storage = new DatabaseStorage();

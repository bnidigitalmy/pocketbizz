// Database integration from blueprint:javascript_database
import { 
  products, 
  ingredients,
  productionBatches,
  vendors,
  deliveries,
  deliveryItems,
  sales,
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
  
  // Vendors
  getVendors(): Promise<Vendor[]>;
  getVendor(id: string): Promise<Vendor | undefined>;
  createVendor(vendor: InsertVendor): Promise<Vendor>;
  
  // Deliveries
  getDeliveries(): Promise<any[]>;
  getDelivery(id: string): Promise<any>;
  createDelivery(delivery: InsertDelivery, items: InsertDeliveryItem[]): Promise<Delivery>;
  updateDeliveryStatus(id: string, status: string): Promise<void>;
  updateDeliveryPaymentStatus(id: string, paymentStatus: string): Promise<any>;
  updateDeliveryItemRejection(itemId: string, rejectedQty: number, rejectionReason: string | null): Promise<void>;
  
  // Sales
  getSales(): Promise<Sale[]>;
  createSale(sale: InsertSale): Promise<Sale>;
  markSalePaid(id: string): Promise<void>;
  
  // Expenses
  getExpenses(): Promise<Expense[]>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  
  // Reports
  getDashboardStats(): Promise<any>;
  getProfitLossReport(): Promise<any>;
  getTopProducts(): Promise<any[]>;
  getTopVendors(): Promise<any[]>;
  getMonthlyData(): Promise<any[]>;
  
  // Claims
  getClaimsSummary(): Promise<any[]>;
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
  async getDeliveries(): Promise<any[]> {
    const result = await db.select().from(deliveries).orderBy(desc(deliveries.deliveryDate));
    
    // Get items for each delivery with commission breakdown
    const deliveriesWithItems = await Promise.all(
      result.map(async (delivery) => {
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
    
    return deliveriesWithItems;
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

  // Sales
  async getSales(): Promise<Sale[]> {
    return await db.select().from(sales).orderBy(desc(sales.saleDate));
  }

  async createSale(sale: InsertSale): Promise<Sale> {
    const [newSale] = await db.insert(sales).values(sale).returning();
    return newSale;
  }

  async markSalePaid(id: string): Promise<void> {
    await db.update(sales).set({ isPaid: 1 }).where(eq(sales.id, id));
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

    // Today's sales (quantity)
    const todaySalesQty = await db.select({
      total: sql<number>`COALESCE(SUM(${sales.quantity}), 0)`,
    })
      .from(sales)
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

  async getTopProducts(): Promise<any[]> {
    const topProducts = await db.select({
      id: products.id,
      name: products.name,
      totalSold: sql<number>`COALESCE(SUM(${sales.quantity}), 0)`,
      totalRevenue: sql<string>`COALESCE(SUM(${sales.totalAmount}), 0)`,
      totalCost: sql<string>`COALESCE(SUM(${sales.quantity} * ${products.costPerUnit}), 0)`,
    })
      .from(products)
      .leftJoin(sales, eq(products.id, sales.productId))
      .groupBy(products.id, products.name)
      .orderBy(sql`COALESCE(SUM(${sales.totalAmount}), 0) DESC`)
      .limit(5);

    return topProducts.map(p => ({
      ...p,
      totalProfit: (parseFloat(p.totalRevenue) - parseFloat(p.totalCost)).toFixed(2),
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
  async getClaimsSummary(): Promise<any[]> {
    // Get all unique vendors from deliveries
    const uniqueVendors = await db.selectDistinct({
      vendorId: deliveries.vendorId,
      vendorName: deliveries.vendorName,
    })
      .from(deliveries);

    // Calculate detailed claims for each vendor
    const claimsSummary = await Promise.all(
      uniqueVendors.map(async (vendor) => {
        const details = await this.getClaimDetailsByVendor(vendor.vendorId);
        return {
          vendorId: vendor.vendorId,
          vendorName: vendor.vendorName,
          totalDeliveries: details.totalDeliveries,
          totalAmount: details.claimableAmount, // Use claimable amount (after commission & rejections)
          pendingAmount: details.pendingAmount,
          settledAmount: details.settledAmount,
          partialAmount: details.partialAmount,
        };
      })
    );

    // Sort by total amount descending
    return claimsSummary.sort((a, b) => parseFloat(b.totalAmount) - parseFloat(a.totalAmount));
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
}

export const storage = new DatabaseStorage();

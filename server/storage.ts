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
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";

export interface IStorage {
  // Products
  getProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct, ingredientsList: InsertIngredient[]): Promise<Product>;
  
  // Ingredients
  getIngredients(productId: string): Promise<Ingredient[]>;
  
  // Production
  getProductionBatches(): Promise<ProductionBatch[]>;
  createProductionBatch(batch: InsertProductionBatch): Promise<ProductionBatch>;
  
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

  async createProduct(product: InsertProduct, ingredientsList: InsertIngredient[]): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    
    // Insert ingredients
    if (ingredientsList.length > 0) {
      const ingredientsWithProductId = ingredientsList.map(ing => ({
        ...ing,
        productId: newProduct.id,
      }));
      await db.insert(ingredients).values(ingredientsWithProductId);
    }
    
    return newProduct;
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
    
    // Get items for each delivery
    const deliveriesWithItems = await Promise.all(
      result.map(async (delivery) => {
        const items = await db.select().from(deliveryItems).where(eq(deliveryItems.deliveryId, delivery.id));
        return { ...delivery, items };
      })
    );
    
    return deliveriesWithItems;
  }

  async getDelivery(id: string): Promise<any> {
    const [delivery] = await db.select().from(deliveries).where(eq(deliveries.id, id));
    if (!delivery) return undefined;
    
    const items = await db.select().from(deliveryItems).where(eq(deliveryItems.deliveryId, id));
    return { ...delivery, items };
  }

  async createDelivery(delivery: InsertDelivery, items: InsertDeliveryItem[]): Promise<Delivery> {
    const [newDelivery] = await db.insert(deliveries).values(delivery).returning();
    
    if (items.length > 0) {
      const itemsWithDeliveryId = items.map(item => ({
        ...item,
        deliveryId: newDelivery.id,
      }));
      await db.insert(deliveryItems).values(itemsWithDeliveryId);
    }
    
    return newDelivery;
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

    // Today's sales
    const todaySales = await db.select({
      total: sql<string>`COALESCE(SUM(${sales.totalAmount}), 0)`,
    })
      .from(sales)
      .where(eq(sales.saleDate, today));

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

    return {
      todayProduction: todayProduction[0]?.total || 0,
      todaySales: todaySalesValue.toFixed(2),
      weekSales: parseFloat(weekSales[0]?.total || "0").toFixed(2),
      netProfit: netProfit.toFixed(2),
      // New metrics
      todayExpenses: todayExpValue.toFixed(2),
      todayProfit: todayProfit.toFixed(2),
      todayRejectionsCount: todayRejections[0]?.count || 0,
      todayRejectionsValue: parseFloat(todayRejections[0]?.value || "0").toFixed(2),
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

  // Claims
  async getClaimsSummary(): Promise<any[]> {
    // Get all deliveries grouped by vendor with payment status summary
    const claimsSummary = await db.select({
      vendorId: deliveries.vendorId,
      vendorName: deliveries.vendorName,
      totalDeliveries: sql<number>`COUNT(${deliveries.id})`,
      totalAmount: sql<string>`COALESCE(SUM(${deliveries.totalAmount}), 0)`,
      pendingAmount: sql<string>`COALESCE(SUM(CASE WHEN ${deliveries.paymentStatus} = 'pending' THEN ${deliveries.totalAmount} ELSE 0 END), 0)`,
      settledAmount: sql<string>`COALESCE(SUM(CASE WHEN ${deliveries.paymentStatus} = 'settled' THEN ${deliveries.totalAmount} ELSE 0 END), 0)`,
      partialAmount: sql<string>`COALESCE(SUM(CASE WHEN ${deliveries.paymentStatus} = 'partial' THEN ${deliveries.totalAmount} ELSE 0 END), 0)`,
    })
      .from(deliveries)
      .groupBy(deliveries.vendorId, deliveries.vendorName)
      .orderBy(sql`COALESCE(SUM(${deliveries.totalAmount}), 0) DESC`);

    return claimsSummary;
  }

  async getClaimDetailsByVendor(vendorId: string): Promise<any> {
    // Get all deliveries for this vendor
    const vendorDeliveries = await db.select()
      .from(deliveries)
      .where(eq(deliveries.vendorId, vendorId))
      .orderBy(desc(deliveries.deliveryDate));

    // Get items for each delivery
    const deliveriesWithItems = await Promise.all(
      vendorDeliveries.map(async (delivery) => {
        const items = await db.select()
          .from(deliveryItems)
          .where(eq(deliveryItems.deliveryId, delivery.id));
        
        return {
          ...delivery,
          items,
        };
      })
    );

    // Calculate summary
    const totalAmount = vendorDeliveries.reduce((sum, d) => sum + parseFloat(d.totalAmount), 0);
    const pendingAmount = vendorDeliveries
      .filter(d => d.paymentStatus === 'pending')
      .reduce((sum, d) => sum + parseFloat(d.totalAmount), 0);
    const settledAmount = vendorDeliveries
      .filter(d => d.paymentStatus === 'settled')
      .reduce((sum, d) => sum + parseFloat(d.totalAmount), 0);
    const partialAmount = vendorDeliveries
      .filter(d => d.paymentStatus === 'partial')
      .reduce((sum, d) => sum + parseFloat(d.totalAmount), 0);

    return {
      vendorId,
      vendorName: vendorDeliveries[0]?.vendorName || '',
      totalDeliveries: vendorDeliveries.length,
      totalAmount: totalAmount.toFixed(2),
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
}

export const storage = new DatabaseStorage();

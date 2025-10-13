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

    // Today's sales
    const todaySales = await db.select({
      total: sql<string>`COALESCE(SUM(${sales.totalAmount}), 0)`,
    })
      .from(sales)
      .where(eq(sales.saleDate, today));

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

    return {
      todayProduction: todayProduction[0]?.total || 0,
      todaySales: parseFloat(todaySales[0]?.total || "0").toFixed(2),
      weekSales: parseFloat(weekSales[0]?.total || "0").toFixed(2),
      netProfit: netProfit.toFixed(2),
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
}

export const storage = new DatabaseStorage();

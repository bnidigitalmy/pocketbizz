import { sql } from "drizzle-orm";
import { 
  pgTable, 
  text, 
  varchar, 
  integer, 
  decimal, 
  timestamp, 
  date,
  pgEnum
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Unit Conversion System
// Converts between different measurement units for recipe calculations
// Factor represents: 1 [fromUnit] = factor × [toUnit]
// Example: 1 kg = 1000 gram, so kg→gram factor is 1000
export const UNIT_CONVERSIONS: Record<string, Record<string, number>> = {
  // Weight conversions
  "kg": { "kg": 1, "gram": 1000, "g": 1000 },
  "gram": { "kg": 0.001, "gram": 1, "g": 1 },
  "g": { "kg": 0.001, "gram": 1, "g": 1 },
  
  // Volume conversions
  "liter": { "liter": 1, "l": 1, "ml": 1000, "tbsp": 66.67, "tsp": 200 },
  "l": { "liter": 1, "l": 1, "ml": 1000, "tbsp": 66.67, "tsp": 200 },
  "ml": { "liter": 0.001, "l": 0.001, "ml": 1, "tbsp": 0.0667, "tsp": 0.2 },
  "tbsp": { "liter": 0.015, "l": 0.015, "ml": 15, "tbsp": 1, "tsp": 3 },
  "tsp": { "liter": 0.005, "l": 0.005, "ml": 5, "tbsp": 0.333, "tsp": 1 },
  
  // Count conversions
  "dozen": { "dozen": 1, "pcs": 12, "pieces": 12 },
  "pcs": { "dozen": 0.0833, "pcs": 1, "pieces": 1 },
  "pieces": { "dozen": 0.0833, "pcs": 1, "pieces": 1 },
};

// Helper function to convert quantity from one unit to another
export function convertUnit(quantity: number, fromUnit: string, toUnit: string): number {
  const from = fromUnit.toLowerCase().trim();
  const to = toUnit.toLowerCase().trim();
  
  // If units are the same, no conversion needed
  if (from === to) return quantity;
  
  // Check if conversion exists
  if (!UNIT_CONVERSIONS[from] || !UNIT_CONVERSIONS[from][to]) {
    // If no conversion found, return original quantity (incompatible units)
    return quantity;
  }
  
  // Convert: multiply by conversion factor
  return quantity * UNIT_CONVERSIONS[from][to];
}

// Enums
export const deliveryStatusEnum = pgEnum("delivery_status", ["delivered", "claimed", "pending", "rejected"]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "partial", "settled"]);
export const expenseCategoryEnum = pgEnum("expense_category", ["bahan", "minyak", "upah", "plastik", "lain"]);
export const commissionTypeEnum = pgEnum("commission_type", ["fixed_range", "percentage"]);
export const subscriptionStatusEnum = pgEnum("subscription_status", ["active", "canceled", "past_due", "trialing", "incomplete"]);
export const promoCodeTypeEnum = pgEnum("promo_code_type", ["percentage", "fixed_amount"]);
export const billingStatusEnum = pgEnum("billing_status", ["succeeded", "failed", "pending", "refunded"]);

// Stock Items Table (Warehouse Inventory for Raw Materials)
export const stockItems = pgTable("stock_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(), // e.g., "Tepung Gandum", "Gula Pasir", "Telur"
  unit: text("unit").notNull(), // e.g., "kg", "gram", "liter", "ml", "pcs"
  packageSize: decimal("package_size", { precision: 10, scale: 2 }).notNull().default("1"), // Size of package purchased (e.g., 500 for 500gram, 1.4 for 1.4kg)
  purchasePrice: decimal("purchase_price", { precision: 10, scale: 2 }).notNull(), // Total price for the PACKAGE (e.g., RM21.90 for 500gram package)
  currentQuantity: decimal("current_quantity", { precision: 10, scale: 2 }).notNull().default("0"), // Current stock quantity in warehouse (in base units)
  lowStockThreshold: decimal("low_stock_threshold", { precision: 10, scale: 2 }).notNull().default("5"), // Alert when below this
  notes: text("notes"), // Optional notes
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Categories Table (Product Categories)
export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(), // Category name must be unique
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Products Table
export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  category: text("category").notNull(),
  imageUrl: text("image_url"),
  unitsPerBatch: integer("units_per_batch").notNull().default(1), // How many units 1 recipe produces
  labourCost: decimal("labour_cost", { precision: 10, scale: 2 }).notNull().default("0"), // Labour cost per batch
  otherCosts: decimal("other_costs", { precision: 10, scale: 2 }).notNull().default("0"), // Gas, electricity, etc per batch
  materialsCost: decimal("materials_cost", { precision: 10, scale: 2 }).notNull().default("0"), // Auto-calculated from recipe items
  totalCostPerBatch: decimal("total_cost_per_batch", { precision: 10, scale: 2 }).notNull().default("0"), // materials + labour + other
  costPerUnit: decimal("cost_per_unit", { precision: 10, scale: 2 }).notNull().default("0"), // totalCostPerBatch / unitsPerBatch
  suggestedMargin: decimal("suggested_margin", { precision: 5, scale: 2 }).notNull().default("30"), // Suggested profit margin %
  suggestedPrice: decimal("suggested_price", { precision: 10, scale: 2 }).notNull().default("0"), // Auto-calculated: costPerUnit * (1 + suggestedMargin/100)
  sellingPrice: decimal("selling_price", { precision: 10, scale: 2 }).notNull().default("0"), // User-set selling price
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Recipe Items Table (Links products to stock items with quantities)
export const recipeItems = pgTable("recipe_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  stockItemId: varchar("stock_item_id").notNull().references(() => stockItems.id, { onDelete: "cascade" }),
  quantityNeeded: decimal("quantity_needed", { precision: 10, scale: 2 }).notNull(), // How much of stock item needed for 1 batch
  usageUnit: text("usage_unit").notNull(), // Unit used in recipe (can differ from stock purchase unit) e.g., "gram" when stock is "kg"
  costPerRecipe: decimal("cost_per_recipe", { precision: 10, scale: 2 }).notNull(), // Calculated: converted quantity * stockItem.purchasePrice
});

// Ingredients Table
export const ingredients = pgTable("ingredients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  quantity: text("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalCost: decimal("total_cost", { precision: 10, scale: 2 }).notNull(),
});

// Production Batches Table
export const productionBatches = pgTable("production_batches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  productName: text("product_name").notNull(),
  quantity: integer("quantity").notNull(),
  remainingQty: decimal("remaining_qty", { precision: 10, scale: 2 }).notNull().default("0"), // Tracks remaining finished goods in this batch
  batchDate: date("batch_date").notNull(),
  expiryDate: date("expiry_date"),
  totalCost: decimal("total_cost", { precision: 10, scale: 2 }).notNull(),
  notes: text("notes"), // Optional notes for production batch
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Vendors Table
export const vendors = pgTable("vendors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  phone: text("phone"),
  address: text("address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Deliveries Table
export const deliveries = pgTable("deliveries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceNumber: text("invoice_number").unique(), // Format: INV-YYYYMMDD-XXXX
  vendorId: varchar("vendor_id").notNull().references(() => vendors.id, { onDelete: "cascade" }),
  vendorName: text("vendor_name").notNull(),
  deliveryDate: date("delivery_date").notNull(),
  status: deliveryStatusEnum("status").notNull().default("delivered"),
  paymentStatus: paymentStatusEnum("payment_status").notNull().default("pending"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Delivery Items Table
export const deliveryItems = pgTable("delivery_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  deliveryId: varchar("delivery_id").notNull().references(() => deliveries.id, { onDelete: "cascade" }),
  productId: varchar("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  productName: text("product_name").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(), // Price charged to vendor
  retailPrice: decimal("retail_price", { precision: 10, scale: 2 }), // Retail/suggested price for reference
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  rejectedQty: integer("rejected_qty").default(0), // Number of items rejected by vendor
  rejectionReason: text("rejection_reason"), // Reason for rejection (optional)
});

// Sales Table
export const sales = pgTable("sales", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vendorId: varchar("vendor_id").references(() => vendors.id, { onDelete: "set null" }),
  vendorName: text("vendor_name"),
  productId: varchar("product_id").references(() => products.id, { onDelete: "set null" }),
  productName: text("product_name").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  saleDate: date("sale_date").notNull(),
  isPaid: integer("is_paid").notNull().default(0), // 0 = pending, 1 = paid
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Expenses Table
export const expenses = pgTable("expenses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  category: expenseCategoryEnum("category").notNull(),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  expenseDate: date("expense_date").notNull(),
  receiptUrl: text("receipt_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Business Profile Table (for letterhead/invoice branding)
export const businessProfile = pgTable("business_profile", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessName: text("business_name").notNull(),
  registrationNumber: text("registration_number"),
  address: text("address"),
  phone: text("phone"),
  email: text("email"),
  tagline: text("tagline"),
  bankName: text("bank_name"),
  accountNumber: text("account_number"),
  accountName: text("account_name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Google Drive Sync Log Table (track uploaded files)
export const googleDriveSyncLog = pgTable("google_drive_sync_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  deliveryId: varchar("delivery_id").references(() => deliveries.id, { onDelete: "cascade" }),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(), // 'invoice', 'claim_statement', 'thermal_invoice', 'thermal_claim'
  driveFileId: text("drive_file_id").notNull(),
  driveWebViewLink: text("drive_web_view_link"),
  syncedAt: timestamp("synced_at").defaultNow().notNull(),
  vendorId: varchar("vendor_id").references(() => vendors.id, { onDelete: "set null" }),
  vendorName: text("vendor_name"),
});

// Vendor Commissions Table (commission setup per vendor)
export const vendorCommissions = pgTable("vendor_commissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vendorId: varchar("vendor_id").notNull().references(() => vendors.id, { onDelete: "cascade" }),
  commissionType: commissionTypeEnum("commission_type").notNull(),
  // For percentage type
  percentage: decimal("percentage", { precision: 5, scale: 2 }), // e.g., 10.00, 15.50, 20.00
  // For fixed_range type - store as JSON array: [{min: 1, max: 5, amount: 1.00}, {min: 5.01, max: 10, amount: 1.50}]
  ranges: text("ranges"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Shopping Cart Table (items to purchase with production context)
export const shoppingCart = pgTable("shopping_cart", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  stockItemId: varchar("stock_item_id").notNull().references(() => stockItems.id, { onDelete: "cascade" }),
  stockItemName: text("stock_item_name").notNull(), // Denormalized for easy display
  shortageQty: decimal("shortage_qty", { precision: 10, scale: 2 }).notNull(), // Exact shortage quantity
  unit: text("unit").notNull(), // Unit of measurement
  productionBatchId: varchar("production_batch_id").references(() => productionBatches.id, { onDelete: "set null" }), // Optional: link to production batch
  productName: text("product_name"), // Optional: product name if related to production
  notes: text("notes"), // Optional notes
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const stockItemsRelations = relations(stockItems, ({ many }) => ({
  recipeItems: many(recipeItems),
}));

export const recipeItemsRelations = relations(recipeItems, ({ one }) => ({
  product: one(products, {
    fields: [recipeItems.productId],
    references: [products.id],
  }),
  stockItem: one(stockItems, {
    fields: [recipeItems.stockItemId],
    references: [stockItems.id],
  }),
}));

export const productsRelations = relations(products, ({ many }) => ({
  ingredients: many(ingredients),
  productionBatches: many(productionBatches),
  recipeItems: many(recipeItems),
}));

export const ingredientsRelations = relations(ingredients, ({ one }) => ({
  product: one(products, {
    fields: [ingredients.productId],
    references: [products.id],
  }),
}));

export const productionBatchesRelations = relations(productionBatches, ({ one }) => ({
  product: one(products, {
    fields: [productionBatches.productId],
    references: [products.id],
  }),
}));

export const vendorsRelations = relations(vendors, ({ many }) => ({
  deliveries: many(deliveries),
  sales: many(sales),
  commissions: many(vendorCommissions),
}));

export const vendorCommissionsRelations = relations(vendorCommissions, ({ one }) => ({
  vendor: one(vendors, {
    fields: [vendorCommissions.vendorId],
    references: [vendors.id],
  }),
}));

export const shoppingCartRelations = relations(shoppingCart, ({ one }) => ({
  stockItem: one(stockItems, {
    fields: [shoppingCart.stockItemId],
    references: [stockItems.id],
  }),
  productionBatch: one(productionBatches, {
    fields: [shoppingCart.productionBatchId],
    references: [productionBatches.id],
  }),
}));

export const deliveriesRelations = relations(deliveries, ({ one, many }) => ({
  vendor: one(vendors, {
    fields: [deliveries.vendorId],
    references: [vendors.id],
  }),
  items: many(deliveryItems),
}));

export const deliveryItemsRelations = relations(deliveryItems, ({ one }) => ({
  delivery: one(deliveries, {
    fields: [deliveryItems.deliveryId],
    references: [deliveries.id],
  }),
  product: one(products, {
    fields: [deliveryItems.productId],
    references: [products.id],
  }),
}));

export const salesRelations = relations(sales, ({ one }) => ({
  vendor: one(vendors, {
    fields: [sales.vendorId],
    references: [vendors.id],
  }),
  product: one(products, {
    fields: [sales.productId],
    references: [products.id],
  }),
}));

// Insert Schemas
export const insertStockItemSchema = createInsertSchema(stockItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
});

export const insertRecipeItemSchema = createInsertSchema(recipeItems).omit({
  id: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertIngredientSchema = createInsertSchema(ingredients).omit({
  id: true,
});

export const insertProductionBatchSchema = createInsertSchema(productionBatches).omit({
  id: true,
  createdAt: true,
});

export const insertVendorSchema = createInsertSchema(vendors).omit({
  id: true,
  createdAt: true,
});

export const insertDeliverySchema = createInsertSchema(deliveries).omit({
  id: true,
  createdAt: true,
});

export const insertDeliveryItemSchema = createInsertSchema(deliveryItems).omit({
  id: true,
});

export const insertSaleSchema = createInsertSchema(sales).omit({
  id: true,
  createdAt: true,
});

export const insertExpenseSchema = createInsertSchema(expenses).omit({
  id: true,
  createdAt: true,
});

export const insertBusinessProfileSchema = createInsertSchema(businessProfile).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGoogleDriveSyncLogSchema = createInsertSchema(googleDriveSyncLog).omit({
  id: true,
  syncedAt: true,
});

export const insertVendorCommissionSchema = createInsertSchema(vendorCommissions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertShoppingCartSchema = createInsertSchema(shoppingCart).omit({
  id: true,
  createdAt: true,
});

// Types
export type StockItem = typeof stockItems.$inferSelect;
export type InsertStockItem = z.infer<typeof insertStockItemSchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type RecipeItem = typeof recipeItems.$inferSelect;
export type InsertRecipeItem = z.infer<typeof insertRecipeItemSchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type Ingredient = typeof ingredients.$inferSelect;
export type InsertIngredient = z.infer<typeof insertIngredientSchema>;

export type ProductionBatch = typeof productionBatches.$inferSelect;
export type InsertProductionBatch = z.infer<typeof insertProductionBatchSchema>;

export type Vendor = typeof vendors.$inferSelect;
export type InsertVendor = z.infer<typeof insertVendorSchema>;

export type Delivery = typeof deliveries.$inferSelect;
export type InsertDelivery = z.infer<typeof insertDeliverySchema>;

export type DeliveryItem = typeof deliveryItems.$inferSelect;
export type InsertDeliveryItem = z.infer<typeof insertDeliveryItemSchema>;

export type Sale = typeof sales.$inferSelect;
export type InsertSale = z.infer<typeof insertSaleSchema>;

export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;

export type BusinessProfile = typeof businessProfile.$inferSelect;
export type InsertBusinessProfile = z.infer<typeof insertBusinessProfileSchema>;

export type GoogleDriveSyncLog = typeof googleDriveSyncLog.$inferSelect;
export type InsertGoogleDriveSyncLog = z.infer<typeof insertGoogleDriveSyncLogSchema>;

export type VendorCommission = typeof vendorCommissions.$inferSelect;
export type InsertVendorCommission = z.infer<typeof insertVendorCommissionSchema>;

export type ShoppingCart = typeof shoppingCart.$inferSelect;
export type InsertShoppingCart = z.infer<typeof insertShoppingCartSchema>;

// ==================== SUBSCRIPTION & BILLING SYSTEM ====================

// Users Table (Authentication & Account Management)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(), // Hashed password
  name: text("name").notNull(),
  businessName: text("business_name"), // Optional business name
  phone: text("phone"), // Optional phone number
  isAdmin: integer("is_admin").notNull().default(0), // 1 for admin, 0 for regular user
  // Free Trial Fields
  isOnTrial: integer("is_on_trial").notNull().default(1), // 1 = on trial, 0 = paid/expired
  trialEndsAt: timestamp("trial_ends_at"), // When 7-day trial ends
  // ToyyibPay Integration
  toyyibpayUserCode: text("toyyibpay_user_code"), // Optional ToyyibPay user reference
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Subscription Plans Table (Duration-based pricing for ToyyibPay)
export const subscriptionPlans = pgTable("subscription_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(), // "basic", "pro", "premium"
  displayName: text("display_name").notNull(), // Display name for UI
  description: text("description"), // Plan description
  monthlyPrice: decimal("monthly_price", { precision: 10, scale: 2 }).notNull(), // Base price per month in MYR
  currency: text("currency").notNull().default("MYR"),
  features: text("features"), // JSON string of features array
  maxUsers: integer("max_users").default(1), // Max users for this plan
  maxProducts: integer("max_products").default(100), // Max products allowed
  // Duration Discounts
  discount6Months: decimal("discount_6_months", { precision: 5, scale: 2 }).default("10.00"), // 10% discount for 6 months
  discount12Months: decimal("discount_12_months", { precision: 5, scale: 2 }).default("20.00"), // 20% discount for 12 months
  isActive: integer("is_active").notNull().default(1), // 1 = active, 0 = inactive
  sortOrder: integer("sort_order").default(0), // For display ordering
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User Subscriptions Table (Fixed duration model for ToyyibPay)
export const userSubscriptions = pgTable("user_subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  planId: varchar("plan_id").notNull().references(() => subscriptionPlans.id),
  planName: text("plan_name").notNull(), // Denormalized for easy display
  status: subscriptionStatusEnum("status").notNull().default("active"),
  durationMonths: integer("duration_months").notNull(), // 3, 6, or 12 months
  subscriptionStartsAt: timestamp("subscription_starts_at").notNull(),
  subscriptionEndsAt: timestamp("subscription_ends_at").notNull(), // Fixed end date
  totalPaid: decimal("total_paid", { precision: 10, scale: 2 }).notNull(), // Amount paid upfront
  isEarlyBird: integer("is_early_bird").notNull().default(0), // 1 = early bird customer, 0 = regular
  earlyBirdEndsAt: timestamp("early_bird_ends_at"), // When early bird pricing ends (after first payment duration)
  loyaltyMonthlyRate: decimal("loyalty_monthly_rate", { precision: 10, scale: 2 }), // Monthly rate after early bird (e.g., RM79)
  // ToyyibPay Integration
  toyyibpayBillCode: text("toyyibpay_bill_code"), // ToyyibPay bill reference
  paymentMethod: text("payment_method"), // FPX, card, e-wallet, etc.
  metadata: text("metadata"), // JSON for additional data
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Promo Codes Table
export const promoCodes = pgTable("promo_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(), // e.g., "EARLYBIRD100"
  name: text("name").notNull(), // Display name
  discountType: promoCodeTypeEnum("discount_type").notNull(),
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }).notNull(), // Percentage or fixed amount
  maxUses: integer("max_uses"), // Null = unlimited
  currentUses: integer("current_uses").notNull().default(0),
  expiresAt: timestamp("expires_at"), // Null = no expiration
  isActive: integer("is_active").notNull().default(1),
  isEarlyBird: integer("is_early_bird").notNull().default(0), // 1 = early bird promo, 0 = regular
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Billing History Table (ToyyibPay transactions)
export const billingHistory = pgTable("billing_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  subscriptionId: varchar("subscription_id").references(() => userSubscriptions.id, { onDelete: "set null" }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("MYR"),
  status: billingStatusEnum("status").notNull(),
  // ToyyibPay Integration
  toyyibpayBillCode: text("toyyibpay_bill_code"), // ToyyibPay bill reference
  toyyibpayTransactionId: text("toyyibpay_transaction_id"), // Transaction ID after payment
  paymentMethod: text("payment_method"), // FPX, card, e-wallet
  description: text("description"),
  receiptUrl: text("receipt_url"), // URL to receipt/invoice
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Early Bird Tracking Table (First 100 signups)
export const earlyBirdTracking = pgTable("early_bird_tracking", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  slotNumber: integer("slot_number").notNull().unique(), // 1-100
  email: text("email").notNull(),
  signupDate: timestamp("signup_date").defaultNow().notNull(),
  hasSubscribed: integer("has_subscribed").notNull().default(0), // 1 = subscribed, 0 = trial only
  subscriptionId: varchar("subscription_id").references(() => userSubscriptions.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert Schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).omit({
  id: true,
  createdAt: true,
});

export const insertUserSubscriptionSchema = createInsertSchema(userSubscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPromoCodeSchema = createInsertSchema(promoCodes).omit({
  id: true,
  createdAt: true,
});

export const insertBillingHistorySchema = createInsertSchema(billingHistory).omit({
  id: true,
  createdAt: true,
});

export const insertEarlyBirdTrackingSchema = createInsertSchema(earlyBirdTracking).omit({
  id: true,
  createdAt: true,
  signupDate: true,
});

// Type Exports
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlanSchema>;

export type UserSubscription = typeof userSubscriptions.$inferSelect;
export type InsertUserSubscription = z.infer<typeof insertUserSubscriptionSchema>;

export type PromoCode = typeof promoCodes.$inferSelect;
export type InsertPromoCode = z.infer<typeof insertPromoCodeSchema>;

export type BillingHistory = typeof billingHistory.$inferSelect;
export type InsertBillingHistory = z.infer<typeof insertBillingHistorySchema>;

export type EarlyBirdTracking = typeof earlyBirdTracking.$inferSelect;
export type InsertEarlyBirdTracking = z.infer<typeof insertEarlyBirdTrackingSchema>;

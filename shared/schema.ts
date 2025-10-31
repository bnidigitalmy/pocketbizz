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
export const paymentMethodEnum = pgEnum("payment_method", ["tunai", "online", "kredit"]); // Cash, Online, Credit
export const subscriptionStatusEnum = pgEnum("subscription_status", ["active", "canceled", "past_due", "trialing", "incomplete", "expired"]);
export const promoCodeTypeEnum = pgEnum("promo_code_type", ["percentage", "fixed_amount"]);
export const billingStatusEnum = pgEnum("billing_status", ["succeeded", "failed", "pending", "refunded"]);
export const resellerPaymentStatusEnum = pgEnum("reseller_payment_status", ["paid", "pending"]);
export const broadcastChannelEnum = pgEnum("broadcast_channel", ["email", "whatsapp", "sms"]);
export const broadcastStatusEnum = pgEnum("broadcast_status", ["draft", "pending", "sending", "sent", "failed"]);
export const messageTemplateTypeEnum = pgEnum("message_template_type", ["promo", "new_product", "voucher", "general"]);
export const voucherTypeEnum = pgEnum("voucher_type", ["percentage", "fixed_amount"]);
export const voucherStatusEnum = pgEnum("voucher_status", ["active", "used", "expired", "cancelled"]);
export const bookingStatusEnum = pgEnum("booking_status", ["pending", "confirmed", "in_progress", "ready", "completed", "cancelled"]);
export const bookingDeliveryTypeEnum = pgEnum("booking_delivery_type", ["pickup", "delivery"]);
export const purchaseOrderStatusEnum = pgEnum("purchase_order_status", ["draft", "sent", "received", "cancelled"]);
export const claimStatusEnum = pgEnum("claim_status", ["pending", "approved", "rejected"]);

// Stock Items Table (Warehouse Inventory for Raw Materials)
export const stockItems = pgTable("stock_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
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
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(), // Category name must be unique within user scope
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Products Table
export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
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
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  productId: varchar("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  quantity: text("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalCost: decimal("total_cost", { precision: 10, scale: 2 }).notNull(),
});

// Production Batches Table
export const productionBatches = pgTable("production_batches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
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

// Vendors Table (kedai untuk hantar produk jual - consignment)
export const vendors = pgTable("vendors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  phone: text("phone"),
  address: text("address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Suppliers Table (tempat beli bahan mentah - purchase orders)
export const suppliers = pgTable("suppliers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  phone: text("phone"),
  address: text("address"),
  email: text("email"), // For sending POs via email
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Deliveries Table
export const deliveries = pgTable("deliveries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
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

// Vendor Sales Table (Manual sales entry by bakery)
export const vendorSales = pgTable("vendor_sales", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  vendorId: varchar("vendor_id").notNull().references(() => vendors.id, { onDelete: "cascade" }),
  vendorName: text("vendor_name").notNull(),
  deliveryId: varchar("delivery_id").references(() => deliveries.id, { onDelete: "set null" }), // Link to original delivery
  productId: varchar("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  productName: text("product_name").notNull(),
  quantitySold: integer("quantity_sold").notNull(), // How many vendor sold
  saleDate: date("sale_date").notNull(), // When vendor reported the sale
  notes: text("notes"), // Optional notes
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Vendor Claims Table (Claim submissions from vendors)
export const vendorClaims = pgTable("vendor_claims", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  vendorId: varchar("vendor_id").notNull().references(() => vendors.id, { onDelete: "cascade" }),
  vendorName: text("vendor_name").notNull(),
  deliveryId: varchar("delivery_id").references(() => deliveries.id, { onDelete: "set null" }), // Related delivery (optional)
  claimNumber: text("claim_number").unique(), // Format: CLM-YYYYMMDD-XXXX
  claimDate: date("claim_date").notNull(),
  status: claimStatusEnum("status").notNull().default("pending"),
  totalClaimAmount: decimal("total_claim_amount", { precision: 10, scale: 2 }).notNull(),
  approvedAmount: decimal("approved_amount", { precision: 10, scale: 2 }).default("0"),
  reviewNotes: text("review_notes"), // Notes from bakery during review
  reviewedAt: timestamp("reviewed_at"), // When claim was reviewed
  reviewedBy: varchar("reviewed_by").references(() => users.id, { onDelete: "set null" }), // Who reviewed
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Claim Items Table (Products claimed)
export const claimItems = pgTable("claim_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  claimId: varchar("claim_id").notNull().references(() => vendorClaims.id, { onDelete: "cascade" }),
  productId: varchar("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  productName: text("product_name").notNull(),
  quantityClaimed: integer("quantity_claimed").notNull(), // How many items claimed
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(), // Price per unit
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(), // quantityClaimed * unitPrice
  claimReason: text("claim_reason").notNull(), // Why claiming (rosak, expired, etc)
  approvedQty: integer("approved_qty").default(0), // Approved quantity after review
});

// Claim Photos Table (Photo evidence for claims)
export const claimPhotos = pgTable("claim_photos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  claimId: varchar("claim_id").notNull().references(() => vendorClaims.id, { onDelete: "cascade" }),
  photoUrl: text("photo_url").notNull(), // Google Drive URL
  caption: text("caption"), // Optional description
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

// Vendor Stock Balance Table (Track current stock at vendor location)
export const vendorStockBalance = pgTable("vendor_stock_balance", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vendorId: varchar("vendor_id").notNull().references(() => vendors.id, { onDelete: "cascade" }),
  productId: varchar("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  currentStock: integer("current_stock").notNull().default(0), // Current stock at vendor
  lastDeliveryDate: date("last_delivery_date"), // Last delivery date
  lastSaleDate: date("last_sale_date"), // Last sale date
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// POS Sales Table (Transactions)
export const sales = pgTable("sales", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  receiptNumber: text("receipt_number").notNull().unique(), // Format: RES-YYYYMMDD-XXXX
  customerName: text("customer_name"), // Optional customer name
  customerId: varchar("customer_id").references(() => customers.id, { onDelete: "set null" }), // Link to customer for loyalty
  paymentMethod: paymentMethodEnum("payment_method").notNull().default("tunai"), // tunai, online, kredit
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(), // Total sale amount
  totalCost: decimal("total_cost", { precision: 10, scale: 2 }).notNull().default("0"), // Total cost (for profit calc)
  profitAmount: decimal("profit_amount", { precision: 10, scale: 2 }).notNull().default("0"), // totalAmount - totalCost
  saleDate: date("sale_date").notNull(),
  notes: text("notes"), // Optional notes
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Sales Items Table (Items in each sale transaction)
export const salesItems = pgTable("sales_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  saleId: varchar("sale_id").notNull().references(() => sales.id, { onDelete: "cascade" }),
  productId: varchar("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  productName: text("product_name").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(), // Selling price
  unitCost: decimal("unit_cost", { precision: 10, scale: 2 }).notNull().default("0"), // Cost price (from product.costPerUnit)
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(), // quantity * unitPrice
  totalCost: decimal("total_cost", { precision: 10, scale: 2 }).notNull().default("0"), // quantity * unitCost
  profitAmount: decimal("profit_amount", { precision: 10, scale: 2 }).notNull().default("0"), // totalPrice - totalCost
  batchId: varchar("batch_id").references(() => productionBatches.id, { onDelete: "set null" }), // For FIFO tracking
});

// Expenses Table
export const expenses = pgTable("expenses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
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
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  businessName: text("business_name").notNull(),
  registrationNumber: text("registration_number"),
  address: text("address"),
  phone: text("phone"),
  email: text("email"),
  tagline: text("tagline"),
  bankName: text("bank_name"),
  accountNumber: text("account_number"),
  accountName: text("account_name"),
  paymentQrCode: text("payment_qr_code"), // DuitNow / Bank QR code image URL
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Google Drive Sync Log Table (track uploaded files)
export const googleDriveSyncLog = pgTable("google_drive_sync_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
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
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
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
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  stockItemId: varchar("stock_item_id").notNull().references(() => stockItems.id, { onDelete: "cascade" }),
  stockItemName: text("stock_item_name").notNull(), // Denormalized for easy display
  shortageQty: decimal("shortage_qty", { precision: 10, scale: 2 }).notNull(), // Exact shortage quantity
  unit: text("unit").notNull(), // Unit of measurement
  productionBatchId: varchar("production_batch_id").references(() => productionBatches.id, { onDelete: "set null" }), // Optional: link to production batch
  productName: text("product_name"), // Optional: product name if related to production
  notes: text("notes"), // Optional notes
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Purchase Orders Table (Smart Supplier Order Hub)
export const purchaseOrders = pgTable("purchase_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  poNumber: text("po_number").notNull().unique(), // PO-20251025-001
  supplierId: varchar("supplier_id").references(() => suppliers.id, { onDelete: "set null" }),
  supplierName: text("supplier_name").notNull(), // Denormalized
  supplierPhone: text("supplier_phone"), // Denormalized for easy contact
  status: purchaseOrderStatusEnum("status").default("draft").notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).default("0").notNull(),
  notes: text("notes"),
  sentAt: timestamp("sent_at"),
  receivedAt: timestamp("received_at"),
  expenseId: varchar("expense_id").references(() => expenses.id, { onDelete: "set null" }), // Link to expense when received
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Purchase Order Items Table
export const purchaseOrderItems = pgTable("purchase_order_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  poId: varchar("po_id").notNull().references(() => purchaseOrders.id, { onDelete: "cascade" }),
  stockItemId: varchar("stock_item_id").references(() => stockItems.id, { onDelete: "set null" }),
  itemName: text("item_name").notNull(), // Denormalized
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  unit: text("unit").notNull(),
  estimatedPrice: decimal("estimated_price", { precision: 10, scale: 2 }).default("0"), // Per unit estimate
  actualPrice: decimal("actual_price", { precision: 10, scale: 2 }), // Actual price when received
  notes: text("notes"),
});

// Purchase Order Templates Table (for recurring/template POs)
export const poTemplates = pgTable("po_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  templateName: text("template_name").notNull(), // User-friendly name
  supplierId: varchar("supplier_id").references(() => suppliers.id, { onDelete: "set null" }),
  supplierName: text("supplier_name").notNull(),
  supplierPhone: text("supplier_phone"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// PO Template Items Table
export const poTemplateItems = pgTable("po_template_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  templateId: varchar("template_id").notNull().references(() => poTemplates.id, { onDelete: "cascade" }),
  stockItemId: varchar("stock_item_id").references(() => stockItems.id, { onDelete: "set null" }),
  itemName: text("item_name").notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  unit: text("unit").notNull(),
  estimatedPrice: decimal("estimated_price", { precision: 10, scale: 2 }).default("0"),
  notes: text("notes"),
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
  commissions: many(vendorCommissions),
}));

export const suppliersRelations = relations(suppliers, ({ many }) => ({
  purchaseOrders: many(purchaseOrders),
  templates: many(poTemplates),
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

export const purchaseOrdersRelations = relations(purchaseOrders, ({ one, many }) => ({
  supplier: one(suppliers, {
    fields: [purchaseOrders.supplierId],
    references: [suppliers.id],
  }),
  items: many(purchaseOrderItems),
  expense: one(expenses, {
    fields: [purchaseOrders.expenseId],
    references: [expenses.id],
  }),
}));

export const purchaseOrderItemsRelations = relations(purchaseOrderItems, ({ one }) => ({
  purchaseOrder: one(purchaseOrders, {
    fields: [purchaseOrderItems.poId],
    references: [purchaseOrders.id],
  }),
  stockItem: one(stockItems, {
    fields: [purchaseOrderItems.stockItemId],
    references: [stockItems.id],
  }),
}));

export const poTemplatesRelations = relations(poTemplates, ({ one, many }) => ({
  supplier: one(suppliers, {
    fields: [poTemplates.supplierId],
    references: [suppliers.id],
  }),
  items: many(poTemplateItems),
}));

export const poTemplateItemsRelations = relations(poTemplateItems, ({ one }) => ({
  template: one(poTemplates, {
    fields: [poTemplateItems.templateId],
    references: [poTemplates.id],
  }),
  stockItem: one(stockItems, {
    fields: [poTemplateItems.stockItemId],
    references: [stockItems.id],
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

export const salesRelations = relations(sales, ({ many }) => ({
  items: many(salesItems),
}));

export const salesItemsRelations = relations(salesItems, ({ one }) => ({
  sale: one(sales, {
    fields: [salesItems.saleId],
    references: [sales.id],
  }),
  product: one(products, {
    fields: [salesItems.productId],
    references: [products.id],
  }),
  batch: one(productionBatches, {
    fields: [salesItems.batchId],
    references: [productionBatches.id],
  }),
}));

// Insert Schemas
export const insertStockItemSchema = createInsertSchema(stockItems).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export const insertRecipeItemSchema = createInsertSchema(recipeItems).omit({
  id: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertIngredientSchema = createInsertSchema(ingredients).omit({
  id: true,
  userId: true,
});

export const insertProductionBatchSchema = createInsertSchema(productionBatches).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export const insertVendorSchema = createInsertSchema(vendors).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export const insertSupplierSchema = createInsertSchema(suppliers).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export const insertDeliverySchema = createInsertSchema(deliveries).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export const insertDeliveryItemSchema = createInsertSchema(deliveryItems).omit({
  id: true,
});

export const insertVendorSaleSchema = createInsertSchema(vendorSales).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export const insertVendorClaimSchema = createInsertSchema(vendorClaims).omit({
  id: true,
  userId: true,
  claimNumber: true,
  approvedAmount: true,
  reviewNotes: true,
  reviewedAt: true,
  reviewedBy: true,
  createdAt: true,
});

export const insertClaimItemSchema = createInsertSchema(claimItems).omit({
  id: true,
  approvedQty: true,
});

export const insertClaimPhotoSchema = createInsertSchema(claimPhotos).omit({
  id: true,
  uploadedAt: true,
});

export const insertVendorStockBalanceSchema = createInsertSchema(vendorStockBalance).omit({
  id: true,
  updatedAt: true,
});

export const insertSaleSchema = createInsertSchema(sales).omit({
  id: true,
  userId: true,
  receiptNumber: true,
  createdAt: true,
});

export const insertSalesItemSchema = createInsertSchema(salesItems).omit({
  id: true,
  saleId: true,
  batchId: true,
});

export const insertExpenseSchema = createInsertSchema(expenses).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export const insertBusinessProfileSchema = createInsertSchema(businessProfile).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGoogleDriveSyncLogSchema = createInsertSchema(googleDriveSyncLog).omit({
  id: true,
  userId: true,
  syncedAt: true,
});

export const insertVendorCommissionSchema = createInsertSchema(vendorCommissions).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertShoppingCartSchema = createInsertSchema(shoppingCart).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export const insertPurchaseOrderSchema = createInsertSchema(purchaseOrders).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPurchaseOrderItemSchema = createInsertSchema(purchaseOrderItems).omit({
  id: true,
});

export const insertPOTemplateSchema = createInsertSchema(poTemplates).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPOTemplateItemSchema = createInsertSchema(poTemplateItems).omit({
  id: true,
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

export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;

export type Delivery = typeof deliveries.$inferSelect;
export type InsertDelivery = z.infer<typeof insertDeliverySchema>;

export type DeliveryItem = typeof deliveryItems.$inferSelect;
export type InsertDeliveryItem = z.infer<typeof insertDeliveryItemSchema>;

export type VendorSale = typeof vendorSales.$inferSelect;
export type InsertVendorSale = z.infer<typeof insertVendorSaleSchema>;

export type VendorClaim = typeof vendorClaims.$inferSelect;
export type InsertVendorClaim = z.infer<typeof insertVendorClaimSchema>;

export type ClaimItem = typeof claimItems.$inferSelect;
export type InsertClaimItem = z.infer<typeof insertClaimItemSchema>;

export type ClaimPhoto = typeof claimPhotos.$inferSelect;
export type InsertClaimPhoto = z.infer<typeof insertClaimPhotoSchema>;

export type VendorStockBalance = typeof vendorStockBalance.$inferSelect;
export type InsertVendorStockBalance = z.infer<typeof insertVendorStockBalanceSchema>;

export type Sale = typeof sales.$inferSelect;
export type InsertSale = z.infer<typeof insertSaleSchema>;
export type SalesItem = typeof salesItems.$inferSelect;
export type InsertSalesItem = z.infer<typeof insertSalesItemSchema>;

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

export type PurchaseOrder = typeof purchaseOrders.$inferSelect;
export type InsertPurchaseOrder = z.infer<typeof insertPurchaseOrderSchema>;

export type PurchaseOrderItem = typeof purchaseOrderItems.$inferSelect;
export type InsertPurchaseOrderItem = z.infer<typeof insertPurchaseOrderItemSchema>;

export type POTemplate = typeof poTemplates.$inferSelect;
export type InsertPOTemplate = z.infer<typeof insertPOTemplateSchema>;

export type POTemplateItem = typeof poTemplateItems.$inferSelect;
export type InsertPOTemplateItem = z.infer<typeof insertPOTemplateItemSchema>;

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

// Promo Code Usage Tracking (Prevent duplicate usage per user)
export const promoCodeUsage = pgTable("promo_code_usage", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  promoCodeId: varchar("promo_code_id").notNull().references(() => promoCodes.id, { onDelete: "cascade" }),
  usedAt: timestamp("used_at").defaultNow().notNull(),
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

// Pending Bills Table (ToyyibPay bill metadata before payment completion)
export const pendingBills = pgTable("pending_bills", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  billCode: text("bill_code").notNull().unique(), // ToyyibPay bill code
  orderRef: text("order_ref").notNull(), // Our order reference
  planId: varchar("plan_id").notNull().references(() => subscriptionPlans.id),
  planName: text("plan_name").notNull(),
  durationMonths: integer("duration_months").notNull(), // 3, 6, or 12
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  promoCodeId: varchar("promo_code_id").references(() => promoCodes.id, { onDelete: "set null" }),
  promoCode: text("promo_code"), // Denormalized for easy access
  discountApplied: decimal("discount_applied", { precision: 10, scale: 2 }).default("0"),
  isProcessed: integer("is_processed").notNull().default(0), // 1 = processed by webhook, 0 = pending
  processedAt: timestamp("processed_at"),
  isRenewal: integer("is_renewal").notNull().default(0), // 1 = renewal, 0 = new subscription
  renewalSubscriptionId: varchar("renewal_subscription_id").references(() => userSubscriptions.id, { onDelete: "set null" }), // For renewals
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(), // Bill expiry (7 days)
});

// Goals Table (User monthly targets and progress tracking)
export const goals = pgTable("goals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  targetMonth: date("target_month").notNull(), // First day of target month (YYYY-MM-01)
  revenueTarget: decimal("revenue_target", { precision: 10, scale: 2 }).notNull().default("0"), // Monthly revenue target
  profitTarget: decimal("profit_target", { precision: 10, scale: 2 }).notNull().default("0"), // Monthly profit target
  salesVolumeTarget: integer("sales_volume_target").notNull().default(0), // Target number of sales/deliveries
  notes: text("notes"), // User notes or motivation
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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

export const insertPendingBillSchema = createInsertSchema(pendingBills).omit({
  id: true,
  createdAt: true,
});

export const insertBillingHistorySchema = createInsertSchema(billingHistory).omit({
  id: true,
  createdAt: true,
});

export const insertGoalSchema = createInsertSchema(goals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
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

export type PendingBill = typeof pendingBills.$inferSelect;
export type InsertPendingBill = z.infer<typeof insertPendingBillSchema>;

export type Goal = typeof goals.$inferSelect;
export type InsertGoal = z.infer<typeof insertGoalSchema>;

// Pricing Tiers Table (for reseller discount tiers)
export const pricingTiers = pgTable("pricing_tiers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(), // e.g., "Bronze", "Silver", "Gold"
  discountPercent: decimal("discount_percent", { precision: 5, scale: 2 }).notNull().default("0"), // Discount % off selling price
  isActive: integer("is_active").notNull().default(1), // 1 = active, 0 = inactive
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Resellers Table (agents/ejen jualan)
export const resellers = pgTable("resellers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(), // Reseller/agent name
  phone: text("phone"),
  area: text("area"), // State/region they operate in (e.g., "Selangor", "Johor")
  pricingTierId: varchar("pricing_tier_id").references(() => pricingTiers.id, { onDelete: "set null" }),
  totalPurchases: decimal("total_purchases", { precision: 10, scale: 2 }).notNull().default("0"), // Cumulative purchases
  isActive: integer("is_active").notNull().default(1), // 1 = active, 0 = inactive
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Reseller Transfers Table (stock transfers to resellers)
export const resellerTransfers = pgTable("reseller_transfers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  resellerId: varchar("reseller_id").notNull().references(() => resellers.id, { onDelete: "cascade" }),
  transferDate: date("transfer_date").notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(), // Total value of transfer
  paymentStatus: resellerPaymentStatusEnum("payment_status").notNull().default("pending"), // paid or pending
  notes: text("notes"), // Optional notes
  receiptNumber: text("receipt_number").unique(), // Format: TRF-YYYYMMDD-XXXX
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Reseller Transfer Items Table (items in each transfer)
export const resellerTransferItems = pgTable("reseller_transfer_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  transferId: varchar("transfer_id").notNull().references(() => resellerTransfers.id, { onDelete: "cascade" }),
  productId: varchar("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  productName: text("product_name").notNull(),
  quantity: integer("quantity").notNull(),
  tierPrice: decimal("tier_price", { precision: 10, scale: 2 }).notNull(), // Price after tier discount
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(), // quantity * tierPrice
  batchId: varchar("batch_id").references(() => productionBatches.id, { onDelete: "set null" }), // For FIFO tracking
});

// Insert Schemas for Reseller Module
export const insertPricingTierSchema = createInsertSchema(pricingTiers).omit({
  id: true,
  createdAt: true,
});

export const insertResellerSchema = createInsertSchema(resellers).omit({
  id: true,
  createdAt: true,
});

export const insertResellerTransferSchema = createInsertSchema(resellerTransfers).omit({
  id: true,
  createdAt: true,
});

export const insertResellerTransferItemSchema = createInsertSchema(resellerTransferItems).omit({
  id: true,
});

// Type Exports for Reseller Module
export type PricingTier = typeof pricingTiers.$inferSelect;
export type InsertPricingTier = z.infer<typeof insertPricingTierSchema>;

export type Reseller = typeof resellers.$inferSelect;
export type InsertReseller = z.infer<typeof insertResellerSchema>;

export type ResellerTransfer = typeof resellerTransfers.$inferSelect;
export type InsertResellerTransfer = z.infer<typeof insertResellerTransferSchema>;

export type ResellerTransferItem = typeof resellerTransferItems.$inferSelect;
export type InsertResellerTransferItem = z.infer<typeof insertResellerTransferItemSchema>;

// ========================================
// LOYALTY PROGRAM TABLES
// ========================================

// Customers Table - Track unique customers and their loyalty points
export const customers = pgTable("customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(), // Customer name
  phone: text("phone").notNull(), // Phone number - unique within user scope
  email: text("email"), // Optional email
  loyaltyPoints: integer("loyalty_points").notNull().default(0), // Current points balance
  totalSpent: decimal("total_spent", { precision: 10, scale: 2 }).notNull().default("0"), // Lifetime spending
  totalVisits: integer("total_visits").notNull().default(0), // Number of purchases
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Loyalty Points History - Track all point transactions
export const loyaltyPointsHistory = pgTable("loyalty_points_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
  saleId: varchar("sale_id").references(() => sales.id, { onDelete: "set null" }), // Link to sale if earned from purchase
  pointsChange: integer("points_change").notNull(), // Positive for earned, negative for redeemed
  balanceAfter: integer("balance_after").notNull(), // Points balance after this transaction
  transactionType: text("transaction_type").notNull(), // "earned", "redeemed", "expired", "adjustment"
  description: text("description"), // Optional description
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert Schemas for Loyalty Program
export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  userId: true,
  loyaltyPoints: true,
  totalSpent: true,
  totalVisits: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLoyaltyPointsHistorySchema = createInsertSchema(loyaltyPointsHistory).omit({
  id: true,
  createdAt: true,
});

// Type Exports for Loyalty Program
export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;

export type LoyaltyPointsHistory = typeof loyaltyPointsHistory.$inferSelect;
export type InsertLoyaltyPointsHistory = z.infer<typeof insertLoyaltyPointsHistorySchema>;

// ========================================
// BROADCAST SYSTEM TABLES
// ========================================

// Message Templates - Pre-built message templates for common scenarios
export const messageTemplates = pgTable("message_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(), // Template name (e.g., "Promosi Raya", "Produk Baru")
  type: messageTemplateTypeEnum("type").notNull(), // promo, new_product, voucher, general
  subject: text("subject"), // For email (optional)
  message: text("message").notNull(), // Message body (supports placeholders like {name}, {points})
  channel: broadcastChannelEnum("channel").notNull(), // email, whatsapp, sms
  isActive: integer("is_active").notNull().default(1), // 1=active, 0=archived
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Broadcast Campaigns - Track broadcast campaigns
export const broadcastCampaigns = pgTable("broadcast_campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(), // Campaign name
  channel: broadcastChannelEnum("channel").notNull(), // email, whatsapp, sms
  subject: text("subject"), // For email
  message: text("message").notNull(), // Message content
  targetSegment: text("target_segment").notNull(), // "all", "high_points", "recent_buyers", "custom"
  targetCustomerIds: text("target_customer_ids").array(), // Array of customer IDs if custom segment
  status: broadcastStatusEnum("status").notNull().default("draft"), // draft, pending, sending, sent, failed
  totalRecipients: integer("total_recipients").notNull().default(0), // Total customers targeted
  sentCount: integer("sent_count").notNull().default(0), // Successfully sent
  failedCount: integer("failed_count").notNull().default(0), // Failed to send
  scheduledAt: timestamp("scheduled_at"), // When to send (null = send immediately)
  sentAt: timestamp("sent_at"), // When actually sent
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Broadcast Messages - Track individual messages sent to customers
export const broadcastMessages = pgTable("broadcast_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").notNull().references(() => broadcastCampaigns.id, { onDelete: "cascade" }),
  customerId: varchar("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
  channel: broadcastChannelEnum("channel").notNull(), // email, whatsapp, sms
  recipient: text("recipient").notNull(), // Email address or phone number
  status: text("status").notNull().default("pending"), // pending, sent, failed, delivered, read
  errorMessage: text("error_message"), // Error details if failed
  externalMessageId: text("external_message_id"), // ID from email/SMS provider
  sentAt: timestamp("sent_at"), // When message was sent
  deliveredAt: timestamp("delivered_at"), // When message was delivered (if available)
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert Schemas for Broadcast System
export const insertMessageTemplateSchema = createInsertSchema(messageTemplates).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBroadcastCampaignSchema = createInsertSchema(broadcastCampaigns).omit({
  id: true,
  userId: true,
  sentCount: true,
  failedCount: true,
  sentAt: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBroadcastMessageSchema = createInsertSchema(broadcastMessages).omit({
  id: true,
  createdAt: true,
});

// Type Exports for Broadcast System
export type MessageTemplate = typeof messageTemplates.$inferSelect;
export type InsertMessageTemplate = z.infer<typeof insertMessageTemplateSchema>;

export type BroadcastCampaign = typeof broadcastCampaigns.$inferSelect;
export type InsertBroadcastCampaign = z.infer<typeof insertBroadcastCampaignSchema>;

export type BroadcastMessage = typeof broadcastMessages.$inferSelect;
export type InsertBroadcastMessage = z.infer<typeof insertBroadcastMessageSchema>;

// ========================================
// CUSTOMER VOUCHER SYSTEM
// ========================================

// Customer Vouchers - Discount vouchers for loyal customers
export const customerVouchers = pgTable("customer_vouchers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  code: text("code").notNull(), // Unique voucher code within user scope e.g., "RAYA2024", "VIP50"
  name: text("name").notNull(), // Display name
  description: text("description"), // Optional description
  voucherType: voucherTypeEnum("voucher_type").notNull(), // percentage or fixed_amount
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }).notNull(), // 10.00 for 10% or RM10
  minPurchase: decimal("min_purchase", { precision: 10, scale: 2 }).notNull().default("0"), // Minimum purchase amount
  maxDiscount: decimal("max_discount", { precision: 10, scale: 2 }), // Max discount cap (for percentage)
  maxUsagePerCustomer: integer("max_usage_per_customer").notNull().default(1), // How many times each customer can use
  maxTotalUsage: integer("max_total_usage"), // Total usage limit (null = unlimited)
  currentUsage: integer("current_usage").notNull().default(0), // Current total usage
  validFrom: timestamp("valid_from").notNull().defaultNow(), // When voucher becomes valid
  validUntil: timestamp("valid_until"), // Expiry date (null = no expiry)
  isActive: integer("is_active").notNull().default(1), // 1=active, 0=deactivated
  createdBy: varchar("created_by"), // Optional: which admin/user created this
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Voucher Usage - Track voucher redemptions
export const voucherUsage = pgTable("voucher_usage", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  voucherId: varchar("voucher_id").notNull().references(() => customerVouchers.id, { onDelete: "cascade" }),
  customerId: varchar("customer_id").references(() => customers.id, { onDelete: "set null" }), // null if used without loyalty account
  saleId: varchar("sale_id").references(() => sales.id, { onDelete: "set null" }), // Link to POS sale
  discountApplied: decimal("discount_applied", { precision: 10, scale: 2 }).notNull(), // Actual discount given
  originalAmount: decimal("original_amount", { precision: 10, scale: 2 }).notNull(), // Amount before discount
  finalAmount: decimal("final_amount", { precision: 10, scale: 2 }).notNull(), // Amount after discount
  usedAt: timestamp("used_at").defaultNow().notNull(),
});

// Insert Schemas for Vouchers
export const insertCustomerVoucherSchema = createInsertSchema(customerVouchers).omit({
  id: true,
  userId: true,
  currentUsage: true,
  createdAt: true,
  updatedAt: true,
});

export const insertVoucherUsageSchema = createInsertSchema(voucherUsage).omit({
  id: true,
  usedAt: true,
});

// Type Exports for Vouchers
export type CustomerVoucher = typeof customerVouchers.$inferSelect;
export type InsertCustomerVoucher = z.infer<typeof insertCustomerVoucherSchema>;

export type VoucherUsage = typeof voucherUsage.$inferSelect;
export type InsertVoucherUsage = z.infer<typeof insertVoucherUsageSchema>;

// ========================================
// BOOKING/RESERVATION SYSTEM
// ========================================

// Bookings - Customer pre-orders for events
export const bookings = pgTable("bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  bookingNumber: text("booking_number").notNull().unique(), // e.g., "BK-2024-001"
  
  // Customer Details
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  customerEmail: text("customer_email"),
  customerId: varchar("customer_id").references(() => customers.id, { onDelete: "set null" }), // Link to loyalty customer if exists
  
  // Event Details
  eventType: text("event_type").notNull(), // "Perkahwinan", "Kenduri", "Door Gift", "Jamuan", etc
  eventDate: date("event_date").notNull(), // Date of the event
  eventNotes: text("event_notes"), // Special instructions
  
  // Delivery/Pickup
  deliveryType: bookingDeliveryTypeEnum("delivery_type").notNull(), // pickup or delivery
  deliveryDate: date("delivery_date").notNull(), // When to deliver/pickup
  deliveryTime: text("delivery_time").notNull(), // e.g., "09:00", "14:30"
  deliveryAddress: text("delivery_address"), // Full address if delivery
  deliveryCity: text("delivery_city"),
  deliveryState: text("delivery_state"),
  deliveryPostcode: text("delivery_postcode"),
  
  // Financial
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(), // Total order amount after discount
  discountType: voucherTypeEnum("discount_type"), // percentage or fixed_amount
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }), // Discount value (e.g., 10 for 10% or RM10)
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }), // Calculated discount amount
  depositPaid: decimal("deposit_paid", { precision: 10, scale: 2 }).notNull().default("0"), // Deposit paid
  balanceDue: decimal("balance_due", { precision: 10, scale: 2 }).notNull(), // Remaining balance
  paymentMethod: paymentMethodEnum("payment_method").notNull().default("tunai"),
  
  // Status & Tracking
  status: bookingStatusEnum("status").notNull().default("pending"), // pending, confirmed, in_progress, ready, completed, cancelled
  reminderSent: integer("reminder_sent").notNull().default(0), // 0=not sent, 1=sent
  reminderSentAt: timestamp("reminder_sent_at"),
  
  // Metadata
  notes: text("notes"), // Internal notes
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"), // When booking was completed
});

// Booking Items - Products ordered in the booking
export const bookingItems = pgTable("booking_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bookingId: varchar("booking_id").notNull().references(() => bookings.id, { onDelete: "cascade" }),
  productId: varchar("product_id").notNull().references(() => products.id, { onDelete: "restrict" }),
  productName: text("product_name").notNull(), // Store name for historical record
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(), // Price per unit at time of booking
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(), // quantity * unitPrice
  specialInstructions: text("special_instructions"), // e.g., "Extra chocolate chips", "No nuts"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert Schemas for Bookings
export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  userId: true,
  reminderSent: true,
  reminderSentAt: true,
  createdAt: true,
  updatedAt: true,
  completedAt: true,
});

export const insertBookingItemSchema = createInsertSchema(bookingItems).omit({
  id: true,
  createdAt: true,
});

// Type Exports for Bookings
export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;

export type BookingItem = typeof bookingItems.$inferSelect;
export type InsertBookingItem = z.infer<typeof insertBookingItemSchema>;

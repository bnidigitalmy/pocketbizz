var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/redis.ts
var redis_exports = {};
__export(redis_exports, {
  default: () => redis_default,
  redis: () => redis
});
import { createClient } from "redis";
var REDIS_URL, redis, redis_default;
var init_redis = __esm({
  "server/redis.ts"() {
    REDIS_URL = process.env.REDIS_URL;
    if (!REDIS_URL) {
      console.warn("\u26A0\uFE0F  REDIS_URL not configured - Redis features disabled");
      console.warn("   Sessions will use PostgreSQL (slower but functional)");
      console.warn("   Add Redis database in Railway to enable Redis features");
    }
    redis = REDIS_URL ? createClient({
      url: REDIS_URL,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            console.error("Redis: Max reconnection attempts reached");
            return new Error("Redis reconnection failed");
          }
          const delay = Math.min(retries * 100, 3e3);
          console.log(`Redis: Reconnecting in ${delay}ms (attempt ${retries})`);
          return delay;
        }
      }
    }) : null;
    if (redis) {
      redis.on("error", (err) => {
        console.error("Redis Client Error:", err);
      });
      redis.on("connect", () => {
        console.log("\u2713 Redis connected successfully");
      });
      redis.on("reconnecting", () => {
        console.log("Redis: Reconnecting...");
      });
      redis.on("ready", () => {
        console.log("\u2713 Redis client ready");
      });
      (async () => {
        try {
          await redis.connect();
        } catch (error) {
          console.error("Failed to connect to Redis:", error);
          console.error("Application will continue without Redis (using PostgreSQL for sessions)");
        }
      })();
      process.on("SIGINT", async () => {
        try {
          await redis.quit();
        } catch (err) {
        }
        process.exit(0);
      });
    }
    redis_default = redis;
  }
});

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  UNIT_CONVERSIONS: () => UNIT_CONVERSIONS,
  adminActivityLogs: () => adminActivityLogs,
  auditLogs: () => auditLogs,
  billingHistory: () => billingHistory,
  billingStatusEnum: () => billingStatusEnum,
  bookingDeliveryTypeEnum: () => bookingDeliveryTypeEnum,
  bookingItems: () => bookingItems,
  bookingStatusEnum: () => bookingStatusEnum,
  bookings: () => bookings,
  broadcastCampaigns: () => broadcastCampaigns,
  broadcastChannelEnum: () => broadcastChannelEnum,
  broadcastMessages: () => broadcastMessages,
  broadcastStatusEnum: () => broadcastStatusEnum,
  businessProfile: () => businessProfile,
  categories: () => categories,
  claimItems: () => claimItems,
  claimPhotos: () => claimPhotos,
  claimStatusEnum: () => claimStatusEnum,
  commissionTypeEnum: () => commissionTypeEnum,
  convertUnit: () => convertUnit,
  customerVouchers: () => customerVouchers,
  customers: () => customers,
  deliveries: () => deliveries,
  deliveriesRelations: () => deliveriesRelations,
  deliveryItems: () => deliveryItems,
  deliveryItemsRelations: () => deliveryItemsRelations,
  deliveryStatusEnum: () => deliveryStatusEnum,
  earlyBirdTracking: () => earlyBirdTracking,
  expenseCategoryEnum: () => expenseCategoryEnum,
  expenses: () => expenses,
  goals: () => goals,
  googleDriveSyncLog: () => googleDriveSyncLog,
  ingredients: () => ingredients,
  ingredientsRelations: () => ingredientsRelations,
  insertAdminActivityLogSchema: () => insertAdminActivityLogSchema,
  insertBillingHistorySchema: () => insertBillingHistorySchema,
  insertBookingItemSchema: () => insertBookingItemSchema,
  insertBookingSchema: () => insertBookingSchema,
  insertBroadcastCampaignSchema: () => insertBroadcastCampaignSchema,
  insertBroadcastMessageSchema: () => insertBroadcastMessageSchema,
  insertBusinessProfileSchema: () => insertBusinessProfileSchema,
  insertCategorySchema: () => insertCategorySchema,
  insertClaimItemSchema: () => insertClaimItemSchema,
  insertClaimPhotoSchema: () => insertClaimPhotoSchema,
  insertCustomerSchema: () => insertCustomerSchema,
  insertCustomerVoucherSchema: () => insertCustomerVoucherSchema,
  insertDeliveryItemSchema: () => insertDeliveryItemSchema,
  insertDeliverySchema: () => insertDeliverySchema,
  insertEarlyBirdTrackingSchema: () => insertEarlyBirdTrackingSchema,
  insertExpenseSchema: () => insertExpenseSchema,
  insertGoalSchema: () => insertGoalSchema,
  insertGoogleDriveSyncLogSchema: () => insertGoogleDriveSyncLogSchema,
  insertIngredientSchema: () => insertIngredientSchema,
  insertLoyaltyPointsHistorySchema: () => insertLoyaltyPointsHistorySchema,
  insertMessageTemplateSchema: () => insertMessageTemplateSchema,
  insertNotificationSchema: () => insertNotificationSchema,
  insertPOTemplateItemSchema: () => insertPOTemplateItemSchema,
  insertPOTemplateSchema: () => insertPOTemplateSchema,
  insertPaymentClaimDeliverySchema: () => insertPaymentClaimDeliverySchema,
  insertPaymentClaimItemSchema: () => insertPaymentClaimItemSchema,
  insertPaymentClaimSchema: () => insertPaymentClaimSchema,
  insertPendingBillSchema: () => insertPendingBillSchema,
  insertPricingTierSchema: () => insertPricingTierSchema,
  insertProductSchema: () => insertProductSchema,
  insertProductionBatchSchema: () => insertProductionBatchSchema,
  insertPromoCodeSchema: () => insertPromoCodeSchema,
  insertPurchaseOrderItemSchema: () => insertPurchaseOrderItemSchema,
  insertPurchaseOrderSchema: () => insertPurchaseOrderSchema,
  insertRecipeItemSchema: () => insertRecipeItemSchema,
  insertResellerSchema: () => insertResellerSchema,
  insertResellerTransferItemSchema: () => insertResellerTransferItemSchema,
  insertResellerTransferSchema: () => insertResellerTransferSchema,
  insertSaleSchema: () => insertSaleSchema,
  insertSalesItemSchema: () => insertSalesItemSchema,
  insertShoppingCartSchema: () => insertShoppingCartSchema,
  insertStockItemSchema: () => insertStockItemSchema,
  insertStockMovementSchema: () => insertStockMovementSchema,
  insertStoreAnalyticsSchema: () => insertStoreAnalyticsSchema,
  insertStoreSettingsSchema: () => insertStoreSettingsSchema,
  insertSubscriptionPlanSchema: () => insertSubscriptionPlanSchema,
  insertSupplierSchema: () => insertSupplierSchema,
  insertUserSchema: () => insertUserSchema,
  insertUserSubscriptionSchema: () => insertUserSubscriptionSchema,
  insertVendorClaimSchema: () => insertVendorClaimSchema,
  insertVendorCommissionSchema: () => insertVendorCommissionSchema,
  insertVendorSaleSchema: () => insertVendorSaleSchema,
  insertVendorSchema: () => insertVendorSchema,
  insertVendorStockBalanceSchema: () => insertVendorStockBalanceSchema,
  insertVoucherUsageSchema: () => insertVoucherUsageSchema,
  loyaltyPointsHistory: () => loyaltyPointsHistory,
  messageTemplateTypeEnum: () => messageTemplateTypeEnum,
  messageTemplates: () => messageTemplates,
  notificationPriorityEnum: () => notificationPriorityEnum,
  notificationTypeEnum: () => notificationTypeEnum,
  notifications: () => notifications2,
  passwordResetTokens: () => passwordResetTokens,
  paymentClaimDeliveries: () => paymentClaimDeliveries,
  paymentClaimItems: () => paymentClaimItems,
  paymentClaims: () => paymentClaims,
  paymentMethodEnum: () => paymentMethodEnum,
  paymentStatusEnum: () => paymentStatusEnum,
  pendingBills: () => pendingBills,
  poTemplateItems: () => poTemplateItems,
  poTemplateItemsRelations: () => poTemplateItemsRelations,
  poTemplates: () => poTemplates,
  poTemplatesRelations: () => poTemplatesRelations,
  pricingTiers: () => pricingTiers,
  productionBatches: () => productionBatches,
  productionBatchesRelations: () => productionBatchesRelations,
  products: () => products,
  productsRelations: () => productsRelations,
  promoCodeTypeEnum: () => promoCodeTypeEnum,
  promoCodeUsage: () => promoCodeUsage,
  promoCodes: () => promoCodes,
  purchaseOrderItems: () => purchaseOrderItems,
  purchaseOrderItemsRelations: () => purchaseOrderItemsRelations,
  purchaseOrderStatusEnum: () => purchaseOrderStatusEnum,
  purchaseOrders: () => purchaseOrders,
  purchaseOrdersRelations: () => purchaseOrdersRelations,
  recipeItems: () => recipeItems,
  recipeItemsRelations: () => recipeItemsRelations,
  resellerPaymentStatusEnum: () => resellerPaymentStatusEnum,
  resellerTransferItems: () => resellerTransferItems,
  resellerTransfers: () => resellerTransfers,
  resellers: () => resellers,
  sales: () => sales,
  salesItems: () => salesItems,
  salesItemsRelations: () => salesItemsRelations,
  salesRelations: () => salesRelations,
  shoppingCart: () => shoppingCart,
  shoppingCartRelations: () => shoppingCartRelations,
  stockItems: () => stockItems,
  stockItemsRelations: () => stockItemsRelations,
  stockMovementTypeEnum: () => stockMovementTypeEnum,
  stockMovements: () => stockMovements,
  storeAnalytics: () => storeAnalytics,
  storeSettings: () => storeSettings,
  storeThemeEnum: () => storeThemeEnum,
  subscriptionPlans: () => subscriptionPlans2,
  subscriptionStatusEnum: () => subscriptionStatusEnum,
  suppliers: () => suppliers,
  suppliersRelations: () => suppliersRelations,
  userSubscriptions: () => userSubscriptions2,
  users: () => users,
  vendorClaims: () => vendorClaims,
  vendorCommissions: () => vendorCommissions,
  vendorCommissionsRelations: () => vendorCommissionsRelations,
  vendorSales: () => vendorSales,
  vendorStockBalance: () => vendorStockBalance,
  vendors: () => vendors,
  vendorsRelations: () => vendorsRelations,
  voucherStatusEnum: () => voucherStatusEnum,
  voucherTypeEnum: () => voucherTypeEnum,
  voucherUsage: () => voucherUsage
});
import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  integer,
  decimal,
  timestamp,
  date,
  pgEnum,
  json,
  unique,
  index
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
function convertUnit(quantity, fromUnit, toUnit) {
  const from = fromUnit.toLowerCase().trim();
  const to = toUnit.toLowerCase().trim();
  if (from === to) return quantity;
  if (!UNIT_CONVERSIONS[from]) {
    console.warn(`\u26A0\uFE0F Unit conversion warning: Unknown source unit "${fromUnit}". Returning original quantity. This may cause incorrect cost calculations!`);
    return quantity;
  }
  if (!UNIT_CONVERSIONS[from][to]) {
    console.warn(`\u26A0\uFE0F Unit conversion warning: Cannot convert from "${fromUnit}" to "${toUnit}". Incompatible units! Returning original quantity. This WILL cause incorrect cost calculations!`);
    return quantity;
  }
  const converted = quantity * UNIT_CONVERSIONS[from][to];
  if (process.env.NODE_ENV !== "production") {
    console.log(`\u{1F504} Unit conversion: ${quantity} ${fromUnit} \u2192 ${converted.toFixed(4)} ${toUnit}`);
  }
  return converted;
}
var UNIT_CONVERSIONS, deliveryStatusEnum, paymentStatusEnum, expenseCategoryEnum, commissionTypeEnum, paymentMethodEnum, subscriptionStatusEnum, promoCodeTypeEnum, billingStatusEnum, resellerPaymentStatusEnum, broadcastChannelEnum, broadcastStatusEnum, messageTemplateTypeEnum, voucherTypeEnum, voucherStatusEnum, bookingStatusEnum, bookingDeliveryTypeEnum, purchaseOrderStatusEnum, claimStatusEnum, storeThemeEnum, notificationTypeEnum, notificationPriorityEnum, stockItems, stockMovementTypeEnum, stockMovements, categories, products, recipeItems, ingredients, productionBatches, vendors, suppliers, deliveries, deliveryItems, vendorSales, vendorClaims, claimItems, claimPhotos, vendorStockBalance, paymentClaims, paymentClaimItems, paymentClaimDeliveries, sales, salesItems, expenses, businessProfile, googleDriveSyncLog, vendorCommissions, shoppingCart, purchaseOrders, purchaseOrderItems, poTemplates, poTemplateItems, stockItemsRelations, recipeItemsRelations, productsRelations, ingredientsRelations, productionBatchesRelations, vendorsRelations, suppliersRelations, vendorCommissionsRelations, shoppingCartRelations, purchaseOrdersRelations, purchaseOrderItemsRelations, poTemplatesRelations, poTemplateItemsRelations, deliveriesRelations, deliveryItemsRelations, salesRelations, salesItemsRelations, insertStockItemSchema, insertStockMovementSchema, insertCategorySchema, insertRecipeItemSchema, insertProductSchema, insertIngredientSchema, insertProductionBatchSchema, insertVendorSchema, insertSupplierSchema, insertDeliverySchema, insertDeliveryItemSchema, insertVendorSaleSchema, insertVendorClaimSchema, insertClaimItemSchema, insertClaimPhotoSchema, insertPaymentClaimSchema, insertPaymentClaimItemSchema, insertPaymentClaimDeliverySchema, insertVendorStockBalanceSchema, insertSaleSchema, insertSalesItemSchema, insertExpenseSchema, insertBusinessProfileSchema, insertGoogleDriveSyncLogSchema, insertVendorCommissionSchema, insertShoppingCartSchema, insertPurchaseOrderSchema, insertPurchaseOrderItemSchema, insertPOTemplateSchema, insertPOTemplateItemSchema, users, passwordResetTokens, notifications2, subscriptionPlans2, userSubscriptions2, promoCodes, promoCodeUsage, billingHistory, earlyBirdTracking, pendingBills, goals, auditLogs, insertUserSchema, insertNotificationSchema, insertSubscriptionPlanSchema, insertUserSubscriptionSchema, insertPromoCodeSchema, insertPendingBillSchema, insertBillingHistorySchema, insertGoalSchema, insertEarlyBirdTrackingSchema, pricingTiers, resellers, resellerTransfers, resellerTransferItems, insertPricingTierSchema, insertResellerSchema, insertResellerTransferSchema, insertResellerTransferItemSchema, customers, loyaltyPointsHistory, insertCustomerSchema, insertLoyaltyPointsHistorySchema, messageTemplates, broadcastCampaigns, broadcastMessages, insertMessageTemplateSchema, insertBroadcastCampaignSchema, insertBroadcastMessageSchema, customerVouchers, voucherUsage, insertCustomerVoucherSchema, insertVoucherUsageSchema, bookings, bookingItems, insertBookingSchema, insertBookingItemSchema, storeSettings, adminActivityLogs, storeAnalytics, insertStoreSettingsSchema, insertStoreAnalyticsSchema, insertAdminActivityLogSchema;
var init_schema = __esm({
  "shared/schema.ts"() {
    UNIT_CONVERSIONS = {
      // Weight conversions
      "kg": { "kg": 1, "gram": 1e3, "g": 1e3 },
      "gram": { "kg": 1e-3, "gram": 1, "g": 1 },
      "g": { "kg": 1e-3, "gram": 1, "g": 1 },
      // Volume conversions
      "liter": { "liter": 1, "l": 1, "ml": 1e3, "tbsp": 66.67, "tsp": 200 },
      "l": { "liter": 1, "l": 1, "ml": 1e3, "tbsp": 66.67, "tsp": 200 },
      "ml": { "liter": 1e-3, "l": 1e-3, "ml": 1, "tbsp": 0.0667, "tsp": 0.2 },
      "tbsp": { "liter": 0.015, "l": 0.015, "ml": 15, "tbsp": 1, "tsp": 3 },
      "tsp": { "liter": 5e-3, "l": 5e-3, "ml": 5, "tbsp": 0.333, "tsp": 1 },
      // Count conversions
      "dozen": { "dozen": 1, "pcs": 12, "pieces": 12 },
      "pcs": { "dozen": 0.0833, "pcs": 1, "pieces": 1 },
      "pieces": { "dozen": 0.0833, "pcs": 1, "pieces": 1 }
    };
    deliveryStatusEnum = pgEnum("delivery_status", ["delivered", "claimed", "pending", "rejected"]);
    paymentStatusEnum = pgEnum("payment_status", ["pending", "partial", "settled"]);
    expenseCategoryEnum = pgEnum("expense_category", ["bahan", "minyak", "upah", "plastik", "lain"]);
    commissionTypeEnum = pgEnum("commission_type", ["fixed_range", "percentage"]);
    paymentMethodEnum = pgEnum("payment_method", ["tunai", "online", "qr"]);
    subscriptionStatusEnum = pgEnum("subscription_status", ["active", "canceled", "past_due", "trialing", "incomplete", "expired", "superseded"]);
    promoCodeTypeEnum = pgEnum("promo_code_type", ["percentage", "fixed_amount"]);
    billingStatusEnum = pgEnum("billing_status", ["succeeded", "failed", "pending", "refunded"]);
    resellerPaymentStatusEnum = pgEnum("reseller_payment_status", ["paid", "pending"]);
    broadcastChannelEnum = pgEnum("broadcast_channel", ["email", "whatsapp", "sms"]);
    broadcastStatusEnum = pgEnum("broadcast_status", ["draft", "pending", "sending", "sent", "failed"]);
    messageTemplateTypeEnum = pgEnum("message_template_type", ["promo", "new_product", "voucher", "general"]);
    voucherTypeEnum = pgEnum("voucher_type", ["percentage", "fixed_amount"]);
    voucherStatusEnum = pgEnum("voucher_status", ["active", "used", "expired", "cancelled"]);
    bookingStatusEnum = pgEnum("booking_status", ["pending", "confirmed", "in_progress", "ready", "completed", "cancelled"]);
    bookingDeliveryTypeEnum = pgEnum("booking_delivery_type", ["pickup", "delivery"]);
    purchaseOrderStatusEnum = pgEnum("purchase_order_status", ["draft", "sent", "received", "cancelled"]);
    claimStatusEnum = pgEnum("claim_status", ["pending", "approved", "rejected"]);
    storeThemeEnum = pgEnum("store_theme", ["light", "dark", "custom"]);
    notificationTypeEnum = pgEnum("notification_type", ["order", "payment", "stock", "reminder", "delivery", "booking", "system"]);
    notificationPriorityEnum = pgEnum("notification_priority", ["low", "medium", "high", "urgent"]);
    stockItems = pgTable("stock_items", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      name: text("name").notNull(),
      // e.g., "Tepung Gandum", "Gula Pasir", "Telur"
      unit: text("unit").notNull(),
      // e.g., "kg", "gram", "liter", "ml", "pcs"
      packageSize: decimal("package_size", { precision: 10, scale: 2 }).notNull().default("1"),
      // Size of package purchased (e.g., 500 for 500gram, 1.4 for 1.4kg)
      purchasePrice: decimal("purchase_price", { precision: 10, scale: 2 }).notNull(),
      // Total price for the PACKAGE (e.g., RM21.90 for 500gram package)
      currentQuantity: decimal("current_quantity", { precision: 10, scale: 2 }).notNull().default("0"),
      // Current stock quantity in warehouse (in base units)
      lowStockThreshold: decimal("low_stock_threshold", { precision: 10, scale: 2 }).notNull().default("5"),
      // Alert when below this
      notes: text("notes"),
      // Optional notes
      version: integer("version").notNull().default(0),
      // Optimistic locking: increments on every update to prevent concurrent modification issues
      isArchived: integer("is_archived").notNull().default(0),
      // 1 = archived (when user downgrades), 0 = active
      createdAt: timestamp("created_at").defaultNow().notNull(),
      updatedAt: timestamp("updated_at").defaultNow().notNull()
    });
    stockMovementTypeEnum = pgEnum("stock_movement_type", [
      "purchase",
      // Initial stock purchase
      "replenish",
      // Stock replenishment (adding more)
      "adjust",
      // Manual quantity adjustment
      "production_use",
      // Used in production/recipe
      "waste",
      // Damaged/expired/wasted
      "return",
      // Returned to supplier
      "transfer",
      // Transfer between locations (future)
      "correction"
      // Inventory correction/audit
    ]);
    stockMovements = pgTable("stock_movements", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      stockItemId: varchar("stock_item_id").notNull().references(() => stockItems.id, { onDelete: "cascade" }),
      movementType: stockMovementTypeEnum("movement_type").notNull(),
      quantityBefore: decimal("quantity_before", { precision: 10, scale: 2 }).notNull(),
      // Quantity before change
      quantityChange: decimal("quantity_change", { precision: 10, scale: 2 }).notNull(),
      // Positive = increase, Negative = decrease
      quantityAfter: decimal("quantity_after", { precision: 10, scale: 2 }).notNull(),
      // Quantity after change
      reason: text("reason"),
      // Optional explanation (e.g., "Replenished from Supplier X", "Used in Batch #123")
      referenceId: varchar("reference_id"),
      // Link to related entity (purchase order ID, production batch ID, etc.)
      referenceType: text("reference_type"),
      // Type of reference (e.g., "purchase_order", "production_batch", "manual")
      createdBy: varchar("created_by").references(() => users.id),
      // Who made the change
      createdAt: timestamp("created_at").defaultNow().notNull()
    });
    categories = pgTable("categories", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      name: text("name").notNull(),
      // Category name must be unique within user scope
      createdAt: timestamp("created_at").defaultNow().notNull()
    });
    products = pgTable("products", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      name: text("name").notNull(),
      category: text("category").notNull(),
      imageUrl: text("image_url"),
      unitsPerBatch: integer("units_per_batch").notNull().default(1),
      // How many units 1 recipe produces
      labourCost: decimal("labour_cost", { precision: 10, scale: 2 }).notNull().default("0"),
      // Labour cost per batch
      otherCosts: decimal("other_costs", { precision: 10, scale: 2 }).notNull().default("0"),
      // Gas, electricity, etc per batch
      packagingCost: decimal("packaging_cost", { precision: 10, scale: 2 }).notNull().default("0"),
      // Packaging cost per unit (e.g., RM0.238 per piece)
      materialsCost: decimal("materials_cost", { precision: 10, scale: 2 }).notNull().default("0"),
      // Auto-calculated from recipe items
      totalCostPerBatch: decimal("total_cost_per_batch", { precision: 10, scale: 2 }).notNull().default("0"),
      // materials + labour + other + packaging
      costPerUnit: decimal("cost_per_unit", { precision: 10, scale: 2 }).notNull().default("0"),
      // totalCostPerBatch / unitsPerBatch
      suggestedMargin: decimal("suggested_margin", { precision: 5, scale: 2 }).notNull().default("30"),
      // Suggested profit margin %
      suggestedPrice: decimal("suggested_price", { precision: 10, scale: 2 }).notNull().default("0"),
      // Auto-calculated: costPerUnit * (1 + suggestedMargin/100)
      sellingPrice: decimal("selling_price", { precision: 10, scale: 2 }).notNull().default("0"),
      // User-set selling price
      isArchived: integer("is_archived").notNull().default(0),
      // 1 = archived (when user downgrades), 0 = active
      createdAt: timestamp("created_at").defaultNow().notNull(),
      updatedAt: timestamp("updated_at").defaultNow().notNull()
    });
    recipeItems = pgTable("recipe_items", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      productId: varchar("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
      stockItemId: varchar("stock_item_id").notNull().references(() => stockItems.id, { onDelete: "cascade" }),
      quantityNeeded: decimal("quantity_needed", { precision: 10, scale: 2 }).notNull(),
      // How much of stock item needed for 1 batch
      usageUnit: text("usage_unit").notNull(),
      // Unit used in recipe (can differ from stock purchase unit) e.g., "gram" when stock is "kg"
      costPerRecipe: decimal("cost_per_recipe", { precision: 10, scale: 2 }).notNull()
      // Calculated: converted quantity * stockItem.purchasePrice
    });
    ingredients = pgTable("ingredients", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      productId: varchar("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
      name: text("name").notNull(),
      quantity: text("quantity").notNull(),
      unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
      totalCost: decimal("total_cost", { precision: 10, scale: 2 }).notNull()
    });
    productionBatches = pgTable("production_batches", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      productId: varchar("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
      productName: text("product_name").notNull(),
      quantity: integer("quantity").notNull(),
      remainingQty: decimal("remaining_qty", { precision: 10, scale: 2 }).notNull().default("0"),
      // Tracks remaining finished goods in this batch
      batchDate: date("batch_date").notNull(),
      expiryDate: date("expiry_date"),
      totalCost: decimal("total_cost", { precision: 10, scale: 2 }).notNull(),
      notes: text("notes"),
      // Optional notes for production batch
      createdAt: timestamp("created_at").defaultNow().notNull()
    });
    vendors = pgTable("vendors", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      name: text("name").notNull(),
      phone: text("phone"),
      address: text("address"),
      isArchived: integer("is_archived").notNull().default(0),
      // 1 = archived (when user downgrades), 0 = active
      createdAt: timestamp("created_at").defaultNow().notNull()
    });
    suppliers = pgTable("suppliers", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      name: text("name").notNull(),
      phone: text("phone"),
      address: text("address"),
      email: text("email"),
      // For sending POs via email
      createdAt: timestamp("created_at").defaultNow().notNull()
    });
    deliveries = pgTable("deliveries", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      invoiceNumber: text("invoice_number").unique(),
      // Format: INV-YYYYMMDD-XXXX
      vendorId: varchar("vendor_id").notNull().references(() => vendors.id, { onDelete: "cascade" }),
      vendorName: text("vendor_name").notNull(),
      deliveryDate: date("delivery_date").notNull(),
      status: deliveryStatusEnum("status").notNull().default("delivered"),
      paymentStatus: paymentStatusEnum("payment_status").notNull().default("pending"),
      totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
      createdAt: timestamp("created_at").defaultNow().notNull()
    });
    deliveryItems = pgTable("delivery_items", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      deliveryId: varchar("delivery_id").notNull().references(() => deliveries.id, { onDelete: "cascade" }),
      productId: varchar("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
      productName: text("product_name").notNull(),
      quantity: integer("quantity").notNull(),
      unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
      // Price charged to vendor
      retailPrice: decimal("retail_price", { precision: 10, scale: 2 }),
      // Retail/suggested price for reference
      totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
      rejectedQty: integer("rejected_qty").default(0),
      // Number of items rejected by vendor
      rejectionReason: text("rejection_reason")
      // Reason for rejection (optional)
    });
    vendorSales = pgTable("vendor_sales", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      vendorId: varchar("vendor_id").notNull().references(() => vendors.id, { onDelete: "cascade" }),
      vendorName: text("vendor_name").notNull(),
      deliveryId: varchar("delivery_id").references(() => deliveries.id, { onDelete: "set null" }),
      // Link to original delivery
      productId: varchar("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
      productName: text("product_name").notNull(),
      quantitySold: integer("quantity_sold").notNull(),
      // How many vendor sold
      saleDate: date("sale_date").notNull(),
      // When vendor reported the sale
      notes: text("notes"),
      // Optional notes
      createdAt: timestamp("created_at").defaultNow().notNull()
    });
    vendorClaims = pgTable("vendor_claims", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      vendorId: varchar("vendor_id").notNull().references(() => vendors.id, { onDelete: "cascade" }),
      vendorName: text("vendor_name").notNull(),
      deliveryId: varchar("delivery_id").references(() => deliveries.id, { onDelete: "set null" }),
      // Related delivery (optional)
      claimNumber: text("claim_number").unique(),
      // Format: CLM-YYYYMMDD-XXXX
      claimDate: date("claim_date").notNull(),
      status: claimStatusEnum("status").notNull().default("pending"),
      totalClaimAmount: decimal("total_claim_amount", { precision: 10, scale: 2 }).notNull(),
      approvedAmount: decimal("approved_amount", { precision: 10, scale: 2 }).default("0"),
      reviewNotes: text("review_notes"),
      // Notes from bakery during review
      reviewedAt: timestamp("reviewed_at"),
      // When claim was reviewed
      reviewedBy: varchar("reviewed_by").references(() => users.id, { onDelete: "set null" }),
      // Who reviewed
      createdAt: timestamp("created_at").defaultNow().notNull()
    });
    claimItems = pgTable("claim_items", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      claimId: varchar("claim_id").notNull().references(() => vendorClaims.id, { onDelete: "cascade" }),
      productId: varchar("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
      productName: text("product_name").notNull(),
      quantityClaimed: integer("quantity_claimed").notNull(),
      // How many items claimed
      unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
      // Price per unit
      totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
      // quantityClaimed * unitPrice
      claimReason: text("claim_reason").notNull(),
      // Why claiming (rosak, expired, etc)
      approvedQty: integer("approved_qty").default(0)
      // Approved quantity after review
    });
    claimPhotos = pgTable("claim_photos", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      claimId: varchar("claim_id").notNull().references(() => vendorClaims.id, { onDelete: "cascade" }),
      photoUrl: text("photo_url").notNull(),
      // Google Drive URL
      caption: text("caption"),
      // Optional description
      uploadedAt: timestamp("uploaded_at").defaultNow().notNull()
    });
    vendorStockBalance = pgTable("vendor_stock_balance", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      vendorId: varchar("vendor_id").notNull().references(() => vendors.id, { onDelete: "cascade" }),
      productId: varchar("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
      currentStock: integer("current_stock").notNull().default(0),
      // Current stock at vendor
      lastDeliveryDate: date("last_delivery_date"),
      // Last delivery date
      lastSaleDate: date("last_sale_date"),
      // Last sale date
      updatedAt: timestamp("updated_at").defaultNow().notNull()
    });
    paymentClaims = pgTable("payment_claims", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      vendorId: varchar("vendor_id").notNull().references(() => vendors.id, { onDelete: "cascade" }),
      vendorName: text("vendor_name").notNull(),
      claimNumber: text("claim_number").unique(),
      // Format: CLM-PAY-YYYYMMDD-XXXX
      claimDate: date("claim_date").notNull(),
      status: text("status").notNull().default("draft"),
      // draft, submitted, paid
      totalGross: decimal("total_gross", { precision: 10, scale: 2 }).notNull().default("0"),
      totalCommission: decimal("total_commission", { precision: 10, scale: 2 }).notNull().default("0"),
      totalClaimable: decimal("total_claimable", { precision: 10, scale: 2 }).notNull().default("0"),
      notes: text("notes"),
      createdAt: timestamp("created_at").defaultNow().notNull(),
      updatedAt: timestamp("updated_at").defaultNow().notNull()
    });
    paymentClaimItems = pgTable("payment_claim_items", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      claimId: varchar("claim_id").notNull().references(() => paymentClaims.id, { onDelete: "cascade" }),
      deliveryItemId: varchar("delivery_item_id").references(() => deliveryItems.id, { onDelete: "set null" }),
      productId: varchar("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
      productName: text("product_name").notNull(),
      unit: text("unit").notNull(),
      quantityDelivered: integer("quantity_delivered").notNull(),
      quantitySold: integer("quantity_sold").notNull(),
      quantityExpired: integer("quantity_expired").notNull().default(0),
      quantityReturned: integer("quantity_returned").notNull().default(0),
      unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
      commissionRate: integer("commission_rate").notNull(),
      // Percentage
      commissionAmount: decimal("commission_amount", { precision: 10, scale: 2 }).notNull(),
      grossAmount: decimal("gross_amount", { precision: 10, scale: 2 }).notNull(),
      claimableAmount: decimal("claimable_amount", { precision: 10, scale: 2 }).notNull()
    });
    paymentClaimDeliveries = pgTable("payment_claim_deliveries", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      claimId: varchar("claim_id").notNull().references(() => paymentClaims.id, { onDelete: "cascade" }),
      deliveryId: varchar("delivery_id").notNull().references(() => deliveries.id, { onDelete: "cascade" })
    });
    sales = pgTable("sales", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      receiptNumber: text("receipt_number").notNull().unique(),
      // Format: RES-YYYYMMDD-XXXX
      customerName: text("customer_name"),
      // Optional customer name
      customerId: varchar("customer_id").references(() => customers.id, { onDelete: "set null" }),
      // Link to customer for loyalty
      paymentMethod: paymentMethodEnum("payment_method").notNull().default("tunai"),
      // tunai, online, kredit
      totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
      // Total sale amount
      totalCost: decimal("total_cost", { precision: 10, scale: 2 }).notNull().default("0"),
      // Total cost (for profit calc)
      profitAmount: decimal("profit_amount", { precision: 10, scale: 2 }).notNull().default("0"),
      // totalAmount - totalCost
      saleDate: date("sale_date").notNull(),
      notes: text("notes"),
      // Optional notes
      createdAt: timestamp("created_at").defaultNow().notNull()
    });
    salesItems = pgTable("sales_items", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      saleId: varchar("sale_id").notNull().references(() => sales.id, { onDelete: "cascade" }),
      productId: varchar("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
      productName: text("product_name").notNull(),
      quantity: integer("quantity").notNull(),
      unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
      // Selling price
      unitCost: decimal("unit_cost", { precision: 10, scale: 2 }).notNull().default("0"),
      // Cost price (from product.costPerUnit)
      totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
      // quantity * unitPrice
      totalCost: decimal("total_cost", { precision: 10, scale: 2 }).notNull().default("0"),
      // quantity * unitCost
      profitAmount: decimal("profit_amount", { precision: 10, scale: 2 }).notNull().default("0"),
      // totalPrice - totalCost
      batchId: varchar("batch_id").references(() => productionBatches.id, { onDelete: "set null" })
      // For FIFO tracking
    });
    expenses = pgTable("expenses", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      category: expenseCategoryEnum("category").notNull(),
      description: text("description").notNull(),
      amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
      expenseDate: date("expense_date").notNull(),
      receiptUrl: text("receipt_url"),
      createdAt: timestamp("created_at").defaultNow().notNull()
    });
    businessProfile = pgTable("business_profile", {
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
      paymentQrCode: text("payment_qr_code"),
      // DuitNow / Bank QR code image URL
      createdAt: timestamp("created_at").defaultNow().notNull(),
      updatedAt: timestamp("updated_at").defaultNow().notNull()
    });
    googleDriveSyncLog = pgTable("google_drive_sync_log", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      deliveryId: varchar("delivery_id").references(() => deliveries.id, { onDelete: "cascade" }),
      fileName: text("file_name").notNull(),
      fileType: text("file_type").notNull(),
      // 'invoice', 'claim_statement', 'thermal_invoice', 'thermal_claim'
      driveFileId: text("drive_file_id").notNull(),
      driveWebViewLink: text("drive_web_view_link"),
      syncedAt: timestamp("synced_at").defaultNow().notNull(),
      vendorId: varchar("vendor_id").references(() => vendors.id, { onDelete: "set null" }),
      vendorName: text("vendor_name")
    });
    vendorCommissions = pgTable("vendor_commissions", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      vendorId: varchar("vendor_id").notNull().references(() => vendors.id, { onDelete: "cascade" }),
      commissionType: commissionTypeEnum("commission_type").notNull(),
      // For percentage type
      percentage: decimal("percentage", { precision: 5, scale: 2 }),
      // e.g., 10.00, 15.50, 20.00
      // For fixed_range type - store as JSON array: [{min: 1, max: 5, amount: 1.00}, {min: 5.01, max: 10, amount: 1.50}]
      ranges: text("ranges"),
      createdAt: timestamp("created_at").defaultNow().notNull(),
      updatedAt: timestamp("updated_at").defaultNow().notNull()
    });
    shoppingCart = pgTable("shopping_cart", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      stockItemId: varchar("stock_item_id").notNull().references(() => stockItems.id, { onDelete: "cascade" }),
      stockItemName: text("stock_item_name").notNull(),
      // Denormalized for easy display
      shortageQty: decimal("shortage_qty", { precision: 10, scale: 2 }).notNull(),
      // Exact shortage quantity
      unit: text("unit").notNull(),
      // Unit of measurement
      productionBatchId: varchar("production_batch_id").references(() => productionBatches.id, { onDelete: "set null" }),
      // Optional: link to production batch
      productName: text("product_name"),
      // Optional: product name if related to production
      notes: text("notes"),
      // Optional notes
      createdAt: timestamp("created_at").defaultNow().notNull()
    });
    purchaseOrders = pgTable("purchase_orders", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      poNumber: text("po_number").notNull().unique(),
      // PO-20251025-001
      supplierId: varchar("supplier_id").references(() => suppliers.id, { onDelete: "set null" }),
      supplierName: text("supplier_name").notNull(),
      // Denormalized
      supplierPhone: text("supplier_phone"),
      // Denormalized for easy contact
      supplierEmail: text("supplier_email"),
      // Supplier email for sending PO
      supplierAddress: text("supplier_address"),
      // Supplier business address
      deliveryAddress: text("delivery_address"),
      // Delivery/shipping address for this order
      status: purchaseOrderStatusEnum("status").default("draft").notNull(),
      totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).default("0").notNull(),
      notes: text("notes"),
      sentAt: timestamp("sent_at"),
      receivedAt: timestamp("received_at"),
      expenseId: varchar("expense_id").references(() => expenses.id, { onDelete: "set null" }),
      // Link to expense when received
      createdAt: timestamp("created_at").defaultNow().notNull(),
      updatedAt: timestamp("updated_at").defaultNow().notNull()
    });
    purchaseOrderItems = pgTable("purchase_order_items", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      poId: varchar("po_id").notNull().references(() => purchaseOrders.id, { onDelete: "cascade" }),
      stockItemId: varchar("stock_item_id").references(() => stockItems.id, { onDelete: "set null" }),
      itemName: text("item_name").notNull(),
      // Denormalized
      quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
      unit: text("unit").notNull(),
      estimatedPrice: decimal("estimated_price", { precision: 10, scale: 2 }).default("0"),
      // Per unit estimate
      actualPrice: decimal("actual_price", { precision: 10, scale: 2 }),
      // Actual price when received
      notes: text("notes")
    });
    poTemplates = pgTable("po_templates", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      templateName: text("template_name").notNull(),
      // User-friendly name
      supplierId: varchar("supplier_id").references(() => suppliers.id, { onDelete: "set null" }),
      supplierName: text("supplier_name").notNull(),
      supplierPhone: text("supplier_phone"),
      notes: text("notes"),
      createdAt: timestamp("created_at").defaultNow().notNull(),
      updatedAt: timestamp("updated_at").defaultNow().notNull()
    });
    poTemplateItems = pgTable("po_template_items", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      templateId: varchar("template_id").notNull().references(() => poTemplates.id, { onDelete: "cascade" }),
      stockItemId: varchar("stock_item_id").references(() => stockItems.id, { onDelete: "set null" }),
      itemName: text("item_name").notNull(),
      quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
      unit: text("unit").notNull(),
      estimatedPrice: decimal("estimated_price", { precision: 10, scale: 2 }).default("0"),
      notes: text("notes")
    });
    stockItemsRelations = relations(stockItems, ({ many }) => ({
      recipeItems: many(recipeItems)
    }));
    recipeItemsRelations = relations(recipeItems, ({ one }) => ({
      product: one(products, {
        fields: [recipeItems.productId],
        references: [products.id]
      }),
      stockItem: one(stockItems, {
        fields: [recipeItems.stockItemId],
        references: [stockItems.id]
      })
    }));
    productsRelations = relations(products, ({ many }) => ({
      ingredients: many(ingredients),
      productionBatches: many(productionBatches),
      recipeItems: many(recipeItems)
    }));
    ingredientsRelations = relations(ingredients, ({ one }) => ({
      product: one(products, {
        fields: [ingredients.productId],
        references: [products.id]
      })
    }));
    productionBatchesRelations = relations(productionBatches, ({ one }) => ({
      product: one(products, {
        fields: [productionBatches.productId],
        references: [products.id]
      })
    }));
    vendorsRelations = relations(vendors, ({ many }) => ({
      deliveries: many(deliveries),
      commissions: many(vendorCommissions)
    }));
    suppliersRelations = relations(suppliers, ({ many }) => ({
      purchaseOrders: many(purchaseOrders),
      templates: many(poTemplates)
    }));
    vendorCommissionsRelations = relations(vendorCommissions, ({ one }) => ({
      vendor: one(vendors, {
        fields: [vendorCommissions.vendorId],
        references: [vendors.id]
      })
    }));
    shoppingCartRelations = relations(shoppingCart, ({ one }) => ({
      stockItem: one(stockItems, {
        fields: [shoppingCart.stockItemId],
        references: [stockItems.id]
      }),
      productionBatch: one(productionBatches, {
        fields: [shoppingCart.productionBatchId],
        references: [productionBatches.id]
      })
    }));
    purchaseOrdersRelations = relations(purchaseOrders, ({ one, many }) => ({
      supplier: one(suppliers, {
        fields: [purchaseOrders.supplierId],
        references: [suppliers.id]
      }),
      items: many(purchaseOrderItems),
      expense: one(expenses, {
        fields: [purchaseOrders.expenseId],
        references: [expenses.id]
      })
    }));
    purchaseOrderItemsRelations = relations(purchaseOrderItems, ({ one }) => ({
      purchaseOrder: one(purchaseOrders, {
        fields: [purchaseOrderItems.poId],
        references: [purchaseOrders.id]
      }),
      stockItem: one(stockItems, {
        fields: [purchaseOrderItems.stockItemId],
        references: [stockItems.id]
      })
    }));
    poTemplatesRelations = relations(poTemplates, ({ one, many }) => ({
      supplier: one(suppliers, {
        fields: [poTemplates.supplierId],
        references: [suppliers.id]
      }),
      items: many(poTemplateItems)
    }));
    poTemplateItemsRelations = relations(poTemplateItems, ({ one }) => ({
      template: one(poTemplates, {
        fields: [poTemplateItems.templateId],
        references: [poTemplates.id]
      }),
      stockItem: one(stockItems, {
        fields: [poTemplateItems.stockItemId],
        references: [stockItems.id]
      })
    }));
    deliveriesRelations = relations(deliveries, ({ one, many }) => ({
      vendor: one(vendors, {
        fields: [deliveries.vendorId],
        references: [vendors.id]
      }),
      items: many(deliveryItems)
    }));
    deliveryItemsRelations = relations(deliveryItems, ({ one }) => ({
      delivery: one(deliveries, {
        fields: [deliveryItems.deliveryId],
        references: [deliveries.id]
      }),
      product: one(products, {
        fields: [deliveryItems.productId],
        references: [products.id]
      })
    }));
    salesRelations = relations(sales, ({ many }) => ({
      items: many(salesItems)
    }));
    salesItemsRelations = relations(salesItems, ({ one }) => ({
      sale: one(sales, {
        fields: [salesItems.saleId],
        references: [sales.id]
      }),
      product: one(products, {
        fields: [salesItems.productId],
        references: [products.id]
      }),
      batch: one(productionBatches, {
        fields: [salesItems.batchId],
        references: [productionBatches.id]
      })
    }));
    insertStockItemSchema = createInsertSchema(stockItems).omit({
      id: true,
      userId: true,
      version: true,
      createdAt: true,
      updatedAt: true
    });
    insertStockMovementSchema = createInsertSchema(stockMovements).omit({
      id: true,
      createdAt: true
    });
    insertCategorySchema = createInsertSchema(categories).omit({
      id: true,
      userId: true,
      createdAt: true
    });
    insertRecipeItemSchema = createInsertSchema(recipeItems).omit({
      id: true
    });
    insertProductSchema = createInsertSchema(products).omit({
      id: true,
      userId: true,
      createdAt: true,
      updatedAt: true
    });
    insertIngredientSchema = createInsertSchema(ingredients).omit({
      id: true,
      userId: true
    });
    insertProductionBatchSchema = createInsertSchema(productionBatches).omit({
      id: true,
      userId: true,
      createdAt: true
    });
    insertVendorSchema = createInsertSchema(vendors).omit({
      id: true,
      userId: true,
      createdAt: true
    });
    insertSupplierSchema = createInsertSchema(suppliers).omit({
      id: true,
      userId: true,
      createdAt: true
    });
    insertDeliverySchema = createInsertSchema(deliveries).omit({
      id: true,
      userId: true,
      createdAt: true
    });
    insertDeliveryItemSchema = createInsertSchema(deliveryItems).omit({
      id: true
    });
    insertVendorSaleSchema = createInsertSchema(vendorSales).omit({
      id: true,
      userId: true,
      createdAt: true
    });
    insertVendorClaimSchema = createInsertSchema(vendorClaims).omit({
      id: true,
      userId: true,
      claimNumber: true,
      approvedAmount: true,
      reviewNotes: true,
      reviewedAt: true,
      reviewedBy: true,
      createdAt: true
    });
    insertClaimItemSchema = createInsertSchema(claimItems).omit({
      id: true,
      approvedQty: true
    });
    insertClaimPhotoSchema = createInsertSchema(claimPhotos).omit({
      id: true,
      uploadedAt: true
    });
    insertPaymentClaimSchema = createInsertSchema(paymentClaims).omit({
      id: true,
      userId: true,
      claimNumber: true,
      createdAt: true,
      updatedAt: true
    });
    insertPaymentClaimItemSchema = createInsertSchema(paymentClaimItems).omit({
      id: true
    });
    insertPaymentClaimDeliverySchema = createInsertSchema(paymentClaimDeliveries).omit({
      id: true
    });
    insertVendorStockBalanceSchema = createInsertSchema(vendorStockBalance).omit({
      id: true,
      updatedAt: true
    });
    insertSaleSchema = createInsertSchema(sales).omit({
      id: true,
      userId: true,
      receiptNumber: true,
      createdAt: true
    });
    insertSalesItemSchema = createInsertSchema(salesItems).omit({
      id: true,
      saleId: true,
      batchId: true
    });
    insertExpenseSchema = createInsertSchema(expenses).omit({
      id: true,
      userId: true,
      createdAt: true
    });
    insertBusinessProfileSchema = createInsertSchema(businessProfile).omit({
      id: true,
      userId: true,
      createdAt: true,
      updatedAt: true
    });
    insertGoogleDriveSyncLogSchema = createInsertSchema(googleDriveSyncLog).omit({
      id: true,
      userId: true,
      syncedAt: true
    });
    insertVendorCommissionSchema = createInsertSchema(vendorCommissions).omit({
      id: true,
      userId: true,
      createdAt: true,
      updatedAt: true
    });
    insertShoppingCartSchema = createInsertSchema(shoppingCart).omit({
      id: true,
      userId: true,
      createdAt: true
    });
    insertPurchaseOrderSchema = createInsertSchema(purchaseOrders).omit({
      id: true,
      userId: true,
      createdAt: true,
      updatedAt: true
    });
    insertPurchaseOrderItemSchema = createInsertSchema(purchaseOrderItems).omit({
      id: true
    });
    insertPOTemplateSchema = createInsertSchema(poTemplates).omit({
      id: true,
      userId: true,
      createdAt: true,
      updatedAt: true
    });
    insertPOTemplateItemSchema = createInsertSchema(poTemplateItems).omit({
      id: true
    });
    users = pgTable("users", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      email: text("email").notNull().unique(),
      password: text("password").notNull(),
      // Hashed password
      name: text("name").notNull(),
      businessName: text("business_name"),
      // Optional business name
      phone: text("phone"),
      // Optional phone number
      isAdmin: integer("is_admin").notNull().default(0),
      // 1 for admin, 0 for regular user
      suspended: integer("suspended").notNull().default(0),
      // 1 = suspended, 0 = active
      // Free Trial Fields
      isOnTrial: integer("is_on_trial").notNull().default(1),
      // 1 = on trial, 0 = paid/expired
      trialEndsAt: timestamp("trial_ends_at"),
      // When 14-day trial ends
      graceEndsAt: timestamp("grace_ends_at"),
      // When 7-day grace period ends (trial + 7 days)
      // ToyyibPay Integration
      toyyibpayUserCode: text("toyyibpay_user_code"),
      // Optional ToyyibPay user reference
      createdAt: timestamp("created_at").defaultNow().notNull(),
      updatedAt: timestamp("updated_at").defaultNow().notNull()
    });
    passwordResetTokens = pgTable("password_reset_tokens", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      token: text("token").notNull().unique(),
      // Hashed token
      expiresAt: timestamp("expires_at").notNull(),
      // Token expiry (1 hour from creation)
      createdAt: timestamp("created_at").defaultNow().notNull()
    });
    notifications2 = pgTable("notifications", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      type: notificationTypeEnum("type").notNull(),
      // order, payment, stock, reminder, delivery, booking, system
      priority: notificationPriorityEnum("priority").notNull().default("medium"),
      // low, medium, high, urgent
      title: text("title").notNull(),
      // Short notification title
      message: text("message").notNull(),
      // Full notification message
      read: integer("read").notNull().default(0),
      // 0 = unread, 1 = read
      actionUrl: text("action_url"),
      // Optional URL to navigate to (e.g., /bookings/123)
      metadata: text("metadata"),
      // JSON for additional data (orderId, bookingId, etc.)
      createdAt: timestamp("created_at").defaultNow().notNull(),
      readAt: timestamp("read_at")
      // When the notification was marked as read
    }, (table) => {
      return {
        userIdIdx: index("notifications_user_id_idx").on(table.userId),
        readIdx: index("notifications_read_idx").on(table.read),
        createdAtIdx: index("notifications_created_at_idx").on(table.createdAt)
      };
    });
    subscriptionPlans2 = pgTable("subscription_plans", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      name: text("name").notNull(),
      // "trial", "basic", "pro", "premium"
      displayName: text("display_name").notNull(),
      // Display name for UI
      description: text("description"),
      // Plan description
      monthlyPrice: decimal("monthly_price", { precision: 10, scale: 2 }).notNull(),
      // Base price per month in MYR
      annualPrice: decimal("annual_price", { precision: 10, scale: 2 }),
      // Annual price (save 17%)
      currency: text("currency").notNull().default("MYR"),
      features: text("features"),
      // JSON string of features array
      // Feature Limits
      maxUsers: integer("max_users").default(1),
      // Max users/staff accounts
      maxProducts: integer("max_products").default(100),
      // Max products allowed
      maxCustomers: integer("max_customers").default(200),
      // Max customers allowed
      maxStockItems: integer("max_stock_items").default(100),
      // Max stock items
      maxVendors: integer("max_vendors").default(5),
      // Max vendors
      maxResellers: integer("max_resellers").default(0),
      // Max resellers/agents
      maxDeliveriesPerMonth: integer("max_deliveries_per_month").default(50),
      // Max deliveries per month
      storageQuotaMB: integer("storage_quota_mb").default(500),
      // Storage quota in MB
      whatsappMessagesPerMonth: integer("whatsapp_messages_per_month").default(0),
      // WhatsApp broadcast limit
      smsPerMonth: integer("sms_per_month").default(0),
      // SMS limit
      // Feature Access Flags
      hasVendorClaims: integer("has_vendor_claims").default(0),
      // 1 = enabled, 0 = disabled
      hasResellerNetwork: integer("has_reseller_network").default(0),
      hasAdvancedAnalytics: integer("has_advanced_analytics").default(0),
      hasLoyaltyPoints: integer("has_loyalty_points").default(0),
      hasBookings: integer("has_bookings").default(0),
      hasWhatsappBroadcast: integer("has_whatsapp_broadcast").default(0),
      hasSmsBroadcast: integer("has_sms_broadcast").default(0),
      hasPublicStore: integer("has_public_store").default(0),
      hasApiAccess: integer("has_api_access").default(0),
      hasCustomDomain: integer("has_custom_domain").default(0),
      hasPrioritySupport: integer("has_priority_support").default(0),
      hasAccountManager: integer("has_account_manager").default(0),
      // Duration Discounts
      discount6Months: decimal("discount_6_months", { precision: 5, scale: 2 }).default("0.00"),
      discount12Months: decimal("discount_12_months", { precision: 5, scale: 2 }).default("17.00"),
      // 17% discount for annual
      isActive: integer("is_active").notNull().default(1),
      // 1 = active, 0 = inactive
      sortOrder: integer("sort_order").default(0),
      // For display ordering
      createdAt: timestamp("created_at").defaultNow().notNull()
    });
    userSubscriptions2 = pgTable("user_subscriptions", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      planId: varchar("plan_id").notNull().references(() => subscriptionPlans2.id),
      planName: text("plan_name").notNull(),
      // Denormalized for easy display
      status: subscriptionStatusEnum("status").notNull().default("active"),
      durationMonths: integer("duration_months").notNull(),
      // 3, 6, or 12 months
      subscriptionStartsAt: timestamp("subscription_starts_at").notNull(),
      subscriptionEndsAt: timestamp("subscription_ends_at").notNull(),
      // Fixed end date
      totalPaid: decimal("total_paid", { precision: 10, scale: 2 }).notNull(),
      // Amount paid upfront
      isEarlyBird: integer("is_early_bird").notNull().default(0),
      // 1 = early bird customer, 0 = regular
      earlyBirdEndsAt: timestamp("early_bird_ends_at"),
      // When early bird pricing ends (after first payment duration)
      loyaltyMonthlyRate: decimal("loyalty_monthly_rate", { precision: 10, scale: 2 }),
      // Monthly rate after early bird (e.g., RM79)
      // ToyyibPay Integration
      toyyibpayBillCode: text("toyyibpay_bill_code"),
      // ToyyibPay bill reference
      paymentMethod: text("payment_method"),
      // FPX, card, e-wallet, etc.
      paymentProvider: text("payment_provider"),
      // "toyyibpay", "bcl_bayarcash", "manual", etc.
      externalTransactionId: text("external_transaction_id"),
      // Transaction ID from payment provider (UNIQUE for idempotency)
      activationSource: text("activation_source").default("webhook_bcl"),
      // webhook_bcl, manual_admin, webhook_toyyibpay
      previousSubscriptionId: varchar("previous_subscription_id"),
      // Link to previous subscription if extending
      metadata: text("metadata"),
      // JSON for additional data
      createdAt: timestamp("created_at").defaultNow().notNull(),
      updatedAt: timestamp("updated_at").defaultNow().notNull()
    }, (table) => {
      return {
        // Unique constraint for idempotency - prevent duplicate transaction processing
        uniqueExternalTransaction: unique("unique_external_transaction_id").on(table.externalTransactionId),
        // Index for faster lookups
        userIdIdx: index("user_subscriptions_user_id_idx").on(table.userId),
        statusIdx: index("user_subscriptions_status_idx").on(table.status),
        externalTxIdx: index("user_subscriptions_external_tx_idx").on(table.externalTransactionId)
      };
    });
    promoCodes = pgTable("promo_codes", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      code: text("code").notNull().unique(),
      // e.g., "EARLYBIRD100"
      name: text("name").notNull(),
      // Display name
      discountType: promoCodeTypeEnum("discount_type").notNull(),
      discountValue: decimal("discount_value", { precision: 10, scale: 2 }).notNull(),
      // Percentage or fixed amount
      maxUses: integer("max_uses"),
      // Null = unlimited
      currentUses: integer("current_uses").notNull().default(0),
      expiresAt: timestamp("expires_at"),
      // Null = no expiration
      isActive: integer("is_active").notNull().default(1),
      isEarlyBird: integer("is_early_bird").notNull().default(0),
      // 1 = early bird promo, 0 = regular
      createdAt: timestamp("created_at").defaultNow().notNull()
    });
    promoCodeUsage = pgTable("promo_code_usage", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      promoCodeId: varchar("promo_code_id").notNull().references(() => promoCodes.id, { onDelete: "cascade" }),
      usedAt: timestamp("used_at").defaultNow().notNull()
    });
    billingHistory = pgTable("billing_history", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      subscriptionId: varchar("subscription_id").references(() => userSubscriptions2.id, { onDelete: "set null" }),
      amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
      currency: text("currency").notNull().default("MYR"),
      status: billingStatusEnum("status").notNull(),
      // ToyyibPay Integration
      toyyibpayBillCode: text("toyyibpay_bill_code"),
      // ToyyibPay bill reference
      toyyibpayTransactionId: text("toyyibpay_transaction_id"),
      // Transaction ID after payment
      paymentMethod: text("payment_method"),
      // FPX, card, e-wallet
      description: text("description"),
      receiptUrl: text("receipt_url"),
      // URL to receipt/invoice
      paidAt: timestamp("paid_at"),
      createdAt: timestamp("created_at").defaultNow().notNull()
    });
    earlyBirdTracking = pgTable("early_bird_tracking", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      slotNumber: integer("slot_number").notNull().unique(),
      // 1-100
      email: text("email").notNull(),
      signupDate: timestamp("signup_date").defaultNow().notNull(),
      hasSubscribed: integer("has_subscribed").notNull().default(0),
      // 1 = subscribed, 0 = trial only
      subscriptionId: varchar("subscription_id").references(() => userSubscriptions2.id, { onDelete: "set null" }),
      createdAt: timestamp("created_at").defaultNow().notNull()
    });
    pendingBills = pgTable("pending_bills", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      billCode: text("bill_code").notNull().unique(),
      // ToyyibPay bill code
      orderRef: text("order_ref").notNull(),
      // Our order reference
      planId: varchar("plan_id").notNull().references(() => subscriptionPlans2.id),
      planName: text("plan_name").notNull(),
      durationMonths: integer("duration_months").notNull(),
      // 3, 6, or 12
      totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
      promoCodeId: varchar("promo_code_id").references(() => promoCodes.id, { onDelete: "set null" }),
      promoCode: text("promo_code"),
      // Denormalized for easy access
      discountApplied: decimal("discount_applied", { precision: 10, scale: 2 }).default("0"),
      isProcessed: integer("is_processed").notNull().default(0),
      // 1 = processed by webhook, 0 = pending
      processedAt: timestamp("processed_at"),
      isRenewal: integer("is_renewal").notNull().default(0),
      // 1 = renewal, 0 = new subscription
      renewalSubscriptionId: varchar("renewal_subscription_id").references(() => userSubscriptions2.id, { onDelete: "set null" }),
      // For renewals
      createdAt: timestamp("created_at").defaultNow().notNull(),
      expiresAt: timestamp("expires_at").notNull()
      // Bill expiry (7 days)
    });
    goals = pgTable("goals", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      targetMonth: date("target_month").notNull(),
      // First day of target month (YYYY-MM-01)
      revenueTarget: decimal("revenue_target", { precision: 10, scale: 2 }).notNull().default("0"),
      // Monthly revenue target
      profitTarget: decimal("profit_target", { precision: 10, scale: 2 }).notNull().default("0"),
      // Monthly profit target
      salesVolumeTarget: integer("sales_volume_target").notNull().default(0),
      // Target number of sales/deliveries
      notes: text("notes"),
      // User notes or motivation
      createdAt: timestamp("created_at").defaultNow().notNull(),
      updatedAt: timestamp("updated_at").defaultNow().notNull()
    });
    auditLogs = pgTable("audit_logs", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
      // Null if user deleted
      action: varchar("action", { length: 50 }).notNull(),
      // LOGIN, LOGOUT, CREATE_USER, DELETE_PRODUCT, etc.
      resource: varchar("resource", { length: 100 }),
      // products, users, subscriptions, etc.
      resourceId: varchar("resource_id", { length: 255 }),
      // ID of affected resource
      details: json("details").$type(),
      // Additional context (JSON)
      ipAddress: varchar("ip_address", { length: 45 }),
      // IPv4 or IPv6
      userAgent: text("user_agent"),
      // Browser/client info
      status: varchar("status", { length: 20 }).notNull().default("success"),
      // success, failure, error
      createdAt: timestamp("created_at").defaultNow().notNull()
    });
    insertUserSchema = createInsertSchema(users).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertNotificationSchema = createInsertSchema(notifications2).omit({
      id: true,
      createdAt: true,
      readAt: true
    });
    insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans2).omit({
      id: true,
      createdAt: true
    });
    insertUserSubscriptionSchema = createInsertSchema(userSubscriptions2).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertPromoCodeSchema = createInsertSchema(promoCodes).omit({
      id: true,
      createdAt: true
    });
    insertPendingBillSchema = createInsertSchema(pendingBills).omit({
      id: true,
      createdAt: true
    });
    insertBillingHistorySchema = createInsertSchema(billingHistory).omit({
      id: true,
      createdAt: true
    });
    insertGoalSchema = createInsertSchema(goals).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertEarlyBirdTrackingSchema = createInsertSchema(earlyBirdTracking).omit({
      id: true,
      createdAt: true,
      signupDate: true
    });
    pricingTiers = pgTable("pricing_tiers", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      name: text("name").notNull(),
      // e.g., "Bronze", "Silver", "Gold"
      discountPercent: decimal("discount_percent", { precision: 5, scale: 2 }).notNull().default("0"),
      // Discount % off selling price
      isActive: integer("is_active").notNull().default(1),
      // 1 = active, 0 = inactive
      createdAt: timestamp("created_at").defaultNow().notNull()
    });
    resellers = pgTable("resellers", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      name: text("name").notNull(),
      // Reseller/agent name
      phone: text("phone"),
      area: text("area"),
      // State/region they operate in (e.g., "Selangor", "Johor")
      pricingTierId: varchar("pricing_tier_id").references(() => pricingTiers.id, { onDelete: "set null" }),
      totalPurchases: decimal("total_purchases", { precision: 10, scale: 2 }).notNull().default("0"),
      // Cumulative purchases
      isActive: integer("is_active").notNull().default(1),
      // 1 = active, 0 = inactive
      isArchived: integer("is_archived").notNull().default(0),
      // 1 = archived (when user downgrades), 0 = active
      createdAt: timestamp("created_at").defaultNow().notNull()
    });
    resellerTransfers = pgTable("reseller_transfers", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      resellerId: varchar("reseller_id").notNull().references(() => resellers.id, { onDelete: "cascade" }),
      transferDate: date("transfer_date").notNull(),
      totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
      // Total value of transfer
      paymentStatus: resellerPaymentStatusEnum("payment_status").notNull().default("pending"),
      // paid or pending
      notes: text("notes"),
      // Optional notes
      receiptNumber: text("receipt_number").unique(),
      // Format: TRF-YYYYMMDD-XXXX
      createdAt: timestamp("created_at").defaultNow().notNull()
    });
    resellerTransferItems = pgTable("reseller_transfer_items", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      transferId: varchar("transfer_id").notNull().references(() => resellerTransfers.id, { onDelete: "cascade" }),
      productId: varchar("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
      productName: text("product_name").notNull(),
      quantity: integer("quantity").notNull(),
      tierPrice: decimal("tier_price", { precision: 10, scale: 2 }).notNull(),
      // Price after tier discount
      subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
      // quantity * tierPrice
      batchId: varchar("batch_id").references(() => productionBatches.id, { onDelete: "set null" })
      // For FIFO tracking
    });
    insertPricingTierSchema = createInsertSchema(pricingTiers).omit({
      id: true,
      createdAt: true
    });
    insertResellerSchema = createInsertSchema(resellers).omit({
      id: true,
      createdAt: true
    });
    insertResellerTransferSchema = createInsertSchema(resellerTransfers).omit({
      id: true,
      createdAt: true
    });
    insertResellerTransferItemSchema = createInsertSchema(resellerTransferItems).omit({
      id: true
    });
    customers = pgTable("customers", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      name: text("name").notNull(),
      // Customer name
      phone: text("phone").notNull(),
      // Phone number - unique within user scope
      email: text("email"),
      // Optional email
      loyaltyPoints: integer("loyalty_points").notNull().default(0),
      // Current points balance
      totalSpent: decimal("total_spent", { precision: 10, scale: 2 }).notNull().default("0"),
      // Lifetime spending
      totalVisits: integer("total_visits").notNull().default(0),
      // Number of purchases
      isArchived: integer("is_archived").notNull().default(0),
      // 1 = archived (when user downgrades), 0 = active
      createdAt: timestamp("created_at").defaultNow().notNull(),
      updatedAt: timestamp("updated_at").defaultNow().notNull()
    });
    loyaltyPointsHistory = pgTable("loyalty_points_history", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      customerId: varchar("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
      saleId: varchar("sale_id").references(() => sales.id, { onDelete: "set null" }),
      // Link to sale if earned from purchase
      pointsChange: integer("points_change").notNull(),
      // Positive for earned, negative for redeemed
      balanceAfter: integer("balance_after").notNull(),
      // Points balance after this transaction
      transactionType: text("transaction_type").notNull(),
      // "earned", "redeemed", "expired", "adjustment"
      description: text("description"),
      // Optional description
      createdAt: timestamp("created_at").defaultNow().notNull()
    });
    insertCustomerSchema = createInsertSchema(customers).omit({
      id: true,
      userId: true,
      loyaltyPoints: true,
      totalSpent: true,
      totalVisits: true,
      createdAt: true,
      updatedAt: true
    });
    insertLoyaltyPointsHistorySchema = createInsertSchema(loyaltyPointsHistory).omit({
      id: true,
      createdAt: true
    });
    messageTemplates = pgTable("message_templates", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      name: text("name").notNull(),
      // Template name (e.g., "Promosi Raya", "Produk Baru")
      type: messageTemplateTypeEnum("type").notNull(),
      // promo, new_product, voucher, general
      subject: text("subject"),
      // For email (optional)
      message: text("message").notNull(),
      // Message body (supports placeholders like {name}, {points})
      channel: broadcastChannelEnum("channel").notNull(),
      // email, whatsapp, sms
      isActive: integer("is_active").notNull().default(1),
      // 1=active, 0=archived
      createdAt: timestamp("created_at").defaultNow().notNull(),
      updatedAt: timestamp("updated_at").defaultNow().notNull()
    });
    broadcastCampaigns = pgTable("broadcast_campaigns", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      name: text("name").notNull(),
      // Campaign name
      channel: broadcastChannelEnum("channel").notNull(),
      // email, whatsapp, sms
      subject: text("subject"),
      // For email
      message: text("message").notNull(),
      // Message content
      targetSegment: text("target_segment").notNull(),
      // "all", "high_points", "recent_buyers", "custom"
      targetCustomerIds: text("target_customer_ids").array(),
      // Array of customer IDs if custom segment
      status: broadcastStatusEnum("status").notNull().default("draft"),
      // draft, pending, sending, sent, failed
      totalRecipients: integer("total_recipients").notNull().default(0),
      // Total customers targeted
      sentCount: integer("sent_count").notNull().default(0),
      // Successfully sent
      failedCount: integer("failed_count").notNull().default(0),
      // Failed to send
      scheduledAt: timestamp("scheduled_at"),
      // When to send (null = send immediately)
      sentAt: timestamp("sent_at"),
      // When actually sent
      createdAt: timestamp("created_at").defaultNow().notNull(),
      updatedAt: timestamp("updated_at").defaultNow().notNull()
    });
    broadcastMessages = pgTable("broadcast_messages", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      campaignId: varchar("campaign_id").notNull().references(() => broadcastCampaigns.id, { onDelete: "cascade" }),
      customerId: varchar("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
      channel: broadcastChannelEnum("channel").notNull(),
      // email, whatsapp, sms
      recipient: text("recipient").notNull(),
      // Email address or phone number
      status: text("status").notNull().default("pending"),
      // pending, sent, failed, delivered, read
      errorMessage: text("error_message"),
      // Error details if failed
      externalMessageId: text("external_message_id"),
      // ID from email/SMS provider
      sentAt: timestamp("sent_at"),
      // When message was sent
      deliveredAt: timestamp("delivered_at"),
      // When message was delivered (if available)
      createdAt: timestamp("created_at").defaultNow().notNull()
    });
    insertMessageTemplateSchema = createInsertSchema(messageTemplates).omit({
      id: true,
      userId: true,
      createdAt: true,
      updatedAt: true
    });
    insertBroadcastCampaignSchema = createInsertSchema(broadcastCampaigns).omit({
      id: true,
      userId: true,
      sentCount: true,
      failedCount: true,
      sentAt: true,
      createdAt: true,
      updatedAt: true
    });
    insertBroadcastMessageSchema = createInsertSchema(broadcastMessages).omit({
      id: true,
      createdAt: true
    });
    customerVouchers = pgTable("customer_vouchers", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      code: text("code").notNull(),
      // Unique voucher code within user scope e.g., "RAYA2024", "VIP50"
      name: text("name").notNull(),
      // Display name
      description: text("description"),
      // Optional description
      voucherType: voucherTypeEnum("voucher_type").notNull(),
      // percentage or fixed_amount
      discountValue: decimal("discount_value", { precision: 10, scale: 2 }).notNull(),
      // 10.00 for 10% or RM10
      minPurchase: decimal("min_purchase", { precision: 10, scale: 2 }).notNull().default("0"),
      // Minimum purchase amount
      maxDiscount: decimal("max_discount", { precision: 10, scale: 2 }),
      // Max discount cap (for percentage)
      maxUsagePerCustomer: integer("max_usage_per_customer").notNull().default(1),
      // How many times each customer can use
      maxTotalUsage: integer("max_total_usage"),
      // Total usage limit (null = unlimited)
      currentUsage: integer("current_usage").notNull().default(0),
      // Current total usage
      validFrom: timestamp("valid_from").notNull().defaultNow(),
      // When voucher becomes valid
      validUntil: timestamp("valid_until"),
      // Expiry date (null = no expiry)
      isActive: integer("is_active").notNull().default(1),
      // 1=active, 0=deactivated
      createdBy: varchar("created_by"),
      // Optional: which admin/user created this
      createdAt: timestamp("created_at").defaultNow().notNull(),
      updatedAt: timestamp("updated_at").defaultNow().notNull()
    });
    voucherUsage = pgTable("voucher_usage", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      voucherId: varchar("voucher_id").notNull().references(() => customerVouchers.id, { onDelete: "cascade" }),
      customerId: varchar("customer_id").references(() => customers.id, { onDelete: "set null" }),
      // null if used without loyalty account
      saleId: varchar("sale_id").references(() => sales.id, { onDelete: "set null" }),
      // Link to POS sale
      discountApplied: decimal("discount_applied", { precision: 10, scale: 2 }).notNull(),
      // Actual discount given
      originalAmount: decimal("original_amount", { precision: 10, scale: 2 }).notNull(),
      // Amount before discount
      finalAmount: decimal("final_amount", { precision: 10, scale: 2 }).notNull(),
      // Amount after discount
      usedAt: timestamp("used_at").defaultNow().notNull()
    });
    insertCustomerVoucherSchema = createInsertSchema(customerVouchers).omit({
      id: true,
      userId: true,
      currentUsage: true,
      createdAt: true,
      updatedAt: true
    });
    insertVoucherUsageSchema = createInsertSchema(voucherUsage).omit({
      id: true,
      usedAt: true
    });
    bookings = pgTable("bookings", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      bookingNumber: text("booking_number").notNull().unique(),
      // e.g., "BK-2024-001"
      // Customer Details
      customerName: text("customer_name").notNull(),
      customerPhone: text("customer_phone").notNull(),
      customerEmail: text("customer_email"),
      customerId: varchar("customer_id").references(() => customers.id, { onDelete: "set null" }),
      // Link to loyalty customer if exists
      // Event Details
      eventType: text("event_type").notNull(),
      // "Perkahwinan", "Kenduri", "Door Gift", "Jamuan", etc
      eventDate: date("event_date").notNull(),
      // Date of the event
      eventNotes: text("event_notes"),
      // Special instructions
      // Delivery/Pickup
      deliveryType: bookingDeliveryTypeEnum("delivery_type").notNull(),
      // pickup or delivery
      deliveryDate: date("delivery_date").notNull(),
      // When to deliver/pickup
      deliveryTime: text("delivery_time").notNull(),
      // e.g., "09:00", "14:30"
      deliveryAddress: text("delivery_address"),
      // Full address if delivery
      deliveryCity: text("delivery_city"),
      deliveryState: text("delivery_state"),
      deliveryPostcode: text("delivery_postcode"),
      // Financial
      totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
      // Total order amount after discount
      discountType: voucherTypeEnum("discount_type"),
      // percentage or fixed_amount
      discountValue: decimal("discount_value", { precision: 10, scale: 2 }),
      // Discount value (e.g., 10 for 10% or RM10)
      discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }),
      // Calculated discount amount
      depositPaid: decimal("deposit_paid", { precision: 10, scale: 2 }).notNull().default("0"),
      // Deposit paid
      balanceDue: decimal("balance_due", { precision: 10, scale: 2 }).notNull(),
      // Remaining balance
      paymentMethod: paymentMethodEnum("payment_method").notNull().default("tunai"),
      // Status & Tracking
      status: bookingStatusEnum("status").notNull().default("pending"),
      // pending, confirmed, in_progress, ready, completed, cancelled
      reminderSent: integer("reminder_sent").notNull().default(0),
      // 0=not sent, 1=sent
      reminderSentAt: timestamp("reminder_sent_at"),
      // Metadata
      notes: text("notes"),
      // Internal notes
      createdAt: timestamp("created_at").defaultNow().notNull(),
      updatedAt: timestamp("updated_at").defaultNow().notNull(),
      completedAt: timestamp("completed_at")
      // When booking was completed
    });
    bookingItems = pgTable("booking_items", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      bookingId: varchar("booking_id").notNull().references(() => bookings.id, { onDelete: "cascade" }),
      productId: varchar("product_id").notNull().references(() => products.id, { onDelete: "restrict" }),
      productName: text("product_name").notNull(),
      // Store name for historical record
      quantity: integer("quantity").notNull(),
      unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
      // Price per unit at time of booking
      totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
      // quantity * unitPrice
      specialInstructions: text("special_instructions"),
      // e.g., "Extra chocolate chips", "No nuts"
      createdAt: timestamp("created_at").defaultNow().notNull()
    });
    insertBookingSchema = createInsertSchema(bookings).omit({
      id: true,
      userId: true,
      reminderSent: true,
      reminderSentAt: true,
      createdAt: true,
      updatedAt: true,
      completedAt: true
    });
    insertBookingItemSchema = createInsertSchema(bookingItems).omit({
      id: true,
      createdAt: true
    });
    storeSettings = pgTable("store_settings", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
      // One store per user
      // Store Identity
      slug: text("slug").notNull().unique(),
      // Unique URL: pocketbizz.app/store/fiq-sweet-bakery
      businessName: text("business_name").notNull(),
      // Display name
      description: text("description"),
      // Short description of the business
      logoUrl: text("logo_url"),
      // Business logo
      coverImageUrl: text("cover_image_url"),
      // Cover/banner image
      // Contact & Social
      whatsappNumber: text("whatsapp_number").notNull(),
      // For "Order via WhatsApp" button
      instagramHandle: text("instagram_handle"),
      // Optional
      facebookUrl: text("facebook_url"),
      // Optional
      // Business Info
      businessHours: text("business_hours"),
      // e.g., "Mon-Sat: 9AM-6PM"
      address: text("address"),
      // Business location
      deliveryInfo: text("delivery_info"),
      // Delivery terms, areas served, etc.
      pickupInfo: text("pickup_info"),
      // Pickup instructions
      // Customization
      theme: storeThemeEnum("theme").default("light").notNull(),
      accentColor: text("accent_color").default("#f97316"),
      // Primary brand color (default: orange)
      // Settings
      isActive: integer("is_active").notNull().default(1),
      // 1 = active, 0 = inactive
      showOutOfStock: integer("show_out_of_stock").notNull().default(0),
      // Show/hide out-of-stock items
      // Metadata
      createdAt: timestamp("created_at").defaultNow().notNull(),
      updatedAt: timestamp("updated_at").defaultNow().notNull()
    });
    adminActivityLogs = pgTable("admin_activity_logs", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      adminId: varchar("admin_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      // Who performed the action
      targetUserId: varchar("target_user_id"),
      // User affected by the action (nullable for system-wide actions)
      action: text("action").notNull(),
      // "delete_user", "suspend_user", "activate_user", "reset_password", "change_plan", "add_payment", "bulk_action"
      details: text("details"),
      // JSON string with action details (e.g., old/new plan, payment amount)
      ipAddress: text("ip_address"),
      // Admin's IP address
      userAgent: text("user_agent"),
      // Admin's browser/device
      createdAt: timestamp("created_at").defaultNow().notNull()
    });
    storeAnalytics = pgTable("store_analytics", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      storeId: varchar("store_id").notNull().references(() => storeSettings.id, { onDelete: "cascade" }),
      // Event tracking
      eventType: text("event_type").notNull(),
      // "view", "product_click", "whatsapp_click"
      productId: varchar("product_id"),
      // If product-related event
      // Session info
      visitorId: text("visitor_id"),
      // Anonymous visitor identifier
      referrer: text("referrer"),
      // Where they came from
      userAgent: text("user_agent"),
      // Device/browser info
      createdAt: timestamp("created_at").defaultNow().notNull()
    });
    insertStoreSettingsSchema = createInsertSchema(storeSettings).omit({
      id: true,
      userId: true,
      createdAt: true,
      updatedAt: true
    });
    insertStoreAnalyticsSchema = createInsertSchema(storeAnalytics).omit({
      id: true,
      createdAt: true
    });
    insertAdminActivityLogSchema = createInsertSchema(adminActivityLogs).omit({
      id: true,
      createdAt: true
    });
  }
});

// server/db.ts
import dotenv from "dotenv";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
var pool, db;
var init_db = __esm({
  "server/db.ts"() {
    init_schema();
    dotenv.config();
    neonConfig.webSocketConstructor = ws;
    if (!process.env.DATABASE_URL) {
      throw new Error(
        "DATABASE_URL must be set. Did you forget to provision a database?"
      );
    }
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    db = drizzle({ client: pool, schema: schema_exports });
  }
});

// server/storage.ts
import { eq, desc as desc2, and as and2, gte, lte, gt, asc, sql as sql2, inArray, like } from "drizzle-orm";
var DatabaseStorage, storage;
var init_storage = __esm({
  "server/storage.ts"() {
    init_schema();
    init_db();
    DatabaseStorage = class {
      // Products
      async getProducts(userId) {
        const allProducts = await db.select().from(products).where(eq(products.userId, userId)).orderBy(desc2(products.createdAt));
        if (allProducts.length === 0) {
          return [];
        }
        const productIds = allProducts.map((p) => p.id);
        const allIngredients = await db.select().from(ingredients).where(and2(
          inArray(ingredients.productId, productIds),
          eq(ingredients.userId, userId)
        ));
        const ingredientsMap = allIngredients.reduce((acc, ingredient) => {
          if (!acc[ingredient.productId]) {
            acc[ingredient.productId] = [];
          }
          acc[ingredient.productId].push(ingredient);
          return acc;
        }, {});
        return allProducts.map((product) => ({
          ...product,
          ingredients: ingredientsMap[product.id] || []
        }));
      }
      async getProduct(userId, id) {
        const [product] = await db.select().from(products).where(and2(eq(products.id, id), eq(products.userId, userId)));
        return product || void 0;
      }
      async getProductCount(userId) {
        const [result] = await db.select({ count: sql2`count(*)` }).from(products).where(eq(products.userId, userId));
        return result.count;
      }
      async createProduct(userId, product, recipeItemsList) {
        const [newProduct] = await db.insert(products).values({ ...product, userId }).returning();
        if (recipeItemsList.length > 0) {
          const recipeItemsWithProductId = recipeItemsList.map((item) => ({
            ...item,
            productId: newProduct.id,
            userId
          }));
          await db.insert(recipeItems).values(recipeItemsWithProductId);
        }
        return newProduct;
      }
      async updateProduct(userId, id, product, recipeItemsList) {
        const [updatedProduct] = await db.update(products).set(product).where(and2(eq(products.id, id), eq(products.userId, userId))).returning();
        if (recipeItemsList && recipeItemsList.length > 0) {
          await db.delete(recipeItems).where(eq(recipeItems.productId, id));
          const recipeItemsWithProductId = recipeItemsList.map((item) => ({
            ...item,
            productId: id
          }));
          await db.insert(recipeItems).values(recipeItemsWithProductId);
        }
        return updatedProduct;
      }
      async deleteProduct(userId, id) {
        await db.delete(products).where(and2(eq(products.id, id), eq(products.userId, userId)));
      }
      // Ingredients
      async getIngredients(userId, productId) {
        return await db.select().from(ingredients).where(and2(eq(ingredients.productId, productId), eq(ingredients.userId, userId)));
      }
      // Production
      async getProductionBatches(userId) {
        return await db.select().from(productionBatches).where(eq(productionBatches.userId, userId)).orderBy(desc2(productionBatches.batchDate));
      }
      async createProductionBatch(userId, batch) {
        const [newBatch] = await db.insert(productionBatches).values({ ...batch, userId }).returning();
        return newBatch;
      }
      // Finished Products (Finished Goods Inventory)
      async getFinishedProductsSummary(userId) {
        const summary = await db.select({
          productId: productionBatches.productId,
          productName: productionBatches.productName,
          totalRemaining: sql2`COALESCE(SUM(${productionBatches.remainingQty}), 0)`,
          nearestExpiry: sql2`MIN(${productionBatches.expiryDate})`,
          batchCount: sql2`COUNT(*)`
        }).from(productionBatches).where(and2(
          eq(productionBatches.userId, userId),
          sql2`${productionBatches.remainingQty} > 0`
        )).groupBy(productionBatches.productId, productionBatches.productName);
        return summary;
      }
      async getBatchesByProduct(userId, productId) {
        const batches = await db.select().from(productionBatches).where(
          and2(
            eq(productionBatches.userId, userId),
            eq(productionBatches.productId, productId),
            sql2`${productionBatches.remainingQty} > 0`
          )
        ).orderBy(
          sql2`CASE WHEN ${productionBatches.expiryDate} IS NULL THEN 1 ELSE 0 END`,
          productionBatches.expiryDate,
          productionBatches.createdAt
        );
        return batches;
      }
      async previewBatchDeduction(userId, productId, quantity) {
        const batches = await db.select().from(productionBatches).where(
          and2(
            eq(productionBatches.userId, userId),
            eq(productionBatches.productId, productId),
            sql2`${productionBatches.remainingQty} > 0`
          )
        ).orderBy(
          sql2`CASE WHEN ${productionBatches.expiryDate} IS NULL THEN 1 ELSE 0 END`,
          productionBatches.expiryDate,
          productionBatches.createdAt
        );
        const totalAvailable = batches.reduce((sum, batch) => sum + parseFloat(batch.remainingQty), 0);
        if (totalAvailable < quantity) {
          return {
            success: false,
            deductions: [],
            totalAvailable
          };
        }
        let remainingToDeduct = quantity;
        const deductions = [];
        for (const batch of batches) {
          if (remainingToDeduct <= 0) break;
          const batchRemaining = parseFloat(batch.remainingQty);
          const deductAmount = Math.min(remainingToDeduct, batchRemaining);
          const newRemaining = batchRemaining - deductAmount;
          let daysUntilExpiry = null;
          if (batch.expiryDate) {
            const today = /* @__PURE__ */ new Date();
            const expiry = new Date(batch.expiryDate);
            daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1e3 * 60 * 60 * 24));
          }
          deductions.push({
            batchId: batch.id,
            batchDate: batch.batchDate,
            expiryDate: batch.expiryDate,
            deductedQty: deductAmount,
            remainingBefore: batchRemaining,
            remainingAfter: newRemaining,
            daysUntilExpiry
          });
          remainingToDeduct -= deductAmount;
        }
        return {
          success: true,
          deductions,
          totalAvailable
        };
      }
      async deductFromBatches(userId, productId, quantity) {
        return await db.transaction(async (tx) => {
          const batches = await tx.select().from(productionBatches).where(
            and2(
              eq(productionBatches.userId, userId),
              eq(productionBatches.productId, productId),
              sql2`${productionBatches.remainingQty} > 0`
            )
          ).orderBy(
            sql2`CASE WHEN ${productionBatches.expiryDate} IS NULL THEN 1 ELSE 0 END`,
            productionBatches.expiryDate,
            productionBatches.createdAt
          ).for("update");
          const totalAvailable = batches.reduce((sum, batch) => sum + parseFloat(batch.remainingQty), 0);
          if (totalAvailable < quantity) {
            return {
              success: false,
              deductions: []
            };
          }
          let remainingToDeduct = quantity;
          const deductions = [];
          for (const batch of batches) {
            if (remainingToDeduct <= 0) break;
            const batchRemaining = parseFloat(batch.remainingQty);
            const deductAmount = Math.min(remainingToDeduct, batchRemaining);
            const newRemaining = batchRemaining - deductAmount;
            await tx.update(productionBatches).set({ remainingQty: newRemaining.toString() }).where(eq(productionBatches.id, batch.id));
            deductions.push({
              batchId: batch.id,
              batchDate: batch.batchDate,
              expiryDate: batch.expiryDate,
              deductedQty: deductAmount,
              remainingAfter: newRemaining
            });
            remainingToDeduct -= deductAmount;
          }
          return {
            success: true,
            deductions
          };
        });
      }
      // Vendors
      async getVendors(userId) {
        return await db.select().from(vendors).where(eq(vendors.userId, userId)).orderBy(desc2(vendors.createdAt));
      }
      async getVendor(userId, id) {
        const [vendor] = await db.select().from(vendors).where(and2(eq(vendors.id, id), eq(vendors.userId, userId)));
        return vendor || void 0;
      }
      async createVendor(userId, vendor) {
        const [newVendor] = await db.insert(vendors).values({ ...vendor, userId }).returning();
        return newVendor;
      }
      // Suppliers (for Purchase Orders - beli bahan mentah)
      async getSuppliers(userId) {
        return await db.select().from(suppliers).where(eq(suppliers.userId, userId)).orderBy(desc2(suppliers.createdAt));
      }
      async getSupplier(userId, id) {
        const [supplier] = await db.select().from(suppliers).where(and2(eq(suppliers.id, id), eq(suppliers.userId, userId)));
        return supplier || void 0;
      }
      async createSupplier(userId, supplier) {
        const [newSupplier] = await db.insert(suppliers).values({ ...supplier, userId }).returning();
        return newSupplier;
      }
      async updateSupplier(userId, id, supplier) {
        const [updated] = await db.update(suppliers).set(supplier).where(and2(eq(suppliers.id, id), eq(suppliers.userId, userId))).returning();
        return updated;
      }
      async deleteSupplier(userId, id) {
        await db.delete(suppliers).where(and2(eq(suppliers.id, id), eq(suppliers.userId, userId)));
      }
      // Deliveries
      async getDeliveries(userId, limit = 20, offset = 0) {
        const totalResult = await db.select({ count: sql2`count(*)` }).from(deliveries).where(eq(deliveries.userId, userId));
        const total = Number(totalResult[0]?.count || 0);
        const result = await db.select().from(deliveries).where(eq(deliveries.userId, userId)).orderBy(desc2(deliveries.deliveryDate)).limit(limit + 1).offset(offset);
        const hasMore = result.length > limit;
        const deliveriesToReturn = hasMore ? result.slice(0, limit) : result;
        const deliveriesWithItems = await Promise.all(
          deliveriesToReturn.map(async (delivery) => {
            const itemsData = await db.select({
              deliveryItem: deliveryItems,
              productUnit: products.unit
            }).from(deliveryItems).leftJoin(products, eq(deliveryItems.productId, products.id)).where(eq(deliveryItems.deliveryId, delivery.id));
            let grossAmount = 0;
            let rejectedAmount = 0;
            itemsData.forEach(({ deliveryItem }) => {
              const itemGross = deliveryItem.quantity * parseFloat(deliveryItem.unitPrice);
              const itemRejected = (deliveryItem.rejectedQty || 0) * parseFloat(deliveryItem.unitPrice);
              grossAmount += itemGross;
              rejectedAmount += itemRejected;
            });
            const netAmount = grossAmount - rejectedAmount;
            let commission = 0;
            try {
              commission = await this.calculateCommission(userId, delivery.vendorId, netAmount);
            } catch (error) {
              console.error(`Failed to calculate commission for delivery ${delivery.id}:`, error);
            }
            const claimableAmount = netAmount - commission;
            const itemsWithBreakdown = itemsData.map(({ deliveryItem, productUnit }) => {
              const itemGross = deliveryItem.quantity * parseFloat(deliveryItem.unitPrice);
              const itemRejected = (deliveryItem.rejectedQty || 0) * parseFloat(deliveryItem.unitPrice);
              const itemNet = itemGross - itemRejected;
              const itemCommission = netAmount > 0 ? itemNet / netAmount * commission : 0;
              const itemClaimable = itemNet - itemCommission;
              return {
                ...deliveryItem,
                unit: productUnit || "pcs",
                // Add unit from product, default to 'pcs'
                itemGross: itemGross.toFixed(2),
                itemRejected: itemRejected.toFixed(2),
                itemNet: itemNet.toFixed(2),
                itemCommission: itemCommission.toFixed(2),
                itemClaimable: itemClaimable.toFixed(2)
              };
            });
            return {
              ...delivery,
              items: itemsWithBreakdown,
              grossAmount: grossAmount.toFixed(2),
              rejectedAmount: rejectedAmount.toFixed(2),
              netAmount: netAmount.toFixed(2),
              commission: commission.toFixed(2),
              claimableAmount: claimableAmount.toFixed(2)
            };
          })
        );
        return {
          data: deliveriesWithItems,
          hasMore,
          total
        };
      }
      async getDelivery(userId, id) {
        const [delivery] = await db.select().from(deliveries).where(and2(eq(deliveries.id, id), eq(deliveries.userId, userId)));
        if (!delivery) return void 0;
        const itemsData = await db.select({
          deliveryItem: deliveryItems,
          productUnit: products.unit
        }).from(deliveryItems).leftJoin(products, eq(deliveryItems.productId, products.id)).where(eq(deliveryItems.deliveryId, id));
        let grossAmount = 0;
        let rejectedAmount = 0;
        itemsData.forEach(({ deliveryItem }) => {
          const itemGross = deliveryItem.quantity * parseFloat(deliveryItem.unitPrice);
          const itemRejected = (deliveryItem.rejectedQty || 0) * parseFloat(deliveryItem.unitPrice);
          grossAmount += itemGross;
          rejectedAmount += itemRejected;
        });
        const netAmount = grossAmount - rejectedAmount;
        let commission = 0;
        try {
          commission = await this.calculateCommission(userId, delivery.vendorId, netAmount);
        } catch (error) {
          console.error(`Failed to calculate commission for delivery ${delivery.id}:`, error);
        }
        const claimableAmount = netAmount - commission;
        const itemsWithBreakdown = itemsData.map(({ deliveryItem, productUnit }) => {
          const itemGross = deliveryItem.quantity * parseFloat(deliveryItem.unitPrice);
          const itemRejected = (deliveryItem.rejectedQty || 0) * parseFloat(deliveryItem.unitPrice);
          const itemNet = itemGross - itemRejected;
          const itemCommission = netAmount > 0 ? itemNet / netAmount * commission : 0;
          const itemClaimable = itemNet - itemCommission;
          return {
            ...deliveryItem,
            unit: productUnit || "pcs",
            // Add unit from product, default to 'pcs'
            itemGross: itemGross.toFixed(2),
            itemRejected: itemRejected.toFixed(2),
            itemNet: itemNet.toFixed(2),
            itemCommission: itemCommission.toFixed(2),
            itemClaimable: itemClaimable.toFixed(2)
          };
        });
        return {
          ...delivery,
          items: itemsWithBreakdown,
          grossAmount: grossAmount.toFixed(2),
          rejectedAmount: rejectedAmount.toFixed(2),
          netAmount: netAmount.toFixed(2),
          commission: commission.toFixed(2),
          claimableAmount: claimableAmount.toFixed(2)
        };
      }
      async getLastDeliveryForVendor(userId, vendorId) {
        const [lastDelivery] = await db.select().from(deliveries).where(and2(eq(deliveries.vendorId, vendorId), eq(deliveries.userId, userId))).orderBy(desc2(deliveries.deliveryDate)).limit(1);
        if (!lastDelivery) return null;
        const items = await db.select().from(deliveryItems).where(eq(deliveryItems.deliveryId, lastDelivery.id));
        return {
          ...lastDelivery,
          items
        };
      }
      async checkDuplicateDelivery(userId, vendorId, deliveryDate) {
        const [existing] = await db.select().from(deliveries).where(
          and2(
            eq(deliveries.userId, userId),
            eq(deliveries.vendorId, vendorId),
            eq(deliveries.deliveryDate, deliveryDate)
          )
        ).limit(1);
        return existing || null;
      }
      async createDelivery(userId, delivery, items) {
        return await db.transaction(async (tx) => {
          const date2 = new Date(delivery.deliveryDate);
          const dateStr = date2.toISOString().split("T")[0].replace(/-/g, "");
          const lockId = parseInt(dateStr);
          await tx.execute(sql2`SELECT pg_advisory_xact_lock(${lockId})`);
          for (const item of items) {
            const batches = await tx.select().from(productionBatches).where(and2(
              eq(productionBatches.userId, userId),
              eq(productionBatches.productId, item.productId),
              gt(productionBatches.remainingQty, 0)
            )).orderBy(asc(productionBatches.createdAt)).for("update");
            let remainingToDeduct = item.quantity;
            for (const batch of batches) {
              if (remainingToDeduct <= 0) break;
              const deductQty = Math.min(batch.remainingQty, remainingToDeduct);
              await tx.update(productionBatches).set({ remainingQty: batch.remainingQty - deductQty }).where(eq(productionBatches.id, batch.id));
              remainingToDeduct -= deductQty;
            }
            if (remainingToDeduct > 0) {
              throw new Error(`Stok siap tidak mencukupi untuk ${item.productName}. Diperlukan: ${item.quantity}`);
            }
          }
          let attempts = 0;
          const maxAttempts = 5;
          let newDelivery;
          while (attempts < maxAttempts && !newDelivery) {
            attempts++;
            const latestInvoice = await tx.select().from(deliveries).where(sql2`${deliveries.invoiceNumber} LIKE ${"INV-" + dateStr + "-%"} `).orderBy(desc2(deliveries.invoiceNumber)).limit(1);
            let sequenceNumber = 1;
            if (latestInvoice.length > 0 && latestInvoice[0].invoiceNumber) {
              const parts = latestInvoice[0].invoiceNumber.split("-");
              if (parts.length === 3) {
                sequenceNumber = parseInt(parts[2]) + 1;
              }
            }
            const sequenceStr = sequenceNumber.toString().padStart(4, "0");
            const invoiceNumber = `INV-${dateStr}-${sequenceStr}`;
            try {
              const inserted = await tx.insert(deliveries).values({
                ...delivery,
                userId,
                invoiceNumber
              }).returning();
              newDelivery = inserted[0];
            } catch (err) {
              if (err.code === "23505" && err.constraint === "deliveries_invoice_number_unique") {
                continue;
              }
              throw err;
            }
          }
          if (!newDelivery) {
            throw new Error("Gagal menjana invoice unik selepas beberapa percubaan. Sila cuba semula.");
          }
          if (items.length > 0) {
            const itemsWithDeliveryId = items.map((item) => ({
              ...item,
              deliveryId: newDelivery.id,
              userId
            }));
            await tx.insert(deliveryItems).values(itemsWithDeliveryId);
            for (const item of itemsWithDeliveryId) {
              await this.updateStockBalance(delivery.vendorId, item.productId, {
                delivered: item.quantity
              }, tx);
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
      async updateDeliveryStatus(userId, id, status) {
        await db.update(deliveries).set({ status }).where(and2(eq(deliveries.id, id), eq(deliveries.userId, userId)));
      }
      async updateDeliveryPaymentStatus(userId, id, paymentStatus) {
        const [updated] = await db.update(deliveries).set({ paymentStatus }).where(and2(eq(deliveries.id, id), eq(deliveries.userId, userId))).returning();
        return updated;
      }
      async updateDeliveryItemRejection(userId, itemId, rejectedQty, rejectionReason) {
        return await db.transaction(async (tx) => {
          const [result] = await tx.select().from(deliveryItems).innerJoin(deliveries, eq(deliveryItems.deliveryId, deliveries.id)).where(and2(eq(deliveryItems.id, itemId), eq(deliveries.userId, userId)));
          if (!result) {
            throw new Error("Delivery item not found or access denied");
          }
          const { delivery_items: item, deliveries: delivery } = result;
          const oldRejectedQty = item.rejectedQty || 0;
          const diff = rejectedQty - oldRejectedQty;
          await tx.update(deliveryItems).set({
            rejectedQty,
            rejectionReason
          }).where(eq(deliveryItems.id, itemId));
          if (diff !== 0) {
            await this.updateStockBalance(delivery.vendorId, item.productId, {
              returned: diff
            }, tx);
          }
        });
      }
      // POS Sales
      async generateReceiptNumber(userId) {
        const today = /* @__PURE__ */ new Date();
        const dateStr = today.toISOString().split("T")[0].replace(/-/g, "");
        const todaySales = await db.select({ count: sql2`COUNT(*)` }).from(sales).where(and2(
          eq(sales.saleDate, today.toISOString().split("T")[0]),
          eq(sales.userId, userId)
        ));
        const sequence = (todaySales[0]?.count || 0) + 1;
        const paddedSequence = sequence.toString().padStart(4, "0");
        return `RES-${dateStr}-${paddedSequence}`;
      }
      async getAllSales(userId, startDate, endDate) {
        let query = db.select({
          id: sales.id,
          saleDate: sales.saleDate,
          receiptNumber: sales.receiptNumber,
          totalAmount: sales.totalAmount,
          totalCost: sales.totalCost,
          totalProfit: sales.totalProfit,
          paymentMethod: sales.paymentMethod,
          customerName: sales.customerName,
          totalItems: sql2`COUNT(${salesItems.id})`
        }).from(sales).leftJoin(salesItems, and2(eq(sales.id, salesItems.saleId), eq(salesItems.userId, userId))).where(eq(sales.userId, userId)).groupBy(sales.id, sales.saleDate, sales.receiptNumber).orderBy(desc2(sales.saleDate));
        if (startDate) {
          query = query.where(and2(eq(sales.userId, userId), sql2`${sales.saleDate} >= ${startDate}`));
        }
        if (endDate) {
          query = query.where(and2(eq(sales.userId, userId), sql2`${sales.saleDate} <= ${endDate}`));
        }
        return await query;
      }
      async getAllDeliveries(userId) {
        const result = await db.select({
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
          notes: deliveries.notes
        }).from(deliveries).innerJoin(vendors, and2(eq(deliveries.vendorId, vendors.id), eq(vendors.userId, userId))).innerJoin(deliveryItems, eq(deliveries.id, deliveryItems.deliveryId)).innerJoin(products, and2(eq(deliveryItems.productId, products.id), eq(products.userId, userId))).where(eq(deliveries.userId, userId)).orderBy(desc2(deliveries.deliveryDate));
        return result;
      }
      async getSales(userId, limit = 50, offset = 0) {
        const countResult = await db.select({ count: sql2`COUNT(*)` }).from(sales).where(eq(sales.userId, userId));
        const total = countResult[0]?.count || 0;
        const salesData = await db.select().from(sales).where(eq(sales.userId, userId)).orderBy(desc2(sales.saleDate), desc2(sales.createdAt)).limit(limit + 1).offset(offset);
        const hasMore = salesData.length > limit;
        const data = salesData.slice(0, limit);
        const salesWithItems = await Promise.all(
          data.map(async (sale) => {
            const items = await db.select().from(salesItems).where(and2(eq(salesItems.saleId, sale.id), eq(salesItems.userId, userId)));
            return {
              ...sale,
              items
            };
          })
        );
        return {
          data: salesWithItems,
          hasMore,
          total
        };
      }
      async getSale(userId, id) {
        const [sale] = await db.select().from(sales).where(and2(eq(sales.id, id), eq(sales.userId, userId))).limit(1);
        if (!sale) return null;
        const items = await db.select().from(salesItems).where(and2(eq(salesItems.saleId, id), eq(salesItems.userId, userId)));
        return {
          ...sale,
          items
        };
      }
      async createSale(userId, sale, items) {
        return await db.transaction(async (tx) => {
          const receiptNumber = await this.generateReceiptNumber(userId);
          const [newSale] = await tx.insert(sales).values({
            ...sale,
            userId,
            receiptNumber
          }).returning();
          const createdItems = [];
          for (const item of items) {
            const deductionResult = await this.deductFromBatches(userId, item.productId, item.quantity);
            if (!deductionResult.success) {
              throw new Error(`Insufficient stock for product ${item.productName}. Required: ${item.quantity}, available less.`);
            }
            for (const deduction of deductionResult.deductions) {
              const unitPrice = parseFloat(item.unitPrice || "0");
              const unitCost = parseFloat(item.unitCost || "0");
              const quantity = Math.floor(deduction.deductedQty);
              const [salesItem] = await tx.insert(salesItems).values({
                ...item,
                saleId: newSale.id,
                userId,
                quantity,
                // Quantity from this batch
                totalPrice: (unitPrice * deduction.deductedQty).toFixed(2),
                totalCost: (unitCost * deduction.deductedQty).toFixed(2),
                profitAmount: ((unitPrice - unitCost) * deduction.deductedQty).toFixed(2),
                batchId: deduction.batchId
              }).returning();
              createdItems.push(salesItem);
            }
          }
          return newSale;
        });
      }
      // Expenses
      async getExpenses(userId) {
        return await db.select().from(expenses).where(eq(expenses.userId, userId)).orderBy(desc2(expenses.expenseDate));
      }
      async createExpense(userId, expense) {
        const [newExpense] = await db.insert(expenses).values({ ...expense, userId }).returning();
        return newExpense;
      }
      // Reports
      async getDashboardStats(userId) {
        const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1e3).toISOString().split("T")[0];
        const todayProduction = await db.select({
          total: sql2`COALESCE(SUM(${productionBatches.quantity}), 0)`
        }).from(productionBatches).where(and2(eq(productionBatches.batchDate, today), eq(productionBatches.userId, userId)));
        const todayProductionCost = await db.select({
          total: sql2`COALESCE(SUM(${productionBatches.totalCost}), 0)`
        }).from(productionBatches).where(and2(eq(productionBatches.batchDate, today), eq(productionBatches.userId, userId)));
        const todaySales = await db.select({
          total: sql2`COALESCE(SUM(${sales.totalAmount}), 0)`
        }).from(sales).where(and2(eq(sales.saleDate, today), eq(sales.userId, userId)));
        const todaySalesQty = await db.select({
          total: sql2`COALESCE(SUM(${salesItems.quantity}), 0)`
        }).from(salesItems).leftJoin(sales, eq(salesItems.saleId, sales.id)).where(and2(eq(sales.saleDate, today), eq(sales.userId, userId)));
        const todayDeliveries = await db.select({
          total: sql2`COALESCE(SUM(${deliveryItems.quantity}), 0)`
        }).from(deliveryItems).leftJoin(deliveries, eq(deliveryItems.deliveryId, deliveries.id)).where(and2(eq(deliveries.deliveryDate, today), eq(deliveries.userId, userId)));
        const todayExpenses = await db.select({
          total: sql2`COALESCE(SUM(${expenses.amount}), 0)`
        }).from(expenses).where(and2(eq(expenses.expenseDate, today), eq(expenses.userId, userId)));
        const todayRejections = await db.select({
          count: sql2`COALESCE(SUM(${deliveryItems.rejectedQty}), 0)`,
          value: sql2`COALESCE(SUM(${deliveryItems.rejectedQty} * ${deliveryItems.unitPrice}), 0)`
        }).from(deliveryItems).leftJoin(deliveries, eq(deliveryItems.deliveryId, deliveries.id)).where(and2(eq(deliveries.deliveryDate, today), eq(deliveries.userId, userId)));
        const weekSales = await db.select({
          total: sql2`COALESCE(SUM(${sales.totalAmount}), 0)`
        }).from(sales).where(and2(gte(sales.saleDate, weekAgo), eq(sales.userId, userId)));
        const totalRevenue = await db.select({
          total: sql2`COALESCE(SUM(${sales.totalAmount}), 0)`
        }).from(sales).where(eq(sales.userId, userId));
        const totalProductionCost = await db.select({
          total: sql2`COALESCE(SUM(${productionBatches.totalCost}), 0)`
        }).from(productionBatches).where(eq(productionBatches.userId, userId));
        const totalExpenses = await db.select({
          total: sql2`COALESCE(SUM(${expenses.amount}), 0)`
        }).from(expenses).where(eq(expenses.userId, userId));
        const revenue = parseFloat(totalRevenue[0]?.total || "0");
        const prodCost = parseFloat(totalProductionCost[0]?.total || "0");
        const expCost = parseFloat(totalExpenses[0]?.total || "0");
        const netProfit = revenue - prodCost - expCost;
        const todaySalesValue = parseFloat(todaySales[0]?.total || "0");
        const todayProdCost = parseFloat(todayProductionCost[0]?.total || "0");
        const todayExpValue = parseFloat(todayExpenses[0]?.total || "0");
        const todayProfit = todaySalesValue - todayProdCost - todayExpValue;
        const productionQty = todayProduction[0]?.total || 0;
        const deliveredQty = todayDeliveries[0]?.total || 0;
        const soldQty = todaySalesQty[0]?.total || 0;
        const balanceQty = productionQty - deliveredQty;
        const totalReadyStock = await db.select({
          total: sql2`COALESCE(SUM(${productionBatches.remainingQty}), 0)`
        }).from(productionBatches).where(and2(
          eq(productionBatches.userId, userId),
          sql2`${productionBatches.remainingQty} > 0`
        ));
        const expiringSoon = await db.select({
          count: sql2`COUNT(*)`
        }).from(productionBatches).where(
          and2(
            eq(productionBatches.userId, userId),
            sql2`${productionBatches.remainingQty} > 0`,
            sql2`${productionBatches.expiryDate} IS NOT NULL`,
            sql2`${productionBatches.expiryDate} <= CURRENT_DATE + INTERVAL '3 days'`,
            sql2`${productionBatches.expiryDate} >= CURRENT_DATE`
          )
        );
        const firstDayOfMonth = new Date((/* @__PURE__ */ new Date()).getFullYear(), (/* @__PURE__ */ new Date()).getMonth(), 1).toISOString().split("T")[0];
        const monthlyCommission = [{ total: "0" }];
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
          alerts: []
        };
      }
      async getProfitLossReport(userId) {
        const totalSalesResult = await db.select({
          total: sql2`COALESCE(SUM(${sales.totalAmount}), 0)`
        }).from(sales).where(eq(sales.userId, userId));
        const totalCostsResult = await db.select({
          production: sql2`COALESCE(SUM(${productionBatches.totalCost}), 0)`,
          expenses: sql2`COALESCE(SUM(${expenses.amount}), 0)`
        }).from(productionBatches).fullJoin(expenses, sql2`1=1`).where(and2(eq(productionBatches.userId, userId), eq(expenses.userId, userId)));
        const rejectionLossResult = await db.select({
          total: sql2`COALESCE(SUM(${deliveryItems.rejectedQty} * ${deliveryItems.unitPrice}), 0)`
        }).from(deliveryItems).innerJoin(deliveries, eq(deliveryItems.deliveryId, deliveries.id)).where(eq(deliveries.userId, userId));
        const totalSales = parseFloat(totalSalesResult[0]?.total || "0");
        const productionCost = parseFloat(totalCostsResult[0]?.production || "0");
        const expensesCost = parseFloat(totalCostsResult[0]?.expenses || "0");
        const rejectionLoss = parseFloat(rejectionLossResult[0]?.total || "0");
        const totalCosts = productionCost + expensesCost + rejectionLoss;
        const netProfit = totalSales - totalCosts;
        const profitMargin = totalSales > 0 ? (netProfit / totalSales * 100).toFixed(1) : "0";
        return {
          totalSales: totalSales.toFixed(2),
          totalCosts: totalCosts.toFixed(2),
          rejectionLoss: rejectionLoss.toFixed(2),
          netProfit: netProfit.toFixed(2),
          profitMargin
        };
      }
      async getWeeklyProfitSummary(userId) {
        const now = /* @__PURE__ */ new Date();
        const currentDay = now.getDay();
        const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1;
        const currentWeekStart = new Date(now);
        currentWeekStart.setDate(now.getDate() - daysFromMonday);
        currentWeekStart.setHours(0, 0, 0, 0);
        const currentWeekEnd = new Date(currentWeekStart);
        currentWeekEnd.setDate(currentWeekStart.getDate() + 6);
        currentWeekEnd.setHours(23, 59, 59, 999);
        const lastWeekStart = new Date(currentWeekStart);
        lastWeekStart.setDate(currentWeekStart.getDate() - 7);
        const lastWeekEnd = new Date(currentWeekStart);
        lastWeekEnd.setDate(currentWeekStart.getDate() - 1);
        lastWeekEnd.setHours(23, 59, 59, 999);
        const currentWeekSales = await db.select({
          pos: sql2`COALESCE(SUM(CASE WHEN ${sales.saleDate} >= ${currentWeekStart.toISOString()} AND ${sales.saleDate} <= ${currentWeekEnd.toISOString()} THEN ${sales.totalAmount} ELSE 0 END), 0)`,
          deliveries: sql2`COALESCE(SUM(CASE WHEN ${deliveries.deliveryDate} >= ${currentWeekStart.toISOString()} AND ${deliveries.deliveryDate} <= ${currentWeekEnd.toISOString()} AND ${deliveries.status}::text = 'claimed' THEN ${deliveries.totalAmount} ELSE 0 END), 0)`
        }).from(sales).fullJoin(deliveries, sql2`1=1`).where(and2(eq(sales.userId, userId), eq(deliveries.userId, userId)));
        const lastWeekSales = await db.select({
          pos: sql2`COALESCE(SUM(CASE WHEN ${sales.saleDate} >= ${lastWeekStart.toISOString()} AND ${sales.saleDate} <= ${lastWeekEnd.toISOString()} THEN ${sales.totalAmount} ELSE 0 END), 0)`,
          deliveries: sql2`COALESCE(SUM(CASE WHEN ${deliveries.deliveryDate} >= ${lastWeekStart.toISOString()} AND ${deliveries.deliveryDate} <= ${lastWeekEnd.toISOString()} AND ${deliveries.status}::text = 'claimed' THEN ${deliveries.totalAmount} ELSE 0 END), 0)`
        }).from(sales).fullJoin(deliveries, sql2`1=1`).where(and2(eq(sales.userId, userId), eq(deliveries.userId, userId)));
        const currentWeekCosts = await db.select({
          production: sql2`COALESCE(SUM(CASE WHEN ${productionBatches.batchDate} >= ${currentWeekStart.toISOString()} AND ${productionBatches.batchDate} <= ${currentWeekEnd.toISOString()} THEN ${productionBatches.totalCost} ELSE 0 END), 0)`,
          expenses: sql2`COALESCE(SUM(CASE WHEN ${expenses.expenseDate} >= ${currentWeekStart.toISOString()} AND ${expenses.expenseDate} <= ${currentWeekEnd.toISOString()} THEN ${expenses.amount} ELSE 0 END), 0)`
        }).from(productionBatches).fullJoin(expenses, sql2`1=1`).where(and2(eq(productionBatches.userId, userId), eq(expenses.userId, userId)));
        const lastWeekCosts = await db.select({
          production: sql2`COALESCE(SUM(CASE WHEN ${productionBatches.batchDate} >= ${lastWeekStart.toISOString()} AND ${productionBatches.batchDate} <= ${lastWeekEnd.toISOString()} THEN ${productionBatches.totalCost} ELSE 0 END), 0)`,
          expenses: sql2`COALESCE(SUM(CASE WHEN ${expenses.expenseDate} >= ${lastWeekStart.toISOString()} AND ${expenses.expenseDate} <= ${lastWeekEnd.toISOString()} THEN ${expenses.amount} ELSE 0 END), 0)`
        }).from(productionBatches).fullJoin(expenses, sql2`1=1`).where(and2(eq(productionBatches.userId, userId), eq(expenses.userId, userId)));
        const currentRevenue = parseFloat(currentWeekSales[0]?.pos || "0") + parseFloat(currentWeekSales[0]?.deliveries || "0");
        const lastRevenue = parseFloat(lastWeekSales[0]?.pos || "0") + parseFloat(lastWeekSales[0]?.deliveries || "0");
        const currentCosts = parseFloat(currentWeekCosts[0]?.production || "0") + parseFloat(currentWeekCosts[0]?.expenses || "0");
        const lastCosts = parseFloat(lastWeekCosts[0]?.production || "0") + parseFloat(lastWeekCosts[0]?.expenses || "0");
        const currentProfit = currentRevenue - currentCosts;
        const lastProfit = lastRevenue - lastCosts;
        const revenueChange = lastRevenue > 0 ? (currentRevenue - lastRevenue) / lastRevenue * 100 : 0;
        const profitChange = lastProfit > 0 ? (currentProfit - lastProfit) / lastProfit * 100 : 0;
        const profitMargin = currentRevenue > 0 ? currentProfit / currentRevenue * 100 : 0;
        return {
          currentWeek: {
            revenue: currentRevenue.toFixed(2),
            costs: currentCosts.toFixed(2),
            profit: currentProfit.toFixed(2),
            profitMargin: profitMargin.toFixed(1)
          },
          lastWeek: {
            revenue: lastRevenue.toFixed(2),
            costs: lastCosts.toFixed(2),
            profit: lastProfit.toFixed(2)
          },
          comparison: {
            revenueChange: revenueChange.toFixed(1),
            profitChange: profitChange.toFixed(1),
            isGrowth: profitChange >= 0
          },
          weekRange: {
            start: currentWeekStart.toISOString().split("T")[0],
            end: currentWeekEnd.toISOString().split("T")[0]
          }
        };
      }
      async getTopProducts(userId) {
        const topProducts = await db.select({
          id: products.id,
          name: products.name,
          totalSold: sql2`COALESCE(SUM(${salesItems.quantity}), 0)`,
          totalRevenue: sql2`COALESCE(SUM(${salesItems.totalPrice}), 0)`,
          totalCost: sql2`COALESCE(SUM(${salesItems.totalCost}), 0)`,
          totalProfit: sql2`COALESCE(SUM(${salesItems.profitAmount}), 0)`
        }).from(products).leftJoin(salesItems, and2(eq(products.id, salesItems.productId), eq(salesItems.userId, userId))).where(eq(products.userId, userId)).groupBy(products.id, products.name).orderBy(sql2`COALESCE(SUM(${salesItems.totalPrice}), 0) DESC`).limit(5);
        return topProducts.map((p) => ({
          id: p.id,
          name: p.name,
          totalSold: p.totalSold,
          totalRevenue: parseFloat(p.totalRevenue || "0").toFixed(2),
          totalCost: parseFloat(p.totalCost || "0").toFixed(2),
          totalProfit: parseFloat(p.totalProfit || "0").toFixed(2)
        }));
      }
      async getTopVendors(userId) {
        const topVendors = await db.select({
          id: vendors.id,
          name: vendors.name,
          totalDeliveries: sql2`COUNT(${deliveries.id})`,
          totalAmount: sql2`COALESCE(SUM(${deliveries.totalAmount}), 0)`
        }).from(vendors).leftJoin(deliveries, and2(eq(vendors.id, deliveries.vendorId), eq(deliveries.userId, userId))).where(eq(vendors.userId, userId)).groupBy(vendors.id, vendors.name).orderBy(sql2`COALESCE(SUM(${deliveries.totalAmount}), 0) DESC`).limit(5);
        return topVendors;
      }
      async getMonthlyData(userId) {
        return [];
      }
      // Advanced Analytics Methods
      async getProductPerformanceAnalytics(userId) {
        try {
          const allProducts = await db.select().from(products).where(eq(products.userId, userId));
          if (!allProducts || allProducts.length === 0) {
            return {
              mostProfitable: [],
              fastestSelling: [],
              mostRejected: [],
              allProducts: []
            };
          }
          const productMetrics = await Promise.all(
            allProducts.map(async (product) => {
              const salesData = await db.select({
                totalQuantity: sql2`COALESCE(SUM(${salesItems.quantity}), 0)`,
                totalRevenue: sql2`COALESCE(SUM(CAST(${salesItems.quantity} AS DECIMAL) * CAST(${salesItems.unitPrice} AS DECIMAL)), 0)`
              }).from(salesItems).innerJoin(sales, eq(salesItems.saleId, sales.id)).where(and2(eq(salesItems.productId, product.id), eq(sales.userId, userId)));
              const deliveryData = await db.select({
                totalQuantity: sql2`COALESCE(SUM(${deliveryItems.quantity}), 0)`,
                totalRevenue: sql2`COALESCE(SUM(CAST(${deliveryItems.quantity} AS DECIMAL) * CAST(${deliveryItems.unitPrice} AS DECIMAL)), 0)`,
                totalRejected: sql2`COALESCE(SUM(${deliveryItems.rejectedQty}), 0)`
              }).from(deliveryItems).innerJoin(deliveries, eq(deliveryItems.deliveryId, deliveries.id)).where(and2(eq(deliveryItems.productId, product.id), eq(deliveries.userId, userId)));
              const totalQtySold = Number(salesData[0]?.totalQuantity || 0) + Number(deliveryData[0]?.totalQuantity || 0);
              const totalRevenue = parseFloat(salesData[0]?.totalRevenue || "0") + parseFloat(deliveryData[0]?.totalRevenue || "0");
              const totalRejected = Number(deliveryData[0]?.totalRejected || 0);
              const costPerUnit = parseFloat(product.costPerUnit);
              const totalProfit = totalRevenue - totalQtySold * costPerUnit;
              const profitMargin = totalRevenue > 0 ? totalProfit / totalRevenue * 100 : 0;
              const rejectionRate = totalQtySold > 0 ? totalRejected / (totalQtySold + totalRejected) * 100 : 0;
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
                costPerUnit: costPerUnit.toFixed(2)
              };
            })
          );
          const mostProfitable = [...productMetrics].filter((p) => parseFloat(p.totalProfit) > 0).sort((a, b) => parseFloat(b.totalProfit) - parseFloat(a.totalProfit)).slice(0, 5);
          const fastestSelling = [...productMetrics].filter((p) => p.totalQtySold > 0).sort((a, b) => b.totalQtySold - a.totalQtySold).slice(0, 5);
          const mostRejected = [...productMetrics].filter((p) => p.totalRejected > 0).sort((a, b) => parseFloat(b.rejectionRate) - parseFloat(a.rejectionRate)).slice(0, 5);
          return {
            mostProfitable,
            fastestSelling,
            mostRejected,
            allProducts: productMetrics
          };
        } catch (error) {
          console.error("Product performance analytics error:", error);
          return {
            mostProfitable: [],
            fastestSelling: [],
            mostRejected: [],
            allProducts: []
          };
        }
      }
      async getVendorPerformanceLeaderboard(userId) {
        const allVendors = await db.select().from(vendors).where(eq(vendors.userId, userId));
        const vendorMetrics = await Promise.all(
          allVendors.map(async (vendor) => {
            const deliveriesData = await db.select({
              totalDeliveries: sql2`COUNT(*)`,
              totalAmount: sql2`COALESCE(SUM(${deliveries.totalAmount}), 0)`,
              settledCount: sql2`COUNT(CASE WHEN CAST(${deliveries.paymentStatus} AS TEXT) = 'settled' THEN 1 END)`,
              pendingCount: sql2`COUNT(CASE WHEN CAST(${deliveries.paymentStatus} AS TEXT) = 'pending' THEN 1 END)`
            }).from(deliveries).where(and2(eq(deliveries.vendorId, vendor.id), eq(deliveries.userId, userId)));
            const stats = deliveriesData[0];
            const totalDeliveries = Number(stats?.totalDeliveries || 0);
            const settledCount = Number(stats?.settledCount || 0);
            const paymentRate = totalDeliveries > 0 ? settledCount / totalDeliveries * 100 : 0;
            const settledDeliveries = await db.select({
              deliveryDate: deliveries.deliveryDate,
              createdAt: deliveries.createdAt
            }).from(deliveries).where(
              and2(
                eq(deliveries.vendorId, vendor.id),
                eq(deliveries.paymentStatus, "settled"),
                eq(deliveries.userId, userId)
              )
            );
            let avgDaysToPayment = 0;
            if (settledDeliveries.length > 0) {
              const totalDays = settledDeliveries.reduce((sum, d) => {
                const deliveryDate = new Date(d.deliveryDate);
                const paidDate = new Date(d.createdAt);
                const days = Math.ceil((paidDate.getTime() - deliveryDate.getTime()) / (1e3 * 60 * 60 * 24));
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
              score: paymentRate - avgDaysToPayment * 2
              // Higher payment rate, lower days = higher score
            };
          })
        );
        return vendorMetrics.filter((v) => v.totalDeliveries > 0).sort((a, b) => b.score - a.score);
      }
      async getAgentPerformanceLeaderboard(userId) {
        const allResellers = await db.select().from(resellers).where(eq(resellers.userId, userId));
        const resellerMetrics = await Promise.all(
          allResellers.map(async (reseller) => {
            const transfersData = await db.select({
              totalTransfers: sql2`COUNT(*)`,
              totalAmount: sql2`COALESCE(SUM(${resellerTransfers.totalAmount}), 0)`,
              paidCount: sql2`COUNT(CASE WHEN CAST(${resellerTransfers.paymentStatus} AS TEXT) = 'paid' THEN 1 END)`
            }).from(resellerTransfers).where(and2(eq(resellerTransfers.resellerId, reseller.id), eq(resellerTransfers.userId, userId)));
            const quantityData = await db.select({
              totalQty: sql2`COALESCE(SUM(${resellerTransferItems.quantity}), 0)`
            }).from(resellerTransferItems).innerJoin(resellerTransfers, eq(resellerTransferItems.transferId, resellerTransfers.id)).where(and2(eq(resellerTransfers.resellerId, reseller.id), eq(resellerTransfers.userId, userId)));
            const stats = transfersData[0];
            const totalTransfers = Number(stats?.totalTransfers || 0);
            const paidCount = Number(stats?.paidCount || 0);
            const paymentRate = totalTransfers > 0 ? paidCount / totalTransfers * 100 : 0;
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
              score: parseFloat(stats?.totalAmount || "0") + paymentRate * 10
              // Higher revenue + payment rate = higher score
            };
          })
        );
        return resellerMetrics.filter((r) => r.totalTransfers > 0).sort((a, b) => b.score - a.score);
      }
      async getSalesTrendData(userId, days = 30) {
        const endDate = /* @__PURE__ */ new Date();
        const startDate = /* @__PURE__ */ new Date();
        startDate.setDate(endDate.getDate() - days);
        const dailyData = [];
        for (let i = 0; i < days; i++) {
          const currentDate = new Date(startDate);
          currentDate.setDate(startDate.getDate() + i);
          const dateStr = currentDate.toISOString().split("T")[0];
          const nextDate = new Date(currentDate);
          nextDate.setDate(currentDate.getDate() + 1);
          const posSales = await db.select({
            total: sql2`COALESCE(SUM(${sales.totalAmount}), 0)`
          }).from(sales).where(
            and2(
              eq(sales.userId, userId),
              gte(sales.saleDate, currentDate.toISOString()),
              lte(sales.saleDate, nextDate.toISOString())
            )
          );
          const deliverySales = await db.select({
            total: sql2`COALESCE(SUM(${deliveries.totalAmount}), 0)`
          }).from(deliveries).where(
            and2(
              eq(deliveries.userId, userId),
              gte(deliveries.deliveryDate, currentDate.toISOString()),
              lte(deliveries.deliveryDate, nextDate.toISOString())
            )
          );
          const productionCosts = await db.select({
            total: sql2`COALESCE(SUM(${productionBatches.totalCost}), 0)`
          }).from(productionBatches).where(
            and2(
              eq(productionBatches.userId, userId),
              gte(productionBatches.batchDate, currentDate.toISOString()),
              lte(productionBatches.batchDate, nextDate.toISOString())
            )
          );
          const expensesCosts = await db.select({
            total: sql2`COALESCE(SUM(${expenses.amount}), 0)`
          }).from(expenses).where(
            and2(
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
            profit: profit.toFixed(2)
          });
        }
        return dailyData;
      }
      // Helper function to calculate commission
      async calculateCommission(userId, vendorId, amount) {
        const commission = await this.getVendorCommission(userId, vendorId);
        if (!commission) {
          return 0;
        }
        if (commission.commissionType === "percentage") {
          const percentage = parseFloat(commission.percentage || "0");
          return amount * percentage / 100;
        } else if (commission.commissionType === "fixed_range") {
          try {
            const ranges = JSON.parse(commission.ranges || "[]");
            for (const range of ranges) {
              if (amount >= parseFloat(range.min) && amount <= parseFloat(range.max)) {
                return parseFloat(range.amount);
              }
            }
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
      async getClaimsSummary(userId, limit = 20, offset = 0) {
        const uniqueVendors = await db.selectDistinct({
          vendorId: deliveries.vendorId,
          vendorName: deliveries.vendorName
        }).from(deliveries).where(eq(deliveries.userId, userId));
        const claimsSummary = await Promise.all(
          uniqueVendors.map(async (vendor) => {
            const details = await this.getClaimDetailsByVendor(userId, vendor.vendorId);
            const latestDelivery = details.deliveries && details.deliveries.length > 0 ? new Date(details.deliveries[0].deliveryDate).getTime() : 0;
            let oldestUnpaidDate = 0;
            let daysOverdue = 0;
            if (details.deliveries && details.deliveries.length > 0) {
              const unpaidDeliveries = details.deliveries.filter(
                (d) => d.paymentStatus === "pending" || d.paymentStatus === "partial"
              );
              if (unpaidDeliveries.length > 0) {
                const oldestUnpaid = unpaidDeliveries[unpaidDeliveries.length - 1];
                oldestUnpaidDate = new Date(oldestUnpaid.deliveryDate).getTime();
                const today = /* @__PURE__ */ new Date();
                const diffTime = Math.abs(today.getTime() - oldestUnpaidDate);
                daysOverdue = Math.ceil(diffTime / (1e3 * 60 * 60 * 24));
              }
            }
            return {
              vendorId: vendor.vendorId,
              vendorName: vendor.vendorName,
              totalDeliveries: details.totalDeliveries,
              totalAmount: details.claimableAmount,
              // Use claimable amount (after commission & rejections)
              pendingAmount: details.pendingAmount,
              settledAmount: details.settledAmount,
              partialAmount: details.partialAmount,
              latestDeliveryDate: latestDelivery,
              daysOverdue
            };
          })
        );
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
      async getClaimDetailsByVendor(userId, vendorId) {
        const vendorDeliveries = await db.select().from(deliveries).where(and2(eq(deliveries.vendorId, vendorId), eq(deliveries.userId, userId))).orderBy(desc2(deliveries.deliveryDate));
        const deliveriesWithItems = await Promise.all(
          vendorDeliveries.map(async (delivery) => {
            const items = await db.select().from(deliveryItems).where(eq(deliveryItems.deliveryId, delivery.id));
            let grossAmount = 0;
            let rejectedAmount = 0;
            items.forEach((item) => {
              const itemGross = item.quantity * parseFloat(item.unitPrice);
              const itemRejected = (item.rejectedQty || 0) * parseFloat(item.unitPrice);
              grossAmount += itemGross;
              rejectedAmount += itemRejected;
            });
            const netAmount = grossAmount - rejectedAmount;
            const commission = await this.calculateCommission(userId, vendorId, netAmount);
            const claimableAmount = netAmount - commission;
            const itemsWithCommission = items.map((item) => {
              const itemGross = item.quantity * parseFloat(item.unitPrice);
              const itemRejected = (item.rejectedQty || 0) * parseFloat(item.unitPrice);
              const itemNet = itemGross - itemRejected;
              const itemCommission = netAmount > 0 ? itemNet / netAmount * commission : 0;
              const itemClaimable = itemNet - itemCommission;
              return {
                ...item,
                itemGross: itemGross.toFixed(2),
                itemRejected: itemRejected.toFixed(2),
                itemNet: itemNet.toFixed(2),
                itemCommission: itemCommission.toFixed(2),
                itemClaimable: itemClaimable.toFixed(2)
              };
            });
            return {
              ...delivery,
              items: itemsWithCommission,
              grossAmount: grossAmount.toFixed(2),
              rejectedAmount: rejectedAmount.toFixed(2),
              netAmount: netAmount.toFixed(2),
              commission: commission.toFixed(2),
              claimableAmount: claimableAmount.toFixed(2)
            };
          })
        );
        let totalGross = 0;
        let totalRejected = 0;
        let totalCommission = 0;
        deliveriesWithItems.forEach((d) => {
          totalGross += parseFloat(d.grossAmount);
          totalRejected += parseFloat(d.rejectedAmount);
          totalCommission += parseFloat(d.commission);
        });
        const totalNet = totalGross - totalRejected;
        const totalClaimable = totalNet - totalCommission;
        const pendingAmount = deliveriesWithItems.filter((d) => d.paymentStatus === "pending").reduce((sum, d) => sum + parseFloat(d.claimableAmount), 0);
        const settledAmount = deliveriesWithItems.filter((d) => d.paymentStatus === "settled").reduce((sum, d) => sum + parseFloat(d.claimableAmount), 0);
        const partialAmount = deliveriesWithItems.filter((d) => d.paymentStatus === "partial").reduce((sum, d) => sum + parseFloat(d.claimableAmount), 0);
        return {
          vendorId,
          vendorName: vendorDeliveries[0]?.vendorName || "",
          totalDeliveries: vendorDeliveries.length,
          grossAmount: totalGross.toFixed(2),
          rejectedAmount: totalRejected.toFixed(2),
          commissionAmount: totalCommission.toFixed(2),
          netAmount: totalNet.toFixed(2),
          claimableAmount: totalClaimable.toFixed(2),
          pendingAmount: pendingAmount.toFixed(2),
          settledAmount: settledAmount.toFixed(2),
          partialAmount: partialAmount.toFixed(2),
          deliveries: deliveriesWithItems
        };
      }
      // Business Profile
      async getBusinessProfile(userId) {
        const [profile] = await db.select().from(businessProfile).where(eq(businessProfile.userId, userId)).limit(1);
        return profile || void 0;
      }
      async createOrUpdateBusinessProfile(userId, profile) {
        const existing = await this.getBusinessProfile(userId);
        if (existing) {
          const [updated] = await db.update(businessProfile).set({ ...profile, updatedAt: /* @__PURE__ */ new Date() }).where(and2(eq(businessProfile.id, existing.id), eq(businessProfile.userId, userId))).returning();
          return updated;
        } else {
          const [newProfile] = await db.insert(businessProfile).values({ ...profile, userId }).returning();
          return newProfile;
        }
      }
      // Google Drive Sync
      async logGoogleDriveSync(userId, log2) {
        const [syncLog] = await db.insert(googleDriveSyncLog).values({ ...log2, userId }).returning();
        return syncLog;
      }
      async getGoogleDriveSyncLogs(userId) {
        const logs = await db.select().from(googleDriveSyncLog).where(eq(googleDriveSyncLog.userId, userId)).orderBy(desc2(googleDriveSyncLog.syncedAt)).limit(100);
        return logs;
      }
      async getGoogleDriveSyncLogsByDelivery(userId, deliveryId) {
        const logs = await db.select().from(googleDriveSyncLog).where(and2(eq(googleDriveSyncLog.deliveryId, deliveryId), eq(googleDriveSyncLog.userId, userId))).orderBy(desc2(googleDriveSyncLog.syncedAt));
        return logs;
      }
      // Vendor Commissions
      async getVendorCommission(userId, vendorId) {
        const [commission] = await db.select().from(vendorCommissions).where(and2(eq(vendorCommissions.vendorId, vendorId), eq(vendorCommissions.userId, userId))).limit(1);
        return commission || void 0;
      }
      async createOrUpdateVendorCommission(userId, commission) {
        const existing = await this.getVendorCommission(userId, commission.vendorId);
        if (existing) {
          const [updated] = await db.update(vendorCommissions).set({ ...commission, updatedAt: /* @__PURE__ */ new Date() }).where(and2(eq(vendorCommissions.vendorId, commission.vendorId), eq(vendorCommissions.userId, userId))).returning();
          return updated;
        } else {
          const [newCommission] = await db.insert(vendorCommissions).values({ ...commission, userId }).returning();
          return newCommission;
        }
      }
      async deleteVendorCommission(userId, vendorId) {
        await db.delete(vendorCommissions).where(and2(eq(vendorCommissions.vendorId, vendorId), eq(vendorCommissions.userId, userId)));
      }
      // Stock Items (Warehouse Inventory)
      async getStockItems(userId) {
        return await db.select().from(stockItems).where(eq(stockItems.userId, userId)).orderBy(desc2(stockItems.createdAt));
      }
      async getStockItem(userId, id) {
        const result = await db.select().from(stockItems).where(and2(eq(stockItems.id, id), eq(stockItems.userId, userId)));
        return result[0];
      }
      async getStockItemsByIds(ids, userId) {
        return await db.select().from(stockItems).where(and2(
          inArray(stockItems.id, ids),
          eq(stockItems.userId, userId)
        ));
      }
      async createStockItem(userId, item) {
        return await db.transaction(async (tx) => {
          const [created] = await tx.insert(stockItems).values({ ...item, userId }).returning();
          await tx.insert(stockMovements).values({
            userId,
            stockItemId: created.id,
            movementType: "purchase",
            quantityBefore: "0",
            quantityChange: created.currentQuantity,
            quantityAfter: created.currentQuantity,
            reason: `Initial stock: ${created.name}`,
            referenceType: "initial_stock",
            createdBy: userId
          });
          return created;
        });
      }
      async updateStockItem(userId, id, item, expectedVersion) {
        return await db.transaction(async (tx) => {
          const [current] = await tx.select().from(stockItems).where(and2(eq(stockItems.id, id), eq(stockItems.userId, userId))).for("update");
          if (!current) {
            throw new Error("Stock item not found");
          }
          if (expectedVersion !== void 0 && current.version !== expectedVersion) {
            throw new Error("Stock item was modified by another user. Please refresh and try again.");
          }
          const updateData = {
            ...item,
            updatedAt: /* @__PURE__ */ new Date(),
            version: current.version + 1
            // Increment version
          };
          const [updated] = await tx.update(stockItems).set(updateData).where(and2(eq(stockItems.id, id), eq(stockItems.userId, userId))).returning();
          if (item.currentQuantity && item.currentQuantity !== current.currentQuantity) {
            const qtyBefore = parseFloat(current.currentQuantity);
            const qtyAfter = parseFloat(item.currentQuantity);
            const qtyChange = qtyAfter - qtyBefore;
            await tx.insert(stockMovements).values({
              userId,
              stockItemId: id,
              movementType: qtyChange > 0 ? "replenish" : "adjust",
              quantityBefore: current.currentQuantity,
              quantityChange: qtyChange.toFixed(2),
              quantityAfter: item.currentQuantity,
              reason: item.notes || "Stock quantity updated",
              referenceType: "manual_update",
              createdBy: userId
            });
          }
          return updated;
        });
      }
      async deleteStockItem(userId, id) {
        await db.delete(stockItems).where(and2(eq(stockItems.id, id), eq(stockItems.userId, userId)));
      }
      async deleteAllStockItems(userId) {
        await db.delete(stockItems).where(eq(stockItems.userId, userId));
      }
      async getLowStockItems(userId) {
        return await db.select().from(stockItems).where(and2(
          eq(stockItems.userId, userId),
          sql2`${stockItems.currentQuantity} <= ${stockItems.lowStockThreshold}`
        )).orderBy(stockItems.currentQuantity);
      }
      // Stock Movements (Audit Trail)
      async logStockMovement(movement) {
        const [created] = await db.insert(stockMovements).values(movement).returning();
        return created;
      }
      async getStockMovements(userId, stockItemId) {
        if (stockItemId) {
          return await db.select().from(stockMovements).where(and2(
            eq(stockMovements.userId, userId),
            eq(stockMovements.stockItemId, stockItemId)
          )).orderBy(desc2(stockMovements.createdAt));
        }
        return await db.select().from(stockMovements).where(eq(stockMovements.userId, userId)).orderBy(desc2(stockMovements.createdAt));
      }
      // Categories
      async getCategories(userId) {
        return await db.select().from(categories).where(eq(categories.userId, userId)).orderBy(categories.name);
      }
      async createCategory(userId, category) {
        const result = await db.insert(categories).values({ ...category, userId }).returning();
        return result[0];
      }
      // Recipe Items
      async getRecipeItems(productId) {
        return await db.select().from(recipeItems).where(eq(recipeItems.productId, productId));
      }
      async createRecipeItem(item) {
        const result = await db.insert(recipeItems).values(item).returning();
        return result[0];
      }
      async deleteRecipeItems(productId) {
        await db.delete(recipeItems).where(eq(recipeItems.productId, productId));
      }
      async validateRecipe(userId, recipeItemsList) {
        const errors = [];
        if (!recipeItemsList || recipeItemsList.length === 0) {
          errors.push("Recipe must have at least one ingredient");
          return { valid: false, errors };
        }
        const stockItemIds = recipeItemsList.map((r) => r.stockItemId);
        const existingStockItems = await this.getStockItemsByIds(stockItemIds, userId);
        const existingIds = new Set(existingStockItems.map((s) => s.id));
        recipeItemsList.forEach((item, index2) => {
          if (!existingIds.has(item.stockItemId)) {
            errors.push(`Recipe item ${index2 + 1}: Stock item no longer exists or does not belong to you`);
          }
        });
        recipeItemsList.forEach((item, index2) => {
          const qty = parseFloat(item.quantityNeeded);
          if (isNaN(qty) || qty <= 0) {
            errors.push(`Recipe item ${index2 + 1}: Quantity must be a positive number (got "${item.quantityNeeded}")`);
          }
        });
        const uniqueIds = new Set(stockItemIds);
        if (uniqueIds.size !== stockItemIds.length) {
          errors.push("Recipe contains duplicate ingredients. Each stock item can only be used once per product.");
        }
        const warnings = [];
        recipeItemsList.forEach((item, index2) => {
          const stockItem = existingStockItems.find((s) => s.id === item.stockItemId);
          if (stockItem) {
            const currentQty = parseFloat(stockItem.currentQuantity);
            if (currentQty <= 0) {
              warnings.push(`Warning: Recipe item ${index2 + 1} ("${stockItem.name}") is currently out of stock`);
            } else if (currentQty < parseFloat(item.quantityNeeded)) {
              warnings.push(`Warning: Recipe item ${index2 + 1} ("${stockItem.name}") has insufficient stock (available: ${currentQty}${stockItem.unit}, needed: ${item.quantityNeeded}${item.usageUnit})`);
            }
          }
        });
        if (warnings.length > 0) {
          errors.push(...warnings);
        }
        const hasCriticalErrors = errors.some((e) => !e.startsWith("Warning:"));
        return {
          valid: !hasCriticalErrors,
          errors
        };
      }
      // Shopping Cart
      async addToShoppingCart(userId, item) {
        const result = await db.insert(shoppingCart).values({ ...item, userId }).returning();
        return result[0];
      }
      async getShoppingCartItems(userId) {
        return await db.select().from(shoppingCart).where(eq(shoppingCart.userId, userId)).orderBy(desc2(shoppingCart.createdAt));
      }
      async removeFromCart(userId, id) {
        await db.delete(shoppingCart).where(and2(eq(shoppingCart.id, id), eq(shoppingCart.userId, userId)));
      }
      async clearCart(userId) {
        await db.delete(shoppingCart).where(eq(shoppingCart.userId, userId));
      }
      async bulkPurchaseAndUpdateStock(userId, cartItemIds) {
        await db.transaction(async (tx) => {
          const items = await tx.select().from(shoppingCart).where(
            and2(inArray(shoppingCart.id, cartItemIds), eq(shoppingCart.userId, userId))
          );
          for (const item of items) {
            const stockItem = await tx.select().from(stockItems).where(
              and2(eq(stockItems.id, item.stockItemId), eq(stockItems.userId, userId))
            ).limit(1);
            if (stockItem.length > 0) {
              const currentQty = parseFloat(stockItem[0].currentQuantity);
              const shortage = parseFloat(item.shortageQty);
              const newQty = currentQty + shortage;
              await tx.update(stockItems).set({
                currentQuantity: newQty.toString(),
                updatedAt: /* @__PURE__ */ new Date()
              }).where(and2(eq(stockItems.id, item.stockItemId), eq(stockItems.userId, userId)));
            }
          }
          await tx.delete(shoppingCart).where(
            and2(inArray(shoppingCart.id, cartItemIds), eq(shoppingCart.userId, userId))
          );
        });
      }
      // Purchase Orders (Smart Supplier Order Hub)
      async createPurchaseOrder(userId, orderData, items) {
        return await db.transaction(async (tx) => {
          const [order] = await tx.insert(purchaseOrders).values({ ...orderData, userId }).returning();
          const itemsWithPoId = items.map((item) => ({ ...item, poId: order.id, userId }));
          await tx.insert(purchaseOrderItems).values(itemsWithPoId);
          return order;
        });
      }
      async getPurchaseOrders(userId) {
        const orders = await db.select().from(purchaseOrders).where(eq(purchaseOrders.userId, userId)).orderBy(desc2(purchaseOrders.createdAt));
        const ordersWithItems = await Promise.all(
          orders.map(async (order) => {
            const items = await db.select().from(purchaseOrderItems).where(eq(purchaseOrderItems.poId, order.id));
            return { ...order, items };
          })
        );
        return ordersWithItems;
      }
      async getPurchaseOrder(userId, id) {
        const [order] = await db.select().from(purchaseOrders).where(and2(eq(purchaseOrders.id, id), eq(purchaseOrders.userId, userId)));
        if (!order) return void 0;
        const items = await db.select().from(purchaseOrderItems).where(eq(purchaseOrderItems.poId, id));
        return { ...order, items };
      }
      async updatePurchaseOrderStatus(userId, id, status, additionalData) {
        const updateData = { status, updatedAt: /* @__PURE__ */ new Date() };
        if (status === "sent") {
          updateData.sentAt = /* @__PURE__ */ new Date();
        } else if (status === "received") {
          updateData.receivedAt = /* @__PURE__ */ new Date();
        }
        if (additionalData) {
          Object.assign(updateData, additionalData);
        }
        const [updated] = await db.update(purchaseOrders).set(updateData).where(and2(eq(purchaseOrders.id, id), eq(purchaseOrders.userId, userId))).returning();
        return updated;
      }
      async updatePurchaseOrder(userId, id, data) {
        return await db.transaction(async (tx) => {
          const updateData = { updatedAt: /* @__PURE__ */ new Date() };
          if (data.supplierName !== void 0) updateData.supplierName = data.supplierName;
          if (data.supplierPhone !== void 0) updateData.supplierPhone = data.supplierPhone;
          if (data.supplierEmail !== void 0) updateData.supplierEmail = data.supplierEmail;
          if (data.supplierAddress !== void 0) updateData.supplierAddress = data.supplierAddress;
          if (data.deliveryAddress !== void 0) updateData.deliveryAddress = data.deliveryAddress;
          if (data.notes !== void 0) updateData.notes = data.notes;
          if (data.expectedDeliveryDate !== void 0) updateData.expectedDeliveryDate = data.expectedDeliveryDate;
          if (data.paymentTerms !== void 0) updateData.paymentTerms = data.paymentTerms;
          if (data.paymentMethod !== void 0) updateData.paymentMethod = data.paymentMethod;
          if (data.requestedBy !== void 0) updateData.requestedBy = data.requestedBy;
          if (data.discount !== void 0) updateData.discount = data.discount;
          if (data.tax !== void 0) updateData.tax = data.tax;
          if (data.shippingCharges !== void 0) updateData.shippingCharges = data.shippingCharges;
          await tx.update(purchaseOrders).set(updateData).where(and2(eq(purchaseOrders.id, id), eq(purchaseOrders.userId, userId)));
          if (data.items !== void 0) {
            await tx.delete(purchaseOrderItems).where(eq(purchaseOrderItems.poId, id));
            if (data.items.length > 0) {
              await tx.insert(purchaseOrderItems).values(
                data.items.map((item) => ({
                  poId: id,
                  stockItemId: item.stockItemId || null,
                  itemName: item.itemName,
                  quantity: item.quantity,
                  unit: item.unit,
                  estimatedPrice: item.estimatedPrice || null,
                  notes: item.notes || null,
                  userId
                }))
              );
            }
            const subtotal = data.items.reduce((sum, item) => {
              const price = parseFloat(item.estimatedPrice || "0");
              const qty = parseFloat(item.quantity || "0");
              return sum + price * qty;
            }, 0);
            const discount = parseFloat(data.discount || "0");
            const shipping = parseFloat(data.shippingCharges || "0");
            const tax = parseFloat(data.tax || "0");
            const totalAmount = subtotal - discount + shipping + tax;
            await tx.update(purchaseOrders).set({ totalAmount: totalAmount.toString() }).where(and2(eq(purchaseOrders.id, id), eq(purchaseOrders.userId, userId)));
          }
          const [updatedPO] = await tx.select().from(purchaseOrders).where(and2(eq(purchaseOrders.id, id), eq(purchaseOrders.userId, userId)));
          const items = await tx.select().from(purchaseOrderItems).where(eq(purchaseOrderItems.poId, id));
          return { ...updatedPO, items };
        });
      }
      async deletePurchaseOrder(userId, id) {
        await db.delete(purchaseOrders).where(and2(eq(purchaseOrders.id, id), eq(purchaseOrders.userId, userId)));
      }
      async duplicatePurchaseOrder(userId, id) {
        return await db.transaction(async (tx) => {
          const [originalPO] = await tx.select().from(purchaseOrders).where(and2(eq(purchaseOrders.id, id), eq(purchaseOrders.userId, userId)));
          if (!originalPO) {
            throw new Error("Purchase order not found");
          }
          const originalItems = await tx.select().from(purchaseOrderItems).where(eq(purchaseOrderItems.poId, id));
          const today = /* @__PURE__ */ new Date();
          const dateStr = today.toISOString().split("T")[0].replace(/-/g, "");
          const userHash = userId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
          const lockId = parseInt(dateStr) * 1e6 + userHash % 1e6 + 1e5;
          await tx.execute(sql2`SELECT pg_advisory_xact_lock(${lockId})`);
          const latestPO = await tx.select().from(purchaseOrders).where(and2(
            eq(purchaseOrders.userId, userId),
            sql2`${purchaseOrders.poNumber} LIKE ${"PO-" + dateStr + "-%"}`
          )).orderBy(desc2(purchaseOrders.poNumber)).limit(1);
          let sequenceNumber = 1;
          if (latestPO.length > 0 && latestPO[0].poNumber) {
            const parts = latestPO[0].poNumber.split("-");
            if (parts.length === 3) {
              sequenceNumber = parseInt(parts[2]) + 1;
            }
          }
          const poNumber = `PO-${dateStr}-${String(sequenceNumber).padStart(3, "0")}`;
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
            status: "draft",
            // Always create as draft
            notes: originalPO.notes
          }).returning();
          if (originalItems.length > 0) {
            await tx.insert(purchaseOrderItems).values(
              originalItems.map((item) => ({
                poId: newPO.id,
                stockItemId: item.stockItemId,
                itemName: item.itemName,
                quantity: item.quantity,
                unit: item.unit,
                estimatedPrice: item.estimatedPrice,
                notes: item.notes,
                userId
              }))
            );
          }
          const items = await tx.select().from(purchaseOrderItems).where(eq(purchaseOrderItems.poId, newPO.id));
          return { ...newPO, items };
        });
      }
      // PO Template Management
      async getAllPOTemplates(userId) {
        const templates = await db.select().from(poTemplates).where(eq(poTemplates.userId, userId)).orderBy(desc2(poTemplates.createdAt));
        const templatesWithItems = await Promise.all(
          templates.map(async (template) => {
            const items = await db.select().from(poTemplateItems).where(and2(eq(poTemplateItems.templateId, template.id), eq(poTemplateItems.userId, userId)));
            return { ...template, items };
          })
        );
        return templatesWithItems;
      }
      async createPOTemplate(userId, data) {
        return await db.transaction(async (tx) => {
          const [template] = await tx.insert(poTemplates).values({
            templateName: data.templateName,
            supplierId: data.supplierId || null,
            supplierName: data.supplierName,
            supplierPhone: data.supplierPhone || null,
            notes: data.notes || null,
            userId
          }).returning();
          if (data.items && data.items.length > 0) {
            await tx.insert(poTemplateItems).values(
              data.items.map((item) => ({
                templateId: template.id,
                stockItemId: item.stockItemId || null,
                itemName: item.itemName,
                quantity: item.quantity,
                unit: item.unit,
                estimatedPrice: item.estimatedPrice || "0",
                notes: item.notes || null,
                userId
              }))
            );
          }
          const items = await tx.select().from(poTemplateItems).where(and2(eq(poTemplateItems.templateId, template.id), eq(poTemplateItems.userId, userId)));
          return { ...template, items };
        });
      }
      async deletePOTemplate(userId, id) {
        await db.delete(poTemplates).where(and2(eq(poTemplates.id, id), eq(poTemplates.userId, userId)));
      }
      async createPOFromTemplate(userId, templateId) {
        return await db.transaction(async (tx) => {
          const [template] = await tx.select().from(poTemplates).where(and2(eq(poTemplates.id, templateId), eq(poTemplates.userId, userId)));
          if (!template) {
            throw new Error("Template not found");
          }
          const templateItems = await tx.select().from(poTemplateItems).where(and2(eq(poTemplateItems.templateId, templateId), eq(poTemplateItems.userId, userId)));
          const today = /* @__PURE__ */ new Date();
          const dateStr = today.toISOString().split("T")[0].replace(/-/g, "");
          const userHash = userId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
          const lockId = parseInt(dateStr) * 1e6 + userHash % 1e6 + 1e5;
          await tx.execute(sql2`SELECT pg_advisory_xact_lock(${lockId})`);
          const latestPO = await tx.select().from(purchaseOrders).where(and2(
            eq(purchaseOrders.userId, userId),
            sql2`${purchaseOrders.poNumber} LIKE ${"PO-" + dateStr + "-%"}`
          )).orderBy(desc2(purchaseOrders.poNumber)).limit(1);
          let sequenceNumber = 1;
          if (latestPO.length > 0 && latestPO[0].poNumber) {
            const parts = latestPO[0].poNumber.split("-");
            if (parts.length === 3) {
              sequenceNumber = parseInt(parts[2]) + 1;
            }
          }
          const poNumber = `PO-${dateStr}-${String(sequenceNumber).padStart(3, "0")}`;
          const totalAmount = templateItems.reduce((sum, item) => {
            const price = parseFloat(item.estimatedPrice || "0");
            const qty = parseFloat(item.quantity || "0");
            return sum + price * qty;
          }, 0);
          const [order] = await tx.insert(purchaseOrders).values({
            poNumber,
            supplierId: template.supplierId,
            supplierName: template.supplierName,
            supplierPhone: template.supplierPhone,
            totalAmount: totalAmount.toFixed(2),
            notes: template.notes,
            status: "draft",
            userId
          }).returning();
          if (templateItems.length > 0) {
            await tx.insert(purchaseOrderItems).values(
              templateItems.map((item) => ({
                poId: order.id,
                stockItemId: item.stockItemId,
                itemName: item.itemName,
                quantity: item.quantity,
                unit: item.unit,
                estimatedPrice: item.estimatedPrice,
                notes: item.notes
              }))
            );
          }
          const items = await tx.select().from(purchaseOrderItems).where(eq(purchaseOrderItems.poId, order.id));
          return { ...order, items };
        });
      }
      async createPurchaseOrderFromCart(userId, supplierId, supplierName, supplierPhone, supplierEmail, supplierAddress, deliveryAddress, notes, cartItemIds) {
        return await db.transaction(async (tx) => {
          const cartItems = await tx.select().from(shoppingCart).where(
            and2(inArray(shoppingCart.id, cartItemIds), eq(shoppingCart.userId, userId))
          );
          const today = /* @__PURE__ */ new Date();
          const dateStr = today.toISOString().split("T")[0].replace(/-/g, "");
          const userHash = userId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
          const lockId = parseInt(dateStr) * 1e6 + userHash % 1e6 + 1e5;
          await tx.execute(sql2`SELECT pg_advisory_xact_lock(${lockId})`);
          const latestPO = await tx.select().from(purchaseOrders).where(and2(
            eq(purchaseOrders.userId, userId),
            sql2`${purchaseOrders.poNumber} LIKE ${"PO-" + dateStr + "-%"}`
          )).orderBy(desc2(purchaseOrders.poNumber)).limit(1);
          let sequenceNumber = 1;
          if (latestPO.length > 0 && latestPO[0].poNumber) {
            const parts = latestPO[0].poNumber.split("-");
            if (parts.length === 3) {
              sequenceNumber = parseInt(parts[2]) + 1;
            }
          }
          const poNumber = `PO-${dateStr}-${String(sequenceNumber).padStart(3, "0")}`;
          let finalSupplierId = supplierId;
          if (!supplierId && supplierName.trim()) {
            const existingSupplier = await tx.select().from(suppliers).where(
              and2(
                eq(suppliers.userId, userId),
                sql2`LOWER(${suppliers.name}) = LOWER(${supplierName})`
              )
            ).limit(1);
            if (existingSupplier.length > 0) {
              finalSupplierId = existingSupplier[0].id;
            } else {
              const [newSupplier] = await tx.insert(suppliers).values({
                userId,
                name: supplierName,
                phone: supplierPhone
              }).returning();
              finalSupplierId = newSupplier.id;
            }
          }
          let total = 0;
          for (const item of cartItems) {
            const stockItem = await tx.select().from(stockItems).where(
              and2(eq(stockItems.id, item.stockItemId), eq(stockItems.userId, userId))
            ).limit(1);
            if (stockItem.length > 0) {
              const price = parseFloat(stockItem[0].purchasePrice);
              const qty = parseFloat(item.shortageQty);
              total += price * qty;
            }
          }
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
            status: "draft",
            userId
          }).returning();
          const poItems = await Promise.all(cartItems.map(async (cartItem) => {
            const stockItem = await tx.select().from(stockItems).where(
              and2(eq(stockItems.id, cartItem.stockItemId), eq(stockItems.userId, userId))
            ).limit(1);
            const estimatedPrice = stockItem.length > 0 ? parseFloat(stockItem[0].purchasePrice) : 0;
            return {
              poId: order.id,
              stockItemId: cartItem.stockItemId,
              itemName: cartItem.stockItemName,
              quantity: cartItem.shortageQty,
              unit: cartItem.unit,
              estimatedPrice: estimatedPrice.toFixed(2),
              notes: cartItem.notes
            };
          }));
          await tx.insert(purchaseOrderItems).values(poItems);
          await tx.delete(shoppingCart).where(
            and2(inArray(shoppingCart.id, cartItemIds), eq(shoppingCart.userId, userId))
          );
          return order;
        });
      }
      async markPurchaseOrderReceived(userId, id, actualPrices) {
        await db.transaction(async (tx) => {
          const [order] = await tx.select().from(purchaseOrders).where(and2(eq(purchaseOrders.id, id), eq(purchaseOrders.userId, userId)));
          if (!order) throw new Error("Purchase order not found");
          if (actualPrices) {
            for (const { itemId, price } of actualPrices) {
              await tx.update(purchaseOrderItems).set({ actualPrice: price.toFixed(2) }).where(eq(purchaseOrderItems.id, itemId));
            }
          }
          const items = await tx.select().from(purchaseOrderItems).where(eq(purchaseOrderItems.poId, id));
          for (const item of items) {
            if (item.stockItemId) {
              const [stockItem] = await tx.select().from(stockItems).where(
                and2(eq(stockItems.id, item.stockItemId), eq(stockItems.userId, userId))
              );
              if (stockItem) {
                const currentQty = parseFloat(stockItem.currentQuantity);
                const addedQty = parseFloat(item.quantity);
                const newQty = currentQty + addedQty;
                await tx.update(stockItems).set({
                  currentQuantity: newQty.toString(),
                  updatedAt: /* @__PURE__ */ new Date()
                }).where(and2(eq(stockItems.id, item.stockItemId), eq(stockItems.userId, userId)));
              }
            }
          }
          let actualTotal = parseFloat(order.totalAmount);
          if (actualPrices && actualPrices.length > 0) {
            actualTotal = 0;
            for (const item of items) {
              const price = item.actualPrice ? parseFloat(item.actualPrice) : parseFloat(item.estimatedPrice || "0");
              actualTotal += price * parseFloat(item.quantity);
            }
          }
          const [expense] = await tx.insert(expenses).values({
            category: "bahan",
            description: `Pembelian bahan - ${order.poNumber} (${order.supplierName})`,
            amount: actualTotal.toFixed(2),
            expenseDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
            userId
          }).returning();
          await tx.update(purchaseOrders).set({
            status: "received",
            receivedAt: /* @__PURE__ */ new Date(),
            expenseId: expense.id,
            totalAmount: actualTotal.toFixed(2),
            updatedAt: /* @__PURE__ */ new Date()
          }).where(and2(eq(purchaseOrders.id, id), eq(purchaseOrders.userId, userId)));
        });
      }
      // Users & Authentication
      async getAllUsers() {
        const allUsers = await db.select().from(users);
        return allUsers;
      }
      async getUserByEmail(email) {
        const [user] = await db.select().from(users).where(eq(users.email, email));
        return user || void 0;
      }
      async getUserById(id) {
        const [user] = await db.select().from(users).where(eq(users.id, id));
        return user || void 0;
      }
      async createUser(user) {
        const [newUser] = await db.insert(users).values(user).returning();
        return newUser;
      }
      async updateUser(id, userData) {
        const [updatedUser] = await db.update(users).set({ ...userData, updatedAt: /* @__PURE__ */ new Date() }).where(eq(users.id, id)).returning();
        return updatedUser;
      }
      async updateUserProfile(id, data) {
        const [updatedUser] = await db.update(users).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where(eq(users.id, id)).returning();
        return updatedUser;
      }
      async updateUserPassword(id, hashedPassword) {
        await db.update(users).set({ password: hashedPassword, updatedAt: /* @__PURE__ */ new Date() }).where(eq(users.id, id));
      }
      // Subscription Plans
      async getSubscriptionPlans() {
        return await db.select().from(subscriptionPlans2).where(eq(subscriptionPlans2.isActive, 1)).orderBy(subscriptionPlans2.sortOrder);
      }
      async getSubscriptionPlan(id) {
        const [plan] = await db.select().from(subscriptionPlans2).where(eq(subscriptionPlans2.id, id));
        return plan || void 0;
      }
      async createSubscriptionPlan(plan) {
        const [newPlan] = await db.insert(subscriptionPlans2).values(plan).returning();
        return newPlan;
      }
      async updateSubscriptionPlan(id, planData) {
        const [updatedPlan] = await db.update(subscriptionPlans2).set(planData).where(eq(subscriptionPlans2.id, id)).returning();
        return updatedPlan || void 0;
      }
      async deleteSubscriptionPlan(id) {
        await db.delete(subscriptionPlans2).where(eq(subscriptionPlans2.id, id));
      }
      async getSubscriptionPlanById(id) {
        return this.getSubscriptionPlan(id);
      }
      // User Subscriptions
      async getAllUserSubscriptions() {
        return await db.select().from(userSubscriptions2).orderBy(userSubscriptions2.createdAt);
      }
      async getUserSubscriptions(userId) {
        return await db.select().from(userSubscriptions2).where(eq(userSubscriptions2.userId, userId)).orderBy(userSubscriptions2.createdAt);
      }
      async getUserSubscriptionById(id) {
        const [subscription] = await db.select().from(userSubscriptions2).where(eq(userSubscriptions2.id, id)).limit(1);
        return subscription;
      }
      async getUserActiveSubscription(userId) {
        const now = /* @__PURE__ */ new Date();
        const [activeSub] = await db.select().from(userSubscriptions2).where(
          and2(
            eq(userSubscriptions2.userId, userId),
            eq(userSubscriptions2.status, "active")
          )
        ).orderBy(userSubscriptions2.subscriptionEndsAt);
        if (activeSub && activeSub.subscriptionEndsAt && new Date(activeSub.subscriptionEndsAt) > now) {
          return activeSub;
        }
        return void 0;
      }
      async createUserSubscription(subscription) {
        const [newSubscription] = await db.insert(userSubscriptions2).values(subscription).returning();
        return newSubscription;
      }
      async updateUserSubscription(id, data) {
        const [updated] = await db.update(userSubscriptions2).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where(eq(userSubscriptions2.id, id)).returning();
        return updated || void 0;
      }
      // Promo Codes
      async getPromoCodeByCode(code) {
        const [promo] = await db.select().from(promoCodes).where(eq(promoCodes.code, code.toUpperCase()));
        return promo || void 0;
      }
      async getPromoCodeUsageCount(promoCodeId) {
        const [promo] = await db.select().from(promoCodes).where(eq(promoCodes.id, promoCodeId));
        return promo?.currentUses || 0;
      }
      async incrementPromoCodeUsage(promoCodeId) {
        await db.update(promoCodes).set({ currentUses: sql2`${promoCodes.currentUses} + 1` }).where(eq(promoCodes.id, promoCodeId));
      }
      async hasUserUsedPromoCode(userId, promoCodeId) {
        const [usage] = await db.select().from(promoCodeUsage).where(
          and2(
            eq(promoCodeUsage.userId, userId),
            eq(promoCodeUsage.promoCodeId, promoCodeId)
          )
        );
        return !!usage;
      }
      async trackPromoCodeUsage(userId, promoCodeId) {
        await db.insert(promoCodeUsage).values({
          userId,
          promoCodeId
        });
      }
      // Pending Bills
      async createPendingBill(bill) {
        const [newBill] = await db.insert(pendingBills).values(bill).returning();
        return newBill;
      }
      async getPendingBillByBillCode(billCode) {
        const [bill] = await db.select().from(pendingBills).where(eq(pendingBills.billCode, billCode));
        return bill || void 0;
      }
      async markBillAsProcessed(billCode) {
        await db.update(pendingBills).set({
          isProcessed: 1,
          processedAt: /* @__PURE__ */ new Date()
        }).where(eq(pendingBills.billCode, billCode));
      }
      async getEarlyBirdUsedSlots() {
        const result = await db.select({ count: sql2`count(*)` }).from(earlyBirdTracking);
        return result[0]?.count || 0;
      }
      // Pricing Tiers (Reseller Module)
      async getPricingTiers(userId) {
        const tiers = await db.select().from(pricingTiers).where(eq(pricingTiers.userId, userId)).orderBy(desc2(pricingTiers.createdAt));
        return tiers;
      }
      async createPricingTier(userId, tier) {
        const [newTier] = await db.insert(pricingTiers).values({ ...tier, userId }).returning();
        return newTier;
      }
      async updatePricingTier(userId, id, tier) {
        const [updatedTier] = await db.update(pricingTiers).set(tier).where(and2(eq(pricingTiers.id, id), eq(pricingTiers.userId, userId))).returning();
        return updatedTier;
      }
      // Resellers
      async getResellers(userId) {
        const resellerList = await db.select({
          reseller: resellers,
          tier: pricingTiers
        }).from(resellers).leftJoin(pricingTiers, and2(eq(resellers.pricingTierId, pricingTiers.id), eq(pricingTiers.userId, userId))).where(eq(resellers.userId, userId)).orderBy(desc2(resellers.createdAt));
        return resellerList.map((r) => ({
          ...r.reseller,
          pricingTier: r.tier
        }));
      }
      async getReseller(userId, id) {
        const [result] = await db.select({
          reseller: resellers,
          tier: pricingTiers
        }).from(resellers).leftJoin(pricingTiers, and2(eq(resellers.pricingTierId, pricingTiers.id), eq(pricingTiers.userId, userId))).where(and2(eq(resellers.id, id), eq(resellers.userId, userId)));
        if (!result) return void 0;
        return {
          ...result.reseller,
          pricingTier: result.tier
        };
      }
      async createReseller(userId, reseller) {
        const [newReseller] = await db.insert(resellers).values({ ...reseller, userId }).returning();
        return newReseller;
      }
      async updateReseller(userId, id, reseller) {
        const [updatedReseller] = await db.update(resellers).set(reseller).where(and2(eq(resellers.id, id), eq(resellers.userId, userId))).returning();
        return updatedReseller;
      }
      async deleteReseller(userId, id) {
        await db.delete(resellers).where(and2(eq(resellers.id, id), eq(resellers.userId, userId)));
      }
      async getResellerStats(userId, resellerId) {
        const transfers = await db.select().from(resellerTransfers).where(and2(eq(resellerTransfers.resellerId, resellerId), eq(resellerTransfers.userId, userId)));
        const [lastTransfer] = await db.select().from(resellerTransfers).where(and2(eq(resellerTransfers.resellerId, resellerId), eq(resellerTransfers.userId, userId))).orderBy(desc2(resellerTransfers.transferDate)).limit(1);
        return {
          totalTransfers: transfers.length,
          totalAmount: transfers.reduce((sum, t) => sum + parseFloat(t.totalAmount || "0"), 0),
          lastTransferDate: lastTransfer?.transferDate || null
        };
      }
      // Reseller Transfers
      async generateTransferReceiptNumber(userId) {
        const today = /* @__PURE__ */ new Date();
        const dateStr = today.toISOString().split("T")[0].replace(/-/g, "");
        const todayTransfers = await db.select().from(resellerTransfers).where(and2(
          sql2`DATE(${resellerTransfers.createdAt}) = CURRENT_DATE`,
          eq(resellerTransfers.userId, userId)
        ));
        const nextNumber = todayTransfers.length + 1;
        const paddedNumber = nextNumber.toString().padStart(4, "0");
        return `TRF-${dateStr}-${paddedNumber}`;
      }
      async createResellerTransfer(userId, transfer, items) {
        const [newTransfer] = await db.insert(resellerTransfers).values({ ...transfer, userId }).returning();
        if (items.length > 0) {
          const itemsWithTransferId = items.map((item) => ({
            ...item,
            transferId: newTransfer.id,
            userId
          }));
          await db.insert(resellerTransferItems).values(itemsWithTransferId);
        }
        await db.update(resellers).set({
          totalPurchases: sql2`${resellers.totalPurchases} + ${transfer.totalAmount}`
        }).where(and2(eq(resellers.id, transfer.resellerId), eq(resellers.userId, userId)));
        return newTransfer;
      }
      async getResellerTransfers(userId, limit = 50, offset = 0) {
        const transfers = await db.select({
          transfer: resellerTransfers,
          reseller: resellers
        }).from(resellerTransfers).leftJoin(resellers, and2(eq(resellerTransfers.resellerId, resellers.id), eq(resellers.userId, userId))).where(eq(resellerTransfers.userId, userId)).orderBy(desc2(resellerTransfers.transferDate)).limit(limit + 1).offset(offset);
        const hasMore = transfers.length > limit;
        const data = transfers.slice(0, limit).map((t) => ({
          ...t.transfer,
          reseller: t.reseller
        }));
        const [countResult] = await db.select({ count: sql2`count(*)` }).from(resellerTransfers).where(eq(resellerTransfers.userId, userId));
        return {
          data,
          hasMore,
          total: countResult?.count || 0
        };
      }
      async getResellerTransferById(userId, id) {
        const [result] = await db.select({
          transfer: resellerTransfers,
          reseller: resellers
        }).from(resellerTransfers).leftJoin(resellers, and2(eq(resellerTransfers.resellerId, resellers.id), eq(resellers.userId, userId))).where(and2(eq(resellerTransfers.id, id), eq(resellerTransfers.userId, userId)));
        if (!result) return void 0;
        const items = await db.select().from(resellerTransferItems).where(and2(eq(resellerTransferItems.transferId, id), eq(resellerTransferItems.userId, userId)));
        return {
          ...result.transfer,
          reseller: result.reseller,
          items
        };
      }
      // Goals (Monthly targets and progress tracking)
      async getGoals(userId) {
        const result = await db.select().from(goals).where(eq(goals.userId, userId)).orderBy(desc2(goals.targetMonth));
        return result;
      }
      async getGoalByMonth(userId, targetMonth) {
        const [result] = await db.select().from(goals).where(and2(
          eq(goals.userId, userId),
          eq(goals.targetMonth, targetMonth)
        ));
        return result || void 0;
      }
      async createGoal(goal) {
        const [newGoal] = await db.insert(goals).values(goal).returning();
        return newGoal;
      }
      async updateGoal(id, goal) {
        const [updatedGoal] = await db.update(goals).set({ ...goal, updatedAt: /* @__PURE__ */ new Date() }).where(eq(goals.id, id)).returning();
        return updatedGoal;
      }
      async deleteGoal(id) {
        await db.delete(goals).where(eq(goals.id, id));
      }
      async getGoalProgress(userId, targetMonth) {
        try {
          const goal = await this.getGoalByMonth(userId, targetMonth);
          if (!goal) {
            return { goal: null, progress: null };
          }
          const monthStart = new Date(targetMonth);
          const monthEnd = new Date(monthStart);
          monthEnd.setMonth(monthEnd.getMonth() + 1);
          const salesData = await db.select({
            totalRevenue: sql2`COALESCE(SUM(${sales.totalAmount}::decimal), 0)`,
            totalProfit: sql2`COALESCE(SUM(${sales.profitAmount}::decimal), 0)`,
            salesCount: sql2`COUNT(*)`
          }).from(sales).where(and2(
            eq(sales.userId, userId),
            sql2`${sales.saleDate} >= ${monthStart.toISOString().split("T")[0]}`,
            sql2`${sales.saleDate} < ${monthEnd.toISOString().split("T")[0]}`
          ));
          const deliveriesData = await db.select({
            totalRevenue: sql2`COALESCE(SUM(${deliveries.totalAmount}::decimal), 0)`,
            deliveryCount: sql2`COUNT(*)`
          }).from(deliveries).where(and2(
            eq(deliveries.userId, userId),
            sql2`${deliveries.deliveryDate} >= ${monthStart.toISOString().split("T")[0]}`,
            sql2`${deliveries.deliveryDate} < ${monthEnd.toISOString().split("T")[0]}`
          ));
          const actualRevenue = Number(salesData[0]?.totalRevenue || 0) + Number(deliveriesData[0]?.totalRevenue || 0);
          const actualProfit = Number(salesData[0]?.totalProfit || 0);
          const actualSalesVolume = Number(salesData[0]?.salesCount || 0) + Number(deliveriesData[0]?.deliveryCount || 0);
          return {
            goal,
            progress: {
              actualRevenue,
              actualProfit,
              actualSalesVolume,
              revenueProgress: goal.revenueTarget > 0 ? actualRevenue / parseFloat(goal.revenueTarget) * 100 : 0,
              profitProgress: goal.profitTarget > 0 ? actualProfit / parseFloat(goal.profitTarget) * 100 : 0,
              salesVolumeProgress: goal.salesVolumeTarget > 0 ? actualSalesVolume / goal.salesVolumeTarget * 100 : 0
            }
          };
        } catch (error) {
          console.error("[Storage] getGoalProgress error:", error);
          return { goal: null, progress: null };
        }
      }
      // ========================================
      // LOYALTY PROGRAM METHODS
      // ========================================
      async getCustomerByPhone(userId, phone) {
        const [customer] = await db.select().from(customers).where(and2(eq(customers.phone, phone), eq(customers.userId, userId)));
        return customer || void 0;
      }
      async createCustomer(userId, customer) {
        const [newCustomer] = await db.insert(customers).values({ ...customer, userId }).returning();
        return newCustomer;
      }
      async updateCustomer(userId, id, customerData) {
        const [updated] = await db.update(customers).set({ ...customerData, updatedAt: /* @__PURE__ */ new Date() }).where(and2(eq(customers.id, id), eq(customers.userId, userId))).returning();
        return updated;
      }
      async getCustomers(userId) {
        const result = await db.select().from(customers).where(eq(customers.userId, userId)).orderBy(desc2(customers.createdAt));
        return result;
      }
      async awardPoints(userId, customerId, points, saleId, description) {
        const [customer] = await db.select().from(customers).where(and2(eq(customers.id, customerId), eq(customers.userId, userId)));
        if (!customer) throw new Error("Customer not found");
        const newBalance = (customer.loyaltyPoints || 0) + points;
        await db.update(customers).set({
          loyaltyPoints: newBalance,
          updatedAt: /* @__PURE__ */ new Date()
        }).where(and2(eq(customers.id, customerId), eq(customers.userId, userId)));
        await db.insert(loyaltyPointsHistory).values({
          customerId,
          saleId,
          pointsChange: points,
          balanceAfter: newBalance,
          transactionType: "earned",
          description,
          userId
        });
      }
      async redeemPoints(userId, customerId, points, description) {
        const [customer] = await db.select().from(customers).where(and2(eq(customers.id, customerId), eq(customers.userId, userId)));
        if (!customer) throw new Error("Customer not found");
        const currentPoints = customer.loyaltyPoints || 0;
        if (currentPoints < points) {
          throw new Error("Insufficient points");
        }
        const newBalance = currentPoints - points;
        await db.update(customers).set({
          loyaltyPoints: newBalance,
          updatedAt: /* @__PURE__ */ new Date()
        }).where(and2(eq(customers.id, customerId), eq(customers.userId, userId)));
        await db.insert(loyaltyPointsHistory).values({
          customerId,
          saleId: null,
          pointsChange: -points,
          balanceAfter: newBalance,
          transactionType: "redeemed",
          description,
          userId
        });
      }
      async getPointsHistory(userId, customerId, limit = 50) {
        const history = await db.select().from(loyaltyPointsHistory).where(and2(eq(loyaltyPointsHistory.customerId, customerId), eq(loyaltyPointsHistory.userId, userId))).orderBy(desc2(loyaltyPointsHistory.createdAt)).limit(limit);
        return history;
      }
      // ========================================
      // Broadcast System Methods
      // ========================================
      async getMessageTemplates(userId, channel) {
        if (channel) {
          return await db.select().from(messageTemplates).where(and2(
            eq(messageTemplates.userId, userId),
            eq(messageTemplates.channel, channel),
            eq(messageTemplates.isActive, 1)
          )).orderBy(desc2(messageTemplates.createdAt));
        }
        return await db.select().from(messageTemplates).where(and2(eq(messageTemplates.userId, userId), eq(messageTemplates.isActive, 1))).orderBy(desc2(messageTemplates.createdAt));
      }
      async createMessageTemplate(userId, template) {
        const [newTemplate] = await db.insert(messageTemplates).values({ ...template, userId }).returning();
        return newTemplate;
      }
      async updateMessageTemplate(userId, id, template) {
        const [updated] = await db.update(messageTemplates).set({ ...template, updatedAt: /* @__PURE__ */ new Date() }).where(and2(eq(messageTemplates.id, id), eq(messageTemplates.userId, userId))).returning();
        return updated;
      }
      async deleteMessageTemplate(userId, id) {
        await db.update(messageTemplates).set({ isActive: 0, updatedAt: /* @__PURE__ */ new Date() }).where(and2(eq(messageTemplates.id, id), eq(messageTemplates.userId, userId)));
      }
      async createBroadcastCampaign(userId, campaign) {
        const [newCampaign] = await db.insert(broadcastCampaigns).values({ ...campaign, userId }).returning();
        return newCampaign;
      }
      async getBroadcastCampaigns(userId, limit = 50) {
        return await db.select().from(broadcastCampaigns).where(eq(broadcastCampaigns.userId, userId)).orderBy(desc2(broadcastCampaigns.createdAt)).limit(limit);
      }
      async getBroadcastCampaignById(userId, id) {
        const [campaign] = await db.select().from(broadcastCampaigns).where(and2(eq(broadcastCampaigns.id, id), eq(broadcastCampaigns.userId, userId)));
        return campaign;
      }
      async updateBroadcastCampaign(userId, id, campaign) {
        const [updated] = await db.update(broadcastCampaigns).set({ ...campaign, updatedAt: /* @__PURE__ */ new Date() }).where(and2(eq(broadcastCampaigns.id, id), eq(broadcastCampaigns.userId, userId))).returning();
        return updated;
      }
      async deleteBroadcastCampaign(userId, id) {
        await db.delete(broadcastCampaigns).where(and2(eq(broadcastCampaigns.id, id), eq(broadcastCampaigns.userId, userId)));
      }
      async getCustomerSegment(userId, segment, customIds) {
        if (segment === "custom" && customIds && customIds.length > 0) {
          return await db.select().from(customers).where(and2(inArray(customers.id, customIds), eq(customers.userId, userId)));
        }
        if (segment === "high_points") {
          return await db.select().from(customers).where(and2(gte(customers.loyaltyPoints, 500), eq(customers.userId, userId))).orderBy(desc2(customers.loyaltyPoints));
        }
        if (segment === "recent_buyers") {
          const thirtyDaysAgo = /* @__PURE__ */ new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          const recentCustomerIds = await db.selectDistinct({ customerId: sales.customerId }).from(sales).where(
            and2(
              eq(sales.userId, userId),
              gte(sales.createdAt, thirtyDaysAgo),
              sql2`${sales.customerId} IS NOT NULL`
            )
          );
          const ids = recentCustomerIds.map((r) => r.customerId).filter((id) => id !== null);
          if (ids.length === 0) return [];
          return await db.select().from(customers).where(and2(inArray(customers.id, ids), eq(customers.userId, userId)));
        }
        return await db.select().from(customers).where(eq(customers.userId, userId)).orderBy(desc2(customers.createdAt));
      }
      async sendBroadcast(userId, campaignId) {
        const campaign = await this.getBroadcastCampaignById(userId, campaignId);
        if (!campaign) throw new Error("Campaign not found");
        const targetCustomers = await this.getCustomerSegment(
          userId,
          campaign.targetSegment,
          campaign.targetCustomerIds
        );
        if (targetCustomers.length === 0) {
          throw new Error("No customers in target segment");
        }
        await db.update(broadcastCampaigns).set({
          status: "sending",
          totalRecipients: targetCustomers.length,
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq(broadcastCampaigns.id, campaignId));
        const messages = targetCustomers.map((customer) => ({
          campaignId,
          customerId: customer.id,
          channel: campaign.channel,
          recipient: campaign.channel === "email" ? customer.email || "" : customer.phone,
          status: "pending"
        }));
        if (messages.length > 0) {
          await db.insert(broadcastMessages).values(messages);
        }
      }
      async getBroadcastMessages(campaignId) {
        return await db.select().from(broadcastMessages).where(eq(broadcastMessages.campaignId, campaignId)).orderBy(desc2(broadcastMessages.createdAt));
      }
      // ========================================
      // VOUCHER SYSTEM METHODS
      // ========================================
      async createVoucher(userId, voucher) {
        const [newVoucher] = await db.insert(customerVouchers).values({ ...voucher, userId }).returning();
        return newVoucher;
      }
      async getVouchers(userId) {
        return await db.select().from(customerVouchers).where(eq(customerVouchers.userId, userId)).orderBy(desc2(customerVouchers.createdAt));
      }
      async getVoucherById(userId, id) {
        const [voucher] = await db.select().from(customerVouchers).where(and2(eq(customerVouchers.id, id), eq(customerVouchers.userId, userId)));
        return voucher || void 0;
      }
      async getVoucherByCode(userId, code) {
        const [voucher] = await db.select().from(customerVouchers).where(and2(eq(customerVouchers.code, code.toUpperCase()), eq(customerVouchers.userId, userId)));
        return voucher || void 0;
      }
      async updateVoucher(userId, id, voucher) {
        const [updated] = await db.update(customerVouchers).set({ ...voucher, updatedAt: /* @__PURE__ */ new Date() }).where(and2(eq(customerVouchers.id, id), eq(customerVouchers.userId, userId))).returning();
        return updated;
      }
      async deleteVoucher(userId, id) {
        await db.update(customerVouchers).set({ isActive: 0, updatedAt: /* @__PURE__ */ new Date() }).where(and2(eq(customerVouchers.id, id), eq(customerVouchers.userId, userId)));
      }
      async validateVoucher(userId, code, customerId, totalAmount) {
        const voucher = await this.getVoucherByCode(userId, code);
        if (!voucher) {
          return { valid: false, error: "Kod voucher tidak sah" };
        }
        if (!voucher.isActive) {
          return { valid: false, error: "Voucher tidak aktif" };
        }
        const now = /* @__PURE__ */ new Date();
        if (voucher.validFrom && new Date(voucher.validFrom) > now) {
          return { valid: false, error: "Voucher belum bermula" };
        }
        if (voucher.validUntil && new Date(voucher.validUntil) < now) {
          return { valid: false, error: "Voucher telah tamat tempoh" };
        }
        if (totalAmount < parseFloat(voucher.minPurchase)) {
          return {
            valid: false,
            error: `Pembelian minimum RM${voucher.minPurchase} diperlukan`
          };
        }
        if (voucher.maxTotalUsage && voucher.currentUsage >= voucher.maxTotalUsage) {
          return { valid: false, error: "Voucher telah habis digunakan" };
        }
        if (customerId) {
          const customerUsageCount = await this.getCustomerVoucherUsage(userId, customerId, voucher.id);
          if (customerUsageCount >= voucher.maxUsagePerCustomer) {
            return {
              valid: false,
              error: "Anda telah mencapai had penggunaan voucher ini"
            };
          }
        }
        let discount = 0;
        if (voucher.voucherType === "percentage") {
          discount = totalAmount * (parseFloat(voucher.discountValue) / 100);
          if (voucher.maxDiscount) {
            discount = Math.min(discount, parseFloat(voucher.maxDiscount));
          }
        } else {
          discount = parseFloat(voucher.discountValue);
        }
        discount = Math.min(discount, totalAmount);
        return {
          valid: true,
          voucher,
          discount: parseFloat(discount.toFixed(2))
        };
      }
      async redeemVoucher(userId, voucherId, customerId, saleId, originalAmount, finalAmount, discountApplied) {
        await db.insert(voucherUsage).values({
          voucherId,
          customerId,
          saleId,
          originalAmount: originalAmount.toString(),
          finalAmount: finalAmount.toString(),
          discountApplied: discountApplied.toString(),
          userId
        });
        await db.update(customerVouchers).set({
          currentUsage: sql2`${customerVouchers.currentUsage} + 1`,
          updatedAt: /* @__PURE__ */ new Date()
        }).where(and2(eq(customerVouchers.id, voucherId), eq(customerVouchers.userId, userId)));
      }
      async getVoucherUsageHistory(userId, voucherId) {
        const usage = await db.select({
          id: voucherUsage.id,
          customerId: voucherUsage.customerId,
          customerName: customers.name,
          customerPhone: customers.phone,
          saleId: voucherUsage.saleId,
          discountApplied: voucherUsage.discountApplied,
          originalAmount: voucherUsage.originalAmount,
          finalAmount: voucherUsage.finalAmount,
          usedAt: voucherUsage.usedAt
        }).from(voucherUsage).leftJoin(customers, and2(eq(voucherUsage.customerId, customers.id), eq(customers.userId, userId))).where(and2(eq(voucherUsage.voucherId, voucherId), eq(voucherUsage.userId, userId))).orderBy(desc2(voucherUsage.usedAt));
        return usage;
      }
      async getCustomerVoucherUsage(userId, customerId, voucherId) {
        const result = await db.select({ count: sql2`count(*)` }).from(voucherUsage).where(
          and2(
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
      async generateBookingNumber(userId) {
        const now = /* @__PURE__ */ new Date();
        const year = now.getFullYear();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const result = await db.select({ count: sql2`count(*)` }).from(bookings).where(and2(gte(bookings.createdAt, today), eq(bookings.userId, userId)));
        const count = (result[0]?.count || 0) + 1;
        return `BK-${year}-${String(count).padStart(4, "0")}`;
      }
      async createBooking(userId, booking, items) {
        const bookingNumber = await this.generateBookingNumber(userId);
        const [newBooking] = await db.insert(bookings).values({ ...booking, bookingNumber, userId }).returning();
        if (items.length > 0) {
          await db.insert(bookingItems).values(
            items.map((item) => ({
              ...item,
              bookingId: newBooking.id,
              userId
            }))
          );
        }
        const bookingWithItems = {
          ...newBooking,
          items: await this.getBookingItems(userId, newBooking.id)
        };
        return bookingWithItems;
      }
      async getBookings(userId, limit = 50, status) {
        let query = db.select().from(bookings).where(eq(bookings.userId, userId)).orderBy(desc2(bookings.createdAt)).limit(limit);
        if (status) {
          query = query.where(and2(eq(bookings.status, status), eq(bookings.userId, userId)));
        }
        const allBookings = await query;
        const bookingsWithItems = await Promise.all(
          allBookings.map(async (booking) => ({
            ...booking,
            items: await this.getBookingItems(userId, booking.id)
          }))
        );
        return bookingsWithItems;
      }
      async getBookingById(userId, id) {
        const [booking] = await db.select().from(bookings).where(and2(eq(bookings.id, id), eq(bookings.userId, userId)));
        if (!booking) return void 0;
        const items = await this.getBookingItems(userId, id);
        return { ...booking, items };
      }
      async updateBooking(userId, id, booking) {
        const [updated] = await db.update(bookings).set({ ...booking, updatedAt: /* @__PURE__ */ new Date() }).where(and2(eq(bookings.id, id), eq(bookings.userId, userId))).returning();
        return updated;
      }
      async deleteBooking(userId, id) {
        await db.delete(bookings).where(and2(eq(bookings.id, id), eq(bookings.userId, userId)));
      }
      async getBookingItems(userId, bookingId) {
        return await db.select().from(bookingItems).where(and2(eq(bookingItems.bookingId, bookingId), eq(bookingItems.userId, userId))).orderBy(bookingItems.createdAt);
      }
      async getUpcomingBookings(userId, daysAhead = 7) {
        const today = /* @__PURE__ */ new Date();
        today.setHours(0, 0, 0, 0);
        const futureDate = new Date(today);
        futureDate.setDate(futureDate.getDate() + daysAhead);
        return await db.select().from(bookings).where(
          and2(
            gte(bookings.deliveryDate, today.toISOString().split("T")[0]),
            lte(bookings.deliveryDate, futureDate.toISOString().split("T")[0]),
            sql2`${bookings.status} != 'completed' AND ${bookings.status} != 'cancelled'`,
            eq(bookings.userId, userId)
          )
        ).orderBy(bookings.deliveryDate, bookings.deliveryTime);
      }
      async markReminderSent(userId, bookingId) {
        await db.update(bookings).set({
          reminderSent: 1,
          reminderSentAt: /* @__PURE__ */ new Date(),
          updatedAt: /* @__PURE__ */ new Date()
        }).where(and2(eq(bookings.id, bookingId), eq(bookings.userId, userId)));
      }
      // ========================================
      // VENDOR SALES TRACKING
      // ========================================
      async createVendorSale(userId, sale) {
        const [result] = await db.insert(vendorSales).values({
          userId,
          vendorId: sale.vendorId,
          vendorName: sale.vendorName,
          deliveryId: sale.deliveryId || null,
          productId: sale.productId,
          productName: sale.productName,
          quantitySold: sale.quantitySold,
          saleDate: sale.saleDate,
          notes: sale.notes || null
        }).returning();
        await this.updateStockBalance(sale.vendorId, sale.productId, { sold: sale.quantitySold });
        return result;
      }
      async getVendorSales(userId, vendorId, filters) {
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
        return await db.select().from(vendorSales).where(and2(...conditions)).orderBy(desc2(vendorSales.saleDate), desc2(vendorSales.createdAt));
      }
      async getVendorSaleById(userId, id) {
        const [result] = await db.select().from(vendorSales).where(and2(eq(vendorSales.id, id), eq(vendorSales.userId, userId)));
        return result;
      }
      async updateVendorSale(userId, id, sale) {
        const original = await this.getVendorSaleById(userId, id);
        if (!original) {
          throw new Error("Vendor sale not found");
        }
        const [updated] = await db.update(vendorSales).set({
          quantitySold: sale.quantitySold,
          saleDate: sale.saleDate,
          notes: sale.notes
        }).where(and2(eq(vendorSales.id, id), eq(vendorSales.userId, userId))).returning();
        if (sale.quantitySold && sale.quantitySold !== original.quantitySold) {
          const difference = sale.quantitySold - original.quantitySold;
          await this.updateStockBalance(original.vendorId, original.productId, { sold: difference });
        }
        return updated;
      }
      async deleteVendorSale(userId, id) {
        const sale = await this.getVendorSaleById(userId, id);
        if (!sale) {
          throw new Error("Vendor sale not found");
        }
        await this.updateStockBalance(sale.vendorId, sale.productId, { sold: -sale.quantitySold });
        await db.delete(vendorSales).where(and2(eq(vendorSales.id, id), eq(vendorSales.userId, userId)));
      }
      // ========================================
      // VENDOR STOCK BALANCE
      // ========================================
      async getVendorStockBalance(vendorId, userId) {
        return await db.select().from(vendorStockBalance).where(eq(vendorStockBalance.vendorId, vendorId)).orderBy(desc2(vendorStockBalance.updatedAt));
      }
      async getStockBalanceByProduct(vendorId, productId, tx) {
        const executor = tx || db;
        const [result] = await executor.select().from(vendorStockBalance).where(
          and2(
            eq(vendorStockBalance.vendorId, vendorId),
            eq(vendorStockBalance.productId, productId)
          )
        );
        return result;
      }
      async updateStockBalance(vendorId, productId, change, tx) {
        const executor = tx || db;
        const existing = await this.getStockBalanceByProduct(vendorId, productId, executor);
        if (existing) {
          const newStock = existing.currentStock + (change.delivered || 0) - (change.sold || 0) - (change.returned || 0);
          await executor.update(vendorStockBalance).set({
            currentStock: newStock,
            lastDeliveryDate: change.delivered ? (/* @__PURE__ */ new Date()).toISOString().split("T")[0] : existing.lastDeliveryDate,
            lastSaleDate: change.sold ? (/* @__PURE__ */ new Date()).toISOString().split("T")[0] : existing.lastSaleDate,
            updatedAt: /* @__PURE__ */ new Date()
          }).where(eq(vendorStockBalance.id, existing.id));
        } else {
          const newStock = (change.delivered || 0) - (change.sold || 0) - (change.returned || 0);
          await executor.insert(vendorStockBalance).values({
            vendorId,
            productId,
            currentStock: newStock,
            lastDeliveryDate: change.delivered ? (/* @__PURE__ */ new Date()).toISOString().split("T")[0] : null,
            lastSaleDate: change.sold ? (/* @__PURE__ */ new Date()).toISOString().split("T")[0] : null
          });
        }
      }
      // ========================================
      // VENDOR CLAIMS
      // ========================================
      async generateClaimNumber(userId) {
        const today = /* @__PURE__ */ new Date();
        const dateStr = today.toISOString().split("T")[0].replace(/-/g, "");
        const count = await db.select().from(vendorClaims).where(and2(
          eq(vendorClaims.userId, userId),
          sql2`DATE(${vendorClaims.createdAt}) = CURRENT_DATE`
        ));
        return `CLM-${dateStr}-${String(count.length + 1).padStart(4, "0")}`;
      }
      async createVendorClaim(userId, claimData, items, photos) {
        return await db.transaction(async (tx) => {
          const claimNumber = await this.generateClaimNumber(userId);
          const totalAmount = items.reduce(
            (sum, item) => sum + parseFloat(item.unitPrice) * parseInt(item.quantityClaimed),
            0
          );
          const [claim] = await tx.insert(vendorClaims).values({
            userId,
            vendorId: claimData.vendorId,
            vendorName: claimData.vendorName,
            deliveryId: claimData.deliveryId || null,
            claimNumber,
            claimDate: claimData.claimDate || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
            status: "pending",
            totalClaimAmount: totalAmount.toFixed(2),
            approvedAmount: "0"
          }).returning();
          if (items.length > 0) {
            await tx.insert(claimItems).values(
              items.map((item) => ({
                claimId: claim.id,
                productId: item.productId,
                productName: item.productName,
                quantityClaimed: item.quantityClaimed,
                unitPrice: item.unitPrice,
                totalAmount: (parseFloat(item.unitPrice) * parseInt(item.quantityClaimed)).toFixed(2),
                claimReason: item.claimReason,
                approvedQty: 0
              }))
            );
          }
          if (photos.length > 0) {
            await tx.insert(claimPhotos).values(
              photos.map((photoUrl) => ({
                claimId: claim.id,
                photoUrl
              }))
            );
          }
          return claim;
        });
      }
      async getVendorClaims(userId, filters) {
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
        return await db.select().from(vendorClaims).where(and2(...conditions)).orderBy(desc2(vendorClaims.createdAt));
      }
      async getVendorClaimById(userId, id) {
        const [claim] = await db.select().from(vendorClaims).where(and2(eq(vendorClaims.id, id), eq(vendorClaims.userId, userId)));
        if (!claim) return void 0;
        const items = await this.getClaimItems(id);
        const photos = await this.getClaimPhotos(id);
        return { ...claim, items, photos };
      }
      async getClaimItems(claimId) {
        return await db.select().from(claimItems).where(eq(claimItems.claimId, claimId));
      }
      async getClaimPhotos(claimId) {
        return await db.select().from(claimPhotos).where(eq(claimPhotos.claimId, claimId)).orderBy(claimPhotos.uploadedAt);
      }
      async approveVendorClaim(userId, claimId, reviewNotes) {
        return await db.transaction(async (tx) => {
          const [claim] = await tx.select().from(vendorClaims).where(and2(eq(vendorClaims.id, claimId), eq(vendorClaims.userId, userId)));
          if (!claim) {
            throw new Error("Claim not found");
          }
          if (claim.status !== "pending") {
            throw new Error("Claim already processed");
          }
          const items = await tx.select().from(claimItems).where(eq(claimItems.claimId, claimId));
          const [updated] = await tx.update(vendorClaims).set({
            status: "approved",
            approvedAmount: claim.totalClaimAmount,
            reviewNotes: reviewNotes || null,
            reviewedAt: /* @__PURE__ */ new Date(),
            reviewedBy: userId
          }).where(eq(vendorClaims.id, claimId)).returning();
          for (const item of items) {
            await tx.update(claimItems).set({ approvedQty: item.quantityClaimed }).where(eq(claimItems.id, item.id));
            await this.updateStockBalance(claim.vendorId, item.productId, {
              returned: item.quantityClaimed
            }, tx);
          }
          if (claim.deliveryId) {
            const [delivery] = await tx.select().from(deliveries).where(eq(deliveries.id, claim.deliveryId));
            if (delivery) {
              const adjustmentAmount = parseFloat(claim.totalClaimAmount);
              const currentTotal = parseFloat(delivery.totalAmount);
              const newTotal = Math.max(0, currentTotal - adjustmentAmount);
              await tx.update(deliveries).set({
                totalAmount: newTotal.toFixed(2)
              }).where(eq(deliveries.id, claim.deliveryId));
              console.log(`\u2705 Auto-adjusted invoice ${delivery.invoiceNumber}: RM ${currentTotal.toFixed(2)} \u2192 RM ${newTotal.toFixed(2)} (Claim: -RM ${adjustmentAmount.toFixed(2)})`);
            }
          }
          return updated;
        });
      }
      async rejectVendorClaim(userId, claimId, reviewNotes) {
        const [claim] = await db.select().from(vendorClaims).where(and2(eq(vendorClaims.id, claimId), eq(vendorClaims.userId, userId)));
        if (!claim) {
          throw new Error("Claim not found");
        }
        if (claim.status !== "pending") {
          throw new Error("Claim already processed");
        }
        const [updated] = await db.update(vendorClaims).set({
          status: "rejected",
          approvedAmount: "0",
          reviewNotes,
          reviewedAt: /* @__PURE__ */ new Date(),
          reviewedBy: userId
        }).where(eq(vendorClaims.id, claimId)).returning();
        return updated;
      }
      // ===================================================================
      // ONLINE STORE CATALOG
      // ===================================================================
      async getStoreSettings(userId) {
        const [settings] = await db.select().from(storeSettings).where(eq(storeSettings.userId, userId));
        return settings;
      }
      async getStoreSettingsBySlug(slug) {
        const [settings] = await db.select().from(storeSettings).where(and2(
          eq(storeSettings.slug, slug),
          eq(storeSettings.isActive, 1)
        ));
        return settings;
      }
      async createStoreSettings(userId, data) {
        const existing = await this.getStoreSettings(userId);
        if (existing) {
          throw new Error("Store settings already exist for this user");
        }
        const slugExists = await db.select().from(storeSettings).where(eq(storeSettings.slug, data.slug)).limit(1);
        if (slugExists.length > 0) {
          throw new Error("This store URL is already taken. Please choose a different one.");
        }
        const [settings] = await db.insert(storeSettings).values({
          ...data,
          userId
        }).returning();
        return settings;
      }
      async updateStoreSettings(userId, data) {
        const existing = await this.getStoreSettings(userId);
        if (!existing) {
          throw new Error("Store settings not found");
        }
        if (data.slug && data.slug !== existing.slug) {
          const slugExists = await db.select().from(storeSettings).where(eq(storeSettings.slug, data.slug)).limit(1);
          if (slugExists.length > 0) {
            throw new Error("This store URL is already taken. Please choose a different one.");
          }
        }
        const [updated] = await db.update(storeSettings).set({
          ...data,
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq(storeSettings.userId, userId)).returning();
        return updated;
      }
      async deleteStoreSettings(userId) {
        await db.delete(storeSettings).where(eq(storeSettings.userId, userId));
      }
      async trackStoreAnalytics(storeId, eventType, data) {
        await db.insert(storeAnalytics).values({
          storeId,
          eventType,
          productId: data?.productId || null,
          visitorId: data?.visitorId || null,
          referrer: data?.referrer || null,
          userAgent: data?.userAgent || null
        });
      }
      // ====== PAYMENT CLAIMS ======
      async generatePaymentClaimNumber(userId) {
        const today = /* @__PURE__ */ new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, "0");
        const day = String(today.getDate()).padStart(2, "0");
        const dateStr = `${year}${month}${day}`;
        const prefix = `CLM-PAY-${dateStr}`;
        const latestClaim = await db.select().from(paymentClaims).where(and2(
          eq(paymentClaims.userId, userId),
          like(paymentClaims.claimNumber, `${prefix}%`)
        )).orderBy(desc2(paymentClaims.claimNumber)).limit(1);
        if (latestClaim.length === 0) {
          return `${prefix}-0001`;
        }
        const lastNumber = parseInt(latestClaim[0].claimNumber.split("-").pop() || "0");
        const nextNumber = (lastNumber + 1).toString().padStart(4, "0");
        return `${prefix}-${nextNumber}`;
      }
      async createPaymentClaim(userId, claimData, items, deliveryIds) {
        return await db.transaction(async (tx) => {
          const claimNumber = await this.generatePaymentClaimNumber(userId);
          const totalGross = items.reduce((sum, item) => sum + parseFloat(item.grossAmount || "0"), 0);
          const totalCommission = items.reduce((sum, item) => sum + parseFloat(item.commissionAmount || "0"), 0);
          const totalClaimable = items.reduce((sum, item) => sum + parseFloat(item.claimableAmount || "0"), 0);
          const [claim] = await tx.insert(paymentClaims).values({
            userId,
            vendorId: claimData.vendorId,
            vendorName: claimData.vendorName,
            claimNumber,
            claimDate: claimData.claimDate || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
            status: claimData.status || "draft",
            totalGross: totalGross.toFixed(2),
            totalCommission: totalCommission.toFixed(2),
            totalClaimable: totalClaimable.toFixed(2),
            notes: claimData.notes || null
          }).returning();
          if (items.length > 0) {
            await tx.insert(paymentClaimItems).values(
              items.map((item) => ({
                claimId: claim.id,
                deliveryItemId: item.deliveryItemId || null,
                productId: item.productId,
                productName: item.productName,
                unit: item.unit || item.productUnit || "pcs",
                quantityDelivered: item.quantity || item.quantityDelivered || 0,
                quantitySold: item.quantitySold || 0,
                quantityExpired: item.quantityExpired || 0,
                quantityReturned: item.quantityReturned || 0,
                unitPrice: item.unitPrice || "0",
                commissionRate: item.commissionRate || 0,
                commissionAmount: item.commissionAmount || "0",
                grossAmount: item.grossAmount || "0",
                claimableAmount: item.claimableAmount || "0"
              }))
            );
          }
          if (deliveryIds.length > 0) {
            await tx.insert(paymentClaimDeliveries).values(
              deliveryIds.map((deliveryId) => ({
                claimId: claim.id,
                deliveryId
              }))
            );
          }
          return claim;
        });
      }
      async getPaymentClaims(userId, filters) {
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
        return await db.select().from(paymentClaims).where(and2(...conditions)).orderBy(desc2(paymentClaims.createdAt));
      }
      async getPaymentClaimById(userId, id) {
        const [claim] = await db.select().from(paymentClaims).where(and2(eq(paymentClaims.id, id), eq(paymentClaims.userId, userId)));
        if (!claim) return void 0;
        const items = await db.select().from(paymentClaimItems).where(eq(paymentClaimItems.claimId, id));
        const deliveryLinks = await db.select().from(paymentClaimDeliveries).where(eq(paymentClaimDeliveries.claimId, id));
        const deliveryIds = deliveryLinks.map((link) => link.deliveryId);
        return { ...claim, items, deliveryIds };
      }
      async updatePaymentClaim(userId, claimId, data) {
        const [updated] = await db.update(paymentClaims).set({
          ...data,
          updatedAt: /* @__PURE__ */ new Date()
        }).where(and2(eq(paymentClaims.id, claimId), eq(paymentClaims.userId, userId))).returning();
        return updated;
      }
      async deletePaymentClaim(userId, claimId) {
        const claim = await this.getPaymentClaimById(userId, claimId);
        if (!claim) {
          throw new Error("Claim not found");
        }
        if (claim.status !== "draft") {
          throw new Error("Only draft claims can be deleted");
        }
        await db.delete(paymentClaims).where(and2(eq(paymentClaims.id, claimId), eq(paymentClaims.userId, userId)));
      }
      async markPaymentClaimAsPaid(userId, claimId) {
        const [updated] = await db.update(paymentClaims).set({
          status: "paid",
          updatedAt: /* @__PURE__ */ new Date()
        }).where(and2(eq(paymentClaims.id, claimId), eq(paymentClaims.userId, userId))).returning();
        return updated;
      }
      // ===========================
      // NOTIFICATIONS METHODS
      // ===========================
      async getUserNotifications(userId, limit = 50) {
        return db.select().from(notifications2).where(eq(notifications2.userId, userId)).orderBy(desc2(notifications2.createdAt)).limit(limit);
      }
      async getUnreadNotificationCount(userId) {
        const result = await db.select({ count: sql2`count(*)` }).from(notifications2).where(and2(
          eq(notifications2.userId, userId),
          eq(notifications2.read, 0)
        ));
        return Number(result[0]?.count || 0);
      }
      async createNotification(data) {
        const [notification] = await db.insert(notifications2).values({
          userId: data.userId,
          type: data.type,
          priority: data.priority || "medium",
          title: data.title,
          message: data.message,
          actionUrl: data.actionUrl,
          metadata: data.metadata ? JSON.stringify(data.metadata) : null,
          read: 0
        }).returning();
        return notification;
      }
      async markNotificationAsRead(userId, notificationId) {
        const [updated] = await db.update(notifications2).set({
          read: 1,
          readAt: /* @__PURE__ */ new Date()
        }).where(and2(
          eq(notifications2.id, notificationId),
          eq(notifications2.userId, userId)
        )).returning();
        return updated;
      }
      async markAllNotificationsAsRead(userId) {
        await db.update(notifications2).set({
          read: 1,
          readAt: /* @__PURE__ */ new Date()
        }).where(and2(
          eq(notifications2.userId, userId),
          eq(notifications2.read, 0)
        ));
      }
      async deleteNotification(userId, notificationId) {
        await db.delete(notifications2).where(and2(
          eq(notifications2.id, notificationId),
          eq(notifications2.userId, userId)
        ));
      }
    };
    storage = new DatabaseStorage();
  }
});

// server/subscription-service.ts
import { eq as eq2, and as and3, sql as sql3 } from "drizzle-orm";
async function activateSubscription(params) {
  const packageConfig = SUBSCRIPTION_PACKAGES[params.packageSlug];
  if (!packageConfig) {
    throw new Error(`Invalid package slug: ${params.packageSlug}`);
  }
  if (params.amount > packageConfig.price + 0.01) {
    throw new Error(
      `Amount exceeds package price: expected max RM${packageConfig.price}, got RM${params.amount}`
    );
  }
  if (params.amount < packageConfig.price - 0.01) {
    console.log(`[Subscription] \u{1F4B0} Discounted payment detected: RM${params.amount} (normal: RM${packageConfig.price})`);
  }
  return await db.transaction(async (tx) => {
    const existingSubscription = await tx.select().from(userSubscriptions2).where(eq2(userSubscriptions2.externalTransactionId, params.transactionId)).limit(1);
    if (existingSubscription.length > 0) {
      const user2 = await tx.select().from(users).where(eq2(users.id, existingSubscription[0].userId)).limit(1);
      return {
        success: true,
        isNewSubscription: false,
        wasOnTrial: false,
        user: user2[0],
        subscription: existingSubscription[0],
        newEndsAt: new Date(existingSubscription[0].subscriptionEndsAt),
        extendedMonths: existingSubscription[0].durationMonths,
        message: "Transaction already processed (idempotent response)"
      };
    }
    const [user] = await tx.select().from(users).where(eq2(users.email, params.email)).limit(1);
    if (!user) {
      throw new Error(
        `User not found with email: ${params.email}. Please register first.`
      );
    }
    const [plan] = await tx.select().from(subscriptionPlans2).where(eq2(subscriptionPlans2.name, "standard")).limit(1);
    if (!plan) {
      throw new Error("Subscription plan 'standard' not found in database");
    }
    const now = /* @__PURE__ */ new Date();
    const [activeSubscription] = await tx.select().from(userSubscriptions2).where(
      and3(
        eq2(userSubscriptions2.userId, user.id),
        eq2(userSubscriptions2.status, "active"),
        sql3`${userSubscriptions2.subscriptionEndsAt} > ${now}`
      )
    ).orderBy(userSubscriptions2.subscriptionEndsAt).limit(1);
    let newSubscription;
    let isNewSubscription = true;
    let previousEndsAt;
    if (activeSubscription) {
      isNewSubscription = false;
      previousEndsAt = new Date(activeSubscription.subscriptionEndsAt);
      const extendedEndsAt = new Date(activeSubscription.subscriptionEndsAt);
      extendedEndsAt.setMonth(extendedEndsAt.getMonth() + packageConfig.months);
      const [updated] = await tx.update(userSubscriptions2).set({
        subscriptionEndsAt: extendedEndsAt,
        durationMonths: activeSubscription.durationMonths + packageConfig.months,
        updatedAt: now
      }).where(eq2(userSubscriptions2.id, activeSubscription.id)).returning();
      const [newRecord] = await tx.insert(userSubscriptions2).values({
        userId: user.id,
        planId: plan.id,
        planName: packageConfig.planName,
        status: "superseded",
        // Mark as superseded/replaced since it extended existing subscription
        durationMonths: packageConfig.months,
        subscriptionStartsAt: previousEndsAt,
        // Start where old ended
        subscriptionEndsAt: extendedEndsAt,
        totalPaid: params.amount.toString(),
        paymentProvider: "bcl_bayarcash",
        paymentMethod: params.paymentChannel || params.paymentMethod || "FPX",
        externalTransactionId: params.transactionId,
        activationSource: params.activationSource || "webhook_bcl",
        previousSubscriptionId: activeSubscription.id,
        metadata: params.metadata ? JSON.stringify(params.metadata) : null
      }).returning();
      newSubscription = updated;
    } else {
      const subscriptionStartsAt = now;
      const subscriptionEndsAt = new Date(now);
      subscriptionEndsAt.setMonth(subscriptionEndsAt.getMonth() + packageConfig.months);
      const [created] = await tx.insert(userSubscriptions2).values({
        userId: user.id,
        planId: plan.id,
        planName: packageConfig.planName,
        status: "active",
        durationMonths: packageConfig.months,
        subscriptionStartsAt,
        subscriptionEndsAt,
        totalPaid: params.amount.toString(),
        paymentProvider: "bcl_bayarcash",
        paymentMethod: params.paymentChannel || params.paymentMethod || "FPX",
        externalTransactionId: params.transactionId,
        activationSource: params.activationSource || "webhook_bcl",
        metadata: params.metadata ? JSON.stringify(params.metadata) : null
      }).returning();
      newSubscription = created;
    }
    const wasOnTrial = user.isOnTrial === 1;
    if (wasOnTrial) {
      await tx.update(users).set({
        isOnTrial: 0,
        updatedAt: now
      }).where(eq2(users.id, user.id));
    }
    await tx.insert(billingHistory).values({
      userId: user.id,
      subscriptionId: newSubscription.id,
      amount: params.amount.toString(),
      currency: "MYR",
      status: "succeeded",
      paymentMethod: params.paymentChannel || params.paymentMethod || "FPX",
      description: `Subscription payment - ${packageConfig.months} month${packageConfig.months > 1 ? "s" : ""}`,
      toyyibpayTransactionId: params.transactionId,
      paidAt: now
    });
    return {
      success: true,
      isNewSubscription,
      wasOnTrial,
      user,
      subscription: newSubscription,
      previousEndsAt,
      newEndsAt: new Date(newSubscription.subscriptionEndsAt),
      extendedMonths: packageConfig.months,
      message: isNewSubscription ? `Subscription activated successfully for ${packageConfig.months} month${packageConfig.months > 1 ? "s" : ""}` : `Subscription extended by ${packageConfig.months} month${packageConfig.months > 1 ? "s" : ""}`
    };
  });
}
function getPackageConfig(slug) {
  const config = SUBSCRIPTION_PACKAGES[slug];
  if (!config) {
    throw new Error(`Invalid package slug: ${slug}. Valid options: ${Object.keys(SUBSCRIPTION_PACKAGES).join(", ")}`);
  }
  return config;
}
function extractPackageFromFormTitle(formTitle) {
  const match = formTitle.match(/(\d+)\s*bulan/i);
  if (match) {
    const months = parseInt(match[1]);
    const slug = `${months}-bulan`;
    if (SUBSCRIPTION_PACKAGES[slug]) {
      return slug;
    }
  }
  return null;
}
function extractPackageFromAmount(amount) {
  for (const [slug, config] of Object.entries(SUBSCRIPTION_PACKAGES)) {
    if (Math.abs(amount - config.price) < 0.01) {
      return slug;
    }
  }
  return null;
}
var SUBSCRIPTION_PACKAGES;
var init_subscription_service = __esm({
  "server/subscription-service.ts"() {
    init_db();
    init_schema();
    SUBSCRIPTION_PACKAGES = {
      "1-bulan": { months: 1, price: 27, planName: "PocketBizz" },
      "3-bulan": { months: 3, price: 79, planName: "PocketBizz" },
      "6-bulan": { months: 6, price: 146, planName: "PocketBizz" },
      "12-bulan": { months: 12, price: 259, planName: "PocketBizz" }
    };
  }
});

// server/bcl-webhook.ts
import crypto from "crypto";
function verifyBCLSignature(payload, signature, secret) {
  const expectedSignature = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
async function processBCLWebhook(req, res) {
  try {
    const webhookSecret = process.env.BCL_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("[BCL] BCL_WEBHOOK_SECRET not configured");
      return res.status(500).json({
        success: false,
        error: "Webhook secret not configured"
      });
    }
    const rawBody = req.rawBody || JSON.stringify(req.body);
    const signature = req.headers["x-bcl-signature"];
    console.log("[BCL] Incoming webhook: ", {
      hasSignature: Boolean(signature),
      rawLength: typeof rawBody === "string" ? rawBody.length : 0,
      env: process.env.NODE_ENV
    });
    if (signature) {
      const isValid = verifyBCLSignature(rawBody, signature, webhookSecret);
      if (!isValid) {
        console.error("[BCL] Invalid webhook signature");
        return res.status(401).json({
          success: false,
          error: "Invalid signature"
        });
      }
      console.log("[BCL] \u2713 Signature verified");
    } else {
      console.warn("[BCL] \u26A0\uFE0F  No signature provided - relying on email validation and idempotency");
    }
    const payload = req.body;
    const webhookData = payload.data || payload;
    const mainData = webhookData.main_data || {};
    const statusStr = String(mainData.status ?? "").toLowerCase();
    console.log("[BCL] Webhook received:", {
      event: payload.event,
      recordId: webhookData.record_id,
      formTitle: webhookData.form_title,
      email: mainData.payer_email,
      orderNumber: mainData.order_number,
      amount: mainData.amount,
      isPaid: mainData.is_paid,
      status: mainData.status
    });
    if (payload.event === "payment-failed" || statusStr === "failed") {
      console.warn("[BCL] Payment failed:", {
        email: mainData.payer_email,
        recordId: webhookData.record_id,
        status: mainData.status
      });
      return res.json({ success: true, message: "Payment failure logged" });
    }
    const isPaymentEvent = payload.event === "payment-success" || payload.event === "form-submit";
    if (!isPaymentEvent) {
      console.log("[BCL] Ignoring unrelated event:", payload.event);
      return res.json({ success: true, message: "Event ignored (not a payment event)" });
    }
    const rawIsPaid = String(mainData.is_paid ?? "").toLowerCase();
    const isPaid = ["1", "true", "paid", "completed"].includes(rawIsPaid) || ["paid", "completed"].includes(statusStr);
    if (!isPaid) {
      console.warn("[BCL] Payment not confirmed:", {
        isPaid: mainData.is_paid,
        status: mainData.status,
        event: payload.event
      });
      return res.status(400).json({
        success: false,
        error: "Payment not confirmed",
        isPaid: mainData.is_paid,
        status: mainData.status
      });
    }
    console.log("[BCL] \u2713 Payment confirmed as successful");
    const email = mainData.payer_email || mainData.email;
    const name = mainData.payer_name;
    const phone = mainData.payer_telephone_number;
    const amount = parseFloat(mainData.amount || "0");
    const orderNumber = mainData.order_number || webhookData.record_id;
    const currency = mainData.currency || "MYR";
    const paymentChannel = mainData.payment_channel || "FPX";
    const transactionId = orderNumber;
    const formTitle = webhookData.form_title || "";
    if (currency !== "MYR") {
      console.error("[BCL] Invalid currency:", currency);
      return res.status(400).json({
        success: false,
        error: `Invalid currency: ${currency}. Only MYR accepted.`
      });
    }
    if (!email) {
      console.error("[BCL] Missing email in webhook payload");
      return res.status(400).json({
        success: false,
        error: "Email is required",
        hint: "Webhook payload must include email in main_data"
      });
    }
    console.log("[BCL] Webhook data extracted:", {
      email,
      name,
      phone,
      amount,
      currency,
      orderNumber,
      transactionId,
      formTitle,
      paymentChannel
    });
    let packageSlug = extractPackageFromFormTitle(formTitle);
    if (!packageSlug) {
      console.log("[BCL] Could not extract from form_title, trying amount match...");
      packageSlug = extractPackageFromAmount(amount);
    }
    if (!packageSlug) {
      console.error("[BCL] Could not determine package from form_title or amount:", {
        formTitle,
        amount
      });
      return res.status(400).json({
        success: false,
        error: `Unable to determine package. Form: "${formTitle}", Amount: RM${amount}`,
        hint: "Expected amounts: RM27, RM79, RM146, or RM259"
      });
    }
    const packageConfig = getPackageConfig(packageSlug);
    console.log("[BCL] \u2713 Package identified:", {
      slug: packageSlug,
      months: packageConfig.months,
      price: packageConfig.price
    });
    console.log("[BCL] Activating subscription via service layer...");
    const result = await activateSubscription({
      email,
      packageSlug,
      amount,
      transactionId,
      paymentMethod: paymentChannel,
      paymentChannel,
      activationSource: "webhook_bcl",
      metadata: {
        formTitle,
        recordId: webhookData.record_id,
        payerName: name,
        payerPhone: phone,
        webhookEvent: payload.event
      }
    });
    console.log("[BCL] \u2713 Subscription activation result:", {
      isNewSubscription: result.isNewSubscription,
      wasOnTrial: result.wasOnTrial,
      userId: result.user.id,
      subscriptionId: result.subscription.id,
      previousEndsAt: result.previousEndsAt,
      newEndsAt: result.newEndsAt,
      extendedMonths: result.extendedMonths
    });
    return res.json({
      success: true,
      message: result.message,
      data: {
        userId: result.user.id,
        email: result.user.email,
        subscriptionId: result.subscription.id,
        plan: packageConfig.planName,
        isNewSubscription: result.isNewSubscription,
        wasOnTrial: result.wasOnTrial,
        previousEndsAt: result.previousEndsAt?.toISOString(),
        newEndsAt: result.newEndsAt.toISOString(),
        extendedMonths: result.extendedMonths,
        totalMonths: result.subscription.durationMonths
      }
    });
  } catch (error) {
    console.error("[BCL] Webhook processing error:", error);
    if (error instanceof Error) {
      console.error("[BCL] Error details:", {
        message: error.message,
        stack: error.stack
      });
    }
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
}
async function testBCLWebhook(req, res) {
  if (process.env.NODE_ENV === "production") {
    return res.status(403).json({ error: "Not available in production" });
  }
  const { email, months, amount } = req.body;
  const packageSlug = `${months || 3}-bulan`;
  const testPayload = {
    event: "payment-success",
    data: {
      form_id: 999,
      form_slug: packageSlug,
      form_title: `Langganan ${months || 3} Bulan`,
      record_type: "Transaction",
      record_id: `TEST-${Date.now()}`,
      main_data: {
        id: crypto.randomUUID(),
        form_id: 999,
        payer_email: email || "test@example.com",
        payer_name: "Test User",
        payer_telephone_number: "0123456789",
        order_number: `TEST-${Date.now()}`,
        amount: String(amount || 79),
        is_paid: "1",
        status: "completed",
        payment_channel: "FPX",
        currency: "MYR"
      }
    }
  };
  req.body = testPayload;
  return processBCLWebhook(req, res);
}
async function testBCLWebhookSigned(req, res) {
  if (process.env.NODE_ENV === "production") {
    return res.status(403).json({ error: "Not available in production" });
  }
  const webhookSecret = process.env.BCL_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return res.status(500).json({ error: "BCL_WEBHOOK_SECRET not configured" });
  }
  const { email, months, amount } = req.body;
  const packageSlug = `${months || 3}-bulan`;
  const payload = {
    event: "payment-success",
    data: {
      form_id: 999,
      form_slug: packageSlug,
      form_title: `Langganan ${months || 3} Bulan`,
      record_type: "Transaction",
      record_id: `TEST-${Date.now()}`,
      main_data: {
        id: crypto.randomUUID(),
        form_id: 999,
        payer_email: email || "test@example.com",
        payer_name: "Test User",
        payer_telephone_number: "0123456789",
        order_number: `TEST-${Date.now()}`,
        amount: String(amount || 79),
        is_paid: "1",
        status: "completed",
        payment_channel: "FPX",
        currency: "MYR"
      }
    }
  };
  req.body = payload;
  const raw = JSON.stringify(payload);
  const sig = crypto.createHmac("sha256", webhookSecret).update(raw).digest("hex");
  req.headers["x-bcl-signature"] = sig;
  return processBCLWebhook(req, res);
}
var init_bcl_webhook = __esm({
  "server/bcl-webhook.ts"() {
    init_subscription_service();
  }
});

// server/feature-gating.ts
var feature_gating_exports = {};
__export(feature_gating_exports, {
  checkLimit: () => checkLimit,
  enforceCustomerLimit: () => enforceCustomerLimit,
  enforceLimit: () => enforceLimit,
  enforceProductLimit: () => enforceProductLimit,
  enforceResellerLimit: () => enforceResellerLimit,
  enforceStockLimit: () => enforceStockLimit,
  enforceVendorLimit: () => enforceVendorLimit,
  getPlanLimits: () => getPlanLimits,
  getUserPlan: () => getUserPlan,
  hasFeatureAccess: () => hasFeatureAccess,
  requireAdvancedAnalytics: () => requireAdvancedAnalytics,
  requireApiAccess: () => requireApiAccess,
  requireBookings: () => requireBookings,
  requireFeature: () => requireFeature,
  requireLoyaltyPoints: () => requireLoyaltyPoints,
  requirePublicStore: () => requirePublicStore,
  requireResellerNetwork: () => requireResellerNetwork,
  requireSmsBroadcast: () => requireSmsBroadcast,
  requireVendorClaims: () => requireVendorClaims,
  requireWhatsappBroadcast: () => requireWhatsappBroadcast
});
async function getUserPlan(userId) {
  const user = await storage.getUserById(userId);
  if (user && user.isOnTrial && user.trialEndsAt && new Date(user.trialEndsAt) > /* @__PURE__ */ new Date()) {
    return {
      id: "trial",
      displayName: "\u{1F381} Free Trial (Full Access)",
      // Launch configuration: some modules disabled globally
      hasVendorClaims: 1,
      hasResellerNetwork: 0,
      hasAdvancedAnalytics: 1,
      hasLoyaltyPoints: 0,
      hasBookings: 0,
      hasWhatsappBroadcast: 0,
      hasSmsBroadcast: 0,
      hasPublicStore: 0,
      hasApiAccess: 1,
      hasCustomDomain: 0,
      hasPrioritySupport: 0,
      hasAccountManager: 0,
      // Generous limits for trial
      maxProducts: 100,
      maxCustomers: 500,
      maxStockItems: 200,
      maxVendors: 20,
      maxResellers: 0,
      maxDeliveriesPerMonth: 200,
      maxUsers: 3,
      storageLimit: 2147483648
      // 2GB
    };
  }
  const subscriptions = await storage.getUserSubscriptions(userId);
  const now = /* @__PURE__ */ new Date();
  const activeSub = subscriptions.find(
    (sub) => sub.status === "active" && sub.subscriptionEndsAt && new Date(sub.subscriptionEndsAt) > now
  );
  if (activeSub) {
    const plan = await storage.getSubscriptionPlanById(activeSub.planId);
    if (plan) {
      return {
        ...plan,
        hasResellerNetwork: 0,
        hasLoyaltyPoints: 0,
        hasBookings: 0,
        hasWhatsappBroadcast: 0,
        hasSmsBroadcast: 0,
        hasPublicStore: 0,
        maxResellers: 0
      };
    }
    return plan;
  }
  return null;
}
async function getPlanLimits(userId) {
  const plan = await getUserPlan(userId);
  return {
    maxProducts: plan?.maxProducts ?? 10,
    maxStockItems: plan?.maxStockItems ?? 20,
    // Use deliveries per month as proxy for transaction-like activity
    maxTransactions: plan?.maxDeliveriesPerMonth ?? 50
  };
}
async function hasFeatureAccess(userId, feature) {
  const plan = await getUserPlan(userId);
  if (!plan) {
    return false;
  }
  const featureMap = {
    "vendor_claims": "hasVendorClaims",
    "reseller_network": "hasResellerNetwork",
    "advanced_analytics": "hasAdvancedAnalytics",
    "loyalty_points": "hasLoyaltyPoints",
    // Use loyalty_points flag to gate vouchers too (global disable)
    "vouchers": "hasLoyaltyPoints",
    "bookings": "hasBookings",
    "whatsapp_broadcast": "hasWhatsappBroadcast",
    "sms_broadcast": "hasSmsBroadcast",
    "public_store": "hasPublicStore",
    "api_access": "hasApiAccess",
    "custom_domain": "hasCustomDomain",
    "priority_support": "hasPrioritySupport",
    "account_manager": "hasAccountManager"
  };
  const column = featureMap[feature];
  if (!column) return false;
  return plan[column] === 1;
}
function requireFeature(feature) {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const hasAccess = await hasFeatureAccess(req.user.id, feature);
    if (!hasAccess) {
      return res.status(403).json({
        message: "This feature requires a premium subscription",
        feature,
        upgradeRequired: true
      });
    }
    next();
  };
}
async function checkLimit(userId, resource) {
  const plan = await getUserPlan(userId);
  const limits = {
    products: plan?.maxProducts || 10,
    customers: plan?.maxCustomers || 50,
    vendors: plan?.maxVendors || 2,
    resellers: plan?.maxResellers || 0,
    stock_items: plan?.maxStockItems || 20
  };
  let current = 0;
  switch (resource) {
    case "products":
      current = await storage.getProductCount(userId);
      break;
    case "customers":
      current = (await storage.getCustomers(userId)).length;
      break;
    case "vendors":
      current = (await storage.getVendors(userId)).length;
      break;
    case "resellers":
      current = (await storage.getResellers(userId)).length;
      break;
    case "stock_items":
      current = (await storage.getStockItems(userId)).length;
      break;
  }
  const limit = limits[resource];
  const allowed = current < limit;
  return {
    allowed,
    current,
    limit,
    plan: plan?.displayName || "\u{1F381} Free Trial"
  };
}
function enforceLimit(resource) {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const check = await checkLimit(req.user.id, resource);
    if (!check.allowed) {
      const resourceNames = {
        products: "produk",
        customers: "pelanggan",
        vendors: "vendor",
        resellers: "reseller",
        stock_items: "item stok"
      };
      const resourceName = resourceNames[resource] || resource;
      return res.status(403).json({
        message: `Had ${resourceName} anda telah dicapai (${check.current}/${check.limit}). Upgrade untuk tambah lebih banyak!`,
        current: check.current,
        limit: check.limit,
        plan: check.plan,
        upgradeRequired: true,
        resource
      });
    }
    next();
  };
}
var requireVendorClaims, requireResellerNetwork, requireAdvancedAnalytics, requireLoyaltyPoints, requireBookings, requireWhatsappBroadcast, requireSmsBroadcast, requirePublicStore, requireApiAccess, enforceProductLimit, enforceCustomerLimit, enforceVendorLimit, enforceResellerLimit, enforceStockLimit;
var init_feature_gating = __esm({
  "server/feature-gating.ts"() {
    init_storage();
    requireVendorClaims = requireFeature("vendor_claims");
    requireResellerNetwork = requireFeature("reseller_network");
    requireAdvancedAnalytics = requireFeature("advanced_analytics");
    requireLoyaltyPoints = requireFeature("loyalty_points");
    requireBookings = requireFeature("bookings");
    requireWhatsappBroadcast = requireFeature("whatsapp_broadcast");
    requireSmsBroadcast = requireFeature("sms_broadcast");
    requirePublicStore = requireFeature("public_store");
    requireApiAccess = requireFeature("api_access");
    enforceProductLimit = enforceLimit("products");
    enforceCustomerLimit = enforceLimit("customers");
    enforceVendorLimit = enforceLimit("vendors");
    enforceResellerLimit = enforceLimit("resellers");
    enforceStockLimit = enforceLimit("stock_items");
  }
});

// server/resend-client.ts
var resend_client_exports = {};
__export(resend_client_exports, {
  getUncachableResendClient: () => getUncachableResendClient
});
import { Resend } from "resend";
async function getCredentials() {
  if (process.env.RESEND_API_KEY) {
    return {
      apiKey: process.env.RESEND_API_KEY
    };
  }
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY ? "repl " + process.env.REPL_IDENTITY : process.env.WEB_REPL_RENEWAL ? "depl " + process.env.WEB_REPL_RENEWAL : null;
  if (!xReplitToken) {
    throw new Error("Email service not configured. Please set RESEND_API_KEY environment variable or configure Replit connector.");
  }
  connectionSettings2 = await fetch(
    "https://" + hostname + "/api/v2/connection?include_secrets=true&connector_names=resend",
    {
      headers: {
        "Accept": "application/json",
        "X_REPLIT_TOKEN": xReplitToken
      }
    }
  ).then((res) => res.json()).then((data) => data.items?.[0]);
  if (!connectionSettings2 || !connectionSettings2.settings.api_key) {
    throw new Error("Resend not connected");
  }
  return { apiKey: connectionSettings2.settings.api_key };
}
async function getUncachableResendClient() {
  const credentials = await getCredentials();
  return new Resend(credentials.apiKey);
}
var connectionSettings2;
var init_resend_client = __esm({
  "server/resend-client.ts"() {
  }
});

// server/toyyibpay.ts
var toyyibpay_exports = {};
__export(toyyibpay_exports, {
  centsToRm: () => centsToRm,
  createBill: () => createBill,
  getBillTransactions: () => getBillTransactions,
  getBillUrl: () => getBillUrl,
  rmToCents: () => rmToCents
});
import axios from "axios";
async function createBill(params) {
  const userSecretKey = process.env.TOYYIBPAY_USER_SECRET_KEY;
  const categoryCode = process.env.TOYYIBPAY_CATEGORY_CODE;
  if (!userSecretKey || !categoryCode) {
    throw new Error("ToyyibPay credentials not configured");
  }
  const formData = new URLSearchParams({
    userSecretKey,
    categoryCode,
    billName: params.billName,
    billDescription: params.billDescription,
    billPriceSetting: "1",
    // Fixed amount
    billPayorInfo: "1",
    // Require payer info
    billAmount: params.billAmount.toString(),
    billReturnUrl: params.billReturnUrl,
    billCallbackUrl: params.billCallbackUrl,
    billExternalReferenceNo: params.billExternalReferenceNo,
    billTo: params.billTo,
    billEmail: params.billEmail,
    billPhone: params.billPhone,
    billPaymentChannel: "0",
    // All payment methods (FPX, cards, e-wallets)
    billDisplayMerchant: "1",
    // Show merchant info
    billChargeToCustomer: "1"
    // FPX owner pays, CC customer pays
  });
  if (params.billExpiryDays) {
    formData.append("billExpiryDays", params.billExpiryDays.toString());
  }
  try {
    const response = await axios.post(
      `${TOYYIBPAY_API_URL}/createBill`,
      formData.toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        }
      }
    );
    const result = response.data[0];
    if (result.error) {
      throw new Error(`ToyyibPay Error: ${result.error}`);
    }
    return result;
  } catch (error) {
    if (error.response) {
      throw new Error(`ToyyibPay API Error: ${error.response.data?.error || error.message}`);
    }
    throw error;
  }
}
function getBillUrl(billCode) {
  return `https://toyyibpay.com/${billCode}`;
}
function rmToCents(rm) {
  return Math.round(rm * 100);
}
function centsToRm(cents) {
  return cents / 100;
}
async function getBillTransactions(billCode, status) {
  const formData = new URLSearchParams({
    billCode
  });
  if (status) {
    formData.append("billpaymentStatus", status);
  }
  try {
    const response = await axios.post(
      `${TOYYIBPAY_API_URL}/getBillTransactions`,
      formData.toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        }
      }
    );
    return response.data || [];
  } catch (error) {
    console.error("ToyyibPay getBillTransactions error:", error.message);
    return [];
  }
}
var TOYYIBPAY_API_URL;
var init_toyyibpay = __esm({
  "server/toyyibpay.ts"() {
    TOYYIBPAY_API_URL = "https://toyyibpay.com/index.php/api";
  }
});

// server/archiving.ts
var archiving_exports = {};
__export(archiving_exports, {
  archiveUserData: () => archiveUserData,
  enforceGracePeriod: () => enforceGracePeriod,
  restoreUserData: () => restoreUserData
});
import { eq as eq3, and as and4, desc as desc3, lt, isNotNull, inArray as inArray2 } from "drizzle-orm";
async function archiveUserData(userId) {
  const user = await db.select().from(users).where(eq3(users.id, userId)).limit(1);
  if (!user || user.length === 0) {
    throw new Error("User not found");
  }
  const plan = await getUserPlan(userId.toString());
  if (!plan || typeof plan !== "object") {
    throw new Error("Failed to get user plan");
  }
  const result = {
    productsArchived: 0,
    vendorsArchived: 0,
    resellersArchived: 0,
    customersArchived: 0,
    stockItemsArchived: 0
  };
  const limits = plan.limits || {
    products: 0,
    vendors: 0,
    resellers: 0,
    customers: 0,
    stockItems: 0
  };
  try {
    await db.transaction(async (tx) => {
      if (limits.products > 0) {
        const allProducts = await tx.select({ id: products.id }).from(products).where(
          and4(
            eq3(products.userId, userId),
            eq3(products.isArchived, 0)
          )
        ).orderBy(desc3(products.createdAt));
        if (allProducts.length > limits.products) {
          const toArchive = allProducts.slice(limits.products);
          const ids = toArchive.map((p) => p.id);
          if (ids.length > 0) {
            await tx.update(products).set({ isArchived: 1 }).where(
              and4(
                eq3(products.userId, userId),
                inArray2(products.id, ids)
              )
            );
            result.productsArchived = toArchive.length;
          }
        }
      }
      if (limits.vendors > 0) {
        const allVendors = await tx.select({ id: vendors.id }).from(vendors).where(
          and4(
            eq3(vendors.userId, userId),
            eq3(vendors.isArchived, 0)
          )
        ).orderBy(desc3(vendors.createdAt));
        if (allVendors.length > limits.vendors) {
          const toArchive = allVendors.slice(limits.vendors);
          const ids = toArchive.map((v) => v.id);
          if (ids.length > 0) {
            await tx.update(vendors).set({ isArchived: 1 }).where(
              and4(
                eq3(vendors.userId, userId),
                inArray2(vendors.id, ids)
              )
            );
            result.vendorsArchived = toArchive.length;
          }
        }
      }
      if (limits.resellers > 0) {
        const allResellers = await tx.select({ id: resellers.id }).from(resellers).where(
          and4(
            eq3(resellers.userId, userId),
            eq3(resellers.isArchived, 0)
          )
        ).orderBy(desc3(resellers.createdAt));
        if (allResellers.length > limits.resellers) {
          const toArchive = allResellers.slice(limits.resellers);
          const ids = toArchive.map((r) => r.id);
          if (ids.length > 0) {
            await tx.update(resellers).set({ isArchived: 1 }).where(
              and4(
                eq3(resellers.userId, userId),
                inArray2(resellers.id, ids)
              )
            );
            result.resellersArchived = toArchive.length;
          }
        }
      }
      if (limits.customers > 0) {
        const allCustomers = await tx.select({ id: customers.id }).from(customers).where(
          and4(
            eq3(customers.userId, userId),
            eq3(customers.isArchived, 0)
          )
        ).orderBy(desc3(customers.createdAt));
        if (allCustomers.length > limits.customers) {
          const toArchive = allCustomers.slice(limits.customers);
          const ids = toArchive.map((c) => c.id);
          if (ids.length > 0) {
            await tx.update(customers).set({ isArchived: 1 }).where(
              and4(
                eq3(customers.userId, userId),
                inArray2(customers.id, ids)
              )
            );
            result.customersArchived = toArchive.length;
          }
        }
      }
      const allStockItems = await tx.select({ id: stockItems.id }).from(stockItems).where(
        and4(
          eq3(stockItems.userId, userId),
          eq3(stockItems.isArchived, 0)
        )
      ).orderBy(desc3(stockItems.createdAt));
      const stockLimit = limits.stockItems || 0;
      if (stockLimit > 0 && allStockItems.length > stockLimit) {
        const toArchive = allStockItems.slice(stockLimit);
        const ids = toArchive.map((s) => s.id);
        if (ids.length > 0) {
          await tx.update(stockItems).set({ isArchived: 1 }).where(
            and4(
              eq3(stockItems.userId, userId),
              inArray2(stockItems.id, ids)
            )
          );
          result.stockItemsArchived = ids.length;
        }
      }
    });
    console.log(`\u2705 Successfully archived data for user ${userId}:`, result);
    return result;
  } catch (error) {
    console.error(`\u274C Transaction failed - data archiving rolled back for user ${userId}:`, error);
    throw new Error(`Failed to archive user data: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}
async function restoreUserData(userId) {
  const result = {
    productsArchived: 0,
    vendorsArchived: 0,
    resellersArchived: 0,
    customersArchived: 0,
    stockItemsArchived: 0
  };
  try {
    await db.transaction(async (tx) => {
      const archivedProducts = await tx.select({ id: products.id }).from(products).where(
        and4(
          eq3(products.userId, userId),
          eq3(products.isArchived, 1)
        )
      );
      if (archivedProducts.length > 0) {
        await tx.update(products).set({ isArchived: 0 }).where(
          and4(
            eq3(products.userId, userId),
            eq3(products.isArchived, 1)
          )
        );
        result.productsArchived = archivedProducts.length;
      }
      const archivedVendors = await tx.select({ id: vendors.id }).from(vendors).where(
        and4(
          eq3(vendors.userId, userId),
          eq3(vendors.isArchived, 1)
        )
      );
      if (archivedVendors.length > 0) {
        await tx.update(vendors).set({ isArchived: 0 }).where(
          and4(
            eq3(vendors.userId, userId),
            eq3(vendors.isArchived, 1)
          )
        );
        result.vendorsArchived = archivedVendors.length;
      }
      const archivedResellers = await tx.select({ id: resellers.id }).from(resellers).where(
        and4(
          eq3(resellers.userId, userId),
          eq3(resellers.isArchived, 1)
        )
      );
      if (archivedResellers.length > 0) {
        await tx.update(resellers).set({ isArchived: 0 }).where(
          and4(
            eq3(resellers.userId, userId),
            eq3(resellers.isArchived, 1)
          )
        );
        result.resellersArchived = archivedResellers.length;
      }
      const archivedCustomers = await tx.select({ id: customers.id }).from(customers).where(
        and4(
          eq3(customers.userId, userId),
          eq3(customers.isArchived, 1)
        )
      );
      if (archivedCustomers.length > 0) {
        await tx.update(customers).set({ isArchived: 0 }).where(
          and4(
            eq3(customers.userId, userId),
            eq3(customers.isArchived, 1)
          )
        );
        result.customersArchived = archivedCustomers.length;
      }
      const archivedStockItems = await tx.select({ id: stockItems.id }).from(stockItems).where(
        and4(
          eq3(stockItems.userId, userId),
          eq3(stockItems.isArchived, 1)
        )
      );
      if (archivedStockItems.length > 0) {
        await tx.update(stockItems).set({ isArchived: 0 }).where(
          and4(
            eq3(stockItems.userId, userId),
            eq3(stockItems.isArchived, 1)
          )
        );
        result.stockItemsArchived = archivedStockItems.length;
      }
    });
    console.log(`\u2705 Successfully restored data for user ${userId}:`, result);
    return result;
  } catch (error) {
    console.error(`\u274C Transaction failed - data restoration rolled back for user ${userId}:`, error);
    throw new Error(`Failed to restore user data: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}
async function enforceGracePeriod() {
  try {
    const expiredUsersQuery = db.select().from(users).where(
      and4(
        isNotNull(users.graceEndsAt),
        lt(users.graceEndsAt, /* @__PURE__ */ new Date())
      )
    );
    const candidateUsers = await expiredUsersQuery;
    const now = /* @__PURE__ */ new Date();
    const expiredUsers = [];
    for (const user of candidateUsers) {
      const trialActive = Boolean(user.isOnTrial) && user.trialEndsAt && new Date(user.trialEndsAt) > now;
      if (trialActive) {
        console.log(`[CRON] Skipping user ${user.id} - trial still active`);
        continue;
      }
      const subscriptions = await storage.getUserSubscriptions(user.id);
      const hasActiveSubscription = subscriptions.some(
        (sub) => sub.status === "active" && sub.subscriptionEndsAt && new Date(sub.subscriptionEndsAt) > now
      );
      if (hasActiveSubscription) {
        console.log(`[CRON] Skipping user ${user.id} - active subscription detected`);
        continue;
      }
      expiredUsers.push(user);
    }
    console.log(`[CRON] Found ${expiredUsers.length} users with expired grace periods and no active subscription`);
    const results = [];
    for (const user of expiredUsers) {
      try {
        console.log(`[CRON] Processing user ${user.id} (${user.email})`);
        const archiveResult = await archiveUserData(user.id);
        await db.update(users).set({
          graceEndsAt: null,
          isOnTrial: false
        }).where(eq3(users.id, user.id));
        results.push({
          userId: user.id,
          email: user.email,
          archived: archiveResult
        });
        console.log(`Archived data for user ${user.id}:`, archiveResult);
      } catch (error) {
        console.error(`Failed to archive data for user ${user.id}:`, error);
      }
    }
    return results;
  } catch (error) {
    console.error("[CRON] enforceGracePeriod failed:", error);
    throw error;
  }
}
var init_archiving = __esm({
  "server/archiving.ts"() {
    init_db();
    init_schema();
    init_feature_gating();
    init_storage();
  }
});

// server/cron.ts
var cron_exports = {};
__export(cron_exports, {
  registerCronEndpoints: () => registerCronEndpoints,
  runDailyGracePeriodCheck: () => runDailyGracePeriodCheck,
  runDailyReminders: () => runDailyReminders
});
import { eq as eq4, and as and5, lte as lte2, gte as gte2, sql as sql4 } from "drizzle-orm";
async function runDailyGracePeriodCheck() {
  console.log("[CRON] Starting daily grace period check...");
  try {
    const results = await enforceGracePeriod();
    console.log(`[CRON] Grace period check complete. Processed ${results.length} users.`);
    if (results.length > 0) {
      console.log("[CRON] Archive summary:");
      results.forEach((r) => {
        console.log(`  - User ${r.userId} (${r.email}):`, r.archived);
      });
    }
    return {
      success: true,
      processed: results.length,
      results
    };
  } catch (error) {
    console.error("[CRON] Grace period check failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}
async function runDailyReminders() {
  console.log("[CRON] Starting daily reminders...");
  try {
    let notificationCount = 0;
    const users2 = await db.query.users.findMany({
      where: (users3, { eq: eq6 }) => eq6(users3.suspended, 0)
    });
    for (const user of users2) {
      const tomorrow = /* @__PURE__ */ new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      const dayAfterTomorrow = new Date(tomorrow);
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
      const upcomingBookings = await db.select().from(bookings).where(and5(
        eq4(bookings.userId, user.id),
        gte2(bookings.pickupDate, tomorrow.toISOString()),
        lte2(bookings.pickupDate, dayAfterTomorrow.toISOString())
      ));
      if (upcomingBookings.length > 0) {
        await storage.createNotification({
          userId: user.id,
          type: "reminder",
          priority: "high",
          title: "Pengingat: Tempahan Esok",
          message: `Anda ada ${upcomingBookings.length} tempahan untuk esok (${tomorrow.toLocaleDateString("ms-MY")})`,
          actionUrl: "/bookings",
          metadata: { bookingCount: upcomingBookings.length, date: tomorrow.toISOString() }
        });
        notificationCount++;
      }
      const lowStockItems = await db.select().from(stockItems).where(and5(
        eq4(stockItems.userId, user.id),
        sql4`${stockItems.currentQuantity}::decimal <= ${stockItems.lowStockThreshold}::decimal`
      )).limit(5);
      if (lowStockItems.length > 0) {
        const itemNames = lowStockItems.map((item) => item.name).join(", ");
        await storage.createNotification({
          userId: user.id,
          type: "stock",
          priority: "urgent",
          title: "Amaran: Stok Rendah",
          message: `${lowStockItems.length} bahan stok rendah: ${itemNames}`,
          actionUrl: "/stock",
          metadata: { stockCount: lowStockItems.length }
        });
        notificationCount++;
      }
      const today = /* @__PURE__ */ new Date();
      today.setHours(0, 0, 0, 0);
      const endOfToday = new Date(today);
      endOfToday.setHours(23, 59, 59, 999);
      const todayBookings = await db.select().from(bookings).where(and5(
        eq4(bookings.userId, user.id),
        gte2(bookings.pickupDate, today.toISOString()),
        lte2(bookings.pickupDate, endOfToday.toISOString()),
        eq4(bookings.status, "pending")
      ));
      if (todayBookings.length > 0) {
        await storage.createNotification({
          userId: user.id,
          type: "reminder",
          priority: "high",
          title: "Pengingat: Order Hari Ini",
          message: `${todayBookings.length} tempahan perlu siap hari ini!`,
          actionUrl: "/bookings",
          metadata: { bookingCount: todayBookings.length }
        });
        notificationCount++;
      }
    }
    console.log(`[CRON] Daily reminders complete. Created ${notificationCount} notifications for ${users2.length} users.`);
    return {
      success: true,
      userCount: users2.length,
      notificationCount
    };
  } catch (error) {
    console.error("[CRON] Daily reminders failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}
function registerCronEndpoints(app2) {
  app2.post("/api/cron/enforce-grace-period", async (req, res) => {
    const cronSecret = req.headers["x-cron-secret"];
    if (!cronSecret || cronSecret !== process.env.CRON_SECRET) {
      console.warn("[CRON] Unauthorized access attempt to enforce-grace-period endpoint");
      return res.status(401).json({ error: "Unauthorized - Invalid or missing cron secret" });
    }
    try {
      const result = await runDailyGracePeriodCheck();
      res.json(result);
    } catch (error) {
      res.status(500).json({
        error: "Failed to run grace period check",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  app2.post("/api/cron/daily-reminders", async (req, res) => {
    const cronSecret = req.headers["x-cron-secret"];
    if (!cronSecret || cronSecret !== process.env.CRON_SECRET) {
      console.warn("[CRON] Unauthorized access attempt to daily-reminders endpoint");
      return res.status(401).json({ error: "Unauthorized - Invalid or missing cron secret" });
    }
    try {
      const result = await runDailyReminders();
      res.json(result);
    } catch (error) {
      res.status(500).json({
        error: "Failed to run daily reminders",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  app2.get("/api/cron/health", (req, res) => {
    res.json({
      status: "ok",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      jobs: [
        {
          name: "enforce-grace-period",
          schedule: "0 2 * * *",
          description: "Daily check for expired grace periods and archive excess data"
        },
        {
          name: "daily-reminders",
          schedule: "0 9 * * *",
          description: "Send daily reminder notifications for bookings, low stock, etc."
        }
      ]
    });
  });
  app2.post("/api/webhooks/bcl", processBCLWebhook);
  app2.post("/api/webhooks/bcl/test", testBCLWebhook);
}
var init_cron = __esm({
  "server/cron.ts"() {
    init_archiving();
    init_bcl_webhook();
    init_storage();
    init_db();
    init_schema();
  }
});

// server/index.ts
init_redis();
import dotenv2 from "dotenv";
import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";
import express from "express";
import helmet from "helmet";
import session from "express-session";
import { RedisStore } from "connect-redis";
import ConnectPgSimple from "connect-pg-simple";
import { Pool as Pool2 } from "pg";

// server/routes.ts
init_storage();
init_db();
import { createServer } from "http";
import rateLimit from "express-rate-limit";

// server/cache.ts
init_redis();

// server/log.ts
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit"
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

// server/cache.ts
var memoryCache = /* @__PURE__ */ new Map();
var CACHE_TTL = {
  SHORT: 60,
  // 1 minute - frequently changing data
  MEDIUM: 300,
  // 5 minutes - moderately changing data
  LONG: 1800,
  // 30 minutes - rarely changing data
  VERY_LONG: 3600
  // 1 hour - static data
};
var CACHE_KEYS = {
  PRODUCTS: "products",
  PRODUCTS_LIST: "products:list",
  PRODUCT: (id) => `product:${id}`,
  DASHBOARD_STATS: "dashboard:stats",
  DASHBOARD_WIDGETS: (userId) => `dashboard:widgets:${userId}`,
  SALES_TODAY: (userId) => `sales:today:${userId}`,
  LOW_STOCK: (userId) => `stock:low:${userId}`,
  VENDORS: "vendors:list",
  VENDOR: (id) => `vendor:${id}`,
  RESELLERS: "resellers:list",
  CUSTOMERS: "customers:list"
};
async function get(key) {
  try {
    if (redis) {
      const value = await redis.get(key);
      if (value) {
        log(`[Cache] HIT (Redis): ${key}`);
        return JSON.parse(value);
      }
    }
    const cached2 = memoryCache.get(key);
    if (cached2) {
      if (Date.now() < cached2.expiresAt) {
        log(`[Cache] HIT (Memory): ${key}`);
        return cached2.value;
      } else {
        memoryCache.delete(key);
      }
    }
    log(`[Cache] MISS: ${key}`);
    return null;
  } catch (error) {
    log(`[Cache] ERROR getting ${key}: ${error}`);
    return null;
  }
}
async function set(key, value, ttl = CACHE_TTL.MEDIUM) {
  try {
    const serialized = JSON.stringify(value);
    if (redis) {
      await redis.setEx(key, ttl, serialized);
      log(`[Cache] SET (Redis): ${key} (TTL: ${ttl}s)`);
    }
    memoryCache.set(key, {
      value,
      expiresAt: Date.now() + ttl * 1e3
    });
    log(`[Cache] SET (Memory): ${key} (TTL: ${ttl}s)`);
  } catch (error) {
    log(`[Cache] ERROR setting ${key}: ${error}`);
  }
}
async function del(pattern) {
  try {
    if (redis) {
      if (pattern.includes("*")) {
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
          await redis.del(...keys);
          log(`[Cache] DEL (Redis): ${keys.length} keys matching ${pattern}`);
        }
      } else {
        await redis.del(pattern);
        log(`[Cache] DEL (Redis): ${pattern}`);
      }
    }
    if (pattern.includes("*")) {
      const prefix = pattern.replace("*", "");
      const keysToDelete = Array.from(memoryCache.keys()).filter((k) => k.startsWith(prefix));
      keysToDelete.forEach((k) => memoryCache.delete(k));
      log(`[Cache] DEL (Memory): ${keysToDelete.length} keys matching ${pattern}`);
    } else {
      memoryCache.delete(pattern);
      log(`[Cache] DEL (Memory): ${pattern}`);
    }
  } catch (error) {
    log(`[Cache] ERROR deleting ${pattern}: ${error}`);
  }
}
async function exists(key) {
  try {
    if (redis) {
      const exists2 = await redis.exists(key);
      return exists2 === 1;
    }
    const cached2 = memoryCache.get(key);
    if (cached2 && Date.now() < cached2.expiresAt) {
      return true;
    }
    return false;
  } catch (error) {
    log(`[Cache] ERROR checking ${key}: ${error}`);
    return false;
  }
}
async function clearAll() {
  try {
    if (redis) {
      await redis.flushdb();
      log("[Cache] CLEARED all Redis cache");
    }
    memoryCache.clear();
    log("[Cache] CLEARED all memory cache");
  } catch (error) {
    log(`[Cache] ERROR clearing all: ${error}`);
  }
}
function getStats() {
  return {
    memoryKeys: memoryCache.size,
    redisAvailable: !!redis
  };
}
function cached(key, fn, ttl = CACHE_TTL.MEDIUM) {
  return async () => {
    const cached2 = await get(key);
    if (cached2 !== null) {
      return cached2;
    }
    const result = await fn();
    await set(key, result, ttl);
    return result;
  };
}
var cache = {
  get,
  set,
  del,
  exists,
  clearAll,
  getStats,
  cached,
  TTL: CACHE_TTL,
  KEYS: CACHE_KEYS
};

// server/routes.ts
init_bcl_webhook();
init_feature_gating();
init_schema();
init_schema();
import { eq as eq5, sql as sql5 } from "drizzle-orm";
import { z } from "zod";
import bcrypt from "bcryptjs";

// server/google-drive.ts
import { google } from "googleapis";
var connectionSettings;
async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY ? "repl " + process.env.REPL_IDENTITY : process.env.WEB_REPL_RENEWAL ? "depl " + process.env.WEB_REPL_RENEWAL : null;
  if (!xReplitToken) {
    throw new Error("X_REPLIT_TOKEN not found for repl/depl");
  }
  connectionSettings = await fetch(
    "https://" + hostname + "/api/v2/connection?include_secrets=true&connector_names=google-drive",
    {
      headers: {
        "Accept": "application/json",
        "X_REPLIT_TOKEN": xReplitToken
      }
    }
  ).then((res) => res.json()).then((data) => data.items?.[0]);
  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;
  if (!connectionSettings || !accessToken) {
    throw new Error("Google Drive not connected");
  }
  return accessToken;
}
async function getUncachableGoogleDriveClient() {
  const accessToken = await getAccessToken();
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: accessToken
  });
  return google.drive({ version: "v3", auth: oauth2Client });
}
async function getOrCreateManisBizzFolder() {
  const drive = await getUncachableGoogleDriveClient();
  const response = await drive.files.list({
    q: "name='ManisBizz' and mimeType='application/vnd.google-apps.folder' and trashed=false",
    fields: "files(id, name)",
    spaces: "drive"
  });
  if (response.data.files && response.data.files.length > 0) {
    return response.data.files[0].id;
  }
  const folderMetadata = {
    name: "ManisBizz",
    mimeType: "application/vnd.google-apps.folder"
  };
  const folder = await drive.files.create({
    requestBody: folderMetadata,
    fields: "id"
  });
  return folder.data.id;
}
async function uploadPDFToGoogleDrive(pdfBuffer, fileName, mimeType = "application/pdf") {
  const drive = await getUncachableGoogleDriveClient();
  const folderId = await getOrCreateManisBizzFolder();
  const fileMetadata = {
    name: fileName,
    parents: [folderId]
  };
  const media = {
    mimeType,
    body: __require("stream").Readable.from(pdfBuffer)
  };
  const file = await drive.files.create({
    requestBody: fileMetadata,
    media,
    fields: "id, name, webViewLink"
  });
  return {
    id: file.data.id,
    webViewLink: file.data.webViewLink,
    name: file.data.name
  };
}
async function listManisBizzFiles() {
  const drive = await getUncachableGoogleDriveClient();
  const folderId = await getOrCreateManisBizzFolder();
  const response = await drive.files.list({
    q: `'${folderId}' in parents and trashed=false`,
    fields: "files(id, name, createdTime, webViewLink, size)",
    orderBy: "createdTime desc",
    pageSize: 100
  });
  return response.data.files || [];
}

// server/routes.ts
var authLimiter = rateLimit({
  windowMs: 15 * 60 * 1e3,
  // 15 minutes
  max: 5,
  // Limit each IP to 5 login attempts per 15 minutes
  message: "Too many login attempts from this IP, please try again after 15 minutes",
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true
  // Don't count successful logins
});
var passwordSchema = z.string().min(8, "Password must be at least 8 characters").regex(/[A-Z]/, "Password must contain at least one uppercase letter").regex(/[a-z]/, "Password must contain at least one lowercase letter").regex(/[0-9]/, "Password must contain at least one number").regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");
async function loadUser(req, res, next) {
  try {
    if (req.session.userId) {
      const user = await storage.getUserById(req.session.userId);
      if (user) {
        if (user.isOnTrial && user.trialEndsAt && new Date(user.trialEndsAt) < /* @__PURE__ */ new Date()) {
          await storage.updateUser(user.id, { isOnTrial: 0 });
          user.isOnTrial = 0;
        }
        const subscriptions = await storage.getUserSubscriptions(user.id);
        const now = /* @__PURE__ */ new Date();
        for (const sub of subscriptions) {
          if (sub.status === "active" && sub.subscriptionEndsAt && new Date(sub.subscriptionEndsAt) < now) {
            await storage.updateUserSubscription(sub.id, { status: "expired" });
          }
        }
        req.user = user;
      } else {
        req.session.destroy(() => {
        });
      }
    }
  } catch (error) {
    console.error("[Auth] loadUser error:", error);
  }
  next();
}
function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized - please login" });
  }
  next();
}
function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized - please login" });
  }
  if (!req.user.isAdmin) {
    return res.status(403).json({ message: "Forbidden - admin access required" });
  }
  next();
}
async function getUserActiveSubscription(userId) {
  const subscriptions = await storage.getUserSubscriptions(userId);
  const now = /* @__PURE__ */ new Date();
  const activeSub = subscriptions.find(
    (sub) => sub.status === "active" && sub.subscriptionEndsAt && new Date(sub.subscriptionEndsAt) > now
  );
  return activeSub;
}
function isTrialExpired(user) {
  if (!user.trialEndsAt) return false;
  const now = /* @__PURE__ */ new Date();
  return new Date(user.trialEndsAt) < now;
}
async function blockExpiredTrial(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized - please login" });
  }
  if (isTrialExpired(req.user)) {
    await storage.updateUser(req.user.id, {
      isOnTrial: 0
    });
    req.user.isOnTrial = 0;
    return res.status(403).json({
      message: "Your trial has expired. Please upgrade to continue using PocketBizz.",
      trialExpired: true
    });
  }
  next();
}
async function requirePaidSubscription(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized - please login" });
  }
  if (req.user.isOnTrial) {
    return res.status(403).json({
      message: "This feature requires a paid subscription. Upgrade to unlock.",
      requiresUpgrade: true
    });
  }
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
async function requireProPlan(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized - please login" });
  }
  if (req.user.isOnTrial) {
    return res.status(403).json({
      message: "This premium feature requires a Pro or Premium plan. Upgrade to unlock.",
      requiresUpgrade: true,
      requiredPlan: "pro"
    });
  }
  const activeSub = await getUserActiveSubscription(req.user.id);
  if (!activeSub) {
    return res.status(403).json({
      message: "Your subscription has expired. Please renew to access premium features.",
      requiresUpgrade: true,
      subscriptionExpired: true
    });
  }
  const plan = await storage.getSubscriptionPlanById(activeSub.planId);
  if (!plan || plan.name !== "pro" && plan.name !== "premium") {
    return res.status(403).json({
      message: "This premium feature is only available on Pro and Premium plans. Upgrade to unlock.",
      requiresUpgrade: true,
      currentPlan: plan?.name || "unknown",
      requiredPlan: "pro"
    });
  }
  next();
}
async function registerRoutes(app2) {
  app2.post("/api/webhooks/bcl", processBCLWebhook);
  if (process.env.NODE_ENV !== "production") {
    app2.post("/api/webhooks/bcl/test", testBCLWebhook);
    if (process.env.NODE_ENV !== "production") {
      app2.post("/api/webhooks/bcl/test-signed", testBCLWebhookSigned);
    }
  }
  app2.use(loadUser);
  if (process.env.NODE_ENV !== "production") {
    app2.get("/api/test/sentry-error", (_req, _res) => {
      throw new Error("Sentry test error - this is intentional!");
    });
  }
  app2.post("/api/auth/register", authLimiter, async (req, res) => {
    try {
      const registerSchema = insertUserSchema.omit({
        isAdmin: true,
        toyyibpayUserCode: true
      });
      const body = registerSchema.parse(req.body);
      try {
        passwordSchema.parse(body.password);
      } catch (error) {
        return res.status(400).json({
          message: "Password does not meet security requirements",
          errors: error.errors.map((e) => e.message)
        });
      }
      const existingUser = await storage.getUserByEmail(body.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }
      const hashedPassword = await bcrypt.hash(body.password, 12);
      const trialEndsAt = /* @__PURE__ */ new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 7);
      const user = await storage.createUser({
        ...body,
        password: hashedPassword,
        isAdmin: 0,
        // Explicitly prevent privilege escalation
        isOnTrial: 1,
        // Auto-activate 7-day trial
        trialEndsAt,
        // No grace period; strict 7-day trial
        toyyibpayUserCode: null
      });
      req.session.userId = user.id;
      const { password, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      res.status(400).json({ message: error.message || "Registration failed" });
    }
  });
  app2.post("/api/auth/login", authLimiter, async (req, res) => {
    try {
      const loginSchema = z.object({
        email: z.string().email(),
        password: z.string().min(1)
      });
      const { email, password } = loginSchema.parse(req.body);
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      const oldSessionData = req.session;
      req.session.regenerate((err) => {
        if (err) {
          console.error("Session regeneration error:", err);
          return res.status(500).json({ message: "Login failed. Please try again." });
        }
        Object.assign(req.session, oldSessionData);
        req.session.userId = user.id;
        req.session.save((saveErr) => {
          if (saveErr) {
            console.error("Session save error:", saveErr);
            return res.status(500).json({ message: "Login failed. Please try again." });
          }
          const { password: _, ...userWithoutPassword } = user;
          res.json({ user: userWithoutPassword });
        });
      });
    } catch (error) {
      res.status(400).json({ message: error.message || "Login failed" });
    }
  });
  app2.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });
  app2.post("/api/auth/forgot-password", authLimiter, async (req, res) => {
    try {
      const { email } = z.object({ email: z.string().email() }).parse(req.body);
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.json({ message: "If that email exists, we've sent a reset link" });
      }
      const crypto2 = await import("crypto");
      const resetToken = crypto2.randomBytes(32).toString("hex");
      const hashedToken = await bcrypt.hash(resetToken, 10);
      const expiresAt = /* @__PURE__ */ new Date();
      expiresAt.setHours(expiresAt.getHours() + 1);
      await db.insert(passwordResetTokens).values({
        userId: user.id,
        token: hashedToken,
        expiresAt
      });
      try {
        const { getUncachableResendClient: getUncachableResendClient2 } = await Promise.resolve().then(() => (init_resend_client(), resend_client_exports));
        const client = await getUncachableResendClient2();
        const resetUrl = `${process.env.APP_URL || "http://localhost:5000"}/auth/reset-password?token=${resetToken}`;
        const fromEmail = process.env.NODE_ENV === "production" ? "PocketBizz <noreply@pocketbizz.my>" : "PocketBizz <onboarding@resend.dev>";
        console.log("Sending reset email to:", email, "from:", fromEmail);
        const result = await client.emails.send({
          from: fromEmail,
          to: email,
          subject: "Reset Password - PocketBizz",
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
        console.log("Email sent successfully:", result);
      } catch (emailError) {
        console.error("Failed to send reset email:", emailError);
        return res.status(500).json({ message: "Failed to send reset email. Please try again later." });
      }
      res.json({ message: "If that email exists, we've sent a reset link" });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(400).json({ message: error.message || "Failed to process request" });
    }
  });
  app2.post("/api/auth/reset-password", authLimiter, async (req, res) => {
    try {
      const { token, password } = z.object({
        token: z.string(),
        password: z.string().min(6)
      }).parse(req.body);
      const allTokens = await db.select().from(passwordResetTokens).where(sql5`${passwordResetTokens.expiresAt} > NOW()`);
      let validToken = null;
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
      const hashedPassword = await bcrypt.hash(password, 10);
      await db.update(users).set({
        password: hashedPassword,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq5(users.id, validToken.userId));
      await db.delete(passwordResetTokens).where(eq5(passwordResetTokens.id, validToken.id));
      await db.delete(passwordResetTokens).where(eq5(passwordResetTokens.userId, validToken.userId));
      res.json({ message: "Password reset successfully" });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(400).json({ message: error.message || "Failed to reset password" });
    }
  });
  app2.get("/api/auth/me", (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    req.session.touch();
    const { password, ...userWithoutPassword } = req.user;
    res.json({ user: userWithoutPassword });
  });
  app2.get("/api/auth/session-check", (req, res) => {
    const hasSession = !!req.session.userId;
    const hasUser = !!req.user;
    res.json({
      authenticated: hasUser,
      sessionId: hasSession ? req.sessionID : null,
      userId: req.session.userId || null
    });
  });
  app2.get("/api/auth/early-bird-status", requireAuth, async (req, res) => {
    try {
      const user = req.user;
      const earlyBirdSlot = await db.query.earlyBirdTracking.findFirst({
        where: (tracking, { eq: eq6 }) => eq6(tracking.userId, user.id)
      });
      res.json({
        hasSlot: !!earlyBirdSlot,
        slotNumber: earlyBirdSlot?.slotNumber || null,
        hasSubscribed: earlyBirdSlot?.hasSubscribed === 1
      });
    } catch (error) {
      console.error("Early bird status error:", error);
      res.status(500).json({ message: "Failed to get early bird status" });
    }
  });
  app2.get("/api/user/trial-impact", requireAuth, async (req, res) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const trialStartDate = new Date(user.createdAt);
      const now = /* @__PURE__ */ new Date();
      const daysUsed = Math.floor((now.getTime() - trialStartDate.getTime()) / (1e3 * 60 * 60 * 24));
      const daysRemaining = user.trialEndsAt ? Math.max(0, Math.floor((new Date(user.trialEndsAt).getTime() - now.getTime()) / (1e3 * 60 * 60 * 24))) : 0;
      const salesData = await db.query.sales.findMany({
        where: (sales2, { eq: eq6 }) => eq6(sales2.userId, user.id)
      });
      const totalSales = salesData.reduce((sum, sale) => sum + parseFloat(sale.totalAmount), 0);
      const salesCount = salesData.length;
      const productsData = await db.query.products.findMany({
        where: (products2, { eq: eq6 }) => eq6(products2.userId, user.id)
      });
      const productsCount = productsData.length;
      const customersData = await db.query.customers.findMany({
        where: (customers2, { eq: eq6 }) => eq6(customers2.userId, user.id)
      });
      const customersCount = customersData.length;
      const stockMovements2 = await db.query.stockMovements.findMany({
        where: (movements, { eq: eq6 }) => eq6(movements.userId, user.id)
      });
      const stockMovementsCount = stockMovements2.length;
      const timeSavedMinutes = salesCount * 2 + productsCount * 5 + customersCount * 3;
      const timeSavedHours = Math.round(timeSavedMinutes / 60 * 10) / 10;
      const wastePreventionEstimate = Math.round(stockMovementsCount * 0.05 * 30);
      const avgDailySales = daysUsed > 0 ? totalSales / daysUsed : 0;
      const projectedMonthlySales = Math.round(avgDailySales * 30);
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
          projectedMonthlySales
        }
      });
    } catch (error) {
      console.error("Trial impact stats error:", error);
      res.status(500).json({ message: "Failed to get trial impact stats" });
    }
  });
  app2.get("/api/subscription-plans", async (_req, res) => {
    try {
      const plans = await storage.getSubscriptionPlans();
      if (!plans || plans.length === 0) {
        return res.json([]);
      }
      const p = plans[0];
      const singlePlan = [{
        // Use real DB id for consistency with billing endpoints
        id: p.id,
        name: p.name,
        displayName: "PocketBizz Plan",
        description: "RM27/bulan (RM0.90 sehari). Trial 7 hari. Diskaun: 3% (3 bulan), 10% (6 bulan), 20% (12 bulan). Jumlah dibundarkan tanpa sen.",
        monthlyPrice: "27.00",
        annualPrice: null,
        currency: "MYR",
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
        discount6Months: "10.00",
        discount12Months: "20.00",
        isActive: 1,
        sortOrder: 0,
        createdAt: p.createdAt || /* @__PURE__ */ new Date()
      }];
      res.json(singlePlan);
    } catch (error) {
      res.status(500).json({ message: error.message || "Failed to fetch plans" });
    }
  });
  app2.get("/api/subscription-plans/:id", async (req, res) => {
    try {
      const plan = await storage.getSubscriptionPlan(req.params.id);
      if (!plan) {
        return res.status(404).json({ message: "Plan not found" });
      }
      res.json(plan);
    } catch (error) {
      res.status(500).json({ message: error.message || "Failed to fetch plan" });
    }
  });
  app2.post("/api/subscription-plans", requireAuth, async (req, res) => {
    try {
      if (req.user?.isAdmin !== 1) {
        return res.status(403).json({ message: "Forbidden - admin access required" });
      }
      const body = insertSubscriptionPlanSchema.parse(req.body);
      const plan = await storage.createSubscriptionPlan(body);
      res.json(plan);
    } catch (error) {
      res.status(400).json({ message: error.message || "Failed to create plan" });
    }
  });
  app2.patch("/api/subscription-plans/:id", requireAuth, async (req, res) => {
    try {
      if (req.user?.isAdmin !== 1) {
        return res.status(403).json({ message: "Forbidden - admin access required" });
      }
      const updateSchema = insertSubscriptionPlanSchema.partial();
      const body = updateSchema.parse(req.body);
      const plan = await storage.updateSubscriptionPlan(req.params.id, body);
      if (!plan) {
        return res.status(404).json({ message: "Plan not found" });
      }
      res.json(plan);
    } catch (error) {
      res.status(400).json({ message: error.message || "Failed to update plan" });
    }
  });
  app2.delete("/api/subscription-plans/:id", requireAuth, async (req, res) => {
    try {
      if (req.user?.isAdmin !== 1) {
        return res.status(403).json({ message: "Forbidden - admin access required" });
      }
      const plan = await storage.getSubscriptionPlan(req.params.id);
      if (!plan) {
        return res.status(404).json({ message: "Plan not found" });
      }
      await storage.deleteSubscriptionPlan(req.params.id);
      res.json({ message: "Plan deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: error.message || "Failed to delete plan" });
    }
  });
  app2.get("/api/early-bird/stats", async (req, res) => {
    try {
      const result = await db.select({ count: sql5`count(*)` }).from(earlyBirdTracking);
      const slotsUsed = Number(result[0]?.count || 0);
      const slotsRemaining = Math.max(0, 100 - slotsUsed);
      const isAvailable = slotsRemaining > 0;
      res.json({
        slotsUsed,
        slotsRemaining,
        totalSlots: 100,
        isAvailable,
        discountPercent: 70
      });
    } catch (error) {
      res.status(500).json({ message: error.message || "Failed to fetch early bird stats" });
    }
  });
  app2.post("/api/subscription/create-bill", requireAuth, async (req, res) => {
    try {
      console.log("[CREATE-BILL] Request body:", JSON.stringify(req.body));
      const schema = z.object({
        planId: z.string(),
        durationMonths: z.number().refine((val) => [1, 3, 6, 12].includes(val), {
          message: "Duration must be 1, 3, 6, or 12 months"
        }),
        promoCode: z.string().optional()
      });
      const { planId, durationMonths, promoCode } = schema.parse(req.body);
      console.log("[CREATE-BILL] Parsed data - planId:", planId, "duration:", durationMonths);
      console.log("[CREATE-BILL] Fetching plan with ID:", planId);
      const plan = await storage.getSubscriptionPlanById(planId);
      if (!plan) {
        console.log("[CREATE-BILL] Plan not found for ID:", planId);
        return res.status(404).json({ message: "Subscription plan not found" });
      }
      console.log("[CREATE-BILL] Plan found:", plan.displayName);
      const monthlyPrice = 27;
      let totalPrice = monthlyPrice * durationMonths;
      if (durationMonths === 3) {
        totalPrice = totalPrice * (1 - 3 / 100);
      } else if (durationMonths === 6) {
        totalPrice = totalPrice * (1 - 10 / 100);
      } else if (durationMonths === 12) {
        totalPrice = totalPrice * (1 - 20 / 100);
      }
      let hasEarlyBird = false;
      try {
        const earlyBirdSlot = await db.query.earlyBirdTracking.findFirst({
          where: (tracking, { eq: eq6 }) => eq6(tracking.userId, req.user.id)
        });
        if (earlyBirdSlot && !earlyBirdSlot.hasSubscribed) {
          totalPrice = totalPrice * (1 - 70 / 100);
          hasEarlyBird = true;
        }
      } catch (earlyBirdError) {
        console.error("Error checking early bird status:", earlyBirdError);
      }
      let appliedPromo = null;
      if (promoCode) {
        const promo = await storage.getPromoCodeByCode(promoCode);
        if (promo && promo.isActive) {
          const hasUsed = await storage.hasUserUsedPromoCode(req.user.id, promo.id);
          if (!hasUsed) {
            const usageCount = await storage.getPromoCodeUsageCount(promo.id);
            if (usageCount < (promo.maxUses || Infinity)) {
              if (!promo.expiresAt || new Date(promo.expiresAt) > /* @__PURE__ */ new Date()) {
                if (promo.discountType === "percentage") {
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
      totalPrice = Math.max(totalPrice, 1);
      totalPrice = Math.round(totalPrice);
      const user = req.user;
      const orderRef = `SUB-${user.id.slice(0, 8)}-${Date.now()}`;
      const { createBill: createBill2, getBillUrl: getBillUrl2, rmToCents: rmToCents2 } = await Promise.resolve().then(() => (init_toyyibpay(), toyyibpay_exports));
      const baseUrl = process.env.PUBLIC_URL || "https://app.pocketbizz.my";
      console.log("[CREATE-BILL] Using callback base URL:", baseUrl);
      const billParams = {
        billName: `${plan.displayName} - ${durationMonths} months`,
        billDescription: `PocketBizz ${plan.displayName} subscription for ${durationMonths} months`,
        billAmount: rmToCents2(totalPrice),
        billTo: user.name,
        billEmail: user.email,
        billPhone: user.phone || "0000000000",
        billExternalReferenceNo: orderRef,
        billReturnUrl: `${baseUrl}/payment/callback`,
        billCallbackUrl: `${baseUrl}/api/subscription/webhook`,
        billExpiryDays: 7
        // Bill expires in 7 days
      };
      const billResponse = await createBill2(billParams);
      if (!billResponse.BillCode) {
        return res.status(500).json({ message: "Failed to create payment bill" });
      }
      const discountAmount = monthlyPrice * durationMonths - totalPrice;
      const expiryDate = /* @__PURE__ */ new Date();
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
        expiresAt: expiryDate
      });
      res.json({
        billCode: billResponse.BillCode,
        billUrl: getBillUrl2(billResponse.BillCode),
        orderRef,
        totalAmount: totalPrice,
        planName: plan.displayName,
        durationMonths,
        hasEarlyBird,
        earlyBirdDiscount: hasEarlyBird ? 70 : 0,
        promoApplied: appliedPromo ? {
          code: appliedPromo.code,
          discountType: appliedPromo.discountType,
          discountValue: appliedPromo.discountValue
        } : null
      });
    } catch (error) {
      console.error("[CREATE-BILL] Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name,
        issues: error.issues
        // Zod validation errors
      });
      res.status(400).json({ message: error.message || "Failed to create payment bill" });
    }
  });
  app2.post("/api/subscription/renew", requireAuth, async (req, res) => {
    try {
      const schema = z.object({
        subscriptionId: z.string().optional(),
        // If not provided, use active subscription
        durationMonths: z.number().refine((val) => [1, 3, 6, 12].includes(val), {
          message: "Duration must be 1, 3, 6, or 12 months"
        }),
        promoCode: z.string().optional()
      });
      const { subscriptionId, durationMonths, promoCode } = schema.parse(req.body);
      const user = req.user;
      let subscriptionToRenew;
      if (subscriptionId) {
        subscriptionToRenew = await storage.getUserSubscriptionById(subscriptionId);
        if (!subscriptionToRenew || subscriptionToRenew.userId !== user.id) {
          return res.status(404).json({ message: "Subscription not found" });
        }
      } else {
        subscriptionToRenew = await getUserActiveSubscription(user.id);
        if (!subscriptionToRenew) {
          const allSubscriptions = await storage.getUserSubscriptions(user.id);
          if (allSubscriptions.length > 0) {
            subscriptionToRenew = allSubscriptions[allSubscriptions.length - 1];
          }
        }
        if (!subscriptionToRenew) {
          return res.status(404).json({ message: "No subscription found to renew" });
        }
      }
      const plan = await storage.getSubscriptionPlanById(subscriptionToRenew.planId);
      if (!plan) {
        return res.status(404).json({ message: "Subscription plan not found" });
      }
      const monthlyPrice = 27;
      let totalPrice = monthlyPrice * durationMonths;
      if (durationMonths === 3) {
        totalPrice = totalPrice * (1 - 3 / 100);
      } else if (durationMonths === 6) {
        totalPrice = totalPrice * (1 - 10 / 100);
      } else if (durationMonths === 12) {
        totalPrice = totalPrice * (1 - 20 / 100);
      }
      let hasEarlyBird = false;
      try {
        const earlyBirdSlot = await db.query.earlyBirdTracking.findFirst({
          where: (tracking, { eq: eq6 }) => eq6(tracking.userId, req.user.id)
        });
        if (earlyBirdSlot && !earlyBirdSlot.hasSubscribed) {
          totalPrice = totalPrice * (1 - 70 / 100);
          hasEarlyBird = true;
        }
      } catch (earlyBirdError) {
        console.error("Error checking early bird status:", earlyBirdError);
      }
      let appliedPromo = null;
      if (promoCode) {
        const promo = await storage.getPromoCodeByCode(promoCode);
        if (promo && promo.isActive) {
          const hasUsed = await storage.hasUserUsedPromoCode(req.user.id, promo.id);
          if (!hasUsed) {
            const usageCount = await storage.getPromoCodeUsageCount(promo.id);
            if (usageCount < (promo.maxUses || Infinity)) {
              if (!promo.expiresAt || new Date(promo.expiresAt) > /* @__PURE__ */ new Date()) {
                if (promo.discountType === "percentage") {
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
      totalPrice = Math.max(totalPrice, 1);
      totalPrice = Math.round(totalPrice);
      const orderRef = `REN-${user.id.slice(0, 8)}-${Date.now()}`;
      const { createBill: createBill2, getBillUrl: getBillUrl2, rmToCents: rmToCents2 } = await Promise.resolve().then(() => (init_toyyibpay(), toyyibpay_exports));
      const baseUrl = process.env.PUBLIC_URL || "https://app.pocketbizz.my";
      console.log("[RENEW-BILL] Using callback base URL:", baseUrl);
      const billParams = {
        billName: `${plan.displayName} Renewal - ${durationMonths} months`,
        billDescription: `PocketBizz ${plan.displayName} subscription renewal for ${durationMonths} months`,
        billAmount: rmToCents2(totalPrice),
        billTo: user.name,
        billEmail: user.email,
        billPhone: user.phone || "0000000000",
        billExternalReferenceNo: orderRef,
        billReturnUrl: `${baseUrl}/payment/callback`,
        billCallbackUrl: `${baseUrl}/api/subscription/webhook`,
        billExpiryDays: 7
      };
      const billResponse = await createBill2(billParams);
      if (!billResponse.BillCode) {
        return res.status(500).json({ message: "Failed to create renewal bill" });
      }
      const discountAmount = monthlyPrice * durationMonths - totalPrice;
      const expiryDate = /* @__PURE__ */ new Date();
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
        renewalSubscriptionId: subscriptionToRenew.id
      });
      res.json({
        billCode: billResponse.BillCode,
        billUrl: getBillUrl2(billResponse.BillCode),
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
          discountValue: appliedPromo.discountValue
        } : null
      });
    } catch (error) {
      console.error("Create renewal bill error:", error);
      res.status(400).json({ message: error.message || "Failed to create renewal bill" });
    }
  });
  app2.get("/api/subscription/early-bird-slots", async (req, res) => {
    try {
      const totalSlots = 100;
      const usedSlots = await storage.getEarlyBirdUsedSlots();
      const remaining = Math.max(0, totalSlots - usedSlots);
      res.json({
        total: totalSlots,
        used: usedSlots,
        remaining
      });
    } catch (error) {
      console.error("Early bird slots error:", error);
      res.status(500).json({ message: "Failed to get early bird slots" });
    }
  });
  app2.post("/api/promo-codes/validate", requireAuth, async (req, res) => {
    try {
      const schema = z.object({
        code: z.string()
      });
      const { code } = schema.parse(req.body);
      const userId = req.user.id;
      const promo = await storage.getPromoCodeByCode(code);
      if (!promo) {
        return res.status(404).json({
          valid: false,
          message: "Kod promo tidak wujud"
        });
      }
      if (!promo.isActive) {
        return res.status(400).json({
          valid: false,
          message: "Kod promo tidak aktif"
        });
      }
      if (promo.expiresAt && new Date(promo.expiresAt) < /* @__PURE__ */ new Date()) {
        return res.status(400).json({
          valid: false,
          message: "Kod promo telah tamat tempoh"
        });
      }
      const usageCount = await storage.getPromoCodeUsageCount(promo.id);
      if (promo.maxUses && usageCount >= promo.maxUses) {
        return res.status(400).json({
          valid: false,
          message: "Kod promo telah mencapai had penggunaan"
        });
      }
      const hasUsed = await storage.hasUserUsedPromoCode(userId, promo.id);
      if (hasUsed) {
        return res.status(400).json({
          valid: false,
          message: "Anda telah menggunakan kod promo ini"
        });
      }
      res.json({
        valid: true,
        promo: {
          id: promo.id,
          code: promo.code,
          name: promo.name,
          discountType: promo.discountType,
          discountValue: promo.discountValue
        }
      });
    } catch (error) {
      console.error("Promo validation error:", error);
      res.status(500).json({ message: error.message || "Failed to validate promo code" });
    }
  });
  app2.get("/api/subscription/webhook", async (req, res) => {
    try {
      const { refno, status, billcode, order_id, amount, reason } = req.query;
      console.log("ToyyibPay webhook received:", {
        refno,
        status,
        billcode,
        order_id,
        amount,
        reason
      });
      if (!billcode || !status) {
        return res.status(400).send("Invalid callback parameters");
      }
      const existingBill = await storage.getPendingBillByBillCode(billcode);
      if (!existingBill) {
        console.error("No pending bill found for billcode:", billcode);
        return res.status(200).send("OK");
      }
      if (existingBill.isProcessed) {
        console.log("Bill already processed:", billcode);
        return res.status(200).send("OK");
      }
      const { getBillTransactions: getBillTransactions2, centsToRm: centsToRm2 } = await Promise.resolve().then(() => (init_toyyibpay(), toyyibpay_exports));
      const transactions = await getBillTransactions2(billcode, status);
      if (transactions.length === 0) {
        console.error("No transactions found for billcode:", billcode);
        return res.status(200).send("OK");
      }
      const transaction = transactions[0];
      if (transaction.billpaymentStatus === "1" && status === "1") {
        const billingRecord = await db.insert(billingHistory).values({
          userId: existingBill.userId,
          amount: existingBill.totalAmount,
          currency: "MYR",
          status: "succeeded",
          toyyibpayBillCode: billcode,
          toyyibpayTransactionId: refno,
          paymentMethod: transaction.billpaymentChannel,
          description: existingBill.isRenewal ? `${existingBill.planName} - ${existingBill.durationMonths} months renewal` : `${existingBill.planName} - ${existingBill.durationMonths} months subscription`,
          paidAt: /* @__PURE__ */ new Date()
        }).returning();
        let subscriptionId;
        if (existingBill.isRenewal && existingBill.renewalSubscriptionId) {
          const existingSubscription = await storage.getUserSubscriptionById(existingBill.renewalSubscriptionId);
          if (existingSubscription) {
            const currentEndDate = new Date(existingSubscription.subscriptionEndsAt || /* @__PURE__ */ new Date());
            const now = /* @__PURE__ */ new Date();
            const extensionStartDate = currentEndDate > now ? currentEndDate : now;
            const newEndDate = new Date(extensionStartDate);
            newEndDate.setMonth(newEndDate.getMonth() + existingBill.durationMonths);
            await storage.updateUserSubscription(existingBill.renewalSubscriptionId, {
              subscriptionEndsAt: newEndDate,
              status: "active",
              totalPaid: (parseFloat(existingSubscription.totalPaid) + parseFloat(existingBill.totalAmount)).toString()
            });
            subscriptionId = existingBill.renewalSubscriptionId;
            console.log("Subscription renewed successfully:", {
              userId: existingBill.userId,
              subscriptionId,
              planName: existingBill.planName,
              durationMonths: existingBill.durationMonths,
              newEndDate,
              amount: existingBill.totalAmount
            });
          }
        } else {
          const startDate = /* @__PURE__ */ new Date();
          const endDate = /* @__PURE__ */ new Date();
          endDate.setMonth(endDate.getMonth() + existingBill.durationMonths);
          const newSubscription = await storage.createUserSubscription({
            userId: existingBill.userId,
            planId: existingBill.planId,
            planName: existingBill.planName,
            status: "active",
            durationMonths: existingBill.durationMonths,
            subscriptionStartsAt: startDate,
            subscriptionEndsAt: endDate,
            totalPaid: existingBill.totalAmount,
            toyyibpayBillCode: billcode,
            paymentMethod: transaction.billpaymentChannel
          });
          subscriptionId = newSubscription.id;
          await storage.updateUser(existingBill.userId, {
            isOnTrial: 0,
            trialEndsAt: null
          });
          if (existingBill.promoCode?.toUpperCase().includes("EARLYBIRD")) {
            await db.update(earlyBirdTracking).set({
              hasSubscribed: 1,
              subscriptionId: newSubscription.id
            }).where(eq5(earlyBirdTracking.userId, existingBill.userId));
          }
          console.log("Subscription activated successfully:", {
            userId: existingBill.userId,
            subscriptionId: newSubscription.id,
            planName: existingBill.planName,
            durationMonths: existingBill.durationMonths,
            amount: existingBill.totalAmount
          });
        }
        if (existingBill.promoCodeId) {
          await storage.incrementPromoCodeUsage(existingBill.promoCodeId);
          await storage.trackPromoCodeUsage(existingBill.userId, existingBill.promoCodeId);
        }
        await storage.markBillAsProcessed(billcode);
      } else {
        await db.insert(billingHistory).values({
          userId: existingBill.userId,
          amount: existingBill.totalAmount,
          currency: "MYR",
          status: "failed",
          toyyibpayBillCode: billcode,
          toyyibpayTransactionId: refno,
          description: `${existingBill.planName} - ${existingBill.durationMonths} months subscription (failed)`
        }).returning();
        console.log("Payment failed:", {
          billcode,
          status,
          reason
        });
      }
      res.status(200).send("OK");
    } catch (error) {
      console.error("Webhook processing error:", error);
      res.status(200).send("OK");
    }
  });
  app2.get("/api/subscription/usage", requireAuth, async (req, res) => {
    try {
      const { checkLimit: checkLimit2 } = await Promise.resolve().then(() => (init_feature_gating(), feature_gating_exports));
      const userId = req.user.id;
      const [products2, vendors2, resellers2, stockItems2] = await Promise.all([
        checkLimit2(userId, "products"),
        checkLimit2(userId, "vendors"),
        checkLimit2(userId, "resellers"),
        checkLimit2(userId, "stock_items")
      ]);
      res.json({
        plan: products2.plan,
        // All will have the same plan
        usage: {
          products: {
            current: products2.current,
            limit: products2.limit,
            percentage: Math.round(products2.current / products2.limit * 100),
            canAdd: products2.allowed
          },
          vendors: {
            current: vendors2.current,
            limit: vendors2.limit,
            percentage: Math.round(vendors2.current / vendors2.limit * 100),
            canAdd: vendors2.allowed
          },
          resellers: {
            current: resellers2.current,
            limit: resellers2.limit,
            percentage: Math.round(resellers2.current / resellers2.limit * 100),
            canAdd: resellers2.allowed
          },
          stockItems: {
            current: stockItems2.current,
            limit: stockItems2.limit,
            percentage: Math.round(stockItems2.current / stockItems2.limit * 100),
            canAdd: stockItems2.allowed
          }
        }
      });
    } catch (error) {
      console.error("Failed to fetch usage stats:", error);
      res.status(500).json({ error: "Failed to fetch usage stats" });
    }
  });
  app2.get("/api/search", async (req, res) => {
    try {
      const query = (req.query.q || "").toLowerCase().trim();
      if (!query || query.length < 2) {
        return res.json({ results: [] });
      }
      const userId = req.user.id;
      const [products2, vendors2, stockItems2, salesResult, deliveriesResult] = await Promise.all([
        storage.getProducts(userId),
        storage.getVendors(userId),
        storage.getStockItems(userId),
        storage.getSales(userId),
        storage.getDeliveries(userId, 1e3, 0)
        // Get all for search (up to 1000)
      ]);
      const sales2 = salesResult.data;
      const deliveries2 = deliveriesResult.data;
      const results = [];
      products2.forEach((product) => {
        if (product.name.toLowerCase().includes(query) || product.category.toLowerCase().includes(query)) {
          results.push({
            id: product.id,
            type: "product",
            title: product.name,
            subtitle: `${product.category} \u2022 RM${product.sellingPrice}`,
            url: "/products",
            icon: "Cake"
          });
        }
      });
      vendors2.forEach((vendor) => {
        if (vendor.name.toLowerCase().includes(query) || vendor.phone && vendor.phone.toLowerCase().includes(query)) {
          results.push({
            id: vendor.id,
            type: "vendor",
            title: vendor.name,
            subtitle: vendor.phone || vendor.address || "",
            url: "/vendors",
            icon: "Store"
          });
        }
      });
      stockItems2.forEach((item) => {
        if (item.name.toLowerCase().includes(query)) {
          results.push({
            id: item.id,
            type: "stock",
            title: item.name,
            subtitle: `${item.currentQuantity} ${item.unit} \u2022 RM${item.purchasePrice}`,
            url: "/stock",
            icon: "Package"
          });
        }
      });
      sales2.forEach((sale) => {
        if (sale.productName.toLowerCase().includes(query) || sale.vendorName && sale.vendorName.toLowerCase().includes(query)) {
          results.push({
            id: sale.id,
            type: "sale",
            title: `Jualan: ${sale.productName}`,
            subtitle: `${sale.vendorName || "Tunai"} \u2022 RM${sale.totalAmount}`,
            url: "/sales",
            icon: "DollarSign"
          });
        }
      });
      deliveries2.forEach((delivery) => {
        if (delivery.vendorName.toLowerCase().includes(query)) {
          results.push({
            id: delivery.id,
            type: "delivery",
            title: `Hantar: ${delivery.vendorName}`,
            subtitle: `RM${delivery.totalAmount} \u2022 ${delivery.status}`,
            url: "/deliveries",
            icon: "Truck"
          });
        }
      });
      res.json({ results: results.slice(0, 20) });
    } catch (error) {
      console.error("Search error:", error);
      res.status(500).json({ error: "Failed to search" });
    }
  });
  app2.get("/api/products", requireAuth, async (req, res) => {
    try {
      const cacheKey = cache.KEYS.PRODUCTS_LIST + `:${req.user.id}`;
      const cached2 = await cache.get(cacheKey);
      if (cached2) {
        return res.json(cached2);
      }
      const products2 = await storage.getProducts(req.user.id);
      await cache.set(cacheKey, products2, cache.TTL.MEDIUM);
      res.json(products2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });
  app2.post("/api/products", requireAuth, blockExpiredTrial, enforceProductLimit, async (req, res) => {
    try {
      const productSchema = insertProductSchema.extend({
        unitsPerBatch: z.string(),
        labourCost: z.string(),
        otherCosts: z.string(),
        packagingCost: z.string(),
        sellingPrice: z.string(),
        recipeItems: z.array(z.object({
          stockItemId: z.string(),
          quantityNeeded: z.string(),
          usageUnit: z.string()
          // Unit used in recipe (e.g., "gram")
        }))
      }).omit({
        materialsCost: true,
        totalCostPerBatch: true,
        costPerUnit: true
      });
      const data = productSchema.parse(req.body);
      const { recipeItems: recipeItems2, ...productData } = data;
      const validation = await storage.validateRecipe(req.user.id, recipeItems2);
      if (!validation.valid) {
        return res.status(400).json({
          error: "Recipe validation failed",
          details: validation.errors.filter((e) => !e.startsWith("Warning:"))
        });
      }
      let materialsCost = 0;
      const recipeItemsWithCost = [];
      const stockItemIds = recipeItems2.map((item) => item.stockItemId);
      const stockItemsData = await storage.getStockItemsByIds(stockItemIds, req.user.id);
      const stockItemsMap = Object.fromEntries(stockItemsData.map((s) => [s.id, s]));
      for (const item of recipeItems2) {
        const stockItem = stockItemsMap[item.stockItemId];
        if (stockItem) {
          const recipeQuantity = parseFloat(item.quantityNeeded) || 0;
          const usageUnit = item.usageUnit || stockItem.unit;
          const from = usageUnit.toLowerCase().trim();
          const to = stockItem.unit.toLowerCase().trim();
          if (from !== to && (!UNIT_CONVERSIONS[from] || !UNIT_CONVERSIONS[from][to])) {
            return res.status(400).json({
              error: `Unit conversion error: Cannot convert from "${usageUnit}" to "${stockItem.unit}" for ingredient "${stockItem.name}". Please use compatible units.`,
              invalidRecipeItem: {
                stockItemName: stockItem.name,
                recipeUnit: usageUnit,
                stockUnit: stockItem.unit
              }
            });
          }
          const convertedQuantity = convertUnit(recipeQuantity, usageUnit, stockItem.unit);
          const packagePrice = parseFloat(stockItem.purchasePrice) || 0;
          const packageSize = parseFloat(stockItem.packageSize) || 1;
          const unitPrice = packagePrice / packageSize;
          const cost = convertedQuantity * unitPrice;
          materialsCost += cost;
          recipeItemsWithCost.push({
            stockItemId: item.stockItemId,
            quantityNeeded: recipeQuantity.toFixed(2),
            usageUnit,
            costPerRecipe: cost.toFixed(2),
            productId: ""
            // Will be set in storage
          });
        }
      }
      const labourCost = parseFloat(productData.labourCost) || 0;
      const otherCosts = parseFloat(productData.otherCosts) || 0;
      const packagingCost = parseFloat(productData.packagingCost) || 0;
      const unitsPerBatch = parseInt(productData.unitsPerBatch) || 1;
      const totalPackagingCost = packagingCost * unitsPerBatch;
      const totalCostPerBatch = materialsCost + labourCost + otherCosts + totalPackagingCost;
      const costPerUnit = unitsPerBatch > 0 ? totalCostPerBatch / unitsPerBatch : 0;
      const product = await storage.createProduct(
        req.user.id,
        {
          ...productData,
          unitsPerBatch,
          labourCost: labourCost.toFixed(2),
          otherCosts: otherCosts.toFixed(2),
          packagingCost: packagingCost.toFixed(2),
          materialsCost: materialsCost.toFixed(2),
          totalCostPerBatch: totalCostPerBatch.toFixed(2),
          costPerUnit: costPerUnit.toFixed(2)
        },
        recipeItemsWithCost
      );
      await cache.del(`${cache.KEYS.PRODUCTS_LIST}:${req.user.id}`);
      await cache.del(`${cache.KEYS.DASHBOARD_STATS}:${req.user.id}`);
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
  app2.put("/api/products/:id", requireAuth, async (req, res) => {
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
          usageUnit: z.string()
          // Unit used in recipe
        }))
      }).omit({
        materialsCost: true,
        totalCostPerBatch: true,
        costPerUnit: true
      }).partial();
      const data = productSchema.parse(req.body);
      const { recipeItems: recipeItems2, ...productData } = data;
      if (recipeItems2 && recipeItems2.length > 0) {
        const validation = await storage.validateRecipe(req.user.id, recipeItems2);
        if (!validation.valid) {
          return res.status(400).json({
            error: "Recipe validation failed",
            details: validation.errors.filter((e) => !e.startsWith("Warning:"))
          });
        }
      }
      let materialsCost = 0;
      let recipeItemsWithCost = [];
      if (recipeItems2 && recipeItems2.length > 0) {
        const stockItemIds = recipeItems2.map((item) => item.stockItemId);
        const stockItemsData = await storage.getStockItemsByIds(stockItemIds, req.user.id);
        const stockItemsMap = Object.fromEntries(stockItemsData.map((s) => [s.id, s]));
        for (const item of recipeItems2) {
          const stockItem = stockItemsMap[item.stockItemId];
          if (stockItem) {
            const recipeQuantity = parseFloat(item.quantityNeeded) || 0;
            const usageUnit = item.usageUnit || stockItem.unit;
            const from = usageUnit.toLowerCase().trim();
            const to = stockItem.unit.toLowerCase().trim();
            if (from !== to && (!UNIT_CONVERSIONS[from] || !UNIT_CONVERSIONS[from][to])) {
              return res.status(400).json({
                error: `Unit conversion error: Cannot convert from "${usageUnit}" to "${stockItem.unit}" for ingredient "${stockItem.name}". Please use compatible units.`,
                invalidRecipeItem: {
                  stockItemName: stockItem.name,
                  recipeUnit: usageUnit,
                  stockUnit: stockItem.unit
                }
              });
            }
            const convertedQuantity = convertUnit(recipeQuantity, usageUnit, stockItem.unit);
            const packagePrice = parseFloat(stockItem.purchasePrice) || 0;
            const packageSize = parseFloat(stockItem.packageSize) || 1;
            const unitPrice = packagePrice / packageSize;
            const cost = convertedQuantity * unitPrice;
            materialsCost += cost;
            recipeItemsWithCost.push({
              stockItemId: item.stockItemId,
              quantityNeeded: recipeQuantity.toFixed(2),
              usageUnit,
              costPerRecipe: cost.toFixed(2),
              productId: id
            });
          }
        }
        const labourCost = parseFloat(productData.labourCost) || 0;
        const otherCosts = parseFloat(productData.otherCosts) || 0;
        const packagingCost = parseFloat(productData.packagingCost) || 0;
        const unitsPerBatch = parseInt(productData.unitsPerBatch) || 1;
        const totalPackagingCost = packagingCost * unitsPerBatch;
        const totalCostPerBatch = materialsCost + labourCost + otherCosts + totalPackagingCost;
        const costPerUnit = unitsPerBatch > 0 ? totalCostPerBatch / unitsPerBatch : 0;
        const updateData = {
          ...productData,
          unitsPerBatch,
          labourCost: labourCost.toFixed(2),
          otherCosts: otherCosts.toFixed(2),
          packagingCost: packagingCost.toFixed(2),
          materialsCost: materialsCost.toFixed(2),
          totalCostPerBatch: totalCostPerBatch.toFixed(2),
          costPerUnit: costPerUnit.toFixed(2)
        };
        const product = await storage.updateProduct(
          req.user.id,
          id,
          updateData,
          recipeItemsWithCost.length > 0 ? recipeItemsWithCost : void 0
        );
        res.json(product);
      } else {
        const updateData = { ...productData };
        if (productData.unitsPerBatch) {
          updateData.unitsPerBatch = parseInt(productData.unitsPerBatch);
        }
        const product = await storage.updateProduct(req.user.id, id, updateData, void 0);
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
  app2.delete("/api/products/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteProduct(req.user.id, id);
      await cache.del(`${cache.KEYS.PRODUCTS_LIST}:${req.user.id}`);
      await cache.del(`${cache.KEYS.DASHBOARD_STATS}:${req.user.id}`);
      res.json({ success: true });
    } catch (error) {
      console.error("Product deletion error:", error);
      res.status(500).json({ error: "Failed to delete product" });
    }
  });
  app2.get("/api/recipe-items/:productId", requireAuth, async (req, res) => {
    try {
      const { productId } = req.params;
      const items = await storage.getRecipeItems(productId);
      res.json(items);
    } catch (error) {
      console.error("Recipe items fetch error:", error);
      res.status(500).json({ error: "Failed to fetch recipe items" });
    }
  });
  app2.get("/api/production", requireAuth, async (req, res) => {
    try {
      const batches = await storage.getProductionBatches(req.user.id);
      const enrichedBatches = await Promise.all(
        batches.map(async (batch) => {
          const product = await storage.getProduct(req.user.id, batch.productId);
          return {
            ...batch,
            unitsPerBatch: product?.unitsPerBatch || 1
          };
        })
      );
      res.json(enrichedBatches);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch production batches" });
    }
  });
  app2.post("/api/production", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const data = insertProductionBatchSchema.parse(req.body);
      const batch = await storage.createProductionBatch(req.user.id, data);
      res.json(batch);
    } catch (error) {
      res.status(400).json({ error: "Invalid batch data" });
    }
  });
  app2.post("/api/production/plan-preview", requireAuth, async (req, res) => {
    try {
      const { productId, quantity } = req.body;
      if (!productId || !quantity) {
        return res.status(400).json({ error: "Product ID and quantity are required" });
      }
      const product = await storage.getProduct(req.user.id, productId);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      const recipeItems2 = await storage.getRecipeItems(productId);
      if (recipeItems2.length === 0) {
        return res.status(400).json({ error: "No recipe found for this product" });
      }
      const materialsNeeded = [];
      let allStockSufficient = true;
      for (const item of recipeItems2) {
        const stockItem = await storage.getStockItem(req.user.id, item.stockItemId);
        if (!stockItem) continue;
        const quantityNeeded = parseFloat(item.quantityNeeded) * quantity;
        const { convertUnit: convertUnit2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
        const convertedQuantity = convertUnit2(
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
          quantityNeeded,
          usageUnit: item.usageUnit,
          currentStock,
          stockUnit: stockItem.unit,
          isSufficient,
          shortage,
          convertedQuantity
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
        // Number of batches
        totalUnits: quantity * product.unitsPerBatch,
        // Total units to be produced
        materialsNeeded,
        allStockSufficient,
        totalProductionCost: parseFloat(product.totalCostPerBatch) * quantity
      });
    } catch (error) {
      console.error("Production plan preview error:", error);
      res.status(500).json({ error: "Failed to generate production plan" });
    }
  });
  app2.post("/api/production/confirm", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const { productId, quantity, batchDate, expiryDate, notes, materialsNeeded } = req.body;
      if (!productId || !quantity || !batchDate) {
        return res.status(400).json({ error: "Product ID, quantity, and batch date are required" });
      }
      const product = await storage.getProduct(req.user.id, productId);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      const recipeItems2 = await storage.getRecipeItems(productId);
      const { convertUnit: convertUnit2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      for (const item of recipeItems2) {
        const stockItem = await storage.getStockItem(req.user.id, item.stockItemId);
        if (!stockItem) {
          return res.status(400).json({ error: `Stock item not found: ${item.stockItemId}` });
        }
        const quantityNeeded = parseFloat(item.quantityNeeded) * quantity;
        const convertedQuantity = convertUnit2(
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
      const totalUnits = quantity * product.unitsPerBatch;
      const batchData = {
        productId,
        productName: product.name,
        quantity: totalUnits,
        // Store total units produced
        remainingQty: totalUnits.toString(),
        // Initialize with full quantity in units
        batchDate,
        expiryDate: expiryDate || null,
        totalCost: (parseFloat(product.totalCostPerBatch) * quantity).toString(),
        notes: notes || null
      };
      const batch = await storage.createProductionBatch(req.user.id, batchData);
      for (const item of recipeItems2) {
        const stockItem = await storage.getStockItem(req.user.id, item.stockItemId);
        if (!stockItem) continue;
        const quantityNeeded = parseFloat(item.quantityNeeded) * quantity;
        const convertedQuantity = convertUnit2(
          quantityNeeded,
          item.usageUnit.toLowerCase(),
          stockItem.unit.toLowerCase()
        );
        const newQuantity = parseFloat(stockItem.currentQuantity) - convertedQuantity;
        await storage.updateStockItem(req.user.id, item.stockItemId, {
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
  app2.get("/api/finished-products", requireAuth, async (req, res) => {
    try {
      const summary = await storage.getFinishedProductsSummary(req.user.id);
      const enrichedSummary = await Promise.all(
        summary.map(async (item) => {
          const product = await storage.getProduct(req.user.id, item.productId);
          return {
            ...item,
            unitsPerBatch: product?.unitsPerBatch || 1
          };
        })
      );
      res.json(enrichedSummary);
    } catch (error) {
      console.error("Finished products summary error:", error);
      res.status(500).json({ error: "Failed to fetch finished products summary" });
    }
  });
  app2.get("/api/finished-products/low", requireAuth, async (req, res) => {
    try {
      const summary = await storage.getFinishedProductsSummary(req.user.id);
      const lowProducts = summary.filter((product) => {
        const totalQty = parseFloat(product.totalQuantity || "0");
        return totalQty > 0 && totalQty < 10;
      });
      res.json(lowProducts);
    } catch (error) {
      console.error("Low finished products error:", error);
      res.status(500).json({ error: "Failed to fetch low finished products" });
    }
  });
  app2.get("/api/finished-products/:productId/batches", requireAuth, async (req, res) => {
    try {
      const { productId } = req.params;
      const batches = await storage.getBatchesByProduct(req.user.id, productId);
      const product = await storage.getProduct(req.user.id, productId);
      const enrichedBatches = batches.map((batch) => ({
        ...batch,
        unitsPerBatch: product?.unitsPerBatch || 1
      }));
      res.json(enrichedBatches);
    } catch (error) {
      console.error("Batches by product error:", error);
      res.status(500).json({ error: "Failed to fetch batches" });
    }
  });
  app2.post("/api/batches/preview", requireAuth, async (req, res) => {
    try {
      const { productId, quantity } = req.body;
      if (!productId || !quantity) {
        return res.status(400).json({ error: "Product ID and quantity are required" });
      }
      const preview = await storage.previewBatchDeduction(req.user.id, productId, parseFloat(quantity));
      res.json(preview);
    } catch (error) {
      console.error("Batch preview error:", error);
      res.status(500).json({ error: "Failed to preview batch deduction" });
    }
  });
  app2.get("/api/vendors", requireAuth, async (req, res) => {
    try {
      const vendors2 = await storage.getVendors(req.user.id);
      res.json(vendors2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch vendors" });
    }
  });
  app2.post("/api/vendors", requireAuth, blockExpiredTrial, enforceVendorLimit, async (req, res) => {
    try {
      const data = insertVendorSchema.parse(req.body);
      const vendor = await storage.createVendor(req.user.id, data);
      res.json(vendor);
    } catch (error) {
      res.status(400).json({ error: "Invalid vendor data" });
    }
  });
  app2.get("/api/suppliers", requireAuth, async (req, res) => {
    try {
      const suppliers2 = await storage.getSuppliers(req.user.id);
      res.json(suppliers2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch suppliers" });
    }
  });
  app2.post("/api/suppliers", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const data = insertSupplierSchema.parse(req.body);
      const supplier = await storage.createSupplier(req.user.id, data);
      res.json(supplier);
    } catch (error) {
      res.status(400).json({ error: "Invalid supplier data" });
    }
  });
  app2.patch("/api/suppliers/:id", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const { id } = req.params;
      const data = insertSupplierSchema.partial().parse(req.body);
      const supplier = await storage.updateSupplier(req.user.id, id, data);
      res.json(supplier);
    } catch (error) {
      res.status(400).json({ error: "Invalid supplier data" });
    }
  });
  app2.delete("/api/suppliers/:id", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteSupplier(req.user.id, id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete supplier" });
    }
  });
  app2.get("/api/vendors/:vendorId/commission", requireAuth, async (req, res) => {
    try {
      const { vendorId } = req.params;
      const commission = await storage.getVendorCommission(req.user.id, vendorId);
      res.json(commission || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch vendor commission" });
    }
  });
  app2.post("/api/vendors/:vendorId/commission", requireAuth, async (req, res) => {
    try {
      const { vendorId } = req.params;
      const commissionSchema = z.object({
        commissionType: z.enum(["fixed_range", "percentage"]),
        percentage: z.string().nullable().optional().transform((val) => {
          if (val === null || val === void 0) return null;
          const num = parseFloat(val);
          if (isNaN(num) || num < 0 || num > 100) {
            throw new Error("Percentage must be between 0 and 100");
          }
          return val;
        }),
        ranges: z.string().nullable().optional().transform((val) => {
          if (val === null || val === void 0) return null;
          try {
            const parsed = JSON.parse(val);
            if (!Array.isArray(parsed)) throw new Error("Ranges must be an array");
            for (const range of parsed) {
              const min = parseFloat(range.min);
              const max = parseFloat(range.max);
              const amount = parseFloat(range.amount);
              if (isNaN(min) || isNaN(max) || isNaN(amount)) {
                throw new Error("Range values must be numeric");
              }
              if (min < 0 || max < 0 || amount < 0) {
                throw new Error("Range values must be non-negative");
              }
              if (min >= max) {
                throw new Error("Range min must be less than max");
              }
            }
            return val;
          } catch (e) {
            throw new Error(`Invalid ranges: ${e.message}`);
          }
        })
      });
      const validatedData = commissionSchema.parse(req.body);
      const data = {
        ...validatedData,
        vendorId
      };
      const commission = await storage.createOrUpdateVendorCommission(req.user.id, data);
      res.json(commission);
    } catch (error) {
      console.error("Commission update error:", error);
      res.status(400).json({ error: "Invalid commission data", message: error.message });
    }
  });
  app2.delete("/api/vendors/:vendorId/commission", requireAuth, async (req, res) => {
    try {
      const { vendorId } = req.params;
      await storage.deleteVendorCommission(req.user.id, vendorId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete commission" });
    }
  });
  app2.get("/api/stock", requireAuth, async (req, res) => {
    try {
      const items = await storage.getStockItems(req.user.id);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stock items" });
    }
  });
  app2.get("/api/stock/low", requireAuth, async (req, res) => {
    try {
      const items = await storage.getLowStockItems(req.user.id);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch low stock items" });
    }
  });
  app2.get("/api/stock/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const item = await storage.getStockItem(req.user.id, id);
      if (!item) {
        return res.status(404).json({ error: "Stock item not found" });
      }
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stock item" });
    }
  });
  app2.post("/api/stock", requireAuth, blockExpiredTrial, enforceStockLimit, async (req, res) => {
    try {
      console.log("\u{1F4E6} POST /api/stock - Request body:", JSON.stringify(req.body, null, 2));
      const data = insertStockItemSchema.parse(req.body);
      console.log("\u2705 Validation passed, creating stock item...");
      const item = await storage.createStockItem(req.user.id, data);
      console.log("\u2705 Stock item created:", item.id);
      res.json(item);
    } catch (error) {
      console.error("\u274C POST /api/stock error:", error.message);
      if (error.issues) {
        console.error("Validation issues:", JSON.stringify(error.issues, null, 2));
      }
      res.status(400).json({ error: "Invalid stock item data", message: error.message, issues: error.issues });
    }
  });
  app2.patch("/api/stock/:id", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const { id } = req.params;
      const { expectedVersion, ...data } = req.body;
      const parsedData = insertStockItemSchema.partial().parse(data);
      const item = await storage.updateStockItem(req.user.id, id, parsedData, expectedVersion);
      if (item && parseFloat(item.currentQuantity) <= parseFloat(item.lowStockThreshold)) {
        const recentNotifications = await storage.getUserNotifications(req.user.id, 10);
        const hasRecentStockAlert = recentNotifications.some((n) => {
          const metadata = n.metadata ? JSON.parse(n.metadata) : {};
          return metadata.stockItemId === item.id && new Date(n.createdAt).getTime() > Date.now() - 24 * 60 * 60 * 1e3;
        });
        if (!hasRecentStockAlert) {
          await storage.createNotification({
            userId: req.user.id,
            type: "stock",
            priority: "urgent",
            title: "Stok Rendah",
            message: `${item.name} tinggal ${item.currentQuantity}${item.unit} (min: ${item.lowStockThreshold}${item.unit})`,
            actionUrl: `/stock`,
            metadata: { stockItemId: item.id }
          });
        }
      }
      res.json(item);
    } catch (error) {
      if (error.message?.includes("modified by another user")) {
        return res.status(409).json({ error: "Conflict", message: error.message });
      }
      res.status(400).json({ error: "Invalid stock item data", message: error.message });
    }
  });
  app2.get("/api/stock/:id/movements", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const movements = await storage.getStockMovements(req.user.id, id);
      res.json(movements);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stock movements" });
    }
  });
  app2.get("/api/stock-movements", requireAuth, async (req, res) => {
    try {
      const movements = await storage.getStockMovements(req.user.id);
      res.json(movements);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stock movements" });
    }
  });
  app2.post("/api/stock/:id/replenish", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const { id } = req.params;
      const replenishSchema = z.object({
        additionalQuantity: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
          message: "Additional quantity must be a positive number"
        }),
        newPurchasePrice: z.string().optional().refine((val) => !val || !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
          message: "Purchase price must be a positive number"
        }),
        newPackageSize: z.string().optional().refine((val) => !val || !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
          message: "Package size must be a positive number"
        })
      });
      const validationResult = replenishSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          error: "Invalid input",
          details: validationResult.error.errors
        });
      }
      const { additionalQuantity, newPurchasePrice, newPackageSize } = validationResult.data;
      const currentItem = await storage.getStockItem(req.user.id, id);
      if (!currentItem) {
        return res.status(404).json({ error: "Stock item not found" });
      }
      const currentQty = parseFloat(currentItem.currentQuantity);
      const additionalQty = parseFloat(additionalQuantity);
      if (isNaN(currentQty) || isNaN(additionalQty) || additionalQty <= 0) {
        return res.status(400).json({ error: "Invalid quantity values" });
      }
      const newQuantity = (currentQty + additionalQty).toFixed(2);
      const updateData = {
        currentQuantity: newQuantity
      };
      if (newPurchasePrice && newPurchasePrice.trim() !== "") {
        const newPrice = parseFloat(newPurchasePrice);
        if (isNaN(newPrice) || newPrice <= 0) {
          return res.status(400).json({ error: "Invalid purchase price" });
        }
        updateData.purchasePrice = newPrice.toFixed(2);
      }
      if (newPackageSize && newPackageSize.trim() !== "") {
        const newSize = parseFloat(newPackageSize);
        if (isNaN(newSize) || newSize <= 0) {
          return res.status(400).json({ error: "Invalid package size" });
        }
        updateData.packageSize = newSize.toFixed(2);
      }
      const updatedItem = await storage.updateStockItem(req.user.id, id, updateData);
      res.json(updatedItem);
    } catch (error) {
      console.error("Stock replenishment error:", error);
      res.status(400).json({ error: "Failed to replenish stock", message: error.message });
    }
  });
  app2.delete("/api/stock/:id", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteStockItem(req.user.id, id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete stock item" });
    }
  });
  app2.get("/api/stock/export/excel", requireAuth, async (req, res) => {
    try {
      const items = await storage.getStockItems(req.user.id);
      const exportData = items.map((item) => ({
        "Item Name": item.name,
        "Unit": item.unit,
        "Package Size": item.packageSize,
        "Purchase Price (RM)": item.purchasePrice,
        "Current Quantity": item.currentQuantity,
        "Low Stock Threshold": item.lowStockThreshold,
        "Notes": item.notes || ""
      }));
      res.json({
        data: exportData,
        filename: `stock-items-${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.xlsx`
      });
    } catch (error) {
      console.error("Export error:", error);
      res.status(500).json({ error: "Failed to export stock items", message: error.message });
    }
  });
  app2.post("/api/stock/import", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const importSchema = z.object({
        items: z.array(z.object({
          name: z.string().min(1, "Item name is required"),
          unit: z.string().min(1, "Unit is required"),
          packageSize: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
            message: "Package size must be a positive number"
          }),
          purchasePrice: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
            message: "Purchase price must be a positive number"
          }),
          currentQuantity: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
            message: "Current quantity must be a non-negative number"
          }),
          lowStockThreshold: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
            message: "Low stock threshold must be a non-negative number"
          }),
          notes: z.string().optional()
        })),
        mode: z.enum(["replace", "append"]).default("append")
      });
      const { items: importItems, mode } = importSchema.parse(req.body);
      if (mode === "replace") {
        await storage.deleteAllStockItems(req.user.id);
      }
      const results = {
        success: 0,
        failed: 0,
        errors: []
      };
      for (let i = 0; i < importItems.length; i++) {
        try {
          const item = importItems[i];
          if (mode === "append") {
            const existingItems = await storage.getStockItems(req.user.id);
            const duplicate = existingItems.find(
              (existing) => existing.name.toLowerCase() === item.name.toLowerCase()
            );
            if (duplicate) {
              results.errors.push({
                row: i + 2,
                // +2 because row 1 is header and array is 0-indexed
                name: item.name,
                error: "Item already exists (duplicate name)"
              });
              results.failed++;
              continue;
            }
          }
          await storage.createStockItem(req.user.id, {
            name: item.name,
            unit: item.unit,
            packageSize: item.packageSize,
            purchasePrice: item.purchasePrice,
            currentQuantity: item.currentQuantity,
            lowStockThreshold: item.lowStockThreshold,
            notes: item.notes || null
          });
          results.success++;
        } catch (error) {
          results.failed++;
          results.errors.push({
            row: i + 2,
            name: importItems[i].name,
            error: error.message
          });
        }
      }
      res.json({
        message: `Import completed: ${results.success} success, ${results.failed} failed`,
        results
      });
    } catch (error) {
      console.error("Import error:", error);
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
  app2.get("/api/categories", requireAuth, async (req, res) => {
    try {
      const categories2 = await storage.getCategories(req.user.id);
      res.json(categories2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });
  app2.post("/api/categories", requireAuth, async (req, res) => {
    try {
      const data = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(req.user.id, data);
      res.json(category);
    } catch (error) {
      res.status(400).json({ error: "Invalid category data", message: error.message });
    }
  });
  app2.get("/api/deliveries", requireAuth, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 20;
      const offset = parseInt(req.query.offset) || 0;
      const result = await storage.getDeliveries(req.user.id, limit, offset);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch deliveries" });
    }
  });
  app2.get("/api/deliveries/recent", requireAuth, async (req, res) => {
    try {
      const result = await storage.getDeliveries(req.user.id, 5, 0);
      res.json(result.data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch recent deliveries" });
    }
  });
  app2.get("/api/deliveries/last/:vendorId", requireAuth, async (req, res) => {
    try {
      const { vendorId } = req.params;
      const lastDelivery = await storage.getLastDeliveryForVendor(req.user.id, vendorId);
      if (!lastDelivery) {
        return res.status(404).json({ error: "No previous delivery found for this vendor" });
      }
      res.json(lastDelivery);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch last delivery" });
    }
  });
  app2.post("/api/deliveries", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const deliverySchema = insertDeliverySchema.extend({
        items: z.array(z.object({
          productId: z.string(),
          productName: z.string(),
          quantity: z.number(),
          unitPrice: z.string(),
          retailPrice: z.string().optional(),
          // Retail price for invoice reference
          rejectedQty: z.number().optional(),
          rejectionReason: z.string().optional()
        }))
      });
      const data = deliverySchema.parse(req.body);
      const { items, ...deliveryData } = data;
      const deliveryItems2 = items.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        retailPrice: item.retailPrice || "0",
        // Retail price for reference
        totalPrice: (item.quantity * parseFloat(item.unitPrice)).toFixed(2),
        rejectedQty: item.rejectedQty || 0,
        rejectionReason: item.rejectionReason || null,
        deliveryId: ""
        // Will be set in storage
      }));
      const newDelivery = await storage.createDelivery(req.user.id, deliveryData, deliveryItems2);
      const deliveryWithItems = await storage.getDelivery(req.user.id, newDelivery.id);
      const vendor = await storage.getVendor(req.user.id, newDelivery.vendorId);
      res.json({
        ...deliveryWithItems,
        vendorPhone: vendor?.phone,
        vendorAddress: vendor?.address
      });
    } catch (error) {
      if (error.code === "23505" && error.constraint === "deliveries_invoice_number_unique") {
        return res.status(409).json({
          error: "Penghantaran sedang diproses. Sila tunggu sebentar.",
          code: "DUPLICATE_REQUEST"
        });
      }
      console.error("Delivery creation error:", error);
      if (error.message) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(400).json({ error: "Data penghantaran tidak sah atau stok tidak mencukupi" });
      }
    }
  });
  app2.patch("/api/deliveries/:id/status", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      await storage.updateDeliveryStatus(req.user.id, id, status);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: "Failed to update status" });
    }
  });
  app2.patch("/api/delivery-items/:itemId/rejection", requireAuth, async (req, res) => {
    try {
      const { itemId } = req.params;
      const items = await db.select().from(deliveryItems).where(eq5(deliveryItems.id, itemId));
      if (items.length === 0) {
        return res.status(404).json({ error: "Delivery item not found" });
      }
      const item = items[0];
      const rejectionSchema = z.object({
        rejectedQty: z.coerce.number().int().min(0).max(item.quantity),
        rejectionReason: z.string().nullable().optional()
      });
      const validatedData = rejectionSchema.parse(req.body);
      await storage.updateDeliveryItemRejection(
        req.user.id,
        itemId,
        validatedData.rejectedQty,
        validatedData.rejectionReason || null
      );
      res.json({ success: true });
    } catch (error) {
      console.error("Update rejection error:", error);
      res.status(400).json({
        error: "Invalid rejection data",
        message: error.message || "Rejected quantity must be between 0 and delivered quantity"
      });
    }
  });
  app2.get("/api/sales", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 20;
      const offset = parseInt(req.query.offset) || 0;
      const result = await storage.getSales(req.user.id, limit, offset);
      res.json(result);
    } catch (error) {
      console.error("[ERROR] GET /api/sales failed:", error);
      res.status(500).json({ error: "Failed to fetch sales" });
    }
  });
  app2.get("/api/sales/:id", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const { id } = req.params;
      const sale = await storage.getSale(req.user.id, id);
      if (!sale) {
        return res.status(404).json({ error: "Sale not found" });
      }
      res.json(sale);
    } catch (error) {
      console.error("[ERROR] GET /api/sales/:id failed:", error);
      res.status(500).json({ error: "Failed to fetch sale" });
    }
  });
  app2.post("/api/sales", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const saleCreateSchema = z.object({
        sale: insertSaleSchema,
        items: z.array(insertSalesItemSchema).min(1, "At least one item required"),
        pointsRedemption: z.object({
          customerId: z.string(),
          points: z.number().positive(),
          discount: z.number().positive()
        }).nullable().optional(),
        voucherRedemption: z.object({
          voucherId: z.string(),
          customerId: z.string().nullable().optional(),
          code: z.string(),
          originalAmount: z.number().positive(),
          discount: z.number().positive()
        }).nullable().optional()
      });
      const validated = saleCreateSchema.parse(req.body);
      if (validated.pointsRedemption) {
        const { customerId, points, discount } = validated.pointsRedemption;
        const [customer] = await db.select().from(customers).where(eq5(customers.id, customerId));
        if (!customer) {
          return res.status(400).json({ error: "Customer not found" });
        }
        if (customer.loyaltyPoints < points) {
          return res.status(400).json({ error: "Insufficient loyalty points" });
        }
        try {
          await storage.redeemPoints(req.user.id, customerId, points, `Tebusan diskaun: RM${discount.toFixed(2)}`);
        } catch (redeemError) {
          console.error("Failed to redeem points:", redeemError);
          return res.status(400).json({ error: redeemError.message || "Failed to redeem points" });
        }
      }
      let voucherRedemptionData = null;
      if (validated.voucherRedemption) {
        return res.status(403).json({ message: "Voucher feature is currently disabled for launch" });
        const { voucherId, customerId, originalAmount, discount } = validated.voucherRedemption;
        try {
          const finalAmount = originalAmount - discount;
          await storage.redeemVoucher(
            req.user.id,
            voucherId,
            customerId || null,
            null,
            // saleId will be null initially, could update later if needed
            originalAmount,
            finalAmount,
            discount
          );
          voucherRedemptionData = validated.voucherRedemption;
        } catch (voucherError) {
          console.error("Failed to redeem voucher:", voucherError);
          if (validated.pointsRedemption) {
            const { customerId: customerId2, points } = validated.pointsRedemption;
            try {
              await storage.awardPoints(
                req.user.id,
                customerId2,
                points,
                null,
                "Refund - voucher gagal ditebus"
              );
            } catch (refundError) {
              console.error("Failed to refund points after voucher error:", refundError);
            }
          }
          return res.status(400).json({ error: voucherError.message || "Failed to redeem voucher" });
        }
      }
      let sale;
      try {
        sale = await storage.createSale(req.user.id, validated.sale, validated.items);
      } catch (saleError) {
        if (validated.pointsRedemption) {
          const { customerId, points } = validated.pointsRedemption;
          try {
            await storage.awardPoints(
              req.user.id,
              customerId,
              points,
              null,
              "Refund - sale gagal dibuat"
            );
          } catch (refundError) {
            console.error("Failed to refund points after sale error:", refundError);
          }
        }
        throw saleError;
      }
      if (validated.sale.customerId) {
        const totalAmount2 = parseFloat(validated.sale.totalAmount || "0");
        const pointsToAward = Math.floor(totalAmount2);
        if (pointsToAward > 0) {
          try {
            await storage.awardPoints(
              req.user.id,
              validated.sale.customerId,
              pointsToAward,
              sale.id,
              `Pembelian #${sale.receiptNumber}: RM${totalAmount2.toFixed(2)}`
            );
          } catch (pointsError) {
            console.error("Failed to award loyalty points:", pointsError);
          }
        }
      }
      const totalAmount = parseFloat(validated.sale.totalAmount || "0");
      const paymentMethodText = validated.sale.paymentMethod === "tunai" ? "Tunai" : validated.sale.paymentMethod === "online" ? "Online Transfer" : "QR Code";
      await storage.createNotification({
        userId: req.user.id,
        type: "payment",
        priority: "medium",
        title: "Pembayaran Diterima",
        message: `Jualan #${sale.receiptNumber} - ${paymentMethodText}: RM${totalAmount.toFixed(2)}`,
        actionUrl: `/sales`,
        metadata: { saleId: sale.id, amount: totalAmount }
      });
      res.json(sale);
    } catch (error) {
      console.error("[ERROR] POST /api/sales failed:", error);
      if (error.message?.includes("Insufficient stock")) {
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
  app2.get("/api/expenses", requireAuth, async (req, res) => {
    try {
      const expenses2 = await storage.getExpenses(req.user.id);
      res.json(expenses2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch expenses" });
    }
  });
  app2.post("/api/expenses", requireAuth, async (req, res) => {
    try {
      const data = insertExpenseSchema.parse(req.body);
      const expense = await storage.createExpense(req.user.id, data);
      res.json(expense);
    } catch (error) {
      res.status(400).json({ error: "Invalid expense data" });
    }
  });
  app2.get("/api/dashboard/stats", requireAuth, async (req, res) => {
    try {
      const cacheKey = cache.KEYS.DASHBOARD_STATS + `:${req.user.id}`;
      const cached2 = await cache.get(cacheKey);
      if (cached2) {
        return res.json(cached2);
      }
      const stats = await storage.getDashboardStats(req.user.id);
      await cache.set(cacheKey, stats, cache.TTL.SHORT * 2);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });
  app2.get("/api/user/usage-stats", requireAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      const [
        productsCount,
        customersCount,
        vendorsCount,
        resellersCount,
        stockItemsCount
      ] = await Promise.all([
        storage.getProductCount(userId),
        storage.getCustomers(userId).then((c) => c.filter((x) => !x.isArchived).length),
        storage.getVendors(userId).then((v) => v.filter((x) => !x.isArchived).length),
        storage.getResellers(userId).then((r) => r.filter((x) => !x.isArchived).length),
        storage.getStockItems(userId).then((s) => s.filter((x) => !x.isArchived).length)
      ]);
      const currentPlan = await getUserPlan(userId);
      let recommendedPlan = "basic";
      if (resellersCount > 0 || vendorsCount > 5 || productsCount > 50) {
        recommendedPlan = "pro";
      }
      if (productsCount > 200 || vendorsCount > 20 || resellersCount > 10) {
        recommendedPlan = "premium";
      }
      res.json({
        usage: {
          products: productsCount,
          customers: customersCount,
          vendors: vendorsCount,
          resellers: resellersCount,
          stockItems: stockItemsCount
        },
        currentPlan: currentPlan?.displayName || "No active plan",
        recommendedPlan,
        limits: {
          basic: { products: 50, customers: 200, vendors: 5, resellers: 0, stockItems: 100 },
          pro: { products: 200, customers: 1e3, vendors: 20, resellers: 10, stockItems: 500 },
          premium: { products: "Unlimited", customers: "Unlimited", vendors: "Unlimited", resellers: "Unlimited", stockItems: "Unlimited" }
        }
      });
    } catch (error) {
      console.error("Usage stats error:", error);
      res.status(500).json({ error: "Failed to fetch usage stats" });
    }
  });
  app2.get("/api/export/products", requireAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      const products2 = await storage.getProducts(userId);
      const headers = ["ID", "Name", "SKU", "Category", "Price", "Cost", "Stock", "Unit", "Status", "Created At"];
      const rows = products2.map((p) => [
        p.id,
        p.name,
        p.sku || "",
        p.category || "",
        p.price,
        p.cost || "",
        p.stockQuantity || "",
        p.unit || "",
        p.isArchived ? "Archived" : "Active",
        p.createdAt?.toISOString() || ""
      ]);
      const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="products-${Date.now()}.csv"`);
      res.send(csv);
    } catch (error) {
      console.error("Export products error:", error);
      res.status(500).json({ error: "Failed to export products" });
    }
  });
  app2.get("/api/export/vendors", requireAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      const vendors2 = await storage.getVendors(userId);
      const headers = ["ID", "Name", "Email", "Phone", "Company", "Status", "Created At"];
      const rows = vendors2.map((v) => [
        v.id,
        v.name,
        v.email || "",
        v.phone || "",
        v.company || "",
        v.isArchived ? "Archived" : "Active",
        v.createdAt?.toISOString() || ""
      ]);
      const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="vendors-${Date.now()}.csv"`);
      res.send(csv);
    } catch (error) {
      console.error("Export vendors error:", error);
      res.status(500).json({ error: "Failed to export vendors" });
    }
  });
  app2.get("/api/export/customers", requireAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      const customers2 = await storage.getCustomers(userId);
      const headers = ["ID", "Name", "Email", "Phone", "Address", "Loyalty Points", "Status", "Created At"];
      const rows = customers2.map((c) => [
        c.id,
        c.name,
        c.email || "",
        c.phone || "",
        c.address || "",
        c.loyaltyPoints || 0,
        c.isArchived ? "Archived" : "Active",
        c.createdAt?.toISOString() || ""
      ]);
      const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="customers-${Date.now()}.csv"`);
      res.send(csv);
    } catch (error) {
      console.error("Export customers error:", error);
      res.status(500).json({ error: "Failed to export customers" });
    }
  });
  app2.get("/api/export/resellers", requireAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      const resellers2 = await storage.getResellers(userId);
      const headers = ["ID", "Name", "Email", "Phone", "Commission %", "Status", "Created At"];
      const rows = resellers2.map((r) => [
        r.id,
        r.name,
        r.email || "",
        r.phone || "",
        r.commissionPercentage || 0,
        r.isArchived ? "Archived" : "Active",
        r.createdAt?.toISOString() || ""
      ]);
      const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="resellers-${Date.now()}.csv"`);
      res.send(csv);
    } catch (error) {
      console.error("Export resellers error:", error);
      res.status(500).json({ error: "Failed to export resellers" });
    }
  });
  app2.post("/api/user/restore-data", requireAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      const { restoreUserData: restoreUserData2 } = await Promise.resolve().then(() => (init_archiving(), archiving_exports));
      const result = await restoreUserData2(userId);
      res.json({
        success: true,
        restored: result,
        message: `Restored ${result.productsArchived} products, ${result.vendorsArchived} vendors, ${result.resellersArchived} resellers, ${result.customersArchived} customers, ${result.stockItemsArchived} stock items`
      });
    } catch (error) {
      console.error("Restore data error:", error);
      res.status(500).json({ error: "Failed to restore data" });
    }
  });
  app2.get("/api/reports/profit-loss", requireProPlan, async (req, res) => {
    try {
      const report = await storage.getProfitLossReport(req.user.id);
      res.json(report);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch profit/loss report" });
    }
  });
  app2.get("/api/reports/weekly-summary", requireAuth, async (req, res) => {
    try {
      const summary = await storage.getWeeklyProfitSummary(req.user.id);
      res.json(summary);
    } catch (error) {
      console.error("Weekly summary error:", error);
      res.status(500).json({ error: "Failed to fetch weekly summary" });
    }
  });
  app2.get("/api/tasks/daily", requireAuth, async (req, res) => {
    try {
      const tasks = [];
      const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      const lowStock = await storage.getLowStockItems(req.user.id);
      if (lowStock.length > 0) {
        tasks.push({
          id: "restock",
          type: "restock",
          title: `Tambah ${lowStock.length} stok bahan rendah`,
          description: lowStock.slice(0, 3).map((s) => s.name).join(", ") + (lowStock.length > 3 ? "..." : ""),
          priority: "high",
          actionUrl: "/shopping-cart"
        });
      }
      const finishedProducts = await storage.getFinishedProductsSummary(req.user.id);
      const lowFinished = finishedProducts.filter((p) => {
        const qty = parseFloat(p.totalQuantity || "0");
        return qty > 0 && qty < 10;
      });
      if (lowFinished.length > 0) {
        tasks.push({
          id: "production",
          type: "production",
          title: `Produksi ${lowFinished.length} produk hampir habis`,
          description: lowFinished.slice(0, 3).map((p) => p.productName).join(", ") + (lowFinished.length > 3 ? "..." : ""),
          priority: "high",
          actionUrl: "/production"
        });
      }
      const claimsResult = await storage.getClaimsSummary(req.user.id, 100, 0);
      const pendingPayments = claimsResult.data.filter((claim) => {
        const pending = parseFloat(claim.pendingAmount || "0");
        const partial = parseFloat(claim.partialAmount || "0");
        return pending > 0 || partial > 0;
      });
      if (pendingPayments.length > 0) {
        const totalOutstanding = pendingPayments.reduce((sum, claim) => {
          return sum + parseFloat(claim.pendingAmount || "0") + parseFloat(claim.partialAmount || "0");
        }, 0);
        tasks.push({
          id: "claims",
          type: "claims",
          title: `Kutip bayaran dari ${pendingPayments.length} vendor`,
          description: `Total: RM ${totalOutstanding.toFixed(2)}`,
          priority: "medium",
          actionUrl: "/claims"
        });
      }
      const stats = await storage.getDashboardStats(req.user.id);
      if (stats.expiringSoonCount > 0) {
        tasks.push({
          id: "expiry",
          type: "expiry",
          title: `${stats.expiringSoonCount} batch hampir expired`,
          description: "Jual atau promo segera untuk elak kerugian",
          priority: "high",
          actionUrl: "/finished-products"
        });
      }
      res.json(tasks);
    } catch (error) {
      console.error("Daily tasks error:", error);
      res.status(500).json({ error: "Failed to fetch daily tasks" });
    }
  });
  app2.get("/api/reports/export-sales", requireAuth, async (req, res) => {
    try {
      const startDate = req.query.startDate;
      const endDate = req.query.endDate;
      const sales2 = await storage.getAllSales(req.user.id, startDate, endDate);
      const headers = ["No.", "Tarikh", "No. Resit", "Jumlah Produk", "Jumlah (RM)", "Kos (RM)", "Untung (RM)", "Kaedah Bayaran", "Pelanggan"];
      const rows = sales2.map((sale, index2) => [
        index2 + 1,
        new Date(sale.saleDate).toLocaleDateString("ms-MY"),
        sale.receiptNumber,
        sale.totalItems,
        Number(sale.totalAmount || 0).toFixed(2),
        Number(sale.totalCost || 0).toFixed(2),
        Number(sale.totalProfit || 0).toFixed(2),
        sale.paymentMethod || "Tunai",
        sale.customerName || "-"
      ]);
      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(","))
      ].join("\n");
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename=PocketBizz_Jualan_${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.csv`);
      res.send("\uFEFF" + csvContent);
    } catch (error) {
      console.error("Export sales error:", error);
      res.status(500).json({ error: "Failed to export sales" });
    }
  });
  app2.get("/api/reports/export-deliveries", requireAuth, async (req, res) => {
    try {
      const deliveries2 = await storage.getAllDeliveries(req.user.id);
      const headers = ["No.", "Tarikh", "Vendor", "Produk", "Kuantiti", "Jumlah (RM)", "Status", "Bayaran", "Catatan"];
      const rows = deliveries2.map((delivery, index2) => [
        index2 + 1,
        new Date(delivery.deliveryDate).toLocaleDateString("ms-MY"),
        delivery.vendorName,
        delivery.productName,
        delivery.quantity,
        Number(delivery.totalAmount || 0).toFixed(2),
        delivery.deliveryStatus === "delivered" ? "Dihantar" : delivery.deliveryStatus === "claimed" ? "Dituntut" : delivery.deliveryStatus === "pending" ? "Pending" : "Tolakan",
        delivery.paymentStatus === "full" ? "Penuh" : delivery.paymentStatus === "partial" ? "Sebahagian" : "Belum",
        delivery.notes || "-"
      ]);
      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(","))
      ].join("\n");
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename=PocketBizz_Penghantaran_${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.csv`);
      res.send("\uFEFF" + csvContent);
    } catch (error) {
      console.error("Export deliveries error:", error);
      res.status(500).json({ error: "Failed to export deliveries" });
    }
  });
  app2.get("/api/reports/export-claims", requireAuth, async (req, res) => {
    try {
      const claimsResult = await storage.getClaimsSummary(req.user.id, 1e3, 0);
      const headers = ["No.", "Vendor", "Jumlah Hantar", "Jumlah Tuntut", "Pending", "Sebahagian", "Penuh", "Tolakan", "Belum Bayar (RM)", "Status"];
      const rows = claimsResult.data.map((claim, index2) => [
        index2 + 1,
        claim.vendorName,
        claim.totalDeliveries,
        claim.totalClaimed,
        claim.pendingCount,
        claim.partialCount,
        claim.fullCount,
        claim.rejectedCount,
        (Number(claim.pendingAmount || 0) + Number(claim.partialAmount || 0)).toFixed(2),
        Number(claim.pendingAmount || 0) + Number(claim.partialAmount || 0) > 0 ? "Belum Selesai" : "Selesai"
      ]);
      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(","))
      ].join("\n");
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename=PocketBizz_Tuntutan_${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.csv`);
      res.send("\uFEFF" + csvContent);
    } catch (error) {
      console.error("Export claims error:", error);
      res.status(500).json({ error: "Failed to export claims" });
    }
  });
  app2.get("/api/reports/top-products", requireProPlan, async (req, res) => {
    try {
      const topProducts = await storage.getTopProducts(req.user.id);
      res.json(topProducts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch top products" });
    }
  });
  app2.get("/api/reports/top-vendors", requireProPlan, async (req, res) => {
    try {
      const topVendors = await storage.getTopVendors(req.user.id);
      res.json(topVendors);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch top vendors" });
    }
  });
  app2.get("/api/reports/monthly", requireAuth, async (req, res) => {
    try {
      if (req.user.isOnTrial) {
        return res.json([]);
      }
      const monthlyData = await storage.getMonthlyData(req.user.id);
      res.json(monthlyData);
    } catch (error) {
      console.error("Monthly data error:", error);
      res.status(500).json({ error: "Failed to fetch monthly data" });
    }
  });
  app2.get("/api/analytics/product-performance", requireAuth, requireAdvancedAnalytics, async (req, res) => {
    try {
      const analytics = await storage.getProductPerformanceAnalytics(req.user.id);
      res.json(analytics || { mostProfitable: [], fastestSelling: [], mostRejected: [], allProducts: [] });
    } catch (error) {
      console.error("Product performance error:", error);
      res.json({ mostProfitable: [], fastestSelling: [], mostRejected: [], allProducts: [] });
    }
  });
  app2.get("/api/analytics/vendor-leaderboard", requireAuth, requireAdvancedAnalytics, async (req, res) => {
    try {
      const leaderboard = await storage.getVendorPerformanceLeaderboard(req.user.id);
      res.json(leaderboard);
    } catch (error) {
      console.error("Vendor leaderboard error:", error);
      res.status(500).json({ error: "Failed to fetch vendor leaderboard" });
    }
  });
  app2.get("/api/analytics/agent-leaderboard", requireAuth, requireAdvancedAnalytics, async (req, res) => {
    try {
      const leaderboard = await storage.getAgentPerformanceLeaderboard(req.user.id);
      res.json(leaderboard);
    } catch (error) {
      console.error("Agent leaderboard error:", error);
      res.status(500).json({ error: "Failed to fetch agent leaderboard" });
    }
  });
  app2.get("/api/analytics/sales-trend", requireAuth, requireAdvancedAnalytics, async (req, res) => {
    try {
      const days = parseInt(req.query.days) || 30;
      const trendData = await storage.getSalesTrendData(req.user.id, days);
      res.json(trendData);
    } catch (error) {
      console.error("Sales trend error:", error);
      res.status(500).json({ error: "Failed to fetch sales trend data" });
    }
  });
  app2.get("/api/goals", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const userId = req.user.id;
      const goalsList = await storage.getGoals(userId);
      res.json(goalsList);
    } catch (error) {
      console.error("Get goals error:", error);
      res.status(500).json({ error: "Failed to fetch goals" });
    }
  });
  app2.get("/api/goals/:month", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const userId = req.user.id;
      const { month } = req.params;
      const goal = await storage.getGoalByMonth(userId, month);
      res.json(goal || null);
    } catch (error) {
      console.error("Get goal by month error:", error);
      res.status(500).json({ error: "Failed to fetch goal" });
    }
  });
  app2.get("/api/goals/:month/progress", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const userId = req.user.id;
      const { month } = req.params;
      const progress = await storage.getGoalProgress(userId, month);
      res.json(progress);
    } catch (error) {
      console.error("Get goal progress error:", error);
      res.status(500).json({ error: "Failed to fetch goal progress" });
    }
  });
  app2.post("/api/goals", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const userId = req.user.id;
      const goalData = { ...req.body, userId };
      const newGoal = await storage.createGoal(goalData);
      res.json(newGoal);
    } catch (error) {
      console.error("Create goal error:", error);
      res.status(500).json({ error: "Failed to create goal" });
    }
  });
  app2.patch("/api/goals/:id", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const { id } = req.params;
      const updatedGoal = await storage.updateGoal(id, req.body);
      res.json(updatedGoal);
    } catch (error) {
      console.error("Update goal error:", error);
      res.status(500).json({ error: "Failed to update goal" });
    }
  });
  app2.delete("/api/goals/:id", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteGoal(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete goal error:", error);
      res.status(500).json({ error: "Failed to delete goal" });
    }
  });
  app2.get("/api/claims", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 20;
      const offset = parseInt(req.query.offset) || 0;
      const result = await storage.getClaimsSummary(req.user.id, limit, offset);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch claims summary" });
    }
  });
  app2.get("/api/claims/:vendorId/details", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const { vendorId } = req.params;
      const claimDetails = await storage.getClaimDetailsByVendor(req.user.id, vendorId);
      res.json(claimDetails);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch claim details" });
    }
  });
  app2.patch("/api/deliveries/:id/payment-status", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const { id } = req.params;
      const { paymentStatus } = req.body;
      const delivery = await storage.updateDeliveryPaymentStatus(req.user.id, id, paymentStatus);
      res.json(delivery);
    } catch (error) {
      res.status(400).json({ error: "Failed to update payment status" });
    }
  });
  app2.get("/api/business-profile", requireAuth, async (req, res) => {
    try {
      const profile = await storage.getBusinessProfile(req.user.id);
      res.json(profile || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch business profile" });
    }
  });
  app2.post("/api/business-profile", requireAuth, async (req, res) => {
    try {
      const data = insertBusinessProfileSchema.parse(req.body);
      const profile = await storage.createOrUpdateBusinessProfile(req.user.id, data);
      res.json(profile);
    } catch (error) {
      res.status(400).json({ error: "Invalid business profile data" });
    }
  });
  app2.get("/api/user/profile", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUserById(req.user.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const { password, ...userProfile } = user;
      res.json(userProfile);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user profile" });
    }
  });
  app2.get("/api/user/subscriptions", requireAuth, async (req, res) => {
    try {
      const { userSubscriptions: userSubscriptions3 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const { eq: eq6, desc: desc4 } = await import("drizzle-orm");
      const subscriptions = await db.select().from(userSubscriptions3).where(eq6(userSubscriptions3.userId, req.user.id)).orderBy(desc4(userSubscriptions3.createdAt));
      res.json(subscriptions);
    } catch (error) {
      console.error("Failed to fetch subscriptions:", error);
      res.status(500).json({ error: "Failed to fetch subscriptions" });
    }
  });
  app2.get("/api/user/plan-limits", requireAuth, async (req, res) => {
    try {
      const { products: productsTable, stockItems: stockItems2, sales: sales2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const { eq: eq6, count } = await import("drizzle-orm");
      const [productsCount] = await db.select({ count: count() }).from(productsTable).where(eq6(productsTable.userId, req.user.id));
      const [stockCount] = await db.select({ count: count() }).from(stockItems2).where(eq6(stockItems2.userId, req.user.id));
      const [transactionsCount] = await db.select({ count: count() }).from(sales2).where(eq6(sales2.userId, req.user.id));
      const { getPlanLimits: getPlanLimits2 } = await Promise.resolve().then(() => (init_feature_gating(), feature_gating_exports));
      const limits = await getPlanLimits2(req.user.id);
      res.json({
        products: {
          current: productsCount.count,
          max: limits.maxProducts
        },
        stockItems: {
          current: stockCount.count,
          max: limits.maxStockItems
        },
        transactions: {
          current: transactionsCount.count,
          max: limits.maxTransactions
        }
      });
    } catch (error) {
      console.error("Failed to fetch plan limits:", error);
      res.status(500).json({ error: "Failed to fetch plan limits" });
    }
  });
  app2.patch("/api/user/profile", requireAuth, async (req, res) => {
    try {
      const updateSchema = z.object({
        fullName: z.string().min(1, "Nama penuh diperlukan").optional(),
        email: z.string().email("Email tidak sah").optional()
      });
      const data = updateSchema.parse(req.body);
      const updateData = {};
      if (data.fullName) updateData.name = data.fullName;
      if (data.email) updateData.email = data.email;
      if (data.email && data.email !== req.user.email) {
        const existingUser = await storage.getUserByEmail(data.email);
        if (existingUser) {
          return res.status(400).json({ error: "Email sudah digunakan" });
        }
      }
      const updatedUser = await storage.updateUserProfile(req.user.id, updateData);
      const { password, ...userProfile } = updatedUser;
      res.json(userProfile);
    } catch (error) {
      res.status(400).json({ error: error.message || "Gagal mengemaskini profil" });
    }
  });
  app2.post("/api/user/change-password", requireAuth, async (req, res) => {
    try {
      const passwordSchema2 = z.object({
        currentPassword: z.string().min(1, "Kata laluan semasa diperlukan"),
        newPassword: z.string().min(8, "Kata laluan baru mestilah sekurang-kurangnya 8 aksara")
      });
      const { currentPassword, newPassword } = passwordSchema2.parse(req.body);
      const user = await storage.getUserById(req.user.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const validPassword = await bcrypt.compare(currentPassword, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: "Kata laluan semasa tidak tepat" });
      }
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await storage.updateUserPassword(req.user.id, hashedPassword);
      res.json({ message: "Kata laluan berjaya dikemaskini" });
    } catch (error) {
      res.status(400).json({ error: error.message || "Gagal menukar kata laluan" });
    }
  });
  app2.post("/api/google-drive/upload", requireAuth, requirePaidSubscription, async (req, res) => {
    try {
      const { pdfBase64, fileName, deliveryId, vendorId, vendorName, fileType } = req.body;
      if (!pdfBase64 || !fileName) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      const pdfBuffer = Buffer.from(pdfBase64, "base64");
      const driveFile = await uploadPDFToGoogleDrive(pdfBuffer, fileName);
      const syncLog = await storage.logGoogleDriveSync(req.user.id, {
        deliveryId: deliveryId || null,
        fileName,
        fileType: fileType || "invoice",
        driveFileId: driveFile.id,
        driveWebViewLink: driveFile.webViewLink,
        vendorId: vendorId || null,
        vendorName: vendorName || null
      });
      res.json({
        success: true,
        driveFile,
        syncLog
      });
    } catch (error) {
      console.error("Google Drive upload error:", error);
      res.status(500).json({
        error: "Failed to upload to Google Drive",
        message: error.message
      });
    }
  });
  app2.get("/api/google-drive/files", requireAuth, async (req, res) => {
    try {
      const files = await listManisBizzFiles();
      res.json(files);
    } catch (error) {
      res.status(500).json({
        error: "Failed to fetch Google Drive files",
        message: error.message
      });
    }
  });
  app2.get("/api/google-drive/sync-logs", requireAuth, async (req, res) => {
    try {
      const logs = await storage.getGoogleDriveSyncLogs(req.user.id);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch sync logs" });
    }
  });
  app2.get("/api/google-drive/sync-logs/:deliveryId", requireAuth, async (req, res) => {
    try {
      const { deliveryId } = req.params;
      const logs = await storage.getGoogleDriveSyncLogsByDelivery(req.user.id, deliveryId);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch delivery sync logs" });
    }
  });
  app2.get("/api/pricing-tiers", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const userTiers = await storage.getPricingTiers(req.user.id);
      res.json(userTiers);
    } catch (error) {
      console.error("Get pricing tiers error:", error);
      res.status(500).json({ message: error.message || "Failed to fetch pricing tiers" });
    }
  });
  app2.post("/api/pricing-tiers", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const validatedData = insertPricingTierSchema.parse(req.body);
      const tierData = {
        ...validatedData,
        userId: req.user.id
      };
      const tier = await storage.createPricingTier(req.user.id, tierData);
      res.status(201).json(tier);
    } catch (error) {
      console.error("Create pricing tier error:", error);
      if (error.name === "ZodError") {
        const { fromError } = await import("zod-validation-error");
        const validationError = fromError(error);
        return res.status(400).json({ message: validationError.toString() });
      }
      res.status(400).json({ message: error.message || "Failed to create pricing tier" });
    }
  });
  app2.patch("/api/pricing-tiers/:id", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertPricingTierSchema.partial().parse(req.body);
      const allTiers = await storage.getPricingTiers(req.user.id);
      const existingTier = allTiers.find((t) => t.id === id);
      if (!existingTier) {
        return res.status(404).json({ message: "Pricing tier not found" });
      }
      const updatedTier = await storage.updatePricingTier(req.user.id, id, validatedData);
      res.json(updatedTier);
    } catch (error) {
      console.error("Update pricing tier error:", error);
      if (error.name === "ZodError") {
        const { fromError } = await import("zod-validation-error");
        const validationError = fromError(error);
        return res.status(400).json({ message: validationError.toString() });
      }
      res.status(400).json({ message: error.message || "Failed to update pricing tier" });
    }
  });
  app2.get("/api/resellers", requireAuth, blockExpiredTrial, requireResellerNetwork, async (req, res) => {
    try {
      const userResellers = await storage.getResellers(req.user.id);
      res.json(userResellers);
    } catch (error) {
      console.error("Get resellers error:", error);
      res.status(500).json({ message: error.message || "Failed to fetch resellers" });
    }
  });
  app2.post("/api/resellers", requireAuth, blockExpiredTrial, requireResellerNetwork, enforceResellerLimit, async (req, res) => {
    try {
      const validatedData = insertResellerSchema.parse(req.body);
      const resellerData = {
        ...validatedData,
        userId: req.user.id
      };
      const reseller = await storage.createReseller(req.user.id, resellerData);
      res.status(201).json(reseller);
    } catch (error) {
      console.error("Create reseller error:", error);
      if (error.name === "ZodError") {
        const { fromError } = await import("zod-validation-error");
        const validationError = fromError(error);
        return res.status(400).json({ message: validationError.toString() });
      }
      res.status(400).json({ message: error.message || "Failed to create reseller" });
    }
  });
  app2.patch("/api/resellers/:id", requireAuth, blockExpiredTrial, requireResellerNetwork, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertResellerSchema.partial().parse(req.body);
      const allResellers = await storage.getResellers(req.user.id);
      const existingReseller = allResellers.find((r) => r.id === id);
      if (!existingReseller) {
        return res.status(404).json({ message: "Reseller not found" });
      }
      const updatedReseller = await storage.updateReseller(req.user.id, id, validatedData);
      res.json(updatedReseller);
    } catch (error) {
      console.error("Update reseller error:", error);
      if (error.name === "ZodError") {
        const { fromError } = await import("zod-validation-error");
        const validationError = fromError(error);
        return res.status(400).json({ message: validationError.toString() });
      }
      res.status(400).json({ message: error.message || "Failed to update reseller" });
    }
  });
  app2.delete("/api/resellers/:id", requireAuth, blockExpiredTrial, requireResellerNetwork, async (req, res) => {
    try {
      const { id } = req.params;
      const allResellers = await storage.getResellers(req.user.id);
      const existingReseller = allResellers.find((r) => r.id === id);
      if (!existingReseller) {
        return res.status(404).json({ message: "Reseller not found" });
      }
      await storage.deleteReseller(req.user.id, id);
      res.json({ message: "Reseller deleted successfully" });
    } catch (error) {
      console.error("Delete reseller error:", error);
      res.status(500).json({ message: error.message || "Failed to delete reseller" });
    }
  });
  app2.get("/api/resellers/:id/stats", requireAuth, blockExpiredTrial, requireResellerNetwork, async (req, res) => {
    try {
      const { id } = req.params;
      const allResellers = await storage.getResellers(req.user.id);
      const existingReseller = allResellers.find((r) => r.id === id);
      if (!existingReseller) {
        return res.status(404).json({ message: "Reseller not found" });
      }
      const stats = await storage.getResellerStats(req.user.id, id);
      res.json(stats);
    } catch (error) {
      console.error("Get reseller stats error:", error);
      res.status(500).json({ message: error.message || "Failed to fetch reseller stats" });
    }
  });
  app2.get("/api/reseller-transfers", requireAuth, blockExpiredTrial, requireResellerNetwork, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const offset = parseInt(req.query.offset) || 0;
      const result = await storage.getResellerTransfers(req.user.id, limit, offset);
      const userTransfers = result.data.filter((transfer) => transfer.userId === req.user.id);
      res.json({
        data: userTransfers,
        hasMore: result.hasMore,
        total: userTransfers.length
      });
    } catch (error) {
      console.error("Get reseller transfers error:", error);
      res.status(500).json({ message: error.message || "Failed to fetch reseller transfers" });
    }
  });
  app2.get("/api/reseller-transfers/:id", requireAuth, blockExpiredTrial, requireResellerNetwork, async (req, res) => {
    try {
      const { id } = req.params;
      const transfer = await storage.getResellerTransferById(req.user.id, id);
      if (!transfer) {
        return res.status(404).json({ message: "Transfer not found" });
      }
      res.json(transfer);
    } catch (error) {
      console.error("Get reseller transfer error:", error);
      res.status(500).json({ message: error.message || "Failed to fetch reseller transfer" });
    }
  });
  app2.post("/api/reseller-transfers", requireAuth, blockExpiredTrial, requireResellerNetwork, async (req, res) => {
    try {
      const transferSchema = z.object({
        resellerId: z.string().min(1, "Reseller is required"),
        transferDate: z.string().min(1, "Transfer date is required"),
        items: z.array(z.object({
          productId: z.string().min(1, "Product ID is required"),
          productName: z.string().min(1, "Product name is required"),
          quantity: z.number().int().positive("Quantity must be positive")
        })).min(1, "At least one item is required"),
        paymentStatus: z.enum(["paid", "pending"]).default("pending"),
        notes: z.string().optional()
      });
      const validatedData = transferSchema.parse(req.body);
      const allResellers = await storage.getResellers(req.user.id);
      const reseller = allResellers.find((r) => r.id === validatedData.resellerId);
      if (!reseller) {
        return res.status(404).json({ message: "Reseller not found" });
      }
      let tier = null;
      if (reseller.pricingTierId) {
        const allTiers = await storage.getPricingTiers(req.user.id);
        tier = allTiers.find((t) => t.id === reseller.pricingTierId);
      }
      const processedItems = [];
      for (const item of validatedData.items) {
        const deductionResult = await storage.deductFromBatches(req.user.id, item.productId, item.quantity);
        if (!deductionResult.success) {
          return res.status(400).json({
            error: "Insufficient stock",
            message: `Insufficient stock for product: ${item.productName}. Available quantity is less than ${item.quantity}.`,
            productName: item.productName
          });
        }
        const product = await storage.getProduct(req.user.id, item.productId);
        if (!product) {
          return res.status(404).json({ message: `Product not found: ${item.productName}` });
        }
        const discountPercent = tier ? parseFloat(tier.discountPercent.toString()) : 0;
        const tierPrice = parseFloat(product.sellingPrice.toString()) * (1 - discountPercent / 100);
        const subtotal = item.quantity * tierPrice;
        const batchId = deductionResult.deductions.length > 0 ? deductionResult.deductions[0].batchId : null;
        processedItems.push({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          tierPrice,
          subtotal,
          batchId
        });
      }
      const totalAmount = processedItems.reduce((sum, item) => sum + item.subtotal, 0);
      const receiptNumber = await storage.generateTransferReceiptNumber(req.user.id);
      const transferData = {
        userId: req.user.id,
        resellerId: validatedData.resellerId,
        transferDate: validatedData.transferDate,
        totalAmount,
        paymentStatus: validatedData.paymentStatus,
        notes: validatedData.notes || null,
        receiptNumber
      };
      const createdTransfer = await storage.createResellerTransfer(req.user.id, transferData, processedItems);
      res.status(201).json(createdTransfer);
    } catch (error) {
      console.error("Create reseller transfer error:", error);
      if (error.name === "ZodError") {
        const { fromError } = await import("zod-validation-error");
        const validationError = fromError(error);
        return res.status(400).json({ message: validationError.toString() });
      }
      res.status(400).json({ message: error.message || "Failed to create reseller transfer" });
    }
  });
  app2.post("/api/shopping-cart", requireAuth, async (req, res) => {
    try {
      const { insertShoppingCartSchema: insertShoppingCartSchema2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const data = insertShoppingCartSchema2.parse(req.body);
      const item = await storage.addToShoppingCart(req.user.id, data);
      res.json(item);
    } catch (error) {
      res.status(400).json({ error: "Invalid shopping cart data", message: error.message });
    }
  });
  app2.post("/api/shopping-cart/bulk", requireAuth, async (req, res) => {
    try {
      const schema = z.object({
        items: z.array(z.object({
          stockItemId: z.string().uuid(),
          shortageQty: z.string(),
          notes: z.string().optional()
        }))
      });
      const { items } = schema.parse(req.body);
      const userId = req.user.id;
      const stockItemIds = items.map((item) => item.stockItemId);
      const stockItemsData = await storage.getStockItemsByIds(stockItemIds, userId);
      const existingCartItems = await storage.getShoppingCartItems(userId);
      const existingStockIds = new Set(existingCartItems.map((item) => item.stockItemId));
      const results = {
        added: [],
        skipped: [],
        errors: []
      };
      for (const item of items) {
        try {
          if (existingStockIds.has(item.stockItemId)) {
            results.skipped.push(item.stockItemId);
            continue;
          }
          const stockItem = stockItemsData.find((s) => s.id === item.stockItemId);
          if (!stockItem) {
            results.errors.push({
              stockItemId: item.stockItemId,
              error: "Stock item not found"
            });
            continue;
          }
          await storage.addToShoppingCart(userId, {
            stockItemId: item.stockItemId,
            stockItemName: stockItem.name,
            shortageQty: item.shortageQty,
            unit: stockItem.unit,
            notes: item.notes || null,
            productionBatchId: null,
            productName: null
          });
          results.added.push(item.stockItemId);
        } catch (error) {
          results.errors.push({
            stockItemId: item.stockItemId,
            error: error.message
          });
        }
      }
      res.json({
        success: true,
        message: `${results.added.length} items added to shopping list`,
        results
      });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
  app2.get("/api/shopping-cart", requireAuth, async (req, res) => {
    try {
      const items = await storage.getShoppingCartItems(req.user.id);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch shopping cart items" });
    }
  });
  app2.delete("/api/shopping-cart/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.removeFromCart(req.user.id, id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to remove item from cart" });
    }
  });
  app2.delete("/api/shopping-cart", requireAuth, async (req, res) => {
    try {
      await storage.clearCart(req.user.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to clear cart" });
    }
  });
  app2.post("/api/shopping-cart/purchase", requireAuth, async (req, res) => {
    try {
      const { cartItemIds } = req.body;
      if (!Array.isArray(cartItemIds) || cartItemIds.length === 0) {
        return res.status(400).json({ error: "Cart item IDs are required" });
      }
      await storage.bulkPurchaseAndUpdateStock(req.user.id, cartItemIds);
      res.json({ success: true, message: "Stock updated and cart items removed" });
    } catch (error) {
      console.error("Bulk purchase error:", error);
      res.status(500).json({ error: "Failed to complete purchase", message: error.message });
    }
  });
  app2.post("/api/purchase-orders/from-cart", requireAuth, async (req, res) => {
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
        req.user.id,
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
    } catch (error) {
      console.error("Create PO from cart error:", error);
      res.status(500).json({ error: "Failed to create purchase order", message: error.message });
    }
  });
  app2.get("/api/purchase-orders", requireAuth, async (req, res) => {
    try {
      const orders = await storage.getPurchaseOrders(req.user.id);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch purchase orders" });
    }
  });
  app2.get("/api/purchase-orders/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const order = await storage.getPurchaseOrder(req.user.id, id);
      if (!order) {
        return res.status(404).json({ error: "Purchase order not found" });
      }
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch purchase order" });
    }
  });
  app2.patch("/api/purchase-orders/:id/status", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;
      if (!status) {
        return res.status(400).json({ error: "Status is required" });
      }
      const additionalData = {};
      if (notes) additionalData.notes = notes;
      const updated = await storage.updatePurchaseOrderStatus(req.user.id, id, status, additionalData);
      res.json(updated);
    } catch (error) {
      console.error("Update PO status error:", error);
      res.status(500).json({ error: "Failed to update purchase order status", message: error.message });
    }
  });
  app2.post("/api/purchase-orders/:id/receive", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { actualPrices } = req.body;
      await storage.markPurchaseOrderReceived(req.user.id, id, actualPrices);
      res.json({ success: true, message: "Purchase order marked as received, stock updated, and expense created" });
    } catch (error) {
      console.error("Mark PO received error:", error);
      res.status(500).json({ error: "Failed to mark purchase order as received", message: error.message });
    }
  });
  app2.delete("/api/purchase-orders/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deletePurchaseOrder(req.user.id, id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete purchase order" });
    }
  });
  app2.post("/api/purchase-orders/:id/send-email", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { recipientEmail, recipientName, message, pdfBase64 } = req.body;
      if (!recipientEmail) {
        return res.status(400).json({ error: "Recipient email is required" });
      }
      if (!pdfBase64) {
        return res.status(400).json({ error: "PDF data is required" });
      }
      const order = await storage.getPurchaseOrder(req.user.id, id);
      if (!order) {
        return res.status(404).json({ error: "Purchase order not found" });
      }
      const businessProfile2 = await storage.getBusinessProfile(req.user.id);
      const businessName = businessProfile2?.businessName || "PocketBizz";
      const businessEmail = businessProfile2?.email;
      if (!businessEmail) {
        return res.status(400).json({
          error: "Business email not configured",
          message: "Please add your business email in Settings > Business Profile to send emails."
        });
      }
      const { getUncachableResendClient: getUncachableResendClient2 } = await Promise.resolve().then(() => (init_resend_client(), resend_client_exports));
      let client;
      try {
        client = await getUncachableResendClient2();
      } catch (emailError) {
        console.error("Email service configuration error:", emailError.message);
        return res.status(503).json({
          error: "Email service not configured",
          message: "Please configure RESEND_API_KEY in environment variables to enable email features. Get your API key from https://resend.com/api-keys"
        });
      }
      const freeEmailProviders = /@(gmail|googlemail|yahoo|ymail|hotmail|outlook|live|msn|icloud|me|aol)\./i;
      const isCustomDomain = !freeEmailProviders.test(businessEmail);
      let emailFrom;
      let emailReplyTo;
      if (isCustomDomain) {
        emailFrom = businessEmail;
      } else {
        emailFrom = `${businessName} <noreply@pocketbizz.my>`;
        emailReplyTo = businessEmail;
      }
      const pdfBuffer = Buffer.from(pdfBase64, "base64");
      const emailSubject = `Purchase Order: ${order.poNumber} - ${businessName}`;
      const emailHtml = `
        <h2>Purchase Order</h2>
        <p>Dear ${recipientName || order.supplierName},</p>
        ${message ? `<p>${message}</p>` : ""}
        <p>Sila semak Purchase Order yang dilampirkan. Terima kasih!</p>
        <hr />
        <p><strong>PO Number:</strong> ${order.poNumber}</p>
        <p><strong>Supplier:</strong> ${order.supplierName}</p>
        <p><strong>Jumlah:</strong> RM ${parseFloat(order.totalAmount).toFixed(2)}</p>
        <p><strong>Bilangan Item:</strong> ${order.items.length}</p>
        <br />
        <p>Best regards,<br />${businessName}</p>
        ${businessProfile2?.phone ? `<p style="color: #666; font-size: 0.9em;">Tel: ${businessProfile2.phone}</p>` : ""}
        ${emailReplyTo ? `<p style="color: #666; font-size: 0.9em;">Email: ${businessEmail}</p>` : ""}
      `;
      const emailOptions = {
        from: emailFrom,
        to: recipientEmail,
        subject: emailSubject,
        html: emailHtml,
        attachments: [
          {
            filename: `${order.poNumber}.pdf`,
            content: pdfBuffer
          }
        ]
      };
      if (emailReplyTo) {
        emailOptions.reply_to = emailReplyTo;
      }
      await client.emails.send(emailOptions);
      res.json({ success: true, message: "Email sent successfully" });
    } catch (error) {
      console.error("Send PO email error:", error);
      res.status(500).json({ error: "Failed to send email", message: error.message });
    }
  });
  app2.patch("/api/purchase-orders/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
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
          notes: z.string().nullable().optional()
        })).optional()
      });
      const validatedData = updatePOSchema.parse(req.body);
      const order = await storage.getPurchaseOrder(req.user.id, id);
      if (!order) {
        return res.status(404).json({ error: "Purchase order not found" });
      }
      if (order.status !== "draft") {
        return res.status(400).json({ error: "Only draft purchase orders can be edited" });
      }
      const updated = await storage.updatePurchaseOrder(req.user.id, id, validatedData);
      res.json(updated);
    } catch (error) {
      console.error("Update PO error:", error);
      res.status(500).json({ error: "Failed to update purchase order", message: error.message });
    }
  });
  app2.post("/api/purchase-orders/:id/duplicate", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const originalPO = await storage.getPurchaseOrder(req.user.id, id);
      if (!originalPO) {
        return res.status(404).json({ error: "Purchase order not found" });
      }
      const duplicatedPO = await storage.duplicatePurchaseOrder(req.user.id, id);
      res.json(duplicatedPO);
    } catch (error) {
      console.error("Duplicate PO error:", error);
      res.status(500).json({ error: "Failed to duplicate purchase order", message: error.message });
    }
  });
  app2.get("/api/po-templates", requireAuth, async (req, res) => {
    try {
      const templates = await storage.getAllPOTemplates(req.user.id);
      res.json(templates);
    } catch (error) {
      console.error("Get templates error:", error);
      res.status(500).json({ error: "Failed to fetch templates" });
    }
  });
  app2.post("/api/po-templates/from-po/:poId", requireAuth, async (req, res) => {
    try {
      const { poId } = req.params;
      const { templateName } = req.body;
      if (!templateName) {
        return res.status(400).json({ error: "Template name is required" });
      }
      const po = await storage.getPurchaseOrder(req.user.id, poId);
      if (!po) {
        return res.status(404).json({ error: "Purchase order not found" });
      }
      const template = await storage.createPOTemplate(req.user.id, {
        templateName,
        supplierId: po.supplierId,
        supplierName: po.supplierName,
        supplierPhone: po.supplierPhone,
        notes: po.notes,
        items: po.items || []
      });
      res.json(template);
    } catch (error) {
      console.error("Create template error:", error);
      res.status(500).json({ error: "Failed to create template", message: error.message });
    }
  });
  app2.post("/api/po-templates/:templateId/create-po", requireAuth, async (req, res) => {
    try {
      const { templateId } = req.params;
      const po = await storage.createPOFromTemplate(req.user.id, templateId);
      res.json(po);
    } catch (error) {
      console.error("Create PO from template error:", error);
      res.status(500).json({ error: "Failed to create PO from template", message: error.message });
    }
  });
  app2.delete("/api/po-templates/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deletePOTemplate(req.user.id, id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete template error:", error);
      res.status(500).json({ error: "Failed to delete template" });
    }
  });
  app2.get("/api/admin/stats", requireAdmin, async (req, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      const now = /* @__PURE__ */ new Date();
      const totalUsers = allUsers.length;
      const activeTrialUsers = allUsers.filter(
        (u) => u.isOnTrial === 1 && u.trialEndsAt && new Date(u.trialEndsAt) > now
      ).length;
      const expiredTrialUsers = allUsers.filter(
        (u) => u.isOnTrial === 0 && u.trialEndsAt && new Date(u.trialEndsAt) < now
      ).length;
      const allSubscriptions = await storage.getAllUserSubscriptions();
      const activeSubscriptions = allSubscriptions.filter(
        (s) => s.status === "active" && s.subscriptionEndsAt && new Date(s.subscriptionEndsAt) > now
      );
      const paidUserIds = new Set(activeSubscriptions.map((s) => s.userId));
      const paidUsers = paidUserIds.size;
      let totalMRR = 0;
      for (const sub of activeSubscriptions) {
        const plan = await storage.getSubscriptionPlanById(sub.planId);
        if (plan) {
          totalMRR += parseFloat(plan.monthlyPrice || "0");
        }
      }
      res.json({
        users: {
          total: totalUsers,
          activeTrial: activeTrialUsers,
          expiredTrial: expiredTrialUsers,
          paid: paidUsers
        },
        subscriptions: {
          active: activeSubscriptions.length,
          total: allSubscriptions.length
        },
        revenue: {
          mrr: totalMRR.toFixed(2),
          currency: "MYR"
        }
      });
    } catch (error) {
      console.error("Admin stats error:", error);
      res.status(500).json({ error: "Failed to fetch admin statistics" });
    }
  });
  app2.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const offset = (page - 1) * limit;
      const allUsers = await storage.getAllUsers();
      const total = allUsers.length;
      const users2 = allUsers.slice(offset, offset + limit);
      const enrichedUsers = await Promise.all(users2.map(async (user) => {
        const subscriptions = await storage.getUserSubscriptions(user.id);
        const activeSub = subscriptions.find(
          (s) => s.status === "active" && s.subscriptionEndsAt && new Date(s.subscriptionEndsAt) > /* @__PURE__ */ new Date()
        );
        let plan = null;
        if (activeSub) {
          plan = await storage.getSubscriptionPlanById(activeSub.planId);
        }
        return {
          ...user,
          password: void 0,
          // Don't send password hash
          currentPlan: plan?.displayName || (user.isOnTrial ? "Trial" : "None"),
          subscriptionStatus: activeSub ? "active" : user.isOnTrial ? "trial" : "inactive"
        };
      }));
      res.json({
        users: enrichedUsers,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error("Admin users list error:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });
  app2.get("/api/admin/users/:userId", requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const subscriptions = await storage.getUserSubscriptions(userId);
      const products2 = await storage.getProducts();
      const userProducts = products2.filter((p) => p.userId === userId);
      res.json({
        ...user,
        password: void 0,
        subscriptions,
        stats: {
          totalProducts: userProducts.length,
          totalSubscriptions: subscriptions.length
        }
      });
    } catch (error) {
      console.error("Admin user details error:", error);
      res.status(500).json({ error: "Failed to fetch user details" });
    }
  });
  app2.patch("/api/admin/users/:userId/subscription", requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const { action, planId, durationMonths } = req.body;
      if (action === "activate") {
        const plan = await storage.getSubscriptionPlanById(planId);
        if (!plan) {
          return res.status(404).json({ error: "Plan not found" });
        }
        const startDate = /* @__PURE__ */ new Date();
        const endDate = /* @__PURE__ */ new Date();
        endDate.setMonth(endDate.getMonth() + (durationMonths || 1));
        const PACKAGE_PRICES = {
          1: 27,
          3: 79,
          6: 146,
          12: 259
        };
        const totalPaid = PACKAGE_PRICES[durationMonths || 1] || 27;
        const subscription = await storage.createUserSubscription({
          userId,
          planId,
          planName: plan.name,
          status: "active",
          subscriptionStartsAt: startDate,
          subscriptionEndsAt: endDate,
          totalPaid: totalPaid.toFixed(2),
          durationMonths: durationMonths || 1,
          paymentProvider: "manual"
        });
        await storage.updateUser(userId, { isOnTrial: 0 });
        res.json({ success: true, subscription });
      } else if (action === "cancel") {
        const subscriptions = await storage.getUserSubscriptions(userId);
        const activeSub = subscriptions.find((s) => s.status === "active");
        if (activeSub) {
          await storage.updateUserSubscription(activeSub.id, { status: "canceled" });
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
  app2.post("/api/admin/subscriptions/manual-activate", requireAdmin, async (req, res) => {
    try {
      const { userId, planId, durationMonths, notes } = req.body;
      if (![1, 3, 6, 12].includes(durationMonths)) {
        return res.status(400).json({ error: "Invalid duration. Must be 1, 3, 6, or 12 months" });
      }
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const plan = await storage.getSubscriptionPlanById(planId);
      if (!plan) {
        return res.status(404).json({ error: "Plan not found" });
      }
      const startDate = /* @__PURE__ */ new Date();
      const endDate = /* @__PURE__ */ new Date();
      endDate.setMonth(endDate.getMonth() + durationMonths);
      const PACKAGE_PRICES = {
        1: 27,
        3: 79,
        6: 146,
        12: 259
      };
      const totalAmount = PACKAGE_PRICES[durationMonths] || 0;
      const subscription = await storage.createUserSubscription({
        userId,
        planId,
        planName: plan.name,
        status: "active",
        subscriptionStartsAt: startDate,
        subscriptionEndsAt: endDate,
        totalPaid: totalAmount.toFixed(2),
        durationMonths,
        paymentProvider: "manual_admin",
        activationSource: "manual_admin",
        metadata: JSON.stringify({
          activatedBy: req.user.email,
          adminNotes: notes || "",
          activatedAt: (/* @__PURE__ */ new Date()).toISOString()
        })
      });
      if (user.isOnTrial === 1) {
        await storage.updateUser(userId, { isOnTrial: 0 });
      }
      await db.insert(adminActivityLogs).values({
        adminId: req.user.id,
        action: "manual_subscription_activate",
        targetUserId: userId,
        details: `Manually activated ${plan.name} for ${durationMonths} months (${user.email})${notes ? ` - Notes: ${notes}` : ""}`,
        createdAt: /* @__PURE__ */ new Date()
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
  app2.patch("/api/admin/subscriptions/:subscriptionId/extend", requireAdmin, async (req, res) => {
    try {
      const { subscriptionId } = req.params;
      const { extensionMonths, notes } = req.body;
      if (![1, 3, 6, 12].includes(extensionMonths)) {
        return res.status(400).json({ error: "Invalid extension. Must be 1, 3, 6, or 12 months" });
      }
      const subscriptions = await storage.getAllUserSubscriptions();
      const subscription = subscriptions.find((s) => s.id === subscriptionId);
      if (!subscription) {
        return res.status(404).json({ error: "Subscription not found" });
      }
      const user = await storage.getUserById(subscription.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const currentEndDate = new Date(subscription.subscriptionEndsAt);
      const newEndDate = new Date(currentEndDate);
      newEndDate.setMonth(newEndDate.getMonth() + extensionMonths);
      const PACKAGE_PRICES = {
        1: 27,
        3: 79,
        6: 146,
        12: 259
      };
      const extensionAmount = PACKAGE_PRICES[extensionMonths] || 0;
      const newTotalPaid = parseFloat(subscription.totalPaid || "0") + extensionAmount;
      const updated = await storage.updateUserSubscription(subscriptionId, {
        subscriptionEndsAt: newEndDate,
        totalPaid: newTotalPaid.toFixed(2),
        status: "active",
        // Reactivate if it was expired
        durationMonths: subscription.durationMonths + extensionMonths,
        metadata: JSON.stringify({
          ...JSON.parse(subscription.metadata || "{}"),
          lastExtension: {
            extendedBy: req.user.email,
            extensionMonths,
            extensionAmount,
            adminNotes: notes || "",
            extendedAt: (/* @__PURE__ */ new Date()).toISOString()
          }
        })
      });
      await db.insert(adminActivityLogs).values({
        adminId: req.user.id,
        action: "manual_subscription_extend",
        targetUserId: subscription.userId,
        details: `Extended subscription by ${extensionMonths} months for ${user.email} (${subscription.planName})${notes ? ` - Notes: ${notes}` : ""}`,
        createdAt: /* @__PURE__ */ new Date()
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
  app2.get("/api/admin/subscriptions", requireAdmin, async (req, res) => {
    try {
      const allSubscriptions = await storage.getAllUserSubscriptions();
      const allUsers = await storage.getAllUsers();
      const userMap = new Map(allUsers.map((u) => [u.id, u]));
      const enrichedSubscriptions = allSubscriptions.map((sub) => {
        const user = userMap.get(sub.userId);
        return {
          ...sub,
          userEmail: user?.email,
          userName: user?.fullName,
          isExpired: new Date(sub.subscriptionEndsAt) < /* @__PURE__ */ new Date()
        };
      });
      enrichedSubscriptions.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      res.json(enrichedSubscriptions);
    } catch (error) {
      console.error("Admin subscriptions list error:", error);
      res.status(500).json({ error: "Failed to fetch subscriptions" });
    }
  });
  app2.post("/api/admin/users/:userId/reset-password", requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const crypto2 = await import("crypto");
      const tempPassword = crypto2.randomBytes(4).toString("hex");
      const hashedPassword = await bcrypt.hash(tempPassword, 10);
      await storage.updateUser(userId, {
        password: hashedPassword,
        updatedAt: /* @__PURE__ */ new Date()
      });
      await db.insert(adminActivityLogs).values({
        adminId: req.user.id,
        action: "reset_password",
        targetUserId: userId,
        details: `Reset password for ${user.email}`,
        createdAt: /* @__PURE__ */ new Date()
      });
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
  app2.delete("/api/admin/users/:userId", requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      if (userId === req.user.id) {
        return res.status(400).json({ error: "Cannot delete your own account" });
      }
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      await db.delete(users).where(eq5(users.id, userId));
      await db.insert(adminActivityLogs).values({
        adminId: req.user.id,
        action: "delete_user",
        targetUserId: userId,
        details: `Deleted user ${user.email}`,
        createdAt: /* @__PURE__ */ new Date()
      });
      res.json({ success: true, message: "User deleted successfully" });
    } catch (error) {
      console.error("Admin delete user error:", error);
      res.status(500).json({ error: "Failed to delete user" });
    }
  });
  app2.post("/api/admin/users/:userId/toggle-status", requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const { suspended } = req.body;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      await storage.updateUser(userId, {
        suspended: suspended ? 1 : 0,
        updatedAt: /* @__PURE__ */ new Date()
      });
      await db.insert(adminActivityLogs).values({
        adminId: req.user.id,
        action: suspended ? "suspend_user" : "activate_user",
        targetUserId: userId,
        details: `${suspended ? "Suspended" : "Activated"} user ${user.email}`,
        createdAt: /* @__PURE__ */ new Date()
      });
      res.json({ success: true, message: `User ${suspended ? "suspended" : "activated"} successfully` });
    } catch (error) {
      console.error("Admin toggle user status error:", error);
      res.status(500).json({ error: "Failed to update user status" });
    }
  });
  app2.post("/api/admin/users/:userId/change-plan", requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const { planId, durationMonths } = req.body;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const plan = await db.query.subscriptionPlans.findFirst({
        where: eq5(subscriptionPlans.id, planId)
      });
      if (!plan) {
        return res.status(404).json({ error: "Plan not found" });
      }
      const existingSub = await db.query.userSubscriptions.findFirst({
        where: and(
          eq5(userSubscriptions.userId, userId),
          eq5(userSubscriptions.status, "active")
        )
      });
      const now = /* @__PURE__ */ new Date();
      const endDate = new Date(now);
      endDate.setMonth(endDate.getMonth() + parseInt(durationMonths));
      if (existingSub) {
        await db.update(userSubscriptions).set({
          planId,
          status: "active",
          startDate: now,
          endDate,
          updatedAt: now
        }).where(eq5(userSubscriptions.id, existingSub.id));
      } else {
        await db.insert(userSubscriptions).values({
          userId,
          planId,
          status: "active",
          startDate: now,
          endDate,
          createdAt: now,
          updatedAt: now
        });
      }
      await db.insert(adminActivityLogs).values({
        adminId: req.user.id,
        action: "change_subscription",
        targetUserId: userId,
        details: `Changed ${user.email} to ${plan.name} for ${durationMonths} months`,
        createdAt: /* @__PURE__ */ new Date()
      });
      res.json({ success: true, message: "Subscription changed successfully" });
    } catch (error) {
      console.error("Admin change plan error:", error);
      res.status(500).json({ error: "Failed to change plan" });
    }
  });
  app2.post("/api/admin/users/:userId/add-payment", requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const { amount, method, notes } = req.body;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      await db.insert(billingHistory).values({
        userId,
        amount: amount.toString(),
        currency: "MYR",
        paymentMethod: method || "manual",
        status: "completed",
        description: notes || "Manual payment added by admin",
        createdAt: /* @__PURE__ */ new Date()
      });
      await db.insert(adminActivityLogs).values({
        adminId: req.user.id,
        action: "add_payment",
        targetUserId: userId,
        details: `Added manual payment RM ${amount} for ${user.email}`,
        createdAt: /* @__PURE__ */ new Date()
      });
      res.json({ success: true, message: "Payment record added successfully" });
    } catch (error) {
      console.error("Admin add payment error:", error);
      res.status(500).json({ error: "Failed to add payment record" });
    }
  });
  app2.get("/api/admin/users/:userId/activity", requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const activity = await db.select().from(adminActivityLogs).where(eq5(adminActivityLogs.targetUserId, userId)).orderBy(desc(adminActivityLogs.createdAt)).limit(50);
      res.json(activity);
    } catch (error) {
      console.error("Admin get activity error:", error);
      res.status(500).json({ error: "Failed to fetch activity logs" });
    }
  });
  app2.get("/api/admin/activity-logs", requireAdmin, async (req, res) => {
    try {
      const { page = 1, limit = 50 } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);
      const logs = await db.select({
        id: adminActivityLogs.id,
        adminId: adminActivityLogs.adminId,
        adminEmail: users.email,
        action: adminActivityLogs.action,
        targetUserId: adminActivityLogs.targetUserId,
        details: adminActivityLogs.details,
        createdAt: adminActivityLogs.createdAt
      }).from(adminActivityLogs).leftJoin(users, eq5(adminActivityLogs.adminId, users.id)).orderBy(desc(adminActivityLogs.createdAt)).limit(parseInt(limit)).offset(offset);
      const total = await db.select({ count: sql5`count(*)` }).from(adminActivityLogs);
      res.json({
        logs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total[0]?.count || 0,
          totalPages: Math.ceil((total[0]?.count || 0) / parseInt(limit))
        }
      });
    } catch (error) {
      console.error("Admin get logs error:", error);
      res.status(500).json({ error: "Failed to fetch activity logs" });
    }
  });
  app2.post("/api/admin/users/bulk-action", requireAdmin, async (req, res) => {
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
            case "suspend":
              await storage.updateUser(userId, { suspended: 1, updatedAt: /* @__PURE__ */ new Date() });
              break;
            case "activate":
              await storage.updateUser(userId, { suspended: 0, updatedAt: /* @__PURE__ */ new Date() });
              break;
            case "delete":
              if (userId !== req.user.id) {
                await db.delete(users).where(eq5(users.id, userId));
              }
              break;
            case "change_plan":
              break;
          }
          successCount++;
        } catch (err) {
          errors.push({ userId, error: err.message });
        }
      }
      await db.insert(adminActivityLogs).values({
        adminId: req.user.id,
        action: `bulk_${action}`,
        details: `Bulk ${action} on ${successCount} users`,
        createdAt: /* @__PURE__ */ new Date()
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
  app2.get("/api/admin/analytics/revenue", requireAdmin, async (req, res) => {
    try {
      const billingHistory2 = await db.select().from(billingHistory2);
      const revenueByMonth = {};
      billingHistory2.forEach((record) => {
        const month = new Date(record.createdAt).toISOString().substring(0, 7);
        revenueByMonth[month] = (revenueByMonth[month] || 0) + parseFloat(record.amount || "0");
      });
      const chartData = Object.entries(revenueByMonth).sort(([a], [b]) => a.localeCompare(b)).slice(-12).map(([month, amount]) => ({
        month,
        revenue: amount
      }));
      res.json(chartData);
    } catch (error) {
      console.error("Admin revenue analytics error:", error);
      res.status(500).json({ error: "Failed to fetch revenue analytics" });
    }
  });
  app2.get("/api/loyalty/customer/:phone", requireAuth, blockExpiredTrial, requireLoyaltyPoints, async (req, res) => {
    try {
      const { phone } = req.params;
      const customer = await storage.getCustomerByPhone(req.user.id, phone);
      res.json(customer || null);
    } catch (error) {
      console.error("Get customer error:", error);
      res.status(500).json({ error: "Failed to get customer" });
    }
  });
  app2.post("/api/loyalty/customer", requireAuth, blockExpiredTrial, requireLoyaltyPoints, async (req, res) => {
    try {
      const customerSchema = z.object({
        name: z.string().min(1),
        phone: z.string().min(1)
      });
      const data = customerSchema.parse(req.body);
      const existing = await storage.getCustomerByPhone(req.user.id, data.phone);
      if (existing) {
        return res.status(400).json({ error: "Nombor telefon sudah didaftarkan" });
      }
      const customer = await storage.createCustomer(req.user.id, {
        ...data,
        loyaltyPoints: 0
      });
      res.json(customer);
    } catch (error) {
      console.error("Create customer error:", error);
      res.status(500).json({ error: "Failed to create customer" });
    }
  });
  app2.get("/api/loyalty/customers", requireAuth, blockExpiredTrial, requireLoyaltyPoints, async (req, res) => {
    try {
      const customers2 = await storage.getCustomers(req.user.id);
      res.json(customers2);
    } catch (error) {
      console.error("Get customers error:", error);
      res.status(500).json({ error: "Failed to get customers" });
    }
  });
  app2.get("/api/loyalty/history/:customerId", requireAuth, blockExpiredTrial, requireLoyaltyPoints, async (req, res) => {
    try {
      const { customerId } = req.params;
      const limit = parseInt(req.query.limit) || 50;
      const history = await storage.getPointsHistory(req.user.id, customerId, limit);
      res.json(history);
    } catch (error) {
      console.error("Get points history error:", error);
      res.status(500).json({ error: "Failed to get points history" });
    }
  });
  app2.post("/api/loyalty/redeem", requireAuth, blockExpiredTrial, requireLoyaltyPoints, async (req, res) => {
    try {
      const redeemSchema = z.object({
        customerId: z.string(),
        points: z.number().positive(),
        description: z.string()
      });
      const data = redeemSchema.parse(req.body);
      await storage.redeemPoints(req.user.id, data.customerId, data.points, data.description);
      const customerRecord = (await db.select().from(customers).where(eq5(customers.id, data.customerId)))[0];
      const customer = await storage.getCustomerByPhone(req.user.id, customerRecord?.phone || "");
      res.json(customer);
    } catch (error) {
      console.error("Redeem points error:", error);
      if (error.message === "Insufficient points") {
        return res.status(400).json({ error: "Mata ganjaran tidak mencukupi" });
      }
      res.status(500).json({ error: "Failed to redeem points" });
    }
  });
  app2.get("/api/broadcast/templates", requireAuth, blockExpiredTrial, requireWhatsappBroadcast, async (req, res) => {
    try {
      const channel = req.query.channel;
      const templates = await storage.getMessageTemplates(req.user.id, channel);
      res.json(templates);
    } catch (error) {
      console.error("Get templates error:", error);
      res.status(500).json({ error: "Failed to get templates" });
    }
  });
  app2.post("/api/broadcast/templates", requireAuth, blockExpiredTrial, requireWhatsappBroadcast, async (req, res) => {
    try {
      const templateSchema = z.object({
        name: z.string().min(1),
        type: z.enum(["promo", "new_product", "voucher", "general"]),
        subject: z.string().optional(),
        message: z.string().min(1),
        channel: z.enum(["email", "whatsapp", "sms"])
      });
      const data = templateSchema.parse(req.body);
      const template = await storage.createMessageTemplate(req.user.id, data);
      res.json(template);
    } catch (error) {
      console.error("Create template error:", error);
      res.status(500).json({ error: "Failed to create template" });
    }
  });
  app2.put("/api/broadcast/templates/:id", requireAuth, blockExpiredTrial, requireWhatsappBroadcast, async (req, res) => {
    try {
      const { id } = req.params;
      const template = await storage.updateMessageTemplate(req.user.id, id, req.body);
      res.json(template);
    } catch (error) {
      console.error("Update template error:", error);
      res.status(500).json({ error: "Failed to update template" });
    }
  });
  app2.delete("/api/broadcast/templates/:id", requireAuth, blockExpiredTrial, requireWhatsappBroadcast, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteMessageTemplate(req.user.id, id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete template error:", error);
      res.status(500).json({ error: "Failed to delete template" });
    }
  });
  app2.post("/api/broadcast/campaigns", requireAuth, blockExpiredTrial, requireWhatsappBroadcast, async (req, res) => {
    try {
      const campaignSchema = z.object({
        name: z.string().min(1),
        channel: z.enum(["email", "whatsapp", "sms"]),
        subject: z.string().optional(),
        message: z.string().min(1),
        targetSegment: z.enum(["all", "high_points", "recent_buyers", "custom"]),
        targetCustomerIds: z.array(z.string()).optional(),
        status: z.enum(["draft", "pending", "sending", "sent", "failed"]).default("draft"),
        scheduledAt: z.string().optional()
      });
      const data = campaignSchema.parse(req.body);
      if (data.targetSegment === "custom" && (!data.targetCustomerIds || data.targetCustomerIds.length === 0)) {
        return res.status(400).json({ error: "Custom segment requires customer IDs" });
      }
      const campaign = await storage.createBroadcastCampaign(req.user.id, data);
      res.json(campaign);
    } catch (error) {
      console.error("Create campaign error:", error);
      res.status(500).json({ error: "Failed to create campaign" });
    }
  });
  app2.get("/api/broadcast/campaigns", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const campaigns = await storage.getBroadcastCampaigns(req.user.id, limit);
      res.json(campaigns);
    } catch (error) {
      console.error("Get campaigns error:", error);
      res.status(500).json({ error: "Failed to get campaigns" });
    }
  });
  app2.get("/api/broadcast/campaigns/:id", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const { id } = req.params;
      const campaign = await storage.getBroadcastCampaignById(req.user.id, id);
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }
      res.json(campaign);
    } catch (error) {
      console.error("Get campaign error:", error);
      res.status(500).json({ error: "Failed to get campaign" });
    }
  });
  app2.put("/api/broadcast/campaigns/:id", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const { id } = req.params;
      const campaign = await storage.updateBroadcastCampaign(req.user.id, id, req.body);
      res.json(campaign);
    } catch (error) {
      console.error("Update campaign error:", error);
      res.status(500).json({ error: "Failed to update campaign" });
    }
  });
  app2.delete("/api/broadcast/campaigns/:id", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteBroadcastCampaign(req.user.id, id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete campaign error:", error);
      res.status(500).json({ error: "Failed to delete campaign" });
    }
  });
  app2.get("/api/broadcast/segments/:segment", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const { segment } = req.params;
      const customIds = req.query.ids ? req.query.ids.split(",") : void 0;
      const customers2 = await storage.getCustomerSegment(req.user.id, segment, customIds);
      res.json({ count: customers2.length, customers: customers2 });
    } catch (error) {
      console.error("Get segment error:", error);
      res.status(500).json({ error: "Failed to get segment" });
    }
  });
  app2.post("/api/broadcast/campaigns/:id/send", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.sendBroadcast(req.user.id, id);
      const campaign = await storage.getBroadcastCampaignById(req.user.id, id);
      res.json({
        success: true,
        message: `Broadcast sedang dihantar kepada ${campaign.totalRecipients} pelanggan`,
        campaign
      });
    } catch (error) {
      console.error("Send broadcast error:", error);
      res.status(500).json({ error: error.message || "Failed to send broadcast" });
    }
  });
  app2.get("/api/broadcast/campaigns/:id/messages", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const { id } = req.params;
      const messages = await storage.getBroadcastMessages(id);
      res.json(messages);
    } catch (error) {
      console.error("Get broadcast messages error:", error);
      res.status(500).json({ error: "Failed to get messages" });
    }
  });
  app2.post("/api/vouchers", requireAuth, blockExpiredTrial, requireLoyaltyPoints, async (req, res) => {
    try {
      const voucherSchema = insertCustomerVoucherSchema.extend({
        validFrom: z.string().optional(),
        validUntil: z.string().optional().nullable()
      });
      const data = voucherSchema.parse(req.body);
      const voucherData = {
        ...data,
        validFrom: data.validFrom ? new Date(data.validFrom) : /* @__PURE__ */ new Date(),
        validUntil: data.validUntil ? new Date(data.validUntil) : null
      };
      const voucher = await storage.createVoucher(req.user.id, voucherData);
      res.json(voucher);
    } catch (error) {
      console.error("Create voucher error:", error);
      if (error.issues) {
        return res.status(400).json({
          error: "Data voucher tidak sah",
          details: error.issues.map((i) => `${i.path.join(".")}: ${i.message}`)
        });
      }
      res.status(500).json({ error: error.message || "Failed to create voucher" });
    }
  });
  app2.get("/api/vouchers", requireAuth, blockExpiredTrial, requireLoyaltyPoints, async (req, res) => {
    try {
      const vouchers = await storage.getVouchers(req.user.id);
      res.json(vouchers);
    } catch (error) {
      console.error("Get vouchers error:", error);
      res.status(500).json({ error: "Failed to get vouchers" });
    }
  });
  app2.get("/api/vouchers/:id", requireAuth, blockExpiredTrial, requireLoyaltyPoints, async (req, res) => {
    try {
      const voucher = await storage.getVoucherById(req.user.id, req.params.id);
      if (!voucher) return res.status(404).json({ error: "Voucher not found" });
      res.json(voucher);
    } catch (error) {
      console.error("Get voucher error:", error);
      res.status(500).json({ error: "Failed to get voucher" });
    }
  });
  app2.put("/api/vouchers/:id", requireAuth, blockExpiredTrial, requireLoyaltyPoints, async (req, res) => {
    try {
      const voucher = await storage.updateVoucher(req.user.id, req.params.id, req.body);
      res.json(voucher);
    } catch (error) {
      console.error("Update voucher error:", error);
      res.status(500).json({ error: "Failed to update voucher" });
    }
  });
  app2.delete("/api/vouchers/:id", requireAuth, blockExpiredTrial, requireLoyaltyPoints, async (req, res) => {
    try {
      await storage.deleteVoucher(req.user.id, req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete voucher error:", error);
      res.status(500).json({ error: "Failed to delete voucher" });
    }
  });
  app2.post("/api/vouchers/validate", requireAuth, blockExpiredTrial, requireLoyaltyPoints, async (req, res) => {
    try {
      const { code, customerId, totalAmount } = req.body;
      const result = await storage.validateVoucher(req.user.id, code, customerId || null, parseFloat(totalAmount));
      res.json(result);
    } catch (error) {
      console.error("Validate voucher error:", error);
      res.status(500).json({ error: "Failed to validate voucher" });
    }
  });
  app2.get("/api/vouchers/:id/usage", requireAuth, blockExpiredTrial, requireLoyaltyPoints, async (req, res) => {
    try {
      const usage = await storage.getVoucherUsageHistory(req.user.id, req.params.id);
      res.json(usage);
    } catch (error) {
      console.error("Get voucher usage error:", error);
      res.status(500).json({ error: "Failed to get usage history" });
    }
  });
  app2.post("/api/bookings", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const { items, ...booking } = req.body;
      const newBooking = await storage.createBooking(req.user.id, booking, items || []);
      await storage.createNotification({
        userId: req.user.id,
        type: "booking",
        priority: "high",
        title: "Tempahan Baru",
        message: `${booking.customerName} - ${booking.deliveryType === "pickup" ? "Self Pickup" : "Delivery"} pada ${new Date(booking.pickupDate).toLocaleDateString("ms-MY")}`,
        actionUrl: `/bookings/${newBooking.id}`,
        metadata: { bookingId: newBooking.id }
      });
      res.json(newBooking);
    } catch (error) {
      console.error("Create booking error:", error);
      res.status(500).json({ error: "Failed to create booking" });
    }
  });
  app2.get("/api/bookings", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const status = req.query.status;
      const bookings2 = await storage.getBookings(req.user.id, limit, status);
      res.json(bookings2);
    } catch (error) {
      console.error("Get bookings error:", error);
      res.status(500).json({ error: "Failed to get bookings" });
    }
  });
  app2.get("/api/bookings/upcoming", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const daysAhead = parseInt(req.query.days) || 7;
      const bookings2 = await storage.getUpcomingBookings(req.user.id, daysAhead);
      res.json(bookings2);
    } catch (error) {
      console.error("Get upcoming bookings error:", error);
      res.status(500).json({ error: "Failed to get upcoming bookings" });
    }
  });
  app2.get("/api/bookings/:id", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const booking = await storage.getBookingById(req.user.id, req.params.id);
      if (!booking) return res.status(404).json({ error: "Booking not found" });
      res.json(booking);
    } catch (error) {
      console.error("Get booking error:", error);
      res.status(500).json({ error: "Failed to get booking" });
    }
  });
  app2.put("/api/bookings/:id", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const oldBooking = await storage.getBookingById(req.user.id, req.params.id);
      const booking = await storage.updateBooking(req.user.id, req.params.id, req.body);
      if (oldBooking && req.body.status && oldBooking.status !== req.body.status) {
        if (req.body.status === "ready") {
          await storage.createNotification({
            userId: req.user.id,
            type: "booking",
            priority: "high",
            title: "Tempahan Siap",
            message: `Tempahan ${booking.customerName} telah siap untuk ${booking.deliveryType === "pickup" ? "diambil" : "dihantar"}`,
            actionUrl: `/bookings/${booking.id}`,
            metadata: { bookingId: booking.id }
          });
        } else if (req.body.status === "completed") {
          await storage.createNotification({
            userId: req.user.id,
            type: "booking",
            priority: "medium",
            title: "Tempahan Selesai",
            message: `Tempahan ${booking.customerName} telah diselesaikan`,
            actionUrl: `/bookings/${booking.id}`,
            metadata: { bookingId: booking.id }
          });
        }
      }
      res.json(booking);
    } catch (error) {
      console.error("Update booking error:", error);
      res.status(500).json({ error: "Failed to update booking" });
    }
  });
  app2.delete("/api/bookings/:id", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      await storage.deleteBooking(req.user.id, req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete booking error:", error);
      res.status(500).json({ error: "Failed to delete booking" });
    }
  });
  app2.post("/api/bookings/:id/reminder", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      await storage.markReminderSent(req.user.id, req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Mark reminder sent error:", error);
      res.status(500).json({ error: "Failed to mark reminder sent" });
    }
  });
  app2.post("/api/vendor-sales", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const sale = await storage.createVendorSale(req.user.id, req.body);
      res.json(sale);
    } catch (error) {
      console.error("Create vendor sale error:", error);
      res.status(500).json({ error: "Failed to create vendor sale" });
    }
  });
  app2.get("/api/vendor-sales", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const { vendorId, startDate, endDate, productId } = req.query;
      const filters = {};
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;
      if (productId) filters.productId = productId;
      const sales2 = await storage.getVendorSales(
        req.user.id,
        vendorId,
        filters
      );
      res.json(sales2);
    } catch (error) {
      console.error("Get vendor sales error:", error);
      res.status(500).json({ error: "Failed to get vendor sales" });
    }
  });
  app2.get("/api/vendor-sales/:id", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const sale = await storage.getVendorSaleById(req.user.id, req.params.id);
      if (!sale) return res.status(404).json({ error: "Vendor sale not found" });
      res.json(sale);
    } catch (error) {
      console.error("Get vendor sale error:", error);
      res.status(500).json({ error: "Failed to get vendor sale" });
    }
  });
  app2.put("/api/vendor-sales/:id", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const sale = await storage.updateVendorSale(req.user.id, req.params.id, req.body);
      res.json(sale);
    } catch (error) {
      console.error("Update vendor sale error:", error);
      res.status(500).json({ error: "Failed to update vendor sale" });
    }
  });
  app2.delete("/api/vendor-sales/:id", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      await storage.deleteVendorSale(req.user.id, req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete vendor sale error:", error);
      res.status(500).json({ error: "Failed to delete vendor sale" });
    }
  });
  app2.get("/api/vendors/:vendorId/sales", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const filters = {};
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;
      const sales2 = await storage.getVendorSales(req.user.id, req.params.vendorId, filters);
      res.json(sales2);
    } catch (error) {
      console.error("Get vendor sales error:", error);
      res.status(500).json({ error: "Failed to get vendor sales" });
    }
  });
  app2.get("/api/vendors/:vendorId/stock-balance", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const balance = await storage.getVendorStockBalance(req.params.vendorId, req.user.id);
      res.json(balance);
    } catch (error) {
      console.error("Get stock balance error:", error);
      res.status(500).json({ error: "Failed to get stock balance" });
    }
  });
  app2.get("/api/vendors/:vendorId/stock/:productId", requireAuth, blockExpiredTrial, async (req, res) => {
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
  app2.post("/api/vendor-claims", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const { claimData, items, photos } = req.body;
      if (!items || items.length === 0) {
        return res.status(400).json({ error: "Claim must have at least one item" });
      }
      if (!photos || photos.length === 0) {
        return res.status(400).json({ error: "Claim must have at least one photo" });
      }
      const claim = await storage.createVendorClaim(req.user.id, claimData, items, photos);
      res.json(claim);
    } catch (error) {
      console.error("Create vendor claim error:", error);
      res.status(500).json({ error: "Failed to create vendor claim" });
    }
  });
  app2.get("/api/vendor-claims", requireAuth, blockExpiredTrial, requireVendorClaims, async (req, res) => {
    try {
      const { vendorId, status, startDate, endDate } = req.query;
      const filters = {};
      if (vendorId) filters.vendorId = vendorId;
      if (status) filters.status = status;
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;
      const claims = await storage.getVendorClaims(req.user.id, filters);
      res.json(claims);
    } catch (error) {
      console.error("Get vendor claims error:", error);
      res.status(500).json({ error: "Failed to get vendor claims" });
    }
  });
  app2.get("/api/vendor-claims/:id", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const claim = await storage.getVendorClaimById(req.user.id, req.params.id);
      if (!claim) return res.status(404).json({ error: "Claim not found" });
      res.json(claim);
    } catch (error) {
      console.error("Get vendor claim error:", error);
      res.status(500).json({ error: "Failed to get vendor claim" });
    }
  });
  app2.patch("/api/vendor-claims/:id/approve", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const { reviewNotes } = req.body;
      const claim = await storage.approveVendorClaim(req.user.id, req.params.id, reviewNotes);
      res.json(claim);
    } catch (error) {
      console.error("Approve claim error:", error);
      res.status(500).json({ error: error.message || "Failed to approve claim" });
    }
  });
  app2.patch("/api/vendor-claims/:id/reject", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const { reviewNotes } = req.body;
      if (!reviewNotes) {
        return res.status(400).json({ error: "Review notes required for rejection" });
      }
      const claim = await storage.rejectVendorClaim(req.user.id, req.params.id, reviewNotes);
      res.json(claim);
    } catch (error) {
      console.error("Reject claim error:", error);
      res.status(500).json({ error: error.message || "Failed to reject claim" });
    }
  });
  app2.get("/api/vendors/:vendorId/claims", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const { status, startDate, endDate } = req.query;
      const filters = { vendorId: req.params.vendorId };
      if (status) filters.status = status;
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;
      const claims = await storage.getVendorClaims(req.user.id, filters);
      res.json(claims);
    } catch (error) {
      console.error("Get vendor claims error:", error);
      res.status(500).json({ error: "Failed to get vendor claims" });
    }
  });
  app2.post("/api/payment-claims", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const { vendorId, vendorName, claimDate, status, items, deliveryIds, notes } = req.body;
      if (!vendorId || !vendorName || !items || items.length === 0) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      const claim = await storage.createPaymentClaim(
        req.user.id,
        { vendorId, vendorName, claimDate, status, notes },
        items,
        deliveryIds || []
      );
      res.json(claim);
    } catch (error) {
      console.error("Create payment claim error:", error);
      res.status(500).json({ error: error.message || "Failed to create payment claim" });
    }
  });
  app2.get("/api/payment-claims", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const { vendorId, status, startDate, endDate } = req.query;
      const filters = {};
      if (vendorId) filters.vendorId = vendorId;
      if (status) filters.status = status;
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;
      const claims = await storage.getPaymentClaims(req.user.id, filters);
      res.json(claims);
    } catch (error) {
      console.error("Get payment claims error:", error);
      res.status(500).json({ error: "Failed to get payment claims" });
    }
  });
  app2.get("/api/payment-claims/:id", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const claim = await storage.getPaymentClaimById(req.user.id, req.params.id);
      if (!claim) {
        return res.status(404).json({ error: "Claim not found" });
      }
      res.json(claim);
    } catch (error) {
      console.error("Get payment claim error:", error);
      res.status(500).json({ error: "Failed to get payment claim" });
    }
  });
  app2.patch("/api/payment-claims/:id", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const claim = await storage.updatePaymentClaim(req.user.id, req.params.id, req.body);
      res.json(claim);
    } catch (error) {
      console.error("Update payment claim error:", error);
      res.status(500).json({ error: error.message || "Failed to update payment claim" });
    }
  });
  app2.delete("/api/payment-claims/:id", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      await storage.deletePaymentClaim(req.user.id, req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete payment claim error:", error);
      res.status(400).json({ error: error.message || "Failed to delete payment claim" });
    }
  });
  app2.patch("/api/payment-claims/:id/mark-paid", requireAuth, blockExpiredTrial, async (req, res) => {
    try {
      const claim = await storage.markPaymentClaimAsPaid(req.user.id, req.params.id);
      res.json(claim);
    } catch (error) {
      console.error("Mark paid error:", error);
      res.status(500).json({ error: error.message || "Failed to mark as paid" });
    }
  });
  app2.get("/api/store-settings", requireAuth, requirePublicStore, async (req, res) => {
    try {
      const settings = await storage.getStoreSettings(req.user.id);
      res.json(settings || null);
    } catch (error) {
      console.error("Get store settings error:", error);
      res.status(500).json({ error: "Failed to get store settings" });
    }
  });
  app2.post("/api/store-settings", requireAuth, requirePublicStore, async (req, res) => {
    try {
      const { insertStoreSettingsSchema: insertStoreSettingsSchema2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const validatedData = insertStoreSettingsSchema2.parse(req.body);
      const settings = await storage.createStoreSettings(req.user.id, validatedData);
      res.json(settings);
    } catch (error) {
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
  app2.put("/api/store-settings", requireAuth, requirePublicStore, async (req, res) => {
    try {
      const settings = await storage.updateStoreSettings(req.user.id, req.body);
      res.json(settings);
    } catch (error) {
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
  app2.delete("/api/store-settings", requireAuth, requirePublicStore, async (req, res) => {
    try {
      await storage.deleteStoreSettings(req.user.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete store settings error:", error);
      res.status(500).json({ error: "Failed to delete store settings" });
    }
  });
  app2.get("/api/public/store/:slug", async (req, res) => {
    try {
      return res.status(403).json({ message: "Public store feature is disabled for launch" });
      const { slug } = req.params;
      const store = await storage.getStoreSettingsBySlug(slug);
      if (!store) {
        return res.status(404).json({ error: "Store not found or inactive" });
      }
      const allProducts = await storage.getProducts(store.userId);
      let products2 = allProducts;
      if (!store.showOutOfStock) {
        products2 = products2.filter((p) => parseFloat(p.sellingPrice) > 0);
      }
      const categories2 = await storage.getCategories(store.userId);
      const visitorId = req.headers["x-visitor-id"];
      const referrer = req.headers.referer || req.headers.referrer;
      const userAgent = req.headers["user-agent"];
      await storage.trackStoreAnalytics(store.id, "view", {
        visitorId,
        referrer,
        userAgent
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
          accentColor: store.accentColor
        },
        products: products2,
        categories: categories2
      });
    } catch (error) {
      console.error("Get public store error:", error);
      res.status(500).json({ error: "Failed to load store" });
    }
  });
  app2.post("/api/public/store/:slug/track", async (req, res) => {
    try {
      return res.status(403).json({ message: "Public store feature is disabled for launch" });
      const { slug } = req.params;
      const { eventType, productId } = req.body;
      const store = await storage.getStoreSettingsBySlug(slug);
      if (!store) {
        return res.status(404).json({ error: "Store not found" });
      }
      const visitorId = req.headers["x-visitor-id"];
      const referrer = req.headers.referer || req.headers.referrer;
      const userAgent = req.headers["user-agent"];
      await storage.trackStoreAnalytics(store.id, eventType, {
        productId,
        visitorId,
        referrer,
        userAgent
      });
      res.json({ success: true });
    } catch (error) {
      console.error("Track store analytics error:", error);
      res.status(500).json({ error: "Failed to track event" });
    }
  });
  app2.get("/api/notifications", requireAuth, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit) : 50;
      const notifications3 = await storage.getUserNotifications(req.user.id, limit);
      res.json(notifications3);
    } catch (error) {
      console.error("Get notifications error:", error);
      res.status(500).json({ error: "Failed to get notifications" });
    }
  });
  app2.get("/api/notifications/unread-count", requireAuth, async (req, res) => {
    try {
      const count = await storage.getUnreadNotificationCount(req.user.id);
      res.json({ count });
    } catch (error) {
      console.error("Get unread count error:", error);
      res.status(500).json({ error: "Failed to get unread count" });
    }
  });
  app2.post("/api/notifications/:id/mark-read", requireAuth, async (req, res) => {
    try {
      const notification = await storage.markNotificationAsRead(req.user.id, req.params.id);
      res.json(notification);
    } catch (error) {
      console.error("Mark notification as read error:", error);
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  });
  app2.post("/api/notifications/mark-all-read", requireAuth, async (req, res) => {
    try {
      await storage.markAllNotificationsAsRead(req.user.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Mark all notifications as read error:", error);
      res.status(500).json({ error: "Failed to mark all notifications as read" });
    }
  });
  app2.delete("/api/notifications/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteNotification(req.user.id, req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete notification error:", error);
      res.status(500).json({ error: "Failed to delete notification" });
    }
  });
  app2.post("/api/notifications", requireAuth, async (req, res) => {
    try {
      const notification = await storage.createNotification({
        userId: req.user.id,
        ...req.body
      });
      res.json(notification);
    } catch (error) {
      console.error("Create notification error:", error);
      res.status(500).json({ error: "Failed to create notification" });
    }
  });
  app2.get("/api/notifications", requireAuth, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const notifications3 = await storage.getUserNotifications(req.user.id, limit);
      res.json(notifications3);
    } catch (error) {
      console.error("Get notifications error:", error);
      res.status(500).json({ error: "Failed to get notifications" });
    }
  });
  app2.get("/api/notifications/unread-count", requireAuth, async (req, res) => {
    try {
      const count = await storage.getUnreadNotificationCount(req.user.id);
      res.json({ count });
    } catch (error) {
      console.error("Get unread count error:", error);
      res.status(500).json({ error: "Failed to get unread count" });
    }
  });
  app2.post("/api/notifications/:id/mark-read", requireAuth, async (req, res) => {
    try {
      const notification = await storage.markNotificationAsRead(req.user.id, req.params.id);
      if (!notification) {
        return res.status(404).json({ error: "Notification not found" });
      }
      res.json(notification);
    } catch (error) {
      console.error("Mark notification as read error:", error);
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  });
  app2.post("/api/notifications/mark-all-read", requireAuth, async (req, res) => {
    try {
      await storage.markAllNotificationsAsRead(req.user.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Mark all as read error:", error);
      res.status(500).json({ error: "Failed to mark all as read" });
    }
  });
  app2.delete("/api/notifications/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteNotification(req.user.id, req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete notification error:", error);
      res.status(500).json({ error: "Failed to delete notification" });
    }
  });
  app2.delete("/api/notifications/clear-read", requireAuth, async (req, res) => {
    try {
      await db.delete(notifications).where(and(
        eq5(notifications.userId, req.user.id),
        eq5(notifications.read, 1)
      ));
      res.json({ success: true });
    } catch (error) {
      console.error("Clear read notifications error:", error);
      res.status(500).json({ error: "Failed to clear read notifications" });
    }
  });
  app2.post("/api/notifications", requireAuth, async (req, res) => {
    try {
      const notification = await storage.createNotification({
        userId: req.user.id,
        ...req.body
      });
      res.json(notification);
    } catch (error) {
      console.error("Create notification error:", error);
      res.status(500).json({ error: "Failed to create notification" });
    }
  });
  const { registerCronEndpoints: registerCronEndpoints2 } = await Promise.resolve().then(() => (init_cron(), cron_exports));
  registerCronEndpoints2(app2);
  const httpServer = createServer(app2);
  return httpServer;
}

// server/index.ts
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
dotenv2.config();
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var app = express();
async function validateEnvironment() {
  const missing = [];
  if (!process.env.DATABASE_URL) missing.push("DATABASE_URL");
  if (!process.env.SESSION_SECRET) missing.push("SESSION_SECRET");
  if (missing.length) {
    throw new Error(`Missing required env vars: ${missing.join(", ")}`);
  }
  try {
    const { Pool: Pool3 } = await import("pg");
    const pool2 = new Pool3({
      connectionString: process.env.DATABASE_URL,
      connectionTimeoutMillis: 1e4,
      // 10 second timeout
      ssl: { rejectUnauthorized: false }
      // Allow self-signed certs for Neon
    });
    await pool2.query("SELECT 1");
    await pool2.end();
    log("\u2713 Database reachable");
  } catch (err) {
    log(`\u26A0\uFE0F  Database connectivity check failed: ${err.message}`);
  }
  if (process.env.REDIS_URL) {
    try {
      const { redis: redis2 } = await Promise.resolve().then(() => (init_redis(), redis_exports));
      if (redis2) {
        await redis2.ping();
        log("\u2713 Redis reachable");
      }
    } catch (err) {
      log(`\u26A0\uFE0F  Redis connectivity check failed: ${err.message}`);
    }
  }
}
function serveStatic(app2) {
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || "development",
    integrations: [
      // Express integration for automatic error tracking
      Sentry.expressIntegration({ app }),
      // Profiling
      nodeProfilingIntegration()
    ],
    // Performance Monitoring
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1,
    // 10% in prod, 100% in dev
    // Profiling
    profilesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1
  });
  log("\u2713 Sentry error monitoring initialized");
} else {
  log("\u26A0\uFE0F  Sentry DSN not configured - error monitoring disabled");
}
async function setupTestApp() {
  await registerRoutes(app);
  return app;
}
app.use(express.json({
  verify: (req, _res, buf) => {
    try {
      req.rawBody = buf.toString("utf8");
    } catch {
    }
  }
}));
app.use(express.urlencoded({ extended: false }));
app.use(helmet({
  // Strict-Transport-Security: Force HTTPS (only in production)
  hsts: {
    maxAge: 31536e3,
    // 1 year
    includeSubDomains: true,
    preload: true
  },
  // Content-Security-Policy: Prevent XSS attacks
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "blob:"],
      // Added blob: for workers
      workerSrc: ["'self'", "blob:"],
      // Added worker-src
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: [
        "'self'",
        "https://api.pocketbizz.my",
        "https://app.pocketbizz.my",
        "https://fonts.googleapis.com",
        "https://fonts.gstatic.com",
        "https://*.ingest.us.sentry.io"
        // Allow Sentry
      ],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === "production" ? [] : null
    }
  },
  // X-Frame-Options: Prevent clickjacking
  frameguard: {
    action: "deny"
  },
  // X-Content-Type-Options: Prevent MIME sniffing
  noSniff: true,
  // Referrer-Policy: Control referrer information
  referrerPolicy: {
    policy: "strict-origin-when-cross-origin"
  },
  // Permissions-Policy: Control browser features
  permittedCrossDomainPolicies: {
    permittedPolicies: "none"
  }
}));
app.use((_req, res, next) => {
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=()"
  );
  res.setHeader("X-XSS-Protection", "1; mode=block");
  next();
});
log("\u2713 Security headers configured (Helmet + custom policies)");
app.set("trust proxy", 1);
var sessionStore;
if (redis) {
  sessionStore = new RedisStore({
    client: redis,
    prefix: "pocketbizz:sess:",
    ttl: 30 * 24 * 60 * 60
    // 30 days in seconds
  });
  log("\u2713 Using Redis for session storage");
} else {
  const PgSession = ConnectPgSimple(session);
  const pgPool = new Pool2({
    connectionString: process.env.DATABASE_URL
  });
  sessionStore = new PgSession({
    pool: pgPool,
    createTableIfMissing: true
  });
  log("\u26A0\uFE0F  Using PostgreSQL for session storage (Redis not configured)");
}
app.use(
  session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET || "pocketbizz-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    rolling: true,
    // Reset maxAge on every response
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1e3,
      // 7 days (reduced from 30 for better security)
      path: "/",
      // Explicitly set cookie path
      domain: process.env.NODE_ENV === "production" ? ".pocketbizz.my" : void 0
      // Allow subdomains in production
    },
    proxy: true,
    // Trust the reverse proxy for secure cookie handling
    name: "pocketbizz.sid"
    // Custom session cookie name to avoid conflicts
  })
);
app.use((req, res, next) => {
  const start = Date.now();
  const path2 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path2.startsWith("/api")) {
      let logLine = `${req.method} ${path2} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
if (process.env.NODE_ENV !== "test") {
  (async () => {
    try {
      await validateEnvironment();
      const server = await registerRoutes(app);
      app.use((err, _req, res, _next) => {
        const status = err.status || err.statusCode || 500;
        const message = err.message || "Internal Server Error";
        res.status(status).json({ message });
        throw err;
      });
      if (app.get("env") === "development") {
        const { setupVite } = await import("./vite");
        await setupVite(app, server);
      } else {
        serveStatic(app);
      }
      const port = parseInt(process.env.PORT || "5000", 10);
      server.listen({
        port,
        host: "0.0.0.0"
      }, () => {
        log(`serving on port ${port}`);
      });
    } catch (error) {
      console.error("\u274C Fatal startup error:", error.message);
      console.error(error.stack);
      process.exit(1);
    }
  })();
}
export {
  setupTestApp
};

CREATE TYPE "public"."billing_status" AS ENUM('succeeded', 'failed', 'pending', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."commission_type" AS ENUM('fixed_range', 'percentage');--> statement-breakpoint
CREATE TYPE "public"."delivery_status" AS ENUM('delivered', 'claimed', 'pending', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."expense_category" AS ENUM('bahan', 'minyak', 'upah', 'plastik', 'lain');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'partial', 'settled');--> statement-breakpoint
CREATE TYPE "public"."promo_code_type" AS ENUM('percentage', 'fixed_amount');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('active', 'canceled', 'past_due', 'trialing', 'incomplete', 'expired');--> statement-breakpoint
CREATE TABLE "billing_history" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "user_id" varchar NOT NULL,
        "subscription_id" varchar,
        "amount" numeric(10, 2) NOT NULL,
        "currency" text DEFAULT 'MYR' NOT NULL,
        "status" "billing_status" NOT NULL,
        "stripe_invoice_id" text,
        "stripe_payment_intent_id" text,
        "description" text,
        "invoice_url" text,
        "paid_at" timestamp,
        "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "business_profile" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "business_name" text NOT NULL,
        "registration_number" text,
        "address" text,
        "phone" text,
        "email" text,
        "tagline" text,
        "bank_name" text,
        "account_number" text,
        "account_name" text,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "name" text NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "deliveries" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "invoice_number" text,
        "vendor_id" varchar NOT NULL,
        "vendor_name" text NOT NULL,
        "delivery_date" date NOT NULL,
        "status" "delivery_status" DEFAULT 'delivered' NOT NULL,
        "payment_status" "payment_status" DEFAULT 'pending' NOT NULL,
        "total_amount" numeric(10, 2) NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "deliveries_invoice_number_unique" UNIQUE("invoice_number")
);
--> statement-breakpoint
CREATE TABLE "delivery_items" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "delivery_id" varchar NOT NULL,
        "product_id" varchar NOT NULL,
        "product_name" text NOT NULL,
        "quantity" integer NOT NULL,
        "unit_price" numeric(10, 2) NOT NULL,
        "retail_price" numeric(10, 2),
        "total_price" numeric(10, 2) NOT NULL,
        "rejected_qty" integer DEFAULT 0,
        "rejection_reason" text
);
--> statement-breakpoint
CREATE TABLE "expenses" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "category" "expense_category" NOT NULL,
        "description" text NOT NULL,
        "amount" numeric(10, 2) NOT NULL,
        "expense_date" date NOT NULL,
        "receipt_url" text,
        "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "google_drive_sync_log" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "delivery_id" varchar,
        "file_name" text NOT NULL,
        "file_type" text NOT NULL,
        "drive_file_id" text NOT NULL,
        "drive_web_view_link" text,
        "synced_at" timestamp DEFAULT now() NOT NULL,
        "vendor_id" varchar,
        "vendor_name" text
);
--> statement-breakpoint
CREATE TABLE "ingredients" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "product_id" varchar NOT NULL,
        "name" text NOT NULL,
        "quantity" text NOT NULL,
        "unit_price" numeric(10, 2) NOT NULL,
        "total_cost" numeric(10, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "production_batches" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "product_id" varchar NOT NULL,
        "product_name" text NOT NULL,
        "quantity" integer NOT NULL,
        "remaining_qty" numeric(10, 2) DEFAULT '0' NOT NULL,
        "batch_date" date NOT NULL,
        "expiry_date" date,
        "total_cost" numeric(10, 2) NOT NULL,
        "notes" text,
        "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "name" text NOT NULL,
        "category" text NOT NULL,
        "image_url" text,
        "units_per_batch" integer DEFAULT 1 NOT NULL,
        "labour_cost" numeric(10, 2) DEFAULT '0' NOT NULL,
        "other_costs" numeric(10, 2) DEFAULT '0' NOT NULL,
        "materials_cost" numeric(10, 2) DEFAULT '0' NOT NULL,
        "total_cost_per_batch" numeric(10, 2) DEFAULT '0' NOT NULL,
        "cost_per_unit" numeric(10, 2) DEFAULT '0' NOT NULL,
        "suggested_margin" numeric(5, 2) DEFAULT '30' NOT NULL,
        "suggested_price" numeric(10, 2) DEFAULT '0' NOT NULL,
        "selling_price" numeric(10, 2) DEFAULT '0' NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "promo_codes" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "code" text NOT NULL,
        "name" text NOT NULL,
        "discount_type" "promo_code_type" NOT NULL,
        "discount_value" numeric(10, 2) NOT NULL,
        "max_uses" integer,
        "current_uses" integer DEFAULT 0 NOT NULL,
        "expires_at" timestamp,
        "is_active" integer DEFAULT 1 NOT NULL,
        "stripe_coupon_id" text,
        "created_at" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "promo_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "recipe_items" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "product_id" varchar NOT NULL,
        "stock_item_id" varchar NOT NULL,
        "quantity_needed" numeric(10, 2) NOT NULL,
        "usage_unit" text NOT NULL,
        "cost_per_recipe" numeric(10, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sales" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "vendor_id" varchar,
        "vendor_name" text,
        "product_id" varchar,
        "product_name" text NOT NULL,
        "quantity" integer NOT NULL,
        "unit_price" numeric(10, 2) NOT NULL,
        "total_amount" numeric(10, 2) NOT NULL,
        "sale_date" date NOT NULL,
        "is_paid" integer DEFAULT 0 NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shopping_cart" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "stock_item_id" varchar NOT NULL,
        "stock_item_name" text NOT NULL,
        "shortage_qty" numeric(10, 2) NOT NULL,
        "unit" text NOT NULL,
        "production_batch_id" varchar,
        "product_name" text,
        "notes" text,
        "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stock_items" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "name" text NOT NULL,
        "unit" text NOT NULL,
        "package_size" numeric(10, 2) DEFAULT '1' NOT NULL,
        "purchase_price" numeric(10, 2) NOT NULL,
        "current_quantity" numeric(10, 2) DEFAULT '0' NOT NULL,
        "low_stock_threshold" numeric(10, 2) DEFAULT '5' NOT NULL,
        "notes" text,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscription_plans" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "name" text NOT NULL,
        "display_name" text NOT NULL,
        "description" text,
        "price" numeric(10, 2) NOT NULL,
        "currency" text DEFAULT 'MYR' NOT NULL,
        "interval" text DEFAULT 'month' NOT NULL,
        "features" text,
        "stripe_price_id" text,
        "stripe_product_id" text,
        "max_users" integer DEFAULT 1,
        "max_products" integer DEFAULT 100,
        "is_active" integer DEFAULT 1 NOT NULL,
        "sort_order" integer DEFAULT 0,
        "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_subscriptions" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "user_id" varchar NOT NULL,
        "plan_id" varchar NOT NULL,
        "stripe_subscription_id" text,
        "status" "subscription_status" DEFAULT 'active' NOT NULL,
        "current_period_start" timestamp,
        "current_period_end" timestamp,
        "cancel_at_period_end" integer DEFAULT 0 NOT NULL,
        "canceled_at" timestamp,
        "is_early_bird" integer DEFAULT 0 NOT NULL,
        "early_bird_ends_at" timestamp,
        "loyalty_rate" numeric(10, 2),
        "metadata" text,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "email" text NOT NULL,
        "password" text NOT NULL,
        "name" text NOT NULL,
        "business_name" text,
        "phone" text,
        "stripe_customer_id" text,
        "is_admin" integer DEFAULT 0 NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "vendor_commissions" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "vendor_id" varchar NOT NULL,
        "commission_type" "commission_type" NOT NULL,
        "percentage" numeric(5, 2),
        "ranges" text,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vendors" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "name" text NOT NULL,
        "phone" text,
        "address" text,
        "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "billing_history" ADD CONSTRAINT "billing_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_history" ADD CONSTRAINT "billing_history_subscription_id_user_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."user_subscriptions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_items" ADD CONSTRAINT "delivery_items_delivery_id_deliveries_id_fk" FOREIGN KEY ("delivery_id") REFERENCES "public"."deliveries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_items" ADD CONSTRAINT "delivery_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "google_drive_sync_log" ADD CONSTRAINT "google_drive_sync_log_delivery_id_deliveries_id_fk" FOREIGN KEY ("delivery_id") REFERENCES "public"."deliveries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "google_drive_sync_log" ADD CONSTRAINT "google_drive_sync_log_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ingredients" ADD CONSTRAINT "ingredients_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_batches" ADD CONSTRAINT "production_batches_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_items" ADD CONSTRAINT "recipe_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_items" ADD CONSTRAINT "recipe_items_stock_item_id_stock_items_id_fk" FOREIGN KEY ("stock_item_id") REFERENCES "public"."stock_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shopping_cart" ADD CONSTRAINT "shopping_cart_stock_item_id_stock_items_id_fk" FOREIGN KEY ("stock_item_id") REFERENCES "public"."stock_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shopping_cart" ADD CONSTRAINT "shopping_cart_production_batch_id_production_batches_id_fk" FOREIGN KEY ("production_batch_id") REFERENCES "public"."production_batches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_plan_id_subscription_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."subscription_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_commissions" ADD CONSTRAINT "vendor_commissions_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;
CREATE TYPE "public"."booking_delivery_type" AS ENUM('pickup', 'delivery');--> statement-breakpoint
CREATE TYPE "public"."booking_status" AS ENUM('pending', 'confirmed', 'in_progress', 'ready', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."broadcast_channel" AS ENUM('email', 'whatsapp', 'sms');--> statement-breakpoint
CREATE TYPE "public"."broadcast_status" AS ENUM('draft', 'pending', 'sending', 'sent', 'failed');--> statement-breakpoint
CREATE TYPE "public"."claim_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."message_template_type" AS ENUM('promo', 'new_product', 'voucher', 'general');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('tunai', 'online', 'kredit');--> statement-breakpoint
CREATE TYPE "public"."purchase_order_status" AS ENUM('draft', 'sent', 'received', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."reseller_payment_status" AS ENUM('paid', 'pending');--> statement-breakpoint
CREATE TYPE "public"."voucher_status" AS ENUM('active', 'used', 'expired', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."voucher_type" AS ENUM('percentage', 'fixed_amount');--> statement-breakpoint
CREATE TABLE "booking_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" varchar NOT NULL,
	"product_id" varchar NOT NULL,
	"product_name" text NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"total_price" numeric(10, 2) NOT NULL,
	"special_instructions" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"booking_number" text NOT NULL,
	"customer_name" text NOT NULL,
	"customer_phone" text NOT NULL,
	"customer_email" text,
	"customer_id" varchar,
	"event_type" text NOT NULL,
	"event_date" date NOT NULL,
	"event_notes" text,
	"delivery_type" "booking_delivery_type" NOT NULL,
	"delivery_date" date NOT NULL,
	"delivery_time" text NOT NULL,
	"delivery_address" text,
	"delivery_city" text,
	"delivery_state" text,
	"delivery_postcode" text,
	"total_amount" numeric(10, 2) NOT NULL,
	"discount_type" "voucher_type",
	"discount_value" numeric(10, 2),
	"discount_amount" numeric(10, 2),
	"deposit_paid" numeric(10, 2) DEFAULT '0' NOT NULL,
	"balance_due" numeric(10, 2) NOT NULL,
	"payment_method" "payment_method" DEFAULT 'tunai' NOT NULL,
	"status" "booking_status" DEFAULT 'pending' NOT NULL,
	"reminder_sent" integer DEFAULT 0 NOT NULL,
	"reminder_sent_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	CONSTRAINT "bookings_booking_number_unique" UNIQUE("booking_number")
);
--> statement-breakpoint
CREATE TABLE "broadcast_campaigns" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"name" text NOT NULL,
	"channel" "broadcast_channel" NOT NULL,
	"subject" text,
	"message" text NOT NULL,
	"target_segment" text NOT NULL,
	"target_customer_ids" text[],
	"status" "broadcast_status" DEFAULT 'draft' NOT NULL,
	"total_recipients" integer DEFAULT 0 NOT NULL,
	"sent_count" integer DEFAULT 0 NOT NULL,
	"failed_count" integer DEFAULT 0 NOT NULL,
	"scheduled_at" timestamp,
	"sent_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "broadcast_messages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" varchar NOT NULL,
	"customer_id" varchar NOT NULL,
	"channel" "broadcast_channel" NOT NULL,
	"recipient" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"error_message" text,
	"external_message_id" text,
	"sent_at" timestamp,
	"delivered_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "claim_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"claim_id" varchar NOT NULL,
	"product_id" varchar NOT NULL,
	"product_name" text NOT NULL,
	"quantity_claimed" integer NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"total_amount" numeric(10, 2) NOT NULL,
	"claim_reason" text NOT NULL,
	"approved_qty" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "claim_photos" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"claim_id" varchar NOT NULL,
	"photo_url" text NOT NULL,
	"caption" text,
	"uploaded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_vouchers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"voucher_type" "voucher_type" NOT NULL,
	"discount_value" numeric(10, 2) NOT NULL,
	"min_purchase" numeric(10, 2) DEFAULT '0' NOT NULL,
	"max_discount" numeric(10, 2),
	"max_usage_per_customer" integer DEFAULT 1 NOT NULL,
	"max_total_usage" integer,
	"current_usage" integer DEFAULT 0 NOT NULL,
	"valid_from" timestamp DEFAULT now() NOT NULL,
	"valid_until" timestamp,
	"is_active" integer DEFAULT 1 NOT NULL,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"email" text,
	"loyalty_points" integer DEFAULT 0 NOT NULL,
	"total_spent" numeric(10, 2) DEFAULT '0' NOT NULL,
	"total_visits" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "early_bird_tracking" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"slot_number" integer NOT NULL,
	"email" text NOT NULL,
	"signup_date" timestamp DEFAULT now() NOT NULL,
	"has_subscribed" integer DEFAULT 0 NOT NULL,
	"subscription_id" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "early_bird_tracking_slot_number_unique" UNIQUE("slot_number")
);
--> statement-breakpoint
CREATE TABLE "goals" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"target_month" date NOT NULL,
	"revenue_target" numeric(10, 2) DEFAULT '0' NOT NULL,
	"profit_target" numeric(10, 2) DEFAULT '0' NOT NULL,
	"sales_volume_target" integer DEFAULT 0 NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "loyalty_points_history" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" varchar NOT NULL,
	"sale_id" varchar,
	"points_change" integer NOT NULL,
	"balance_after" integer NOT NULL,
	"transaction_type" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "message_templates" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"name" text NOT NULL,
	"type" "message_template_type" NOT NULL,
	"subject" text,
	"message" text NOT NULL,
	"channel" "broadcast_channel" NOT NULL,
	"is_active" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pending_bills" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"bill_code" text NOT NULL,
	"order_ref" text NOT NULL,
	"plan_id" varchar NOT NULL,
	"plan_name" text NOT NULL,
	"duration_months" integer NOT NULL,
	"total_amount" numeric(10, 2) NOT NULL,
	"promo_code_id" varchar,
	"promo_code" text,
	"discount_applied" numeric(10, 2) DEFAULT '0',
	"is_processed" integer DEFAULT 0 NOT NULL,
	"processed_at" timestamp,
	"is_renewal" integer DEFAULT 0 NOT NULL,
	"renewal_subscription_id" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	CONSTRAINT "pending_bills_bill_code_unique" UNIQUE("bill_code")
);
--> statement-breakpoint
CREATE TABLE "po_template_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" varchar NOT NULL,
	"stock_item_id" varchar,
	"item_name" text NOT NULL,
	"quantity" numeric(10, 2) NOT NULL,
	"unit" text NOT NULL,
	"estimated_price" numeric(10, 2) DEFAULT '0',
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "po_templates" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"template_name" text NOT NULL,
	"supplier_id" varchar,
	"supplier_name" text NOT NULL,
	"supplier_phone" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pricing_tiers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"name" text NOT NULL,
	"discount_percent" numeric(5, 2) DEFAULT '0' NOT NULL,
	"is_active" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "promo_code_usage" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"promo_code_id" varchar NOT NULL,
	"used_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "purchase_order_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"po_id" varchar NOT NULL,
	"stock_item_id" varchar,
	"item_name" text NOT NULL,
	"quantity" numeric(10, 2) NOT NULL,
	"unit" text NOT NULL,
	"estimated_price" numeric(10, 2) DEFAULT '0',
	"actual_price" numeric(10, 2),
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "purchase_orders" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"po_number" text NOT NULL,
	"supplier_id" varchar,
	"supplier_name" text NOT NULL,
	"supplier_phone" text,
	"status" "purchase_order_status" DEFAULT 'draft' NOT NULL,
	"total_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"notes" text,
	"sent_at" timestamp,
	"received_at" timestamp,
	"expense_id" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "purchase_orders_po_number_unique" UNIQUE("po_number")
);
--> statement-breakpoint
CREATE TABLE "reseller_transfer_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transfer_id" varchar NOT NULL,
	"product_id" varchar NOT NULL,
	"product_name" text NOT NULL,
	"quantity" integer NOT NULL,
	"tier_price" numeric(10, 2) NOT NULL,
	"subtotal" numeric(10, 2) NOT NULL,
	"batch_id" varchar
);
--> statement-breakpoint
CREATE TABLE "reseller_transfers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"reseller_id" varchar NOT NULL,
	"transfer_date" date NOT NULL,
	"total_amount" numeric(10, 2) NOT NULL,
	"payment_status" "reseller_payment_status" DEFAULT 'pending' NOT NULL,
	"notes" text,
	"receipt_number" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "reseller_transfers_receipt_number_unique" UNIQUE("receipt_number")
);
--> statement-breakpoint
CREATE TABLE "resellers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"name" text NOT NULL,
	"phone" text,
	"area" text,
	"pricing_tier_id" varchar,
	"total_purchases" numeric(10, 2) DEFAULT '0' NOT NULL,
	"is_active" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sales_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sale_id" varchar NOT NULL,
	"product_id" varchar NOT NULL,
	"product_name" text NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"unit_cost" numeric(10, 2) DEFAULT '0' NOT NULL,
	"total_price" numeric(10, 2) NOT NULL,
	"total_cost" numeric(10, 2) DEFAULT '0' NOT NULL,
	"profit_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"batch_id" varchar
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"name" text NOT NULL,
	"phone" text,
	"address" text,
	"email" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vendor_claims" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"vendor_id" varchar NOT NULL,
	"vendor_name" text NOT NULL,
	"delivery_id" varchar,
	"claim_number" text,
	"claim_date" date NOT NULL,
	"status" "claim_status" DEFAULT 'pending' NOT NULL,
	"total_claim_amount" numeric(10, 2) NOT NULL,
	"approved_amount" numeric(10, 2) DEFAULT '0',
	"review_notes" text,
	"reviewed_at" timestamp,
	"reviewed_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "vendor_claims_claim_number_unique" UNIQUE("claim_number")
);
--> statement-breakpoint
CREATE TABLE "vendor_sales" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"vendor_id" varchar NOT NULL,
	"vendor_name" text NOT NULL,
	"delivery_id" varchar,
	"product_id" varchar NOT NULL,
	"product_name" text NOT NULL,
	"quantity_sold" integer NOT NULL,
	"sale_date" date NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vendor_stock_balance" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" varchar NOT NULL,
	"product_id" varchar NOT NULL,
	"current_stock" integer DEFAULT 0 NOT NULL,
	"last_delivery_date" date,
	"last_sale_date" date,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "voucher_usage" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"voucher_id" varchar NOT NULL,
	"customer_id" varchar,
	"sale_id" varchar,
	"discount_applied" numeric(10, 2) NOT NULL,
	"original_amount" numeric(10, 2) NOT NULL,
	"final_amount" numeric(10, 2) NOT NULL,
	"used_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "categories" DROP CONSTRAINT "categories_name_unique";--> statement-breakpoint
ALTER TABLE "sales" DROP CONSTRAINT "sales_vendor_id_vendors_id_fk";
--> statement-breakpoint
ALTER TABLE "sales" DROP CONSTRAINT "sales_product_id_products_id_fk";
--> statement-breakpoint
ALTER TABLE "billing_history" ADD COLUMN "toyyibpay_bill_code" text;--> statement-breakpoint
ALTER TABLE "billing_history" ADD COLUMN "toyyibpay_transaction_id" text;--> statement-breakpoint
ALTER TABLE "billing_history" ADD COLUMN "payment_method" text;--> statement-breakpoint
ALTER TABLE "billing_history" ADD COLUMN "receipt_url" text;--> statement-breakpoint
ALTER TABLE "business_profile" ADD COLUMN "user_id" varchar NOT NULL;--> statement-breakpoint
ALTER TABLE "business_profile" ADD COLUMN "payment_qr_code" text;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "user_id" varchar NOT NULL;--> statement-breakpoint
ALTER TABLE "deliveries" ADD COLUMN "user_id" varchar NOT NULL;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "user_id" varchar NOT NULL;--> statement-breakpoint
ALTER TABLE "google_drive_sync_log" ADD COLUMN "user_id" varchar NOT NULL;--> statement-breakpoint
ALTER TABLE "ingredients" ADD COLUMN "user_id" varchar NOT NULL;--> statement-breakpoint
ALTER TABLE "production_batches" ADD COLUMN "user_id" varchar NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "user_id" varchar NOT NULL;--> statement-breakpoint
ALTER TABLE "promo_codes" ADD COLUMN "is_early_bird" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "sales" ADD COLUMN "user_id" varchar NOT NULL;--> statement-breakpoint
ALTER TABLE "sales" ADD COLUMN "receipt_number" text NOT NULL;--> statement-breakpoint
ALTER TABLE "sales" ADD COLUMN "customer_name" text;--> statement-breakpoint
ALTER TABLE "sales" ADD COLUMN "customer_id" varchar;--> statement-breakpoint
ALTER TABLE "sales" ADD COLUMN "payment_method" "payment_method" DEFAULT 'tunai' NOT NULL;--> statement-breakpoint
ALTER TABLE "sales" ADD COLUMN "total_cost" numeric(10, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "sales" ADD COLUMN "profit_amount" numeric(10, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "sales" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "shopping_cart" ADD COLUMN "user_id" varchar NOT NULL;--> statement-breakpoint
ALTER TABLE "stock_items" ADD COLUMN "user_id" varchar NOT NULL;--> statement-breakpoint
ALTER TABLE "subscription_plans" ADD COLUMN "monthly_price" numeric(10, 2) NOT NULL;--> statement-breakpoint
ALTER TABLE "subscription_plans" ADD COLUMN "discount_6_months" numeric(5, 2) DEFAULT '10.00';--> statement-breakpoint
ALTER TABLE "subscription_plans" ADD COLUMN "discount_12_months" numeric(5, 2) DEFAULT '20.00';--> statement-breakpoint
ALTER TABLE "user_subscriptions" ADD COLUMN "plan_name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "user_subscriptions" ADD COLUMN "duration_months" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "user_subscriptions" ADD COLUMN "subscription_starts_at" timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE "user_subscriptions" ADD COLUMN "subscription_ends_at" timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE "user_subscriptions" ADD COLUMN "total_paid" numeric(10, 2) NOT NULL;--> statement-breakpoint
ALTER TABLE "user_subscriptions" ADD COLUMN "loyalty_monthly_rate" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "user_subscriptions" ADD COLUMN "toyyibpay_bill_code" text;--> statement-breakpoint
ALTER TABLE "user_subscriptions" ADD COLUMN "payment_method" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_on_trial" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "trial_ends_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "toyyibpay_user_code" text;--> statement-breakpoint
ALTER TABLE "vendor_commissions" ADD COLUMN "user_id" varchar NOT NULL;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "user_id" varchar NOT NULL;--> statement-breakpoint
ALTER TABLE "booking_items" ADD CONSTRAINT "booking_items_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_items" ADD CONSTRAINT "booking_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "broadcast_campaigns" ADD CONSTRAINT "broadcast_campaigns_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "broadcast_messages" ADD CONSTRAINT "broadcast_messages_campaign_id_broadcast_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."broadcast_campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "broadcast_messages" ADD CONSTRAINT "broadcast_messages_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claim_items" ADD CONSTRAINT "claim_items_claim_id_vendor_claims_id_fk" FOREIGN KEY ("claim_id") REFERENCES "public"."vendor_claims"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claim_items" ADD CONSTRAINT "claim_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claim_photos" ADD CONSTRAINT "claim_photos_claim_id_vendor_claims_id_fk" FOREIGN KEY ("claim_id") REFERENCES "public"."vendor_claims"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_vouchers" ADD CONSTRAINT "customer_vouchers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "early_bird_tracking" ADD CONSTRAINT "early_bird_tracking_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "early_bird_tracking" ADD CONSTRAINT "early_bird_tracking_subscription_id_user_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."user_subscriptions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goals" ADD CONSTRAINT "goals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loyalty_points_history" ADD CONSTRAINT "loyalty_points_history_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loyalty_points_history" ADD CONSTRAINT "loyalty_points_history_sale_id_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."sales"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_templates" ADD CONSTRAINT "message_templates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pending_bills" ADD CONSTRAINT "pending_bills_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pending_bills" ADD CONSTRAINT "pending_bills_plan_id_subscription_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."subscription_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pending_bills" ADD CONSTRAINT "pending_bills_promo_code_id_promo_codes_id_fk" FOREIGN KEY ("promo_code_id") REFERENCES "public"."promo_codes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pending_bills" ADD CONSTRAINT "pending_bills_renewal_subscription_id_user_subscriptions_id_fk" FOREIGN KEY ("renewal_subscription_id") REFERENCES "public"."user_subscriptions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "po_template_items" ADD CONSTRAINT "po_template_items_template_id_po_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."po_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "po_template_items" ADD CONSTRAINT "po_template_items_stock_item_id_stock_items_id_fk" FOREIGN KEY ("stock_item_id") REFERENCES "public"."stock_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "po_templates" ADD CONSTRAINT "po_templates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "po_templates" ADD CONSTRAINT "po_templates_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pricing_tiers" ADD CONSTRAINT "pricing_tiers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promo_code_usage" ADD CONSTRAINT "promo_code_usage_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promo_code_usage" ADD CONSTRAINT "promo_code_usage_promo_code_id_promo_codes_id_fk" FOREIGN KEY ("promo_code_id") REFERENCES "public"."promo_codes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_po_id_purchase_orders_id_fk" FOREIGN KEY ("po_id") REFERENCES "public"."purchase_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_stock_item_id_stock_items_id_fk" FOREIGN KEY ("stock_item_id") REFERENCES "public"."stock_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_expense_id_expenses_id_fk" FOREIGN KEY ("expense_id") REFERENCES "public"."expenses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reseller_transfer_items" ADD CONSTRAINT "reseller_transfer_items_transfer_id_reseller_transfers_id_fk" FOREIGN KEY ("transfer_id") REFERENCES "public"."reseller_transfers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reseller_transfer_items" ADD CONSTRAINT "reseller_transfer_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reseller_transfer_items" ADD CONSTRAINT "reseller_transfer_items_batch_id_production_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."production_batches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reseller_transfers" ADD CONSTRAINT "reseller_transfers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reseller_transfers" ADD CONSTRAINT "reseller_transfers_reseller_id_resellers_id_fk" FOREIGN KEY ("reseller_id") REFERENCES "public"."resellers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resellers" ADD CONSTRAINT "resellers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resellers" ADD CONSTRAINT "resellers_pricing_tier_id_pricing_tiers_id_fk" FOREIGN KEY ("pricing_tier_id") REFERENCES "public"."pricing_tiers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_items" ADD CONSTRAINT "sales_items_sale_id_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."sales"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_items" ADD CONSTRAINT "sales_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_items" ADD CONSTRAINT "sales_items_batch_id_production_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."production_batches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_claims" ADD CONSTRAINT "vendor_claims_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_claims" ADD CONSTRAINT "vendor_claims_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_claims" ADD CONSTRAINT "vendor_claims_delivery_id_deliveries_id_fk" FOREIGN KEY ("delivery_id") REFERENCES "public"."deliveries"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_claims" ADD CONSTRAINT "vendor_claims_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_sales" ADD CONSTRAINT "vendor_sales_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_sales" ADD CONSTRAINT "vendor_sales_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_sales" ADD CONSTRAINT "vendor_sales_delivery_id_deliveries_id_fk" FOREIGN KEY ("delivery_id") REFERENCES "public"."deliveries"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_sales" ADD CONSTRAINT "vendor_sales_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_stock_balance" ADD CONSTRAINT "vendor_stock_balance_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_stock_balance" ADD CONSTRAINT "vendor_stock_balance_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voucher_usage" ADD CONSTRAINT "voucher_usage_voucher_id_customer_vouchers_id_fk" FOREIGN KEY ("voucher_id") REFERENCES "public"."customer_vouchers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voucher_usage" ADD CONSTRAINT "voucher_usage_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voucher_usage" ADD CONSTRAINT "voucher_usage_sale_id_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."sales"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_profile" ADD CONSTRAINT "business_profile_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "google_drive_sync_log" ADD CONSTRAINT "google_drive_sync_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ingredients" ADD CONSTRAINT "ingredients_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_batches" ADD CONSTRAINT "production_batches_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shopping_cart" ADD CONSTRAINT "shopping_cart_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_items" ADD CONSTRAINT "stock_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_commissions" ADD CONSTRAINT "vendor_commissions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_history" DROP COLUMN "stripe_invoice_id";--> statement-breakpoint
ALTER TABLE "billing_history" DROP COLUMN "stripe_payment_intent_id";--> statement-breakpoint
ALTER TABLE "billing_history" DROP COLUMN "invoice_url";--> statement-breakpoint
ALTER TABLE "promo_codes" DROP COLUMN "stripe_coupon_id";--> statement-breakpoint
ALTER TABLE "sales" DROP COLUMN "vendor_id";--> statement-breakpoint
ALTER TABLE "sales" DROP COLUMN "vendor_name";--> statement-breakpoint
ALTER TABLE "sales" DROP COLUMN "product_id";--> statement-breakpoint
ALTER TABLE "sales" DROP COLUMN "product_name";--> statement-breakpoint
ALTER TABLE "sales" DROP COLUMN "quantity";--> statement-breakpoint
ALTER TABLE "sales" DROP COLUMN "unit_price";--> statement-breakpoint
ALTER TABLE "sales" DROP COLUMN "is_paid";--> statement-breakpoint
ALTER TABLE "subscription_plans" DROP COLUMN "price";--> statement-breakpoint
ALTER TABLE "subscription_plans" DROP COLUMN "interval";--> statement-breakpoint
ALTER TABLE "subscription_plans" DROP COLUMN "stripe_price_id";--> statement-breakpoint
ALTER TABLE "subscription_plans" DROP COLUMN "stripe_product_id";--> statement-breakpoint
ALTER TABLE "user_subscriptions" DROP COLUMN "stripe_subscription_id";--> statement-breakpoint
ALTER TABLE "user_subscriptions" DROP COLUMN "current_period_start";--> statement-breakpoint
ALTER TABLE "user_subscriptions" DROP COLUMN "current_period_end";--> statement-breakpoint
ALTER TABLE "user_subscriptions" DROP COLUMN "cancel_at_period_end";--> statement-breakpoint
ALTER TABLE "user_subscriptions" DROP COLUMN "canceled_at";--> statement-breakpoint
ALTER TABLE "user_subscriptions" DROP COLUMN "loyalty_rate";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "stripe_customer_id";--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_receipt_number_unique" UNIQUE("receipt_number");
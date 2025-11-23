-- Seed subscription plans for PocketBizz
-- Run this directly on Railway PostgreSQL database

-- Clear existing plans first
DELETE FROM subscription_plans;

-- Insert Basic Plan
INSERT INTO subscription_plans (
  name,
  display_name,
  description,
  monthly_price,
  discount_6_months,
  discount_12_months,
  currency,
  features,
  max_users,
  max_products,
  is_active,
  sort_order,
  created_at
) VALUES (
  'basic',
  'Basic',
  'Untuk peniaga solo yang baru bermula',
  49.00,
  10.00,
  20.00,
  'MYR',
  '["Pengurusan stok asas","Rekod jualan & penghantaran","Laporan kewangan mudah","Jejak inventori real-time","Thermal invoice printing","Export data ke Excel","Support via email"]',
  1,
  50,
  1,
  1,
  CURRENT_TIMESTAMP
);

-- Insert Pro Plan (MOST POPULAR)
INSERT INTO subscription_plans (
  name,
  display_name,
  description,
  monthly_price,
  discount_6_months,
  discount_12_months,
  currency,
  features,
  max_users,
  max_products,
  is_active,
  sort_order,
  created_at
) VALUES (
  'pro',
  'Pro',
  'Untuk perniagaan yang sedang berkembang',
  99.00,
  10.00,
  20.00,
  'MYR',
  '["Semua ciri Basic","Pengurusan vendor & komisyen","Tracking expired/rosak items","Thermal invoice dengan QR payment","WhatsApp share invoice","Multi-user access (3 pengguna)","Perancangan produksi","Priority support"]',
  3,
  200,
  1,
  2,
  CURRENT_TIMESTAMP
);

-- Insert Premium Plan
INSERT INTO subscription_plans (
  name,
  display_name,
  description,
  monthly_price,
  discount_6_months,
  discount_12_months,
  currency,
  features,
  max_users,
  max_products,
  is_active,
  sort_order,
  created_at
) VALUES (
  'premium',
  'Premium',
  'Untuk perniagaan berskala besar',
  199.00,
  10.00,
  20.00,
  'MYR',
  '["Semua ciri Pro","Unlimited produk & pengguna","Custom reports & analytics","Advanced inventory forecasting","Batch/lot tracking (FIFO)","Reseller & agent management","Custom branding (logo, colors)","Dedicated support"]',
  999999,
  999999,
  1,
  3,
  CURRENT_TIMESTAMP
);

-- Verify the data
SELECT 
  name,
  display_name,
  monthly_price,
  max_users,
  max_products,
  is_active
FROM subscription_plans
ORDER BY sort_order;

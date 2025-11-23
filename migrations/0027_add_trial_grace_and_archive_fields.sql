-- Migration: Add trial grace period and data archiving support
-- Created: 2024
-- Description: Adds grace_ends_at field to users table and is_archived flag to resource tables

-- Add grace period tracking to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS grace_ends_at timestamp;

-- Add archive flag to products table (PostgreSQL uses integer 0/1 instead of boolean)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS is_archived integer DEFAULT 0 NOT NULL;

-- Add archive flag to vendors table
ALTER TABLE vendors 
ADD COLUMN IF NOT EXISTS is_archived integer DEFAULT 0 NOT NULL;

-- Add archive flag to resellers table
ALTER TABLE resellers 
ADD COLUMN IF NOT EXISTS is_archived integer DEFAULT 0 NOT NULL;

-- Add archive flag to customers table
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS is_archived integer DEFAULT 0 NOT NULL;

-- Add archive flag to stock_items table
ALTER TABLE stock_items 
ADD COLUMN IF NOT EXISTS is_archived integer DEFAULT 0 NOT NULL;

-- Create index for efficient archive filtering (0 = active, 1 = archived)
CREATE INDEX IF NOT EXISTS idx_products_archived ON products(is_archived) WHERE is_archived = 0;
CREATE INDEX IF NOT EXISTS idx_vendors_archived ON vendors(is_archived) WHERE is_archived = 0;
CREATE INDEX IF NOT EXISTS idx_resellers_archived ON resellers(is_archived) WHERE is_archived = 0;
CREATE INDEX IF NOT EXISTS idx_customers_archived ON customers(is_archived) WHERE is_archived = 0;
CREATE INDEX IF NOT EXISTS idx_stock_items_archived ON stock_items(is_archived) WHERE is_archived = 0;

-- Create index for grace period monitoring
CREATE INDEX IF NOT EXISTS idx_users_grace_period ON users(grace_ends_at) WHERE grace_ends_at IS NOT NULL;

-- Update existing users: those currently on trial should get grace period
-- (trial_ends_at + 7 days grace = grace_ends_at)
UPDATE users 
SET grace_ends_at = trial_ends_at + INTERVAL '7 days'
WHERE is_on_trial = 1 
  AND trial_ends_at > NOW()
  AND grace_ends_at IS NULL;

-- Set all existing records to NOT archived (0 = active)
UPDATE products SET is_archived = 0 WHERE is_archived IS NULL;
UPDATE vendors SET is_archived = 0 WHERE is_archived IS NULL;
UPDATE resellers SET is_archived = 0 WHERE is_archived IS NULL;
UPDATE customers SET is_archived = 0 WHERE is_archived IS NULL;
UPDATE stock_items SET is_archived = 0 WHERE is_archived IS NULL;

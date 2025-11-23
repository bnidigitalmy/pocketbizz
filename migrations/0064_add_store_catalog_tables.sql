-- Migration: Add Online Store Catalog tables
-- Date: 2025-11-09
-- Description: Create store_settings and store_analytics tables for public catalog feature

-- Create store_theme enum
DO $$ BEGIN
  CREATE TYPE store_theme AS ENUM ('light', 'dark', 'custom');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create store_settings table
CREATE TABLE IF NOT EXISTS store_settings (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  
  -- Store Identity
  slug TEXT NOT NULL UNIQUE,
  business_name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  cover_image_url TEXT,
  
  -- Contact & Social
  whatsapp_number TEXT NOT NULL,
  instagram_handle TEXT,
  facebook_url TEXT,
  
  -- Business Info
  business_hours TEXT,
  address TEXT,
  delivery_info TEXT,
  pickup_info TEXT,
  
  -- Customization
  theme store_theme DEFAULT 'light' NOT NULL,
  accent_color TEXT DEFAULT '#f97316',
  
  -- Settings
  is_active INTEGER DEFAULT 1 NOT NULL,
  show_out_of_stock INTEGER DEFAULT 0 NOT NULL,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create store_analytics table
CREATE TABLE IF NOT EXISTS store_analytics (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id VARCHAR NOT NULL REFERENCES store_settings(id) ON DELETE CASCADE,
  
  -- Event tracking
  event_type TEXT NOT NULL,
  product_id VARCHAR,
  
  -- Session info
  visitor_id TEXT,
  referrer TEXT,
  user_agent TEXT,
  
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create audit_logs table for system tracking
CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR REFERENCES users(id) ON DELETE SET NULL,
  
  -- Audit info
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id VARCHAR,
  changes JSONB,
  ip_address TEXT,
  user_agent TEXT,
  
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_store_settings_slug ON store_settings(slug);
CREATE INDEX IF NOT EXISTS idx_store_settings_user_id ON store_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_store_analytics_store_id ON store_analytics(store_id);
CREATE INDEX IF NOT EXISTS idx_store_analytics_event_type ON store_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

-- Add comments
COMMENT ON TABLE store_settings IS 'Online catalog store configuration for business owners';
COMMENT ON TABLE store_analytics IS 'Track visitor engagement on public store pages';
COMMENT ON TABLE audit_logs IS 'System-wide audit trail for important actions';

COMMENT ON COLUMN store_settings.slug IS 'Unique URL identifier: pocketbizz.app/store/{slug}';
COMMENT ON COLUMN store_settings.is_active IS '1 = store visible to public, 0 = hidden';
COMMENT ON COLUMN store_settings.show_out_of_stock IS '1 = show out of stock items, 0 = hide them';

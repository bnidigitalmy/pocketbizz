-- Add delivery address and supplier email fields to purchase_orders table
ALTER TABLE purchase_orders
ADD COLUMN IF NOT EXISTS supplier_email TEXT,
ADD COLUMN IF NOT EXISTS supplier_address TEXT,
ADD COLUMN IF NOT EXISTS delivery_address TEXT;

-- Add comment
COMMENT ON COLUMN purchase_orders.supplier_email IS 'Supplier email address for sending PO';
COMMENT ON COLUMN purchase_orders.supplier_address IS 'Supplier business address';
COMMENT ON COLUMN purchase_orders.delivery_address IS 'Delivery/shipping address for this order';

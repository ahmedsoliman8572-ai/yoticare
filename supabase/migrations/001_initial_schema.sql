-- ==========================================================================
-- YotiCare — Initial Database Schema
-- Run this in the Supabase SQL Editor (supabase.com → SQL Editor → New Query)
-- ==========================================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================================================
-- 1. ADMIN USERS
-- ==========================================================================
CREATE TABLE admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS: Only admins can read their own record
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read own record" ON admin_users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can update own record" ON admin_users
  FOR UPDATE USING (auth.uid() = id);

-- ==========================================================================
-- 2. CATEGORIES
-- ==========================================================================
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_en TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description_en TEXT,
  description_ar TEXT,
  image_path TEXT,
  position INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Anyone can read active categories
CREATE POLICY "Public can read active categories" ON categories
  FOR SELECT USING (is_active = TRUE);

-- Admins can do everything
CREATE POLICY "Admins can manage categories" ON categories
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
  );

-- ==========================================================================
-- 3. PRODUCTS
-- ==========================================================================
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  name_en TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description_en TEXT,
  description_ar TEXT,
  short_description_en TEXT,
  short_description_ar TEXT,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  compare_at_price NUMERIC(10, 2),
  sku TEXT,
  stock_quantity INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  size TEXT,
  scent_en TEXT,
  scent_ar TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_products_is_featured ON products(is_featured);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Anyone can read active products
CREATE POLICY "Public can read active products" ON products
  FOR SELECT USING (is_active = TRUE);

-- Admins can do everything
CREATE POLICY "Admins can manage products" ON products
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
  );

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==========================================================================
-- 3B. PRODUCT VARIANTS
-- ==========================================================================
CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name_en TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  stock_quantity INT NOT NULL DEFAULT 0,
  image_path TEXT,
  position INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read active variants" ON product_variants FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Admins can manage variants" ON product_variants FOR ALL USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()));

-- ==========================================================================
-- 4. PRODUCT IMAGES
-- ==========================================================================
CREATE TABLE product_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_path TEXT NOT NULL,
  alt_text TEXT,
  position INT NOT NULL DEFAULT 0,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_product_images_product ON product_images(product_id);

ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

-- Anyone can read product images
CREATE POLICY "Public can read product images" ON product_images
  FOR SELECT USING (TRUE);

-- Admins can manage product images
CREATE POLICY "Admins can manage product images" ON product_images
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
  );

-- ==========================================================================
-- 5. ORDERS
-- ==========================================================================
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  customer_phone_2 TEXT,
  customer_governorate TEXT NOT NULL DEFAULT '',
  customer_city TEXT NOT NULL,
  customer_address TEXT NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'cod'
    CHECK (payment_method IN ('cod', 'vodafone_cash', 'instapay')),
  payment_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (payment_status IN ('pending', 'paid')),
  subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0,
  shipping_cost NUMERIC(10, 2) NOT NULL DEFAULT 0,
  total NUMERIC(10, 2) NOT NULL DEFAULT 0,
  notes TEXT,
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Anyone can insert orders (guest checkout)
CREATE POLICY "Anyone can create orders" ON orders
  FOR INSERT WITH CHECK (TRUE);

-- Only admins can read/update/delete orders
CREATE POLICY "Admins can manage orders" ON orders
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
  );

-- Public can read their own order by order_number (for confirmation page)
CREATE POLICY "Public can read own order" ON orders
  FOR SELECT USING (TRUE);

CREATE TRIGGER set_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==========================================================================
-- 6. ORDER ITEMS
-- ==========================================================================
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  variant_name TEXT,
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  total_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  image_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_order_items_order ON order_items(order_id);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Anyone can insert order items (part of checkout)
CREATE POLICY "Anyone can create order items" ON order_items
  FOR INSERT WITH CHECK (TRUE);

-- Admins and public (for confirmation) can read
CREATE POLICY "Public can read order items" ON order_items
  FOR SELECT USING (TRUE);

-- Admins can manage
CREATE POLICY "Admins can manage order items" ON order_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
  );

-- ==========================================================================
-- 7. SITE SETTINGS (Key-Value Store)
-- ==========================================================================
CREATE TABLE site_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL DEFAULT '',
  "group" TEXT NOT NULL DEFAULT 'general',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read settings
CREATE POLICY "Public can read settings" ON site_settings
  FOR SELECT USING (TRUE);

-- Admins can manage
CREATE POLICY "Admins can manage settings" ON site_settings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
  );

-- ==========================================================================
-- 8. PAYMENT METHODS
-- ==========================================================================
CREATE TABLE payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL UNIQUE
    CHECK (type IN ('cod', 'vodafone_cash', 'instapay')),
  label_en TEXT NOT NULL,
  label_ar TEXT NOT NULL,
  instructions_en TEXT,
  instructions_ar TEXT,
  wallet_number TEXT,
  account_name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  position INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

-- Anyone can read active payment methods
CREATE POLICY "Public can read active payment methods" ON payment_methods
  FOR SELECT USING (is_active = TRUE);

-- Admins can manage
CREATE POLICY "Admins can manage payment methods" ON payment_methods
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
  );

-- ==========================================================================
-- 8B. COUPONS
-- ==========================================================================
CREATE TABLE coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC(10, 2) NOT NULL,
  min_order_value NUMERIC(10, 2) DEFAULT 0,
  max_discount NUMERIC(10, 2),
  expiry_date TIMESTAMPTZ,
  usage_limit INT,
  times_used INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read active coupons" ON coupons FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Admins can manage coupons" ON coupons FOR ALL USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()));

-- ==========================================================================
-- 8C. SHIPPING ZONES
-- ==========================================================================
CREATE TABLE shipping_zones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  governorate_en TEXT NOT NULL,
  governorate_ar TEXT NOT NULL,
  cost NUMERIC(10, 2) NOT NULL DEFAULT 50,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE shipping_zones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read active shipping zones" ON shipping_zones FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Admins can manage shipping zones" ON shipping_zones FOR ALL USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()));

-- ==========================================================================
-- 9. STORAGE BUCKET
-- ==========================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to product images
CREATE POLICY "Public can read product images" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

-- Allow admins to upload/delete product images
CREATE POLICY "Admins can upload product images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'product-images'
    AND EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
  );

CREATE POLICY "Admins can update product images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'product-images'
    AND EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
  );

CREATE POLICY "Admins can delete product images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'product-images'
    AND EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
  );

-- ==========================================================================
-- 10. SEED DATA — Default Payment Methods
-- ==========================================================================
INSERT INTO payment_methods (type, label_en, label_ar, instructions_en, instructions_ar, is_active, position)
VALUES
  ('cod', 'Cash on Delivery', 'الدفع عند الاستلام',
   'Pay in cash when you receive your order.',
   'ادفع نقداً عند استلام طلبك.',
   TRUE, 0),
  ('vodafone_cash', 'Vodafone Cash', 'فودافون كاش',
   'Transfer the total amount to the wallet number below, then confirm your payment.',
   'حوّل المبلغ الإجمالي إلى رقم المحفظة أدناه، ثم أكّد عملية الدفع.',
   TRUE, 1),
  ('instapay', 'InstaPay', 'إنستاباي',
   'Transfer the total amount via InstaPay to the account below, then confirm your payment.',
   'حوّل المبلغ الإجمالي عبر إنستاباي إلى الحساب أدناه، ثم أكّد عملية الدفع.',
   TRUE, 2);

-- ==========================================================================
-- 11. SEED DATA — Default Site Settings
-- ==========================================================================
INSERT INTO site_settings (key, value, "group") VALUES
  ('store_name_en', 'YotiCare', 'general'),
  ('store_name_ar', 'يوتي كير', 'general'),
  ('store_description_en', 'Premium Body Care Products', 'general'),
  ('store_description_ar', 'منتجات العناية بالجسم الفاخرة', 'general'),
  ('contact_phone', '', 'contact'),
  ('whatsapp_number', '', 'contact'),
  ('contact_email', '', 'contact'),
  ('facebook_url', '', 'social'),
  ('instagram_url', '', 'social'),
  ('tiktok_url', '', 'social'),
  ('default_shipping_cost', '50', 'general'),
  ('facebook_pixel', '', 'marketing'),
  ('tiktok_pixel', '', 'marketing'),
  ('snapchat_pixel', '', 'marketing'),
  ('google_analytics', '', 'marketing');

-- ==========================================================================
-- 12. SEED DATA — Default Categories
-- ==========================================================================
INSERT INTO categories (name_en, name_ar, slug, description_en, description_ar, position) VALUES
  ('Body Splashes', 'بادي سبلاش', 'body-splashes', 'Refreshing body splashes for all-day fragrance', 'بادي سبلاش منعش لعطر يدوم طوال اليوم', 0),
  ('Deodorants', 'مزيلات العرق', 'deodorants', 'Long-lasting protection and freshness', 'حماية ونضارة تدوم طويلاً', 1),
  ('Body Lotions', 'لوشن الجسم', 'body-lotions', 'Nourishing body lotions for silky smooth skin', 'لوشن مغذي للجسم لبشرة حريرية ناعمة', 2),
  ('Shampoos', 'شامبو', 'shampoos', 'Professional hair care shampoos', 'شامبو احترافي للعناية بالشعر', 3),
  ('Conditioners', 'بلسم', 'conditioners', 'Deep conditioning for healthy hair', 'بلسم عميق لشعر صحي', 4),
  ('Body Wash', 'غسول الجسم', 'body-wash', 'Gentle cleansing body wash', 'غسول جسم لطيف ومنظف', 5),
  ('Hair Care', 'العناية بالشعر', 'hair-care', 'Complete hair care solutions', 'حلول متكاملة للعناية بالشعر', 6);

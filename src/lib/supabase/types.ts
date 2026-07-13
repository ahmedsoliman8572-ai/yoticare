/* ==========================================================================
   YotiCare — Supabase Database Types
   ========================================================================== */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ---------- Enums ----------
export type OrderStatus =
  | "pending"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "cancelled";

export type PaymentMethod = "cod" | "vodafone_cash" | "instapay";
export type PaymentStatus = "pending" | "paid";
export type PaymentMethodType = "cod" | "vodafone_cash" | "instapay";

// ---------- Tables ----------
export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
}

export interface Category {
  id: string;
  name_en: string;
  name_ar: string;
  slug: string;
  description_en: string | null;
  description_ar: string | null;
  image_path: string | null;
  position: number;
  is_active: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  category_id: string | null;
  name_en: string;
  name_ar: string;
  slug: string;
  description_en: string | null;
  description_ar: string | null;
  short_description_en: string | null;
  short_description_ar: string | null;
  price: number;
  compare_at_price: number | null;
  sku: string | null;
  stock_quantity: number;
  is_active: boolean;
  is_featured: boolean;
  size: string | null;
  scent_en: string | null;
  scent_ar: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_path: string;
  alt_text: string | null;
  position: number;
  is_primary: boolean;
  created_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  status: OrderStatus;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  customer_address: string;
  customer_city: string;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  subtotal: number;
  shipping_cost: number;
  total: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface SiteSetting {
  id: string;
  key: string;
  value: string;
  group: string;
  updated_at: string;
}

export interface PaymentMethodConfig {
  id: string;
  type: PaymentMethodType;
  label_en: string;
  label_ar: string;
  instructions_en: string | null;
  instructions_ar: string | null;
  wallet_number: string | null;
  account_name: string | null;
  is_active: boolean;
  position: number;
  updated_at: string;
}

// ---------- With Relations ----------
export interface ProductWithImages extends Product {
  product_images: ProductImage[];
  category?: Category;
}

export interface OrderWithItems extends Order {
  order_items: (OrderItem & { product?: Product })[];
}

// ---------- Insert Types ----------
export type CategoryInsert = Omit<Category, "id" | "created_at">;
export type CategoryUpdate = Partial<CategoryInsert>;

export type ProductInsert = Omit<Product, "id" | "created_at" | "updated_at">;
export type ProductUpdate = Partial<ProductInsert>;

export type OrderInsert = Omit<Order, "id" | "order_number" | "created_at" | "updated_at">;

export type ProductImageInsert = Omit<ProductImage, "id" | "created_at">;

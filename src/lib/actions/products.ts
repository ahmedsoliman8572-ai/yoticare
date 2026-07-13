"use server";

import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";
import type { ProductInsert, ProductUpdate, ProductImage } from "@/lib/supabase/types";

export async function getProducts(filters?: {
  category?: string;
  search?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  sortBy?: string;
}) {
  const supabase = await createClient();

  let query = supabase
    .from("products")
    .select("*, product_images(*), category:categories(*)");

  if (filters?.category) {
    query = query.eq("category_id", filters.category);
  }
  if (filters?.search) {
    query = query.or(
      `name_en.ilike.%${filters.search}%,name_ar.ilike.%${filters.search}%`
    );
  }
  if (filters?.isActive !== undefined) {
    query = query.eq("is_active", filters.isActive);
  }
  if (filters?.isFeatured !== undefined) {
    query = query.eq("is_featured", filters.isFeatured);
  }

  switch (filters?.sortBy) {
    case "price_asc":
      query = query.order("price", { ascending: true });
      break;
    case "price_desc":
      query = query.order("price", { ascending: false });
      break;
    case "name":
      query = query.order("name_en", { ascending: true });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data;
}

export async function getProductBySlug(slug: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .select("*, product_images(*), category:categories(*)")
    .eq("slug", slug)
    .single();

  if (error) return null;
  return data;
}

export async function getProductById(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .select("*, product_images(*), category:categories(*)")
    .eq("id", id)
    .single();

  if (error) return null;
  return data;
}

export async function createProduct(formData: FormData) {
  const supabase = await createClient();

  const product: ProductInsert = {
    name_en: formData.get("name_en") as string,
    name_ar: formData.get("name_ar") as string,
    slug: slugify(formData.get("name_en") as string),
    description_en: (formData.get("description_en") as string) || null,
    description_ar: (formData.get("description_ar") as string) || null,
    short_description_en: (formData.get("short_description_en") as string) || null,
    short_description_ar: (formData.get("short_description_ar") as string) || null,
    price: parseFloat(formData.get("price") as string) || 0,
    compare_at_price: formData.get("compare_at_price")
      ? parseFloat(formData.get("compare_at_price") as string)
      : null,
    category_id: (formData.get("category_id") as string) || null,
    sku: (formData.get("sku") as string) || null,
    stock_quantity: parseInt(formData.get("stock_quantity") as string) || 0,
    is_active: formData.get("is_active") === "true",
    is_featured: formData.get("is_featured") === "true",
    size: (formData.get("size") as string) || null,
    scent_en: (formData.get("scent_en") as string) || null,
    scent_ar: (formData.get("scent_ar") as string) || null,
  };

  // Ensure unique slug
  const { data: existing } = await supabase
    .from("products")
    .select("slug")
    .eq("slug", product.slug)
    .single();

  if (existing) {
    product.slug = `${product.slug}-${Date.now().toString(36)}`;
  }

  const { data, error } = await supabase
    .from("products")
    .insert(product)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateProduct(id: string, formData: FormData) {
  const supabase = await createClient();

  const updates: ProductUpdate = {
    name_en: formData.get("name_en") as string,
    name_ar: formData.get("name_ar") as string,
    description_en: (formData.get("description_en") as string) || null,
    description_ar: (formData.get("description_ar") as string) || null,
    short_description_en: (formData.get("short_description_en") as string) || null,
    short_description_ar: (formData.get("short_description_ar") as string) || null,
    price: parseFloat(formData.get("price") as string) || 0,
    compare_at_price: formData.get("compare_at_price")
      ? parseFloat(formData.get("compare_at_price") as string)
      : null,
    category_id: (formData.get("category_id") as string) || null,
    sku: (formData.get("sku") as string) || null,
    stock_quantity: parseInt(formData.get("stock_quantity") as string) || 0,
    is_active: formData.get("is_active") === "true",
    is_featured: formData.get("is_featured") === "true",
    size: (formData.get("size") as string) || null,
    scent_en: (formData.get("scent_en") as string) || null,
    scent_ar: (formData.get("scent_ar") as string) || null,
  };

  const { data, error } = await supabase
    .from("products")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteProduct(id: string) {
  const supabase = await createClient();

  // Delete product images from storage first
  const { data: images } = await supabase
    .from("product_images")
    .select("image_path")
    .eq("product_id", id);

  if (images && images.length > 0) {
    const paths = images.map((img) => img.image_path);
    await supabase.storage.from("product-images").remove(paths);
  }

  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function toggleProductStatus(id: string, isActive: boolean) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("products")
    .update({ is_active: isActive })
    .eq("id", id);

  if (error) throw new Error(error.message);
}

export async function uploadProductImage(productId: string, file: File) {
  const supabase = await createClient();

  const fileExt = file.name.split(".").pop();
  const fileName = `${productId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("product-images")
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) throw new Error(uploadError.message);

  // Check if this is the first image — make it primary
  const { data: existingImages } = await supabase
    .from("product_images")
    .select("id")
    .eq("product_id", productId);

  const isPrimary = !existingImages || existingImages.length === 0;

  const { data, error } = await supabase
    .from("product_images")
    .insert({
      product_id: productId,
      image_path: fileName,
      position: existingImages?.length || 0,
      is_primary: isPrimary,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteProductImage(imageId: string, imagePath: string) {
  const supabase = await createClient();

  // Delete from storage
  await supabase.storage.from("product-images").remove([imagePath]);

  // Delete from database
  const { error } = await supabase
    .from("product_images")
    .delete()
    .eq("id", imageId);

  if (error) throw new Error(error.message);
}

export async function setPrimaryImage(productId: string, imageId: string) {
  const supabase = await createClient();

  // Reset all images for this product
  await supabase
    .from("product_images")
    .update({ is_primary: false })
    .eq("product_id", productId);

  // Set the selected image as primary
  const { error } = await supabase
    .from("product_images")
    .update({ is_primary: true })
    .eq("id", imageId);

  if (error) throw new Error(error.message);
}

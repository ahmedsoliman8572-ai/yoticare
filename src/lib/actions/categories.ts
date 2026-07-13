"use server";

import { createClient } from "@/lib/supabase/server";

export async function getCategories(activeOnly = false) {
  const supabase = await createClient();

  let query = supabase
    .from("categories")
    .select("*")
    .order("position", { ascending: true });

  if (activeOnly) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data;
}

export async function getCategoryBySlug(slug: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) return null;
  return data;
}

export async function createCategory(formData: FormData) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("categories")
    .insert({
      name_en: formData.get("name_en") as string,
      name_ar: formData.get("name_ar") as string,
      slug: (formData.get("slug") as string)
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, ""),
      description_en: (formData.get("description_en") as string) || null,
      description_ar: (formData.get("description_ar") as string) || null,
      position: parseInt(formData.get("position") as string) || 0,
      is_active: formData.get("is_active") === "true",
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateCategory(id: string, formData: FormData) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("categories")
    .update({
      name_en: formData.get("name_en") as string,
      name_ar: formData.get("name_ar") as string,
      description_en: (formData.get("description_en") as string) || null,
      description_ar: (formData.get("description_ar") as string) || null,
      position: parseInt(formData.get("position") as string) || 0,
      is_active: formData.get("is_active") === "true",
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteCategory(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

"use server";

import { createClient } from "@/lib/supabase/server";

export async function getPaymentMethods(activeOnly = false) {
  const supabase = await createClient();

  let query = supabase
    .from("payment_methods")
    .select("*")
    .order("position", { ascending: true });

  if (activeOnly) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data;
}

export async function updatePaymentMethod(id: string, formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("payment_methods")
    .update({
      label_en: formData.get("label_en") as string,
      label_ar: formData.get("label_ar") as string,
      instructions_en: (formData.get("instructions_en") as string) || null,
      instructions_ar: (formData.get("instructions_ar") as string) || null,
      wallet_number: (formData.get("wallet_number") as string) || null,
      account_name: (formData.get("account_name") as string) || null,
      is_active: formData.get("is_active") === "true",
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
}

export async function togglePaymentMethodStatus(id: string, isActive: boolean) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("payment_methods")
    .update({ is_active: isActive })
    .eq("id", id);

  if (error) throw new Error(error.message);
}

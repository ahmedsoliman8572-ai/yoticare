"use server";

import { createClient } from "@/lib/supabase/server";

export async function getSettings() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("site_settings")
    .select("*")
    .order("key");

  if (error) throw new Error(error.message);

  // Convert array to key-value map
  const settingsMap: Record<string, string> = {};
  data.forEach((setting) => {
    settingsMap[setting.key] = setting.value;
  });

  return settingsMap;
}

export async function updateSettings(settings: Record<string, string>) {
  const supabase = await createClient();

  const updates = Object.entries(settings).map(([key, value]) => ({
    key,
    value,
  }));

  for (const update of updates) {
    const { error } = await supabase
      .from("site_settings")
      .update({ value: update.value, updated_at: new Date().toISOString() })
      .eq("key", update.key);

    if (error) throw new Error(error.message);
  }
}

export async function getSetting(key: string): Promise<string> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", key)
    .single();

  if (error) return "";
  return data.value;
}

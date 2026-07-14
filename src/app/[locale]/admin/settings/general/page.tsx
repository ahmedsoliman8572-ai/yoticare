"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Settings, Loader2 } from "lucide-react";

export default function GeneralSettingsPage() {
  const t = useTranslations("admin.siteForm");
  const locale = useLocale();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const supabase = createClient();
      const { data } = await supabase.from("site_settings").select("*");
      const map: Record<string, string> = {};
      (data || []).forEach((s: { key: string; value: string }) => { map[s.key] = s.value; });
      setSettings(map);
      setLoading(false);
    };
    fetch();
  }, []);

  const update = (key: string, value: string) => setSettings((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    const supabase = createClient();
    for (const [key, value] of Object.entries(settings)) {
      await supabase.from("site_settings").upsert({ key, value, updated_at: new Date().toISOString() });
    }
    toast.success(t("saved"));
    setSaving(false);
  };

  const inputClass = "w-full px-4 py-2.5 rounded-lg border border-border focus:outline-none focus:border-primary focus:ring-2 focus:ring-ring text-sm";

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold font-heading text-text">{t("title")}</h1>
        <p className="text-text-secondary text-sm mt-1">{t("subtitle")}</p>
      </div>

      {/* Store Info */}
      <div className="bg-white rounded-xl border border-border-light p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Settings className="w-5 h-5 text-primary" />{locale === "ar" ? "معلومات المتجر" : "Store Information"}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium mb-1.5">{t("storeNameEn")}</label><input value={settings.store_name_en || ""} onChange={(e) => update("store_name_en", e.target.value)} className={inputClass} /></div>
          <div><label className="block text-sm font-medium mb-1.5">{t("storeNameAr")}</label><input dir="rtl" value={settings.store_name_ar || ""} onChange={(e) => update("store_name_ar", e.target.value)} className={inputClass} /></div>
          <div><label className="block text-sm font-medium mb-1.5">{t("descriptionEn")}</label><textarea rows={3} value={settings.store_description_en || ""} onChange={(e) => update("store_description_en", e.target.value)} className={inputClass} /></div>
          <div><label className="block text-sm font-medium mb-1.5">{t("descriptionAr")}</label><textarea dir="rtl" rows={3} value={settings.store_description_ar || ""} onChange={(e) => update("store_description_ar", e.target.value)} className={inputClass} /></div>
        </div>
      </div>

      {/* Contact */}
      <div className="bg-white rounded-xl border border-border-light p-6">
        <h2 className="text-lg font-semibold mb-4">{locale === "ar" ? "معلومات التواصل" : "Contact Information"}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium mb-1.5">{t("phone")}</label><input dir="ltr" value={settings.contact_phone || ""} onChange={(e) => update("contact_phone", e.target.value)} className={inputClass} placeholder="+20 1XX XXX XXXX" /></div>
          <div><label className="block text-sm font-medium mb-1.5">{t("whatsapp")}</label><input dir="ltr" value={settings.whatsapp_number || ""} onChange={(e) => update("whatsapp_number", e.target.value)} className={inputClass} placeholder="+201XXXXXXXXX" /></div>
          <div><label className="block text-sm font-medium mb-1.5">{t("email")}</label><input value={settings.contact_email || ""} onChange={(e) => update("contact_email", e.target.value)} className={inputClass} placeholder="info@yoticare.com" /></div>
          <div><label className="block text-sm font-medium mb-1.5">{t("defaultShipping")}</label><input type="number" value={settings.default_shipping_cost || ""} onChange={(e) => update("default_shipping_cost", e.target.value)} className={inputClass} /></div>
        </div>
      </div>

      {/* Social */}
      <div className="bg-white rounded-xl border border-border-light p-6">
        <h2 className="text-lg font-semibold mb-4">{locale === "ar" ? "روابط التواصل الاجتماعي" : "Social Media Links"}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium mb-1.5">{t("facebook")}</label><input dir="ltr" value={settings.facebook_url || ""} onChange={(e) => update("facebook_url", e.target.value)} className={inputClass} placeholder="https://facebook.com/yoticare" /></div>
          <div><label className="block text-sm font-medium mb-1.5">{t("instagram")}</label><input dir="ltr" value={settings.instagram_url || ""} onChange={(e) => update("instagram_url", e.target.value)} className={inputClass} placeholder="https://instagram.com/yoticare" /></div>
          <div><label className="block text-sm font-medium mb-1.5">{t("tiktok")}</label><input dir="ltr" value={settings.tiktok_url || ""} onChange={(e) => update("tiktok_url", e.target.value)} className={inputClass} placeholder="https://tiktok.com/@yoticare" /></div>
        </div>
      </div>

      {/* Marketing Pixels */}
      <div className="bg-white rounded-xl border border-border-light p-6">
        <h2 className="text-lg font-semibold mb-4">{locale === "ar" ? "تتبع الإعلانات (Pixels)" : "Pixel Tracking"}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium mb-1.5">{t("facebookPixel")}</label><input dir="ltr" value={settings.facebook_pixel || ""} onChange={(e) => update("facebook_pixel", e.target.value)} className={inputClass} placeholder="ID (e.g. 123456789)" /></div>
          <div><label className="block text-sm font-medium mb-1.5">{t("tiktokPixel")}</label><input dir="ltr" value={settings.tiktok_pixel || ""} onChange={(e) => update("tiktok_pixel", e.target.value)} className={inputClass} placeholder="ID (e.g. C123...)" /></div>
          <div><label className="block text-sm font-medium mb-1.5">{t("snapchatPixel")}</label><input dir="ltr" value={settings.snapchat_pixel || ""} onChange={(e) => update("snapchat_pixel", e.target.value)} className={inputClass} placeholder="ID" /></div>
          <div><label className="block text-sm font-medium mb-1.5">{t("googleAnalytics")}</label><input dir="ltr" value={settings.google_analytics || ""} onChange={(e) => update("google_analytics", e.target.value)} className={inputClass} placeholder="G-XXXXXXXXXX" /></div>
        </div>
      </div>

      {/* Store Policies */}
      <div className="bg-white rounded-xl border border-border-light p-6">
        <h2 className="text-lg font-semibold mb-4">{locale === "ar" ? "سياسات المتجر" : "Store Policies"}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="font-medium text-primary">{locale === "ar" ? "سياسة الشحن" : "Shipping Policy"}</h3>
            <div><label className="block text-sm font-medium mb-1.5">{t("en")}</label><textarea rows={3} value={settings.shipping_policy_en || ""} onChange={(e) => update("shipping_policy_en", e.target.value)} className={inputClass} /></div>
            <div><label className="block text-sm font-medium mb-1.5">{t("ar")}</label><textarea dir="rtl" rows={3} value={settings.shipping_policy_ar || ""} onChange={(e) => update("shipping_policy_ar", e.target.value)} className={inputClass} /></div>
          </div>
          <div className="space-y-4">
            <h3 className="font-medium text-primary">{locale === "ar" ? "سياسة الاسترجاع" : "Return Policy"}</h3>
            <div><label className="block text-sm font-medium mb-1.5">{t("en")}</label><textarea rows={3} value={settings.return_policy_en || ""} onChange={(e) => update("return_policy_en", e.target.value)} className={inputClass} /></div>
            <div><label className="block text-sm font-medium mb-1.5">{t("ar")}</label><textarea dir="rtl" rows={3} value={settings.return_policy_ar || ""} onChange={(e) => update("return_policy_ar", e.target.value)} className={inputClass} /></div>
          </div>
          <div className="space-y-4 md:col-span-2">
            <h3 className="font-medium text-primary">{locale === "ar" ? "سياسة الاستبدال" : "Exchange Policy"}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div><label className="block text-sm font-medium mb-1.5">{t("en")}</label><textarea rows={3} value={settings.exchange_policy_en || ""} onChange={(e) => update("exchange_policy_en", e.target.value)} className={inputClass} /></div>
              <div><label className="block text-sm font-medium mb-1.5">{t("ar")}</label><textarea dir="rtl" rows={3} value={settings.exchange_policy_ar || ""} onChange={(e) => update("exchange_policy_ar", e.target.value)} className={inputClass} /></div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 px-8 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark disabled:opacity-50 shadow-sm">
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}{saving ? (locale === "ar" ? "جاري الحفظ..." : "Saving...") : (locale === "ar" ? "حفظ الإعدادات" : "Save Settings")}
        </button>
      </div>
    </div>
  );
}

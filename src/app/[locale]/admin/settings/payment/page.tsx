"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { CreditCard, Loader2, ToggleLeft, ToggleRight } from "lucide-react";

interface PaymentMethod { id: string; type: string; label_en: string; label_ar: string; instructions_en: string | null; instructions_ar: string | null; wallet_number: string | null; account_name: string | null; is_active: boolean; position: number; }

export default function PaymentSettingsPage() {
  const t = useTranslations("admin.paymentForm");
  const locale = useLocale();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      const supabase = createClient();
      const { data } = await supabase.from("payment_methods").select("*").order("position");
      setMethods((data as PaymentMethod[]) || []);
      setLoading(false);
    };
    fetch();
  }, []);

  const updateMethod = (id: string, field: string, value: string | boolean) => {
    setMethods((prev) => prev.map((m) => m.id === id ? { ...m, [field]: value } : m));
  };

  const handleSave = async (method: PaymentMethod) => {
    setSaving(method.id);
    const supabase = createClient();
    await supabase.from("payment_methods").update({
      label_en: method.label_en, label_ar: method.label_ar,
      instructions_en: method.instructions_en, instructions_ar: method.instructions_ar,
      wallet_number: method.wallet_number, account_name: method.account_name,
      is_active: method.is_active,
    }).eq("id", method.id);
    toast.success(t("saved"));
    setSaving(null);
  };

  const inputClass = "w-full px-4 py-2.5 rounded-lg border border-border focus:outline-none focus:border-primary focus:ring-2 focus:ring-ring text-sm";

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold font-heading text-text">{t("title")}</h1>
        <p className="text-text-secondary text-sm mt-1">{t("subtitle")}</p>
      </div>

      <div className="space-y-6">
        {methods.map((method) => (
          <div key={method.id} className="bg-white rounded-xl border border-border-light p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold">{locale === "ar" ? method.label_ar : method.label_en}</h2>
              </div>
              <button onClick={() => updateMethod(method.id, "is_active", !method.is_active)} className="flex items-center gap-2">
                {method.is_active ? <ToggleRight className="w-8 h-8 text-success" /> : <ToggleLeft className="w-8 h-8 text-text-muted" />}
                <span className={`text-sm font-medium ${method.is_active ? "text-success" : "text-text-muted"}`}>
                  {method.is_active ? t("enabled") : t("disabled")}
                </span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(method.type === "vodafone_cash" || method.type === "instapay") && (
                <>
                  <div><label className="block text-sm font-medium mb-1.5">{t("walletNumber")}</label><input value={method.wallet_number || ""} onChange={(e) => updateMethod(method.id, "wallet_number", e.target.value)} className={inputClass} dir="ltr" placeholder="01XXXXXXXXX" /></div>
                  <div><label className="block text-sm font-medium mb-1.5">{t("accountName")}</label><input value={method.account_name || ""} onChange={(e) => updateMethod(method.id, "account_name", e.target.value)} className={inputClass} /></div>
                </>
              )}
              <div><label className="block text-sm font-medium mb-1.5">{t("instructionsEn")}</label><textarea rows={3} value={method.instructions_en || ""} onChange={(e) => updateMethod(method.id, "instructions_en", e.target.value)} className={inputClass} /></div>
              <div><label className="block text-sm font-medium mb-1.5">{t("instructionsAr")}</label><textarea rows={3} dir="rtl" value={method.instructions_ar || ""} onChange={(e) => updateMethod(method.id, "instructions_ar", e.target.value)} className={inputClass} /></div>
            </div>

            <div className="flex justify-end mt-4">
              <button onClick={() => handleSave(method)} disabled={saving === method.id}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark disabled:opacity-50 text-sm">
                {saving === method.id && <Loader2 className="w-4 h-4 animate-spin" />}{locale === "ar" ? "حفظ" : "Save"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

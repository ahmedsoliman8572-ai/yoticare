"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, Truck, Loader2 } from "lucide-react";
import { EGYPT_GOVERNORATES } from "@/lib/data/governorates";

interface ShippingZone {
  id: string;
  governorate_en: string;
  governorate_ar: string;
  cost: number;
  is_active: boolean;
}

export default function ShippingZonesPage() {
  const t = useTranslations("admin");
  const locale = useLocale();
  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<ShippingZone | null>(null);
  const [form, setForm] = useState({ governorate_en: "", governorate_ar: "", cost: 50, is_active: true });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchZones();
  }, []);

  const fetchZones = async () => {
    const supabase = createClient();
    const { data } = await supabase.from("shipping_zones").select("*").order("governorate_en");
    setZones(data || []);
    setLoading(false);
  };

  const openModal = (zone?: ShippingZone) => {
    if (zone) {
      setEditingZone(zone);
      setForm({ ...zone });
    } else {
      setEditingZone(null);
      setForm({ governorate_en: "", governorate_ar: "", cost: 50, is_active: true });
    }
    setIsModalOpen(true);
  };

  const saveZone = async () => {
    if (!form.governorate_en || !form.governorate_ar) {
      toast.error(locale === "ar" ? "يرجى ملء جميع الحقول المطلوبة" : "Please fill required fields");
      return;
    }
    setSaving(true);
    const supabase = createClient();
    if (editingZone) {
      const { error } = await supabase.from("shipping_zones").update(form).eq("id", editingZone.id);
      if (error) toast.error(error.message);
      else toast.success(locale === "ar" ? "تم التحديث بنجاح" : "Updated successfully");
    } else {
      const { error } = await supabase.from("shipping_zones").insert([form]);
      if (error) toast.error(error.message);
      else toast.success(locale === "ar" ? "تمت الإضافة بنجاح" : "Added successfully");
    }
    setSaving(false);
    setIsModalOpen(false);
    fetchZones();
  };

  const deleteZone = async (id: string) => {
    if (!confirm(locale === "ar" ? "هل أنت متأكد من الحذف؟" : "Are you sure?")) return;
    const supabase = createClient();
    await supabase.from("shipping_zones").delete().eq("id", id);
    toast.success(locale === "ar" ? "تم الحذف بنجاح" : "Deleted successfully");
    fetchZones();
  };

  const inputClass = "w-full px-4 py-2.5 rounded-lg border border-border focus:outline-none focus:border-primary focus:ring-2 focus:ring-ring text-sm";

  if (loading) return <div className="flex justify-center py-24"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading text-text">{t("shipping")}</h1>
          <p className="text-text-secondary text-sm mt-1">{locale === "ar" ? "إدارة أسعار الشحن للمحافظات" : "Manage shipping costs by governorate"}</p>
        </div>
        <button onClick={() => openModal()} className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark">
          <Plus className="w-4 h-4" />
          <span>{locale === "ar" ? "إضافة محافظة" : "Add Governorate"}</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-border-light overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-border">
              <tr>
                <th className="p-4 font-semibold text-text-secondary">{locale === "ar" ? "المحافظة (عربي)" : "Governorate (Ar)"}</th>
                <th className="p-4 font-semibold text-text-secondary">{locale === "ar" ? "المحافظة (إنجليزي)" : "Governorate (En)"}</th>
                <th className="p-4 font-semibold text-text-secondary">{locale === "ar" ? "تكلفة الشحن (ج.م)" : "Shipping Cost (EGP)"}</th>
                <th className="p-4 font-semibold text-text-secondary text-right">{locale === "ar" ? "إجراءات" : "Actions"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {zones.map((zone) => (
                <tr key={zone.id} className="hover:bg-gray-50/50">
                  <td className="p-4">{zone.governorate_ar}</td>
                  <td className="p-4">{zone.governorate_en}</td>
                  <td className="p-4 font-medium text-primary">{zone.cost}</td>
                  <td className="p-4 flex items-center justify-end gap-2">
                    <button onClick={() => openModal(zone)} className="p-2 text-text-secondary hover:text-primary hover:bg-primary-50 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => deleteZone(zone.id)} className="p-2 text-text-secondary hover:text-error hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
              {zones.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-text-muted">
                    <Truck className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    {locale === "ar" ? "لا توجد محافظات مضافة، سيتم استخدام التكلفة الافتراضية" : "No zones added. Default shipping cost will be used."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <h3 className="text-xl font-bold mb-4">{editingZone ? (locale === "ar" ? "تعديل محافظة" : "Edit Governorate") : (locale === "ar" ? "إضافة محافظة" : "Add Governorate")}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">{locale === "ar" ? "اختر المحافظة" : "Select Governorate"}</label>
                <select
                  value={form.governorate_en}
                  onChange={(e) => {
                    const gov = EGYPT_GOVERNORATES.find(g => g.en === e.target.value);
                    if (gov) setForm({ ...form, governorate_en: gov.en, governorate_ar: gov.ar });
                  }}
                  className={inputClass}
                >
                  <option value="">{locale === "ar" ? "اختر المحافظة" : "Select Governorate"}</option>
                  {EGYPT_GOVERNORATES.map((gov) => (
                    <option key={gov.en} value={gov.en}>{locale === "ar" ? gov.ar : gov.en}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">{locale === "ar" ? "تكلفة الشحن (ج.م)" : "Shipping Cost (EGP)"}</label>
                <input type="number" value={form.cost} onChange={(e) => setForm({ ...form, cost: Number(e.target.value) })} className={inputClass} />
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 border border-border rounded-lg hover:bg-gray-50">{locale === "ar" ? "إلغاء" : "Cancel"}</button>
                <button onClick={saveZone} disabled={saving} className="flex-1 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark">
                  {saving ? <Loader2 className="w-4 h-4 mx-auto animate-spin" /> : (locale === "ar" ? "حفظ" : "Save")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

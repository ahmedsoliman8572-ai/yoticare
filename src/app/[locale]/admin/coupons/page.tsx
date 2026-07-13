"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Edit2, Tag } from "lucide-react";

interface Coupon {
  id: string;
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  min_order_value: number;
  max_discount: number | null;
  expiry_date: string | null;
  usage_limit: number | null;
  times_used: number;
  is_active: boolean;
}

export default function CouponsPage() {
  const t = useTranslations("admin");
  const locale = useLocale();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [form, setForm] = useState<Partial<Coupon>>({
    code: "", discount_type: "percentage", discount_value: 0, min_order_value: 0, max_discount: null, expiry_date: "", usage_limit: null, is_active: true
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    const supabase = createClient();
    const { data } = await supabase.from("coupons").select("*").order("created_at", { ascending: false });
    setCoupons(data || []);
    setLoading(false);
  };

  const openModal = (coupon?: Coupon) => {
    if (coupon) {
      setEditingCoupon(coupon);
      setForm({ ...coupon });
    } else {
      setEditingCoupon(null);
      setForm({ code: "", discount_type: "percentage", discount_value: 0, min_order_value: 0, max_discount: null, expiry_date: "", usage_limit: null, is_active: true });
    }
    setIsModalOpen(true);
  };

  const saveCoupon = async () => {
    if (!form.code || form.discount_value === undefined) {
      toast.error(locale === "ar" ? "يرجى ملء جميع الحقول المطلوبة" : "Please fill required fields");
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const payload = {
      ...form,
      max_discount: form.max_discount || null,
      expiry_date: form.expiry_date || null,
      usage_limit: form.usage_limit || null,
    };
    
    if (editingCoupon) {
      const { error } = await supabase.from("coupons").update(payload).eq("id", editingCoupon.id);
      if (error) toast.error(error.message);
      else toast.success(locale === "ar" ? "تم التحديث بنجاح" : "Updated successfully");
    } else {
      const { error } = await supabase.from("coupons").insert([payload]);
      if (error) toast.error(error.message);
      else toast.success(locale === "ar" ? "تمت الإضافة بنجاح" : "Added successfully");
    }
    setSaving(false);
    setIsModalOpen(false);
    fetchCoupons();
  };

  const deleteCoupon = async (id: string) => {
    if (!confirm(locale === "ar" ? "هل أنت متأكد من الحذف؟" : "Are you sure?")) return;
    const supabase = createClient();
    await supabase.from("coupons").delete().eq("id", id);
    toast.success(locale === "ar" ? "تم الحذف بنجاح" : "Deleted successfully");
    fetchCoupons();
  };

  const inputClass = "w-full px-4 py-2.5 rounded-lg border border-border focus:outline-none focus:border-primary focus:ring-2 focus:ring-ring text-sm";

  if (loading) return <div className="flex justify-center py-24"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading text-text">{t("coupons")}</h1>
          <p className="text-text-secondary text-sm mt-1">{locale === "ar" ? "إدارة كوبونات الخصم والعروض" : "Manage discount coupons"}</p>
        </div>
        <button onClick={() => openModal()} className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark">
          <Plus className="w-4 h-4" />
          <span>{locale === "ar" ? "إضافة كوبون" : "Add Coupon"}</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-border-light overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-border">
              <tr>
                <th className="p-4 font-semibold text-text-secondary">{locale === "ar" ? "الكود" : "Code"}</th>
                <th className="p-4 font-semibold text-text-secondary">{locale === "ar" ? "الخصم" : "Discount"}</th>
                <th className="p-4 font-semibold text-text-secondary">{locale === "ar" ? "الاستخدام" : "Usage"}</th>
                <th className="p-4 font-semibold text-text-secondary">{locale === "ar" ? "الحالة" : "Status"}</th>
                <th className="p-4 font-semibold text-text-secondary text-right">{locale === "ar" ? "إجراءات" : "Actions"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {coupons.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50/50">
                  <td className="p-4 font-bold font-mono">{c.code}</td>
                  <td className="p-4">
                    {c.discount_type === "percentage" ? `${c.discount_value}%` : `${c.discount_value} EGP`}
                  </td>
                  <td className="p-4 text-text-muted">
                    {c.times_used} / {c.usage_limit || "∞"}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${c.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {c.is_active ? (locale === "ar" ? "نشط" : "Active") : (locale === "ar" ? "غير نشط" : "Inactive")}
                    </span>
                  </td>
                  <td className="p-4 flex items-center justify-end gap-2">
                    <button onClick={() => openModal(c)} className="p-2 text-text-secondary hover:text-primary hover:bg-primary-50 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => deleteCoupon(c.id)} className="p-2 text-text-secondary hover:text-error hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
              {coupons.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-text-muted">
                    <Tag className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    {locale === "ar" ? "لا توجد كوبونات مضافة" : "No coupons added yet."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-xl p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">{editingCoupon ? (locale === "ar" ? "تعديل كوبون" : "Edit Coupon") : (locale === "ar" ? "إضافة كوبون" : "Add Coupon")}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">{locale === "ar" ? "كود الخصم" : "Coupon Code"}</label>
                <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase().replace(/\s/g, "") })} className={inputClass} placeholder="e.g. SUMMER24" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">{locale === "ar" ? "نوع الخصم" : "Discount Type"}</label>
                  <select value={form.discount_type} onChange={(e) => setForm({ ...form, discount_type: e.target.value as "percentage" | "fixed" })} className={inputClass}>
                    <option value="percentage">{locale === "ar" ? "نسبة مئوية (%)" : "Percentage (%)"}</option>
                    <option value="fixed">{locale === "ar" ? "مبلغ ثابت (ج.م)" : "Fixed Amount (EGP)"}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">{locale === "ar" ? "قيمة الخصم" : "Discount Value"}</label>
                  <input type="number" value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: Number(e.target.value) })} className={inputClass} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">{locale === "ar" ? "الحد الأدنى للطلب (اختياري)" : "Min Order Value"}</label>
                  <input type="number" value={form.min_order_value || ""} onChange={(e) => setForm({ ...form, min_order_value: Number(e.target.value) })} className={inputClass} />
                </div>
                {form.discount_type === "percentage" && (
                  <div>
                    <label className="block text-sm font-medium mb-1.5">{locale === "ar" ? "الحد الأقصى للخصم (اختياري)" : "Max Discount Amount"}</label>
                    <input type="number" value={form.max_discount || ""} onChange={(e) => setForm({ ...form, max_discount: Number(e.target.value) })} className={inputClass} />
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">{locale === "ar" ? "حد الاستخدام (مرات)" : "Usage Limit"}</label>
                  <input type="number" value={form.usage_limit || ""} onChange={(e) => setForm({ ...form, usage_limit: Number(e.target.value) })} className={inputClass} placeholder="∞" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">{locale === "ar" ? "تاريخ الانتهاء" : "Expiry Date"}</label>
                  <input type="datetime-local" value={form.expiry_date ? new Date(form.expiry_date).toISOString().slice(0, 16) : ""} onChange={(e) => setForm({ ...form, expiry_date: e.target.value ? new Date(e.target.value).toISOString() : "" })} className={inputClass} />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer mt-2">
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="w-4 h-4 rounded" />
                <span className="text-sm font-medium">{locale === "ar" ? "الكوبون فعال" : "Coupon is active"}</span>
              </label>
              
              <div className="flex gap-3 pt-4">
                <button onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 border border-border rounded-lg hover:bg-gray-50">{locale === "ar" ? "إلغاء" : "Cancel"}</button>
                <button onClick={saveCoupon} disabled={saving} className="flex-1 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark">
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

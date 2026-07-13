"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Edit2, Check, X } from "lucide-react";
import { useLocale } from "next-intl";

export default function ProductVariantsTab({ productId }: { productId: string }) {
  const locale = useLocale();
  const [variants, setVariants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState<any>(null);
  const [form, setForm] = useState({ name_en: "", name_ar: "", price: "", stock_quantity: "0", is_active: true });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchVariants();
  }, [productId]);

  const fetchVariants = async () => {
    const supabase = createClient();
    const { data } = await supabase.from("product_variants").select("*").eq("product_id", productId).order("position");
    setVariants(data || []);
    setLoading(false);
  };

  const openModal = (v?: any) => {
    if (v) {
      setEditingVariant(v);
      setForm({ name_en: v.name_en, name_ar: v.name_ar, price: v.price.toString(), stock_quantity: v.stock_quantity.toString(), is_active: v.is_active });
    } else {
      setEditingVariant(null);
      setForm({ name_en: "", name_ar: "", price: "", stock_quantity: "0", is_active: true });
    }
    setIsModalOpen(true);
  };

  const saveVariant = async () => {
    if (!form.name_en || !form.name_ar || !form.price) {
      toast.error(locale === "ar" ? "يرجى ملء جميع الحقول المطلوبة" : "Please fill required fields");
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const payload = {
      product_id: productId,
      name_en: form.name_en,
      name_ar: form.name_ar,
      price: parseFloat(form.price),
      stock_quantity: parseInt(form.stock_quantity),
      is_active: form.is_active,
    };
    
    if (editingVariant) {
      const { error } = await supabase.from("product_variants").update(payload).eq("id", editingVariant.id);
      if (error) toast.error(error.message);
      else toast.success(locale === "ar" ? "تم تحديث المتغير بنجاح" : "Variant updated successfully");
    } else {
      const { error } = await supabase.from("product_variants").insert([payload]);
      if (error) toast.error(error.message);
      else toast.success(locale === "ar" ? "تم إضافة المتغير بنجاح" : "Variant added successfully");
    }
    setSaving(false);
    setIsModalOpen(false);
    fetchVariants();
  };

  const deleteVariant = async (id: string) => {
    if (!confirm(locale === "ar" ? "هل أنت متأكد من الحذف؟" : "Are you sure?")) return;
    const supabase = createClient();
    await supabase.from("product_variants").delete().eq("id", id);
    toast.success(locale === "ar" ? "تم الحذف بنجاح" : "Deleted successfully");
    fetchVariants();
  };

  if (loading) return <div className="py-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-lg">{locale === "ar" ? "المتغيرات (خيارات المنتج)" : "Product Variants"}</h3>
        <button onClick={() => openModal()} className="px-3 py-1.5 bg-primary text-white text-sm font-medium rounded-lg flex items-center gap-1 hover:bg-primary-dark">
          <Plus className="w-4 h-4" />
          {locale === "ar" ? "إضافة متغير" : "Add Variant"}
        </button>
      </div>

      {variants.length === 0 ? (
        <div className="text-center py-8 text-text-muted border-2 border-dashed border-border rounded-lg">
          {locale === "ar" ? "لا توجد متغيرات لهذا المنتج. سيتم استخدام السعر والمخزون الأساسي للمنتج." : "No variants added. The base product price and stock will be used."}
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b border-border">
              <tr>
                <th className="p-3 font-semibold text-text-secondary">{locale === "ar" ? "الاسم" : "Name"}</th>
                <th className="p-3 font-semibold text-text-secondary">{locale === "ar" ? "السعر" : "Price"}</th>
                <th className="p-3 font-semibold text-text-secondary">{locale === "ar" ? "المخزون" : "Stock"}</th>
                <th className="p-3 font-semibold text-text-secondary">{locale === "ar" ? "الحالة" : "Status"}</th>
                <th className="p-3 font-semibold text-text-secondary text-right">{locale === "ar" ? "إجراءات" : "Actions"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {variants.map((v) => (
                <tr key={v.id} className="hover:bg-gray-50">
                  <td className="p-3 font-medium">{locale === "ar" ? v.name_ar : v.name_en}</td>
                  <td className="p-3">{v.price} EGP</td>
                  <td className="p-3">{v.stock_quantity}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${v.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {v.is_active ? (locale === "ar" ? "نشط" : "Active") : (locale === "ar" ? "غير نشط" : "Inactive")}
                    </span>
                  </td>
                  <td className="p-3 flex justify-end gap-2">
                    <button onClick={() => openModal(v)} className="p-1.5 text-text-secondary hover:text-primary bg-white rounded shadow-sm border border-border"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => deleteVariant(v.id)} className="p-1.5 text-error hover:bg-red-50 bg-white rounded shadow-sm border border-border"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl">
            <h3 className="text-xl font-bold mb-4">{editingVariant ? (locale === "ar" ? "تعديل المتغير" : "Edit Variant") : (locale === "ar" ? "إضافة متغير" : "Add Variant")}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">{locale === "ar" ? "الاسم (انجليزي)" : "Name (EN)"}</label>
                <input value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none" placeholder="e.g. Vanilla 100ml" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{locale === "ar" ? "الاسم (عربي)" : "Name (AR)"}</label>
                <input value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none" placeholder="مثال: فانيليا ١٠٠ مل" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">{locale === "ar" ? "السعر" : "Price"}</label>
                  <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{locale === "ar" ? "المخزون" : "Stock Quantity"}</label>
                  <input type="number" value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none" />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer mt-2">
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="w-4 h-4 rounded" />
                <span className="text-sm font-medium">{locale === "ar" ? "متغير نشط ومتاح للبيع" : "Variant is active"}</span>
              </label>
              
              <div className="flex gap-2 pt-4">
                <button onClick={() => setIsModalOpen(false)} className="flex-1 py-2 border rounded-lg">{locale === "ar" ? "إلغاء" : "Cancel"}</button>
                <button onClick={saveVariant} disabled={saving} className="flex-1 py-2 bg-primary text-white rounded-lg flex items-center justify-center">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : (locale === "ar" ? "حفظ" : "Save")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

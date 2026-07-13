"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, FolderOpen, ToggleLeft, ToggleRight, X, Loader2 } from "lucide-react";

interface CategoryRow { id: string; name_en: string; name_ar: string; slug: string; description_en: string | null; description_ar: string | null; position: number; is_active: boolean; }

export default function AdminCategoriesPage() {
  const t = useTranslations("admin");
  const tForm = useTranslations("admin.categoryForm");
  const locale = useLocale();
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<CategoryRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name_en: "", name_ar: "", slug: "", description_en: "", description_ar: "", position: "0", is_active: true });

  const fetchCategories = async () => {
    const supabase = createClient();
    const { data } = await supabase.from("categories").select("*").order("position");
    setCategories((data as CategoryRow[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchCategories(); }, []);

  const resetForm = () => { setForm({ name_en: "", name_ar: "", slug: "", description_en: "", description_ar: "", position: "0", is_active: true }); setEditing(null); setShowForm(false); };

  const openEdit = (cat: CategoryRow) => {
    setEditing(cat);
    setForm({ name_en: cat.name_en, name_ar: cat.name_ar, slug: cat.slug, description_en: cat.description_en || "", description_ar: cat.description_ar || "", position: cat.position.toString(), is_active: cat.is_active });
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const supabase = createClient();
    const data = { name_en: form.name_en, name_ar: form.name_ar, slug: form.slug.toLowerCase().replace(/[^a-z0-9-]/g, "-"), description_en: form.description_en || null, description_ar: form.description_ar || null, position: parseInt(form.position), is_active: form.is_active };
    if (editing) {
      await supabase.from("categories").update(data).eq("id", editing.id);
    } else {
      await supabase.from("categories").insert(data);
    }
    toast.success(tForm("saved"));
    resetForm();
    fetchCategories();
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(tForm("confirmDelete"))) return;
    const supabase = createClient();
    await supabase.from("categories").delete().eq("id", id);
    toast.success(tForm("deleted"));
    fetchCategories();
  };

  const handleToggle = async (id: string, current: boolean) => {
    const supabase = createClient();
    await supabase.from("categories").update({ is_active: !current }).eq("id", id);
    fetchCategories();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-heading text-text">{t("categories")}</h1>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors">
          <Plus className="w-4 h-4" />{tForm("newCategory")}
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="bg-white rounded-xl border border-border-light p-6 animate-fade-in-up">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">{editing ? tForm("editCategory") : tForm("newCategory")}</h2>
            <button onClick={resetForm} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1.5">{tForm("nameEn")}</label><input value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value, slug: form.slug || e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "-") })} className="w-full px-4 py-2.5 rounded-lg border border-border focus:outline-none focus:border-primary focus:ring-2 focus:ring-ring" /></div>
            <div><label className="block text-sm font-medium mb-1.5">{tForm("nameAr")}</label><input dir="rtl" value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} className="w-full px-4 py-2.5 rounded-lg border border-border focus:outline-none focus:border-primary focus:ring-2 focus:ring-ring" /></div>
            <div><label className="block text-sm font-medium mb-1.5">{tForm("descEn")}</label><textarea rows={3} value={form.description_en} onChange={(e) => setForm({ ...form, description_en: e.target.value })} className="w-full px-4 py-2.5 rounded-lg border border-border focus:outline-none focus:border-primary focus:ring-2 focus:ring-ring" /></div>
            <div><label className="block text-sm font-medium mb-1.5">{tForm("descAr")}</label><textarea dir="rtl" rows={3} value={form.description_ar} onChange={(e) => setForm({ ...form, description_ar: e.target.value })} className="w-full px-4 py-2.5 rounded-lg border border-border focus:outline-none focus:border-primary focus:ring-2 focus:ring-ring" /></div>
            <div><label className="block text-sm font-medium mb-1.5">{tForm("position")}</label><input type="number" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} className="w-full px-4 py-2.5 rounded-lg border border-border focus:outline-none focus:border-primary focus:ring-2 focus:ring-ring" /></div>
            <div className="flex items-end"><label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="w-5 h-5 rounded" /><span className="text-sm font-medium">{tForm("isActive")}</span></label></div>
          </div>
          <div className="flex justify-end mt-6">
            <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark disabled:opacity-50">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}{locale === "ar" ? "حفظ" : "Save"}
            </button>
          </div>
        </div>
      )}

      {/* Categories Table */}
      <div className="bg-white rounded-xl border border-border-light overflow-hidden">
        {loading ? (
          <div className="p-12 text-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : categories.length === 0 ? (
          <div className="p-12 text-center text-text-muted"><FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-30" /><p className="text-sm">{locale === "ar" ? "لا توجد أقسام" : "No categories"}</p></div>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border-light bg-gray-50/50">
              <th className="text-start px-4 py-3 font-medium text-text-secondary">{locale === "ar" ? "الاسم" : "Name"}</th>
              <th className="text-start px-4 py-3 font-medium text-text-secondary hidden md:table-cell">{locale === "ar" ? "الترتيب" : "Position"}</th>
              <th className="text-start px-4 py-3 font-medium text-text-secondary">{locale === "ar" ? "الحالة" : "Status"}</th>
              <th className="text-end px-4 py-3 font-medium text-text-secondary">{locale === "ar" ? "إجراءات" : "Actions"}</th>
            </tr></thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id} className="border-b border-border-light last:border-0 hover:bg-gray-50/50">
                  <td className="px-4 py-3"><p className="font-medium">{locale === "ar" ? cat.name_ar : cat.name_en}</p><p className="text-xs text-text-muted">{locale === "ar" ? cat.name_en : cat.name_ar}</p></td>
                  <td className="px-4 py-3 hidden md:table-cell text-text-secondary">{cat.position}</td>
                  <td className="px-4 py-3"><button onClick={() => handleToggle(cat.id, cat.is_active)}>{cat.is_active ? <ToggleRight className="w-6 h-6 text-success" /> : <ToggleLeft className="w-6 h-6 text-text-muted" />}</button></td>
                  <td className="px-4 py-3"><div className="flex items-center justify-end gap-1">
                    <button onClick={() => openEdit(cat)} className="p-1.5 rounded-lg hover:bg-gray-100 text-text-muted hover:text-primary"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(cat.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-text-muted hover:text-error"><Trash2 className="w-4 h-4" /></button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

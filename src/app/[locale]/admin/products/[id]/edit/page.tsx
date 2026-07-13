"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter, useParams } from "next/navigation";
import { useDropzone } from "react-dropzone";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { getStorageUrl } from "@/lib/utils";
import { toast } from "sonner";
import {
  Loader2,
  Upload,
  X,
  Star,
  ArrowLeft,
  ArrowRight,
  GripVertical,
  Trash2,
} from "lucide-react";
import ProductVariantsTab from "./ProductVariantsTab";

interface CategoryOption { id: string; name_en: string; name_ar: string; }
interface ImageData { id: string; image_path: string; is_primary: boolean; position: number; }

export default function EditProductPage() {
  const t = useTranslations("admin.productForm");
  const locale = useLocale();
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  const isRTL = locale === "ar";
  const BackArrow = isRTL ? ArrowRight : ArrowLeft;

  const [activeTab, setActiveTab] = useState<"en" | "ar" | "images" | "variants" | "settings">("en");
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [images, setImages] = useState<ImageData[]>([]);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    name_en: "", name_ar: "", short_description_en: "", short_description_ar: "",
    description_en: "", description_ar: "", price: "", compare_at_price: "",
    category_id: "", sku: "", stock_quantity: "0", size: "",
    scent_en: "", scent_ar: "", is_featured: false, is_active: true,
  });

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      const [{ data: product }, { data: cats }] = await Promise.all([
        supabase.from("products").select("*, product_images(*)").eq("id", productId).single(),
        supabase.from("categories").select("id, name_en, name_ar").eq("is_active", true).order("position"),
      ]);

      if (product) {
        setForm({
          name_en: product.name_en, name_ar: product.name_ar,
          short_description_en: product.short_description_en || "",
          short_description_ar: product.short_description_ar || "",
          description_en: product.description_en || "",
          description_ar: product.description_ar || "",
          price: product.price?.toString() || "",
          compare_at_price: product.compare_at_price?.toString() || "",
          category_id: product.category_id || "",
          sku: product.sku || "",
          stock_quantity: product.stock_quantity?.toString() || "0",
          size: product.size || "",
          scent_en: product.scent_en || "",
          scent_ar: product.scent_ar || "",
          is_featured: product.is_featured,
          is_active: product.is_active,
        });
        setImages(product.product_images?.sort((a: ImageData, b: ImageData) => a.position - b.position) || []);
      }
      setCategories(cats || []);
      setLoading(false);
    };
    fetchData();
  }, [productId]);

  const updateForm = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const supabase = createClient();
      await supabase.from("products").update({
        ...form, price: parseFloat(form.price),
        compare_at_price: form.compare_at_price ? parseFloat(form.compare_at_price) : null,
        stock_quantity: parseInt(form.stock_quantity),
        category_id: form.category_id || null,
      }).eq("id", productId);
      toast.success(t("productSaved"));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error";
      toast.error(message);
    }
    setSaving(false);
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setUploading(true);
    const supabase = createClient();
    for (const file of acceptedFiles) {
      const fileExt = file.name.split(".").pop();
      const fileName = `${productId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const { error: upErr } = await supabase.storage.from("product-images").upload(fileName, file, { cacheControl: "3600" });
      if (upErr) { toast.error(upErr.message); continue; }
      const isPrimary = images.length === 0;
      const { data } = await supabase.from("product_images").insert({ product_id: productId, image_path: fileName, position: images.length, is_primary: isPrimary }).select().single();
      if (data) setImages((prev) => [...prev, data as ImageData]);
    }
    setUploading(false);
  }, [productId, images.length]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { "image/*": [".png", ".jpg", ".jpeg", ".webp"] }, maxSize: 5 * 1024 * 1024 });

  const handleDeleteImage = async (img: ImageData) => {
    const supabase = createClient();
    await supabase.storage.from("product-images").remove([img.image_path]);
    await supabase.from("product_images").delete().eq("id", img.id);
    setImages((prev) => prev.filter((i) => i.id !== img.id));
  };

  const handleSetPrimary = async (img: ImageData) => {
    const supabase = createClient();
    await supabase.from("product_images").update({ is_primary: false }).eq("product_id", productId);
    await supabase.from("product_images").update({ is_primary: true }).eq("id", img.id);
    setImages((prev) => prev.map((i) => ({ ...i, is_primary: i.id === img.id })));
  };

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;

  const tabs = [
    { key: "en" as const, label: t("englishContent") },
    { key: "ar" as const, label: t("arabicContent") },
    { key: "images" as const, label: t("images") },
    { key: "variants" as const, label: locale === "ar" ? "المتغيرات" : "Variants" },
    { key: "settings" as const, label: t("settings") },
  ];

  const inputClass = "w-full px-4 py-2.5 rounded-lg border border-border focus:outline-none focus:border-primary focus:ring-2 focus:ring-ring";

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <button onClick={() => router.push(`/${locale}/admin/products`)} className="p-2 rounded-lg hover:bg-gray-100">
          <BackArrow className="w-5 h-5 text-text-secondary" />
        </button>
        <h1 className="text-2xl font-bold font-heading text-text">{t("editProduct")}</h1>
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 overflow-x-auto">
        {tabs.map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex-1 min-w-fit px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === tab.key ? "bg-white text-primary shadow-sm" : "text-text-secondary hover:text-text"}`}
          >{tab.label}</button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-border-light p-6">
        {activeTab === "en" && (
          <div className="space-y-5">
            <div><label className="block text-sm font-medium text-text mb-1.5">{t("name")} *</label><input type="text" value={form.name_en} onChange={(e) => updateForm("name_en", e.target.value)} className={inputClass} /></div>
            <div><label className="block text-sm font-medium text-text mb-1.5">{t("shortDesc")}</label><input type="text" value={form.short_description_en} onChange={(e) => updateForm("short_description_en", e.target.value)} className={inputClass} /></div>
            <div><label className="block text-sm font-medium text-text mb-1.5">{t("fullDesc")}</label><textarea rows={6} value={form.description_en} onChange={(e) => updateForm("description_en", e.target.value)} className={`${inputClass} resize-y`} /></div>
          </div>
        )}
        {activeTab === "ar" && (
          <div className="space-y-5" dir="rtl">
            <div><label className="block text-sm font-medium text-text mb-1.5">{t("name")} *</label><input type="text" value={form.name_ar} onChange={(e) => updateForm("name_ar", e.target.value)} className={inputClass} /></div>
            <div><label className="block text-sm font-medium text-text mb-1.5">{t("shortDesc")}</label><input type="text" value={form.short_description_ar} onChange={(e) => updateForm("short_description_ar", e.target.value)} className={inputClass} /></div>
            <div><label className="block text-sm font-medium text-text mb-1.5">{t("fullDesc")}</label><textarea rows={6} value={form.description_ar} onChange={(e) => updateForm("description_ar", e.target.value)} className={`${inputClass} resize-y`} /></div>
          </div>
        )}
        {activeTab === "images" && (
          <div className="space-y-5">
            <div {...getRootProps()} className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${isDragActive ? "border-primary bg-primary-50" : "border-border hover:border-primary/50"}`}>
              <input {...getInputProps()} />{uploading ? <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-2" /> : <Upload className="w-8 h-8 text-text-muted mx-auto mb-2" />}
              <p className="text-sm text-text-secondary">{t("dragDrop")}</p><p className="text-xs text-text-muted mt-1">{t("maxSize")}</p>
            </div>
            {images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {images.map((img) => (
                  <div key={img.id} className={`relative group rounded-lg overflow-hidden border-2 ${img.is_primary ? "border-accent" : "border-border-light"}`}>
                    <div className="aspect-square bg-gray-50"><Image src={getStorageUrl(img.image_path)} alt="" width={200} height={200} className="w-full h-full object-cover" /></div>
                    {img.is_primary && <div className="absolute top-2 start-2 badge badge-accent"><Star className="w-3 h-3 me-1" />{t("primaryImage")}</div>}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      {!img.is_primary && <button onClick={() => handleSetPrimary(img)} className="p-2 bg-white rounded-lg hover:bg-accent-light"><Star className="w-4 h-4 text-accent" /></button>}
                      <button onClick={() => handleDeleteImage(img)} className="p-2 bg-white rounded-lg hover:bg-error-light"><Trash2 className="w-4 h-4 text-error" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {activeTab === "variants" && (
          <ProductVariantsTab productId={productId} />
        )}
        {activeTab === "settings" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div><label className="block text-sm font-medium text-text mb-1.5">{t("category")}</label><select value={form.category_id} onChange={(e) => updateForm("category_id", e.target.value)} className={`${inputClass} bg-white`}><option value="">{t("selectCategory")}</option>{categories.map((c) => <option key={c.id} value={c.id}>{locale === "ar" ? c.name_ar : c.name_en}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-text mb-1.5">{t("price")} *</label><input type="number" step="0.01" value={form.price} onChange={(e) => updateForm("price", e.target.value)} className={inputClass} /></div>
            <div><label className="block text-sm font-medium text-text mb-1.5">{t("comparePrice")}</label><input type="number" step="0.01" value={form.compare_at_price} onChange={(e) => updateForm("compare_at_price", e.target.value)} className={inputClass} /></div>
            <div><label className="block text-sm font-medium text-text mb-1.5">{t("sku")}</label><input type="text" value={form.sku} onChange={(e) => updateForm("sku", e.target.value)} className={inputClass} /></div>
            <div><label className="block text-sm font-medium text-text mb-1.5">{t("stock")}</label><input type="number" value={form.stock_quantity} onChange={(e) => updateForm("stock_quantity", e.target.value)} className={inputClass} /></div>
            <div><label className="block text-sm font-medium text-text mb-1.5">{t("size")}</label><input type="text" value={form.size} onChange={(e) => updateForm("size", e.target.value)} className={inputClass} placeholder={t("sizePlaceholder")} /></div>
            <div><label className="block text-sm font-medium text-text mb-1.5">{t("scentEn")}</label><input type="text" value={form.scent_en} onChange={(e) => updateForm("scent_en", e.target.value)} className={inputClass} /></div>
            <div><label className="block text-sm font-medium text-text mb-1.5">{t("scentAr")}</label><input type="text" dir="rtl" value={form.scent_ar} onChange={(e) => updateForm("scent_ar", e.target.value)} className={inputClass} /></div>
            <div className="md:col-span-2 flex flex-wrap gap-6 pt-2">
              <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={form.is_featured} onChange={(e) => updateForm("is_featured", e.target.checked)} className="w-5 h-5 rounded" /><span className="text-sm font-medium">{t("isFeatured")}</span></label>
              <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={form.is_active} onChange={(e) => updateForm("is_active", e.target.checked)} className="w-5 h-5 rounded" /><span className="text-sm font-medium">{t("isActive")}</span></label>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end pt-4 border-t border-border mt-8">
        <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 px-8 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark disabled:opacity-50 shadow-sm">
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}{saving ? t("saving") : t("saveProduct")}
        </button>
      </div>
    </div>
  );
}

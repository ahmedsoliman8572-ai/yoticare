"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { getStorageUrl, slugify } from "@/lib/utils";
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
import ProductVariantsTab from "../[id]/edit/ProductVariantsTab";

interface CategoryOption {
  id: string;
  name_en: string;
  name_ar: string;
}

interface ImageData {
  id: string;
  image_path: string;
  is_primary: boolean;
  position: number;
}

export default function NewProductPage() {
  const t = useTranslations("admin.productForm");
  const locale = useLocale();
  const router = useRouter();
  const isRTL = locale === "ar";
  const BackArrow = isRTL ? ArrowRight : ArrowLeft;

  const [activeTab, setActiveTab] = useState<"en" | "ar" | "images" | "variants" | "settings">("en");
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [productId, setProductId] = useState<string | null>(null);
  const [images, setImages] = useState<ImageData[]>([]);
  const [uploading, setUploading] = useState(false);

  // Form state
  const [form, setForm] = useState({
    name_en: "",
    name_ar: "",
    short_description_en: "",
    short_description_ar: "",
    description_en: "",
    description_ar: "",
    price: "",
    compare_at_price: "",
    category_id: "",
    sku: "",
    stock_quantity: "0",
    size: "",
    scent_en: "",
    scent_ar: "",
    is_featured: false,
    is_active: true,
  });

  useEffect(() => {
    const fetchCategories = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("categories")
        .select("id, name_en, name_ar")
        .eq("is_active", true)
        .order("position");
      setCategories(data || []);
    };
    fetchCategories();
  }, []);

  const updateForm = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!form.name_en || !form.name_ar || !form.price) {
      toast.error(locale === "ar" ? "يرجى ملء الحقول المطلوبة" : "Please fill in required fields");
      return;
    }

    setSaving(true);
    try {
      const supabase = createClient();

      if (productId) {
        // Update
        await supabase
          .from("products")
          .update({
            ...form,
            price: parseFloat(form.price),
            compare_at_price: form.compare_at_price ? parseFloat(form.compare_at_price) : null,
            stock_quantity: parseInt(form.stock_quantity),
            category_id: form.category_id || null,
          })
          .eq("id", productId);
      } else {
        // Create
        const slug = slugify(form.name_en);
        const { data, error } = await supabase
          .from("products")
          .insert({
            ...form,
            slug,
            price: parseFloat(form.price),
            compare_at_price: form.compare_at_price ? parseFloat(form.compare_at_price) : null,
            stock_quantity: parseInt(form.stock_quantity),
            category_id: form.category_id || null,
          })
          .select("id")
          .single();

        if (error) throw error;
        setProductId(data.id);
        toast.success(t("productSaved"));
        // Switch to images tab so they can upload images
        setActiveTab("images");
        setSaving(false);
        return;
      }

      toast.success(t("productSaved"));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error saving product";
      toast.error(message);
    }
    setSaving(false);
  };

  // Image upload
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!productId) {
        toast.error(
          locale === "ar"
            ? "احفظ المنتج أولاً قبل رفع الصور"
            : "Save the product first before uploading images"
        );
        return;
      }

      setUploading(true);
      const supabase = createClient();

      for (const file of acceptedFiles) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${productId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(fileName, file, { cacheControl: "3600" });

        if (uploadError) {
          toast.error(uploadError.message);
          continue;
        }

        const isPrimary = images.length === 0;
        const { data } = await supabase
          .from("product_images")
          .insert({
            product_id: productId,
            image_path: fileName,
            position: images.length,
            is_primary: isPrimary,
          })
          .select()
          .single();

        if (data) {
          setImages((prev) => [...prev, data as ImageData]);
        }
      }

      setUploading(false);
      toast.success(locale === "ar" ? "تم رفع الصور" : "Images uploaded");
    },
    [productId, images.length, locale]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".webp"] },
    maxSize: 5 * 1024 * 1024,
  });

  const handleDeleteImage = async (img: ImageData) => {
    const supabase = createClient();
    await supabase.storage.from("product-images").remove([img.image_path]);
    await supabase.from("product_images").delete().eq("id", img.id);
    setImages((prev) => prev.filter((i) => i.id !== img.id));
    toast.success(locale === "ar" ? "تم حذف الصورة" : "Image deleted");
  };

  const handleSetPrimary = async (img: ImageData) => {
    const supabase = createClient();
    await supabase.from("product_images").update({ is_primary: false }).eq("product_id", productId!);
    await supabase.from("product_images").update({ is_primary: true }).eq("id", img.id);
    setImages((prev) =>
      prev.map((i) => ({ ...i, is_primary: i.id === img.id }))
    );
    toast.success(locale === "ar" ? "تم تعيين الصورة الرئيسية" : "Primary image set");
  };

  const tabs = [
    { key: "en" as const, label: t("englishContent") },
    { key: "ar" as const, label: t("arabicContent") },
    { key: "images" as const, label: t("images") },
    { key: "variants" as const, label: locale === "ar" ? "المتغيرات" : "Variants" },
    { key: "settings" as const, label: t("settings") },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push(`/${locale}/admin/products`)}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <BackArrow className="w-5 h-5 text-text-secondary" />
        </button>
        <h1 className="text-2xl font-bold font-heading text-text">
          {t("newProduct")}
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 min-w-fit px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === tab.key
                ? "bg-white text-primary shadow-sm"
                : "text-text-secondary hover:text-text"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Form Content */}
      <div className="bg-white rounded-xl border border-border-light p-6">
        {/* English Tab */}
        {activeTab === "en" && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">
                {t("name")} *
              </label>
              <input
                type="text"
                value={form.name_en}
                onChange={(e) => updateForm("name_en", e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-border focus:outline-none focus:border-primary focus:ring-2 focus:ring-ring"
                placeholder={t("namePlaceholder")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">
                {t("shortDesc")}
              </label>
              <input
                type="text"
                value={form.short_description_en}
                onChange={(e) => updateForm("short_description_en", e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-border focus:outline-none focus:border-primary focus:ring-2 focus:ring-ring"
                placeholder={t("shortDescPlaceholder")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">
                {t("fullDesc")}
              </label>
              <textarea
                rows={6}
                value={form.description_en}
                onChange={(e) => updateForm("description_en", e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-border focus:outline-none focus:border-primary focus:ring-2 focus:ring-ring resize-y"
                placeholder={t("fullDescPlaceholder")}
              />
            </div>
          </div>
        )}

        {/* Arabic Tab */}
        {activeTab === "ar" && (
          <div className="space-y-5" dir="rtl">
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">
                {t("name")} *
              </label>
              <input
                type="text"
                value={form.name_ar}
                onChange={(e) => updateForm("name_ar", e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-border focus:outline-none focus:border-primary focus:ring-2 focus:ring-ring"
                placeholder={t("namePlaceholder")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">
                {t("shortDesc")}
              </label>
              <input
                type="text"
                value={form.short_description_ar}
                onChange={(e) => updateForm("short_description_ar", e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-border focus:outline-none focus:border-primary focus:ring-2 focus:ring-ring"
                placeholder={t("shortDescPlaceholder")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">
                {t("fullDesc")}
              </label>
              <textarea
                rows={6}
                value={form.description_ar}
                onChange={(e) => updateForm("description_ar", e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-border focus:outline-none focus:border-primary focus:ring-2 focus:ring-ring resize-y"
                placeholder={t("fullDescPlaceholder")}
              />
            </div>
          </div>
        )}

        {/* Images Tab */}
        {activeTab === "images" && (
          <div className="space-y-5">
            {!productId && (
              <div className="p-4 bg-warning-light text-warning rounded-lg text-sm">
                {locale === "ar"
                  ? "⚠️ احفظ المنتج أولاً قبل رفع الصور"
                  : "⚠️ Save the product first before uploading images"}
              </div>
            )}

            {/* Dropzone */}
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? "border-primary bg-primary-50"
                  : "border-border hover:border-primary/50"
              } ${!productId ? "opacity-50 pointer-events-none" : ""}`}
            >
              <input {...getInputProps()} />
              {uploading ? (
                <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-2" />
              ) : (
                <Upload className="w-8 h-8 text-text-muted mx-auto mb-2" />
              )}
              <p className="text-sm text-text-secondary">{t("dragDrop")}</p>
              <p className="text-xs text-text-muted mt-1">{t("maxSize")}</p>
            </div>

            {/* Image Grid */}
            {images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {images.map((img) => (
                  <div
                    key={img.id}
                    className={`relative group rounded-lg overflow-hidden border-2 ${
                      img.is_primary ? "border-accent" : "border-border-light"
                    }`}
                  >
                    <div className="aspect-square bg-gray-50">
                      <Image
                        src={getStorageUrl(img.image_path)}
                        alt=""
                        width={200}
                        height={200}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Primary badge */}
                    {img.is_primary && (
                      <div className="absolute top-2 start-2 badge badge-accent">
                        <Star className="w-3 h-3 me-1" />
                        {t("primaryImage")}
                      </div>
                    )}

                    {/* Actions overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      {!img.is_primary && (
                        <button
                          onClick={() => handleSetPrimary(img)}
                          className="p-2 bg-white rounded-lg hover:bg-accent-light transition-colors"
                          title={t("setPrimary")}
                        >
                          <Star className="w-4 h-4 text-accent" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteImage(img)}
                        className="p-2 bg-white rounded-lg hover:bg-error-light transition-colors"
                        title={t("deleteImage")}
                      >
                        <Trash2 className="w-4 h-4 text-error" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Variants Tab */}
        {activeTab === "variants" && (
          <div className="space-y-5">
            {!productId ? (
              <div className="text-center py-8 text-text-muted border-2 border-dashed border-border rounded-lg">
                {locale === "ar" ? "يرجى حفظ المنتج أولاً قبل إضافة المتغيرات." : "Please save the product first before adding variants."}
              </div>
            ) : (
              <ProductVariantsTab productId={productId} />
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">
                {t("category")}
              </label>
              <select
                value={form.category_id}
                onChange={(e) => updateForm("category_id", e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-border focus:outline-none focus:border-primary focus:ring-2 focus:ring-ring bg-white"
              >
                <option value="">{t("selectCategory")}</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {locale === "ar" ? cat.name_ar : cat.name_en}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-1.5">
                {t("price")} *
              </label>
              <input
                type="number"
                step="0.01"
                value={form.price}
                onChange={(e) => updateForm("price", e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-border focus:outline-none focus:border-primary focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-1.5">
                {t("comparePrice")}
              </label>
              <input
                type="number"
                step="0.01"
                value={form.compare_at_price}
                onChange={(e) => updateForm("compare_at_price", e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-border focus:outline-none focus:border-primary focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-1.5">
                {t("sku")}
              </label>
              <input
                type="text"
                value={form.sku}
                onChange={(e) => updateForm("sku", e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-border focus:outline-none focus:border-primary focus:ring-2 focus:ring-ring"
                placeholder={t("skuPlaceholder")}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-1.5">
                {t("stock")}
              </label>
              <input
                type="number"
                value={form.stock_quantity}
                onChange={(e) => updateForm("stock_quantity", e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-border focus:outline-none focus:border-primary focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-1.5">
                {t("size")}
              </label>
              <input
                type="text"
                value={form.size}
                onChange={(e) => updateForm("size", e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-border focus:outline-none focus:border-primary focus:ring-2 focus:ring-ring"
                placeholder={t("sizePlaceholder")}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-1.5">
                {t("scentEn")}
              </label>
              <input
                type="text"
                value={form.scent_en}
                onChange={(e) => updateForm("scent_en", e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-border focus:outline-none focus:border-primary focus:ring-2 focus:ring-ring"
                placeholder={t("scentPlaceholder")}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-1.5">
                {t("scentAr")}
              </label>
              <input
                type="text"
                dir="rtl"
                value={form.scent_ar}
                onChange={(e) => updateForm("scent_ar", e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-border focus:outline-none focus:border-primary focus:ring-2 focus:ring-ring"
                placeholder={t("scentPlaceholder")}
              />
            </div>

            {/* Toggles */}
            <div className="md:col-span-2 flex flex-wrap gap-6 pt-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_featured}
                  onChange={(e) => updateForm("is_featured", e.target.checked)}
                  className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
                />
                <span className="text-sm font-medium text-text">
                  {t("isFeatured")}
                </span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => updateForm("is_active", e.target.checked)}
                  className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
                />
                <span className="text-sm font-medium text-text">
                  {t("isActive")}
                </span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-8 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 shadow-sm"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {saving ? t("saving") : t("saveProduct")}
        </button>
      </div>
    </div>
  );
}

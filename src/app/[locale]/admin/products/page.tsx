"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { Plus, Search, Package, MoreVertical, Eye, Pencil, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getStorageUrl, formatPrice } from "@/lib/utils";
import { toast } from "sonner";

interface ProductRow {
  id: string;
  name_en: string;
  name_ar: string;
  slug: string;
  price: number;
  stock_quantity: number;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  category: { name_en: string; name_ar: string } | null;
  product_images: { image_path: string; is_primary: boolean }[];
}

export default function AdminProductsPage() {
  const t = useTranslations("admin");
  const tForm = useTranslations("admin.productForm");
  const locale = useLocale();
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    setLoading(true);
    const supabase = createClient();
    let query = supabase
      .from("products")
      .select("*, category:categories(name_en, name_ar), product_images(image_path, is_primary)")
      .order("created_at", { ascending: false });

    if (search) {
      query = query.or(`name_en.ilike.%${search}%,name_ar.ilike.%${search}%`);
    }

    const { data } = await query;
    setProducts((data as ProductRow[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, [search]);

  const getPrimaryImage = (images: { image_path: string; is_primary: boolean }[]) => {
    const primary = images.find((img) => img.is_primary);
    return primary ? getStorageUrl(primary.image_path) : null;
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    const supabase = createClient();
    await supabase.from("products").update({ is_active: !currentStatus }).eq("id", id);
    toast.success(tForm("productSaved"));
    fetchProducts();
  };

  const handleDelete = async (id: string) => {
    if (!confirm(tForm("confirmDelete"))) return;
    const supabase = createClient();
    await supabase.from("products").delete().eq("id", id);
    toast.success(tForm("productDeleted"));
    fetchProducts();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold font-heading text-text">{t("products")}</h1>
        <Link
          href={`/${locale}/admin/products/new`}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t("addProduct")}
        </Link>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={locale === "ar" ? "ابحث عن منتج..." : "Search products..."}
          className="w-full ps-10 pe-4 py-2.5 rounded-lg border border-border bg-white text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-border-light overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-text-muted">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm">{locale === "ar" ? "جاري التحميل..." : "Loading..."}</p>
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center text-text-muted">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">{t("noProducts")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-light bg-gray-50/50">
                  <th className="text-start px-4 py-3 font-medium text-text-secondary">
                    {locale === "ar" ? "المنتج" : "Product"}
                  </th>
                  <th className="text-start px-4 py-3 font-medium text-text-secondary hidden md:table-cell">
                    {locale === "ar" ? "القسم" : "Category"}
                  </th>
                  <th className="text-start px-4 py-3 font-medium text-text-secondary">
                    {locale === "ar" ? "السعر" : "Price"}
                  </th>
                  <th className="text-start px-4 py-3 font-medium text-text-secondary hidden sm:table-cell">
                    {locale === "ar" ? "المخزون" : "Stock"}
                  </th>
                  <th className="text-start px-4 py-3 font-medium text-text-secondary hidden sm:table-cell">
                    {locale === "ar" ? "الحالة" : "Status"}
                  </th>
                  <th className="text-end px-4 py-3 font-medium text-text-secondary">
                    {locale === "ar" ? "إجراءات" : "Actions"}
                  </th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const imgUrl = getPrimaryImage(product.product_images);
                  return (
                    <tr key={product.id} className="border-b border-border-light last:border-0 hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                            {imgUrl ? (
                              <Image
                                src={imgUrl}
                                alt={product.name_en}
                                width={40}
                                height={40}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-5 h-5 text-text-muted" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-text truncate">
                              {locale === "ar" ? product.name_ar : product.name_en}
                            </p>
                            <p className="text-xs text-text-muted truncate">
                              {locale === "ar" ? product.name_en : product.name_ar}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-text-secondary">
                        {product.category
                          ? locale === "ar"
                            ? product.category.name_ar
                            : product.category.name_en
                          : "—"}
                      </td>
                      <td className="px-4 py-3 font-medium text-text">
                        {formatPrice(product.price)}
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span
                          className={`badge ${
                            product.stock_quantity <= 5
                              ? "badge-error"
                              : product.stock_quantity <= 20
                              ? "badge-warning"
                              : "badge-success"
                          }`}
                        >
                          {product.stock_quantity}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <button
                          onClick={() => handleToggleStatus(product.id, product.is_active)}
                          className="flex items-center gap-1.5"
                        >
                          {product.is_active ? (
                            <ToggleRight className="w-6 h-6 text-success" />
                          ) : (
                            <ToggleLeft className="w-6 h-6 text-text-muted" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/${locale}/shop/${product.slug}`}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-text-muted hover:text-primary transition-colors"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <Link
                            href={`/${locale}/admin/products/${product.id}/edit`}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-text-muted hover:text-primary transition-colors"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-text-muted hover:text-error transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

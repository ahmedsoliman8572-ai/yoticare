"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { getStorageUrl, formatPrice } from "@/lib/utils";
import { useCartStore } from "@/lib/store/cart-store";
import { toast } from "sonner";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { ShoppingBag, Filter, SlidersHorizontal } from "lucide-react";

interface ProductCard { id: string; name_en: string; name_ar: string; slug: string; price: number; compare_at_price: number | null; stock_quantity: number; is_featured: boolean; short_description_en: string | null; short_description_ar: string | null; category: { id: string; name_en: string; name_ar: string } | null; product_images: { image_path: string; is_primary: boolean }[]; }
interface Category { id: string; name_en: string; name_ar: string; slug: string; }

export default function ShopPage() {
  const t = useTranslations("shop");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const addItem = useCartStore((s) => s.addItem);

  const [products, setProducts] = useState<ProductCard[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const supabase = createClient();
      const [{ data: prods }, { data: cats }] = await Promise.all([
        (() => {
          let q = supabase.from("products").select("*, category:categories(id, name_en, name_ar), product_images(image_path, is_primary)").eq("is_active", true);
          if (selectedCategory) q = q.eq("category_id", selectedCategory);
          switch (sortBy) { case "price_asc": q = q.order("price", { ascending: true }); break; case "price_desc": q = q.order("price", { ascending: false }); break; default: q = q.order("created_at", { ascending: false }); }
          return q;
        })(),
        supabase.from("categories").select("id, name_en, name_ar, slug").eq("is_active", true).order("position"),
      ]);
      setProducts((prods as ProductCard[]) || []);
      setCategories((cats as Category[]) || []);
      setLoading(false);
    };
    fetch();
  }, [selectedCategory, sortBy]);

  const getPrimaryImage = (images: { image_path: string; is_primary: boolean }[]) => {
    const primary = images.find((img) => img.is_primary) || images[0];
    return primary ? getStorageUrl(primary.image_path) : null;
  };

  const handleAddToCart = (product: ProductCard) => {
    if (product.stock_quantity <= 0) return;
    const imgUrl = getPrimaryImage(product.product_images);
    addItem({ id: product.id, product_id: product.id, name_en: product.name_en, name_ar: product.name_ar, price: product.price, image_path: imgUrl, slug: product.slug, stock_quantity: product.stock_quantity });
    toast.success(locale === "ar" ? "تمت الإضافة إلى السلة!" : "Added to cart!");
  };

  return (
    <>
      <Navbar />
      <main className="flex-1">
        <div className="container-custom py-8 md:py-12">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold font-heading text-text">{t("title")}</h1>
              {!loading && <p className="text-text-secondary text-sm mt-1">{t("showingResults", { count: products.length })}</p>}
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setShowFilters(!showFilters)} className="md:hidden inline-flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm"><Filter className="w-4 h-4" />{t("filterBy")}</button>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-4 py-2 border border-border rounded-lg text-sm bg-white focus:outline-none focus:border-primary">
                <option value="newest">{t("sortNewest")}</option>
                <option value="price_asc">{t("sortPriceLow")}</option>
                <option value="price_desc">{t("sortPriceHigh")}</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-8">
            {/* Sidebar Filters */}
            <aside className={`${showFilters ? "block" : "hidden"} md:block w-full md:w-56 shrink-0`}>
              <div className="sticky top-24 space-y-6">
                <div>
                  <h3 className="font-semibold text-sm text-text mb-3 flex items-center gap-2"><SlidersHorizontal className="w-4 h-4" />{t("allCategories")}</h3>
                  <div className="space-y-1">
                    <button onClick={() => { setSelectedCategory(""); setShowFilters(false); }} className={`w-full text-start px-3 py-2 rounded-lg text-sm transition-colors ${!selectedCategory ? "bg-primary-50 text-primary font-medium" : "text-text-secondary hover:bg-gray-50"}`}>{t("allCategories")}</button>
                    {categories.map((cat) => (
                      <button key={cat.id} onClick={() => { setSelectedCategory(cat.id); setShowFilters(false); }} className={`w-full text-start px-3 py-2 rounded-lg text-sm transition-colors ${selectedCategory === cat.id ? "bg-primary-50 text-primary font-medium" : "text-text-secondary hover:bg-gray-50"}`}>
                        {locale === "ar" ? cat.name_ar : cat.name_en}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </aside>

            {/* Product Grid */}
            <div className="flex-1">
              {loading ? (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="bg-white rounded-xl border border-border-light overflow-hidden">
                      <div className="aspect-square animate-shimmer" /><div className="p-4 space-y-2"><div className="h-4 bg-gray-100 rounded animate-shimmer" /><div className="h-4 w-2/3 bg-gray-100 rounded animate-shimmer" /></div>
                    </div>
                  ))}
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-20 text-text-muted"><ShoppingBag className="w-16 h-16 mx-auto mb-4 opacity-20" /><p>{t("noProducts")}</p></div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {products.map((product, idx) => {
                    const imgUrl = getPrimaryImage(product.product_images);
                    const outOfStock = product.stock_quantity <= 0;
                    return (
                      <div key={product.id} className="group bg-white rounded-xl border border-border-light overflow-hidden card-hover animate-fade-in-up" style={{ animationDelay: `${idx * 50}ms` }}>
                        <Link href={`/${locale}/shop/${product.slug}`} className="block img-zoom">
                          <div className="aspect-square bg-gray-50 relative">
                            {imgUrl ? <Image src={imgUrl} alt={locale === "ar" ? product.name_ar : product.name_en} fill className="object-cover" sizes="(max-width: 768px) 50vw, 33vw" /> : <div className="w-full h-full flex items-center justify-center"><ShoppingBag className="w-12 h-12 text-text-muted/20" /></div>}
                            {outOfStock && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><span className="badge badge-error text-xs">{tCommon("outOfStock")}</span></div>}
                            {product.is_featured && !outOfStock && <div className="absolute top-2 start-2 badge badge-accent">{tCommon("featured")}</div>}
                            {product.compare_at_price && !outOfStock && <div className="absolute top-2 end-2 badge badge-error">{tCommon("sale")}</div>}
                          </div>
                        </Link>
                        <div className="p-4">
                          <Link href={`/${locale}/shop/${product.slug}`}>
                            <h3 className="font-semibold text-text text-sm mb-1 truncate group-hover:text-primary transition-colors">{locale === "ar" ? product.name_ar : product.name_en}</h3>
                          </Link>
                          <div className="flex items-center gap-2 mb-3">
                            <span className="font-bold text-primary">{formatPrice(product.price)}</span>
                            {product.compare_at_price && <span className="text-xs text-text-muted line-through">{formatPrice(product.compare_at_price)}</span>}
                          </div>
                          <button onClick={() => handleAddToCart(product)} disabled={outOfStock}
                            className="w-full py-2 rounded-lg text-sm font-medium transition-colors bg-primary text-white hover:bg-primary-dark disabled:bg-gray-200 disabled:text-text-muted disabled:cursor-not-allowed">
                            {outOfStock ? tCommon("outOfStock") : tCommon("addToCart")}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

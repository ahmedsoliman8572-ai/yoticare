"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getStorageUrl, formatPrice } from "@/lib/utils";
import { useCartStore } from "@/lib/store/cart-store";
import { toast } from "sonner";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { ShoppingBag, ChevronRight, ChevronLeft } from "lucide-react";

interface ProductCard { id: string; name_en: string; name_ar: string; slug: string; price: number; compare_at_price: number | null; stock_quantity: number; is_featured: boolean; product_images: { image_path: string; is_primary: boolean }[]; }

export default function CategoryPage() {
  const tCommon = useTranslations("common");
  const tShop = useTranslations("shop");
  const locale = useLocale();
  const params = useParams();
  const slug = params.slug as string;
  const addItem = useCartStore((s) => s.addItem);
  const isRTL = locale === "ar";

  const [category, setCategory] = useState<Record<string, unknown> | null>(null);
  const [products, setProducts] = useState<ProductCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const supabase = createClient();
      const { data: cat } = await supabase.from("categories").select("*").eq("slug", slug).single();
      setCategory(cat as Record<string, unknown>);

      if (cat) {
        const { data: prods } = await supabase.from("products").select("*, product_images(image_path, is_primary)").eq("category_id", cat.id).eq("is_active", true).order("created_at", { ascending: false });
        setProducts((prods as ProductCard[]) || []);
      }
      setLoading(false);
    };
    fetch();
  }, [slug]);

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
    <><Navbar />
      <main className="flex-1">
        <div className="container-custom py-8 md:py-12">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-text-muted mb-6">
            <Link href={`/${locale}`} className="hover:text-primary">{tCommon("home")}</Link>
            {isRTL ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            <Link href={`/${locale}/categories`} className="hover:text-primary">{tCommon("categories")}</Link>
            {category && <>{isRTL ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}<span className="text-text">{locale === "ar" ? String(category.name_ar) : String(category.name_en)}</span></>}
          </nav>

          {/* Category Header */}
          {category && (
            <div className="mb-8">
              <h1 className="text-3xl md:text-4xl font-bold font-heading text-text mb-2">{locale === "ar" ? String(category.name_ar) : String(category.name_en)}</h1>
              {Boolean(locale === "ar" ? category.description_ar : category.description_en) && <p className="text-text-secondary">{locale === "ar" ? category.description_ar as string : category.description_en as string}</p>}
              <div className="w-16 h-1 bg-accent rounded-full mt-3" />
            </div>
          )}

          {/* Products Grid */}
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {Array.from({ length: 8 }).map((_, i) => <div key={i} className="bg-white rounded-xl border border-border-light overflow-hidden"><div className="aspect-square animate-shimmer" /><div className="p-4 space-y-2"><div className="h-4 bg-gray-100 rounded animate-shimmer" /><div className="h-4 w-2/3 bg-gray-100 rounded animate-shimmer" /></div></div>)}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20"><ShoppingBag className="w-16 h-16 text-text-muted/20 mx-auto mb-4" /><p className="text-text-muted">{tShop("noProducts")}</p></div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {products.map((product, idx) => {
                const imgUrl = getPrimaryImage(product.product_images);
                const outOfStock = product.stock_quantity <= 0;
                return (
                  <div key={product.id} className="group bg-white rounded-xl border border-border-light overflow-hidden card-hover animate-fade-in-up" style={{ animationDelay: `${idx * 50}ms` }}>
                    <Link href={`/${locale}/shop/${product.slug}`} className="block img-zoom">
                      <div className="aspect-square bg-gray-50 relative">
                        {imgUrl ? <Image src={imgUrl} alt={locale === "ar" ? product.name_ar : product.name_en} fill className="object-cover" sizes="(max-width: 768px) 50vw, 25vw" /> : <div className="w-full h-full flex items-center justify-center"><ShoppingBag className="w-12 h-12 text-text-muted/20" /></div>}
                        {outOfStock && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><span className="badge badge-error text-xs">{tCommon("outOfStock")}</span></div>}
                      </div>
                    </Link>
                    <div className="p-4">
                      <Link href={`/${locale}/shop/${product.slug}`}><h3 className="font-semibold text-text text-sm mb-1 truncate group-hover:text-primary transition-colors">{locale === "ar" ? product.name_ar : product.name_en}</h3></Link>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="font-bold text-primary">{formatPrice(product.price)}</span>
                        {product.compare_at_price && <span className="text-xs text-text-muted line-through">{formatPrice(product.compare_at_price)}</span>}
                      </div>
                      <button onClick={() => handleAddToCart(product)} disabled={outOfStock} className="w-full py-2 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary-dark disabled:bg-gray-200 disabled:text-text-muted disabled:cursor-not-allowed transition-colors">
                        {outOfStock ? tCommon("outOfStock") : tCommon("addToCart")}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    <Footer /></>
  );
}

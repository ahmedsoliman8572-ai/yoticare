"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getStorageUrl, formatPrice } from "@/lib/utils";
import { useCartStore } from "@/lib/store/cart-store";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import RelatedProducts from "@/components/product/RelatedProducts";
import { Minus, Plus, ShoppingBag, ChevronRight, ChevronLeft, Loader2, CreditCard, ChevronDown, ChevronUp } from "lucide-react";

export default function ProductDetailPage() {
  const t = useTranslations("product");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const isRTL = locale === "ar";

  const [product, setProduct] = useState<Record<string, unknown> | null>(null);
  const [images, setImages] = useState<{ id: string; image_path: string; is_primary: boolean }[]>([]);
  const [variants, setVariants] = useState<any[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<any | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [policies, setPolicies] = useState<{shipping: string, return: string, exchange: string}>({shipping: "", return: "", exchange: ""});
  const [openPolicy, setOpenPolicy] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      const supabase = createClient();
      const { data } = await supabase.from("products").select("*, product_images(*), category:categories(*), product_variants(*)").eq("slug", slug).eq("is_active", true).single();
      if (data) {
        setProduct(data as Record<string, unknown>);
        const imgs = ((data.product_images as { id: string; image_path: string; is_primary: boolean; position: number }[]) || []).sort((a, b) => a.position - b.position);
        setImages(imgs);
        const primaryIdx = imgs.findIndex((img) => img.is_primary);
        if (primaryIdx >= 0) setSelectedImage(primaryIdx);
        
        const vars = (data.product_variants || []).filter((v: any) => v.is_active).sort((a: any, b: any) => a.position - b.position);
        setVariants(vars);
        if (vars.length > 0) {
          setSelectedVariant(vars[0]);
        }
      }

      // Fetch policies
      const { data: settingsData } = await supabase
        .from("site_settings")
        .select("key, value")
        .in("key", [
          `shipping_policy_${locale}`,
          `return_policy_${locale}`,
          `exchange_policy_${locale}`
        ]);
      
      if (settingsData) {
        const p = { shipping: "", return: "", exchange: "" };
        settingsData.forEach(s => {
          if (s.key.includes("shipping")) p.shipping = s.value;
          if (s.key.includes("return")) p.return = s.value;
          if (s.key.includes("exchange")) p.exchange = s.value;
        });
        setPolicies(p);
      }

      setLoading(false);
    };
    fetch();
  }, [slug]);

  if (loading) return <><Navbar /><div className="flex-1 flex items-center justify-center py-24"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div><Footer /></>;
  if (!product) return <><Navbar /><div className="flex-1 flex items-center justify-center py-24"><p className="text-text-muted">Product not found</p></div><Footer /></>;

  const currentPrice = selectedVariant ? Number(selectedVariant.price) : (product.price as number);
  const currentStock = selectedVariant ? selectedVariant.stock_quantity : (product.stock_quantity as number);
  const outOfStock = currentStock <= 0;
  const category = product.category as Record<string, string> | null;

  const handleAddToCart = () => {
    let imgPath = images[0] ? getStorageUrl(images[0].image_path) : null;
    if (selectedVariant && selectedVariant.image_path) {
      imgPath = getStorageUrl(selectedVariant.image_path);
    }
    
    addItem({ 
      id: selectedVariant ? `${product.id}-${selectedVariant.id}` : (product.id as string), 
      product_id: product.id as string,
      variant_id: selectedVariant ? selectedVariant.id : null,
      variant_name_en: selectedVariant ? selectedVariant.name_en : null,
      variant_name_ar: selectedVariant ? selectedVariant.name_ar : null,
      name_en: String(product.name_en), 
      name_ar: String(product?.name_ar), 
      price: currentPrice, 
      image_path: imgPath, 
      slug: product?.slug as string, 
      stock_quantity: currentStock 
    }, quantity);
    toast.success(locale === "ar" ? "تمت الإضافة إلى السلة!" : "Added to cart!");
  };

  const handleBuyNow = () => {
    if (!product || outOfStock) return;
    
    // Create cart item payload
    const itemPayload = {
      id: selectedVariant ? `${product.id}-${selectedVariant.id}` : product.id as string,
      product_id: product.id as string,
      variant_id: selectedVariant?.id,
      variant_name_en: selectedVariant?.name_en,
      variant_name_ar: selectedVariant?.name_ar,
      name_en: product.name_en as string,
      name_ar: product.name_ar as string,
      price: currentPrice,
      image_path: images.length > 0 ? getStorageUrl(images[0].image_path) : null,
      slug: product.slug as string,
      stock_quantity: currentStock
    };

    // Add to cart with specific quantity
    addItem(itemPayload, quantity);
    
    // Redirect to checkout
    router.push(`/${locale}/checkout`);
  };

  return (
    <>
      <Navbar />
      <main className="flex-1">
        <div className="container-custom py-8 md:py-12">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-text-muted mb-8">
            <Link href={`/${locale}`} className="hover:text-primary">{tCommon("home")}</Link>
            {isRTL ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            <Link href={`/${locale}/shop`} className="hover:text-primary">{tCommon("shop")}</Link>
            {category ? <>{isRTL ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}<span>{locale === "ar" ? category.name_ar : category.name_en}</span></> : null}
          </nav>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            {/* Image Gallery */}
            <div className="space-y-4">
              <div className="aspect-square bg-gray-50 rounded-xl overflow-hidden relative">
                {images.length > 0 ? (
                  <Image src={getStorageUrl(images[selectedImage].image_path)} alt={String(locale === "ar" ? product.name_ar : product.name_en)} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" priority />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><ShoppingBag className="w-20 h-20 text-text-muted/20" /></div>
                )}
              </div>
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {images.map((img, idx) => (
                    <button key={img.id} onClick={() => setSelectedImage(idx)}
                      className={`shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border-2 transition-colors ${selectedImage === idx ? "border-primary" : "border-border-light hover:border-primary/50"}`}>
                      <Image src={getStorageUrl(img.image_path)} alt="" width={80} height={80} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-6 animate-fade-in-up">
              {category ? <span className="badge badge-primary text-xs">{locale === "ar" ? category.name_ar : category.name_en}</span> : null}
              <h1 className="text-2xl md:text-3xl font-bold font-heading text-text">{String(locale === "ar" ? product.name_ar : product.name_en)}</h1>

              {/* Price */}
              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold text-primary">{formatPrice(currentPrice)}</span>
                {!selectedVariant && Boolean(product.compare_at_price) && (
                  <span className="text-lg text-text-muted line-through">{formatPrice(product.compare_at_price as number)}</span>
                )}
              </div>

              {/* Variants */}
              {variants.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-medium text-sm">{locale === "ar" ? "الخيارات المتاحة" : "Available Options"}</h3>
                  <div className="flex flex-wrap gap-2">
                    {variants.map((v) => (
                      <button
                        key={v.id}
                        onClick={() => { setSelectedVariant(v); setQuantity(1); }}
                        className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${selectedVariant?.id === v.id ? "border-primary bg-primary-50 text-primary" : "border-border hover:border-primary/50 text-text-secondary"}`}
                      >
                        {locale === "ar" ? v.name_ar : v.name_en}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Short Description */}
              {Boolean(locale === "ar" ? product.short_description_ar : product.short_description_en) && (
                <p className="text-text-secondary leading-relaxed">{locale === "ar" ? product.short_description_ar as string : product.short_description_en as string}</p>
              )}

              {/* Details */}
              <div className="space-y-2 text-sm">
                {!selectedVariant && Boolean(product.size) && <div className="flex gap-2"><span className="text-text-muted">{t("size")}:</span><span className="font-medium">{product.size as string}</span></div>}
                {!selectedVariant && Boolean(locale === "ar" ? product.scent_ar : product.scent_en) && <div className="flex gap-2"><span className="text-text-muted">{t("scent")}:</span><span className="font-medium">{locale === "ar" ? product.scent_ar as string : product.scent_en as string}</span></div>}
                {Boolean(product.sku) && <div className="flex gap-2"><span className="text-text-muted">{t("sku")}:</span><span className="font-mono">{product.sku as string}</span></div>}
              </div>

              {/* Stock */}
              {outOfStock ? (
                <div className="badge badge-error">{tCommon("outOfStock")}</div>
              ) : currentStock <= 10 ? (
                <div className="badge badge-warning">{t("stockLeft", { count: currentStock })}</div>
              ) : (
                <div className="badge badge-success">{tCommon("inStock")}</div>
              )}

              {/* Quantity + Add to Cart & Buy Now */}
              <div className="space-y-3 mt-6">
                <div className="flex items-center gap-4">
                  <div className="flex items-center border border-border rounded-lg bg-white shrink-0 h-[48px]">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-2.5 hover:bg-gray-50 transition-colors h-full"><Minus className="w-4 h-4" /></button>
                    <span className="w-12 text-center font-medium">{quantity}</span>
                    <button onClick={() => setQuantity(Math.min(currentStock, quantity + 1))} className="p-2.5 hover:bg-gray-50 transition-colors h-full"><Plus className="w-4 h-4" /></button>
                  </div>
                  <button onClick={handleBuyNow} disabled={outOfStock}
                    className="flex-1 h-[48px] rounded-lg font-semibold transition-colors bg-primary text-white hover:bg-primary-dark disabled:bg-gray-200 disabled:text-text-muted disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm hover:shadow-md">
                    <CreditCard className="w-5 h-5" />{locale === "ar" ? "إتمام الطلب" : "Buy Now"}
                  </button>
                </div>
                <button onClick={handleAddToCart} disabled={outOfStock}
                  className="w-full h-[48px] rounded-lg font-semibold transition-colors bg-white border-2 border-primary text-primary hover:bg-primary-50 disabled:border-gray-200 disabled:text-text-muted disabled:bg-gray-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  <ShoppingBag className="w-5 h-5" />{t("addToCart")}
                </button>
              </div>

              {/* Full Description */}
              {Boolean(locale === "ar" ? product.description_ar : product.description_en) && (
                <div className="pt-6 border-t border-border">
                  <h2 className="font-semibold text-lg mb-3">{t("description")}</h2>
                  <div className="text-text-secondary leading-relaxed whitespace-pre-line">{locale === "ar" ? product.description_ar as string : product.description_en as string}</div>
                </div>
              )}
              {/* Policies Accordions */}
              <div className="pt-6 border-t border-border space-y-3">
                {policies.shipping && (
                  <div className="border border-border rounded-lg overflow-hidden">
                    <button onClick={() => setOpenPolicy(openPolicy === 'shipping' ? null : 'shipping')} className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors">
                      <span className="font-semibold text-text">{locale === "ar" ? "سياسة الشحن" : "Shipping Policy"}</span>
                      {openPolicy === 'shipping' ? <ChevronUp className="w-5 h-5 text-text-muted" /> : <ChevronDown className="w-5 h-5 text-text-muted" />}
                    </button>
                    {openPolicy === 'shipping' && <div className="p-4 text-sm text-text-secondary leading-relaxed bg-white whitespace-pre-line">{policies.shipping}</div>}
                  </div>
                )}
                {policies.return && (
                  <div className="border border-border rounded-lg overflow-hidden">
                    <button onClick={() => setOpenPolicy(openPolicy === 'return' ? null : 'return')} className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors">
                      <span className="font-semibold text-text">{locale === "ar" ? "سياسة الاسترجاع" : "Return Policy"}</span>
                      {openPolicy === 'return' ? <ChevronUp className="w-5 h-5 text-text-muted" /> : <ChevronDown className="w-5 h-5 text-text-muted" />}
                    </button>
                    {openPolicy === 'return' && <div className="p-4 text-sm text-text-secondary leading-relaxed bg-white whitespace-pre-line">{policies.return}</div>}
                  </div>
                )}
                {policies.exchange && (
                  <div className="border border-border rounded-lg overflow-hidden">
                    <button onClick={() => setOpenPolicy(openPolicy === 'exchange' ? null : 'exchange')} className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors">
                      <span className="font-semibold text-text">{locale === "ar" ? "سياسة الاستبدال" : "Exchange Policy"}</span>
                      {openPolicy === 'exchange' ? <ChevronUp className="w-5 h-5 text-text-muted" /> : <ChevronDown className="w-5 h-5 text-text-muted" />}
                    </button>
                    {openPolicy === 'exchange' && <div className="p-4 text-sm text-text-secondary leading-relaxed bg-white whitespace-pre-line">{policies.exchange}</div>}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Related Products */}
          {product.category_id ? (
            <RelatedProducts categoryId={product.category_id as string} currentProductId={product.id as string} />
          ) : null}
        </div>
      </main>
      <Footer />
    </>
  );
}

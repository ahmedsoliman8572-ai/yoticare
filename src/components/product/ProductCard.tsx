import Link from "next/link";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { ShoppingBag } from "lucide-react";
import { formatPrice, getStorageUrl } from "@/lib/utils";
import { useCartStore } from "@/lib/store/cart-store";
import { toast } from "sonner";

export default function ProductCard({ product }: { product: any }) {
  const locale = useLocale();
  const tCommon = useTranslations("common");
  const addItem = useCartStore((s) => s.addItem);

  const getPrimaryImage = (images: any[]) => {
    if (!images || images.length === 0) return null;
    const primary = images.find((img) => img.is_primary);
    return primary ? getStorageUrl(primary.image_path) : getStorageUrl(images[0].image_path);
  };

  const imgUrl = getPrimaryImage(product.product_images);
  const outOfStock = product.stock_quantity <= 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (outOfStock) return;
    addItem({
      id: product.id,
      product_id: product.id,
      name_en: product.name_en,
      name_ar: product.name_ar,
      price: product.price,
      image_path: imgUrl,
      slug: product.slug,
      stock_quantity: product.stock_quantity
    }, 1);
    toast.success(locale === "ar" ? "تمت الإضافة إلى السلة!" : "Added to cart!");
  };

  return (
    <div className="group bg-white rounded-xl border border-border-light overflow-hidden card-hover h-full flex flex-col">
      <Link href={`/${locale}/shop/${product.slug}`} className="block img-zoom">
        <div className="aspect-square bg-gray-50 relative">
          {imgUrl ? (
            <Image src={imgUrl} alt={locale === "ar" ? product.name_ar : product.name_en} fill className="object-cover" sizes="(max-width: 768px) 50vw, 33vw" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ShoppingBag className="w-12 h-12 text-text-muted/20" />
            </div>
          )}
          {outOfStock && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><span className="badge badge-error text-xs">{tCommon("outOfStock")}</span></div>}
          {product.is_featured && !outOfStock && <div className="absolute top-2 start-2 badge badge-accent">{tCommon("featured")}</div>}
          {product.compare_at_price && !outOfStock && <div className="absolute top-2 end-2 badge badge-error">{tCommon("sale")}</div>}
        </div>
      </Link>
      <div className="p-4 flex flex-col flex-1">
        <Link href={`/${locale}/shop/${product.slug}`}>
          <h3 className="font-semibold text-text text-sm mb-1 truncate group-hover:text-primary transition-colors">{locale === "ar" ? product.name_ar : product.name_en}</h3>
        </Link>
        <div className="flex items-center gap-2 mb-3 mt-auto">
          <span className="font-bold text-primary">{formatPrice(product.price)}</span>
          {product.compare_at_price && <span className="text-xs text-text-muted line-through">{formatPrice(product.compare_at_price)}</span>}
        </div>
        <button onClick={handleAddToCart} disabled={outOfStock}
          className="w-full py-2 rounded-lg text-sm font-medium transition-colors bg-primary text-white hover:bg-primary-dark disabled:bg-gray-200 disabled:text-text-muted disabled:cursor-not-allowed mt-auto">
          {outOfStock ? tCommon("outOfStock") : tCommon("addToCart")}
        </button>
      </div>
    </div>
  );
}

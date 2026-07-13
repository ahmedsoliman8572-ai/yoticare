"use client";

import { useEffect, useState, useRef } from "react";
import { useLocale } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import ProductCard from "@/components/product/ProductCard";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

interface RelatedProductsProps {
  categoryId: string;
  currentProductId: string;
}

export default function RelatedProducts({ categoryId, currentProductId }: RelatedProductsProps) {
  const locale = useLocale();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchRelated = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("products")
        .select(`
          *,
          categories(name_en, name_ar, slug),
          product_images(image_path, is_primary, position),
          product_variants(id)
        `)
        .eq("category_id", categoryId)
        .eq("is_active", true)
        .neq("id", currentProductId)
        .limit(6);
      
      setProducts(data || []);
      setLoading(false);
    };

    if (categoryId) {
      fetchRelated();
    } else {
      setLoading(false);
    }
  }, [categoryId, currentProductId]);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth"
      });
    }
  };

  if (loading) {
    return (
      <div className="py-12 flex justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (products.length === 0) return null;

  return (
    <section className="py-12 border-t border-border mt-12">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold font-heading text-text">
          {locale === "ar" ? "منتجات مشابهة" : "Related Products"}
        </h2>
        <div className="flex gap-2">
          <button 
            onClick={() => scroll(locale === "ar" ? "right" : "left")}
            className="p-2 rounded-full border border-border hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button 
            onClick={() => scroll(locale === "ar" ? "left" : "right")}
            className="p-2 rounded-full border border-border hover:bg-gray-50 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {products.map(product => (
          <div key={product.id} className="min-w-[280px] max-w-[300px] snap-start shrink-0">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
}

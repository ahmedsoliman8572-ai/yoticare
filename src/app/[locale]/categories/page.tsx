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
import { ShoppingBag, FolderOpen } from "lucide-react";

interface Category { id: string; name_en: string; name_ar: string; slug: string; description_en: string | null; description_ar: string | null; }

export default function CategoriesPage() {
  const t = useTranslations("home");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const supabase = createClient();
      const { data } = await supabase.from("categories").select("*").eq("is_active", true).order("position");
      setCategories((data as Category[]) || []);
      setLoading(false);
    };
    fetch();
  }, []);

  const emojis: Record<string, string> = { "body-splashes": "✨", "deodorants": "🌿", "body-lotions": "🧴", "shampoos": "💆", "conditioners": "💇", "body-wash": "🫧", "hair-care": "💇" };

  return (
    <><Navbar />
      <main className="flex-1">
        <div className="container-custom py-8 md:py-12">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold font-heading text-text mb-3">{tCommon("categories")}</h1>
            <div className="w-16 h-1 bg-accent mx-auto rounded-full" />
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {Array.from({ length: 6 }).map((_, i) => <div key={i} className="aspect-square bg-white rounded-xl border border-border-light animate-shimmer" />)}
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-20"><FolderOpen className="w-16 h-16 text-text-muted/20 mx-auto mb-4" /><p className="text-text-muted">{locale === "ar" ? "لا توجد أقسام" : "No categories available"}</p></div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {categories.map((cat, idx) => (
                <Link key={cat.id} href={`/${locale}/categories/${cat.slug}`}
                  className="group bg-white rounded-xl border border-border hover:border-primary/30 p-8 text-center card-hover animate-fade-in-up relative overflow-hidden"
                  style={{ animationDelay: `${idx * 80}ms` }}>
                  <div className="text-5xl mb-4">{emojis[cat.slug] || "📦"}</div>
                  <h3 className="font-semibold text-lg text-text group-hover:text-primary transition-colors mb-1">{locale === "ar" ? cat.name_ar : cat.name_en}</h3>
                  {(locale === "ar" ? cat.description_ar : cat.description_en) && <p className="text-sm text-text-muted line-clamp-2">{locale === "ar" ? cat.description_ar : cat.description_en}</p>}
                  <div className="absolute inset-0 rounded-xl bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    <Footer /></>
  );
}

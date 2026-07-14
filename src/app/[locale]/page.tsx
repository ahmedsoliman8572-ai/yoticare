import { getTranslations, getLocale } from "next-intl/server";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Sparkles, Leaf, Truck, HeartHandshake, FolderOpen, ChevronLeft, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getStorageUrl } from "@/lib/utils";

export default async function HomePage() {
  const t = await getTranslations("home");
  const tCommon = await getTranslations("common");
  const locale = await getLocale();
  
  const supabase = await createClient();
  const { data: dbCategories } = await supabase
    .from("categories")
    .select("slug, name_en, name_ar, image_path")
    .eq("is_active", true)
    .order("position", { ascending: true })
    .limit(8);

  const categories = dbCategories || [];

  const features = [
    {
      icon: Leaf,
      title: t("naturalIngredients"),
      desc: t("naturalIngredientsDesc"),
    },
    {
      icon: Sparkles,
      title: t("premiumQuality"),
      desc: t("premiumQualityDesc"),
    },
    {
      icon: Truck,
      title: t("fastDelivery"),
      desc: t("fastDeliveryDesc"),
    },
    {
      icon: HeartHandshake,
      title: t("customerCare"),
      desc: t("customerCareDesc"),
    },
  ];


  return (
    <>
      <Navbar />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-accent-light">
          {/* Background decorative elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
          </div>

          <div className="container-custom relative py-20 md:py-32 lg:py-40">
            <div className="max-w-2xl mx-auto text-center animate-fade-in-up">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-light text-primary text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4" />
                <span>{tCommon("siteDescription")}</span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-heading text-text leading-tight mb-6">
                {t("heroTitle")}
              </h1>

              <p className="text-lg md:text-xl text-text-secondary leading-relaxed mb-10 max-w-lg mx-auto">
                {t("heroSubtitle")}
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href={`/${locale}/shop`}
                  className="inline-flex items-center justify-center px-8 py-3.5 bg-primary text-white font-semibold rounded-full hover:bg-primary-dark transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                >
                  {t("shopNow")}
                </Link>
                <Link
                  href={`/${locale}/categories`}
                  className="inline-flex items-center justify-center px-8 py-3.5 bg-white text-primary font-semibold rounded-full border-2 border-primary/20 hover:border-primary/40 hover:bg-primary-50 transition-all duration-200"
                >
                  {t("exploreCategories")}
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Categories Grid */}
        <section className="container-custom py-16 md:py-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold font-heading text-text mb-3">
              {t("ourCategories")}
            </h2>
            <div className="w-16 h-1 bg-accent mx-auto rounded-full" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {categories.map((cat, idx) => (
              <Link
                key={cat.slug}
                href={`/${locale}/categories/${cat.slug}`}
                className="group relative bg-white rounded-[2rem] p-6 md:p-8 text-center transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 border border-transparent hover:border-primary/20 overflow-hidden animate-fade-in-up"
                style={{ animationDelay: `${idx * 80}ms` }}
              >
                {/* Decorative Background Blobs */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors duration-500" />
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-accent/5 rounded-full blur-2xl group-hover:bg-accent/10 transition-colors duration-500" />

                <div className="relative flex flex-col items-center">
                  <div className="w-20 h-20 md:w-24 md:h-24 mb-5 rounded-full flex items-center justify-center bg-gray-50 shadow-inner group-hover:scale-110 transition-transform duration-500 ease-out p-3">
                    {cat.image_path ? (
                      <Image
                        src={getStorageUrl(cat.image_path)}
                        alt={locale === "ar" ? cat.name_ar : cat.name_en}
                        width={80}
                        height={80}
                        className="object-contain w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-primary/5 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                        <Sparkles className="w-8 h-8 md:w-10 md:h-10" />
                      </div>
                    )}
                  </div>
                  
                  <h3 className="text-lg md:text-xl font-bold font-heading text-text group-hover:text-primary transition-colors duration-300">
                    {locale === "ar" ? cat.name_ar : cat.name_en}
                  </h3>
                  
                  <div className="mt-3 flex items-center justify-center gap-1 text-sm font-medium text-primary opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                    {locale === "ar" ? "تسوق الآن" : "Shop Now"}
                    {locale === "ar" ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Why YotiCare */}
        <section className="bg-gradient-to-br from-primary-dark to-primary-900 text-white py-16 md:py-24">
          <div className="container-custom">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold font-heading mb-3">
                {t("whyYoticare")}
              </h2>
              <div className="w-16 h-1 bg-accent mx-auto rounded-full" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
              {features.map((feature, idx) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={idx}
                    className="text-center p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors animate-fade-in-up"
                    style={{ animationDelay: `${idx * 100}ms` }}
                  >
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-accent/20 text-accent mb-4">
                      <Icon className="w-7 h-7" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                    <p className="text-white/70 text-sm leading-relaxed">
                      {feature.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}

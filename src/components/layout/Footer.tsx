"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { Phone, Mail, MapPin } from "lucide-react";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function Footer() {
  const t = useTranslations("footer");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  const [phone, setPhone] = useState("+20 1XX XXX XXXX");
  const [email, setEmail] = useState("info@yoticare.com");

  useEffect(() => {
    const fetchSettings = async () => {
      const supabase = createClient();
      const { data } = await supabase.from("site_settings").select("*");
      if (data) {
        const phoneSetting = data.find((s) => s.key === "phone");
        const emailSetting = data.find((s) => s.key === "email");
        if (phoneSetting?.value) setPhone(phoneSetting.value);
        if (emailSetting?.value) setEmail(emailSetting.value);
      }
    };
    fetchSettings();
  }, []);

  const quickLinks = [
    { href: `/${locale}`, label: tCommon("home") },
    { href: `/${locale}/shop`, label: tCommon("shop") },
    { href: `/${locale}/categories`, label: tCommon("categories") },
  ];

  const categories = [
    { href: `/${locale}/categories/body-splashes`, label: locale === "ar" ? "بادي سبلاش" : "Body Splashes" },
    { href: `/${locale}/categories/deodorants`, label: locale === "ar" ? "مزيلات العرق" : "Deodorants" },
    { href: `/${locale}/categories/body-lotions`, label: locale === "ar" ? "لوشن الجسم" : "Body Lotions" },
    { href: `/${locale}/categories/shampoos`, label: locale === "ar" ? "شامبو" : "Shampoos" },
  ];

  return (
    <footer className="bg-primary-dark text-white mt-auto">
      {/* Main Footer */}
      <div className="container-custom py-12 md:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href={`/${locale}`} className="inline-block mb-4">
              <Image
                src="/logo.jpg"
                alt="YotiCare"
                width={240}
                height={80}
                className="h-16 w-auto md:h-20"
              />
            </Link>
            <p className="text-white/70 text-sm leading-relaxed max-w-xs">
              {tCommon("siteDescription")}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-accent mb-4">
              {t("quickLinks")}
            </h3>
            <ul className="space-y-2.5">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-white/70 hover:text-white text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-accent mb-4">
              {t("categories")}
            </h3>
            <ul className="space-y-2.5">
              {categories.map((cat) => (
                <li key={cat.href}>
                  <Link
                    href={cat.href}
                    className="text-white/70 hover:text-white text-sm transition-colors"
                  >
                    {cat.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-accent mb-4">
              {t("contactUs")}
            </h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-white/70 text-sm">
                <Phone className="w-4 h-4 shrink-0" />
                <span dir="ltr">{phone}</span>
              </li>
              <li className="flex items-center gap-2 text-white/70 text-sm">
                <Mail className="w-4 h-4 shrink-0" />
                <span>{email}</span>
              </li>
              <li className="flex items-start gap-2 text-white/70 text-sm">
                <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{locale === "ar" ? "مصر" : "Egypt"}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="container-custom py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-white/50 text-xs">
          <p>
            © {new Date().getFullYear()} YotiCare. {t("rights")}
          </p>
          <p>
            {locale === "ar" ? "صنع بـ ❤️ في مصر" : "Made with ❤️ in Egypt"}
          </p>
        </div>
      </div>
    </footer>
  );
}

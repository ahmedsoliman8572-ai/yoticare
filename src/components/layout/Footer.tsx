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
  const [facebook, setFacebook] = useState("");
  const [instagram, setInstagram] = useState("");
  const [tiktok, setTiktok] = useState("");

  useEffect(() => {
    const fetchSettings = async () => {
      const supabase = createClient();
      const { data } = await supabase.from("site_settings").select("*");
      if (data) {
        const phoneSetting = data.find((s) => s.key === "contact_phone");
        const emailSetting = data.find((s) => s.key === "contact_email");
        const fbSetting = data.find((s) => s.key === "facebook_url");
        const igSetting = data.find((s) => s.key === "instagram_url");
        const ttSetting = data.find((s) => s.key === "tiktok_url");
        
        if (phoneSetting?.value) setPhone(phoneSetting.value);
        if (emailSetting?.value) setEmail(emailSetting.value);
        if (fbSetting?.value) setFacebook(fbSetting.value);
        if (igSetting?.value) setInstagram(igSetting.value);
        if (ttSetting?.value) setTiktok(ttSetting.value);
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
            <div className="flex gap-3 mt-6">
              {facebook && (
                <a href={facebook} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-accent hover:text-primary-dark transition-all duration-300 hover:-translate-y-1" aria-label="Facebook">
                  <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                </a>
              )}
              {instagram && (
                <a href={instagram} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-accent hover:text-primary-dark transition-all duration-300 hover:-translate-y-1" aria-label="Instagram">
                  <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                </a>
              )}
              {tiktok && (
                <a href={tiktok} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-accent hover:text-primary-dark transition-all duration-300 hover:-translate-y-1" aria-label="TikTok">
                  <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/></svg>
                </a>
              )}
            </div>
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

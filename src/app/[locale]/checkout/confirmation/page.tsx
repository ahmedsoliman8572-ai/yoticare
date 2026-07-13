"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/utils";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { CheckCircle, Phone, Loader2 } from "lucide-react";

export default function ConfirmationPage() {
  const t = useTranslations("confirmation");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("order");
  const [order, setOrder] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderNumber) { setLoading(false); return; }
    const fetch = async () => {
      const supabase = createClient();
      const { data } = await supabase.from("orders").select("*, order_items(*)").eq("order_number", orderNumber).single();
      setOrder(data as Record<string, unknown>);
      setLoading(false);
    };
    fetch();
  }, [orderNumber]);

  if (loading) return <><Navbar /><div className="flex-1 flex items-center justify-center py-24"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div><Footer /></>;

  return (
    <><Navbar />
      <main className="flex-1">
        <div className="container-custom py-12 md:py-20 max-w-2xl mx-auto text-center">
          <div className="animate-fade-in-up">
            <div className="w-20 h-20 bg-success-light rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-success" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold font-heading text-text mb-2">{t("title")}</h1>
            <p className="text-text-secondary text-lg mb-8">{t("thankYou")}</p>

            {order && (
              <div className="bg-white rounded-xl border border-border-light p-6 text-start mb-8">
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
                  <span className="text-text-muted text-sm">{t("orderNumber")}</span>
                  <span className="font-bold font-mono text-primary text-lg">{order.order_number as string}</span>
                </div>

                {(order.order_items as Record<string, unknown>[])?.map((item, i) => (
                  <div key={i} className="flex justify-between py-2 text-sm">
                    <span>{item.product_name as string} <span className="text-text-muted">x{item.quantity as number}</span></span>
                    <span className="font-medium">{formatPrice(item.total_price as number)}</span>
                  </div>
                ))}

                <div className="border-t border-border mt-4 pt-4 space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-text-muted">{locale === "ar" ? "الشحن" : "Shipping"}</span><span>{formatPrice(order.shipping_cost as number)}</span></div>
                  <div className="flex justify-between font-bold text-base"><span>{locale === "ar" ? "الإجمالي" : "Total"}</span><span className="text-primary">{formatPrice(order.total as number)}</span></div>
                </div>
              </div>
            )}

            {order && (order.payment_method as string) !== "cod" && (
              <div className="bg-warning-light rounded-xl p-4 mb-6 text-start">
                <p className="font-medium text-sm">⚠️ {t("paymentReminder")}</p>
                <p className="text-sm text-text-secondary mt-1">{t("paymentReminderWallet")}</p>
              </div>
            )}

            <div className="bg-primary-50 rounded-xl p-4 mb-8 text-start">
              <p className="text-sm flex items-center gap-2"><Phone className="w-4 h-4 text-primary" />{t("weWillContact")}</p>
            </div>

            <Link href={`/${locale}/shop`} className="inline-flex items-center px-8 py-3 bg-primary text-white rounded-full font-medium hover:bg-primary-dark transition-colors">{t("continueShopping")}</Link>
          </div>
        </div>
      </main>
    <Footer /></>
  );
}

"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useCartStore } from "@/lib/store/cart-store";
import { formatPrice, generateOrderNumber } from "@/lib/utils";
import { toast } from "sonner";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Minus, Plus, Trash2, ShoppingBag, Loader2, Wallet, Banknote } from "lucide-react";

interface PaymentMethodOption { id: string; type: string; label_en: string; label_ar: string; instructions_en: string | null; instructions_ar: string | null; wallet_number: string | null; account_name: string | null; }

export default function CheckoutPage() {
  const t = useTranslations("checkout");
  const tCart = useTranslations("cart");
  const locale = useLocale();
  const router = useRouter();
  const { items, removeItem, updateQuantity, clearCart, getSubtotal } = useCartStore();

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodOption[]>([]);
  const [shippingZones, setShippingZones] = useState<any[]>([]);
  const [defaultShipping, setDefaultShipping] = useState(50);
  const [shippingCost, setShippingCost] = useState(50);
  const [placing, setPlacing] = useState(false);
  const [walletConfirmed, setWalletConfirmed] = useState(false);

  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const [form, setForm] = useState({ customer_name: "", customer_phone: "", customer_phone_2: "", customer_email: "", customer_governorate: "", customer_city: "", customer_address: "", payment_method: "cod", notes: "" });

  useEffect(() => {
    const fetch = async () => {
      const supabase = createClient();
      const [{ data: methods }, { data: settings }, { data: zones }] = await Promise.all([
        supabase.from("payment_methods").select("*").eq("is_active", true).order("position"),
        supabase.from("site_settings").select("value").eq("key", "default_shipping_cost").single(),
        supabase.from("shipping_zones").select("*").eq("is_active", true).order("governorate_en"),
      ]);
      setPaymentMethods((methods as PaymentMethodOption[]) || []);
      
      const defShipping = settings ? parseFloat(settings.value) || 50 : 50;
      setDefaultShipping(defShipping);
      setShippingCost(defShipping);
      
      setShippingZones(zones || []);
    };
    fetch();
  }, []);

  const handleGovernorateChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const gov = e.target.value;
    setForm({ ...form, customer_governorate: gov });
    const zone = shippingZones.find(z => (locale === "ar" ? z.governorate_ar : z.governorate_en) === gov);
    if (zone) {
      setShippingCost(Number(zone.cost));
    } else {
      setShippingCost(defaultShipping);
    }
  };

  const subtotal = getSubtotal();
  let discount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discount_type === "percentage") {
      discount = (subtotal * appliedCoupon.discount_value) / 100;
      if (appliedCoupon.max_discount && discount > appliedCoupon.max_discount) {
        discount = appliedCoupon.max_discount;
      }
    } else {
      discount = appliedCoupon.discount_value;
    }
  }
  const total = subtotal - discount + shippingCost;
  const selectedMethod = paymentMethods.find((m) => m.type === form.payment_method);

  const handleApplyCoupon = async () => {
    setCouponError("");
    if (!couponCode) return;
    setApplyingCoupon(true);
    const supabase = createClient();
    const { data } = await supabase.from("coupons").select("*").eq("code", couponCode.toUpperCase()).eq("is_active", true).single();
    
    if (!data) {
      setCouponError(locale === "ar" ? "كوبون غير صالح" : "Invalid coupon");
      setApplyingCoupon(false);
      return;
    }
    if (data.expiry_date && new Date(data.expiry_date) < new Date()) {
      setCouponError(locale === "ar" ? "كوبون منتهي الصلاحية" : "Expired coupon");
      setApplyingCoupon(false);
      return;
    }
    if (data.usage_limit && data.times_used >= data.usage_limit) {
      setCouponError(locale === "ar" ? "تم تجاوز حد الاستخدام" : "Usage limit reached");
      setApplyingCoupon(false);
      return;
    }
    if (data.min_order_value && subtotal < data.min_order_value) {
      setCouponError((locale === "ar" ? "الحد الأدنى للطلب " : "Minimum order value is ") + data.min_order_value);
      setApplyingCoupon(false);
      return;
    }
    
    setAppliedCoupon(data);
    toast.success(locale === "ar" ? "تم تطبيق الكوبون بنجاح" : "Coupon applied successfully");
    setApplyingCoupon(false);
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
  };

  const handlePlaceOrder = async () => {
    if (!form.customer_name || !form.customer_phone || !form.customer_governorate || !form.customer_address || !form.customer_city) {
      toast.error(locale === "ar" ? "يرجى ملء جميع الحقول المطلوبة" : "Please fill in all required fields");
      return;
    }
    if (items.length === 0) {
      toast.error(locale === "ar" ? "السلة فارغة" : "Cart is empty");
      return;
    }

    setPlacing(true);
    try {
      const supabase = createClient();
      const orderNumber = generateOrderNumber();

      const orderPayload = {
        order_number: orderNumber,
        customer_name: form.customer_name,
        customer_phone: form.customer_phone,
        customer_phone_2: form.customer_phone_2 || null,
        customer_email: form.customer_email || null,
        customer_governorate: form.customer_governorate,
        customer_city: form.customer_city,
        customer_address: form.customer_address,
        payment_method: form.payment_method,
        notes: form.notes || null,
        subtotal,
        shipping_cost: shippingCost,
        discount: discount,
        coupon_code: appliedCoupon?.code || null,
        total,
        status: "pending",
        payment_status: "pending",
      };

      const { data: order, error: orderError } = await supabase.from("orders").insert([orderPayload]).select().single();

      if (orderError) throw orderError;

      const orderItems = items.map((item) => ({
        order_id: order.id, product_id: item.product_id,
        product_name: locale === "ar" ? item.name_ar : item.name_en,
        variant_id: item.variant_id || null,
        variant_name: locale === "ar" ? item.variant_name_ar : item.variant_name_en,
        quantity: item.quantity, unit_price: item.price, total_price: item.price * item.quantity,
      }));

      await supabase.from("order_items").insert(orderItems);
      clearCart();
      router.push(`/${locale}/checkout/confirmation?order=${orderNumber}`);
    } catch (err) {
      toast.error(locale === "ar" ? "حدث خطأ أثناء تأكيد الطلب" : "Error placing order");
      setPlacing(false);
    }
  };

  if (items.length === 0) {
    return (
      <><Navbar />
        <main className="flex-1 flex items-center justify-center py-20">
          <div className="text-center animate-fade-in-up">
            <ShoppingBag className="w-20 h-20 text-text-muted/20 mx-auto mb-4" />
            <h2 className="text-2xl font-bold font-heading mb-2">{tCart("empty")}</h2>
            <p className="text-text-muted mb-6">{tCart("emptyDesc")}</p>
            <Link href={`/${locale}/shop`} className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-full font-medium hover:bg-primary-dark transition-colors">{tCart("continueShopping")}</Link>
          </div>
        </main>
      <Footer /></>
    );
  }

  return (
    <><Navbar />
      <main className="flex-1">
        <div className="container-custom py-8 md:py-12">
          <h1 className="text-3xl font-bold font-heading text-text mb-8">{t("title")}</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Customer Info */}
              <div className="bg-white rounded-xl border border-border-light p-6">
                <h2 className="text-lg font-semibold mb-4">{t("customerInfo")}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium mb-1.5">{t("name")} *</label><input value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} className="w-full px-4 py-2.5 rounded-lg border border-border focus:outline-none focus:border-primary focus:ring-2 focus:ring-ring" placeholder={t("namePlaceholder")} /></div>
                  <div><label className="block text-sm font-medium mb-1.5">{t("phone")} *</label><input dir="ltr" value={form.customer_phone} onChange={(e) => setForm({ ...form, customer_phone: e.target.value })} className="w-full px-4 py-2.5 rounded-lg border border-border focus:outline-none focus:border-primary focus:ring-2 focus:ring-ring" placeholder={t("phonePlaceholder")} /></div>
                  <div><label className="block text-sm font-medium mb-1.5">{t("phone2")}</label><input dir="ltr" value={form.customer_phone_2} onChange={(e) => setForm({ ...form, customer_phone_2: e.target.value })} className="w-full px-4 py-2.5 rounded-lg border border-border focus:outline-none focus:border-primary focus:ring-2 focus:ring-ring" placeholder={t("phone2Placeholder")} /></div>
                  <div><label className="block text-sm font-medium mb-1.5">{t("email")}</label><input type="email" value={form.customer_email} onChange={(e) => setForm({ ...form, customer_email: e.target.value })} className="w-full px-4 py-2.5 rounded-lg border border-border focus:outline-none focus:border-primary focus:ring-2 focus:ring-ring" placeholder={t("emailPlaceholder")} /></div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">{t("governorate")} *</label>
                    {shippingZones.length > 0 ? (
                      <select value={form.customer_governorate} onChange={handleGovernorateChange} className="w-full px-4 py-2.5 rounded-lg border border-border bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-ring">
                        <option value="">{locale === "ar" ? "اختر المحافظة" : "Select Governorate"}</option>
                        {shippingZones.map((z) => {
                          const name = locale === "ar" ? z.governorate_ar : z.governorate_en;
                          return <option key={z.id} value={name}>{name}</option>;
                        })}
                      </select>
                    ) : (
                      <input value={form.customer_governorate} onChange={handleGovernorateChange} className="w-full px-4 py-2.5 rounded-lg border border-border focus:outline-none focus:border-primary focus:ring-2 focus:ring-ring" placeholder={t("governoratePlaceholder")} />
                    )}
                  </div>
                  <div><label className="block text-sm font-medium mb-1.5">{t("city")} *</label><input value={form.customer_city} onChange={(e) => setForm({ ...form, customer_city: e.target.value })} className="w-full px-4 py-2.5 rounded-lg border border-border focus:outline-none focus:border-primary focus:ring-2 focus:ring-ring" placeholder={t("cityPlaceholder")} /></div>
                  <div className="md:col-span-2"><label className="block text-sm font-medium mb-1.5">{t("address")} *</label><textarea rows={2} value={form.customer_address} onChange={(e) => setForm({ ...form, customer_address: e.target.value })} className="w-full px-4 py-2.5 rounded-lg border border-border focus:outline-none focus:border-primary focus:ring-2 focus:ring-ring" placeholder={t("addressPlaceholder")} /></div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-white rounded-xl border border-border-light p-6">
                <h2 className="text-lg font-semibold mb-4">{t("paymentMethod")}</h2>
                <div className="space-y-3">
                  {paymentMethods.map((method) => (
                    <label key={method.id} className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${form.payment_method === method.type ? "border-primary bg-primary-50" : "border-border hover:border-primary/30"}`}>
                      <input type="radio" name="payment" value={method.type} checked={form.payment_method === method.type} onChange={(e) => setForm({ ...form, payment_method: e.target.value })} className="mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {method.type === "cod" ? <Banknote className="w-5 h-5 text-primary" /> : <Wallet className="w-5 h-5 text-primary" />}
                          <span className="font-medium">{locale === "ar" ? method.label_ar : method.label_en}</span>
                        </div>
                        {form.payment_method === method.type && (method.type === "vodafone_cash" || method.type === "instapay") && (
                          <div className="mt-3 p-3 bg-white rounded-lg border border-border text-sm space-y-2">
                            <p className="text-text-secondary">{locale === "ar" ? method.instructions_ar : method.instructions_en}</p>
                            {method.wallet_number && (
                              <div className="flex items-center gap-2 font-mono font-bold text-lg text-primary" dir="ltr">{method.wallet_number}</div>
                            )}
                            {method.account_name && <p className="text-text-muted">{method.account_name}</p>}
                            <label className="flex items-center gap-2 mt-2 cursor-pointer">
                              <input type="checkbox" checked={walletConfirmed} onChange={(e) => setWalletConfirmed(e.target.checked)} className="w-4 h-4 rounded" />
                              <span className="text-sm font-medium">{t("walletConfirm")}</span>
                            </label>
                          </div>
                        )}
                        {form.payment_method === method.type && method.type === "cod" && (
                          <p className="mt-2 text-sm text-text-muted">{t("codDesc")}</p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="bg-white rounded-xl border border-border-light p-6">
                <label className="block text-sm font-medium mb-1.5">{t("orderNotes")}</label>
                <textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full px-4 py-2.5 rounded-lg border border-border focus:outline-none focus:border-primary focus:ring-2 focus:ring-ring" placeholder={t("orderNotesPlaceholder")} />
              </div>
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl border border-border-light p-6 sticky top-24">
                <h2 className="text-lg font-semibold mb-4">{t("orderSummary")}</h2>
                <div className="space-y-3 mb-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="w-12 h-12 rounded-lg bg-gray-50 overflow-hidden shrink-0">
                        {item.image_path && <Image src={item.image_path} alt="" width={48} height={48} className="w-full h-full object-cover" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{locale === "ar" ? item.name_ar : item.name_en}</p>
                        {item.variant_id && (
                          <p className="text-xs text-text-muted mt-0.5">{locale === "ar" ? item.variant_name_ar : item.variant_name_en}</p>
                        )}
                        <div className="flex items-center justify-between mt-1">
                          <div className="flex items-center gap-1">
                            <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-0.5 rounded hover:bg-gray-100"><Minus className="w-3 h-3" /></button>
                            <span className="text-xs w-6 text-center">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-0.5 rounded hover:bg-gray-100"><Plus className="w-3 h-3" /></button>
                          </div>
                          <span className="text-sm font-medium">{formatPrice(item.price * item.quantity)}</span>
                        </div>
                      </div>
                      <button onClick={() => removeItem(item.id)} className="p-1 hover:bg-red-50 rounded text-text-muted hover:text-error"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  ))}
                </div>

                <div className="border-t border-border pt-4 mb-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      disabled={!!appliedCoupon}
                      className="flex-1 px-3 py-2 rounded-lg border border-border focus:outline-none focus:border-primary text-sm uppercase"
                      placeholder={locale === "ar" ? "كود الخصم" : "Coupon Code"}
                    />
                    {appliedCoupon ? (
                      <button onClick={handleRemoveCoupon} className="px-4 py-2 bg-red-50 text-error text-sm font-medium rounded-lg hover:bg-red-100 transition-colors">
                        {locale === "ar" ? "إزالة" : "Remove"}
                      </button>
                    ) : (
                      <button onClick={handleApplyCoupon} disabled={applyingCoupon || !couponCode} className="px-4 py-2 bg-gray-100 text-text-secondary text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50">
                        {applyingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : (locale === "ar" ? "تطبيق" : "Apply")}
                      </button>
                    )}
                  </div>
                  {couponError && <p className="text-error text-xs mt-2">{couponError}</p>}
                </div>

                <div className="border-t border-border pt-4 space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-text-muted">{t("orderSummary")}</span><span>{formatPrice(subtotal)}</span></div>
                  {appliedCoupon && (
                    <div className="flex justify-between text-primary"><span>{locale === "ar" ? "الخصم" : "Discount"}</span><span>-{formatPrice(discount)}</span></div>
                  )}
                  <div className="flex justify-between"><span className="text-text-muted">{t("shippingCost")}</span><span>{formatPrice(shippingCost)}</span></div>
                  <div className="flex justify-between font-bold text-lg pt-2 border-t"><span>{locale === "ar" ? "الإجمالي" : "Total"}</span><span className="text-primary">{formatPrice(total)}</span></div>
                </div>

                <button onClick={handlePlaceOrder} disabled={placing}
                  className="w-full mt-6 py-3.5 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {placing ? <><Loader2 className="w-4 h-4 animate-spin" />{t("placing")}</> : t("placeOrder")}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    <Footer /></>
  );
}

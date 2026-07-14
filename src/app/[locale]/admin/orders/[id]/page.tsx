"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, User, MapPin, Phone, CreditCard, Loader2, Trash2 } from "lucide-react";

export default function AdminOrderDetailPage() {
  const t = useTranslations("admin.orderDetail");
  const tStatus = useTranslations("admin.orderStatus");
  const locale = useLocale();
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;
  const isRTL = locale === "ar";
  const BackArrow = isRTL ? ArrowRight : ArrowLeft;

  const [order, setOrder] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      const supabase = createClient();
      const { data } = await supabase.from("orders").select("*, order_items(*)").eq("id", orderId).single();
      setOrder(data as Record<string, unknown>);
      setLoading(false);
    };
    fetchOrder();
  }, [orderId]);

  const handleStatusChange = async (status: string) => {
    setUpdatingStatus(true);
    const supabase = createClient();
    await supabase.from("orders").update({ status }).eq("id", orderId);
    setOrder((prev) => prev ? { ...prev, status } : prev);
    toast.success(t("statusUpdated"));
    setUpdatingStatus(false);
  };

  const handlePaymentToggle = async () => {
    const newStatus = (order as Record<string, unknown>).payment_status === "paid" ? "pending" : "paid";
    const supabase = createClient();
    await supabase.from("orders").update({ payment_status: newStatus }).eq("id", orderId);
    setOrder((prev) => prev ? { ...prev, payment_status: newStatus } : prev);
    toast.success(t("paymentUpdated"));
  };

  const executeDeleteOrder = async () => {
    setShowDeleteModal(false);
    setUpdatingStatus(true);
    const supabase = createClient();
    const { error } = await supabase.from("orders").delete().eq("id", orderId);
    if (error) {
      toast.error(locale === "ar" ? "حدث خطأ أثناء الحذف" : "Error deleting order");
      setUpdatingStatus(false);
    } else {
      toast.success(locale === "ar" ? "تم حذف الطلب بنجاح" : "Order deleted successfully");
      router.push(`/${locale}/admin/orders`);
    }
  };

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;
  if (!order) return <div className="text-center py-24 text-text-muted">Order not found</div>;

  const items = (order.order_items as Record<string, unknown>[]) || [];
  const statusOptions = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push(`/${locale}/admin/orders`)} className="p-2 hover:bg-white rounded-full transition-colors"><BackArrow className="w-5 h-5 text-text-muted" /></button>
          <div>
            <h1 className="text-2xl font-bold font-heading text-text flex items-center gap-3">
              {t("orderNumber")} #{order.order_number as string}
              <span className={`text-sm px-2.5 py-1 rounded-full border ${order.status === "cancelled" ? "bg-red-50 text-red-600 border-red-200" : order.status === "delivered" ? "bg-green-50 text-green-600 border-green-200" : "bg-primary-50 text-primary border-primary-200"}`}>{tStatus(order.status as "pending" | "confirmed" | "shipped" | "delivered" | "cancelled")}</span>
            </h1>
            <p className="text-text-muted text-sm mt-1">{new Date(order.created_at as string).toLocaleString(locale)}</p>
          </div>
        </div>
        <button onClick={() => setShowDeleteModal(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 rounded-lg transition-colors text-sm font-medium">
          <Trash2 className="w-4 h-4" />
          <span className="hidden sm:inline">{locale === "ar" ? "حذف الطلب" : "Delete Order"}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Info */}
        <div className="bg-white rounded-xl border border-border-light p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><User className="w-5 h-5 text-primary" />{t("customerInfo")}</h2>
          <div className="space-y-3 text-sm">
            <div><span className="text-text-muted">{locale === "ar" ? "الاسم:" : "Name:"}</span><p className="font-medium">{String(order.customer_name)}</p></div>
            <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-text-muted" /><span dir="ltr">{String(order.customer_phone)}</span></div>
            {Boolean(order.customer_phone_2) && <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-text-muted" /><span dir="ltr">{String(order.customer_phone_2)}</span></div>}
            {Boolean(order.customer_email) && <div><span className="text-text-muted">{String(order.customer_email)}</span></div>}
            <div className="flex items-start gap-2"><MapPin className="w-4 h-4 text-text-muted mt-0.5" /><div><p>{String(order.customer_address)}</p><p className="text-text-muted">{String(order.customer_governorate)} - {String(order.customer_city)}</p></div></div>
          </div>
        </div>

        {/* Order Status & Payment */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-border-light p-6">
            <h2 className="text-lg font-semibold mb-4">{t("updateStatus")}</h2>
            <select value={order.status as string} onChange={(e) => handleStatusChange(e.target.value)} disabled={updatingStatus}
              className="w-full px-4 py-2.5 rounded-lg border border-border bg-white focus:outline-none focus:border-primary">
              {statusOptions.map((s) => <option key={s} value={s}>{tStatus(s as "pending" | "confirmed" | "shipped" | "delivered" | "cancelled")}</option>)}
            </select>
          </div>
          <div className="bg-white rounded-xl border border-border-light p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><CreditCard className="w-5 h-5 text-primary" />{t("paymentInfo")}</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-text-muted">{locale === "ar" ? "الطريقة:" : "Method:"}</span><span className="font-medium">{order.payment_method as string}</span></div>
              <div className="flex justify-between items-center"><span className="text-text-muted">{locale === "ar" ? "الحالة:" : "Status:"}</span>
                <span className={`badge ${(order.payment_status as string) === "paid" ? "badge-success" : "badge-warning"}`}>{(order.payment_status as string) === "paid" ? (locale === "ar" ? "مدفوع" : "Paid") : (locale === "ar" ? "معلق" : "Pending")}</span>
              </div>
              <button onClick={handlePaymentToggle} className="w-full mt-2 py-2 rounded-lg border border-border text-sm font-medium hover:bg-gray-50 transition-colors">
                {(order.payment_status as string) === "paid" ? t("markUnpaid") : t("markPaid")}
              </button>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-xl border border-border-light p-6">
          <h2 className="text-lg font-semibold mb-4">{t("orderItems")}</h2>
          <div className="space-y-3">
            {items.map((item, i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b border-border-light last:border-0">
                <div><p className="font-medium text-sm">{item.product_name as string}</p><p className="text-xs text-text-muted">x{item.quantity as number}</p></div>
                <span className="font-medium text-sm">{formatPrice(item.total_price as number)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-border mt-4 pt-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-text-muted">{locale === "ar" ? "المجموع الفرعي" : "Subtotal"}</span><span>{formatPrice(order.subtotal as number)}</span></div>
            {Boolean(order.coupon_code) && (
              <div className="flex justify-between text-primary">
                <span>{locale === "ar" ? "الخصم" : "Discount"} ({order.coupon_code as string})</span>
                <span>-{formatPrice((order.discount as number) || 0)}</span>
              </div>
            )}
            <div className="flex justify-between"><span className="text-text-muted">{locale === "ar" ? "الشحن" : "Shipping"}</span><span>{formatPrice(order.shipping_cost as number)}</span></div>
            <div className="flex justify-between font-bold text-base pt-2 border-t"><span>{locale === "ar" ? "الإجمالي" : "Total"}</span><span className="text-primary">{formatPrice(order.total as number)}</span></div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-scale-in border border-border/50">
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-5 mx-auto border border-red-100">
              <Trash2 className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-center mb-2">{locale === "ar" ? "تأكيد الحذف" : "Confirm Deletion"}</h3>
            <p className="text-text-muted text-center mb-6 text-sm">
              {locale === "ar" ? "هل أنت متأكد من رغبتك في حذف هذا الطلب نهائياً؟ لا يمكن التراجع عن هذا الإجراء." : "Are you sure you want to permanently delete this order? This action cannot be undone."}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-border text-text font-medium hover:bg-gray-50 transition-colors">
                {locale === "ar" ? "تراجع" : "Cancel"}
              </button>
              <button onClick={executeDeleteOrder} className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition-colors shadow-sm shadow-red-200">
                {locale === "ar" ? "نعم، احذفه" : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

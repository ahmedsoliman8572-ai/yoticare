"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/utils";
import { ShoppingCart, Eye, Search, Download, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface OrderRow { id: string; order_number: string; customer_name: string; customer_phone: string; status: string; payment_method: string; payment_status: string; total: number; created_at: string; }

export default function AdminOrdersPage() {
  const t = useTranslations("admin");
  const tStatus = useTranslations("admin.orderStatus");
  const tPayment = useTranslations("admin.paymentStatus");
  const locale = useLocale();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      const supabase = createClient();
      let query = supabase.from("orders").select("*").order("created_at", { ascending: false });
      if (statusFilter) query = query.eq("status", statusFilter);
      if (search) query = query.or(`order_number.ilike.%${search}%,customer_name.ilike.%${search}%,customer_phone.ilike.%${search}%`);
      const { data } = await query;
      setOrders((data as OrderRow[]) || []);
      setLoading(false);
    };
    fetchOrders();
  }, [search, statusFilter]);

  const handleDeleteOrder = async (id: string) => {
    if (!confirm(locale === "ar" ? "هل أنت متأكد من حذف هذا الطلب؟ لا يمكن التراجع عن هذا الإجراء." : "Are you sure you want to delete this order? This action cannot be undone.")) return;
    
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.from("orders").delete().eq("id", id);
    if (error) {
      toast.error(locale === "ar" ? "حدث خطأ أثناء الحذف" : "Error deleting order");
      setLoading(false);
    } else {
      toast.success(locale === "ar" ? "تم حذف الطلب بنجاح" : "Order deleted successfully");
      setOrders(orders.filter(o => o.id !== id));
      setLoading(false);
    }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = { pending: "badge-warning", confirmed: "badge-primary", shipped: "badge-primary", delivered: "badge-success", cancelled: "badge-error" };
    return map[status] || "badge-primary";
  };

  const paymentBadge = (status: string) => status === "paid" ? "badge-success" : "badge-warning";

  const handleExportCSV = () => {
    if (orders.length === 0) {
      toast.error(locale === "ar" ? "لا توجد طلبات للتصدير" : "No orders to export");
      return;
    }

    const headers = ["Order #", "Date", "Customer Name", "Phone", "Phone 2", "Governorate", "City", "Address", "Payment Method", "Payment Status", "Status", "Subtotal", "Discount", "Coupon", "Shipping", "Total", "Notes"];
    
    const rows = orders.map((o: any) => [
      o.order_number,
      new Date(o.created_at).toLocaleString(),
      `"${(o.customer_name || "").replace(/"/g, '""')}"`,
      `"${o.customer_phone || ""}"`,
      `"${o.customer_phone_2 || ""}"`,
      `"${(o.customer_governorate || "").replace(/"/g, '""')}"`,
      `"${(o.customer_city || "").replace(/"/g, '""')}"`,
      `"${(o.customer_address || "").replace(/"/g, '""')}"`,
      o.payment_method,
      o.payment_status,
      o.status,
      o.subtotal,
      o.discount || 0,
      o.coupon_code || "",
      o.shipping_cost,
      o.total,
      `"${(o.notes || "").replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `orders_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-heading text-text">{t("orders")}</h1>
        <button onClick={handleExportCSV} className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-border text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors shadow-sm">
          <Download className="w-4 h-4" />
          {locale === "ar" ? "تصدير CSV" : "Export CSV"}
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={locale === "ar" ? "ابحث برقم الطلب أو الاسم..." : "Search by order # or name..."} className="w-full ps-10 pe-4 py-2.5 rounded-lg border border-border bg-white text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-ring" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2.5 rounded-lg border border-border bg-white text-sm focus:outline-none focus:border-primary">
          <option value="">{locale === "ar" ? "كل الحالات" : "All Statuses"}</option>
          <option value="pending">{tStatus("pending")}</option>
          <option value="confirmed">{tStatus("confirmed")}</option>
          <option value="shipped">{tStatus("shipped")}</option>
          <option value="delivered">{tStatus("delivered")}</option>
          <option value="cancelled">{tStatus("cancelled")}</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-border-light overflow-hidden">
        {loading ? (
          <div className="p-12 text-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-text-muted"><ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-30" /><p className="text-sm">{t("noOrders")}</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border-light bg-gray-50/50">
                <th className="text-start px-4 py-3 font-medium text-text-secondary">{locale === "ar" ? "رقم الطلب" : "Order #"}</th>
                <th className="text-start px-4 py-3 font-medium text-text-secondary">{locale === "ar" ? "العميل" : "Customer"}</th>
                <th className="text-start px-4 py-3 font-medium text-text-secondary hidden md:table-cell">{locale === "ar" ? "الدفع" : "Payment"}</th>
                <th className="text-start px-4 py-3 font-medium text-text-secondary">{locale === "ar" ? "الحالة" : "Status"}</th>
                <th className="text-start px-4 py-3 font-medium text-text-secondary">{locale === "ar" ? "الإجمالي" : "Total"}</th>
                <th className="text-end px-4 py-3 font-medium text-text-secondary"></th>
              </tr></thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-border-light last:border-0 hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-medium text-primary">{order.order_number}</td>
                    <td className="px-4 py-3"><p className="font-medium">{order.customer_name}</p><p className="text-xs text-text-muted" dir="ltr">{order.customer_phone}</p></td>
                    <td className="px-4 py-3 hidden md:table-cell"><span className={`badge ${paymentBadge(order.payment_status)}`}>{tPayment(order.payment_status as "pending" | "paid")}</span></td>
                    <td className="px-4 py-3"><span className={`badge ${statusBadge(order.status)}`}>{tStatus(order.status as "pending" | "confirmed" | "shipped" | "delivered" | "cancelled")}</span></td>
                    <td className="px-4 py-3 font-medium">{formatPrice(order.total)}</td>
                    <td className="px-4 py-3 flex items-center justify-end gap-2">
                      <Link href={`/${locale}/admin/orders/${order.id}`} className="p-1.5 rounded-lg hover:bg-gray-100 text-text-muted hover:text-primary inline-flex transition-colors" title={locale === "ar" ? "عرض" : "View"}><Eye className="w-4 h-4" /></Link>
                      <button onClick={() => handleDeleteOrder(order.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-text-muted hover:text-red-600 inline-flex transition-colors" title={locale === "ar" ? "حذف" : "Delete"}><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

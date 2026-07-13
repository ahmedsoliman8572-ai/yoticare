import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils";
import {
  Package,
  ShoppingCart,
  DollarSign,
  Clock,
  Plus,
  ArrowRight,
  ArrowLeft,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import SalesChart from "./SalesChart";

export default async function AdminDashboard({ params }: { params: Promise<{ locale: string }> }) {
  const resolvedParams = await params;
  const locale = resolvedParams.locale;
  const t = await getTranslations({ locale, namespace: "admin" });
  const tStatus = await getTranslations({ locale, namespace: "admin.orderStatus" });
  const isRTL = locale === "ar";
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  const supabase = await createClient();

  // Fetch metrics in parallel
  const [
    { count: productsCount },
    { count: ordersCount },
    { data: revenueData },
    { count: pendingCount },
    { data: recentOrders },
    { data: lowStockProducts },
  ] = await Promise.all([
    supabase.from("products").select("*", { count: "exact", head: true }),
    supabase.from("orders").select("*", { count: "exact", head: true }),
    supabase.from("orders").select("total, created_at").neq("status", "cancelled"),
    supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("orders").select("id, order_number, customer_name, status, total, created_at").order("created_at", { ascending: false }).limit(5),
    supabase.from("products").select("id, name_en, name_ar, stock_quantity, slug").lte("stock_quantity", 10).order("stock_quantity", { ascending: true }).limit(5),
  ]);

  const totalRevenue = revenueData?.reduce((sum, order) => sum + (Number(order.total) || 0), 0) || 0;

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split("T")[0];
  });

  const chartData = last7Days.map(date => {
    const total = revenueData?.filter(o => o.created_at.startsWith(date))
      .reduce((sum, o) => sum + (Number(o.total) || 0), 0) || 0;
    const dateObj = new Date(date);
    const displayDate = dateObj.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
    return { date: displayDate, total };
  });

  const stats = [
    {
      label: t("totalProducts"),
      value: productsCount || "0",
      icon: Package,
      color: "text-primary",
      bg: "bg-primary-50",
    },
    {
      label: t("totalOrders"),
      value: ordersCount || "0",
      icon: ShoppingCart,
      color: "text-info",
      bg: "bg-info-light",
    },
    {
      label: t("totalRevenue"),
      value: formatPrice(totalRevenue),
      icon: DollarSign,
      color: "text-success",
      bg: "bg-success-light",
    },
    {
      label: t("pendingOrders"),
      value: pendingCount || "0",
      icon: Clock,
      color: "text-warning",
      bg: "bg-warning-light",
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-heading text-text">
            {t("welcome")} 👋
          </h1>
          <p className="text-text-secondary text-sm mt-1">{t("overview")}</p>
        </div>
        <Link
          href={`/${locale}/admin/products/new`}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          {t("addProduct")}
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className="stat-card animate-fade-in-up bg-white p-6 rounded-xl border border-border-light"
              style={{ animationDelay: `${idx * 80}ms` }}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-text-secondary text-xs font-medium">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-bold text-text mt-0.5">
                    {stat.value}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Chart Section */}
      <div className="bg-white rounded-xl border border-border-light p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-text flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            {locale === "ar" ? "المبيعات آخر 7 أيام" : "Sales Last 7 Days"}
          </h2>
        </div>
        <SalesChart data={chartData} />
      </div>

      {/* Quick Actions + Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-xl border border-border-light p-6">
          <h2 className="text-lg font-semibold text-text mb-4">
            {t("quickActions")}
          </h2>
          <div className="space-y-3">
            <Link
              href={`/${locale}/admin/products/new`}
              className="flex items-center justify-between p-3 rounded-lg bg-primary-50 text-primary hover:bg-primary-100 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <Plus className="w-5 h-5" />
                <span className="font-medium text-sm">{t("addProduct")}</span>
              </div>
              <ArrowIcon className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
            <Link
              href={`/${locale}/admin/orders`}
              className="flex items-center justify-between p-3 rounded-lg bg-info-light text-info hover:bg-blue-100 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <ShoppingCart className="w-5 h-5" />
                <span className="font-medium text-sm">{t("viewOrders")}</span>
              </div>
              <ArrowIcon className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
            <Link
              href={`/${locale}/admin/settings/payment`}
              className="flex items-center justify-between p-3 rounded-lg bg-accent-light text-accent-dark hover:bg-yellow-100 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5" />
                <span className="font-medium text-sm">
                  {t("paymentSettings")}
                </span>
              </div>
              <ArrowIcon className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-border-light p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-text">
              {t("recentOrders")}
            </h2>
            <Link
              href={`/${locale}/admin/orders`}
              className="text-sm text-primary font-medium hover:underline"
            >
              {t("viewOrders")}
            </Link>
          </div>

          {!recentOrders || recentOrders.length === 0 ? (
            <div className="text-center py-12 text-text-muted">
              <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">{t("noOrders")}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-start">
                <thead className="text-text-muted border-b border-border">
                  <tr>
                    <th className="pb-3 font-medium">{t("orderNumber")}</th>
                    <th className="pb-3 font-medium">{t("customer")}</th>
                    <th className="pb-3 font-medium">{t("status")}</th>
                    <th className="pb-3 font-medium text-end">{t("total")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3">
                        <Link href={`/${locale}/admin/orders/${order.id}`} className="font-medium text-primary hover:underline">
                          {order.order_number}
                        </Link>
                        <div className="text-xs text-text-muted mt-0.5">
                          {new Date(order.created_at).toLocaleDateString(locale)}
                        </div>
                      </td>
                      <td className="py-3 font-medium">{order.customer_name}</td>
                      <td className="py-3">
                        <span className={`badge ${
                          order.status === "delivered" ? "badge-success" :
                          order.status === "cancelled" ? "badge-error" :
                          order.status === "shipped" ? "badge-info" : "badge-warning"
                        }`}>
                          {tStatus(order.status as "pending" | "confirmed" | "shipped" | "delivered" | "cancelled")}
                        </span>
                      </td>
                      <td className="py-3 text-end font-medium">
                        {formatPrice(order.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Low Stock Alerts */}
      <div className="bg-white rounded-xl border border-border-light p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-warning" />
          <h2 className="text-lg font-semibold text-text">{t("lowStock")}</h2>
        </div>
        {!lowStockProducts || lowStockProducts.length === 0 ? (
          <div className="text-center py-8 text-text-muted">
            <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">{t("noProducts")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lowStockProducts.map((product) => (
              <div key={product.id} className="flex items-center justify-between p-4 rounded-lg border border-warning/20 bg-warning/5">
                <div>
                  <Link href={`/${locale}/admin/products/${product.id}/edit`} className="font-medium hover:text-primary transition-colors">
                    {locale === "ar" ? product.name_ar : product.name_en}
                  </Link>
                  <p className="text-sm text-text-muted mt-1">{t("stockLeft", { count: product.stock_quantity })}</p>
                </div>
                <Link href={`/${locale}/admin/products/${product.id}/edit`} className="p-2 rounded-lg bg-white shadow-sm hover:bg-gray-50 text-primary">
                  <ArrowIcon className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

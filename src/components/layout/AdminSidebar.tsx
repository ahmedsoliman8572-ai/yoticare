"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  FolderOpen,
  ShoppingCart,
  CreditCard,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  Tag,
  Truck,
} from "lucide-react";
import { useState } from "react";

export default function AdminSidebar() {
  const t = useTranslations("admin");
  const locale = useLocale();
  const pathname = usePathname();
  const isRTL = locale === "ar";
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navItems = [
    {
      href: `/${locale}/admin`,
      label: t("dashboard"),
      icon: LayoutDashboard,
      exact: true,
    },
    {
      href: `/${locale}/admin/products`,
      label: t("products"),
      icon: Package,
    },
    {
      href: `/${locale}/admin/categories`,
      label: t("categories"),
      icon: FolderOpen,
    },
    {
      href: `/${locale}/admin/orders`,
      label: t("orders"),
      icon: ShoppingCart,
    },
    {
      href: `/${locale}/admin/coupons`,
      label: t("coupons"),
      icon: Tag,
    },
    {
      href: `/${locale}/admin/shipping`,
      label: t("shipping"),
      icon: Truck,
    },
    {
      href: `/${locale}/admin/settings/payment`,
      label: t("paymentSettings"),
      icon: CreditCard,
    },
    {
      href: `/${locale}/admin/settings/general`,
      label: t("siteSettings"),
      icon: Settings,
    },
  ];

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        {!isCollapsed && (
          <Link href={`/${locale}/admin`} className="flex items-center gap-2 bg-white rounded-lg p-1.5 shrink-0">
            <Image
              src="/logo.jpg"
              alt="YotiCare"
              width={180}
              height={60}
              className="h-10 w-auto object-contain"
            />
          </Link>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex p-1.5 rounded-lg hover:bg-white/10 transition-colors"
        >
          {isCollapsed ? (
            isRTL ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
          ) : (
            isRTL ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`admin-nav-item ${active ? "active" : ""}`}
              title={isCollapsed ? item.label : undefined}
              onClick={() => setIsMobileOpen(false)}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!isCollapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-white/10">
        <form action={`/${locale}/admin/login`} method="GET">
          <button
            type="submit"
            className="admin-nav-item w-full text-red-300 hover:text-red-200 hover:bg-red-500/10"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!isCollapsed && <span>{t("logout")}</span>}
          </button>
        </form>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Header Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-primary-dark text-white flex items-center justify-between px-4 h-16">
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2 rounded-lg hover:bg-white/10"
        >
          <Menu className="w-5 h-5" />
        </button>
        <Link href={`/${locale}/admin`} className="bg-white rounded-lg p-1">
          <Image
            src="/logo.jpg"
            alt="YotiCare"
            width={120}
            height={40}
            className="h-8 w-auto object-contain"
          />
        </Link>
        <div className="w-9" /> {/* Spacer for centering */}
      </div>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`admin-sidebar fixed top-0 ${isRTL ? "right-0" : "left-0"} h-full z-50 flex flex-col transition-all duration-300
          ${isCollapsed ? "w-[68px]" : "w-64"}
          ${isMobileOpen ? "translate-x-0" : isRTL ? "translate-x-full lg:translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <SidebarContent />
      </aside>
    </>
  );
}

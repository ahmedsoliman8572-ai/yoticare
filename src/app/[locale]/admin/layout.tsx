import AdminSidebar from "@/components/layout/AdminSidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar />
      {/* Main content area — offset by sidebar width */}
      <div className="lg:ms-64 min-h-screen">
        {/* Mobile top spacing */}
        <div className="lg:hidden h-14" />
        <main className="p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

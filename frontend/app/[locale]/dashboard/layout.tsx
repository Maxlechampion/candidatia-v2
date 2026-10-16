import { ProtectedRoute } from "@/components/Layout/ProtectedRoute";
import { Sidebar, SidebarMobile } from "@/components/Layout/Sidebar";
import { Header } from "@/components/Layout/Header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen flex bg-slate-50">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Header />
          <main className="flex-1 p-3 sm:p-4 md:p-6 overflow-y-auto">
            {children}
          </main>
        </div>
        <SidebarMobile />
      </div>
    </ProtectedRoute>
  );
}

import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import EnterpriseSidebar from "@/components/enterprise/EnterpriseSidebar";
import { TenantProvider } from "@/contexts/TenantContext";

export default function EnterpriseLayout() {
  const { isSuperAdmin, loading } = useAuth();

  if (loading) return null;
  if (!isSuperAdmin) return <Navigate to="/" replace />;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <EnterpriseSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-12 flex items-center border-b border-border px-2 shrink-0">
            <SidebarTrigger className="mr-2" />
            <span className="text-xs font-medium text-muted-foreground">Enterprise Console</span>
          </header>
          <main className="flex-1 overflow-auto">
            <TenantProvider>
              <Outlet />
            </TenantProvider>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

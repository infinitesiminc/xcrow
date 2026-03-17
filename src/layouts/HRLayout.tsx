import { Outlet, useNavigate, Navigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { HRSidebar } from "@/components/HRSidebar";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { WorkspaceProvider, useWorkspace } from "@/contexts/WorkspaceContext";
import { Badge } from "@/components/ui/badge";
import { Building2, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

function WorkspaceHeader() {
  const { workspace, isImpersonating } = useWorkspace();
  const navigate = useNavigate();

  return (
    <header className="h-10 flex items-center border-b border-border px-4 gap-3">
      <SidebarTrigger className="h-6 w-6" />
      {workspace && (
        <div className="flex items-center gap-2 ml-1">
          {isImpersonating && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs text-muted-foreground"
              onClick={() => navigate("/admin/workspaces")}
            >
              <ArrowLeft className="h-3 w-3 mr-1" />
              All Workspaces
            </Button>
          )}
          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">{workspace.name}</span>
          {isImpersonating && (
            <Badge variant="outline" className="text-[10px] border-primary/40 text-primary">
              Superadmin View
            </Badge>
          )}
        </div>
      )}
    </header>
  );
}

function WorkspaceGate() {
  const { workspaceId, loading, isSuperAdmin } = useWorkspace();

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!workspaceId && !isSuperAdmin) {
    return <Navigate to="/admin/onboarding" replace />;
  }

  return (
    <>
      <WorkspaceHeader />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </>
  );
}

export default function HRLayout() {
  return (
    <>
      <Navbar />
      <SidebarProvider>
        <div className="min-h-[calc(100vh-64px)] flex w-full">
          <HRSidebar />
          <div className="flex-1 flex flex-col">
            <WorkspaceProvider>
              <WorkspaceGate />
            </WorkspaceProvider>
          </div>
        </div>
      </SidebarProvider>
      <Footer />
    </>
  );
}

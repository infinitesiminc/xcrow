import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { SchoolSidebar } from "@/components/SchoolSidebar";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { GraduationCap } from "lucide-react";

export default function SchoolLayout() {
  return (
    <>
      <Navbar />
      <SidebarProvider>
        <div className="h-[calc(100vh-64px)] flex w-full overflow-hidden">
          <SchoolSidebar />
          <div className="flex-1 flex flex-col">
            <header className="h-10 flex items-center border-b border-border px-4 gap-3">
              <SidebarTrigger className="h-6 w-6" />
              <Badge variant="outline" className="text-[10px] border-primary/40 text-primary">
                <GraduationCap className="h-3 w-3 mr-1" />
                School Admin
              </Badge>
            </header>
            <main className="flex-1 overflow-auto">
              <Outlet />
            </main>
          </div>
        </div>
      </SidebarProvider>
      <Footer />
    </>
  );
}

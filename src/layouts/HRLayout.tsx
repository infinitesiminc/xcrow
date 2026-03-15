import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { HRSidebar } from "@/components/HRSidebar";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function HRLayout() {
  return (
    <>
      <Navbar />
      <SidebarProvider>
        <div className="min-h-[calc(100vh-64px)] flex w-full">
          <HRSidebar />
          <div className="flex-1 flex flex-col">
            <header className="h-10 flex items-center border-b border-border px-4">
              <SidebarTrigger className="h-6 w-6" />
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

import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Index from "./pages/Index.tsx";
import Analysis from "./pages/Analysis.tsx";
import Auth from "./pages/Auth.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Settings from "./pages/Settings.tsx";
import NotFound from "./pages/NotFound.tsx";
import Simulations from "./pages/Simulations.tsx";
import LearningPath from "./pages/LearningPath.tsx";
import CardStyleMockup from "./pages/CardStyleMockup.tsx";

// Admin (superadmin only)
import HRLayout from "./layouts/HRLayout.tsx";
import PipelinePage from "./pages/admin/PipelinePage.tsx";
import StatsPage from "./pages/admin/StatsPage.tsx";


// Public company page
const CompanyPage = lazy(() => import("./pages/CompanyPage.tsx"));

const queryClient = new QueryClient();

/** Gate admin routes to superadmins */
function AdminGate() {
  const { user, loading, isSuperAdmin } = useAuth();
  if (loading) return null;
  if (!user || !isSuperAdmin) return <Navigate to="/" replace />;
  return <HRLayout />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
            {/* Public B2C routes */}
            <Route path="/" element={<><Navbar /><Index /></>} />
            <Route path="/analysis" element={<><Navbar /><Analysis /><Footer /></>} />
            <Route path="/auth" element={<><Navbar /><Auth /></>} />
            <Route path="/dashboard" element={<><Navbar /><Dashboard /><Footer /></>} />
            <Route path="/settings" element={<><Navbar /><Settings /><Footer /></>} />
            <Route path="/practice" element={<><Navbar /><Simulations /><Footer /></>} />
            <Route path="/simulations" element={<><Navbar /><Simulations /><Footer /></>} />
            <Route path="/learning-path" element={<><Navbar /><LearningPath /><Footer /></>} />
            <Route path="/company/:slug" element={<><Navbar /><Suspense fallback={null}><CompanyPage /></Suspense><Footer /></>} />
            <Route path="/card-styles" element={<><Navbar /><CardStyleMockup /></>} />

            {/* Superadmin content pipeline */}
            <Route path="/admin" element={<AdminGate />}>
              <Route index element={<PipelinePage />} />
              <Route path="stats" element={<StatsPage />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;

import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// Lazy-load all page components
const Index = lazy(() => import("./pages/Index.tsx"));
const Analysis = lazy(() => import("./pages/Analysis.tsx"));
const Auth = lazy(() => import("./pages/Auth.tsx"));
const Settings = lazy(() => import("./pages/Settings.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const CardStyleMockup = lazy(() => import("./pages/CardStyleMockup.tsx"));
const CompanyPage = lazy(() => import("./pages/CompanyPage.tsx"));
const Journey = lazy(() => import("./pages/Journey.tsx"));
const Students = lazy(() => import("./pages/Students.tsx"));

// Admin (lazy)
const HRLayout = lazy(() => import("./layouts/HRLayout.tsx"));
const PipelinePage = lazy(() => import("./pages/admin/PipelinePage.tsx"));
const TaskAnalyticsPage = lazy(() => import("./pages/admin/TaskAnalyticsPage.tsx"));

const queryClient = new QueryClient();

/** Gate admin routes to superadmins */
function AdminGate() {
  const { user, loading, isSuperAdmin } = useAuth();
  if (loading) return null;
  if (!user || !isSuperAdmin) return <Navigate to="/" replace />;
  return <Suspense fallback={null}><HRLayout /></Suspense>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Suspense fallback={null}>
            <Routes>
              {/* Public B2C routes */}
              <Route path="/" element={<><Navbar /><Index /></>} />
              <Route path="/analysis" element={<><Navbar /><Analysis /><Footer /></>} />
              <Route path="/auth" element={<><Navbar /><Auth /></>} />
              <Route path="/settings" element={<><Navbar /><Settings /><Footer /></>} />
              <Route path="/company/:slug" element={<><Navbar /><CompanyPage /><Footer /></>} />
              <Route path="/card-styles" element={<><Navbar /><CardStyleMockup /></>} />
              <Route path="/journey" element={<Journey />} />
              <Route path="/students" element={<><Navbar /><Students /><Footer /></>} />

              {/* Redirects — old routes all go to feed */}
              <Route path="/practice" element={<Navigate to="/" replace />} />
              <Route path="/simulations" element={<Navigate to="/" replace />} />
              <Route path="/learning-path" element={<Navigate to="/" replace />} />

              {/* Superadmin content pipeline */}
              <Route path="/admin" element={<AdminGate />}>
                <Route index element={<PipelinePage />} />
                <Route path="analytics" element={<TaskAnalyticsPage />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;

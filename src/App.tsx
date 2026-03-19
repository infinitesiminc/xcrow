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
const Leaderboard = lazy(() => import("./pages/Leaderboard.tsx"));
const Pricing = lazy(() => import("./pages/Pricing.tsx"));

// Admin (lazy)
const HRLayout = lazy(() => import("./layouts/HRLayout.tsx"));
const PipelinePage = lazy(() => import("./pages/admin/PipelinePage.tsx"));
const TaskAnalyticsPage = lazy(() => import("./pages/admin/TaskAnalyticsPage.tsx"));
const CompaniesAdminPage = lazy(() => import("./pages/admin/CompaniesAdminPage.tsx"));
const SchoolsPage = lazy(() => import("./pages/admin/SchoolsPage.tsx"));

// School admin (lazy)
const SchoolLayout = lazy(() => import("./layouts/SchoolLayout.tsx"));
const SchoolDashboard = lazy(() => import("./pages/school/SchoolDashboard.tsx"));
const SchoolStudents = lazy(() => import("./pages/school/SchoolStudents.tsx"));
const SchoolInvite = lazy(() => import("./pages/school/SchoolInvite.tsx"));
const SchoolAnalytics = lazy(() => import("./pages/school/SchoolAnalytics.tsx"));

const queryClient = new QueryClient();

/** Gate admin routes to superadmins */
function AdminGate() {
  const { user, loading, isSuperAdmin } = useAuth();
  if (loading) return null;
  if (!user || !isSuperAdmin) return <Navigate to="/" replace />;
  return <Suspense fallback={null}><HRLayout /></Suspense>;
}

/** Gate school admin routes */
function SchoolAdminGate() {
  const { user, loading, isSchoolAdmin } = useAuth();
  if (loading) return null;
  if (!user || !isSchoolAdmin) return <Navigate to="/" replace />;
  return <Suspense fallback={null}><SchoolLayout /></Suspense>;
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
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/pricing" element={<><Navbar /><Pricing /><Footer /></>} />

              {/* Redirects — old routes all go to feed */}
              <Route path="/practice" element={<Navigate to="/" replace />} />
              <Route path="/simulations" element={<Navigate to="/" replace />} />
              <Route path="/learning-path" element={<Navigate to="/" replace />} />

              {/* School admin */}
              <Route path="/school" element={<SchoolAdminGate />}>
                <Route index element={<SchoolDashboard />} />
                <Route path="students" element={<SchoolStudents />} />
                <Route path="invite" element={<SchoolInvite />} />
                <Route path="analytics" element={<SchoolAnalytics />} />
              </Route>

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

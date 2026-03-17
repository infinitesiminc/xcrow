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

// Admin (superadmin only)
import HRLayout from "./layouts/HRLayout.tsx";
import ATSSync from "./pages/hr/ATSSync.tsx";
import SimulationBuilder from "./pages/products/SimulationBuilder.tsx";
import TeamProgress from "./pages/hr/TeamProgress.tsx";
import Members from "./pages/hr/Members.tsx";
import WorkspaceSettings from "./pages/hr/WorkspaceSettings.tsx";
import ActionCenter from "./pages/hr/ActionCenter.tsx";
import Workspaces from "./pages/hr/Workspaces.tsx";
import Onboarding from "./pages/hr/Onboarding.tsx";
import ScoreDistributions from "./pages/ScoreDistributions.tsx";
import Roadmap from "./pages/Roadmap.tsx";

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
            <Route path="/" element={<><Navbar /><Index /><Footer /></>} />
            <Route path="/analysis" element={<><Navbar /><Analysis /><Footer /></>} />
            <Route path="/auth" element={<><Navbar /><Auth /></>} />
            <Route path="/dashboard" element={<><Navbar /><Dashboard /><Footer /></>} />
            <Route path="/settings" element={<><Navbar /><Settings /><Footer /></>} />
            <Route path="/practice" element={<><Navbar /><Simulations /><Footer /></>} />
            <Route path="/simulations" element={<><Navbar /><Simulations /><Footer /></>} />
            <Route path="/learning-path" element={<><Navbar /><LearningPath /><Footer /></>} />
            <Route path="/company/:slug" element={<><Navbar /><Suspense fallback={null}><CompanyPage /></Suspense><Footer /></>} />

            {/* Superadmin dashboard */}
            <Route path="/admin" element={<AdminGate />}>
              <Route index element={<SimulationBuilder />} />
              <Route path="simulations" element={<SimulationBuilder />} />
              <Route path="score-distributions" element={<ScoreDistributions />} />
              <Route path="ats-sync" element={<ATSSync />} />
              <Route path="team-progress" element={<TeamProgress />} />
              <Route path="action-center" element={<ActionCenter />} />
              <Route path="members" element={<Members />} />
              <Route path="settings" element={<WorkspaceSettings />} />
              <Route path="roadmap" element={<Roadmap />} />
              <Route path="analyze" element={<Index />} />
              <Route path="workspaces" element={<Workspaces />} />
              <Route path="onboarding" element={<Onboarding />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;

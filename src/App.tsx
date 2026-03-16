import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import StickyTicker from "@/components/StickyTicker";
import Footer from "@/components/Footer";
import Index from "./pages/Index.tsx";
import Analysis from "./pages/Analysis.tsx";
import TeamAnalysis from "./pages/TeamAnalysis.tsx";
import Auth from "./pages/Auth.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Settings from "./pages/Settings.tsx";
import NotFound from "./pages/NotFound.tsx";

import Contact from "./pages/Contact.tsx";
import Pricing from "./pages/Pricing.tsx";
import ATSSync from "./pages/hr/ATSSync.tsx";
import SimulationBuilder from "./pages/products/SimulationBuilder.tsx";
import SimulationDesign from "./pages/SimulationDesign.tsx";
import Enterprise from "./pages/Enterprise.tsx";
import Roadmap from "./pages/Roadmap.tsx";
import Simulations from "./pages/Simulations.tsx";
import LearningPath from "./pages/LearningPath.tsx";
import ScoreDistributions from "./pages/ScoreDistributions.tsx";
import JoinWorkspace from "./pages/JoinWorkspace.tsx";
const CaseStudy = lazy(() => import("./pages/CaseStudy.tsx"));
import HRLayout from "./layouts/HRLayout.tsx";
import TeamProgress from "./pages/hr/TeamProgress.tsx";
import Members from "./pages/hr/Members.tsx";
import WorkspaceSettings from "./pages/hr/WorkspaceSettings.tsx";
import ActionCenter from "./pages/hr/ActionCenter.tsx";
import Workspaces from "./pages/hr/Workspaces.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
            <Route path="/" element={<><Navbar /><StickyTicker /><Enterprise /><Footer /></>} />
            <Route path="/analysis" element={<><Navbar /><Analysis /><Footer /></>} />
            <Route path="/team-analysis" element={<><Navbar /><TeamAnalysis /><Footer /></>} />
            <Route path="/auth" element={<><Navbar /><Auth /></>} />
            <Route path="/dashboard" element={<><Navbar /><Dashboard /><Footer /></>} />
            <Route path="/settings" element={<><Navbar /><Settings /><Footer /></>} />
            
            <Route path="/contact" element={<><Navbar /><StickyTicker /><Contact /><Footer /></>} />
            <Route path="/pricing" element={<><Navbar /><StickyTicker /><Pricing /><Footer /></>} />
            <Route path="/products/simulation-builder" element={<><Navbar /><SimulationBuilder /><Footer /></>} />
            <Route path="/why-simulation" element={<><Navbar /><StickyTicker /><SimulationDesign /><Footer /></>} />
            <Route path="/simulations" element={<><Navbar /><Simulations /><Footer /></>} />
            <Route path="/learning-path" element={<><Navbar /><LearningPath /><Footer /></>} />
            <Route path="/score-distributions" element={<><Navbar /><ScoreDistributions /><Footer /></>} />
            <Route path="/join" element={<JoinWorkspace />} />
            <Route path="/case-study/anthropic" element={<><Navbar /><StickyTicker /><Suspense fallback={null}><CaseStudy /></Suspense><Footer /></>} />

            {/* HR Dashboard with sidebar */}
            <Route path="/hr" element={<HRLayout />}>
              <Route index element={<SimulationBuilder />} />
              <Route path="simulations" element={<SimulationBuilder />} />
              <Route path="score-distributions" element={<ScoreDistributions />} />
              <Route path="ats-sync" element={<ATSSync />} />
              <Route path="team-progress" element={<TeamProgress />} />
              <Route path="action-center" element={<ActionCenter />} />
              <Route path="members" element={<Members />} />
              <Route path="settings" element={<WorkspaceSettings />} />
              {/* Superadmin-only routes */}
              <Route path="roadmap" element={<Roadmap />} />
              <Route path="analyze" element={<Index />} />
            </Route>

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;

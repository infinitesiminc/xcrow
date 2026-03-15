import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Index from "./pages/Index.tsx";
import Analysis from "./pages/Analysis.tsx";
import TeamAnalysis from "./pages/TeamAnalysis.tsx";
import Auth from "./pages/Auth.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Settings from "./pages/Settings.tsx";
import NotFound from "./pages/NotFound.tsx";
import ToolsMarketplace from "./pages/ToolsMarketplace.tsx";
import ContactOrg from "./pages/ContactOrg.tsx";
import Contact from "./pages/Contact.tsx";
import Pricing from "./pages/Pricing.tsx";
import CompanyDashboard from "./pages/CompanyDashboard.tsx";
import ProjectStaffing from "./pages/ProjectStaffing.tsx";
import SimulationBuilder from "./pages/products/SimulationBuilder.tsx";
import Enterprise from "./pages/Enterprise.tsx";
import Roadmap from "./pages/Roadmap.tsx";
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<><Navbar /><Enterprise /><Footer /></>} />
            <Route path="/analyze" element={<><Navbar /><Index /><Footer /></>} />
            <Route path="/analysis" element={<><Navbar /><Analysis /><Footer /></>} />
            <Route path="/team-analysis" element={<><Navbar /><TeamAnalysis /><Footer /></>} />
            <Route path="/auth" element={<><Navbar /><Auth /></>} />
            <Route path="/dashboard" element={<><Navbar /><Dashboard /><Footer /></>} />
            <Route path="/settings" element={<><Navbar /><Settings /><Footer /></>} />
            
            <Route path="/tools" element={<><Navbar /><ToolsMarketplace /><Footer /></>} />
            <Route path="/contact-org" element={<><Navbar /><ContactOrg /><Footer /></>} />
            <Route path="/contact" element={<><Navbar /><Contact /><Footer /></>} />
            <Route path="/pricing" element={<><Navbar /><Pricing /><Footer /></>} />
            <Route path="/company-dashboard" element={<><Navbar /><CompanyDashboard /><Footer /></>} />
            <Route path="/project-staffing" element={<><Navbar /><ProjectStaffing /><Footer /></>} />
            <Route path="/products/simulation-builder" element={<><Navbar /><SimulationBuilder /><Footer /></>} />
            <Route path="/products/upskilling" element={<><Navbar /><SimulationBuilder /><Footer /></>} />
            <Route path="/products/candidate-assessment" element={<><Navbar /><SimulationBuilder /><Footer /></>} />
            <Route path="/products/workforce-planning" element={<><Navbar /><SimulationBuilder /><Footer /></>} />
            <Route path="/products/career-transition" element={<><Navbar /><SimulationBuilder /><Footer /></>} />
            <Route path="/products/ld-content-engine" element={<><Navbar /><SimulationBuilder /><Footer /></>} />
            <Route path="/how-it-works" element={<><Navbar /><SimulationBuilder /><Footer /></>} />
            <Route path="/roadmap" element={<><Navbar /><Roadmap /><Footer /></>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

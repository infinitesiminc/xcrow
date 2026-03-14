import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Index from "./pages/Index.tsx";
import Analysis from "./pages/Analysis.tsx";
import TeamAnalysis from "./pages/TeamAnalysis.tsx";
import Auth from "./pages/Auth.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Settings from "./pages/Settings.tsx";
import NotFound from "./pages/NotFound.tsx";
import Heatmap from "./pages/Heatmap.tsx";
import ForIndividuals from "./pages/ForIndividuals.tsx";
import ForOrganizations from "./pages/ForOrganizations.tsx";
import ToolsMarketplace from "./pages/ToolsMarketplace.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/analysis" element={<><Navbar /><Analysis /></>} />
            <Route path="/team-analysis" element={<><Navbar /><TeamAnalysis /></>} />
            <Route path="/auth" element={<><Navbar /><Auth /></>} />
            <Route path="/dashboard" element={<><Navbar /><Dashboard /></>} />
            <Route path="/settings" element={<><Navbar /><Settings /></>} />
            <Route path="/heatmap" element={<><Navbar /><Heatmap /></>} />
            <Route path="/for-individuals" element={<><Navbar /><ForIndividuals /></>} />
            <Route path="/for-organizations" element={<><Navbar /><ForOrganizations /></>} />
            <Route path="/tools" element={<><Navbar /><ToolsMarketplace /></>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

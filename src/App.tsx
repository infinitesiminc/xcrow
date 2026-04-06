import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ErrorBoundary from "@/components/ErrorBoundary";

const SmartHome = lazy(() => import("./pages/SmartHome"));
const SmartHomeRoute = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/leadhunter" replace />;
  return <><Navbar /><SmartHome /></>;
};
const Auth = lazy(() => import("./pages/Auth.tsx"));
const Settings = lazy(() => import("./pages/Settings.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));

const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy.tsx"));
const Terms = lazy(() => import("./pages/Terms.tsx"));
const CookiePolicy = lazy(() => import("./pages/CookiePolicy.tsx"));

const Leadgen = lazy(() => import("./pages/Leadgen.tsx"));
const Unsubscribe = lazy(() => import("./pages/Unsubscribe.tsx"));
const CompetitorComparison = lazy(() => import("./pages/CompetitorComparison.tsx"));
const Pricing = lazy(() => import("./pages/Pricing.tsx"));
const HowItWorks = lazy(() => import("./pages/HowItWorks.tsx"));
const UseCasesIndex = lazy(() => import("./pages/UseCasesIndex.tsx"));
const UseCasePage = lazy(() => import("./pages/UseCasePage.tsx"));
const BlogIndex = lazy(() => import("./pages/BlogIndex.tsx"));
const BlogPostPage = lazy(() => import("./pages/BlogPostPage.tsx"));
const About = lazy(() => import("./pages/About.tsx"));
const Demo = lazy(() => import("./pages/Demo.tsx"));


const queryClient = new QueryClient();

function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading, openAuthModal } = useAuth();
  if (loading) return null;
  if (!user) {
    openAuthModal();
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

const App = () => (
  <HelmetProvider>
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <ErrorBoundary fallbackTitle="Something went wrong">
          <Suspense fallback={null}>
            <Routes>
              <Route path="/" element={<SmartHomeRoute />} />
              <Route path="/leadgen" element={<Navigate to="/leadhunter" replace />} />
              <Route path="/auth" element={<><Navbar /><Auth /></>} />
              <Route path="/settings" element={<AuthGate><Navbar /><Settings /><Footer /></AuthGate>} />
              
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/cookies" element={<CookiePolicy />} />
              <Route path="/contact" element={<Navigate to="/about" replace />} />
              <Route path="/unsubscribe" element={<Unsubscribe />} />
              <Route path="/vs/:slug" element={<CompetitorComparison />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/how-it-works" element={<HowItWorks />} />
              <Route path="/use-cases" element={<UseCasesIndex />} />
              <Route path="/use-cases/:slug" element={<UseCasePage />} />
              <Route path="/blog" element={<BlogIndex />} />
              <Route path="/blog/:slug" element={<BlogPostPage />} />
              <Route path="/about" element={<About />} />
              <Route path="/demo" element={<Demo />} />
              <Route path="/leadhunter" element={<Leadgen />} />
              <Route path="/leadhunter/*" element={<Navigate to="/leadhunter" replace />} />
              <Route path="/academy" element={<Navigate to="/leadhunter" replace />} />
              <Route path="/academy/*" element={<Navigate to="/leadhunter" replace />} />

              {/* Redirects — old routes */}
              <Route path="/upskill" element={<Navigate to="/" replace />} />
              <Route path="/agentlauncher" element={<Navigate to="/" replace />} />
              <Route path="/founder" element={<Navigate to="/" replace />} />
              <Route path="/disrupt" element={<Navigate to="/" replace />} />
              <Route path="/map" element={<Navigate to="/" replace />} />
              <Route path="/journey" element={<Navigate to="/" replace />} />
              <Route path="/skills" element={<Navigate to="/" replace />} />
              <Route path="/schools" element={<Navigate to="/" replace />} />
              <Route path="/competition" element={<Navigate to="/" replace />} />
              <Route path="/investors" element={<Navigate to="/" replace />} />
              <Route path="/leaderboard" element={<Navigate to="/" replace />} />
              <Route path="/students" element={<Navigate to="/" replace />} />
              <Route path="/practice" element={<Navigate to="/" replace />} />
              <Route path="/simulations" element={<Navigate to="/" replace />} />
              <Route path="/learning-path" element={<Navigate to="/" replace />} />
              <Route path="/play" element={<Navigate to="/" replace />} />
              <Route path="/progression" element={<Navigate to="/" replace />} />
              <Route path="/professionals" element={<Navigate to="/" replace />} />
              <Route path="/enterprise" element={<Navigate to="/" replace />} />
              <Route path="/tools" element={<Navigate to="/" replace />} />
              <Route path="/org-stack" element={<Navigate to="/" replace />} />
              <Route path="/sponsor" element={<Navigate to="/" replace />} />
              <Route path="/join" element={<Navigate to="/" replace />} />
              <Route path="/analysis" element={<Navigate to="/" replace />} />
              <Route path="/role/:jobTitle" element={<Navigate to="/" replace />} />
              <Route path="/company/:slug" element={<Navigate to="/" replace />} />
              <Route path="/u/:username" element={<Navigate to="/" replace />} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          </ErrorBoundary>
        </TooltipProvider>
        
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
  </HelmetProvider>
);

export default App;

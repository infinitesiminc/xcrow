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

const Index = lazy(() => import("./pages/Index.tsx"));
const Auth = lazy(() => import("./pages/Auth.tsx"));
const Settings = lazy(() => import("./pages/Settings.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const Blog = lazy(() => import("./pages/Blog.tsx"));

const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy.tsx"));
const Terms = lazy(() => import("./pages/Terms.tsx"));
const CookiePolicy = lazy(() => import("./pages/CookiePolicy.tsx"));
const Contact = lazy(() => import("./pages/Contact.tsx"));
const Leadgen = lazy(() => import("./pages/Leadgen.tsx"));
const Unsubscribe = lazy(() => import("./pages/Unsubscribe.tsx"));
const UseCasesIndex = lazy(() => import("./pages/UseCasesIndex.tsx"));
const UseCasePage = lazy(() => import("./pages/UseCasePage.tsx"));
const Academy = lazy(() => import("./pages/Academy.tsx"));


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
              <Route path="/" element={<><Leadgen /></>} />
              <Route path="/leadgen" element={<Navigate to="/" replace />} />
              <Route path="/auth" element={<><Navbar /><Auth /></>} />
              <Route path="/settings" element={<AuthGate><Navbar /><Settings /><Footer /></AuthGate>} />
              <Route path="/blog" element={<Blog />} />
              
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/cookies" element={<CookiePolicy />} />
              <Route path="/contact" element={<><Navbar /><Contact /><Footer /></>} />
              <Route path="/unsubscribe" element={<Unsubscribe />} />
              <Route path="/use-cases" element={<><UseCasesIndex /></>} />
              <Route path="/use-cases/:slug" element={<><UseCasePage /></>} />
              <Route path="/academy" element={<AuthGate><Academy /></AuthGate>} />
              <Route path="/academy/*" element={<Navigate to="/academy" replace />} />

              {/* Redirects — old routes */}
              <Route path="/upskill" element={<Navigate to="/" replace />} />
              <Route path="/agentlauncher" element={<Navigate to="/" replace />} />
              <Route path="/founder" element={<Navigate to="/" replace />} />
              <Route path="/disrupt" element={<Navigate to="/" replace />} />
              <Route path="/map" element={<Navigate to="/" replace />} />
              <Route path="/journey" element={<Navigate to="/" replace />} />
              <Route path="/skills" element={<Navigate to="/" replace />} />
              <Route path="/pricing" element={<Navigate to="/" replace />} />
              <Route path="/schools" element={<Navigate to="/" replace />} />
              <Route path="/about" element={<Navigate to="/" replace />} />
              <Route path="/how-it-works" element={<Navigate to="/" replace />} />
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

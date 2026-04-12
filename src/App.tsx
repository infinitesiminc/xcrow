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
  if (user) return <Navigate to="/leadgen" replace />;
  return <><Navbar /><SmartHome /></>;
};
const Auth = lazy(() => import("./pages/Auth.tsx"));
const Settings = lazy(() => import("./pages/Settings.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));

const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy.tsx"));
const Terms = lazy(() => import("./pages/Terms.tsx"));
const CookiePolicy = lazy(() => import("./pages/CookiePolicy.tsx"));

const LeadGen = lazy(() => import("./pages/LeadGen.tsx"));
const Unsubscribe = lazy(() => import("./pages/Unsubscribe.tsx"));


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
              <Route path="/leadhunter" element={<Navigate to="/leadgen" replace />} />
              <Route path="/auth" element={<><Navbar /><Auth /></>} />
              <Route path="/settings" element={<AuthGate><Navbar /><Settings /><Footer /></AuthGate>} />
              
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/cookies" element={<CookiePolicy />} />
              <Route path="/unsubscribe" element={<Unsubscribe />} />
              <Route path="/texas" element={<Navigate to="/" replace />} />
              <Route path="/leadgen" element={<AuthGate><LeadGen /></AuthGate>} />
              <Route path="/leadgen/*" element={<Navigate to="/leadgen" replace />} />
              {/* Legacy redirects */}
              <Route path="/contact" element={<Navigate to="/" replace />} />
              <Route path="/about" element={<Navigate to="/" replace />} />
              <Route path="/pricing" element={<Navigate to="/" replace />} />
              <Route path="/demo" element={<Navigate to="/" replace />} />
              <Route path="/blog" element={<Navigate to="/" replace />} />
              <Route path="/blog/*" element={<Navigate to="/" replace />} />
              <Route path="/use-cases" element={<Navigate to="/" replace />} />
              <Route path="/use-cases/*" element={<Navigate to="/" replace />} />
              <Route path="/vs/*" element={<Navigate to="/" replace />} />
              <Route path="/how-it-works" element={<Navigate to="/" replace />} />
              <Route path="/admin" element={<Navigate to="/leadgen" replace />} />
              <Route path="/admin/*" element={<Navigate to="/leadgen" replace />} />
              <Route path="/enterprise/*" element={<Navigate to="/leadgen" replace />} />
              <Route path="/flashparkingmap" element={<Navigate to="/leadgen" replace />} />
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

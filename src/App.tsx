import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ChatProvider } from "@/contexts/ChatContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ErrorBoundary from "@/components/ErrorBoundary";


// Lazy-load all page components
const Index = lazy(() => import("./pages/Index.tsx"));
const Analysis = lazy(() => import("./pages/Analysis.tsx"));
const RoleDeepDive = lazy(() => import("./pages/RoleDeepDive.tsx"));
const Auth = lazy(() => import("./pages/Auth.tsx"));
const Settings = lazy(() => import("./pages/Settings.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));

const CompanyPage = lazy(() => import("./pages/CompanyPage.tsx"));

const Students = lazy(() => import("./pages/Students.tsx"));
const Leaderboard = lazy(() => import("./pages/Leaderboard.tsx"));
const Pricing = lazy(() => import("./pages/Pricing.tsx"));
const Schools = lazy(() => import("./pages/Schools.tsx"));
const About = lazy(() => import("./pages/About.tsx"));
const Blog = lazy(() => import("./pages/Blog.tsx"));
const WhyTheseSkillsMatter = lazy(() => import("./pages/blog/WhyTheseSkillsMatter.tsx"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy.tsx"));
const Terms = lazy(() => import("./pages/Terms.tsx"));
const CookiePolicy = lazy(() => import("./pages/CookiePolicy.tsx"));
const Contact = lazy(() => import("./pages/Contact.tsx"));

const JoinWorkspace = lazy(() => import("./pages/JoinWorkspace.tsx"));
const PublicProfile = lazy(() => import("./pages/PublicProfile.tsx"));
const MapPage = lazy(() => import("./pages/MapPage.tsx"));
const HowItWorks = lazy(() => import("./pages/HowItWorks.tsx"));
const SkillsCodex = lazy(() => import("./pages/Skills.tsx"));
const Competition = lazy(() => import("./pages/Competition.tsx"));
const Investors = lazy(() => import("./pages/Investors.tsx"));
const SponsorDashboard = lazy(() => import("./pages/SponsorDashboard.tsx"));
const ToolAtlas = lazy(() => import("./pages/ToolAtlas.tsx"));


// Admin (lazy)
const HRLayout = lazy(() => import("./layouts/HRLayout.tsx"));
const PipelinePage = lazy(() => import("./pages/admin/PipelinePage.tsx"));
const UsersPage = lazy(() => import("./pages/admin/UsersPage.tsx"));
const ProUpgradesPage = lazy(() => import("./pages/admin/ProUpgradesPage.tsx"));
const SchoolsPage = lazy(() => import("./pages/admin/SchoolsPage.tsx"));
const SchoolDetailPage = lazy(() => import("./pages/admin/SchoolDetailPage.tsx"));

// School admin (lazy)
const SchoolLayout = lazy(() => import("./layouts/SchoolLayout.tsx"));
const SchoolDashboard = lazy(() => import("./pages/school/SchoolDashboard.tsx"));
const SchoolStudents = lazy(() => import("./pages/school/SchoolStudents.tsx"));
const SchoolInvite = lazy(() => import("./pages/school/SchoolInvite.tsx"));
const SchoolAnalytics = lazy(() => import("./pages/school/SchoolAnalytics.tsx"));

const queryClient = new QueryClient();


/** Route / to the right dashboard per tier */
function HomeDashboard() {
  const { user, loading, profile, isSuperAdmin, isSchoolAdmin } = useAuth();
  if (loading) return null;
  if (!user) return <Suspense fallback={null}><Navbar /><Index /></Suspense>;
  // Show onboarding if not completed
  if (!profile || !profile.onboardingCompleted) {
    return <Suspense fallback={null}><Navbar /><Index /></Suspense>;
  }
  if (isSuperAdmin) return <Navigate to="/admin" replace />;
  if (isSchoolAdmin) return <Navigate to="/school" replace />;
  return <Navigate to="/map" replace />;
}

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

/** Gate authenticated-only routes */
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
        <ChatProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <ErrorBoundary fallbackTitle="The realm encountered an error">
          <Suspense fallback={null}>
            <Routes>
              {/* Public B2C routes */}
              <Route path="/" element={<HomeDashboard />} />
              <Route path="/map" element={<><Navbar /><MapPage /></>} />
              <Route path="/role/:jobTitle" element={<><Navbar /><RoleDeepDive /></>} />
              <Route path="/analysis" element={<><Navbar /><Analysis /><Footer /></>} />
              <Route path="/auth" element={<><Navbar /><Auth /></>} />
              <Route path="/settings" element={<AuthGate><Navbar /><Settings /><Footer /></AuthGate>} />
              <Route path="/company/:slug" element={<><Navbar /><CompanyPage /><Footer /></>} />
              <Route path="/leaderboard" element={<AuthGate><Navbar /><Leaderboard /></AuthGate>} />
              <Route path="/card-styles" element={<Navigate to="/" replace />} />
              <Route path="/l2-formats" element={<Navigate to="/" replace />} />
              <Route path="/journey" element={<Navigate to="/map" replace />} />
              <Route path="/students" element={<Students />} />
              
              <Route path="/pricing" element={<><Navbar /><Pricing /><Footer /></>} />
              <Route path="/schools" element={<Schools />} />
              <Route path="/about" element={<About />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/why-183-skills" element={<WhyTheseSkillsMatter />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/cookies" element={<CookiePolicy />} />
              <Route path="/contact" element={<><Navbar /><Contact /><Footer /></>} />
              
              <Route path="/professionals" element={<Navigate to="/" replace />} />
              <Route path="/enterprise" element={<Navigate to="/" replace />} />
              <Route path="/simulation-design" element={<Navigate to="/" replace />} />
              <Route path="/join" element={<JoinWorkspace />} />
              <Route path="/score-distributions" element={<Navigate to="/" replace />} />
              <Route path="/u/:username" element={<PublicProfile />} />
              <Route path="/progression" element={<Navigate to="/how-it-works" replace />} />
              <Route path="/play" element={<Navigate to="/" replace />} />
              <Route path="/how-it-works" element={<HowItWorks />} />
              <Route path="/skills" element={<SkillsCodex />} />
              <Route path="/competition" element={<><Navbar /><Competition /><Footer /></>} />
              <Route path="/investors" element={<Investors />} />
              <Route path="/sponsor" element={<AuthGate><Navbar /><SponsorDashboard /><Footer /></AuthGate>} />
              <Route path="/tools" element={<Navigate to="/" replace />} />
              <Route path="/org-stack" element={<Navigate to="/" replace />} />
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

              {/* Superadmin */}
              <Route path="/admin" element={<AdminGate />}>
                <Route index element={<PipelinePage />} />
                <Route path="users" element={<UsersPage />} />
                <Route path="upgrades" element={<ProUpgradesPage />} />
                <Route path="schools" element={<SchoolsPage />} />
                <Route path="schools/:schoolId" element={<SchoolDetailPage />} />
                {/* Legacy redirects */}
                <Route path="analytics" element={<Navigate to="/admin" replace />} />
                <Route path="pricing-usage" element={<Navigate to="/admin/upgrades" replace />} />
                <Route path="schools/data-ops" element={<Navigate to="/admin/schools" replace />} />
                <Route path="schools/skills-gap" element={<Navigate to="/admin/schools" replace />} />
                <Route path="schools/skill-matrix" element={<Navigate to="/admin/schools" replace />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          </ErrorBoundary>
          
        </TooltipProvider>
        </ChatProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
  </HelmetProvider>
);

export default App;

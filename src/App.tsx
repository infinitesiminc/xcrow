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
const RoleDeepDive = lazy(() => import("./pages/RoleDeepDive.tsx"));
const Auth = lazy(() => import("./pages/Auth.tsx"));
const Settings = lazy(() => import("./pages/Settings.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const CardStyleMockup = lazy(() => import("./pages/CardStyleMockup.tsx"));
const CompanyPage = lazy(() => import("./pages/CompanyPage.tsx"));
const Journey = lazy(() => import("./pages/Journey.tsx"));
const Students = lazy(() => import("./pages/Students.tsx"));
const Leaderboard = lazy(() => import("./pages/Leaderboard.tsx"));
const Pricing = lazy(() => import("./pages/Pricing.tsx"));
const Schools = lazy(() => import("./pages/Schools.tsx"));
const About = lazy(() => import("./pages/About.tsx"));
const Blog = lazy(() => import("./pages/Blog.tsx"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy.tsx"));
const Terms = lazy(() => import("./pages/Terms.tsx"));
const CookiePolicy = lazy(() => import("./pages/CookiePolicy.tsx"));
const Contact = lazy(() => import("./pages/Contact.tsx"));
const Enterprise = lazy(() => import("./pages/Enterprise.tsx"));
const Investors = lazy(() => import("./pages/Investors.tsx"));
const Roadmap = lazy(() => import("./pages/Roadmap.tsx"));
const CaseStudy = lazy(() => import("./pages/CaseStudy.tsx"));
const SimulationDesign = lazy(() => import("./pages/SimulationDesign.tsx"));
const JoinWorkspace = lazy(() => import("./pages/JoinWorkspace.tsx"));
const ScoreDistributions = lazy(() => import("./pages/ScoreDistributions.tsx"));
const PublicProfile = lazy(() => import("./pages/PublicProfile.tsx"));

// Admin (lazy)
const HRLayout = lazy(() => import("./layouts/HRLayout.tsx"));
const PipelinePage = lazy(() => import("./pages/admin/PipelinePage.tsx"));
const TaskAnalyticsPage = lazy(() => import("./pages/admin/TaskAnalyticsPage.tsx"));
const SchoolsPage = lazy(() => import("./pages/admin/SchoolsPage.tsx"));
const SchoolDataOpsPage = lazy(() => import("./pages/admin/SchoolDataOpsPage.tsx"));
const SchoolSkillsGapPage = lazy(() => import("./pages/admin/SchoolSkillsGapPage.tsx"));
const SchoolDetailPage = lazy(() => import("./pages/admin/SchoolDetailPage.tsx"));

const SkillMatrixPage = lazy(() => import("./pages/admin/SkillMatrixPage.tsx"));
const PricingUsagePage = lazy(() => import("./pages/admin/PricingUsagePage.tsx"));

// School admin (lazy)
const SchoolLayout = lazy(() => import("./layouts/SchoolLayout.tsx"));
const SchoolDashboard = lazy(() => import("./pages/school/SchoolDashboard.tsx"));
const SchoolStudents = lazy(() => import("./pages/school/SchoolStudents.tsx"));
const SchoolInvite = lazy(() => import("./pages/school/SchoolInvite.tsx"));
const SchoolAnalytics = lazy(() => import("./pages/school/SchoolAnalytics.tsx"));

const queryClient = new QueryClient();

/** Redirect /journey to / for signed-in users */
function JourneyGate() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return <Suspense fallback={null}><Journey /></Suspense>;
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
              <Route path="/role/:jobTitle" element={<><Navbar /><Index /><RoleDeepDive /></>} />
              <Route path="/analysis" element={<><Navbar /><Analysis /><Footer /></>} />
              <Route path="/auth" element={<><Navbar /><Auth /></>} />
              <Route path="/settings" element={<><Navbar /><Settings /><Footer /></>} />
              <Route path="/company/:slug" element={<><Navbar /><CompanyPage /><Footer /></>} />
              <Route path="/card-styles" element={<><Navbar /><CardStyleMockup /></>} />
              <Route path="/journey" element={<JourneyGate />} />
              <Route path="/students" element={<Students />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/pricing" element={<><Navbar /><Pricing /><Footer /></>} />
              <Route path="/schools" element={<Schools />} />
              <Route path="/about" element={<About />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/cookies" element={<CookiePolicy />} />
              <Route path="/contact" element={<><Navbar /><Contact /><Footer /></>} />
              <Route path="/enterprise" element={<Enterprise />} />
              <Route path="/investors" element={<Investors />} />
              <Route path="/roadmap" element={<Roadmap />} />
              <Route path="/case-study" element={<CaseStudy />} />
              <Route path="/simulation-design" element={<SimulationDesign />} />
              <Route path="/join" element={<JoinWorkspace />} />
              <Route path="/score-distributions" element={<><Navbar /><ScoreDistributions /><Footer /></>} />
              <Route path="/u/:username" element={<PublicProfile />} />
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
                
                <Route path="skill-matrix" element={<SkillMatrixPage />} />
                <Route path="pricing-usage" element={<PricingUsagePage />} />
                <Route path="schools" element={<SchoolsPage />} />
                <Route path="schools/data-ops" element={<SchoolDataOpsPage />} />
                <Route path="schools/skills-gap" element={<SchoolSkillsGapPage />} />
                <Route path="schools/:schoolId" element={<SchoolDetailPage />} />
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

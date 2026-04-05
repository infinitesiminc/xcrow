/**
 * SmartHome — Shows landing page for logged-out users,
 * redirects logged-in users straight to the workspace.
 */
import { lazy, Suspense } from "react";
import { useAuth } from "@/contexts/AuthContext";

const Index = lazy(() => import("./Index"));
const Leadgen = lazy(() => import("./Leadgen"));

export default function SmartHome() {
  const { user, loading } = useAuth();

  if (loading) return null;

  return (
    <Suspense fallback={null}>
      {user ? <Leadgen /> : <Index />}
    </Suspense>
  );
}

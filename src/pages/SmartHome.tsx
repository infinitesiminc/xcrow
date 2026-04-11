/**
 * SmartHome — Renders the landing page for all users.
 * URL input navigates to /leadgen for analysis.
 */
import { lazy, Suspense } from "react";

const Index = lazy(() => import("./Index"));

export default function SmartHome() {
  return (
    <Suspense fallback={null}>
      <Index />
    </Suspense>
  );
}

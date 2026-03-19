import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import JourneyDashboard from "@/components/settings/JourneyDashboard";
import type { PracticedRoleData, SavedRoleData } from "@/components/settings/JourneyDashboard";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function Journey() {
  const { user, loading: authLoading, openAuthModal } = useAuth();
  const navigate = useNavigate();

  const [savedRoles, setSavedRoles] = useState<SavedRoleData[]>([]);
  const [practicedRoles, setPracticedRoles] = useState<PracticedRoleData[]>([]);
  const [savedLoading, setSavedLoading] = useState(true);
  const [practicedLoading, setPracticedLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      openAuthModal();
      return;
    }
    setSavedLoading(true);
    setPracticedLoading(true);
    supabase
      .from("bookmarked_roles")
      .select("job_title, company, augmented_percent, automation_risk_percent, new_skills_percent")
      .eq("user_id", user.id)
      .order("bookmarked_at", { ascending: false })
      .then(({ data }) => {
        setSavedRoles((data as SavedRoleData[]) || []);
        setSavedLoading(false);
      });
    supabase
      .from("completed_simulations")
      .select("job_title, task_name, company, completed_at, correct_answers, total_questions, tool_awareness_score, human_value_add_score, adaptive_thinking_score, domain_judgment_score")
      .eq("user_id", user.id)
      .order("completed_at", { ascending: false })
      .then(({ data }) => {
        setPracticedRoles((data as PracticedRoleData[]) || []);
        setPracticedLoading(false);
      });
  }, [user, authLoading]);

  if (authLoading) return null;

  return (
    <>
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        <JourneyDashboard
          practicedRoles={practicedRoles}
          savedRoles={savedRoles}
          loading={savedLoading || practicedLoading}
        />
      </div>
      <Footer />
    </>
  );
}

import { useEffect, useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import OverviewTab from "@/components/hub/OverviewTab";
import SavedRolesTab from "@/components/hub/SavedRolesTab";
import PracticeTab from "@/components/hub/PracticeTab";
import ProgressTab from "@/components/hub/ProgressTab";

interface CompletedSim {
  id: string;
  task_name: string;
  job_title: string;
  company: string | null;
  rounds_completed: number;
  completed_at: string;
  correct_answers: number;
  total_questions: number;
}

interface AnalysisEntry {
  id: string;
  job_title: string;
  company: string | null;
  tasks_count: number;
  augmented_percent: number;
  automation_risk_percent: number;
  analyzed_at: string;
}

interface BookmarkedRole {
  id: string;
  job_title: string;
  company: string | null;
  augmented_percent: number;
  automation_risk_percent: number;
  new_skills_percent: number;
  bookmarked_at: string;
}

const TAB_VALUES = ["overview", "saved", "practice", "progress"] as const;
type TabValue = (typeof TAB_VALUES)[number];

const Dashboard = () => {
  const { user, loading: authLoading, profile } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = searchParams.get("tab") as TabValue | null;
  const activeTab = TAB_VALUES.includes(tabParam as TabValue) ? tabParam! : "overview";

  const setTab = (tab: TabValue) => {
    setSearchParams(tab === "overview" ? {} : { tab }, { replace: true });
  };

  const [completions, setCompletions] = useState<CompletedSim[]>([]);
  const [analyses, setAnalyses] = useState<AnalysisEntry[]>([]);
  const [bookmarks, setBookmarks] = useState<BookmarkedRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [simRes, analysisRes, bookmarkRes] = await Promise.all([
        supabase.from("completed_simulations").select("*").eq("user_id", user.id).order("completed_at", { ascending: false }),
        supabase.from("analysis_history").select("*").eq("user_id", user.id).order("analyzed_at", { ascending: false }),
        supabase.from("bookmarked_roles").select("*").eq("user_id", user.id).order("bookmarked_at", { ascending: false }),
      ]);
      setCompletions((simRes.data as CompletedSim[]) || []);
      setAnalyses((analysisRes.data as AnalysisEntry[]) || []);
      setBookmarks((bookmarkRes.data as BookmarkedRole[]) || []);
      setLoading(false);
    })();
  }, [user]);

  const uniqueTasks = useMemo(() => new Set(completions.map(c => c.task_name)).size, [completions]);

  const recentSession = useMemo(() => {
    if (completions.length === 0) return null;
    const c = completions[0];
    return {
      task_name: c.task_name,
      job_title: c.job_title,
      company: c.company,
      score: c.total_questions > 0 ? c.correct_answers / c.total_questions : 0,
      completed_at: c.completed_at,
    };
  }, [completions]);

  const savedRolesPreview = useMemo(() =>
    bookmarks.slice(0, 3).map(b => ({
      job_title: b.job_title,
      company: b.company,
      augmented_percent: b.augmented_percent ?? 0,
    })),
  [bookmarks]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-2xl font-serif font-bold text-foreground">
            {profile?.displayName ? `Welcome, ${profile.displayName}` : "My Hub"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {profile?.jobTitle ? (
              <>{profile.jobTitle}{profile.company ? ` at ${profile.company}` : ""}</>
            ) : (
              user.email
            )}
          </p>
        </motion.div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setTab(v as TabValue)}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
            <TabsTrigger value="saved" className="text-xs">Saved Roles</TabsTrigger>
            <TabsTrigger value="practice" className="text-xs">Practice</TabsTrigger>
            <TabsTrigger value="progress" className="text-xs">Progress</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 text-primary animate-spin" /></div>
            ) : (
              <OverviewTab
                userId={user.id}
                profile={profile ? { jobTitle: profile.jobTitle, company: profile.company, displayName: profile.displayName } : null}
                analysesCount={analyses.length}
                bookmarksCount={bookmarks.length}
                simsCompleted={completions.length}
                uniqueTasks={uniqueTasks}
                myRoleAnalysis={myRoleAnalysis ? { augmented_percent: myRoleAnalysis.augmented_percent, automation_risk_percent: myRoleAnalysis.automation_risk_percent } : null}
                hasCompletions={completions.length > 0}
              />
            )}
          </TabsContent>

          <TabsContent value="saved">
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 text-primary animate-spin" /></div>
            ) : (
              <SavedRolesTab bookmarks={bookmarks} />
            )}
          </TabsContent>

          <TabsContent value="practice">
            <PracticeTab userId={user.id} />
          </TabsContent>

          <TabsContent value="progress">
            <ProgressTab userId={user.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;

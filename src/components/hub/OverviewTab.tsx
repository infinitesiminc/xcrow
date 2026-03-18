import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BarChart3, Bookmark, Brain, GraduationCap, Play, Compass, ArrowRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface RecentSession {
  task_name: string;
  job_title: string;
  company: string | null;
  score: number;
  completed_at: string;
}

interface SavedRole {
  job_title: string;
  company: string | null;
  augmented_percent: number;
}

interface OverviewTabProps {
  userId: string;
  profile: { jobTitle?: string | null; company?: string | null; displayName?: string | null } | null;
  analysesCount: number;
  bookmarksCount: number;
  simsCompleted: number;
  uniqueTasks: number;
  recentSession: RecentSession | null;
  savedRoles: SavedRole[];
  hasCompletions: boolean;
}

export default function OverviewTab({
  userId, profile, analysesCount, bookmarksCount, simsCompleted, uniqueTasks,
  recentSession, savedRoles, hasCompletions,
}: OverviewTabProps) {
  const navigate = useNavigate();
  const hasProfile = !!(profile?.jobTitle);

  const stats = [
    { label: "Roles Explored", value: analysesCount, icon: BarChart3 },
    { label: "Saved Roles", value: bookmarksCount, icon: Bookmark },
    { label: "Sessions", value: simsCompleted, icon: Brain },
    { label: "Tasks Practiced", value: uniqueTasks, icon: GraduationCap },
  ];

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="text-xl font-bold text-foreground">{s.value}</div>
                    <div className="text-[11px] text-muted-foreground">{s.label}</div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Proactive action cards */}
      <div className="space-y-3">
        {/* Continue where you left off */}
        {recentSession && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Card
              className="border-primary/20 cursor-pointer hover:border-primary/40 transition-colors group"
              onClick={() => navigate(`/analysis?title=${encodeURIComponent(recentSession.job_title)}${recentSession.company ? `&company=${encodeURIComponent(recentSession.company)}` : ""}`)}
            >
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-2.5 rounded-xl bg-primary/10">
                  <Play className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-0.5">Continue</p>
                  <p className="text-sm font-semibold text-foreground truncate">{recentSession.task_name}</p>
                  <p className="text-[11px] text-muted-foreground">{recentSession.job_title}{recentSession.company ? ` · ${recentSession.company}` : ""} · {Math.round((recentSession.score) * 100)}%</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Saved roles quick-access */}
        {savedRoles.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Bookmark className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Saved Roles</p>
              </div>
              {savedRoles.length > 3 && (
                <Button variant="ghost" size="sm" className="text-xs h-7 text-muted-foreground" onClick={() => navigate("/dashboard?tab=saved")}>
                  View all
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {savedRoles.slice(0, 3).map((role, i) => (
                <Card
                  key={i}
                  className="cursor-pointer hover:border-primary/30 transition-colors group"
                  onClick={() => navigate(`/analysis?title=${encodeURIComponent(role.job_title)}${role.company ? `&company=${encodeURIComponent(role.company)}` : ""}`)}
                >
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{role.job_title}</p>
                      <p className="text-[11px] text-muted-foreground">{role.company || "General"} · {role.augmented_percent}% AI tools</p>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        )}

        {/* Explore something new */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card
            className="border-dashed border-muted-foreground/20 cursor-pointer hover:border-primary/30 transition-colors group bg-gradient-to-r from-primary/5 via-background to-accent/5"
            onClick={() => navigate("/")}
          >
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-accent/10">
                <Compass className="h-5 w-5 text-accent-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">Explore new roles</p>
                <p className="text-[11px] text-muted-foreground">Discover how AI is changing different jobs</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
            </CardContent>
          </Card>
        </motion.div>

        {/* Prompt to set up profile if missing */}
        {!hasProfile && !hasCompletions && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="border-warning/20 bg-warning/5">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-2.5 rounded-xl bg-warning/10">
                  <GraduationCap className="h-5 w-5 text-warning" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">Get started</p>
                  <p className="text-[11px] text-muted-foreground">Add your job title to get personalized insights</p>
                </div>
                <Button size="sm" variant="outline" className="text-xs h-7 border-warning/30" onClick={() => navigate("/dashboard?tab=progress")}>
                  Set up
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}

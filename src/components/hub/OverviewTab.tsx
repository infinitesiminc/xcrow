import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BarChart3, Bookmark, Brain, Bot, Target, Zap, GraduationCap, Sparkles,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import AdaptiveQueue from "@/components/AdaptiveQueue";

interface OverviewTabProps {
  userId: string;
  profile: { jobTitle?: string | null; company?: string | null; displayName?: string | null } | null;
  analysesCount: number;
  bookmarksCount: number;
  simsCompleted: number;
  uniqueTasks: number;
  myRoleAnalysis: { augmented_percent: number; automation_risk_percent: number } | null;
  hasCompletions: boolean;
}

export default function OverviewTab({
  userId, profile, analysesCount, bookmarksCount, simsCompleted, uniqueTasks,
  myRoleAnalysis, hasCompletions,
}: OverviewTabProps) {
  const navigate = useNavigate();
  const hasProfile = !!(profile?.jobTitle);

  const stats = [
    { label: "Roles Explored", value: analysesCount, icon: BarChart3 },
    { label: "Saved Roles", value: bookmarksCount, icon: Bookmark },
    { label: "Sessions", value: simsCompleted, icon: Brain },
    { label: "Tasks Practiced", value: uniqueTasks, icon: GraduationCap },
  ];

  // Generate action items
  const actionItems: { text: string; icon: typeof Bot; priority: "high" | "medium" | "low" }[] = [];
  if (hasProfile && !myRoleAnalysis) {
    actionItems.push({ text: `Discover AI tools for: ${profile!.jobTitle}`, icon: Zap, priority: "high" });
  }
  if (myRoleAnalysis && myRoleAnalysis.augmented_percent >= 50) {
    actionItems.push({ text: `${myRoleAnalysis.augmented_percent}% of your tasks have AI tools — start learning them`, icon: Bot, priority: "high" });
  }
  if (myRoleAnalysis && myRoleAnalysis.automation_risk_percent >= 40) {
    actionItems.push({ text: `Explore AI-powered career paths to boost your value`, icon: Target, priority: "medium" });
  }
  if (!hasCompletions) {
    actionItems.push({ text: "Complete your first practice session to build skills", icon: GraduationCap, priority: "medium" });
  }

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

      {/* Adaptive Queue */}
      <AdaptiveQueue userId={userId} />

      {/* Action Plan */}
      {actionItems.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Your Learning Plan</h2>
          </div>
          <Card className="border-primary/20 bg-gradient-to-r from-primary/5 via-background to-primary/5">
            <CardContent className="p-4 space-y-2">
              {actionItems.map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="flex items-center gap-3 py-1.5">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${
                      item.priority === "high" ? "bg-destructive" : item.priority === "medium" ? "bg-warning" : "bg-success"
                    }`} />
                    <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-sm text-foreground">{item.text}</span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

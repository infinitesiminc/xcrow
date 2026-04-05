import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ACADEMY_CURRICULUM } from "@/data/academy-curriculum";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame, Lock, Trophy, Zap, CheckCircle2, Circle } from "lucide-react";

interface UserProgress {
  totalXp: number;
  level: number;
  streak: number;
  completedModules: Set<string>;
  completedLessons: Set<string>;
  moduleScores: Record<string, number>;
}

const LEVEL_TITLES = ["Scout", "Scout", "Scout", "Scout", "Scout",
  "Analyst", "Analyst", "Analyst", "Analyst", "Analyst",
  "Strategist", "Strategist", "Strategist", "Strategist", "Strategist",
  "GTM Lead", "GTM Lead", "GTM Lead", "GTM Lead", "GTM Lead",
  "Revenue Architect"];

const PHASE_LABELS: Record<string, { label: string; color: string }> = {
  find: { label: "🔍 Find", color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" },
  outreach: { label: "✉️ Outreach", color: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300" },
  crm: { label: "📊 CRM", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300" },
};

function getLevelXpRange(level: number) {
  if (level <= 5) return { min: (level - 1) * 200, max: level * 200 };
  if (level <= 10) return { min: 1000 + (level - 6) * 400, max: 1000 + (level - 5) * 400 };
  if (level <= 15) return { min: 3000 + (level - 11) * 800, max: 3000 + (level - 10) * 800 };
  if (level <= 20) return { min: 7000 + (level - 16) * 1600, max: 7000 + (level - 15) * 1600 };
  return { min: 15000 + (level - 21) * 3000, max: 15000 + (level - 20) * 3000 };
}

export default function Academy() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [progress, setProgress] = useState<UserProgress>({
    totalXp: 0, level: 1, streak: 0, completedModules: new Set(), completedLessons: new Set(), moduleScores: {},
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadProgress();
  }, [user]);

  async function loadProgress() {
    if (!user) return;
    const [xpRes, streakRes, progressRes] = await Promise.all([
      supabase.rpc("get_user_xp", { _user_id: user.id }),
      supabase.from("user_streaks").select("current_streak").eq("user_id", user.id).maybeSingle(),
      supabase.from("user_lesson_progress").select("lesson_id, module_id, status, score").eq("user_id", user.id),
    ]);

    const totalXp = (xpRes.data as number) || 0;
    const streak = streakRes.data?.current_streak || 0;
    const completedLessons = new Set<string>();
    const moduleScores: Record<string, number[]> = {};

    (progressRes.data || []).forEach((p: any) => {
      if (p.status === "completed") {
        completedLessons.add(p.lesson_id);
        if (!moduleScores[p.module_id]) moduleScores[p.module_id] = [];
        if (p.score != null) moduleScores[p.module_id].push(p.score);
      }
    });

    const completedModules = new Set<string>();
    const avgScores: Record<string, number> = {};
    for (const [modId, scores] of Object.entries(moduleScores)) {
      const mod = ACADEMY_CURRICULUM.find(m => m.id === modId);
      if (mod && scores.length === mod.lessons.length) {
        const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
        avgScores[modId] = avg;
        if (avg >= (mod.passThreshold || 70)) completedModules.add(modId);
      }
    }

    const level = totalXp < 1000 ? Math.max(1, Math.floor(totalXp / 200) + 1) :
      totalXp < 3000 ? 6 + Math.floor((totalXp - 1000) / 400) :
      totalXp < 7000 ? 11 + Math.floor((totalXp - 3000) / 800) :
      totalXp < 15000 ? 16 + Math.floor((totalXp - 7000) / 1600) :
      21 + Math.floor((totalXp - 15000) / 3000);

    setProgress({ totalXp, level, streak, completedModules, completedLessons, moduleScores: avgScores });
    setLoading(false);
  }

  function isModuleUnlocked(moduleId: string) {
    const mod = ACADEMY_CURRICULUM.find(m => m.id === moduleId);
    if (!mod?.prerequisite) return true;
    return progress.completedModules.has(mod.prerequisite);
  }

  function getModuleLessonProgress(moduleId: string) {
    const mod = ACADEMY_CURRICULUM.find(m => m.id === moduleId);
    if (!mod) return { done: 0, total: 0 };
    // We don't have lesson IDs from the config so we count from DB
    const total = mod.lessons.length;
    // This is approximate — in a full build we'd match by lesson_id
    const done = progress.moduleScores[moduleId] ? mod.lessons.length : 0;
    return { done, total };
  }

  const xpRange = getLevelXpRange(progress.level);
  const xpInLevel = progress.totalXp - xpRange.min;
  const xpForLevel = xpRange.max - xpRange.min;
  const xpPercent = Math.min(100, Math.round((xpInLevel / xpForLevel) * 100));

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading Academy...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">GTM Academy</h1>
              <p className="text-sm text-muted-foreground mt-1">Master the art of AI-powered Go-To-Market</p>
            </div>
            <button onClick={() => navigate("/")} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              ← Back to Lead Hunter
            </button>
          </div>

          {/* Stats bar */}
          <div className="flex items-center gap-6 flex-wrap">
            {/* Level + XP */}
            <div className="flex items-center gap-3 min-w-[200px]">
              <div className="flex items-center gap-1.5 bg-primary/10 rounded-full px-3 py-1">
                <Trophy className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-primary">Lv.{progress.level}</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>{LEVEL_TITLES[Math.min(progress.level - 1, LEVEL_TITLES.length - 1)]}</span>
                  <span>{progress.totalXp} XP</span>
                </div>
                <Progress value={xpPercent} className="h-2" />
              </div>
            </div>

            {/* Streak */}
            <div className="flex items-center gap-1.5 bg-orange-100 dark:bg-orange-900/30 rounded-full px-3 py-1">
              <Flame className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-semibold text-orange-600 dark:text-orange-400">{progress.streak} day streak</span>
            </div>

            {/* Modules completed */}
            <div className="flex items-center gap-1.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-full px-3 py-1">
              <Zap className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                {progress.completedModules.size}/11 modules
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Module Grid */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        {(["find", "outreach", "crm"] as const).map(phase => (
          <div key={phase} className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="secondary" className={PHASE_LABELS[phase].color}>
                {PHASE_LABELS[phase].label}
              </Badge>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {ACADEMY_CURRICULUM.filter(m => m.phase === phase).map(mod => {
                const unlocked = isModuleUnlocked(mod.id);
                const completed = progress.completedModules.has(mod.id);
                const prog = getModuleLessonProgress(mod.id);

                return (
                  <Card
                    key={mod.id}
                    className={`relative transition-all cursor-pointer group ${
                      !unlocked ? "opacity-50 cursor-not-allowed" : "hover:shadow-md hover:border-primary/30"
                    } ${completed ? "border-emerald-300 dark:border-emerald-700" : ""}`}
                    onClick={() => unlocked && navigate(`/academy/${mod.id}`)}
                  >
                    {!unlocked && (
                      <div className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-xl z-10">
                        <Lock className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl">{mod.icon}</span>
                        {completed && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                      </div>
                      <CardTitle className="text-base mt-2">{mod.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{mod.description}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          {mod.lessons.map((_, i) => (
                            <Circle key={i} className={`w-2 h-2 ${i < prog.done ? "fill-primary text-primary" : "text-border"}`} />
                          ))}
                        </div>
                        <span>{prog.done}/{prog.total} lessons</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

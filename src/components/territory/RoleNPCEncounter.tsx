/**
 * RoleNPCEncounter — Cinematic fullscreen encounter when a player clicks a job-role NPC.
 * The role "comes alive" and tells the user how AI is changing their work.
 * Completing the encounter awards future skills linked to this role.
 */
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Zap, Shield, TrendingUp, BookOpen, Swords, Award, ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import HeroScene from "@/components/territory/HeroScene";
import { getTerritoryHeroImage } from "@/lib/territory-hero-images";
import { type RoleNPC, THREAT_COLORS, TERRITORY_HUES } from "@/lib/role-npcs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface RoleNPCEncounterProps {
  role: RoleNPC;
  onClose: () => void;
  onCollectSkills?: (skillIds: string[]) => void;
  onExploreRole?: (role: RoleNPC) => void;
}

interface FutureSkillInfo {
  id: string;
  name: string;
  category: string;
  icon_emoji: string | null;
}

const cinzel = { fontFamily: "'Cinzel', serif" };

/** Character avatar — generated from role title initials */
function RoleAvatar({ title, tier, size = 80 }: { title: string; tier: "thriving" | "adapting" | "threatened"; size?: number }) {
  const colors = THREAT_COLORS[tier];
  const initials = title.split(" ").slice(0, 2).map(w => w[0]?.toUpperCase() || "").join("");
  return (
    <div
      className="rounded-xl flex items-center justify-center font-black"
      style={{
        width: size, height: size,
        background: `linear-gradient(135deg, hsl(${colors.bg} / 0.3), hsl(${colors.bg} / 0.1))`,
        border: `2px solid hsl(${colors.bg})`,
        boxShadow: `0 0 30px hsl(${colors.glow} / 0.3)`,
        ...cinzel,
        fontSize: size * 0.3,
        color: `hsl(${colors.bg})`,
      }}
    >
      {initials}
    </div>
  );
}

export default function RoleNPCEncounter({ role, onClose, onCollectSkills, onExploreRole }: RoleNPCEncounterProps) {
  const { user } = useAuth();
  const hue = TERRITORY_HUES[role.territory] ?? 220;
  const heroImage = getTerritoryHeroImage(role.territory);
  const colors = THREAT_COLORS[role.threatTier];
  const [futureSkills, setFutureSkills] = useState<FutureSkillInfo[]>([]);
  const [tasks, setTasks] = useState<{ name: string; aiState: string | null; exposure: number | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [collected, setCollected] = useState(false);
  const [step, setStep] = useState<"intro" | "insight" | "skills">("intro");

  // Fetch role's future skills and key tasks
  useEffect(() => {
    (async () => {
      setLoading(true);
      const [skillsRes, tasksRes] = await Promise.all([
        supabase
          .from("job_future_skills")
          .select("canonical_skill_id, canonical_future_skills!inner(id, name, category, icon_emoji)")
          .eq("job_id", role.jobId)
          .not("canonical_skill_id", "is", null)
          .limit(8),
        supabase
          .from("job_task_clusters")
          .select("cluster_name, ai_state, ai_exposure_score")
          .eq("job_id", role.jobId)
          .order("sort_order", { ascending: true })
          .limit(5),
      ]);

      if (skillsRes.data) {
        const unique = new Map<string, FutureSkillInfo>();
        for (const row of skillsRes.data as any[]) {
          const s = row.canonical_future_skills;
          if (s && !unique.has(s.id)) unique.set(s.id, s);
        }
        setFutureSkills(Array.from(unique.values()));
      }

      if (tasksRes.data) {
        setTasks(tasksRes.data.map((t: any) => ({
          name: t.cluster_name,
          aiState: t.ai_state,
          exposure: t.ai_exposure_score,
        })));
      }

      setLoading(false);
    })();
  }, [role.jobId]);

  const handleCollect = () => {
    const ids = futureSkills.map(s => s.id);
    onCollectSkills?.(ids);
    setCollected(true);
  };

  const aiStateIcon = (state: string | null) => {
    if (!state) return "⚡";
    const s = state.toLowerCase();
    if (s.includes("automat") || s.includes("replac")) return "🤖";
    if (s.includes("augment") || s.includes("assist")) return "🤝";
    if (s.includes("new") || s.includes("emerg")) return "✨";
    return "⚡";
  };

  const aiStateColor = (state: string | null) => {
    if (!state) return "hsl(var(--muted-foreground))";
    const s = state.toLowerCase();
    if (s.includes("automat") || s.includes("replac")) return "hsl(0 70% 55%)";
    if (s.includes("augment") || s.includes("assist")) return "hsl(45 90% 55%)";
    if (s.includes("new") || s.includes("emerg")) return "hsl(142 70% 50%)";
    return "hsl(var(--muted-foreground))";
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed inset-0 z-50 flex items-center justify-center"
      >
        <HeroScene
          imageUrl={heroImage}
          intensity="full"
          camera="ken-burns"
          overlay="letterbox"
          hue={hue}
          className="absolute inset-0"
        />

        <div className="absolute inset-0 z-[3]" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.95 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-[4] w-full max-w-2xl mx-4"
        >
          <div
            className="rounded-2xl border-2 overflow-hidden backdrop-blur-xl"
            style={{
              background: `linear-gradient(135deg, hsl(${hue} 30% 6% / 0.95), hsl(${hue} 20% 10% / 0.95))`,
              borderColor: `hsl(${colors.bg})`,
              boxShadow: `0 0 80px hsl(${colors.glow} / 0.3), inset 0 1px 0 hsl(${hue} 35% 28% / 0.3)`,
            }}
          >
            {/* Header */}
            <div className="relative px-6 pt-5 pb-4 flex items-start gap-4">
              <RoleAvatar title={role.title} tier={role.threatTier} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="text-[10px] uppercase tracking-[0.15em] font-bold px-2 py-0.5 rounded-full"
                    style={{
                      background: `hsl(${colors.bg} / 0.15)`,
                      color: `hsl(${colors.bg})`,
                      border: `1px solid hsl(${colors.bg} / 0.3)`,
                    }}
                  >
                    {colors.label}
                  </span>
                  {role.company && (
                    <span className="text-[10px]" style={{ color: `hsl(${hue} 20% 55%)` }}>
                      @ {role.company}
                    </span>
                  )}
                </div>
                <h2
                  className="text-xl font-black tracking-wide leading-tight"
                  style={{ ...cinzel, color: `hsl(${hue} 45% 78%)` }}
                >
                  {role.title}
                </h2>
                <p className="text-[11px] mt-1" style={{ color: `hsl(${hue} 15% 50%)` }}>
                  {role.department} · AI Risk {role.automationRisk}% · Augmented {role.augmentedPercent}%
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                style={{ background: `hsl(${hue} 20% 14%)`, color: `hsl(${hue} 15% 55%)` }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Threat gauge */}
            <div className="px-6 pb-3">
              <div className="h-2 rounded-full overflow-hidden" style={{ background: `hsl(${hue} 15% 15%)` }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${role.automationRisk}%` }}
                  transition={{ duration: 1.2, delay: 0.5, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{
                    background: `linear-gradient(90deg, hsl(142 70% 45%), hsl(45 90% 50%), hsl(0 70% 50%))`,
                  }}
                />
              </div>
              <div className="flex justify-between mt-1 text-[9px]" style={{ color: `hsl(${hue} 15% 40%)` }}>
                <span>Low AI Impact</span>
                <span>High AI Impact</span>
              </div>
            </div>

            {/* Content area — steps */}
            <div className="px-6 pb-2 min-h-[200px]">
              <AnimatePresence mode="wait">
                {/* Step 1: Intro — Greeting */}
                {step === "intro" && (
                  <motion.div
                    key="intro"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.35 }}
                  >
                    <div
                      className="rounded-xl px-5 py-4 text-sm leading-relaxed mb-4"
                      style={{
                        background: `hsl(${hue} 18% 10% / 0.7)`,
                        borderLeft: `3px solid hsl(${colors.bg})`,
                        color: `hsl(${hue} 12% 82%)`,
                        fontStyle: "italic",
                      }}
                    >
                      "{role.greeting}"
                    </div>

                    <div className="flex items-center gap-2 mb-3">
                      <Swords className="h-4 w-4" style={{ color: `hsl(${colors.bg})` }} />
                      <span className="text-xs font-bold uppercase tracking-wider" style={{ color: `hsl(${colors.bg})` }}>
                        How AI Affects This Role
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div className="rounded-lg p-3 text-center" style={{ background: `hsl(0 70% 50% / 0.08)`, border: `1px solid hsl(0 70% 50% / 0.15)` }}>
                        <p className="text-lg font-black" style={{ ...cinzel, color: "hsl(0 70% 55%)" }}>{role.automationRisk}%</p>
                        <p className="text-[9px] mt-0.5" style={{ color: `hsl(${hue} 15% 50%)` }}>Automation Risk</p>
                      </div>
                      <div className="rounded-lg p-3 text-center" style={{ background: `hsl(45 90% 50% / 0.08)`, border: `1px solid hsl(45 90% 50% / 0.15)` }}>
                        <p className="text-lg font-black" style={{ ...cinzel, color: "hsl(45 90% 55%)" }}>{role.augmentedPercent}%</p>
                        <p className="text-[9px] mt-0.5" style={{ color: `hsl(${hue} 15% 50%)` }}>AI Augmented</p>
                      </div>
                      <div className="rounded-lg p-3 text-center" style={{ background: `hsl(142 70% 45% / 0.08)`, border: `1px solid hsl(142 70% 45% / 0.15)` }}>
                        <p className="text-lg font-black" style={{ ...cinzel, color: "hsl(142 70% 50%)" }}>{futureSkills.length}</p>
                        <p className="text-[9px] mt-0.5" style={{ color: `hsl(${hue} 15% 50%)` }}>Skills to Collect</p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Step 2: Insight — Task breakdown */}
                {step === "insight" && (
                  <motion.div
                    key="insight"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.35 }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="h-4 w-4" style={{ color: `hsl(${colors.bg})` }} />
                      <span className="text-xs font-bold uppercase tracking-wider" style={{ color: `hsl(${colors.bg})` }}>
                        Task Transformation
                      </span>
                    </div>

                    {loading ? (
                      <div className="py-8 flex justify-center">
                        <div className="h-5 w-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: `hsl(${colors.bg})`, borderTopColor: "transparent" }} />
                      </div>
                    ) : tasks.length > 0 ? (
                      <div className="space-y-2 mb-4">
                        {tasks.map((task, i) => (
                          <motion.div
                            key={task.name}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="flex items-start gap-3 rounded-lg px-3 py-2.5"
                            style={{ background: `hsl(${hue} 18% 10% / 0.5)`, border: `1px solid hsl(${hue} 20% 18% / 0.3)` }}
                          >
                            <span className="text-base mt-0.5">{aiStateIcon(task.aiState)}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold truncate" style={{ color: `hsl(${hue} 15% 80%)` }}>{task.name}</p>
                              <p className="text-[10px]" style={{ color: aiStateColor(task.aiState) }}>
                                {task.aiState || "Evolving"} · {task.exposure != null ? `${task.exposure}% AI exposure` : ""}
                              </p>
                            </div>
                            {task.exposure != null && (
                              <div className="w-12 h-1.5 rounded-full mt-2" style={{ background: `hsl(${hue} 15% 15%)` }}>
                                <div className="h-full rounded-full" style={{ width: `${task.exposure}%`, background: aiStateColor(task.aiState) }} />
                              </div>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs py-4 text-center" style={{ color: `hsl(${hue} 15% 45%)` }}>
                        Task data not yet analyzed for this role.
                      </p>
                    )}
                  </motion.div>
                )}

                {/* Step 3: Skills — Collectible future skills */}
                {step === "skills" && (
                  <motion.div
                    key="skills"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.35 }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Award className="h-4 w-4" style={{ color: `hsl(${colors.bg})` }} />
                      <span className="text-xs font-bold uppercase tracking-wider" style={{ color: `hsl(${colors.bg})` }}>
                        Skills to Collect
                      </span>
                    </div>

                    {futureSkills.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2 mb-4">
                        {futureSkills.map((skill, i) => (
                          <motion.div
                            key={skill.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: collected ? 1 : 0.85, scale: 1 }}
                            transition={{ delay: i * 0.08 }}
                            className="rounded-lg px-3 py-2.5 flex items-center gap-2"
                            style={{
                              background: collected
                                ? `hsl(${colors.bg} / 0.12)`
                                : `hsl(${hue} 18% 10% / 0.5)`,
                              border: `1px solid ${collected ? `hsl(${colors.bg} / 0.4)` : `hsl(${hue} 20% 18% / 0.3)`}`,
                            }}
                          >
                            <span className="text-base">{skill.icon_emoji || "🎯"}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-semibold truncate" style={{ color: collected ? `hsl(${colors.bg})` : `hsl(${hue} 15% 78%)` }}>
                                {skill.name}
                              </p>
                              <p className="text-[9px]" style={{ color: `hsl(${hue} 15% 45%)` }}>{skill.category}</p>
                            </div>
                            {collected && <Sparkles className="h-3 w-3 flex-shrink-0" style={{ color: `hsl(${colors.bg})` }} />}
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs py-4 text-center" style={{ color: `hsl(${hue} 15% 45%)` }}>
                        No future skills mapped yet.
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Step navigation + actions */}
            <div className="px-6 pb-5 flex items-center gap-3">
              {/* Step dots */}
              <div className="flex gap-1.5">
                {(["intro", "insight", "skills"] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => setStep(s)}
                    className="w-2 h-2 rounded-full transition-all"
                    style={{
                      background: step === s ? `hsl(${colors.bg})` : `hsl(${hue} 15% 25%)`,
                      boxShadow: step === s ? `0 0 8px hsl(${colors.glow} / 0.5)` : "none",
                    }}
                  />
                ))}
              </div>

              <div className="flex-1" />

              {step !== "skills" ? (
                <Button
                  size="lg"
                  className="gap-2 text-sm font-semibold"
                  style={{
                    background: `linear-gradient(135deg, hsl(${colors.bg} / 0.8), hsl(${colors.bg}))`,
                    color: "white",
                    boxShadow: `0 0 25px hsl(${colors.glow} / 0.3)`,
                  }}
                  onClick={() => setStep(step === "intro" ? "insight" : "skills")}
                >
                  {step === "intro" ? "See AI Impact" : "View Skills"}
                  <ChevronRight size={16} />
                </Button>
              ) : (
                <div className="flex gap-2">
                  {futureSkills.length > 0 && !collected && (
                    <Button
                      size="lg"
                      className="gap-2 text-sm font-bold"
                      style={{
                        background: `linear-gradient(135deg, hsl(${colors.bg} / 0.8), hsl(${colors.bg}))`,
                        color: "white",
                        boxShadow: `0 0 25px hsl(${colors.glow} / 0.3)`,
                      }}
                      onClick={handleCollect}
                    >
                      <Award size={16} />
                      Collect {futureSkills.length} Skills
                    </Button>
                  )}
                  {collected && (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold"
                      style={{ background: `hsl(${colors.bg} / 0.15)`, color: `hsl(${colors.bg})` }}
                    >
                      <Sparkles size={16} /> Collected!
                    </motion.div>
                  )}
                  <Button
                    size="lg"
                    variant="outline"
                    className="gap-2"
                    style={{ borderColor: `hsl(${hue} 25% 25%)`, color: `hsl(${hue} 25% 65%)` }}
                    onClick={onClose}
                  >
                    Close
                  </Button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

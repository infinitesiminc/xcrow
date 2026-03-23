/**
 * SkillLaunchCard — Compact floating card that appears on the map
 * next to a selected skill node, providing quick sim launch buttons.
 */
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Zap, Diamond, ArrowRight, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { type FutureSkill } from "@/hooks/use-future-skills";
import { getTerritory } from "@/lib/territory-colors";
import type { CanonicalSkillGrowth } from "@/pages/MapPage";

export interface SimLaunchRequest {
  jobTitle: string;
  company?: string;
  skillId?: string;
  level?: 1 | 2;
}

interface SkillLaunchCardProps {
  skill: FutureSkill;
  /** Screen-space position (relative to map container) */
  x: number;
  y: number;
  /** Container width to clamp position */
  containerWidth: number;
  containerHeight: number;
  level2Unlocked?: boolean;
  growth?: CanonicalSkillGrowth | null;
  onClose: () => void;
  /** If provided, launches sim in-place instead of navigating */
  onLaunchSim?: (req: SimLaunchRequest) => void;
}

export default function SkillLaunchCard({
  skill, x, y, containerWidth, containerHeight,
  level2Unlocked, growth, onClose, onLaunchSim,
}: SkillLaunchCardProps) {
  const navigate = useNavigate();
  const [firstRole, setFirstRole] = useState<{ title: string; company: string | null } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data: links } = await supabase
        .from("job_future_skills")
        .select("job_id")
        .eq("canonical_skill_id", skill.id)
        .limit(1);

      if (cancelled || !links?.length || !links[0].job_id) {
        setFirstRole(null);
        setLoading(false);
        return;
      }

      const { data: job } = await supabase
        .from("jobs")
        .select("title, company_id")
        .eq("id", links[0].job_id)
        .single();

      if (cancelled || !job) { setFirstRole(null); setLoading(false); return; }

      let company: string | null = null;
      if (job.company_id) {
        const { data: c } = await supabase
          .from("companies")
          .select("name")
          .eq("id", job.company_id)
          .single();
        company = c?.name || null;
      }
      if (!cancelled) {
        setFirstRole({ title: job.title, company });
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [skill.id]);

  const launchLevel = useCallback((level: 1 | 2) => {
    if (!firstRole) return;
    const params = new URLSearchParams();
    if (firstRole.company) params.set("company", firstRole.company);
    if (level === 2) params.set("level", "2");
    const qs = params.toString();
    navigate(`/role/${encodeURIComponent(firstRole.title)}${qs ? `?${qs}` : ""}`);
    onClose();
  }, [firstRole, navigate, onClose]);

  const territory = getTerritory(skill.category as any);
  const l1Xp = growth?.level1Xp || 0;
  const l2Xp = growth?.level2Xp || 0;
  const l1Sims = growth?.level1Sims || 0;

  // Position: always to the right of the node for consistency
  const CARD_W = 220;
  const CARD_H = 180;
  const OFFSET = 30;
  // Prefer right side; only fall back to left if card would overflow right edge
  const rightX = x + OFFSET;
  const leftX = x - OFFSET - CARD_W;
  const clampedX = rightX + CARD_W <= containerWidth - 8 ? rightX : Math.max(8, leftX);
  const clampedY = Math.max(8, Math.min(containerHeight - CARD_H - 8, y - CARD_H / 2));

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, x: x > containerWidth / 2 ? 10 : -10 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="absolute z-30 pointer-events-auto"
      style={{
        left: clampedX,
        top: clampedY,
        width: CARD_W,
      }}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div
        className="rounded-xl overflow-hidden"
        style={{
          background: "hsl(var(--surface-stone) / 0.95)",
          border: `1.5px solid ${territory.hsl}44`,
          boxShadow: `0 8px 32px hsl(var(--emboss-shadow)), 0 0 20px ${territory.hsl}15`,
          backdropFilter: "blur(12px)",
        }}
      >
        {/* Header */}
        <div
          className="px-3 py-2.5 flex items-center gap-2"
          style={{ borderBottom: `1px solid hsl(var(--filigree) / 0.12)` }}
        >
          <span className="text-lg">{skill.iconEmoji || "⚔️"}</span>
          <div className="flex-1 min-w-0">
            <p
              className="text-[11px] font-bold text-foreground truncate leading-tight"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              {skill.name}
            </p>
            <p className="text-[9px] text-muted-foreground">
              {skill.demandCount} demand · {skill.jobCount} roles
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-white/10 transition-colors shrink-0"
            style={{ color: "hsl(var(--muted-foreground))" }}
          >
            <X className="h-3 w-3" />
          </button>
        </div>

        {/* Launch buttons */}
        <div className="px-3 py-2.5 space-y-1.5">
          {/* Level 1 */}
          <button
            onClick={() => launchLevel(1)}
            disabled={loading || !firstRole}
            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition-all hover:brightness-110 disabled:opacity-40 group"
            style={{
              background: "hsl(var(--primary) / 0.1)",
              border: "1px solid hsl(var(--primary) / 0.2)",
            }}
          >
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
              style={{ background: "hsl(var(--primary) / 0.2)" }}
            >
              <Zap className="h-3 w-3" style={{ color: "hsl(var(--primary))" }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-foreground" style={{ fontFamily: "'Cinzel', serif" }}>
                Level 1 Quest
              </p>
              <p className="text-[9px] text-muted-foreground">
                {l1Sims > 0 ? `${l1Xp} XP · ${l1Sims} completed` : "AI tools mastery"}
              </p>
            </div>
            <ArrowRight className="h-3 w-3 text-muted-foreground group-hover:text-primary shrink-0 transition-colors" />
          </button>

          {/* Level 2 */}
          <button
            onClick={() => launchLevel(2)}
            disabled={loading || !firstRole}
            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition-all hover:brightness-110 disabled:opacity-40 group"
            style={{
              background: level2Unlocked ? "hsl(45 40% 15% / 0.4)" : "hsl(var(--muted) / 0.1)",
              border: level2Unlocked ? "1px solid hsl(45 60% 50% / 0.3)" : "1px solid hsl(var(--filigree) / 0.1)",
            }}
          >
            <div
              className="w-6 h-6 rounded flex items-center justify-center shrink-0"
              style={{
                background: level2Unlocked ? "hsl(45 40% 20%)" : "hsl(var(--muted) / 0.2)",
                transform: "rotate(45deg)",
              }}
            >
              <Diamond
                className="h-3 w-3"
                style={{
                  color: level2Unlocked ? "hsl(45 93% 58%)" : "hsl(var(--muted-foreground))",
                  transform: "rotate(-45deg)",
                }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-foreground" style={{ fontFamily: "'Cinzel', serif" }}>
                {level2Unlocked ? "Level 2 Quest" : "Level 2 Preview"}
              </p>
              <p className="text-[9px] text-muted-foreground">
                {level2Unlocked
                  ? (l2Xp > 0 ? `${l2Xp} XP earned` : "Future sentinel audit")
                  : `${Math.max(0, 3 - l1Sims)} quests to unlock`}
              </p>
            </div>
            <ArrowRight className="h-3 w-3 text-muted-foreground group-hover:text-foreground shrink-0 transition-colors" />
          </button>
        </div>

        {/* Role context */}
        {firstRole && (
          <div
            className="px-3 py-1.5 text-[9px] text-muted-foreground truncate"
            style={{ borderTop: "1px solid hsl(var(--filigree) / 0.08)" }}
          >
            via {firstRole.title}{firstRole.company ? ` · ${firstRole.company}` : ""}
          </div>
        )}
      </div>
    </motion.div>
  );
}

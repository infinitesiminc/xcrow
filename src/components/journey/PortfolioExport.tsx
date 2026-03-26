/**
 * PortfolioExport — Downloadable proof of competency across all tiers.
 * Shows a preview and allows JSON/PDF export of skill portfolio.
 */
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Download, FileText, Shield, Crown, Trophy, Star,
  ChevronRight, Loader2, ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { type SkillXP, CATEGORY_META } from "@/lib/skill-map";
import { getCastleState, type CastleTier } from "@/lib/castle-levels";
import { getPlayerRank, type KingdomTier } from "@/lib/progression";
import { toast } from "sonner";

const cinzel = { fontFamily: "'Cinzel', serif" };
const stoneCard = {
  background: "hsl(var(--surface-stone))",
  border: "1px solid hsl(var(--filigree) / 0.2)",
  boxShadow: "inset 0 1px 0 hsl(var(--emboss-light)), 0 4px 20px hsl(var(--emboss-shadow))",
};

const TIER_BADGES: Record<CastleTier, { label: string; color: string; emoji: string }> = {
  ruins: { label: "Novice", color: "hsl(var(--muted-foreground))", emoji: "🏚️" },
  outpost: { label: "Bronze", color: "hsl(30, 60%, 55%)", emoji: "🥉" },
  fortress: { label: "Silver", color: "hsl(210, 20%, 65%)", emoji: "🥈" },
  citadel: { label: "Gold", color: "hsl(45, 70%, 55%)", emoji: "🥇" },
  grandmaster: { label: "Platinum", color: "hsl(270, 50%, 60%)", emoji: "💎" },
};

interface PortfolioExportProps {
  skills: SkillXP[];
  kingdomTiers?: KingdomTier[];
  username?: string;
}

export default function PortfolioExport({ skills, kingdomTiers = [], username }: PortfolioExportProps) {
  const { user } = useAuth();
  const [exporting, setExporting] = useState(false);

  const activeSkills = useMemo(() => skills.filter(s => s.xp > 0), [skills]);
  const castleTiers = useMemo(() => activeSkills.map(s => getCastleState(s.xp).tier), [activeSkills]);
  const rank = useMemo(() => getPlayerRank(castleTiers, kingdomTiers), [castleTiers, kingdomTiers]);

  // Group skills by category
  const grouped = useMemo(() => {
    const map = new Map<string, { name: string; xp: number; tier: CastleTier; humanEdge?: string }[]>();
    activeSkills.forEach(s => {
      const castle = getCastleState(s.xp);
      if (!map.has(s.category)) map.set(s.category, []);
      map.get(s.category)!.push({
        name: s.name,
        xp: s.xp,
        tier: castle.tier,
        humanEdge: s.humanEdge,
      });
    });
    // Sort each group by XP desc
    map.forEach(arr => arr.sort((a, b) => b.xp - a.xp));
    return map;
  }, [activeSkills]);

  const topSkills = useMemo(() =>
    activeSkills
      .sort((a, b) => b.xp - a.xp)
      .slice(0, 5)
      .map(s => ({ name: s.name, tier: getCastleState(s.xp).tier, xp: s.xp })),
    [activeSkills]
  );

  const handleExportJSON = () => {
    setExporting(true);
    try {
      const portfolio = {
        exported_at: new Date().toISOString(),
        player: {
          username: username || user?.email?.split("@")[0] || "player",
          rank: rank.rank,
          total_skills: activeSkills.length,
          kingdoms: kingdomTiers.length,
        },
        skills: activeSkills.map(s => ({
          name: s.name,
          category: s.category,
          xp: s.xp,
          tier: getCastleState(s.xp).tier,
          human_edge: s.humanEdge || null,
        })),
      };
      const blob = new Blob([JSON.stringify(portfolio, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `xcrow-portfolio-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Portfolio exported!");
    } finally {
      setExporting(false);
    }
  };

  if (activeSkills.length === 0) return null;

  return (
    <div className="rounded-xl p-5" style={stoneCard}>
      <div className="flex items-center gap-3 mb-5">
        <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-primary/15">
          <Trophy className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-bold" style={cinzel}>Skill Portfolio</h3>
          <p className="text-[10px] text-muted-foreground">Exportable proof of competency</p>
        </div>
        <Badge variant="outline" className="text-[9px]">
          {rank.emoji} {rank.rank}
        </Badge>
      </div>

      {/* Top Skills Preview */}
      <div className="space-y-1.5 mb-5">
        {topSkills.map(skill => {
          const badge = TIER_BADGES[skill.tier];
          return (
            <div key={skill.name} className="flex items-center gap-2 text-xs">
              <span>{badge.emoji}</span>
              <span className="flex-1 truncate text-foreground/80">{skill.name}</span>
              <span className="text-[9px] font-mono" style={{ color: badge.color }}>{badge.label}</span>
            </div>
          );
        })}
        {activeSkills.length > 5 && (
          <p className="text-[9px] text-muted-foreground pl-6">
            +{activeSkills.length - 5} more skills
          </p>
        )}
      </div>

      {/* Category Summary */}
      <div className="flex flex-wrap gap-1.5 mb-5">
        {Array.from(grouped.keys()).map(cat => {
          const meta = CATEGORY_META[cat];
          return (
            <span key={cat} className="text-[9px] px-2 py-0.5 rounded-full bg-muted/50 text-muted-foreground">
              {meta?.emoji || "📦"} {cat} ({grouped.get(cat)!.length})
            </span>
          );
        })}
      </div>

      {/* Export Actions */}
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={handleExportJSON} disabled={exporting} className="gap-1.5 flex-1 text-xs">
          {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
          Export JSON
        </Button>
        {username && (
          <Button size="sm" variant="outline" className="gap-1.5 text-xs" asChild>
            <a href={`/u/${username}`} target="_blank" rel="noopener">
              <ExternalLink className="h-3.5 w-3.5" /> Public Profile
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}

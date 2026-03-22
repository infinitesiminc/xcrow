/**
 * InlineChatRoleCards — rich role cards rendered inline in chat stream.
 * 2-column grid with salary, augmented score, future skills badge, and quick actions.
 */

import { motion } from "framer-motion";
import { MapPin, ArrowRight, DollarSign, ExternalLink, Sparkles } from "lucide-react";
import type { RoleResult } from "@/components/InlineRoleCarousel";

function hashToHue(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  return Math.abs(h) % 360;
}

function formatSalary(min?: number | null, max?: number | null, currency?: string | null, period?: string | null): string | null {
  if (!min && !max) return null;
  const c = currency || "USD";
  const sym = c === "GBP" ? "£" : c === "EUR" ? "€" : "$";
  const fmt = (n: number) => n >= 1000 ? `${Math.round(n / 1000)}k` : `${n}`;
  if (min && max) return `${sym}${fmt(min)}–${sym}${fmt(max)}${period === "hourly" ? "/hr" : ""}`;
  if (min) return `${sym}${fmt(min)}+${period === "hourly" ? "/hr" : ""}`;
  return `Up to ${sym}${fmt(max!)}${period === "hourly" ? "/hr" : ""}`;
}

function AugmentedBar({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-1.5 flex-1 min-w-0">
      <Zap className="h-3 w-3 text-primary shrink-0" />
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="h-full rounded-full bg-primary"
        />
      </div>
      <span className="text-[10px] font-mono text-muted-foreground shrink-0 w-7 text-right">{value}%</span>
    </div>
  );
}

interface InlineChatRoleCardsProps {
  roles: RoleResult[];
  onSelectRole: (role: RoleResult) => void;
  onViewDetails?: (role: RoleResult) => void;
  selectedJobId?: string;
}

export default function InlineChatRoleCards({ roles, onSelectRole, onViewDetails, selectedJobId }: InlineChatRoleCardsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="grid grid-cols-1 gap-2.5 py-1"
    >
      {roles.map((role, i) => {
        const hue = hashToHue(role.title);
        const isSelected = selectedJobId === role.jobId;
        const logoUrl = role.logo || (role.company ? `https://logo.clearbit.com/${role.company.toLowerCase().replace(/\s+/g, "")}.com` : "");
        const salary = formatSalary(
          (role as any).salaryMin,
          (role as any).salaryMax,
          (role as any).salaryCurrency,
          (role as any).salaryPeriod,
        );
        const futureSkillCount = (role as any).futureSkillCount || 0;

        return (
          <motion.div
            key={(role.jobId || role.title) + i}
            initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.4, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
            className={`group relative rounded-xl border overflow-hidden bg-card transition-all duration-200 hover:shadow-md active:scale-[0.98] ${
              isSelected
                ? "border-primary shadow-md shadow-primary/10"
                : "border-border hover:border-primary/40"
            }`}
          >
            {/* Gradient accent strip */}
            <div
              className="h-1 w-full"
              style={{
                background: `linear-gradient(90deg, hsl(${hue} 60% 50%), hsl(${(hue + 60) % 360} 50% 45%))`,
              }}
            />

            <div className="p-3 space-y-2">
              {/* Header: logo + title */}
              <div className="flex items-start gap-2.5">
                {logoUrl && (
                  <img
                    src={logoUrl}
                    alt=""
                    className="h-8 w-8 rounded-lg object-contain bg-muted/30 p-0.5 shrink-0 mt-0.5"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                    {role.title}
                  </h3>
                  {role.company && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{role.company}</p>
                  )}
                </div>
              </div>

              {/* Meta row: location + salary + future skills */}
              <div className="flex items-center gap-3 flex-wrap">
                {role.location && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="text-[11px] truncate max-w-[140px]">
                      {role.location}{role.workMode ? ` · ${role.workMode}` : ""}
                    </span>
                  </div>
                )}
                {salary && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <DollarSign className="h-3 w-3 shrink-0" />
                    <span className="text-[11px] font-medium text-foreground">{salary}</span>
                  </div>
                )}
                {futureSkillCount > 0 && (
                  <div className="flex items-center gap-1 text-accent-foreground">
                    <Sparkles className="h-3 w-3 shrink-0 text-amber-500" />
                    <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400">
                      {futureSkillCount} future skills
                    </span>
                  </div>
                )}
              </div>

              {/* Augmented bar */}
              {role.augmented > 0 && <AugmentedBar value={role.augmented} />}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    (onViewDetails || onSelectRole)(role);
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors active:scale-[0.97]"
                >
                  <ExternalLink className="h-3 w-3" />
                  Details
                </button>
              </div>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

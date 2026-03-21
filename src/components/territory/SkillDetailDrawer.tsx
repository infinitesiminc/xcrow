/**
 * SkillDetailDrawer — Context bridge between Territory Map and Role Deep Dive.
 * Shows skill info + demand stats + roles that need this skill.
 * No sim button — funnels through Role Deep Dive.
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { type FutureSkill } from "@/hooks/use-future-skills";
import { ArrowRight, Briefcase, TrendingUp, Sparkles } from "lucide-react";

interface RoleLink {
  jobId: string;
  title: string;
  company: string | null;
  department: string | null;
  augmentedPercent: number | null;
}

interface SkillDetailDrawerProps {
  skill: FutureSkill | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SkillDetailDrawer({ skill, open, onOpenChange }: SkillDetailDrawerProps) {
  const navigate = useNavigate();
  const [roles, setRoles] = useState<RoleLink[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!skill || !open) return;

    // Emit focus_skill event for AI coach
    window.dispatchEvent(
      new CustomEvent("focus_skill", {
        detail: { skillId: skill.id, skillName: skill.name, category: skill.category },
      })
    );

    // Fetch roles that need this skill
    setLoading(true);
    (async () => {
      const { data } = await supabase
        .from("job_future_skills")
        .select("job_id, cluster_name")
        .eq("canonical_skill_id", skill.id)
        .limit(20);

      if (!data || data.length === 0) {
        setRoles([]);
        setLoading(false);
        return;
      }

      const jobIds = [...new Set(data.map((d) => d.job_id).filter(Boolean))] as string[];

      if (jobIds.length === 0) {
        setRoles([]);
        setLoading(false);
        return;
      }

      const { data: jobs } = await supabase
        .from("jobs")
        .select("id, title, company_id, department, augmented_percent")
        .in("id", jobIds.slice(0, 10));

      if (!jobs) {
        setRoles([]);
        setLoading(false);
        return;
      }

      const companyIds = [...new Set(jobs.map((j) => j.company_id).filter(Boolean))] as string[];
      let companyMap = new Map<string, string>();

      if (companyIds.length > 0) {
        const { data: companies } = await supabase
          .from("companies")
          .select("id, name")
          .in("id", companyIds);
        if (companies) {
          companyMap = new Map(companies.map((c) => [c.id, c.name]));
        }
      }

      setRoles(
        jobs.map((j) => ({
          jobId: j.id,
          title: j.title,
          company: j.company_id ? companyMap.get(j.company_id) || null : null,
          department: j.department,
          augmentedPercent: j.augmented_percent,
        }))
      );
      setLoading(false);
    })();
  }, [skill, open]);

  if (!skill) return null;

  const demandTier =
    skill.demandCount >= 12 ? "🔥 High Demand" : skill.demandCount >= 5 ? "📈 Growing" : "🌱 Emerging";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[380px] sm:w-[420px] overflow-y-auto bg-card border-border">
        <SheetHeader className="pb-2">
          <div className="flex items-center gap-2">
            {skill.iconEmoji && <span className="text-2xl">{skill.iconEmoji}</span>}
            <SheetTitle className="text-lg">{skill.name}</SheetTitle>
          </div>
          <SheetDescription className="sr-only">Details for {skill.name}</SheetDescription>
        </SheetHeader>

        {/* Category badge */}
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="outline" className="text-xs font-medium">
            {skill.category}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {demandTier}
          </Badge>
        </div>

        {/* Description */}
        {skill.description && (
          <p className="text-sm text-muted-foreground mt-4 leading-relaxed">{skill.description}</p>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mt-5">
          <StatCard icon={<TrendingUp className="h-3.5 w-3.5" />} label="Demand" value={skill.demandCount} />
          <StatCard icon={<Briefcase className="h-3.5 w-3.5" />} label="Roles" value={skill.jobCount} />
          <StatCard
            icon={<Sparkles className="h-3.5 w-3.5" />}
            label="Relevance"
            value={`${skill.avgRelevance}%`}
          />
        </div>

        <Separator className="my-5" />

        {/* Roles that need this skill */}
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5 mb-3">
          <Briefcase className="h-4 w-4 text-primary" />
          Roles that need this skill
        </h3>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : roles.length === 0 ? (
          <p className="text-xs text-muted-foreground italic py-4 text-center">
            No linked roles yet — explore the Kingdoms tab to discover matches.
          </p>
        ) : (
          <div className="space-y-1.5">
            {roles.map((role) => (
              <button
                key={role.jobId}
                onClick={() => {
                  onOpenChange(false);
                  navigate(`/role/${encodeURIComponent(role.title)}${role.company ? `?company=${encodeURIComponent(role.company)}` : ""}`);
                }}
                className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg border border-border/50 bg-background/50 hover:bg-accent/30 hover:border-primary/30 transition-all text-left group"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{role.title}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {role.company && <span className="truncate">{role.company}</span>}
                    {role.department && (
                      <>
                        <span className="text-border">•</span>
                        <span>{role.department}</span>
                      </>
                    )}
                  </div>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary shrink-0 transition-colors" />
              </button>
            ))}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-border/50 bg-background/50 p-2.5 text-center">
      <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">{icon}</div>
      <p className="text-base font-bold text-foreground">{String(value)}</p>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
    </div>
  );
}

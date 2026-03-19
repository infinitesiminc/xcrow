/**
 * Career Reach Map — Bullseye target + Skill-first exploration engine.
 *
 * You at center. Jobs placed on rings by match distance.
 * "Suggested Next" cards show highest-leverage skills to practice.
 * Click dot → slide-out with best skill to practice + direct sim launch.
 */
import { useState, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight, Bot, Play, ArrowUpRight,
  Target, Shield, Zap, Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";

/* ─── Types ─── */
export interface JobMatchDot {
  title: string;
  company: string;
  dept: string;
  humanMatch: number;
  aiBoostMatch: number;
  unlocked: boolean;
  matchedSkills: string[];
  gapSkills: { name: string; aiExposure: number; aiEnabler?: string; humanEdge?: string }[];
  aiCoveredGaps: { name: string; aiEnabler: string; humanEdge: string }[];
  newEdges: string[];
}

export interface SkillLeverage {
  skillName: string;
  skillId: string;
  category: string;
  dotsAffected: number;
  affectedRoles: { title: string; company: string }[];
  bestTask: { taskName: string; company: string; jobTitle: string } | null;
  aiExposure: number;
  humanEdge?: string;
}

interface CareerReachMapProps {
  jobMatches: JobMatchDot[];
  isEmpty: boolean;
  leverageSkills?: SkillLeverage[];
}

/* ─── Zone helpers ─── */
function getZone(humanMatch: number, aiBoostMatch: number): "ready" | "fast-track" | "growth" {
  if (humanMatch >= 60) return "ready";
  if (aiBoostMatch >= 60) return "fast-track";
  return "growth";
}

function zoneColor(zone: "ready" | "fast-track" | "growth") {
  switch (zone) {
    case "ready":      return "hsl(var(--brand-human))";
    case "fast-track": return "hsl(var(--primary))";
    case "growth":     return "hsl(var(--brand-ai))";
  }
}

/* ─── Position jobs on bullseye ─── */
interface PlacedDot {
  x: number; y: number; r: number;
  job: JobMatchDot;
  zone: "ready" | "fast-track" | "growth";
}

function placeDots(jobs: JobMatchDot[], cx: number, cy: number, maxRadius: number): PlacedDot[] {
  const golden = Math.PI * (3 - Math.sqrt(5));
  const sorted = [...jobs].sort((a, b) => b.aiBoostMatch - a.aiBoostMatch);
  return sorted.map((job, i) => {
    const matchScore = Math.max(job.humanMatch, job.aiBoostMatch);
    const dist = maxRadius * (1 - matchScore / 100) * 0.85 + maxRadius * 0.08;
    const angle = i * golden + (i % 3) * 0.15;
    const zone = getZone(job.humanMatch, job.aiBoostMatch);
    const dotR = zone === "ready" ? 8 : zone === "fast-track" ? 7 : 6.5;
    return { x: cx + Math.cos(angle) * dist, y: cy + Math.sin(angle) * dist, r: dotR, job, zone };
  });
}

/* ─── Suggested Next Card ─── */
function SuggestedSkillCard({ skill, index, onPractice }: { skill: SkillLeverage; index: number; onPractice: (s: SkillLeverage) => void }) {
  const colors = [
    "border-primary/30 bg-primary/5",
    "border-brand-human/30 bg-brand-human/5",
    "border-brand-ai/30 bg-brand-ai/5",
  ];
  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      onClick={() => onPractice(skill)}
      className={`flex-1 min-w-[140px] rounded-xl border p-3 text-left hover:shadow-md transition-shadow ${colors[index % 3]}`}
    >
      <div className="flex items-center gap-1.5 mb-1.5">
        <Zap className="h-3.5 w-3.5 text-primary shrink-0" />
        <span className="text-[11px] font-semibold text-foreground truncate">{skill.skillName}</span>
      </div>
      <div className="flex items-center gap-1 mb-1">
        <Sparkles className="h-3 w-3 text-primary/60" />
        <span className="text-[10px] text-primary font-medium">
          Moves {skill.dotsAffected} role{skill.dotsAffected !== 1 ? "s" : ""} closer
        </span>
      </div>
      {skill.bestTask && (
        <p className="text-[9px] text-muted-foreground truncate">
          via {skill.bestTask.taskName} · {skill.bestTask.company}
        </p>
      )}
    </motion.button>
  );
}

/* ─── Tooltip ─── */
function DotTooltipContent({ job, zone }: { job: JobMatchDot; zone: "ready" | "fast-track" | "growth" }) {
  return (
    <div className="rounded-lg border border-border/50 bg-background px-3 py-2 shadow-xl text-xs max-w-[200px] pointer-events-none">
      <p className="font-semibold text-foreground truncate">{job.title}</p>
      <p className="text-[10px] text-muted-foreground">{job.company} · {job.dept}</p>
      <div className="flex gap-3 mt-1.5">
        <span className="text-muted-foreground">Skills: <strong className="text-foreground">{job.humanMatch}%</strong></span>
        <span className="text-muted-foreground">+AI: <strong className="text-primary">{job.aiBoostMatch}%</strong></span>
      </div>
      <Badge variant="outline" className={`mt-1.5 text-[9px] ${
        zone === "ready" ? "border-brand-human/40 text-brand-human" :
        zone === "fast-track" ? "border-primary/40 text-primary" :
        "border-brand-ai/40 text-brand-ai"
      }`}>
        {zone === "ready" ? "Ready Now" : zone === "fast-track" ? "AI Fast-Track" : "Growth Path"}
      </Badge>
    </div>
  );
}

/* ─── Main Component ─── */
export default function CareerReachMap({ jobMatches, isEmpty, leverageSkills = [] }: CareerReachMapProps) {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<JobMatchDot | null>(null);
  const [hovered, setHovered] = useState<PlacedDot | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const SIZE = 520;
  const CX = SIZE / 2;
  const CY = SIZE / 2;
  const MAX_R = SIZE / 2 - 28;

  const placed = useMemo(() => placeDots(jobMatches, CX, CY, MAX_R), [jobMatches, CX, CY, MAX_R]);

  const zoneCounts = useMemo(() => {
    const c = { ready: 0, "fast-track": 0, growth: 0 };
    for (const d of placed) c[d.zone]++;
    return c;
  }, [placed]);

  const rings = [
    { r: MAX_R * 0.25, label: "80%+" },
    { r: MAX_R * 0.50, label: "60%" },
    { r: MAX_R * 0.75, label: "40%" },
    { r: MAX_R, label: "20%" },
  ];

  // Find the best skill to practice for a selected role
  const bestSkillForRole = useMemo(() => {
    if (!selected) return null;
    const gapNames = new Set(selected.gapSkills.map(g => g.name));
    return leverageSkills.find(s => gapNames.has(s.skillName)) || null;
  }, [selected, leverageSkills]);

  const goToRole = useCallback((title: string, company?: string | null) => {
    const params = new URLSearchParams({ title });
    if (company) params.set("company", company);
    navigate(`/analysis?${params.toString()}`);
  }, [navigate]);

  const practiceSkill = useCallback((skill: SkillLeverage) => {
    if (skill.bestTask) {
      const params = new URLSearchParams({ title: skill.bestTask.jobTitle });
      if (skill.bestTask.company) params.set("company", skill.bestTask.company);
      navigate(`/analysis?${params.toString()}`);
    }
  }, [navigate]);

  if (isEmpty) return null;

  return (
    <div className="space-y-4">
      {/* ── Suggested Next Skills ── */}
      {leverageSkills.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Suggested Next</h3>
            <span className="text-[10px] text-muted-foreground">— highest-leverage skills to practice</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {leverageSkills.slice(0, 3).map((skill, i) => (
              <SuggestedSkillCard key={skill.skillId} skill={skill} index={i} onPractice={practiceSkill} />
            ))}
          </div>
        </div>
      )}

      {/* ── Zone legend pills ── */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { key: "ready" as const, label: "Ready Now", count: zoneCounts.ready, color: "bg-brand-human", textColor: "text-brand-human" },
          { key: "fast-track" as const, label: "AI Fast-Track", count: zoneCounts["fast-track"], color: "bg-primary", textColor: "text-primary" },
          { key: "growth" as const, label: "Growth Path", count: zoneCounts.growth, color: "bg-brand-ai", textColor: "text-brand-ai" },
        ].map(z => (
          <div key={z.key} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border/40 bg-card text-xs">
            <span className={`w-2 h-2 rounded-full ${z.color}`} />
            <span className="text-muted-foreground">{z.label}</span>
            <span className={`font-bold ${z.textColor}`}>{z.count}</span>
          </div>
        ))}
        <span className="text-[10px] text-muted-foreground ml-auto">{jobMatches.length} roles</span>
      </div>

      {/* ── Bullseye SVG ── */}
      <div className="rounded-xl border border-border/40 bg-card p-3 sm:p-4 relative">
        <svg ref={svgRef} viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full max-w-[520px] mx-auto" style={{ aspectRatio: "1" }}>
          {rings.map((ring, i) => (
            <circle key={i} cx={CX} cy={CY} r={ring.r} fill="none" stroke="hsl(var(--border) / 0.2)" strokeWidth={1} strokeDasharray="4 4" />
          ))}
          <circle cx={CX} cy={CY} r={MAX_R} fill="hsl(var(--brand-ai) / 0.03)" />
          <circle cx={CX} cy={CY} r={MAX_R * 0.5} fill="hsl(var(--primary) / 0.04)" />
          <circle cx={CX} cy={CY} r={MAX_R * 0.25} fill="hsl(var(--brand-human) / 0.06)" />
          <circle cx={CX} cy={CY} r={MAX_R * 0.42} fill="none" stroke="hsl(var(--brand-human) / 0.25)" strokeWidth={1.5} strokeDasharray="6 4" />
          {rings.map((ring, i) => (
            <text key={i} x={CX + ring.r - 4} y={CY - 4} fill="hsl(var(--muted-foreground) / 0.4)" fontSize={8} textAnchor="end">{ring.label}</text>
          ))}
          <circle cx={CX} cy={CY} r={10} fill="hsl(var(--foreground))" fillOpacity={0.9} />
          <text x={CX} y={CY + 3.5} textAnchor="middle" fill="hsl(var(--background))" fontSize={7} fontWeight="bold">YOU</text>
          {placed.map((dot, i) => {
            const isSelected = selected?.title === dot.job.title && selected?.company === dot.job.company;
            const isHovered = hovered === dot;
            return (
              <motion.circle
                key={`${dot.job.title}-${dot.job.company}-${i}`}
                cx={dot.x} cy={dot.y}
                r={isSelected || isHovered ? dot.r + 2 : dot.r}
                fill={zoneColor(dot.zone)}
                fillOpacity={isSelected ? 1 : isHovered ? 0.9 : 0.6}
                stroke={isSelected ? "hsl(var(--foreground))" : isHovered ? "hsl(var(--foreground) / 0.5)" : "transparent"}
                strokeWidth={isSelected ? 2 : isHovered ? 1.5 : 0}
                className="cursor-pointer transition-all duration-150"
                onClick={() => setSelected(dot.job)}
                onMouseEnter={() => setHovered(dot)}
                onMouseLeave={() => setHovered(null)}
                initial={{ cx: CX, cy: CY, r: 0, opacity: 0 }}
                animate={{ cx: dot.x, cy: dot.y, r: isSelected || isHovered ? dot.r + 2 : dot.r, opacity: 1 }}
                transition={{ duration: 0.5, delay: i * 0.008, ease: "easeOut" }}
              />
            );
          })}
        </svg>
        {hovered && (
          <div className="absolute z-10" style={{ left: `${(hovered.x / SIZE) * 100}%`, top: `${(hovered.y / SIZE) * 100 - 12}%`, transform: "translate(-50%, -100%)" }}>
            <DotTooltipContent job={hovered.job} zone={hovered.zone} />
          </div>
        )}
        <p className="text-[10px] text-muted-foreground text-center mt-2">
          Closer to center = stronger match · Click any dot to explore
        </p>
      </div>

      {/* ── Slide-out Role Detail Panel (Skill-first) ── */}
      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          {selected && (
            <>
              <SheetHeader className="pb-4">
                <SheetTitle className="text-base">{selected.title}</SheetTitle>
                <SheetDescription className="text-xs">
                  {selected.company} · {selected.dept}
                </SheetDescription>
              </SheetHeader>

              {/* Match gauge */}
              <div className="space-y-3 mb-5">
                <div className="flex gap-3">
                  <div className="flex-1 rounded-xl border border-border/40 bg-card p-3 text-center">
                    <p className="text-xl font-bold text-brand-human">{selected.humanMatch}%</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Skill Match</p>
                  </div>
                  <div className="flex-1 rounded-xl border border-primary/20 bg-primary/5 p-3 text-center">
                    <p className="text-xl font-bold text-primary">{selected.aiBoostMatch}%</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">With AI</p>
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[10px] text-muted-foreground">You</span>
                    <div className="flex-1" />
                    <span className="text-[10px] text-muted-foreground">You + AI</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-muted/40 overflow-hidden">
                    <div className="h-full rounded-full relative" style={{ width: `${selected.aiBoostMatch}%` }}>
                      <div className="absolute inset-0 rounded-full bg-brand-human/40" style={{ width: `${(selected.humanMatch / Math.max(selected.aiBoostMatch, 1)) * 100}%` }} />
                      <div className="absolute inset-0 rounded-full bg-primary/40" style={{ left: `${(selected.humanMatch / Math.max(selected.aiBoostMatch, 1)) * 100}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* ★ Best skill to practice — the key CTA */}
              {bestSkillForRole && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-xl border-2 border-primary/30 bg-primary/5 p-4 mb-5"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-4 w-4 text-primary" />
                    <span className="text-xs font-semibold text-foreground">Fastest way to close the gap</span>
                  </div>
                  <p className="text-sm font-medium text-foreground mb-1">{bestSkillForRole.skillName}</p>
                  <p className="text-[10px] text-muted-foreground mb-2">
                    Also moves {bestSkillForRole.dotsAffected - 1} other role{bestSkillForRole.dotsAffected > 2 ? "s" : ""} closer
                  </p>
                  {bestSkillForRole.bestTask && (
                    <Button
                      onClick={() => practiceSkill(bestSkillForRole)}
                      className="w-full gap-1.5"
                      size="sm"
                    >
                      <Play className="h-3.5 w-3.5" />
                      Practice: {bestSkillForRole.bestTask.taskName}
                    </Button>
                  )}
                  {bestSkillForRole.humanEdge && (
                    <p className="text-[9px] text-muted-foreground mt-2 flex items-center gap-1">
                      <ArrowUpRight className="h-3 w-3" /> Human edge: {bestSkillForRole.humanEdge}
                    </p>
                  )}
                </motion.div>
              )}

              {/* Matched skills */}
              {selected.matchedSkills.length > 0 && (
                <div className="mb-5">
                  <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Shield className="h-3 w-3 text-brand-human" /> Your Strengths ({selected.matchedSkills.length})
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {selected.matchedSkills.map((s, i) => (
                      <Badge key={i} variant="outline" className="text-[9px] border-brand-human/30 text-brand-human">{s}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* AI bridges */}
              {selected.aiCoveredGaps.length > 0 && (
                <div className="mb-5">
                  <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Bot className="h-3 w-3 text-primary" /> AI Bridges the Gap ({selected.aiCoveredGaps.length})
                  </h4>
                  <div className="space-y-1.5">
                    {selected.aiCoveredGaps.map((gap, i) => (
                      <div key={i} className="flex items-start gap-2 p-2 rounded-md bg-primary/5 border border-primary/10">
                        <Bot className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[11px] font-medium text-foreground">{gap.name}</p>
                          <p className="text-[10px] text-primary/80">{gap.aiEnabler}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Remaining gaps — now actionable */}
              {selected.gapSkills.filter(g => !selected.aiCoveredGaps.find(a => a.name === g.name)).length > 0 && (
                <div className="mb-5">
                  <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Target className="h-3 w-3 text-brand-ai" /> Skills to Build
                  </h4>
                  <div className="space-y-1.5">
                    {selected.gapSkills
                      .filter(g => !selected.aiCoveredGaps.find(a => a.name === g.name))
                      .map((gap, i) => {
                        const leverage = leverageSkills.find(s => s.skillName === gap.name);
                        return (
                          <div key={i} className="flex items-center gap-2 p-2 rounded-md bg-brand-ai/5 border border-brand-ai/10">
                            <div className="min-w-0 flex-1">
                              <p className="text-[11px] font-medium text-foreground">{gap.name}</p>
                              {leverage && (
                                <p className="text-[9px] text-primary/70 flex items-center gap-0.5">
                                  <Sparkles className="h-2.5 w-2.5" />
                                  Moves {leverage.dotsAffected} role{leverage.dotsAffected !== 1 ? "s" : ""} closer
                                </p>
                              )}
                              {gap.humanEdge && <p className="text-[10px] text-muted-foreground">{gap.humanEdge}</p>}
                            </div>
                            <span className="text-[9px] text-muted-foreground shrink-0">{gap.aiExposure}% AI</span>
                          </div>
                        );
                      })
                    }
                  </div>
                </div>
              )}

              {/* CTA footer */}
              <div className="space-y-2 pt-2 border-t border-border/30">
                <Button onClick={() => goToRole(selected.title, selected.company)} variant="outline" className="w-full gap-1.5" size="sm">
                  Full Analysis <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

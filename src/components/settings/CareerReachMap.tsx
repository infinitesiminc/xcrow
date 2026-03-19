/**
 * Career Reach Map — Bullseye target visualization.
 *
 * You at center. Jobs placed on concentric rings by aiBoostMatch distance.
 * Closest to center = best match. Colored by zone.
 * Click dot → slide-out panel with gap analysis + CTA.
 */
import { useState, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight, Bot, Play, ArrowUpRight,
  Target, Shield,
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

interface CareerReachMapProps {
  jobMatches: JobMatchDot[];
  isEmpty: boolean;
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

function zoneRingColor(zone: "ready" | "fast-track" | "growth") {
  switch (zone) {
    case "ready":      return "hsl(var(--brand-human) / 0.12)";
    case "fast-track": return "hsl(var(--primary) / 0.08)";
    case "growth":     return "hsl(var(--brand-ai) / 0.06)";
  }
}

/* ─── Position jobs on bullseye ─── */
interface PlacedDot {
  x: number;
  y: number;
  r: number;
  job: JobMatchDot;
  zone: "ready" | "fast-track" | "growth";
}

function placeDots(jobs: JobMatchDot[], cx: number, cy: number, maxRadius: number): PlacedDot[] {
  // Distance from center = inverse of aiBoostMatch (100% = center, 0% = edge)
  // Use golden angle for even angular distribution
  const golden = Math.PI * (3 - Math.sqrt(5));
  const sorted = [...jobs].sort((a, b) => b.aiBoostMatch - a.aiBoostMatch);

  return sorted.map((job, i) => {
    const matchScore = Math.max(job.humanMatch, job.aiBoostMatch);
    // Map match to distance: 100% match → 0 distance, 0% → maxRadius
    const dist = maxRadius * (1 - matchScore / 100) * 0.85 + maxRadius * 0.08;
    // Golden angle distribution with slight randomness for visual variety
    const angle = i * golden + (i % 3) * 0.15;
    const zone = getZone(job.humanMatch, job.aiBoostMatch);
    const dotR = zone === "ready" ? 5 : zone === "fast-track" ? 4.5 : 4;

    return {
      x: cx + Math.cos(angle) * dist,
      y: cy + Math.sin(angle) * dist,
      r: dotR,
      job,
      zone,
    };
  });
}

/* ─── Tooltip component ─── */
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
export default function CareerReachMap({ jobMatches, isEmpty }: CareerReachMapProps) {
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

  // Ring thresholds (distance from center → match %)
  // Ring 1 (innermost): 80-100% = Ready
  // Ring 2: 60-80% = Fast-Track
  // Ring 3 (outermost): 0-60% = Growth
  const rings = [
    { r: MAX_R * 0.25, fill: zoneRingColor("ready"), label: "80%+" },
    { r: MAX_R * 0.50, fill: zoneRingColor("fast-track"), label: "60%" },
    { r: MAX_R * 0.75, fill: zoneRingColor("growth"), label: "40%" },
    { r: MAX_R, fill: "hsl(var(--muted) / 0.08)", label: "20%" },
  ];

  const goToRole = useCallback((title: string, company?: string | null) => {
    const params = new URLSearchParams({ title });
    if (company) params.set("company", company);
    navigate(`/analysis?${params.toString()}`);
  }, [navigate]);

  if (isEmpty) return null;

  return (
    <div className="space-y-4">
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
        <svg
          ref={svgRef}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="w-full max-w-[420px] mx-auto"
          style={{ aspectRatio: "1" }}
        >
          {/* Concentric rings */}
          {rings.map((ring, i) => (
            <circle
              key={i}
              cx={CX} cy={CY} r={ring.r}
              fill="none"
              stroke="hsl(var(--border) / 0.2)"
              strokeWidth={1}
              strokeDasharray="4 4"
            />
          ))}

          {/* Zone fills (outermost first) */}
          <circle cx={CX} cy={CY} r={MAX_R} fill="hsl(var(--brand-ai) / 0.03)" />
          <circle cx={CX} cy={CY} r={MAX_R * 0.5} fill="hsl(var(--primary) / 0.04)" />
          <circle cx={CX} cy={CY} r={MAX_R * 0.25} fill="hsl(var(--brand-human) / 0.06)" />

          {/* 60% threshold ring */}
          <circle
            cx={CX} cy={CY} r={MAX_R * 0.42}
            fill="none"
            stroke="hsl(var(--brand-human) / 0.25)"
            strokeWidth={1.5}
            strokeDasharray="6 4"
          />

          {/* Ring labels */}
          {rings.map((ring, i) => (
            <text
              key={i}
              x={CX + ring.r - 4}
              y={CY - 4}
              fill="hsl(var(--muted-foreground) / 0.4)"
              fontSize={8}
              textAnchor="end"
            >
              {ring.label}
            </text>
          ))}

          {/* Center "YOU" marker */}
          <circle cx={CX} cy={CY} r={8} fill="hsl(var(--foreground))" fillOpacity={0.9} />
          <text x={CX} y={CY + 3} textAnchor="middle" fill="hsl(var(--background))" fontSize={6} fontWeight="bold">
            YOU
          </text>

          {/* Job dots */}
          {placed.map((dot, i) => {
            const isSelected = selected?.title === dot.job.title && selected?.company === dot.job.company;
            const isHovered = hovered === dot;
            return (
              <motion.circle
                key={`${dot.job.title}-${dot.job.company}-${i}`}
                cx={dot.x}
                cy={dot.y}
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

        {/* Hover tooltip */}
        {hovered && (
          <div
            className="absolute z-10"
            style={{
              left: `${((hovered.x / SIZE) * 100)}%`,
              top: `${((hovered.y / SIZE) * 100) - 12}%`,
              transform: "translate(-50%, -100%)",
            }}
          >
            <DotTooltipContent job={hovered.job} zone={hovered.zone} />
          </div>
        )}

        <p className="text-[10px] text-muted-foreground text-center mt-2">
          Closer to center = stronger match · Click any dot to explore
        </p>
      </div>

      {/* ── Slide-out Role Detail Panel ── */}
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
              <div className="space-y-3 mb-6">
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

                {/* Stacked bar */}
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

              {/* Remaining gaps */}
              {selected.gapSkills.filter(g => !selected.aiCoveredGaps.find(a => a.name === g.name)).length > 0 && (
                <div className="mb-5">
                  <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Target className="h-3 w-3 text-brand-ai" /> Skills to Build
                  </h4>
                  <div className="space-y-1.5">
                    {selected.gapSkills
                      .filter(g => !selected.aiCoveredGaps.find(a => a.name === g.name))
                      .map((gap, i) => (
                        <div key={i} className="flex items-center gap-2 p-2 rounded-md bg-brand-ai/5 border border-brand-ai/10">
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-medium text-foreground">{gap.name}</p>
                            {gap.humanEdge && <p className="text-[10px] text-muted-foreground">{gap.humanEdge}</p>}
                          </div>
                          <span className="text-[9px] text-muted-foreground shrink-0">{gap.aiExposure}% AI</span>
                        </div>
                      ))
                    }
                  </div>
                </div>
              )}

              {/* Human edges to develop */}
              {selected.newEdges.length > 0 && (
                <div className="mb-5">
                  <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <ArrowUpRight className="h-3 w-3 text-brand-mid" /> Human Edges to Develop
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {selected.newEdges.map((edge, i) => (
                      <Badge key={i} variant="outline" className="text-[9px] border-brand-mid/30 text-brand-mid">{edge}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* CTA */}
              <div className="space-y-2 pt-2 border-t border-border/30">
                <Button
                  onClick={() => goToRole(selected.title, selected.company)}
                  className="w-full gap-1.5"
                  size="sm"
                >
                  <Play className="h-3.5 w-3.5" /> Start Practicing
                </Button>
                <Button
                  variant="outline"
                  onClick={() => goToRole(selected.title, selected.company)}
                  className="w-full gap-1.5"
                  size="sm"
                >
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

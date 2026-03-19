/**
 * Career Reach Map — unified scatter chart replacing the 5-step journey.
 *
 * X-axis = Human Skill Match %
 * Y-axis = AI Fast-Track Potential (aiBoostMatch - humanMatch)
 * Dots = job roles from computed matches
 * Zones: Ready Now (right), AI Fast-Track (top-left), Growth Path (bottom-left)
 * Click dot → slide-out panel with gap analysis + CTA
 */
import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  ResponsiveContainer, Cell, Tooltip as RechartsTooltip,
  ReferenceArea, ReferenceLine,
} from "recharts";
import {
  ArrowRight, Bot, X, Play, ArrowUpRight, Briefcase,
  Sparkles, Target, Unlock, Bookmark, Shield,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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
function getZone(humanMatch: number, aiBoost: number): "ready" | "fast-track" | "growth" {
  if (humanMatch >= 60) return "ready";
  if (humanMatch + aiBoost >= 60) return "fast-track";
  return "growth";
}

function zoneDotColor(zone: "ready" | "fast-track" | "growth") {
  switch (zone) {
    case "ready":      return "hsl(var(--brand-human))";
    case "fast-track": return "hsl(var(--primary))";
    case "growth":     return "hsl(var(--brand-ai))";
  }
}

/* ─── Custom tooltip ─── */
function DotTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as JobMatchDot & { aiBoost: number };
  const zone = getZone(d.humanMatch, d.aiBoost);
  return (
    <div className="rounded-lg border border-border/50 bg-background px-3 py-2 shadow-xl text-xs max-w-[200px]">
      <p className="font-semibold text-foreground truncate">{d.title}</p>
      <p className="text-[10px] text-muted-foreground">{d.company} · {d.dept}</p>
      <div className="flex gap-3 mt-1.5">
        <span className="text-muted-foreground">Skills: <strong className="text-foreground">{d.humanMatch}%</strong></span>
        <span className="text-muted-foreground">AI+: <strong className="text-primary">+{d.aiBoost}%</strong></span>
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
  const [selected, setSelected] = useState<(JobMatchDot & { aiBoost: number }) | null>(null);

  // Compute chart data
  const chartData = useMemo(() =>
    jobMatches.map(j => ({
      ...j,
      aiBoost: j.aiBoostMatch - j.humanMatch,
    })),
    [jobMatches]
  );

  // Zone counts
  const zoneCounts = useMemo(() => {
    const c = { ready: 0, "fast-track": 0, growth: 0 };
    for (const d of chartData) c[getZone(d.humanMatch, d.aiBoost)]++;
    return c;
  }, [chartData]);

  const goToRole = useCallback((title: string, company?: string | null) => {
    const params = new URLSearchParams({ title });
    if (company) params.set("company", company);
    navigate(`/analysis?${params.toString()}`);
  }, [navigate]);

  const handleDotClick = useCallback((data: any) => {
    if (data?.payload) setSelected(data.payload);
  }, []);

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
      </div>

      {/* ── Scatter Chart ── */}
      <div className="rounded-xl border border-border/40 bg-card p-3 sm:p-4">
        <ResponsiveContainer width="100%" height={380}>
          <ScatterChart margin={{ top: 10, right: 16, bottom: 32, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.3)" />
            
            {/* Zone backgrounds */}
            <ReferenceArea x1={60} x2={100} y1={0} y2={50} fill="hsl(var(--brand-human) / 0.04)" />
            <ReferenceArea x1={0} x2={60} y1={20} y2={50} fill="hsl(var(--primary) / 0.04)" />
            
            {/* Threshold line */}
            <ReferenceLine x={60} stroke="hsl(var(--brand-human) / 0.3)" strokeDasharray="6 4" label={{ value: "60% ready", position: "top", fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />

            <XAxis
              dataKey="humanMatch"
              type="number"
              domain={[0, 100]}
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              label={{ value: "Your Skill Match %", position: "bottom", offset: 16, fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis
              dataKey="aiBoost"
              type="number"
              domain={[0, 50]}
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              label={{ value: "AI Boost %", angle: -90, position: "insideLeft", offset: 4, fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              width={48}
            />
            <RechartsTooltip content={<DotTooltip />} cursor={false} />
            <Scatter
              data={chartData}
              onClick={handleDotClick}
              cursor="pointer"
            >
              {chartData.map((d, i) => (
                <Cell
                  key={i}
                  fill={zoneDotColor(getZone(d.humanMatch, d.aiBoost))}
                  fillOpacity={0.75}
                  r={selected?.title === d.title ? 8 : 5}
                  stroke={selected?.title === d.title ? "hsl(var(--foreground))" : "transparent"}
                  strokeWidth={selected?.title === d.title ? 2 : 0}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>

        <p className="text-[10px] text-muted-foreground text-center mt-1">
          Click any dot to see your gap analysis and action plan
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

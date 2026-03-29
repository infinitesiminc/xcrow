import { useState, useMemo, useRef } from "react";
import agentLauncherHero from "@/assets/agent-launcher-hero.jpg";
import AgentCardImage from "@/components/AgentCardImage";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, Rocket, ArrowLeft, Loader2, Sparkles, Zap, Lightbulb, Building2, ChevronDown, ChevronUp, Search, Bot, TrendingUp, X, Bookmark, BookmarkCheck, Share2, BarChart3, Cpu, Wand2, ArrowRight, Clock, DollarSign, Users, ArrowRightLeft } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { useVerticalMap, type WhitespaceLabel, type SubVertical, type SubVerticalAgentScore, type VerticalCompany, type VerticalStats } from "@/hooks/use-vertical-map";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";

type Phase = "browse" | "deepdive" | "generating" | "result";

const FACTORY_RESULT_KEY = "sf-master-prompt";
const SAVED_NICHES_KEY = "sf-saved-niches";

interface SavedResult {
  nicheName: string;
  verticalName: string;
  prompt: string;
}

interface SavedNiche {
  key: string;
  name: string;
  verticalName: string;
  agentScore: number;
  agentPlay: string;
  savedAt: string;
}

interface FlatNiche extends SubVertical {
  verticalId: number;
  verticalName: string;
}

function loadResult(): SavedResult | null {
  try {
    const raw = localStorage.getItem(FACTORY_RESULT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function loadSavedNiches(): SavedNiche[] {
  try {
    const raw = localStorage.getItem(SAVED_NICHES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function nicheKey(niche: FlatNiche): string {
  return `${niche.verticalId}-${niche.name}`;
}

function shareNiche(niche: { name: string; verticalName: string; agentScore?: { agent_score: number; agent_play?: string | null } | null }) {
  const score = niche.agentScore?.agent_score ?? 0;
  const text = `🤖 ${niche.name} (${niche.verticalName}) — Agent Score: ${score}/100\n💡 ${niche.agentScore?.agent_play || "AI-native opportunity"}\n\nDiscover more AI startup opportunities:`;
  const url = `${window.location.origin}/agentlauncher`;
  if (navigator.share) {
    navigator.share({ title: `${niche.name} — AI Opportunity`, text, url }).catch(() => {});
  } else {
    navigator.clipboard.writeText(`${text}\n${url}`);
    toast.success("Opportunity link copied!");
  }
}

// Integration pattern classification
type IntegrationPattern = "api-first" | "embedded-widget" | "full-replacement" | "pipeline" | "rpa-bridge" | "messaging-hook";

const INTEGRATION_PATTERNS: Record<IntegrationPattern, { label: string; icon: string; description: string; color: string }> = {
  "api-first": { label: "API-First", icon: "🔌", description: "Connects via webhooks & REST APIs to existing tools", color: "hsl(var(--neon-blue))" },
  "embedded-widget": { label: "Embedded Widget", icon: "🧩", description: "Drop-in component customers add to their existing app", color: "hsl(var(--primary))" },
  "full-replacement": { label: "Full Replacement", icon: "🏗️", description: "Standalone SaaS that replaces the incumbent entirely", color: "hsl(var(--success))" },
  "pipeline": { label: "Scheduled Pipeline", icon: "⏱️", description: "Autonomous cron jobs that run without human intervention", color: "hsl(var(--warning))" },
  "rpa-bridge": { label: "RPA Bridge", icon: "🤖", description: "Automates legacy systems without APIs via browser control", color: "hsl(var(--destructive))" },
  "messaging-hook": { label: "Messaging Hook", icon: "💬", description: "Monitors email, Slack, or support queues and acts autonomously", color: "hsl(var(--filigree))" },
};

function inferIntegrationPattern(niche: { agentScore?: SubVerticalAgentScore | null; whitespace: WhitespaceLabel; companies: VerticalCompany[] }): IntegrationPattern {
  const as = niche.agentScore;
  if (!as) return "api-first";
  const wfNames = as.automatable_workflows.map(w => w.name.toLowerCase()).join(" ");
  const fullAutoRatio = as.automatable_workflows.filter(w => w.automation_level === "full").length / Math.max(as.automatable_workflows.length, 1);
  const incumbentCount = niche.companies.filter(c => c.role === "incumbent").length;

  // Heuristics based on workflow names and market structure
  if (wfNames.includes("email") || wfNames.includes("message") || wfNames.includes("chat") || wfNames.includes("notification") || wfNames.includes("outreach")) return "messaging-hook";
  if (wfNames.includes("schedule") || wfNames.includes("batch") || wfNames.includes("reconcil") || wfNames.includes("monitor") || wfNames.includes("scan")) return "pipeline";
  if (wfNames.includes("embed") || wfNames.includes("widget") || wfNames.includes("plugin")) return "embedded-widget";
  if (wfNames.includes("legacy") || wfNames.includes("migrat")) return "rpa-bridge";
  if (fullAutoRatio >= 0.7 && incumbentCount >= 3) return "full-replacement";
  if (fullAutoRatio >= 0.5 && as.agent_score >= 75) return "full-replacement";
  return "api-first";
}

const whitespaceColor: Record<WhitespaceLabel, string> = {
  open: "text-emerald-400 border-emerald-400/40 bg-emerald-400/10",
  "low-competition": "text-amber-400 border-amber-400/40 bg-amber-400/10",
  crowded: "text-muted-foreground border-border/40 bg-muted/20",
};
const whitespaceLabel: Record<WhitespaceLabel, string> = { open: "Open", "low-competition": "Low Competition", crowded: "Crowded" };

export default function Disrupt() {
  const isMobile = useIsMobile();
  const { data: verticalStats, isLoading } = useVerticalMap();
  const saved = loadResult();
  const [phase, setPhase] = useState<Phase>(saved ? "result" : "browse");
  const [selectedNiche, setSelectedNiche] = useState<FlatNiche | null>(null);
  const [masterPrompt, setMasterPrompt] = useState(saved?.prompt || "");
  const [savedNiche, setSavedNiche] = useState(saved?.nicheName || "");
  const [savedVertical, setSavedVertical] = useState(saved?.verticalName || "");
  const [isStreaming, setIsStreaming] = useState(false);
  const [copied, setCopied] = useState(false);
  const [search, setSearch] = useState("");
  const [verticalFilter, setVerticalFilter] = useState<number | null>(null);
  const [minScore, setMinScore] = useState(50);
  const [savedNiches, setSavedNiches] = useState<SavedNiche[]>(loadSavedNiches);
  const abortRef = useRef<AbortController | null>(null);
  const [showChart, setShowChart] = useState(false);

  const toggleSave = (niche: FlatNiche, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const key = nicheKey(niche);
    setSavedNiches(prev => {
      const exists = prev.some(s => s.key === key);
      const next = exists
        ? prev.filter(s => s.key !== key)
        : [...prev, { key, name: niche.name, verticalName: niche.verticalName, agentScore: niche.agentScore?.agent_score || 0, agentPlay: niche.agentScore?.agent_play || "", savedAt: new Date().toISOString() }];
      localStorage.setItem(SAVED_NICHES_KEY, JSON.stringify(next));
      toast.success(exists ? "Removed from saved" : "Saved opportunity!");
      return next;
    });
  };

  const isNicheSaved = (niche: FlatNiche) => savedNiches.some(s => s.key === nicheKey(niche));

  // Flatten all sub-verticals into a single ranked list
  const allNiches = useMemo<FlatNiche[]>(() => {
    if (!verticalStats) return [];
    const niches: FlatNiche[] = [];
    for (const v of verticalStats) {
      for (const sv of v.sub_verticals) {
        if (sv.agentScore) {
          niches.push({ ...sv, verticalId: v.id, verticalName: v.name });
        }
      }
    }
    // Sort by agent score descending
    return niches.sort((a, b) => (b.agentScore?.agent_score || 0) - (a.agentScore?.agent_score || 0));
  }, [verticalStats]);

  // Filter niches
  const filteredNiches = useMemo(() => {
    let result = allNiches;
    if (verticalFilter !== null) result = result.filter(n => n.verticalId === verticalFilter);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(n =>
        n.name.toLowerCase().includes(q) ||
        n.verticalName.toLowerCase().includes(q) ||
        n.agentScore?.agent_play?.toLowerCase().includes(q) ||
        n.agentScore?.automatable_workflows.some(w => w.name.toLowerCase().includes(q))
      );
    }
    if (minScore > 0) result = result.filter(n => (n.agentScore?.agent_score || 0) >= minScore);
    return result;
  }, [allNiches, verticalFilter, search, minScore]);

  // Get unique verticals for filter
  const verticals = useMemo(() => {
    if (!verticalStats) return [];
    return verticalStats
      .filter(v => v.sub_verticals.some(sv => sv.agentScore))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [verticalStats]);

  // Aggregate agent scores per vertical for chart
  const verticalScoreData = useMemo(() => {
    if (!verticalStats) return [];
    return verticalStats
      .filter(v => {
        const scored = v.sub_verticals.filter(sv => sv.agentScore);
        return scored.length >= 3;
      })
      .map(v => {
        const scored = v.sub_verticals.filter(sv => sv.agentScore);
        const avg = scored.length ? Math.round(scored.reduce((s, sv) => s + (sv.agentScore?.agent_score || 0), 0) / scored.length) : 0;
        const max = scored.length ? Math.max(...scored.map(sv => sv.agentScore?.agent_score || 0)) : 0;
        const highPotential = scored.filter(sv => (sv.agentScore?.agent_score || 0) >= 80).length;
        return { name: v.name, avg, max, count: scored.length, highPotential, id: v.id };
      })
      .sort((a, b) => b.avg - a.avg);
  }, [verticalStats]);

  const openDeepDive = (niche: FlatNiche) => {
    setSelectedNiche(niche);
    setPhase("deepdive");
  };

  const confirmGenerate = async () => {
    if (!selectedNiche?.agentScore) return;
    const niche = selectedNiche;
    setPhase("generating");
    setMasterPrompt("");
    setIsStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/disruption-battle`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
          body: JSON.stringify({
            action: "niche-prompt",
            payload: {
              niche: {
                name: niche.name,
                verticalName: niche.verticalName,
                agentPlay: niche.agentScore?.agent_play,
                agentScore: niche.agentScore?.agent_score,
                agentVerdict: niche.agentScore?.agent_verdict,
                workflows: niche.agentScore?.automatable_workflows || [],
                workflowTypes: niche.agentScore?.workflow_types || [],
                whitespace: niche.whitespace,
                incumbents: niche.companies.filter(c => c.role === "incumbent").map(c => c.name),
                disruptors: niche.companies.filter(c => c.role === "disruptor").map(c => c.name),
              },
            },
          }),
          signal: controller.signal,
        },
      );
      if (!resp.ok || !resp.body) throw new Error("Generation failed");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, nl);
          buffer = buffer.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") break;
          try {
            const parsed = JSON.parse(json);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullText += content;
              setMasterPrompt(fullText);
            }
          } catch { /* partial */ }
        }
      }

      setPhase("result");
      setSavedNiche(niche.name);
      setSavedVertical(niche.verticalName);
      localStorage.setItem(FACTORY_RESULT_KEY, JSON.stringify({
        nicheName: niche.name,
        verticalName: niche.verticalName,
        prompt: fullText,
      }));
    } catch (e: any) {
      if (e.name !== "AbortError") {
        toast.error("Failed to generate. Try again.");
        setPhase("deepdive");
      }
    } finally {
      setIsStreaming(false);
    }
  };

  const restart = () => {
    localStorage.removeItem(FACTORY_RESULT_KEY);
    setPhase("browse");
    setMasterPrompt("");
    setSelectedNiche(null);
    setSavedNiche("");
    setSavedVertical("");
  };

  const copyPrompt = () => {
    navigator.clipboard.writeText(masterPrompt);
    setCopied(true);
    toast.success("Master prompt copied — paste it into Lovable or Cursor to start building!");
    setTimeout(() => setCopied(false), 2000);
  };

  // Score color
  const scoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-400";
    if (score >= 60) return "text-amber-400";
    return "text-muted-foreground";
  };

  const scoreBg = (score: number) => {
    if (score >= 80) return "bg-emerald-500/10 border-emerald-500/30";
    if (score >= 60) return "bg-amber-500/10 border-amber-500/30";
    return "bg-muted/20 border-border/30";
  };

  // Synthesize whitespace + agent score into a confidence signal
  const opportunitySignal = (whitespace: WhitespaceLabel, agentScore: number): { label: string; color: string } => {
    if (agentScore >= 80) return { label: "High Potential", color: "text-emerald-400 border-emerald-400/40 bg-emerald-400/10" };
    if (agentScore >= 60) {
      if (whitespace === "open") return { label: "Open Market", color: "text-emerald-400 border-emerald-400/40 bg-emerald-400/10" };
      if (whitespace === "low-competition") return { label: "Emerging", color: "text-amber-400 border-amber-400/40 bg-amber-400/10" };
      return { label: "Competitive", color: "text-amber-400 border-amber-400/40 bg-amber-400/10" };
    }
    if (whitespace === "open") return { label: "Open Market", color: "text-emerald-400 border-emerald-400/40 bg-emerald-400/10" };
    if (whitespace === "low-competition") return { label: "Low Competition", color: "text-amber-400 border-amber-400/40 bg-amber-400/10" };
    return { label: "Saturated", color: "text-muted-foreground border-border/40 bg-muted/20" };
  };

  // ── BROWSE + SLIDE-IN PANEL ──
  return (
    <>
      <Helmet>
        <title>{phase === "generating" ? "Generating…" : phase === "result" ? `${savedNiche} — Master Prompt` : "Agent Launcher — Build AI Agents with One Prompt"} | Xcrow</title>
        <meta name="description" content="Pick a software niche. Get one AI-generated builder prompt. Paste it into any AI coding tool and ship your MVP — no co-founder needed." />
      </Helmet>
        <Navbar />
        <div className="min-h-screen pt-20" style={{ background: "hsl(var(--background))" }}>
          {/* ── Hero Banner with background image ── */}
          <div className="relative text-center px-4 pt-10 pb-10 max-w-full mx-auto overflow-hidden">
            {/* Background image */}
            <div className="absolute inset-0">
              <img
                src={agentLauncherHero}
                alt=""
                className="w-full h-full object-cover object-top"
                width={1920}
                height={768}
              />
              {/* Gradient fade to background */}
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(to bottom, hsl(var(--background) / 0.3) 0%, hsl(var(--background) / 0.5) 40%, hsl(var(--background) / 0.85) 70%, hsl(var(--background)) 100%)`,
                }}
              />
            </div>

            {/* Filigree glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 rounded-full z-10" style={{ background: "linear-gradient(90deg, transparent, hsl(var(--filigree-glow) / 0.6), transparent)" }} />

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="relative z-10 pt-16 pb-4">
              <h1 className="text-3xl md:text-5xl font-bold font-cinzel text-foreground mb-3 tracking-wide drop-shadow-lg">
                Agent Launcher
              </h1>
              <p className="text-base md:text-lg font-cinzel tracking-wide mb-2 drop-shadow-md" style={{ color: "hsl(var(--filigree))" }}>
                One Prompt. One Agent. Ship It.
              </p>
              <p className="text-[13px] text-foreground/80 max-w-lg mx-auto leading-relaxed drop-shadow-sm">
                Pick a high-opportunity niche below. We'll generate a single <span className="font-medium" style={{ color: "hsl(var(--filigree))" }}>Master Builder Prompt</span> — paste it into Lovable, Cursor, or any AI coding tool and launch your agent.
              </p>
            </motion.div>

            {/* Bottom filigree */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-px z-10" style={{ background: "linear-gradient(90deg, transparent, hsl(var(--filigree) / 0.3), transparent)" }} />
          </div>

          {/* ── Filters (styled as parchment bar) ── */}
          <div className="max-w-5xl mx-auto px-4 mb-6">
            <div className="rounded-lg p-3 border" style={{ background: "hsl(var(--surface-stone))", borderColor: "hsl(var(--filigree) / 0.15)" }}>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[200px] max-w-xs">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search niches, workflows…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-8 h-8 text-xs border-border/30"
                    style={{ background: "hsl(var(--background))" }}
                  />
                </div>
                <select
                  value={verticalFilter ?? ""}
                  onChange={e => setVerticalFilter(e.target.value ? Number(e.target.value) : null)}
                  className="h-8 text-xs rounded-md border px-2 text-foreground"
                  style={{ borderColor: "hsl(var(--filigree) / 0.2)", background: "hsl(var(--background))" }}
                >
                  <option value="">All Verticals</option>
                  {verticals.map(v => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-cinzel tracking-wider" style={{ color: "hsl(var(--filigree))" }}>Min Score:</span>
                  {[0, 50, 70, 85].map(s => (
                    <button
                      key={s}
                      onClick={() => setMinScore(s)}
                      className={`px-2.5 py-1 rounded text-[10px] font-medium transition-all border ${
                        minScore === s
                          ? "text-primary-foreground border-primary/50"
                          : "text-muted-foreground hover:text-foreground border-border/30"
                      }`}
                      style={minScore === s ? { background: "hsl(var(--primary))", boxShadow: "0 0 12px hsl(var(--primary) / 0.3)" } : { background: "hsl(var(--background))" }}
                    >
                      {s === 0 ? "All" : `${s}+`}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-[10px] mt-2 font-cinzel tracking-wider" style={{ color: "hsl(var(--filigree) / 0.6)" }}>
                {filteredNiches.length} opportunities across {new Set(filteredNiches.map(n => n.verticalId)).size} verticals
              </p>
            </div>
          </div>

          {/* ── Agent Score Distribution Chart ── */}
          {!isLoading && verticalScoreData.length > 0 && (
            <div className="max-w-5xl mx-auto px-4 mb-6">
              <button
                onClick={() => setShowChart(v => !v)}
                className="flex items-center gap-2 text-xs font-cinzel tracking-wider mb-2 hover:text-foreground transition-colors"
                style={{ color: "hsl(var(--filigree))" }}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                Agent Score by Vertical
                {showChart ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
              <AnimatePresence>
                {showChart && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <Card className="border" style={{ background: "hsl(var(--surface-stone))", borderColor: "hsl(var(--filigree) / 0.15)" }}>
                      <CardContent className="p-4">
                        <div className="space-y-2.5">
                          {verticalScoreData.map(v => {
                            const barColor = v.avg >= 80 ? "hsl(var(--success))" : v.avg >= 60 ? "hsl(var(--warning))" : "hsl(var(--muted-foreground))";
                            return (
                              <button
                                key={v.id}
                                onClick={() => setVerticalFilter(verticalFilter === v.id ? null : v.id)}
                                className={`w-full text-left group transition-all rounded-md p-1.5 -m-1.5 ${verticalFilter === v.id ? "bg-primary/10" : "hover:bg-muted/20"}`}
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-[11px] font-medium text-foreground truncate max-w-[60%]">{v.name}</span>
                                  <div className="flex items-center gap-2 text-[11px] tabular-nums">
                                    <span style={{ color: barColor }} className="font-semibold">{v.avg}</span>
                                    <span className="text-muted-foreground">avg</span>
                                    <span className="text-muted-foreground">·</span>
                                    <span className="text-foreground/70">{v.max}</span>
                                    <span className="text-muted-foreground">peak</span>
                                    {v.highPotential > 0 && (
                                      <>
                                        <span className="text-muted-foreground">·</span>
                                        <span style={{ color: "hsl(var(--success))" }}>{v.highPotential}</span>
                                        <span className="text-muted-foreground">high</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                                <div className="relative h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(var(--background))" }}>
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${v.avg}%` }}
                                    transition={{ duration: 0.5, delay: 0.05 }}
                                    className="absolute inset-y-0 left-0 rounded-full"
                                    style={{ background: barColor }}
                                  />
                                  {/* Max score marker */}
                                  <div
                                    className="absolute top-0 bottom-0 w-px"
                                    style={{ left: `${v.max}%`, background: "hsl(var(--foreground) / 0.3)" }}
                                  />
                                </div>
                              </button>
                            );
                          })}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-3">
                          Click a vertical to filter · Showing avg and peak agent scores across {verticalScoreData.reduce((s, v) => s + v.count, 0)} niches
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* ── Niche Grid ── */}
          <div className="max-w-6xl mx-auto px-4 pb-16">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="w-6 h-6 animate-spin" style={{ color: "hsl(var(--filigree-glow))" }} />
                <p className="text-xs font-cinzel tracking-wider text-muted-foreground">Loading opportunities…</p>
              </div>
            ) : filteredNiches.length === 0 ? (
              <div className="text-center py-16 text-sm font-cinzel text-muted-foreground">
                No niches match your filters. Try broadening your search.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredNiches.map(niche => {
                  const as = niche.agentScore!;
                  const incumbentCount = niche.companies.filter(c => c.role === "incumbent").length;
                  const disruptorCount = niche.companies.filter(c => c.role === "disruptor").length;
                  const scoreGlow = as.agent_score >= 80 ? "hsl(var(--success) / 0.15)" : as.agent_score >= 60 ? "hsl(var(--warning) / 0.12)" : "transparent";
                  const pattern = inferIntegrationPattern(niche);
                  const patternInfo = INTEGRATION_PATTERNS[pattern];

                  return (
                    <motion.div key={`${niche.verticalId}-${niche.name}`} whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }} className="h-full">
                      <Card
                        className="cursor-pointer border transition-all group h-full flex flex-col overflow-hidden relative"
                        onClick={() => openDeepDive(niche)}
                        style={{
                          background: `linear-gradient(135deg, hsl(var(--card)), hsl(var(--surface-stone)))`,
                          borderColor: "hsl(var(--filigree) / 0.15)",
                          boxShadow: `0 0 20px ${scoreGlow}, inset 0 1px 0 hsl(var(--emboss-light))`,
                        }}
                      >
                        {/* AI-generated hero banner */}
                        <AgentCardImage nicheName={niche.name} verticalName={niche.verticalName} className="h-16 -mb-2 rounded-t-lg" />
                        <CardContent className="p-4 flex flex-col flex-1">
                          {/* Agent avatar row — large icon makes it visually obvious */}
                          <div className="flex items-center gap-3 mb-3">
                            <div
                              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border"
                              style={{
                                background: as.agent_score >= 80
                                  ? "linear-gradient(135deg, hsl(var(--success) / 0.15), hsl(var(--success) / 0.05))"
                                  : as.agent_score >= 60
                                  ? "linear-gradient(135deg, hsl(var(--warning) / 0.15), hsl(var(--warning) / 0.05))"
                                  : "linear-gradient(135deg, hsl(var(--muted) / 0.3), hsl(var(--muted) / 0.1))",
                                borderColor: as.agent_score >= 80
                                  ? "hsl(var(--success) / 0.3)"
                                  : as.agent_score >= 60
                                  ? "hsl(var(--warning) / 0.3)"
                                  : "hsl(var(--border))",
                                boxShadow: as.agent_score >= 80 ? "0 0 12px hsl(var(--success) / 0.2)" : "none",
                              }}
                            >
                              <Bot
                                className="w-6 h-6"
                                style={{
                                  color: as.agent_score >= 80 ? "hsl(var(--success))" : as.agent_score >= 60 ? "hsl(var(--warning))" : "hsl(var(--muted-foreground))",
                                }}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-foreground text-[13px] leading-tight group-hover:text-primary transition-colors line-clamp-1 font-cinzel">
                                {niche.name}
                              </h3>
                              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                <span className="text-[11px]" style={{ color: "hsl(var(--filigree))" }}>{niche.verticalName}</span>
                                {(() => { const sig = opportunitySignal(niche.whitespace, as.agent_score); return (
                                  <Badge variant="outline" className={`text-[11px] h-5 px-1.5 ${sig.color}`}>{sig.label}</Badge>
                                ); })()}
                                <Badge variant="outline" className="text-[10px] h-5 px-1.5" style={{ borderColor: `${patternInfo.color}40`, color: patternInfo.color }}>
                                  {patternInfo.icon} {patternInfo.label}
                                </Badge>
                              </div>
                            </div>
                            <div
                              className="text-2xl font-bold tabular-nums leading-none font-cinzel shrink-0"
                              style={{
                                color: as.agent_score >= 80 ? "hsl(var(--success))" : as.agent_score >= 60 ? "hsl(var(--warning))" : "hsl(var(--muted-foreground))",
                                textShadow: as.agent_score >= 80 ? "0 0 8px hsl(var(--success) / 0.4)" : "none",
                              }}
                            >
                              {as.agent_score}
                            </div>
                          </div>

                          {/* Startup Thesis */}
                          <p className="text-[11px] text-foreground/80 leading-relaxed line-clamp-2 mb-3 min-h-[2.75rem]">
                            <Lightbulb className="w-3 h-3 inline-block mr-1 -mt-0.5" style={{ color: "hsl(var(--filigree))" }} />
                            {as.agent_play || "Emerging opportunity for AI-native disruption"}
                          </p>

                          {/* Automatable workflows */}
                          <div className="flex flex-wrap gap-1 mb-3 min-h-[1.5rem]">
                            {as.automatable_workflows.slice(0, 3).map((wf, i) => (
                              <Badge key={i} variant="outline" className="text-[11px] h-5 px-1.5 flex items-center gap-0.5" style={{
                                borderColor: wf.automation_level === "full" ? "hsl(var(--success) / 0.3)" : wf.automation_level === "partial" ? "hsl(var(--warning) / 0.3)" : "hsl(var(--neon-blue) / 0.3)",
                                color: wf.automation_level === "full" ? "hsl(var(--success))" : wf.automation_level === "partial" ? "hsl(var(--warning))" : "hsl(var(--neon-blue))",
                              }}>
                                {wf.automation_level === "full" ? <Zap className="w-3 h-3" /> : wf.automation_level === "partial" ? <Cpu className="w-3 h-3" /> : <Wand2 className="w-3 h-3" />}
                                {wf.name}
                              </Badge>
                            ))}
                          </div>

                          {/* Build CTA */}
                          <div className="flex items-center gap-1.5 mb-2 px-2.5 py-2 rounded-lg border group-hover:border-primary/30 transition-colors" style={{ background: "hsl(var(--primary) / 0.05)", borderColor: "hsl(var(--primary) / 0.15)" }}>
                            <Wand2 className="w-3.5 h-3.5 shrink-0" style={{ color: "hsl(var(--primary))" }} />
                            <span className="text-[11px] font-medium" style={{ color: "hsl(var(--primary))" }}>
                              Build this agent with one prompt
                            </span>
                            <ArrowRight className="w-3.5 h-3.5 ml-auto shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "hsl(var(--primary))" }} />
                          </div>

                          {/* Footer */}
                          <div className="flex items-center gap-2 text-[11px] border-t pt-2 mt-auto" style={{ borderColor: "hsl(var(--filigree) / 0.1)", color: "hsl(var(--muted-foreground))" }}>
                            <Building2 className="w-3 h-3" />
                            <span>{incumbentCount} incumbents</span>
                            <span>· {disruptorCount} disruptors</span>
                            <div className="flex gap-1 ml-auto">
                              <button
                                onClick={(e) => toggleSave(niche, e)}
                                className="p-1 rounded hover:bg-muted/40 transition-colors"
                                title={isNicheSaved(niche) ? "Remove from saved" : "Save opportunity"}
                              >
                                {isNicheSaved(niche) ? <BookmarkCheck className="w-3.5 h-3.5 text-primary" /> : <Bookmark className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); shareNiche(niche); }}
                                className="p-1 rounded hover:bg-muted/40 transition-colors"
                                title="Share opportunity"
                              >
                                <Share2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Agent Detail Slide-in Panel ── */}
        <AnimatePresence>
          {(phase === "deepdive" || phase === "generating" || phase === "result") && selectedNiche && selectedNiche.agentScore && (() => {
            const niche = selectedNiche;
            const as = niche.agentScore!;
            const hasPrompt = phase === "generating" || phase === "result";
            return (
              <>
                {/* Backdrop */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-40"
                  style={{ background: "hsl(0 0% 0% / 0.6)", backdropFilter: "blur(4px)" }}
                  onClick={hasPrompt ? restart : () => setPhase("browse")}
                />
                {/* Panel */}
                <motion.div
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ type: "spring", damping: 30, stiffness: 300 }}
                  className="fixed top-0 right-0 h-full z-50 w-full max-w-2xl flex flex-col border-l"
                  style={{ background: "hsl(var(--background))", borderColor: "hsl(var(--filigree) / 0.15)" }}
                >
                  {/* Panel header */}
                  <div className="flex items-center gap-3 px-5 py-4 border-b shrink-0" style={{ borderColor: "hsl(var(--filigree) / 0.1)", background: "hsl(var(--surface-stone))" }}>
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border"
                      style={{
                        background: as.agent_score >= 80
                          ? "linear-gradient(135deg, hsl(var(--success) / 0.15), hsl(var(--success) / 0.05))"
                          : as.agent_score >= 60
                          ? "linear-gradient(135deg, hsl(var(--warning) / 0.15), hsl(var(--warning) / 0.05))"
                          : "linear-gradient(135deg, hsl(var(--muted) / 0.3), hsl(var(--muted) / 0.1))",
                        borderColor: as.agent_score >= 80 ? "hsl(var(--success) / 0.3)" : as.agent_score >= 60 ? "hsl(var(--warning) / 0.3)" : "hsl(var(--border))",
                        boxShadow: as.agent_score >= 80 ? "0 0 12px hsl(var(--success) / 0.2)" : "none",
                      }}
                    >
                      <Bot className="w-6 h-6" style={{ color: as.agent_score >= 80 ? "hsl(var(--success))" : as.agent_score >= 60 ? "hsl(var(--warning))" : "hsl(var(--muted-foreground))" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="font-bold font-cinzel text-foreground text-lg leading-tight truncate">{niche.name}</h2>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[12px]" style={{ color: "hsl(var(--filigree))" }}>{niche.verticalName}</span>
                        {(() => { const sig = opportunitySignal(niche.whitespace, as.agent_score); return (
                          <Badge variant="outline" className={`text-[11px] h-5 px-1.5 ${sig.color}`}>{sig.label}</Badge>
                        ); })()}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-3xl font-bold tabular-nums font-cinzel" style={{ color: as.agent_score >= 80 ? "hsl(var(--success))" : as.agent_score >= 60 ? "hsl(var(--warning))" : "hsl(var(--muted-foreground))", textShadow: as.agent_score >= 80 ? "0 0 10px hsl(var(--success) / 0.4)" : "none" }}>
                        {as.agent_score}
                      </div>
                      <p className="text-[11px] font-medium mt-0.5" style={{ color: as.agent_score >= 80 ? "hsl(var(--success))" : as.agent_score >= 60 ? "hsl(var(--warning))" : "hsl(var(--muted-foreground))" }}>
                        {as.agent_score >= 80 ? "High Potential" : as.agent_score >= 60 ? "Emerging" : as.agent_score >= 40 ? "Moderate" : "Challenging"}
                      </p>
                      <Progress value={as.agent_score} className="h-1.5 w-20 mt-1" style={{ background: "hsl(var(--background))" }} />
                    </div>
                    <button
                      onClick={hasPrompt ? restart : () => setPhase("browse")}
                      className="p-2 rounded-lg hover:bg-muted/40 transition-colors ml-1"
                    >
                      <X className="w-5 h-5 text-muted-foreground" />
                    </button>
                  </div>

                  {/* Panel body */}
                  <ScrollArea className="flex-1">
                    <div className="p-5 space-y-4">
                      {/* Agent Landing Page Preview */}
                      {as.agent_play && !hasPrompt && (() => {
                        const workflows = as.automatable_workflows.slice(0, 4);
                        const incumbents = niche.companies.filter(c => c.role === "incumbent").slice(0, 3);
                        const agentName = niche.name.replace(/\s*(Software|Platform|Tools|Solutions|Management)\s*/gi, "").trim();
                        const agentCacheKey = `agent-card-${niche.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "")}`;
                        const heroImgUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/sim-images/${agentCacheKey}.png`;
                        return (
                          <div className="rounded-xl border overflow-hidden" style={{ borderColor: "hsl(var(--filigree) / 0.2)", boxShadow: "0 8px 32px hsl(0 0% 0% / 0.3), 0 0 0 1px hsl(var(--filigree) / 0.05)" }}>
                            {/* Fake browser chrome */}
                            <div className="flex items-center gap-2 px-3 py-2 border-b" style={{ background: "hsl(var(--muted) / 0.3)", borderColor: "hsl(var(--border) / 0.3)" }}>
                              <div className="flex gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ background: "hsl(var(--destructive) / 0.5)" }} />
                                <div className="w-2.5 h-2.5 rounded-full" style={{ background: "hsl(var(--warning) / 0.5)" }} />
                                <div className="w-2.5 h-2.5 rounded-full" style={{ background: "hsl(var(--success) / 0.5)" }} />
                              </div>
                              <div className="flex-1 mx-4 h-5 rounded-md flex items-center px-2 text-[10px] text-muted-foreground" style={{ background: "hsl(var(--background) / 0.5)" }}>
                                🔒 {agentName.toLowerCase().replace(/\s+/g, "")}.ai
                              </div>
                            </div>

                            {/* Landing page content */}
                            <div style={{ background: "linear-gradient(180deg, hsl(var(--background)), hsl(var(--card)))" }}>
                              {/* Hero section with AI image background */}
                              <div className="relative overflow-hidden">
                                <img
                                  src={heroImgUrl}
                                  alt=""
                                  className="absolute inset-0 w-full h-full object-cover"
                                  style={{ opacity: 0.25, filter: "blur(1px) saturate(1.3)" }}
                                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                                />
                                <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, hsl(var(--background) / 0.5) 0%, hsl(var(--background) / 0.85) 70%, hsl(var(--background)) 100%)" }} />
                                <div className="relative px-6 pt-10 pb-8 text-center">
                                  <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] border mb-4" style={{ background: "hsl(var(--primary) / 0.12)", borderColor: "hsl(var(--primary) / 0.25)", color: "hsl(var(--primary))" }}>
                                    <Bot className="w-3 h-3" />
                                    AI-Powered Agent
                                  </div>
                                  <h3 className="text-xl font-bold text-foreground leading-tight mb-2 font-cinzel">
                                    {agentName} on Autopilot
                                  </h3>
                                  <p className="text-[13px] text-muted-foreground leading-relaxed max-w-sm mx-auto mb-6">
                                    {as.agent_play}
                                  </p>
                                  <div className="flex justify-center gap-2">
                                    <div className="px-5 py-2.5 rounded-lg text-[12px] font-semibold text-primary-foreground" style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.8))", boxShadow: "0 4px 14px hsl(var(--primary) / 0.3)" }}>
                                      Start Free Trial →
                                    </div>
                                    <div className="px-5 py-2.5 rounded-lg text-[12px] font-medium border text-foreground/70 backdrop-blur-sm" style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--card) / 0.5)" }}>
                                      Watch Demo
                                    </div>
                                  </div>

                                  {/* Trust strip */}
                                  <div className="flex items-center justify-center gap-4 mt-6 pt-4 border-t" style={{ borderColor: "hsl(var(--filigree) / 0.1)" }}>
                                    {[
                                      { icon: <Users className="w-3 h-3" />, text: "500+ teams" },
                                      { icon: <Zap className="w-3 h-3" />, text: "99.9% uptime" },
                                      { icon: <Clock className="w-3 h-3" />, text: "Setup in 5min" },
                                    ].map((item, i) => (
                                      <div key={i} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                        {item.icon}
                                        {item.text}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>

                              {/* Features / Workflows */}
                              <div className="px-5 pb-5">
                                <p className="text-[10px] font-cinzel uppercase tracking-widest text-center mb-3" style={{ color: "hsl(var(--filigree))" }}>What It Automates</p>
                                <div className="grid grid-cols-2 gap-2">
                                  {workflows.map((wf, i) => (
                                    <div key={i} className="rounded-lg border p-3 flex items-start gap-2.5 transition-colors" style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--border) / 0.5)" }}>
                                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{
                                        background: wf.automation_level === "full" ? "hsl(var(--success) / 0.12)" : wf.automation_level === "partial" ? "hsl(var(--warning) / 0.12)" : "hsl(var(--primary) / 0.12)",
                                        boxShadow: wf.automation_level === "full" ? "0 0 8px hsl(var(--success) / 0.15)" : "none",
                                      }}>
                                        {wf.automation_level === "full" ? <Zap className="w-4 h-4" style={{ color: "hsl(var(--success))" }} /> : wf.automation_level === "partial" ? <Cpu className="w-4 h-4" style={{ color: "hsl(var(--warning))" }} /> : <Wand2 className="w-4 h-4" style={{ color: "hsl(var(--primary))" }} />}
                                      </div>
                                      <div className="min-w-0">
                                        <p className="text-[11px] font-medium text-foreground leading-tight truncate">{wf.name}</p>
                                        <p className="text-[10px] text-muted-foreground mt-0.5 capitalize">{wf.automation_level} automation</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Social proof / Replaces */}
                              {incumbents.length > 0 && (
                                <div className="px-5 pb-5">
                                  <p className="text-[10px] text-center text-muted-foreground mb-2">Replaces legacy tools like</p>
                                  <div className="flex justify-center gap-3">
                                    {incumbents.map(c => (
                                      <div key={c.id} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-[11px] text-foreground/50" style={{ borderColor: "hsl(var(--border) / 0.3)", background: "hsl(var(--muted) / 0.15)" }}>
                                        <Building2 className="w-3 h-3" />
                                        <span className="line-through decoration-destructive/40">{c.name}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Fade overlay hint */}
                              <div className="h-6" style={{ background: "linear-gradient(to bottom, transparent, hsl(var(--card)))" }} />
                            </div>
                          </div>
                        );
                      })()}

                      {/* Market Proof — Why This Score */}
                      {!hasPrompt && (() => {
                        const incumbents = niche.companies.filter(c => c.role === "incumbent");
                        const disruptors = niche.companies.filter(c => c.role === "disruptor");
                        const fullAuto = as.automatable_workflows.filter(wf => wf.automation_level === "full").length;
                        const totalWf = as.automatable_workflows.length;
                        const topIncumbentNames = incumbents.slice(0, 3).map(c => c.name);
                        const topDisruptorNames = disruptors.slice(0, 2).map(c => c.name);

                        const incumbentLine = incumbents.length > 0
                          ? `${incumbents.length} legacy incumbent${incumbents.length > 1 ? "s" : ""} (${topIncumbentNames.join(", ")}${incumbents.length > 3 ? ` +${incumbents.length - 3} more` : ""}) — slow-moving, ripe for unbundling`
                          : "No established incumbents — greenfield market";

                        const disruptorLine = disruptors.length === 0
                          ? "Zero AI-native challengers — market is wide open"
                          : disruptors.length <= 2
                          ? `Only ${disruptors.length} AI challenger${disruptors.length > 1 ? "s" : ""} (${topDisruptorNames.join(", ")}) — still early stage`
                          : `${disruptors.length} disruptors present (${topDisruptorNames.join(", ")} +${disruptors.length - 2} more) — competitive but growing`;

                        const autoLine = totalWf > 0
                          ? `${fullAuto} of ${totalWf} workflows are fully automatable — ${fullAuto >= totalWf * 0.7 ? "strong agent fit" : fullAuto >= totalWf * 0.4 ? "solid automation potential" : "selective automation opportunity"}`
                          : null;

                        const bottomLine = as.agent_score >= 80
                          ? "Large addressable market, minimal AI competition, high automation potential. Strong builder target."
                          : as.agent_score >= 60
                          ? "Growing market with early-stage competition. Good timing for a focused AI agent play."
                          : "Competitive landscape requires a differentiated approach. Focus on underserved workflows.";

                        return (
                          <Card className="border" style={{ background: "hsl(var(--surface-stone))", borderColor: "hsl(var(--filigree) / 0.15)" }}>
                            <CardContent className="p-4">
                              <div className="flex items-center gap-2 mb-3">
                                <BarChart3 className="w-4 h-4" style={{ color: "hsl(var(--filigree))" }} />
                                <p className="text-[11px] font-cinzel font-semibold uppercase tracking-[0.15em]" style={{ color: "hsl(var(--filigree))" }}>
                                  Why {as.agent_score}/100
                                </p>
                              </div>
                              <div className="space-y-2.5">
                                <div className="flex items-start gap-2">
                                  <Building2 className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: "hsl(var(--destructive) / 0.7)" }} />
                                  <p className="text-[12px] text-foreground/80 leading-relaxed">{incumbentLine}</p>
                                </div>
                                <div className="flex items-start gap-2">
                                  <Rocket className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: "hsl(var(--primary))" }} />
                                  <p className="text-[12px] text-foreground/80 leading-relaxed">{disruptorLine}</p>
                                </div>
                                {autoLine && (
                                  <div className="flex items-start gap-2">
                                    <Zap className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: "hsl(var(--success))" }} />
                                    <p className="text-[12px] text-foreground/80 leading-relaxed">{autoLine}</p>
                                  </div>
                                )}
                              </div>
                              <div className="mt-3 pt-2.5 border-t" style={{ borderColor: "hsl(var(--filigree) / 0.1)" }}>
                                <p className="text-[12px] font-medium text-foreground/90 leading-relaxed">
                                  <TrendingUp className="w-3.5 h-3.5 inline-block mr-1.5 -mt-0.5" style={{ color: as.agent_score >= 80 ? "hsl(var(--success))" : as.agent_score >= 60 ? "hsl(var(--warning))" : "hsl(var(--muted-foreground))" }} />
                                  {bottomLine}
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })()}

                      {/* AI Analysis */}
                      {as.agent_verdict && !hasPrompt && (
                        <Card className="border" style={{ background: "hsl(var(--surface-stone))", borderColor: "hsl(var(--filigree) / 0.15)" }}>
                          <CardContent className="p-4 flex gap-3">
                            <Bot className="w-5 h-5 mt-0.5 shrink-0" style={{ color: "hsl(var(--sentinel))" }} />
                            <div>
                              <p className="text-[11px] font-cinzel font-semibold uppercase tracking-[0.15em] mb-1" style={{ color: "hsl(var(--filigree))" }}>AI Analysis</p>
                              <p className="text-[13px] text-foreground/80 leading-relaxed">{as.agent_verdict}</p>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Automatable Workflows */}
                      {!hasPrompt && as.automatable_workflows.length > 0 && (
                        <Card className="border" style={{ background: "hsl(var(--surface-stone))", borderColor: "hsl(var(--filigree) / 0.15)" }}>
                          <CardContent className="p-4">
                            <p className="text-[11px] font-cinzel font-semibold uppercase tracking-[0.15em] mb-3" style={{ color: "hsl(var(--filigree))" }}>Automatable Workflows</p>
                            <div className="space-y-3">
                              {as.automatable_workflows.map((wf, i) => (
                                <div key={i} className="flex items-start gap-3">
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                                    wf.automation_level === "full" ? "border-emerald-500/30" :
                                    wf.automation_level === "partial" ? "border-amber-500/30" : "border-blue-500/30"
                                  }`} style={{
                                    background: wf.automation_level === "full" ? "hsl(var(--success) / 0.1)" : wf.automation_level === "partial" ? "hsl(var(--warning) / 0.1)" : "hsl(var(--neon-blue) / 0.1)",
                                  }}>
                                    {wf.automation_level === "full" ? <Zap className="w-4 h-4" style={{ color: "hsl(var(--success))" }} /> : wf.automation_level === "partial" ? <Cpu className="w-4 h-4" style={{ color: "hsl(var(--warning))" }} /> : <Wand2 className="w-4 h-4" style={{ color: "hsl(var(--neon-blue))" }} />}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-[13px] font-medium text-foreground">{wf.name}</p>
                                    <p className="text-[11px] text-muted-foreground leading-relaxed">{wf.description}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Opportunity Map — XY scatter */}
                      {!hasPrompt && niche.companies.length > 0 && (() => {
                        // Parse employee string to numeric scale 1-5
                        const empScale = (s: string | null): number => {
                          if (!s) return 1;
                          const n = parseInt(s.replace(/[^0-9]/g, "")) || 0;
                          if (n >= 1000) return 5;
                          if (n >= 200) return 4;
                          if (n >= 50) return 3;
                          if (n >= 10) return 2;
                          return 1;
                        };
                        // Parse funding to AI-readiness proxy (higher funding = more resources but less agile)
                        const fundingToAgility = (f: string | null, role: string): number => {
                          if (role === "incumbent") return 1 + Math.random() * 1.5; // low agility
                          if (!f) return 3 + Math.random();
                          const fl = f.toLowerCase();
                          if (fl.includes("seed") || fl.includes("pre")) return 4 + Math.random() * 0.8;
                          if (fl.includes("series a") || fl.includes("a")) return 3.5 + Math.random() * 0.5;
                          if (fl.includes("series b") || fl.includes("b")) return 3 + Math.random() * 0.5;
                          if (fl.includes("series c") || fl.includes("c") || fl.includes("public")) return 2 + Math.random();
                          return 3 + Math.random();
                        };

                        const dots = niche.companies.slice(0, 8).map(c => ({
                          name: c.name,
                          role: c.role,
                          x: empScale(c.estimated_employees),
                          y: fundingToAgility(c.estimated_funding, c.role),
                          size: c.role === "incumbent" ? 10 : 7,
                        }));

                        // Your agent — small team, max AI agility
                        const agentDot = { name: "Your Agent", role: "agent" as const, x: 1, y: 5, size: 9 };

                        const roleColor = (role: string) => {
                          if (role === "agent") return "hsl(var(--primary))";
                          if (role === "incumbent") return "hsl(var(--destructive) / 0.6)";
                          if (role === "disruptor") return "hsl(var(--success) / 0.7)";
                          return "hsl(var(--warning) / 0.7)";
                        };

                        const chartW = 480;
                        const chartH = 220;
                        const pad = { top: 20, right: 20, bottom: 28, left: 36 };
                        const plotW = chartW - pad.left - pad.right;
                        const plotH = chartH - pad.top - pad.bottom;
                        const allDots = [...dots, agentDot];
                        const cx = (v: number) => pad.left + ((v - 0.5) / 5.5) * plotW;
                        const cy = (v: number) => pad.top + plotH - ((v - 0.5) / 5.5) * plotH;

                        return (
                          <Card className="border" style={{ background: "hsl(var(--surface-stone))", borderColor: "hsl(var(--filigree) / 0.15)" }}>
                            <CardContent className="p-4">
                              <p className="text-[11px] font-cinzel font-semibold uppercase tracking-[0.15em] mb-3" style={{ color: "hsl(var(--filigree))" }}>Opportunity Map</p>
                              <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full" style={{ maxHeight: 220 }}>
                                {/* Grid */}
                                {[1,2,3,4,5].map(i => (
                                  <line key={`gx${i}`} x1={cx(i)} x2={cx(i)} y1={pad.top} y2={pad.top + plotH} stroke="hsl(var(--border) / 0.15)" strokeDasharray="3,3" />
                                ))}
                                {[1,2,3,4,5].map(i => (
                                  <line key={`gy${i}`} x1={pad.left} x2={pad.left + plotW} y1={cy(i)} y2={cy(i)} stroke="hsl(var(--border) / 0.15)" strokeDasharray="3,3" />
                                ))}

                                {/* Ideal zone highlight */}
                                <rect x={cx(0.5)} y={cy(5.5)} width={cx(2.5) - cx(0.5)} height={cy(3) - cy(5.5)} rx={6} fill="hsl(var(--primary) / 0.06)" stroke="hsl(var(--primary) / 0.15)" strokeDasharray="4,4" />
                                <text x={cx(1.5)} y={cy(5.2)} textAnchor="middle" fontSize={9} fill="hsl(var(--primary) / 0.5)" fontFamily="inherit">Sweet Spot</text>

                                {/* Axis labels */}
                                <text x={pad.left + plotW / 2} y={chartH - 4} textAnchor="middle" fontSize={10} fill="hsl(var(--muted-foreground))">Team Size →</text>
                                <text x={10} y={pad.top + plotH / 2} textAnchor="middle" fontSize={10} fill="hsl(var(--muted-foreground))" transform={`rotate(-90, 10, ${pad.top + plotH / 2})`}>AI Agility →</text>

                                {/* Company dots */}
                                {allDots.map((d, i) => (
                                  <g key={i}>
                                    {d.role === "agent" && (
                                      <circle cx={cx(d.x)} cy={cy(d.y)} r={16} fill="hsl(var(--primary) / 0.1)" className="animate-pulse" />
                                    )}
                                    <circle cx={cx(d.x)} cy={cy(d.y)} r={d.size} fill={roleColor(d.role)} stroke={d.role === "agent" ? "hsl(var(--primary))" : "none"} strokeWidth={d.role === "agent" ? 2 : 0} />
                                    <text
                                      x={cx(d.x)}
                                      y={cy(d.y) - d.size - 4}
                                      textAnchor="middle"
                                      fontSize={d.role === "agent" ? 11 : 9}
                                      fontWeight={d.role === "agent" ? 700 : 500}
                                      fill={d.role === "agent" ? "hsl(var(--primary))" : "hsl(var(--foreground) / 0.7)"}
                                    >
                                      {d.name}
                                    </text>
                                  </g>
                                ))}
                              </svg>

                              {/* Legend */}
                              <div className="flex items-center justify-center gap-4 mt-2">
                                {[
                                  { label: "Your Agent", color: "hsl(var(--primary))" },
                                  { label: "Incumbents", color: "hsl(var(--destructive) / 0.6)" },
                                  { label: "Disruptors", color: "hsl(var(--success) / 0.7)" },
                                ].map(l => (
                                  <div key={l.label} className="flex items-center gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: l.color }} />
                                    <span className="text-[10px] text-muted-foreground">{l.label}</span>
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })()}

                      {/* Master Prompt output */}
                      {hasPrompt && (
                        <Card className="border overflow-hidden" style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--filigree) / 0.2)", boxShadow: "inset 0 1px 0 hsl(var(--emboss-light)), 0 4px 20px hsl(0 0% 0% / 0.2)" }}>
                          <CardContent className="p-0">
                            <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: "hsl(var(--filigree) / 0.1)" }}>
                              {phase === "generating" && <Loader2 className="w-4 h-4 animate-spin" style={{ color: "hsl(var(--filigree-glow))" }} />}
                              {phase === "result" && <Sparkles className="w-4 h-4 text-primary" />}
                              <h3 className="text-[13px] font-semibold text-foreground font-cinzel tracking-wider">
                                {phase === "generating" ? "Generating…" : "Master Prompt"}
                              </h3>
                            </div>
                            <div className="p-5">
                              {masterPrompt ? (
                                <div className="prose prose-sm prose-invert max-w-none text-[13px] leading-relaxed">
                                  <ReactMarkdown>{masterPrompt}</ReactMarkdown>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 text-[13px] font-cinzel" style={{ color: "hsl(var(--filigree))" }}>
                                  <Loader2 className="w-4 h-4 animate-spin" /> Generating your master prompt…
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </ScrollArea>

                  {/* Panel footer CTA */}
                  <div className="shrink-0 px-5 py-4 border-t" style={{ borderColor: "hsl(var(--filigree) / 0.1)", background: "hsl(var(--surface-stone))" }}>
                    {phase === "deepdive" && (
                      <div>
                        <Card className="mb-3 border" style={{ background: "hsl(var(--background))", borderColor: "hsl(var(--filigree) / 0.1)" }}>
                          <CardContent className="p-3">
                            <p className="text-[11px] font-cinzel font-semibold uppercase tracking-[0.15em] mb-2" style={{ color: "hsl(var(--filigree))" }}>Your prompt will include:</p>
                            <div className="grid grid-cols-2 gap-1.5">
                              {[
                                { icon: <TrendingUp className="w-3.5 h-3.5" />, label: "Vision & target user" },
                                { icon: <Check className="w-3.5 h-3.5" />, label: "MVP features" },
                                { icon: <Building2 className="w-3.5 h-3.5" />, label: "DB schema" },
                                { icon: <Zap className="w-3.5 h-3.5" />, label: "API routes" },
                                { icon: <Sparkles className="w-3.5 h-3.5" />, label: "UI & pages" },
                                { icon: <Bot className="w-3.5 h-3.5" />, label: "AI agent integration" },
                                { icon: <Rocket className="w-3.5 h-3.5" />, label: "Monetization" },
                              ].map(item => (
                                <div key={item.label} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                                  <span style={{ color: "hsl(var(--filigree))" }}>{item.icon}</span>
                                  <span>{item.label}</span>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                        <Button
                          onClick={confirmGenerate}
                          size="lg"
                          className="gap-2 w-full font-cinzel tracking-wider"
                          style={{ boxShadow: "0 0 20px hsl(var(--primary) / 0.3)" }}
                        >
                          <Rocket className="w-4 h-4" /> Generate Master Prompt
                        </Button>
                      </div>
                    )}
                    {phase === "result" && (
                      <div className="flex gap-2">
                        <Button onClick={copyPrompt} className="gap-1.5 flex-1 font-cinzel tracking-wider" style={{ boxShadow: "0 0 12px hsl(var(--primary) / 0.25)" }}>
                          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          {copied ? "Copied!" : "Copy Master Prompt"}
                        </Button>
                        <Button onClick={restart} variant="outline" className="gap-1.5 font-cinzel tracking-wider" style={{ borderColor: "hsl(var(--filigree) / 0.3)" }}>
                          <Rocket className="w-3.5 h-3.5" /> New
                        </Button>
                      </div>
                    )}
                    {phase === "generating" && (
                      <p className="text-[11px] text-center font-cinzel tracking-wider" style={{ color: "hsl(var(--filigree) / 0.5)" }}>
                        Generating your master prompt… ~30 seconds
                      </p>
                    )}
                  </div>
                </motion.div>
              </>
            );
          })()}
        </AnimatePresence>

        <Footer />
      </>
    );
}

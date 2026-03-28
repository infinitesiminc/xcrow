import { useState, useMemo, useRef } from "react";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, Rocket, ArrowLeft, Loader2, Sparkles, Zap, Lightbulb, Building2, ChevronDown, Search, Bot, TrendingUp, X, Bookmark, BookmarkCheck, Share2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { useVerticalMap, type WhitespaceLabel, type SubVertical, type VerticalStats } from "@/hooks/use-vertical-map";
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
  const url = `${window.location.origin}/founder`;
  if (navigator.share) {
    navigator.share({ title: `${niche.name} — AI Opportunity`, text, url }).catch(() => {});
  } else {
    navigator.clipboard.writeText(`${text}\n${url}`);
    toast.success("Opportunity link copied!");
  }
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

  // ── BROWSE PHASE ──
  if (phase === "browse") {
    return (
      <>
        <Helmet>
          <title>Xcrow Founder — One Prompt to Launch Your AI Startup | Xcrow</title>
          <meta name="description" content="Pick a software niche. Get one AI-generated builder prompt. Paste it into any AI coding tool and ship your MVP — no co-founder needed." />
        </Helmet>
        <Navbar />
        <div className="min-h-screen pt-20" style={{ background: "hsl(var(--background))" }}>
          {/* ── Hero Banner ── */}
          <div className="relative text-center px-4 pt-10 pb-8 max-w-3xl mx-auto overflow-hidden">
            {/* Stone texture overlay */}
            <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg width=\"40\" height=\"40\" viewBox=\"0 0 40 40\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"%23fff\" fill-opacity=\"0.4\"%3E%3Cpath d=\"M0 0h20v20H0zM20 20h20v20H20z\"/%3E%3C/g%3E%3C/svg%3E')" }} />
            {/* Filigree glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 rounded-full" style={{ background: "linear-gradient(90deg, transparent, hsl(var(--filigree-glow) / 0.6), transparent)" }} />

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <div className="text-5xl mb-4">🚀</div>
              <h1 className="text-3xl md:text-4xl font-bold font-cinzel text-foreground mb-3 tracking-wide">
                Xcrow Founder
              </h1>
              <p className="text-base font-cinzel tracking-wide mb-2" style={{ color: "hsl(var(--filigree))" }}>
                One Prompt. One Founder. Ship It.
              </p>
              <p className="text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
                Pick a high-opportunity niche below. We'll generate a single <span className="font-medium" style={{ color: "hsl(var(--filigree))" }}>Master Builder Prompt</span> — paste it into Lovable, Cursor, or any AI coding tool and launch your startup.
              </p>
            </motion.div>

            {/* Bottom filigree */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-px" style={{ background: "linear-gradient(90deg, transparent, hsl(var(--filigree) / 0.3), transparent)" }} />
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

          {/* ── Niche Grid (RPG cards) ── */}
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

                  return (
                    <motion.div key={`${niche.verticalId}-${niche.name}`} whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }} className="h-full">
                      <Card
                        className="cursor-pointer border transition-all group h-full flex flex-col overflow-hidden"
                        onClick={() => openDeepDive(niche)}
                        style={{
                          background: `linear-gradient(135deg, hsl(var(--card)), hsl(var(--surface-stone)))`,
                          borderColor: "hsl(var(--filigree) / 0.15)",
                          boxShadow: `0 0 20px ${scoreGlow}, inset 0 1px 0 hsl(var(--emboss-light))`,
                        }}
                      >
                        <CardContent className="p-4 flex flex-col flex-1">
                          {/* Score + Niche name */}
                          <div className="flex items-start gap-3 mb-2">
                            <div
                              className="text-2xl font-bold tabular-nums leading-none font-cinzel"
                              style={{ color: as.agent_score >= 80 ? "hsl(var(--success))" : as.agent_score >= 60 ? "hsl(var(--warning))" : "hsl(var(--muted-foreground))", textShadow: as.agent_score >= 80 ? "0 0 8px hsl(var(--success) / 0.4)" : "none" }}
                            >
                              {as.agent_score}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-foreground text-sm leading-tight group-hover:text-primary transition-colors line-clamp-1 font-cinzel">
                                {niche.name}
                              </h3>
                              <span className="text-[10px]" style={{ color: "hsl(var(--filigree))" }}>{niche.verticalName}</span>
                            </div>
                            <Badge variant="outline" className={`text-[9px] h-5 px-1.5 shrink-0 ${whitespaceColor[niche.whitespace]}`}>
                              {niche.whitespace === "open" ? "🏴 Open" : niche.whitespace === "low-competition" ? "⚔️ Contested" : "🛡️ Fortified"}
                            </Badge>
                          </div>

                          {/* Agent Play */}
                          <p className="text-[11px] text-foreground/80 leading-relaxed line-clamp-2 mb-2 min-h-[2.75rem]">
                            💡 {as.agent_play || "Uncharted territory — ripe for conquest"}
                          </p>

                          {/* Workflow tags */}
                          <div className="flex flex-wrap gap-1 mb-2 min-h-[1.5rem]">
                            {as.automatable_workflows.slice(0, 3).map((wf, i) => (
                              <Badge key={i} variant="outline" className="text-[8px] h-4 px-1.5" style={{
                                borderColor: wf.automation_level === "full" ? "hsl(var(--success) / 0.3)" : wf.automation_level === "partial" ? "hsl(var(--warning) / 0.3)" : "hsl(var(--neon-blue) / 0.3)",
                                color: wf.automation_level === "full" ? "hsl(var(--success))" : wf.automation_level === "partial" ? "hsl(var(--warning))" : "hsl(var(--neon-blue))",
                              }}>
                                {wf.automation_level === "full" ? "⚡" : wf.automation_level === "partial" ? "🔄" : "🤝"} {wf.name}
                              </Badge>
                            ))}
                          </div>

                          {/* Footer */}
                          <div className="flex items-center gap-2 text-[10px] border-t pt-2 mt-auto" style={{ borderColor: "hsl(var(--filigree) / 0.1)", color: "hsl(var(--muted-foreground))" }}>
                            <span>🏰 {incumbentCount}</span>
                            <span>· ⚔️ {disruptorCount}</span>
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
        <Footer />
      </>
    );
  }

  // ── DEEP DIVE / GENERATING / RESULT ──
  const niche = selectedNiche;
  const as = niche?.agentScore;
  const hasPrompt = phase === "generating" || phase === "result";

  return (
    <>
      <Helmet>
        <title>{phase === "generating" ? "Forging…" : phase === "result" ? `${savedNiche} — Builder Scroll` : `${niche?.name} — Intel`} | Xcrow</title>
      </Helmet>
      <Navbar />
      <div className="min-h-screen pt-16" style={{ background: "hsl(var(--background))" }}>
        <div className="max-w-6xl mx-auto px-4 py-2">
          <button
            onClick={hasPrompt ? restart : () => setPhase("browse")}
            className="flex items-center gap-1.5 text-xs hover:text-foreground transition-colors mb-6 font-cinzel tracking-wider"
            style={{ color: "hsl(var(--filigree))" }}
          >
            <ArrowLeft className="w-3.5 h-3.5" /> {hasPrompt ? "⚔️ Scout another target" : "🏰 Back to The Forge"}
          </button>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* LEFT: Niche Intel */}
            {niche && as && (
              <div className={`shrink-0 ${hasPrompt ? "lg:w-80" : "lg:w-full max-w-2xl mx-auto"}`}>
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                  {/* Header */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-[10px]" style={{ borderColor: "hsl(var(--filigree) / 0.3)", color: "hsl(var(--filigree))" }}>{niche.verticalName}</Badge>
                      <Badge variant="outline" className={`text-[10px] ${whitespaceColor[niche.whitespace]}`}>
                        {niche.whitespace === "open" ? "🏴 Open" : niche.whitespace === "low-competition" ? "⚔️ Contested" : "🛡️ Fortified"}
                      </Badge>
                      <div className="flex gap-1 ml-auto">
                        <button onClick={() => toggleSave(niche)} className="p-1.5 rounded-md hover:bg-muted/40 transition-colors" title={isNicheSaved(niche) ? "Remove from saved" : "Save opportunity"}>
                          {isNicheSaved(niche) ? <BookmarkCheck className="w-4 h-4 text-primary" /> : <Bookmark className="w-4 h-4 text-muted-foreground" />}
                        </button>
                        <button onClick={() => shareNiche(niche)} className="p-1.5 rounded-md hover:bg-muted/40 transition-colors" title="Share opportunity">
                          <Share2 className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </div>
                    </div>
                    <h1 className={`font-bold font-cinzel text-foreground mb-1 tracking-wide ${hasPrompt ? "text-lg" : "text-2xl"}`}>
                      {niche.name}
                    </h1>
                    <div className="flex items-center gap-3">
                      <div className="text-3xl font-bold tabular-nums font-cinzel" style={{ color: as.agent_score >= 80 ? "hsl(var(--success))" : as.agent_score >= 60 ? "hsl(var(--warning))" : "hsl(var(--muted-foreground))", textShadow: as.agent_score >= 80 ? "0 0 10px hsl(var(--success) / 0.4)" : "none" }}>
                        {as.agent_score}<span className="text-sm font-normal text-muted-foreground">/100</span>
                      </div>
                      <Progress value={as.agent_score} className="h-2 flex-1" style={{ background: "hsl(var(--surface-stone))" }} />
                    </div>
                  </div>

                  {/* Agent Play - the thesis */}
                  {as.agent_play && (
                    <Card className="mb-3 border" style={{ background: "hsl(var(--primary) / 0.06)", borderColor: "hsl(var(--primary) / 0.2)" }}>
                      <CardContent className="p-3 flex gap-2.5">
                        <Lightbulb className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[10px] font-cinzel font-semibold uppercase tracking-[0.15em] mb-0.5" style={{ color: "hsl(var(--filigree))" }}>Battle Thesis</p>
                          <p className={`text-foreground leading-relaxed ${hasPrompt ? "text-[11px]" : "text-sm"}`}>{as.agent_play}</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Verdict */}
                  {as.agent_verdict && !hasPrompt && (
                    <Card className="mb-3 border" style={{ background: "hsl(var(--surface-stone))", borderColor: "hsl(var(--filigree) / 0.15)" }}>
                      <CardContent className="p-3 flex gap-2.5">
                        <Bot className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "hsl(var(--sentinel))" }} />
                        <div>
                          <p className="text-[10px] font-cinzel font-semibold uppercase tracking-[0.15em] mb-0.5" style={{ color: "hsl(var(--filigree))" }}>Oracle's Verdict</p>
                          <p className="text-xs text-foreground/80 leading-relaxed">{as.agent_verdict}</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Automatable Workflows */}
                  {!hasPrompt && as.automatable_workflows.length > 0 && (
                    <Card className="mb-3 border" style={{ background: "hsl(var(--surface-stone))", borderColor: "hsl(var(--filigree) / 0.15)" }}>
                      <CardContent className="p-3">
                        <p className="text-[10px] font-cinzel font-semibold uppercase tracking-[0.15em] mb-2" style={{ color: "hsl(var(--filigree))" }}>Automatable Workflows</p>
                        <div className="space-y-2">
                          {as.automatable_workflows.map((wf, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <Badge variant="outline" className={`text-[8px] h-5 px-1.5 shrink-0 mt-0.5 ${
                                wf.automation_level === "full" ? "text-emerald-400 border-emerald-500/30" :
                                wf.automation_level === "partial" ? "text-amber-400 border-amber-500/30" :
                                "text-blue-400 border-blue-500/30"
                              }`}>
                                {wf.automation_level === "full" ? "⚡ Full" : wf.automation_level === "partial" ? "🔄 Partial" : "🤝 Augmented"}
                              </Badge>
                              <div className="min-w-0">
                                <p className="text-xs font-medium text-foreground/90">{wf.name}</p>
                                <p className="text-[10px] text-muted-foreground leading-relaxed">{wf.description}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Competitive Landscape */}
                  {!hasPrompt && (
                    <Card className="mb-4 border" style={{ background: "hsl(var(--surface-stone))", borderColor: "hsl(var(--filigree) / 0.15)" }}>
                      <CardContent className="p-3">
                        <p className="text-[10px] font-cinzel font-semibold uppercase tracking-[0.15em] mb-2" style={{ color: "hsl(var(--filigree))" }}>Battlefield Map</p>
                        <div className="space-y-2">
                          {niche.companies.filter(c => c.role === "incumbent").length > 0 && (
                            <div>
                              <p className="text-[10px] font-medium mb-1" style={{ color: "hsl(var(--destructive) / 0.8)" }}>🏰 Fortified Incumbents</p>
                              <div className="flex flex-wrap gap-1">
                                {niche.companies.filter(c => c.role === "incumbent").map(c => (
                                  <Badge key={c.id} variant="outline" className="text-[9px] h-5 px-2 border-destructive/20 text-foreground/70">
                                    {c.name}
                                    {c.estimated_employees && <span className="ml-1 text-muted-foreground">· {c.estimated_employees}</span>}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          {niche.companies.filter(c => c.role === "disruptor").length > 0 && (
                            <div>
                              <p className="text-[10px] font-medium text-primary/80 mb-1">⚔️ Challenger Disruptors</p>
                              <div className="flex flex-wrap gap-1">
                                {niche.companies.filter(c => c.role === "disruptor").map(c => (
                                  <Badge key={c.id} variant="outline" className="text-[9px] h-5 px-2 border-primary/20 text-foreground/70">
                                    {c.name}
                                    {c.estimated_funding && <span className="ml-1 text-muted-foreground">· {c.estimated_funding}</span>}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          {niche.companies.filter(c => c.role === "transitioning").length > 0 && (
                            <div>
                              <p className="text-[10px] font-medium text-amber-400/80 mb-1">Transitioning</p>
                              <div className="flex flex-wrap gap-1">
                                {niche.companies.filter(c => c.role === "transitioning").map(c => (
                                  <Badge key={c.id} variant="outline" className="text-[9px] h-5 px-2 border-amber-500/20 text-foreground/70">
                                    {c.name}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* CTA */}
                  {phase === "deepdive" && (
                    <>
                      <Card className="mb-4 border" style={{ background: "hsl(var(--surface-stone))", borderColor: "hsl(var(--filigree) / 0.2)" }}>
                        <CardContent className="p-3">
                          <h3 className="text-[10px] font-cinzel font-semibold uppercase tracking-[0.15em] mb-2" style={{ color: "hsl(var(--filigree))" }}>The Scroll Contains:</h3>
                          <div className="grid grid-cols-2 gap-1.5">
                            {[
                              { emoji: "🎯", label: "Vision & target user" },
                              { emoji: "✅", label: "MVP features" },
                              { emoji: "🗄️", label: "DB schema" },
                              { emoji: "🔌", label: "API routes" },
                              { emoji: "🎨", label: "UI & pages" },
                              { emoji: "🤖", label: "AI agent integration" },
                              { emoji: "💰", label: "Monetization" },
                            ].map(item => (
                              <div key={item.label} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                <span>{item.emoji}</span>
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
                      <p className="text-[10px] text-center mt-3 font-cinzel tracking-wider" style={{ color: "hsl(var(--filigree) / 0.5)" }}>
                        ~30 seconds. One prompt for Lovable, Cursor, or any AI builder.
                      </p>
                    </>
                  )}

                  {phase === "result" && (
                    <div className="space-y-2">
                      <Button onClick={copyPrompt} size="sm" className="gap-1.5 w-full font-cinzel tracking-wider" style={{ boxShadow: "0 0 12px hsl(var(--primary) / 0.25)" }}>
                        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copied ? "Scroll Copied!" : "Copy Builder Scroll"}
                      </Button>
                      <Button onClick={restart} variant="outline" size="sm" className="gap-1.5 w-full font-cinzel tracking-wider" style={{ borderColor: "hsl(var(--filigree) / 0.3)" }}>
                        <Rocket className="w-3.5 h-3.5" /> Scout Another Target
                      </Button>
                    </div>
                  )}
                </motion.div>
              </div>
            )}

            {/* RIGHT: Master Prompt / Builder Scroll */}
            {hasPrompt && (
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-3">
                  {phase === "generating" && <Loader2 className="w-4 h-4 animate-spin" style={{ color: "hsl(var(--filigree-glow))" }} />}
                  {phase === "result" && <Sparkles className="w-4 h-4 text-primary" />}
                  <h2 className="text-sm font-semibold text-foreground font-cinzel tracking-wider">
                    {phase === "generating" ? "⚒️ Forging…" : "📜 Builder Scroll"}
                  </h2>
                </div>
                <Card className="border overflow-hidden" style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--filigree) / 0.2)", boxShadow: "inset 0 1px 0 hsl(var(--emboss-light)), 0 4px 20px hsl(0 0% 0% / 0.2)" }}>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[70vh]">
                      <div className="p-5">
                        {masterPrompt ? (
                          <div className="prose prose-sm prose-invert max-w-none text-sm leading-relaxed">
                            <ReactMarkdown>{masterPrompt}</ReactMarkdown>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-sm font-cinzel" style={{ color: "hsl(var(--filigree))" }}>
                            <Loader2 className="w-4 h-4 animate-spin" /> The Oracle is forging your scroll…
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

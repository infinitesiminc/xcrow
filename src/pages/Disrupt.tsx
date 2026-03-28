import { useState, useRef } from "react";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { INDUSTRY_CLUSTERS, type DisruptionIncumbent } from "@/data/disruption-incumbents";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";
import { Copy, Check, Rocket, ArrowLeft, Loader2, Sparkles, Zap, Target, Shield, DollarSign, Users, Lightbulb, Building2, Eye } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { useVerticalMap, type WhitespaceLabel, type VerticalStats } from "@/hooks/use-vertical-map";
import { Switch } from "@/components/ui/switch";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import { ChevronDown } from "lucide-react";

type Phase = "browse" | "preview" | "generating" | "result";
type IncumbentWithCluster = DisruptionIncumbent & { clusterName: string; clusterEmoji: string; clusterColor: string };

const FACTORY_RESULT_KEY = "sf-master-prompt";

interface SavedResult {
  incumbentId: number;
  incumbentName: string;
  prompt: string;
}

function loadResult(): SavedResult | null {
  try {
    const raw = localStorage.getItem(FACTORY_RESULT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export default function Disrupt() {
  const isMobile = useIsMobile();
  const { data: verticalStats } = useVerticalMap();
  const saved = loadResult();
  const [phase, setPhase] = useState<Phase>(saved ? "result" : "browse");
  const [selectedIncumbent, setSelectedIncumbent] = useState<IncumbentWithCluster | null>(null);
  const [masterPrompt, setMasterPrompt] = useState(saved?.prompt || "");
  const [savedName, setSavedName] = useState(saved?.incumbentName || "");
  const [isStreaming, setIsStreaming] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeCluster, setActiveCluster] = useState<number | null>(null);
  const [showWhitespace, setShowWhitespace] = useState(false);
  const [activeSubVertical, setActiveSubVertical] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const openPreview = (inc: IncumbentWithCluster) => {
    setSelectedIncumbent(inc);
    setPhase("preview");
  };

  const confirmGenerate = async () => {
    if (!selectedIncumbent) return;
    const inc = selectedIncumbent;
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
            action: "master-prompt",
            payload: {
              incumbent: {
                name: inc.name,
                vulnerability: inc.vulnerability,
                asymmetricAngle: inc.asymmetricAngle,
                beachheadNiche: inc.beachheadNiche,
                disruptorModel: inc.disruptorModel,
                vector: inc.vector,
                aiDisruptionThesis: inc.aiDisruptionThesis,
                pricingModel: inc.pricingModel,
                existingDisruptor: inc.existingDisruptor,
              },
              cluster: { name: inc.clusterName, emoji: inc.clusterEmoji },
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
      setSavedName(inc.name);
      localStorage.setItem(FACTORY_RESULT_KEY, JSON.stringify({
        incumbentId: inc.id,
        incumbentName: inc.name,
        prompt: fullText,
      }));
    } catch (e: any) {
      if (e.name !== "AbortError") {
        toast.error("Failed to generate. Try again.");
        setPhase("preview");
      }
    } finally {
      setIsStreaming(false);
    }
  };

  const restart = () => {
    localStorage.removeItem(FACTORY_RESULT_KEY);
    setPhase("browse");
    setMasterPrompt("");
    setSelectedIncumbent(null);
    setSavedName("");
  };

  const copyPrompt = () => {
    navigator.clipboard.writeText(masterPrompt);
    setCopied(true);
    toast.success("Master prompt copied — paste it into Lovable or Cursor to start building!");
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredClusters = activeCluster !== null
    ? INDUSTRY_CLUSTERS.filter(c => c.id === activeCluster)
    : INDUSTRY_CLUSTERS;

  const whitespaceColor: Record<WhitespaceLabel, string> = {
    open: "text-emerald-400 border-emerald-400/40 bg-emerald-400/10",
    "low-competition": "text-amber-400 border-amber-400/40 bg-amber-400/10",
    crowded: "text-muted-foreground border-border/40 bg-muted/20",
  };
  const whitespaceEmoji: Record<WhitespaceLabel, string> = { open: "🟢", "low-competition": "🟡", crowded: "🔴" };

  // ── BROWSE PHASE ──
  if (phase === "browse") {
    return (
      <>
        <Helmet>
          <title>Software Factory — Pick a Giant to Disrupt | Xcrow</title>
          <meta name="description" content="Choose a software incumbent to disrupt. AI generates a complete builder prompt — paste it into Lovable or Cursor to launch your startup." />
        </Helmet>
        <Navbar />
        <div className="min-h-screen bg-background pt-20">
          <div className="text-center px-4 pt-8 pb-6 max-w-2xl mx-auto">
            <div className="text-4xl mb-3">🏭</div>
            <h1 className="text-2xl md:text-3xl font-bold font-cinzel text-foreground mb-2">Software Factory</h1>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Pick a software giant to disrupt. AI generates a master prompt you can paste into any builder agent to launch your startup.
            </p>
          </div>

          <div className="max-w-5xl mx-auto px-4 mb-6">
            <div className="flex flex-wrap items-center gap-2 justify-center">
              <button
                onClick={() => { setActiveCluster(null); setActiveSubVertical(null); }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${activeCluster === null ? "bg-primary text-primary-foreground" : "bg-muted/30 text-muted-foreground hover:bg-muted/50"}`}
              >
                All
              </button>
              {INDUSTRY_CLUSTERS.map(c => (
                <button
                  key={c.id}
                  onClick={() => { setActiveCluster(activeCluster === c.id ? null : c.id); setActiveSubVertical(null); }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${activeCluster === c.id ? "bg-primary text-primary-foreground" : "bg-muted/30 text-muted-foreground hover:bg-muted/50"}`}
                >
                  {c.emoji} {c.name}
                </button>
              ))}
              <span className="w-px h-5 bg-border/50 mx-1" />
              <label className="flex items-center gap-1.5 cursor-pointer">
                <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-[10px] font-medium text-muted-foreground">Whitespace</span>
                <Switch checked={showWhitespace} onCheckedChange={setShowWhitespace} className="scale-75" />
              </label>
            </div>
          </div>

          <div className="max-w-6xl mx-auto px-4 pb-16">
          {(showWhitespace
            ? [...filteredClusters].sort((a, b) => {
                const vsA = verticalStats?.find(v => v.id === a.id);
                const vsB = verticalStats?.find(v => v.id === b.id);
                return (vsB?.opportunityScore || 0) - (vsA?.opportunityScore || 0);
              })
            : filteredClusters
          ).map(cluster => {
              const vs = verticalStats?.find(v => v.id === cluster.id);
              const subVerticals = vs?.sub_verticals || [];
              const visibleSubs = showWhitespace ? subVerticals.filter(s => s.whitespace !== "crowded") : subVerticals;

              // Filter incumbents by selected sub-vertical
              const filteredIncumbents = activeSubVertical
                ? cluster.incumbents.filter(inc => {
                    const sv = subVerticals.find(s => s.name === activeSubVertical);
                    return sv?.companies.some(c => c.name === inc.name);
                  })
                : cluster.incumbents;

              return (
                <div key={cluster.id} className="mb-8">
                  <h2 className="text-sm font-semibold text-foreground/90 mb-2 flex items-center gap-2">
                    <span>{cluster.emoji}</span> {cluster.name}
                    {vs && (
                      <span className="flex items-center gap-1.5 ml-1">
                        <Badge variant="secondary" className="text-[9px] h-4 px-1.5 gap-0.5">
                          <Building2 className="w-2.5 h-2.5" /> {vs.counts.total}
                        </Badge>
                        <Badge variant="outline" className="text-[9px] h-4 px-1.5 text-destructive border-destructive/50 font-semibold">
                          {vs.counts.incumbent} inc
                        </Badge>
                        <Badge variant="outline" className="text-[9px] h-4 px-1.5 text-primary border-primary/50 font-semibold">
                          {vs.counts.disruptor} dis
                        </Badge>
                      </span>
                    )}
                  </h2>

                  {/* Opportunity Scorecard */}
                  {vs && vs.opportunityScore > 0 && (
                    <Collapsible>
                      <CollapsibleTrigger className="w-full">
                        <div className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/20 border border-border/30 mb-3 text-left hover:bg-muted/30 transition-colors">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] font-semibold text-foreground/80">Opportunity Score</span>
                              <span className="text-xs font-bold text-primary">{vs.opportunityScore.toFixed(1)}/10</span>
                              <Progress value={vs.opportunityScore * 10} className="h-1.5 w-16 bg-muted/40" />
                              {vs.agentScore && (
                                <Badge variant="outline" className="text-[9px] h-4 px-1.5 gap-0.5 border-violet-500/40 text-violet-400">
                                  🤖 Agent: {vs.agentScore.agent_score}/100
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[9px] text-muted-foreground">
                              <span>🟢 {vs.sub_verticals.filter(s => s.whitespace === "open").length} open</span>
                              <span>🟡 {vs.sub_verticals.filter(s => s.whitespace === "low-competition").length} low-comp</span>
                              <span>🔴 {vs.sub_verticals.filter(s => s.whitespace === "crowded").length} crowded</span>
                            </div>
                          </div>
                          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="p-3 rounded-lg bg-muted/10 border border-border/20 mb-3 space-y-2">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
                            <div className="flex flex-col">
                              <span className="text-muted-foreground">Incumbents</span>
                              <span className="font-semibold text-foreground">{vs.counts.incumbent}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-muted-foreground">Disruptors</span>
                              <span className="font-semibold text-foreground">{vs.disruptorMaturity.count} (avg: {vs.disruptorMaturity.avgFunding})</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-muted-foreground">Avg Disruptor ARR</span>
                              <span className="font-semibold text-foreground">{vs.disruptorMaturity.avgArr}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-muted-foreground">Avg Team Size</span>
                              <span className="font-semibold text-foreground">{vs.disruptorMaturity.avgSize}</span>
                            </div>
                          </div>
                          <p className="text-[10px] text-muted-foreground/80 italic">{vs.verdict}</p>
                          {vs.agentScore && (
                            <div className="pt-2 border-t border-border/20 space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-semibold text-foreground/80">🤖 AI Agent Vulnerability</span>
                                <Progress value={vs.agentScore.agent_score} className="h-1.5 w-20 bg-muted/40" />
                                <span className="text-[10px] font-bold text-violet-400">{vs.agentScore.agent_score}/100</span>
                              </div>
                              {vs.agentScore.agent_verdict && (
                                <p className="text-[10px] text-violet-400/80 italic">{vs.agentScore.agent_verdict}</p>
                              )}
                              {vs.agentScore.key_opportunities.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {vs.agentScore.key_opportunities.map((opp, i) => (
                                    <Badge key={i} variant="outline" className="text-[8px] h-4 px-1.5 border-violet-500/20 text-violet-400/70">
                                      {opp}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  )}

                  {/* Sub-vertical pills */}
                  {subVerticals.length > 1 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      <button
                        onClick={() => setActiveSubVertical(null)}
                        className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${!activeSubVertical ? "bg-primary/20 text-primary border border-primary/30" : "bg-muted/20 text-muted-foreground border border-border/30 hover:bg-muted/40"}`}
                      >
                        All niches
                      </button>
                      {(showWhitespace ? visibleSubs : subVerticals).map(sv => (
                        <button
                          key={sv.name}
                          onClick={() => setActiveSubVertical(activeSubVertical === sv.name ? null : sv.name)}
                          className={`px-2 py-1 rounded text-[10px] font-medium transition-colors border ${
                            activeSubVertical === sv.name
                              ? "bg-primary/20 text-primary border-primary/30"
                              : whitespaceColor[sv.whitespace]
                          }`}
                        >
                          {whitespaceEmoji[sv.whitespace]} {sv.name}
                          <span className="ml-1 opacity-70">{sv.counts.incumbent}i/{sv.counts.disruptor}d</span>
                          {sv.agentScore && (
                            <span className="ml-1 text-violet-400">🤖{sv.agentScore.agent_score}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Sub-vertical workflow breakdown */}
                  {activeSubVertical && (() => {
                    const selectedSv = subVerticals.find(s => s.name === activeSubVertical);
                    if (!selectedSv?.agentScore) return null;
                    const as = selectedSv.agentScore;
                    return (
                      <div className="p-3 rounded-lg bg-violet-500/5 border border-violet-500/20 mb-3 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-semibold text-foreground/80">🤖 Agent Score: {as.agent_score}/100</span>
                          <Progress value={as.agent_score} className="h-1.5 w-20 bg-muted/40" />
                          {as.workflow_types.map(wt => (
                            <Badge key={wt} variant="outline" className="text-[8px] h-4 px-1.5 border-violet-500/20 text-violet-400/70">
                              {wt}
                            </Badge>
                          ))}
                        </div>
                        {as.agent_verdict && (
                          <p className="text-[10px] text-violet-400/80 italic">{as.agent_verdict}</p>
                        )}
                        {as.agent_play && (
                          <div className="flex items-start gap-1.5 p-2 rounded bg-violet-500/10 border border-violet-500/15">
                            <Lightbulb className="w-3 h-3 text-violet-400 mt-0.5 shrink-0" />
                            <span className="text-[10px] font-medium text-violet-300">{as.agent_play}</span>
                          </div>
                        )}
                        {as.automatable_workflows.length > 0 && (
                          <div className="space-y-1.5">
                            <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">Automatable Workflows</span>
                            {as.automatable_workflows.map((wf, i) => (
                              <div key={i} className="flex items-start gap-2 text-[10px]">
                                <Badge variant="outline" className={`text-[8px] h-4 px-1.5 shrink-0 ${
                                  wf.automation_level === "full" ? "text-emerald-400 border-emerald-500/30" :
                                  wf.automation_level === "partial" ? "text-amber-400 border-amber-500/30" :
                                  "text-blue-400 border-blue-500/30"
                                }`}>
                                  {wf.automation_level === "full" ? "⚡ Full" : wf.automation_level === "partial" ? "🔄 Partial" : "🤝 Augmented"}
                                </Badge>
                                <div>
                                  <span className="font-medium text-foreground/80">{wf.name}</span>
                                  <span className="text-muted-foreground ml-1">— {wf.description}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filteredIncumbents.map(inc => {
                      // Find sub-vertical context for this incumbent
                      const incSv = activeSubVertical
                        ? subVerticals.find(s => s.name === activeSubVertical)
                        : subVerticals.find(s => s.companies.some(c => c.name === inc.name));

                      return (
                        <motion.div key={inc.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          <Card
                            className="cursor-pointer bg-card/60 border-border/40 hover:border-primary/40 hover:bg-card/80 transition-all group"
                            onClick={() => openPreview({ ...inc, clusterName: cluster.name, clusterEmoji: cluster.emoji, clusterColor: cluster.color })}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between mb-1">
                                <h3 className="font-bold text-foreground text-lg leading-tight group-hover:text-primary transition-colors">
                                  {inc.name}
                                </h3>
                                <Badge variant="outline" className="text-[9px] shrink-0 ml-2" style={{ borderColor: `hsl(${cluster.color} / 0.4)`, color: `hsl(${cluster.color})` }}>
                                  {inc.vector}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-[10px] text-muted-foreground">{inc.age}</span>
                                <span className="text-[10px] text-muted-foreground/40">·</span>
                                <Badge variant={inc.status === "Public" ? "secondary" : "outline"} className="text-[9px] h-4 px-1.5">
                                  {inc.status}
                                </Badge>
                                <span className="text-[10px] text-muted-foreground/40">·</span>
                                <span className="text-[10px] font-semibold text-foreground/80">{inc.valuation}</span>
                              </div>

                              {/* Enriched metrics row */}
                              {(() => {
                                const svCompany = subVerticals.flatMap(s => s.companies).find(c => c.name === inc.name);
                                const hasMetrics = svCompany && (svCompany.estimated_arr || svCompany.estimated_funding || svCompany.estimated_employees);
                                if (!hasMetrics) return null;
                                return (
                                  <div className="flex flex-wrap gap-1.5 mb-2">
                                    {svCompany.estimated_arr && (
                                      <Badge variant="outline" className="text-[9px] h-4 px-1.5 gap-0.5 text-emerald-500 border-emerald-500/30">
                                        <DollarSign className="w-2.5 h-2.5" /> {svCompany.estimated_arr}
                                      </Badge>
                                    )}
                                    {svCompany.estimated_employees && (
                                      <Badge variant="outline" className="text-[9px] h-4 px-1.5 gap-0.5 text-blue-400 border-blue-400/30">
                                        <Users className="w-2.5 h-2.5" /> {svCompany.estimated_employees}
                                      </Badge>
                                    )}
                                    {svCompany.estimated_funding && (
                                      <Badge variant="outline" className="text-[9px] h-4 px-1.5 gap-0.5 text-amber-400 border-amber-400/30">
                                        <Rocket className="w-2.5 h-2.5" /> {svCompany.estimated_funding}
                                      </Badge>
                                    )}
                                  </div>
                                );
                              })()}

                              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-2">{inc.vulnerability}</p>
                              <p className="text-[10px] text-primary/80 font-medium line-clamp-1">💡 {inc.asymmetricAngle.slice(0, 80)}…</p>
                              {incSv && (
                                <p className="text-[9px] text-muted-foreground/70 mt-1.5 border-t border-border/20 pt-1.5">
                                  {whitespaceEmoji[incSv.whitespace]} {incSv.name} · {incSv.counts.incumbent} incumbent{incSv.counts.incumbent !== 1 ? "s" : ""} · {incSv.counts.disruptor} disruptor{incSv.counts.disruptor !== 1 ? "s" : ""}
                                </p>
                              )}
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <Footer />
      </>
    );
  }

  // ── PREVIEW / GENERATING / RESULT (unified) ──
  const inc = selectedIncumbent;
  const hasPrompt = phase === "generating" || phase === "result";

  return (
    <>
      <Helmet>
        <title>{phase === "generating" ? "Generating..." : phase === "result" ? `Disrupt ${savedName}` : `Disrupt ${inc?.name}`} — Software Factory | Xcrow</title>
      </Helmet>
      <Navbar />
      <div className="min-h-screen bg-background pt-16">
        <div className="max-w-6xl mx-auto px-4 py-2">
          <button
            onClick={hasPrompt ? restart : () => setPhase("browse")}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> {hasPrompt ? "Pick another" : "Back to targets"}
          </button>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* LEFT: Incumbent Intel */}
            {inc && (
              <div className={`shrink-0 ${hasPrompt ? "lg:w-72" : "lg:w-full max-w-2xl mx-auto"}`}>
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{inc.clusterEmoji}</span>
                      <Badge variant="outline" className="text-[10px]" style={{ borderColor: `hsl(${inc.clusterColor} / 0.4)`, color: `hsl(${inc.clusterColor})` }}>
                        {inc.clusterName}
                      </Badge>
                    </div>
                    <h1 className={`font-bold font-cinzel text-foreground mb-1 ${hasPrompt ? "text-lg" : "text-2xl"}`}>
                      Disrupt {inc.name}
                    </h1>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] text-muted-foreground">{inc.age}</span>
                      <span className="text-[10px] text-muted-foreground/40">·</span>
                      <Badge variant={inc.status === "Public" ? "secondary" : "outline"} className="text-[9px] h-4 px-1.5">{inc.status}</Badge>
                      <span className="text-[10px] text-muted-foreground/40">·</span>
                      <span className="text-[10px] font-semibold text-foreground/80">{inc.valuation}</span>
                    </div>
                  </div>

                  <div className={`space-y-2 ${hasPrompt ? "mb-4" : "mb-6"}`}>
                    <InfoCard icon={<Target className="w-3.5 h-3.5 text-destructive" />} label="Vulnerability" content={inc.vulnerability} compact={hasPrompt} />
                    <InfoCard icon={<Zap className="w-3.5 h-3.5 text-primary" />} label="AI Disruption Thesis" content={inc.aiDisruptionThesis} compact={hasPrompt} />
                    <InfoCard icon={<Lightbulb className="w-3.5 h-3.5 text-yellow-500" />} label="Asymmetric Angle" content={inc.asymmetricAngle} compact={hasPrompt} />
                    <InfoCard icon={<Users className="w-3.5 h-3.5 text-blue-400" />} label="Beachhead Niche" content={inc.beachheadNiche} compact={hasPrompt} />
                    <InfoCard icon={<DollarSign className="w-3.5 h-3.5 text-emerald-400" />} label="Disruptor Model" content={inc.disruptorModel} compact={hasPrompt} />
                    {inc.existingDisruptor && (
                      <InfoCard icon={<Shield className="w-3.5 h-3.5 text-orange-400" />} label="Challengers" content={inc.existingDisruptor} compact={hasPrompt} />
                    )}
                  </div>

                  {/* CTA when no prompt yet */}
                  {phase === "preview" && (
                    <>
                      <Card className="bg-muted/20 border-border/30 mb-4">
                        <CardContent className="p-3">
                          <h3 className="text-[10px] font-semibold text-foreground mb-2">What AI generates:</h3>
                          <div className="grid grid-cols-2 gap-1.5">
                            {[
                              { emoji: "🎯", label: "Vision & user" },
                              { emoji: "✅", label: "MVP features" },
                              { emoji: "🗄️", label: "DB schema" },
                              { emoji: "🔌", label: "API routes" },
                              { emoji: "🎨", label: "UI & pages" },
                              { emoji: "🤖", label: "AI integration" },
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
                      <Button onClick={confirmGenerate} size="lg" className="gap-2 w-full">
                        <Rocket className="w-4 h-4" /> Generate Master Prompt
                      </Button>
                      <p className="text-[10px] text-muted-foreground/60 text-center mt-3">
                        ~30 seconds. One prompt for Lovable, Cursor, or any AI builder.
                      </p>
                    </>
                  )}

                  {/* Copy CTA when result ready */}
                  {phase === "result" && (
                    <div className="space-y-2">
                      <Button onClick={copyPrompt} size="sm" className="gap-1.5 w-full">
                        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copied ? "Copied!" : "Copy Master Prompt"}
                      </Button>
                      <Button onClick={restart} variant="outline" size="sm" className="gap-1.5 w-full">
                        <Rocket className="w-3.5 h-3.5" /> Disrupt Another
                      </Button>
                    </div>
                  )}
                </motion.div>
              </div>
            )}

            {/* RIGHT: Master Prompt */}
            {hasPrompt && (
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-3">
                  {phase === "generating" && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                  {phase === "result" && <Sparkles className="w-4 h-4 text-primary" />}
                  <h2 className="text-sm font-semibold text-foreground">
                    {phase === "generating" ? "Generating…" : "Master Prompt"}
                  </h2>
                </div>
                <Card className="bg-card/60 border-border/40">
                  <CardContent className="p-0">
                    <ScrollArea className="h-[70vh]">
                      <div className="p-5">
                        {masterPrompt ? (
                          <div className="prose prose-sm prose-invert max-w-none text-sm leading-relaxed">
                            <ReactMarkdown>{masterPrompt}</ReactMarkdown>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-muted-foreground text-sm">
                            <Loader2 className="w-4 h-4 animate-spin" /> Initializing factory…
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

function InfoCard({ icon, label, content, compact }: { icon: React.ReactNode; label: string; content: string; compact?: boolean }) {
  return (
    <Card className="bg-card/40 border-border/30">
      <CardContent className={`${compact ? "p-2" : "p-3"} flex gap-2.5`}>
        <div className="mt-0.5 shrink-0">{icon}</div>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">{label}</p>
          <p className={`text-foreground leading-relaxed ${compact ? "text-[11px] line-clamp-2" : "text-xs"}`}>{content}</p>
        </div>
      </CardContent>
    </Card>
  );
}

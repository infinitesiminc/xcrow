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
import { Copy, Check, Rocket, ArrowLeft, Loader2, Sparkles, Zap, Target, Shield, DollarSign, Users, Lightbulb, Building2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { useVerticalMap } from "@/hooks/use-vertical-map";

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
  const saved = loadResult();
  const [phase, setPhase] = useState<Phase>(saved ? "result" : "browse");
  const [selectedIncumbent, setSelectedIncumbent] = useState<IncumbentWithCluster | null>(null);
  const [masterPrompt, setMasterPrompt] = useState(saved?.prompt || "");
  const [savedName, setSavedName] = useState(saved?.incumbentName || "");
  const [isStreaming, setIsStreaming] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeCluster, setActiveCluster] = useState<number | null>(null);
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
            <div className="flex flex-wrap gap-2 justify-center">
              <button
                onClick={() => setActiveCluster(null)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${activeCluster === null ? "bg-primary text-primary-foreground" : "bg-muted/30 text-muted-foreground hover:bg-muted/50"}`}
              >
                All
              </button>
              {INDUSTRY_CLUSTERS.map(c => (
                <button
                  key={c.id}
                  onClick={() => setActiveCluster(activeCluster === c.id ? null : c.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${activeCluster === c.id ? "bg-primary text-primary-foreground" : "bg-muted/30 text-muted-foreground hover:bg-muted/50"}`}
                >
                  {c.emoji} {c.name}
                </button>
              ))}
            </div>
          </div>

          <div className="max-w-6xl mx-auto px-4 pb-16">
            {filteredClusters.map(cluster => (
              <div key={cluster.id} className="mb-8">
                <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                  <span>{cluster.emoji}</span> {cluster.name}
                  <span className="text-[10px] font-normal text-muted-foreground/60">— {cluster.timingCatalyst.slice(0, 80)}…</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {cluster.incumbents.map(inc => (
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
                          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-2">{inc.vulnerability}</p>
                          <p className="text-[10px] text-primary/80 font-medium line-clamp-1">💡 {inc.asymmetricAngle.slice(0, 80)}…</p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
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

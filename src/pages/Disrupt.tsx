import { useState, useRef } from "react";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { INDUSTRY_CLUSTERS, type DisruptionIncumbent, type IndustryCluster } from "@/data/disruption-incumbents";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, Rocket, ArrowLeft, Loader2, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

type Phase = "browse" | "generating" | "result";

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
  const [selectedIncumbent, setSelectedIncumbent] = useState<(DisruptionIncumbent & { clusterName: string; clusterEmoji: string; clusterColor: string }) | null>(null);
  const [masterPrompt, setMasterPrompt] = useState(saved?.prompt || "");
  const [savedName, setSavedName] = useState(saved?.incumbentName || "");
  const [isStreaming, setIsStreaming] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeCluster, setActiveCluster] = useState<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const promptRef = useRef<HTMLDivElement>(null);

  const allIncumbents = INDUSTRY_CLUSTERS.flatMap(c =>
    c.incumbents.map(i => ({ ...i, clusterName: c.name, clusterEmoji: c.emoji, clusterColor: c.color }))
  );

  const pick = async (inc: typeof allIncumbents[0]) => {
    setSelectedIncumbent(inc);
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
        setPhase("browse");
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
          {/* Hero */}
          <div className="text-center px-4 pt-8 pb-6 max-w-2xl mx-auto">
            <div className="text-4xl mb-3">🏭</div>
            <h1 className="text-2xl md:text-3xl font-bold font-cinzel text-foreground mb-2">
              Software Factory
            </h1>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Pick a software giant to disrupt. AI generates a master prompt you can paste into any builder agent to launch your startup.
            </p>
          </div>

          {/* Cluster Filter Pills */}
          <div className="max-w-5xl mx-auto px-4 mb-6">
            <div className="flex flex-wrap gap-2 justify-center">
              <button
                onClick={() => setActiveCluster(null)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  activeCluster === null
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
                }`}
              >
                All
              </button>
              {INDUSTRY_CLUSTERS.map(c => (
                <button
                  key={c.id}
                  onClick={() => setActiveCluster(activeCluster === c.id ? null : c.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    activeCluster === c.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
                  }`}
                >
                  {c.emoji} {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Incumbent Grid */}
          <div className="max-w-6xl mx-auto px-4 pb-16">
            {filteredClusters.map(cluster => (
              <div key={cluster.id} className="mb-8">
                <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                  <span>{cluster.emoji}</span> {cluster.name}
                  <span className="text-[10px] font-normal text-muted-foreground/60">— {cluster.timingCatalyst.slice(0, 80)}…</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {cluster.incumbents.map(inc => (
                    <motion.div
                      key={inc.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Card
                        className="cursor-pointer bg-card/60 border-border/40 hover:border-primary/40 hover:bg-card/80 transition-all group"
                        onClick={() => pick({ ...inc, clusterName: cluster.name, clusterEmoji: cluster.emoji, clusterColor: cluster.color })}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors">
                                {inc.name}
                              </h3>
                              <p className="text-[10px] text-muted-foreground">{inc.age}</p>
                            </div>
                            <Badge
                              variant="outline"
                              className="text-[9px] shrink-0"
                              style={{ borderColor: `hsl(${cluster.color} / 0.4)`, color: `hsl(${cluster.color})` }}
                            >
                              {inc.vector}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-2">
                            {inc.vulnerability}
                          </p>
                          <p className="text-[10px] text-primary/80 font-medium line-clamp-1">
                            💡 {inc.asymmetricAngle.slice(0, 80)}…
                          </p>
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

  // ── GENERATING / RESULT PHASE ──
  return (
    <>
      <Helmet>
        <title>{phase === "generating" ? "Generating..." : `Disrupt ${savedName}`} — Software Factory | Xcrow</title>
      </Helmet>
      <Navbar />
      <div className="min-h-screen bg-background pt-20">
        <div className="max-w-3xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={restart}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Pick another
            </button>
            {phase === "result" && (
              <Button onClick={copyPrompt} size="sm" className="gap-1.5">
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied!" : "Copy Master Prompt"}
              </Button>
            )}
          </div>

          {/* Target Info */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              {phase === "generating" && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
              {phase === "result" && <Sparkles className="w-4 h-4 text-primary" />}
              <h1 className="text-lg font-bold text-foreground">
                {phase === "generating"
                  ? `Generating blueprint to disrupt ${selectedIncumbent?.name || savedName}…`
                  : `Master Prompt: Disrupt ${savedName}`
                }
              </h1>
            </div>
            {phase === "result" && (
              <p className="text-xs text-muted-foreground">
                Copy this prompt and paste it into <strong>Lovable</strong>, <strong>Cursor</strong>, or any AI builder to start building your startup.
              </p>
            )}
          </div>

          {/* Prompt Output */}
          <Card className="bg-card/60 border-border/40">
            <CardContent className="p-0">
              <ScrollArea className={phase === "generating" ? "h-[60vh]" : "max-h-[70vh]"}>
                <div ref={promptRef} className="p-6">
                  {masterPrompt ? (
                    <div className="prose prose-sm prose-invert max-w-none text-sm leading-relaxed">
                      <ReactMarkdown>{masterPrompt}</ReactMarkdown>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Initializing factory…
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Bottom CTA */}
          {phase === "result" && (
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button onClick={copyPrompt} size="lg" className="gap-2 w-full sm:w-auto">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied!" : "Copy & Paste into Lovable"}
              </Button>
              <Button onClick={restart} variant="outline" size="lg" className="gap-2 w-full sm:w-auto">
                <Rocket className="w-4 h-4" /> Disrupt Another
              </Button>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}

import { useState, useRef, useCallback, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { INDUSTRY_CLUSTERS, type DisruptionIncumbent, type IndustryCluster } from "@/data/disruption-incumbents";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Rocket, Zap, ArrowRight, ChevronDown, RotateCcw } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import FactoryPipeline, { type StageId, type StageData, STAGE_META } from "@/components/disrupt/FactoryPipeline";
import LaunchpadGrid from "@/components/disrupt/LaunchpadGrid";

type Phase = "intake" | "running" | "complete";
type ChatMsg = { role: "user" | "assistant"; content: string };

const FACTORY_KEY = "software-factory-state";

interface FactoryState {
  phase: Phase;
  idea: string;
  targetName?: string;
  stages: Record<StageId, StageData>;
  agentLog: string;
}

const emptyStages = (): Record<StageId, StageData> => ({
  "market-intel": { status: "queued", content: "" },
  "business-model": { status: "queued", content: "" },
  "tech-blueprint": { status: "queued", content: "" },
  "landing-page": { status: "queued", content: "" },
  "launch-plan": { status: "queued", content: "" },
  "pitch-summary": { status: "queued", content: "" },
});

function loadFactory(): FactoryState | null {
  try {
    const raw = localStorage.getItem(FACTORY_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveFactory(state: FactoryState) {
  localStorage.setItem(FACTORY_KEY, JSON.stringify(state));
}

export default function Disrupt() {
  const isMobile = useIsMobile();
  const saved = loadFactory();
  const [phase, setPhase] = useState<Phase>(saved?.phase === "complete" ? "complete" : "intake");
  const [idea, setIdea] = useState(saved?.idea || "");
  const [targetName, setTargetName] = useState(saved?.targetName || "");
  const [stages, setStages] = useState<Record<StageId, StageData>>(saved?.phase === "complete" ? saved.stages : emptyStages());
  const [agentLog, setAgentLog] = useState(saved?.agentLog || "");
  const [chatInput, setChatInput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [showTargets, setShowTargets] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // All incumbents flat
  const allIncumbents = INDUSTRY_CLUSTERS.flatMap(c => c.incumbents.map(i => ({ ...i, clusterName: c.name, clusterEmoji: c.emoji })));

  const scrollLog = () => setTimeout(() => logEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);

  const pickTarget = (inc: typeof allIncumbents[0]) => {
    setIdea(`Build an AI-powered alternative to ${inc.name} (${inc.clusterName})`);
    setTargetName(inc.name);
    setShowTargets(false);
  };

  const restart = () => {
    localStorage.removeItem(FACTORY_KEY);
    setPhase("intake");
    setIdea("");
    setTargetName("");
    setStages(emptyStages());
    setAgentLog("");
    setChatInput("");
  };

  const launchFactory = async () => {
    if (!idea.trim()) { toast.error("Describe your startup idea first"); return; }
    setPhase("running");
    setIsRunning(true);
    setStages(emptyStages());
    setAgentLog("🏭 Starting Software Factory...\n");
    scrollLog();

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/disruption-battle`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
          body: JSON.stringify({ action: "factory", payload: { idea, targetName } }),
          signal: controller.signal,
        },
      );
      if (!resp.ok || !resp.body) throw new Error("Factory failed");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let currentStage: StageId | null = null;
      let stageContent: Record<StageId, string> = { "market-intel": "", "business-model": "", "tech-blueprint": "", "landing-page": "", "launch-plan": "", "pitch-summary": "" };
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (!content) continue;
            fullText += content;

            // Parse stage markers
            const startMatch = content.match(/\[STAGE:([a-z-]+):START\]/);
            const completeMatch = content.match(/\[STAGE:([a-z-]+):COMPLETE\]/);

            if (startMatch) {
              const stageId = startMatch[1] as StageId;
              currentStage = stageId;
              setStages(prev => ({ ...prev, [stageId]: { status: "running", content: "" } }));
              setAgentLog(prev => prev + `\n▶ Starting ${STAGE_META.find(s => s.id === stageId)?.label}...\n`);
              scrollLog();
            } else if (completeMatch) {
              const stageId = completeMatch[1] as StageId;
              setStages(prev => ({ ...prev, [stageId]: { status: "complete", content: stageContent[stageId] } }));
              setAgentLog(prev => prev + `✅ ${STAGE_META.find(s => s.id === stageId)?.label} complete\n`);
              currentStage = null;
              scrollLog();
            } else if (currentStage) {
              // Strip marker fragments from content
              const cleanContent = content.replace(/\[STAGE:[a-z-]+:(START|COMPLETE)\]/g, "");
              if (cleanContent) {
                stageContent[currentStage] += cleanContent;
                setStages(prev => ({
                  ...prev,
                  [currentStage!]: { status: "running", content: stageContent[currentStage!] },
                }));
              }
            }
          } catch { /* partial json */ }
        }
      }

      // Check full text for any missed markers
      for (const meta of STAGE_META) {
        const startIdx = fullText.indexOf(`[STAGE:${meta.id}:START]`);
        const endIdx = fullText.indexOf(`[STAGE:${meta.id}:COMPLETE]`);
        if (startIdx !== -1 && endIdx !== -1) {
          const extracted = fullText.slice(startIdx + `[STAGE:${meta.id}:START]`.length, endIdx).trim();
          if (extracted) {
            setStages(prev => ({ ...prev, [meta.id]: { status: "complete", content: extracted } }));
          }
        }
      }

      setPhase("complete");
      setAgentLog(prev => prev + "\n🎉 All stages complete! Your startup blueprint is ready.\n");
      const finalState: FactoryState = { phase: "complete", idea, targetName, stages: (() => {
        const s = emptyStages();
        for (const meta of STAGE_META) {
          const startIdx = fullText.indexOf(`[STAGE:${meta.id}:START]`);
          const endIdx = fullText.indexOf(`[STAGE:${meta.id}:COMPLETE]`);
          if (startIdx !== -1 && endIdx !== -1) {
            s[meta.id] = { status: "complete", content: fullText.slice(startIdx + `[STAGE:${meta.id}:START]`.length, endIdx).trim() };
          }
        }
        return s;
      })(), agentLog: "" };
      saveFactory(finalState);
    } catch (e: any) {
      if (e.name !== "AbortError") {
        toast.error("Factory encountered an error. Try again.");
        setAgentLog(prev => prev + "\n❌ Error occurred. Please try again.\n");
      }
    } finally {
      setIsRunning(false);
    }
  };

  // ── INTAKE PHASE ──
  if (phase === "intake") {
    return (
      <>
        <Helmet>
          <title>Software Factory — AI Startup Builder | Xcrow</title>
          <meta name="description" content="From idea to startup blueprint in 2 minutes. AI-powered market research, business model, tech stack, and launch plan." />
        </Helmet>
        <Navbar />
        <div className="min-h-screen bg-background pt-20 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-lg"
          >
            <div className="text-center mb-8">
              <div className="text-4xl mb-3">🏭</div>
              <h1 className="text-3xl font-bold font-cinzel text-foreground mb-2">Software Factory</h1>
              <p className="text-muted-foreground text-sm">From idea to launchpad in 2 minutes</p>
            </div>

            <Card className="bg-card/80 border-border/50">
              <CardContent className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">Describe your startup idea</label>
                  <Textarea
                    value={idea}
                    onChange={e => setIdea(e.target.value)}
                    placeholder="e.g. Build an AI-powered alternative to QuickBooks for freelancers..."
                    className="min-h-[100px] bg-background/50 border-border/50 text-sm"
                  />
                </div>

                <div className="text-center text-xs text-muted-foreground">or</div>

                <div>
                  <button
                    onClick={() => setShowTargets(!showTargets)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-md bg-muted/20 border border-border/30 text-xs text-muted-foreground hover:bg-muted/30 transition-colors"
                  >
                    <span>🎯 Pick a SaaS company to disrupt</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showTargets ? "rotate-180" : ""}`} />
                  </button>

                  <AnimatePresence>
                    {showTargets && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-2 max-h-48 overflow-y-auto space-y-1 pr-1">
                          {INDUSTRY_CLUSTERS.map(cluster => (
                            <div key={cluster.id}>
                              <p className="text-[10px] text-muted-foreground font-medium px-1 py-1">{cluster.emoji} {cluster.name}</p>
                              {cluster.incumbents.map(inc => (
                                <button
                                  key={inc.id}
                                  onClick={() => pickTarget({ ...inc, clusterName: cluster.name, clusterEmoji: cluster.emoji })}
                                  className="w-full text-left px-2 py-1.5 rounded text-xs hover:bg-muted/30 transition-colors flex items-center justify-between"
                                >
                                  <span className="font-medium text-foreground">{inc.name}</span>
                                  <Badge variant="outline" className="text-[9px]">{inc.vector}</Badge>
                                </button>
                              ))}
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <Button onClick={launchFactory} className="w-full gap-2" size="lg" disabled={!idea.trim()}>
                  <Rocket className="w-4 h-4" /> Launch Factory
                </Button>

                <p className="text-[10px] text-muted-foreground/60 text-center">
                  AI will research your market, design a business model, plan your tech stack, write landing page copy, create a launch plan, and outline your pitch — all in one shot.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
        <Footer />
      </>
    );
  }

  // ── COMPLETE PHASE ──
  if (phase === "complete" && !isRunning) {
    return (
      <>
        <Helmet>
          <title>Your Startup Blueprint — Software Factory | Xcrow</title>
        </Helmet>
        <Navbar />
        <div className="min-h-screen bg-background pt-20">
          <LaunchpadGrid stages={stages} idea={idea} onRestart={restart} />
        </div>
        <Footer />
      </>
    );
  }

  // ── RUNNING PHASE ──
  return (
    <>
      <Helmet>
        <title>Building Blueprint... — Software Factory | Xcrow</title>
      </Helmet>
      <Navbar />
      <div className="min-h-screen bg-background pt-20">
        <div className={`flex h-[calc(100vh-5rem)] ${isMobile ? "flex-col" : ""}`}>
          {/* Left: Agent Log */}
          <div className={`${isMobile ? "flex-1" : "flex-1"} flex flex-col border-r border-border/30`}>
            <div className="px-4 py-3 border-b border-border/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Agent Log</span>
              </div>
              <Badge variant="outline" className="text-[10px] animate-pulse">Building...</Badge>
            </div>
            <ScrollArea className="flex-1 p-4">
              <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed">{agentLog}</pre>
              <div ref={logEndRef} />
            </ScrollArea>
          </div>

          {/* Right: Pipeline */}
          <div className={`${isMobile ? "h-64 border-t" : "w-80"} border-border/30 bg-card/20`}>
            <FactoryPipeline stages={stages} />
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

import { useState, useRef, useCallback, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { INDUSTRY_CLUSTERS, DISRUPTION_STEPS, DISRUPTION_VECTORS, type IndustryCluster, type DisruptionIncumbent } from "@/data/disruption-incumbents";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { motion, AnimatePresence } from "framer-motion";
import { Swords, Shield, Target, ArrowLeft, Send, Trophy, Zap, Map as MapIcon, ChevronRight, Lock, CheckCircle2, Rocket, Users, BarChart3, Castle, Presentation, Brain, Hammer, Megaphone, Building2, Lightbulb, Search, MessageSquare } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { DisruptCustomerDiscovery } from "@/components/disrupt/DisruptCustomerDiscovery";
import { DisruptVentureBuild } from "@/components/disrupt/DisruptVentureBuild";
import { DisruptGTM } from "@/components/disrupt/DisruptGTM";
import { DisruptMoatDefense } from "@/components/disrupt/DisruptMoatDefense";
import { DisruptPitchBattle } from "@/components/disrupt/DisruptPitchBattle";
import { DisruptMissionDebrief } from "@/components/disrupt/DisruptMissionDebrief";

// Active view within the unified layout
type ActiveView = "chat" | "hub" | "cluster" | "act2" | "act3" | "act4" | "act5" | "act6" | "act7";

type ChatMsg = { role: "user" | "assistant"; content: string };

interface ScoreResult {
  overall: number;
  dimensions: { name: string; score: number; feedback: string }[];
  title: string;
  summary: string;
  nextSteps: string[];
}

export interface MissionProgress {
  act1Score?: number;
  act2Score?: number;
  act3Score?: number;
  act4Score?: number;
  act5Score?: number;
  act6Score?: number;
  totalScore?: number;
  founderProfile?: string;
  completedActs: number[];
  status: "not-started" | "in-progress" | "completed";
  battleTranscript?: ChatMsg[];
  scoreResult?: ScoreResult;
  ventureCanvas?: any;
  pitchData?: any;
}

const PROGRESS_KEY = "disrupt-progress";

function loadProgress(): Record<string, MissionProgress> {
  try { return JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}"); } catch { return {}; }
}
function saveProgress(data: Record<string, MissionProgress>) {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(data));
}
function getMissionProgress(incumbentId: number): MissionProgress {
  return loadProgress()[String(incumbentId)] || { completedActs: [], status: "not-started" };
}
function updateMissionProgress(incumbentId: number, update: Partial<MissionProgress>) {
  const all = loadProgress();
  const current = all[String(incumbentId)] || { completedActs: [], status: "not-started" };
  all[String(incumbentId)] = { ...current, ...update };
  saveProgress(all);
}

const ACTS = [
  { num: 2, name: "Discover", subtitle: "Find Real Pain Points", icon: Search, emoji: "🔍", skill: "Customer Pain Mining & Market Research", description: "Find real customer complaints from G2, Reddit, and Twitter. Build your pain point report.", color: "hsl(var(--neon-cyan))" },
  { num: 3, name: "Architect", subtitle: "Design Your SaaS", icon: Hammer, emoji: "📋", skill: "SaaS Business Model & AI-First Architecture", description: "Design your SaaS model — pricing tiers, AI features, tech stack, and build timeline.", color: "hsl(var(--neon-purple))" },
  { num: 4, name: "Launch", subtitle: "Ship & Grow", icon: Megaphone, emoji: "🚀", skill: "PLG, Content Marketing & Growth Hacking", description: "Launch playbook — Product Hunt, Reddit, cold outreach, content strategy, and first 100 users.", color: "hsl(var(--neon-lime))" },
  { num: 5, name: "Defend", subtitle: "Build the Moat", icon: Castle, emoji: "🏰", skill: "Competitive Strategy & AI Moat Building", description: "Why can't the incumbent just add AI? Defend your speed, focus, and AI-native advantage.", color: "hsl(var(--warning))" },
  { num: 6, name: "Pitch", subtitle: "Face the VCs", icon: Presentation, emoji: "💼", skill: "Storytelling & AI Leverage Narrative", description: "Pitch to investors — ARR projections, unit economics, and your AI leverage story.", color: "hsl(var(--neon-pink))" },
  { num: 7, name: "Debrief", subtitle: "Founder Report", icon: Brain, emoji: "📊", skill: "Startup Readiness Assessment", description: "Get your score, startup valuation, and Founder Profile — idea viability, founder-market fit, execution plan.", color: "hsl(var(--success))" },
];

export default function Disrupt() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [activeView, setActiveView] = useState<ActiveView>("chat");

  // Current mission context
  const [selectedCluster, setSelectedCluster] = useState<IndustryCluster | null>(null);
  const [selectedIncumbent, setSelectedIncumbent] = useState<DisruptionIncumbent | null>(null);
  // Act scores for current mission
  const [actScores, setActScores] = useState<Record<number, number>>({});

  // Unified strategist state
  const [strategistMessages, setStrategistMessages] = useState<ChatMsg[]>([
    { role: "assistant", content: `What kind of software would you love to rebuild with AI?\n\nTell me what frustrates you — or pick a target from the sidebar.` }
  ]);
  const [strategistInput, setStrategistInput] = useState("");
  const [isStrategistStreaming, setIsStrategistStreaming] = useState(false);
  const strategistEndRef = useRef<HTMLDivElement>(null);
  const [briefingData, setBriefingData] = useState<string | null>(null);

  // Build a compact index of all incumbents for the discovery AI
  const allTargetsIndex = INDUSTRY_CLUSTERS.map(c => ({
    clusterId: c.id, name: c.name, emoji: c.emoji, catalyst: c.timingCatalyst,
    incumbents: c.incumbents.map(i => ({ id: i.id, name: i.name, vulnerability: i.vulnerability, vector: i.vector, beachheadNiche: i.beachheadNiche }))
  }));

  const sendStrategistMessage = async (overrideInput?: string) => {
    const text = overrideInput || strategistInput.trim();
    if (!text || isStrategistStreaming) return;
    const userMsg: ChatMsg = { role: "user", content: text };
    const updated = [...strategistMessages, userMsg];
    setStrategistMessages(updated);
    setStrategistInput("");
    setIsStrategistStreaming(true);
    setTimeout(() => strategistEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);

    const action = selectedIncumbent ? "briefing" : "discovery";
    const payload = selectedIncumbent && selectedCluster
      ? { incumbent: selectedIncumbent, cluster: selectedCluster, messages: updated, allIncumbents: selectedCluster.incumbents.map(i => ({ name: i.name, id: i.id, vulnerability: i.vulnerability, vector: i.vector })) }
      : { messages: updated, targetsIndex: allTargetsIndex };

    let assistantContent = "";
    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/disruption-battle`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
          body: JSON.stringify({ action, payload }),
        },
      );
      if (!resp.ok || !resp.body) throw new Error("Strategist failed");
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
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
            if (content) {
              assistantContent += content;
              setStrategistMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant" && prev.length === updated.length + 1) {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantContent } : m);
                }
                return [...prev, { role: "assistant", content: assistantContent }];
              });
              setTimeout(() => strategistEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
            }
          } catch { /* partial */ }
        }
      }
      if (action === "briefing" && !briefingData && assistantContent.length > 100) {
        setBriefingData(assistantContent);
        setStrategistMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant") {
            return prev.map((m, idx) => idx === prev.length - 1
              ? { ...m, content: `✅ **Intel briefing loaded** — check the cards on the right for the full breakdown.\n\nAsk me anything about the company, technology, or market. Or pick an act from the sidebar to start building.` }
              : m);
          }
          return prev;
        });
      }
    } catch { toast.error("Chat failed. Try again."); }
    finally { setIsStrategistStreaming(false); }
  };

  const selectTargetFromChat = (incumbentId: number) => {
    const cluster = INDUSTRY_CLUSTERS.find(c => c.incumbents.some(i => i.id === incumbentId));
    const incumbent = cluster?.incumbents.find(i => i.id === incumbentId);
    if (cluster && incumbent) {
      setSelectedCluster(cluster);
      setSelectedIncumbent(incumbent);
      setBriefingData(null);
      setActiveView("chat");
      const briefingReq = `I want to disrupt ${incumbent.name}. Brief me on everything I need to know.`;
      const userMsg: ChatMsg = { role: "user", content: briefingReq };
      const updated = [...strategistMessages, userMsg];
      setStrategistMessages(updated);

      setTimeout(() => {
        setIsStrategistStreaming(true);
        (async () => {
          let assistantContent = "";
          try {
            const resp = await fetch(
              `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/disruption-battle`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json", apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
                body: JSON.stringify({ action: "briefing", payload: { incumbent, cluster, messages: [{ role: "user", content: "Brief me on this company." }] } }),
              },
            );
            if (!resp.ok || !resp.body) throw new Error("Briefing failed");
            const reader = resp.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";
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
                  if (content) {
                    assistantContent += content;
                    setStrategistMessages(prev => {
                      const last = prev[prev.length - 1];
                      if (last?.role === "assistant" && prev.length === updated.length + 1) {
                        return prev.map((m, idx) => idx === prev.length - 1 ? { ...m, content: assistantContent } : m);
                      }
                      return [...prev, { role: "assistant", content: assistantContent }];
                    });
                    setTimeout(() => strategistEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
                  }
                } catch { /* partial */ }
              }
            }
            if (assistantContent.length > 100) {
              setBriefingData(assistantContent);
              setStrategistMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return prev.map((m, idx) => idx === prev.length - 1
                    ? { ...m, content: `✅ **Intel briefing loaded** — check the cards on the right for the full breakdown.\n\nAsk me anything about the company, technology, or market. Or pick an act from the sidebar to start building.` }
                    : m);
                }
                return prev;
              });
            }
          } catch { toast.error("Briefing failed."); }
          finally { setIsStrategistStreaming(false); }
        })();
      }, 50);

      updateMissionProgress(incumbent.id, { status: "in-progress" });
    }
  };

  const switchTarget = (newInc: DisruptionIncumbent) => {
    if (!selectedCluster) return;
    setSelectedIncumbent(newInc);
    setBriefingData(null);
    selectTargetFromChat(newInc.id);
  };

  const startMission = (cluster: IndustryCluster, incumbent: DisruptionIncumbent) => {
    setSelectedCluster(cluster);
    setSelectedIncumbent(incumbent);
    const progress = getMissionProgress(incumbent.id);
    if (progress.completedActs.length > 0) {
      setActScores({});
      progress.completedActs.forEach(actNum => {
        const key = `act${actNum}Score` as keyof MissionProgress;
        if (progress[key]) setActScores(prev => ({ ...prev, [actNum]: progress[key] as number }));
      });
    }
    setActiveView("chat");
    setBriefingData(null);
    selectTargetFromChat(incumbent.id);
    updateMissionProgress(incumbent.id, { status: "in-progress" });
  };

  const launchAct = (actNum: number) => {
    if (!selectedIncumbent || !selectedCluster) return;
    setActiveView(actNum === 7 ? "act7" : `act${actNum}` as ActiveView);
  };

  const completeAct = (actNum: number, actScore: number, extraData?: Partial<MissionProgress>) => {
    if (!selectedIncumbent) return;
    const progress = getMissionProgress(selectedIncumbent.id);
    const completed = [...new Set([...(progress.completedActs || []), actNum])];
    setActScores(prev => ({ ...prev, [actNum]: actScore }));
    updateMissionProgress(selectedIncumbent.id, {
      [`act${actNum}Score`]: actScore,
      completedActs: completed,
      ...extraData,
    });
    setActiveView("chat"); // Return to chat after completing an act
    toast.success(`${ACTS.find(a => a.num === actNum)?.name || "Act"} complete! Score: ${actScore}`);
  };

  // Build solo team/room objects for child components
  const soloRoom = {
    id: "solo", room_code: "", name: "Solo", created_by: user?.id || "",
    status: "venture", duration_minutes: 60, max_teams: 1, max_team_size: 1,
    started_at: null, ends_at: null, created_at: "",
  };
  const soloTeam = selectedIncumbent && selectedCluster ? {
    id: "solo", room_id: "solo", name: "Solo", color: "#8B5CF6",
    incumbent_id: String(selectedIncumbent.id), cluster_id: String(selectedCluster.id),
    current_step: 6, total_score: 0, step_scores: null,
    battle_transcript: null, score_result: null,
    completed_at: null, venture_canvas: null, pitch_data: null, act: 2,
  } : null;

  // Parse selectable targets from last AI message
  const selectableTargets: { id: number; name: string }[] = [];
  const lastAssistant = [...strategistMessages].reverse().find(m => m.role === "assistant");
  if (lastAssistant && !selectedIncumbent) {
    const matches = lastAssistant.content.matchAll(/\[SELECT:(\d+):([^\]]+)\]/g);
    for (const match of matches) {
      selectableTargets.push({ id: parseInt(match[1]), name: match[2] });
    }
  }

  const completedActs = selectedIncumbent ? (getMissionProgress(selectedIncumbent.id).completedActs || []) : [];
  const hasTarget = !!selectedIncumbent && !!selectedCluster;
  const isActView = activeView.startsWith("act");

  return (
    <>
      <Helmet>
        <title>AI Venture Lab — Software Startup Simulation | Xcrow</title>
        <meta name="description" content="Learn to launch AI-powered software startups. Analyze 46 incumbents across 15 verticals. 6-act simulation from idea to investor pitch." />
      </Helmet>
      <Navbar />
      <div className="min-h-screen bg-background pt-20">
        <AnimatePresence mode="wait">
          {activeView === "hub" && (
            <motion.div key="hub" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <MissionHub
                onSelectCluster={(c) => { setSelectedCluster(c); setActiveView("cluster"); }}
                progress={loadProgress()}
                onStartDiscovery={() => { setSelectedIncumbent(null); setSelectedCluster(null); setBriefingData(null); setActiveView("chat"); }}
              />
            </motion.div>
          )}

          {activeView === "cluster" && selectedCluster && (
            <motion.div key="cluster" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
              <ClusterDetail
                cluster={selectedCluster}
                onBack={() => setActiveView("hub")}
                onStartMission={(inc) => startMission(selectedCluster, inc)}
                progress={loadProgress()}
              />
            </motion.div>
          )}

          {(activeView === "chat" || isActView) && (
            <motion.div key="main" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <UnifiedLayout
                /* Sidebar props */
                hasTarget={hasTarget}
                incumbent={selectedIncumbent}
                cluster={selectedCluster}
                acts={ACTS}
                completedActs={completedActs}
                actScores={actScores}
                activeView={activeView}
                onLaunchAct={launchAct}
                onBackToChat={() => setActiveView("chat")}
                onBrowseMap={() => setActiveView("hub")}
                isMobile={isMobile}
                /* Chat props */
                messages={strategistMessages}
                input={strategistInput}
                setInput={setStrategistInput}
                onSend={() => sendStrategistMessage()}
                onSendText={(t) => sendStrategistMessage(t)}
                isStreaming={isStrategistStreaming}
                chatEndRef={strategistEndRef}
                onSelectTarget={selectTargetFromChat}
                selectableTargets={selectableTargets}
                briefingData={briefingData}
                onSwitchTarget={switchTarget}
                /* Act content */
                actContent={
                  isActView && selectedIncumbent && selectedCluster ? (
                    <>
                      {activeView === "act2" && <DisruptCustomerDiscovery incumbent={selectedIncumbent} cluster={selectedCluster} onComplete={(s) => completeAct(2, s)} />}
                      {activeView === "act3" && soloTeam && <DisruptVentureBuild room={soloRoom as any} team={soloTeam as any} onComplete={() => completeAct(3, 70)} />}
                      {activeView === "act4" && <DisruptGTM incumbent={selectedIncumbent} cluster={selectedCluster} onComplete={(s) => completeAct(4, s)} />}
                      {activeView === "act5" && <DisruptMoatDefense incumbent={selectedIncumbent} cluster={selectedCluster} onComplete={(s) => completeAct(5, s)} />}
                      {activeView === "act6" && soloTeam && <DisruptPitchBattle room={soloRoom as any} team={soloTeam as any} teams={[]} members={[]} onComplete={() => completeAct(6, 70)} />}
                      {activeView === "act7" && <DisruptMissionDebrief incumbent={selectedIncumbent} cluster={selectedCluster} actScores={actScores} onBackToHub={() => setActiveView("chat")} />}
                    </>
                  ) : null
                }
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <Footer />
    </>
  );
}


/* ── Unified Layout: Sidebar (if target) + Chat/Act + Context ── */
function UnifiedLayout({
  hasTarget, incumbent, cluster, acts, completedActs, actScores, activeView,
  onLaunchAct, onBackToChat, onBrowseMap, isMobile,
  messages, input, setInput, onSend, onSendText, isStreaming, chatEndRef,
  onSelectTarget, selectableTargets, briefingData, onSwitchTarget,
  actContent,
}: {
  hasTarget: boolean; incumbent: DisruptionIncumbent | null; cluster: IndustryCluster | null;
  acts: typeof ACTS; completedActs: number[]; actScores: Record<number, number>;
  activeView: ActiveView; onLaunchAct: (n: number) => void;
  onBackToChat: () => void; onBrowseMap: () => void; isMobile: boolean;
  messages: ChatMsg[]; input: string; setInput: (v: string) => void; onSend: () => void;
  onSendText: (t: string) => void; isStreaming: boolean; chatEndRef: React.RefObject<HTMLDivElement>;
  onSelectTarget: (id: number) => void; selectableTargets: { id: number; name: string }[];
  briefingData: string | null; onSwitchTarget: (inc: DisruptionIncumbent) => void;
  actContent: React.ReactNode;
}) {
  const isActView = activeView.startsWith("act");

  // ── Mobile layout ──
  if (isMobile) {
    return (
      <div className="flex flex-col h-[calc(100vh-5rem)]">
        {/* Top nav pills when target selected */}
        {hasTarget && (
          <div className="flex items-center gap-1 px-3 py-2 border-b border-border/30 overflow-x-auto shrink-0">
            <button
              onClick={onBackToChat}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs whitespace-nowrap transition-colors shrink-0 ${
                activeView === "chat" ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground"
              }`}
            >
              <MessageSquare className="w-3 h-3" /> Chat
            </button>
            {acts.map((act, i) => {
              const isActive = activeView === `act${act.num}`;
              const isCompleted = completedActs.includes(act.num);
              return (
                <button
                  key={act.num}
                  onClick={() => onLaunchAct(act.num)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs whitespace-nowrap transition-colors shrink-0 ${
                    isActive ? "bg-primary text-primary-foreground" : isCompleted ? "bg-success/10 text-success" : "bg-muted/50 text-muted-foreground"
                  }`}
                >
                  {isCompleted ? "✓" : i + 1} {act.name}
                </button>
              );
            })}
          </div>
        )}
        <div className="flex-1 overflow-y-auto min-h-0">
          {isActView ? actContent : (
            <ChatPanel
              messages={messages} input={input} setInput={setInput} onSend={onSend}
              onSendText={onSendText} isStreaming={isStreaming} chatEndRef={chatEndRef}
              onSelectTarget={onSelectTarget} selectableTargets={selectableTargets}
              selectedIncumbent={incumbent} selectedCluster={cluster}
              briefingData={briefingData} onBrowseMap={onBrowseMap}
            />
          )}
        </div>
      </div>
    );
  }

  // ── Desktop layout ──
  return (
    <div className="flex h-[calc(100vh-5rem)]">
      {/* Left sidebar — only when target selected */}
      {hasTarget && incumbent && cluster && (
        <div className="w-48 border-r border-border/50 bg-card/30 flex flex-col shrink-0">
          <div className="p-3 border-b border-border/30">
            <div className="flex items-center gap-2">
              <span className="text-base">{cluster.emoji}</span>
              <div className="min-w-0">
                <p className="font-cinzel font-bold text-xs text-foreground truncate">{incumbent.name}</p>
                <p className="text-[10px] text-muted-foreground truncate">{cluster.name}</p>
              </div>
            </div>
          </div>
          <nav className="flex-1 overflow-y-auto py-1">
            {/* Chat / Strategist link */}
            <button
              onClick={onBackToChat}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors ${
                activeView === "chat" ? "bg-primary/10 border-l-2 border-primary" : "hover:bg-muted/40 border-l-2 border-transparent"
              }`}
            >
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                activeView === "chat" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
              }`}>
                <MessageSquare className="w-3 h-3" />
              </div>
              <div className="min-w-0">
                <p className={`text-xs font-medium truncate ${activeView === "chat" ? "text-primary" : "text-foreground"}`}>Strategist</p>
              </div>
            </button>

            <div className="h-px bg-border/20 mx-3 my-1" />

            {/* Act links */}
            {acts.map((act, i) => {
              const isActive = activeView === `act${act.num}`;
              const isCompleted = completedActs.includes(act.num);
              const actScore = actScores[act.num];
              return (
                <button
                  key={act.num}
                  onClick={() => onLaunchAct(act.num)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors ${
                    isActive ? "bg-primary/10 border-l-2 border-primary" : "hover:bg-muted/40 border-l-2 border-transparent"
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 ${
                      isCompleted ? "text-white" : isActive ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                    }`}
                    style={isCompleted ? { background: act.color } : undefined}
                  >
                    {isCompleted ? "✓" : i + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <p className={`text-xs font-medium truncate ${isActive ? "text-primary" : "text-foreground"}`}>{act.name}</p>
                      {isCompleted && actScore && (
                        <span className="text-[9px] font-bold text-success">{actScore}</span>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate">{act.subtitle}</p>
                  </div>
                </button>
              );
            })}
          </nav>
          <div className="p-2 border-t border-border/30">
            <button onClick={onBrowseMap} className="w-full flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-muted/40 transition-colors text-left">
              <MapIcon className="w-3 h-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">Market Map</span>
            </button>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {isActView ? (
          <div className="h-full overflow-y-auto">{actContent}</div>
        ) : hasTarget ? (
          /* Chat + Context side by side when target selected */
          <ResizablePanelGroup direction="horizontal" className="h-full">
            <ResizablePanel defaultSize={60} minSize={45}>
              <ChatPanel
                messages={messages} input={input} setInput={setInput} onSend={onSend}
                onSendText={onSendText} isStreaming={isStreaming} chatEndRef={chatEndRef}
                onSelectTarget={onSelectTarget} selectableTargets={selectableTargets}
                selectedIncumbent={incumbent} selectedCluster={cluster}
                briefingData={briefingData} onBrowseMap={onBrowseMap}
              />
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={40} minSize={25}>
              <ScrollArea className="h-full">
                <ContextPanel
                  selectedIncumbent={incumbent} selectedCluster={cluster}
                  briefingData={briefingData} onSelectTarget={onSelectTarget}
                  onSwitchTarget={onSwitchTarget} onSendText={onSendText}
                  onBrowseMap={onBrowseMap} hasConversation={messages.length > 1}
                />
              </ScrollArea>
            </ResizablePanel>
          </ResizablePanelGroup>
        ) : (
          /* No target: full-width chat with quick picks */
          <div className="max-w-[1200px] mx-auto h-full">
            <ResizablePanelGroup direction="horizontal" className="h-full rounded-lg border border-border/40">
              <ResizablePanel defaultSize={60} minSize={45}>
                <ChatPanel
                  messages={messages} input={input} setInput={setInput} onSend={onSend}
                  onSendText={onSendText} isStreaming={isStreaming} chatEndRef={chatEndRef}
                  onSelectTarget={onSelectTarget} selectableTargets={selectableTargets}
                  selectedIncumbent={incumbent} selectedCluster={cluster}
                  briefingData={briefingData} onBrowseMap={onBrowseMap}
                />
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={40} minSize={25}>
                <ScrollArea className="h-full">
                  <ContextPanel
                    selectedIncumbent={null} selectedCluster={null}
                    briefingData={null} onSelectTarget={onSelectTarget}
                    onSwitchTarget={onSwitchTarget} onSendText={onSendText}
                    onBrowseMap={onBrowseMap} hasConversation={messages.length > 1}
                  />
                </ScrollArea>
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
        )}
      </div>
    </div>
  );
}


/* ── Chat Panel (extracted for reuse) ── */
function ChatPanel({
  messages, input, setInput, onSend, onSendText, isStreaming, chatEndRef,
  onSelectTarget, selectableTargets, selectedIncumbent, selectedCluster,
  briefingData, onBrowseMap,
}: {
  messages: ChatMsg[]; input: string; setInput: (v: string) => void; onSend: () => void;
  onSendText: (t: string) => void; isStreaming: boolean; chatEndRef: React.RefObject<HTMLDivElement>;
  onSelectTarget: (id: number) => void; selectableTargets: { id: number; name: string }[];
  selectedIncumbent: DisruptionIncumbent | null; selectedCluster: IndustryCluster | null;
  briefingData: string | null; onBrowseMap: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-5 py-3 border-b border-border/30 shrink-0">
        <Rocket className="w-4 h-4 text-primary" />
        <span className="font-cinzel font-bold text-sm text-foreground">AI Strategist</span>
        {selectedIncumbent && (
          <Badge variant="secondary" className="text-xs ml-auto">{selectedIncumbent.name}</Badge>
        )}
      </div>

      <ScrollArea className="flex-1 px-5 py-4">
        <div className="space-y-4 pb-4 max-w-2xl">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-md text-sm"
                  : "bg-muted/40 text-foreground rounded-bl-md"
              }`}>
                <div className={msg.role === "user" ? "text-sm" : "disrupt-prose"}>
                  <ReactMarkdown>{msg.content.replace(/\[SELECT:\d+:[^\]]+\]/g, "")}</ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
          {isStreaming && (messages.length === 0 || messages[messages.length - 1]?.role === "user") && (
            <div className="flex justify-start">
              <div className="bg-muted/40 rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-foreground/30 animate-bounce" />
                  <span className="w-2 h-2 rounded-full bg-foreground/30 animate-bounce [animation-delay:0.1s]" />
                  <span className="w-2 h-2 rounded-full bg-foreground/30 animate-bounce [animation-delay:0.2s]" />
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      </ScrollArea>

      {selectableTargets.length > 0 && !isStreaming && (
        <div className="px-5 pb-2 shrink-0">
          <div className="flex flex-wrap gap-2">
            {selectableTargets.map(t => (
              <Button key={t.id} onClick={() => onSelectTarget(t.id)} className="text-xs" size="sm" variant="secondary">
                <Target className="w-3 h-3 mr-1" /> {t.name}
              </Button>
            ))}
          </div>
        </div>
      )}

      {messages.length <= 1 && !isStreaming && !selectedIncumbent && (
        <div className="flex gap-2 px-5 pb-2 shrink-0">
          <Button variant="outline" size="sm" className="text-xs" onClick={() => onSendText("Show me overpriced enterprise software ripe for disruption")}>
            Overpriced SaaS
          </Button>
          <Button variant="outline" size="sm" className="text-xs" onClick={() => onSendText("What B2B tools have the worst user experience?")}>
            Worst UX tools
          </Button>
        </div>
      )}

      <div className="flex gap-2 shrink-0 px-5 pb-4 pt-2 border-t border-border/20">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={selectedIncumbent ? `Ask about ${selectedIncumbent.name}…` : "What software would you rebuild?"}
          className="min-h-[44px] max-h-[100px] resize-none text-sm"
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(); } }}
          disabled={isStreaming}
        />
        <Button onClick={onSend} disabled={isStreaming || !input.trim()} size="icon" className="shrink-0 self-end">
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}


/* ── Mission Hub ── */
function MissionHub({ onSelectCluster, progress, onStartDiscovery }: { onSelectCluster: (c: IndustryCluster) => void; progress: Record<string, MissionProgress>; onStartDiscovery?: () => void }) {
  const totalCompleted = Object.values(progress).filter(p => p.status === "completed").length;
  const totalInProgress = Object.values(progress).filter(p => p.status === "in-progress").length;
  const allIncumbents = INDUSTRY_CLUSTERS.flatMap(c => c.incumbents);

  function getClusterProgress(cluster: IndustryCluster) {
    return cluster.incumbents.filter(inc => progress[String(inc.id)]?.status === "completed").length;
  }

  return (
    <div className="max-w-7xl mx-auto px-4">
      <div className="text-center mb-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Rocket className="w-4 h-4" /> AI Venture Lab
          </div>
          <h1 className="font-cinzel text-4xl md:text-5xl font-bold text-foreground mb-4">
            Disrupt <span className="text-primary">Software</span> with AI
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-6">
            15 software verticals. 46 incumbents. 6 acts per mission. Learn to build AI-powered startups that disrupt legacy SaaS.
          </p>
          <div className="flex justify-center gap-6 mb-8">
            <div className="text-center">
              <p className="text-3xl font-bold text-foreground">{totalCompleted}</p>
              <p className="text-xs text-muted-foreground">Conquered</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">{totalInProgress}</p>
              <p className="text-xs text-muted-foreground">In Progress</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-muted-foreground">{allIncumbents.length}</p>
              <p className="text-xs text-muted-foreground">Total Targets</p>
            </div>
          </div>
          {onStartDiscovery && (
            <Button onClick={onStartDiscovery} variant="outline" size="lg" className="px-6">
              <Brain className="w-4 h-4 mr-2" /> Help me find software to disrupt
            </Button>
          )}
        </motion.div>
      </div>

      <div className="mb-12">
        <h2 className="font-cinzel text-xl font-bold text-center mb-6 text-foreground">The 6-Act Founder Journey</h2>
        <div className="flex flex-wrap justify-center gap-2 md:gap-0">
          {ACTS.map((act, i) => (
            <div key={act.num} className="flex items-center">
              <div className="flex flex-col items-center text-center w-24 md:w-28">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg mb-1" style={{ background: act.color, color: "white" }}>
                  {act.emoji}
                </div>
                <p className="text-[11px] font-semibold text-foreground">{act.name}</p>
                <p className="text-[11px] text-muted-foreground">{act.subtitle}</p>
              </div>
              {i < ACTS.length - 1 && (
                <ChevronRight className="w-3 h-3 text-muted-foreground/30 hidden md:block -mx-1" />
              )}
            </div>
          ))}
        </div>
      </div>

      {totalInProgress > 0 && (
        <div className="mb-12">
          <h2 className="font-cinzel text-xl font-bold mb-4 text-foreground">🎯 Active Missions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {allIncumbents
              .filter(inc => progress[String(inc.id)]?.status === "in-progress")
              .map(inc => {
                const cluster = INDUSTRY_CLUSTERS.find(c => c.incumbents.some(i => i.id === inc.id))!;
                const p = progress[String(inc.id)]!;
                return (
                  <Card key={inc.id} className="cursor-pointer hover:border-primary/50 transition-all" onClick={() => onSelectCluster(cluster)}>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span>{cluster.emoji}</span>
                        <span className="font-cinzel font-bold text-sm text-foreground">{inc.name}</span>
                      </div>
                      <MiniActRail completedActs={p.completedActs || []} />
                      <p className="text-xs text-muted-foreground mt-2">{p.completedActs?.length || 0}/6 acts completed</p>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        </div>
      )}

      <h2 className="font-cinzel text-xl font-bold mb-4 text-foreground">🗺️ Software Market Map</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-12">
        {INDUSTRY_CLUSTERS.map((cluster) => {
          const done = getClusterProgress(cluster);
          return (
            <motion.div key={cluster.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Card className="cursor-pointer hover:border-primary/50 transition-all group h-full" onClick={() => onSelectCluster(cluster)} style={{ borderColor: `hsl(${cluster.color} / 0.2)` }}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{cluster.emoji}</span>
                    <div className="flex items-center gap-1">
                      {done > 0 && <Badge className="text-[11px] bg-success/20 text-success border-0">{done}/{cluster.incumbents.length} ✓</Badge>}
                      <Badge variant="secondary" className="text-xs">{cluster.incumbents.length} targets</Badge>
                    </div>
                  </div>
                  <CardTitle className="text-base font-cinzel" style={{ color: `hsl(${cluster.color})` }}>{cluster.name}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{cluster.timingCatalyst}</p>
                  <div className="flex flex-wrap gap-1">
                    {cluster.incumbents.slice(0, 3).map(inc => (<Badge key={inc.id} variant="outline" className="text-[11px]">{inc.name}</Badge>))}
                    {cluster.incumbents.length > 3 && <Badge variant="outline" className="text-[11px]">+{cluster.incumbents.length - 3}</Badge>}
                  </div>
                  {done > 0 && <Progress value={(done / cluster.incumbents.length) * 100} className="h-1.5 mt-3" />}
                  <div className="flex items-center gap-1 mt-3 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    View Missions <ChevronRight className="w-3 h-3" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="max-w-4xl mx-auto mb-12">
        <h2 className="font-cinzel text-2xl font-bold text-center mb-8 text-foreground">The 6-Step AI Disruption Framework</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {DISRUPTION_STEPS.map((s) => (
            <Card key={s.step} className="border-border/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{s.emoji}</span>
                  <div>
                    <Badge variant="secondary" className="text-[11px] mb-1">Step {s.step}</Badge>
                    <p className="font-cinzel font-semibold text-sm text-foreground">{s.title}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{s.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Mini Act Progress Rail ── */
function MiniActRail({ completedActs }: { completedActs: number[] }) {
  return (
    <div className="flex items-center gap-1">
      {ACTS.map((act, i) => (
        <div key={act.num} className="flex items-center">
          <div
            className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${
              completedActs.includes(act.num) ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            {completedActs.includes(act.num) ? "✓" : act.num}
          </div>
          {i < ACTS.length - 1 && (
            <div className={`w-2 h-0.5 ${completedActs.includes(act.num) ? "bg-success" : "bg-muted"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

/* ── Cluster Detail with Mission Cards ── */
function ClusterDetail({ cluster, onBack, onStartMission, progress }: {
  cluster: IndustryCluster; onBack: () => void; onStartMission: (inc: DisruptionIncumbent) => void;
  progress: Record<string, MissionProgress>;
}) {
  return (
    <div className="max-w-5xl mx-auto px-4">
      <Button variant="ghost" size="sm" onClick={onBack} className="mb-4"><ArrowLeft className="w-4 h-4 mr-1" /> Back to Map</Button>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">{cluster.emoji}</span>
          <h1 className="font-cinzel text-3xl font-bold" style={{ color: `hsl(${cluster.color})` }}>{cluster.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-warning" />
          <p className="text-sm text-muted-foreground">{cluster.timingCatalyst}</p>
        </div>
      </div>
      <div className="space-y-4">
        {cluster.incumbents.map((inc) => {
          const p = progress[String(inc.id)];
          const completed = p?.completedActs || [];
          const isCompleted = p?.status === "completed";
          const isInProgress = p?.status === "in-progress";

          return (
            <Card key={inc.id} className={`transition-all ${isCompleted ? "border-success/40" : "hover:border-primary/40"}`}>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row md:items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-3">
                      <Shield className="w-5 h-5 text-destructive shrink-0" />
                      <h3 className="font-cinzel font-bold text-lg text-foreground">{inc.name}</h3>
                      <Badge variant="outline" className="text-[11px]">{inc.age}</Badge>
                      <Badge className="text-[11px]" style={{ background: `hsl(${cluster.color})` }}>{inc.vector}</Badge>
                      {isCompleted && <Badge className="text-[11px] bg-success text-success-foreground">✓ Conquered</Badge>}
                    </div>
                    <div className="flex items-center gap-1 mb-3">
                      {ACTS.map((act, i) => (
                        <div key={act.num} className="flex items-center">
                          <div className="flex flex-col items-center">
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                                completed.includes(act.num)
                                  ? "text-white"
                                  : completed.length >= act.num - 1 && !completed.includes(act.num)
                                    ? "bg-primary/10 text-primary border border-primary/30"
                                    : "bg-muted text-muted-foreground"
                              }`}
                              style={completed.includes(act.num) ? { background: act.color } : undefined}
                            >
                              {completed.includes(act.num) ? "✓" : <Lock className="w-3 h-3" />}
                            </div>
                            <span className="text-[11px] text-muted-foreground mt-0.5">{act.name}</span>
                          </div>
                          {i < ACTS.length - 1 && (
                            <div className={`w-3 h-0.5 ${completed.includes(act.num) ? "bg-primary" : "bg-muted"} mb-3`} />
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div><p className="text-xs text-muted-foreground font-medium mb-1">🔍 Vulnerability</p><p className="text-foreground/80 text-xs">{inc.vulnerability}</p></div>
                      <div><p className="text-xs text-muted-foreground font-medium mb-1">⚔️ Asymmetric Angle</p><p className="text-foreground/80 text-xs">{inc.asymmetricAngle}</p></div>
                    </div>
                    {inc.existingDisruptor && <p className="text-xs text-muted-foreground mt-2">⚡ Real disruptor: <span className="text-primary font-medium">{inc.existingDisruptor}</span></p>}
                  </div>
                  <Button onClick={() => onStartMission(inc)} className="shrink-0" style={{ background: `hsl(${cluster.color})` }}>
                    {isInProgress ? <><ChevronRight className="w-4 h-4 mr-1" /> Resume</> :
                     isCompleted ? <><Trophy className="w-4 h-4 mr-1" /> Replay</> :
                     <><Swords className="w-4 h-4 mr-1" /> Start Mission</>}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}


/* ── Briefing section parser ── */
const SECTION_ICONS: Record<number, { icon: typeof Building2; color: string; bg: string }> = {
  1: { icon: Building2, color: "text-primary", bg: "bg-primary/10" },
  2: { icon: BarChart3, color: "text-warning", bg: "bg-warning/10" },
  3: { icon: Zap, color: "text-destructive", bg: "bg-destructive/10" },
  4: { icon: Rocket, color: "text-success", bg: "bg-success/10" },
  5: { icon: Swords, color: "text-neon-purple", bg: "bg-accent/10" },
};

function parseBriefingSections(md: string): { num: number; title: string; body: string }[] {
  const sections: { num: number; title: string; body: string }[] = [];
  const parts = md.split(/(?=(?:^|\n)(?:#{1,3}\s*)?(?:\*\*)?(\d+)\.\s)/);
  let current: { num: number; title: string; body: string } | null = null;
  for (const part of parts) {
    const headerMatch = part.match(/^(?:\n)?(?:#{1,3}\s*)?(?:\*\*)?(\d+)\.\s*(.+?)(?:\*\*)?(?:\n|$)/);
    if (headerMatch) {
      if (current) sections.push(current);
      const num = parseInt(headerMatch[1]);
      const title = headerMatch[2].replace(/\*\*/g, "").trim();
      const body = part.slice(headerMatch[0].length).trim();
      current = { num, title, body };
    } else if (current) {
      current.body += "\n" + part;
    }
  }
  if (current) sections.push(current);
  return sections;
}

/* ── Context Panel (Right Side) — Progressive Reveal ── */
function ContextPanel({
  selectedIncumbent, selectedCluster, briefingData, onSelectTarget, onSwitchTarget, onSendText, onBrowseMap, hasConversation,
}: {
  selectedIncumbent: DisruptionIncumbent | null; selectedCluster: IndustryCluster | null;
  briefingData: string | null;
  onSelectTarget: (id: number) => void; onSwitchTarget: (inc: DisruptionIncumbent) => void;
  onSendText: (t: string) => void; onBrowseMap: () => void; hasConversation: boolean;
}) {
  if (selectedIncumbent && selectedCluster) {
    const otherTargets = selectedCluster.incumbents.filter(i => i.id !== selectedIncumbent.id);
    const briefingSections = briefingData ? parseBriefingSections(briefingData) : [];
    const hasParsedSections = briefingSections.length >= 2;

    return (
      <div className="p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Target className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h3 className="font-cinzel font-bold text-base text-foreground leading-tight">{selectedIncumbent.name}</h3>
            <p className="text-xs text-muted-foreground">{selectedCluster.emoji} {selectedCluster.name} · {selectedIncumbent.age}</p>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Badge variant="outline" className="text-xs">{selectedIncumbent.vector}</Badge>
          {selectedIncumbent.pricingModel && (
            <Badge variant="secondary" className="text-xs">{selectedIncumbent.pricingModel}</Badge>
          )}
          {selectedIncumbent.existingDisruptor && (
            <Badge variant="outline" className="text-xs text-primary border-primary/30">⚡ {selectedIncumbent.existingDisruptor}</Badge>
          )}
        </div>

        {hasParsedSections ? (
          <div className="space-y-3">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Intel Briefing</p>
            {briefingSections.map((section, i) => {
              const iconCfg = SECTION_ICONS[section.num] || SECTION_ICONS[1];
              const IconComp = iconCfg?.icon || Lightbulb;
              return (
                <motion.div
                  key={section.num}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <Card className="border-border/40">
                    <div className="flex items-start gap-3 p-3.5">
                      <div className={`w-8 h-8 rounded-lg ${iconCfg?.bg || "bg-muted"} flex items-center justify-center shrink-0 mt-0.5`}>
                        <IconComp className={`w-3.5 h-3.5 ${iconCfg?.color || "text-foreground"}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-cinzel font-bold text-xs text-foreground mb-1.5">{section.title}</h4>
                        <div className="prose prose-sm dark:prose-invert max-w-none text-xs leading-relaxed [&>p]:mb-2 [&>p:last-child]:mb-0 [&>ul]:space-y-0.5 [&>ul]:pl-3 [&_strong]:text-foreground">
                          <ReactMarkdown>{section.body.trim()}</ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        ) : !briefingData ? (
          <Card className="border-border/40">
            <CardContent className="p-3.5 space-y-2">
              <p className="text-xs text-muted-foreground font-medium">🔍 Vulnerability</p>
              <p className="text-sm text-foreground">{selectedIncumbent.vulnerability}</p>
              <div className="h-px bg-border/30" />
              <p className="text-xs text-muted-foreground font-medium">💡 Angle</p>
              <p className="text-sm text-foreground">{selectedIncumbent.asymmetricAngle}</p>
            </CardContent>
          </Card>
        ) : null}

        {otherTargets.length > 0 && (
          <div>
            <p className="text-[11px] text-muted-foreground mb-1.5">Also in {selectedCluster.name}:</p>
            <div className="flex flex-wrap gap-1.5">
              {otherTargets.slice(0, 3).map(alt => (
                <Button key={alt.id} variant="ghost" size="sm" className="text-xs h-7 px-2" onClick={() => onSwitchTarget(alt)}>
                  {alt.name}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // No target → quick picks
  const trendingTargets = INDUSTRY_CLUSTERS.slice(0, 5).flatMap(c => c.incumbents.slice(0, 1).map(inc => ({ inc, cluster: c })));

  return (
    <div className="p-5 space-y-5">
      <div>
        <h3 className="font-cinzel font-bold text-sm text-foreground mb-1">Quick Picks</h3>
        <p className="text-xs text-muted-foreground">Popular disruption targets</p>
      </div>

      <div className="space-y-1">
        {trendingTargets.map(({ inc, cluster }) => (
          <button
            key={inc.id}
            onClick={() => onSelectTarget(inc.id)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors text-left group"
          >
            <span className="text-base">{cluster.emoji}</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">{inc.name}</p>
              <p className="text-xs text-muted-foreground truncate">{cluster.name}</p>
            </div>
            <ChevronRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        ))}
      </div>

      <button
        onClick={onBrowseMap}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-border/40 hover:border-primary/40 transition-colors text-left text-xs text-muted-foreground hover:text-foreground"
      >
        <MapIcon className="w-3.5 h-3.5" />
        Browse all 46 targets across 15 verticals
      </button>
    </div>
  );
}

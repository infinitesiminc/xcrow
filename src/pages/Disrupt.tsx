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
import { motion, AnimatePresence } from "framer-motion";
import { Swords, Shield, Target, ArrowLeft, Send, Trophy, Zap, Map as MapIcon, ChevronRight, Lock, CheckCircle2, Rocket, Users, BarChart3, Castle, Presentation, Brain, Search, Hammer, Megaphone } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { DisruptCustomerDiscovery } from "@/components/disrupt/DisruptCustomerDiscovery";
import { DisruptVentureBuild } from "@/components/disrupt/DisruptVentureBuild";
import { DisruptGTM } from "@/components/disrupt/DisruptGTM";
import { DisruptMoatDefense } from "@/components/disrupt/DisruptMoatDefense";
import { DisruptPitchBattle } from "@/components/disrupt/DisruptPitchBattle";
import { DisruptMissionDebrief } from "@/components/disrupt/DisruptMissionDebrief";

type GamePhase =
  | "discovery" | "hub" | "cluster" | "briefing"
  | "act1-intro" | "act1" | "act1-score"
  | "act2-intro" | "act2" | "act2-score"
  | "act3-intro" | "act3" | "act3-score"
  | "act4-intro" | "act4" | "act4-score"
  | "act5-intro" | "act5" | "act5-score"
  | "act6-intro" | "act6" | "act6-score"
  | "act7";

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
  { num: 1, name: "Scout", subtitle: "Find the Target", icon: Search, emoji: "🔍", skill: "Market Analysis & Competitive Intelligence", description: "Battle the incumbent CEO. Identify vulnerabilities using the 6-step disruption framework.", color: "hsl(var(--destructive))" },
  { num: 2, name: "Discover", subtitle: "Talk to Customers", icon: Users, emoji: "🗣️", skill: "Customer Development & Empathy", description: "Interview AI customers in the beachhead niche. Validate problem-solution fit.", color: "hsl(var(--neon-cyan))" },
  { num: 3, name: "Architect", subtitle: "Build the Model", icon: Hammer, emoji: "📋", skill: "Business Model Design & Financial Modeling", description: "Create your Lean Canvas and unit economics with an AI co-founder.", color: "hsl(var(--neon-purple))" },
  { num: 4, name: "Launch", subtitle: "Go to Market", icon: Megaphone, emoji: "🚀", skill: "Channel Strategy, Pricing & Growth", description: "Design your GTM strategy: channels, pricing, and first 100 customers plan.", color: "hsl(var(--neon-lime))" },
  { num: 5, name: "Defend", subtitle: "Build the Moat", icon: Castle, emoji: "🏰", skill: "Competitive Strategy & Moat Building", description: "The incumbent fights back. Defend why they literally cannot respond.", color: "hsl(var(--warning))" },
  { num: 6, name: "Pitch", subtitle: "Face the VCs", icon: Presentation, emoji: "💼", skill: "Storytelling & Investor Psychology", description: "AI generates your pitch deck. Defend it against a panel of VC investors.", color: "hsl(var(--neon-pink))" },
  { num: 7, name: "Debrief", subtitle: "Founder Report", icon: Brain, emoji: "📊", skill: "Self-Assessment & Pattern Recognition", description: "Get your combined score, startup valuation, and Founder Profile badge.", color: "hsl(var(--success))" },
];

export default function Disrupt() {
  const { user } = useAuth();
  const [phase, setPhase] = useState<GamePhase>("discovery");

  // Current mission context
  const [selectedCluster, setSelectedCluster] = useState<IndustryCluster | null>(null);
  const [selectedIncumbent, setSelectedIncumbent] = useState<DisruptionIncumbent | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [score, setScore] = useState<ScoreResult | null>(null);
  const [isScoring, setIsScoring] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Act scores for current mission
  const [actScores, setActScores] = useState<Record<number, number>>({});

  const scrollToBottom = useCallback(() => {
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }, []);

  // Briefing state
  const [briefingMessages, setBriefingMessages] = useState<ChatMsg[]>([]);
  const [briefingInput, setBriefingInput] = useState("");
  const [isBriefingStreaming, setIsBriefingStreaming] = useState(false);
  const briefingEndRef = useRef<HTMLDivElement>(null);

  const startMission = (cluster: IndustryCluster, incumbent: DisruptionIncumbent) => {
    setSelectedCluster(cluster);
    setSelectedIncumbent(incumbent);
    const progress = getMissionProgress(incumbent.id);

    // If user has progress, skip briefing and resume
    if (progress.completedActs.length > 0) {
      if (progress.scoreResult) setScore(progress.scoreResult);
      if (progress.battleTranscript) setMessages(progress.battleTranscript);
      setActScores({});
      progress.completedActs.forEach(actNum => {
        const key = `act${actNum}Score` as keyof MissionProgress;
        if (progress[key]) setActScores(prev => ({ ...prev, [actNum]: progress[key] as number }));
      });
      const firstIncomplete = ACTS.find(a => !progress.completedActs.includes(a.num));
      if (firstIncomplete) setPhase(`act${firstIncomplete.num}-intro` as GamePhase);
      else setPhase("act7");
    } else {
      // New mission → go to briefing
      setBriefingMessages([]);
      setBriefingInput("");
      startBriefingChat(cluster, incumbent);
    }
    updateMissionProgress(incumbent.id, { status: "in-progress" });
  };

  const startBriefingChat = async (cluster: IndustryCluster, incumbent: DisruptionIncumbent) => {
    setPhase("briefing");
    setIsBriefingStreaming(true);

    const systemMessage: ChatMsg = {
      role: "user",
      content: "I just selected this company. Brief me on everything I need to know before I start the disruption simulation.",
    };

    let assistantContent = "";
    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/disruption-battle`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
          body: JSON.stringify({ action: "briefing", payload: { incumbent, cluster, messages: [systemMessage] } }),
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
              setBriefingMessages([{ role: "assistant", content: assistantContent }]);
            }
          } catch { /* partial */ }
        }
      }
    } catch { toast.error("Briefing failed. Try again."); }
    finally { setIsBriefingStreaming(false); }
  };

  const sendBriefingMessage = async () => {
    if (!briefingInput.trim() || isBriefingStreaming || !selectedIncumbent || !selectedCluster) return;
    const userMsg: ChatMsg = { role: "user", content: briefingInput.trim() };
    const updatedMessages = [...briefingMessages, userMsg];
    setBriefingMessages(updatedMessages);
    setBriefingInput("");
    setIsBriefingStreaming(true);
    setTimeout(() => briefingEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);

    let assistantContent = "";
    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/disruption-battle`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
          body: JSON.stringify({ action: "briefing", payload: { incumbent: selectedIncumbent, cluster: selectedCluster, messages: updatedMessages, allIncumbents: selectedCluster.incumbents.map(i => ({ name: i.name, id: i.id, vulnerability: i.vulnerability, vector: i.vector })) } }),
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
              setBriefingMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant" && prev.length === updatedMessages.length + 1) {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantContent } : m);
                }
                return [...prev, { role: "assistant", content: assistantContent }];
              });
              setTimeout(() => briefingEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
            }
          } catch { /* partial */ }
        }
      }
    } catch { toast.error("Briefing failed. Try again."); }
    finally { setIsBriefingStreaming(false); }
  };

  const handleSwitchTarget = (newIncumbent: DisruptionIncumbent) => {
    if (!selectedCluster) return;
    setSelectedIncumbent(newIncumbent);
    setBriefingMessages([]);
    startBriefingChat(selectedCluster, newIncumbent);
  };

  const startBattle = () => {
    if (!selectedCluster || !selectedIncumbent) return;
    setCurrentStep(1);
    setMessages([]);
    setScore(null);
    const opening: ChatMsg = {
      role: "assistant",
      content: `📋 **Mission Briefing: Disrupting ${selectedIncumbent.name}**\n\n**🏢 About the Target**\n**${selectedIncumbent.name}** is a ${selectedCluster.name} incumbent (${selectedIncumbent.age}). Their key vulnerability:\n> *"${selectedIncumbent.vulnerability}"*\n\nA potential disruption angle: **${selectedIncumbent.asymmetricAngle}**\nBeachhead niche to consider: *${selectedIncumbent.beachheadNiche}*\nDisruptor model: *${selectedIncumbent.disruptorModel}*\n${selectedIncumbent.existingDisruptor ? `Existing challenger: ${selectedIncumbent.existingDisruptor}\n` : ""}\n**📖 The 6-Step Disruption Framework**\nYou'll work through these steps to build a complete disruption strategy:\n1. 🔍 **Find the Vulnerable Incumbent** — Identify 3+ weakness signals\n2. ⚔️ **Identify the Asymmetric Angle** — What *can't* they do?\n3. ✅ **Validate Before Building** — Market >$1B? CAC <$10?\n4. 🏰 **The Beachhead Strategy** — Pick smallest defensible niche\n5. 🔄 **The Disruption Loop** — Monitor → Build → Price below\n6. 🛡️ **The Incumbent's Dilemma** — Why they *can't* respond\n\n---\n\n⚔️ **Let's begin Step 1: Find the Vulnerable Incumbent**\n\nUsing the intel above, what vulnerability signals do you see? What makes ${selectedIncumbent.name} ripe for disruption?\n\n*Don't worry if you're new to this — I'll guide you through the reasoning. Just share your initial thoughts and I'll help you build a sharper analysis.*`,
    };
    setMessages([opening]);
    setPhase("act1");
  };

  const sendMessage = async () => {
    if (!input.trim() || isStreaming || !selectedIncumbent || !selectedCluster) return;
    const userMsg: ChatMsg = { role: "user", content: input.trim() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsStreaming(true);
    scrollToBottom();
    let assistantContent = "";
    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/disruption-battle`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
          body: JSON.stringify({ action: "battle", payload: { incumbent: selectedIncumbent, cluster: selectedCluster, messages: updatedMessages, step: currentStep } }),
        },
      );
      if (!resp.ok || !resp.body) {
        if (resp.status === 429) { toast.error("Rate limited. Wait a moment."); return; }
        throw new Error("Battle failed");
      }
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
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant" && prev.length === updatedMessages.length + 1) {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantContent } : m);
                }
                return [...prev, { role: "assistant", content: assistantContent }];
              });
              scrollToBottom();
            }
          } catch { /* partial */ }
        }
      }
      if (assistantContent.includes("STEP") && assistantContent.includes("CONQUERED")) {
        setCurrentStep(s => Math.min(s + 1, 6));
      }
    } catch { toast.error("Battle failed. Try again."); } finally { setIsStreaming(false); }
  };

  const finishBattle = async () => {
    if (!selectedIncumbent || !selectedCluster || isScoring) return;
    setIsScoring(true);
    try {
      const transcript = messages.map(m => `${m.role === "user" ? "STUDENT" : "CEO"}: ${m.content}`).join("\n\n");
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/disruption-battle`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
          body: JSON.stringify({ action: "score", payload: { incumbent: selectedIncumbent, cluster: selectedCluster, transcript } }),
        },
      );
      if (!resp.ok) throw new Error("Scoring failed");
      const result = await resp.json();
      setScore(result);
      setActScores(prev => ({ ...prev, 1: result.overall }));
      updateMissionProgress(selectedIncumbent.id, {
        act1Score: result.overall,
        completedActs: [...(getMissionProgress(selectedIncumbent.id).completedActs || []), 1],
        scoreResult: result,
        battleTranscript: messages,
      });
      setPhase("act1-score");
    } catch { toast.error("Could not score."); } finally { setIsScoring(false); }
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
    // Auto-advance to next act intro
    const nextAct = actNum + 1;
    if (nextAct <= 7) {
      setPhase(`act${nextAct}-intro` as GamePhase);
    }
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
    current_step: 6, total_score: score?.overall || 0, step_scores: null,
    battle_transcript: messages, score_result: score,
    completed_at: null, venture_canvas: null, pitch_data: null, act: 2,
  } : null;

  return (
    <>
      <Helmet>
        <title>Disruption Arena — AI Startup Simulation | Xcrow</title>
        <meta name="description" content="Build your startup portfolio by disrupting 100 real incumbents. 7-act simulation teaching the full founder journey." />
      </Helmet>
      <Navbar />
      <div className="min-h-screen bg-background pt-20 pb-12">
        {/* Mission Progress Bar — visible during any act (not briefing) */}
        {phase !== "hub" && phase !== "cluster" && phase !== "briefing" && selectedIncumbent && selectedCluster && (
          <MissionProgressBar
            incumbent={selectedIncumbent}
            cluster={selectedCluster}
            currentAct={getCurrentActNum(phase)}
            actScores={actScores}
            completedActs={getMissionProgress(selectedIncumbent.id).completedActs || []}
            onBack={() => setPhase("hub")}
          />
        )}

        <AnimatePresence mode="wait">
          {phase === "hub" && (
            <motion.div key="hub" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <MissionHub
                onSelectCluster={(c) => { setSelectedCluster(c); setPhase("cluster"); }}
                progress={loadProgress()}
              />
            </motion.div>
          )}

          {phase === "cluster" && selectedCluster && (
            <motion.div key="cluster" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
              <ClusterDetail
                cluster={selectedCluster}
                onBack={() => setPhase("hub")}
                onStartMission={(inc) => startMission(selectedCluster, inc)}
                progress={loadProgress()}
              />
            </motion.div>
          )}

          {/* Briefing Phase */}
          {phase === "briefing" && selectedIncumbent && selectedCluster && (
            <motion.div key="briefing" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <BriefingChat
                incumbent={selectedIncumbent}
                cluster={selectedCluster}
                messages={briefingMessages}
                input={briefingInput}
                setInput={setBriefingInput}
                onSend={sendBriefingMessage}
                isStreaming={isBriefingStreaming}
                chatEndRef={briefingEndRef}
                onBack={() => setPhase("cluster")}
                onLaunch={() => setPhase("act1-intro")}
                onSwitchTarget={handleSwitchTarget}
              />
            </motion.div>
          )}


          {phase.endsWith("-intro") && selectedIncumbent && (
            <motion.div key={phase} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
              <ActIntro
                actNum={getCurrentActNum(phase)}
                incumbent={selectedIncumbent}
                cluster={selectedCluster!}
                onBegin={() => {
                  const actNum = getCurrentActNum(phase);
                  if (actNum === 1) startBattle();
                  else setPhase(`act${actNum}` as GamePhase);
                }}
              />
            </motion.div>
          )}

          {/* Act 1: Scout — Battle */}
          {phase === "act1" && selectedIncumbent && selectedCluster && (
            <motion.div key="act1" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
              <BattleArena
                incumbent={selectedIncumbent} cluster={selectedCluster} step={currentStep}
                messages={messages} input={input} setInput={setInput}
                onSend={sendMessage} onFinish={finishBattle} isStreaming={isStreaming}
                isScoring={isScoring} chatEndRef={chatEndRef}
                onBack={() => setPhase("hub")}
              />
            </motion.div>
          )}

          {phase === "act1-score" && score && selectedIncumbent && (
            <motion.div key="act1-score" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <ActScoreScreen
                actNum={1}
                score={score.overall}
                title={score.title}
                summary={score.summary}
                dimensions={score.dimensions}
                nextSteps={score.nextSteps}
                onContinue={() => setPhase("act2-intro")}
              />
            </motion.div>
          )}

          {/* Act 2: Customer Discovery */}
          {phase === "act2" && selectedIncumbent && selectedCluster && (
            <motion.div key="act2" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
              <DisruptCustomerDiscovery
                incumbent={selectedIncumbent}
                cluster={selectedCluster}
                onComplete={(actScore) => completeAct(2, actScore)}
              />
            </motion.div>
          )}

          {/* Act 3: Venture Architecture */}
          {phase === "act3" && soloTeam && (
            <motion.div key="act3" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
              <DisruptVentureBuild
                room={soloRoom as any}
                team={soloTeam as any}
                onComplete={() => {
                  completeAct(3, 70);
                }}
              />
            </motion.div>
          )}

          {/* Act 4: GTM */}
          {phase === "act4" && selectedIncumbent && selectedCluster && (
            <motion.div key="act4" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
              <DisruptGTM
                incumbent={selectedIncumbent}
                cluster={selectedCluster}
                onComplete={(actScore) => completeAct(4, actScore)}
              />
            </motion.div>
          )}

          {/* Act 5: Moat Defense */}
          {phase === "act5" && selectedIncumbent && selectedCluster && (
            <motion.div key="act5" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
              <DisruptMoatDefense
                incumbent={selectedIncumbent}
                cluster={selectedCluster}
                onComplete={(actScore) => completeAct(5, actScore)}
              />
            </motion.div>
          )}

          {/* Act 6: Pitch */}
          {phase === "act6" && soloTeam && (
            <motion.div key="act6" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
              <DisruptPitchBattle
                room={soloRoom as any}
                team={soloTeam as any}
                teams={[]} members={[]}
                onComplete={() => {
                  completeAct(6, 70);
                }}
              />
            </motion.div>
          )}

          {/* Act 7: Mission Debrief */}
          {phase === "act7" && selectedIncumbent && selectedCluster && (
            <motion.div key="act7" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <DisruptMissionDebrief
                incumbent={selectedIncumbent}
                cluster={selectedCluster}
                actScores={actScores}
                onBackToHub={() => setPhase("hub")}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <Footer />
    </>
  );
}

function getCurrentActNum(phase: GamePhase): number {
  const match = phase.match(/act(\d)/);
  return match ? parseInt(match[1]) : 1;
}

/* ── Mission Hub ── */
function MissionHub({ onSelectCluster, progress }: { onSelectCluster: (c: IndustryCluster) => void; progress: Record<string, MissionProgress> }) {
  const totalCompleted = Object.values(progress).filter(p => p.status === "completed").length;
  const totalInProgress = Object.values(progress).filter(p => p.status === "in-progress").length;
  const allIncumbents = INDUSTRY_CLUSTERS.flatMap(c => c.incumbents);

  function getClusterProgress(cluster: IndustryCluster) {
    return cluster.incumbents.filter(inc => progress[String(inc.id)]?.status === "completed").length;
  }

  return (
    <div className="max-w-7xl mx-auto px-4">
      {/* Hero */}
      <div className="text-center mb-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Rocket className="w-4 h-4" /> Startup Simulation
          </div>
          <h1 className="font-cinzel text-4xl md:text-5xl font-bold text-foreground mb-4">
            Build Your <span className="text-primary">Startup Portfolio</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-6">
            22 industries. 100 incumbents. 7 acts per mission. Master the full founder journey from opportunity scout to investor pitch.
          </p>

          {/* Stats */}
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
        </motion.div>
      </div>

      {/* 7-Act Journey Explainer */}
      <div className="mb-12">
        <h2 className="font-cinzel text-xl font-bold text-center mb-6 text-foreground">The 7-Act Founder Journey</h2>
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

      {/* Your Missions (if any in progress) */}
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
                      <p className="text-xs text-muted-foreground mt-2">{p.completedActs?.length || 0}/7 acts completed</p>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        </div>
      )}

      {/* Industry Map */}
      <h2 className="font-cinzel text-xl font-bold mb-4 text-foreground">🗺️ Industry Map</h2>
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
                  {done > 0 && (
                    <Progress value={(done / cluster.incumbents.length) * 100} className="h-1.5 mt-3" />
                  )}
                  <div className="flex items-center gap-1 mt-3 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    View Missions <ChevronRight className="w-3 h-3" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Disruption Framework */}
      <div className="max-w-4xl mx-auto mb-12">
        <h2 className="font-cinzel text-2xl font-bold text-center mb-8 text-foreground">The 6-Step Disruption Framework</h2>
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

                    {/* 7-Act Progress Rail */}
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

/* ── Mission Progress Bar (Sticky) ── */
function MissionProgressBar({ incumbent, cluster, currentAct, actScores, completedActs, onBack }: {
  incumbent: DisruptionIncumbent; cluster: IndustryCluster; currentAct: number;
  actScores: Record<number, number>; completedActs: number[]; onBack: () => void;
}) {
  return (
    <div className="sticky top-16 z-40 bg-card/95 backdrop-blur border-b border-border px-4 py-2 mb-4">
      <div className="max-w-5xl mx-auto flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="shrink-0 text-xs">
          <MapIcon className="w-3 h-3 mr-1" /> Hub
        </Button>
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm">{cluster.emoji}</span>
          <span className="font-cinzel font-bold text-xs text-foreground truncate">{incumbent.name}</span>
        </div>
        <div className="flex items-center gap-0.5 flex-1 justify-center">
          {ACTS.map((act, i) => (
            <div key={act.num} className="flex items-center">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${
                  completedActs.includes(act.num) ? "text-white" :
                  act.num === currentAct ? "bg-primary text-primary-foreground ring-2 ring-primary/30" :
                  "bg-muted text-muted-foreground"
                }`}
                style={completedActs.includes(act.num) ? { background: act.color } : undefined}
                title={`${act.name}: ${act.subtitle}`}
              >
                {completedActs.includes(act.num) ? "✓" : act.num}
              </div>
              {i < ACTS.length - 1 && (
                <div className={`w-3 h-0.5 ${completedActs.includes(act.num) ? "bg-primary" : "bg-muted"}`} />
              )}
            </div>
          ))}
        </div>
        {actScores[currentAct] && (
          <Badge variant="outline" className="text-[11px] shrink-0">Score: {actScores[currentAct]}</Badge>
        )}
      </div>
    </div>
  );
}

/* ── Act Intro Screen ── */
function ActIntro({ actNum, incumbent, cluster, onBegin }: {
  actNum: number; incumbent: DisruptionIncumbent; cluster: IndustryCluster; onBegin: () => void;
}) {
  const act = ACTS[actNum - 1];
  if (!act) return null;
  const Icon = act.icon;

  return (
    <div className="max-w-xl mx-auto px-4 text-center py-12">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.1 }}>
        <div className="w-20 h-20 rounded-2xl mx-auto flex items-center justify-center text-3xl mb-6" style={{ background: act.color }}>
          {act.emoji}
        </div>
      </motion.div>
      <Badge variant="outline" className="mb-4 text-xs">Act {actNum} of 7</Badge>
      <h1 className="font-cinzel text-3xl font-bold text-foreground mb-2">{act.name}: {act.subtitle}</h1>
      <p className="text-muted-foreground mb-6 max-w-md mx-auto">{act.description}</p>
      <Card className="mb-8 text-left">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-3">
            <Icon className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium text-foreground">Skill You'll Develop</span>
          </div>
          <p className="text-sm text-muted-foreground">{act.skill}</p>
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Target:</span> {incumbent.name} — {cluster.name}
            </p>
          </div>
        </CardContent>
      </Card>
      <Button onClick={onBegin} size="lg" className="px-8" style={{ background: act.color }}>
        Begin Act {actNum} <ChevronRight className="w-4 h-4 ml-1" />
      </Button>
    </div>
  );
}

/* ── Act Score Screen (generic) ── */
function ActScoreScreen({ actNum, score, title, summary, dimensions, nextSteps, onContinue }: {
  actNum: number; score: number; title: string; summary: string;
  dimensions?: { name: string; score: number; feedback: string }[];
  nextSteps?: string[]; onContinue: () => void;
}) {
  const act = ACTS[actNum - 1];
  const nextAct = ACTS[actNum];
  const getColor = (s: number) => s >= 80 ? "text-green-500" : s >= 60 ? "text-yellow-500" : "text-red-500";
  const getGrade = (s: number) => s >= 90 ? "S" : s >= 80 ? "A" : s >= 70 ? "B" : s >= 60 ? "C" : "D";

  return (
    <div className="max-w-3xl mx-auto px-4 text-center py-8">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }}>
        <CheckCircle2 className="w-16 h-16 mx-auto mb-4" style={{ color: act?.color }} />
      </motion.div>
      <Badge variant="outline" className="mb-2 text-xs">Act {actNum} Complete</Badge>
      <h1 className="font-cinzel text-2xl font-bold text-foreground mb-2">{act?.name}: {act?.subtitle}</h1>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <div className="inline-flex items-center gap-4 bg-card border border-border rounded-2xl p-6 mb-6">
          <div className={`text-5xl font-cinzel font-bold ${getColor(score)}`}>{getGrade(score)}</div>
          <div className="text-left">
            <p className="text-3xl font-bold text-foreground">{score}</p>
            <p className="text-sm text-primary font-medium">{title}</p>
          </div>
        </div>
      </motion.div>
      <Card className="mb-6 text-left">
        <CardContent className="pt-6">
          <p className="text-sm text-foreground mb-4">{summary}</p>
          {dimensions && (
            <div className="space-y-3">
              {dimensions.map((dim, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.1 }}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-foreground font-medium">{dim.name}</span>
                    <span className={`font-bold ${getColor(dim.score)}`}>{dim.score}</span>
                  </div>
                  <Progress value={dim.score} className="h-2 mb-1" />
                  <p className="text-xs text-muted-foreground">{dim.feedback}</p>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      {nextSteps && (
        <Card className="mb-6 text-left">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-cinzel">⚔️ Key Insights</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {nextSteps.map((step, i) => (<li key={i} className="text-sm text-foreground flex gap-2"><span className="text-primary shrink-0">→</span>{step}</li>))}
            </ul>
          </CardContent>
        </Card>
      )}
      <Button onClick={onContinue} size="lg" className="px-8" style={{ background: nextAct?.color }}>
        {nextAct ? <>Continue to Act {actNum + 1}: {nextAct.name} <ChevronRight className="w-4 h-4 ml-1" /></> : "View Final Report"}
      </Button>
    </div>
  );
}

/* ── Battle Arena (Act 1) ── */
function BattleArena({
  incumbent, cluster, step, messages, input, setInput, onSend, onFinish, isStreaming, isScoring, chatEndRef, onBack,
}: {
  incumbent: DisruptionIncumbent; cluster: IndustryCluster; step: number; messages: ChatMsg[];
  input: string; setInput: (v: string) => void; onSend: () => void; onFinish: () => void;
  isStreaming: boolean; isScoring: boolean; chatEndRef: React.RefObject<HTMLDivElement>; onBack: () => void;
}) {
  return (
    <div className="max-w-4xl mx-auto px-4 flex flex-col" style={{ height: "calc(100vh - 12rem)" }}>
      <div className="flex items-center justify-between gap-3 mb-3 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Shield className="w-5 h-5 text-destructive shrink-0" />
          <div className="min-w-0">
            <h2 className="font-cinzel font-bold text-sm truncate">{incumbent.name}</h2>
            <p className="text-[11px] text-muted-foreground truncate">{cluster.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs shrink-0">Step {step}/6</Badge>
          <Button size="sm" variant="secondary" onClick={onFinish} disabled={isScoring || messages.length < 4}>
            {isScoring ? "Scoring..." : "End Battle"}<Trophy className="w-3 h-3 ml-1" />
          </Button>
        </div>
      </div>
      <div className="mb-3 shrink-0">
        <div className="flex gap-1 mb-1">
          {DISRUPTION_STEPS.map((s) => (
            <div key={s.step} className="flex-1 h-2 rounded-full transition-all" style={{ background: s.step <= step ? `hsl(${cluster.color})` : "hsl(var(--muted))", opacity: s.step === step ? 1 : s.step < step ? 0.6 : 0.2 }} />
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground">{DISRUPTION_STEPS[step - 1]?.emoji} {DISRUPTION_STEPS[step - 1]?.title}</p>
      </div>
      <ScrollArea className="flex-1 pr-4 mb-3">
        <div className="space-y-4 pb-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${msg.role === "user" ? "bg-primary text-primary-foreground rounded-br-md" : "bg-muted text-foreground rounded-bl-md"}`}>
                <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:mb-2 [&>p:last-child]:mb-0 [&>blockquote]:border-l-primary/50">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
          {isStreaming && messages[messages.length - 1]?.role === "user" && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
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
      <div className="flex gap-2 shrink-0 pb-2">
        <Textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder={`Your disruption strategy for Step ${step}...`} className="min-h-[48px] max-h-[120px] resize-none" onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(); } }} disabled={isStreaming} />
        <Button onClick={onSend} disabled={isStreaming || !input.trim()} size="icon" className="shrink-0 self-end"><Send className="w-4 h-4" /></Button>
      </div>
    </div>
  );
}

/* ── Briefing Chat (Pre-Simulation) ── */
function BriefingChat({
  incumbent, cluster, messages, input, setInput, onSend, isStreaming, chatEndRef, onBack, onLaunch, onSwitchTarget,
}: {
  incumbent: DisruptionIncumbent; cluster: IndustryCluster; messages: ChatMsg[];
  input: string; setInput: (v: string) => void; onSend: () => void;
  isStreaming: boolean; chatEndRef: React.RefObject<HTMLDivElement>;
  onBack: () => void; onLaunch: () => void;
  onSwitchTarget: (inc: DisruptionIncumbent) => void;
}) {
  const otherTargets = cluster.incumbents.filter(i => i.id !== incumbent.id);
  const hasContent = messages.length > 0 && messages.some(m => m.role === "assistant" && m.content.length > 50);

  return (
    <div className="max-w-4xl mx-auto px-4 flex flex-col" style={{ height: "calc(100vh - 8rem)" }}>
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-lg">{cluster.emoji}</span>
            <div className="min-w-0">
              <h2 className="font-cinzel font-bold text-sm truncate">{incumbent.name}</h2>
              <p className="text-[11px] text-muted-foreground">Mission Briefing — {cluster.name}</p>
            </div>
          </div>
        </div>
        <Button onClick={onLaunch} disabled={!hasContent} className="shrink-0 bg-primary">
          <Rocket className="w-4 h-4 mr-1" /> Launch Simulation
        </Button>
      </div>

      {/* Briefing badge */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg px-4 py-2 mb-3 shrink-0">
        <p className="text-xs text-foreground">
          <Brain className="w-3 h-3 inline mr-1 text-primary" />
          <span className="font-medium">Pre-Mission Briefing</span> — Learn about the target before entering the simulation. Ask any questions about the company, industry, or strategy.
        </p>
      </div>

      {/* Chat area */}
      <ScrollArea className="flex-1 pr-4 mb-3">
        <div className="space-y-4 pb-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-md"
                  : "bg-muted text-foreground rounded-bl-md"
              }`}>
                <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:mb-2 [&>p:last-child]:mb-0 [&>blockquote]:border-l-primary/50">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
          {isStreaming && (messages.length === 0 || messages[messages.length - 1]?.role === "user") && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
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

      {/* Quick action chips */}
      {hasContent && messages.length <= 2 && !isStreaming && (
        <div className="flex flex-wrap gap-2 mb-3 shrink-0">
          {[
            "What's their revenue model?",
            "Who are their biggest competitors?",
            "How big is this market?",
            "Show me different targets",
          ].map((q) => (
            <Button
              key={q}
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => { setInput(q); }}
            >
              {q}
            </Button>
          ))}
        </div>
      )}

      {/* Alternative targets strip */}
      {otherTargets.length > 0 && hasContent && messages.length <= 2 && !isStreaming && (
        <div className="mb-3 shrink-0">
          <p className="text-[11px] text-muted-foreground mb-1.5">Not interested? Try another target:</p>
          <div className="flex flex-wrap gap-1.5">
            {otherTargets.slice(0, 4).map((alt) => (
              <Button
                key={alt.id}
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => onSwitchTarget(alt)}
              >
                <Target className="w-3 h-3 mr-1" /> {alt.name}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2 shrink-0 pb-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about the company, industry, strategy, or say 'switch target'..."
          className="min-h-[48px] max-h-[120px] resize-none"
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

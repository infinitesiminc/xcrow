import { useState, lazy, Suspense, ComponentType } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, ArrowLeft, Play, Database, BarChart3,
  Layers, MessageSquare, Users, AlertTriangle, Sparkles,
  LucideIcon, Scroll,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const StepATSImport = lazy(() => import("@/components/case-study/StepATSImport"));
const StepAugmentedMap = lazy(() => import("@/components/case-study/StepAugmentedMap"));
const StepTaskDrilldown = lazy(() => import("@/components/case-study/StepTaskDrilldown"));
const StepSimPreview = lazy(() => import("@/components/case-study/StepSimPreview"));
const StepTeamProgress = lazy(() => import("@/components/case-study/StepTeamProgress"));
const StepActionCenter = lazy(() => import("@/components/case-study/StepActionCenter"));
const StepModelAdaptation = lazy(() => import("@/components/case-study/StepModelAdaptation"));

interface Step {
  id: string;
  phase: string;
  icon: LucideIcon;
  title: string;
  subtitle: string;
  Component: ComponentType;
}

const STEPS: Step[] = [
  {
    id: "ats", phase: "Reconnaissance", icon: Database,
    title: "Import from ATS",
    subtitle: "Connected to Greenhouse in 2 clicks. Every kingdom ingested automatically.",
    Component: StepATSImport,
  },
  {
    id: "exposure", phase: "Reconnaissance", icon: BarChart3,
    title: "AI Threat Map",
    subtitle: "Every kingdom scored at the quest level. See where AI disruption hits hardest.",
    Component: StepAugmentedMap,
  },
  {
    id: "tasks", phase: "Reconnaissance", icon: Layers,
    title: "Quest-Level Drill-down",
    subtitle: "Zoom into any kingdom to see exactly which quests AI is transforming.",
    Component: StepTaskDrilldown,
  },
  {
    id: "simulation", phase: "Mobilization", icon: MessageSquare,
    title: "AI Readiness Quest",
    subtitle: "Employees practice real scenarios — scored across 4 readiness pillars.",
    Component: StepSimPreview,
  },
  {
    id: "progress", phase: "Conquest", icon: Users,
    title: "Guild Progress Dashboard",
    subtitle: "Real-time visibility into readiness scores across departments.",
    Component: StepTeamProgress,
  },
  {
    id: "action", phase: "Conquest", icon: AlertTriangle,
    title: "War Room",
    subtitle: "Automated interventions. Bottleneck detection. Coaching at scale.",
    Component: StepActionCenter,
  },
  {
    id: "adaptation", phase: "Conquest", icon: Sparkles,
    title: "Real-Time Model Adaptation",
    subtitle: "A new frontier model drops. The engine adapts in under 24 hours — automatically.",
    Component: StepModelAdaptation,
  },
];

const PHASE_COLORS: Record<string, string> = {
  Reconnaissance: "bg-[hsl(var(--territory-analytical)/0.15)] text-[hsl(var(--territory-analytical))]",
  Mobilization: "bg-[hsl(var(--territory-strategic)/0.15)] text-[hsl(var(--territory-strategic))]",
  Conquest: "bg-[hsl(var(--territory-creative)/0.15)] text-[hsl(var(--territory-creative))]",
};

export default function CaseStudy() {
  const navigate = useNavigate();
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);

  const current = STEPS[step];

  if (!started) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl text-center space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[hsl(var(--filigree)/0.2)] text-xs font-medium text-muted-foreground"
            style={{ background: "hsl(var(--surface-parchment))" }}>
            <Scroll className="h-3 w-3 text-[hsl(var(--filigree-glow))]" /> The Campaign
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight font-fantasy">
            See how Anthropic maps AI readiness across 400+ kingdoms
          </h1>

          <div className="flex items-center justify-center gap-3 pt-2">
            <Button size="lg" onClick={() => setStarted(true)} className="gap-2"
              style={{ boxShadow: "0 0 16px hsl(var(--filigree-glow) / 0.2)" }}>
              <Play className="h-4 w-4" /> Begin Campaign
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/contact")}
              className="border-[hsl(var(--filigree)/0.2)]">
              Book a Demo
            </Button>
          </div>

          {/* Step preview pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
            {STEPS.map((s, i) => (
              <span
                key={s.id}
                className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground rounded-full px-2.5 py-1 border border-[hsl(var(--filigree)/0.1)]"
                style={{ background: "hsl(var(--surface-stone))" }}
              >
                <span className="font-mono text-[10px] opacity-50">{i + 1}</span>
                {s.title}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Progress bar */}
      <div className="sticky top-0 z-40 backdrop-blur-md border-b border-[hsl(var(--filigree)/0.1)]"
        style={{ background: "hsl(var(--surface-stone) / 0.9)" }}>
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-medium uppercase tracking-widest px-2 py-0.5 rounded-full ${PHASE_COLORS[current.phase]}`}
                style={{ fontFamily: "'Cinzel', serif" }}>
                {current.phase}
              </span>
              <span className="text-sm font-medium">{current.title}</span>
            </div>
            <span className="text-xs text-muted-foreground font-mono">
              {step + 1} / {STEPS.length}
            </span>
          </div>

          {/* Step dots */}
          <div className="flex gap-1">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={`h-1 flex-1 rounded-full transition-all ${
                  i <= step ? "bg-[hsl(var(--filigree-glow))]" : "bg-border"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Step content */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="rounded-xl border border-[hsl(var(--filigree)/0.15)] p-6"
          style={{ background: "hsl(var(--surface-stone))", boxShadow: "inset 0 1px 0 hsl(var(--emboss-light)), 0 4px 12px hsl(var(--emboss-shadow))" }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              {/* Step header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center border border-[hsl(var(--filigree)/0.2)]"
                  style={{ background: "hsl(var(--surface-parchment))" }}>
                  <current.icon className="h-5 w-5 text-foreground" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold font-fantasy">{current.title}</h2>
                  <p className="text-sm text-muted-foreground">{current.subtitle}</p>
                </div>
              </div>

              <Suspense fallback={<div className="h-48 flex items-center justify-center text-muted-foreground text-sm">Loading…</div>}>
                <current.Component />
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-[hsl(var(--filigree)/0.1)]">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => step > 0 ? setStep(step - 1) : setStarted(false)}
            className="gap-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {step > 0 ? "Back" : "Overview"}
          </Button>

          {step < STEPS.length - 1 ? (
            <Button size="sm" onClick={() => setStep(step + 1)} className="gap-1">
              Next <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button size="sm" onClick={() => navigate("/contact")} className="gap-1">
                Book a Demo <ArrowRight className="h-3.5 w-3.5" />
              </Button>
              <Button size="sm" variant="outline" onClick={() => navigate("/")}>
                Enter the Gate
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

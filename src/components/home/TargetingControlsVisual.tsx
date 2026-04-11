/**
 * Animated visual showing the easy-to-use targeting controls UI.
 * Simulates clicking product/persona chips and seeing leads generate.
 */
import { motion, AnimatePresence } from "framer-motion";
import { Target, Package, UserCircle, Crosshair, Zap, MousePointerClick } from "lucide-react";
import { useState, useEffect } from "react";

const EASE: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];

const fadeInView = (delay = 0) => ({
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" as const },
  transition: { duration: 0.6, delay, ease: EASE },
});

const PRODUCTS = [
  { id: "p1", label: "Analytics Suite", active: true },
  { id: "p2", label: "API Platform", active: false },
];

const PERSONAS = [
  { id: "v1", label: "VP Engineering", active: true },
  { id: "v2", label: "Head of Data", active: true },
  { id: "v3", label: "CTO", active: false },
];

export default function TargetingControlsVisual() {
  const [step, setStep] = useState(0);
  const [inView, setInView] = useState(false);

  // Auto-play the animation sequence when in view
  useEffect(() => {
    if (!inView) return;
    const timers = [
      setTimeout(() => setStep(1), 800),   // highlight product
      setTimeout(() => setStep(2), 1600),  // highlight personas
      setTimeout(() => setStep(3), 2400),  // show "generating"
      setTimeout(() => setStep(4), 3200),  // show results
    ];
    return () => timers.forEach(clearTimeout);
  }, [inView]);

  return (
    <section className="bg-muted/30 py-20 sm:py-28 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div {...fadeInView()} className="text-center mb-14">
          <p className="text-primary text-sm font-semibold tracking-[0.15em] uppercase mb-4">
            Precision targeting
          </p>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight uppercase">
            Pick. Click. <span className="text-primary">Leads.</span>
          </h2>
          <p className="text-muted-foreground mt-4 max-w-lg mx-auto">
            Select which products and personas to target. AI does the rest.
          </p>
        </motion.div>

        <motion.div
          {...fadeInView(0.15)}
          onViewportEnter={() => setInView(true)}
          className="max-w-4xl mx-auto"
        >
          {/* Mock UI */}
          <div className="bg-card border border-border rounded-2xl shadow-lg overflow-hidden">
            {/* Toolbar */}
            <div className="border-b border-border/40 bg-muted/20 px-5 py-3 flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-400/60" />
                <div className="w-3 h-3 rounded-full bg-green-400/60" />
              </div>
              <span className="text-xs text-muted-foreground font-medium ml-2">Lead Gen — Targeting</span>
            </div>

            <div className="flex flex-col sm:flex-row">
              {/* Left: Controls */}
              <div className="sm:w-1/2 p-6 border-b sm:border-b-0 sm:border-r border-border/40">
                {/* Products */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Package className="w-4 h-4 text-primary" />
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Products</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {PRODUCTS.map((p, i) => {
                      const isActive = p.active && step >= 1;
                      return (
                        <motion.div
                          key={p.id}
                          animate={{
                            scale: step === 1 && p.active ? [1, 1.05, 1] : 1,
                            borderColor: isActive ? "hsl(var(--primary))" : "hsl(var(--border))",
                          }}
                          transition={{ duration: 0.4, delay: i * 0.1 }}
                          className={`px-4 py-2 rounded-xl text-sm font-medium border cursor-default transition-colors ${
                            isActive
                              ? "bg-primary/10 text-primary border-primary/30"
                              : "bg-muted/30 text-muted-foreground border-border/60"
                          }`}
                        >
                          {p.label}
                          {isActive && step === 1 && (
                            <motion.span
                              initial={{ opacity: 0, scale: 0 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="inline-block ml-1.5"
                            >
                              ✓
                            </motion.span>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* Personas */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <UserCircle className="w-4 h-4 text-primary" />
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Personas</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {PERSONAS.map((p, i) => {
                      const isActive = p.active && step >= 2;
                      return (
                        <motion.div
                          key={p.id}
                          animate={{
                            scale: step === 2 && p.active ? [1, 1.05, 1] : 1,
                          }}
                          transition={{ duration: 0.4, delay: i * 0.1 }}
                          className={`px-4 py-2 rounded-xl text-sm font-medium border cursor-default transition-colors ${
                            isActive
                              ? "bg-primary/10 text-primary border-primary/30"
                              : "bg-muted/30 text-muted-foreground border-border/60"
                          }`}
                        >
                          {p.label}
                          {isActive && step === 2 && (
                            <motion.span
                              initial={{ opacity: 0, scale: 0 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="inline-block ml-1.5"
                            >
                              ✓
                            </motion.span>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* Generate button */}
                <motion.div
                  animate={{
                    opacity: step >= 2 ? 1 : 0.4,
                    scale: step === 3 ? [1, 1.03, 1] : 1,
                  }}
                  transition={{ duration: 0.4 }}
                  className="flex items-center gap-2"
                >
                  <div className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold ${
                    step >= 3 ? "bg-primary text-primary-foreground" : "bg-primary/60 text-primary-foreground/60"
                  }`}>
                    <Crosshair className="w-4 h-4" />
                    {step >= 3 && step < 4 ? "Generating..." : "Generate Leads"}
                  </div>
                  {step === 2 && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-primary"
                    >
                      <MousePointerClick className="w-5 h-5" />
                    </motion.div>
                  )}
                </motion.div>
              </div>

              {/* Right: Results */}
              <div className="sm:w-1/2 p-6 relative min-h-[260px]">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-4 h-4 text-primary" />
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Results</span>
                </div>

                {step < 3 && (
                  <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground/40">
                    <Target className="w-10 h-10 mb-2" />
                    <p className="text-sm">Select targets to generate leads</p>
                  </div>
                )}

                {step === 3 && (
                  <div className="flex flex-col items-center justify-center h-[200px]">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    >
                      <Zap className="w-8 h-8 text-primary" />
                    </motion.div>
                    <p className="text-sm text-primary mt-2 font-medium">Finding leads...</p>
                  </div>
                )}

                <AnimatePresence>
                  {step >= 4 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-2"
                    >
                      {[
                        { name: "Jordan Lee", title: "VP Engineering @ Acme", score: 96 },
                        { name: "Nina Patel", title: "Head of Data @ Acme", score: 92 },
                        { name: "Chris Wu", title: "VP Engineering @ Bolt", score: 89 },
                        { name: "Amy Torres", title: "Head of Data @ Flux", score: 85 },
                      ].map((lead, i) => (
                        <motion.div
                          key={lead.name}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.12, duration: 0.4, ease: EASE }}
                          className="flex items-center gap-3 bg-muted/30 border border-border/40 rounded-xl px-3 py-2"
                        >
                          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                            {lead.name.split(" ").map(w => w[0]).join("")}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{lead.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{lead.title}</p>
                          </div>
                          <span className="text-xs font-bold text-primary">{lead.score}%</span>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

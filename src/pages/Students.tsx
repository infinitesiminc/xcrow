/**
 * /students — Quest-based career readiness for university students.
 * Immersive RPG aesthetic matching /how-it-works.
 */
import { useRef, useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import {
  ArrowRight, Brain, ChevronRight, Flame, GraduationCap, Lock, Map,
  MessageSquare, Sparkles, Star, Target, Trophy, TrendingUp, Zap,
  Sword, Shield, Crown,
} from "lucide-react";
import CompanyMarquee from "@/components/CompanyMarquee";
import CompanyJobsPanel from "@/components/CompanyJobsPanel";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SimulatorModal from "@/components/SimulatorModal";
import xcrowLogo from "@/assets/xcrow-logo.png";

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.6, delay, ease: "easeOut" as const },
});

const BENEFITS = [
  { icon: Target, title: "Scout the Kingdoms", desc: "We analyze 21,000+ live kingdoms to show you the exact skills companies hire for — updated weekly.", color: "territory-analytical" },
  { icon: Brain, title: "Complete Quests from Real Employers", desc: "Don't just read about product strategy or data analysis — battle through actual quest scenarios and get scored.", color: "territory-technical" },
  { icon: Map, title: "Conquer 8 Territories", desc: "Every quest claims a tile on your personal territory map. Watch your castles grow as you master more skills.", color: "territory-creative" },
  { icon: MessageSquare, title: "Summon the Crow", desc: "The wisest scout in the realm. Ask the Crow anything about any kingdom — it scouts what matters most.", color: "territory-communication" },
  { icon: Sparkles, title: "Study the Threat Map", desc: "For every skill, see 3 growth dimensions: how AI reshapes it, what tools to master, and where your human edge wins.", color: "territory-ethics" },
  { icon: Sword, title: "Enter Battle-Ready", desc: "Walk into interviews knowing the quests, the tools, and the human skills that matter. That's the edge.", color: "territory-leadership" },
];

const STEPS = [
  { step: "01", title: "Scout the Kingdom", desc: "Type a kingdom title — PM, data analyst, UX designer. The Crow breaks it into quests and scouts which skills matter most.", color: "var(--territory-analytical)" },
  { step: "02", title: "Complete the Quest", desc: "Jump into AI-powered quest simulations of actual job tasks. Get scored on tool awareness, adaptive thinking, and human judgment.", color: "var(--territory-technical)" },
  { step: "03", title: "Claim Your Territory", desc: "Every quest claims a skill tile. Track 3 growth rings per skill: AI Reshaping, Tool Mastery, and Human Edge. Build your castles.", color: "var(--territory-creative)" },
];

const STATS = [
  { value: "21,000+", label: "Kingdoms" },
  { value: "34,000+", label: "Quests Available" },
  { value: "3,600+", label: "Companies" },
  { value: "183", label: "Skill Territories" },
];

/* ─── Auto-select company panel ─── */
function AutoSelectCompanyPanel({
  selectedCompany, onSelect, onClose, onJobSelect,
}: {
  selectedCompany: string | null;
  onSelect: (name: string) => void;
  onClose: () => void;
  onJobSelect: (job: { role: string; company: string; task: string }) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [autoSelected, setAutoSelected] = useState(false);

  useEffect(() => {
    if (inView && !autoSelected && !selectedCompany) {
      (async () => {
        const { data } = await supabase
          .from("job_task_clusters")
          .select("jobs!inner(company_id, companies!inner(name))")
          .limit(1000);
        if (!data?.length) return;
        const counts: globalThis.Map<string, number> = new globalThis.Map();
        for (const row of data) {
          const name = (row.jobs as any)?.companies?.name;
          if (name) counts.set(name, (counts.get(name) || 0) + 1);
        }
        let best: string | null = null;
        let bestCount = 0;
        for (const [name, count] of counts) {
          if (count >= 6 && count > bestCount) { best = name; bestCount = count; }
        }
        if (best) { onSelect(best); setAutoSelected(true); }
      })();
    }
  }, [inView, autoSelected, selectedCompany, onSelect]);

  return (
    <div ref={ref}>
      <CompanyJobsPanel companyName={selectedCompany} onClose={onClose} onJobSelect={onJobSelect} />
    </div>
  );
}

export default function Students() {
  const navigate = useNavigate();
  const { user, openAuthModal } = useAuth();
  const [simJob, setSimJob] = useState<{ role: string; company: string; task: string } | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);

  const handleCompanyClick = useCallback((name: string) => {
    setSelectedCompany((prev) => (prev === name ? null : name));
  }, []);

  const handleGetStarted = () => {
    if (user) navigate("/");
    else openAuthModal?.();
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background text-foreground overflow-x-hidden">

        {/* ═══ HERO ═══ */}
        <section className="relative min-h-[75vh] flex items-center justify-center px-4 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full blur-[180px] opacity-12"
              style={{ background: "hsl(var(--territory-analytical))" }} />
            <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full blur-[160px] opacity-10"
              style={{ background: "hsl(var(--territory-creative))" }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full blur-[200px] opacity-8"
              style={{ background: "hsl(var(--filigree-glow))" }} />
          </div>

          <motion.div {...fade()} className="text-center max-w-3xl relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 mb-6"
              style={{ borderColor: "hsl(var(--territory-strategic) / 0.3)", background: "hsl(var(--territory-strategic) / 0.08)" }}>
              <Flame className="h-3.5 w-3.5" style={{ color: "hsl(var(--territory-strategic))" }} />
              <span className="text-xs font-medium" style={{ color: "hsl(var(--territory-strategic))" }}>73% of employers now test AI skills in interviews</span>
            </div>

            <h1 className="font-fantasy text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Your degree is the foundation.{" "}
              <br className="hidden sm:block" />
              <span style={{ color: "hsl(var(--filigree-glow))" }}>This is the edge.</span>
            </h1>

            <p className="text-muted-foreground text-lg md:text-xl max-w-xl mx-auto mb-10">
              Scout real kingdoms, complete quests employers hire for, and conquer
              your skill territory — before you graduate.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button size="lg" onClick={handleGetStarted} className="text-base px-8 gap-2"
                style={{ boxShadow: "0 0 20px hsl(var(--filigree-glow) / 0.2)" }}>
                Enter the World Map <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" className="text-base px-8"
                style={{ borderColor: "hsl(var(--filigree) / 0.2)" }}
                onClick={() => document.getElementById("benefits")?.scrollIntoView({ behavior: "smooth" })}>
                See What You Get
              </Button>
            </div>

            <p className="text-xs text-muted-foreground mt-5 flex items-center justify-center gap-1.5">
              <Sparkles className="h-3 w-3" style={{ color: "hsl(var(--filigree-glow))" }} />
              Free forever · No credit card · Used by students at 200+ guilds
            </p>
          </motion.div>
        </section>

        {/* ═══ STATS ═══ */}
        <section className="py-12 px-4 border-y border-border/50" style={{ background: "hsl(var(--secondary) / 0.3)" }}>
          <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-8 md:gap-16">
            {STATS.map((s, i) => (
              <motion.div key={s.label} {...fade(i * 0.05)} className="text-center">
                <p className="text-2xl md:text-3xl font-fantasy font-bold" style={{ color: "hsl(var(--filigree-glow))" }}>{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ═══ BENEFITS ═══ */}
        <section id="benefits" className="py-20 px-4">
          <div className="max-w-5xl mx-auto">
            <motion.div {...fade()} className="text-center mb-14">
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground mb-2">Your Arsenal</p>
              <h2 className="font-fantasy text-3xl md:text-4xl font-bold">
                Everything You Need to <span style={{ color: "hsl(var(--filigree-glow))" }}>Conquer Your Career</span>
              </h2>
              <p className="text-muted-foreground mt-3 max-w-lg mx-auto">
                Not another course. A quest ground built from what employers actually need right now.
              </p>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {BENEFITS.map((b, i) => (
                <motion.div key={b.title} {...fade(i * 0.08)}
                  className="rounded-2xl border border-border/50 p-6 group hover:border-border transition-colors relative overflow-hidden"
                  style={{ background: "hsl(var(--card))", boxShadow: "inset 0 1px 0 hsl(var(--emboss-light)), 0 4px 20px hsl(var(--emboss-shadow))" }}>
                  <div className="absolute top-0 inset-x-0 h-[3px]" style={{ background: `hsl(var(--${b.color}))` }} />
                  <div className="h-11 w-11 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: `hsl(var(--${b.color}) / 0.1)`, border: `1px solid hsl(var(--${b.color}) / 0.2)` }}>
                    <b.icon className="h-5 w-5" style={{ color: `hsl(var(--${b.color}))` }} />
                  </div>
                  <h3 className="font-fantasy text-base font-bold mb-2">{b.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ HOW IT WORKS ═══ */}
        <section className="py-20 px-4" style={{ background: "hsl(var(--secondary) / 0.4)" }}>
          <div className="max-w-4xl mx-auto">
            <motion.div {...fade()} className="text-center mb-14">
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground mb-2">The Quest Path</p>
              <h2 className="font-fantasy text-3xl md:text-4xl font-bold">Three Steps. Zero Fluff.</h2>
              <p className="text-muted-foreground mt-3 max-w-md mx-auto">
                From "what do employers want?" to "I've completed the quest" in minutes.
              </p>
            </motion.div>

            <div className="space-y-4">
              {STEPS.map((item, i) => (
                <motion.div key={item.step} {...fade(i * 0.1)}
                  className="flex items-center gap-4 rounded-xl border border-border/50 p-5"
                  style={{ background: "hsl(var(--card))", boxShadow: "inset 0 1px 0 hsl(var(--emboss-light))" }}>
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0"
                    style={{ background: `hsl(${item.color} / 0.15)`, border: `1px solid hsl(${item.color} / 0.25)` }}>
                    <span className="text-sm font-bold font-fantasy" style={{ color: `hsl(${item.color})` }}>{item.step}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-fantasy font-semibold text-[15px]">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/30 shrink-0 hidden sm:block" />
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ COMPANY MARQUEE ═══ */}
        <section className="py-16 px-4">
          <div className="max-w-5xl mx-auto">
            <motion.div {...fade()} className="text-center mb-8">
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground mb-2">Live Kingdoms</p>
              <h2 className="font-fantasy text-2xl sm:text-3xl font-bold">
                Complete Quests from Real Kingdoms
              </h2>
              <p className="text-sm text-muted-foreground mt-2">
                {selectedCompany ? `Scouting ${selectedCompany}` : "Click any company to scout their live kingdoms"}
              </p>
            </motion.div>
            <motion.div {...fade(0.1)}>
              <CompanyMarquee
                rows={[
                  ["Anthropic", "OpenAI", "Google DeepMind", "Stripe", "Spotify", "SpaceX", "Anduril", "xAI"],
                  ["Databricks", "Cohere", "Notion", "Deel", "Rubrik", "Instacart", "Esri"],
                ]}
                onCompanyClick={handleCompanyClick}
              />
            </motion.div>
            <AutoSelectCompanyPanel
              selectedCompany={selectedCompany}
              onSelect={setSelectedCompany}
              onClose={() => setSelectedCompany(null)}
              onJobSelect={(job) => setSimJob(job)}
            />
          </div>
        </section>

        {/* ═══ GUILD CTA ═══ */}
        <section className="py-16 px-4">
          <div className="max-w-2xl mx-auto">
            <motion.div {...fade()}
              className="rounded-2xl border border-border/50 p-8 text-center relative overflow-hidden"
              style={{ background: "hsl(var(--surface-parchment))", boxShadow: "inset 0 1px 0 hsl(var(--emboss-light)), 0 4px 20px hsl(var(--emboss-shadow))" }}>
              <div className="absolute top-0 inset-x-0 h-[3px]" style={{ background: "hsl(var(--filigree-glow))" }} />
              <GraduationCap className="h-8 w-8 mx-auto mb-4" style={{ color: "hsl(var(--filigree-glow))" }} />
              <h3 className="font-fantasy text-xl sm:text-2xl font-bold mb-2">Rally Your Guild</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                Recruit allies and earn extra quest credits. When your guild joins, everyone gets a customized territory dashboard.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button onClick={handleGetStarted} className="gap-2"
                  style={{ boxShadow: "0 0 16px hsl(var(--filigree-glow) / 0.2)" }}>
                  Enter the World Map <ArrowRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" onClick={() => navigate("/schools")} className="gap-2"
                  style={{ borderColor: "hsl(var(--filigree) / 0.2)" }}>
                  Tell Your Guild <GraduationCap className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ═══ FINAL CTA ═══ */}
        <section className="py-24 px-4 relative overflow-hidden" style={{ background: "hsl(var(--secondary) / 0.4)" }}>
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full blur-[200px] opacity-10"
              style={{ background: "hsl(var(--primary))" }} />
          </div>
          <motion.div {...fade()} className="text-center max-w-lg mx-auto relative z-10">
            <motion.img src={xcrowLogo} alt="Xcrow" className="h-16 w-16 mx-auto mb-6 crow-glow"
              animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} />
            <h2 className="font-fantasy text-3xl md:text-4xl font-bold mb-4">
              Your degree gets you in the room.
              <br />
              <span style={{ color: "hsl(var(--filigree-glow))" }}>This gets you the throne.</span>
            </h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Scout any kingdom. Complete the quests. Conquer your territory.
            </p>
            <Button size="lg" onClick={handleGetStarted} className="text-base px-10 gap-2"
              style={{ boxShadow: "0 0 24px hsl(var(--filigree-glow) / 0.3)" }}>
              Enter the World Map <ArrowRight className="h-4 w-4" />
            </Button>
          </motion.div>
        </section>
      </div>

      <SimulatorModal
        open={!!simJob}
        onClose={() => setSimJob(null)}
        taskName={simJob?.task ?? ""}
        jobTitle={simJob?.role ?? ""}
        company={simJob?.company ?? ""}
        mode="assess"
        guestMaxTurns={!user ? 3 : undefined}
      />

      <Footer />
    </>
  );
}

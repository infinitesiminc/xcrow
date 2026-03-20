/**
 * /students — Marketing page targeting university students.
 * Benefits-first messaging: practice real employer tasks, build a skill territory,
 * get hired faster. Gamified dark-mode with spectrum accents.
 */
import { useRef, useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import {
  ArrowRight, Brain, ChevronRight, Flame, GraduationCap, Lock, Map,
  MessageSquare, Rocket, Sparkles, Star, Target, Trophy, TrendingUp, Zap,
} from "lucide-react";
import CompanyMarquee from "@/components/CompanyMarquee";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SimulatorModal from "@/components/SimulatorModal";
import CompanyJobsPanel from "@/components/CompanyJobsPanel";

/* ─── Animation helpers ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 20, filter: "blur(4px)" },
  visible: (d: number) => ({
    opacity: 1, y: 0, filter: "blur(0px)",
    transition: { delay: d * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

function Section({ children, className = "", id }: { children: React.ReactNode; className?: string; id?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.section ref={ref} id={id} initial="hidden" animate={inView ? "visible" : "hidden"} className={`relative ${className}`}>
      {children}
    </motion.section>
  );
}

/* ─── Benefit card ─── */
function BenefitCard({ icon: Icon, title, desc, gradient, delay }: {
  icon: any; title: string; desc: string; gradient: string; delay: number;
}) {
  return (
    <motion.div variants={fadeUp} custom={delay} className="relative rounded-2xl overflow-hidden group">
      <div className={`absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r ${gradient} opacity-70 group-hover:opacity-100 transition-opacity`} />
      <div className="border border-border/50 bg-card/80 backdrop-blur-sm rounded-2xl p-6 h-full hover:shadow-lg hover:shadow-primary/5 transition-shadow">
        <div className="h-11 w-11 rounded-xl bg-primary/8 border border-primary/15 flex items-center justify-center mb-4">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <h3 className="text-base font-bold mb-2 leading-snug">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
      </div>
    </motion.div>
  );
}

/* ─── Live skill territory preview ─── */
function TerritoryPreview() {
  const TILES = [
    { name: "Strategic Thinking", level: 3, color: "from-spectrum-0/60 to-spectrum-1/30" },
    { name: "Data Analysis", level: 2, color: "from-spectrum-3/60 to-spectrum-4/30" },
    { name: "Prompt Engineering", level: 1, color: "from-spectrum-6/60 to-spectrum-5/30" },
    { name: "Stakeholder Mgmt", level: 3, color: "from-spectrum-0/60 to-spectrum-2/30" },
    { name: "AI Tool Mastery", level: 2, color: "from-spectrum-4/60 to-spectrum-3/30" },
    { name: "Creative Problem-Solving", level: 1, color: "from-spectrum-5/60 to-spectrum-6/30" },
    { name: "Communication", level: 3, color: "from-spectrum-1/60 to-spectrum-0/30" },
    { name: "Research", level: 2, color: "from-spectrum-2/60 to-spectrum-3/30" },
    { name: "Risk Assessment", level: 1, color: "from-spectrum-6/60 to-spectrum-4/30" },
  ];

  return (
    <div className="grid grid-cols-3 gap-2 max-w-md mx-auto">
      {TILES.map((tile, i) => (
        <motion.div
          key={tile.name}
          variants={fadeUp}
          custom={i * 0.5 + 1}
          className="relative rounded-xl overflow-hidden aspect-square group cursor-default"
        >
          <div className={`absolute inset-0 bg-gradient-to-br ${tile.color} rounded-xl`} />
          <div className="absolute inset-[1px] rounded-[11px] bg-card/85 backdrop-blur-sm" />
          <div className="relative h-full flex flex-col items-center justify-center p-2 gap-1.5">
            <span className="text-[10px] sm:text-xs font-semibold text-foreground text-center leading-tight">{tile.name}</span>
            {/* 3 rings preview */}
            <div className="flex gap-1">
              {[0, 1, 2].map((ring) => (
                <div
                  key={ring}
                  className={`w-2 h-2 rounded-full ${
                    ring < tile.level
                      ? "bg-primary"
                      : "bg-muted-foreground/20"
                  }`}
                />
              ))}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

/* ─── Chat preview ─── */
function ChatPreview() {
  const messages = [
    { role: "user", text: "What skills do I need for product management?" },
    { role: "ai", text: "🐦‍⬛ Great question! Let me scout that out. PMs need 3 key skill dimensions — I'll show you which ones AI is reshaping, what tools to master, and where your human edge wins..." },
    { role: "ai", text: "Found 14 live PM roles. Your territory shows strong Communication — try a Stakeholder Alignment sim to claim your next tile! 🎯" },
  ];

  return (
    <div className="space-y-3 max-w-sm mx-auto">
      {messages.map((msg, i) => (
        <motion.div
          key={i}
          variants={fadeUp}
          custom={i + 1}
          className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
        >
          <div className={`rounded-2xl px-4 py-2.5 max-w-[85%] text-xs leading-relaxed ${
            msg.role === "user"
              ? "bg-primary text-primary-foreground rounded-br-md"
              : "bg-muted/60 border border-border/50 text-foreground rounded-bl-md"
          }`}>
            {msg.text}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

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

/* ═══════════════════════════════════════════════════ */
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
        <Section className="pt-28 pb-24 px-6 relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-primary/6 rounded-full blur-[140px] pointer-events-none" />

          <div className="max-w-4xl mx-auto text-center relative">
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 rounded-full border border-warning/30 bg-warning/8 px-4 py-1.5 mb-6">
              <Flame className="h-3.5 w-3.5 text-warning" />
              <span className="text-xs font-medium text-warning">73% of employers now test AI skills in interviews</span>
            </motion.div>

            <motion.h1 variants={fadeUp} custom={1} className="text-4xl sm:text-5xl lg:text-6xl font-bold font-display leading-[1.08] tracking-tight mb-6">
              Your classmates will apply.{" "}
              <br className="hidden sm:block" />
              <span className="bg-gradient-to-r from-spectrum-0 via-primary to-spectrum-6 bg-clip-text text-transparent">
                You'll already know the job.
              </span>
            </motion.h1>

            <motion.p variants={fadeUp} custom={2} className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              Practice the exact tasks employers hire for — before you graduate.
              Build a skill territory that proves you're ready.
            </motion.p>

            <motion.div variants={fadeUp} custom={3} className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button size="lg" onClick={handleGetStarted} className="gap-2 text-base px-8 h-12 glow-purple">
                Start Practicing — Free <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => document.getElementById("benefits")?.scrollIntoView({ behavior: "smooth" })} className="text-base px-8 h-12 border-border/60">
                See What You Get
              </Button>
            </motion.div>

            <motion.p variants={fadeUp} custom={4} className="text-xs text-muted-foreground mt-5">
              Free forever · No credit card · Used by students at 200+ universities
            </motion.p>
          </div>
        </Section>

        {/* ═══ PROOF BAR ═══ */}
        <Section className="py-8 border-y border-border/30">
          <div className="max-w-3xl mx-auto flex items-center justify-around gap-4 px-6">
            {[
              { value: "21,000+", label: "REAL ROLES", color: "text-spectrum-0" },
              { value: "34,000+", label: "TASKS TO PRACTICE", color: "text-spectrum-3" },
              { value: "3,600+", label: "COMPANIES", color: "text-spectrum-4" },
              { value: "31", label: "SKILL DIMENSIONS", color: "text-spectrum-6" },
            ].map((stat, i) => (
              <motion.div key={stat.label} variants={fadeUp} custom={i} className="flex flex-col items-center gap-1 px-2">
                <span className={`text-xl sm:text-2xl font-bold ${stat.color}`}>{stat.value}</span>
                <span className="text-[10px] text-muted-foreground font-mono tracking-wide">{stat.label}</span>
              </motion.div>
            ))}
          </div>
        </Section>

        {/* ═══ WHAT YOU GET — 6 benefits ═══ */}
        <Section id="benefits" className="py-20 sm:py-28 px-6">
          <div className="max-w-5xl mx-auto">
            <motion.div variants={fadeUp} custom={0} className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-bold mb-3">
                Everything you need to{" "}
                <span className="bg-gradient-to-r from-spectrum-0 via-primary to-spectrum-6 bg-clip-text text-transparent">land the job</span>
              </h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Not another course. A practice ground built from what employers actually need right now.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <BenefitCard
                icon={Target}
                title="See What Employers Actually Want"
                desc="We analyze 21,000+ live roles to show you the exact skills and tasks companies hire for — updated weekly, not yearly."
                gradient="from-spectrum-0 to-spectrum-1"
                delay={1}
              />
              <BenefitCard
                icon={Brain}
                title="Practice Real Job Tasks With AI"
                desc="Don't just read about product strategy or data analysis — simulate the actual tasks in AI-powered scenarios and get scored."
                gradient="from-spectrum-3 to-spectrum-4"
                delay={2}
              />
              <BenefitCard
                icon={Map}
                title="Build Your Skill Territory"
                desc="Every simulation claims a tile on your personal skill map. Watch your territory grow as you master more dimensions."
                gradient="from-spectrum-4 to-spectrum-6"
                delay={3}
              />
              <BenefitCard
                icon={MessageSquare}
                title="Crow — Your AI Career Scout"
                desc="The smartest bird in the job market. Ask Crow anything about any role — it knows what you've practiced and scouts the skills that matter most."
                gradient="from-spectrum-1 to-spectrum-2"
                delay={4}
              />
              <BenefitCard
                icon={Sparkles}
                title="Understand How AI Changes Every Role"
                desc="For every skill, see 3 growth dimensions: how AI reshapes it, what tools to master, and where your human edge wins."
                gradient="from-spectrum-5 to-spectrum-6"
                delay={5}
              />
              <BenefitCard
                icon={Rocket}
                title="Stand Out in Interviews"
                desc="Walk in knowing the tasks, the tools, and the human skills that matter. That's the difference between a resume and a story."
                gradient="from-spectrum-6 to-spectrum-0"
                delay={6}
              />
            </div>
          </div>
        </Section>

        {/* ═══ VISUAL: SKILL TERRITORY + CHAT side by side ═══ */}
        <Section className="py-20 sm:py-28 px-6">
          <div className="max-w-5xl mx-auto">
            <motion.div variants={fadeUp} custom={0} className="text-center mb-14">
              <div className="inline-flex items-center gap-2 mb-3">
                <Map className="h-5 w-5 text-primary" />
                <span className="text-sm font-mono text-primary/80 tracking-widest uppercase">Your Skill Territory</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-3">
                Every skill has three layers to master
              </h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                For each of the 31 skill dimensions, progress through: how AI reshapes it, what tools to learn, and your irreplaceable human edge.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              {/* Territory grid */}
              <motion.div variants={fadeUp} custom={1} className="relative rounded-2xl overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-spectrum-0 via-primary to-spectrum-6" />
                <div className="border border-border/50 bg-card/80 backdrop-blur-sm rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-semibold">Your Territory</h3>
                      <p className="text-[10px] text-muted-foreground">9 of 31 skills explored</p>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary" /> Mastered</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-muted-foreground/20" /> Locked</span>
                    </div>
                  </div>
                  <TerritoryPreview />
                </div>
              </motion.div>

              {/* Chat preview */}
              <motion.div variants={fadeUp} custom={2} className="relative rounded-2xl overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-spectrum-3 via-spectrum-4 to-spectrum-5" />
                <div className="border border-border/50 bg-card/80 backdrop-blur-sm rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center text-sm">
                      🐦‍⬛
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold">Crow <span className="text-muted-foreground font-normal">· Career Scout</span></h3>
                      <p className="text-[10px] text-muted-foreground">Knows your territory, scouts what's next</p>
                    </div>
                  </div>
                  <ChatPreview />
                </div>
              </motion.div>
            </div>
          </div>
        </Section>

        {/* ═══ GAMIFICATION — XP + Badges ═══ */}
        <Section className="py-20 sm:py-28 px-6">
          <div className="max-w-3xl mx-auto">
            <motion.div variants={fadeUp} custom={0} className="text-center mb-10">
              <div className="inline-flex items-center gap-2 mb-3">
                <Trophy className="h-5 w-5 text-warning" />
                <span className="text-sm font-mono text-warning tracking-widest uppercase">Level Up</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-3">
                Practice tasks.{" "}
                <span className="bg-gradient-to-r from-warning to-spectrum-6 bg-clip-text text-transparent">Earn career intelligence.</span>
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Every simulation earns XP and unlocks insights about how your target role is evolving. Most people won't see this for years.
              </p>
            </motion.div>

            <motion.div variants={fadeUp} custom={1} className="relative rounded-2xl overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-warning via-spectrum-6 to-spectrum-4" />
              <div className="border border-border/50 bg-card/80 backdrop-blur-sm rounded-2xl p-6 sm:p-8">
                {/* Player header */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-spectrum-6 flex items-center justify-center text-lg font-bold text-primary-foreground">
                      YO
                    </div>
                    <motion.div
                      className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-warning flex items-center justify-center text-[10px] font-bold text-warning-foreground"
                      animate={{ scale: [1, 1.15, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      5
                    </motion.div>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold">Your Profile</div>
                    <div className="text-xs text-muted-foreground">Level 5 · 1,240 XP</div>
                    <div className="mt-1.5 h-2 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-spectrum-4"
                        initial={{ width: "0%" }}
                        whileInView={{ width: "68%" }}
                        transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
                        viewport={{ once: true }}
                      />
                    </div>
                  </div>
                  <div className="text-right hidden sm:block">
                    <div className="text-2xl font-bold text-warning">1,240</div>
                    <div className="text-[10px] font-mono text-muted-foreground">TOTAL XP</div>
                  </div>
                </div>

                {/* Badge row */}
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 mb-6">
                  {[
                    { icon: Zap, label: "First Sim", earned: true, color: "text-spectrum-0" },
                    { icon: Brain, label: "Deep Thinker", earned: true, color: "text-spectrum-3" },
                    { icon: Star, label: "Top 10%", earned: true, color: "text-warning" },
                    { icon: TrendingUp, label: "Role Evolved", earned: false, color: "text-spectrum-6" },
                    { icon: Trophy, label: "5 Roles", earned: false, color: "text-spectrum-4" },
                  ].map((badge, i) => (
                    <motion.div
                      key={badge.label}
                      variants={fadeUp}
                      custom={i + 2}
                      className={`relative flex flex-col items-center gap-1.5 p-3 rounded-xl border ${
                        badge.earned ? "border-border/60 bg-card/60" : "border-border/30 bg-card/30 opacity-50"
                      } ${i === 4 ? "hidden sm:flex" : ""}`}
                    >
                      {badge.earned ? (
                        <badge.icon className={`h-6 w-6 ${badge.color}`} />
                      ) : (
                        <Lock className="h-6 w-6 text-muted-foreground/40" />
                      )}
                      <span className="text-[10px] font-mono text-muted-foreground text-center leading-tight">{badge.label}</span>
                      {badge.earned && (
                        <motion.div
                          className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-success flex items-center justify-center"
                          initial={{ scale: 0 }}
                          whileInView={{ scale: 1 }}
                          transition={{ delay: 0.3 + i * 0.1, type: "spring" }}
                          viewport={{ once: true }}
                        >
                          <span className="text-[8px] text-success-foreground">✓</span>
                        </motion.div>
                      )}
                    </motion.div>
                  ))}
                </div>

                {/* Role Evolution teaser */}
                <motion.div variants={fadeUp} custom={7} className="relative rounded-xl overflow-hidden">
                  <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-spectrum-6 via-spectrum-5 to-spectrum-4 opacity-60" />
                  <div className="border border-primary/15 bg-primary/5 rounded-xl p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                      <motion.div animate={{ rotateY: [0, 180, 360] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
                        <Sparkles className="h-5 w-5 text-primary" />
                      </motion.div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold mb-0.5">🔒 Role Evolution Insight</div>
                      <div className="text-xs text-muted-foreground">
                        Score 60%+ in any simulation to unlock how that role is shifting — your personal career intelligence brief.
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={handleGetStarted} className="flex-shrink-0 border-primary/30 text-primary hover:bg-primary/10 hidden sm:flex gap-1.5">
                      <Zap className="h-3.5 w-3.5" /> Unlock
                    </Button>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </Section>

        {/* ═══ HOW IT WORKS — 3 steps ═══ */}
        <Section className="py-20 sm:py-28 px-6">
          <div className="max-w-4xl mx-auto">
            <motion.div variants={fadeUp} custom={0} className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-bold mb-3">Three steps. Zero fluff.</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                From "what do employers want?" to "I've practiced it" in minutes.
              </p>
            </motion.div>

            <div className="space-y-4">
              {[
                {
                  num: "01",
                  title: "Ask about any role",
                  desc: "Type a job title — PM, data analyst, UX designer. Your AI scout breaks it into tasks and shows which skills matter most.",
                  color: "text-spectrum-0",
                  border: "border-spectrum-0/20",
                },
                {
                  num: "02",
                  title: "Practice the real tasks",
                  desc: "Jump into AI-powered simulations of actual job tasks. Get scored on tool awareness, adaptive thinking, and human judgment.",
                  color: "text-spectrum-3",
                  border: "border-spectrum-3/20",
                },
                {
                  num: "03",
                  title: "Grow your territory",
                  desc: "Every sim claims a skill tile. Track 3 growth rings per skill: AI Reshaping, Tool Mastery, and Human Edge. Cover more ground than anyone.",
                  color: "text-spectrum-6",
                  border: "border-spectrum-6/20",
                },
              ].map((step, i) => (
                <motion.div
                  key={step.num}
                  variants={fadeUp}
                  custom={i + 1}
                  className={`flex items-start gap-5 rounded-2xl border ${step.border} bg-card/60 backdrop-blur-sm p-6 hover:bg-card/80 transition-colors`}
                >
                  <span className={`text-3xl font-bold ${step.color} font-mono shrink-0 leading-none mt-0.5`}>{step.num}</span>
                  <div>
                    <h3 className="text-base font-bold mb-1">{step.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                  </div>
                  <ChevronRight className={`h-5 w-5 ${step.color} shrink-0 mt-0.5 opacity-40`} />
                </motion.div>
              ))}
            </div>
          </div>
        </Section>

        {/* ═══ COMPANY MARQUEE ═══ */}
        <Section className="py-16 px-6">
          <div className="max-w-5xl mx-auto">
            <motion.div variants={fadeUp} custom={0} className="text-center mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold mb-2">
                Practice tasks from real companies
              </h2>
              <p className="text-sm text-muted-foreground">
                {selectedCompany ? `Exploring ${selectedCompany}` : "Click any company to see their live roles"}
              </p>
            </motion.div>
            <motion.div variants={fadeUp} custom={1}>
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
        </Section>

        {/* ═══ INVITE CTA ═══ */}
        <Section className="py-16 px-6">
          <div className="max-w-2xl mx-auto">
            <motion.div variants={fadeUp} custom={0} className="relative rounded-2xl overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-spectrum-3 via-spectrum-4 to-spectrum-5" />
              <div className="border border-border/50 bg-card/80 backdrop-blur-sm rounded-2xl p-8 text-center">
                <GraduationCap className="h-8 w-8 text-primary mx-auto mb-4" />
                <h3 className="text-xl sm:text-2xl font-bold mb-2">Bring your whole class</h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                  Invite friends and earn extra simulation credits. When your school joins, everyone gets a customized skill dashboard mapped to your employers.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Button onClick={handleGetStarted} className="gap-2 glow-purple">
                    Start Practicing <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" onClick={() => navigate("/schools")} className="gap-2 border-border/60">
                    Tell Your School <GraduationCap className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </Section>

        {/* ═══ FINAL CTA ═══ */}
        <Section className="py-20 sm:py-28 px-6 relative">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
          <div className="max-w-3xl mx-auto text-center relative">
            <motion.h2 variants={fadeUp} custom={0} className="text-3xl sm:text-4xl font-bold mb-4">
              Your degree gets you in the room.
              <br />
              <span className="bg-gradient-to-r from-spectrum-0 via-primary to-spectrum-6 bg-clip-text text-transparent">This gets you the job.</span>
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="text-muted-foreground mb-8 max-w-md mx-auto">
              Pick any role. Practice the tasks. Build your territory.
              By the time you interview, you'll already know the work.
            </motion.p>
            <motion.div variants={fadeUp} custom={2}>
              <Button size="lg" onClick={handleGetStarted} className="gap-2 text-base px-10 h-12 glow-purple">
                Get Started — Free <ArrowRight className="h-4 w-4" />
              </Button>
            </motion.div>
          </div>
        </Section>

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

/**
 * /students — Recruitment Hall: Quest-based career readiness for university students.
 * Dark Fantasy RPG aesthetic with territory colors and stone surfaces.
 */
import { useRef, useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import {
  ArrowRight, Brain, ChevronRight, Flame, GraduationCap, Lock, Map,
  MessageSquare, Rocket, Sparkles, Star, Target, Trophy, TrendingUp, Zap,
  Sword, Shield, Crown,
} from "lucide-react";
import CompanyMarquee from "@/components/CompanyMarquee";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SimulatorModal from "@/components/SimulatorModal";
import CompanyJobsPanel from "@/components/CompanyJobsPanel";
import xcrowLogo from "@/assets/xcrow-logo.png";

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

/* ─── Benefit card — stone surface ─── */
function BenefitCard({ icon: Icon, title, desc, territoryColor, delay }: {
  icon: any; title: string; desc: string; territoryColor: string; delay: number;
}) {
  return (
    <motion.div variants={fadeUp} custom={delay} className="relative rounded-2xl overflow-hidden group">
      <div className={`absolute top-0 inset-x-0 h-[3px] bg-[hsl(var(--${territoryColor}))]`} />
      <div className="border border-[hsl(var(--filigree)/0.12)] rounded-2xl p-6 h-full hover:border-[hsl(var(--filigree)/0.3)] transition-all"
        style={{ background: "hsl(var(--surface-stone))", boxShadow: "inset 0 1px 0 hsl(var(--emboss-light))" }}>
        <div className="h-11 w-11 rounded-xl border border-[hsl(var(--filigree)/0.15)] flex items-center justify-center mb-4"
          style={{ background: `hsl(var(--${territoryColor}) / 0.1)` }}>
          <Icon className={`h-5 w-5 text-[hsl(var(--${territoryColor}))]`} />
        </div>
        <h3 className="text-base font-bold mb-2 leading-snug font-fantasy">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
      </div>
    </motion.div>
  );
}

/* ─── Live territory preview ─── */
function TerritoryPreview() {
  const TILES = [
    { name: "Strategic Thinking", level: 3, territory: "territory-strategic" },
    { name: "Data Analysis", level: 2, territory: "territory-analytical" },
    { name: "Prompt Engineering", level: 1, territory: "territory-technical" },
    { name: "Stakeholder Mgmt", level: 3, territory: "territory-communication" },
    { name: "AI Tool Mastery", level: 2, territory: "territory-technical" },
    { name: "Creative Problem-Solving", level: 1, territory: "territory-creative" },
    { name: "Communication", level: 3, territory: "territory-communication" },
    { name: "Research", level: 2, territory: "territory-analytical" },
    { name: "Risk Assessment", level: 1, territory: "territory-ethics" },
  ];

  return (
    <div className="grid grid-cols-3 gap-2 max-w-md mx-auto">
      {TILES.map((tile, i) => (
        <motion.div
          key={tile.name}
          variants={fadeUp}
          custom={i * 0.5 + 1}
          className="relative rounded-xl overflow-hidden aspect-square group cursor-default border border-[hsl(var(--filigree)/0.1)]"
          style={{ background: "hsl(var(--surface-stone))", boxShadow: "inset 0 1px 0 hsl(var(--emboss-light))" }}
        >
          <div className={`absolute top-0 inset-x-0 h-[2px] bg-[hsl(var(--${tile.territory}))]`} />
          <div className="relative h-full flex flex-col items-center justify-center p-2 gap-1.5">
            <span className="text-[10px] sm:text-xs font-semibold text-foreground text-center leading-tight">{tile.name}</span>
            <div className="flex gap-1">
              {[0, 1, 2].map((ring) => (
                <div
                  key={ring}
                  className={`w-2 h-2 rounded-full ${
                    ring < tile.level
                      ? `bg-[hsl(var(--${tile.territory}))]`
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

/* ─── Chat preview — RPG-flavored ─── */
function ChatPreview() {
  const messages = [
    { role: "user", text: "What kingdoms should I scout for product management?" },
    { role: "ai", text: "🐦‍⬛ Great question, adventurer! PMs need 3 key territories — I'll scout which ones AI is reshaping, what tools to master, and where your human edge wins..." },
    { role: "ai", text: "Found 14 live PM kingdoms. Your territory shows strong Communication — try a Stakeholder Alignment quest to claim your next tile! 🎯" },
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
              : "border border-[hsl(var(--filigree)/0.15)] text-foreground rounded-bl-md"
          }`}
            style={msg.role === "ai" ? { background: "hsl(var(--surface-stone))" } : undefined}
          >
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
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full blur-[140px] pointer-events-none"
            style={{ background: "radial-gradient(circle, hsl(var(--filigree-glow) / 0.06), transparent 70%)" }} />

          <div className="max-w-4xl mx-auto text-center relative">
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--territory-strategic)/0.3)] px-4 py-1.5 mb-6"
              style={{ background: "hsl(var(--territory-strategic) / 0.08)" }}>
              <Flame className="h-3.5 w-3.5 text-[hsl(var(--territory-strategic))]" />
              <span className="text-xs font-medium text-[hsl(var(--territory-strategic))]">73% of employers now test AI skills in interviews</span>
            </motion.div>

            <motion.h1 variants={fadeUp} custom={1} className="text-4xl sm:text-5xl lg:text-6xl font-bold font-fantasy leading-[1.08] tracking-tight mb-6">
              Your degree is the foundation.{" "}
              <br className="hidden sm:block" />
              <span className="bg-gradient-to-r from-[hsl(var(--territory-analytical))] via-primary to-[hsl(var(--territory-creative))] bg-clip-text text-transparent">
                This is the edge.
              </span>
            </motion.h1>

            <motion.p variants={fadeUp} custom={2} className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              Scout real kingdoms, complete quests employers hire for, and conquer
              your skill territory — before you graduate.
            </motion.p>

            <motion.div variants={fadeUp} custom={3} className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button size="lg" onClick={handleGetStarted} className="gap-2 text-base px-8 h-12"
                style={{ boxShadow: "0 0 20px hsl(var(--filigree-glow) / 0.2)" }}>
                Enter the World Map <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => document.getElementById("benefits")?.scrollIntoView({ behavior: "smooth" })} className="text-base px-8 h-12 border-[hsl(var(--filigree)/0.2)]">
                See What You Get
              </Button>
            </motion.div>

            <motion.p variants={fadeUp} custom={4} className="text-xs text-muted-foreground mt-5 flex items-center justify-center gap-1.5">
              <Sparkles className="h-3 w-3 text-[hsl(var(--filigree-glow))]" />
              Free forever · No credit card · Used by students at 200+ guilds
            </motion.p>
          </div>
        </Section>

        {/* ═══ PROOF BAR ═══ */}
        <Section className="py-8 border-y border-[hsl(var(--filigree)/0.1)]">
          <div className="max-w-3xl mx-auto flex items-center justify-around gap-4 px-6">
            {[
              { value: "21,000+", label: "KINGDOMS", color: "text-[hsl(var(--territory-analytical))]" },
              { value: "34,000+", label: "QUESTS AVAILABLE", color: "text-[hsl(var(--territory-strategic))]" },
              { value: "3,600+", label: "COMPANIES", color: "text-[hsl(var(--territory-leadership))]" },
              { value: "31", label: "SKILL DIMENSIONS", color: "text-[hsl(var(--territory-creative))]" },
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
              <h2 className="text-3xl sm:text-4xl font-bold font-fantasy mb-3">
                Everything you need to{" "}
                <span className="bg-gradient-to-r from-[hsl(var(--territory-analytical))] via-primary to-[hsl(var(--territory-creative))] bg-clip-text text-transparent">conquer your career</span>
              </h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Not another course. A quest ground built from what employers actually need right now.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <BenefitCard
                icon={Target}
                title="Scout the Kingdoms"
                desc="We analyze 21,000+ live kingdoms to show you the exact skills and quests companies hire for — updated weekly, not yearly."
                territoryColor="territory-analytical"
                delay={1}
              />
              <BenefitCard
                icon={Brain}
                title="Complete Quests from Real Employers"
                desc="Don't just read about product strategy or data analysis — battle through actual quest scenarios and get scored."
                territoryColor="territory-technical"
                delay={2}
              />
              <BenefitCard
                icon={Map}
                title="Conquer 8 Territories"
                desc="Every quest claims a tile on your personal territory map. Watch your castles grow as you master more skill dimensions."
                territoryColor="territory-creative"
                delay={3}
              />
              <BenefitCard
                icon={MessageSquare}
                title="Summon the Crow"
                desc="The wisest scout in the realm. Ask the Crow anything about any kingdom — it knows your territory and scouts what matters most."
                territoryColor="territory-communication"
                delay={4}
              />
              <BenefitCard
                icon={Sparkles}
                title="Study the Threat Map"
                desc="For every skill, see 3 growth dimensions: how AI reshapes it, what tools to master, and where your human edge wins."
                territoryColor="territory-ethics"
                delay={5}
              />
              <BenefitCard
                icon={Sword}
                title="Enter Battle-Ready"
                desc="Walk into interviews knowing the quests, the tools, and the human skills that matter. That's the difference between a resume and a war story."
                territoryColor="territory-leadership"
                delay={6}
              />
            </div>
          </div>
        </Section>

        {/* ═══ VISUAL: TERRITORY + CHAT ═══ */}
        <Section className="py-20 sm:py-28 px-6">
          <div className="max-w-5xl mx-auto">
            <motion.div variants={fadeUp} custom={0} className="text-center mb-14">
              <div className="inline-flex items-center gap-2 mb-3">
                <Map className="h-5 w-5 text-[hsl(var(--filigree-glow))]" />
                <span className="text-sm font-mono text-[hsl(var(--filigree))] tracking-widest uppercase">Your Territory</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold font-fantasy mb-3">
                Every skill has three layers to master
              </h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                For each of the 31 skill dimensions, progress through: how AI reshapes it, what tools to learn, and your irreplaceable human edge.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              {/* Territory grid */}
              <motion.div variants={fadeUp} custom={1} className="relative rounded-2xl overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-[2px] bg-[hsl(var(--filigree))]" />
                <div className="border border-[hsl(var(--filigree)/0.15)] rounded-2xl p-6"
                  style={{ background: "hsl(var(--surface-stone))", boxShadow: "inset 0 1px 0 hsl(var(--emboss-light))" }}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-semibold font-fantasy">Your Territory</h3>
                      <p className="text-[10px] text-muted-foreground">9 of 31 skills explored</p>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary" /> Claimed</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-muted-foreground/20" /> Frontier</span>
                    </div>
                  </div>
                  <TerritoryPreview />
                </div>
              </motion.div>

              {/* Chat preview */}
              <motion.div variants={fadeUp} custom={2} className="relative rounded-2xl overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-[2px] bg-[hsl(var(--territory-communication))]" />
                <div className="border border-[hsl(var(--filigree)/0.15)] rounded-2xl p-6"
                  style={{ background: "hsl(var(--surface-stone))", boxShadow: "inset 0 1px 0 hsl(var(--emboss-light))" }}>
                  <div className="flex items-center gap-2 mb-4">
                    <img src={xcrowLogo} alt="" className="h-7 w-7" />
                    <div>
                      <h3 className="text-sm font-semibold font-fantasy">The Crow <span className="text-muted-foreground font-normal font-sans">· Career Scout</span></h3>
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
                <Trophy className="h-5 w-5 text-[hsl(var(--territory-strategic))]" />
                <span className="text-sm font-mono text-[hsl(var(--territory-strategic))] tracking-widest uppercase">Ascend</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold font-fantasy mb-3">
                Complete quests.{" "}
                <span className="bg-gradient-to-r from-[hsl(var(--territory-strategic))] to-[hsl(var(--territory-creative))] bg-clip-text text-transparent">Earn career intelligence.</span>
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Every quest earns XP and unlocks insights about how your target kingdom is evolving. Ascend from Recruit to Legend.
              </p>
            </motion.div>

            <motion.div variants={fadeUp} custom={1} className="relative rounded-2xl overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-[3px] bg-[hsl(var(--territory-strategic))]" />
              <div className="border border-[hsl(var(--filigree)/0.15)] rounded-2xl p-6 sm:p-8"
                style={{ background: "hsl(var(--surface-stone))", boxShadow: "inset 0 1px 0 hsl(var(--emboss-light))" }}>
                {/* Player header */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-[hsl(var(--territory-creative))] flex items-center justify-center text-lg font-bold text-primary-foreground">
                      YO
                    </div>
                    <motion.div
                      className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[hsl(var(--territory-strategic))] flex items-center justify-center text-[10px] font-bold text-background"
                      animate={{ scale: [1, 1.15, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      5
                    </motion.div>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold font-fantasy">Champion Profile</div>
                    <div className="text-xs text-muted-foreground">Level 5 · 1,240 XP</div>
                    <div className="mt-1.5 h-2 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-[hsl(var(--territory-strategic))]"
                        initial={{ width: "0%" }}
                        whileInView={{ width: "68%" }}
                        transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
                        viewport={{ once: true }}
                      />
                    </div>
                  </div>
                  <div className="text-right hidden sm:block">
                    <div className="text-2xl font-bold text-[hsl(var(--territory-strategic))]">1,240</div>
                    <div className="text-[10px] font-mono text-muted-foreground">TOTAL XP</div>
                  </div>
                </div>

                {/* Badge row */}
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 mb-6">
                  {[
                    { icon: Zap, label: "First Quest", earned: true, color: "text-[hsl(var(--territory-analytical))]" },
                    { icon: Brain, label: "Deep Thinker", earned: true, color: "text-[hsl(var(--territory-technical))]" },
                    { icon: Star, label: "Top 10%", earned: true, color: "text-[hsl(var(--territory-strategic))]" },
                    { icon: TrendingUp, label: "Kingdom Evolved", earned: false, color: "text-[hsl(var(--territory-creative))]" },
                    { icon: Trophy, label: "5 Kingdoms", earned: false, color: "text-[hsl(var(--territory-leadership))]" },
                  ].map((badge, i) => (
                    <motion.div
                      key={badge.label}
                      variants={fadeUp}
                      custom={i + 2}
                      className={`relative flex flex-col items-center gap-1.5 p-3 rounded-xl border ${
                        badge.earned ? "border-[hsl(var(--filigree)/0.15)]" : "border-border/30 opacity-50"
                      } ${i === 4 ? "hidden sm:flex" : ""}`}
                      style={{ background: badge.earned ? "hsl(var(--surface-stone))" : undefined }}
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
                  <div className="absolute top-0 inset-x-0 h-[2px] bg-[hsl(var(--territory-creative))]" />
                  <div className="border border-[hsl(var(--filigree)/0.15)] rounded-xl p-5 flex items-center gap-4"
                    style={{ background: "hsl(var(--surface-parchment))" }}>
                    <div className="w-12 h-12 rounded-xl border border-[hsl(var(--filigree)/0.2)] flex items-center justify-center flex-shrink-0"
                      style={{ background: "hsl(var(--surface-stone))" }}>
                      <motion.div animate={{ rotateY: [0, 180, 360] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
                        <Sparkles className="h-5 w-5 text-[hsl(var(--filigree-glow))]" />
                      </motion.div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold mb-0.5 font-fantasy">🔒 Kingdom Evolution Intel</div>
                      <div className="text-xs text-muted-foreground">
                        Score 60%+ in any quest to unlock how that kingdom is shifting — your personal career intelligence brief.
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={handleGetStarted} className="flex-shrink-0 border-[hsl(var(--filigree)/0.2)] hidden sm:flex gap-1.5">
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
              <h2 className="text-3xl sm:text-4xl font-bold font-fantasy mb-3">Three steps. Zero fluff.</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                From "what do employers want?" to "I've completed the quest" in minutes.
              </p>
            </motion.div>

            <div className="space-y-4">
              {[
                {
                  num: "01",
                  title: "Scout the Kingdom",
                  desc: "Type a kingdom title — PM, data analyst, UX designer. The Crow breaks it into quests and scouts which skills matter most.",
                  territory: "territory-analytical",
                },
                {
                  num: "02",
                  title: "Complete the Quest",
                  desc: "Jump into AI-powered quest simulations of actual job tasks. Get scored on tool awareness, adaptive thinking, and human judgment.",
                  territory: "territory-technical",
                },
                {
                  num: "03",
                  title: "Claim Your Territory",
                  desc: "Every quest claims a skill tile. Track 3 growth rings per skill: AI Reshaping, Tool Mastery, and Human Edge. Build your castles.",
                  territory: "territory-creative",
                },
              ].map((step, i) => (
                <motion.div
                  key={step.num}
                  variants={fadeUp}
                  custom={i + 1}
                  className="flex items-start gap-5 rounded-2xl border border-[hsl(var(--filigree)/0.12)] p-6 hover:border-[hsl(var(--filigree)/0.25)] transition-colors"
                  style={{ background: "hsl(var(--surface-stone))", boxShadow: "inset 0 1px 0 hsl(var(--emboss-light))" }}
                >
                  <span className={`text-3xl font-bold text-[hsl(var(--${step.territory}))] font-mono shrink-0 leading-none mt-0.5`}>{step.num}</span>
                  <div>
                    <h3 className="text-base font-bold mb-1 font-fantasy">{step.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                  </div>
                  <ChevronRight className={`h-5 w-5 text-[hsl(var(--${step.territory}))] shrink-0 mt-0.5 opacity-40`} />
                </motion.div>
              ))}
            </div>
          </div>
        </Section>

        {/* ═══ COMPANY MARQUEE ═══ */}
        <Section className="py-16 px-6">
          <div className="max-w-5xl mx-auto">
            <motion.div variants={fadeUp} custom={0} className="text-center mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold font-fantasy mb-2">
                Complete quests from real kingdoms
              </h2>
              <p className="text-sm text-muted-foreground">
                {selectedCompany ? `Scouting ${selectedCompany}` : "Click any company to scout their live kingdoms"}
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
              <div className="absolute top-0 inset-x-0 h-[3px] bg-[hsl(var(--filigree))]" />
              <div className="border border-[hsl(var(--filigree)/0.15)] rounded-2xl p-8 text-center"
                style={{ background: "hsl(var(--surface-parchment))", boxShadow: "inset 0 1px 0 hsl(var(--emboss-light))" }}>
                <GraduationCap className="h-8 w-8 text-[hsl(var(--filigree-glow))] mx-auto mb-4" />
                <h3 className="text-xl sm:text-2xl font-bold mb-2 font-fantasy">Rally Your Guild</h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                  Recruit allies and earn extra quest credits. When your guild joins, everyone gets a customized territory dashboard mapped to your employers.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Button onClick={handleGetStarted} className="gap-2"
                    style={{ boxShadow: "0 0 16px hsl(var(--filigree-glow) / 0.2)" }}>
                    Enter the World Map <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" onClick={() => navigate("/schools")} className="gap-2 border-[hsl(var(--filigree)/0.2)]">
                    Tell Your Guild <GraduationCap className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </Section>

        {/* ═══ FINAL CTA ═══ */}
        <Section className="py-20 sm:py-28 px-6 relative">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full blur-[100px] pointer-events-none"
            style={{ background: "radial-gradient(circle, hsl(var(--filigree-glow) / 0.05), transparent 70%)" }} />
          <div className="max-w-3xl mx-auto text-center relative">
            <motion.h2 variants={fadeUp} custom={0} className="text-3xl sm:text-4xl font-bold font-fantasy mb-4">
              Your degree gets you in the room.
              <br />
              <span className="bg-gradient-to-r from-[hsl(var(--territory-analytical))] via-primary to-[hsl(var(--territory-creative))] bg-clip-text text-transparent">This gets you the throne.</span>
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="text-muted-foreground mb-8 max-w-md mx-auto">
              Scout any kingdom. Complete the quests. Conquer your territory.
              By the time you interview, you'll already know the battles.
            </motion.p>
            <motion.div variants={fadeUp} custom={2}>
              <Button size="lg" onClick={handleGetStarted} className="gap-2 text-base px-10 h-12"
                style={{ boxShadow: "0 0 20px hsl(var(--filigree-glow) / 0.2)" }}>
                Enter the World Map <ArrowRight className="h-4 w-4" />
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

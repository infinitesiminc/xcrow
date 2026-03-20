/**
 * /about — Mission, brand story, and team.
 */
import { useRef } from "react";
import founderImg from "@/assets/founder-jackson.png";
import { motion, useInView } from "framer-motion";
import { ArrowRight, Bird, Brain, Layers, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (d: number) => ({
    opacity: 1, y: 0,
    transition: { delay: d * 0.12, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

function Section({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.section ref={ref} initial="hidden" animate={inView ? "visible" : "hidden"} className={`relative ${className}`}>
      {children}
    </motion.section>
  );
}

export default function About() {
  const navigate = useNavigate();

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
        {/* HERO */}
        <Section className="pt-28 pb-20 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <motion.h1 variants={fadeUp} custom={0} className="text-4xl sm:text-5xl lg:text-6xl font-bold font-display leading-[1.08] tracking-tight mb-6">
              We're building the bridge between{" "}
              <span className="text-brand-human">education</span> and the{" "}
              <span className="text-brand-ai">AI economy</span>.
            </motion.h1>
            <motion.p variants={fadeUp} custom={1} className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              AI capabilities evolve monthly. Curricula update yearly. Careers span decades.
              Someone needs to close that gap. That's us.
            </motion.p>
          </div>
        </Section>

        {/* THE ACCELERATION GAP */}
        <Section className="py-20 px-6 bg-secondary/30">
          <div className="max-w-4xl mx-auto">
            <motion.div variants={fadeUp} custom={0} className="text-center mb-12">
              <span className="text-sm font-mono text-muted-foreground tracking-widest uppercase">The Problem</span>
              <h2 className="text-3xl sm:text-4xl font-bold mt-4">The Acceleration Gap</h2>
            </motion.div>
            <motion.div variants={fadeUp} custom={1} className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { icon: TrendingUp, label: "AI evolves", period: "Monthly", color: "text-brand-ai" },
                { icon: Layers, label: "Curricula update", period: "Yearly", color: "text-brand-mid" },
                { icon: Brain, label: "Careers span", period: "Decades", color: "text-brand-human" },
              ].map((item, i) => (
                <motion.div key={item.label} variants={fadeUp} custom={i + 2} className="rounded-xl border border-border bg-card p-6 text-center">
                  <item.icon className={`h-8 w-8 mx-auto mb-3 ${item.color}`} />
                  <span className={`text-2xl font-bold font-display ${item.color}`}>{item.period}</span>
                  <p className="text-sm text-muted-foreground mt-1">{item.label}</p>
                </motion.div>
              ))}
            </motion.div>
            <motion.p variants={fadeUp} custom={5} className="text-center text-muted-foreground mt-8 max-w-lg mx-auto">
              Traditional education wasn't built for this speed. Students graduate with knowledge that's already outdated.
              We give them — and their institutions — a way to keep up.
            </motion.p>
          </div>
        </Section>

        {/* THE CROW */}
        <Section className="py-20 px-6">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
              <Bird className="h-8 w-8 text-primary" />
            </motion.div>
            <motion.h2 variants={fadeUp} custom={1} className="text-3xl sm:text-4xl font-bold mb-6">
              Why the Crow?
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} className="text-lg text-muted-foreground leading-relaxed mb-6">
              Crows are among the most adaptive creatures on Earth. They use tools. They recognize patterns.
              They solve problems they've never seen before. They don't just memorize — they <em>think</em>.
            </motion.p>
            <motion.p variants={fadeUp} custom={3} className="text-lg text-muted-foreground leading-relaxed">
              That's the skillset the AI economy demands. Not rote knowledge, but{" "}
              <span className="text-foreground font-semibold">adaptive intelligence</span> —
              the ability to learn, unlearn, and relearn as the world shifts underneath you.
            </motion.p>
          </div>
        </Section>

        {/* WHAT WE BUILD */}
        <Section className="py-20 px-6 bg-secondary/30">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div variants={fadeUp} custom={0}>
              <span className="text-sm font-mono text-muted-foreground tracking-widest uppercase">Our Framework</span>
              <h2 className="text-3xl sm:text-4xl font-bold mt-4 mb-4">Jobs → Tasks → Skills</h2>
              <p className="text-muted-foreground max-w-xl mx-auto mb-10">
                We break every role into its atomic tasks, then map each task to the skills it requires —
                and score how AI is changing each one. This is the foundation of everything we build.
              </p>
            </motion.div>
            <motion.div variants={fadeUp} custom={1} className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
              {[
                { n: "5,000+", label: "Roles mapped" },
                { n: "33,000+", label: "Task clusters" },
                { n: "10,000+", label: "AI simulations" },
              ].map((stat, i) => (
                <div key={stat.label} className="rounded-lg border border-border bg-card p-4">
                  <span className="text-2xl font-bold text-foreground">{stat.n}</span>
                  <p className="text-xs text-muted-foreground font-mono mt-1">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </Section>

        {/* TEAM */}
        <Section className="py-20 px-6">
          <div className="max-w-3xl mx-auto text-center">
            <motion.h2 variants={fadeUp} custom={0} className="text-3xl sm:text-4xl font-bold mb-12">Team</motion.h2>
            <motion.div variants={fadeUp} custom={1} className="rounded-xl border border-border bg-card p-8 max-w-sm mx-auto">
              <div className="w-24 h-24 rounded-full mx-auto mb-4 overflow-hidden bg-gradient-to-br from-primary to-[hsl(330,90%,60%)] p-[3px]">
                <img src={founderImg} alt="Jackson Lam, Founder & CEO" className="w-full h-full rounded-full object-cover" />
              </div>
              <h3 className="text-lg font-bold">Jackson Lam</h3>
              <p className="text-sm text-muted-foreground">Founder & CEO</p>
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                Building the tools that help the next generation navigate the AI economy.
              </p>
            </motion.div>
          </div>
        </Section>

        {/* CTA */}
        <Section className="py-20 px-6 bg-secondary/30">
          <div className="max-w-3xl mx-auto text-center">
            <motion.h2 variants={fadeUp} custom={0} className="text-3xl sm:text-4xl font-bold mb-4">
              Join us in closing the gap.
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="text-muted-foreground mb-8 max-w-md mx-auto">
              Whether you're a student, educator, or institution — we'd love to hear from you.
            </motion.p>
            <motion.div variants={fadeUp} custom={2} className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button size="lg" onClick={() => navigate("/contact")} className="gap-2 px-8">
                Get in Touch <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/")} className="px-8">
                Explore Roles
              </Button>
            </motion.div>
          </div>
        </Section>
      </div>
      <Footer />
    </>
  );
}

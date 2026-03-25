/**
 * /blog/why-183-skills — Article: Why the 183 Skills Are Critical for Everyone
 */
import { motion } from "framer-motion";
import SEOHead from "@/components/SEOHead";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Shield, Target, Zap, Brain, Users } from "lucide-react";
import { Link } from "react-router-dom";

const fade = (d = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { delay: d * 0.1, duration: 0.5 } },
});

const PILLARS = [
  {
    icon: Brain,
    title: "Adaptive Thinking",
    desc: "The ability to reframe problems when AI changes the rules mid-game. You can't automate judgment calls that require context no model has seen.",
  },
  {
    icon: Zap,
    title: "Tool Awareness",
    desc: "Knowing which AI tool to deploy — and when to override it. The gap between 'using ChatGPT' and orchestrating an AI stack is enormous.",
  },
  {
    icon: Users,
    title: "Human Value-Add",
    desc: "Stakeholder negotiation, cross-cultural nuance, ethical reasoning — the irreplaceable layer that sits on top of any AI output.",
  },
  {
    icon: Target,
    title: "Domain Judgment",
    desc: "Deep expertise that lets you spot when an AI is confidently wrong. Without it, you're a passenger; with it, you're the pilot.",
  },
];

export default function WhyTheseSkillsMatter() {
  return (
    <>
      <SEOHead
        title="Why the 183 Skills Are Critical for Everyone"
        description="AI isn't replacing jobs — it's replacing tasks. The 183 future skills are the new literacy. Here's why they matter for every professional, student, and leader."
        path="/blog/why-183-skills"
      />
      <Navbar />
      <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
        <article className="pt-28 pb-20 px-6">
          <div className="max-w-3xl mx-auto">

            {/* Header */}
            <motion.div {...fade(0)} className="mb-12">
              <Link to="/blog" className="text-xs font-mono text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest mb-4 inline-block">
                ← Back to The Chronicle
              </Link>
              <p className="text-sm font-medium text-primary mb-3">Intel · Mar 2026</p>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-fantasy tracking-tight leading-tight mb-5">
                Why the 183 Skills Are Critical&nbsp;for&nbsp;Everyone
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                AI isn't coming for your job. It's coming for the <em>tasks</em> inside your job — one by one.
                The question isn't whether your role will change. It's whether you'll have the skills to lead the new version of it.
              </p>
            </motion.div>

            {/* Body */}
            <motion.div {...fade(1)} className="prose prose-lg dark:prose-invert max-w-none space-y-8">

              <section>
                <h2 className="text-2xl font-bold font-fantasy text-foreground">The Old Playbook Is Dead</h2>
                <p className="text-muted-foreground leading-relaxed">
                  For decades, career readiness meant a degree, a few certifications, and domain expertise.
                  That playbook assumed technology changed <em>slowly</em> — giving institutions time to update curricula and professionals time to upskill on the job.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  That assumption broke in 2023. Large language models, code agents, and multimodal AI systems
                  collapsed years of gradual change into months. Today, <strong className="text-foreground">67% of tasks</strong> in the average
                  knowledge-worker role have measurable AI exposure — meaning an AI tool can already perform
                  some or all of that task.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold font-fantasy text-foreground">Why 183? Not 10, Not 1,000</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We reverse-engineered the catalogue from <strong className="text-foreground">100,000+ real job postings</strong> across every
                  major industry. Each skill passed a strict "sim-worthiness" test: it must represent
                  a distinct, non-overlapping learning action. No padding, no synonyms, no filler.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  The result is a compact, actionable map of what the AI-era workforce actually needs.
                  Think of it as the periodic table of future work — every element matters, and together they
                  describe the full landscape.
                </p>
              </section>

              {/* Mid-article CTA */}
              <motion.div {...fade(2)}
                className="not-prose my-10 rounded-xl border border-primary/15 p-6 sm:p-8 text-center"
                style={{ background: "hsl(var(--surface-stone))", boxShadow: "inset 0 1px 0 hsl(var(--emboss-light))" }}
              >
                <Sparkles className="h-5 w-5 text-primary mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-4">Explore all 183 skills on the interactive World Map.</p>
                <Button asChild size="sm" className="font-fantasy">
                  <Link to="/map">
                    Enter the World Map <ArrowRight className="h-4 w-4 ml-1.5" />
                  </Link>
                </Button>
              </motion.div>

              <section>
                <h2 className="text-2xl font-bold font-fantasy text-foreground">The Four Pillars Every Skill Maps To</h2>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  Each of the 183 skills falls into one or more of four pillars — the framework behind every
                  Xcrow.ai quest and simulation.
                </p>
                <div className="not-prose grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {PILLARS.map((p) => (
                    <div
                      key={p.title}
                      className="rounded-lg border border-border/60 p-5"
                      style={{ background: "hsl(var(--surface-stone))", boxShadow: "inset 0 1px 0 hsl(var(--emboss-light))" }}
                    >
                      <p.icon className="h-5 w-5 text-primary mb-2" />
                      <h3 className="font-bold text-sm mb-1 text-foreground">{p.title}</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">{p.desc}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold font-fantasy text-foreground">Who Needs These Skills?</h2>
                <p className="text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">Everyone.</strong> That's not marketing — it's math.
                  AI exposure isn't limited to tech roles. Marketing managers, financial analysts,
                  project coordinators, legal associates, HR business partners — every white-collar
                  function has tasks that AI can now touch.
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li><strong className="text-foreground">Students</strong> — graduate with a skill profile employers can actually verify, not just a transcript.</li>
                  <li><strong className="text-foreground">Professionals</strong> — identify which of your current tasks are at risk and build the skills to stay ahead.</li>
                  <li><strong className="text-foreground">Leaders &amp; HR teams</strong> — map your entire workforce's readiness and close gaps before they become layoffs.</li>
                  <li><strong className="text-foreground">Universities</strong> — benchmark your curriculum against real market demand and prove employability outcomes.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold font-fantasy text-foreground">Skills Are the New Currency</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Degrees tell employers what you studied. Skills tell them what you can <em>do</em>.
                  In a world where AI handles the routine, the premium goes to people who can
                  orchestrate, judge, adapt, and lead alongside intelligent systems.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  The 183 skills aren't a wishlist. They're the minimum viable toolkit for staying
                  relevant in the next decade of work. The only question is whether you'll build
                  yours proactively — or scramble to catch up later.
                </p>
              </section>
            </motion.div>

            {/* Bottom CTA */}
            <motion.div {...fade(3)}
              className="mt-14 text-center rounded-xl border border-primary/15 p-8"
              style={{ background: "hsl(var(--surface-stone))", boxShadow: "inset 0 1px 0 hsl(var(--emboss-light))" }}
            >
              <Shield className="h-6 w-6 text-primary mx-auto mb-3" />
              <h3 className="font-fantasy text-xl font-bold mb-2">Ready to see where you stand?</h3>
              <p className="text-sm text-muted-foreground mb-5 max-w-md mx-auto">
                Scout any role, see which skills are under threat, and start practicing — free.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Button asChild className="font-fantasy">
                  <Link to="/map">
                    Enter the World Map <ArrowRight className="h-4 w-4 ml-1.5" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="font-fantasy">
                  <Link to="/skills">
                    Browse All 183 Skills
                  </Link>
                </Button>
              </div>
            </motion.div>

          </div>
        </article>
      </div>
      <Footer />
    </>
  );
}

import { motion } from "framer-motion";
import SEOHead from "@/components/SEOHead";
import founderImg from "@/assets/founder-jackson.png";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import logoCrow from "@/assets/logo-crow.png";
import { Button } from "@/components/ui/button";
import { ArrowRight, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 30 } as const,
  whileInView: { opacity: 1, y: 0 } as const,
  viewport: { once: true } as const,
  transition: { duration: 0.5, delay },
});

export default function About() {
  const navigate = useNavigate();

  return (
    <>
      <SEOHead
        title="About"
        description="Xcrow was built to make outbound lead generation accessible to everyone. Meet the founder and learn the mission behind the #1 AI lead hunter."
        path="/about"
      />
      <Navbar />

      <div className="min-h-screen bg-background">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] rounded-full bg-primary/[0.03] blur-[120px]" />
          </div>
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 pt-20 sm:pt-28 pb-16 text-center">
            <motion.div {...fade()}>
              <img src={logoCrow} alt="Xcrow" className="h-20 w-20 object-contain mx-auto mb-6" />
            </motion.div>
            <motion.p {...fade(0.05)} className="text-primary text-sm font-semibold tracking-[0.2em] uppercase mb-6">
              About Xcrow
            </motion.p>
            <motion.h1 {...fade(0.1)} className="text-[2.5rem] sm:text-[3.5rem] font-extrabold text-foreground leading-[1.05] tracking-[-0.02em] uppercase mb-6">
              Outbound for <span className="text-primary">Everyone</span>
            </motion.h1>
            <motion.p {...fade(0.2)} className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
              We believe the best product should win — not the company with the biggest sales team.
              Xcrow makes enterprise-grade lead generation accessible to founders, freelancers, and small teams.
            </motion.p>
          </div>
        </section>

        {/* Mission */}
        <section className="bg-muted/30 py-20">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <motion.div {...fade()} className="space-y-8">
              <div>
                <h2 className="text-2xl font-extrabold text-foreground tracking-tight uppercase mb-4">The Problem</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Outbound lead generation has always been a game for big companies with dedicated sales ops teams, expensive databases, and complex tooling. Solo founders and small teams were left with two options: spend weeks manually prospecting, or pay $30K+ for enterprise tools designed for 50-person sales floors.
                </p>
              </div>
              <div>
                <h2 className="text-2xl font-extrabold text-foreground tracking-tight uppercase mb-4">The Solution</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Xcrow flips the model. Instead of giving you a database and saying "figure it out," we start with one input — your company URL — and AI handles everything: analyzing your business, mapping your ideal prospects, scoring leads, and drafting personalized outreach. No sales experience required.
                </p>
              </div>
              <div>
                <h2 className="text-2xl font-extrabold text-foreground tracking-tight uppercase mb-4">The Vision</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We're building toward a world where any company — regardless of size or sales budget — can run an outbound program that rivals the best enterprise sales teams. AI should level the playing field, not widen the gap.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Founder */}
        <section className="py-20">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <motion.div {...fade()} className="bg-card border border-border rounded-2xl p-8 sm:p-10 flex flex-col sm:flex-row gap-8 items-start">
              <img src={founderImg} alt="Jackson Lam, Founder of Xcrow" className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl object-cover shrink-0" />
              <div>
              <p className="text-primary text-sm font-semibold tracking-[0.15em] uppercase mb-4">Founder</p>
              <h2 className="text-2xl font-extrabold text-foreground tracking-tight mb-4">Jackson Lam</h2>
              <div className="text-muted-foreground leading-relaxed space-y-4">
                <p>
                  I built Xcrow because I lived the problem. As a solo founder, I spent more time trying to figure out <em>who</em> to sell to than actually building my product. Every lead gen tool assumed I already had a sales playbook, an ICP document, and a RevOps team.
                </p>
                <p>
                  I didn't. I just had a good product and needed to find the right people to show it to.
                </p>
                <p>
                  So I built the tool I wished existed — one that takes a single URL and does all the sales research for you. No spreadsheets, no 50-filter search queries, no $30K contracts.
                </p>
                <p>
                  Xcrow is based in Los Angeles. I respond to every email personally.
                </p>
              </div>
              <div className="flex items-center gap-4 mt-6 pt-6 border-t border-border">
                <a href="mailto:jackson@xcrow.ai" className="inline-flex items-center gap-2 text-sm text-primary font-semibold hover:underline">
                  <Mail className="w-4 h-4" /> jackson@xcrow.ai
                </a>
              </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-primary/[0.04] border-t border-primary/10 py-20 text-center">
          <motion.div {...fade()} className="max-w-2xl mx-auto px-4">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight uppercase mb-5">
              Try Xcrow <span className="text-primary">Today</span>
            </h2>
            <p className="text-muted-foreground mb-10 text-lg">Free to start. No credit card. Leads in 60 seconds.</p>
            <Button size="lg" className="h-14 px-10 gap-2.5 text-base font-bold shadow-lg rounded-xl" onClick={() => navigate("/leadhunter")}>
              <ArrowRight className="w-5 h-5" />
              Start Hunting — It's Free
            </Button>
          </motion.div>
        </section>

        <Footer />
      </div>
    </>
  );
}

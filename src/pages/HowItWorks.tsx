import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import SEOHead from "@/components/SEOHead";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Globe, Brain, ListChecks, Send, ArrowRight, ArrowDown } from "lucide-react";

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 30 } as const,
  whileInView: { opacity: 1, y: 0 } as const,
  viewport: { once: true } as const,
  transition: { duration: 0.5, delay },
});

const STEPS = [
  {
    number: "01",
    icon: Globe,
    title: "Paste Any Website",
    subtitle: "Your target company's URL is all you need",
    desc: "Drop a company URL into Xcrow. Our AI scrapes the website, reads their product pages, about page, and case studies to build a complete picture of the business — what they sell, who they sell to, and how they position themselves.",
    details: ["Automatic website crawling", "Product & service extraction", "Market positioning analysis", "Company size & stage detection"],
  },
  {
    number: "02",
    icon: Brain,
    title: "AI Builds Your Prospect Map",
    subtitle: "A full targeting strategy in seconds",
    desc: "Based on the company DNA analysis, AI generates a complete go-to-market tree — identifying the best verticals to target, ideal company segments, and the exact decision-maker personas who would buy from this company.",
    details: ["Vertical & sub-vertical identification", "Buyer persona generation", "ICP criteria mapping", "Competitive landscape awareness"],
  },
  {
    number: "03",
    icon: ListChecks,
    title: "Get Scored, Verified Leads",
    subtitle: "Real people, real profiles, real fit scores",
    desc: "Xcrow queries verified contact databases to find real decision-makers matching your prospect map. Each lead comes with a LinkedIn profile, fit score, and a specific reason why they're a good target.",
    details: ["Verified LinkedIn profiles", "AI fit scoring (0-100)", "Seniority filtering (Director+)", "Per-lead recommendation reasons"],
  },
  {
    number: "04",
    icon: Send,
    title: "Draft & Send Outreach",
    subtitle: "Personalized emails in one click",
    desc: "AI drafts personalized outreach for each lead based on their role, company, and why they're a fit. Track your pipeline, log activities, and manage the entire outreach process from one dashboard.",
    details: ["Per-lead personalized emails", "One-click send via your email", "Pipeline status tracking", "Activity logging & CRM"],
  },
];

export default function HowItWorks() {
  const navigate = useNavigate();

  return (
    <>
      <SEOHead
        title="How It Works"
        description="See how Xcrow turns one website URL into a scored lead pipeline with outreach drafts — in 4 simple steps."
        path="/how-it-works"
      />
      <Navbar />

      <div className="min-h-screen bg-background">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] rounded-full bg-primary/[0.03] blur-[120px]" />
          </div>
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 pt-20 sm:pt-28 pb-16 text-center">
            <motion.p {...fade()} className="text-primary text-sm font-semibold tracking-[0.2em] uppercase mb-6">
              How it works
            </motion.p>
            <motion.h1 {...fade(0.1)} className="text-[2.5rem] sm:text-[3.5rem] md:text-[4rem] font-extrabold text-foreground leading-[1.05] tracking-[-0.02em] uppercase mb-6">
              From URL to Pipeline
              <br />
              <span className="text-primary">in 60 Seconds</span>
            </motion.h1>
            <motion.p {...fade(0.2)} className="text-muted-foreground text-lg max-w-2xl mx-auto mb-10">
              No spreadsheets. No manual research. No GTM expertise. Just paste a URL and let AI do the work.
            </motion.p>
            <motion.div {...fade(0.3)}>
              <Button size="lg" className="h-14 px-10 gap-2.5 text-base font-bold shadow-lg rounded-xl" onClick={() => navigate("/leadgen")}>
                <ArrowRight className="w-5 h-5" />
                Try It Now — Free
              </Button>
            </motion.div>
          </div>
        </section>

        {/* Steps */}
        <section className="py-16 sm:py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
            {STEPS.map((step, i) => (
              <div key={i}>
                <motion.div
                  {...fade(0)}
                  className="bg-card border border-border rounded-2xl p-8 sm:p-10 relative overflow-hidden group hover:border-primary/20 transition-colors"
                >
                  {/* Step number watermark */}
                  <span className="absolute top-6 right-8 text-[5rem] font-black text-primary/[0.05] leading-none select-none">
                    {step.number}
                  </span>

                  <div className="relative">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
                        <step.icon className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-primary font-semibold uppercase tracking-wider">Step {step.number}</p>
                        <h2 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">{step.title}</h2>
                      </div>
                    </div>

                    <p className="text-primary/80 text-sm font-medium mb-3">{step.subtitle}</p>
                    <p className="text-muted-foreground leading-relaxed mb-6 max-w-2xl">{step.desc}</p>

                    <div className="grid grid-cols-2 gap-2">
                      {step.details.map((d) => (
                        <div key={d} className="flex items-center gap-2 text-sm text-foreground/80">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                          {d}
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>

                {/* Arrow connector */}
                {i < STEPS.length - 1 && (
                  <div className="flex justify-center py-2">
                    <ArrowDown className="w-5 h-5 text-primary/30" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="bg-primary/[0.04] border-t border-primary/10 py-20 text-center">
          <motion.div {...fade()} className="max-w-2xl mx-auto px-4">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight uppercase mb-5">
              Ready to <span className="text-primary">See It in Action?</span>
            </h2>
            <p className="text-muted-foreground mb-10 text-lg">Paste your first URL and get leads in under a minute.</p>
            <Button size="lg" className="h-14 px-10 gap-2.5 text-base font-bold shadow-lg rounded-xl" onClick={() => navigate("/leadgen")}>
              <ArrowRight className="w-5 h-5" />
              Start Generating — It's Free
            </Button>
          </motion.div>
        </section>

        <Footer />
      </div>
    </>
  );
}

import { useParams, Navigate, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import SEOHead from "@/components/SEOHead";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, ArrowRight, AlertTriangle } from "lucide-react";
import { COMPETITORS } from "@/data/competitors";

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 30 } as const,
  whileInView: { opacity: 1, y: 0 } as const,
  viewport: { once: true } as const,
  transition: { duration: 0.5, delay },
});

export default function CompetitorComparison() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const data = slug ? COMPETITORS[slug] : undefined;

  if (!data) return <Navigate to="/" replace />;

  return (
    <>
      <SEOHead title={data.seoTitle} description={data.seoDescription} path={`/vs/${data.slug}`} />
      <Navbar />

      <div className="min-h-screen bg-background">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] rounded-full bg-primary/[0.03] blur-[120px]" />
          </div>
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 pt-20 sm:pt-28 pb-16 text-center">
            <motion.p {...fade()} className="text-primary text-sm font-semibold tracking-[0.2em] uppercase mb-6">
              Xcrow vs {data.name}
            </motion.p>
            <motion.h1 {...fade(0.1)} className="text-[2.5rem] sm:text-[3.5rem] md:text-[4.5rem] font-extrabold text-foreground leading-[1.05] tracking-[-0.02em] uppercase mb-6">
              {data.heroHeadline}
              <br />
              <span className="text-primary">{data.heroAccent}</span>
            </motion.h1>
            <motion.p {...fade(0.2)} className="text-muted-foreground text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
              {data.tagline}
            </motion.p>
            <motion.div {...fade(0.3)}>
              <Button size="lg" className="h-14 px-10 gap-2.5 text-base font-bold shadow-lg rounded-xl" onClick={() => navigate("/leadgen")}>
                <ArrowRight className="w-5 h-5" />
                Try Xcrow Free
              </Button>
            </motion.div>
          </div>
        </section>

        {/* Pain points */}
        <section className="bg-muted/30 py-20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <motion.div {...fade()} className="text-center mb-14">
              <p className="text-primary text-sm font-semibold tracking-[0.15em] uppercase mb-4">The problem</p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight uppercase">
                Why Teams Switch from {data.name}
              </h2>
            </motion.div>
            <div className="grid sm:grid-cols-2 gap-6">
              {data.painPoints.map((pp, i) => (
                <motion.div key={i} {...fade(i * 0.08)} className="bg-card border border-border rounded-2xl p-6">
                  <div className="flex items-start gap-3 mb-3">
                    <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                    <h3 className="font-bold text-foreground">{pp.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed pl-8">{pp.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Comparison table */}
        <section className="py-20">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <motion.div {...fade()} className="text-center mb-14">
              <p className="text-primary text-sm font-semibold tracking-[0.15em] uppercase mb-4">Feature comparison</p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight uppercase">
                Xcrow vs {data.name}
              </h2>
            </motion.div>

            <motion.div {...fade(0.1)} className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
              <div className="grid grid-cols-[1fr_100px_100px] sm:grid-cols-[1fr_120px_120px] items-center px-6 py-4 border-b border-border bg-muted/40">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-[0.1em]">Feature</span>
                <span className="text-xs font-bold text-primary text-center uppercase tracking-[0.1em]">Xcrow</span>
                <span className="text-xs font-bold text-muted-foreground text-center uppercase tracking-[0.1em]">{data.name}</span>
              </div>
              {data.comparison.map((row, i) => {
                const renderCell = (val: boolean | string) => {
                  if (typeof val === "string") return <span className="text-xs text-muted-foreground font-medium">{val}</span>;
                  return val ? <CheckCircle2 className="w-5 h-5 text-primary" /> : <XCircle className="w-5 h-5 text-muted-foreground/30" />;
                };
                return (
                  <div key={i} className={`grid grid-cols-[1fr_100px_100px] sm:grid-cols-[1fr_120px_120px] items-center px-6 py-4 ${i < data.comparison.length - 1 ? "border-b border-border/40" : ""}`}>
                    <span className="text-sm text-foreground font-medium">{row.feature}</span>
                    <div className="flex justify-center">{renderCell(row.xcrow)}</div>
                    <div className="flex justify-center">{renderCell(row.competitor)}</div>
                  </div>
                );
              })}
            </motion.div>
          </div>
        </section>

        {/* About the competitor */}
        <section className="bg-muted/30 py-20">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <motion.div {...fade()} className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight uppercase mb-4">
                What is {data.name}?
              </h2>
              <p className="text-muted-foreground leading-relaxed max-w-2xl mx-auto">{data.description}</p>
            </motion.div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-20">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <motion.div {...fade()} className="text-center mb-14">
              <p className="text-primary text-sm font-semibold tracking-[0.15em] uppercase mb-4">FAQ</p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight uppercase">
                Common Questions
              </h2>
            </motion.div>
            <div className="space-y-6">
              {data.faq.map((item, i) => (
                <motion.div key={i} {...fade(i * 0.08)} className="bg-card border border-border rounded-2xl p-6">
                  <h3 className="font-bold text-foreground mb-2">{item.q}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.a}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="bg-primary/[0.04] border-t border-primary/10 py-20 text-center">
          <motion.div {...fade()} className="max-w-2xl mx-auto px-4">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight uppercase mb-5">
              Ready to Try a <span className="text-primary">Better Way?</span>
            </h2>
            <p className="text-muted-foreground mb-10 text-lg">
              Paste one URL. Get scored leads in 60 seconds. Free to start.
            </p>
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

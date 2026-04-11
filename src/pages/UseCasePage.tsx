import { useParams, Navigate, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import SEOHead from "@/components/SEOHead";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowRight, AlertTriangle, CheckCircle2, Target } from "lucide-react";
import { USE_CASES, USE_CASE_SLUGS } from "@/data/use-cases";

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 30 } as const,
  whileInView: { opacity: 1, y: 0 } as const,
  viewport: { once: true } as const,
  transition: { duration: 0.5, delay },
});

export default function UseCasePage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const data = slug ? USE_CASES[slug] : undefined;

  if (!data) return <Navigate to="/use-cases" replace />;

  const otherCases = USE_CASE_SLUGS.filter((s) => s !== slug).slice(0, 4);

  return (
    <>
      <SEOHead title={data.seoTitle} description={data.seoDescription} path={`/use-cases/${data.slug}`} />
      <Navbar />

      <div className="min-h-screen bg-background">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] rounded-full bg-primary/[0.03] blur-[120px]" />
          </div>
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 pt-20 sm:pt-28 pb-16 text-center">
            <motion.p {...fade()} className="text-primary text-sm font-semibold tracking-[0.2em] uppercase mb-6">
              Use Case · {data.industry}
            </motion.p>
            <motion.h1 {...fade(0.1)} className="text-[2.5rem] sm:text-[3.5rem] md:text-[4rem] font-extrabold text-foreground leading-[1.05] tracking-[-0.02em] uppercase mb-6">
              {data.heroHeadline}
              <br />
              <span className="text-primary">{data.heroAccent}</span>
            </motion.h1>
            <motion.p {...fade(0.2)} className="text-muted-foreground text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
              {data.heroDesc}
            </motion.p>
            <motion.div {...fade(0.3)}>
              <Button size="lg" className="h-14 px-10 gap-2.5 text-base font-bold shadow-lg rounded-xl" onClick={() => navigate("/leadgen")}>
                <ArrowRight className="w-5 h-5" />
                Try It Free
              </Button>
            </motion.div>
          </div>
        </section>

        {/* Pain points */}
        <section className="bg-muted/30 py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <motion.div {...fade()} className="text-center mb-14">
              <p className="text-primary text-sm font-semibold tracking-[0.15em] uppercase mb-4">The problem</p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight uppercase">
                Sound Familiar?
              </h2>
            </motion.div>
            <div className="grid sm:grid-cols-2 gap-4">
              {data.painPoints.map((pp, i) => (
                <motion.div key={i} {...fade(i * 0.06)} className="flex items-start gap-3 bg-card border border-border rounded-xl p-5">
                  <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                  <p className="text-sm text-foreground">{pp}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* How Xcrow helps */}
        <section className="py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <motion.div {...fade()} className="text-center mb-14">
              <p className="text-primary text-sm font-semibold tracking-[0.15em] uppercase mb-4">The solution</p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight uppercase">
                How Xcrow Helps {data.industry}
              </h2>
            </motion.div>
            <div className="grid md:grid-cols-3 gap-6">
              {data.howXcrowHelps.map((h, i) => (
                <motion.div key={i} {...fade(i * 0.08)} className="bg-card border border-border rounded-2xl p-6 text-center">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-bold text-foreground mb-2">{h.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{h.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Example targets */}
        <section className="bg-muted/30 py-16">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
            <motion.div {...fade()}>
              <div className="flex items-center justify-center gap-2 mb-4">
                <Target className="w-5 h-5 text-primary" />
                <p className="text-primary text-sm font-semibold tracking-[0.15em] uppercase">Example targets</p>
              </div>
              <div className="flex flex-wrap justify-center gap-3">
                {data.exampleTargets.map((t) => (
                  <span key={t} className="px-4 py-2 bg-card border border-border rounded-full text-sm font-medium text-foreground">
                    {t}
                  </span>
                ))}
              </div>
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
            <div className="space-y-5">
              {data.faq.map((item, i) => (
                <motion.div key={i} {...fade(i * 0.06)} className="bg-card border border-border rounded-2xl p-6">
                  <h3 className="font-bold text-foreground mb-2">{item.q}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.a}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Other use cases */}
        <section className="bg-muted/30 py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <motion.div {...fade()} className="text-center mb-8">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Other use cases</p>
            </motion.div>
            <div className="flex flex-wrap justify-center gap-3">
              {otherCases.map((s) => (
                <Link
                  key={s}
                  to={`/use-cases/${s}`}
                  className="px-5 py-2.5 bg-card border border-border rounded-xl text-sm font-medium text-foreground hover:border-primary/30 hover:text-primary transition-colors"
                >
                  {USE_CASES[s].industry}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-primary/[0.04] border-t border-primary/10 py-20 text-center">
          <motion.div {...fade()} className="max-w-2xl mx-auto px-4">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight uppercase mb-5">
              Start Finding <span className="text-primary">{data.industry}</span> Leads
            </h2>
            <p className="text-muted-foreground mb-10 text-lg">Free to start. No credit card. Leads in 60 seconds.</p>
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

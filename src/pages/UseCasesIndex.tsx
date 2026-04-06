import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import SEOHead from "@/components/SEOHead";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { USE_CASES, USE_CASE_SLUGS } from "@/data/use-cases";

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 30 } as const,
  whileInView: { opacity: 1, y: 0 } as const,
  viewport: { once: true } as const,
  transition: { duration: 0.5, delay },
});

export default function UseCasesIndex() {
  return (
    <>
      <SEOHead
        title="Use Cases"
        description="See how Xcrow helps SaaS companies, agencies, recruiters, consultants, and e-commerce vendors find qualified leads with AI."
        path="/use-cases"
      />
      <Navbar />

      <div className="min-h-screen bg-background">
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] rounded-full bg-primary/[0.03] blur-[120px]" />
          </div>
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 pt-20 sm:pt-28 pb-16 text-center">
            <motion.p {...fade()} className="text-primary text-sm font-semibold tracking-[0.2em] uppercase mb-6">
              Use Cases
            </motion.p>
            <motion.h1 {...fade(0.1)} className="text-[2.5rem] sm:text-[3.5rem] md:text-[4rem] font-extrabold text-foreground leading-[1.05] tracking-[-0.02em] uppercase mb-6">
              Lead Gen for <span className="text-primary">Every Industry</span>
            </motion.h1>
            <motion.p {...fade(0.2)} className="text-muted-foreground text-lg max-w-2xl mx-auto">
              See how teams across industries use Xcrow to find qualified leads without sales experience.
            </motion.p>
          </div>
        </section>

        <section className="py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {USE_CASE_SLUGS.map((slug, i) => {
              const uc = USE_CASES[slug];
              return (
                <motion.div key={slug} {...fade(i * 0.06)}>
                  <Link
                    to={`/use-cases/${slug}`}
                    className="block bg-card border border-border rounded-2xl p-6 hover:border-primary/30 hover:shadow-lg transition-all group h-full"
                  >
                    <h3 className="font-bold text-foreground text-lg mb-2 group-hover:text-primary transition-colors">{uc.industry}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">{uc.heroDesc}</p>
                    <span className="text-primary text-sm font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
                      Learn more <ArrowRight className="w-4 h-4" />
                    </span>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}

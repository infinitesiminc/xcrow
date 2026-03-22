/**
 * /blog — The Chronicle: Scrolls & dispatches from the frontier.
 */
import { motion } from "framer-motion";
import { ArrowRight, Scroll } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (d: number) => ({
    opacity: 1, y: 0,
    transition: { delay: d * 0.12, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

const CATEGORIES: Record<string, { bg: string; text: string }> = {
  "Intel":            { bg: "bg-[hsl(var(--territory-analytical)/0.12)]", text: "text-[hsl(var(--territory-analytical))]" },
  "Field Reports":    { bg: "bg-[hsl(var(--territory-creative)/0.12)]", text: "text-[hsl(var(--territory-creative))]" },
  "Territory Guides": { bg: "bg-[hsl(var(--territory-strategic)/0.12)]", text: "text-[hsl(var(--territory-strategic))]" },
};

const ARTICLES = [
  {
    title: "Which Kingdoms Are Most Exposed to AI? A Task-Level Analysis",
    excerpt: "We analyzed 33,000+ quest clusters to map AI exposure across industries. Here's what the data shows about the future of work.",
    date: "Mar 2026",
    category: "Intel",
  },
  {
    title: "The Skill Stack: Why Kingdoms Are Just Lego Blocks",
    excerpt: "Every kingdom is made of the same building blocks — skills. Understanding this changes how you think about career conquest.",
    date: "Feb 2026",
    category: "Territory Guides",
  },
  {
    title: "Why Guilds Need Curriculum Gap Analysis Now",
    excerpt: "67% of skills in the average university catalog are AI-exposed. Here's how institutions can identify and close the gaps.",
    date: "Feb 2026",
    category: "Field Reports",
  },
  {
    title: "From Knowledge to Readiness: The 4 Pillars of AI-Proof Skills",
    excerpt: "Tool Awareness, Human Value-Add, Adaptive Thinking, and Domain Judgment — the framework behind every Xcrow.ai quest.",
    date: "Jan 2026",
    category: "Territory Guides",
  },
];

export default function Blog() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
        <motion.section initial="hidden" animate="visible" className="pt-28 pb-20 px-6">
          <div className="max-w-4xl mx-auto">
            <motion.div variants={fadeUp} custom={0} className="text-center mb-14">
              <div className="inline-flex items-center gap-2 mb-4">
                <Scroll className="h-5 w-5 text-[hsl(var(--filigree-glow))]" />
                <span className="text-sm font-mono text-[hsl(var(--filigree))] tracking-widest uppercase">Scrolls & Dispatches</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold font-fantasy tracking-tight mb-4">The Chronicle</h1>
              <p className="text-lg text-muted-foreground max-w-lg mx-auto">
                Intel, field reports, and territory guides from the frontier of AI and work.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {ARTICLES.map((article, i) => {
                const cat = CATEGORIES[article.category] || CATEGORIES["Intel"];
                return (
                  <motion.article
                    key={article.title}
                    variants={fadeUp}
                    custom={i + 1}
                    className="group rounded-xl border border-[hsl(var(--filigree)/0.12)] p-6 hover:border-[hsl(var(--filigree)/0.3)] transition-colors cursor-pointer"
                    style={{
                      background: "hsl(var(--surface-stone))",
                      boxShadow: "inset 0 1px 0 hsl(var(--emboss-light))",
                    }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${cat.bg} ${cat.text}`}>
                        {article.category}
                      </span>
                      <span className="text-xs text-muted-foreground">{article.date}</span>
                    </div>
                    <h2 className="text-lg font-bold mb-2 group-hover:text-[hsl(var(--filigree-glow))] transition-colors leading-snug">
                      {article.title}
                    </h2>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">{article.excerpt}</p>
                    <span className="text-sm font-medium text-[hsl(var(--filigree-glow))] inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      Read scroll <ArrowRight className="h-3 w-3" />
                    </span>
                  </motion.article>
                );
              })}
            </div>
          </div>
        </motion.section>
      </div>
      <Footer />
    </>
  );
}

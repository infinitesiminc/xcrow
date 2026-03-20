/**
 * /blog — Static MVP blog/resources page for SEO.
 */
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (d: number) => ({
    opacity: 1, y: 0,
    transition: { delay: d * 0.12, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

const ARTICLES = [
  {
    title: "Which Jobs Are Most Exposed to AI? A Task-Level Analysis",
    excerpt: "We analyzed 33,000+ job task clusters to map AI exposure across industries. Here's what the data shows about the future of work.",
    date: "Mar 2026",
    category: "AI & Work",
    color: "bg-brand-ai/10 text-brand-ai",
  },
  {
    title: "The Skill Stack: Why Jobs Are Just Lego Blocks",
    excerpt: "Every job is made of the same building blocks — skills. Understanding this changes how you think about career planning.",
    date: "Feb 2026",
    category: "Skills Research",
    color: "bg-brand-mid/10 text-brand-mid",
  },
  {
    title: "Why Universities Need Curriculum Gap Analysis Now",
    excerpt: "67% of skills in the average university catalog are AI-exposed. Here's how institutions can identify and close the gaps.",
    date: "Feb 2026",
    category: "For Educators",
    color: "bg-brand-human/10 text-brand-human",
  },
  {
    title: "From Knowledge to Readiness: The 4 Pillars of AI-Proof Skills",
    excerpt: "Tool Awareness, Human Value-Add, Adaptive Thinking, and Domain Judgment — the framework behind every Crowy.ai simulation.",
    date: "Jan 2026",
    category: "Skills Research",
    color: "bg-brand-mid/10 text-brand-mid",
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
              <h1 className="text-4xl sm:text-5xl font-bold font-display tracking-tight mb-4">Insights</h1>
              <p className="text-lg text-muted-foreground max-w-lg mx-auto">
                Research, analysis, and perspectives on AI, skills, and the future of work.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {ARTICLES.map((article, i) => (
                <motion.article
                  key={article.title}
                  variants={fadeUp}
                  custom={i + 1}
                  className="group rounded-xl border border-border bg-card p-6 hover:border-primary/30 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${article.color}`}>
                      {article.category}
                    </span>
                    <span className="text-xs text-muted-foreground">{article.date}</span>
                  </div>
                  <h2 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors leading-snug">
                    {article.title}
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">{article.excerpt}</p>
                  <span className="text-sm font-medium text-primary inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    Read more <ArrowRight className="h-3 w-3" />
                  </span>
                </motion.article>
              ))}
            </div>
          </div>
        </motion.section>
      </div>
      <Footer />
    </>
  );
}

/**
 * Animated visual showing the Website → DNA Analysis → Leads pipeline.
 * Pure decorative illustration — no interactivity.
 */
import { motion } from "framer-motion";
import { Globe, Brain, Users, ArrowRight, Sparkles } from "lucide-react";

const EASE: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];

const fadeInView = (delay = 0) => ({
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" as const },
  transition: { duration: 0.6, delay, ease: EASE },
});

const MOCK_LEADS = [
  { name: "Sarah Chen", title: "VP of Sales", fit: 95 },
  { name: "Mark Rivera", title: "Head of Growth", fit: 91 },
  { name: "Lisa Park", title: "CRO", fit: 88 },
];

const DNA_TAGS = ["B2B SaaS", "Series B", "50-200 emp", "Product-led"];

export default function WebsiteToLeadsVisual() {
  return (
    <section className="py-20 sm:py-28 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div {...fadeInView()} className="text-center mb-14">
          <p className="text-primary text-sm font-semibold tracking-[0.15em] uppercase mb-4">
            See it in action
          </p>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight uppercase">
            From Website to <span className="text-primary">Leads</span>
          </h2>
          <p className="text-muted-foreground mt-4 max-w-lg mx-auto">
            Drop a URL. Watch AI decode the company and surface your ideal buyers.
          </p>
        </motion.div>

        {/* Pipeline visual */}
        <div className="flex flex-col lg:flex-row items-center gap-6 lg:gap-4">
          {/* Step 1 — URL Input */}
          <motion.div
            {...fadeInView(0.1)}
            className="w-full lg:w-1/3"
          >
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/[0.04] rounded-full -translate-y-8 translate-x-8" />
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <Globe className="w-5 h-5 text-primary" />
              </div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Input</p>
              {/* Fake URL bar */}
              <div className="bg-muted/50 border border-border/60 rounded-xl px-4 py-3 flex items-center gap-2">
                <Globe className="w-4 h-4 text-muted-foreground/50" />
                <motion.span
                  initial={{ width: 0 }}
                  whileInView={{ width: "auto" }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.2, delay: 0.6, ease: EASE }}
                  className="text-sm text-foreground font-medium overflow-hidden whitespace-nowrap block"
                >
                  acme-saas.com
                </motion.span>
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 2 }}
                  className="ml-auto"
                >
                  <Sparkles className="w-4 h-4 text-primary" />
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Arrow */}
          <motion.div
            {...fadeInView(0.3)}
            className="hidden lg:flex items-center text-primary/30"
          >
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.8, ease: EASE }}
              className="w-12 h-[2px] bg-primary/20 origin-left"
            />
            <ArrowRight className="w-5 h-5 text-primary/40 -ml-1" />
          </motion.div>

          {/* Step 2 — DNA Analysis */}
          <motion.div
            {...fadeInView(0.3)}
            className="w-full lg:w-1/3"
          >
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm relative overflow-hidden">
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/[0.03] rounded-full translate-y-12 -translate-x-12" />
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <Brain className="w-5 h-5 text-primary" />
              </div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">AI Analysis</p>
              {/* Animated DNA tags */}
              <div className="flex flex-wrap gap-2">
                {DNA_TAGS.map((tag, i) => (
                  <motion.span
                    key={tag}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 1.2 + i * 0.15, duration: 0.4, ease: EASE }}
                    className="px-3 py-1.5 bg-primary/[0.08] border border-primary/15 rounded-lg text-xs font-medium text-primary"
                  >
                    {tag}
                  </motion.span>
                ))}
              </div>
              {/* Scanning line effect */}
              <motion.div
                initial={{ top: 0, opacity: 0 }}
                whileInView={{ top: "100%", opacity: [0, 0.5, 0.5, 0] }}
                viewport={{ once: true }}
                transition={{ duration: 1.5, delay: 0.8, ease: "linear" }}
                className="absolute left-0 w-full h-[2px] bg-primary/40"
                style={{ position: "absolute" }}
              />
            </div>
          </motion.div>

          {/* Arrow */}
          <motion.div
            {...fadeInView(0.5)}
            className="hidden lg:flex items-center text-primary/30"
          >
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 1.6, ease: EASE }}
              className="w-12 h-[2px] bg-primary/20 origin-left"
            />
            <ArrowRight className="w-5 h-5 text-primary/40 -ml-1" />
          </motion.div>

          {/* Step 3 — Leads Output */}
          <motion.div
            {...fadeInView(0.5)}
            className="w-full lg:w-1/3"
          >
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-1/2 w-20 h-20 bg-primary/[0.04] rounded-full -translate-y-10" />
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Leads</p>
              <div className="space-y-2">
                {MOCK_LEADS.map((lead, i) => (
                  <motion.div
                    key={lead.name}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 2.0 + i * 0.2, duration: 0.5, ease: EASE }}
                    className="flex items-center gap-3 bg-muted/30 border border-border/40 rounded-xl px-3 py-2.5"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-xs font-bold text-primary">
                      {lead.name.split(" ").map(w => w[0]).join("")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{lead.name}</p>
                      <p className="text-xs text-muted-foreground">{lead.title}</p>
                    </div>
                    <span className="text-xs font-bold text-primary">{lead.fit}%</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

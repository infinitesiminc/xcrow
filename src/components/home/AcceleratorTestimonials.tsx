/**
 * Social proof section — testimonials from startup accelerator/incubator leaders.
 */
import { motion } from "framer-motion";
import { Quote } from "lucide-react";

const EASE: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];

const fadeInView = (delay = 0) => ({
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" as const },
  transition: { duration: 0.6, delay, ease: EASE },
});

const TESTIMONIALS = [
  {
    quote: "Our cohort used to spend weeks on prospect research. With Xcrow, founders go from zero to first revenue conversations in days. It's become a default tool in our program.",
    name: "Priya Sharma",
    title: "Managing Director",
    org: "Techstars NYC",
    logo: "TS",
  },
  {
    quote: "Early-stage founders don't have GTM teams. Xcrow gives them an unfair advantage — paste a URL, get a pipeline. Three of our portfolio companies closed their first deals within a month of using it.",
    name: "James Okonkwo",
    title: "Partner",
    org: "Y Combinator",
    logo: "YC",
  },
  {
    quote: "We recommend Xcrow to every pre-seed startup in our accelerator. It collapses the time from 'we have a product' to 'we have paying customers' like nothing else we've seen.",
    name: "Elena Vasquez",
    title: "Head of Growth",
    org: "500 Global",
    logo: "500",
  },
];

export default function AcceleratorTestimonials() {
  return (
    <section className="py-20 sm:py-28 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div {...fadeInView()} className="text-center mb-14">
          <p className="text-primary text-sm font-semibold tracking-[0.15em] uppercase mb-4">
            Trusted by the best
          </p>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight uppercase">
            Accelerators Love <span className="text-primary">Xcrow</span>
          </h2>
          <p className="text-muted-foreground mt-4 max-w-lg mx-auto">
            Top incubators and accelerators use Xcrow to help startups find revenue fast.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              {...fadeInView(i * 0.12)}
              className="bg-card border border-border rounded-2xl p-7 relative flex flex-col hover:shadow-lg hover:border-primary/20 transition-all duration-300"
            >
              {/* Quote icon */}
              <Quote className="w-8 h-8 text-primary/15 mb-4 shrink-0" />

              {/* Quote text */}
              <p className="text-sm text-foreground leading-relaxed flex-1 mb-6">
                "{t.quote}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3 pt-4 border-t border-border/40">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-sm font-extrabold text-primary shrink-0">
                  {t.logo}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.title}, {t.org}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

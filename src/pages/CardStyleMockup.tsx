import { motion } from "framer-motion";
import { Zap, MapPin, Building2, BarChart3 } from "lucide-react";

/* ── Sample data ─────────────────────────────────────── */
const SAMPLE_JOBS = [
  { title: "Applied AI Engineer", dept: "Sales", location: "Tokyo, Japan", company: "Anthropic", logo: "https://cdn.brandfetch.io/anthropic.com?c=1idUR9TThSYgPVCpELC", brandColor: "#d97757", risk: 12, augmented: 61, toLearn: 45 },
  { title: "Software Engineer, Android", dept: "Engineering", location: "San Francisco", company: "Airtable", logo: "https://cdn.brandfetch.io/airtable.com?c=1idUR9TThSYgPVCpELC", brandColor: "#fcbf49", risk: 8, augmented: 45, toLearn: 38 },
  { title: "Solution Deployment Manager", dept: "Customer Success", location: "Remote", company: "360learning", logo: "https://cdn.brandfetch.io/360learning.com?c=1idUR9TThSYgPVCpELC", brandColor: "#0ea5e9", risk: 5, augmented: 44, toLearn: 32 },
  { title: "Pre-Sales Engineer", dept: "Sales", location: "Azerbaijan", company: "Ajax", logo: "https://cdn.brandfetch.io/ajax.com?c=1idUR9TThSYgPVCpELC", brandColor: "#e63946", risk: 15, augmented: 65, toLearn: 50 },
  { title: "Commercial Counsel, GTM", dept: "Legal", location: "New York City, NY", company: "Anthropic", logo: "https://cdn.brandfetch.io/anthropic.com?c=1idUR9TThSYgPVCpELC", brandColor: "#d97757", risk: 4, augmented: 31, toLearn: 22 },
  { title: "Data Center Energy Lead", dept: "Engineering", location: "Remote-Friendly", company: "Anthropic", logo: "https://cdn.brandfetch.io/anthropic.com?c=1idUR9TThSYgPVCpELC", brandColor: "#d97757", risk: 6, augmented: 38, toLearn: 28 },
  { title: "Lead Solutions Consultant", dept: "Solutions", location: "Remote - Germany", company: "Airtable", logo: "https://cdn.brandfetch.io/airtable.com?c=1idUR9TThSYgPVCpELC", brandColor: "#fcbf49", risk: 10, augmented: 35, toLearn: 30 },
  { title: "Head of GTM Narrative", dept: "Marketing", location: "San Francisco", company: "Anthropic", logo: "https://cdn.brandfetch.io/anthropic.com?c=1idUR9TThSYgPVCpELC", brandColor: "#d97757", risk: 7, augmented: 41, toLearn: 35 },
];

/* ── Department color map ──────────────────────────── */
const DEPT_COLORS: Record<string, string> = {
  Engineering: "from-blue-500/20 to-blue-600/5 border-blue-500/30 text-blue-400",
  Sales: "from-green-500/20 to-green-600/5 border-green-500/30 text-green-400",
  "Customer Success": "from-cyan-500/20 to-cyan-600/5 border-cyan-500/30 text-cyan-400",
  Legal: "from-amber-500/20 to-amber-600/5 border-amber-500/30 text-amber-400",
  Marketing: "from-pink-500/20 to-pink-600/5 border-pink-500/30 text-pink-400",
  Solutions: "from-violet-500/20 to-violet-600/5 border-violet-500/30 text-violet-400",
  "AI / Research": "from-purple-500/20 to-purple-600/5 border-purple-500/30 text-purple-400",
};
const DEPT_BADGE: Record<string, string> = {
  Engineering: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  Sales: "bg-green-500/15 text-green-400 border-green-500/20",
  "Customer Success": "bg-cyan-500/15 text-cyan-400 border-cyan-500/20",
  Legal: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  Marketing: "bg-pink-500/15 text-pink-400 border-pink-500/20",
  Solutions: "bg-violet-500/15 text-violet-400 border-violet-500/20",
  "AI / Research": "bg-purple-500/15 text-purple-400 border-purple-500/20",
};
const defaultBadge = "bg-muted text-muted-foreground border-border/40";
const defaultGrad = "from-muted/30 to-muted/5 border-border/30 text-muted-foreground";

/* ── Hash to hue (for generative patterns) ─────────── */
function hashToHue(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return Math.abs(hash) % 360;
}

/* ═══════════════════════════════════════════════════════
   STYLE A — Company Logo + Gradient Background
   ═══════════════════════════════════════════════════════ */
function StyleA({ jobs }: { jobs: typeof SAMPLE_JOBS }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {jobs.map((job, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="group rounded-xl overflow-hidden border border-border/40 hover:border-border bg-card transition-all hover:shadow-lg cursor-pointer"
        >
          {/* Logo area with branded gradient */}
          <div
            className="relative h-32 flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${job.brandColor}22 0%, ${job.brandColor}08 100%)`,
            }}
          >
            <img
              src={job.logo}
              alt={job.company}
              className="h-12 w-12 rounded-xl object-contain bg-white/10 backdrop-blur-sm p-1.5"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
            {/* Risk pill */}
            <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-sm">
              <span className={`text-xs font-bold ${job.risk >= 20 ? "text-destructive" : "text-success"}`}>{job.risk}%</span>
              <span className="text-[9px] text-white/50">risk</span>
            </div>
            {/* To learn pill */}
            <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-sm">
              <Zap className="h-3 w-3 text-primary" />
              <span className="text-xs font-bold text-white">{job.toLearn}%</span>
            </div>
          </div>
          <div className="p-3">
            <h3 className="text-sm font-semibold text-foreground leading-snug group-hover:text-primary transition-colors truncate">{job.title}</h3>
            <p className="text-[11px] text-muted-foreground truncate mt-0.5">
              {[job.company, job.location].filter(Boolean).join(" · ")}
            </p>
            <span className={`inline-block mt-1.5 px-2 py-0.5 text-[10px] font-medium rounded-full border ${DEPT_BADGE[job.dept] || defaultBadge}`}>
              {job.dept}
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   STYLE B — Text-First, No Images
   ═══════════════════════════════════════════════════════ */
function StyleB({ jobs }: { jobs: typeof SAMPLE_JOBS }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {jobs.map((job, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className={`group rounded-xl p-4 border bg-gradient-to-br cursor-pointer transition-all hover:shadow-lg ${DEPT_COLORS[job.dept] || defaultGrad}`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className={`px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full border ${DEPT_BADGE[job.dept] || defaultBadge}`}>
              {job.dept}
            </span>
            <span className={`text-xs font-bold ${job.risk >= 20 ? "text-destructive" : "text-success"}`}>{job.risk}% risk</span>
          </div>
          <h3 className="text-sm font-bold text-foreground leading-snug mb-2 group-hover:text-primary transition-colors line-clamp-2">{job.title}</h3>
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-1">
            <Building2 className="h-3 w-3 shrink-0" />
            <span className="truncate">{job.company}</span>
          </div>
          {job.location && (
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{job.location}</span>
            </div>
          )}
          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/10">
            <div className="flex items-center gap-1">
              <BarChart3 className="h-3 w-3 text-muted-foreground" />
              <span className="text-[11px] text-muted-foreground">{job.augmented}% augmented</span>
            </div>
            <div className="flex items-center gap-1">
              <Zap className="h-3 w-3 text-primary" />
              <span className="text-[11px] text-primary font-medium">{job.toLearn}% to learn</span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   STYLE C — Abstract Generative Patterns
   ═══════════════════════════════════════════════════════ */
function StyleC({ jobs }: { jobs: typeof SAMPLE_JOBS }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {jobs.map((job, i) => {
        const hue1 = hashToHue(job.title);
        const hue2 = (hue1 + 60) % 360;
        const hue3 = (hue1 + 180) % 360;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="group rounded-xl overflow-hidden border border-border/40 hover:border-border bg-card transition-all hover:shadow-lg cursor-pointer"
          >
            <div
              className="relative h-28"
              style={{
                background: `linear-gradient(135deg, hsl(${hue1} 70% 15%) 0%, hsl(${hue2} 60% 12%) 50%, hsl(${hue3} 50% 10%) 100%)`,
              }}
            >
              {/* Geometric shapes seeded by title */}
              <div
                className="absolute rounded-full opacity-20"
                style={{
                  width: 60 + (hue1 % 40),
                  height: 60 + (hue1 % 40),
                  top: -10 + (hue2 % 30),
                  right: -10 + (hue1 % 30),
                  background: `radial-gradient(circle, hsl(${hue1} 80% 50% / 0.4), transparent)`,
                }}
              />
              <div
                className="absolute rounded-full opacity-15"
                style={{
                  width: 40 + (hue2 % 30),
                  height: 40 + (hue2 % 30),
                  bottom: -5 + (hue3 % 20),
                  left: 10 + (hue2 % 40),
                  background: `radial-gradient(circle, hsl(${hue2} 70% 60% / 0.3), transparent)`,
                }}
              />
              {/* Metrics overlay */}
              <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-sm">
                  <Zap className="h-3 w-3 text-primary" />
                  <span className="text-xs font-bold text-white">{job.toLearn}%</span>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-sm ${job.risk >= 20 ? "text-destructive" : "text-success"}`}>
                  {job.risk}% risk
                </span>
              </div>
            </div>
            <div className="p-3">
              <div className="flex items-start gap-2.5">
                <img
                  src={job.logo}
                  alt={job.company}
                  className="h-9 w-9 rounded-lg object-contain bg-white/10 p-1 shrink-0"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-foreground leading-snug group-hover:text-primary transition-colors truncate">{job.title}</h3>
                  <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                    {[job.company, job.location].filter(Boolean).join(" · ")}
                  </p>
                </div>
              </div>
              <span className={`inline-block mt-2 px-2 py-0.5 text-[10px] font-medium rounded-full border ${DEPT_BADGE[job.dept] || defaultBadge}`}>
                {job.dept}
              </span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   STYLE D — Hybrid: Logo + Dept Accent Strip
   ═══════════════════════════════════════════════════════ */
function StyleD({ jobs }: { jobs: typeof SAMPLE_JOBS }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {jobs.map((job, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="group rounded-xl overflow-hidden border-none bg-card transition-all hover:shadow-lg cursor-pointer"
        >
          {/* Clean branded gradient header with centered logo */}
          <div
            className="relative h-28 flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${job.brandColor}22 0%, ${job.brandColor}08 100%)`,
            }}
          >
            <img
              src={job.logo}
              alt={job.company}
              className="h-11 w-11 rounded-xl object-contain bg-white/10 backdrop-blur-sm p-1.5"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
            {/* Risk pill */}
            <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-sm">
              <span className={`text-xs font-bold ${job.risk >= 20 ? "text-destructive" : "text-success"}`}>{job.risk}%</span>
              <span className="text-[9px] text-white/50">risk</span>
            </div>
            {/* To learn pill */}
            <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-sm">
              <Zap className="h-3 w-3 text-primary" />
              <span className="text-xs font-bold text-white">{job.toLearn}%</span>
            </div>
          </div>
          {/* Text content at bottom */}
          <div className="p-3">
            <h3 className="text-sm font-bold text-foreground leading-snug group-hover:text-primary transition-colors truncate">{job.title}</h3>
            <p className="text-[11px] text-muted-foreground truncate mt-0.5">
              {[job.company, job.location].filter(Boolean).join(" · ")}
            </p>
            <span className={`inline-block mt-1.5 px-2 py-0.5 text-[10px] font-medium rounded-full border ${DEPT_BADGE[job.dept] || defaultBadge}`}>
              {job.dept}
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MOCKUP PAGE
   ═══════════════════════════════════════════════════════ */
export default function CardStyleMockup() {
  return (
    <div className="min-h-screen bg-background text-foreground p-6 space-y-12">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground mb-2">Card Style Comparison</h1>
        <p className="text-sm text-muted-foreground mb-8">Same 8 jobs rendered in 4 different styles. All scale to 1000+ roles without repetitive images.</p>
      </div>

      {/* Style A */}
      <section>
        <div className="mb-4">
          <h2 className="text-xl font-display font-bold text-foreground">A — Company Logo + Gradient</h2>
          <p className="text-sm text-muted-foreground">Logo as hero visual on branded gradient. Department as badge below.</p>
        </div>
        <StyleA jobs={SAMPLE_JOBS} />
      </section>

      {/* Style B */}
      <section>
        <div className="mb-4">
          <h2 className="text-xl font-display font-bold text-foreground">B — Text-First, No Images</h2>
          <p className="text-sm text-muted-foreground">Department-colored cards. Typography-driven. Clean job-board aesthetic.</p>
        </div>
        <StyleB jobs={SAMPLE_JOBS} />
      </section>

      {/* Style C */}
      <section>
        <div className="mb-4">
          <h2 className="text-xl font-display font-bold text-foreground">C — Abstract Generative</h2>
          <p className="text-sm text-muted-foreground">Unique gradient + geometric shapes seeded from job title hash. Every card unique.</p>
        </div>
        <StyleC jobs={SAMPLE_JOBS} />
      </section>

      {/* Style D */}
      <section>
        <div className="mb-4">
          <h2 className="text-xl font-display font-bold text-foreground">D — Hybrid: Logo + Dept Accent</h2>
          <p className="text-sm text-muted-foreground">Company logo + thin brand-colored accent strip. Compact, info-dense.</p>
        </div>
        <StyleD jobs={SAMPLE_JOBS} />
      </section>
    </div>
  );
}

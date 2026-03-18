import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { BarChart3, Zap, Bookmark, Share2, Search, ChevronUp, X, ArrowRight, Globe, MapPin, Laptop, Loader2, Briefcase, Bot, Sparkles, Play } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";

interface RoleCard {
  title: string;
  image: string;
  augmented: number;
  risk: number;
  aiOpportunity: number;
  tag: string;
  company?: string;
  location?: string;
  logo?: string;
  country?: string;
  workMode?: string;
  description?: string;
  seniority?: string;
  taskCount?: number;
  aiTaskCount?: number;
  jobId?: string;
}

interface RoleFeedProps {
  roles: RoleCard[];
  onOpenSearch: () => void;
  savedRoleTitles?: Set<string>;
}

interface TaskCluster {
  cluster_name: string;
  description: string | null;
  ai_exposure_score: number | null;
  priority: string | null;
}

/* ── Hash to hue (for generative patterns) ─────────── */
function hashToHue(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return Math.abs(hash) % 360;
}

/* ── Tag badge colors ──────────────────────────────── */
const TAG_BADGE: Record<string, string> = {
  Tech: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  Finance: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  Marketing: "bg-pink-500/15 text-pink-400 border-pink-500/20",
  Legal: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  Operations: "bg-cyan-500/15 text-cyan-400 border-cyan-500/20",
  Sales: "bg-green-500/15 text-green-400 border-green-500/20",
  Other: "bg-muted text-muted-foreground border-border/40",
};

/* ── Plain-English AI summary ──────────────────────── */
function aiSummaryLine(risk: number, augmented: number): string {
  if (augmented >= 60 && risk < 30) return "AI amplifies most of your work here";
  if (risk >= 50) return "High automation potential — upskilling is critical";
  if (risk >= 30) return "Some tasks are shifting to AI — adapt early";
  if (augmented >= 40) return "AI tools enhance key parts of this role";
  return "Mostly human-driven with growing AI opportunities";
}

/* ── Shared: Action button ─────────────────────────── */

function ActionButton({ icon: Icon, label, onClick, glow }: { icon: typeof BarChart3; label: string; onClick: () => void; glow?: boolean }) {
  return (
    <motion.button whileTap={{ scale: 0.85 }} whileHover={{ scale: 1.1 }} onClick={onClick}
      className={`flex flex-col items-center gap-1 ${glow ? "drop-shadow-[0_0_12px_hsl(var(--neon-purple)/0.6)]" : ""}`}
    >
      <div className={`w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md transition-colors ${
        glow ? "bg-primary/30 border border-primary/50" : "bg-white/10 border border-white/20 hover:bg-white/20"
      }`}>
        <Icon className={`h-5 w-5 ${glow ? "text-primary-foreground" : "text-white"}`} />
      </div>
      <span className="text-[10px] text-white/70 font-medium">{label}</span>
    </motion.button>
  );
}

/* ── Floating Search FAB ───────────────────────────── */

function SearchFAB({ onClick }: { onClick: () => void }) {
  const isMobile = useIsMobile();

  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, type: "spring", damping: 20 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`fixed z-40 flex items-center gap-2.5 backdrop-blur-xl border border-primary/30 bg-primary/20 hover:bg-primary/30 transition-colors shadow-[0_0_24px_hsl(var(--neon-purple)/0.3)] ${
        isMobile
          ? "bottom-24 left-1/2 -translate-x-1/2 h-12 px-5 rounded-full"
          : "bottom-6 right-6 h-12 px-5 rounded-full"
      }`}
    >
      <Search className="h-4.5 w-4.5 text-primary-foreground" />
      <span className="text-sm font-semibold text-primary-foreground whitespace-nowrap">
        {isMobile ? "Search" : "Search any role"}
      </span>
      <motion.div
        className="absolute inset-0 rounded-full border border-primary/40"
        animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0, 0.5] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      />
    </motion.button>
  );
}

/* ── Mini Arc Gauge (reused from RiskGauge pattern) ── */

function MiniArc({ value, label, color }: { value: number; label: string; color: string }) {
  const radius = 34;
  const stroke = 5;
  const circumference = 2 * Math.PI * radius;
  const arcLength = circumference * 0.75;
  const fillLength = arcLength * (value / 100);
  const rotation = 135;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative">
        <svg width="80" height="80" viewBox="0 0 80 80">
          <circle
            cx="40" cy="40" r={radius} fill="none"
            stroke="hsl(var(--secondary))" strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${arcLength} ${circumference}`}
            transform={`rotate(${rotation} 40 40)`}
          />
          <motion.circle
            cx="40" cy="40" r={radius} fill="none"
            stroke={color} strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={arcLength - fillLength}
            transform={`rotate(${rotation} 40 40)`}
            initial={{ strokeDashoffset: arcLength }}
            animate={{ strokeDashoffset: arcLength - fillLength }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.span
            className="text-lg font-display font-bold text-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            {value}%
          </motion.span>
        </div>
      </div>
      <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">{label}</span>
    </div>
  );
}

/* ── Section Tab Nav ────────────────────────────────── */

const SECTIONS = [
  { emoji: "🎯", label: "Role" },
  { emoji: "⚡", label: "Tasks" },
  { emoji: "🤖", label: "AI" },
];

function SectionTabs({ active, onTab }: { active: number; onTab: (i: number) => void }) {
  return (
    <div className="flex gap-1 px-5 pt-4 pb-2 bg-card border-b border-border/30">
      {SECTIONS.map((s, i) => (
        <button
          key={i}
          onClick={() => onTab(i)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
            i === active
              ? "bg-primary/15 text-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
          }`}
        >
          <span>{s.emoji}</span> {s.label}
        </button>
      ))}
    </div>
  );
}

/* ── Clean JD description ──────────────────────────── */
function cleanDescription(raw: string): string {
  let clean = raw;
  // Strip structured metadata prefix
  clean = clean.replace(/^Title:\s*.*?(Company|Department):/s, "$1:");
  clean = clean.replace(/^Company:\s*.*?(Department|Location|JD Content):/s, "$1:");
  clean = clean.replace(/^Department:\s*.*?(Location|JD Content):/s, "$1:");
  clean = clean.replace(/^Location:\s*.*?(JD Content|Content):/s, "$1:");
  clean = clean.replace(/^(JD Content|Content):\s*/i, "");
  // Strip "ABOUT COMPANYNAME" header
  clean = clean.replace(/^ABOUT\s+[A-Z][A-Za-z\s]{0,30}\s+/i, "");
  // Strip "About CompanyName" at start
  clean = clean.replace(/^About\s+[A-Z][A-Za-z]+\s+/i, "");
  return clean.trim();
}

/* ── Three-Section Detail Overlay (TikTok-Native) ─── */

function RoleDetailOverlay({ role, onClose }: { role: RoleCard; onClose: () => void }) {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<TaskCluster[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [activeSection, setActiveSection] = useState(0);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Fetch task clusters on open
  useEffect(() => {
    if (!role.jobId) return;
    setLoadingTasks(true);
    supabase
      .from("job_task_clusters")
      .select("cluster_name, description, ai_exposure_score, priority")
      .eq("job_id", role.jobId)
      .order("sort_order", { ascending: true })
      .limit(10)
      .then(({ data }) => {
        setTasks(data || []);
        setLoadingTasks(false);
      });
  }, [role.jobId]);

  // Fetch or generate AI summary
  useEffect(() => {
    if (!role.jobId || !role.description) return;
    setSummaryLoading(true);
    supabase.functions.invoke("summarize-role", {
      body: {
        jobId: role.jobId,
        jobTitle: role.title,
        company: role.company || "",
        description: role.description,
      },
    }).then(({ data, error }) => {
      if (data?.summary) setAiSummary(data.summary);
      setSummaryLoading(false);
    }).catch(() => setSummaryLoading(false));
  }, [role.jobId, role.description, role.title, role.company]);

  const seniorityLabel: Record<string, string> = {
    junior: "Junior", mid: "Mid-Level", senior: "Senior", lead: "Lead", manager: "Manager", director: "Director", vp: "VP", c_level: "C-Level",
  };

  // Pick a random task for quick simulate
  const randomTask = useMemo(() => tasks.length > 0 ? tasks[Math.floor(Math.random() * tasks.length)] : null, [tasks]);

  const readiness = 100 - role.risk;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center"
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="relative w-full sm:max-w-lg sm:rounded-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Header with gradient */}
        {(() => {
          const hue1 = hashToHue(role.title);
          const hue2 = (hue1 + 60) % 360;
          const hue3 = (hue1 + 180) % 360;
          return (
            <div
              className="relative h-28 shrink-0"
              style={{
                background: `linear-gradient(135deg, hsl(${hue1} 70% 15%) 0%, hsl(${hue2} 60% 12%) 50%, hsl(${hue3} 50% 10%) 100%)`,
              }}
            >
              <div className="absolute rounded-full opacity-20" style={{ width: 80, height: 80, top: -20, right: 20, background: `radial-gradient(circle, hsl(${hue1} 80% 50% / 0.4), transparent)` }} />
              <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center hover:bg-black/60 transition-colors z-10">
                <X className="h-4 w-4 text-white" />
              </button>
              <div className="absolute bottom-3 left-4 right-4">
                <div className="flex items-center gap-3">
                  {role.logo && (
                    <img src={role.logo} alt={role.company || ''} className="h-10 w-10 rounded-lg object-contain bg-white/10 p-1 shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  )}
                  <div className="min-w-0">
                    <h2 className="text-lg font-display font-bold text-white leading-snug truncate">{role.title}</h2>
                    <p className="text-xs text-white/60 truncate">
                      {[role.company, role.location].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Section tabs */}
        <SectionTabs active={activeSection} onTab={setActiveSection} />

        {/* Tab content */}
        <div className="flex-1 min-h-0 overflow-y-auto bg-card">
          <AnimatePresence mode="wait">
            {activeSection === 0 && (
              <motion.div
                key="role"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.15 }}
                className="p-5 space-y-4"
              >
                {/* AI-generated summary or loading state */}
                {summaryLoading ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Sparkles className="h-3.5 w-3.5 animate-pulse text-primary" />
                      <span>Generating role briefing…</span>
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 w-full rounded bg-muted animate-pulse" />
                      <div className="h-3 w-4/5 rounded bg-muted animate-pulse" />
                      <div className="h-3 w-3/5 rounded bg-muted animate-pulse" />
                    </div>
                  </div>
                ) : aiSummary ? (
                  <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                    {aiSummary.split(/\n\n+/).map((block, i) => {
                      const headingMatch = block.match(/^\*\*(.+?)\*\*\s*\n?([\s\S]*)/);
                      if (headingMatch) {
                        return (
                          <div key={i}>
                            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-1">{headingMatch[1]}</h3>
                            <p>{headingMatch[2].trim()}</p>
                          </div>
                        );
                      }
                      return <p key={i}>{block}</p>;
                    })}
                  </div>
                ) : (
                  <div>
                    <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">What you'd do</h3>
                    {(() => {
                      const display = cleanDescription(role.description || "");
                      const trimmed = display.length > 500 ? display.slice(0, 500) + "…" : display;
                      return trimmed ? (
                        <p className="text-sm text-muted-foreground leading-relaxed">{trimmed}</p>
                      ) : (
                        <p className="text-sm text-muted-foreground/60 italic">No description available yet.</p>
                      );
                    })()}
                  </div>
                )}

                {/* Quick facts pills */}
                <div className="flex flex-wrap gap-2">
                  {role.seniority && (
                    <span className="px-2.5 py-1 text-[11px] font-medium rounded-full bg-accent text-accent-foreground">
                      {seniorityLabel[role.seniority] || role.seniority}
                    </span>
                  )}
                  <span className={`px-2.5 py-1 text-[11px] font-medium rounded-full border ${TAG_BADGE[role.tag] || TAG_BADGE.Other}`}>
                    {role.tag}
                  </span>
                  {role.workMode && (
                    <span className="px-2.5 py-1 text-[11px] font-medium rounded-full bg-muted text-muted-foreground">
                      {role.workMode === "remote" ? "🌐 Remote" : role.workMode === "hybrid" ? "🔄 Hybrid" : "🏢 On-site"}
                    </span>
                  )}
                  {role.country && (
                    <span className="px-2.5 py-1 text-[11px] font-medium rounded-full bg-muted text-muted-foreground">
                      📍 {role.country}
                    </span>
                  )}
                  {role.taskCount && role.taskCount > 0 && (
                    <span className="px-2.5 py-1 text-[11px] font-medium rounded-full bg-primary/10 text-primary">
                      ⚡ {role.taskCount} tasks mapped
                    </span>
                  )}
                </div>
              </motion.div>
            )}

            {activeSection === 1 && (
              <motion.div
                key="tasks"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.15 }}
                className="p-5"
              >
                {loadingTasks ? (
                  <div className="flex items-center gap-2 py-6 justify-center">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Loading tasks…</span>
                  </div>
                ) : tasks.length > 0 ? (
                  <div className="space-y-2.5">
                    {tasks.map((task, i) => {
                      const score = task.ai_exposure_score ?? 0;
                      const badgeColor = score >= 70
                        ? "bg-brand-ai/15 text-brand-ai"
                        : score >= 40
                        ? "bg-brand-mid/15 text-brand-mid"
                        : "bg-brand-human/15 text-brand-human";

                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.06 }}
                          className="flex items-center gap-3 p-3 rounded-xl bg-accent/30 border border-border/30"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                          <span className="text-sm font-medium text-foreground flex-1 leading-snug">{task.cluster_name}</span>
                          {score > 0 && (
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${badgeColor}`}>
                              🤖 {score}%
                            </span>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground/60 italic text-center py-6">
                    Tap "Explore Role" below to unlock tasks
                  </p>
                )}
              </motion.div>
            )}

            {activeSection === 2 && (
              <motion.div
                key="ai"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.15 }}
                className="p-5 flex flex-col items-center"
              >
                {role.augmented > 0 || role.risk > 0 ? (
                  <>
                    <div className="flex items-center justify-center gap-6 mb-4">
                      <MiniArc
                        value={readiness}
                        label="Readiness"
                        color={readiness >= 70 ? "hsl(var(--success))" : readiness >= 40 ? "hsl(var(--primary))" : "hsl(var(--warning))"}
                      />
                      <MiniArc
                        value={role.augmented}
                        label="AI Tools"
                        color="hsl(var(--brand-human))"
                      />
                      <MiniArc
                        value={role.aiOpportunity}
                        label="Growth"
                        color="hsl(var(--brand-mid))"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground/80 italic text-center">
                      {aiSummaryLine(role.risk, role.augmented)}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground/60 italic text-center py-6">
                    AI impact data not yet available.
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sticky CTA */}
        <div className="shrink-0 p-4 border-t border-border/40 bg-card">
          <div className="flex gap-3">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(`/analysis?title=${encodeURIComponent(role.title)}&company=${encodeURIComponent(role.company || "")}`)}
              className="flex-1 flex items-center justify-center gap-2 h-11 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors glow-purple"
            >
              🚀 Explore Role
              <ArrowRight className="h-4 w-4" />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                navigator.share?.({ title: `${role.title} AI Analysis`, url: window.location.href }).catch(() => {});
              }}
              className="w-11 h-11 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
            >
              <Share2 className="h-4 w-4 text-muted-foreground" />
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── Desktop: Grid Layout ──────────────────────────── */

function DesktopGrid({ roles, onOpenSearch, savedRoleTitles }: RoleFeedProps) {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<RoleCard | null>(null);
  const [filter, setFilter] = useState<string | null>(null);
  const [countryFilter, setCountryFilter] = useState<string | null>(null);
  const [workModeFilter, setWorkModeFilter] = useState<string | null>(null);
  const [savedFilter, setSavedFilter] = useState(false);

  const tags = Array.from(new Set(roles.map(r => r.tag)));
  const tagCounts = useMemo(() => {
    const c: Record<string, number> = {};
    roles.forEach(r => { c[r.tag] = (c[r.tag] || 0) + 1; });
    return c;
  }, [roles]);
  const countries = useMemo(() => {
    const counts: Record<string, number> = {};
    roles.forEach(r => { if (r.country) counts[r.country] = (counts[r.country] || 0) + 1; });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([name]) => name);
  }, [roles]);

  const workModes = useMemo(() => {
    const modes = new Set<string>();
    roles.forEach(r => { if (r.workMode) modes.add(r.workMode); });
    return Array.from(modes).sort();
  }, [roles]);

  const workModeLabel: Record<string, string> = { remote: "Remote", onsite: "On-site", hybrid: "Hybrid" };
  const workModeIcon: Record<string, typeof Globe> = { remote: Globe, onsite: MapPin, hybrid: Laptop };

  const savedCount = useMemo(() => {
    if (!savedRoleTitles || savedRoleTitles.size === 0) return 0;
    return roles.filter(r => savedRoleTitles.has(r.title.toLowerCase())).length;
  }, [roles, savedRoleTitles]);

  const filtered = useMemo(() => {
    return roles.filter(r => {
      if (savedFilter && savedRoleTitles && !savedRoleTitles.has(r.title.toLowerCase())) return false;
      if (filter && r.tag !== filter) return false;
      if (countryFilter && r.country !== countryFilter) return false;
      if (workModeFilter && r.workMode !== workModeFilter) return false;
      return true;
    });
  }, [roles, filter, countryFilter, workModeFilter, savedFilter, savedRoleTitles]);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Filter bar */}
      <div className="shrink-0 flex flex-wrap items-center gap-2 px-6 py-4 border-b border-border/40">
        <div className="flex items-center gap-1.5">
          <button onClick={() => { setFilter(null); setSavedFilter(false); }} className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${!filter && !savedFilter ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
            All <span className="opacity-60 ml-0.5">{roles.length}</span>
          </button>
          {savedRoleTitles && savedCount > 0 && (
            <button onClick={() => { setSavedFilter(f => !f); setFilter(null); }} className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors flex items-center gap-1 ${savedFilter ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
              <Bookmark className="h-3 w-3" /> Saved <span className="opacity-60 ml-0.5">{savedCount}</span>
            </button>
          )}
          {tags.map(tag => (
            <button key={tag} onClick={() => { setFilter(f => f === tag ? null : tag); setSavedFilter(false); }} className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${filter === tag ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
              {tag} <span className="opacity-60 ml-0.5">{tagCounts[tag] || 0}</span>
            </button>
          ))}
        </div>

        <div className="w-px h-5 bg-border/60 mx-1" />

        <div className="flex items-center gap-1.5">
          {workModes.map(mode => {
            const Icon = workModeIcon[mode] || Globe;
            return (
              <button key={mode} onClick={() => setWorkModeFilter(f => f === mode ? null : mode)} className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${workModeFilter === mode ? "bg-accent text-accent-foreground ring-1 ring-accent" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
                <Icon className="h-3 w-3" />
                {workModeLabel[mode] || mode} <span className="opacity-60 ml-0.5">{roles.filter(r => r.workMode === mode).length}</span>
              </button>
            );
          })}
        </div>

        {countries.length > 0 && <div className="w-px h-5 bg-border/60 mx-1" />}

        {countries.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {countries.map(country => (
              <button key={country} onClick={() => setCountryFilter(f => f === country ? null : country)} className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${countryFilter === country ? "bg-accent text-accent-foreground ring-1 ring-accent" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
                {country} <span className="opacity-60 ml-0.5">{roles.filter(r => r.country === country).length}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {filtered.map((role, i) => {
            const hue1 = hashToHue(role.title);
            const hue2 = (hue1 + 60) % 360;
            const hue3 = (hue1 + 180) % 360;
            const riskColor = role.risk >= 40 ? "text-destructive" : role.risk >= 20 ? "text-warning" : "text-success";
            const logoUrl = role.logo || (role.company ? `https://logo.clearbit.com/${role.company.toLowerCase().replace(/\s+/g, '')}.com` : '');
            return (
              <motion.button
                key={role.title + i}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: Math.min(i * 0.03, 0.4) }}
                onClick={() => setSelected(role)}
                className="group text-left rounded-xl overflow-hidden bg-card border-none transition-all hover:shadow-lg hover:shadow-primary/5"
              >
                {/* Generative gradient header */}
                <div
                  className="relative h-28"
                  style={{
                    background: `linear-gradient(135deg, hsl(${hue1} 70% 15%) 0%, hsl(${hue2} 60% 12%) 50%, hsl(${hue3} 50% 10%) 100%)`,
                  }}
                >
                  <div className="absolute rounded-full opacity-20" style={{ width: 60 + (hue1 % 40), height: 60 + (hue1 % 40), top: -10 + (hue2 % 30), right: -10 + (hue1 % 30), background: `radial-gradient(circle, hsl(${hue1} 80% 50% / 0.4), transparent)` }} />
                  <div className="absolute rounded-full opacity-15" style={{ width: 40 + (hue2 % 30), height: 40 + (hue2 % 30), bottom: -5 + (hue3 % 20), left: 10 + (hue2 % 40), background: `radial-gradient(circle, hsl(${hue2} 70% 60% / 0.3), transparent)` }} />
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-sm">
                      <Zap className="h-3 w-3 text-primary" />
                      <span className="text-xs font-bold text-white">{role.aiOpportunity}%</span>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-sm ${riskColor}`}>
                      {role.risk}% risk
                    </span>
                  </div>
                </div>
                {/* Bottom section */}
                <div className="p-3">
                  <div className="flex items-start gap-2.5">
                    {logoUrl && (
                      <img src={logoUrl} alt={role.company || ''} className="h-9 w-9 rounded-lg object-contain bg-white/10 p-1 shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    )}
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-foreground leading-snug group-hover:text-primary transition-colors truncate">{role.title}</h3>
                      <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                        {[role.company, role.location].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                  </div>
                  {/* Description teaser */}
                  {role.description && (
                    <p className="text-[11px] text-muted-foreground/70 italic mt-1.5 line-clamp-1">
                      {role.description}
                    </p>
                  )}
                  {/* Bottom row: tag + task signal */}
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full border ${TAG_BADGE[role.tag] || TAG_BADGE.Other}`}>
                      {role.tag}
                    </span>
                    {(role.taskCount ?? 0) > 0 && (
                      <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-primary/10 text-primary border border-primary/20">
                        ⚡ {role.taskCount} tasks{(role.aiTaskCount ?? 0) > 0 ? ` · ${role.aiTaskCount} AI-led` : ""}
                      </span>
                    )}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      <SearchFAB onClick={onOpenSearch} />

      <AnimatePresence>
        {selected && <RoleDetailOverlay role={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </div>
  );
}

/* ── Mobile: Vertical Swipe Feed ───────────────────── */

function MobileFeed({ roles, onOpenSearch }: RoleFeedProps) {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [showOverlay, setShowOverlay] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isAnimating = useRef(false);

  const goTo = useCallback((newIndex: number, dir: number) => {
    if (isAnimating.current || newIndex < 0 || newIndex >= roles.length) return;
    isAnimating.current = true;
    setDirection(dir);
    setCurrentIndex(newIndex);
    setTimeout(() => { isAnimating.current = false; }, 450);
  }, [roles.length]);

  const goNext = useCallback(() => goTo(currentIndex + 1, 1), [currentIndex, goTo]);
  const goPrev = useCallback(() => goTo(currentIndex - 1, -1), [currentIndex, goTo]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.y < -60) goNext();
    else if (info.offset.y > 60) goPrev();
  };

  const role = roles[currentIndex];
  if (!role) return null;

  const variants = {
    enter: (dir: number) => ({ y: dir > 0 ? "100%" : "-100%", opacity: 0 }),
    center: { y: 0, opacity: 1 },
    exit: (dir: number) => ({ y: dir > 0 ? "-100%" : "100%", opacity: 0 }),
  };

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden bg-background">
      <AnimatePresence initial={false} custom={direction} mode="popLayout">
        <motion.div
          key={currentIndex}
          custom={direction}
          variants={variants}
          initial="enter" animate="center" exit="exit"
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
          drag="y" dragConstraints={{ top: 0, bottom: 0 }} dragElastic={0.15}
          onDragEnd={handleDragEnd}
          className="absolute inset-0 flex flex-col"
          onAnimationComplete={() => { isAnimating.current = false; }}
        >
          {(() => {
            const hue1 = hashToHue(role.title);
            const hue2 = (hue1 + 60) % 360;
            const hue3 = (hue1 + 180) % 360;
            return (
              <div className="absolute inset-0" style={{
                background: `linear-gradient(160deg, hsl(${hue1} 70% 12%) 0%, hsl(${hue2} 60% 8%) 50%, hsl(${hue3} 50% 6%) 100%)`,
              }}>
                {/* Decorative orbs */}
                <div className="absolute rounded-full opacity-25" style={{ width: 200 + (hue1 % 100), height: 200 + (hue1 % 100), top: -(hue2 % 60), right: -(hue1 % 80), background: `radial-gradient(circle, hsl(${hue1} 80% 45% / 0.35), transparent)` }} />
                <div className="absolute rounded-full opacity-20" style={{ width: 160 + (hue2 % 80), height: 160 + (hue2 % 80), bottom: -(hue3 % 40), left: -(hue2 % 60), background: `radial-gradient(circle, hsl(${hue2} 70% 55% / 0.25), transparent)` }} />
                <div className="absolute rounded-full opacity-15" style={{ width: 100 + (hue3 % 60), height: 100 + (hue3 % 60), top: '40%', left: '30%', background: `radial-gradient(circle, hsl(${hue3} 60% 50% / 0.2), transparent)` }} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              </div>
            );
          })()}

          <div className="relative flex-1 flex flex-col justify-end p-5 pb-8" onClick={() => setShowOverlay(true)}>
            {/* Center: summary signal instead of gauges */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2, type: "spring", damping: 20 }}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10"
              >
                {(role.taskCount ?? 0) > 0 && (
                  <span className="text-xs font-medium text-white/80">
                    {role.taskCount} tasks{(role.aiTaskCount ?? 0) > 0 ? ` · ${role.aiTaskCount} AI-led` : ""}
                  </span>
                )}
                {(role.taskCount ?? 0) > 0 && role.augmented > 0 && <span className="text-white/30">·</span>}
                {role.augmented > 0 && (
                  <span className="text-xs font-medium text-primary">{role.augmented}% augmented</span>
                )}
              </motion.div>
            </div>

            {/* Bottom-left metadata */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} className="max-w-[70%]">
              <span className="inline-block px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest rounded bg-white/15 backdrop-blur-sm text-white/80 mb-2">{role.tag}</span>
              <h2 className="text-2xl font-display font-bold text-white leading-tight drop-shadow-lg">{role.title}</h2>
              {(role.company || role.location) && (
                <p className="mt-1 text-xs text-white/50">{[role.company, role.location].filter(Boolean).join(" · ")}</p>
              )}
              {role.description && (
                <p className="mt-1.5 text-xs text-white/50 leading-relaxed line-clamp-1">{role.description}</p>
              )}
              <p className="mt-1 text-xs text-white/60 leading-relaxed">
                {aiSummaryLine(role.risk, role.augmented)}
              </p>
            </motion.div>
          </div>

          {/* Right rail */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
            className="absolute right-3 bottom-24 flex flex-col items-center gap-4"
          >
            <ActionButton icon={BarChart3} label="Analyze" glow onClick={() => navigate(`/analysis?title=${encodeURIComponent(role.title)}&company=${encodeURIComponent(role.company || "")}`)} />
            <ActionButton icon={Zap} label="Details" onClick={() => setShowOverlay(true)} />
            <ActionButton icon={Bookmark} label="Save" onClick={() => {}} />
            <ActionButton icon={Share2} label="Share" onClick={() => { navigator.share?.({ title: role.title, url: window.location.href }).catch(() => {}); }} />
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Progress */}
      <div className="absolute top-0 left-0 right-0 z-20 h-0.5 bg-white/10">
        <motion.div className="h-full bg-primary" animate={{ width: `${((currentIndex + 1) / roles.length) * 100}%` }} transition={{ type: "spring", damping: 30 }} />
      </div>
      <div className="absolute top-3 right-3 z-20">
        <span className="text-[10px] font-medium text-white/50 backdrop-blur-sm bg-black/20 px-2 py-1 rounded-full">{currentIndex + 1}/{roles.length}</span>
      </div>

      {/* Swipe hint */}
      {currentIndex === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: [0, 0.6, 0] }} transition={{ duration: 2, repeat: 2, delay: 1.5 }}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center"
        >
          <ChevronUp className="h-5 w-5 text-white/60" />
          <span className="text-[10px] text-white/40 font-medium">Swipe up</span>
        </motion.div>
      )}

      <SearchFAB onClick={onOpenSearch} />

      {/* Detail overlay on tap */}
      <AnimatePresence>
        {showOverlay && <RoleDetailOverlay role={role} onClose={() => setShowOverlay(false)} />}
      </AnimatePresence>
    </div>
  );
}

/* ── Main Export ────────────────────────────────────── */

export default function RoleFeed(props: RoleFeedProps) {
  const isMobile = useIsMobile();
  return isMobile ? <MobileFeed {...props} /> : <DesktopGrid {...props} />;
}

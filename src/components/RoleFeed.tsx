import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { BarChart3, Zap, Bookmark, Share2, Search, ChevronUp, X, ArrowRight, Globe, MapPin, Laptop, Loader2, Briefcase, Bot, Sparkles } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";

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

/* ── Three-Section Detail Overlay ──────────────────── */

function RoleDetailOverlay({ role, onClose }: { role: RoleCard; onClose: () => void }) {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<TaskCluster[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);

  // Fetch task clusters on open
  useEffect(() => {
    if (!role.jobId) return;
    setLoadingTasks(true);
    supabase
      .from("job_task_clusters")
      .select("cluster_name, description, ai_exposure_score, priority")
      .eq("job_id", role.jobId)
      .order("sort_order", { ascending: true })
      .limit(5)
      .then(({ data }) => {
        setTasks(data || []);
        setLoadingTasks(false);
      });
  }, [role.jobId]);

  const seniorityLabel: Record<string, string> = {
    junior: "Junior", mid: "Mid-Level", senior: "Senior", lead: "Lead", manager: "Manager", director: "Director", vp: "VP", c_level: "C-Level",
  };

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
              className="relative h-32 shrink-0"
              style={{
                background: `linear-gradient(135deg, hsl(${hue1} 70% 15%) 0%, hsl(${hue2} 60% 12%) 50%, hsl(${hue3} 50% 10%) 100%)`,
              }}
            >
              <div className="absolute rounded-full opacity-20" style={{ width: 80, height: 80, top: -20, right: 20, background: `radial-gradient(circle, hsl(${hue1} 80% 50% / 0.4), transparent)` }} />
              <button onClick={onClose} className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center hover:bg-black/60 transition-colors z-10">
                <X className="h-4 w-4 text-white" />
              </button>
              <div className="absolute bottom-4 left-5 right-5">
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

        {/* Scrollable content — 3 sections */}
        <div className="flex-1 overflow-y-auto bg-card">
          {/* Section A: What is this role */}
          <div className="p-5 border-b border-border/40">
            <div className="flex items-center gap-2 mb-3">
              <Briefcase className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">What is this role</h3>
            </div>
            {role.description ? (
              <p className="text-sm text-muted-foreground leading-relaxed">{role.description.length > 300 ? role.description.slice(0, 300) + "…" : role.description}</p>
            ) : (
              <p className="text-sm text-muted-foreground/60 italic">No description available — run a full analysis for details.</p>
            )}
            {/* Metadata pills */}
            <div className="flex flex-wrap gap-1.5 mt-3">
              {role.seniority && (
                <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-accent text-accent-foreground">
                  {seniorityLabel[role.seniority] || role.seniority}
                </span>
              )}
              <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full border ${TAG_BADGE[role.tag] || TAG_BADGE.Other}`}>
                {role.tag}
              </span>
              {role.workMode && (
                <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-muted text-muted-foreground">
                  {role.workMode === "remote" ? "Remote" : role.workMode === "hybrid" ? "Hybrid" : "On-site"}
                </span>
              )}
              {role.country && (
                <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-muted text-muted-foreground">
                  {role.country}
                </span>
              )}
            </div>
          </div>

          {/* Section B: Key responsibilities */}
          <div className="p-5 border-b border-border/40">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Key responsibilities</h3>
            </div>
            {loadingTasks ? (
              <div className="flex items-center gap-2 py-3">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Loading tasks…</span>
              </div>
            ) : tasks.length > 0 ? (
              <div className="space-y-2.5">
                {tasks.map((task, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground leading-snug">{task.cluster_name}</p>
                      {task.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{task.description.length > 120 ? task.description.slice(0, 120) + "…" : task.description}</p>
                      )}
                    </div>
                    {task.ai_exposure_score != null && task.ai_exposure_score > 0 && (
                      <span className={`shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        task.ai_exposure_score >= 70 ? "bg-brand-ai/15 text-brand-ai" : task.ai_exposure_score >= 40 ? "bg-brand-mid/15 text-brand-mid" : "bg-brand-human/15 text-brand-human"
                      }`}>
                        {task.ai_exposure_score}% AI
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <button
                onClick={() => navigate(`/analysis?title=${encodeURIComponent(role.title)}&company=${encodeURIComponent(role.company || "")}`)}
                className="w-full py-3 rounded-lg border border-dashed border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
              >
                Run full analysis to see tasks →
              </button>
            )}
          </div>

          {/* Section C: AI in this role */}
          <div className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Bot className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">AI in this role</h3>
            </div>

            {role.augmented > 0 || role.risk > 0 ? (
              <div className="space-y-3">
                {/* Automation risk */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">{role.risk}% of tasks could be automated</span>
                  </div>
                  <Progress value={role.risk} className="h-1.5 bg-muted/50" />
                </div>
                {/* Augmented */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">{role.augmented}% of work enhanced by AI tools</span>
                  </div>
                  <Progress value={role.augmented} className="h-1.5 bg-muted/50" />
                </div>
                {/* AI Opportunity */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">{role.aiOpportunity}% AI skill opportunity</span>
                  </div>
                  <Progress value={role.aiOpportunity} className="h-1.5 bg-muted/50" />
                </div>

                {/* Summary */}
                <p className="text-xs text-muted-foreground/80 italic pt-1">
                  {aiSummaryLine(role.risk, role.augmented)}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground/60 italic">
                AI impact data not yet available — run an analysis to generate insights.
              </p>
            )}
          </div>
        </div>

        {/* Sticky CTA */}
        <div className="shrink-0 p-4 border-t border-border/40 bg-card">
          <div className="flex gap-3">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(`/analysis?title=${encodeURIComponent(role.title)}&company=${encodeURIComponent(role.company || "")}`)}
              className="flex-1 flex items-center justify-center gap-2 h-11 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors glow-purple"
            >
              <BarChart3 className="h-4 w-4" />
              Full Analysis
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

function DesktopGrid({ roles, onOpenSearch }: RoleFeedProps) {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<RoleCard | null>(null);
  const [filter, setFilter] = useState<string | null>(null);
  const [countryFilter, setCountryFilter] = useState<string | null>(null);
  const [workModeFilter, setWorkModeFilter] = useState<string | null>(null);

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

  const filtered = useMemo(() => {
    return roles.filter(r => {
      if (filter && r.tag !== filter) return false;
      if (countryFilter && r.country !== countryFilter) return false;
      if (workModeFilter && r.workMode !== workModeFilter) return false;
      return true;
    });
  }, [roles, filter, countryFilter, workModeFilter]);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Filter bar */}
      <div className="shrink-0 flex flex-wrap items-center gap-2 px-6 py-4 border-b border-border/40">
        <div className="flex items-center gap-1.5">
          <button onClick={() => setFilter(null)} className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${!filter ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
            All <span className="opacity-60 ml-0.5">{roles.length}</span>
          </button>
          {tags.map(tag => (
            <button key={tag} onClick={() => setFilter(f => f === tag ? null : tag)} className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${filter === tag ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
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
          <div className="absolute inset-0">
            <img src={role.image} alt={role.title} className="w-full h-full object-cover" draggable={false} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10" />
          </div>

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

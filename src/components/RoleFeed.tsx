import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { BarChart3, Zap, Bookmark, Share2, Search, ChevronUp, X, ArrowRight } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

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
}

interface RoleFeedProps {
  roles: RoleCard[];
  onOpenSearch: () => void;
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

/* ── Shared: Gauge ─────────────────────────────────── */

function RiskGaugeMini({ value, label, color, size = 96 }: { value: number; label: string; color: string; size?: number }) {
  const radius = size * 0.4;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  const center = size / 2;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="drop-shadow-lg">
        <circle cx={center} cy={center} r={radius} fill="none" stroke="hsl(var(--muted) / 0.3)" strokeWidth="5" />
        <motion.circle
          cx={center} cy={center} r={radius}
          fill="none" stroke={color} strokeWidth="5" strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
          transform={`rotate(-90 ${center} ${center})`}
        />
        <motion.text
          x={center} y={center - 4} textAnchor="middle" dominantBaseline="middle"
          className="fill-white font-display font-bold"
          style={{ fontSize: `${size * 0.22}px` }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
        >{value}%</motion.text>
        <text x={center} y={center + size * 0.14} textAnchor="middle" dominantBaseline="middle"
          className="fill-white/60" style={{ fontSize: `${Math.max(7, size * 0.08)}px`, textTransform: "uppercase", letterSpacing: "1px" }}
        >{label}</text>
      </svg>
    </div>
  );
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
      {/* Pulse ring */}
      <motion.div
        className="absolute inset-0 rounded-full border border-primary/40"
        animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0, 0.5] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      />
    </motion.button>
  );
}

/* ── Detail Overlay (shared between desktop & mobile) ── */

function RoleDetailOverlay({ role, onClose }: { role: RoleCard; onClose: () => void }) {
  const navigate = useNavigate();
  const riskColor = role.risk >= 40 ? "hsl(var(--destructive))" : role.risk >= 20 ? "hsl(var(--warning))" : "hsl(var(--success))";

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
        className="relative w-full sm:max-w-lg sm:rounded-2xl overflow-hidden"
      >
        <div className="relative h-64 sm:h-72">
          <img src={role.image} alt={role.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />
          <button onClick={onClose} className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center hover:bg-black/60 transition-colors">
            <X className="h-4 w-4 text-white" />
          </button>
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
            <RiskGaugeMini value={role.risk} label="AI Risk" color={riskColor} size={80} />
            <RiskGaugeMini value={role.augmented} label="Augmented" color="hsl(var(--neon-blue))" size={80} />
            <RiskGaugeMini value={role.aiOpportunity} label="To Learn" color="hsl(var(--neon-purple))" size={80} />
          </div>
        </div>
        <div className="bg-card p-5 sm:p-6">
          <span className="inline-block px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest rounded bg-accent text-accent-foreground mb-2">
            {role.tag}
          </span>
          <h2 className="text-xl sm:text-2xl font-display font-bold text-foreground">{role.title}</h2>
          {(role.company || role.location) && (
            <p className="mt-1 text-sm text-muted-foreground">
              {[role.company, role.location].filter(Boolean).join(" · ")}
            </p>
          )}
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            {role.risk >= 40
              ? "High disruption potential — critical upskilling opportunity ahead."
              : role.risk >= 20
                ? "Moderate AI exposure — skill requirements are evolving fast."
                : "Strong human-AI synergy — AI augments rather than replaces."}
          </p>
          <div className="flex gap-3 mt-5">
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

  const tags = Array.from(new Set(roles.map(r => r.tag)));
  const filtered = filter ? roles.filter(r => r.tag === filter) : roles;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Filter bar — no search pill, just filters */}
      <div className="shrink-0 flex items-center gap-2 px-6 py-4 border-b border-border/40">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setFilter(null)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
              !filter ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >All</button>
          {tags.map(tag => (
            <button
              key={tag}
              onClick={() => setFilter(f => f === tag ? null : tag)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                filter === tag ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >{tag}</button>
          ))}
        </div>
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
                {/* Title at top */}
                <div className="p-3 pb-0">
                  <h3 className="text-sm font-semibold text-foreground leading-snug group-hover:text-primary transition-colors truncate">{role.title}</h3>
                </div>
                {/* Generative gradient */}
                <div
                  className="relative h-24 mx-3 mt-2 rounded-lg overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, hsl(${hue1} 70% 15%) 0%, hsl(${hue2} 60% 12%) 50%, hsl(${hue3} 50% 10%) 100%)`,
                  }}
                >
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
                      <span className="text-xs font-bold text-white">{role.aiOpportunity}%</span>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-sm ${riskColor}`}>
                      {role.risk}% risk
                    </span>
                  </div>
                </div>
                {/* Bottom section with logo + company */}
                <div className="p-3 pt-2">
                  <div className="flex items-center gap-2">
                    {logoUrl && (
                      <img
                        src={logoUrl}
                        alt={role.company || ''}
                        className="h-7 w-7 rounded-md object-contain bg-white/10 p-0.5 shrink-0"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    )}
                    <p className="text-[11px] text-muted-foreground truncate">
                      {[role.company, role.location].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <span className={`inline-block mt-1.5 px-2 py-0.5 text-[10px] font-medium rounded-full border ${TAG_BADGE[role.tag] || TAG_BADGE.Other}`}>
                    {role.tag}
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Floating FAB */}
      <SearchFAB onClick={onOpenSearch} />

      {/* Detail overlay */}
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

  const riskColor = role.risk >= 40 ? "hsl(var(--destructive))" : role.risk >= 20 ? "hsl(var(--warning))" : "hsl(var(--success))";

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

          <div className="relative flex-1 flex flex-col justify-end p-5 pb-8">
            {/* Center gauges */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2, type: "spring", damping: 20 }} className="flex gap-4">
                <RiskGaugeMini value={role.risk} label="AI Risk" color={riskColor} size={80} />
                <RiskGaugeMini value={role.augmented} label="Augmented" color="hsl(var(--neon-blue))" size={80} />
                <RiskGaugeMini value={role.aiOpportunity} label="To Learn" color="hsl(var(--neon-purple))" size={80} />
              </motion.div>
            </div>

            {/* Bottom-left metadata */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} className="max-w-[70%]">
              <span className="inline-block px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest rounded bg-white/15 backdrop-blur-sm text-white/80 mb-2">{role.tag}</span>
              <h2 className="text-2xl font-display font-bold text-white leading-tight drop-shadow-lg">{role.title}</h2>
              {(role.company || role.location) && (
                <p className="mt-1 text-xs text-white/50">{[role.company, role.location].filter(Boolean).join(" · ")}</p>
              )}
              <p className="mt-1.5 text-xs text-white/60 leading-relaxed">
                {role.risk >= 40 ? "High disruption — upskill now" : role.risk >= 20 ? "Evolving skill requirements" : "Strong human-AI synergy"}
              </p>
            </motion.div>
          </div>

          {/* Right rail — removed Search button, FAB handles it */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
            className="absolute right-3 bottom-24 flex flex-col items-center gap-4"
          >
            <ActionButton icon={BarChart3} label="Analyze" glow onClick={() => navigate(`/analysis?title=${encodeURIComponent(role.title)}&company=${encodeURIComponent(role.company || "")}`)} />
            <ActionButton icon={Zap} label="Practice" onClick={() => navigate(`/analysis?title=${encodeURIComponent(role.title)}&company=${encodeURIComponent(role.company || "")}`)} />
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

      {/* Floating FAB */}
      <SearchFAB onClick={onOpenSearch} />
    </div>
  );
}

/* ── Main Export ────────────────────────────────────── */

export default function RoleFeed(props: RoleFeedProps) {
  const isMobile = useIsMobile();
  return isMobile ? <MobileFeed {...props} /> : <DesktopGrid {...props} />;
}

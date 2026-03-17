import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { BarChart3, Zap, Bookmark, Share2, Search, ChevronUp, ChevronDown } from "lucide-react";

interface RoleCard {
  title: string;
  image: string;
  augmented: number;
  risk: number;
  aiOpportunity: number;
  tag: string;
}

interface RoleFeedProps {
  roles: RoleCard[];
  onOpenSearch: () => void;
}

/** Circular animated gauge */
function RiskGaugeMini({ value, label, color }: { value: number; label: string; color: string }) {
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="96" height="96" viewBox="0 0 96 96" className="drop-shadow-lg">
        <circle cx="48" cy="48" r={radius} fill="none" stroke="hsl(var(--muted) / 0.3)" strokeWidth="6" />
        <motion.circle
          cx="48" cy="48" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
          transform="rotate(-90 48 48)"
        />
        <motion.text
          x="48" y="44" textAnchor="middle" dominantBaseline="middle"
          className="fill-white font-display font-bold"
          style={{ fontSize: "22px" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          {value}%
        </motion.text>
        <text x="48" y="60" textAnchor="middle" dominantBaseline="middle"
          className="fill-white/60" style={{ fontSize: "8px", textTransform: "uppercase", letterSpacing: "1px" }}
        >
          {label}
        </text>
      </svg>
    </div>
  );
}

/** Action rail button */
function ActionButton({
  icon: Icon,
  label,
  onClick,
  glow,
}: {
  icon: typeof BarChart3;
  label: string;
  onClick: () => void;
  glow?: boolean;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.85 }}
      whileHover={{ scale: 1.1 }}
      onClick={onClick}
      className={`flex flex-col items-center gap-1 ${glow ? "drop-shadow-[0_0_12px_hsl(var(--neon-purple)/0.6)]" : ""}`}
    >
      <div className={`w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md transition-colors ${
        glow
          ? "bg-primary/30 border border-primary/50"
          : "bg-white/10 border border-white/20 hover:bg-white/20"
      }`}>
        <Icon className={`h-5 w-5 ${glow ? "text-primary-foreground" : "text-white"}`} />
      </div>
      <span className="text-[10px] text-white/70 font-medium">{label}</span>
    </motion.button>
  );
}

export default function RoleFeed({ roles, onOpenSearch }: RoleFeedProps) {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const isAnimating = useRef(false);

  const goTo = useCallback((newIndex: number, dir: number) => {
    if (isAnimating.current) return;
    if (newIndex < 0 || newIndex >= roles.length) return;
    isAnimating.current = true;
    setDirection(dir);
    setCurrentIndex(newIndex);
    setTimeout(() => { isAnimating.current = false; }, 450);
  }, [roles.length]);

  const goNext = useCallback(() => goTo(currentIndex + 1, 1), [currentIndex, goTo]);
  const goPrev = useCallback(() => goTo(currentIndex - 1, -1), [currentIndex, goTo]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "j") goNext();
      if (e.key === "ArrowUp" || e.key === "k") goPrev();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goNext, goPrev]);

  // Wheel / trackpad
  const wheelCooldown = useRef(false);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      if (wheelCooldown.current) return;
      wheelCooldown.current = true;
      if (e.deltaY > 30) goNext();
      else if (e.deltaY < -30) goPrev();
      setTimeout(() => { wheelCooldown.current = false; }, 500);
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, [goNext, goPrev]);

  // Touch / drag
  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.y < -60) goNext();
    else if (info.offset.y > 60) goPrev();
  };

  const role = roles[currentIndex];
  if (!role) return null;

  const riskColor = role.risk >= 40
    ? "hsl(var(--destructive))"
    : role.risk >= 20
      ? "hsl(var(--warning))"
      : "hsl(var(--success))";

  const variants = {
    enter: (dir: number) => ({
      y: dir > 0 ? "100%" : "-100%",
      opacity: 0,
    }),
    center: {
      y: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      y: dir > 0 ? "-100%" : "100%",
      opacity: 0,
    }),
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden bg-background"
    >
      <AnimatePresence initial={false} custom={direction} mode="popLayout">
        <motion.div
          key={currentIndex}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={0.15}
          onDragEnd={handleDragEnd}
          className="absolute inset-0 flex flex-col"
          onAnimationComplete={() => { isAnimating.current = false; }}
        >
          {/* Background image */}
          <div className="absolute inset-0">
            <img
              src={role.image}
              alt={role.title}
              className="w-full h-full object-cover"
              draggable={false}
            />
            {/* Gradient overlays for legibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />
          </div>

          {/* Content layer */}
          <div className="relative flex-1 flex flex-col justify-end p-5 pb-8 sm:p-8 sm:pb-12">
            {/* Center gauge cluster */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, type: "spring", damping: 20 }}
                className="flex gap-6"
              >
                <RiskGaugeMini value={role.risk} label="AI Risk" color={riskColor} />
                <RiskGaugeMini value={role.augmented} label="Augmented" color="hsl(var(--neon-blue))" />
                <RiskGaugeMini value={role.aiOpportunity} label="To Learn" color="hsl(var(--neon-purple))" />
              </motion.div>
            </div>

            {/* Bottom-left metadata — TikTok style */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
              className="max-w-[70%] sm:max-w-[60%]"
            >
              <span className="inline-block px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest rounded bg-white/15 backdrop-blur-sm text-white/80 mb-2">
                {role.tag}
              </span>
              <h2 className="text-2xl sm:text-4xl font-display font-bold text-white leading-tight drop-shadow-lg">
                {role.title}
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-white/60 leading-relaxed max-w-md">
                {role.risk >= 40
                  ? "High disruption potential — critical upskilling opportunity"
                  : role.risk >= 20
                    ? "Moderate AI exposure — evolving skill requirements"
                    : "AI-augmented role — strong human-AI synergy"}
              </p>
            </motion.div>
          </div>

          {/* Right-side action rail — TikTok style */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="absolute right-4 sm:right-6 bottom-28 sm:bottom-32 flex flex-col items-center gap-5"
          >
            <ActionButton
              icon={BarChart3}
              label="Analyze"
              glow
              onClick={() => navigate(`/analysis?title=${encodeURIComponent(role.title)}&company=`)}
            />
            <ActionButton
              icon={Zap}
              label="Practice"
              onClick={() => navigate(`/analysis?title=${encodeURIComponent(role.title)}&company=`)}
            />
            <ActionButton
              icon={Bookmark}
              label="Save"
              onClick={() => {}}
            />
            <ActionButton
              icon={Share2}
              label="Share"
              onClick={() => {
                navigator.share?.({ title: `${role.title} AI Analysis`, url: window.location.href })
                  .catch(() => {});
              }}
            />
            <ActionButton
              icon={Search}
              label="Search"
              onClick={onOpenSearch}
            />
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Top progress bar */}
      <div className="absolute top-0 left-0 right-0 z-20 h-0.5 bg-white/10">
        <motion.div
          className="h-full bg-primary"
          initial={false}
          animate={{ width: `${((currentIndex + 1) / roles.length) * 100}%` }}
          transition={{ type: "spring", damping: 30 }}
        />
      </div>

      {/* Role counter */}
      <div className="absolute top-3 right-4 z-20">
        <span className="text-xs font-medium text-white/50 backdrop-blur-sm bg-black/20 px-2 py-1 rounded-full">
          {currentIndex + 1} / {roles.length}
        </span>
      </div>

      {/* Navigation hints */}
      <div className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-1">
        {currentIndex > 0 && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            whileHover={{ opacity: 1 }}
            onClick={goPrev}
            className="p-1"
          >
            <ChevronUp className="h-5 w-5 text-white" />
          </motion.button>
        )}
        {currentIndex < roles.length - 1 && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            whileHover={{ opacity: 1 }}
            onClick={goNext}
            className="p-1"
          >
            <ChevronDown className="h-5 w-5 text-white" />
          </motion.button>
        )}
      </div>

      {/* Swipe hint on first card */}
      {currentIndex === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: [0, 0.6, 0], y: [10, -5, 10] }}
          transition={{ duration: 2, repeat: 2, delay: 1.5 }}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center"
        >
          <ChevronUp className="h-5 w-5 text-white/60" />
          <span className="text-[10px] text-white/40 font-medium">Swipe up</span>
        </motion.div>
      )}
    </div>
  );
}

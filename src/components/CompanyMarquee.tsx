import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import { useMemo, useState, useRef, useCallback } from 'react';
import { brandfetchFromName } from '@/lib/logo';
import { Briefcase, Play } from 'lucide-react';

type CompanyMarqueeProps = {
  rows: string[][];
  onCompanyClick?: (name: string) => void;
};

/* ─── Skeleton card for hover preview ─── */
function SkeletonJobCard({ delay }: { delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.08, duration: 0.2 }}
      className="rounded-lg border border-border/40 bg-card/60 p-3 min-w-[160px]"
    >
      <div className="flex items-center gap-1.5 mb-2">
        <Briefcase className="h-3 w-3 text-muted-foreground/30" />
        <div className="h-2 w-12 rounded bg-muted-foreground/10 animate-pulse" />
      </div>
      <div className="h-3 w-24 rounded bg-muted-foreground/15 animate-pulse mb-1.5" />
      <div className="h-2 w-16 rounded bg-muted-foreground/10 animate-pulse mb-3" />
      <div className="flex items-center justify-between">
        <div className="h-2 w-10 rounded bg-brand-ai/10 animate-pulse" />
        <div className="flex items-center gap-1 text-[9px] text-primary/40">
          <Play className="h-2.5 w-2.5" />
          Practice
        </div>
      </div>
    </motion.div>
  );
}

function CompanyChip({ name, onClick, onHoverStart, onHoverEnd }: {
  name: string;
  onClick?: () => void;
  onHoverStart?: () => void;
  onHoverEnd?: () => void;
}) {
  const logoUrl = useMemo(() => brandfetchFromName(name), [name]);
  const [logoFailed, setLogoFailed] = useState(false);
  const showLogo = Boolean(logoUrl) && !logoFailed;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
      className="relative flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-background/80 shrink-0 hover:border-primary/40 hover:bg-primary/5 transition-colors cursor-pointer"
    >
      <div className="w-5 h-5 rounded-full overflow-hidden flex items-center justify-center bg-muted">
        {showLogo ? (
          <img src={logoUrl!} alt={name} className="w-5 h-5 object-contain grayscale opacity-70" onError={() => setLogoFailed(true)} />
        ) : (
          <span className="text-[10px] font-bold text-muted-foreground">
            {name.slice(0, 2).toUpperCase()}
          </span>
        )}
      </div>
      <span className="text-sm font-medium text-foreground whitespace-nowrap">{name}</span>
    </button>
  );
}

export default function CompanyMarquee({ rows, onCompanyClick }: CompanyMarqueeProps) {
  const prefersReducedMotion = useReducedMotion();
  const [hoveredCompany, setHoveredCompany] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleHoverStart = useCallback((name: string, e: React.MouseEvent) => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => {
      const rect = (e.target as HTMLElement).closest('button')?.getBoundingClientRect();
      const containerRect = containerRef.current?.getBoundingClientRect();
      if (rect && containerRect) {
        setTooltipPos({
          x: rect.left - containerRect.left + rect.width / 2,
          y: rect.bottom - containerRect.top + 8,
        });
      }
      setHoveredCompany(name);
    }, 350);
  }, []);

  const handleHoverEnd = useCallback(() => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    setHoveredCompany(null);
    setTooltipPos(null);
  }, []);

  const renderChip = (name: string, index: number) => (
    <CompanyChip
      key={`${name}-${index}`}
      name={name}
      onClick={() => onCompanyClick?.(name)}
      onHoverStart={(e?: any) => handleHoverStart(name, e)}
      onHoverEnd={handleHoverEnd}
    />
  );

  if (prefersReducedMotion) {
    return (
      <div ref={containerRef} className="relative flex flex-wrap gap-2 justify-center">
        {rows.flat().map((name, i) => renderChip(name, i))}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative overflow-hidden py-4">
      <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-background to-transparent z-10" />
      <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-background to-transparent z-10" />
      {rows.map((row, rowIndex) => {
        const duplicated = [...row, ...row];
        return (
          <div key={rowIndex} className="flex mb-3 last:mb-0">
            <motion.div
              className="flex gap-3"
              animate={{ x: ['0%', '-50%'] }}
              transition={{
                x: { repeat: Infinity, repeatType: 'loop', duration: 25 + rowIndex * 5, ease: 'linear' },
              }}
              onMouseEnter={() => {}}
            >
              {duplicated.map((name, index) => (
                <div
                  key={`${name}-${index}`}
                  onMouseEnter={(e) => handleHoverStart(name, e)}
                  onMouseLeave={handleHoverEnd}
                >
                  <CompanyChip
                    name={name}
                    onClick={() => onCompanyClick?.(name)}
                  />
                </div>
              ))}
            </motion.div>
          </div>
        );
      })}

      {/* Hover preview tooltip */}
      <AnimatePresence>
        {hoveredCompany && tooltipPos && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute z-30 pointer-events-none"
            style={{
              left: tooltipPos.x,
              top: tooltipPos.y,
              transform: 'translateX(-50%)',
            }}
          >
            <div className="rounded-xl border border-border/60 bg-card/95 backdrop-blur-md shadow-xl p-3">
              <div className="flex items-center gap-2 mb-2.5">
                <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">{hoveredCompany}</span>
                <span className="text-[9px] text-primary font-medium">· Click to explore</span>
              </div>
              <div className="flex gap-2">
                <SkeletonJobCard delay={0} />
                <SkeletonJobCard delay={1} />
                <SkeletonJobCard delay={2} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

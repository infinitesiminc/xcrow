import { useRef, useEffect } from "react";
import { MapPin, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

export interface RoleResult {
  jobId: string;
  title: string;
  company: string | null;
  logo: string | null;
  location: string | null;
  country: string | null;
  workMode: string | null;
  seniority: string | null;
  augmented: number;
  risk: number;
  sourceUrl?: string | null;
}

export interface RoleBatch {
  id: number;
  roles: RoleResult[];
}

function hashToHue(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = str.charCodeAt(i) + ((h << 5) - h);
  }
  return Math.abs(h) % 360;
}

function MiniGauge({ value }: { value: number }) {
  const r = 14;
  const stroke = 3;
  const circumference = Math.PI * r;
  const offset = circumference - (value / 100) * circumference;
  return (
    <svg width={34} height={20} viewBox="0 0 34 20" className="shrink-0">
      <path d={`M 3 18 A ${r} ${r} 0 0 1 31 18`} fill="none" stroke="hsl(var(--muted))" strokeWidth={stroke} strokeLinecap="round" />
      <path d={`M 3 18 A ${r} ${r} 0 0 1 31 18`} fill="none" stroke="white" strokeWidth={stroke} strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} />
      <text x="17" y="17" textAnchor="middle" fontSize="8" fontWeight="700" fill="white">{value}</text>
    </svg>
  );
}

interface InlineRoleCarouselProps {
  roles: RoleResult[];
  onSelectRole: (role: RoleResult) => void;
  selectedJobId?: string;
}

/** Simple single-batch carousel (used inline in chat) */
export default function InlineRoleCarousel({ roles, onSelectRole, selectedJobId }: InlineRoleCarouselProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-thin -mx-1 px-1"
    >
      {roles.map((role, i) => (
        <RoleCard key={(role.jobId || role.title) + i} role={role} index={i} isSelected={selectedJobId === role.jobId} onSelect={onSelectRole} />
      ))}
    </motion.div>
  );
}

/** Multi-batch carousel with scroll navigation — used in the right panel header */
export function BatchedRoleCarousel({
  batches,
  onSelectRole,
  selectedJobId,
  latestBatchId,
}: {
  batches: RoleBatch[];
  onSelectRole: (role: RoleResult) => void;
  selectedJobId?: string;
  latestBatchId: number;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const latestRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest batch when new roles arrive
  useEffect(() => {
    if (latestRef.current && scrollRef.current) {
      latestRef.current.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
    }
  }, [latestBatchId]);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = 240;
    scrollRef.current.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  const totalRoles = batches.reduce((s, b) => s + b.roles.length, 0);

  return (
    <div className="relative">
      {/* Header with count */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Matching roles
        </p>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-muted-foreground">
            {totalRoles} role{totalRoles !== 1 ? "s" : ""} · {batches.length} round{batches.length !== 1 ? "s" : ""}
          </span>
          {batches.length > 1 && (
            <div className="flex gap-0.5 ml-1">
              <button
                onClick={() => scroll("left")}
                className="h-5 w-5 rounded flex items-center justify-center bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronLeft className="h-3 w-3" />
              </button>
              <button
                onClick={() => scroll("right")}
                className="h-5 w-5 rounded flex items-center justify-center bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Scrollable area with batch groups */}
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-thin [mask-image:linear-gradient(to_right,transparent,black_1%,black_97%,transparent)]"
      >
        {batches.map((batch) => (
          <div
            key={batch.id}
            ref={batch.id === latestBatchId ? latestRef : undefined}
            className="flex gap-2 shrink-0"
          >
            {/* Batch separator for rounds after the first */}
            {batch.id > 1 && (
              <div className="flex flex-col items-center justify-center px-1 shrink-0">
                <div className="w-px flex-1 bg-border" />
                <span className="text-[8px] text-muted-foreground font-medium py-0.5 whitespace-nowrap">
                  R{batch.id}
                </span>
                <div className="w-px flex-1 bg-border" />
              </div>
            )}
            {batch.roles.map((role, i) => (
              <RoleCard
                key={(role.jobId || role.title) + batch.id + i}
                role={role}
                index={i}
                isSelected={selectedJobId === role.jobId}
                onSelect={onSelectRole}
                isLatest={batch.id === latestBatchId}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Shared role card — exported for reuse */
export function RoleCard({
  role,
  index,
  isSelected,
  onSelect,
  isLatest = true,
}: {
  role: RoleResult;
  index: number;
  isSelected: boolean;
  onSelect: (role: RoleResult) => void;
  isLatest?: boolean;
}) {
  const hue1 = hashToHue(role.title);
  const hue2 = (hue1 + 60) % 360;
  const logoUrl =
    role.logo ||
    (role.company
      ? `https://logo.clearbit.com/${role.company.toLowerCase().replace(/\s+/g, "")}.com`
      : "");

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2, delay: index * 0.04 }}
      onClick={() => onSelect(role)}
      className={`group shrink-0 w-[200px] text-left rounded-xl overflow-hidden bg-card border transition-all flex flex-col ${
        isSelected
          ? "border-primary shadow-md shadow-primary/10"
          : isLatest
          ? "border-border hover:border-primary/40 hover:shadow-sm"
          : "border-border/50 opacity-70 hover:opacity-100 hover:border-primary/30"
      }`}
    >
      <div className="p-2.5 pb-1.5 flex-1">
        <div className="flex items-start gap-2">
          {logoUrl && (
            <img
              src={logoUrl}
              alt=""
              className="h-7 w-7 rounded-md object-contain bg-muted/30 p-0.5 shrink-0 mt-0.5"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          )}
          <div className="min-w-0 flex-1">
            <h3 className="text-xs font-semibold text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-2">
              {role.title}
            </h3>
            {role.company && (
              <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                {role.company}
              </p>
            )}
          </div>
        </div>
        {role.location && (
          <div className="flex items-center gap-0.5 mt-1.5">
            <MapPin className="h-2.5 w-2.5 text-muted-foreground shrink-0" />
            <span className="text-[10px] text-muted-foreground truncate">
              {role.location}
              {role.workMode ? ` · ${role.workMode}` : ""}
            </span>
          </div>
        )}
      </div>

      <div className="border-t border-border/30">
        <div
          className="px-2.5 py-1.5 flex items-center justify-between"
          style={{
            background: `linear-gradient(135deg, hsl(${hue1} 60% 8%) 0%, hsl(${hue2} 50% 6%) 100%)`,
          }}
        >
          {role.augmented > 0 ? (
            <div className="flex items-center gap-1">
              <MiniGauge value={role.augmented} />
              <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-wide">
                Augmented
              </span>
            </div>
          ) : (
            <span className="text-[10px] text-muted-foreground">Pending</span>
          )}
          <ArrowRight className="h-3 w-3 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
    </motion.button>
  );
}

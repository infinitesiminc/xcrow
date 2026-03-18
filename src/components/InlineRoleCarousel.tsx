import { MapPin, ArrowRight } from "lucide-react";
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

export default function InlineRoleCarousel({ roles, onSelectRole, selectedJobId }: InlineRoleCarouselProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-thin -mx-1 px-1"
    >
      {roles.map((role, i) => {
        const hue1 = hashToHue(role.title);
        const hue2 = (hue1 + 60) % 360;
        const isSelected = selectedJobId === role.jobId;
        const logoUrl =
          role.logo ||
          (role.company
            ? `https://logo.clearbit.com/${role.company.toLowerCase().replace(/\s+/g, "")}.com`
            : "");

        return (
          <motion.button
            key={(role.jobId || role.title) + i}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, delay: i * 0.04 }}
            onClick={() => onSelectRole(role)}
            className={`group shrink-0 w-[220px] text-left rounded-xl overflow-hidden bg-card border transition-all flex flex-col ${
              isSelected
                ? "border-primary shadow-md shadow-primary/10"
                : "border-border hover:border-primary/40 hover:shadow-sm"
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
      })}
    </motion.div>
  );
}

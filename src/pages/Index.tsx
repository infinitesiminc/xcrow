import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, MapPin, Zap, CircleDot, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import HomepageChat from "@/components/HomepageChat";
import { supabase } from "@/integrations/supabase/client";
import { getDepartmentImage } from "@/lib/department-images";

/* ── Types ─────────────────────────────────────────── */

interface RoleCard {
  jobId?: string;
  title: string;
  company?: string | null;
  logo?: string | null;
  location?: string | null;
  country?: string | null;
  workMode?: string | null;
  seniority?: string | null;
  augmented: number;
  risk: number;
}

/* ── Helpers ───────────────────────────────────────── */

function hashToHue(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = str.charCodeAt(i) + ((h << 5) - h);
  }
  return Math.abs(h) % 360;
}

/* ── Mini arc gauge (inline) ───────────────────────── */
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

/* ── Page ──────────────────────────────────────────── */

const Index = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [chatRoles, setChatRoles] = useState<RoleCard[]>([]);
  const [trendingRoles, setTrendingRoles] = useState<RoleCard[]>([]);
  const [loadingTrending, setLoadingTrending] = useState(true);

  // Fetch a small set of trending roles as default cards
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("jobs")
        .select("id, title, department, location, country, work_mode, seniority, augmented_percent, automation_risk_percent, companies(name, logo_url, website)")
        .gt("augmented_percent", 0)
        .order("augmented_percent", { ascending: false })
        .limit(12);

      if (data) {
        const seen = new Set<string>();
        const unique = data.filter((j) => {
          const key = j.title.toLowerCase().replace(/\s*(senior|junior|lead|staff)\s*/gi, "").trim();
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        }).slice(0, 6);

        setTrendingRoles(
          unique.map((j) => {
            const c = j.companies as any;
            return {
              jobId: j.id,
              title: j.title,
              company: c?.name || null,
              logo: c?.logo_url || (c?.website ? `https://logo.clearbit.com/${c.website.replace(/^https?:\/\//, "").replace(/\/.*$/, "")}` : null),
              location: j.location,
              country: j.country,
              workMode: j.work_mode,
              seniority: j.seniority,
              augmented: j.augmented_percent ?? 0,
              risk: j.automation_risk_percent ?? 0,
            };
          })
        );
      }
      setLoadingTrending(false);
    })();
  }, []);

  const handleRolesFound = useCallback((roles: RoleCard[]) => {
    setChatRoles(roles);
  }, []);

  const displayRoles = chatRoles.length > 0 ? chatRoles : trendingRoles;
  const isFromChat = chatRoles.length > 0;

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col">
      {/* ── Chat Section ──────────────────────────────── */}
      <section className="relative px-5 pt-10 pb-6 sm:pt-16 sm:pb-8">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />

        <div className="relative z-10 text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground leading-tight">
            Your AI Career Guide
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1.5">
            20,000+ roles · 290+ companies · 70+ countries
          </p>
        </div>

        <div className="relative z-10">
          <HomepageChat onRolesFound={handleRolesFound} />
        </div>
      </section>

      {/* ── Role Cards ────────────────────────────────── */}
      <section className="flex-1 px-5 sm:px-6 pb-10">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-sm font-semibold text-foreground">
            {isFromChat ? "Matching Roles" : "Trending Roles"}
          </h2>
          {isFromChat && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium">
              AI-matched
            </span>
          )}
        </div>

        {loadingTrending && displayRoles.length === 0 ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {displayRoles.map((role, i) => {
              const hue1 = hashToHue(role.title);
              const hue2 = (hue1 + 60) % 360;
              const logoUrl =
                role.logo ||
                (role.company
                  ? `https://logo.clearbit.com/${(role.company as string).toLowerCase().replace(/\s+/g, "")}.com`
                  : "");

              return (
                <motion.button
                  key={(role.jobId || role.title) + i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: Math.min(i * 0.05, 0.3) }}
                  onClick={() => {
                    const params = new URLSearchParams({
                      title: role.title,
                      company: (role.company as string) || "",
                    });
                    navigate(`/analysis?${params.toString()}`);
                  }}
                  className="group text-left rounded-xl overflow-hidden bg-card border border-border transition-all hover:shadow-lg hover:shadow-primary/5 hover:border-primary/40 flex flex-col"
                >
                  {/* Key info */}
                  <div className="p-3 pb-2 flex-1">
                    <div className="flex items-start gap-2.5">
                      {logoUrl && (
                        <img
                          src={logoUrl}
                          alt=""
                          className="h-8 w-8 rounded-lg object-contain bg-muted/30 p-0.5 shrink-0 mt-0.5"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-semibold text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-2">
                          {role.title}
                        </h3>
                        {role.company && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {role.company}
                          </p>
                        )}
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary shrink-0 mt-1 transition-colors" />
                    </div>
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      {role.location && (
                        <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground">
                          <MapPin className="h-3 w-3 shrink-0" />
                          {role.location}
                        </span>
                      )}
                      {role.workMode && (
                        <span className="text-[11px] text-muted-foreground capitalize">
                          · {role.workMode}
                        </span>
                      )}
                      {role.seniority && (
                        <span className="text-[11px] text-muted-foreground capitalize">
                          · {role.seniority}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* AI metrics strip */}
                  <div className="border-t border-border/30">
                    <div
                      className="px-3 py-2 flex items-center justify-between"
                      style={{
                        background: `linear-gradient(135deg, hsl(${hue1} 60% 8%) 0%, hsl(${hue2} 50% 6%) 100%)`,
                      }}
                    >
                      {role.augmented > 0 ? (
                        <div className="flex items-center gap-1.5">
                          <MiniGauge value={role.augmented} />
                          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                            AI Augmented
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">
                          Analysis pending
                        </span>
                      )}
                      <span className="text-[10px] font-medium text-primary">
                        View breakdown →
                      </span>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default Index;

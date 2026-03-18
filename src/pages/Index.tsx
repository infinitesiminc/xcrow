import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, MapPin, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import HomepageChat from "@/components/HomepageChat";
import { supabase } from "@/integrations/supabase/client";

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

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

/* ── Mini arc gauge ────────────────────────────────── */
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
  const [hasInteracted, setHasInteracted] = useState(false);

  const handleRolesFound = useCallback((roles: RoleCard[]) => {
    setChatRoles(roles);
  }, []);

  const handleChatStart = useCallback(() => {
    setHasInteracted(true);
  }, []);

  const greeting = getGreeting();
  const userName = profile?.displayName?.split(" ")[0];

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col">
      {/* ── Hero / Greeting ─────────────────────────── */}
      <section className="flex-1 flex flex-col items-center justify-center px-5 pt-8 pb-4 transition-all duration-500">
        <AnimatePresence mode="wait">
          {!hasInteracted && (
            <motion.div
              key="greeting"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20, transition: { duration: 0.3 } }}
              className="text-center mb-8"
            >
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-foreground leading-tight">
                {greeting}{userName ? `, ${userName}` : ""}
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-2 max-w-md mx-auto">
                Ask me about any career, role, or industry — I'll show you how AI is reshaping it.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Chat ──────────────────────────────────── */}
        <div className="w-full max-w-2xl">
          <HomepageChat
            onRolesFound={handleRolesFound}
            onChatStart={handleChatStart}
            hasInteracted={hasInteracted}
          />
        </div>
      </section>

      {/* ── Role Cards (only after AI returns results) */}
      <AnimatePresence>
        {chatRoles.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="px-5 sm:px-6 pb-10"
          >
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-sm font-semibold text-foreground">
                Matching Roles
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium">
                AI-matched
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {chatRoles.map((role, i) => {
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
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;

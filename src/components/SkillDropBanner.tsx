import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Zap, Clock, Crown, Award, X, ChevronRight } from "lucide-react";

interface DropEvent {
  id: string;
  title: string;
  description: string | null;
  rarity: string;
  banner_emoji: string | null;
  ends_at: string | null;
  tier_1_threshold: number;
  tier_2_threshold: number;
  tier_3_threshold: number;
}

interface Participation {
  event_id: string;
  sims_completed: number;
  tier_earned: string | null;
}

const RARITY_GRADIENT: Record<string, string> = {
  rare: "from-cyan-500/20 via-cyan-600/10 to-transparent border-cyan-500/30",
  epic: "from-purple-500/20 via-purple-600/10 to-transparent border-purple-500/30",
  legendary: "from-amber-500/20 via-amber-600/10 to-transparent border-amber-500/30",
};

const RARITY_TEXT: Record<string, string> = {
  rare: "text-cyan-400",
  epic: "text-purple-400",
  legendary: "text-amber-400",
};

export default function SkillDropBanner({ onStartQuest }: { onStartQuest?: (eventId: string) => void }) {
  const { user } = useAuth();
  const [events, setEvents] = useState<DropEvent[]>([]);
  const [participations, setParticipations] = useState<Participation[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [countdown, setCountdown] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("skill_drop_events")
        .select("id, title, description, rarity, banner_emoji, ends_at, tier_1_threshold, tier_2_threshold, tier_3_threshold")
        .eq("status", "active");
      setEvents((data as any) || []);

      if (user) {
        const { data: parts } = await supabase
          .from("skill_drop_participations")
          .select("event_id, sims_completed, tier_earned")
          .eq("user_id", user.id);
        setParticipations((parts as any) || []);
      }
    })();
  }, [user]);

  // Countdown timer
  useEffect(() => {
    if (events.length === 0) return;
    const tick = () => {
      const now = Date.now();
      const result: Record<string, string> = {};
      for (const e of events) {
        if (!e.ends_at) continue;
        const diff = new Date(e.ends_at).getTime() - now;
        if (diff <= 0) {
          result[e.id] = "Ended";
        } else {
          const h = Math.floor(diff / 3600000);
          const m = Math.floor((diff % 3600000) / 60000);
          const s = Math.floor((diff % 60000) / 1000);
          result[e.id] = h > 0 ? `${h}h ${m}m` : `${m}m ${s}s`;
        }
      }
      setCountdown(result);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [events]);

  const visibleEvents = useMemo(
    () => events.filter(e => !dismissed.has(e.id) && countdown[e.id] !== "Ended"),
    [events, dismissed, countdown]
  );

  if (visibleEvents.length === 0) return null;

  return (
    <div className="space-y-2">
      <AnimatePresence>
        {visibleEvents.map(event => {
          const part = participations.find(p => p.event_id === event.id);
          const gradient = RARITY_GRADIENT[event.rarity] || RARITY_GRADIENT.rare;
          const textColor = RARITY_TEXT[event.rarity] || RARITY_TEXT.rare;

          // Determine current tier progress
          const simsCompleted = part?.sims_completed || 0;
          let currentTier = "none";
          let nextThreshold = event.tier_1_threshold;
          if (simsCompleted >= event.tier_3_threshold) {
            currentTier = "legendary";
            nextThreshold = event.tier_3_threshold;
          } else if (simsCompleted >= event.tier_2_threshold) {
            currentTier = "epic";
            nextThreshold = event.tier_3_threshold;
          } else if (simsCompleted >= event.tier_1_threshold) {
            currentTier = "rare";
            nextThreshold = event.tier_2_threshold;
          }

          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              className={`relative rounded-xl border bg-gradient-to-r ${gradient} overflow-hidden`}
            >
              {/* Animated shimmer */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />

              <div className="relative flex items-center gap-3 px-4 py-3">
                {/* Emoji */}
                <span className="text-2xl shrink-0 animate-bounce" style={{ animationDuration: "2s" }}>
                  {event.banner_emoji || "⚔️"}
                </span>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className={`text-sm font-bold ${textColor}`}>{event.title}</h3>
                    <Badge variant="outline" className={`text-[9px] ${textColor} border-current/30`}>
                      SKILL DROP
                    </Badge>
                  </div>
                  {event.description && (
                    <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{event.description}</p>
                  )}
                  {/* Tier progress */}
                  {simsCompleted > 0 && (
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-1 text-[10px]">
                        {currentTier !== "none" && (
                          <Badge variant="outline" className="text-[9px] py-0">
                            {currentTier === "rare" ? "💎" : currentTier === "epic" ? "🔥" : "👑"} {currentTier}
                          </Badge>
                        )}
                        <span className="text-muted-foreground">{simsCompleted}/{nextThreshold} quests</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Timer + CTA */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <div className={`text-xs font-mono font-bold ${textColor} flex items-center gap-1`}>
                      <Clock className="h-3 w-3" />
                      {countdown[event.id] || "..."}
                    </div>
                    <p className="text-[9px] text-muted-foreground">remaining</p>
                  </div>
                  <Button
                    size="sm"
                    className="h-8 text-xs gap-1"
                    onClick={() => onStartQuest?.(event.id)}
                  >
                    <Zap className="h-3 w-3" />
                    {simsCompleted > 0 ? "Continue" : "Join"}
                    <ChevronRight className="h-3 w-3" />
                  </Button>
                  <button
                    onClick={() => setDismissed(prev => new Set([...prev, event.id]))}
                    className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

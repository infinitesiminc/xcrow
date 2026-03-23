/**
 * FriendActivityFeed — Shows recent friend achievements in the Allies panel.
 * Displays quest completions, skill-ups, and XP earned.
 */
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getAvatarById } from "@/lib/avatars";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Swords, Sparkles, Trophy, Clock, Zap } from "lucide-react";

interface FriendActivity {
  user_id: string;
  display_name: string;
  avatar_id: string | null;
  username: string | null;
  activity_type: string;
  job_title: string;
  task_name: string;
  skills_earned: any;
  total_xp: number;
  completed_at: string;
}

export default function FriendActivityFeed() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activities, setActivities] = useState<FriendActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    async function load() {
      const { data, error } = await supabase.rpc("get_friend_activity", {
        _user_id: user!.id,
        _limit: 30,
      });
      if (!error && data) setActivities(data as FriendActivity[]);
      setLoading(false);
    }

    load();
  }, [user]);

  const formatTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    if (diff < 60_000) return "just now";
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
    if (diff < 604_800_000) return `${Math.floor(diff / 86_400_000)}d ago`;
    return new Date(dateStr).toLocaleDateString();
  };

  const getSkillNames = (skills: any): string[] => {
    if (!skills || !Array.isArray(skills)) return [];
    return skills
      .map((s: any) => s.name || s.skillId || "")
      .filter(Boolean)
      .slice(0, 3);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-xs text-muted-foreground" style={{ fontFamily: "'Cinzel', serif" }}>
          Gathering tales of valor...
        </div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ background: "hsl(var(--filigree) / 0.08)" }}
        >
          <Trophy className="h-5 w-5" style={{ color: "hsl(var(--filigree-glow) / 0.5)" }} />
        </div>
        <div className="text-center">
          <p className="text-xs font-semibold text-foreground" style={{ fontFamily: "'Cinzel', serif" }}>
            No tales yet
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Your allies' quests will appear here
          </p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1">
      <div className="px-3 py-2 space-y-1">
        <AnimatePresence initial={false}>
          {activities.map((a, i) => {
            const avatar = a.avatar_id ? getAvatarById(a.avatar_id) : null;
            const skillNames = getSkillNames(a.skills_earned);

            return (
              <motion.div
                key={`${a.user_id}-${a.completed_at}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex gap-2.5 px-2 py-2.5 rounded-lg transition-all hover:bg-white/5 cursor-pointer group"
                onClick={() => a.username && navigate(`/u/${a.username}`)}
              >
                {/* Avatar */}
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 overflow-hidden mt-0.5"
                  style={{ background: "hsl(var(--filigree) / 0.1)" }}
                >
                  {avatar ? (
                    <img src={avatar.src} alt={avatar.label} className="w-full h-full object-cover" />
                  ) : (
                    a.display_name[0]?.toUpperCase() || "?"
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] leading-snug">
                    <span className="font-semibold text-foreground">{a.display_name}</span>
                    <span className="text-muted-foreground"> conquered </span>
                    <span className="font-medium" style={{ color: "hsl(var(--filigree-glow))" }}>
                      {a.task_name}
                    </span>
                  </p>

                  {/* Skill pills */}
                  {skillNames.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {skillNames.map((name) => (
                        <span
                          key={name}
                          className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                          style={{
                            background: "hsl(var(--filigree) / 0.1)",
                            color: "hsl(var(--filigree-glow))",
                            fontFamily: "'Cinzel', serif",
                          }}
                        >
                          {name}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Meta row */}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
                      <Swords className="h-2.5 w-2.5" />
                      {a.job_title}
                    </span>
                    <span className="text-[9px] font-medium flex items-center gap-0.5" style={{ color: "hsl(var(--primary))" }}>
                      <Zap className="h-2.5 w-2.5" />
                      +{a.total_xp} XP
                    </span>
                    <span className="text-[9px] text-muted-foreground flex items-center gap-0.5 ml-auto">
                      <Clock className="h-2.5 w-2.5" />
                      {formatTime(a.completed_at)}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ScrollArea>
  );
}

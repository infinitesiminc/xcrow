import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { Trophy, Zap, Target, Play, ArrowUpDown, Crown, Medal, Award, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type SortKey = "total_xp" | "skills_unlocked" | "tasks_completed";

interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  total_xp: number;
  skills_unlocked: number;
  tasks_completed: number;
}

const RANK_ICONS = [
  <Crown key="1" className="h-5 w-5 text-yellow-400" />,
  <Medal key="2" className="h-5 w-5 text-gray-300" />,
  <Award key="3" className="h-5 w-5 text-amber-600" />,
];

export default function Leaderboard() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortKey>("total_xp");

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.rpc("get_leaderboard" as any);
      if (!error && data) {
        setEntries(data as unknown as LeaderboardEntry[]);
      }
      setLoading(false);
    })();
  }, []);

  const sorted = useMemo(() => {
    return [...entries].sort((a, b) => (b[sortBy] as number) - (a[sortBy] as number));
  }, [entries, sortBy]);

  const myRank = useMemo(() => {
    if (!user) return null;
    const idx = sorted.findIndex(e => e.user_id === user.id);
    return idx >= 0 ? idx + 1 : null;
  }, [sorted, user]);

  const columns: { key: SortKey; label: string; icon: typeof Zap }[] = [
    { key: "total_xp", label: "XP", icon: Zap },
    { key: "skills_unlocked", label: "Skills", icon: Target },
    { key: "tasks_completed", label: "Tasks", icon: Play },
  ];

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 sm:py-12">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-primary/10 mb-4">
              <Trophy className="h-7 w-7 text-primary" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Leaderboard</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Top practitioners ranked by XP, skills, and tasks completed
            </p>
          </div>

          {/* My rank banner */}
          {myRank && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 rounded-xl border border-primary/30 bg-primary/5 p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                  #{myRank}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Your rank</p>
                  <p className="text-xs text-muted-foreground">
                    {sorted.find(e => e.user_id === user!.id)?.total_xp.toLocaleString()} XP
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Sort controls */}
          <div className="flex items-center gap-2 mb-4">
            <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Sort by:</span>
            {columns.map(col => (
              <Button
                key={col.key}
                variant={sortBy === col.key ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setSortBy(col.key)}
                className="text-xs gap-1 h-7"
              >
                <col.icon className="h-3 w-3" />
                {col.label}
              </Button>
            ))}
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : sorted.length === 0 ? (
            <div className="text-center py-20">
              <Trophy className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No entries yet. Be the first!</p>
            </div>
          ) : (
            <div className="rounded-xl border border-border overflow-hidden">
              {/* Table header */}
              <div className="grid grid-cols-[3rem_1fr_4.5rem_4.5rem_4.5rem] sm:grid-cols-[3.5rem_1fr_6rem_6rem_6rem] gap-1 px-3 sm:px-4 py-2.5 bg-muted/30 border-b border-border text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <span>#</span>
                <span>Name</span>
                <span className="text-right">XP</span>
                <span className="text-right">Skills</span>
                <span className="text-right">Tasks</span>
              </div>

              {/* Rows */}
              {sorted.map((entry, i) => {
                const isMe = user?.id === entry.user_id;
                return (
                  <motion.div
                    key={entry.user_id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className={`grid grid-cols-[3rem_1fr_4.5rem_4.5rem_4.5rem] sm:grid-cols-[3.5rem_1fr_6rem_6rem_6rem] gap-1 px-3 sm:px-4 py-3 items-center border-b border-border/30 last:border-b-0 transition-colors ${
                      isMe ? "bg-primary/5" : "hover:bg-muted/20"
                    }`}
                  >
                    {/* Rank */}
                    <div className="flex items-center justify-center">
                      {i < 3 ? RANK_ICONS[i] : (
                        <span className="text-sm font-medium text-muted-foreground">{i + 1}</span>
                      )}
                    </div>

                    {/* Name */}
                    <div className="min-w-0">
                      <p className={`text-sm font-medium truncate ${isMe ? "text-primary" : "text-foreground"}`}>
                        {entry.display_name}
                        {isMe && <span className="ml-1.5 text-[10px] text-primary/70">(you)</span>}
                      </p>
                    </div>

                    {/* XP */}
                    <div className="text-right">
                      <span className={`text-sm font-semibold ${sortBy === "total_xp" ? "text-primary" : "text-foreground"}`}>
                        {entry.total_xp.toLocaleString()}
                      </span>
                    </div>

                    {/* Skills */}
                    <div className="text-right">
                      <span className={`text-sm font-semibold ${sortBy === "skills_unlocked" ? "text-primary" : "text-foreground"}`}>
                        {entry.skills_unlocked}
                      </span>
                    </div>

                    {/* Tasks */}
                    <div className="text-right">
                      <span className={`text-sm font-semibold ${sortBy === "tasks_completed" ? "text-primary" : "text-foreground"}`}>
                        {entry.tasks_completed}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

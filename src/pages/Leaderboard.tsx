import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import {
  Trophy, Zap, Target, Play, ArrowUpDown, Crown, Medal, Award,
  Share2, Search, Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

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
  const { user, openAuthModal } = useAuth();
  const { toast } = useToast();
  const [sortBy, setSortBy] = useState<SortKey>("total_xp");
  const [search, setSearch] = useState("");

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_leaderboard" as any);
      if (error) throw error;
      return (data as any[]).map((r: any) => ({
        user_id: r.user_id,
        display_name: r.display_name || "Anonymous",
        total_xp: Number(r.total_xp) || 0,
        skills_unlocked: Number(r.skills_unlocked) || 0,
        tasks_completed: Number(r.tasks_completed) || 0,
      })) as LeaderboardEntry[];
    },
    staleTime: 60_000,
  });

  const filtered = useMemo(() => {
    let data = [...entries];
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(e => e.display_name.toLowerCase().includes(q));
    }
    return data.sort((a, b) => (b[sortBy] as number) - (a[sortBy] as number));
  }, [entries, sortBy, search]);

  const myEntry = user ? entries.find(e => e.user_id === user.id) : null;
  const myRank = useMemo(() => {
    if (!user) return 0;
    const sorted = [...entries].sort((a, b) => b[sortBy] - a[sortBy]);
    return sorted.findIndex(e => e.user_id === user.id) + 1;
  }, [entries, sortBy, user]);

  const columns: { key: SortKey; label: string; icon: typeof Zap }[] = [
    { key: "total_xp", label: "XP", icon: Zap },
    { key: "skills_unlocked", label: "Skills", icon: Target },
    { key: "tasks_completed", label: "Tasks", icon: Play },
  ];

  async function handleInvite() {
    const shareUrl = `${window.location.origin}/leaderboard`;
    const shareText = "I'm practicing AI-era skills on Xcrow 🦅 See where you rank!";
    if (navigator.share) {
      try { await navigator.share({ title: "Join me on Xcrow", text: shareText, url: shareUrl }); return; } catch { /* cancelled */ }
    }
    await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
    toast({ title: "Link copied!", description: "Paste it anywhere to share" });
  }

  if (!user) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center px-4">
            <Trophy className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-foreground mb-2">Sign in to view the Leaderboard</h2>
            <p className="text-sm text-muted-foreground mb-4">Compete with learners and track your progress</p>
            <Button onClick={openAuthModal}>Sign In</Button>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 sm:py-12">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Trophy className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground font-[Space_Grotesk]">Leaderboard</h1>
                <p className="text-xs text-muted-foreground">
                  {entries.length} players ranked by XP
                </p>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={handleInvite} className="gap-1.5 shrink-0">
              <Share2 className="h-3.5 w-3.5" /> Invite Friends
            </Button>
          </div>

          {/* My rank banner */}
          {myEntry && myRank > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 rounded-xl border border-primary/30 bg-primary/5 p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                  #{myRank}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Your rank</p>
                  <p className="text-xs text-muted-foreground">
                    {myEntry.total_xp.toLocaleString()} XP · {myEntry.tasks_completed} tasks completed
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <div className="text-center">
                  <p className="font-bold text-foreground text-base">{myEntry.skills_unlocked}</p>
                  <p>Skills</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-foreground text-base">{myEntry.tasks_completed}</p>
                  <p>Tasks</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Sort:</span>
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
            <div className="relative w-full sm:w-48">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search by name…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="h-9 pl-8 text-xs"
              />
            </div>
          </div>

          {/* Loading */}
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <Trophy className="h-8 w-8 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                {entries.length === 0 ? "No one on the board yet — complete a simulation to be first!" : "No results found"}
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-border overflow-hidden">
              <div className="grid grid-cols-[2.5rem_1fr_5rem_4rem_4rem] sm:grid-cols-[3rem_1fr_6rem_5rem_5rem] gap-1 px-3 sm:px-4 py-2.5 bg-muted/30 border-b border-border text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <span>#</span>
                <span>Player</span>
                <span className="text-right">XP</span>
                <span className="text-right">Skills</span>
                <span className="text-right">Tasks</span>
              </div>

              {filtered.map((entry, i) => {
                const rank = i + 1;
                const isMe = user && entry.user_id === user.id;
                return (
                  <motion.div
                    key={entry.user_id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.015, 0.5) }}
                    className={`grid grid-cols-[2.5rem_1fr_5rem_4rem_4rem] sm:grid-cols-[3rem_1fr_6rem_5rem_5rem] gap-1 px-3 sm:px-4 py-3 items-center border-b border-border/30 last:border-b-0 transition-colors ${
                      isMe ? "bg-primary/5" : "hover:bg-muted/20"
                    }`}
                  >
                    <div className="flex items-center justify-center">
                      {rank <= 3 ? RANK_ICONS[rank - 1] : (
                        <span className="text-sm font-medium text-muted-foreground">{rank}</span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className={`text-sm font-medium truncate ${isMe ? "text-primary" : "text-foreground"}`}>
                        {entry.display_name}
                        {isMe && <span className="ml-1 text-[10px] text-primary/70">(you)</span>}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className={`text-sm font-semibold tabular-nums ${sortBy === "total_xp" ? "text-primary" : "text-foreground"}`}>
                        {entry.total_xp.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className={`text-sm font-semibold tabular-nums ${sortBy === "skills_unlocked" ? "text-primary" : "text-foreground"}`}>
                        {entry.skills_unlocked}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className={`text-sm font-semibold tabular-nums ${sortBy === "tasks_completed" ? "text-primary" : "text-foreground"}`}>
                        {entry.tasks_completed}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          <div className="flex items-center justify-center gap-4 mt-6 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {entries.length} players</span>
            <span className="flex items-center gap-1"><Zap className="h-3 w-3" /> {entries.reduce((a, b) => a + b.total_xp, 0).toLocaleString()} total XP</span>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

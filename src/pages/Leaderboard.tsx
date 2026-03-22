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
  <Crown key="1" className="h-5 w-5" style={{ color: "hsl(var(--filigree-glow))" }} />,
  <Medal key="2" className="h-5 w-5" style={{ color: "hsl(var(--territory-analytical))" }} />,
  <Award key="3" className="h-5 w-5" style={{ color: "hsl(var(--territory-leadership))" }} />,
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
    { key: "tasks_completed", label: "Quests", icon: Play },
  ];

  async function handleInvite() {
    const shareUrl = `${window.location.origin}/leaderboard`;
    const shareText = "I'm conquering AI-era skills on Xcrow 🦅 See where you rank!";
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
        <main
          className="min-h-screen flex items-center justify-center"
          style={{ background: "hsl(var(--background))" }}
        >
          <div className="text-center px-4">
            <Trophy className="h-12 w-12 mx-auto mb-4" style={{ color: "hsl(var(--filigree) / 0.3)" }} />
            <h2
              className="text-xl font-bold text-foreground mb-2"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              Sign in to view the Hall of Champions
            </h2>
            <p className="text-sm text-muted-foreground mb-4">Compete with warriors and track your conquest</p>
            <Button onClick={openAuthModal} style={{ fontFamily: "'Cinzel', serif" }}>Enter Realm</Button>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen" style={{ background: "hsl(var(--background))" }}>
        <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 sm:py-12">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div
                className="h-10 w-10 rounded-xl flex items-center justify-center"
                style={{ background: "hsl(var(--filigree-glow) / 0.15)" }}
              >
                <Trophy className="h-5 w-5" style={{ color: "hsl(var(--filigree-glow))" }} />
              </div>
              <div>
                <h1
                  className="text-2xl font-bold text-foreground"
                  style={{ fontFamily: "'Cinzel', serif", textShadow: "0 0 16px hsl(var(--filigree-glow) / 0.2)" }}
                >
                  Hall of Champions
                </h1>
                <p className="text-xs text-muted-foreground">
                  {entries.length} warriors ranked by XP
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleInvite}
              className="gap-1.5 shrink-0"
              style={{
                background: "hsl(var(--surface-stone))",
                border: "1px solid hsl(var(--filigree) / 0.2)",
                fontFamily: "'Cinzel', serif",
                letterSpacing: "0.04em",
              }}
            >
              <Share2 className="h-3.5 w-3.5" /> Invite
            </Button>
          </div>

          {/* My rank banner */}
          {myEntry && myRank > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 rounded-xl p-4 flex items-center justify-between"
              style={{
                background: "linear-gradient(135deg, hsl(var(--surface-stone)), hsl(var(--filigree-glow) / 0.08))",
                border: "1px solid hsl(var(--filigree) / 0.3)",
                boxShadow: "inset 0 1px 0 hsl(var(--emboss-light)), 0 4px 16px hsl(var(--emboss-shadow))",
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{
                    background: "hsl(var(--filigree-glow) / 0.15)",
                    color: "hsl(var(--filigree-glow))",
                    fontFamily: "'Cinzel', serif",
                  }}
                >
                  #{myRank}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground" style={{ fontFamily: "'Cinzel', serif" }}>Your Rank</p>
                  <p className="text-xs text-muted-foreground">
                    {myEntry.total_xp.toLocaleString()} XP · {myEntry.tasks_completed} quests completed
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <div className="text-center">
                  <p className="font-bold text-foreground text-base" style={{ fontFamily: "'Cinzel', serif" }}>{myEntry.skills_unlocked}</p>
                  <p>Skills</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-foreground text-base" style={{ fontFamily: "'Cinzel', serif" }}>{myEntry.tasks_completed}</p>
                  <p>Quests</p>
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
                <button
                  key={col.key}
                  onClick={() => setSortBy(col.key)}
                  className="flex items-center gap-1 text-xs h-7 px-2.5 py-1 rounded-md transition-all"
                  style={{
                    fontFamily: "'Cinzel', serif",
                    letterSpacing: "0.04em",
                    ...(sortBy === col.key
                      ? { color: "hsl(var(--filigree-glow))", background: "hsl(var(--filigree) / 0.1)", textShadow: "0 0 6px hsl(var(--filigree-glow) / 0.3)" }
                      : { color: "hsl(var(--muted-foreground))" }),
                  }}
                >
                  <col.icon className="h-3 w-3" />
                  {col.label}
                </button>
              ))}
            </div>
            <div className="relative w-full sm:w-48">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search warriors…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="h-9 pl-8 text-xs"
                style={{ background: "hsl(var(--surface-stone))", border: "1px solid hsl(var(--filigree) / 0.15)" }}
              />
            </div>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <Trophy className="h-8 w-8 mx-auto mb-3" style={{ color: "hsl(var(--filigree) / 0.2)" }} />
              <p className="text-sm text-muted-foreground" style={{ fontFamily: "'Cinzel', serif" }}>
                {entries.length === 0 ? "The hall is empty — complete a quest to claim your place!" : "No warriors found"}
              </p>
            </div>
          ) : (
            <div
              className="rounded-xl overflow-hidden"
              style={{
                border: "1px solid hsl(var(--filigree) / 0.2)",
                boxShadow: "0 4px 20px hsl(var(--emboss-shadow))",
              }}
            >
              <div
                className="grid grid-cols-[2.5rem_1fr_5rem_4rem_4rem] sm:grid-cols-[3rem_1fr_6rem_5rem_5rem] gap-1 px-3 sm:px-4 py-2.5 text-[10px] sm:text-xs font-medium uppercase tracking-[0.1em]"
                style={{
                  background: "hsl(var(--surface-stone))",
                  borderBottom: "1px solid hsl(var(--filigree) / 0.15)",
                  color: "hsl(var(--filigree))",
                  fontFamily: "'Cinzel', serif",
                }}
              >
                <span>#</span>
                <span>Warrior</span>
                <span className="text-right">XP</span>
                <span className="text-right">Skills</span>
                <span className="text-right">Quests</span>
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
                    className="grid grid-cols-[2.5rem_1fr_5rem_4rem_4rem] sm:grid-cols-[3rem_1fr_6rem_5rem_5rem] gap-1 px-3 sm:px-4 py-3 items-center transition-colors"
                    style={{
                      borderBottom: "1px solid hsl(var(--border) / 0.2)",
                      background: isMe ? "hsl(var(--filigree-glow) / 0.05)" : "transparent",
                    }}
                  >
                    <div className="flex items-center justify-center">
                      {rank <= 3 ? RANK_ICONS[rank - 1] : (
                        <span className="text-sm font-medium text-muted-foreground">{rank}</span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className={`text-sm font-medium truncate ${isMe ? "" : "text-foreground"}`}
                        style={isMe ? { color: "hsl(var(--filigree-glow))" } : undefined}
                      >
                        {entry.display_name}
                        {isMe && <span className="ml-1 text-[10px]" style={{ color: "hsl(var(--filigree) / 0.6)" }}>(you)</span>}
                      </p>
                    </div>

                    <div className="text-right">
                      <span
                        className="text-sm font-semibold tabular-nums"
                        style={{ color: sortBy === "total_xp" ? "hsl(var(--filigree-glow))" : "hsl(var(--foreground))" }}
                      >
                        {entry.total_xp.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-right">
                      <span
                        className="text-sm font-semibold tabular-nums"
                        style={{ color: sortBy === "skills_unlocked" ? "hsl(var(--filigree-glow))" : "hsl(var(--foreground))" }}
                      >
                        {entry.skills_unlocked}
                      </span>
                    </div>
                    <div className="text-right">
                      <span
                        className="text-sm font-semibold tabular-nums"
                        style={{ color: sortBy === "tasks_completed" ? "hsl(var(--filigree-glow))" : "hsl(var(--foreground))" }}
                      >
                        {entry.tasks_completed}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          <div className="flex items-center justify-center gap-4 mt-6 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {entries.length} warriors</span>
            <span className="flex items-center gap-1">
              <Zap className="h-3 w-3" style={{ color: "hsl(var(--filigree-glow))" }} />
              {entries.reduce((a, b) => a + b.total_xp, 0).toLocaleString()} total XP
            </span>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

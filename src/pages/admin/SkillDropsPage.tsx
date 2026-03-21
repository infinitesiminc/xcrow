import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2, Sparkles, Trash2, Clock, Zap, Crown, CircleDot,
  RefreshCw, Plus, Eye, EyeOff, Play, Pause, Users,
  TrendingUp, Target, BarChart3, Calendar, Award,
  CheckCircle2, XCircle, GitMerge, Brain, ArrowRight,
} from "lucide-react";
import { format, formatDistanceToNow, isPast, isFuture, addDays, addHours } from "date-fns";

/* ── types ─────────────────────── */

interface DropEvent {
  id: string;
  title: string;
  description: string | null;
  skill_id: string | null;
  rarity: string;
  status: string;
  starts_at: string | null;
  ends_at: string | null;
  tier_1_label: string;
  tier_1_threshold: number;
  tier_2_label: string;
  tier_2_threshold: number;
  tier_3_label: string;
  tier_3_threshold: number;
  tier_3_perfect_required: boolean;
  banner_emoji: string | null;
  created_at: string;
}

interface Participation {
  event_id: string;
  user_id: string;
  sims_completed: number;
  best_score: number;
  tier_earned: string | null;
  joined_at: string;
}

interface TrendingSkill {
  skill_name: string;
  demand_count: number;
  avg_exposure: number;
  avg_impact: number;
}

interface DiscoverySuggestion {
  id: string;
  skill_name: string;
  category: string;
  demand_count: number;
  job_count: number;
  avg_exposure: number;
  avg_impact: number;
  ai_analysis: {
    action: string;
    reasoning: string;
    merge_target: string | null;
    trend_signal: string;
    priority: string;
  };
  action: string;
  merge_target_id: string | null;
  status: string;
  discovered_at: string;
}

/* ── constants ─────────────────── */

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  active: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  ended: "bg-amber-500/20 text-amber-400 border-amber-500/30",
};

const RARITY_EMOJI: Record<string, string> = {
  rare: "💎",
  epic: "🔥",
  legendary: "👑",
};

/* ── page ──────────────────────── */

export default function SkillDropsPage() {
  const { toast } = useToast();
  const [events, setEvents] = useState<DropEvent[]>([]);
  const [participations, setParticipations] = useState<Participation[]>([]);
  const [trending, setTrending] = useState<TrendingSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const [suggestions, setSuggestions] = useState<DiscoverySuggestion[]>([]);
  const [discovering, setDiscovering] = useState(false);

  // Create form
  const [form, setForm] = useState({
    title: "",
    description: "",
    rarity: "rare",
    banner_emoji: "⚔️",
    duration_hours: 72,
    tier_1_threshold: 1,
    tier_2_threshold: 3,
    tier_3_threshold: 5,
    tier_3_perfect: true,
  });

  const fetchAll = useCallback(async () => {
    const [eventsRes, partRes, trendRes, suggestionsRes] = await Promise.all([
      supabase.from("skill_drop_events").select("*").order("created_at", { ascending: false }),
      supabase.from("skill_drop_participations").select("*"),
      supabase.rpc("get_future_skill_demand" as any, { top_n: 20 }),
      supabase.from("skill_discovery_suggestions" as any).select("*").order("discovered_at", { ascending: false }).limit(50),
    ]);
    setEvents((eventsRes.data as any) || []);
    setParticipations((partRes.data as any) || []);
    setTrending((trendRes.data as any) || []);
    setSuggestions((suggestionsRes.data as any) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const runDiscovery = async () => {
    setDiscovering(true);
    try {
      const { data, error } = await supabase.functions.invoke("discover-trending-skills", { body: { source: "manual" } });
      if (error) throw error;
      toast({ title: "Discovery complete! 🔍", description: `Found ${data?.suggestions || 0} new skill suggestions` });
      fetchAll();
    } catch (err: any) {
      toast({ title: "Discovery failed", description: err.message, variant: "destructive" });
    } finally {
      setDiscovering(false);
    }
  };

  const reviewSuggestion = async (id: string, status: "approved" | "rejected") => {
    const suggestion = suggestions.find(s => s.id === id);
    if (!suggestion) return;

    // If approved and action is "new", add to canonical catalogue
    if (status === "approved" && suggestion.action === "new") {
      const skillId = suggestion.skill_name.toLowerCase().trim()
        .replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-').slice(0, 80);
      await supabase.from("canonical_future_skills").upsert({
        id: skillId,
        name: suggestion.skill_name,
        category: suggestion.category,
        demand_count: suggestion.demand_count,
        job_count: suggestion.job_count,
        avg_relevance: suggestion.avg_exposure,
      } as any, { onConflict: "id" });
    }

    // If approved and action is "alias"/"merge", add alias to existing
    if (status === "approved" && (suggestion.action === "merge" || suggestion.action === "alias") && suggestion.merge_target_id) {
      const { data: target } = await supabase
        .from("canonical_future_skills")
        .select("aliases, demand_count")
        .eq("id", suggestion.merge_target_id)
        .single();
      if (target) {
        const aliases = [...((target as any).aliases || []), suggestion.skill_name].slice(0, 10);
        await supabase.from("canonical_future_skills").update({
          aliases,
          demand_count: ((target as any).demand_count || 0) + suggestion.demand_count,
        } as any).eq("id", suggestion.merge_target_id);
      }
    }

    await (supabase.from("skill_discovery_suggestions" as any) as any)
      .update({ status, reviewed_at: new Date().toISOString() })
      .eq("id", id);

    setSuggestions(prev => prev.map(s => s.id === id ? { ...s, status } : s));
    toast({ title: status === "approved" ? "Skill approved ✅" : "Skill rejected" });
  };

  const createEvent = async () => {
    setCreating(true);
    try {
      const startsAt = new Date();
      const endsAt = addHours(startsAt, form.duration_hours);
      const { error } = await supabase.from("skill_drop_events").insert({
        title: form.title,
        description: form.description || null,
        rarity: form.rarity,
        banner_emoji: form.banner_emoji,
        status: "draft",
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
        tier_1_threshold: form.tier_1_threshold,
        tier_2_threshold: form.tier_2_threshold,
        tier_3_threshold: form.tier_3_threshold,
        tier_3_perfect_required: form.tier_3_perfect,
      } as any);
      if (error) throw error;
      toast({ title: "Event created! 🎯", description: `"${form.title}" saved as draft` });
      setForm({ title: "", description: "", rarity: "rare", banner_emoji: "⚔️", duration_hours: 72, tier_1_threshold: 1, tier_2_threshold: 3, tier_3_threshold: 5, tier_3_perfect: true });
      setShowCreate(false);
      fetchAll();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const toggleStatus = async (event: DropEvent, newStatus: string) => {
    const { error } = await supabase
      .from("skill_drop_events")
      .update({ status: newStatus } as any)
      .eq("id", event.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Event ${newStatus}` });
      fetchAll();
    }
  };

  const deleteEvent = async (id: string) => {
    const { error } = await (supabase.from("skill_drop_events") as any).delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setEvents(prev => prev.filter(e => e.id !== id));
      toast({ title: "Event deleted" });
    }
  };

  const getEventStats = (eventId: string) => {
    const parts = participations.filter(p => p.event_id === eventId);
    const total = parts.length;
    const completed = parts.filter(p => p.sims_completed > 0).length;
    const avgScore = total > 0 ? Math.round(parts.reduce((s, p) => s + p.best_score, 0) / total) : 0;
    const tierCounts = { rare: 0, epic: 0, legendary: 0 };
    parts.forEach(p => {
      if (p.tier_earned && tierCounts[p.tier_earned as keyof typeof tierCounts] !== undefined) {
        tierCounts[p.tier_earned as keyof typeof tierCounts]++;
      }
    });
    return { total, completed, avgScore, tierCounts };
  };

  const activeEvents = events.filter(e => e.status === "active");
  const draftEvents = events.filter(e => e.status === "draft");
  const endedEvents = events.filter(e => e.status === "ended");

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            Skill Drop Events
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create time-limited challenges with tiered badge rewards
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchAll}>
            <RefreshCw className="h-3 w-3 mr-1" /> Refresh
          </Button>
          <Button size="sm" onClick={() => setShowCreate(!showCreate)}>
            <Plus className="h-3 w-3 mr-1" /> New Event
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        {[
          { label: "Active Events", value: activeEvents.length, icon: Zap, cls: "text-emerald-400" },
          { label: "Draft Events", value: draftEvents.length, icon: Eye, cls: "text-muted-foreground" },
          { label: "Total Participants", value: participations.length, icon: Users, cls: "text-primary" },
          { label: "Ended Events", value: endedEvents.length, icon: Clock, cls: "text-amber-400" },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className={`h-5 w-5 ${s.cls}`} />
              <div>
                <p className="text-xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="events" className="space-y-4">
        <TabsList>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="discover">Auto-Discover</TabsTrigger>
        </TabsList>

        {/* Events Tab */}
        <TabsContent value="events" className="space-y-4">
          {/* Create Form */}
          {showCreate && (
            <Card className="border-primary/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Plus className="h-4 w-4" /> Create Skill Drop Event
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Event Title</Label>
                    <Input
                      placeholder="e.g. Prompt Engineering Sprint"
                      value={form.title}
                      onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Banner Emoji</Label>
                    <Input
                      placeholder="⚔️"
                      value={form.banner_emoji}
                      onChange={e => setForm(f => ({ ...f, banner_emoji: e.target.value }))}
                      className="w-20"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Description</Label>
                  <Textarea
                    placeholder="What's this event about?"
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    rows={2}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label>Rarity Tier</Label>
                    <Select value={form.rarity} onValueChange={v => setForm(f => ({ ...f, rarity: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rare">💎 Rare</SelectItem>
                        <SelectItem value="epic">🔥 Epic</SelectItem>
                        <SelectItem value="legendary">👑 Legendary</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Duration (hours)</Label>
                    <Input
                      type="number"
                      value={form.duration_hours}
                      onChange={e => setForm(f => ({ ...f, duration_hours: parseInt(e.target.value) || 72 }))}
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={form.tier_3_perfect}
                        onCheckedChange={v => setForm(f => ({ ...f, tier_3_perfect: v }))}
                      />
                      <Label className="text-xs">Perfect score for Legendary</Label>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Tier thresholds */}
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">Tier Thresholds (simulations required)</Label>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs flex items-center gap-1"><CircleDot className="h-3 w-3 text-cyan-400" /> Rare</Label>
                      <Input type="number" value={form.tier_1_threshold} onChange={e => setForm(f => ({ ...f, tier_1_threshold: parseInt(e.target.value) || 1 }))} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs flex items-center gap-1"><Zap className="h-3 w-3 text-purple-400" /> Epic</Label>
                      <Input type="number" value={form.tier_2_threshold} onChange={e => setForm(f => ({ ...f, tier_2_threshold: parseInt(e.target.value) || 3 }))} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs flex items-center gap-1"><Crown className="h-3 w-3 text-amber-400" /> Legendary</Label>
                      <Input type="number" value={form.tier_3_threshold} onChange={e => setForm(f => ({ ...f, tier_3_threshold: parseInt(e.target.value) || 5 }))} />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button variant="ghost" size="sm" onClick={() => setShowCreate(false)}>Cancel</Button>
                  <Button size="sm" onClick={createEvent} disabled={creating || !form.title.trim()}>
                    {creating ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Sparkles className="h-3 w-3 mr-1" />}
                    Create Event
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Active Events */}
          {activeEvents.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                <Zap className="h-4 w-4" /> Live Events ({activeEvents.length})
              </h2>
              <div className="grid gap-3">
                {activeEvents.map(e => (
                  <EventCard key={e.id} event={e} stats={getEventStats(e.id)} onToggle={toggleStatus} onDelete={deleteEvent} />
                ))}
              </div>
            </div>
          )}

          {/* Draft Events */}
          {draftEvents.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Eye className="h-4 w-4" /> Drafts ({draftEvents.length})
              </h2>
              <div className="grid gap-3">
                {draftEvents.map(e => (
                  <EventCard key={e.id} event={e} stats={getEventStats(e.id)} onToggle={toggleStatus} onDelete={deleteEvent} />
                ))}
              </div>
            </div>
          )}

          {/* Ended Events */}
          {endedEvents.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-amber-400/60 flex items-center gap-2">
                <Clock className="h-4 w-4" /> Ended ({endedEvents.length})
              </h2>
              <div className="grid gap-3">
                {endedEvents.map(e => (
                  <EventCard key={e.id} event={e} stats={getEventStats(e.id)} onToggle={toggleStatus} onDelete={deleteEvent} />
                ))}
              </div>
            </div>
          )}

          {events.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Sparkles className="h-8 w-8 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No events yet. Create your first Skill Drop!</p>
            </div>
          )}
        </TabsContent>

        {/* Auto-Discover Tab */}
        <TabsContent value="discover" className="space-y-4">
          {/* AI Discovery Feed */}
          <Card className="border-primary/20">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Brain className="h-4 w-4 text-primary" />
                    AI Skill Discovery Feed
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    AI-analyzed emerging skills from job market data. Runs daily at 6 AM UTC.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={runDiscovery}
                  disabled={discovering}
                  className="shrink-0"
                >
                  {discovering ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  ) : (
                    <RefreshCw className="h-3 w-3 mr-1" />
                  )}
                  {discovering ? "Analyzing..." : "Run Discovery"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {(() => {
                const pending = suggestions.filter(s => s.status === "pending");
                const reviewed = suggestions.filter(s => s.status !== "pending");

                if (suggestions.length === 0 && !discovering) {
                  return (
                    <div className="text-center py-8 text-muted-foreground">
                      <Brain className="h-8 w-8 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">No suggestions yet. Click "Run Discovery" to analyze trending skills.</p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-4">
                    {/* Pending Suggestions */}
                    {pending.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-primary flex items-center gap-1.5">
                          <Sparkles className="h-3 w-3" /> Pending Review ({pending.length})
                        </h3>
                        {pending.map(s => (
                          <SuggestionCard
                            key={s.id}
                            suggestion={s}
                            onReview={reviewSuggestion}
                            onCreateEvent={(name, demand, exposure) => {
                              setForm(f => ({
                                ...f,
                                title: `${name} Sprint`,
                                description: `Master ${name} — trending in ${demand}+ roles with ${exposure}% AI exposure.`,
                              }));
                              setShowCreate(true);
                            }}
                          />
                        ))}
                      </div>
                    )}

                    {/* Reviewed */}
                    {reviewed.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                          <CheckCircle2 className="h-3 w-3" /> Reviewed ({reviewed.length})
                        </h3>
                        {reviewed.slice(0, 5).map(s => (
                          <SuggestionCard key={s.id} suggestion={s} onReview={reviewSuggestion} onCreateEvent={() => {}} />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          {/* Existing trending market data */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Future Skills Demand — Level 2
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Top uncatalogued future skills from AI predictions across analyzed roles. Click to create an event.
              </p>
            </CardHeader>
            <CardContent>
              {trending.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No skill demand data yet</p>
              ) : (
                <div className="space-y-2">
                  {trending.map((skill, i) => (
                    <div
                      key={skill.skill_name}
                      className="flex items-center gap-3 p-2.5 rounded-lg border border-border/50 hover:border-primary/30 hover:bg-muted/30 transition-colors group"
                    >
                      <span className="text-xs font-mono text-muted-foreground w-5 text-right shrink-0">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{skill.skill_name}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Target className="h-2.5 w-2.5" /> {skill.demand_count} roles
                          </span>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Zap className="h-2.5 w-2.5" /> AI {skill.avg_exposure}%
                          </span>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <BarChart3 className="h-2.5 w-2.5" /> Impact {skill.avg_impact}%
                          </span>
                        </div>
                      </div>
                      <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden shrink-0">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-primary to-primary/50"
                          style={{ width: `${skill.avg_exposure}%` }}
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                        onClick={() => {
                          setForm(f => ({
                            ...f,
                            title: `${skill.skill_name} Sprint`,
                            description: `Master ${skill.skill_name} — demanded by ${skill.demand_count}+ roles with ${skill.avg_exposure}% AI exposure.`,
                          }));
                          setShowCreate(true);
                        }}
                      >
                        <Plus className="h-3 w-3 mr-1" /> Create Event
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ── Event Card ────────────────── */

function EventCard({
  event,
  stats,
  onToggle,
  onDelete,
}: {
  event: DropEvent;
  stats: { total: number; completed: number; avgScore: number; tierCounts: Record<string, number> };
  onToggle: (event: DropEvent, status: string) => void;
  onDelete: (id: string) => void;
}) {
  const isLive = event.status === "active";
  const isDraft = event.status === "draft";
  const isEnded = event.status === "ended";
  const hasExpired = event.ends_at && isPast(new Date(event.ends_at));
  const startsInFuture = event.starts_at && isFuture(new Date(event.starts_at));

  return (
    <Card className={`border ${isLive ? "border-emerald-500/30" : "border-border/50"} ${isEnded ? "opacity-60" : ""}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <span className="text-2xl shrink-0">{event.banner_emoji || "⚔️"}</span>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-sm">{event.title}</h3>
                <Badge variant="outline" className={`text-[10px] ${STATUS_COLORS[event.status] || ""}`}>
                  {event.status}
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  {RARITY_EMOJI[event.rarity] || "💎"} {event.rarity}
                </Badge>
              </div>
              {event.description && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{event.description}</p>
              )}
              <div className="flex items-center gap-3 mt-2 flex-wrap text-[10px] text-muted-foreground">
                {event.starts_at && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-2.5 w-2.5" />
                    {format(new Date(event.starts_at), "MMM d, h:mm a")}
                  </span>
                )}
                {event.ends_at && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-2.5 w-2.5" />
                    {hasExpired
                      ? `Ended ${formatDistanceToNow(new Date(event.ends_at), { addSuffix: true })}`
                      : `Ends ${formatDistanceToNow(new Date(event.ends_at), { addSuffix: true })}`
                    }
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Award className="h-2.5 w-2.5" />
                  {event.tier_1_threshold}→{event.tier_2_threshold}→{event.tier_3_threshold} sims
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {isDraft && (
              <Button variant="outline" size="sm" className="h-7 text-xs text-emerald-400 border-emerald-500/30" onClick={() => onToggle(event, "active")}>
                <Play className="h-3 w-3 mr-1" /> Launch
              </Button>
            )}
            {isLive && (
              <Button variant="outline" size="sm" className="h-7 text-xs text-amber-400 border-amber-500/30" onClick={() => onToggle(event, "ended")}>
                <Pause className="h-3 w-3 mr-1" /> End
              </Button>
            )}
            {isEnded && (
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => onToggle(event, "active")}>
                <Play className="h-3 w-3 mr-1" /> Relaunch
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => onDelete(event.id)}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Live Analytics */}
        {(isLive || isEnded) && stats.total > 0 && (
          <div className="mt-3 pt-3 border-t border-border/30 grid grid-cols-4 gap-3">
            <div>
              <p className="text-lg font-bold">{stats.total}</p>
              <p className="text-[10px] text-muted-foreground">Participants</p>
            </div>
            <div>
              <p className="text-lg font-bold">{stats.completed}</p>
              <p className="text-[10px] text-muted-foreground">Completed</p>
            </div>
            <div>
              <p className="text-lg font-bold">{stats.avgScore}%</p>
              <p className="text-[10px] text-muted-foreground">Avg Score</p>
            </div>
            <div className="flex items-center gap-1.5">
              {stats.tierCounts.rare > 0 && <Badge variant="outline" className="text-[9px] text-cyan-400 border-cyan-500/30">💎 {stats.tierCounts.rare}</Badge>}
              {stats.tierCounts.epic > 0 && <Badge variant="outline" className="text-[9px] text-purple-400 border-purple-500/30">🔥 {stats.tierCounts.epic}</Badge>}
              {stats.tierCounts.legendary > 0 && <Badge variant="outline" className="text-[9px] text-amber-400 border-amber-500/30">👑 {stats.tierCounts.legendary}</Badge>}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ── Suggestion Card ───────────── */

const ACTION_CONFIG: Record<string, { icon: typeof Plus; label: string; cls: string }> = {
  new: { icon: Plus, label: "New Skill", cls: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" },
  merge: { icon: GitMerge, label: "Merge", cls: "text-amber-400 border-amber-500/30 bg-amber-500/10" },
  alias: { icon: ArrowRight, label: "Alias", cls: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10" },
  ignore: { icon: XCircle, label: "Ignore", cls: "text-muted-foreground border-border bg-muted/30" },
};

const TREND_COLORS: Record<string, string> = {
  rising: "text-emerald-400",
  emerging: "text-primary",
  stable: "text-muted-foreground",
};

const PRIORITY_COLORS: Record<string, string> = {
  high: "bg-destructive/20 text-destructive border-destructive/30",
  medium: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  low: "bg-muted text-muted-foreground border-border",
};

function SuggestionCard({
  suggestion: s,
  onReview,
  onCreateEvent,
}: {
  suggestion: DiscoverySuggestion;
  onReview: (id: string, status: "approved" | "rejected") => void;
  onCreateEvent: (name: string, demand: number, exposure: number) => void;
}) {
  const isPending = s.status === "pending";
  const actionCfg = ACTION_CONFIG[s.action] || ACTION_CONFIG.new;
  const ActionIcon = actionCfg.icon;

  return (
    <div className={`p-3 rounded-lg border transition-colors ${isPending ? "border-border/50 hover:border-primary/30" : "border-border/30 opacity-60"}`}>
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold">{s.skill_name}</p>
            <Badge variant="outline" className={`text-[9px] ${actionCfg.cls}`}>
              <ActionIcon className="h-2.5 w-2.5 mr-0.5" />
              {actionCfg.label}
            </Badge>
            <Badge variant="outline" className={`text-[9px] ${PRIORITY_COLORS[s.ai_analysis.priority] || ""}`}>
              {s.ai_analysis.priority}
            </Badge>
            <span className={`text-[10px] font-medium ${TREND_COLORS[s.ai_analysis.trend_signal] || ""}`}>
              ↗ {s.ai_analysis.trend_signal}
            </span>
            {s.status !== "pending" && (
              <Badge variant="outline" className={`text-[9px] ${s.status === "approved" ? "text-emerald-400 border-emerald-500/30" : "text-destructive border-destructive/30"}`}>
                {s.status}
              </Badge>
            )}
          </div>

          <p className="text-xs text-muted-foreground mt-1">{s.ai_analysis.reasoning}</p>

          {s.ai_analysis.merge_target && (
            <p className="text-[10px] text-amber-400 mt-1 flex items-center gap-1">
              <GitMerge className="h-2.5 w-2.5" /> Merge into: <span className="font-medium">{s.ai_analysis.merge_target}</span>
            </p>
          )}

          <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Target className="h-2.5 w-2.5" /> {s.job_count} jobs
            </span>
            <span className="flex items-center gap-1">
              <TrendingUp className="h-2.5 w-2.5" /> {s.demand_count} mentions
            </span>
            <span className="flex items-center gap-1">
              <Zap className="h-2.5 w-2.5" /> AI {s.avg_exposure}%
            </span>
            <span className="flex items-center gap-1">
              <BarChart3 className="h-2.5 w-2.5" /> Impact {s.avg_impact}%
            </span>
            <Badge variant="outline" className="text-[9px]">{s.category}</Badge>
          </div>
        </div>

        {isPending && (
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs text-emerald-400 border-emerald-500/30"
              onClick={() => onReview(s.id, "approved")}
            >
              <CheckCircle2 className="h-3 w-3 mr-1" /> Approve
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground"
              onClick={() => onReview(s.id, "rejected")}
            >
              <XCircle className="h-3 w-3 mr-1" /> Reject
            </Button>
            {s.action === "new" && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => onCreateEvent(s.skill_name, s.demand_count, s.avg_exposure)}
              >
                <Sparkles className="h-3 w-3 mr-1" /> Drop Event
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

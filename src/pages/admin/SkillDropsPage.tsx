import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2, Sparkles, Trash2, Clock, Zap, Crown, CircleDot,
  RefreshCw, Plus,
} from "lucide-react";
import { formatDistanceToNow, isPast } from "date-fns";

interface SkillDrop {
  id: string;
  name: string;
  category: string;
  rarity: string;
  description: string | null;
  icon_emoji: string | null;
  ai_exposure: number;
  human_edge: string | null;
  unlock_type: string;
  is_default: boolean;
  drop_expires_at: string | null;
  created_at: string;
}

const RARITY_CONFIG: Record<string, { color: string; icon: typeof CircleDot; label: string }> = {
  common: { color: "text-muted-foreground border-border", icon: CircleDot, label: "Common" },
  rare: { color: "text-cyan-400 border-cyan-500/40", icon: Zap, label: "Rare" },
  legendary: { color: "text-amber-400 border-amber-500/40", icon: Crown, label: "Legendary" },
};

export default function SkillDropsPage() {
  const { toast } = useToast();
  const [skills, setSkills] = useState<SkillDrop[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Generator form
  const [theme, setTheme] = useState("");
  const [rarity, setRarity] = useState("rare");

  const fetchSkills = useCallback(async () => {
    const { data } = await supabase
      .from("skills")
      .select("*")
      .order("created_at", { ascending: false });
    setSkills((data as any as SkillDrop[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSkills();
  }, [fetchSkills]);

  const generateDrop = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("skill-drops", {
        body: { action: "generate_drop", payload: { theme: theme || undefined, rarity } },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: "Skill dropped! 🎉", description: `${data.skill.icon_emoji} ${data.skill.name} (${rarity})` });
      setTheme("");
      fetchSkills();
    } catch (err: any) {
      toast({ title: "Generation failed", description: err.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const deleteDrop = async (id: string) => {
    setDeleting(id);
    const { error } = await (supabase.from("skills") as any).delete().eq("id", id);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    } else {
      setSkills((prev) => prev.filter((s) => s.id !== id));
      toast({ title: "Skill removed" });
    }
    setDeleting(null);
  };

  const drops = skills.filter((s) => !s.is_default);
  const defaults = skills.filter((s) => s.is_default);
  const activeDrops = drops.filter((s) => !s.drop_expires_at || !isPast(new Date(s.drop_expires_at)));
  const expiredDrops = drops.filter((s) => s.drop_expires_at && isPast(new Date(s.drop_expires_at)));

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            Skill Drops
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Generate AI-powered skill drops that appear on the territory map with expiration timers
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchSkills}>
          <RefreshCw className="h-3 w-3 mr-1" />
          Refresh
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: "Default Skills", value: defaults.length, icon: CircleDot, cls: "text-muted-foreground" },
          { label: "Active Drops", value: activeDrops.length, icon: Zap, cls: "text-cyan-400" },
          { label: "Expired Drops", value: expiredDrops.length, icon: Clock, cls: "text-amber-400" },
          { label: "Total Skills", value: skills.length, icon: Sparkles, cls: "text-primary" },
        ].map((s) => (
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

      <Separator />

      {/* Generate new drop */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Generate New Drop
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="theme">Theme / Industry (optional)</Label>
              <Input
                id="theme"
                placeholder="e.g. healthcare, fintech, creative"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Rarity</Label>
              <Select value={rarity} onValueChange={setRarity}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="common">Common (14 day expiry)</SelectItem>
                  <SelectItem value="rare">Rare (7 day expiry)</SelectItem>
                  <SelectItem value="legendary">Legendary (3 day expiry)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={generateDrop} disabled={generating} className="w-full">
                {generating ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                {generating ? "Generating..." : "Drop Skill"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active drops */}
      {activeDrops.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Zap className="h-4 w-4 text-cyan-400" />
            Active Drops ({activeDrops.length})
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {activeDrops.map((skill) => (
              <SkillDropCard
                key={skill.id}
                skill={skill}
                onDelete={deleteDrop}
                deleting={deleting}
              />
            ))}
          </div>
        </div>
      )}

      {/* Expired drops */}
      {expiredDrops.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            Expired Drops ({expiredDrops.length})
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {expiredDrops.map((skill) => (
              <SkillDropCard
                key={skill.id}
                skill={skill}
                onDelete={deleteDrop}
                deleting={deleting}
                expired
              />
            ))}
          </div>
        </div>
      )}

      {/* Default skills summary */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold flex items-center gap-2 text-muted-foreground">
          <CircleDot className="h-4 w-4" />
          Default Skills ({defaults.length})
        </h2>
        <div className="flex flex-wrap gap-2">
          {defaults.map((s) => (
            <Badge key={s.id} variant="outline" className="text-xs">
              {s.icon_emoji || "●"} {s.name}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}

function SkillDropCard({
  skill,
  onDelete,
  deleting,
  expired = false,
}: {
  skill: SkillDrop;
  onDelete: (id: string) => void;
  deleting: string | null;
  expired?: boolean;
}) {
  const cfg = RARITY_CONFIG[skill.rarity] || RARITY_CONFIG.common;
  const Icon = cfg.icon;

  return (
    <Card className={`relative ${expired ? "opacity-60" : ""} border ${expired ? "border-border" : cfg.color.split(" ")[1]}`}>
      <CardContent className="p-4 space-y-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{skill.icon_emoji || "🔮"}</span>
            <div>
              <p className="font-semibold text-sm">{skill.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Badge variant="outline" className={`text-[10px] ${cfg.color}`}>
                  <Icon className="h-2.5 w-2.5 mr-0.5" />
                  {cfg.label}
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  {skill.category}
                </Badge>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={() => onDelete(skill.id)}
            disabled={deleting === skill.id}
          >
            {deleting === skill.id ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Trash2 className="h-3 w-3" />
            )}
          </Button>
        </div>

        {skill.description && (
          <p className="text-xs text-muted-foreground">{skill.description}</p>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>AI Exposure: {skill.ai_exposure}%</span>
          {skill.drop_expires_at && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {expired
                ? `Expired ${formatDistanceToNow(new Date(skill.drop_expires_at), { addSuffix: true })}`
                : `Expires ${formatDistanceToNow(new Date(skill.drop_expires_at), { addSuffix: true })}`}
            </span>
          )}
        </div>

        {skill.human_edge && (
          <p className="text-[11px] text-primary/70 italic">🧠 {skill.human_edge}</p>
        )}
      </CardContent>
    </Card>
  );
}

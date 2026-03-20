/**
 * MyRolesPanel — inline content view showing saved & practiced roles.
 * Designed to fill the right panel space when the "My Roles" tab is active.
 */
import { useState, useEffect } from "react";
import { Bookmark, Play, Trophy, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { RoleCard, type RoleResult } from "@/components/InlineRoleCarousel";

interface MyRolesPanelProps {
  onSelectRole: (role: RoleResult) => void;
  onAskChat: (prompt: string) => void;
  onTabChange?: (tab: "saved" | "practiced") => void;
}

export default function MyRolesPanel({ onSelectRole, onAskChat, onTabChange }: MyRolesPanelProps) {
  const { user } = useAuth();
  const [tab, setTab] = useState<"saved" | "practiced">("saved");
  const [search, setSearch] = useState("");
  const [savedRoles, setSavedRoles] = useState<RoleResult[]>([]);
  const [practicedRoles, setPracticedRoles] = useState<RoleResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);

    Promise.all([
      supabase
        .from("bookmarked_roles")
        .select("job_title, company, augmented_percent, automation_risk_percent")
        .eq("user_id", user.id)
        .order("bookmarked_at", { ascending: false })
        .limit(20),
      supabase
        .from("completed_simulations")
        .select("job_title, company, completed_at")
        .eq("user_id", user.id)
        .order("completed_at", { ascending: false })
        .limit(50),
    ]).then(([savedRes, practicedRes]) => {
      const saved: RoleResult[] = (savedRes.data || []).map((r: any) => ({
        jobId: `saved-${r.job_title}-${r.company || ""}`,
        title: r.job_title,
        company: r.company,
        logo: null,
        location: null,
        country: null,
        workMode: null,
        seniority: null,
        augmented: r.augmented_percent || 0,
        risk: r.automation_risk_percent || 0,
      }));
      setSavedRoles(saved);

      const seen = new Set<string>();
      const practiced: RoleResult[] = [];
      for (const r of practicedRes.data || []) {
        const key = `${(r as any).job_title}-${(r as any).company || ""}`;
        if (seen.has(key)) continue;
        seen.add(key);
        practiced.push({
          jobId: `practiced-${key}`,
          title: (r as any).job_title,
          company: (r as any).company,
          logo: null,
          location: null,
          country: null,
          workMode: null,
          seniority: null,
          augmented: 0,
          risk: 0,
        });
      }
      setPracticedRoles(practiced);
      setLoading(false);
    });
  }, [user]);

  const handleSelect = (role: RoleResult) => {
    onSelectRole(role);
  };

  const handleReadiness = (role: RoleResult) => {
    onAskChat(
      `How ready am I for ${role.title}${role.company ? ` at ${role.company}` : ""}? What should I practice?`
    );
  };

  const q = search.toLowerCase();
  const filteredRoles = (tab === "saved" ? savedRoles : practicedRoles).filter(
    (r) => !q || r.title.toLowerCase().includes(q) || (r.company || "").toLowerCase().includes(q)
  );

  return (
    <div className="h-full flex flex-col p-4 overflow-hidden">
      {/* Tabs */}
      <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-0.5 mb-3 shrink-0">
        <button
          onClick={() => { setTab("saved"); onTabChange?.("saved"); }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex-1 justify-center ${
            tab === "saved"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Bookmark className="h-3 w-3" />
          Saved ({savedRoles.length})
        </button>
        <button
          onClick={() => setTab("practiced")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex-1 justify-center ${
            tab === "practiced"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Trophy className="h-3 w-3" />
          Practiced ({practicedRoles.length})
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-3 shrink-0">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search roles…"
          className="h-8 pl-8 text-xs bg-muted/30 border-border/40"
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : filteredRoles.length === 0 ? (
          <div className="text-center py-12">
            {tab === "saved" ? (
              <Bookmark className="h-6 w-6 text-muted-foreground/30 mx-auto mb-3" />
            ) : (
              <Play className="h-6 w-6 text-muted-foreground/30 mx-auto mb-3" />
            )}
            <p className="text-sm text-muted-foreground">
              {tab === "saved"
                ? "No saved roles yet"
                : "No practiced roles yet"}
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              {tab === "saved"
                ? "Bookmark roles from the chat to track them here."
                : "Complete a simulation to see your practiced roles."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            {filteredRoles.map((role, i) => (
              <div key={role.jobId + i} className="relative group">
                <RoleCard
                  role={role}
                  index={i}
                  isSelected={false}
                  onSelect={handleSelect}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

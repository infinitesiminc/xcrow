/**
 * MyRolesPanel — slide-down panel showing saved (bookmarked) and practiced roles
 * using the same RoleCard design as the matching-roles carousel.
 */
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bookmark, Play, X, Trophy, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { RoleCard, type RoleResult } from "@/components/InlineRoleCarousel";

interface MyRolesPanelProps {
  open: boolean;
  onClose: () => void;
  onAskChat: (prompt: string) => void;
}

export default function MyRolesPanel({ open, onClose, onAskChat }: MyRolesPanelProps) {
  const { user } = useAuth();
  const [tab, setTab] = useState<"saved" | "practiced">("saved");
  const [search, setSearch] = useState("");
  const [savedRoles, setSavedRoles] = useState<RoleResult[]>([]);
  const [practicedRoles, setPracticedRoles] = useState<RoleResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !open) return;
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
      // Map saved roles to RoleResult format
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

      // Deduplicate practiced by job_title+company, map to RoleResult
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
  }, [user, open]);

  const handleSelect = (role: RoleResult) => {
    onAskChat(
      `How ready am I for ${role.title}${role.company ? ` at ${role.company}` : ""}? What should I practice?`
    );
  };

  const q = search.toLowerCase();
  const filteredRoles = (tab === "saved" ? savedRoles : practicedRoles).filter(
    (r) => !q || r.title.toLowerCase().includes(q) || (r.company || "").toLowerCase().includes(q)
  );

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="overflow-hidden border-b border-border bg-card"
        >
          <div className="px-4 py-3">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-0.5">
                <button
                  onClick={() => setTab("saved")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
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
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    tab === "practiced"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Trophy className="h-3 w-3" />
                  Practiced ({practicedRoles.length})
                </button>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-md hover:bg-muted/50 text-muted-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Search */}
            <div className="relative mb-3">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search roles…"
                className="h-8 pl-8 text-xs bg-muted/30 border-border/40"
              />
            </div>

            {/* Content */}
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : filteredRoles.length === 0 ? (
              <div className="text-center py-6">
                {tab === "saved" ? (
                  <Bookmark className="h-5 w-5 text-muted-foreground/40 mx-auto mb-2" />
                ) : (
                  <Play className="h-5 w-5 text-muted-foreground/40 mx-auto mb-2" />
                )}
                <p className="text-xs text-muted-foreground">
                  {tab === "saved"
                    ? "No saved roles yet. Ask the chat to find roles for you."
                    : "No practiced roles yet. Run a simulation to start building skills."}
                </p>
              </div>
            ) : (
              <div className="flex gap-2.5 overflow-x-auto pb-1.5 scrollbar-thin [mask-image:linear-gradient(to_right,transparent,black_1%,black_97%,transparent)]">
                {filteredRoles.map((role, i) => (
                  <RoleCard
                    key={role.jobId + i}
                    role={role}
                    index={i}
                    isSelected={false}
                    onSelect={handleSelect}
                  />
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

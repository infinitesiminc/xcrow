import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Compass, Bookmark, Zap, Trophy, CheckCircle2, Circle,
  Settings, LogOut, Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

interface ProfileSheetProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  displayName: string | null;
  email: string;
  onSignOut: () => void;
}

interface Milestone {
  label: string;
  completed: boolean;
  icon: typeof Trophy;
}

interface SavedRole {
  job_title: string;
  company: string | null;
  augmented_percent: number | null;
  automation_risk_percent: number | null;
  new_skills_percent: number | null;
}

function hashToHue(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return Math.abs(hash) % 360;
}

function MiniGauge({ value, size = 28 }: { value: number; size?: number }) {
  const radius = (size / 2) - 2.5;
  const stroke = 2.5;
  const circumference = 2 * Math.PI * radius;
  const arcLength = circumference * 0.75;
  const fillLength = arcLength * (value / 100);
  const rotation = 135;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${arcLength} ${circumference}`} transform={`rotate(${rotation} ${size/2} ${size/2})`} />
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${arcLength} ${circumference}`} strokeDashoffset={arcLength - fillLength} transform={`rotate(${rotation} ${size/2} ${size/2})`} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[8px] font-bold text-white">{value}</span>
      </div>
    </div>
  );
}

export default function ProfileSheet({ open, onClose, userId, displayName, email, onSignOut }: ProfileSheetProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [rolesExplored, setRolesExplored] = useState(0);
  const [rolesSaved, setRolesSaved] = useState(0);
  const [tasksPracticed, setTasksPracticed] = useState(0);
  const [uniqueTasks, setUniqueTasks] = useState(0);
  const [savedRoles, setSavedRoles] = useState<SavedRole[]>([]);
  const [savedSearch, setSavedSearch] = useState("");

  useEffect(() => {
    if (!open || !userId) return;
    setLoading(true);
    (async () => {
      const [analysisRes, bookmarkRes, simRes] = await Promise.all([
        supabase.from("analysis_history").select("id", { count: "exact", head: true }).eq("user_id", userId),
        supabase.from("bookmarked_roles").select("job_title, company, augmented_percent, automation_risk_percent, new_skills_percent").eq("user_id", userId).order("bookmarked_at", { ascending: false }),
        supabase.from("completed_simulations").select("task_name").eq("user_id", userId),
      ]);

      setRolesExplored(analysisRes.count ?? 0);
      const bk = (bookmarkRes.data as SavedRole[]) || [];
      setSavedRoles(bk);
      setRolesSaved(bk.length);
      const sims = (simRes.data as { task_name: string }[]) || [];
      setTasksPracticed(sims.length);
      setUniqueTasks(new Set(sims.map(s => s.task_name)).size);
      setLoading(false);
    })();
  }, [open, userId]);

  useEffect(() => {
    if (!open) setSavedSearch("");
  }, [open]);

  const milestones = useMemo<Milestone[]>(() => [
    { label: "First role explored", completed: rolesExplored >= 1, icon: Compass },
    { label: "First task practiced", completed: tasksPracticed >= 1, icon: Zap },
    { label: "Saved 3 roles", completed: rolesSaved >= 3, icon: Bookmark },
    { label: "Practiced 5 unique tasks", completed: uniqueTasks >= 5, icon: Trophy },
    { label: "Explored 10 roles", completed: rolesExplored >= 10, icon: Compass },
  ], [rolesExplored, tasksPracticed, rolesSaved, uniqueTasks]);

  const completedCount = milestones.filter(m => m.completed).length;

  const filteredRoles = useMemo(() => {
    const q = savedSearch.toLowerCase().trim();
    if (!q) return savedRoles;
    return savedRoles.filter(r => r.job_title.toLowerCase().includes(q) || (r.company?.toLowerCase().includes(q) ?? false));
  }, [savedRoles, savedSearch]);

  const goToRole = (jobTitle: string, company: string | null) => {
    onClose();
    const params = new URLSearchParams({ title: jobTitle });
    if (company) params.set("company", company);
    const target = `/analysis?${params.toString()}`;
    if (window.location.pathname + window.location.search === target) {
      navigate("/", { replace: true });
      setTimeout(() => navigate(target, { replace: true }), 0);
    } else {
      navigate(target);
    }
  };

  const initials = displayName
    ? displayName.slice(0, 2).toUpperCase()
    : email.slice(0, 2).toUpperCase();

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-background border-l border-border shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="shrink-0 flex items-center gap-3 p-4 border-b border-border/50">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{displayName || email}</p>
                <p className="text-[11px] text-muted-foreground truncate">{email}</p>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  {/* Journey Stats */}
                  <section>
                    <h3 className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-3">
                      🎯 Journey so far
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { value: rolesExplored, label: "Explored", icon: Compass },
                        { value: rolesSaved, label: "Saved", icon: Bookmark },
                        { value: tasksPracticed, label: "Practiced", icon: Zap },
                      ].map((s, i) => (
                        <motion.div
                          key={s.label}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.08 }}
                          className="rounded-xl border border-border/50 bg-muted/20 p-3 text-center"
                        >
                          <s.icon className="h-4 w-4 text-primary mx-auto mb-1.5" />
                          <p className="text-xl font-bold text-foreground">{s.value}</p>
                          <p className="text-[9px] text-muted-foreground uppercase tracking-wider mt-0.5">{s.label}</p>
                        </motion.div>
                      ))}
                    </div>
                  </section>

                  {/* Milestones */}
                  <section>
                    <h3 className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-3">
                      🏆 Milestones · {completedCount}/{milestones.length}
                    </h3>
                    <div className="space-y-1.5">
                      {milestones.map((m, i) => (
                        <motion.div
                          key={m.label}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="flex items-center gap-2.5 px-2 py-1.5"
                        >
                          {m.completed ? (
                            <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                          ) : (
                            <Circle className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                          )}
                          <span className={`text-xs ${m.completed ? "text-foreground" : "text-muted-foreground"}`}>
                            {m.label}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </section>

                  {/* Saved Roles — Card Grid */}
                  <section>
                    <h3 className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-3">
                      📚 Saved Roles{rolesSaved > 0 && ` · ${rolesSaved}`}
                    </h3>
                    {savedRoles.length === 0 ? (
                      <p className="text-xs text-muted-foreground">
                        No saved roles yet — explore and bookmark roles you're interested in.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {rolesSaved > 6 && (
                          <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            <Input
                              value={savedSearch}
                              onChange={e => setSavedSearch(e.target.value)}
                              placeholder="Filter saved roles…"
                              className="h-8 pl-8 text-xs bg-muted/20 border-border/50"
                            />
                          </div>
                        )}
                        <div className="max-h-[340px] overflow-y-auto pr-1">
                          <div className="grid grid-cols-2 gap-2">
                            {filteredRoles.map((role, i) => {
                              const hue1 = hashToHue(role.job_title);
                              const hue2 = (hue1 + 60) % 360;
                              const logoUrl = role.company ? `https://logo.clearbit.com/${role.company.toLowerCase().replace(/\s+/g, '')}.com` : '';
                              const aug = role.augmented_percent ?? 0;
                              return (
                                <motion.button
                                  key={role.job_title + role.company + i}
                                  initial={{ opacity: 0, y: 8 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ duration: 0.25, delay: Math.min(i * 0.03, 0.3) }}
                                  onClick={() => goToRole(role.job_title, role.company)}
                                  className="group text-left rounded-xl overflow-hidden bg-card border border-border transition-all hover:shadow-lg hover:border-primary/40 flex flex-col"
                                >
                                  <div className="p-2.5 pb-2">
                                    <div className="flex items-start gap-1.5">
                                      {logoUrl && (
                                        <img src={logoUrl} alt={role.company || ''} className="h-6 w-6 rounded-md object-contain bg-muted/30 p-0.5 shrink-0 mt-0.5" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                                      )}
                                      <div className="min-w-0 flex-1">
                                        <h4 className="text-[11px] font-semibold text-foreground leading-snug line-clamp-2">{role.job_title}</h4>
                                        {role.company && (
                                          <p className="text-[10px] text-muted-foreground truncate mt-0.5">{role.company}</p>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="mt-auto border-t border-border/30">
                                    <div className="px-2.5 py-1.5 flex items-center justify-between" style={{ background: `linear-gradient(135deg, hsl(${hue1} 60% 8%) 0%, hsl(${hue2} 50% 6%) 100%)` }}>
                                      {aug > 0 ? (
                                        <div className="flex items-center gap-1">
                                          <MiniGauge value={aug} />
                                          <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-wide">Aug</span>
                                        </div>
                                      ) : (
                                        <div className="flex items-center gap-0.5">
                                          <Zap className="h-2.5 w-2.5 text-primary" />
                                          <span className="text-[9px] text-muted-foreground">—</span>
                                        </div>
                                      )}
                                      <Bookmark className="h-2.5 w-2.5 text-primary fill-primary shrink-0" />
                                    </div>
                                  </div>
                                </motion.button>
                              );
                            })}
                          </div>
                          {filteredRoles.length === 0 && (
                            <p className="text-xs text-muted-foreground py-4 text-center">No matches</p>
                          )}
                        </div>
                      </div>
                    )}
                  </section>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="shrink-0 border-t border-border/50 p-3 flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 justify-start text-xs"
                onClick={() => { navigate("/settings"); onClose(); }}
              >
                <Settings className="mr-1.5 h-3.5 w-3.5" />
                Settings
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-destructive hover:text-destructive"
                onClick={() => { onSignOut(); onClose(); }}
              >
                <LogOut className="mr-1.5 h-3.5 w-3.5" />
                Sign out
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
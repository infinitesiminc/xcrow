import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Trash2, KeyRound, Bookmark, Zap, Search } from "lucide-react";

/* ── helpers ─────────────────────────────────────────── */

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

function MiniGauge({ value, size = 32 }: { value: number; size?: number }) {
  const radius = (size / 2) - 3;
  const stroke = 3;
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
        <span className="text-[9px] font-bold text-white">{value}</span>
      </div>
    </div>
  );
}

/* ── page ────────────────────────────────────────────── */

export default function Settings() {
  const { user, loading: authLoading, signOut, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [displayName, setDisplayName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [saving, setSaving] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const [deleting, setDeleting] = useState(false);

  // Saved roles
  const [savedRoles, setSavedRoles] = useState<SavedRole[]>([]);
  const [savedLoading, setSavedLoading] = useState(true);
  const [savedSearch, setSavedSearch] = useState("");

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.displayName || "");
    setJobTitle(profile.jobTitle || "");
    setCompany(profile.company || "");
  }, [profile]);

  // Fetch saved roles
  useEffect(() => {
    if (!user) return;
    setSavedLoading(true);
    supabase
      .from("bookmarked_roles")
      .select("job_title, company, augmented_percent, automation_risk_percent, new_skills_percent")
      .eq("user_id", user.id)
      .order("bookmarked_at", { ascending: false })
      .then(({ data }) => {
        setSavedRoles((data as SavedRole[]) || []);
        setSavedLoading(false);
      });
  }, [user]);

  const filteredRoles = useMemo(() => {
    const q = savedSearch.toLowerCase().trim();
    if (!q) return savedRoles;
    return savedRoles.filter(r =>
      r.job_title.toLowerCase().includes(q) || (r.company?.toLowerCase().includes(q) ?? false)
    );
  }, [savedRoles, savedSearch]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName,
        job_title: jobTitle.trim() || null,
        company: company.trim() || null,
      } as any)
      .eq("id", user.id);

    if (error) {
      toast({ title: "Error", description: "Failed to update profile.", variant: "destructive" });
    } else {
      await supabase.auth.updateUser({ data: { display_name: displayName } });
      await refreshProfile();
      toast({ title: "Profile updated", description: "Your profile has been saved." });
    }
    setSaving(false);
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "Password too short", description: "Minimum 6 characters.", variant: "destructive" });
      return;
    }
    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Password updated", description: "Your password has been changed." });
      setNewPassword("");
      setConfirmPassword("");
    }
    setChangingPassword(false);
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    setDeleting(true);
    try {
      await Promise.all([
        supabase.from("analysis_history").delete().eq("user_id", user.id),
        supabase.from("completed_simulations").delete().eq("user_id", user.id),
        supabase.from("bookmarked_roles").delete().eq("user_id", user.id),
        supabase.from("profiles").delete().eq("id", user.id),
      ]);
      await signOut();
      toast({ title: "Account deleted", description: "Your data has been removed." });
      navigate("/");
    } catch {
      toast({ title: "Error", description: "Failed to delete account data.", variant: "destructive" });
    }
    setDeleting(false);
  };

  const goToRole = (jobTitle: string, company: string | null) => {
    const params = new URLSearchParams({ title: jobTitle });
    if (company) params.set("company", company);
    navigate(`/analysis?${params.toString()}`);
  };

  if (authLoading) return null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-foreground mb-1">Settings</h1>
      <p className="text-muted-foreground mb-8">Manage your account and preferences.</p>

      {/* Saved Roles — full-width card grid */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Bookmark className="h-4 w-4 text-primary fill-primary" />
                Saved Roles
                {savedRoles.length > 0 && (
                  <span className="text-sm font-normal text-muted-foreground">· {savedRoles.length}</span>
                )}
              </CardTitle>
              <CardDescription>Roles you've bookmarked for quick access.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {savedLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : savedRoles.length === 0 ? (
            <div className="text-center py-8">
              <Bookmark className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No saved roles yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Explore and bookmark roles you're interested in</p>
            </div>
          ) : (
            <div className="space-y-3">
              {savedRoles.length > 6 && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={savedSearch}
                    onChange={e => setSavedSearch(e.target.value)}
                    placeholder="Filter saved roles…"
                    className="pl-9 bg-muted/20 border-border/50"
                  />
                </div>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {filteredRoles.map((role, i) => {
                  const hue1 = hashToHue(role.job_title);
                  const hue2 = (hue1 + 60) % 360;
                  const logoUrl = role.company ? `https://logo.clearbit.com/${role.company.toLowerCase().replace(/\s+/g, '')}.com` : '';
                  const aug = role.augmented_percent ?? 0;
                  return (
                    <motion.button
                      key={role.job_title + role.company + i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: Math.min(i * 0.03, 0.4) }}
                      onClick={() => goToRole(role.job_title, role.company)}
                      className="group text-left rounded-xl overflow-hidden bg-card border border-border transition-all hover:shadow-lg hover:border-primary/40 flex flex-col"
                    >
                      <div className="p-3 pb-2">
                        <div className="flex items-start gap-2">
                          {logoUrl && (
                            <img
                              src={logoUrl}
                              alt={role.company || ''}
                              className="h-7 w-7 rounded-lg object-contain bg-muted/30 p-0.5 shrink-0 mt-0.5"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                            />
                          )}
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs font-semibold text-foreground leading-snug line-clamp-2">{role.job_title}</h4>
                            {role.company && (
                              <p className="text-[10px] text-muted-foreground truncate mt-0.5">{role.company}</p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="mt-auto border-t border-border/30">
                        <div
                          className="px-3 py-2 flex items-center justify-between"
                          style={{ background: `linear-gradient(135deg, hsl(${hue1} 60% 8%) 0%, hsl(${hue2} 50% 6%) 100%)` }}
                        >
                          {aug > 0 ? (
                            <div className="flex items-center gap-1.5">
                              <MiniGauge value={aug} />
                              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Augmented</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <Zap className="h-3 w-3 text-primary" />
                              <span className="text-[10px] text-muted-foreground">—</span>
                            </div>
                          )}
                          <Bookmark className="h-3 w-3 text-primary fill-primary shrink-0" />
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
              {filteredRoles.length === 0 && (
                <p className="text-sm text-muted-foreground py-6 text-center">No matches</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Profile */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Profile</CardTitle>
          <CardDescription>Your personal and professional details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={user?.email ?? ""} disabled className="bg-muted" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="displayName">Display name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
            />
          </div>
          <Separator />
          <div className="space-y-2">
            <Label htmlFor="jobTitle">Job title</Label>
            <Input
              id="jobTitle"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="e.g. Product Manager"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company">Company</Label>
            <Input
              id="company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g. Acme Corp or acme.com"
            />
          </div>
          <Button onClick={handleSaveProfile} disabled={saving} size="sm">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save
          </Button>
        </CardContent>
      </Card>

      {/* Password */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Change password</CardTitle>
          <CardDescription>Update your account password.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword">New password</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm new password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <Button onClick={handleChangePassword} disabled={changingPassword} size="sm" variant="outline">
            {changingPassword ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
            Update password
          </Button>
        </CardContent>
      </Card>

      {/* Delete account */}
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-lg text-destructive">Danger zone</CardTitle>
          <CardDescription>Permanently delete your account and all associated data.</CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete your analysis history, upskill sessions, and profile data. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteAccount} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Yes, delete my account
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
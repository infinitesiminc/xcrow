import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import {
  Loader2, Save, Trash2, KeyRound, GraduationCap, Briefcase, School,
  User, Lock, AlertOctagon, ArrowLeft, LogOut, Check, CreditCard, Crown,
  ExternalLink,
} from "lucide-react";
import { AVATAR_OPTIONS, getAvatarById } from "@/lib/avatars";

const NAV_ITEMS = [
  { key: "profile", label: "Profile", icon: User },
  { key: "subscription", label: "Subscription", icon: CreditCard },
  { key: "security", label: "Security", icon: Lock },
  { key: "danger", label: "Danger Zone", icon: AlertOctagon },
] as const;

type SectionKey = typeof NAV_ITEMS[number]["key"];

export default function Settings() {
  const { user, loading: authLoading, signOut, profile, refreshProfile, plan, subscriptionEnd, schoolName, isPro } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();

  const activeSection = (searchParams.get("section") as SectionKey) || "profile";
  const setSection = (s: SectionKey) => setSearchParams({ section: s }, { replace: true });

  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [schoolNameField, setSchoolNameField] = useState("");
  const [careerStage, setCareerStage] = useState<"student" | "professional">("professional");
  const [saving, setSaving] = useState(false);
  const [avatarId, setAvatarId] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.displayName || "");
    setJobTitle(profile.jobTitle || "");
    setCompany(profile.company || "");
    setSchoolNameField(profile.schoolName || "");
    setCareerStage((profile.careerStage as "student" | "professional") || "professional");
    if (user) {
      supabase.from("profiles").select("username, avatar_id").eq("id", user.id).single().then(({ data }) => {
        if (data) {
          if ((data as any).username) setUsername((data as any).username);
          if ((data as any).avatar_id) setAvatarId((data as any).avatar_id);
        }
      });
    }
  }, [profile, user]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const updateData: any = {
      display_name: displayName,
      job_title: jobTitle.trim() || null,
      company: company.trim() || null,
      school_name: schoolNameField.trim() || null,
      career_stage: careerStage,
      avatar_id: avatarId || null,
    };
    if (username.trim()) updateData.username = username.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
    const { error } = await supabase.from("profiles").update(updateData).eq("id", user.id);
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
      toast({ title: "Password updated" });
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

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch {
      toast({ title: "Error", description: "Could not open subscription portal.", variant: "destructive" });
    }
    setPortalLoading(false);
  };

  if (authLoading) return null;

  const initials = profile?.displayName
    ? profile.displayName.slice(0, 2).toUpperCase()
    : (user?.email ?? "").slice(0, 2).toUpperCase();
  const sidebarAvatar = getAvatarById(avatarId);

  return (
    <div className="settings-page min-h-[100dvh] bg-background flex">
      {/* ── Sidebar ── */}
      <aside className="hidden md:flex w-64 shrink-0 border-r border-border/50 flex-col bg-muted/5">
        <div className="p-5 border-b border-border/30">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm mb-5">
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <div className="flex items-center gap-3">
            {sidebarAvatar ? (
              <img src={sidebarAvatar.src} alt={sidebarAvatar.label} className="w-10 h-10 rounded-full object-contain bg-muted/30 shrink-0" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold shrink-0">
                {initials}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{profile?.displayName || user?.email}</p>
              <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {NAV_ITEMS.map(item => (
            <button
              key={item.key}
              onClick={() => setSection(item.key)}
              className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all ${
                activeSection === item.key
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              } ${item.key === "danger" ? "mt-auto" : ""}`}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-border/30">
          <button
            onClick={async () => { await signOut(); navigate("/"); }}
            className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Mobile top nav ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-background/90 backdrop-blur-md border-b border-border/50">
        <div className="flex items-center gap-2 px-4 py-2">
          <button onClick={() => navigate("/")} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft className="h-4 w-4 text-muted-foreground" />
          </button>
          <h1 className="text-sm font-semibold text-foreground">Settings</h1>
        </div>
        <div className="flex gap-1 px-3 pb-2 overflow-x-auto">
          {NAV_ITEMS.map(item => (
            <button
              key={item.key}
              onClick={() => setSection(item.key)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs whitespace-nowrap transition-all shrink-0 ${
                activeSection === item.key
                  ? "bg-primary/15 text-primary font-medium"
                  : "text-muted-foreground hover:bg-muted/40"
              }`}
            >
              <item.icon className="h-3 w-3" />
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <main className="flex-1 min-w-0 md:overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8 md:py-12 mt-[88px] md:mt-0">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {activeSection === "profile" && (
              <ProfileSection
                displayName={displayName} setDisplayName={setDisplayName}
                username={username} setUsername={setUsername}
                jobTitle={jobTitle} setJobTitle={setJobTitle}
                company={company} setCompany={setCompany}
                schoolName={schoolNameField} setSchoolName={setSchoolNameField}
                careerStage={careerStage} setCareerStage={setCareerStage}
                saving={saving} email={user?.email ?? ""}
                avatarId={avatarId} setAvatarId={setAvatarId}
                handleSaveProfile={handleSaveProfile}
              />
            )}

            {activeSection === "subscription" && (
              <SubscriptionSection
                plan={plan}
                isPro={isPro}
                subscriptionEnd={subscriptionEnd}
                schoolName={schoolName}
                portalLoading={portalLoading}
                onManage={handleManageSubscription}
                onUpgrade={() => navigate("/pricing")}
              />
            )}

            {activeSection === "security" && (
              <SecuritySection
                newPassword={newPassword} setNewPassword={setNewPassword}
                confirmPassword={confirmPassword} setConfirmPassword={setConfirmPassword}
                changingPassword={changingPassword}
                handleChangePassword={handleChangePassword}
              />
            )}

            {activeSection === "danger" && (
              <DangerSection deleting={deleting} handleDeleteAccount={handleDeleteAccount} />
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   Section Components
   ══════════════════════════════════════════════════════ */

function ProfileSection({
  displayName, setDisplayName, username, setUsername, jobTitle, setJobTitle,
  company, setCompany, schoolName, setSchoolName,
  careerStage, setCareerStage, saving, email,
  avatarId, setAvatarId, handleSaveProfile,
}: {
  displayName: string; setDisplayName: (v: string) => void;
  username: string; setUsername: (v: string) => void;
  jobTitle: string; setJobTitle: (v: string) => void;
  company: string; setCompany: (v: string) => void;
  schoolName: string; setSchoolName: (v: string) => void;
  careerStage: "student" | "professional"; setCareerStage: (v: "student" | "professional") => void;
  saving: boolean; email: string;
  avatarId: string | null; setAvatarId: (v: string | null) => void;
  handleSaveProfile: () => void;
}) {
  return (
    <div>
      <h2 className="text-xl font-bold text-foreground mb-1">Profile</h2>
      <p className="text-sm text-muted-foreground mb-6">Your identity on the platform.</p>

      <div className="space-y-8">
        {/* Avatar picker */}
        <div className="space-y-3">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Choose your companion</Label>
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
            {AVATAR_OPTIONS.map((avatar) => (
              <button
                key={avatar.id}
                type="button"
                onClick={() => setAvatarId(avatar.id)}
                className={`relative rounded-xl border-2 p-1.5 transition-all hover:scale-105 ${
                  avatarId === avatar.id
                    ? "border-primary bg-primary/10 shadow-lg shadow-primary/20"
                    : "border-border/40 bg-muted/20 hover:border-border hover:bg-muted/40"
                }`}
              >
                <img src={avatar.src} alt={avatar.label} className="w-full aspect-square object-contain" />
                {avatarId === avatar.id && (
                  <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                    <Check className="h-2.5 w-2.5 text-primary-foreground" />
                  </div>
                )}
                <p className="text-[9px] text-center text-muted-foreground mt-0.5 truncate">{avatar.label}</p>
              </button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Basic info */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={email} disabled className="bg-muted" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="displayName">Display name</Label>
            <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name" />
          </div>
        </div>

        {/* Username */}
        <div className="space-y-2">
          <Label htmlFor="username" className="flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-muted-foreground" />
            Public profile username
          </Label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">Xcrow.ai/u/</span>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
              placeholder="your-username"
              className="flex-1"
            />
          </div>
          {username && (
            <p className="text-[10px] text-muted-foreground">
              Your public profile will be at <span className="text-primary font-medium">Xcrow.ai/u/{username}</span>
            </p>
          )}
        </div>

        <Separator />

        {/* Career stage toggle */}
        <div className="space-y-3">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">I am a</Label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setCareerStage("student")}
              className={`flex-1 flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3.5 transition-all ${
                careerStage === "student"
                  ? "border-primary bg-primary/10 text-foreground shadow-sm"
                  : "border-border/50 bg-muted/20 text-muted-foreground hover:border-border hover:bg-muted/40"
              }`}
            >
              <GraduationCap className="h-5 w-5" />
              <div className="text-left">
                <p className="text-sm font-semibold">Student</p>
                <p className="text-[10px] opacity-70">Exploring career paths</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setCareerStage("professional")}
              className={`flex-1 flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3.5 transition-all ${
                careerStage === "professional"
                  ? "border-primary bg-primary/10 text-foreground shadow-sm"
                  : "border-border/50 bg-muted/20 text-muted-foreground hover:border-border hover:bg-muted/40"
              }`}
            >
              <Briefcase className="h-5 w-5" />
              <div className="text-left">
                <p className="text-sm font-semibold">Professional</p>
                <p className="text-[10px] opacity-70">Upskilling in my role</p>
              </div>
            </button>
          </div>
        </div>

        <Separator />

        {/* Role & company */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="jobTitle">{careerStage === "student" ? "Target role" : "Job title"}</Label>
            <Input id="jobTitle" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder={careerStage === "student" ? "e.g. Data Scientist" : "e.g. Product Manager"} />
          </div>
          {careerStage === "professional" && (
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input id="company" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. Acme Corp" />
            </div>
          )}
        </div>

        {/* School */}
        {careerStage === "student" && (
          <div className="space-y-2">
            <Label htmlFor="schoolName" className="flex items-center gap-1.5">
              <School className="h-3.5 w-3.5 text-muted-foreground" />
              School / University
            </Label>
            <Input id="schoolName" value={schoolName} onChange={(e) => setSchoolName(e.target.value)} placeholder="e.g. MIT, Stanford, University of London" />
          </div>
        )}

        <Button onClick={handleSaveProfile} disabled={saving} size="sm">
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save profile
        </Button>
      </div>
    </div>
  );
}

function SubscriptionSection({
  plan, isPro, subscriptionEnd, schoolName, portalLoading, onManage, onUpgrade,
}: {
  plan: string; isPro: boolean; subscriptionEnd: string | null; schoolName: string | null;
  portalLoading: boolean; onManage: () => void; onUpgrade: () => void;
}) {
  const planLabel = plan === "school" ? `School · ${schoolName || "Institution"}` : plan === "pro" ? "Pro" : "Free";
  const planColor = isPro ? "bg-primary/15 text-primary border-primary/30" : "bg-muted/30 text-muted-foreground border-border/50";

  return (
    <div>
      <h2 className="text-xl font-bold text-foreground mb-1">Subscription</h2>
      <p className="text-sm text-muted-foreground mb-6">Manage your plan and billing.</p>

      <div className="rounded-xl border border-border/50 bg-card p-6 space-y-4 max-w-md">
        <div className="flex items-center gap-3">
          <div className={`rounded-full p-2.5 ${isPro ? "bg-primary/10" : "bg-muted/30"}`}>
            <Crown className={`h-5 w-5 ${isPro ? "text-primary" : "text-muted-foreground"}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-foreground">{planLabel}</p>
              <Badge variant="outline" className={`text-[10px] ${planColor}`}>
                {isPro ? "Active" : "Current"}
              </Badge>
            </div>
            {subscriptionEnd && (
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Renews {new Date(subscriptionEnd).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        {isPro ? (
          <Button variant="outline" size="sm" onClick={onManage} disabled={portalLoading}>
            {portalLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ExternalLink className="mr-2 h-4 w-4" />}
            Manage subscription
          </Button>
        ) : (
          <Button size="sm" onClick={onUpgrade}>
            <Crown className="mr-2 h-4 w-4" />
            Upgrade to Pro
          </Button>
        )}
      </div>
    </div>
  );
}

function SecuritySection({
  newPassword, setNewPassword, confirmPassword, setConfirmPassword,
  changingPassword, handleChangePassword,
}: {
  newPassword: string; setNewPassword: (v: string) => void;
  confirmPassword: string; setConfirmPassword: (v: string) => void;
  changingPassword: boolean; handleChangePassword: () => void;
}) {
  return (
    <div>
      <h2 className="text-xl font-bold text-foreground mb-1">Security</h2>
      <p className="text-sm text-muted-foreground mb-6">Update your account password.</p>
      <div className="space-y-4 max-w-md">
        <div className="space-y-2">
          <Label htmlFor="newPassword">New password</Label>
          <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm new password</Label>
          <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" />
        </div>
        <Button onClick={handleChangePassword} disabled={changingPassword} size="sm" variant="outline">
          {changingPassword ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
          Update password
        </Button>
      </div>
    </div>
  );
}

function DangerSection({ deleting, handleDeleteAccount }: { deleting: boolean; handleDeleteAccount: () => void }) {
  return (
    <div>
      <h2 className="text-xl font-bold text-destructive mb-1">Danger Zone</h2>
      <p className="text-sm text-muted-foreground mb-6">Permanently delete your account and all associated data.</p>
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
    </div>
  );
}

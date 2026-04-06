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
  Loader2, Save, Trash2, KeyRound,
  User, Lock, AlertOctagon, ArrowLeft, LogOut,
  CreditCard, Crown, ExternalLink,
} from "lucide-react";

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
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [saving, setSaving] = useState(false);

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
    setLinkedinUrl(profile.linkedinUrl || "");
  }, [profile]);

  const handleSaveProfile = async () => {
    if (!user) return;

    // Validate LinkedIn URL if provided
    if (linkedinUrl.trim() && !/^https?:\/\/(www\.)?linkedin\.com\/in\/.+/i.test(linkedinUrl.trim())) {
      toast({ title: "Invalid LinkedIn URL", description: "Please enter a valid LinkedIn profile URL.", variant: "destructive" });
      return;
    }

    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      display_name: displayName.trim() || null,
      job_title: jobTitle.trim() || null,
      company: company.trim() || null,
      linkedin_url: linkedinUrl.trim() || null,
    }).eq("id", user.id);

    if (error) {
      toast({ title: "Error", description: "Failed to update profile.", variant: "destructive" });
    } else {
      await supabase.auth.updateUser({ data: { display_name: displayName } });
      await refreshProfile();
      toast({ title: "Profile updated" });
    }
    setSaving(false);
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    if (newPassword.length < 8) {
      toast({ title: "Password too short", description: "Minimum 8 characters.", variant: "destructive" });
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
      // Delete related records first (outreach_log references saved_leads)
      await supabase.from("outreach_log").delete().eq("user_id", user.id);
      await supabase.from("lead_notes").delete().eq("user_id", user.id);
      await Promise.all([
        supabase.from("saved_leads").delete().eq("user_id", user.id),
        supabase.from("leadgen_niches").delete().eq("user_id", user.id),
        supabase.from("chat_messages").delete().eq("user_id", user.id),
        (supabase.from("user_workspaces") as any).delete().eq("user_id", user.id),
      ]);
      await supabase.from("profiles").delete().eq("id", user.id);

      // Delete auth user via edge function
      try {
        await supabase.functions.invoke("admin-delete-user", {
          body: { user_id: user.id },
        });
      } catch {
        // If edge function fails, still sign out — profile data is already gone
      }

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

  return (
    <div className="settings-page min-h-[100dvh] bg-background flex">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 border-r border-border/50 flex-col bg-muted/5">
        <div className="p-5 border-b border-border/30">
          <button onClick={() => navigate("/leadhunter")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm mb-5">
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold shrink-0">
              {initials}
            </div>
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
              }`}
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

      {/* Mobile top nav */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-background/90 backdrop-blur-md border-b border-border/50">
        <div className="flex items-center gap-2 px-4 py-2">
          <button onClick={() => navigate("/leadhunter")} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
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

      {/* Content */}
      <main className="flex-1 min-w-0 md:overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 sm:px-8 py-8 md:py-12 mt-[88px] md:mt-0">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {activeSection === "profile" && (
              <div>
                <h2 className="text-xl font-bold text-foreground mb-1">Profile</h2>
                <p className="text-sm text-muted-foreground mb-6">Your account details.</p>

                <div className="space-y-6 max-w-md">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" value={user?.email ?? ""} disabled className="bg-muted" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="displayName">Display name</Label>
                    <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name" />
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="jobTitle">Job title</Label>
                    <Input id="jobTitle" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="e.g. Sales Manager" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company">Company</Label>
                    <Input id="company" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. Acme Corp" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="linkedinUrl">LinkedIn URL <span className="text-muted-foreground font-normal">(optional)</span></Label>
                    <Input id="linkedinUrl" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/in/yourprofile" />
                  </div>

                  <Button onClick={handleSaveProfile} disabled={saving} size="sm">
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save profile
                  </Button>
                </div>
              </div>
            )}

            {activeSection === "subscription" && (
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
                        <p className="text-sm font-semibold text-foreground">
                          {plan === "school" ? `School · ${schoolName || "Institution"}` : plan === "pro" ? "Champion" : "Free"}
                        </p>
                        <Badge variant="outline" className={`text-[10px] ${isPro ? "bg-primary/15 text-primary border-primary/30" : "bg-muted/30 text-muted-foreground border-border/50"}`}>
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
                    <Button variant="outline" size="sm" onClick={handleManageSubscription} disabled={portalLoading}>
                      {portalLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ExternalLink className="mr-2 h-4 w-4" />}
                      Manage subscription
                    </Button>
                  ) : (
                    <Button size="sm" onClick={() => window.open("https://xcrow.ai/#pricing", "_blank")}>
                      <Crown className="mr-2 h-4 w-4" />
                      Upgrade to Champion
                    </Button>
                  )}
                </div>
              </div>
            )}

            {activeSection === "security" && (
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
                  <p className="text-xs text-muted-foreground">Minimum 8 characters.</p>
                  <Button onClick={handleChangePassword} disabled={changingPassword} size="sm" variant="outline">
                    {changingPassword ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
                    Update password
                  </Button>
                </div>
              </div>
            )}

            {activeSection === "danger" && (
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
                        This will permanently delete your leads, workspaces, outreach history, and profile data. This action cannot be undone.
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
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
}

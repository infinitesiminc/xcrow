import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
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
  Loader2, Save, Trash2, KeyRound, Bookmark,
  Linkedin, Upload, FileText, GraduationCap, Briefcase, X, School,
  Shield, User, Lock, AlertOctagon, ArrowLeft, LogOut,
} from "lucide-react";
import JourneyDashboard from "@/components/settings/JourneyDashboard";

/* ── helpers ─────────────────────────────────────────── */

interface SavedRole {
  job_title: string;
  company: string | null;
  augmented_percent: number | null;
  automation_risk_percent: number | null;
  new_skills_percent: number | null;
}

interface PracticedRole {
  job_title: string;
  task_name: string;
  company: string | null;
  completed_at: string;
  correct_answers: number;
  total_questions: number;
  tool_awareness_score: number | null;
  human_value_add_score: number | null;
  adaptive_thinking_score: number | null;
  domain_judgment_score: number | null;
}


const NAV_ITEMS = [
  { key: "roles", label: "My Journey", icon: Bookmark },
  { key: "profile", label: "Profile", icon: User },
  { key: "security", label: "Security", icon: Lock },
  { key: "danger", label: "Danger Zone", icon: AlertOctagon },
] as const;

type SectionKey = typeof NAV_ITEMS[number]["key"];

/* ── page ────────────────────────────────────────────── */

export default function Settings() {
  const { user, loading: authLoading, signOut, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();

  const activeSection = (searchParams.get("section") as SectionKey) || "roles";
  const setSection = (s: SectionKey) => setSearchParams({ section: s }, { replace: true });

  const [displayName, setDisplayName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [careerStage, setCareerStage] = useState<"student" | "professional">("professional");
  const [cvUrl, setCvUrl] = useState<string | null>(null);
  const [cvFileName, setCvFileName] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingCv, setUploadingCv] = useState(false);
  const cvInputRef = useRef<HTMLInputElement>(null);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const [deleting, setDeleting] = useState(false);

  // Saved & practiced roles
  const [savedRoles, setSavedRoles] = useState<SavedRole[]>([]);
  const [practicedRoles, setPracticedRoles] = useState<PracticedRole[]>([]);
  const [savedLoading, setSavedLoading] = useState(true);
  const [practicedLoading, setPracticedLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.displayName || "");
    setJobTitle(profile.jobTitle || "");
    setCompany(profile.company || "");
    setLinkedinUrl(profile.linkedinUrl || "");
    setSchoolName(profile.schoolName || "");
    setCareerStage((profile.careerStage as "student" | "professional") || "professional");
    setCvUrl(profile.cvUrl || null);
    if (profile.cvUrl) {
      const parts = profile.cvUrl.split("/");
      setCvFileName(decodeURIComponent(parts[parts.length - 1] || "CV"));
    }
  }, [profile]);

  useEffect(() => {
    if (!user) return;
    setSavedLoading(true);
    setPracticedLoading(true);
    supabase
      .from("bookmarked_roles")
      .select("job_title, company, augmented_percent, automation_risk_percent, new_skills_percent")
      .eq("user_id", user.id)
      .order("bookmarked_at", { ascending: false })
      .then(({ data }) => {
        setSavedRoles((data as SavedRole[]) || []);
        setSavedLoading(false);
      });
    supabase
      .from("completed_simulations")
      .select("job_title, task_name, company, completed_at, correct_answers, total_questions, tool_awareness_score, human_value_add_score, adaptive_thinking_score, domain_judgment_score")
      .eq("user_id", user.id)
      .order("completed_at", { ascending: false })
      .then(({ data }) => {
        setPracticedRoles((data as PracticedRole[]) || []);
        setPracticedLoading(false);
      });
  }, [user]);

  const handleCvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const allowedTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"];
    if (!allowedTypes.includes(file.type)) {
      toast({ title: "Invalid file type", description: "Please upload a PDF, DOCX, or TXT file.", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max file size is 5MB.", variant: "destructive" });
      return;
    }
    setUploadingCv(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/cv.${ext}`;
    const { error } = await supabase.storage.from("cv-uploads").upload(path, file, { upsert: true });
    if (error) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } else {
      setCvUrl(path);
      setCvFileName(file.name);
      toast({ title: "CV uploaded", description: file.name });
    }
    setUploadingCv(false);
    if (cvInputRef.current) cvInputRef.current.value = "";
  };

  const handleRemoveCv = async () => {
    if (!user || !cvUrl) return;
    await supabase.storage.from("cv-uploads").remove([cvUrl]);
    setCvUrl(null);
    setCvFileName(null);
    toast({ title: "CV removed" });
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName,
        job_title: jobTitle.trim() || null,
        company: company.trim() || null,
        linkedin_url: linkedinUrl.trim() || null,
        school_name: schoolName.trim() || null,
        career_stage: careerStage,
        cv_url: cvUrl || null,
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


  if (authLoading) return null;

  const initials = profile?.displayName
    ? profile.displayName.slice(0, 2).toUpperCase()
    : (user?.email ?? "").slice(0, 2).toUpperCase();

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
            {activeSection === "roles" && (
              <JourneyDashboard
                practicedRoles={practicedRoles}
                savedRoles={savedRoles}
                loading={savedLoading || practicedLoading}
              />
            )}

            {activeSection === "profile" && (
              <ProfileSection
                displayName={displayName} setDisplayName={setDisplayName}
                jobTitle={jobTitle} setJobTitle={setJobTitle}
                company={company} setCompany={setCompany}
                linkedinUrl={linkedinUrl} setLinkedinUrl={setLinkedinUrl}
                schoolName={schoolName} setSchoolName={setSchoolName}
                careerStage={careerStage} setCareerStage={setCareerStage}
                cvFileName={cvFileName} cvInputRef={cvInputRef}
                uploadingCv={uploadingCv} saving={saving}
                email={user?.email ?? ""}
                handleCvUpload={handleCvUpload}
                handleRemoveCv={handleRemoveCv}
                handleSaveProfile={handleSaveProfile}
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
              <DangerSection
                deleting={deleting}
                handleDeleteAccount={handleDeleteAccount}
              />
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
  displayName, setDisplayName, jobTitle, setJobTitle, company, setCompany,
  linkedinUrl, setLinkedinUrl, schoolName, setSchoolName,
  careerStage, setCareerStage, cvFileName, cvInputRef, uploadingCv, saving, email,
  handleCvUpload, handleRemoveCv, handleSaveProfile,
}: {
  displayName: string; setDisplayName: (v: string) => void;
  jobTitle: string; setJobTitle: (v: string) => void;
  company: string; setCompany: (v: string) => void;
  linkedinUrl: string; setLinkedinUrl: (v: string) => void;
  schoolName: string; setSchoolName: (v: string) => void;
  careerStage: "student" | "professional"; setCareerStage: (v: "student" | "professional") => void;
  cvFileName: string | null; cvInputRef: React.RefObject<HTMLInputElement>;
  uploadingCv: boolean; saving: boolean; email: string;
  handleCvUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleRemoveCv: () => void;
  handleSaveProfile: () => void;
}) {
  return (
    <div>
      <h2 className="text-xl font-bold text-foreground mb-1">Profile</h2>
      <p className="text-sm text-muted-foreground mb-6">Your personal and professional details for a customized experience.</p>

      <div className="space-y-8">
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

        {/* Role & org */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="jobTitle">{careerStage === "student" ? "Target role" : "Job title"}</Label>
            <Input id="jobTitle" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder={careerStage === "student" ? "e.g. Data Scientist" : "e.g. Product Manager"} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company">{careerStage === "student" ? "Target company" : "Company"}</Label>
            <Input id="company" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. Acme Corp or acme.com" />
          </div>
        </div>

        {/* School */}
        <div className="space-y-2">
          <Label htmlFor="schoolName" className="flex items-center gap-1.5">
            <School className="h-3.5 w-3.5 text-muted-foreground" />
            {careerStage === "student" ? "School / University" : "School / University (optional)"}
          </Label>
          <Input id="schoolName" value={schoolName} onChange={(e) => setSchoolName(e.target.value)} placeholder="e.g. MIT, Stanford, University of London" />
        </div>

        <Separator />

        {/* LinkedIn */}
        <div className="space-y-2">
          <Label htmlFor="linkedinUrl" className="flex items-center gap-1.5">
            <Linkedin className="h-3.5 w-3.5 text-muted-foreground" />
            LinkedIn profile
          </Label>
          <Input id="linkedinUrl" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/in/yourname" />
        </div>

        {/* CV upload */}
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5 text-muted-foreground" />
            CV / Resume
          </Label>
          {cvFileName ? (
            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2.5">
              <FileText className="h-4 w-4 text-primary shrink-0" />
              <span className="text-sm text-foreground truncate flex-1">{cvFileName}</span>
              <Badge variant="secondary" className="text-[10px] shrink-0">Uploaded</Badge>
              <button onClick={handleRemoveCv} className="ml-1 rounded-full p-1 hover:bg-destructive/10 transition-colors" title="Remove CV">
                <X className="h-3.5 w-3.5 text-destructive" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => cvInputRef.current?.click()}
              disabled={uploadingCv}
              className="w-full rounded-xl border-2 border-dashed border-border/60 bg-muted/10 hover:border-primary/40 hover:bg-primary/5 transition-all px-4 py-6 flex flex-col items-center gap-2 text-center group"
            >
              {uploadingCv ? (
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              ) : (
                <Upload className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
              )}
              <div>
                <p className="text-sm font-medium text-foreground">{uploadingCv ? "Uploading…" : "Upload your CV"}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">PDF, DOCX, or TXT · Max 5MB</p>
              </div>
            </button>
          )}
          <input
            ref={cvInputRef}
            type="file"
            accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
            onChange={handleCvUpload}
            className="hidden"
          />
        </div>

        <Button onClick={handleSaveProfile} disabled={saving} size="sm">
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save profile
        </Button>
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
  changingPassword: boolean;
  handleChangePassword: () => void;
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

function DangerSection({
  deleting, handleDeleteAccount,
}: {
  deleting: boolean;
  handleDeleteAccount: () => void;
}) {
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

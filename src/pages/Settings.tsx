import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
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
  Loader2, Save, Trash2, KeyRound, Bookmark, Zap, Search,
  Linkedin, Upload, FileText, GraduationCap, Briefcase, X, School,
  Shield, Target,
}from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

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
  const [savedSearch, setSavedSearch] = useState("");
  const [practicedSearch, setPracticedSearch] = useState("");
  const [rolesTab, setRolesTab] = useState("saved");

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

  /* ── CV upload ── */
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
      const { data: urlData } = supabase.storage.from("cv-uploads").getPublicUrl(path);
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

      {/* Saved Roles — horizontal scroll */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-lg flex items-center gap-2 shrink-0">
              <Bookmark className="h-4 w-4 text-primary fill-primary" />
              Saved Roles
              {savedRoles.length > 0 && (
                <span className="text-sm font-normal text-muted-foreground">· {savedRoles.length}</span>
              )}
            </CardTitle>
            {savedRoles.length > 4 && (
              <div className="relative flex-1 max-w-[240px]">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={savedSearch}
                  onChange={e => setSavedSearch(e.target.value)}
                  placeholder="Filter…"
                  className="h-8 pl-8 text-xs bg-muted/20 border-border/50"
                />
              </div>
            )}
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
          ) : filteredRoles.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No matches</p>
          ) : (
            <div className="overflow-x-auto -mx-6 px-6 pb-2">
              <div className="flex gap-3" style={{ width: 'max-content' }}>
                {filteredRoles.map((role, i) => {
                  const hue1 = hashToHue(role.job_title);
                  const hue2 = (hue1 + 60) % 360;
                  const logoUrl = role.company ? `https://logo.clearbit.com/${role.company.toLowerCase().replace(/\s+/g, '')}.com` : '';
                  const aug = role.augmented_percent ?? 0;
                  return (
                    <motion.button
                      key={role.job_title + role.company + i}
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.25, delay: Math.min(i * 0.03, 0.4) }}
                      onClick={() => goToRole(role.job_title, role.company)}
                      className="group text-left rounded-xl overflow-hidden bg-card border border-border transition-all hover:shadow-lg hover:border-primary/40 flex flex-col shrink-0"
                      style={{ width: 180 }}
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
                              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Aug</span>
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
            </div>
          )}
        </CardContent>
      </Card>

      {/* Profile */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Profile</CardTitle>
          <CardDescription>Your personal and professional details for a customized experience.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic info */}
          <div className="grid gap-4 sm:grid-cols-2">
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
              <Label htmlFor="jobTitle">
                {careerStage === "student" ? "Target role" : "Job title"}
              </Label>
              <Input
                id="jobTitle"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder={careerStage === "student" ? "e.g. Data Scientist" : "e.g. Product Manager"}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">
                {careerStage === "student" ? "Target company" : "Company"}
              </Label>
              <Input
                id="company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Acme Corp or acme.com"
              />
            </div>
          </div>

          {/* School (shown for students, optional for professionals) */}
          <div className="space-y-2">
            <Label htmlFor="schoolName" className="flex items-center gap-1.5">
              <School className="h-3.5 w-3.5 text-muted-foreground" />
              {careerStage === "student" ? "School / University" : "School / University (optional)"}
            </Label>
            <Input
              id="schoolName"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              placeholder="e.g. MIT, Stanford, University of London"
            />
          </div>

          <Separator />

          {/* LinkedIn */}
          <div className="space-y-2">
            <Label htmlFor="linkedinUrl" className="flex items-center gap-1.5">
              <Linkedin className="h-3.5 w-3.5 text-muted-foreground" />
              LinkedIn profile
            </Label>
            <Input
              id="linkedinUrl"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              placeholder="https://linkedin.com/in/yourname"
            />
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
                <button
                  onClick={handleRemoveCv}
                  className="ml-1 rounded-full p-1 hover:bg-destructive/10 transition-colors"
                  title="Remove CV"
                >
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
                  <p className="text-sm font-medium text-foreground">
                    {uploadingCv ? "Uploading…" : "Upload your CV"}
                  </p>
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

          <Button onClick={handleSaveProfile} disabled={saving} size="sm" className="mt-2">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save profile
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
          <div className="grid gap-4 sm:grid-cols-2">
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

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Briefcase, BarChart3, BookOpen, Users, Plus, X, Sparkles, Loader2, FileText, Link, Upload, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { JobAnalysisResult, SkillCategory } from "@/types/analysis";
import { findPrebuiltRole } from "@/data/prebuilt-roles";
import { analyzeJobWithAI } from "@/lib/ai-analysis";
import { useToast } from "@/hooks/use-toast";

const steps = [
  { icon: Briefcase, title: "Enter your role", description: "Tell us your company and job title" },
  { icon: BarChart3, title: "Get your analysis", description: "See how AI impacts each task in your role" },
  { icon: BookOpen, title: "Bridge the gap", description: "Get personalized skill recommendations" },
];

const categoryLabels: Record<SkillCategory, string> = {
  ai_tools: "AI Tools",
  human_skills: "Human Skills",
  new_capabilities: "New Capabilities",
};

type Mode = "individual" | "team";
type JdInputType = "none" | "paste" | "url" | "file";

interface RoleEntry {
  id: string;
  title: string;
  jdText?: string;
  jdFileName?: string;
}

interface LastAnalysis {
  jobTitle: string;
  company: string;
  timestamp: number;
}

const getLastAnalysis = (): LastAnalysis | null => {
  try {
    const raw = localStorage.getItem("last_analysis");
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};

const Index = () => {
  const lastAnalysis = getLastAnalysis();
  const [website, setWebsite] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [websiteError, setWebsiteError] = useState("");
  const [mode, setMode] = useState<Mode>("individual");
  const [jdInputType, setJdInputType] = useState<JdInputType>("none");
  const [jdText, setJdText] = useState("");
  const [jdUrl, setJdUrl] = useState("");
  const [jdFile, setJdFile] = useState<File | null>(null);
  const [jdFileText, setJdFileText] = useState("");
  const [jdFileParsing, setJdFileParsing] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Team state
  const [roles, setRoles] = useState<RoleEntry[]>([
    { id: crypto.randomUUID(), title: "" },
    { id: crypto.randomUUID(), title: "" },
  ]);
  const [teamResults, setTeamResults] = useState<JobAnalysisResult[]>([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [teamAnalyzed, setTeamAnalyzed] = useState(false);
  const [teamJdParsing, setTeamJdParsing] = useState(false);

  const isValidWebsite = (url: string) => {
    if (!url) return true;
    return /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/.*)?$/.test(url.trim());
  };

  const hasJdContent = (jdInputType === "paste" && jdText.trim().length > 0) ||
    (jdInputType === "url" && jdUrl.trim().length > 0) ||
    (jdInputType === "file" && jdFileText.trim().length > 0);

  // Auto-extract company domain from JD URL
  const companyFromJdUrl = (() => {
    if (jdInputType !== "url" || !jdUrl.trim()) return "";
    try {
      let u = jdUrl.trim();
      if (!u.startsWith("http")) u = `https://${u}`;
      return new URL(u).hostname.replace(/^www\./, "");
    } catch { return ""; }
  })();

  const effectiveCompany = website.trim() || companyFromJdUrl;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobTitle.trim() && !hasJdContent) return;
    if (website && !isValidWebsite(website)) {
      setWebsiteError("Please enter a valid website (e.g. example.com)");
      return;
    }
    setWebsiteError("");

    const jdParam = jdInputType === "paste" ? jdText.trim() : jdInputType === "file" ? jdFileText.trim() : "";
    const jdUrlParam = jdInputType === "url" ? jdUrl.trim() : "";

    if (jdParam) {
      sessionStorage.setItem("jd_text", jdParam);
    } else {
      sessionStorage.removeItem("jd_text");
    }

    // Cache last analysis for quick re-selection
    localStorage.setItem("last_analysis", JSON.stringify({
      jobTitle: jobTitle.trim(),
      company: effectiveCompany,
      timestamp: Date.now(),
    }));

    const params = new URLSearchParams({
      company: effectiveCompany,
      title: jobTitle.trim(),
    });
    if (jdParam) params.set("jd", "session");
    if (jdUrlParam) params.set("jdUrl", jdUrlParam);

    navigate(`/analysis?${params.toString()}`);
  };

  const toggleJdInput = (type: JdInputType) => {
    setJdInputType((prev) => (prev === type ? "none" : type));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({ title: "File too large", description: "Max file size is 5MB.", variant: "destructive" });
      return;
    }

    const name = file.name.toLowerCase();
    const validExts = [".pdf", ".docx", ".doc", ".txt", ".md"];
    if (!validExts.some((ext) => name.endsWith(ext))) {
      toast({ title: "Unsupported file", description: "Upload PDF, DOCX, TXT, or MD files.", variant: "destructive" });
      return;
    }

    setJdFile(file);
    setJdFileText("");

    // Plain text files — read client-side
    if (name.endsWith(".txt") || name.endsWith(".md")) {
      const text = await file.text();
      setJdFileText(text);
      return;
    }

    // PDF/DOCX — send to edge function
    setJdFileParsing(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${supabaseUrl}/functions/v1/parse-jd`, {
        method: "POST",
        headers: { Authorization: `Bearer ${supabaseKey}` },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        toast({ title: "Parse failed", description: data.error || "Could not extract text.", variant: "destructive" });
        return;
      }
      setJdFileText(data.text || "");
    } catch (err) {
      console.error("File parse error:", err);
      toast({ title: "Parse failed", description: "Could not process file.", variant: "destructive" });
    } finally {
      setJdFileParsing(false);
    }
  };

  // Team handlers
  const addRole = () => {
    if (roles.length >= 100) return;
    setRoles([...roles, { id: crypto.randomUUID(), title: "" }]);
  };

  const removeRole = (id: string) => {
    if (roles.length <= 2) return;
    setRoles(roles.filter((r) => r.id !== id));
  };

  const updateRole = (id: string, title: string) => {
    setRoles(roles.map((r) => (r.id === id ? { ...r, title } : r)));
  };

  // Detect common header strings to skip
  const isHeaderRow = (val: string) => {
    const lower = val.toLowerCase().trim();
    const headers = ["job title", "jobtitle", "title", "role", "position", "job name", "role name", "position title", "job role", "#", "no", "no.", "s.no", "sr", "sr."];
    return headers.includes(lower);
  };

  // Single smart upload: spreadsheets/CSVs → job title list; documents → JD entries
  const handleFilesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 100);
    if (files.length === 0) return;

    const listExts = [".csv", ".tsv"];
    const spreadsheetExts = [".xlsx", ".xls"];
    const docExts = [".pdf", ".docx", ".doc", ".txt", ".md"];

    // Categorize files
    const listFiles: File[] = [];
    const jdFiles: File[] = [];

    for (const file of files) {
      const name = file.name.toLowerCase();
      if (spreadsheetExts.some((ext) => name.endsWith(ext)) || listExts.some((ext) => name.endsWith(ext))) {
        listFiles.push(file);
      } else if (docExts.some((ext) => name.endsWith(ext))) {
        jdFiles.push(file);
      }
    }

    // If only list-type files, extract titles
    if (listFiles.length > 0 && jdFiles.length === 0) {
      let allLines: string[] = [];
      for (const file of listFiles) {
        const name = file.name.toLowerCase();
        if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
          const XLSX = await import("xlsx");
          const arrayBuffer = await file.arrayBuffer();
          const workbook = XLSX.read(arrayBuffer, { type: "array" });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          const rows: string[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
          allLines.push(...rows.map((row) => (row[0] || "").toString().trim()).filter(Boolean).filter((l) => !isHeaderRow(l)));
        } else {
          const text = await file.text();
          allLines.push(...text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).filter((l) => !isHeaderRow(l)));
        }
      }
      allLines = allLines.slice(0, 100);
      if (allLines.length === 0) {
        toast({ title: "Empty file", description: "No job titles found.", variant: "destructive" });
      } else {
        setRoles(allLines.map((title) => ({ id: crypto.randomUUID(), title })));
        toast({ title: `${allLines.length} roles imported`, description: "Review and click Analyze Team." });
      }
      e.target.value = "";
      return;
    }

    // Otherwise treat everything as JD files (documents + spreadsheets as JD content)
    const allFiles = [...listFiles, ...jdFiles];
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    const newRoles: RoleEntry[] = [];

    for (const file of allFiles) {
      const name = file.name.toLowerCase();
      let jdText = "";

      if (name.endsWith(".txt") || name.endsWith(".md")) {
        jdText = await file.text();
      } else if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
        try {
          const XLSX = await import("xlsx");
          const arrayBuffer = await file.arrayBuffer();
          const workbook = XLSX.read(arrayBuffer, { type: "array" });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          jdText = XLSX.utils.sheet_to_json(sheet, { header: 1 })
            .map((row: any) => (Array.isArray(row) ? row.join(" ") : "").trim())
            .filter(Boolean)
            .join("\n");
        } catch (err) {
          console.error(`Failed to parse ${file.name}:`, err);
        }
      } else if (name.endsWith(".pdf") || name.endsWith(".docx") || name.endsWith(".doc")) {
        try {
          const formData = new FormData();
          formData.append("file", file);
          const res = await fetch(`${supabaseUrl}/functions/v1/parse-jd`, {
            method: "POST",
            headers: { Authorization: `Bearer ${supabaseKey}` },
            body: formData,
          });
          const data = await res.json();
          if (res.ok && data.text) jdText = data.text;
        } catch (err) {
          console.error(`Failed to parse ${file.name}:`, err);
        }
      }

      if (jdText.trim()) {
        // Use filename (without extension) as a placeholder title
        const baseName = file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ");
        newRoles.push({
          id: crypto.randomUUID(),
          title: baseName,
          jdText: jdText.trim(),
          jdFileName: file.name,
        });
      }
    }

    setTeamJdParsing(false);

    if (newRoles.length === 0) {
      toast({ title: "No JDs extracted", description: "Could not parse any files.", variant: "destructive" });
      return;
    }

    setRoles((prev) => {
      const existing = prev.filter((r) => r.title.trim());
      const combined = [...existing, ...newRoles].slice(0, 100);
      return combined.length >= 2 ? combined : [...combined, ...Array(2 - combined.length).fill(null).map(() => ({ id: crypto.randomUUID(), title: "" }))];
    });
    toast({ title: `${newRoles.length} JDs parsed`, description: "Titles extracted from filenames. Edit if needed, then analyze." });
    e.target.value = "";
  };

  const handleTeamAnalyze = async () => {
    const filledRoles = roles.filter((r) => r.title.trim() || r.jdText);
    if (filledRoles.length < 2) {
      toast({ title: "Add at least 2 roles", description: "Enter job titles for your team members." });
      return;
    }
    setTeamLoading(true);
    setTeamAnalyzed(false);
    try {
      const promises = filledRoles.map(async (role) => {
        if (!role.jdText) {
          const prebuilt = findPrebuiltRole(role.title);
          if (prebuilt) return { ...prebuilt, company: "" };
        }
        return analyzeJobWithAI(role.title, "", role.jdText || undefined);
      });
      const allResults = await Promise.all(promises);
      setTeamResults(allResults);
      setTeamAnalyzed(true);
    } catch {
      toast({ title: "Analysis failed", description: "Some roles couldn't be analyzed. Please try again.", variant: "destructive" });
    } finally {
      setTeamLoading(false);
    }
  };

  // Team aggregates
  const avgAugmented = teamResults.length ? Math.round(teamResults.reduce((s, r) => s + r.summary.augmentedPercent, 0) / teamResults.length) : 0;
  const avgAutomation = teamResults.length ? Math.round(teamResults.reduce((s, r) => s + r.summary.automationRiskPercent, 0) / teamResults.length) : 0;
  const avgNewSkills = teamResults.length ? Math.round(teamResults.reduce((s, r) => s + r.summary.newSkillsPercent, 0) / teamResults.length) : 0;

  const skillFreq = new Map<string, { count: number; category: SkillCategory; description: string }>();
  teamResults.forEach((r) => {
    r.skills.forEach((s) => {
      const existing = skillFreq.get(s.name);
      if (existing) existing.count++;
      else skillFreq.set(s.name, { count: 1, category: s.category, description: s.description });
    });
  });
  const sortedSkills = [...skillFreq.entries()].sort((a, b) => b[1].count - a[1].count);
  const sharedSkills = sortedSkills.filter(([, v]) => v.count > 1);
  const uniqueSkills = sortedSkills.filter(([, v]) => v.count === 1).slice(0, 8);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="flex flex-col items-center justify-center px-4 pt-24 pb-16 md:pt-32 md:pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto"
        >
          <span className="inline-block mb-4 px-3 py-1 text-xs font-medium tracking-wide uppercase rounded-full bg-accent text-accent-foreground">
            AI Impact Analyzer
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-display tracking-tight text-foreground leading-tight">
            How is AI changing{" "}
            <span className="text-primary">your job</span>?
          </h1>
          <p className="mt-5 text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed">
            Get a task-level breakdown of AI's impact — and a personalized plan to stay ahead.
          </p>
        </motion.div>

        {/* Mode toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mt-8 flex rounded-lg border border-border bg-card p-1 gap-1"
        >
          <button
            onClick={() => setMode("individual")}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              mode === "individual" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Briefcase className="h-3.5 w-3.5" /> Individual
          </button>
          <button
            onClick={() => setMode("team")}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              mode === "team" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Users className="h-3.5 w-3.5" /> Team
          </button>
        </motion.div>

        {/* Individual Form */}
        <AnimatePresence mode="wait">
          {mode === "individual" ? (
            <motion.form
              key="individual"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              onSubmit={handleSubmit}
              className="mt-8 w-full max-w-md space-y-3"
            >
              {/* Company website — hidden when JD URL provides it */}
              {!companyFromJdUrl && (
                <div>
                  <Input
                    placeholder="Company website (optional) — e.g. example.com"
                    value={website}
                    onChange={(e) => { setWebsite(e.target.value); setWebsiteError(""); }}
                    className={`h-12 bg-card border-border ${websiteError ? "border-destructive" : ""}`}
                  />
                  {websiteError && <p className="text-xs text-destructive mt-1">{websiteError}</p>}
                </div>
              )}
              <Input
                placeholder={hasJdContent ? "Job title (optional — extracted from JD)" : "Your job title *"}
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                required={!hasJdContent}
                className="h-12 bg-card border-border"
              />

              {/* JD input toggles */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => toggleJdInput("paste")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                    jdInputType === "paste"
                      ? "border-primary/50 bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:text-foreground hover:border-border/80"
                  }`}
                >
                  <FileText className="h-3 w-3" /> Paste JD
                </button>
                <button
                  type="button"
                  onClick={() => toggleJdInput("url")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                    jdInputType === "url"
                      ? "border-primary/50 bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:text-foreground hover:border-border/80"
                  }`}
                >
                  <Link className="h-3 w-3" /> JD URL
                </button>
                <label
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border transition-colors cursor-pointer ${
                    jdInputType === "file"
                      ? "border-primary/50 bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:text-foreground hover:border-border/80"
                  }`}
                >
                  <Upload className="h-3 w-3" /> Upload
                  <input
                    type="file"
                    accept=".pdf,.docx,.doc,.txt,.md"
                    className="hidden"
                    onChange={(e) => {
                      setJdInputType("file");
                      handleFileChange(e);
                    }}
                  />
                </label>
              </div>

              {/* JD paste area */}
              <AnimatePresence>
                {jdInputType === "paste" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <textarea
                      placeholder="Paste the full job description here..."
                      value={jdText}
                      onChange={(e) => setJdText(e.target.value)}
                      className="w-full min-h-[120px] max-h-[240px] px-3 py-2 text-sm bg-card border border-border rounded-md resize-y focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground"
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {jdText.length > 0 ? `${jdText.length.toLocaleString()} chars` : "Adding a JD makes the analysis much more accurate"}
                    </p>
                  </motion.div>
                )}
                {jdInputType === "url" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Input
                      placeholder="https://jobs.example.com/role/12345"
                      value={jdUrl}
                      onChange={(e) => setJdUrl(e.target.value)}
                      className="h-11 bg-card border-border"
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">We'll scrape the job posting for a more accurate analysis</p>
                  </motion.div>
                )}
                {jdInputType === "file" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-center gap-2 px-3 py-2.5 bg-card border border-border rounded-md">
                      {jdFileParsing ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                          <span className="text-sm text-muted-foreground">Extracting text from {jdFile?.name}...</span>
                        </>
                      ) : jdFileText ? (
                        <>
                          <FileText className="h-3.5 w-3.5 text-primary" />
                          <span className="text-sm text-foreground truncate flex-1">{jdFile?.name}</span>
                          <span className="text-[10px] text-muted-foreground shrink-0">{jdFileText.length.toLocaleString()} chars</span>
                          <button type="button" onClick={() => { setJdFile(null); setJdFileText(""); setJdInputType("none"); }} className="text-muted-foreground hover:text-foreground">
                            <X className="h-3 w-3" />
                          </button>
                        </>
                      ) : (
                        <span className="text-sm text-muted-foreground">Select a PDF, DOCX, or text file</span>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <Button type="submit" size="lg" className="w-full h-12 text-base font-semibold gap-2">
                Analyze My Role
                <ArrowRight className="w-4 h-4" />
              </Button>
            </motion.form>
          ) : (
            /* Team form — unchanged */
            <motion.div
              key="team"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="mt-8 w-full max-w-lg"
            >
              <div className="space-y-3 mb-4">
                {/* Compact chip view for roles */}
                <div className="flex flex-wrap gap-1.5 max-h-[280px] overflow-y-auto p-3 rounded-lg border border-border bg-card/50">
                  {roles.map((role) => (
                    <div
                      key={role.id}
                      className="group inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-accent/40 border border-border/50 text-sm hover:border-border transition-colors max-w-[280px]"
                    >
                      {role.jdFileName && (
                        <span title={`JD: ${role.jdFileName}`}>
                          <FileText className="h-3 w-3 text-primary shrink-0" />
                        </span>
                      )}
                      <input
                        className="bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground text-sm w-full min-w-[80px]"
                        value={role.title}
                        onChange={(e) => updateRole(role.id, e.target.value)}
                        placeholder="Job title"
                      />
                      <button
                        type="button"
                        onClick={() => removeRole(role.id)}
                        className="text-muted-foreground/50 hover:text-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {roles.length === 0 && (
                    <span className="text-xs text-muted-foreground py-1">Upload a file or add roles manually</span>
                  )}
                </div>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground px-1">
                  <span>{roles.filter(r => r.title.trim()).length} roles{roles.some(r => r.jdFileName) && ` · ${roles.filter(r => r.jdFileName).length} with JDs`}</span>
                  <span>Max 100</span>
                </div>
              </div>

              {/* Parsing indicator */}
              {teamJdParsing && (
                <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-md bg-accent/30 border border-border">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                  <span className="text-xs text-muted-foreground">Parsing JD files...</span>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={addRole} disabled={roles.length >= 100} className="gap-1">
                  <Plus className="h-3.5 w-3.5" /> Add role
                </Button>
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-border text-muted-foreground hover:text-foreground hover:border-border/80 cursor-pointer transition-colors">
                  <Upload className="h-3 w-3" /> Upload files
                  <input type="file" accept=".csv,.txt,.tsv,.xlsx,.xls,.pdf,.docx,.doc,.md" multiple className="hidden" onChange={handleFilesUpload} disabled={teamJdParsing} />
                </label>
                <Button onClick={handleTeamAnalyze} disabled={teamLoading || teamJdParsing} className="gap-2 ml-auto">
                  {teamLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BarChart3 className="h-4 w-4" />}
                  {teamLoading ? "Analyzing..." : "Analyze Team"}
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">Upload CSV/XLSX for job title lists, or PDF/DOCX files for job descriptions — mix and match.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Team Results */}
      {mode === "team" && teamAnalyzed && teamResults.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="px-4 pb-24">
          <div className="max-w-2xl mx-auto space-y-8">
            <div>
              <h2 className="font-display font-semibold text-foreground mb-4">Team Overview</h2>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "Avg. Augmented", value: avgAugmented },
                  { label: "Avg. Automation Risk", value: avgAutomation },
                  { label: "Avg. New Skills Needed", value: avgNewSkills },
                ].map((stat) => (
                  <Card key={stat.label} className="border-border">
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-foreground">{stat.value}%</p>
                      <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div>
              <h2 className="font-display font-semibold text-foreground mb-4">AI Impact by Role</h2>
              <div className="space-y-3">
                {teamResults.map((r, idx) => {
                  const matchingRole = roles.find(role => role.title === r.jobTitle || role.jdText);
                  return (
                    <Card key={r.jobTitle + idx} className="border-border">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-foreground text-sm">{r.jobTitle}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">{r.summary.automationRiskPercent}% automation risk</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs gap-1 text-primary hover:text-primary"
                              onClick={() => {
                                // Store JD text if available from the role entry
                                const roleEntry = roles[idx] || matchingRole;
                                if (roleEntry?.jdText) {
                                  sessionStorage.setItem("jd_text", roleEntry.jdText);
                                } else {
                                  sessionStorage.removeItem("jd_text");
                                }
                                const params = new URLSearchParams({ title: r.jobTitle, company: r.company || "" });
                                if (roleEntry?.jdText) params.set("jd", "session");
                                navigate(`/analysis?${params.toString()}`);
                              }}
                            >
                              <Search className="h-3 w-3" /> Deep dive
                            </Button>
                          </div>
                        </div>
                        <Progress value={r.summary.augmentedPercent} className="h-2" />
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {sharedSkills.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <h2 className="font-display font-semibold text-foreground">Shared Skill Gaps</h2>
                </div>
                <p className="text-sm text-muted-foreground mb-4">Skills needed across multiple roles — high-impact training investments.</p>
                <div className="space-y-2">
                  {sharedSkills.map(([name, data]) => (
                    <Card key={name} className="border-border">
                      <CardContent className="p-3 flex items-center justify-between">
                        <div>
                          <span className="font-medium text-foreground text-sm">{name}</span>
                          <p className="text-xs text-muted-foreground">{data.description}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="outline" className="text-xs">{categoryLabels[data.category]}</Badge>
                          <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">{data.count} roles</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {uniqueSkills.length > 0 && (
              <div>
                <h2 className="font-display font-semibold text-foreground mb-4">Role-Specific Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {uniqueSkills.map(([name, data]) => (
                    <Badge key={name} variant="outline" className="text-xs py-1.5" title={data.description}>
                      {name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* How it works (individual mode only) */}
      {mode === "individual" && (
        <div className="px-4 pb-24">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-center text-sm font-medium uppercase tracking-widest text-muted-foreground mb-10">
              How it works
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {steps.map((step, i) => (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
                  className="text-center"
                >
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                    <step.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-display font-semibold text-foreground">{step.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{step.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;

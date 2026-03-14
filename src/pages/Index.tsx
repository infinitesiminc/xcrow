import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Briefcase, BarChart3, BookOpen, Users, Plus, X, Loader2, FileText, Link, Upload, Search, User, LayoutDashboard, TrendingUp, ChevronLeft, ChevronRight } from "lucide-react";
import logoImg from "@/assets/logo.png";
import roleSoftwareEngineer from "@/assets/role-software-engineer.jpg";
import roleMarketingManager from "@/assets/role-marketing-manager.jpg";
import roleAccountant from "@/assets/role-accountant.jpg";
import roleDataScientist from "@/assets/role-data-scientist.jpg";
import roleProductManager from "@/assets/role-product-manager.jpg";
import roleFinancialAnalyst from "@/assets/role-financial-analyst.jpg";
import roleInvestmentBanker from "@/assets/role-investment-banker.jpg";
import roleContentStrategist from "@/assets/role-content-strategist.jpg";
import roleSeoSpecialist from "@/assets/role-seo-specialist.jpg";
import roleProjectManager from "@/assets/role-project-manager.jpg";
import roleHrManager from "@/assets/role-hr-manager.jpg";
import roleSupplyChainManager from "@/assets/role-supply-chain-manager.jpg";
import roleCorporateLawyer from "@/assets/role-corporate-lawyer.jpg";
import roleComplianceOfficer from "@/assets/role-compliance-officer.jpg";
import roleParalegal from "@/assets/role-paralegal.jpg";
import roleDevopsEngineer from "@/assets/role-devops-engineer.jpg";
import roleUxDesigner from "@/assets/role-ux-designer.jpg";
import roleCybersecurityAnalyst from "@/assets/role-cybersecurity-analyst.jpg";
import roleTaxAdvisor from "@/assets/role-tax-advisor.jpg";
import roleRiskManager from "@/assets/role-risk-manager.jpg";
import roleAuditor from "@/assets/role-auditor.jpg";
import roleSocialMediaManager from "@/assets/role-social-media-manager.jpg";
import roleBrandStrategist from "@/assets/role-brand-strategist.jpg";
import roleBusinessAnalyst from "@/assets/role-business-analyst.jpg";
import roleOperationsManager from "@/assets/role-operations-manager.jpg";
import roleCustomerSuccessManager from "@/assets/role-customer-success-manager.jpg";
import roleContractAttorney from "@/assets/role-contract-attorney.jpg";
import roleIpSpecialist from "@/assets/role-ip-specialist.jpg";
import roleLegalOpsManager from "@/assets/role-legal-ops-manager.jpg";
import roleQaManager from "@/assets/role-qa-manager.jpg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { JobAnalysisResult } from "@/types/analysis";
import { findPrebuiltRole } from "@/data/prebuilt-roles";
import { analyzeJobWithAI } from "@/lib/ai-analysis";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface RoleCard {
  title: string;
  image: string;
  augmented: number;
  risk: number;
  tag: string;
}

const roleCategories: { label: string; roles: RoleCard[] }[] = [
  {
    label: "Tech",
    roles: [
      { title: "Software Engineer", image: roleSoftwareEngineer, augmented: 72, risk: 15, tag: "High AI Augmentation" },
      { title: "Data Scientist", image: roleDataScientist, augmented: 78, risk: 12, tag: "AI-Native Role" },
      { title: "Product Manager", image: roleProductManager, augmented: 65, risk: 18, tag: "Strategic AI Use" },
      { title: "DevOps Engineer", image: roleDevopsEngineer, augmented: 70, risk: 20, tag: "High AI Augmentation" },
      { title: "UX Designer", image: roleUxDesigner, augmented: 60, risk: 22, tag: "Moderate Change" },
      { title: "Cybersecurity Analyst", image: roleCybersecurityAnalyst, augmented: 68, risk: 16, tag: "Strategic AI Use" },
    ],
  },
  {
    label: "Finance",
    roles: [
      { title: "Accountant", image: roleAccountant, augmented: 60, risk: 35, tag: "Automation Risk" },
      { title: "Financial Analyst", image: roleFinancialAnalyst, augmented: 70, risk: 28, tag: "High AI Augmentation" },
      { title: "Investment Banker", image: roleInvestmentBanker, augmented: 55, risk: 20, tag: "Moderate Change" },
      { title: "Tax Advisor", image: roleTaxAdvisor, augmented: 62, risk: 38, tag: "Automation Risk" },
      { title: "Risk Manager", image: roleRiskManager, augmented: 66, risk: 24, tag: "Strategic AI Use" },
      { title: "Auditor", image: roleAuditor, augmented: 58, risk: 42, tag: "High Automation Risk" },
    ],
  },
  {
    label: "Marketing",
    roles: [
      { title: "Marketing Manager", image: roleMarketingManager, augmented: 68, risk: 25, tag: "Rapid AI Growth" },
      { title: "Content Strategist", image: roleContentStrategist, augmented: 74, risk: 30, tag: "High AI Augmentation" },
      { title: "SEO Specialist", image: roleSeoSpecialist, augmented: 72, risk: 40, tag: "Automation Risk" },
      { title: "Social Media Manager", image: roleSocialMediaManager, augmented: 70, risk: 35, tag: "Automation Risk" },
      { title: "Brand Strategist", image: roleBrandStrategist, augmented: 55, risk: 15, tag: "Strategic AI Use" },
      { title: "Business Analyst", image: roleBusinessAnalyst, augmented: 67, risk: 26, tag: "Moderate Change" },
    ],
  },
  {
    label: "Operations",
    roles: [
      { title: "Project Manager", image: roleProjectManager, augmented: 62, risk: 22, tag: "Moderate Change" },
      { title: "HR Manager", image: roleHrManager, augmented: 58, risk: 30, tag: "Automation Risk" },
      { title: "Supply Chain Manager", image: roleSupplyChainManager, augmented: 65, risk: 28, tag: "High AI Augmentation" },
      { title: "Operations Manager", image: roleOperationsManager, augmented: 60, risk: 25, tag: "Moderate Change" },
      { title: "Customer Success Manager", image: roleCustomerSuccessManager, augmented: 55, risk: 20, tag: "Strategic AI Use" },
      { title: "QA Manager", image: roleQaManager, augmented: 64, risk: 32, tag: "Automation Risk" },
    ],
  },
  {
    label: "Legal",
    roles: [
      { title: "Corporate Lawyer", image: roleCorporateLawyer, augmented: 55, risk: 18, tag: "Strategic AI Use" },
      { title: "Compliance Officer", image: roleComplianceOfficer, augmented: 60, risk: 32, tag: "Automation Risk" },
      { title: "Paralegal", image: roleParalegal, augmented: 68, risk: 45, tag: "High Automation Risk" },
      { title: "Contract Attorney", image: roleContractAttorney, augmented: 65, risk: 40, tag: "Automation Risk" },
      { title: "IP Specialist", image: roleIpSpecialist, augmented: 52, risk: 15, tag: "Strategic AI Use" },
      { title: "Legal Ops Manager", image: roleLegalOpsManager, augmented: 63, risk: 28, tag: "Moderate Change" },
    ],
  },
];

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
  const { user } = useAuth();
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
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const teamFileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Team state
  const [roles, setRoles] = useState<RoleEntry[]>([
    { id: crypto.randomUUID(), title: "" },
    { id: crypto.randomUUID(), title: "" },
  ]);
  const [teamLoading, setTeamLoading] = useState(false);
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
    try {
      const promises = filledRoles.map(async (role) => {
        if (!role.jdText) {
          const prebuilt = findPrebuiltRole(role.title);
          if (prebuilt) return { ...prebuilt, company: "" };
        }
        return analyzeJobWithAI(role.title, "", role.jdText || undefined);
      });
      const allResults = await Promise.all(promises);
      // Store results in sessionStorage and navigate to dedicated page
      sessionStorage.setItem("team_results", JSON.stringify(allResults));
      sessionStorage.setItem("team_roles", JSON.stringify(
        filledRoles.map(r => ({ title: r.title, jdText: r.jdText }))
      ));
      navigate("/team-analysis");
    } catch {
      toast({ title: "Analysis failed", description: "Some roles couldn't be analyzed. Please try again.", variant: "destructive" });
    } finally {
      setTeamLoading(false);
    }
  };


  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Minimal top bar */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-2 shrink-0">
        <div className="flex items-center gap-2 font-sans text-sm font-bold tracking-tight text-foreground">
          <img src={logoImg} alt="Infinite Sim" className="h-5 w-5" />
          Infinite Sim
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => navigate("/for-individuals")}>
            For Individuals
          </Button>
          <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => navigate("/for-organizations")}>
            For Organizations
          </Button>
          {user ? (
            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => navigate("/dashboard")}>
              <LayoutDashboard className="mr-1 h-3.5 w-3.5" /> Dashboard
            </Button>
          ) : (
            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => navigate("/auth")}>
              <User className="mr-1 h-3.5 w-3.5" /> Sign in
            </Button>
          )}
        </div>
      </div>

      {/* Single column centered content */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="w-full mx-auto px-6 sm:px-10 lg:px-16 py-6">
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-6"
          >
            <span className="inline-block mb-3 px-3 py-1 text-xs font-sans font-medium tracking-widest uppercase rounded-full bg-accent text-accent-foreground">
              Infinite Sim
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-serif tracking-tight text-foreground leading-[1.1] max-w-3xl mx-auto">
              See how AI changes your role — <em className="italic">then master it</em>
            </h1>
          </motion.div>

          {/* Form strip */}
          <div className="flex flex-col items-center mb-8">
            {/* Top row: mode toggle + re-analyze */}
            <div className="flex items-center gap-3 mb-3 flex-wrap justify-center">
              <div className="flex rounded-lg border border-border bg-card p-1 gap-1">
                <button
                  onClick={() => setMode("individual")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    mode === "individual" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Briefcase className="h-3.5 w-3.5" /> Individual
                </button>
                <button
                  onClick={() => setMode("team")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    mode === "team" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Users className="h-3.5 w-3.5" /> Team
                </button>
              </div>

              {lastAnalysis && lastAnalysis.jobTitle && (
                <button
                  type="button"
                  onClick={() => {
                    const params = new URLSearchParams({ company: lastAnalysis.company, title: lastAnalysis.jobTitle });
                    navigate(`/analysis?${params.toString()}`);
                  }}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-full border border-border bg-card text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
                >
                  <Search className="h-3 w-3" />
                  Re-analyze: <span className="text-foreground font-semibold">{lastAnalysis.jobTitle}</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              )}
            </div>

            <AnimatePresence mode="wait">
              {mode === "individual" ? (
                <motion.form
                  key="individual"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleSubmit}
                  className="w-full max-w-2xl"
                >
                  {/* Single strip: inputs + JD toggles + button */}
                  <div className="flex items-center gap-2 p-2 rounded-xl border border-border bg-card shadow-sm flex-wrap">
                    {!companyFromJdUrl && (
                      <Input
                        placeholder="Company website (optional)"
                        value={website}
                        onChange={(e) => { setWebsite(e.target.value); setWebsiteError(""); }}
                        className={`h-9 border-0 bg-transparent text-sm shadow-none focus-visible:ring-0 flex-1 min-w-[140px] ${websiteError ? "text-destructive" : ""}`}
                      />
                    )}
                    <div className="w-px h-6 bg-border hidden sm:block" />
                    <Input
                      placeholder={hasJdContent ? "Job title (optional)" : "Your job title *"}
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      required={!hasJdContent}
                      className="h-9 border-0 bg-transparent text-sm shadow-none focus-visible:ring-0 flex-1 min-w-[120px]"
                    />
                    <div className="w-px h-6 bg-border hidden sm:block" />
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => toggleJdInput("paste")}
                        className={`p-1.5 rounded-md transition-colors ${
                          jdInputType === "paste" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
                        }`} title="Paste JD"><FileText className="h-4 w-4" /></button>
                      <button type="button" onClick={() => toggleJdInput("url")}
                        className={`p-1.5 rounded-md transition-colors ${
                          jdInputType === "url" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
                        }`} title="JD URL"><Link className="h-4 w-4" /></button>
                      <button type="button" onClick={() => { jdInputType === "file" ? toggleJdInput("file") : setJdInputType("file"); }}
                        className={`p-1.5 rounded-md transition-colors ${
                          jdInputType === "file" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
                        }`} title="Upload"><Upload className="h-4 w-4" /></button>
                    </div>
                    <Button type="submit" size="sm" className="h-9 px-4 text-sm font-semibold gap-1.5 shrink-0">
                      Analyze <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  {websiteError && <p className="text-xs text-destructive mt-1 px-2">{websiteError}</p>}

                  {/* Expandable JD input areas */}
                  <AnimatePresence>
                    {jdInputType === "paste" && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} className="mt-2">
                        <textarea
                          placeholder="Paste the full job description here..."
                          value={jdText}
                          onChange={(e) => setJdText(e.target.value)}
                          className="w-full min-h-[80px] max-h-[140px] px-3 py-2 text-sm bg-card border border-border rounded-md resize-y focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground"
                        />
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {jdText.length > 0 ? `${jdText.length.toLocaleString()} chars` : "Adding a JD makes the analysis much more accurate"}
                        </p>
                      </motion.div>
                    )}
                    {jdInputType === "url" && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} className="mt-2">
                        <Input placeholder="https://jobs.example.com/role/12345" value={jdUrl} onChange={(e) => setJdUrl(e.target.value)} className="h-10 bg-card border-border text-sm" />
                        <p className="text-[10px] text-muted-foreground mt-0.5">We'll scrape the job posting for a more accurate analysis</p>
                      </motion.div>
                    )}
                    {jdInputType === "file" && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} className="mt-2">
                        {jdFileParsing ? (
                          <motion.div className="flex items-center gap-2 py-4 px-3 rounded-lg border border-primary/30 bg-primary/5" animate={{ opacity: [0.7, 1, 0.7] }} transition={{ duration: 1.5, repeat: Infinity }}>
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                            <span className="text-xs text-primary font-medium">Extracting text from {jdFile?.name}...</span>
                          </motion.div>
                        ) : jdFileText ? (
                          <div className="flex items-center gap-2 px-3 py-2 bg-card border border-primary/20 rounded-lg">
                            <FileText className="h-3.5 w-3.5 text-primary shrink-0" />
                            <span className="text-sm text-foreground truncate flex-1">{jdFile?.name}</span>
                            <span className="text-[10px] text-muted-foreground shrink-0">{jdFileText.length.toLocaleString()} chars</span>
                            <button type="button" onClick={() => { setJdFile(null); setJdFileText(""); setJdInputType("none"); }} className="text-muted-foreground hover:text-foreground">
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <div
                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={(e) => {
                              e.preventDefault(); setIsDragging(false);
                              const file = e.dataTransfer.files?.[0];
                              if (file) { const dt = new DataTransfer(); dt.items.add(file); if (fileInputRef.current) { fileInputRef.current.files = dt.files; fileInputRef.current.dispatchEvent(new Event("change", { bubbles: true })); } }
                            }}
                            onClick={() => fileInputRef.current?.click()}
                            className={`flex items-center justify-center gap-2 py-5 px-4 rounded-lg border-2 border-dashed cursor-pointer transition-colors ${
                              isDragging ? "border-primary bg-primary/10" : "border-border hover:border-primary/40 hover:bg-accent/30"
                            }`}
                          >
                            <Upload className={`h-5 w-5 ${isDragging ? "text-primary" : "text-muted-foreground"}`} />
                            <p className="text-sm text-muted-foreground">
                              {isDragging ? "Drop here" : "Drop file or click to upload"}
                            </p>
                            <input ref={fileInputRef} type="file" accept=".pdf,.docx,.doc,.txt,.md" className="hidden"
                              onChange={(e) => { setJdInputType("file"); handleFileChange(e); }} />
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.form>
              ) : (
                <motion.div
                  key="team"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="w-full max-w-sm"
                >
                  <div className="space-y-2 mb-3">
                    <div className="flex flex-wrap gap-1.5 max-h-[160px] overflow-y-auto p-2.5 rounded-lg border border-border bg-card/50">
                      {roles.map((role) => (
                        <div key={role.id} className="group inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-accent/40 border border-border/50 text-sm hover:border-border transition-colors max-w-[240px]">
                          {role.jdFileName && <span title={`JD: ${role.jdFileName}`}><FileText className="h-3 w-3 text-primary shrink-0" /></span>}
                          <input className="bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground text-sm w-full min-w-[70px]" value={role.title} onChange={(e) => updateRole(role.id, e.target.value)} placeholder="Job title" />
                          <button type="button" onClick={() => removeRole(role.id)} className="text-muted-foreground/50 hover:text-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"><X className="h-3 w-3" /></button>
                        </div>
                      ))}
                      <button type="button" onClick={addRole} disabled={roles.length >= 100} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-dashed border-border/60 text-xs text-muted-foreground hover:text-foreground hover:border-border transition-colors disabled:opacity-40">
                        <Plus className="h-3 w-3" /> Add
                      </button>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground px-1">
                      <span>{roles.filter(r => r.title.trim()).length} roles{roles.some(r => r.jdFileName) && ` · ${roles.filter(r => r.jdFileName).length} with JDs`}</span>
                      <span>Max 100</span>
                    </div>
                  </div>

                  {teamJdParsing && (
                    <div className="flex items-center gap-2 mb-2 px-3 py-1.5 rounded-md bg-accent/30 border border-border">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                      <span className="text-xs text-muted-foreground">Parsing JD files...</span>
                    </div>
                  )}

                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault(); setIsDragging(false);
                      const files = e.dataTransfer.files;
                      if (files?.length && teamFileInputRef.current) { const dt = new DataTransfer(); Array.from(files).forEach(f => dt.items.add(f)); teamFileInputRef.current.files = dt.files; teamFileInputRef.current.dispatchEvent(new Event("change", { bubbles: true })); }
                    }}
                    onClick={() => teamFileInputRef.current?.click()}
                    className={`flex items-center justify-center gap-2 py-5 px-4 rounded-lg border-2 border-dashed cursor-pointer transition-colors mb-2.5 ${
                      isDragging ? "border-primary bg-primary/10" : "border-border hover:border-primary/40 hover:bg-accent/30"
                    }`}
                  >
                    <Upload className={`h-5 w-5 ${isDragging ? "text-primary" : "text-muted-foreground"}`} />
                    <p className="text-sm text-muted-foreground">{isDragging ? "Drop files here" : "Drop files or click to upload"}</p>
                    <p className="text-[10px] text-muted-foreground">CSV/XLSX or PDF/DOCX</p>
                    <input ref={teamFileInputRef} type="file" accept=".csv,.txt,.tsv,.xlsx,.xls,.pdf,.docx,.doc,.md" multiple className="hidden" onChange={handleFilesUpload} disabled={teamJdParsing} />
                  </div>

                  <Button onClick={handleTeamAnalyze} disabled={teamLoading || teamJdParsing} className="gap-2 w-full h-10 text-sm font-semibold">
                    {teamLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BarChart3 className="h-4 w-4" />}
                    {teamLoading ? "Analyzing..." : "Analyze Team"}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Categorized Role Rows */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold font-sans text-foreground">Popular roles — explore free</h2>
            </div>
            {roleCategories.map((category, catIdx) => (
              <div key={category.label}>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{category.label}</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                  {category.roles.map((role, i) => (
                    <motion.button
                      key={role.title}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.1 + i * 0.08 }}
                      onClick={() => navigate(`/analysis?title=${encodeURIComponent(role.title)}&company=`)}
                      className="group cursor-pointer text-left flex flex-col"
                    >
                      <div className="overflow-hidden rounded-xl aspect-[4/3] mb-2">
                        <img src={role.image} alt={role.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                      </div>
                      <h3 className="text-sm font-semibold text-foreground leading-tight min-h-[2.5em]">{role.title}</h3>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                        <span className="flex items-center gap-0.5"><Briefcase className="h-3 w-3" />{role.augmented}%</span>
                        <span className="flex items-center gap-0.5"><TrendingUp className="h-3 w-3" />{role.risk}%</span>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;

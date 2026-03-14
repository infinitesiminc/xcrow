import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Briefcase, BarChart3, BookOpen, Users, Plus, X, Loader2, FileText, Link, Upload, Search, User, LayoutDashboard, TrendingUp, ChevronLeft, ChevronRight, Wrench, ExternalLink } from "lucide-react";
import logoImg from "@/assets/logo.png";
import heroBg from "@/assets/hero-bg.png";
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
import { RoleSearchAutocomplete } from "@/components/RoleSearchAutocomplete";


interface RoleCard {
  title: string;
  image: string;
  augmented: number;
  risk: number;
  agentRisk: number;
  tag: string;
}

function calcAgentRisk(automationRisk: number, augmented: number, newSkills: number): number {
  return Math.round(automationRisk * 0.55 + (100 - augmented) * 0.25 + newSkills * 0.20);
}

// All 30 roles with their agent replacement risk computed
const allRoles: RoleCard[] = [
  // Tech — balanced across tiers
  { title: "Software Engineer", image: roleSoftwareEngineer, augmented: 80, risk: 10, agentRisk: calcAgentRisk(10, 80, 45), tag: "Tech" },
  { title: "Data Scientist", image: roleDataScientist, augmented: 82, risk: 10, agentRisk: calcAgentRisk(10, 82, 40), tag: "Tech" },
  { title: "Product Manager", image: roleProductManager, augmented: 72, risk: 12, agentRisk: calcAgentRisk(12, 72, 45), tag: "Tech" },
  { title: "DevOps Engineer", image: roleDevopsEngineer, augmented: 70, risk: 20, agentRisk: calcAgentRisk(20, 70, 55), tag: "Tech" },
  { title: "UX Designer", image: roleUxDesigner, augmented: 65, risk: 22, agentRisk: calcAgentRisk(22, 65, 50), tag: "Tech" },
  { title: "Cybersecurity Analyst", image: roleCybersecurityAnalyst, augmented: 78, risk: 10, agentRisk: calcAgentRisk(10, 78, 40), tag: "Tech" },
  { title: "QA Manager", image: roleQaManager, augmented: 60, risk: 38, agentRisk: calcAgentRisk(38, 60, 60), tag: "Tech" },
  // Finance — spread across tiers
  { title: "Accountant", image: roleAccountant, augmented: 55, risk: 42, agentRisk: calcAgentRisk(42, 55, 60), tag: "Finance" },
  { title: "Financial Analyst", image: roleFinancialAnalyst, augmented: 72, risk: 22, agentRisk: calcAgentRisk(22, 72, 50), tag: "Finance" },
  { title: "Investment Banker", image: roleInvestmentBanker, augmented: 70, risk: 14, agentRisk: calcAgentRisk(14, 70, 35), tag: "Finance" },
  { title: "Tax Advisor", image: roleTaxAdvisor, augmented: 55, risk: 44, agentRisk: calcAgentRisk(44, 55, 58), tag: "Finance" },
  { title: "Risk Manager", image: roleRiskManager, augmented: 68, risk: 20, agentRisk: calcAgentRisk(20, 68, 50), tag: "Finance" },
  { title: "Auditor", image: roleAuditor, augmented: 52, risk: 48, agentRisk: calcAgentRisk(48, 52, 62), tag: "Finance" },
  // Marketing — spread across tiers
  { title: "Marketing Manager", image: roleMarketingManager, augmented: 62, risk: 32, agentRisk: calcAgentRisk(32, 62, 68), tag: "Marketing" },
  { title: "Content Strategist", image: roleContentStrategist, augmented: 74, risk: 22, agentRisk: calcAgentRisk(22, 74, 50), tag: "Marketing" },
  { title: "SEO Specialist", image: roleSeoSpecialist, augmented: 68, risk: 45, agentRisk: calcAgentRisk(45, 68, 65), tag: "Marketing" },
  { title: "Social Media Manager", image: roleSocialMediaManager, augmented: 65, risk: 38, agentRisk: calcAgentRisk(38, 65, 62), tag: "Marketing" },
  { title: "Brand Strategist", image: roleBrandStrategist, augmented: 72, risk: 8, agentRisk: calcAgentRisk(8, 72, 35), tag: "Marketing" },
  { title: "Business Analyst", image: roleBusinessAnalyst, augmented: 70, risk: 22, agentRisk: calcAgentRisk(22, 70, 50), tag: "Marketing" },
  // Operations — spread across tiers
  { title: "Project Manager", image: roleProjectManager, augmented: 68, risk: 20, agentRisk: calcAgentRisk(20, 68, 48), tag: "Operations" },
  { title: "HR Manager", image: roleHrManager, augmented: 55, risk: 35, agentRisk: calcAgentRisk(35, 55, 55), tag: "Operations" },
  { title: "Supply Chain Manager", image: roleSupplyChainManager, augmented: 70, risk: 22, agentRisk: calcAgentRisk(22, 70, 48), tag: "Operations" },
  { title: "Operations Manager", image: roleOperationsManager, augmented: 65, risk: 22, agentRisk: calcAgentRisk(22, 65, 48), tag: "Operations" },
  { title: "Customer Success Manager", image: roleCustomerSuccessManager, augmented: 72, risk: 12, agentRisk: calcAgentRisk(12, 72, 35), tag: "Operations" },
  // Legal — spread across tiers
  { title: "Corporate Lawyer", image: roleCorporateLawyer, augmented: 72, risk: 10, agentRisk: calcAgentRisk(10, 72, 35), tag: "Legal" },
  { title: "Compliance Officer", image: roleComplianceOfficer, augmented: 58, risk: 36, agentRisk: calcAgentRisk(36, 58, 58), tag: "Legal" },
  { title: "Paralegal", image: roleParalegal, augmented: 62, risk: 50, agentRisk: calcAgentRisk(50, 62, 65), tag: "Legal" },
  { title: "Contract Attorney", image: roleContractAttorney, augmented: 60, risk: 44, agentRisk: calcAgentRisk(44, 60, 58), tag: "Legal" },
  { title: "IP Specialist", image: roleIpSpecialist, augmented: 75, risk: 8, agentRisk: calcAgentRisk(8, 75, 30), tag: "Legal" },
  { title: "Legal Ops Manager", image: roleLegalOpsManager, augmented: 68, risk: 22, agentRisk: calcAgentRisk(22, 68, 48), tag: "Legal" },
];

// Sort into risk tiers — Linear-style: grayscale text, colored dots only
const riskTiers: { label: string; dotColor: string; roles: RoleCard[] }[] = [
  {
    label: "High Risk",
    dotColor: "bg-dot-purple",
    roles: allRoles.filter(r => r.agentRisk >= 35).sort((a, b) => b.agentRisk - a.agentRisk),
  },
  {
    label: "Moderate Risk",
    dotColor: "bg-dot-amber",
    roles: allRoles.filter(r => r.agentRisk >= 25 && r.agentRisk < 35).sort((a, b) => b.agentRisk - a.agentRisk),
  },
  {
    label: "Lower Risk",
    dotColor: "bg-dot-teal",
    roles: allRoles.filter(r => r.agentRisk < 25).sort((a, b) => b.agentRisk - a.agentRisk),
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
  const { user, openAuthModal, profile } = useAuth();
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

  // Pre-fill from user profile
  useEffect(() => {
    if (profile?.jobTitle && !jobTitle) {
      setJobTitle(profile.jobTitle);
    }
    if (profile?.company && !website) {
      setWebsite(profile.company);
    }
  }, [profile]);

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

      {/* Single column centered content */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="w-full mx-auto px-4 sm:px-10 lg:px-16 py-6">
          {/* Hero */}
          <div className="relative rounded-2xl overflow-hidden mb-6">
            <img src={heroBg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" loading="eager" fetchPriority="high" decoding="sync" />
            <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-background/30 to-background" />
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="relative text-center py-8 sm:py-10 px-4"
            >
            <span className="inline-block mb-3 px-3 py-1 text-xs font-sans font-medium tracking-widest uppercase rounded-full bg-accent text-accent-foreground">
              Infinite Sim
            </span>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold font-serif tracking-tight text-foreground leading-[1.1] max-w-3xl mx-auto">
               Upskill before<br /><em className="italic">AI takes your{" "}<span className="whitespace-nowrap"><span className="laser-word">job</span>.</span></em>
             </h1>
             <p className="mt-3 text-sm sm:text-base text-foreground font-sans">
               Assess &amp; start learning in 3 seconds.
             </p>
          </motion.div>
          </div>

          {/* Form strip */}
          <div className="flex flex-col items-center mb-8">
            {/* Top row: mode toggle + re-analyze */}
            <div className="flex items-center gap-3 mb-3 flex-wrap justify-center">
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

            <RoleSearchAutocomplete
              value={jobTitle}
              onChange={setJobTitle}
              onAnalyze={(title) => {
                setJobTitle(title);
                handleSubmit(new Event("submit") as any);
              }}
              jdInputType={jdInputType}
              onToggleJd={toggleJdInput}
              hasJdContent={hasJdContent}
            />

            {/* Expandable JD input areas */}
            <div className="w-full max-w-2xl">
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
            </div>
          </div>

          {/* Risk-Tiered Roles */}
          <div className="space-y-8">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Roles ranked by AI replacement risk</h2>
              </div>
            </div>

            {riskTiers.map((tier) => {
              const half = Math.ceil(tier.roles.length / 2);
              const row1 = tier.roles.slice(0, half);
              const row2 = tier.roles.slice(half);
              return (
                <div key={tier.label}>
                  <div className="inline-flex items-center gap-2 mb-3">
                    <span className={`w-2.5 h-2.5 rounded-full ${tier.dotColor} shrink-0`} />
                    <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{tier.label}</span>
                    <span className="text-[10px] text-muted-foreground/60">({tier.roles.length})</span>
                  </div>
                  <div className="space-y-3">
                    {[row1, row2].map((row, rowIdx) => (
                      row.length > 0 && (
                        <div key={rowIdx} className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent -mx-4 px-4 sm:-mx-6 sm:px-6">
                          {row.map((role, i) => (
                            <motion.button
                              key={role.title}
                              initial={{ opacity: 0, y: 12 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.4, delay: 0.1 + i * 0.05 }}
                              onClick={() => navigate(`/analysis?title=${encodeURIComponent(role.title)}&company=`)}
                              className="group cursor-pointer text-left flex flex-col shrink-0 w-[170px] sm:w-[200px]"
                            >
                              <div className="relative overflow-hidden rounded-xl aspect-[4/3] mb-2.5">
                                <img src={role.image} alt={role.title} className="w-full h-full object-cover transition-all duration-300 group-hover:scale-105 saturate-[0.45] brightness-105 hue-rotate-[210deg]" />
                                <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-background/80 backdrop-blur-sm border border-border/40">
                                  <span className={`w-2 h-2 rounded-full ${tier.dotColor}`} />
                                  <span className="text-xs font-bold text-foreground">{role.agentRisk}%</span>
                                </div>
                              </div>
                              <h3 className="text-[15px] font-semibold font-sans text-foreground leading-snug">{role.title}</h3>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[11px] px-2 py-0.5 rounded bg-accent text-muted-foreground">{role.tag}</span>
                              </div>
                            </motion.button>
                          ))}
                        </div>
                      )
                    ))}
                  </div>
                </div>
              );
            })}

          {/* Tool Marketplace CTA */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-4"
          >
            <div
              onClick={() => navigate("/tools")}
              className="group cursor-pointer rounded-xl border border-border/50 bg-card hover:border-border transition-colors p-5 sm:p-6"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-accent shrink-0">
                    <Wrench className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-foreground">Tool Marketplace</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">55+ AI tools, platforms & learning resources for every role</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0" />
              </div>
              <div className="flex gap-1.5 flex-wrap mt-3">
                {["ChatGPT Enterprise", "Microsoft Copilot", "GitHub Copilot", "Jasper", "Zapier", "DataCamp"].map(tool => (
                  <span key={tool} className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{tool}</span>
                ))}
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">+49 more</span>
              </div>
            </div>
          </motion.div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;

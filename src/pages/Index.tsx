import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Search, X, Loader2, FileText, Upload, TrendingUp, Wrench } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { RoleSearchAutocomplete } from "@/components/RoleSearchAutocomplete";
import RoleFeed from "@/components/RoleFeed";
import { findPrebuiltRole } from "@/data/prebuilt-roles";
import { analyzeJobWithAI } from "@/lib/ai-analysis";

interface RoleCard {
  title: string;
  image: string;
  augmented: number;
  risk: number;
  aiOpportunity: number;
  tag: string;
}

function calcToolsToLearn(automationRisk: number, augmented: number, newSkills: number): number {
  return Math.round(augmented * 0.45 + newSkills * 0.35 + automationRisk * 0.20);
}

const allRoles: RoleCard[] = [
  { title: "Software Engineer", image: roleSoftwareEngineer, augmented: 80, risk: 10, aiOpportunity: calcToolsToLearn(10, 80, 45), tag: "Tech" },
  { title: "Data Scientist", image: roleDataScientist, augmented: 82, risk: 10, aiOpportunity: calcToolsToLearn(10, 82, 40), tag: "Tech" },
  { title: "Product Manager", image: roleProductManager, augmented: 72, risk: 12, aiOpportunity: calcToolsToLearn(12, 72, 45), tag: "Tech" },
  { title: "DevOps Engineer", image: roleDevopsEngineer, augmented: 70, risk: 20, aiOpportunity: calcToolsToLearn(20, 70, 55), tag: "Tech" },
  { title: "UX Designer", image: roleUxDesigner, augmented: 65, risk: 22, aiOpportunity: calcToolsToLearn(22, 65, 50), tag: "Tech" },
  { title: "Cybersecurity Analyst", image: roleCybersecurityAnalyst, augmented: 78, risk: 10, aiOpportunity: calcToolsToLearn(10, 78, 40), tag: "Tech" },
  { title: "QA Manager", image: roleQaManager, augmented: 60, risk: 38, aiOpportunity: calcToolsToLearn(38, 60, 60), tag: "Tech" },
  { title: "Accountant", image: roleAccountant, augmented: 55, risk: 42, aiOpportunity: calcToolsToLearn(42, 55, 60), tag: "Finance" },
  { title: "Financial Analyst", image: roleFinancialAnalyst, augmented: 72, risk: 22, aiOpportunity: calcToolsToLearn(22, 72, 50), tag: "Finance" },
  { title: "Investment Banker", image: roleInvestmentBanker, augmented: 70, risk: 14, aiOpportunity: calcToolsToLearn(14, 70, 35), tag: "Finance" },
  { title: "Tax Advisor", image: roleTaxAdvisor, augmented: 55, risk: 44, aiOpportunity: calcToolsToLearn(44, 55, 58), tag: "Finance" },
  { title: "Risk Manager", image: roleRiskManager, augmented: 68, risk: 20, aiOpportunity: calcToolsToLearn(20, 68, 50), tag: "Finance" },
  { title: "Auditor", image: roleAuditor, augmented: 52, risk: 48, aiOpportunity: calcToolsToLearn(48, 52, 62), tag: "Finance" },
  { title: "Marketing Manager", image: roleMarketingManager, augmented: 62, risk: 32, aiOpportunity: calcToolsToLearn(32, 62, 68), tag: "Marketing" },
  { title: "Content Strategist", image: roleContentStrategist, augmented: 74, risk: 22, aiOpportunity: calcToolsToLearn(22, 74, 50), tag: "Marketing" },
  { title: "SEO Specialist", image: roleSeoSpecialist, augmented: 68, risk: 45, aiOpportunity: calcToolsToLearn(45, 68, 65), tag: "Marketing" },
  { title: "Social Media Manager", image: roleSocialMediaManager, augmented: 65, risk: 38, aiOpportunity: calcToolsToLearn(38, 65, 62), tag: "Marketing" },
  { title: "Brand Strategist", image: roleBrandStrategist, augmented: 72, risk: 8, aiOpportunity: calcToolsToLearn(8, 72, 35), tag: "Marketing" },
  { title: "Business Analyst", image: roleBusinessAnalyst, augmented: 70, risk: 22, aiOpportunity: calcToolsToLearn(22, 70, 50), tag: "Marketing" },
  { title: "Project Manager", image: roleProjectManager, augmented: 68, risk: 20, aiOpportunity: calcToolsToLearn(20, 68, 48), tag: "Operations" },
  { title: "HR Manager", image: roleHrManager, augmented: 55, risk: 35, aiOpportunity: calcToolsToLearn(35, 55, 55), tag: "Operations" },
  { title: "Supply Chain Manager", image: roleSupplyChainManager, augmented: 70, risk: 22, aiOpportunity: calcToolsToLearn(22, 70, 48), tag: "Operations" },
  { title: "Operations Manager", image: roleOperationsManager, augmented: 65, risk: 22, aiOpportunity: calcToolsToLearn(22, 65, 48), tag: "Operations" },
  { title: "Customer Success Manager", image: roleCustomerSuccessManager, augmented: 72, risk: 12, aiOpportunity: calcToolsToLearn(12, 72, 35), tag: "Operations" },
  { title: "Corporate Lawyer", image: roleCorporateLawyer, augmented: 72, risk: 10, aiOpportunity: calcToolsToLearn(10, 72, 35), tag: "Legal" },
  { title: "Compliance Officer", image: roleComplianceOfficer, augmented: 58, risk: 36, aiOpportunity: calcToolsToLearn(36, 58, 58), tag: "Legal" },
  { title: "Paralegal", image: roleParalegal, augmented: 62, risk: 50, aiOpportunity: calcToolsToLearn(50, 62, 65), tag: "Legal" },
  { title: "Contract Attorney", image: roleContractAttorney, augmented: 60, risk: 44, aiOpportunity: calcToolsToLearn(44, 60, 58), tag: "Legal" },
  { title: "IP Specialist", image: roleIpSpecialist, augmented: 75, risk: 8, aiOpportunity: calcToolsToLearn(8, 75, 30), tag: "Legal" },
  { title: "Legal Ops Manager", image: roleLegalOpsManager, augmented: 68, risk: 22, aiOpportunity: calcToolsToLearn(22, 68, 48), tag: "Legal" },
];

// Shuffle roles for discovery feel
const shuffledRoles = [...allRoles].sort(() => Math.random() - 0.5);

type JdInputType = "none" | "paste" | "url" | "file";

const Index = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchOpen, setSearchOpen] = useState(false);
  const [jobTitle, setJobTitle] = useState("");
  const [website, setWebsite] = useState("");
  const [jdInputType, setJdInputType] = useState<JdInputType>("none");
  const [jdText, setJdText] = useState("");
  const [jdUrl, setJdUrl] = useState("");
  const [jdFile, setJdFile] = useState<File | null>(null);
  const [jdFileText, setJdFileText] = useState("");
  const [jdFileParsing, setJdFileParsing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile?.jobTitle && !jobTitle) setJobTitle(profile.jobTitle);
    if (profile?.company && !website) setWebsite(profile.company);
  }, [profile]);

  const hasJdContent = (jdInputType === "paste" && jdText.trim().length > 0) ||
    (jdInputType === "url" && jdUrl.trim().length > 0) ||
    (jdInputType === "file" && jdFileText.trim().length > 0);

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

    const jdParam = jdInputType === "paste" ? jdText.trim() : jdInputType === "file" ? jdFileText.trim() : "";
    const jdUrlParam = jdInputType === "url" ? jdUrl.trim() : "";

    if (jdParam) sessionStorage.setItem("jd_text", jdParam);
    else sessionStorage.removeItem("jd_text");

    localStorage.setItem("last_analysis", JSON.stringify({
      jobTitle: jobTitle.trim(),
      company: effectiveCompany,
      timestamp: Date.now(),
    }));

    const params = new URLSearchParams({ company: effectiveCompany, title: jobTitle.trim() });
    if (jdParam) params.set("jd", "session");
    if (jdUrlParam) params.set("jdUrl", jdUrlParam);

    navigate(`/analysis?${params.toString()}`);
    setSearchOpen(false);
  };

  const toggleJdInput = (type: JdInputType) => {
    setJdInputType((prev) => (prev === type ? "none" : type));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) { toast({ title: "File too large", description: "Max 5MB.", variant: "destructive" }); return; }
    const name = file.name.toLowerCase();
    if (![".pdf", ".docx", ".doc", ".txt", ".md"].some(ext => name.endsWith(ext))) {
      toast({ title: "Unsupported file", description: "Upload PDF, DOCX, TXT, or MD.", variant: "destructive" }); return;
    }
    setJdFile(file); setJdFileText("");
    if (name.endsWith(".txt") || name.endsWith(".md")) { setJdFileText(await file.text()); return; }
    setJdFileParsing(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-jd`, {
        method: "POST",
        headers: { Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) { toast({ title: "Parse failed", variant: "destructive" }); return; }
      setJdFileText(data.text || "");
    } catch { toast({ title: "Parse failed", variant: "destructive" }); } finally { setJdFileParsing(false); }
  };

  return (
    <div className="h-[calc(100vh-3.5rem)] relative">
      {/* Full-screen feed */}
      <RoleFeed roles={shuffledRoles} onOpenSearch={() => setSearchOpen(true)} />

      {/* Search overlay — slides up like TikTok discover */}
      <AnimatePresence>
        {searchOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setSearchOpen(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 z-50 bg-background rounded-t-2xl border-t border-border max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between px-5 pt-5 pb-2">
                <h3 className="text-sm font-display font-semibold text-foreground">Search any role</h3>
                <button onClick={() => setSearchOpen(false)} className="p-2 rounded-full hover:bg-muted">
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
              <div className="px-5 pb-6">
                <RoleSearchAutocomplete
                  value={jobTitle}
                  onChange={setJobTitle}
                  onAnalyze={(title) => {
                    setJobTitle(title);
                    const params = new URLSearchParams({ company: effectiveCompany, title: title.trim() });
                    navigate(`/analysis?${params.toString()}`);
                    setSearchOpen(false);
                  }}
                  jdInputType={jdInputType}
                  onToggleJd={toggleJdInput}
                  hasJdContent={hasJdContent}
                />

                {/* JD input areas */}
                <div className="mt-3">
                  <AnimatePresence>
                    {jdInputType === "paste" && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                        <textarea
                          placeholder="Paste job description..."
                          value={jdText}
                          onChange={(e) => setJdText(e.target.value)}
                          className="w-full min-h-[80px] max-h-[140px] px-3 py-2 text-sm bg-card border border-border rounded-md resize-y focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground"
                        />
                      </motion.div>
                    )}
                    {jdInputType === "url" && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                        <Input placeholder="https://jobs.example.com/role/12345" value={jdUrl} onChange={(e) => setJdUrl(e.target.value)} className="h-10 bg-card border-border text-sm" />
                      </motion.div>
                    )}
                    {jdInputType === "file" && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                        {jdFileParsing ? (
                          <div className="flex items-center gap-2 py-4 px-3 rounded-lg border border-primary/30 bg-primary/5">
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                            <span className="text-xs text-primary font-medium">Parsing {jdFile?.name}...</span>
                          </div>
                        ) : jdFileText ? (
                          <div className="flex items-center gap-2 px-3 py-2 bg-card border border-primary/20 rounded-lg">
                            <FileText className="h-3.5 w-3.5 text-primary shrink-0" />
                            <span className="text-sm text-foreground truncate flex-1">{jdFile?.name}</span>
                            <button onClick={() => { setJdFile(null); setJdFileText(""); setJdInputType("none"); }} className="text-muted-foreground hover:text-foreground">
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
                              if (file && fileInputRef.current) { const dt = new DataTransfer(); dt.items.add(file); fileInputRef.current.files = dt.files; fileInputRef.current.dispatchEvent(new Event("change", { bubbles: true })); }
                            }}
                            onClick={() => fileInputRef.current?.click()}
                            className={`flex items-center justify-center gap-2 py-5 px-4 rounded-lg border-2 border-dashed cursor-pointer transition-colors ${isDragging ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"}`}
                          >
                            <Upload className={`h-5 w-5 ${isDragging ? "text-primary" : "text-muted-foreground"}`} />
                            <p className="text-sm text-muted-foreground">{isDragging ? "Drop here" : "Drop file or click"}</p>
                            <input ref={fileInputRef} type="file" accept=".pdf,.docx,.doc,.txt,.md" className="hidden" onChange={(e) => { setJdInputType("file"); handleFileChange(e); }} />
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;

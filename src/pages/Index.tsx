import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, FileText, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { RoleSearchAutocomplete } from "@/components/RoleSearchAutocomplete";
import RoleFeed from "@/components/RoleFeed";
import { supabase } from "@/integrations/supabase/client";
import { getDepartmentImage } from "@/lib/department-images";

interface RoleCard {
  title: string;
  image: string;
  augmented: number;
  risk: number;
  aiOpportunity: number;
  tag: string;
}

function calcToolsToLearn(risk: number, augmented: number, newSkills: number): number {
  return Math.round(augmented * 0.45 + newSkills * 0.35 + risk * 0.20);
}

function departmentToTag(dept: string | null): string {
  if (!dept) return "Other";
  const d = dept.toLowerCase();
  if (["engineering", "product", "design", "data", "ai", "research", "security", "cybersecurity", "it"].some(k => d.includes(k))) return "Tech";
  if (["finance", "accounting", "tax", "audit"].some(k => d.includes(k))) return "Finance";
  if (["marketing", "brand", "content", "seo", "social", "communications", "pr"].some(k => d.includes(k))) return "Marketing";
  if (["legal", "compliance", "regulatory"].some(k => d.includes(k))) return "Legal";
  if (["operations", "supply", "logistics", "hr", "people", "human"].some(k => d.includes(k))) return "Operations";
  if (["sales", "business development", "customer"].some(k => d.includes(k))) return "Sales";
  return "Other";
}

type JdInputType = "none" | "paste" | "url" | "file";

const Index = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [roles, setRoles] = useState<RoleCard[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(true);

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

  // Fetch real jobs from DB
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("title, department, augmented_percent, automation_risk_percent, new_skills_percent")
        .gt("augmented_percent", 0)
        .order("augmented_percent", { ascending: false })
        .limit(100);

      if (error || !data || data.length === 0) {
        setLoadingRoles(false);
        return;
      }

      // Deduplicate by title (keep first/best)
      const seen = new Set<string>();
      const unique = data.filter(j => {
        const key = j.title.toLowerCase().trim();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      const mapped: RoleCard[] = unique.map(j => ({
        title: j.title,
        image: getDepartmentImage(j.department),
        augmented: j.augmented_percent ?? 0,
        risk: j.automation_risk_percent ?? 0,
        aiOpportunity: calcToolsToLearn(
          j.automation_risk_percent ?? 0,
          j.augmented_percent ?? 0,
          j.new_skills_percent ?? 0
        ),
        tag: departmentToTag(j.department),
      }));

      // Shuffle for discovery feel
      const shuffled = mapped.sort(() => Math.random() - 0.5);
      setRoles(shuffled);
      setLoadingRoles(false);
    })();
  }, []);

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

  if (loadingRoles && roles.length === 0) {
    return (
      <div className="h-[calc(100vh-3.5rem)] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-3.5rem)] relative">
      <RoleFeed roles={roles} onOpenSearch={() => setSearchOpen(true)} />

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

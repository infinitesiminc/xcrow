import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, TrendingUp, Loader2, ArrowRight, FileText, Link as LinkIcon, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { getRiskTier } from "@/lib/risk-colors";
import { Button } from "@/components/ui/button";

interface DbRole {
  id: string;
  title: string;
  department: string | null;
  automation_risk_percent: number | null;
  augmented_percent: number | null;
  company_name: string | null;
  industry: string | null;
}

interface Props {
  onAnalyze: (title: string) => void;
  value?: string;
  onChange?: (v: string) => void;
  jdInputType?: string;
  onToggleJd?: (type: "paste" | "url" | "file") => void;
  hasJdContent?: boolean;
}

export function RoleSearchAutocomplete({ onAnalyze, value, onChange, jdInputType, onToggleJd, hasJdContent }: Props) {
  const navigate = useNavigate();
  const [internalQuery, setInternalQuery] = useState("");
  const query = value ?? internalQuery;
  const setQuery = onChange ?? setInternalQuery;

  const [results, setResults] = useState<DbRole[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); setOpen(false); return; }
    setLoading(true);
    try {
      // Search by title and by company name in parallel
      const [titleRes, companyRes] = await Promise.all([
        supabase
          .from("jobs")
          .select("id, title, department, automation_risk_percent, augmented_percent, companies(name, industry)")
          .ilike("title", `%${q}%`)
          .limit(6),
        supabase
          .from("jobs")
          .select("id, title, department, automation_risk_percent, augmented_percent, companies!inner(name, industry)")
          .ilike("companies.name", `%${q}%`)
          .limit(6),
      ]);

      const allData = [...(titleRes.data || []), ...(companyRes.data || [])];
      // Deduplicate by id
      const seen = new Set<string>();
      const unique = allData.filter((j: any) => {
        if (seen.has(j.id)) return false;
        seen.add(j.id);
        return true;
      }).slice(0, 8);

      if (unique.length > 0) {
        const mapped: DbRole[] = unique.map((j: any) => ({
          id: j.id,
          title: j.title,
          department: j.department,
          automation_risk_percent: j.automation_risk_percent,
          augmented_percent: j.augmented_percent,
          company_name: j.companies?.name || null,
          industry: j.companies?.industry || null,
        }));
        setResults(mapped);
        setOpen(true);
      }
    } catch (e) {
      console.error("Search error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (val: string) => {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 250);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() || hasJdContent) {
      setOpen(false);
      onAnalyze(query.trim());
    }
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl">
      <form onSubmit={handleSubmit}>
        <div className="flex items-center gap-2 p-2 rounded-xl border border-border bg-card shadow-sm">
          <Search className="h-4 w-4 text-muted-foreground shrink-0 ml-1" />
          <input
            type="text"
            value={query}
            onChange={(e) => handleChange(e.target.value)}
            onFocus={() => results.length > 0 && setOpen(true)}
            placeholder={hasJdContent ? "Job title (optional) — or search 500+ roles" : "Enter your job title or search 500+ roles..."}
            required={!hasJdContent}
            className="flex-1 h-9 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none min-w-0"
          />
          {loading && <Loader2 className="h-4 w-4 text-muted-foreground animate-spin shrink-0" />}
          {onToggleJd && (
            <>
              <div className="w-px h-6 bg-border hidden sm:block" />
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => onToggleJd("paste")}
                  className={`p-1.5 rounded-md transition-colors ${
                    jdInputType === "paste" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
                  }`} title="Paste JD"><FileText className="h-4 w-4" /></button>
                <button type="button" onClick={() => onToggleJd("url")}
                  className={`p-1.5 rounded-md transition-colors ${
                    jdInputType === "url" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
                  }`} title="JD URL"><LinkIcon className="h-4 w-4" /></button>
                <button type="button" onClick={() => onToggleJd("file")}
                  className={`p-1.5 rounded-md transition-colors ${
                    jdInputType === "file" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
                  }`} title="Upload"><Upload className="h-4 w-4" /></button>
              </div>
            </>
          )}
          <Button type="submit" size="sm" className="h-9 px-4 text-sm font-semibold gap-1.5 shrink-0">
            Analyze <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </form>

      <AnimatePresence>
        {open && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 mt-1.5 w-full rounded-xl border border-border bg-card shadow-lg overflow-hidden"
          >
            {results.map((role) => (
              <button
                key={role.id}
                onClick={() => {
                  setOpen(false);
                  setQuery("");
                  navigate(`/analysis?title=${encodeURIComponent(role.title)}&company=${encodeURIComponent(role.company_name || "")}`);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-accent/50 transition-colors border-b border-border/30 last:border-0"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{role.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {role.industry && (
                      <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 rounded bg-secondary">{role.industry}</span>
                    )}
                  </div>
                </div>
                {role.automation_risk_percent != null && role.automation_risk_percent > 0 && (
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold shrink-0 ${
                    getRiskTier(role.automation_risk_percent).bgClass
                  } ${getRiskTier(role.automation_risk_percent).textClass}`}>
                    <TrendingUp className="h-3 w-3" />
                    {role.automation_risk_percent}%
                  </div>
                )}
              </button>
            ))}
            <div className="px-4 py-2 bg-secondary/30 text-[10px] text-muted-foreground text-center">
              {results.length} results · Or press Analyze to assess "{query}"
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {open && query.length >= 2 && results.length === 0 && !loading && (
        <div className="absolute z-50 mt-1.5 w-full rounded-xl border border-border bg-card shadow-lg p-4 text-center">
          <p className="text-sm text-muted-foreground">No matching roles in database</p>
          <p className="text-xs text-muted-foreground mt-1">Press <strong>Analyze</strong> to assess "{query}" with AI</p>
        </div>
      )}
    </div>
  );
}

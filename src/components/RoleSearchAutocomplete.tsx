import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, TrendingUp, Loader2, ArrowRight, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { getRiskTier } from "@/lib/risk-colors";
import { Button } from "@/components/ui/button";
import { CompanyPills } from "@/components/CompanyPills";

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

// Heuristic: is this a natural language query vs a simple keyword?
function isNaturalLanguage(q: string): boolean {
  const words = q.trim().split(/\s+/);
  if (words.length >= 4) return true;
  const nlSignals = /\b(what|which|find|show|give|list|looking for|jobs? (that|in|at|for|with)|roles? (that|in|at|for|with)|career|safe|risky|future|remote|hybrid|entry.level|senior|junior)\b/i;
  return nlSignals.test(q);
}

export function RoleSearchAutocomplete({ onAnalyze, value, onChange, hasJdContent }: Props) {
  const navigate = useNavigate();
  const [internalQuery, setInternalQuery] = useState("");
  const query = value ?? internalQuery;
  const setQuery = onChange ?? setInternalQuery;

  const [results, setResults] = useState<DbRole[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [isNlSearch, setIsNlSearch] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Fast DB search (simple ilike)
  const dbSearch = useCallback(async (q: string) => {
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
    const seen = new Set<string>();
    return allData
      .filter((j: any) => {
        if (seen.has(j.id)) return false;
        seen.add(j.id);
        return true;
      })
      .slice(0, 8)
      .map((j: any) => ({
        id: j.id,
        title: j.title,
        department: j.department,
        automation_risk_percent: j.automation_risk_percent,
        augmented_percent: j.augmented_percent,
        company_name: j.companies?.name || null,
        industry: j.companies?.industry || null,
      }));
  }, []);

  // AI-powered natural language search
  const nlSearch = useCallback(async (q: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("nl-search", {
        body: { query: q },
      });
      if (error || !data?.results) return [];
      return data.results as DbRole[];
    } catch {
      return [];
    }
  }, []);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); setOpen(false); setIsNlSearch(false); return; }
    setLoading(true);
    const useNl = isNaturalLanguage(q);
    setIsNlSearch(useNl);

    try {
      let mapped: DbRole[];
      if (useNl) {
        // Run NL search with DB search as fallback
        const [nlResults, dbResults] = await Promise.all([
          nlSearch(q),
          dbSearch(q),
        ]);
        // Prefer NL results, fall back to DB
        mapped = nlResults.length > 0 ? nlResults : dbResults;
      } else {
        mapped = await dbSearch(q);
      }
      setResults(mapped);
      setOpen(mapped.length > 0);
    } catch (e) {
      console.error("Search error:", e);
    } finally {
      setLoading(false);
    }
  }, [dbSearch, nlSearch]);

  const handleChange = (val: string) => {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    // Longer debounce for NL queries (they hit AI)
    const delay = isNaturalLanguage(val) ? 500 : 250;
    debounceRef.current = setTimeout(() => search(val), delay);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() || hasJdContent) {
      setOpen(false);
      onAnalyze(query.trim());
    }
  };

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
            placeholder="Search roles, companies, or ask anything..."
            required={!hasJdContent}
            className="flex-1 h-9 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none min-w-0"
          />
          {loading && <Loader2 className="h-4 w-4 text-muted-foreground animate-spin shrink-0" />}
          <Button type="submit" size="sm" className="h-9 px-4 text-sm font-semibold gap-1.5 shrink-0">
            Explore <ArrowRight className="w-3.5 h-3.5" />
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
            {isNlSearch && (
              <div className="flex items-center gap-1.5 px-4 py-1.5 bg-primary/5 border-b border-border/30">
                <Sparkles className="h-3 w-3 text-primary" />
                <span className="text-[10px] font-medium text-primary">AI-powered results</span>
              </div>
            )}
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
                    {role.company_name && (
                      <span className="text-[10px] text-muted-foreground">{role.company_name}</span>
                    )}
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
              {results.length} results · Press Explore to deep-analyze "{query}"
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rotating company pills */}
      <CompanyPills visible={!open && query.length === 0} onSelect={handleChange} />

      {open && query.length >= 2 && results.length === 0 && !loading && (
        <div className="absolute z-50 mt-1.5 w-full rounded-xl border border-border bg-card shadow-lg p-4 text-center">
          <p className="text-sm text-muted-foreground">No matching roles found</p>
          <p className="text-xs text-muted-foreground mt-1">Press <strong>Explore</strong> to assess "{query}" with AI</p>
        </div>
      )}
    </div>
  );
}

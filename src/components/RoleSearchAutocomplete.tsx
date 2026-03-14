import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Building2, TrendingUp, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { getRiskTier } from "@/lib/risk-colors";

interface DbRole {
  id: string;
  title: string;
  department: string | null;
  automation_risk_percent: number | null;
  augmented_percent: number | null;
  company_name: string | null;
  industry: string | null;
}

export function RoleSearchAutocomplete() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<DbRole[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); setOpen(false); return; }
    setLoading(true);
    try {
      const { data } = await supabase
        .from("jobs")
        .select("id, title, department, automation_risk_percent, augmented_percent, companies(name, industry)")
        .ilike("title", `%${q}%`)
        .limit(8);

      if (data) {
        const mapped: DbRole[] = data.map((j: any) => ({
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

  const handleChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(value), 250);
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
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search 500+ roles from our database..."
          className="w-full h-10 pl-9 pr-10 rounded-lg border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
        />
        {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />}
      </div>

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
                    {role.company_name && (
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Building2 className="h-3 w-3" />{role.company_name}
                      </span>
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
              {results.length} results · Type to refine
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {open && query.length >= 2 && results.length === 0 && !loading && (
        <div className="absolute z-50 mt-1.5 w-full rounded-xl border border-border bg-card shadow-lg p-4 text-center">
          <p className="text-sm text-muted-foreground">No matching roles found</p>
          <p className="text-xs text-muted-foreground mt-1">Try analyzing it directly using the input above</p>
        </div>
      )}
    </div>
  );
}

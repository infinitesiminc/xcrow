import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Loader2, ArrowRight, Sparkles, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
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

/** A deduplicated "role archetype" shown in the dropdown */
interface RoleSuggestion {
  title: string;
  /** How many listings match this title */
  count: number;
  /** One representative company name */
  company: string | null;
  /** Representative industry */
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

function isNaturalLanguage(q: string): boolean {
  const words = q.trim().split(/\s+/);
  if (words.length >= 4) return true;
  const nlSignals = /\b(what|which|find|show|give|list|looking for|jobs? (that|in|at|for|with)|roles? (that|in|at|for|with)|career|safe|risky|future|remote|hybrid|entry.level|senior|junior)\b/i;
  return nlSignals.test(q);
}

/** Collapse raw job listings into role archetypes (dedupe by normalized title) */
function collapseToSuggestions(roles: DbRole[], max = 5): RoleSuggestion[] {
  const map = new Map<string, { count: number; company: string | null; industry: string | null }>();
  for (const r of roles) {
    // Normalize: strip seniority prefixes and company suffixes for grouping
    const normalized = r.title
      .replace(/^(Senior|Junior|Lead|Staff|Principal|Associate|Head of)\s+/i, "")
      .replace(/\s*[-–,].+$/, "") // strip "- Company Name" or ", Location"
      .trim();
    const key = normalized.toLowerCase();
    const existing = map.get(key);
    if (existing) {
      existing.count++;
    } else {
      map.set(key, { count: 1, company: r.company_name, industry: r.industry });
    }
  }

  return Array.from(map.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, max)
    .map(([key, v]) => {
      // Use the original casing from the first match
      const original = roles.find(
        (r) =>
          r.title
            .replace(/^(Senior|Junior|Lead|Staff|Principal|Associate|Head of)\s+/i, "")
            .replace(/\s*[-–,].+$/, "")
            .trim()
            .toLowerCase() === key
      );
      return {
        title: original?.title?.replace(/\s*[-–,].+$/, "").trim() || key,
        count: v.count,
        company: v.company,
        industry: v.industry,
      };
    });
}

export function RoleSearchAutocomplete({ onAnalyze, value, onChange, hasJdContent }: Props) {
  const navigate = useNavigate();
  const [internalQuery, setInternalQuery] = useState("");
  const query = value ?? internalQuery;
  const setQuery = onChange ?? setInternalQuery;

  const [rawResults, setRawResults] = useState<DbRole[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [isNlSearch, setIsNlSearch] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const suggestions = useMemo(() => collapseToSuggestions(rawResults, 5), [rawResults]);

  const dbSearch = useCallback(async (q: string) => {
    const [titleRes, companyRes] = await Promise.all([
      supabase
        .from("jobs")
        .select("id, title, department, automation_risk_percent, augmented_percent, companies(name, industry)")
        .ilike("title", `%${q}%`)
        .limit(12),
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
    if (q.length < 2) { setRawResults([]); setOpen(false); setIsNlSearch(false); return; }
    setLoading(true);
    const useNl = isNaturalLanguage(q);
    setIsNlSearch(useNl);

    try {
      let mapped: DbRole[];
      if (useNl) {
        const [nlResults, dbResults] = await Promise.all([nlSearch(q), dbSearch(q)]);
        mapped = nlResults.length > 0 ? nlResults : dbResults;
      } else {
        mapped = await dbSearch(q);
      }
      setRawResults(mapped);
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

  const handleSelect = (suggestion: RoleSuggestion) => {
    setOpen(false);
    setQuery("");
    const params = new URLSearchParams({ title: suggestion.title, company: suggestion.company || "" });
    navigate(`/analysis?${params.toString()}`);
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
            onFocus={() => suggestions.length > 0 && setOpen(true)}
            placeholder="Try &quot;remote marketing roles&quot; or &quot;software engineer&quot;..."
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
        {open && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 mt-1.5 w-full rounded-xl border border-border bg-card shadow-lg overflow-hidden"
          >
            {isNlSearch && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/5 border-b border-border/30">
                <Sparkles className="h-3 w-3 text-primary" />
                <span className="text-[11px] font-medium text-primary">AI-matched roles</span>
              </div>
            )}
            <div className="py-1">
              {suggestions.map((s, i) => (
                <button
                  key={s.title + i}
                  onClick={() => handleSelect(s)}
                  className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-accent/50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                    <Search className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{s.title}</p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {s.count > 1 ? `${s.count} open roles` : s.company || "Explore this career"}
                      {s.industry ? ` · ${s.industry}` : ""}
                    </p>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                </button>
              ))}
            </div>
            <div className="px-3 py-2 border-t border-border/30">
              <button
                onClick={handleSubmit as any}
                className="w-full flex items-center gap-2 text-left group"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-primary group-hover:underline">
                    Deep-analyze "{query}"
                  </p>
                  <p className="text-[11px] text-muted-foreground">Get full AI breakdown of tasks, risks & skills</p>
                </div>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <CompanyPills visible={!open && query.length === 0} onSelect={handleChange} />

      {open && query.length >= 2 && suggestions.length === 0 && !loading && (
        <div className="absolute z-50 mt-1.5 w-full rounded-xl border border-border bg-card shadow-lg overflow-hidden">
          <div className="p-4 text-center">
            <p className="text-sm text-muted-foreground">No matching roles found</p>
          </div>
          <div className="px-3 py-2 border-t border-border/30">
            <button
              onClick={handleSubmit as any}
              className="w-full flex items-center gap-2 text-left group"
            >
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-primary group-hover:underline">
                  Analyze "{query}" with AI
                </p>
                <p className="text-[11px] text-muted-foreground">We'll break down this role even if it's not in our database</p>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

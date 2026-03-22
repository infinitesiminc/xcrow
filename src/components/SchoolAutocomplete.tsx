import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { School, Loader2, Plus } from "lucide-react";

interface Props {
  value: string;
  onChange: (v: string) => void;
}

interface SchoolOption {
  id: string;
  name: string;
  state: string | null;
  city: string | null;
}

export function SchoolAutocomplete({ value, onChange }: Props) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<SchoolOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Sync external value
  useEffect(() => {
    setQuery(value);
  }, [value]);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); setOpen(false); return; }
    setLoading(true);
    try {
      const { data } = await supabase
        .from("school_accounts")
        .select("id, name, state, city")
        .ilike("name", `%${q}%`)
        .order("name")
        .limit(8);
      setResults((data as SchoolOption[]) || []);
      setOpen(true);
    } catch {
      setResults([]);
    }
    setLoading(false);
  }, []);

  const handleChange = (val: string) => {
    setQuery(val);
    onChange(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 250);
  };

  const handleSelect = (school: SchoolOption) => {
    setQuery(school.name);
    onChange(school.name);
    setOpen(false);
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

  const showCustomOption = query.length >= 2 && !results.some(r => r.name.toLowerCase() === query.toLowerCase());

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Input
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search schools or type your own..."
        />
        {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground animate-spin" />}
      </div>

      {open && (results.length > 0 || showCustomOption) && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-popover shadow-lg overflow-hidden max-h-56 overflow-y-auto">
          {results.map((school) => (
            <button
              key={school.id}
              type="button"
              onClick={() => handleSelect(school)}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-accent/50 transition-colors"
            >
              <School className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-sm text-foreground truncate">{school.name}</p>
                {(school.city || school.state) && (
                  <p className="text-[10px] text-muted-foreground truncate">
                    {[school.city, school.state].filter(Boolean).join(", ")}
                  </p>
                )}
              </div>
            </button>
          ))}
          {showCustomOption && (
            <button
              type="button"
              onClick={() => { onChange(query); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-accent/50 transition-colors border-t border-border/30"
            >
              <Plus className="h-3.5 w-3.5 text-primary shrink-0" />
              <p className="text-sm text-primary">Use "{query}"</p>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

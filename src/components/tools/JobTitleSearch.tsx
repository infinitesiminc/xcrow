/**
 * JobTitleSearch — Search by job title to get personalized tool stack recommendations.
 * Queries the jobs DB for matching roles, extracts skills, maps to tools.
 */
import { useState, useCallback } from "react";
import { Search, Briefcase, Loader2, ArrowRight, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { JOB_SKILL_TO_TOOLS } from "@/data/tool-skill-mappings";
import { GTC_TOOLS } from "@/data/gtc-tools-registry";
import { matchRole } from "@/data/role-tool-recommendations";

interface ToolHit {
  name: string;
  count: number; // how many skills point to this tool
  skills: string[];
}

interface SearchResult {
  jobTitle: string;
  company: string | null;
  matchedTools: ToolHit[];
  totalSkills: number;
  roleMatch: ReturnType<typeof matchRole>;
}

interface Props {
  onApplyStack?: (toolNames: string[]) => void;
  onSelectRole?: (roleName: string) => void;
}

export default function JobTitleSearch({ onApplyStack, onSelectRole }: Props) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searched, setSearched] = useState(false);

  const search = useCallback(async () => {
    const q = query.trim();
    if (!q || q.length < 2) return;

    setLoading(true);
    setSearched(true);

    try {
      // Find matching jobs
      const { data: jobs } = await supabase
        .from("jobs")
        .select("id, title, company_id")
        .ilike("title", `%${q}%`)
        .limit(10);

      if (!jobs?.length) {
        // Fall back to static role matching
        const role = matchRole(q);
        setResults([{
          jobTitle: q,
          company: null,
          matchedTools: role.coreTools.map(t => ({ name: t, count: 1, skills: [] })),
          totalSkills: 0,
          roleMatch: role,
        }]);
        setLoading(false);
        return;
      }

      // Get companies for display
      const companyIds = [...new Set(jobs.map(j => j.company_id).filter(Boolean))] as string[];
      const { data: companies } = companyIds.length
        ? await supabase.from("companies").select("id, name").in("id", companyIds)
        : { data: [] };
      const companyMap = new Map((companies || []).map(c => [c.id, c.name]));

      // Get skills for these jobs
      const jobIds = jobs.map(j => j.id);
      const { data: taskClusters } = await supabase
        .from("job_task_clusters")
        .select("job_id, skill_names")
        .in("job_id", jobIds);

      const { data: jobSkills } = await supabase
        .from("job_skills")
        .select("job_id, name")
        .in("job_id", jobIds);

      // Aggregate skills per job
      const jobSkillMap = new Map<string, Set<string>>();
      for (const tc of taskClusters || []) {
        if (!jobSkillMap.has(tc.job_id)) jobSkillMap.set(tc.job_id, new Set());
        for (const s of tc.skill_names || []) jobSkillMap.get(tc.job_id)!.add(s);
      }
      for (const js of jobSkills || []) {
        if (!jobSkillMap.has(js.job_id)) jobSkillMap.set(js.job_id, new Set());
        jobSkillMap.get(js.job_id)!.add(js.name);
      }

      // Deduplicate by title (take first per unique title)
      const seen = new Set<string>();
      const uniqueJobs = jobs.filter(j => {
        const key = j.title.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      }).slice(0, 5);

      const searchResults: SearchResult[] = uniqueJobs.map(job => {
        const skills = jobSkillMap.get(job.id) || new Set<string>();
        const toolCounts = new Map<string, { count: number; skills: string[] }>();

        // Map skills to tools
        for (const skill of skills) {
          const tools = JOB_SKILL_TO_TOOLS[skill] || [];
          for (const tool of tools) {
            if (!toolCounts.has(tool)) toolCounts.set(tool, { count: 0, skills: [] });
            const entry = toolCounts.get(tool)!;
            entry.count++;
            entry.skills.push(skill);
          }
        }

        // Also include role-based recommendations as fallback
        const roleMatch = matchRole(job.title);
        for (const t of roleMatch.coreTools) {
          if (!toolCounts.has(t)) toolCounts.set(t, { count: 0, skills: [] });
          toolCounts.get(t)!.count += 1; // boost core tools
        }

        const matchedTools = Array.from(toolCounts.entries())
          .map(([name, data]) => ({ name, ...data }))
          .filter(t => GTC_TOOLS.some(gt => gt.name === t.name))
          .sort((a, b) => b.count - a.count)
          .slice(0, 12);

        return {
          jobTitle: job.title,
          company: job.company_id ? companyMap.get(job.company_id) || null : null,
          matchedTools,
          totalSkills: skills.size,
          roleMatch,
        };
      });

      setResults(searchResults);
    } catch (err) {
      console.error("Job search error:", err);
      const role = matchRole(q);
      setResults([{
        jobTitle: q,
        company: null,
        matchedTools: role.coreTools.map(t => ({ name: t, count: 1, skills: [] })),
        totalSkills: 0,
        roleMatch: role,
      }]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") search();
  };

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "hsl(var(--muted-foreground))" }} />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search by job title — e.g. Product Manager, Data Analyst..."
          className="w-full pl-10 pr-24 py-3 rounded-xl text-sm transition-all focus:outline-none focus:ring-2"
          style={{
            background: "hsl(var(--muted) / 0.08)",
            border: "1px solid hsl(var(--border) / 0.3)",
            color: "hsl(var(--foreground))",
            // @ts-ignore
            "--tw-ring-color": "hsl(var(--primary) / 0.3)",
          }}
        />
        {query && (
          <button
            onClick={() => { setQuery(""); setResults([]); setSearched(false); }}
            className="absolute right-20 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted/20"
          >
            <X className="h-3.5 w-3.5" style={{ color: "hsl(var(--muted-foreground))" }} />
          </button>
        )}
        <button
          onClick={search}
          disabled={loading || query.trim().length < 2}
          className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-40"
          style={{
            background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.8))",
            color: "hsl(var(--primary-foreground))",
          }}
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Search"}
        </button>
      </div>

      {/* Results */}
      <AnimatePresence mode="wait">
        {loading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center py-8 gap-2 text-sm"
            style={{ color: "hsl(var(--muted-foreground))" }}
          >
            <Loader2 className="h-4 w-4 animate-spin" />
            Scanning job database...
          </motion.div>
        )}

        {!loading && searched && results.length === 0 && (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8 text-sm"
            style={{ color: "hsl(var(--muted-foreground))" }}
          >
            No matching jobs found. Try a different title.
          </motion.div>
        )}

        {!loading && results.length > 0 && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            {results.map((result, idx) => (
              <motion.div
                key={`${result.jobTitle}-${idx}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="rounded-xl p-4 space-y-3"
                style={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border) / 0.3)",
                }}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 shrink-0" style={{ color: "hsl(var(--primary))" }} />
                      <h3 className="text-sm font-bold" style={{ color: "hsl(var(--foreground))" }}>
                        {result.jobTitle}
                      </h3>
                    </div>
                    {result.company && (
                      <p className="text-[11px] ml-6 mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                        {result.company}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {result.totalSkills > 0 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "hsl(var(--primary) / 0.1)", color: "hsl(var(--primary))" }}>
                        {result.totalSkills} skills mapped
                      </span>
                    )}
                    <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "hsl(var(--muted) / 0.15)", color: "hsl(var(--muted-foreground))" }}>
                      {result.roleMatch.role}
                    </span>
                  </div>
                </div>

                {/* Tool chips */}
                <div className="flex flex-wrap gap-1.5">
                  {result.matchedTools.map(tool => {
                    const gtcTool = GTC_TOOLS.find(t => t.name === tool.name);
                    return (
                      <div
                        key={tool.name}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-all hover:scale-[1.02] cursor-default group"
                        style={{
                          background: "hsl(var(--muted) / 0.08)",
                          border: "1px solid hsl(var(--border) / 0.2)",
                        }}
                        title={tool.skills.length ? `Skills: ${tool.skills.join(", ")}` : undefined}
                      >
                        <span className="text-sm">{gtcTool?.icon || "🔧"}</span>
                        <span className="font-medium" style={{ color: "hsl(var(--foreground))" }}>{tool.name}</span>
                        {tool.count > 1 && (
                          <span className="text-[9px] px-1 rounded" style={{ background: "hsl(var(--primary) / 0.15)", color: "hsl(var(--primary))" }}>
                            {tool.count}×
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => onApplyStack?.(result.matchedTools.map(t => t.name))}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all"
                    style={{
                      background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.8))",
                      color: "hsl(var(--primary-foreground))",
                    }}
                  >
                    Add all to My Stack <ArrowRight className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => onSelectRole?.(result.roleMatch.role)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all"
                    style={{
                      background: "hsl(var(--muted) / 0.1)",
                      border: "1px solid hsl(var(--border) / 0.2)",
                      color: "hsl(var(--muted-foreground))",
                    }}
                  >
                    View {result.roleMatch.role} Stack
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

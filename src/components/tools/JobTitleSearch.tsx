/**
 * JobTitleSearch — Search by job title → aggregated tool recommendations ranked by relevance.
 * Queries jobs DB, extracts skills across all matches, maps to tools, ranks by frequency.
 */
import { useState, useCallback } from "react";
import { Search, Loader2, X, Plus, Check, ExternalLink, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { JOB_SKILL_TO_TOOLS } from "@/data/tool-skill-mappings";
import { GTC_TOOLS, CATEGORY_CONFIG, type GTCTool } from "@/data/gtc-tools-registry";
import { matchRole } from "@/data/role-tool-recommendations";
import { useMyStack } from "@/hooks/use-my-stack";

interface RankedTool {
  tool: GTCTool;
  score: number; // relevance score (skill match count)
  matchedSkills: string[];
}

interface Props {
  onSelectTool?: (toolName: string) => void;
}

export default function JobTitleSearch({ onSelectTool }: Props) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<RankedTool[]>([]);
  const [searched, setSearched] = useState(false);
  const [searchedTitle, setSearchedTitle] = useState("");
  const [jobCount, setJobCount] = useState(0);
  const { toggleTool, isInStack } = useMyStack();

  const search = useCallback(async () => {
    const q = query.trim();
    if (!q || q.length < 2) return;

    setLoading(true);
    setSearched(true);
    setSearchedTitle(q);

    try {
      // Find matching jobs
      const { data: jobs } = await supabase
        .from("jobs")
        .select("id, title")
        .ilike("title", `%${q}%`)
        .limit(50);

      const jobIds = jobs?.map(j => j.id) || [];
      setJobCount(jobIds.length);

      // Aggregate all skills across matching jobs
      const allSkills = new Map<string, number>(); // skill → frequency

      if (jobIds.length > 0) {
        const [{ data: taskClusters }, { data: jobSkills }] = await Promise.all([
          supabase.from("job_task_clusters").select("skill_names").in("job_id", jobIds),
          supabase.from("job_skills").select("name").in("job_id", jobIds),
        ]);

        for (const tc of taskClusters || []) {
          for (const s of tc.skill_names || []) {
            allSkills.set(s, (allSkills.get(s) || 0) + 1);
          }
        }
        for (const js of jobSkills || []) {
          allSkills.set(js.name, (allSkills.get(js.name) || 0) + 1);
        }
      }

      // Map skills → tools with weighted scoring
      const toolScores = new Map<string, { score: number; skills: Set<string> }>();

      for (const [skill, freq] of allSkills) {
        const tools = JOB_SKILL_TO_TOOLS[skill] || [];
        for (const toolName of tools) {
          if (!toolScores.has(toolName)) toolScores.set(toolName, { score: 0, skills: new Set() });
          const entry = toolScores.get(toolName)!;
          entry.score += freq;
          entry.skills.add(skill);
        }
      }

      // Also boost with role archetype recommendations
      const roleMatch = matchRole(q);
      for (const t of roleMatch.coreTools) {
        if (!toolScores.has(t)) toolScores.set(t, { score: 0, skills: new Set() });
        toolScores.get(t)!.score += 3;
      }
      for (const t of roleMatch.expandedTools) {
        if (!toolScores.has(t)) toolScores.set(t, { score: 0, skills: new Set() });
        toolScores.get(t)!.score += 1;
      }

      // Build ranked list
      const ranked: RankedTool[] = Array.from(toolScores.entries())
        .map(([name, data]) => {
          const tool = GTC_TOOLS.find(t => t.name === name);
          if (!tool) return null;
          return { tool, score: data.score, matchedSkills: Array.from(data.skills) };
        })
        .filter(Boolean) as RankedTool[];

      ranked.sort((a, b) => b.score - a.score);
      setResults(ranked.slice(0, 20));
    } catch (err) {
      console.error("Job search error:", err);
      // Fallback to role-based
      const role = matchRole(q);
      const fallback: RankedTool[] = [...role.coreTools, ...role.expandedTools]
        .map(name => GTC_TOOLS.find(t => t.name === name))
        .filter(Boolean)
        .map((tool, i) => ({ tool: tool!, score: 10 - i, matchedSkills: [] }));
      setResults(fallback);
    } finally {
      setLoading(false);
    }
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") search();
  };

  const maxScore = results[0]?.score || 1;

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
          className="w-full pl-10 pr-24 py-3 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/30"
          style={{
            background: "hsl(var(--muted) / 0.08)",
            border: "1px solid hsl(var(--border) / 0.3)",
            color: "hsl(var(--foreground))",
          }}
        />
        {query && (
          <button
            onClick={() => { setQuery(""); setResults([]); setSearched(false); }}
            className="absolute right-20 top-1/2 -translate-y-1/2 p-1 rounded-full hover:opacity-70"
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
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex items-center justify-center py-8 gap-2 text-sm"
            style={{ color: "hsl(var(--muted-foreground))" }}
          >
            <Loader2 className="h-4 w-4 animate-spin" /> Scanning job database...
          </motion.div>
        )}

        {!loading && searched && results.length === 0 && (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-center py-8 text-sm" style={{ color: "hsl(var(--muted-foreground))" }}
          >
            No tools found for this title. Try a broader term.
          </motion.div>
        )}

        {!loading && results.length > 0 && (
          <motion.div key="results" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Summary */}
            <div className="flex items-center gap-3">
              <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                <span className="font-bold" style={{ color: "hsl(var(--foreground))" }}>{results.length} tools</span> recommended for "<span className="font-medium">{searchedTitle}</span>"
                {jobCount > 0 && <span> · based on {jobCount} real job listings</span>}
              </p>
            </div>

            {/* Card grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {results.map((item, i) => {
                const cfg = CATEGORY_CONFIG[item.tool.category];
                const inStack = isInStack(item.tool.name);
                const relevancePercent = Math.round((item.score / maxScore) * 100);

                return (
                  <motion.div
                    key={item.tool.name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="rounded-xl overflow-hidden transition-all flex flex-col cursor-pointer group hover:shadow-lg"
                    style={{
                      background: "hsl(var(--card))",
                      border: `1px solid ${inStack ? "hsl(45, 90%, 55%, 0.35)" : "hsl(var(--border) / 0.2)"}`,
                    }}
                    onClick={() => onSelectTool?.(item.tool.name)}
                  >
                    {/* Card body */}
                    <div className="p-4 flex-1 space-y-2.5">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="text-2xl">{item.tool.icon}</span>
                          <div>
                            <h3 className="text-sm font-bold leading-tight" style={{ color: "hsl(var(--foreground))" }}>
                              {item.tool.name}
                            </h3>
                            <p className="text-[10px]" style={{ color: "hsl(var(--muted-foreground))" }}>
                              {item.tool.company}
                            </p>
                          </div>
                        </div>
                        <span className="text-[9px] font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                          style={{ background: "hsl(var(--primary) / 0.1)", color: "hsl(var(--primary))" }}>
                          {i + 1}
                        </span>
                      </div>

                      <span className="text-[9px] px-1.5 py-0.5 rounded-full inline-block" style={{ background: cfg?.color + "22", color: cfg?.color }}>
                        {cfg?.label || item.tool.category}
                      </span>

                      <p className="text-[11px] line-clamp-2 leading-relaxed" style={{ color: "hsl(var(--foreground) / 0.7)" }}>
                        {item.tool.description}
                      </p>

                      <div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(var(--muted) / 0.12)" }}>
                          <div className="h-full rounded-full transition-all" style={{ width: `${relevancePercent}%`, background: "hsl(var(--primary))" }} />
                        </div>
                        <p className="text-[9px] mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                          {relevancePercent}% relevance
                        </p>
                      </div>

                      {item.matchedSkills.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {item.matchedSkills.slice(0, 3).map(s => (
                            <span key={s} className="text-[9px] px-1.5 py-0.5 rounded-full"
                              style={{ background: "hsl(var(--primary) / 0.08)", color: "hsl(var(--primary))" }}>
                              {s}
                            </span>
                          ))}
                          {item.matchedSkills.length > 3 && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full"
                              style={{ background: "hsl(var(--muted) / 0.1)", color: "hsl(var(--muted-foreground))" }}>
                              +{item.matchedSkills.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Card footer */}
                    <div className="px-4 pb-3 flex items-center gap-2">
                      <button
                        onClick={e => { e.stopPropagation(); toggleTool(item.tool.name); }}
                        className="flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition-all"
                        style={{
                          background: inStack ? "hsl(45, 90%, 55%, 0.15)" : "hsl(var(--muted) / 0.08)",
                          border: `1px solid ${inStack ? "hsl(45, 90%, 55%, 0.3)" : "hsl(var(--border) / 0.2)"}`,
                          color: inStack ? "hsl(45, 90%, 55%)" : "hsl(var(--foreground) / 0.7)",
                        }}
                      >
                        {inStack ? <><Check className="h-3 w-3" /> In Stack</> : <><Plus className="h-3 w-3" /> Add</>}
                      </button>
                      {item.tool.type === "learnable" && (
                        <button
                          onClick={e => { e.stopPropagation(); onSelectTool?.(item.tool.name); }}
                          className="py-1.5 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"
                          style={{
                            background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.8))",
                            color: "hsl(var(--primary-foreground))",
                          }}
                        >
                          <Sparkles className="h-3 w-3" /> Practice
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

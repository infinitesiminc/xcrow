/**
 * JobTitleSearch — Search by job title → aggregated tool recommendations ranked by relevance.
 * Queries jobs DB, extracts skills across all matches, maps to tools, ranks by frequency.
 */
import { useState, useCallback } from "react";
import { Search, Loader2, X, Plus, Check, ChevronDown, ChevronUp, ExternalLink, Sparkles } from "lucide-react";
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
  const [expandedTool, setExpandedTool] = useState<string | null>(null);
  const [jobCount, setJobCount] = useState(0);
  const { toggleTool, isInStack } = useMyStack();

  const search = useCallback(async () => {
    const q = query.trim();
    if (!q || q.length < 2) return;

    setLoading(true);
    setSearched(true);
    setSearchedTitle(q);
    setExpandedTool(null);

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
          <motion.div key="results" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-1.5">
            {/* Summary */}
            <div className="flex items-center gap-3 pb-2">
              <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                <span className="font-bold" style={{ color: "hsl(var(--foreground))" }}>{results.length} tools</span> recommended for "<span className="font-medium">{searchedTitle}</span>"
                {jobCount > 0 && <span> · based on {jobCount} real job listings</span>}
              </p>
            </div>

            {/* Tool list */}
            {results.map((item, i) => {
              const cfg = CATEGORY_CONFIG[item.tool.category];
              const inStack = isInStack(item.tool.name);
              const isExpanded = expandedTool === item.tool.name;
              const relevancePercent = Math.round((item.score / maxScore) * 100);

              return (
                <motion.div
                  key={item.tool.name}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="rounded-xl overflow-hidden transition-all"
                  style={{
                    background: "hsl(var(--card))",
                    border: `1px solid ${inStack ? "hsl(45, 90%, 55%, 0.35)" : "hsl(var(--border) / 0.2)"}`,
                  }}
                >
                  {/* Main row */}
                  <div
                    className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/5 transition-colors"
                    onClick={() => setExpandedTool(isExpanded ? null : item.tool.name)}
                  >
                    {/* Rank */}
                    <span className="text-[10px] font-bold w-5 text-center shrink-0" style={{ color: "hsl(var(--muted-foreground))" }}>
                      {i + 1}
                    </span>

                    {/* Icon */}
                    <span className="text-xl shrink-0">{item.tool.icon}</span>

                    {/* Name + company */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold truncate" style={{ color: "hsl(var(--foreground))" }}>
                          {item.tool.name}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full shrink-0" style={{ background: cfg?.color + "22", color: cfg?.color }}>
                          {cfg?.label || item.tool.category}
                        </span>
                      </div>
                      <p className="text-[10px] truncate" style={{ color: "hsl(var(--muted-foreground))" }}>
                        {item.tool.company}
                      </p>
                    </div>

                    {/* Relevance bar */}
                    <div className="w-20 shrink-0 hidden sm:block">
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(var(--muted) / 0.15)" }}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${relevancePercent}%`, background: "hsl(var(--primary))" }} />
                      </div>
                      <p className="text-[9px] text-right mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                        {relevancePercent}% match
                      </p>
                    </div>

                    {/* Add button */}
                    <button
                      onClick={e => { e.stopPropagation(); toggleTool(item.tool.name); }}
                      className="shrink-0 p-1.5 rounded-lg transition-all"
                      style={{
                        background: inStack ? "hsl(45, 90%, 55%, 0.15)" : "hsl(var(--muted) / 0.1)",
                        color: inStack ? "hsl(45, 90%, 55%)" : "hsl(var(--muted-foreground))",
                      }}
                    >
                      {inStack ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    </button>

                    {/* Expand chevron */}
                    <div className="shrink-0">
                      {isExpanded ? <ChevronUp className="h-3.5 w-3.5" style={{ color: "hsl(var(--muted-foreground))" }} />
                        : <ChevronDown className="h-3.5 w-3.5" style={{ color: "hsl(var(--muted-foreground))" }} />}
                    </div>
                  </div>

                  {/* Expanded detail */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 pt-1 space-y-3 border-t" style={{ borderColor: "hsl(var(--border) / 0.15)" }}>
                          {/* Description */}
                          <p className="text-xs leading-relaxed" style={{ color: "hsl(var(--foreground) / 0.8)" }}>
                            {item.tool.description}
                          </p>

                          {/* Version */}
                          {item.tool.version && (
                            <span className="text-[9px] px-2 py-0.5 rounded font-mono inline-block"
                              style={{ background: "hsl(var(--muted) / 0.15)", color: "hsl(var(--muted-foreground))" }}>
                              {item.tool.version}
                            </span>
                          )}

                          {/* Product suite */}
                          {item.tool.products && item.tool.products.length > 0 && (
                            <div>
                              <p className="text-[10px] uppercase tracking-wider font-bold mb-1.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                                Product Suite
                              </p>
                              <div className="grid grid-cols-2 gap-1.5">
                                {item.tool.products.slice(0, 6).map(p => (
                                  <div key={p.name} className="px-2.5 py-1.5 rounded-lg text-[10px]"
                                    style={{ background: "hsl(var(--muted) / 0.08)", border: "1px solid hsl(var(--border) / 0.15)" }}>
                                    <span className="font-medium" style={{ color: "hsl(var(--foreground))" }}>{p.name}</span>
                                    <span className="block mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>{p.description}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Matched skills */}
                          {item.matchedSkills.length > 0 && (
                            <div>
                              <p className="text-[10px] uppercase tracking-wider font-bold mb-1.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                                Why this tool
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {item.matchedSkills.map(s => (
                                  <span key={s} className="text-[9px] px-2 py-0.5 rounded-full"
                                    style={{ background: "hsl(var(--primary) / 0.1)", color: "hsl(var(--primary))" }}>
                                    {s}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              onClick={() => toggleTool(item.tool.name)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all"
                              style={{
                                background: inStack ? "hsl(45, 90%, 55%, 0.15)" : "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.8))",
                                color: inStack ? "hsl(45, 90%, 55%)" : "hsl(var(--primary-foreground))",
                                border: inStack ? "1px solid hsl(45, 90%, 55%, 0.3)" : "none",
                              }}
                            >
                              {inStack ? <><Check className="h-3 w-3" /> In Stack</> : <><Plus className="h-3 w-3" /> Add to Stack</>}
                            </button>
                            {item.tool.type === "learnable" && (
                              <button
                                onClick={() => onSelectTool?.(item.tool.name)}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider"
                                style={{ background: "hsl(var(--muted) / 0.1)", border: "1px solid hsl(var(--border) / 0.2)", color: "hsl(var(--foreground) / 0.7)" }}
                              >
                                <Sparkles className="h-3 w-3" /> Practice
                              </button>
                            )}
                            {item.tool.url && (
                              <a href={item.tool.url} target="_blank" rel="noopener noreferrer"
                                className="p-1.5 rounded-lg" style={{ color: "hsl(var(--muted-foreground))" }}>
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

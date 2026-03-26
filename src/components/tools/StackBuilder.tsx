/**
 * StackBuilder — Unified single-page tool discovery.
 * Combines: job title search, role templates, workflow filters, and full catalog browse.
 * All tools shown in a card grid, filterable by category/workflow/search.
 */
import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Loader2, X, Plus, Check, ExternalLink, FlaskConical, Link, Building2 } from "lucide-react";
import ToolQuickQuiz, { type QuizResult } from "./ToolQuickQuiz";
import { supabase } from "@/integrations/supabase/client";
import { GTC_TOOLS, CATEGORY_CONFIG, type GTCTool } from "@/data/gtc-tools-registry";
import { ROLE_RECOMMENDATIONS, matchRole } from "@/data/role-tool-recommendations";
import { WORKFLOW_STAGES, TOOL_WORKFLOW_MAP, type WorkflowStage } from "@/data/role-tool-recommendations";
import { JOB_SKILL_TO_TOOLS } from "@/data/tool-skill-mappings";
import { useMyStack } from "@/hooks/use-my-stack";

interface RankedTool {
  tool: GTCTool;
  score: number;
  matchedSkills: string[];
}


interface Props {
  onSelectTool?: (toolName: string) => void;
}

type FilterMode = "all" | "in-stack" | WorkflowStage;

export default function StackBuilder({ onSelectTool }: Props) {
  const [query, setQuery] = useState("");
  const [jdUrl, setJdUrl] = useState("");
  const [companyUrl, setCompanyUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<RankedTool[] | null>(null);
  const [searchedTitle, setSearchedTitle] = useState("");
  const [jobCount, setJobCount] = useState(0);
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const { toggleTool, isInStack, stack, stackSize } = useMyStack();
  const [proficiencies, setProficiencies] = useState<Record<string, number>>({});
  const [quizTool, setQuizTool] = useState<string | null>(null);
  const [searchMode, setSearchMode] = useState<"title" | "url">("title");

  const handleQuizComplete = (toolName: string, result: QuizResult) => {
    setProficiencies(p => ({ ...p, [toolName]: result.level }));
  };
  // --- Industry boost from company context ---
  const boostFromIndustry = (industry: string | null, toolScores: Map<string, { score: number; skills: Set<string> }>) => {
    if (!industry) return;
    const lower = industry.toLowerCase();
    const industryToolMap: Record<string, string[]> = {
      "technology": ["GitHub Copilot", "AWS", "Azure", "Google Cloud", "Datadog", "Snowflake"],
      "software": ["GitHub Copilot", "Cursor", "Vercel", "Docker", "Kubernetes"],
      "finance": ["Bloomberg Terminal", "Tableau", "Power BI", "Snowflake", "Alteryx"],
      "banking": ["Bloomberg Terminal", "Salesforce", "ServiceNow", "Palantir"],
      "healthcare": ["Epic Systems", "Veeva", "Salesforce Health Cloud", "Power BI"],
      "retail": ["Shopify", "Salesforce", "HubSpot", "Google Analytics", "Tableau"],
      "marketing": ["HubSpot", "Marketo", "Salesforce", "Google Analytics", "Semrush"],
      "consulting": ["Power BI", "Tableau", "Salesforce", "Slack", "Notion"],
      "manufacturing": ["Siemens", "SAP", "Snowflake", "Power BI", "Tableau"],
      "media": ["Adobe Creative Cloud", "Figma", "Canva", "Midjourney", "Runway"],
      "education": ["Canvas", "Google Workspace", "Notion", "Slack"],
      "legal": ["Westlaw", "LexisNexis", "Ironclad", "DocuSign"],
    };
    for (const [key, tools] of Object.entries(industryToolMap)) {
      if (lower.includes(key)) {
        for (const t of tools) {
          if (!toolScores.has(t)) toolScores.set(t, { score: 0, skills: new Set() });
          toolScores.get(t)!.score += 2;
          toolScores.get(t)!.skills.add(`${industry} industry`);
        }
      }
    }
  };

  const search = useCallback(async () => {
    const q = query.trim();
    if (!q || q.length < 2) return;
    setLoading(true);
    setSearchedTitle(q);
    setSelectedTemplate(null);

    try {
      // Build job query — optionally filter by company
      let jobQuery = supabase.from("jobs").select("id, title, company_id").ilike("title", `%${q}%`).limit(50);

      // If company URL provided, find matching company first
      let companyIndustry: string | null = null;
      const cUrl = companyUrl.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "");
      if (cUrl) {
        const { data: companies } = await supabase
          .from("companies")
          .select("id, industry, name")
          .or(`website.ilike.%${cUrl}%,careers_url.ilike.%${cUrl}%,slug.ilike.%${cUrl.split(".")[0]}%`)
          .limit(5);
        if (companies && companies.length > 0) {
          const companyIds = companies.map(c => c.id);
          companyIndustry = companies[0].industry;
          // Boost by also fetching company-specific jobs
          const { data: companyJobs } = await supabase
            .from("jobs").select("id, title").in("company_id", companyIds).ilike("title", `%${q}%`).limit(30);
          if (companyJobs?.length) {
            // Merge — company jobs get extra weight handled below
          }
        }
      }

      const { data: jobs } = jobQuery;
      const jobIds = jobs?.map(j => j.id) || [];
      setJobCount(jobIds.length);

      const allSkills = new Map<string, number>();
      if (jobIds.length > 0) {
        const [{ data: tc }, { data: js }] = await Promise.all([
          supabase.from("job_task_clusters").select("skill_names").in("job_id", jobIds),
          supabase.from("job_skills").select("name").in("job_id", jobIds),
        ]);
        for (const t of tc || []) for (const s of t.skill_names || []) allSkills.set(s, (allSkills.get(s) || 0) + 1);
        for (const j of js || []) allSkills.set(j.name, (allSkills.get(j.name) || 0) + 1);
      }

      const toolScores = new Map<string, { score: number; skills: Set<string> }>();
      for (const [skill, freq] of allSkills) {
        for (const tn of JOB_SKILL_TO_TOOLS[skill] || []) {
          if (!toolScores.has(tn)) toolScores.set(tn, { score: 0, skills: new Set() });
          const e = toolScores.get(tn)!; e.score += freq; e.skills.add(skill);
        }
      }

      // Boost from company industry
      boostFromIndustry(companyIndustry, toolScores);

      const role = matchRole(q);
      for (const t of role.coreTools) { if (!toolScores.has(t)) toolScores.set(t, { score: 0, skills: new Set() }); toolScores.get(t)!.score += 3; }
      for (const t of role.expandedTools) { if (!toolScores.has(t)) toolScores.set(t, { score: 0, skills: new Set() }); toolScores.get(t)!.score += 1; }

      const ranked = Array.from(toolScores.entries())
        .map(([name, d]) => { const tool = GTC_TOOLS.find(t => t.name === name); return tool ? { tool, score: d.score, matchedSkills: Array.from(d.skills) } : null; })
        .filter(Boolean) as RankedTool[];
      ranked.sort((a, b) => b.score - a.score);
      setSearchResults(ranked.slice(0, 24));
    } catch {
      const role = matchRole(q);
      setSearchResults([...role.coreTools, ...role.expandedTools]
        .map(n => GTC_TOOLS.find(t => t.name === n)).filter(Boolean)
        .map((t, i) => ({ tool: t!, score: 10 - i, matchedSkills: [] })));
    } finally { setLoading(false); }
  }, [query, companyUrl]);

  // --- JD URL search ---
  const searchByUrl = useCallback(async () => {
    const url = jdUrl.trim();
    if (!url) return;
    setLoading(true);
    setSearchedTitle("Job Description");
    setSelectedTemplate(null);

    try {
      const { data, error } = await supabase.functions.invoke("parse-jd", {
        body: { url },
      });

      if (error || !data) throw new Error("Failed to parse JD");

      const skills: string[] = [
        ...(data.skills || []).map((s: any) => (typeof s === "string" ? s : s.name || "")),
        ...(data.taskClusters || data.task_clusters || []).flatMap((tc: any) => tc.skill_names || []),
      ].filter(Boolean);

      const title = data.title || data.job_title || "Job Description";
      setSearchedTitle(title);

      const toolScores = new Map<string, { score: number; skills: Set<string> }>();
      for (const skill of skills) {
        for (const tn of JOB_SKILL_TO_TOOLS[skill] || []) {
          if (!toolScores.has(tn)) toolScores.set(tn, { score: 0, skills: new Set() });
          const e = toolScores.get(tn)!; e.score += 1; e.skills.add(skill);
        }
        // Also try fuzzy match on tool names
        const lower = skill.toLowerCase();
        for (const tool of GTC_TOOLS) {
          if (tool.name.toLowerCase().includes(lower) || lower.includes(tool.name.toLowerCase())) {
            if (!toolScores.has(tool.name)) toolScores.set(tool.name, { score: 0, skills: new Set() });
            toolScores.get(tool.name)!.score += 2;
            toolScores.get(tool.name)!.skills.add(skill);
          }
        }
      }

      // Fallback: also match from title
      const role = matchRole(title);
      for (const t of role.coreTools) { if (!toolScores.has(t)) toolScores.set(t, { score: 0, skills: new Set() }); toolScores.get(t)!.score += 3; }
      for (const t of role.expandedTools) { if (!toolScores.has(t)) toolScores.set(t, { score: 0, skills: new Set() }); toolScores.get(t)!.score += 1; }

      const ranked = Array.from(toolScores.entries())
        .map(([name, d]) => { const tool = GTC_TOOLS.find(t => t.name === name); return tool ? { tool, score: d.score, matchedSkills: Array.from(d.skills) } : null; })
        .filter(Boolean) as RankedTool[];
      ranked.sort((a, b) => b.score - a.score);
      setSearchResults(ranked.slice(0, 24));
      setJobCount(0);
    } catch {
      setSearchResults(null);
    } finally { setLoading(false); }
  }, [jdUrl]);

  const clearSearch = () => { setQuery(""); setJdUrl(""); setSearchResults(null); setSearchedTitle(""); };

  // --- Template logic ---
  const templateTools = useMemo(() => {
    if (!selectedTemplate) return null;
    const role = ROLE_RECOMMENDATIONS.find(r => r.role === selectedTemplate);
    if (!role) return null;
    return [...role.coreTools, ...role.expandedTools]
      .map(n => GTC_TOOLS.find(t => t.name === n)).filter(Boolean) as GTCTool[];
  }, [selectedTemplate]);

  // --- Filtered tools for browse mode ---
  const browsableTools = useMemo(() => {
    let tools = GTC_TOOLS;
    if (filterMode === "in-stack") {
      tools = tools.filter(t => isInStack(t.name));
    } else if (filterMode !== "all") {
      tools = tools.filter(t => TOOL_WORKFLOW_MAP[t.name] === filterMode);
    }
    // Also apply text filter if typing but not searching DB
    if (query.length >= 2 && !searchResults) {
      const q = query.toLowerCase();
      tools = tools.filter(t => t.name.toLowerCase().includes(q) || t.company.toLowerCase().includes(q) || t.category.toLowerCase().includes(q));
    }
    return tools;
  }, [filterMode, query, searchResults, isInStack, stack]);

  // Decide what to render
  const isSearchMode = searchResults !== null;
  const isTemplateMode = !isSearchMode && templateTools !== null;
  const isBrowseMode = !isSearchMode && !isTemplateMode;

  const displayTools: { tool: GTCTool; score?: number; matchedSkills?: string[] }[] = isSearchMode
    ? searchResults!
    : isTemplateMode
      ? templateTools!.map((t, i) => ({ tool: t, score: templateTools!.length - i }))
      : browsableTools.map(t => ({ tool: t }));

  const maxScore = isSearchMode ? (searchResults![0]?.score || 1) : (templateTools?.length || 1);

  const workflowFilters: { key: FilterMode; label: string; icon: string }[] = [
    { key: "all", label: "All Tools", icon: "🌐" },
    { key: "in-stack", label: `My Stack (${stackSize})`, icon: "📦" },
    ...Object.entries(WORKFLOW_STAGES).map(([k, v]) => ({ key: k as FilterMode, label: v.label.split(" ")[0], icon: v.icon })),
  ];

  return (
    <div className="space-y-5">
      {/* Search bar */}
      <div className="space-y-2">
        {/* Mode toggle */}
        <div className="flex gap-1">
          <button
            onClick={() => setSearchMode("title")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all"
            style={{
              background: searchMode === "title" ? "hsl(var(--primary) / 0.12)" : "transparent",
              color: searchMode === "title" ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
              border: `1px solid ${searchMode === "title" ? "hsl(var(--primary) / 0.3)" : "transparent"}`,
            }}
          >
            <Search className="h-3 w-3" /> Job Title
          </button>
          <button
            onClick={() => setSearchMode("url")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all"
            style={{
              background: searchMode === "url" ? "hsl(var(--primary) / 0.12)" : "transparent",
              color: searchMode === "url" ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
              border: `1px solid ${searchMode === "url" ? "hsl(var(--primary) / 0.3)" : "transparent"}`,
            }}
          >
            <Link className="h-3 w-3" /> JD URL
          </button>
        </div>

        {/* Input */}
        <div className="relative">
          {searchMode === "title" ? (
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "hsl(var(--muted-foreground))" }} />
          ) : (
            <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "hsl(var(--muted-foreground))" }} />
          )}
          <input
            value={searchMode === "title" ? query : jdUrl}
            onChange={e => {
              if (searchMode === "title") {
                setQuery(e.target.value);
                if (e.target.value.length < 2) setSearchResults(null);
              } else {
                setJdUrl(e.target.value);
              }
            }}
            onKeyDown={e => e.key === "Enter" && (searchMode === "title" ? search() : searchByUrl())}
            placeholder={searchMode === "title" ? "Search by job title for personalized recommendations..." : "Paste a job description URL to extract tool recommendations..."}
            className="w-full pl-10 pr-24 py-3 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/30"
            style={{ background: "hsl(var(--muted) / 0.08)", border: "1px solid hsl(var(--border) / 0.3)", color: "hsl(var(--foreground))" }}
          />
          {(query || jdUrl) && (
            <button onClick={clearSearch} className="absolute right-20 top-1/2 -translate-y-1/2 p-1 rounded-full hover:opacity-70">
              <X className="h-3.5 w-3.5" style={{ color: "hsl(var(--muted-foreground))" }} />
            </button>
          )}
          <button
            onClick={searchMode === "title" ? search : searchByUrl}
            disabled={loading || (searchMode === "title" ? query.trim().length < 2 : jdUrl.trim().length < 5)}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-40"
            style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.8))", color: "hsl(var(--primary-foreground))" }}
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : searchMode === "title" ? "Search" : "Analyze"}
          </button>
        </div>
      </div>

      {/* Role templates row */}
      {!isSearchMode && (
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-wider font-bold" style={{ color: "hsl(var(--muted-foreground))" }}>
            Quick templates
          </p>
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            {ROLE_RECOMMENDATIONS.map(r => (
              <button
                key={r.role}
                onClick={() => setSelectedTemplate(selectedTemplate === r.role ? null : r.role)}
                className="shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all whitespace-nowrap"
                style={{
                  background: selectedTemplate === r.role ? "hsl(var(--primary) / 0.15)" : "hsl(var(--muted) / 0.08)",
                  border: `1px solid ${selectedTemplate === r.role ? "hsl(var(--primary) / 0.4)" : "hsl(var(--border) / 0.2)"}`,
                  color: selectedTemplate === r.role ? "hsl(var(--primary))" : "hsl(var(--foreground) / 0.8)",
                }}
              >
                {r.role}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Workflow filters (browse mode only) */}
      {isBrowseMode && (
        <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-thin">
          {workflowFilters.map(f => (
            <button
              key={f.key}
              onClick={() => setFilterMode(f.key)}
              className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all whitespace-nowrap"
              style={{
                background: filterMode === f.key ? "hsl(var(--foreground) / 0.1)" : "transparent",
                color: filterMode === f.key ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
                border: `1px solid ${filterMode === f.key ? "hsl(var(--border) / 0.4)" : "transparent"}`,
              }}
            >
              <span className="text-xs">{f.icon}</span> {f.label}
            </button>
          ))}
        </div>
      )}

      {/* Status line */}
      <div className="flex items-center justify-between">
        <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
          {isSearchMode && (
            <>
              <span className="font-bold" style={{ color: "hsl(var(--foreground))" }}>{displayTools.length} tools</span>
              {" "}for "<span className="font-medium">{searchedTitle}</span>"
              {jobCount > 0 && <span> · {jobCount} job listings</span>}
            </>
          )}
          {isTemplateMode && (
            <>
              <span className="font-bold" style={{ color: "hsl(var(--foreground))" }}>{selectedTemplate}</span>
              {" "}stack · {displayTools.length} tools
            </>
          )}
          {isBrowseMode && (
            <>
              <span className="font-bold" style={{ color: "hsl(var(--foreground))" }}>{displayTools.length}</span> tools
            </>
          )}
        </p>
        {(isSearchMode || isTemplateMode) && (
          <button
            onClick={() => { clearSearch(); setSelectedTemplate(null); }}
            className="text-[10px] px-2 py-1 rounded-lg flex items-center gap-1"
            style={{ background: "hsl(var(--muted) / 0.1)", color: "hsl(var(--muted-foreground))" }}
          >
            <X className="h-3 w-3" /> Clear
          </button>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12 gap-2 text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
          <Loader2 className="h-4 w-4 animate-spin" /> Scanning job database...
        </div>
      )}

      {/* Card grid */}
      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {displayTools.map((item, i) => {
            const cfg = CATEGORY_CONFIG[item.tool.category];
            const inStack = isInStack(item.tool.name);
            const hasScore = item.score !== undefined;
            const relevancePercent = hasScore ? Math.round(((item.score || 0) / maxScore) * 100) : 0;

            return (
              <motion.div
                key={item.tool.name}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.02, 0.3) }}
                className="rounded-xl overflow-hidden flex flex-col cursor-pointer group hover:shadow-lg transition-all relative"
                style={{
                  background: "hsl(var(--card))",
                  border: `1px solid ${inStack ? "hsl(45, 90%, 55%, 0.35)" : "hsl(var(--border) / 0.2)"}`,
                }}
                onClick={() => onSelectTool?.(item.tool.name)}
              >
                <div className="p-4 flex-1 space-y-2">
                  {/* Header */}
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
                    {hasScore && (
                      <span className="text-[9px] font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: "hsl(var(--primary) / 0.1)", color: "hsl(var(--primary))" }}>
                        {i + 1}
                      </span>
                    )}
                  </div>

                  {/* Category */}
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full inline-block" style={{ background: cfg?.color + "22", color: cfg?.color }}>
                    {cfg?.label || item.tool.category}
                  </span>

                  {/* Description */}
                  <p className="text-[11px] line-clamp-2 leading-relaxed" style={{ color: "hsl(var(--foreground) / 0.7)" }}>
                    {item.tool.description}
                  </p>

                  {/* Relevance bar (search/template mode) */}
                  {hasScore && relevancePercent > 0 && (
                    <div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(var(--muted) / 0.12)" }}>
                        <div className="h-full rounded-full" style={{ width: `${relevancePercent}%`, background: "hsl(var(--primary))" }} />
                      </div>
                      <p className="text-[9px] mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>{relevancePercent}% relevance</p>
                    </div>
                  )}

                  {/* Matched skills */}
                  {item.matchedSkills && item.matchedSkills.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {item.matchedSkills.slice(0, 3).map(s => (
                        <span key={s} className="text-[9px] px-1.5 py-0.5 rounded-full"
                          style={{ background: "hsl(var(--primary) / 0.08)", color: "hsl(var(--primary))" }}>{s}</span>
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

                {/* Footer */}
                <div className="px-4 pb-3 space-y-2">
                  <div className="flex items-center gap-2">
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
                    {item.tool.url && (
                      <a
                        href={item.tool.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="py-1.5 px-2.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all hover:opacity-80"
                        style={{
                          background: "hsl(var(--muted) / 0.08)",
                          border: "1px solid hsl(var(--border) / 0.2)",
                          color: "hsl(var(--foreground) / 0.7)",
                        }}
                      >
                        <ExternalLink className="h-3 w-3" /> Try it
                      </a>
                    )}
                  </div>

                  {/* Quick proficiency test */}
                  {(() => {
                    const LEVELS = [
                      { label: "New", color: "hsl(var(--muted-foreground))", emoji: "🔍" },
                      { label: "Beginner", color: "hsl(200, 80%, 55%)", emoji: "🌱" },
                      { label: "Intermediate", color: "hsl(45, 90%, 55%)", emoji: "⚡" },
                      { label: "Advanced", color: "hsl(var(--primary))", emoji: "🏆" },
                    ];
                    const level = proficiencies[item.tool.name];
                    const lvl = level !== undefined ? LEVELS[level] : null;
                    return (
                      <button
                        onClick={e => { e.stopPropagation(); setQuizTool(item.tool.name); }}
                        className="w-full py-1.5 rounded-lg text-[10px] font-medium flex items-center justify-center gap-1.5 transition-all"
                        style={{
                          background: lvl ? lvl.color + "15" : "hsl(var(--muted) / 0.05)",
                          border: `1px solid ${lvl ? lvl.color + "30" : "hsl(var(--border) / 0.15)"}`,
                          color: lvl ? lvl.color : "hsl(var(--muted-foreground))",
                        }}
                      >
                        {lvl ? (
                          <><span>{lvl.emoji}</span> {lvl.label}</>
                        ) : (
                          <><FlaskConical className="h-3 w-3" /> Test your level</>
                        )}
                      </button>
                    );
                  })()}

                  {/* Quiz overlay */}
                  <AnimatePresence>
                    {quizTool === item.tool.name && (
                      <ToolQuickQuiz
                        tool={item.tool}
                        onComplete={result => handleQuizComplete(item.tool.name, result)}
                        onClose={() => setQuizTool(null)}
                      />
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {!loading && displayTools.length === 0 && (
        <div className="text-center py-12 text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
          {filterMode === "in-stack" ? "No tools in your stack yet. Add tools to get started!" : "No matching tools found."}
        </div>
      )}
    </div>
  );
}

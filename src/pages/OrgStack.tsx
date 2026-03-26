import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GTC_TOOLS, type GTCTool } from "@/data/gtc-tools-registry";
import { JOB_SKILL_TO_TOOLS } from "@/data/tool-skill-mappings";
import { getCompanyConflicts } from "@/data/tool-competition-map";
import { Building2, Search, ChevronRight, Users, Layers, BarChart3, ArrowRight, ExternalLink, Zap, AlertTriangle, Shield, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import SEOHead from "@/components/SEOHead";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

/* ── Types ── */
interface DeptToolData {
  department: string;
  jobCount: number;
  tools: Map<string, { score: number; jobTitles: Set<string>; skills: Set<string> }>;
}

interface OrgData {
  companyName: string;
  companyId: string;
  industry: string;
  totalJobs: number;
  departments: DeptToolData[];
  allTools: Map<string, { score: number; deptCount: number; departments: Set<string> }>;
}

/* ── Helpers ── */
const TOOL_LOOKUP = new Map(GTC_TOOLS.map(t => [t.name, t]));

function mapSkillsToTools(skills: string[]): Map<string, string[]> {
  const result = new Map<string, string[]>();
  for (const skill of skills) {
    const tools = JOB_SKILL_TO_TOOLS[skill];
    if (tools) {
      for (const t of tools) {
        if (!result.has(t)) result.set(t, []);
        result.get(t)!.push(skill);
      }
    }
    // Also check if skill name matches a tool directly
    if (TOOL_LOOKUP.has(skill) && !result.has(skill)) {
      result.set(skill, [skill]);
    }
  }
  return result;
}

/* ── Main Component ── */
export default function OrgStack() {
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [orgData, setOrgData] = useState<OrgData | null>(null);
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const [selectedTool, setSelectedTool] = useState<GTCTool | null>(null);

  // Demo: pre-load Anthropic
  useEffect(() => {
    loadCompany("Anthropic");
  }, []);

  async function loadCompany(name: string) {
    setLoading(true);
    setSelectedDept(null);
    setSelectedTool(null);
    try {
      // Find company
      const { data: companies } = await supabase
        .from("companies")
        .select("id, name, industry")
        .ilike("name", `%${name.trim()}%`)
        .limit(1);

      if (!companies?.length) {
        setLoading(false);
        return;
      }
      const company = companies[0];

      // Get all jobs with skills
      const { data: jobs } = await supabase
        .from("jobs")
        .select("id, title, department")
        .eq("company_id", company.id)
        .limit(1000);

      if (!jobs?.length) {
        setLoading(false);
        return;
      }

      // Get skills for all jobs
      const jobIds = jobs.map(j => j.id);
      const batchSize = 100;
      const allSkills: { job_id: string; name: string }[] = [];
      for (let i = 0; i < jobIds.length; i += batchSize) {
        const batch = jobIds.slice(i, i + batchSize);
        const { data: skills } = await supabase
          .from("job_skills")
          .select("job_id, name")
          .in("job_id", batch);
        if (skills) allSkills.push(...skills);
      }

      // Also get task cluster skill_names
      const allTaskSkills: { job_id: string; skill_names: string[] | null; cluster_name: string }[] = [];
      for (let i = 0; i < jobIds.length; i += batchSize) {
        const batch = jobIds.slice(i, i + batchSize);
        const { data: tasks } = await supabase
          .from("job_task_clusters")
          .select("job_id, skill_names, cluster_name")
          .in("job_id", batch);
        if (tasks) allTaskSkills.push(...(tasks as any[]));
      }

      // Build job → skills map
      const jobSkillsMap = new Map<string, Set<string>>();
      for (const s of allSkills) {
        if (!jobSkillsMap.has(s.job_id)) jobSkillsMap.set(s.job_id, new Set());
        jobSkillsMap.get(s.job_id)!.add(s.name);
      }
      for (const t of allTaskSkills) {
        if (!jobSkillsMap.has(t.job_id)) jobSkillsMap.set(t.job_id, new Set());
        if (t.skill_names) {
          for (const sn of t.skill_names) jobSkillsMap.get(t.job_id)!.add(sn);
        }
        // Add cluster name as implicit skill
        if (t.cluster_name) jobSkillsMap.get(t.job_id)!.add(t.cluster_name);
      }

      // Group jobs by department
      const deptMap = new Map<string, { jobs: typeof jobs }>();
      for (const job of jobs) {
        const dept = job.department?.trim() || "General";
        if (!deptMap.has(dept)) deptMap.set(dept, { jobs: [] });
        deptMap.get(dept)!.jobs.push(job);
      }

      // Build department tool data
      const departments: DeptToolData[] = [];
      const orgToolMap = new Map<string, { score: number; deptCount: number; departments: Set<string> }>();

      for (const [dept, { jobs: deptJobs }] of deptMap) {
        const deptTools = new Map<string, { score: number; jobTitles: Set<string>; skills: Set<string> }>();

        for (const job of deptJobs) {
          const skills = jobSkillsMap.get(job.id);
          if (!skills || skills.size === 0) continue;

          const toolMap = mapSkillsToTools(Array.from(skills));
          for (const [toolName, matchedSkills] of toolMap) {
            if (!TOOL_LOOKUP.has(toolName)) continue;
            if (!deptTools.has(toolName)) {
              deptTools.set(toolName, { score: 0, jobTitles: new Set(), skills: new Set() });
            }
            const entry = deptTools.get(toolName)!;
            entry.score += matchedSkills.length;
            entry.jobTitles.add(job.title);
            for (const s of matchedSkills) entry.skills.add(s);
          }
        }

        departments.push({ department: dept, jobCount: deptJobs.length, tools: deptTools });

        // Aggregate to org level
        for (const [toolName, data] of deptTools) {
          if (!orgToolMap.has(toolName)) {
            orgToolMap.set(toolName, { score: 0, deptCount: 0, departments: new Set() });
          }
          const orgEntry = orgToolMap.get(toolName)!;
          orgEntry.score += data.score;
          orgEntry.deptCount++;
          orgEntry.departments.add(dept);
        }
      }

      // Sort departments by job count
      departments.sort((a, b) => b.jobCount - a.jobCount);

      setOrgData({
        companyName: company.name,
        companyId: company.id,
        industry: company.industry || "Technology",
        totalJobs: jobs.length,
        departments,
        allTools: orgToolMap,
      });
    } catch (err) {
      console.error("Error loading org stack:", err);
    } finally {
      setLoading(false);
    }
  }

  // Competitive conflict detection
  const conflicts = useMemo(() => {
    if (!orgData) return { ownTools: [] as string[], conflictedTools: new Map<string, string>() };
    return getCompanyConflicts(orgData.companyName);
  }, [orgData]);

  const conflictCount = useMemo(() => {
    if (!orgData || !conflicts.conflictedTools.size) return 0;
    let count = 0;
    for (const [toolName] of orgData.allTools) {
      if (conflicts.conflictedTools.has(toolName)) count++;
    }
    return count;
  }, [orgData, conflicts]);

  // Sorted org-wide tools
  const topTools = useMemo(() => {
    if (!orgData) return [];
    return Array.from(orgData.allTools.entries())
      .map(([name, data]) => ({ name, tool: TOOL_LOOKUP.get(name)!, ...data }))
      .filter(t => t.tool)
      .sort((a, b) => {
        // Own tools first, then conflicts last
        const aOwn = conflicts.ownTools.includes(a.name) ? -1 : 0;
        const bOwn = conflicts.ownTools.includes(b.name) ? -1 : 0;
        if (aOwn !== bOwn) return aOwn - bOwn;
        const aConflict = conflicts.conflictedTools.has(a.name) ? 1 : 0;
        const bConflict = conflicts.conflictedTools.has(b.name) ? 1 : 0;
        if (aConflict !== bConflict) return aConflict - bConflict;
        return b.deptCount - a.deptCount || b.score - a.score;
      })
      .slice(0, 30);
  }, [orgData, conflicts]);

  // Selected department tools
  const deptTools = useMemo(() => {
    if (!orgData || !selectedDept) return [];
    const dept = orgData.departments.find(d => d.department === selectedDept);
    if (!dept) return [];
    return Array.from(dept.tools.entries())
      .map(([name, data]) => ({ name, tool: TOOL_LOOKUP.get(name)!, ...data }))
      .filter(t => t.tool)
      .sort((a, b) => {
        const aConflict = conflicts.conflictedTools.has(a.name) ? 1 : 0;
        const bConflict = conflicts.conflictedTools.has(b.name) ? 1 : 0;
        if (aConflict !== bConflict) return aConflict - bConflict;
        return b.score - a.score;
      });
  }, [orgData, selectedDept, conflicts]);

  return (
    <>
      <SEOHead title="Org Stack Mapper | xcrow" description="Map your entire organization's AI tool stack by department" />
      <Navbar />
      <div className="min-h-screen pt-20 pb-16" style={{ background: "hsl(var(--background))" }}>
        <div className="max-w-7xl mx-auto px-4">

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="h-5 w-5" style={{ color: "hsl(var(--primary))" }} />
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "hsl(var(--primary))" }}>
                Enterprise Stack Mapper
              </span>
            </div>
            <h1 className="text-3xl font-black mb-2" style={{ color: "hsl(var(--foreground))" }}>
              Organization Tool Stack
            </h1>
            <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
              See which AI tools map to every department based on real job data
            </p>
          </div>

          {/* Search */}
          <div className="flex gap-2 mb-8 max-w-lg">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "hsl(var(--muted-foreground))" }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === "Enter" && search.trim() && loadCompany(search)}
                placeholder="Search company name..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm"
                style={{
                  background: "hsl(var(--muted) / 0.15)",
                  border: "1px solid hsl(var(--border) / 0.2)",
                  color: "hsl(var(--foreground))",
                }}
              />
            </div>
            <button
              onClick={() => search.trim() && loadCompany(search)}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl text-sm font-bold"
              style={{
                background: "hsl(var(--primary))",
                color: "hsl(var(--primary-foreground))",
                opacity: loading ? 0.5 : 1,
              }}
            >
              {loading ? "Mapping..." : "Map Org"}
            </button>
          </div>

          {loading && (
            <div className="flex items-center gap-3 py-20 justify-center">
              <div className="h-5 w-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "hsl(var(--primary))", borderTopColor: "transparent" }} />
              <span className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>Analyzing organization structure...</span>
            </div>
          )}

          {/* Conflict banner */}
          {orgData && !loading && conflicts.ownTools.length > 0 && (
            <div className="mb-6 rounded-xl p-3 flex items-start gap-3"
              style={{ background: "hsl(var(--destructive) / 0.06)", border: "1px solid hsl(var(--destructive) / 0.15)" }}>
              <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: "hsl(var(--destructive))" }} />
              <div>
                <p className="text-xs font-bold mb-1" style={{ color: "hsl(var(--destructive))" }}>
                  Competitive Conflict Detection
                </p>
                <p className="text-[11px] leading-relaxed" style={{ color: "hsl(var(--foreground) / 0.7)" }}>
                  {orgData.companyName} builds{" "}
                  <span className="font-semibold">{conflicts.ownTools.join(", ")}</span>.
                  {conflictCount > 0 && (
                    <> Found <span className="font-bold" style={{ color: "hsl(var(--destructive))" }}>{conflictCount} competitor tools</span> in the recommended stack that should be replaced with internal alternatives.</>
                  )}
                  {conflictCount === 0 && " No competitor tools detected in the stack."}
                </p>
              </div>
            </div>
          )}

          {orgData && !loading && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

              {/* Left: Departments sidebar */}
              <div className="lg:col-span-3">
                <div className="rounded-2xl p-4" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border) / 0.15)" }}>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-bold" style={{ color: "hsl(var(--foreground))" }}>
                      {orgData.companyName}
                    </h2>
                    <Badge variant="secondary" className="text-[10px]">{orgData.industry}</Badge>
                  </div>
                  <p className="text-[11px] mb-4" style={{ color: "hsl(var(--muted-foreground))" }}>
                    {orgData.totalJobs} roles · {orgData.departments.length} departments · {orgData.allTools.size} tools mapped
                  </p>

                  {/* Org-wide view */}
                  <button
                    onClick={() => setSelectedDept(null)}
                    className="w-full text-left px-3 py-2.5 rounded-xl mb-1 flex items-center gap-2 transition-all text-xs font-semibold"
                    style={{
                      background: !selectedDept ? "hsl(var(--primary) / 0.12)" : "transparent",
                      color: !selectedDept ? "hsl(var(--primary))" : "hsl(var(--foreground))",
                    }}
                  >
                    <Layers className="h-3.5 w-3.5" />
                    Org-Wide Overview
                  </button>

                  <div className="h-px my-2" style={{ background: "hsl(var(--border) / 0.1)" }} />

                  <ScrollArea className="max-h-[500px]">
                    {orgData.departments.map(dept => (
                      <button
                        key={dept.department}
                        onClick={() => setSelectedDept(dept.department)}
                        className="w-full text-left px-3 py-2 rounded-lg mb-0.5 flex items-center justify-between group transition-all"
                        style={{
                          background: selectedDept === dept.department ? "hsl(var(--primary) / 0.12)" : "transparent",
                          color: selectedDept === dept.department ? "hsl(var(--primary))" : "hsl(var(--foreground) / 0.8)",
                        }}
                      >
                        <span className="text-xs font-medium truncate">{dept.department}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px]" style={{ color: "hsl(var(--muted-foreground))" }}>{dept.jobCount}</span>
                          <ChevronRight className="h-3 w-3 opacity-40" />
                        </div>
                      </button>
                    ))}
                  </ScrollArea>
                </div>
              </div>

              {/* Center: Tool grid */}
              <div className="lg:col-span-6">
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-sm font-bold" style={{ color: "hsl(var(--foreground))" }}>
                    {selectedDept ? `${selectedDept} Stack` : "Org-Wide Tool Stack"}
                  </h2>
                  <Badge variant="outline" className="text-[10px]">
                    {selectedDept ? deptTools.length : topTools.length} tools
                  </Badge>
                </div>

                {!selectedDept ? (
                  /* Org-wide heatmap grid */
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {topTools.map(t => {
                      const maxDepts = orgData.departments.length;
                      const coverage = t.deptCount / Math.max(maxDepts, 1);
                      const isOwn = conflicts.ownTools.includes(t.name);
                      const conflictWith = conflicts.conflictedTools.get(t.name);
                      return (
                        <button
                          key={t.name}
                          onClick={() => setSelectedTool(t.tool)}
                          className="text-left rounded-xl p-3 transition-all hover:scale-[1.02] group relative"
                          style={{
                            background: conflictWith
                              ? `linear-gradient(135deg, hsl(var(--destructive) / 0.06), hsl(var(--card)))`
                              : isOwn
                              ? `linear-gradient(135deg, hsl(142 70% 45% / 0.1), hsl(var(--card)))`
                              : `linear-gradient(135deg, hsl(var(--primary) / ${0.04 + coverage * 0.15}), hsl(var(--card)))`,
                            border: conflictWith
                              ? `1px solid hsl(var(--destructive) / 0.3)`
                              : isOwn
                              ? `1px solid hsl(142 70% 45% / 0.3)`
                              : `1px solid hsl(var(--primary) / ${0.1 + coverage * 0.3})`,
                          }}
                        >
                          {/* Conflict/Own badge */}
                          {conflictWith && (
                            <div className="absolute -top-1.5 -right-1.5 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-bold"
                              style={{ background: "hsl(var(--destructive))", color: "white" }}>
                              <AlertTriangle className="h-2.5 w-2.5" /> CONFLICT
                            </div>
                          )}
                          {isOwn && (
                            <div className="absolute -top-1.5 -right-1.5 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-bold"
                              style={{ background: "hsl(142 70% 45%)", color: "white" }}>
                              <ShieldCheck className="h-2.5 w-2.5" /> OWN
                            </div>
                          )}
                          <div className="flex items-start justify-between mb-1.5">
                            <span className="text-lg">{t.tool.icon}</span>
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md"
                              style={{ background: "hsl(var(--primary) / 0.1)", color: "hsl(var(--primary))" }}>
                              {t.deptCount}/{maxDepts}
                            </span>
                          </div>
                          <p className="text-xs font-bold truncate mb-0.5" style={{ color: conflictWith ? "hsl(var(--destructive))" : "hsl(var(--foreground))" }}>{t.name}</p>
                          <p className="text-[10px]" style={{ color: "hsl(var(--muted-foreground))" }}>
                            {conflictWith
                              ? `Competes with ${conflictWith}`
                              : <>
                                  {Array.from(t.departments).slice(0, 3).join(", ")}
                                  {t.departments.size > 3 && ` +${t.departments.size - 3}`}
                                </>
                            }
                          </p>
                          {/* Coverage bar */}
                          <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ background: "hsl(var(--muted) / 0.2)" }}>
                            <div className="h-full rounded-full" style={{
                              width: `${coverage * 100}%`,
                              background: conflictWith ? "hsl(var(--destructive) / 0.6)" : isOwn ? "hsl(142 70% 45%)" : "hsl(var(--primary))",
                            }} />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  /* Department-specific tools */
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {deptTools.map(t => {
                      const isOwn = conflicts.ownTools.includes(t.name);
                      const conflictWith = conflicts.conflictedTools.get(t.name);
                      return (
                        <button
                          key={t.name}
                          onClick={() => setSelectedTool(t.tool)}
                          className="text-left rounded-xl p-3 transition-all hover:scale-[1.02] relative"
                          style={{
                            background: conflictWith ? "hsl(var(--destructive) / 0.04)" : isOwn ? "hsl(142 70% 45% / 0.06)" : "hsl(var(--card))",
                            border: conflictWith ? "1px solid hsl(var(--destructive) / 0.25)" : isOwn ? "1px solid hsl(142 70% 45% / 0.25)" : "1px solid hsl(var(--border) / 0.15)",
                          }}
                        >
                          {conflictWith && (
                            <div className="absolute -top-1.5 -right-1.5 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-bold"
                              style={{ background: "hsl(var(--destructive))", color: "white" }}>
                              <AlertTriangle className="h-2.5 w-2.5" /> CONFLICT
                            </div>
                          )}
                          {isOwn && (
                            <div className="absolute -top-1.5 -right-1.5 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-bold"
                              style={{ background: "hsl(142 70% 45%)", color: "white" }}>
                              <ShieldCheck className="h-2.5 w-2.5" /> OWN
                            </div>
                          )}
                          <div className="flex items-start justify-between mb-1.5">
                            <span className="text-lg">{t.tool.icon}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md"
                              style={{ background: "hsl(var(--muted) / 0.15)", color: "hsl(var(--muted-foreground))" }}>
                              {t.jobTitles.size} roles
                            </span>
                          </div>
                          <p className="text-xs font-bold truncate mb-0.5" style={{ color: conflictWith ? "hsl(var(--destructive))" : "hsl(var(--foreground))" }}>{t.name}</p>
                          <p className="text-[10px] line-clamp-2" style={{ color: "hsl(var(--muted-foreground))" }}>
                            {conflictWith ? `Competes with ${conflictWith}` : Array.from(t.skills).slice(0, 3).join(", ")}
                          </p>
                          <div className="mt-2 flex items-center gap-1">
                            <Zap className="h-2.5 w-2.5" style={{ color: conflictWith ? "hsl(var(--destructive))" : "hsl(var(--primary))" }} />
                            <span className="text-[10px] font-medium" style={{ color: conflictWith ? "hsl(var(--destructive))" : "hsl(var(--primary))" }}>
                              {conflictWith ? "Replace recommended" : `Relevance: ${Math.min(100, Math.round(t.score * 5))}%`}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                    {deptTools.length === 0 && (
                      <p className="col-span-full text-center py-12 text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
                        No tool data for this department yet — skills haven't been extracted for these roles.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Right: Stats / Detail panel */}
              <div className="lg:col-span-3">
                {selectedTool ? (
                  <div className="rounded-2xl p-4 sticky top-24" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border) / 0.15)" }}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-2xl">{selectedTool.icon}</span>
                      <div>
                        <h3 className="text-sm font-bold" style={{ color: "hsl(var(--foreground))" }}>{selectedTool.name}</h3>
                        <p className="text-[10px]" style={{ color: "hsl(var(--muted-foreground))" }}>{selectedTool.company}</p>
                      </div>
                    </div>
                    <p className="text-xs mb-3 leading-relaxed" style={{ color: "hsl(var(--foreground) / 0.7)" }}>
                      {selectedTool.description}
                    </p>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-[11px]">
                        <span style={{ color: "hsl(var(--muted-foreground))" }}>Category</span>
                        <Badge variant="secondary" className="text-[9px]">{selectedTool.category}</Badge>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span style={{ color: "hsl(var(--muted-foreground))" }}>Pricing</span>
                        <span style={{ color: "hsl(var(--foreground))" }}>{selectedTool.pricing || "N/A"}</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span style={{ color: "hsl(var(--muted-foreground))" }}>Depts using</span>
                        <span style={{ color: "hsl(var(--primary))" }} className="font-bold">
                          {orgData.allTools.get(selectedTool.name)?.deptCount || 0} / {orgData.departments.length}
                        </span>
                      </div>
                    </div>

                    {/* Departments this tool appears in */}
                    <div className="mb-4">
                      <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "hsl(var(--muted-foreground))" }}>
                        Department Coverage
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {Array.from(orgData.allTools.get(selectedTool.name)?.departments || []).map(d => (
                          <Badge key={d} variant="outline" className="text-[9px] cursor-pointer" onClick={() => setSelectedDept(d)}>
                            {d}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Products */}
                    {selectedTool.products && selectedTool.products.length > 0 && (
                      <div className="mb-4">
                        <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "hsl(var(--muted-foreground))" }}>
                          Product Suite
                        </p>
                        <div className="space-y-1.5">
                          {selectedTool.products.slice(0, 5).map(p => (
                            <div key={p.name} className="flex items-center justify-between text-[11px] py-1 px-2 rounded-lg"
                              style={{ background: "hsl(var(--muted) / 0.08)" }}>
                              <span style={{ color: "hsl(var(--foreground))" }}>{p.name}</span>
                              {p.url && (
                                <button onClick={() => window.open(p.url, '_blank', 'noopener')} className="p-0 bg-transparent border-none cursor-pointer">
                                  <ExternalLink className="h-3 w-3" style={{ color: "hsl(var(--muted-foreground))" }} />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedTool.url && (
                      <button
                        onClick={() => window.open(selectedTool.url, '_blank', 'noopener')}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold"
                        style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
                      >
                        Visit {selectedTool.name} <ArrowRight className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ) : (
                  /* Summary stats */
                  <div className="rounded-2xl p-4 sticky top-24" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border) / 0.15)" }}>
                    <h3 className="text-sm font-bold mb-3" style={{ color: "hsl(var(--foreground))" }}>
                      <BarChart3 className="h-4 w-4 inline mr-1.5" style={{ color: "hsl(var(--primary))" }} />
                      Stack Insights
                    </h3>

                    {/* Top categories */}
                    <div className="space-y-3">
                      {(() => {
                        const catCounts = new Map<string, number>();
                        for (const [name] of orgData.allTools) {
                          const t = TOOL_LOOKUP.get(name);
                          if (t) {
                            catCounts.set(t.category, (catCounts.get(t.category) || 0) + 1);
                          }
                        }
                        return Array.from(catCounts.entries())
                          .sort((a, b) => b[1] - a[1])
                          .slice(0, 8)
                          .map(([cat, count]) => (
                            <div key={cat}>
                              <div className="flex justify-between text-[11px] mb-1">
                                <span style={{ color: "hsl(var(--foreground) / 0.7)" }}>
                                  {cat.replace(/-/g, " ")}
                                </span>
                                <span className="font-mono font-bold" style={{ color: "hsl(var(--primary))" }}>{count}</span>
                              </div>
                              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(var(--muted) / 0.15)" }}>
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${(count / orgData.allTools.size) * 100}%`,
                                    background: "hsl(var(--primary) / 0.6)",
                                  }}
                                />
                              </div>
                            </div>
                          ));
                      })()}
                    </div>

                    <div className="h-px my-4" style={{ background: "hsl(var(--border) / 0.1)" }} />

                    {/* Cross-dept tools */}
                    <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "hsl(var(--muted-foreground))" }}>
                      Cross-Department (3+ depts)
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {topTools
                        .filter(t => t.deptCount >= 3)
                        .slice(0, 12)
                        .map(t => (
                          <Badge
                            key={t.name}
                            variant="secondary"
                            className="text-[9px] cursor-pointer hover:opacity-80"
                            onClick={() => setSelectedTool(t.tool)}
                          >
                            {t.tool.icon} {t.name}
                          </Badge>
                        ))}
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}

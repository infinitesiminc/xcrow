import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Zap, Building2, Users, Target, Swords } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import ICPResearchStream, { type ResearchPhase } from "@/components/enterprise/ICPResearchStream";

/* ── Types ── */
export interface ParsedPersona {
  title: string;
  painPoints: string[];
  buyingTriggers: string[];
  titles: string[];       // for Apollo search
}

export interface ParsedCompetitor {
  name: string;
  domain?: string;
  differentiator?: string;
}

export interface ParsedReport {
  companySummary: string;
  personas: ParsedPersona[];
  prospectDomains: string[];
  competitors: ParsedCompetitor[];
  rawText: string;
}

/* ── Report parser ── */
export function parseReportText(text: string): ParsedReport {
  const sections = text.split(/(?=^## )/m);
  let companySummary = "";
  const personas: ParsedPersona[] = [];
  const prospectDomains: string[] = [];
  const competitors: ParsedCompetitor[] = [];

  for (const section of sections) {
    const headerMatch = section.match(/^## (.+)/);
    if (!headerMatch) {
      if (!companySummary) companySummary = section.trim().slice(0, 500);
      continue;
    }
    const header = headerMatch[1].toLowerCase();

    if (header.includes("company") || header.includes("overview") || header.includes("market") || header.includes("dna")) {
      companySummary = section.replace(/^## .+\n/, "").trim().slice(0, 600);
    }

    if (header.includes("icp") || header.includes("persona") || header.includes("buyer")) {
      const personaBlocks = section.split(/(?=^### )/m);
      for (const block of personaBlocks) {
        const nameMatch = block.match(/^### (.+)/);
        if (!nameMatch) continue;
        const title = nameMatch[1].replace(/\*\*/g, "").trim();
        if (title.length < 3) continue;

        const painPoints: string[] = [];
        const buyingTriggers: string[] = [];
        const titles: string[] = [];

        // Extract bullet points
        const lines = block.split("\n");
        let currentSection = "";
        for (const line of lines) {
          const l = line.trim().toLowerCase();
          if (l.includes("search title")) { currentSection = "title"; continue; }
          else if (l.includes("pain") || l.includes("challenge") || l.includes("disqualif")) { currentSection = "pain"; continue; }
          else if (l.includes("trigger") || l.includes("buying")) { currentSection = "trigger"; continue; }
          else if (l.includes("primary buyer") || l.includes("secondary buyer") || l.includes("decision-maker") || l.includes("decision maker")) {
            // Extract inline title from "**Primary buyer**: VP of Sales, ..."
            const inlineMatch = line.match(/\*\*(?:Primary|Secondary)\s+(?:buyer|decision[\s-]?maker)\*\*:\s*(.+)/i);
            if (inlineMatch) {
              const rawTitle = inlineMatch[1].split(",")[0].replace(/\*\*/g, "").trim();
              if (rawTitle.length < 60 && rawTitle.length > 2) titles.push(rawTitle);
            }
            currentSection = "";
            continue;
          }

          const bulletMatch = line.trim().match(/^[-*]\s+(.+)/);
          if (bulletMatch) {
            const val = bulletMatch[1].replace(/\*\*/g, "").trim();
            // Skip values that look like section headers
            if (/^(search\s+titles?|pain\s+points?|buying\s+triggers?|key\s+challenges?)[:\s]*$/i.test(val)) continue;
            if (currentSection === "pain") painPoints.push(val);
            else if (currentSection === "trigger") buyingTriggers.push(val);
            else if (currentSection === "title") {
              // Clean up list items like "- VP of Sales" or "- \"Director of Payments\""
              const clean = val.replace(/^["']+|["']+$/g, "").trim();
              if (clean.length > 2 && clean.length < 60) titles.push(clean);
            }
          }
        }

        // Fallback: generate PERSONA-SPECIFIC titles from the segment name
        if (titles.length === 0) {
          // Clean the persona title to extract the core segment concept
          const cleanSegment = title
            .replace(/^(?:ICP\s+)?Segment\s*\d*:?\s*/i, "")
            .replace(/\s+(?:Seeking|Looking|Needing)\s+.+$/i, "")
            .split(/[,(]/)[0]
            .trim();

          // Generate role-based titles from the segment
          if (cleanSegment.length > 2) {
            titles.push(`VP of ${cleanSegment}`, `Director of ${cleanSegment}`, `Head of ${cleanSegment}`);
          }
          // Always add a few universal decision-maker titles as last resort
          if (titles.length === 0) {
            titles.push("VP of Sales", "Director of Operations", "Chief Revenue Officer");
          }
        }

        personas.push({ title, painPoints: painPoints.slice(0, 4), buyingTriggers: buyingTriggers.slice(0, 3), titles: titles.slice(0, 5) });
      }
    }

    if (header.includes("prospect") || header.includes("target")) {
      const domainMatches = section.matchAll(/(?:domain|website|url)?[:\s]*([a-z0-9][-a-z0-9]*\.[a-z]{2,}(?:\.[a-z]{2,})?)/gi);
      for (const m of domainMatches) {
        const d = m[1].toLowerCase();
        if (!d.includes("example.") && d.length > 4) prospectDomains.push(d);
      }
    }

    if (header.includes("compet") || header.includes("landscape")) {
      // Parse competitor entries — look for ### headers or bold names with domains
      const compBlocks = section.split(/(?=^### )/m);
      for (const block of compBlocks) {
        const nameMatch = block.match(/^### (.+)/);
        if (nameMatch) {
          const name = nameMatch[1].replace(/\*\*/g, "").trim();
          const domainMatch = block.match(/(?:domain|website|url)?[:\s]*([a-z0-9][-a-z0-9]*\.[a-z]{2,}(?:\.[a-z]{2,})?)/i);
          // Extract first bullet or sentence as differentiator
          const diffMatch = block.match(/[-*]\s+(.{10,120})/);
          competitors.push({
            name,
            domain: domainMatch?.[1]?.toLowerCase(),
            differentiator: diffMatch?.[1]?.replace(/\*\*/g, "").trim(),
          });
        } else {
          // Try bold names: **CompanyName** (domain.com) — description
          const boldMatches = block.matchAll(/\*\*([^*]+)\*\*[^a-z]*(?:\(?([a-z0-9][-a-z0-9]*\.[a-z]{2,})\)?)?[:\s—-]*([^\n]{10,120})?/gi);
          for (const bm of boldMatches) {
            const name = bm[1].trim();
            if (name.length > 2 && !name.toLowerCase().includes("where") && !name.toLowerCase().includes("direct")) {
              competitors.push({
                name,
                domain: bm[2]?.toLowerCase(),
                differentiator: bm[3]?.trim(),
              });
            }
          }
        }
      }
    }
  }

  return { companySummary, personas, prospectDomains: [...new Set(prospectDomains)], competitors: competitors.slice(0, 8), rawText: text };
}

/* ── Research hook ── */
export function useResearchStream() {
  const PHASE_ORDER = ["PHASE_01", "PHASE_02", "PHASE_03", "PHASE_04"];
  const PHASE_LABELS = [
    "Website DNA & Market Position",
    "ICP & Buyer Personas",
    "Competitive Landscape",
    "Strategic Targets",
  ];
  const INITIAL: ResearchPhase[] = PHASE_ORDER.map((id, i) => ({ id, label: PHASE_LABELS[i], status: "pending" as const }));
  const PHASE_TIMING = [15, 35, 55, 70];

  const [phases, setPhases] = useState<ResearchPhase[]>(INITIAL);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<ParsedReport | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef(0);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const runningRef = useRef(false);
  const jobIdRef = useRef<string | null>(null);

  const updatePhasesFromElapsed = useCallback((elapsedSec: number, isComplete: boolean) => {
    if (isComplete) {
      setPhases(PHASE_ORDER.map((id, i) => ({ id, label: PHASE_LABELS[i], status: "complete" as const, progress: 100 })));
      return;
    }
    let activeIdx = 0;
    for (let i = PHASE_TIMING.length - 1; i >= 0; i--) {
      if (elapsedSec >= PHASE_TIMING[i]) { activeIdx = i; break; }
    }
    const sublabels = ["Analyzing website & value proposition", "Mapping ICP segments & buyer personas", "Scanning competitive landscape", "Identifying strategic targets"];
    setPhases(PHASE_ORDER.map((id, i) => ({
      id, label: PHASE_LABELS[i],
      status: i < activeIdx ? "complete" as const : i === activeIdx ? "active" as const : "pending" as const,
      progress: i < activeIdx ? 100 : i === activeIdx ? Math.min(90, Math.floor(((elapsedSec - PHASE_TIMING[activeIdx]) / ((PHASE_TIMING[activeIdx + 1] || 90) - PHASE_TIMING[activeIdx])) * 80) + 10) : 0,
      sublabel: i === activeIdx ? sublabels[i] : undefined,
    })));
  }, []);

  /* Start polling for a job_id — shared by start() and resumeIfRunning() */
  const startPolling = useCallback((jobId: string) => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = setInterval(async () => {
      try {
        const { data, error: fetchErr } = await (supabase.from("research_jobs") as any)
          .select("status, progress, current_phase, report_text, error")
          .eq("id", jobId)
          .single();
        if (fetchErr || !data) return;
        if (data.status === "complete") {
          if (pollingRef.current) clearInterval(pollingRef.current);
          if (timerRef.current) clearInterval(timerRef.current);
          updatePhasesFromElapsed(0, true);
          if (data.report_text) setReport(parseReportText(data.report_text));
          setRunning(false);
          runningRef.current = false;
          jobIdRef.current = null;
        } else if (data.status === "failed") {
          if (pollingRef.current) clearInterval(pollingRef.current);
          if (timerRef.current) clearInterval(timerRef.current);
          setError(data.error || "Research failed");
          setRunning(false);
          runningRef.current = false;
          jobIdRef.current = null;
        }
      } catch (pollErr) { console.error("Poll error:", pollErr); }
    }, 3000);
  }, [updatePhasesFromElapsed]);

  const start = useCallback(async (domain: string, companyContext?: string) => {
    if (runningRef.current) return;
    runningRef.current = true;
    setPhases([...INITIAL]);
    setElapsed(0);
    setReport(null);
    setError(null);
    setRunning(true);
    startRef.current = Date.now();
    timerRef.current = setInterval(() => {
      const el = (Date.now() - startRef.current) / 1000;
      setElapsed(el);
      updatePhasesFromElapsed(el, false);
    }, 500);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const { data: { session } } = await supabase.auth.getSession();
      const resp = await fetch(`${supabaseUrl}/functions/v1/perplexity-research`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session?.access_token ?? supabaseKey}`, "apikey": supabaseKey },
        body: JSON.stringify({ domain: domain.trim().toLowerCase(), companyContext }),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const { job_id } = await resp.json();
      if (!job_id) throw new Error("No job_id returned");
      jobIdRef.current = job_id;
      startPolling(job_id);
    } catch (e: any) {
      console.error("Research start error:", e);
      setError(e.message || "Failed to start research");
      if (timerRef.current) clearInterval(timerRef.current);
      setRunning(false);
      runningRef.current = false;
      jobIdRef.current = null;
    }
  }, [updatePhasesFromElapsed, startPolling]);

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  /* Resume only the newest valid in-flight job for a domain */
  const resumeIfRunning = useCallback(async (userId: string, domainKey: string) => {
    try {
      const { data } = await (supabase.from("research_jobs") as any)
        .select("id, status, created_at")
        .eq("user_id", userId)
        .eq("domain", domainKey)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (!data?.id || !["pending", "processing"].includes(data.status)) return false;

      const jobAgeMs = Date.now() - new Date(data.created_at).getTime();
      const maxResumableAgeMs = 15 * 60 * 1000;
      if (jobAgeMs > maxResumableAgeMs) return false;

      jobIdRef.current = data.id;
      runningRef.current = true;
      setRunning(true);
      setError(null);
      setReport(null);
      startRef.current = new Date(data.created_at).getTime();
      timerRef.current = setInterval(() => {
        const el = (Date.now() - startRef.current) / 1000;
        setElapsed(el);
        updatePhasesFromElapsed(el, false);
      }, 500);
      startPolling(data.id);
      return true;
    } catch { /* no resumable job */ }
    return false;
  }, [updatePhasesFromElapsed, startPolling]);

  const restore = useCallback((parsed: ParsedReport) => {
    setReport(parsed);
    setPhases(PHASE_ORDER.map((id, i) => ({ id, label: PHASE_LABELS[i], status: "complete" as const, progress: 100 })));
    setRunning(false);
    setError(null);
    runningRef.current = false;
    jobIdRef.current = null;
  }, []);

  const reset = useCallback(() => {
    // Don't kill polling if a job is actively running server-side
    if (runningRef.current && jobIdRef.current) return;
    setReport(null);
    setPhases([...INITIAL]);
    setElapsed(0);
    setError(null);
    setRunning(false);
    runningRef.current = false;
    jobIdRef.current = null;
    if (pollingRef.current) clearInterval(pollingRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const forceReset = useCallback(() => {
    setReport(null);
    setPhases([...INITIAL]);
    setElapsed(0);
    setError(null);
    setRunning(false);
    runningRef.current = false;
    jobIdRef.current = null;
    if (pollingRef.current) clearInterval(pollingRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const isComplete = !running && !error && phases.every(p => p.status === "complete");
  const isInitial = !running && !error && phases.every(p => p.status === "pending");

  return { phases, elapsed, running, error, report, start, restore, reset, forceReset, resumeIfRunning, isComplete, isInitial };
}

/* ── Research Section UI ── */
function formatTime(s: number) {
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${String(mins).padStart(2, "0")}:${String(Math.floor(secs)).padStart(2, "0")}.${String(Math.floor((secs % 1) * 10))}s`;
}

interface ResearchSectionProps {
  domain: string;
  onDomainChange: (d: string) => void;
  onStart: () => void;
  phases: ResearchPhase[];
  elapsed: number;
  running: boolean;
  error: string | null;
  isComplete: boolean;
  isInitial: boolean;
  report?: ParsedReport | null;
}

export default function ResearchSection({ domain, onDomainChange, onStart, phases, elapsed, running, error, isComplete, isInitial, report }: ResearchSectionProps) {
  return (
    <div className="space-y-6">
      {/* URL Input */}
      <header className="flex items-end justify-between border-b border-border/30 pb-5 pt-2">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="size-2 rounded-full bg-primary animate-pulse shadow-[0_0_12px_hsl(var(--primary))]" />
            <span className="text-xs font-mono text-primary uppercase tracking-[0.2em]">
              {running ? "Research Pipeline Active" : isComplete ? "Research Complete" : "ICP Research Pipeline"}
            </span>
          </div>
          <div className="flex gap-2 items-center">
            <input
              type="text"
              value={domain}
              onChange={e => onDomainChange(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && domain.trim()) onStart(); }}
              placeholder="e.g. stripe.com"
              className="h-10 rounded-lg border border-border/50 bg-muted/20 px-4 text-sm font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring w-64"
            />
            <Button onClick={onStart} size="sm" className="gap-2 h-10 px-5" disabled={running || !domain.trim()}>
              <Zap className="w-4 h-4" /> Research
            </Button>
          </div>
        </div>
        {(running || isComplete) && (
          <div className="flex flex-col items-end gap-1">
            <span className="font-mono text-xs text-muted-foreground uppercase tracking-widest">{isComplete ? "Completed" : "Runtime"}</span>
            <span className="font-mono text-lg text-primary tabular-nums">{formatTime(elapsed)}</span>
          </div>
        )}
      </header>

      {/* Initial empty state */}
      {isInitial && (
        <div className="flex flex-col items-center justify-center gap-6 pt-16">
          <div className="size-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Zap className="w-7 h-7 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground max-w-md font-mono text-center">
            Enter a company website above to run deep AI research — market position, buyer personas, competitors, and pipeline targets.
          </p>
          <p className="text-xs text-muted-foreground/60 font-mono">Powered by Deep Research — takes ~2-3 minutes</p>
        </div>
      )}

      {/* Running */}
      {running && <ICPResearchStream targetDomain={domain} phases={phases} elapsedSeconds={elapsed} />}

      {/* Error */}
      {error && !running && (
        <div className="flex flex-col items-center justify-center gap-6 pt-16">
          <div className="size-16 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center">
            <Zap className="w-7 h-7 text-destructive" />
          </div>
          <h2 className="text-xl font-medium text-foreground">Research Failed</h2>
          <p className="text-sm text-muted-foreground max-w-md">{error}</p>
          <Button onClick={onStart} size="lg" className="gap-2"><Zap className="w-4 h-4" /> Retry</Button>
        </div>
      )}

      {/* Complete — show summary */}
      {isComplete && report && (
        <div className="space-y-4">
          <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 flex items-center gap-3">
            <div className="size-2 rounded-full bg-primary" />
            <span className="text-sm font-medium text-primary">Research complete</span>
            <span className="text-xs text-muted-foreground ml-auto font-mono">{formatTime(elapsed)}</span>
          </div>

          {/* Company Overview */}
          {report.companySummary && (
            <div className="rounded-lg border border-border/40 bg-card p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Building2 className="w-4 h-4 text-primary" />
                Company Overview
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{report.companySummary}</p>
            </div>
          )}

          {/* Personas summary */}
          {report.personas.length > 0 && (
            <div className="rounded-lg border border-border/40 bg-card p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Users className="w-4 h-4 text-primary" />
                ICP Segments ({report.personas.length})
              </div>
              <div className="grid gap-2">
                {report.personas.map((p, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-md bg-muted/30 px-3 py-2">
                    <span className="text-xs font-mono text-primary mt-0.5">{String(i + 1).padStart(2, "0")}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{p.title}</p>
                      {p.titles.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          Targets: {p.titles.slice(0, 3).join(", ")}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Competitors */}
          {report.competitors.length > 0 && (
            <div className="rounded-lg border border-border/40 bg-card p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Swords className="w-4 h-4 text-primary" />
                Competitive Landscape ({report.competitors.length})
              </div>
              <div className="grid gap-2">
                {report.competitors.map((c, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-md bg-muted/30 px-3 py-2">
                    <span className="text-xs font-mono text-primary mt-0.5">{String(i + 1).padStart(2, "0")}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {c.name}
                        {c.domain && <span className="text-xs text-muted-foreground ml-1.5 font-mono">({c.domain})</span>}
                      </p>
                      {c.differentiator && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{c.differentiator}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Prospect domains */}
          {report.prospectDomains.length > 0 && (
            <div className="rounded-lg border border-border/40 bg-card p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Target className="w-4 h-4 text-primary" />
                Prospecting Targets ({report.prospectDomains.length})
              </div>
              <div className="flex flex-wrap gap-1.5">
                {report.prospectDomains.map((d, i) => (
                  <span key={i} className="px-2 py-0.5 rounded-full bg-muted/50 text-xs font-mono text-muted-foreground border border-border/30">
                    {d}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Complete but no report yet */}
      {isComplete && !report && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 flex items-center gap-3">
          <div className="size-2 rounded-full bg-primary" />
          <span className="text-sm font-medium text-primary">Research complete</span>
          <span className="text-xs text-muted-foreground ml-auto font-mono">{formatTime(elapsed)}</span>
        </div>
      )}
    </div>
  );
}

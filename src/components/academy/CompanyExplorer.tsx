import { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { CURATED_COMPANIES, getAllCuratedCompanies, type CuratedCompany } from "@/data/curated-companies";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { toast } from "sonner";
import {
  Building2, Globe, ArrowLeft, Loader2, CheckCircle2,
  ChevronRight, Linkedin, Target, Package, UserCheck,
  RefreshCw, Users, Lock,
} from "lucide-react";

/* ── types ─────────────────────────────────────────── */

interface CompanyData {
  id: string;
  name: string;
  industry: string | null;
  website: string | null;
  description: string | null;
  employee_range: string | null;
  funding_stage: string | null;
  headquarters: string | null;
  estimated_arr?: string | null;
  estimated_employees?: string | null;
}

interface StepConfig {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
}

type ExplorerPhase = "pick-industry" | "pick-company" | "analysis";

/* ── constants ─────────────────────────────────────── */

const STEPS: StepConfig[] = [
  { id: "company-dna", label: "Company DNA", icon: <Building2 className="w-4 h-4" />, description: "Key signals, model, and buying triggers" },
  { id: "product-map", label: "Product Lines", icon: <Package className="w-4 h-4" />, description: "Every product mapped with ID (P1, P2…)" },
  { id: "pmf-matrix", label: "Product-Market Fit", icon: <Target className="w-4 h-4" />, description: "Pain / Buyer / Entry per product" },
  { id: "icp-tree", label: "ICP Tree", icon: <Users className="w-4 h-4" />, description: "Vertical → Segment → Persona per product" },
  { id: "buyer-id", label: "Decision Makers", icon: <UserCheck className="w-4 h-4" />, description: "DM vs Champion grouped by product" },
  { id: "linkedin-reveal", label: "LinkedIn Profiles", icon: <Linkedin className="w-4 h-4" />, description: "Real profiles tagged to products & roles" },
];

const INDUSTRY_GROUPS = [
  { label: "Fintech", query: "Fintech" },
  { label: "SaaS / B2B", query: "SaaS" },
  { label: "AI & ML", query: "AI" },
  { label: "Developer Tools", query: "Developer Tools" },
  { label: "Healthcare", query: "Health" },
  { label: "Security", query: "Security" },
  { label: "E-commerce", query: "commerce" },
  { label: "Education", query: "Education" },
  { label: "Real Estate", query: "Real Estate" },
  { label: "All Industries", query: "" },
];

/* ── markdown renderer ─────────────────────────────── */

function StepMarkdown({ content }: { content: string }) {
  return (
    <div className="prose prose-sm max-w-none
      prose-headings:text-foreground prose-headings:font-semibold prose-headings:mt-4 prose-headings:mb-2
      prose-h2:text-base prose-h3:text-sm prose-h3:text-muted-foreground prose-h3:uppercase prose-h3:tracking-wide
      prose-p:text-foreground/90 prose-p:leading-relaxed
      prose-li:text-foreground/90 prose-li:leading-relaxed
      prose-strong:text-foreground prose-strong:font-semibold
      prose-ul:my-2 prose-ol:my-2
    ">
      <ReactMarkdown
        components={{
          table: ({ children }) => (
            <div className="overflow-x-auto -mx-2 my-4">
              <table className="min-w-full text-sm border-collapse">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-muted/60">{children}</thead>,
          th: ({ children }) => (
            <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide px-3 py-2 border-b border-border whitespace-nowrap">{children}</th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-3 text-foreground/90 border-b border-border/40 align-top leading-relaxed">{children}</td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

/* ── main component ────────────────────────────────── */

export default function CompanyExplorer() {
  const [phase, setPhase] = useState<ExplorerPhase>("pick-industry");
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);
  const [companies, setCompanies] = useState<CompanyData[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<CompanyData | null>(null);
  const [loadingCompanies, setLoadingCompanies] = useState(false);

  // Analysis state
  const [stepResults, setStepResults] = useState<Record<string, string>>({});
  const [activeStepId, setActiveStepId] = useState<string | null>(null);
  const [runningRef] = useState({ cancelled: false });
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Auto-scroll to active step
  useEffect(() => {
    if (activeStepId && sectionRefs.current[activeStepId]) {
      sectionRefs.current[activeStepId]?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [activeStepId]);

  /* ── data loading ──────────────────────────────── */

  function curatedToCompanyData(c: CuratedCompany): CompanyData {
    return {
      id: c.website,
      name: c.name,
      industry: c.industry,
      website: c.website,
      description: c.description,
      employee_range: c.employee_range,
      funding_stage: c.funding_stage,
      headquarters: c.headquarters,
    };
  }

  function loadCompanies(industryQuery: string) {
    const list = industryQuery
      ? (CURATED_COMPANIES[industryQuery] || [])
      : getAllCuratedCompanies().slice(0, 20);
    setCompanies(list.map(curatedToCompanyData));
  }

  /* ── sequential analysis runner ────────────────── */

  const runAllSteps = useCallback(async (company: CompanyData) => {
    runningRef.cancelled = false;
    const accumulated: Record<string, string> = {};

    for (const step of STEPS) {
      if (runningRef.cancelled) break;
      setActiveStepId(step.id);

      try {
        const { data, error } = await supabase.functions.invoke("gtm-analyze", {
          body: { stepId: step.id, company, previousResults: accumulated },
        });
        if (error) throw error;
        const content = data?.content || data?.feedback || "Analysis complete.";
        accumulated[step.id] = content;
        setStepResults(prev => ({ ...prev, [step.id]: content }));
      } catch (e) {
        console.error(`Step ${step.id} failed:`, e);
        toast.error(`${step.label} failed — try again.`);
        break;
      }
    }
    setActiveStepId(null);
  }, [runningRef]);

  /* ── handlers ──────────────────────────────────── */

  function handleIndustryPick(group: typeof INDUSTRY_GROUPS[0]) {
    setSelectedIndustry(group.label);
    loadCompanies(group.query);
    setPhase("pick-company");
  }

  function handleCompanyPick(company: CompanyData) {
    setSelectedCompany(company);
    setStepResults({});
    setActiveStepId(null);
    setPhase("analysis");
    runAllSteps(company);
  }

  function handleReset() {
    runningRef.cancelled = true;
    setPhase("pick-industry");
    setSelectedIndustry(null);
    setSelectedCompany(null);
    setCompanies([]);
    setStepResults({});
    setActiveStepId(null);
  }

  /* ── INDUSTRY PICKER ───────────────────────────── */

  if (phase === "pick-industry") {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-foreground mb-3">GTM Company Explorer</h1>
          <p className="text-muted-foreground text-lg max-w-lg mx-auto">
            Pick an industry, choose a company, and watch the full GTM analysis build — from DNA to LinkedIn profiles.
          </p>
        </div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Select an industry</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {INDUSTRY_GROUPS.map(group => (
            <button
              key={group.label}
              onClick={() => handleIndustryPick(group)}
              className="flex items-center justify-between p-4 rounded-xl border border-border bg-card hover:border-primary/40 hover:shadow-md transition-all text-left group"
            >
              <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{group.label}</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  /* ── COMPANY PICKER ────────────────────────────── */

  if (phase === "pick-company") {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Button variant="ghost" size="sm" onClick={() => setPhase("pick-industry")} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to industries
        </Button>
        <h2 className="text-xl font-bold text-foreground mb-1">{selectedIndustry} Companies</h2>
        <p className="text-sm text-muted-foreground mb-6">Pick a company to analyze through the full GTM pipeline</p>

        {companies.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No companies found. Try "All Industries".</div>
        ) : (
          <div className="space-y-2">
            {companies.map(c => (
              <button
                key={c.id}
                onClick={() => handleCompanyPick(c)}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/40 hover:shadow-md transition-all text-left group"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-foreground group-hover:text-primary transition-colors">{c.name}</div>
                  <p className="text-xs text-muted-foreground truncate">{c.description?.slice(0, 80)}...</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {c.funding_stage && <Badge variant="outline" className="text-[10px]">{c.funding_stage}</Badge>}
                  {c.employee_range && <Badge variant="secondary" className="text-xs">{c.employee_range}</Badge>}
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  /* ── ANALYSIS VIEW (single-screen accordion) ───── */

  const completedCount = Object.keys(stepResults).length;
  const progressPct = Math.round((completedCount / STEPS.length) * 100);
  const isRunning = activeStepId !== null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={handleReset}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Start over
          </Button>
          <div>
            <h2 className="text-lg font-bold text-foreground">{selectedCompany?.name}</h2>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {selectedCompany?.industry && <span>{selectedCompany.industry}</span>}
              {selectedCompany?.website && (
                <a href={selectedCompany.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-0.5">
                  <Globe className="w-3 h-3" /> Website
                </a>
              )}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted-foreground mb-1">
            {isRunning ? `Analyzing step ${completedCount + 1} of ${STEPS.length}` : `${completedCount}/${STEPS.length} complete`}
          </div>
          <Progress value={progressPct} className="h-1.5 w-32" />
        </div>
      </div>

      {/* All steps as accordion */}
      <Accordion type="multiple" defaultValue={STEPS.map(s => s.id)} className="space-y-3">
        {STEPS.map((step) => {
          const result = stepResults[step.id];
          const isActive = activeStepId === step.id;
          const isDone = !!result;
          const isPending = !isDone && !isActive;

          return (
            <AccordionItem
              key={step.id}
              value={step.id}
              ref={(el) => { sectionRefs.current[step.id] = el; }}
              className="border rounded-xl bg-card overflow-hidden"
            >
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="flex items-center gap-3 w-full">
                  <div className={`shrink-0 ${isDone ? "text-primary" : isActive ? "text-primary" : "text-muted-foreground/50"}`}>
                    {isDone ? <CheckCircle2 className="w-5 h-5" /> : isActive ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      {step.icon}
                      <span className={`font-medium text-sm ${isPending ? "text-muted-foreground/60" : "text-foreground"}`}>
                        {step.label}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                {isActive && !result ? (
                  <div className="flex items-center gap-2 py-8 justify-center text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-sm">Analyzing {selectedCompany?.name}...</span>
                  </div>
                ) : result ? (
                  <StepMarkdown content={result} />
                ) : (
                  <div className="text-center py-6 text-muted-foreground/50 text-sm">
                    Waiting for previous steps...
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      {/* Footer */}
      {!isRunning && completedCount === STEPS.length && (
        <div className="flex justify-center mt-6">
          <Button onClick={handleReset} variant="outline">
            <RefreshCw className="w-4 h-4 mr-1" /> Explore another company
          </Button>
        </div>
      )}
    </div>
  );
}

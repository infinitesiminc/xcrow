import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Building2, Globe, Users, ArrowRight, ArrowLeft,
  Loader2, CheckCircle2, ChevronRight, Linkedin,
  Target, Brain, Package, UserCheck, RefreshCw,
} from "lucide-react";

interface CompanyData {
  id: string;
  name: string;
  industry: string | null;
  website: string | null;
  description: string | null;
  employee_range: string | null;
  funding_stage: string | null;
  headquarters: string | null;
  estimated_arr: string | null;
  estimated_employees: string | null;
}

interface StepResult {
  title: string;
  content: string;
  reasoning: string;
}

type ExplorerPhase = "pick-industry" | "pick-company" | "running" | "results";

interface StepConfig {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const STEPS: StepConfig[] = [
  { id: "company-dna", label: "Company DNA", icon: <Building2 className="w-4 h-4" />, description: "Extract what this company does, who they serve, and their buying signals" },
  { id: "product-map", label: "Product Lines", icon: <Package className="w-4 h-4" />, description: "Map every product line, its target user, and pricing model" },
  { id: "pmf-matrix", label: "Product-Market Fit", icon: <Target className="w-4 h-4" />, description: "Which product solves which pain for which buyer?" },
  { id: "icp-tree", label: "ICP Tree", icon: <Users className="w-4 h-4" />, description: "Build 3-layer niche tree: Vertical → Segment → Persona" },
  { id: "buyer-id", label: "Decision Makers", icon: <UserCheck className="w-4 h-4" />, description: "Identify the budget holders and champions to contact" },
  { id: "linkedin-reveal", label: "LinkedIn Profiles", icon: <Linkedin className="w-4 h-4" />, description: "Real profiles of people who match your ICP" },
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

export default function CompanyExplorer() {
  
  const [phase, setPhase] = useState<ExplorerPhase>("pick-industry");
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);
  const [companies, setCompanies] = useState<CompanyData[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<CompanyData | null>(null);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [stepResults, setStepResults] = useState<Record<string, StepResult>>({});
  const [analyzing, setAnalyzing] = useState(false);
  const [allComplete, setAllComplete] = useState(false);

  async function loadCompanies(industryQuery: string) {
    setLoadingCompanies(true);
    try {
      let query = supabase
        .from("companies")
        .select("id, name, industry, website, description, employee_range, funding_stage, headquarters, estimated_arr, estimated_employees")
        .not("website", "is", null)
        .not("description", "is", null);

      if (industryQuery) {
        query = query.ilike("industry", `%${industryQuery}%`);
      }

      const { data } = await query.limit(20).order("name");
      setCompanies((data || []) as CompanyData[]);
    } finally {
      setLoadingCompanies(false);
    }
  }

  function handleIndustryPick(group: typeof INDUSTRY_GROUPS[0]) {
    setSelectedIndustry(group.label);
    loadCompanies(group.query);
    setPhase("pick-company");
  }

  function handleCompanyPick(company: CompanyData) {
    setSelectedCompany(company);
    setCurrentStep(0);
    setStepResults({});
    setAllComplete(false);
    setPhase("running");
    runStep(0, company);
  }

  async function runStep(stepIdx: number, company: CompanyData) {
    const step = STEPS[stepIdx];
    if (!step) return;

    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("gtm-analyze", {
        body: { stepId: step.id, company },
      });

      if (error) throw error;

      setStepResults(prev => ({
        ...prev,
        [step.id]: {
          title: step.label,
          content: data?.content || data?.feedback || "Analysis complete.",
          reasoning: data?.reasoning || "",
        },
      }));

      setCurrentStep(stepIdx);

      if (stepIdx === STEPS.length - 1) {
        setAllComplete(true);
      }
    } catch (e) {
      console.error("Step analysis failed:", e);
      toast.error("Analysis failed. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  }

  function handleNextStep() {
    if (!selectedCompany) return;
    const next = currentStep + 1;
    if (next < STEPS.length) {
      setCurrentStep(next);
      if (!stepResults[STEPS[next].id]) {
        runStep(next, selectedCompany);
      }
    }
  }

  function handlePrevStep() {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  }

  function handleReset() {
    setPhase("pick-industry");
    setSelectedIndustry(null);
    setSelectedCompany(null);
    setCompanies([]);
    setStepResults({});
    setCurrentStep(0);
    setAllComplete(false);
  }

  // ─── INDUSTRY PICKER ────────────────────────────────
  if (phase === "pick-industry") {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-foreground mb-3">GTM Company Explorer</h1>
          <p className="text-muted-foreground text-lg max-w-lg mx-auto">
            Pick an industry, choose a company, and watch AI walk you through the full GTM reasoning — from DNA to LinkedIn profiles.
          </p>
        </div>

        <div className="mb-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Select an industry</h2>
        </div>
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

  // ─── COMPANY PICKER ─────────────────────────────────
  if (phase === "pick-company") {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Button variant="ghost" size="sm" onClick={() => setPhase("pick-industry")} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to industries
        </Button>

        <h2 className="text-xl font-bold text-foreground mb-1">
          {selectedIndustry} Companies
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          Pick a company to analyze through the full GTM pipeline
        </p>

        {loadingCompanies ? (
          <div className="flex items-center gap-2 text-muted-foreground py-12 justify-center">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading companies...
          </div>
        ) : companies.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No companies found for this industry. Try "All Industries".
          </div>
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
                  {c.employee_range && (
                    <Badge variant="secondary" className="text-xs">{c.employee_range}</Badge>
                  )}
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ─── RUNNING / RESULTS ──────────────────────────────
  const activeStep = STEPS[currentStep];
  const activeResult = activeStep ? stepResults[activeStep.id] : null;
  const progressPct = Math.round(((Object.keys(stepResults).length) / STEPS.length) * 100);

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
            Step {currentStep + 1} of {STEPS.length}
          </div>
          <Progress value={progressPct} className="h-1.5 w-32" />
        </div>
      </div>

      {/* Step navigation */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
        {STEPS.map((step, i) => {
          const isDone = !!stepResults[step.id];
          const isActive = i === currentStep;
          const isLocked = i > Object.keys(stepResults).length;

          return (
            <button
              key={step.id}
              disabled={isLocked}
              onClick={() => !isLocked && setCurrentStep(i)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : isDone
                  ? "bg-primary/10 text-primary"
                  : isLocked
                  ? "bg-muted text-muted-foreground/50 cursor-not-allowed"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
            >
              {isDone && !isActive ? <CheckCircle2 className="w-3.5 h-3.5" /> : step.icon}
              <span className="hidden sm:inline">{step.label}</span>
            </button>
          );
        })}
      </div>

      {/* Step content */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            {activeStep?.icon}
            <CardTitle className="text-base">{activeStep?.label}</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">{activeStep?.description}</p>
        </CardHeader>
        <CardContent>
          {analyzing && !activeResult ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Analyzing {selectedCompany?.name}...
              </p>
            </div>
          ) : activeResult ? (
            <div className="prose prose-sm max-w-none
              prose-headings:text-foreground prose-headings:font-semibold prose-headings:mt-6 prose-headings:mb-2
              prose-h2:text-base prose-h3:text-sm prose-h3:text-muted-foreground prose-h3:uppercase prose-h3:tracking-wide
              prose-p:text-foreground/90 prose-p:leading-relaxed
              prose-li:text-foreground/90 prose-li:leading-relaxed
              prose-strong:text-foreground prose-strong:font-semibold
              prose-ul:my-2 prose-ol:my-2
              prose-table:text-sm prose-th:text-left prose-th:text-muted-foreground prose-th:font-medium prose-th:pb-2 prose-th:border-b prose-th:border-border
              prose-td:py-1.5 prose-td:pr-4 prose-td:text-foreground/90 prose-td:border-b prose-td:border-border/50
            ">
              <ReactMarkdown>{activeResult.content}</ReactMarkdown>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Complete previous steps to unlock this analysis.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={handlePrevStep} disabled={currentStep === 0}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Previous
        </Button>

        {currentStep < STEPS.length - 1 ? (
          <Button
            onClick={handleNextStep}
            disabled={analyzing || !activeResult}
          >
            Next: {STEPS[currentStep + 1]?.label}
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        ) : allComplete ? (
          <Button onClick={handleReset} variant="outline">
            <RefreshCw className="w-4 h-4 mr-1" /> Explore another company
          </Button>
        ) : null}
      </div>
    </div>
  );
}

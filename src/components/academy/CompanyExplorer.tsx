import { useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CURATED_COMPANIES, getAllCuratedCompanies, type CuratedCompany } from "@/data/curated-companies";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Building2, ArrowLeft, Loader2, ChevronRight, RefreshCw, MapPin, Rocket,
} from "lucide-react";
import GTMTreeView from "./GTMTreeView";
import type { GTMTreeData } from "./gtm-types";

/* ── types ── */
interface CompanyData {
  id: string;
  name: string;
  industry: string | null;
  website: string | null;
  description: string | null;
  employee_range: string | null;
  funding_stage: string | null;
  headquarters: string | null;
}

type ExplorerPhase = "pick-industry" | "pick-company" | "analysis" | "confirm-location";

/* ── pipeline steps ── */
const STEPS = [
  { id: "products", label: "Products & DNA", description: "Mapping product lines and competitors" },
  { id: "customers", label: "Customer Discovery", description: "Scraping website for named customers + prospect targets" },
  { id: "icp-buyers", label: "ICP & Buyer Mapping", description: "Building vertical → segment → persona tree" },
  { id: "linkedin-profiles", label: "LinkedIn Profiles", description: "Finding real decision makers at customer companies" },
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

/* ── main component ── */
export default function CompanyExplorer({ initialWebsite }: { initialWebsite?: string }) {
  const [phase, setPhase] = useState<ExplorerPhase>("pick-industry");
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);
  const [companies, setCompanies] = useState<CompanyData[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<CompanyData | null>(null);

  // Analysis
  const [currentStepIdx, setCurrentStepIdx] = useState(-1);
  const [stepResults, setStepResults] = useState<Record<string, any>>({});
  const [treeData, setTreeData] = useState<GTMTreeData | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isGeneratingMore, setIsGeneratingMore] = useState(false);
  const [cancelRef] = useState({ cancelled: false });
  const autoStarted = useRef(false);
  const [locationInput, setLocationInput] = useState("");
  const [icpSummary, setIcpSummary] = useState<{ verticals: string[]; roles: string[] } | null>(null);
  const accumulatedRef = useRef<Record<string, any>>({});

  // Auto-start analysis from URL param
  useEffect(() => {
    if (initialWebsite && !autoStarted.current) {
      autoStarted.current = true;
      const domain = initialWebsite.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, "");
      const name = domain.split(".")[0].charAt(0).toUpperCase() + domain.split(".")[0].slice(1);
      const company: CompanyData = {
        id: initialWebsite,
        name,
        industry: null,
        website: initialWebsite.includes("://") ? initialWebsite : `https://${initialWebsite}`,
        description: null,
        employee_range: null,
        funding_stage: null,
        headquarters: null,
      };
      setSelectedCompany(company);
      setPhase("analysis");
      runPipeline(company);
    }
  }, [initialWebsite]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── data ── */
  function curatedToCompanyData(c: CuratedCompany): CompanyData {
    return { id: c.website, name: c.name, industry: c.industry, website: c.website, description: c.description, employee_range: c.employee_range, funding_stage: c.funding_stage, headquarters: c.headquarters };
  }

  function loadCompanies(q: string) {
    const list = q ? (CURATED_COMPANIES[q] || []) : getAllCuratedCompanies().slice(0, 20);
    setCompanies(list.map(curatedToCompanyData));
  }

  /* ── run pipeline (steps 1-3, pauses before step 4) ── */
  const runPipeline = useCallback(async (company: CompanyData) => {
    cancelRef.cancelled = false;
    setIsRunning(true);
    const accumulated: Record<string, any> = {};

    // Run steps 1-3 only (products, customers, icp-buyers)
    for (let i = 0; i < 3; i++) {
      if (cancelRef.cancelled) break;
      const step = STEPS[i];
      setCurrentStepIdx(i);

      try {
        const { data, error } = await supabase.functions.invoke("gtm-analyze", {
          body: { stepId: step.id, company, previousResults: accumulated },
        });
        if (error) throw error;
        accumulated[step.id] = data;
        setStepResults((prev) => ({ ...prev, [step.id]: data }));
      } catch (e) {
        console.error(`Step ${step.id} failed:`, e);
        toast.error(`${step.label} failed — try again.`);
        setIsRunning(false);
        setCurrentStepIdx(-1);
        return;
      }
    }

    // Extract ICP summary for the confirmation dialog
    const mappings = accumulated["icp-buyers"]?.structured?.mappings || [];
    const verticals = [...new Set(mappings.map((m: any) => m.vertical).filter(Boolean))] as string[];
    const roles = [...new Set(mappings.flatMap((m: any) => [m.dm?.title, m.champion?.title]).filter(Boolean))] as string[];
    setIcpSummary({ verticals, roles });
    accumulatedRef.current = accumulated;

    setIsRunning(false);
    setCurrentStepIdx(-1);
    setPhase("confirm-location");
  }, [cancelRef]);

  /* ── run step 4 after user confirms location ── */
  const runLeadGeneration = useCallback(async (location: string) => {
    if (!selectedCompany) return;
    setPhase("analysis");
    setIsRunning(true);
    setCurrentStepIdx(3);

    const accumulated = accumulatedRef.current;

    try {
      const { data, error } = await supabase.functions.invoke("gtm-analyze", {
        body: {
          stepId: "linkedin-profiles",
          company: selectedCompany,
          previousResults: accumulated,
          location: location || undefined,
          batchSize: 5,
        },
      });
      if (error) throw error;
      accumulated["linkedin-profiles"] = data;
      setStepResults((prev) => ({ ...prev, "linkedin-profiles": data }));
    } catch (e) {
      console.error("LinkedIn profiles step failed:", e);
      toast.error("Lead generation failed — try again.");
    }

    // Assemble tree data
    const products = accumulated["products"]?.structured;
    const customers = accumulated["customers"]?.structured;
    const icpBuyers = accumulated["icp-buyers"]?.structured;
    const profiles = accumulated["linkedin-profiles"]?.structured;

    if (products) {
      setTreeData({
        company_summary: products.company_summary || "",
        products: products.products || [],
        customers: customers?.customers || [],
        conquest_targets: customers?.conquest_targets || [],
        mappings: icpBuyers?.mappings || [],
        leads: profiles?.leads || [],
      });
    }

    setIsRunning(false);
    setCurrentStepIdx(-1);
  }, [selectedCompany]);

  /* ── generate more leads ── */
  const handleGenerateMore = useCallback(async (productId: string, vertical: string | null) => {
    if (!selectedCompany || !treeData) return;
    setIsGeneratingMore(true);
    try {
      const product = treeData.products.find(p => p.id === productId);
      const { data, error } = await supabase.functions.invoke("gtm-analyze", {
        body: {
          stepId: "linkedin-profiles",
          company: selectedCompany,
          previousResults: {
            products: { structured: { products: treeData.products, company_summary: treeData.company_summary } },
            customers: { structured: { customers: treeData.customers, conquest_targets: treeData.conquest_targets } },
            "icp-buyers": { structured: { mappings: treeData.mappings } },
          },
          generateMore: {
            count: 5,
            productId,
            productName: product?.name || productId,
            vertical,
            existingLeads: treeData.leads
              .filter(l => l.product_id === productId && (!vertical || l.vertical === vertical))
              .map(l => l.name),
          },
        },
      });
      if (error) throw error;
      const newLeads = data?.structured?.leads || [];
      if (newLeads.length > 0) {
        setTreeData(prev => prev ? { ...prev, leads: [...prev.leads, ...newLeads] } : prev);
        toast.success(`Added ${newLeads.length} new leads`);
      } else {
        toast.info("No additional leads found");
      }
    } catch (e) {
      console.error("Generate more failed:", e);
      toast.error("Failed to generate more leads");
    } finally {
      setIsGeneratingMore(false);
    }
  }, [selectedCompany, treeData]);

  /* ── handlers ── */
  function handleIndustryPick(group: typeof INDUSTRY_GROUPS[0]) {
    setSelectedIndustry(group.label);
    loadCompanies(group.query);
    setPhase("pick-company");
  }

  function handleCompanyPick(company: CompanyData) {
    setSelectedCompany(company);
    setStepResults({});
    setTreeData(null);
    setPhase("analysis");
    runPipeline(company);
  }

  function handleReset() {
    cancelRef.cancelled = true;
    setPhase("pick-industry");
    setSelectedIndustry(null);
    setSelectedCompany(null);
    setCompanies([]);
    setStepResults({});
    setTreeData(null);
    setIsRunning(false);
    setCurrentStepIdx(-1);
    setLocationInput("");
    setIcpSummary(null);
    accumulatedRef.current = {};
  }

  /* ── INDUSTRY PICKER ── */
  if (phase === "pick-industry") {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-foreground mb-3">GTM Company Explorer</h1>
          <p className="text-muted-foreground text-lg max-w-lg mx-auto">
            Pick an industry, choose a company, and watch the full GTM tree build — from products to LinkedIn profiles.
          </p>
        </div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Select an industry</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {INDUSTRY_GROUPS.map((group) => (
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

  /* ── COMPANY PICKER ── */
  if (phase === "pick-company") {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Button variant="ghost" size="sm" onClick={() => setPhase("pick-industry")} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to industries
        </Button>
        <h2 className="text-xl font-bold text-foreground mb-1">{selectedIndustry} Companies</h2>
        <p className="text-sm text-muted-foreground mb-6">Pick a company to build the full GTM tree</p>
        {companies.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No companies found.</div>
        ) : (
          <div className="space-y-2">
            {companies.map((c) => (
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
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  /* ── CONFIRM LOCATION ── */
  if (phase === "confirm-location" && icpSummary) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Button variant="ghost" size="sm" onClick={handleReset} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-1" /> Start over
        </Button>

        <div className="rounded-xl border border-border bg-card p-6 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-foreground mb-1">ICP Analysis Complete</h2>
            <p className="text-sm text-muted-foreground">
              We mapped {selectedCompany?.name}'s buyer profile. Review below, then generate your first 5 leads.
            </p>
          </div>

          {/* ICP Summary */}
          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Target Verticals</p>
              <div className="flex flex-wrap gap-1.5">
                {icpSummary.verticals.map((v) => (
                  <Badge key={v} variant="secondary" className="text-xs">{v}</Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Decision-Maker Roles</p>
              <div className="flex flex-wrap gap-1.5">
                {icpSummary.roles.slice(0, 8).map((r) => (
                  <Badge key={r} variant="outline" className="text-xs">{r}</Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Location Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              Location preference
              <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <Input
              placeholder="e.g. New York, USA or London, UK"
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
              className="text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Leave blank to search globally, or enter a city/region to focus leads there.
            </p>
          </div>

          {/* CTA */}
          <Button
            className="w-full"
            size="lg"
            onClick={() => runLeadGeneration(locationInput.trim())}
          >
            <Rocket className="w-4 h-4 mr-2" />
            Generate first 5 leads
          </Button>
        </div>
      </div>
    );
  }

  /* ── ANALYSIS VIEW ── */
  const completedCount = Object.keys(stepResults).length;
  const progressPct = Math.round((completedCount / STEPS.length) * 100);

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={handleReset}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Start over
          </Button>
          <div>
            <h2 className="text-lg font-bold text-foreground">{selectedCompany?.name}</h2>
            <p className="text-xs text-muted-foreground">{selectedCompany?.industry} · {selectedCompany?.website}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted-foreground mb-1">
            {isRunning
              ? `Step ${currentStepIdx + 1}/${STEPS.length}: ${STEPS[currentStepIdx]?.label}`
              : `${completedCount}/${STEPS.length} complete`}
          </div>
          <Progress value={progressPct} className="h-1.5 w-32" />
        </div>
      </div>

      {/* Pipeline status */}
      {isRunning && (
        <div className="flex items-center gap-3 mb-4 p-3 rounded-lg border border-border bg-card">
          <Loader2 className="w-4 h-4 animate-spin text-primary shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">{STEPS[currentStepIdx]?.label}</p>
            <p className="text-xs text-muted-foreground">{STEPS[currentStepIdx]?.description}</p>
          </div>
          <div className="flex gap-1">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full ${
                  i < completedCount ? "bg-primary" : i === currentStepIdx ? "bg-primary animate-pulse" : "bg-muted"
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Tree view */}
      {treeData ? (
        <div>
          <GTMTreeView companyName={selectedCompany?.name || ""} data={treeData} companyMeta={selectedCompany ? { industry: selectedCompany.industry, employee_range: selectedCompany.employee_range, funding_stage: selectedCompany.funding_stage, headquarters: selectedCompany.headquarters, website: selectedCompany.website } : undefined} onGenerateMore={handleGenerateMore} isGeneratingMore={isGeneratingMore} />
        </div>
      ) : isRunning ? (
        <div className="space-y-4 animate-pulse">
          {/* Company banner skeleton */}
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="h-4 w-2/3 bg-muted rounded mb-2" />
            <div className="flex gap-3 mt-3">
              <div className="h-5 w-20 bg-muted rounded-full" />
              <div className="h-5 w-24 bg-muted rounded-full" />
              <div className="h-5 w-16 bg-muted rounded-full" />
            </div>
          </div>
          {/* Two-column skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <div className="h-4 w-32 bg-muted rounded" />
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-muted" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-3/4 bg-muted rounded" />
                    <div className="h-2.5 w-1/2 bg-muted rounded" />
                  </div>
                </div>
              ))}
            </div>
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <div className="h-4 w-24 bg-muted rounded" />
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-muted" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-2/3 bg-muted rounded" />
                    <div className="h-2.5 w-1/3 bg-muted rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : !isRunning && completedCount === STEPS.length ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>Analysis complete but no structured data could be extracted.</p>
          <Button onClick={handleReset} variant="outline" className="mt-4">
            <RefreshCw className="w-4 h-4 mr-1" /> Try another company
          </Button>
        </div>
      ) : null}

      {/* Footer */}
      {!isRunning && treeData && (
        <div className="flex justify-center mt-6">
          <Button onClick={handleReset} variant="outline">
            <RefreshCw className="w-4 h-4 mr-1" /> Explore another company
          </Button>
        </div>
      )}
    </div>
  );
}

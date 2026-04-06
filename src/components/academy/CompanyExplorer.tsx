import { useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CURATED_COMPANIES, getAllCuratedCompanies, type CuratedCompany } from "@/data/curated-companies";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Building2, ArrowLeft, Loader2, ChevronRight, RefreshCw, Rocket,
} from "lucide-react";
import GTMTreeView from "./GTMTreeView";
import StrategyChatPanel from "./StrategyChatPanel";
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

type ExplorerPhase = "input" | "icp-mapping" | "strategy-chat" | "first-batch" | "explore";

/* ── pipeline steps ── */
const STEPS = [
  { id: "products", label: "Products & DNA", description: "Mapping product lines and competitors" },
  { id: "customers", label: "Customer Discovery", description: "Scraping website for named customers + prospect targets" },
  { id: "icp-buyers", label: "ICP & Buyer Mapping", description: "Building vertical → segment → persona tree" },
  { id: "linkedin-profiles", label: "LinkedIn Profiles", description: "Finding real decision makers at customer companies" },
];

/* ── main component ── */
export default function CompanyExplorer({ initialWebsite }: { initialWebsite?: string }) {
  const [phase, setPhase] = useState<ExplorerPhase>("input");
  const [selectedCompany, setSelectedCompany] = useState<CompanyData | null>(null);

  // Analysis
  const [currentStepIdx, setCurrentStepIdx] = useState(-1);
  const [stepResults, setStepResults] = useState<Record<string, any>>({});
  const [treeData, setTreeData] = useState<GTMTreeData | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isGeneratingMore, setIsGeneratingMore] = useState(false);
  const [cancelRef] = useState({ cancelled: false });
  const autoStarted = useRef(false);
  const accumulatedRef = useRef<Record<string, any>>({});
  const [chatContext, setChatContext] = useState<{
    location?: string; verticalFocus?: string; competitorTarget?: string; customNotes?: string;
  }>({});

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
      setPhase("input");
      runICPPipeline(company);
    }
  }, [initialWebsite]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── run ICP pipeline (steps 1-3 only, then pause for strategy) ── */
  const runICPPipeline = useCallback(async (company: CompanyData) => {
    cancelRef.cancelled = false;
    setIsRunning(true);
    const accumulated: Record<string, any> = {};

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

    accumulatedRef.current = accumulated;

    // Assemble framework tree data (no leads)
    const products = accumulated["products"]?.structured;
    const customers = accumulated["customers"]?.structured;
    const icpBuyers = accumulated["icp-buyers"]?.structured;

    if (products) {
      setTreeData({
        company_summary: products.company_summary || "",
        products: products.products || [],
        customers: customers?.customers || [],
        conquest_targets: customers?.conquest_targets || [],
        mappings: icpBuyers?.mappings || [],
        leads: [], // No leads yet — framework only
      });
    }

    setIsRunning(false);
    setCurrentStepIdx(-1);
    setPhase("icp-mapping");
  }, [cancelRef]);

  /* ── run lead generation (step 4) with chat context ── */
  const runLeadGeneration = useCallback(async (context: {
    location?: string; verticalFocus?: string; competitorTarget?: string; customNotes?: string;
  }) => {
    if (!selectedCompany) return;
    setChatContext(context);
    setPhase("first-batch");
    setIsRunning(true);
    setCurrentStepIdx(3);

    const accumulated = accumulatedRef.current;

    try {
      const { data, error } = await supabase.functions.invoke("gtm-analyze", {
        body: {
          stepId: "linkedin-profiles",
          company: selectedCompany,
          previousResults: accumulated,
          location: context.location || undefined,
          chatContext: context,
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

    // Assemble full tree data with leads
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
    setPhase("explore");
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
          location: chatContext.location || undefined,
          chatContext,
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
  }, [selectedCompany, treeData, chatContext]);

  /* ── handlers ── */
  function handleReset() {
    cancelRef.cancelled = true;
    setPhase("input");
    setSelectedCompany(null);
    setStepResults({});
    setTreeData(null);
    setIsRunning(false);
    setCurrentStepIdx(-1);
    setChatContext({});
    accumulatedRef.current = {};
  }

  /* ── LOADING / ANALYSIS VIEW ── */
  const completedCount = Object.keys(stepResults).length;
  const totalSteps = phase === "first-batch" || phase === "explore" ? STEPS.length : 3;
  const progressPct = Math.round((Math.min(completedCount, totalSteps) / totalSteps) * 100);

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-6">
      {/* Header */}
      {selectedCompany && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={handleReset}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Start over
            </Button>
            <div>
              <h2 className="text-lg font-bold text-foreground">{selectedCompany.name}</h2>
              <p className="text-xs text-muted-foreground">{selectedCompany.industry} · {selectedCompany.website}</p>
            </div>
          </div>
          {isRunning && (
            <div className="text-right">
              <div className="text-xs text-muted-foreground mb-1">
                Step {currentStepIdx + 1}/{totalSteps}: {STEPS[currentStepIdx]?.label}
              </div>
              <Progress value={progressPct} className="h-1.5 w-32" />
            </div>
          )}
        </div>
      )}

      {/* Pipeline status */}
      {isRunning && (
        <div className="flex items-center gap-3 mb-4 p-3 rounded-lg border border-border bg-card">
          <Loader2 className="w-4 h-4 animate-spin text-primary shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">{STEPS[currentStepIdx]?.label}</p>
            <p className="text-xs text-muted-foreground">{STEPS[currentStepIdx]?.description}</p>
          </div>
          <div className="flex gap-1">
            {STEPS.slice(0, totalSteps).map((_, i) => (
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

      {/* Loading skeleton (during ICP pipeline) */}
      {isRunning && !treeData && (
        <div className="space-y-4 animate-pulse">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="h-4 w-2/3 bg-muted rounded mb-2" />
            <div className="flex gap-3 mt-3">
              <div className="h-5 w-20 bg-muted rounded-full" />
              <div className="h-5 w-24 bg-muted rounded-full" />
              <div className="h-5 w-16 bg-muted rounded-full" />
            </div>
          </div>
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
      )}

      {/* Phase 2: ICP Framework (no leads) */}
      {phase === "icp-mapping" && treeData && (
        <GTMTreeView
          companyName={selectedCompany?.name || ""}
          data={treeData}
          companyMeta={selectedCompany ? {
            industry: selectedCompany.industry,
            employee_range: selectedCompany.employee_range,
            funding_stage: selectedCompany.funding_stage,
            headquarters: selectedCompany.headquarters,
            website: selectedCompany.website,
          } : undefined}
          frameworkOnly={true}
          onContinueToStrategy={() => setPhase("strategy-chat")}
        />
      )}

      {/* Phase 3: Strategy Chat */}
      {phase === "strategy-chat" && treeData && selectedCompany && (
        <div className="space-y-4">
          <GTMTreeView
            companyName={selectedCompany.name}
            data={treeData}
            companyMeta={{
              industry: selectedCompany.industry,
              employee_range: selectedCompany.employee_range,
              funding_stage: selectedCompany.funding_stage,
              headquarters: selectedCompany.headquarters,
              website: selectedCompany.website,
            }}
            frameworkOnly={true}
          />
          <StrategyChatPanel
            companyName={selectedCompany.name}
            treeData={treeData}
            onStartLeadGen={runLeadGeneration}
            isGenerating={isRunning}
          />
        </div>
      )}

      {/* Phase 4: First batch generating */}
      {phase === "first-batch" && isRunning && treeData && (
        <div className="space-y-4">
          <GTMTreeView
            companyName={selectedCompany?.name || ""}
            data={treeData}
            companyMeta={selectedCompany ? {
              industry: selectedCompany.industry,
              employee_range: selectedCompany.employee_range,
              funding_stage: selectedCompany.funding_stage,
              headquarters: selectedCompany.headquarters,
              website: selectedCompany.website,
            } : undefined}
            frameworkOnly={true}
          />
          <div className="flex items-center gap-3 p-4 rounded-xl border border-primary/30 bg-primary/5">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <div>
              <p className="text-sm font-medium text-foreground">Generating your first 5 leads...</p>
              <p className="text-xs text-muted-foreground">Finding decision-makers matching your strategy</p>
            </div>
          </div>
        </div>
      )}

      {/* Phase 5: Explore (full tree with leads + strategy actions) */}
      {phase === "explore" && treeData && (
        <div className="space-y-4">
          <GTMTreeView
            companyName={selectedCompany?.name || ""}
            data={treeData}
            companyMeta={selectedCompany ? {
              industry: selectedCompany.industry,
              employee_range: selectedCompany.employee_range,
              funding_stage: selectedCompany.funding_stage,
              headquarters: selectedCompany.headquarters,
              website: selectedCompany.website,
            } : undefined}
            onGenerateMore={handleGenerateMore}
            isGeneratingMore={isGeneratingMore}
          />

          {/* Strategy actions */}
          <div className="flex flex-wrap gap-2 justify-center">
            <Button variant="outline" size="sm" onClick={() => setPhase("strategy-chat")} className="gap-1.5 text-xs">
              <Rocket className="w-3.5 h-3.5" /> Refine strategy
            </Button>
            <Button variant="outline" size="sm" onClick={handleReset} className="gap-1.5 text-xs">
              <RefreshCw className="w-3.5 h-3.5" /> New company
            </Button>
          </div>
        </div>
      )}

      {/* Empty state: no company selected */}
      {!selectedCompany && !isRunning && (
        <div className="text-center py-12 text-muted-foreground">
          <Building2 className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">Enter a website URL to start</p>
          <p className="text-sm mt-1">Use the search bar on the homepage to analyze any company</p>
        </div>
      )}
    </div>
  );
}

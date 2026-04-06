import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Building2, ArrowLeft, Loader2, RefreshCw,
} from "lucide-react";
import GTMTreeView from "./GTMTreeView";
import StrategyStrip from "./StrategyStrip";
import StrategyChat from "./StrategyChat";
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

type ExplorerPhase = "input" | "icp-mapping" | "explore";

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

  // Strategy state (lifted from StrategyChatPanel)
  const [activeCards, setActiveCards] = useState<Record<string, string | boolean>>({});
  const [cardInputs, setCardInputs] = useState<Record<string, string>>({});
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  /* ── normalize domain for cache key ── */
  function normalizeWebsiteKey(url: string): string {
    return url.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, "").toLowerCase();
  }

  // Auto-start analysis from URL param
  useEffect(() => {
    if (initialWebsite && !autoStarted.current) {
      autoStarted.current = true;
      const domain = initialWebsite.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, "");

      // Basic domain format validation
      const domainPattern = /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$/;
      if (!domainPattern.test(domain)) {
        toast.error("Invalid URL format. Please enter a valid website like company.com");
        return;
      }

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

  /* ── run ICP pipeline with cache ── */
  const runICPPipeline = useCallback(async (company: CompanyData) => {
    cancelRef.cancelled = false;
    setIsRunning(true);

    const websiteKey = normalizeWebsiteKey(company.website || company.id);

    // Check cache first
    try {
      const { data: cached } = await supabase
        .from("leadhunter_cache")
        .select("*")
        .eq("website_key", websiteKey)
        .gt("expires_at", new Date().toISOString())
        .maybeSingle();

      if (cached?.tree_data && cached?.step_results) {
        const cachedCompany = cached.company_data as any;
        if (cachedCompany?.name) {
          setSelectedCompany(prev => ({ ...prev!, ...cachedCompany }));
        }
        setStepResults(cached.step_results as Record<string, any>);
        accumulatedRef.current = cached.step_results as Record<string, any>;
        setTreeData(cached.tree_data as any);
        setIsRunning(false);
        setCurrentStepIdx(-1);
        setPhase("icp-mapping");
        toast.success("Loaded from cache — instant results!");
        return;
      }
    } catch (e) {
      console.warn("Cache lookup failed, running fresh:", e);
    }

    // No cache — run pipeline
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
        if (data?.error) {
          toast.error(data.error);
          setIsRunning(false);
          setCurrentStepIdx(-1);
          return;
        }
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

    const products = accumulated["products"]?.structured;
    const customers = accumulated["customers"]?.structured;
    const icpBuyers = accumulated["icp-buyers"]?.structured;

    let builtTree: GTMTreeData | null = null;
    if (products) {
      builtTree = {
        company_summary: products.company_summary || "",
        products: products.products || [],
        customers: customers?.customers || [],
        conquest_targets: customers?.conquest_targets || [],
        mappings: icpBuyers?.mappings || [],
        leads: [],
      };
      setTreeData(builtTree);
    }

    // Write to cache
    if (builtTree) {
      supabase.from("leadhunter_cache").upsert({
        website_key: websiteKey,
        company_data: company as any,
        step_results: accumulated as any,
        tree_data: builtTree as any,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      }, { onConflict: "website_key" }).then(() => {});
    }

    setIsRunning(false);
    setCurrentStepIdx(-1);
    setPhase("icp-mapping");
  }, [cancelRef]);

  /* ── build context from active cards ── */
  function buildContext() {
    const ctx: any = {};
    if (activeCards.location && typeof activeCards.location === "string") ctx.location = activeCards.location;
    if (activeCards.vertical && typeof activeCards.vertical === "string") ctx.verticalFocus = activeCards.vertical;
    if (activeCards.competitor && typeof activeCards.competitor === "string") ctx.competitorTarget = activeCards.competitor;
    const notes: string[] = [];
    if (activeCards.lookalike && typeof activeCards.lookalike === "string") notes.push(`Lookalike: ${activeCards.lookalike}`);
    if (activeCards.persona && typeof activeCards.persona === "string") notes.push(`Persona: ${activeCards.persona}`);
    if (activeCards.upload && typeof activeCards.upload === "string") notes.push(`Brochure: ${activeCards.upload}`);
    if (notes.length) ctx.customNotes = notes.join("; ");
    return ctx;
  }

  /* ── run lead generation (step 4) ── */
  const runLeadGeneration = useCallback(async () => {
    if (!selectedCompany) return;
    const context = buildContext();
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
  }, [selectedCompany, activeCards]);

  /* ── generate more leads ── */
  const handleGenerateMore = useCallback(async (productId: string, vertical: string | null) => {
    if (!selectedCompany || !treeData) return;
    setIsGeneratingMore(true);
    const context = buildContext();
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
          location: context.location || undefined,
          chatContext: context,
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
  }, [selectedCompany, treeData, activeCards]);

  /* ── strategy card handlers ── */
  function toggleCard(id: string) {
    setActiveCards(prev => {
      const next = { ...prev };
      if (next[id] !== undefined) {
        delete next[id];
      } else {
        next[id] = cardInputs[id] || true;
      }
      return next;
    });
  }

  function updateCardValue(id: string, value: string) {
    setCardInputs(prev => ({ ...prev, [id]: value }));
    setActiveCards(prev => {
      if (prev[id] !== undefined) {
        return { ...prev, [id]: value };
      }
      return prev;
    });
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const label = `📎 ${file.name}`;
    setCardInputs(prev => ({ ...prev, upload: label }));
    setActiveCards(prev => ({ ...prev, upload: label }));
  }

  /* ── product lead counts ── */
  const productLeadCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    if (!treeData) return counts;
    for (const l of treeData.leads) {
      if (l.role !== "dm") continue;
      counts[l.product_id] = (counts[l.product_id] || 0) + 1;
    }
    return counts;
  }, [treeData]);

  /* ── handlers ── */
  function handleReset() {
    cancelRef.cancelled = true;
    setPhase("input");
    setSelectedCompany(null);
    setStepResults({});
    setTreeData(null);
    setIsRunning(false);
    setCurrentStepIdx(-1);
    setActiveCards({});
    setCardInputs({});
    setSelectedProductId(null);
    accumulatedRef.current = {};
  }

  /* ── RENDER ── */
  const completedCount = Object.keys(stepResults).length;
  const totalSteps = phase === "explore" ? STEPS.length : 3;
  const progressPct = Math.round((Math.min(completedCount, totalSteps) / totalSteps) * 100);

  const companyMeta = selectedCompany ? {
    industry: selectedCompany.industry,
    employee_range: selectedCompany.employee_range,
    funding_stage: selectedCompany.funding_stage,
    headquarters: selectedCompany.headquarters,
    website: selectedCompany.website,
  } : undefined;

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-6">
      {/* Header */}
      {selectedCompany && isRunning && (
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-[10px] text-muted-foreground">
              {STEPS[currentStepIdx]?.label}
            </span>
            <Progress value={progressPct} className="h-1 w-24" />
          </div>
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

      {/* Loading skeleton */}
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

      {/* Phase 2: ICP Framework */}
      {phase === "icp-mapping" && treeData && (
        <GTMTreeView
          companyName={selectedCompany?.name || ""}
          data={treeData}
          companyMeta={companyMeta}
          frameworkOnly={true}
          onContinueToStrategy={() => setPhase("explore")}
        />
      )}

      {/* Phase: Explore (merged strategy + leads) */}
      {phase === "explore" && treeData && selectedCompany && (
        <GTMTreeView
          companyName={selectedCompany.name}
          data={treeData}
          companyMeta={companyMeta}
          onGenerateMore={handleGenerateMore}
          isGeneratingMore={isGeneratingMore}
          selectedProductId={selectedProductId}
          onSelectProduct={setSelectedProductId}
          strategyStrip={
            <StrategyStrip
              treeData={treeData}
              activeCards={activeCards}
              cardInputs={cardInputs}
              onToggleCard={toggleCard}
              onUpdateCardValue={updateCardValue}
              onFileUpload={handleFileUpload}
              onGenerate={runLeadGeneration}
              isGenerating={isRunning}
              selectedProductId={selectedProductId}
              products={treeData.products}
              onSelectProduct={setSelectedProductId}
              productLeadCounts={productLeadCounts}
            />
          }
          chatPanel={
            <StrategyChat
              companyName={selectedCompany.name}
              activeCards={activeCards}
              treeData={treeData}
            />
          }
        />
      )}

      {/* Generating first batch overlay */}
      {phase === "explore" && isRunning && treeData && treeData.leads.length === 0 && (
        <div className="flex items-center gap-3 mt-4 p-4 rounded-xl border border-primary/30 bg-primary/5">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <div>
            <p className="text-sm font-medium text-foreground">Generating your first 5 leads...</p>
            <p className="text-xs text-muted-foreground">Finding decision-makers matching your strategy</p>
          </div>
        </div>
      )}

      {/* Empty state */}
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

import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Building2, Package, Users, Linkedin, Target, Swords,
  UserCheck, Globe, Mail, Search, ChevronLeft, ChevronRight,
  Info, Plus, Loader2, ChevronDown, Star, Briefcase, Landmark,
  Heart, Cpu, ShoppingCart, GraduationCap, Home, Shield, Zap,
} from "lucide-react";
import type { GTMTreeData, GTMProduct, GTMLead, GTMBuyerMapping } from "./gtm-types";

interface CompanyMeta {
  industry?: string | null;
  employee_range?: string | null;
  funding_stage?: string | null;
  headquarters?: string | null;
  website?: string | null;
}

interface GTMTreeViewProps {
  companyName: string;
  data: GTMTreeData;
  companyMeta?: CompanyMeta;
  onGenerateMore?: (productId: string, vertical: string | null) => void;
  isGeneratingMore?: boolean;
  /** Phase 2: show products + verticals + customers only, no leads column */
  frameworkOnly?: boolean;
  /** Phase 2: CTA to proceed to strategy chat */
  onContinueToStrategy?: () => void;
}

const LEADS_PER_PAGE = 25;

/* ── Vertical icon picker ── */
const VERTICAL_ICONS: Record<string, React.ElementType> = {
  financial: Landmark, banking: Landmark, mortgage: Landmark, insurance: Shield,
  real: Home, estate: Home, title: Home, escrow: Home,
  legal: Briefcase, law: Briefcase, corporate: Briefcase,
  health: Heart, medical: Heart, pharma: Heart,
  tech: Cpu, saas: Cpu, software: Cpu, ai: Cpu, developer: Cpu,
  commerce: ShoppingCart, retail: ShoppingCart, ecommerce: ShoppingCart,
  education: GraduationCap, school: GraduationCap,
  security: Shield,
  small: Building2, business: Building2, professional: Building2,
};

function getVerticalIcon(vertical: string): React.ElementType {
  const lower = vertical.toLowerCase();
  for (const [key, Icon] of Object.entries(VERTICAL_ICONS)) {
    if (lower.includes(key)) return Icon;
  }
  return Target;
}

function getVerticalShortLabel(vertical: string): string {
  const parts = vertical.split(/[\/\(\),]+/).map(s => s.trim()).filter(Boolean);
  if (parts[0] && parts[0].length <= 14) return parts[0];
  return parts[0]?.slice(0, 12) + "…" || vertical.slice(0, 12);
}

/* ── Derived types ── */
interface DerivedVertical {
  vertical: string;
  segment: string;
  dm: string;
  champion: string;
  customers: string[];
  productId: string;
  dmDetails?: { title: string; seniority: string; why_they_buy: string; outreach_channel: string };
  championDetails?: { title: string; seniority: string; why_they_care: string; outreach_channel: string };
}

interface DerivedCompany {
  name: string;
  domain?: string;
  industry?: string;
  type: "customer" | "conquest";
  uses_competitor?: string;
  evidence?: string;
  product_ids: string[];
  switch_angle?: string;
}

type DetailItem =
  | { type: "product"; data: GTMProduct; leadCount: number }
  | { type: "vertical"; data: DerivedVertical }
  | { type: "company"; data: DerivedCompany; leadCount: number }
  | { type: "lead"; data: GTMLead };

/* ── Selectable card ── */
function SelectableCard({
  active, onClick, onInfoClick, children, className = "",
}: {
  active?: boolean;
  onClick?: () => void;
  onInfoClick?: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="relative group">
      <button
        onClick={onClick}
        className={`
          text-left w-full p-2.5 rounded-lg border transition-all
          ${active ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20" : "border-border bg-card hover:border-primary/30 hover:bg-accent/30"}
          ${className}
        `}
      >
        {children}
      </button>
      {onInfoClick && (
        <button
          onClick={(e) => { e.stopPropagation(); onInfoClick(); }}
          className="absolute top-1.5 right-1.5 p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-accent"
          title="View details"
        >
          <Info className="w-3 h-3 text-muted-foreground" />
        </button>
      )}
    </div>
  );
}

/* ── Lead Detail (enriched with recommendation + score) ── */
function LeadDetail({ lead }: { lead: GTMLead }) {
  const score = (lead as any).lead_score as number | undefined;
  const reason = (lead as any).recommendation_reason as string | undefined;

  return (
    <div className="space-y-4">
      {score != null && (
        <div className="flex items-center justify-center gap-2 p-3 rounded-lg border border-primary/20 bg-primary/5">
          <Star className="w-5 h-5 text-primary fill-primary" />
          <div>
            <span className="text-2xl font-bold text-foreground">{score}</span>
            <span className="text-sm text-muted-foreground">/100</span>
          </div>
          <span className="text-xs text-muted-foreground ml-1">Lead Score</span>
        </div>
      )}

      {reason && (
        <div className="p-3 rounded-lg border border-accent bg-accent/30">
          <p className="text-xs font-semibold text-muted-foreground mb-1">Why this prospect?</p>
          <p className="text-sm text-foreground leading-relaxed">{reason}</p>
        </div>
      )}

      <div className="flex flex-col items-center text-center gap-2">
        {lead.photo_url ? (
          <img src={lead.photo_url} alt="" className="w-14 h-14 rounded-full" />
        ) : (
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
            <Users className="w-6 h-6 text-muted-foreground" />
          </div>
        )}
        <div>
          <div className="text-base font-semibold text-foreground">{lead.name}</div>
          <div className="text-sm text-muted-foreground">{lead.title}</div>
          <div className="text-sm text-muted-foreground">@ {lead.company}</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 justify-center">
        <Badge className="text-xs bg-blue-500/15 text-blue-700 border-blue-500/30" variant="outline">
          Decision Maker
        </Badge>
        <Badge className={`text-xs ${lead.type === "conquest" ? "bg-orange-500/15 text-orange-700 border-orange-500/30" : "bg-primary/15 text-primary border-primary/30"}`} variant="outline">
          {lead.type === "conquest" ? "Prospect" : "Named Customer"}
        </Badge>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-start gap-2">
          <Package className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
          <div><span className="text-muted-foreground">Product:</span> <span className="text-foreground font-medium">{lead.product_name}</span></div>
        </div>
        {lead.vertical && (
          <div className="flex items-start gap-2">
            <Target className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
            <div><span className="text-muted-foreground">Vertical:</span> <span className="text-foreground">{lead.vertical}</span></div>
          </div>
        )}
        {lead.competitor_using && lead.competitor_using !== "null" && (
          <div className="flex items-start gap-2">
            <Swords className="w-3.5 h-3.5 text-orange-500 shrink-0 mt-0.5" />
            <div><span className="text-muted-foreground">Uses:</span> <span className="text-orange-600">{lead.competitor_using}</span></div>
          </div>
        )}
      </div>

      <div className="space-y-2">
        {lead.linkedin_url && (
          <a href={lead.linkedin_url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 w-full px-3 py-2.5 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors justify-center"
          >
            <Linkedin className="w-4 h-4" /> View LinkedIn
          </a>
        )}
        {lead.email && (
          <a href={`mailto:${lead.email}`}
            className="flex items-center gap-2 w-full px-3 py-2.5 rounded-md border border-border text-sm font-medium hover:bg-accent transition-colors justify-center text-foreground"
          >
            <Mail className="w-4 h-4" /> {lead.email}
          </a>
        )}
      </div>
    </div>
  );
}

/* ── Product Detail ── */
function ProductDetail({ product, leadCount }: { product: GTMProduct; leadCount: number }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Package className="w-5 h-5 text-primary shrink-0" />
        <div>
          <div className="text-base font-semibold text-foreground">{product.name}</div>
          <div className="text-sm text-muted-foreground">{leadCount} leads</div>
        </div>
      </div>
      <div className="space-y-2">
        <div><span className="text-xs font-medium text-muted-foreground">Description</span><p className="text-sm text-foreground mt-0.5">{product.description}</p></div>
        <div><span className="text-xs font-medium text-muted-foreground">Target User</span><p className="text-sm text-foreground mt-0.5">{product.target_user}</p></div>
        <div><span className="text-xs font-medium text-muted-foreground">Pricing Model</span><p className="text-sm text-foreground mt-0.5">{product.pricing_model}</p></div>
      </div>
      {product.competitors.length > 0 && (
        <div>
          <span className="text-xs font-medium text-muted-foreground">Competitors</span>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {product.competitors.map(c => (
              <Badge key={c} variant="outline" className="text-xs bg-orange-500/10 text-orange-600 border-orange-500/30">{c}</Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Main component ── */
export default function GTMTreeView({ companyName, data, companyMeta, onGenerateMore, isGeneratingMore, frameworkOnly, onContinueToStrategy }: GTMTreeViewProps) {
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedVerticalIdx, setSelectedVerticalIdx] = useState<number | null>(null);
  const [detailItem, setDetailItem] = useState<DetailItem | null>(null);
  const [customersOpen, setCustomersOpen] = useState(false);

  // Filters
  const [productFilter, setProductFilter] = useState("");
  const [leadFilter, setLeadFilter] = useState("");
  const [leadPage, setLeadPage] = useState(1);

  // ── Derived data ──
  const verticalsByProduct = useMemo(() => {
    const map: Record<string, DerivedVertical[]> = {};
    for (const m of data.mappings) {
      if (!map[m.product_id]) map[m.product_id] = [];
      map[m.product_id].push({
        vertical: m.vertical, segment: m.segment,
        dm: m.dm.title, champion: m.champion.title,
        customers: m.known_customers || [], productId: m.product_id,
        dmDetails: m.dm, championDetails: m.champion,
      });
    }
    return map;
  }, [data.mappings]);

  const leadsByProduct = useMemo(() => {
    const map: Record<string, GTMLead[]> = {};
    for (const l of data.leads) {
      if (l.role !== "dm") continue;
      if (!map[l.product_id]) map[l.product_id] = [];
      map[l.product_id].push(l);
    }
    return map;
  }, [data.leads]);

  const filteredProducts = useMemo(() =>
    data.products.filter(p => p.name.toLowerCase().includes(productFilter.toLowerCase())),
    [data.products, productFilter]);

  const activeVerticals = useMemo(() =>
    selectedProductId ? (verticalsByProduct[selectedProductId] || []) : [],
    [selectedProductId, verticalsByProduct]);

  const activeLeads = useMemo(() => {
    if (!selectedProductId) return [];
    let leads = leadsByProduct[selectedProductId] || [];
    if (selectedVerticalIdx !== null && activeVerticals[selectedVerticalIdx]) {
      const v = activeVerticals[selectedVerticalIdx];
      leads = leads.filter(l => l.vertical === v.vertical);
    }
    if (leadFilter) {
      const q = leadFilter.toLowerCase();
      leads = leads.filter(l =>
        l.name.toLowerCase().includes(q) ||
        l.title.toLowerCase().includes(q) ||
        l.company?.toLowerCase().includes(q)
      );
    }
    return leads;
  }, [selectedProductId, selectedVerticalIdx, activeVerticals, leadsByProduct, leadFilter]);

  const totalLeadsForProduct = useMemo(() =>
    selectedProductId ? (leadsByProduct[selectedProductId] || []).length : 0,
    [selectedProductId, leadsByProduct]);

  const namedCustomers = useMemo(() =>
    data.customers.filter(c => c.evidence || c.domain),
    [data.customers]);

  const totalLeadPages = Math.max(1, Math.ceil(activeLeads.length / LEADS_PER_PAGE));
  const safePage = Math.min(leadPage, totalLeadPages);
  const paginatedLeads = activeLeads.slice((safePage - 1) * LEADS_PER_PAGE, safePage * LEADS_PER_PAGE);

  function selectProduct(id: string) {
    setSelectedProductId(prev => prev === id ? null : id);
    setSelectedVerticalIdx(null);
    setLeadPage(1);
  }

  function getProductLeadCount(productId: string) {
    return (leadsByProduct[productId] || []).length;
  }

  function getSheetTitle() {
    if (!detailItem) return "";
    switch (detailItem.type) {
      case "product": return detailItem.data.name;
      case "vertical": return detailItem.data.vertical;
      case "company": return detailItem.data.name;
      case "lead": return detailItem.data.name;
    }
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-1.5">
        {/* ── Compact Header Row ── */}
        <div className="flex items-center gap-2 px-1">
          <Building2 className="w-4 h-4 text-primary shrink-0" />
          <span className="text-sm font-semibold text-foreground">{companyName}</span>
          {companyMeta?.website && (
            <a href={`https://${companyMeta.website}`} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline flex items-center gap-0.5 shrink-0">
              <Globe className="w-3 h-3" /> {companyMeta.website}
            </a>
          )}
          <div className="flex items-center gap-1 ml-auto shrink-0">
            {companyMeta?.industry && <Badge variant="secondary" className="text-[9px] h-4">{companyMeta.industry}</Badge>}
            {companyMeta?.employee_range && <Badge variant="outline" className="text-[9px] h-4">{companyMeta.employee_range}</Badge>}
            {companyMeta?.headquarters && <Badge variant="outline" className="text-[9px] h-4">{companyMeta.headquarters}</Badge>}
          </div>
        </div>

        {data.company_summary && (
          <p className="text-[10px] text-muted-foreground px-1">{data.company_summary}</p>
        )}

        {/* ── Named Customers (expandable FYI) ── */}
        {namedCustomers.length > 0 && (
          <Collapsible open={customersOpen} onOpenChange={setCustomersOpen}>
            <CollapsibleTrigger className="flex items-center gap-1.5 px-1 py-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors w-full text-left">
              <ChevronDown className={`w-3 h-3 transition-transform ${customersOpen ? "" : "-rotate-90"}`} />
              <Building2 className="w-3 h-3 text-primary" />
              <span>{namedCustomers.length} Named Customers found on website</span>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="flex flex-wrap gap-1.5 px-1 pb-1.5">
                {namedCustomers.map((c) => (
                  <Tooltip key={c.name}>
                    <TooltipTrigger asChild>
                      <Badge variant="outline" className="text-[9px] cursor-default">
                        <Building2 className="w-2.5 h-2.5 mr-0.5 text-primary" />
                        {c.name}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-[200px]">
                      <p className="text-xs">{c.evidence || c.industry || c.domain}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* ── Framework-only mode: Products + Verticals only ── */}
        {frameworkOnly ? (
          <div className="space-y-3">
            <div className="flex gap-1 h-[400px]">
              {/* Products column */}
              <div className="flex flex-col w-[220px] shrink-0 border border-border rounded-lg overflow-hidden bg-card">
                <div className="flex items-center justify-between p-2 border-b border-border/50">
                  <span className="text-xs font-semibold text-foreground">Products</span>
                  <Badge variant="secondary" className="text-[9px] h-4 px-1.5">{filteredProducts.length}</Badge>
                </div>
                <ScrollArea className="flex-1">
                  <div className="p-1.5 space-y-1">
                    {filteredProducts.map(product => (
                      <SelectableCard key={product.id} active={selectedProductId === product.id}
                        onClick={() => selectProduct(product.id)}
                        onInfoClick={() => setDetailItem({ type: "product", data: product, leadCount: 0 })}
                      >
                        <div className="flex items-center gap-1.5">
                          <Package className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span className="text-[11px] font-medium text-foreground truncate flex-1">{product.name}</span>
                        </div>
                        {product.competitors.length > 0 && (
                          <div className="flex flex-wrap gap-0.5 mt-1">
                            {product.competitors.slice(0, 2).map(c => (
                              <Badge key={c} variant="secondary" className="text-[8px] h-3 px-1 bg-orange-500/10 text-orange-600 border-0">{c}</Badge>
                            ))}
                          </div>
                        )}
                      </SelectableCard>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* Verticals column */}
              <div className="flex flex-col flex-1 border border-border rounded-lg overflow-hidden bg-card">
                <div className="flex items-center justify-between p-2 border-b border-border/50">
                  <span className="text-xs font-semibold text-foreground">Verticals & Buyer Roles</span>
                </div>
                <ScrollArea className="flex-1">
                  <div className="p-1.5 space-y-1">
                    {!selectedProductId ? (
                      <p className="text-[10px] text-muted-foreground p-2 text-center">Select a product to view target verticals</p>
                    ) : activeVerticals.length === 0 ? (
                      <p className="text-[10px] text-muted-foreground p-2 text-center">No verticals mapped</p>
                    ) : activeVerticals.map((v, i) => {
                      const Icon = getVerticalIcon(v.vertical);
                      return (
                        <div key={`${v.vertical}-${i}`} className="p-2.5 rounded-lg border border-border bg-card">
                          <div className="flex items-center gap-2 mb-1.5">
                            <Icon className="w-4 h-4 text-primary shrink-0" />
                            <span className="text-[11px] font-medium text-foreground">{v.vertical}</span>
                          </div>
                          <p className="text-[10px] text-muted-foreground mb-1.5">{v.segment}</p>
                          <div className="flex flex-wrap gap-1">
                            <Badge variant="secondary" className="text-[8px] h-3.5 px-1 gap-0.5 bg-blue-500/15 text-blue-700 border-0">
                              <UserCheck className="w-2.5 h-2.5" /> DM: {v.dm}
                            </Badge>
                          </div>
                          {v.customers.length > 0 && (
                            <div className="flex flex-wrap gap-0.5 mt-1.5">
                              {v.customers.slice(0, 3).map(c => (
                                <Badge key={c} variant="outline" className="text-[8px] h-3 px-1">{c}</Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
            </div>

            {/* CTA to proceed */}
            {onContinueToStrategy && (
              <div className="flex justify-center">
                <Button onClick={onContinueToStrategy} size="lg" className="gap-2">
                  <Target className="w-4 h-4" />
                  Define your lead strategy →
                </Button>
              </div>
            )}
          </div>
        ) : (
          /* ── Full mode: Products + Leads ── */
          <div className="flex gap-1 h-[520px]">
            {/* Col 1: Products */}
            <div className="flex flex-col w-[220px] shrink-0 border border-border rounded-lg overflow-hidden bg-card">
              <div className="flex items-center justify-between p-2 border-b border-border/50">
                <span className="text-xs font-semibold text-foreground">Products</span>
                <Badge variant="secondary" className="text-[9px] h-4 px-1.5">{filteredProducts.length}</Badge>
              </div>
              <div className="px-1.5 pt-1.5">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                  <Input placeholder="Filter..." value={productFilter} onChange={e => setProductFilter(e.target.value)}
                    className="h-7 text-xs pl-7 bg-background" />
                </div>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-1.5 space-y-1">
                  {filteredProducts.map(product => (
                    <SelectableCard key={product.id} active={selectedProductId === product.id}
                      onClick={() => selectProduct(product.id)}
                      onInfoClick={() => setDetailItem({ type: "product", data: product, leadCount: getProductLeadCount(product.id) })}
                    >
                      <div className="flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="text-[11px] font-medium text-foreground truncate flex-1">{product.name}</span>
                        <Badge variant="secondary" className="text-[9px] h-3.5 px-1 shrink-0">{getProductLeadCount(product.id)}</Badge>
                      </div>
                      {product.competitors.length > 0 && (
                        <div className="flex flex-wrap gap-0.5 mt-1">
                          {product.competitors.slice(0, 2).map(c => (
                            <Badge key={c} variant="secondary" className="text-[8px] h-3 px-1 bg-orange-500/10 text-orange-600 border-0">{c}</Badge>
                          ))}
                        </div>
                      )}
                    </SelectableCard>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Col 2: Leads */}
            <div className="flex flex-col flex-1 border border-border rounded-lg overflow-hidden bg-card">
              <div className="flex flex-col gap-1 p-2 border-b border-border/50 shrink-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">Prospects</span>
                  <div className="flex items-center gap-1.5">
                    {onGenerateMore && selectedProductId && (
                      <Button variant="outline" size="sm" className="h-5 text-[9px] px-1.5 gap-0.5"
                        disabled={isGeneratingMore}
                        onClick={() => onGenerateMore(selectedProductId,
                          selectedVerticalIdx !== null && activeVerticals[selectedVerticalIdx]
                            ? activeVerticals[selectedVerticalIdx].vertical : null
                        )}
                      >
                        {isGeneratingMore ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Plus className="w-2.5 h-2.5" />}
                        +5
                      </Button>
                    )}
                    <Badge variant="secondary" className="text-[9px] h-4 px-1.5">
                      {activeLeads.length}/{totalLeadsForProduct}
                    </Badge>
                  </div>
                </div>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                  <Input placeholder="Search name, title, company..."
                    value={leadFilter} onChange={e => { setLeadFilter(e.target.value); setLeadPage(1); }}
                    className="h-7 text-xs pl-7 bg-background" disabled={!selectedProductId} />
                </div>
                {selectedProductId && activeVerticals.length > 0 && (
                  <div className="flex gap-1 flex-wrap">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => { setSelectedVerticalIdx(null); setLeadPage(1); }}
                          className={`flex items-center gap-1 text-[9px] px-2 py-1 rounded-md border transition-colors ${
                            selectedVerticalIdx === null
                              ? "border-primary bg-primary/10 text-primary font-medium"
                              : "border-border bg-card text-muted-foreground hover:border-primary/30"
                          }`}
                        >
                          <Zap className="w-3 h-3" />
                          All
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom"><p className="text-xs">All verticals</p></TooltipContent>
                    </Tooltip>
                    {activeVerticals.map((v, i) => {
                      const Icon = getVerticalIcon(v.vertical);
                      return (
                        <Tooltip key={`${v.vertical}-${i}`}>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => { setSelectedVerticalIdx(prev => prev === i ? null : i); setLeadPage(1); }}
                              className={`flex items-center gap-1 text-[9px] px-2 py-1 rounded-md border transition-colors ${
                                selectedVerticalIdx === i
                                  ? "border-primary bg-primary/10 text-primary font-medium"
                                  : "border-border bg-card text-muted-foreground hover:border-primary/30"
                              }`}
                            >
                              <Icon className="w-3 h-3" />
                              {getVerticalShortLabel(v.vertical)}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="max-w-[220px]">
                            <p className="text-xs font-medium">{v.vertical}</p>
                            <p className="text-[10px] text-muted-foreground">{v.segment}</p>
                            <p className="text-[10px] text-muted-foreground">DM: {v.dm}</p>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                )}
              </div>

              <ScrollArea className="flex-1">
                <div className="p-1.5 space-y-1">
                  {!selectedProductId ? (
                    <p className="text-[10px] text-muted-foreground p-2 text-center">Select a product to view prospects</p>
                  ) : paginatedLeads.length === 0 ? (
                    <p className="text-[10px] text-muted-foreground p-2 text-center">No prospects found</p>
                  ) : paginatedLeads.map((lead, i) => {
                    const score = (lead as any).lead_score as number | undefined;
                    return (
                      <SelectableCard
                        key={lead.linkedin_url + i}
                        onClick={() => setDetailItem({ type: "lead", data: lead })}
                        onInfoClick={() => setDetailItem({ type: "lead", data: lead })}
                      >
                        <div className="flex items-start gap-2">
                          {lead.photo_url ? (
                            <img src={lead.photo_url} alt="" className="w-6 h-6 rounded-full shrink-0 mt-0.5" />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                              <Users className="w-3 h-3 text-muted-foreground" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] font-medium text-foreground truncate">{lead.name}</span>
                              {score != null && (
                                <Badge variant="secondary" className="text-[8px] h-3.5 px-1 shrink-0 gap-0.5">
                                  <Star className="w-2 h-2 fill-current" />{score}
                                </Badge>
                              )}
                            </div>
                            <div className="text-[10px] text-muted-foreground truncate">{lead.title} · {lead.company}</div>
                            <div className="flex flex-wrap gap-0.5 mt-0.5">
                              <Badge variant="secondary" className="text-[8px] h-3 px-1 border-0 bg-blue-500/15 text-blue-700">DM</Badge>
                              {lead.type === "conquest" && lead.competitor_using && lead.competitor_using !== "null" && (
                                <Badge variant="secondary" className="text-[8px] h-3 px-1 border-0 bg-orange-500/10 text-orange-600">
                                  <Swords className="w-2 h-2 mr-0.5" />{lead.competitor_using}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </SelectableCard>
                    );
                  })}
                </div>
              </ScrollArea>

              {totalLeadPages > 1 && (
                <div className="flex items-center justify-between px-2 py-1.5 border-t border-border/50 shrink-0">
                  <button onClick={() => setLeadPage(p => Math.max(1, p - 1))} disabled={safePage <= 1}
                    className="text-[10px] text-muted-foreground hover:text-foreground disabled:opacity-30 flex items-center gap-0.5">
                    <ChevronLeft className="w-3 h-3" /> Prev
                  </button>
                  <span className="text-[10px] text-muted-foreground">{safePage}/{totalLeadPages}</span>
                  <button onClick={() => setLeadPage(p => Math.min(totalLeadPages, p + 1))} disabled={safePage >= totalLeadPages}
                    className="text-[10px] text-muted-foreground hover:text-foreground disabled:opacity-30 flex items-center gap-0.5">
                    Next <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Detail Sheet */}
        <Sheet open={!!detailItem} onOpenChange={(open) => { if (!open) setDetailItem(null); }}>
          <SheetContent className="w-[400px] sm:max-w-[400px]">
            <SheetHeader>
              <SheetTitle>{getSheetTitle()}</SheetTitle>
              <SheetDescription>
                {detailItem?.type === "product" && "Product details"}
                {detailItem?.type === "lead" && "Prospect profile & recommendation"}
              </SheetDescription>
            </SheetHeader>
            <div className="mt-4">
              {detailItem?.type === "product" && <ProductDetail product={detailItem.data} leadCount={detailItem.leadCount} />}
              {detailItem?.type === "lead" && <LeadDetail lead={detailItem.data} />}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </TooltipProvider>
  );
}

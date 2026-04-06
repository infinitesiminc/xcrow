import { useState, useMemo, useEffect } from "react";
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
  frameworkOnly?: boolean;
  onContinueToStrategy?: () => void;
  /** Slot for the top strategy strip */
  strategyStrip?: React.ReactNode;
  /** Slot for the left chat panel */
  chatPanel?: React.ReactNode;
  /** Controlled product selection */
  selectedProductId?: string | null;
  onSelectProduct?: (id: string) => void;
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

type DetailItem =
  | { type: "product"; data: GTMProduct; leadCount: number }
  | { type: "vertical"; data: DerivedVertical }
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

/* ── Lead Detail ── */
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
        <Badge className="text-xs bg-blue-500/15 text-blue-700 border-blue-500/30" variant="outline">Decision Maker</Badge>
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
export default function GTMTreeView({
  companyName, data, companyMeta, onGenerateMore, isGeneratingMore,
  frameworkOnly, onContinueToStrategy, strategyStrip, chatPanel,
  selectedProductId: controlledProductId, onSelectProduct,
}: GTMTreeViewProps) {
  const [internalProductId, setInternalProductId] = useState<string | null>(null);
  const selectedProductId = controlledProductId !== undefined ? controlledProductId : internalProductId;
  const setSelectedProductId = onSelectProduct || setInternalProductId;

  const [selectedVerticalIdx, setSelectedVerticalIdx] = useState<number | null>(null);
  const [detailItem, setDetailItem] = useState<DetailItem | null>(null);

  // Auto-select first product
  useEffect(() => {
    if (!selectedProductId && data.products.length > 0) {
      setSelectedProductId(data.products[0].id);
    }
  }, [data.products, selectedProductId]);

  const [leadFilter, setLeadFilter] = useState("");
  const [leadPage, setLeadPage] = useState(1);

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
    setSelectedProductId(id);
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
      case "lead": return detailItem.data.name;
    }
  }

  const hasLeads = data.leads.length > 0;
  const showFullMode = !frameworkOnly;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-1">
        {/* ── Executive Overview ── */}
        <div className="px-3 py-3 border-b border-border/50 bg-card/50 rounded-t-lg">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-foreground tracking-tight leading-tight">{companyName}</h2>
              {data.company_summary && (
                <p className="text-sm text-muted-foreground mt-0.5 leading-snug">{data.company_summary}</p>
              )}
            </div>
            {namedCustomers.length > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="text-xs h-6 px-2 cursor-default gap-1 shrink-0">
                    <Building2 className="w-3 h-3 text-primary" />
                    {namedCustomers.length} customers
                  </Badge>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[300px]">
                  <p className="text-xs font-medium mb-1">Named Customers</p>
                  <p className="text-xs text-muted-foreground">{namedCustomers.map(c => c.name).join(", ")}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {companyMeta?.website && (() => {
              const raw = companyMeta.website;
              const href = raw.startsWith("http") ? raw : `https://${raw}`;
              const display = raw.replace(/^https?:\/\//, "").replace(/\/$/, "");
              return (
                <a href={href} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                  <Globe className="w-3 h-3" /> {display}
                </a>
              );
            })()}
            {companyMeta?.industry && <Badge variant="secondary" className="text-xs">{companyMeta.industry}</Badge>}
            {companyMeta?.employee_range && <Badge variant="outline" className="text-xs">{companyMeta.employee_range}</Badge>}
            {companyMeta?.headquarters && <Badge variant="outline" className="text-xs">{companyMeta.headquarters}</Badge>}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════ */}
        {/* ── Framework-only mode: Products + Verticals only ── */}
        {/* ══════════════════════════════════════════════════════ */}
        {frameworkOnly && (
          <div className="space-y-3">
            <div className="flex gap-1 h-[320px] lg:h-[480px]">
              {/* Products column */}
              <div className="flex flex-col w-[220px] shrink-0 border border-border rounded-lg overflow-hidden bg-card">
                <div className="flex items-center justify-between p-2 border-b border-border/50">
                  <span className="text-xs font-semibold text-foreground">Products</span>
                  <Badge variant="secondary" className="text-[9px] h-4 px-1.5">{data.products.length}</Badge>
                </div>
                <ScrollArea className="flex-1">
                  <div className="p-1.5 space-y-1">
                    {data.products.map(product => (
                      <SelectableCard key={product.id} active={selectedProductId === product.id}
                        onClick={() => selectProduct(product.id)}
                        onInfoClick={() => setDetailItem({ type: "product", data: product, leadCount: 0 })}
                      >
                        <div className="flex items-center gap-1.5">
                          <Package className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span className="text-[11px] font-medium text-foreground flex-1">{product.name}</span>
                        </div>
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
                <div className="p-1.5">
                  {!selectedProductId ? (
                    <p className="text-[10px] text-muted-foreground p-2 text-center">Select a product to view target verticals</p>
                  ) : activeVerticals.length === 0 ? (
                    <p className="text-[10px] text-muted-foreground p-2 text-center">No verticals mapped</p>
                  ) : (
                    <div className="flex gap-1.5 overflow-x-auto pb-1">
                      {activeVerticals.map((v, i) => {
                        const Icon = getVerticalIcon(v.vertical);
                        return (
                          <div key={`${v.vertical}-${i}`} className="p-2 rounded-lg border border-border bg-card min-w-[160px] max-w-[200px] shrink-0">
                            <div className="flex items-center gap-1.5 mb-1">
                              <Icon className="w-3.5 h-3.5 text-primary shrink-0" />
                              <span className="text-[10px] font-medium text-foreground truncate">{v.vertical}</span>
                            </div>
                            <p className="text-[9px] text-muted-foreground mb-1 line-clamp-1">{v.segment}</p>
                            <Badge variant="secondary" className="text-[8px] h-3.5 px-1 gap-0.5 bg-blue-500/15 text-blue-700 border-0">
                              <UserCheck className="w-2.5 h-2.5" /> DM: {v.dm}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {onContinueToStrategy && (
              <div className="flex justify-center">
                <Button onClick={onContinueToStrategy} size="lg" className="gap-2">
                  <Target className="w-4 h-4" />
                  Define your lead strategy →
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════ */}
        {/* ── Full mode: Top Strip + Chat/Leads Split          ── */}
        {/* ══════════════════════════════════════════════════════ */}
        {showFullMode && (
          <div className="rounded-lg border border-border overflow-hidden bg-card">
            {/* Top horizontal strip */}
            {strategyStrip}

            {/* Bottom split: Chat | Leads */}
            <div className="flex h-[520px]">
              {/* Left: Chat panel */}
              {chatPanel && (
                <div className="w-[280px] lg:w-[320px] shrink-0">
                  {chatPanel}
                </div>
              )}

              {/* Right: Lead list */}
              <div className="flex flex-col flex-1 overflow-hidden">
                <div className="flex flex-col gap-1 p-2 border-b border-border/50 shrink-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">Prospects</span>
                    <div className="flex items-center gap-1.5">
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
                            <Zap className="w-3 h-3" /> All
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
                                <Icon className="w-3 h-3" /> {getVerticalShortLabel(v.vertical)}
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
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Target className="w-8 h-8 text-muted-foreground/30 mb-3" />
                        <p className="text-sm font-medium text-muted-foreground">Select a product above</p>
                        <p className="text-xs text-muted-foreground/70 mt-1">Then configure your strategy and generate leads</p>
                      </div>
                    ) : !hasLeads ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Users className="w-8 h-8 text-muted-foreground/30 mb-3" />
                        <p className="text-sm font-medium text-muted-foreground">No leads yet</p>
                        <p className="text-xs text-muted-foreground/70 mt-1">Use the strategy cards above to configure targeting, then click Generate</p>
                      </div>
                    ) : paginatedLeads.length === 0 ? (
                      <p className="text-xs text-muted-foreground p-4 text-center">No prospects match your filter</p>
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
                                <span className="text-[11px] font-medium text-foreground">{lead.name}</span>
                                {score != null && (
                                  <Badge variant="secondary" className="text-[8px] h-3.5 px-1 shrink-0 gap-0.5">
                                    <Star className="w-2 h-2 fill-current" />{score}
                                  </Badge>
                                )}
                              </div>
                              <div className="text-[10px] text-muted-foreground">{lead.title} · {lead.company}</div>
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
          </div>
        )}

        {/* ── Full mode without strip/chat (backward compat) ── */}
        {!frameworkOnly && !hasLeads && !strategyStrip && (
          <p className="text-[10px] text-muted-foreground p-4 text-center">No leads generated yet</p>
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

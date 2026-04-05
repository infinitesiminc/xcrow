import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import {
  Building2, Package, Users, Linkedin, Target, Swords,
  UserCheck, Globe, Mail, Search, ChevronLeft, ChevronRight, Info,
} from "lucide-react";
import type { GTMTreeData, GTMProduct, GTMLead, GTMBuyerMapping } from "./gtm-types";

interface GTMTreeViewProps {
  companyName: string;
  data: GTMTreeData;
}

const LEADS_PER_PAGE = 25;

/* ── Derived vertical type ── */
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

/* ── Derived company type ── */
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

/* ── Detail item types ── */
type DetailItem =
  | { type: "product"; data: GTMProduct; leadCount: number }
  | { type: "vertical"; data: DerivedVertical }
  | { type: "company"; data: DerivedCompany; leadCount: number }
  | { type: "lead"; data: GTMLead };

/* ── Column header ── */
function ColumnHeader({ title, count, total, children }: {
  title: string;
  count: number;
  total: number;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5 p-2 border-b border-border/50 shrink-0">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-foreground">{title}</span>
        <Badge variant="secondary" className="text-[9px] h-4 px-1.5">
          {count === total ? total : `${count}/${total}`}
        </Badge>
      </div>
      {children}
    </div>
  );
}

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

/* ── Sheet detail renderers ── */
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

function VerticalDetail({ vertical }: { vertical: DerivedVertical }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Target className="w-5 h-5 text-primary shrink-0" />
        <div className="text-base font-semibold text-foreground">{vertical.vertical}</div>
      </div>
      <div className="space-y-2">
        <div><span className="text-xs font-medium text-muted-foreground">Segment</span><p className="text-sm text-foreground mt-0.5">{vertical.segment}</p></div>
      </div>
      <div className="space-y-3">
        <div className="p-3 rounded-lg border border-blue-500/20 bg-blue-500/5">
          <div className="text-xs font-medium text-blue-700 mb-1">Decision Maker</div>
          <div className="text-sm text-foreground font-medium">{vertical.dmDetails?.title || vertical.dm}</div>
          {vertical.dmDetails && (
            <>
              <div className="text-xs text-muted-foreground mt-1">Seniority: {vertical.dmDetails.seniority}</div>
              <div className="text-xs text-muted-foreground">Why they buy: {vertical.dmDetails.why_they_buy}</div>
              <div className="text-xs text-muted-foreground">Channel: {vertical.dmDetails.outreach_channel}</div>
            </>
          )}
        </div>
        <div className="p-3 rounded-lg border border-green-500/20 bg-green-500/5">
          <div className="text-xs font-medium text-green-700 mb-1">Champion</div>
          <div className="text-sm text-foreground font-medium">{vertical.championDetails?.title || vertical.champion}</div>
          {vertical.championDetails && (
            <>
              <div className="text-xs text-muted-foreground mt-1">Seniority: {vertical.championDetails.seniority}</div>
              <div className="text-xs text-muted-foreground">Why they care: {vertical.championDetails.why_they_care}</div>
              <div className="text-xs text-muted-foreground">Channel: {vertical.championDetails.outreach_channel}</div>
            </>
          )}
        </div>
      </div>
      {vertical.customers.length > 0 && (
        <div>
          <span className="text-xs font-medium text-muted-foreground">Known Customers</span>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {vertical.customers.map(c => (
              <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CompanyDetail({ company, leadCount }: { company: DerivedCompany; leadCount: number }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {company.type === "conquest"
          ? <Swords className="w-5 h-5 text-orange-500 shrink-0" />
          : <Building2 className="w-5 h-5 text-primary shrink-0" />}
        <div>
          <div className="text-base font-semibold text-foreground">{company.name}</div>
          <Badge variant="outline" className={`text-[10px] mt-0.5 ${company.type === "conquest" ? "bg-orange-500/15 text-orange-700 border-orange-500/30" : "bg-primary/15 text-primary border-primary/30"}`}>
            {company.type === "conquest" ? "Conquest Target" : "Customer"}
          </Badge>
        </div>
      </div>
      <div className="space-y-2">
        {company.domain && (
          <div><span className="text-xs font-medium text-muted-foreground">Domain</span>
            <p className="text-sm text-foreground mt-0.5">
              <a href={`https://${company.domain}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                <Globe className="w-3 h-3" /> {company.domain}
              </a>
            </p>
          </div>
        )}
        {company.industry && (
          <div><span className="text-xs font-medium text-muted-foreground">Industry</span><p className="text-sm text-foreground mt-0.5">{company.industry}</p></div>
        )}
        <div><span className="text-xs font-medium text-muted-foreground">Leads</span><p className="text-sm text-foreground mt-0.5">{leadCount} leads found</p></div>
      </div>
      {company.type === "conquest" && company.uses_competitor && (
        <div className="p-3 rounded-lg border border-orange-500/20 bg-orange-500/5">
          <div className="text-xs font-medium text-orange-700 mb-1">Competitor in Use</div>
          <div className="text-sm text-foreground">{company.uses_competitor}</div>
          {company.switch_angle && (
            <div className="text-xs text-muted-foreground mt-1">Switch angle: {company.switch_angle}</div>
          )}
        </div>
      )}
      {company.evidence && (
        <div><span className="text-xs font-medium text-muted-foreground">Evidence</span><p className="text-sm text-foreground mt-0.5">{company.evidence}</p></div>
      )}
    </div>
  );
}

function LeadDetail({ lead }: { lead: GTMLead }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center text-center gap-2">
        {lead.photo_url ? (
          <img src={lead.photo_url} alt="" className="w-16 h-16 rounded-full" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <Users className="w-7 h-7 text-muted-foreground" />
          </div>
        )}
        <div>
          <div className="text-base font-semibold text-foreground">{lead.name}</div>
          <div className="text-sm text-muted-foreground">{lead.title}</div>
          <div className="text-sm text-muted-foreground">@ {lead.company}</div>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5 justify-center">
        <Badge className={`text-xs ${lead.role === "dm" ? "bg-blue-500/15 text-blue-700 border-blue-500/30" : "bg-green-500/15 text-green-700 border-green-500/30"}`} variant="outline">
          {lead.role === "dm" ? "Decision Maker" : "Champion"}
        </Badge>
        <Badge className={`text-xs ${lead.type === "conquest" ? "bg-orange-500/15 text-orange-700 border-orange-500/30" : "bg-primary/15 text-primary border-primary/30"}`} variant="outline">
          {lead.type === "conquest" ? "Conquest" : "Customer"}
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
        {lead.competitor_using && (
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

/* ── Main component ── */
export default function GTMTreeView({ companyName, data }: GTMTreeViewProps) {
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedVerticalIdx, setSelectedVerticalIdx] = useState<number | null>(null);
  const [selectedCompanyIdx, setSelectedCompanyIdx] = useState<number | null>(null);
  const [selectedLeadIdx, setSelectedLeadIdx] = useState<number | null>(null);
  const [detailItem, setDetailItem] = useState<DetailItem | null>(null);

  // Filters
  const [productFilter, setProductFilter] = useState("");
  const [verticalFilter, setVerticalFilter] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [companyTypeFilter, setCompanyTypeFilter] = useState<"all" | "customer" | "conquest">("all");
  const [leadFilter, setLeadFilter] = useState("");
  const [leadRoleFilter, setLeadRoleFilter] = useState<"all" | "dm" | "champion">("all");
  const [leadPage, setLeadPage] = useState(1);

  // ── Derived data ──

  const verticalsByProduct = useMemo(() => {
    const map: Record<string, DerivedVertical[]> = {};
    for (const m of data.mappings) {
      if (!map[m.product_id]) map[m.product_id] = [];
      map[m.product_id].push({
        vertical: m.vertical,
        segment: m.segment,
        dm: m.dm.title,
        champion: m.champion.title,
        customers: m.known_customers || [],
        productId: m.product_id,
        dmDetails: m.dm,
        championDetails: m.champion,
      });
    }
    return map;
  }, [data.mappings]);

  const allCompanies = useMemo<DerivedCompany[]>(() => {
    const custs: DerivedCompany[] = data.customers.map(c => ({ ...c, type: "customer" as const }));
    const conqs: DerivedCompany[] = data.conquest_targets.map(c => ({ ...c, type: "conquest" as const }));
    return [...custs, ...conqs];
  }, [data.customers, data.conquest_targets]);

  const leadsByProduct = useMemo(() => {
    const map: Record<string, GTMLead[]> = {};
    for (const l of data.leads) {
      if (!map[l.product_id]) map[l.product_id] = [];
      map[l.product_id].push(l);
    }
    return map;
  }, [data.leads]);

  // ── Column 1: Products ──
  const filteredProducts = useMemo(() =>
    data.products.filter(p =>
      p.name.toLowerCase().includes(productFilter.toLowerCase())
    ), [data.products, productFilter]);

  // ── Column 2: Verticals ──
  const activeVerticals = useMemo(() => {
    if (!selectedProductId) return [];
    const verts = verticalsByProduct[selectedProductId] || [];
    return verts.filter(v =>
      v.vertical.toLowerCase().includes(verticalFilter.toLowerCase()) ||
      v.segment.toLowerCase().includes(verticalFilter.toLowerCase())
    );
  }, [selectedProductId, verticalsByProduct, verticalFilter]);

  const allVerticalsForProduct = useMemo(() =>
    selectedProductId ? (verticalsByProduct[selectedProductId] || []) : [],
    [selectedProductId, verticalsByProduct]);

  // ── Column 3: Companies ──
  const activeCompanies = useMemo(() => {
    if (selectedVerticalIdx === null || !activeVerticals[selectedVerticalIdx]) return [];
    const v = activeVerticals[selectedVerticalIdx];
    let companies = allCompanies.filter(c =>
      c.product_ids.includes(v.productId) && (
        c.industry?.toLowerCase().includes(v.vertical.split("/")[0].trim().toLowerCase()) ||
        v.customers.some(cn => cn.toLowerCase() === c.name?.toLowerCase())
      )
    );
    if (companies.length === 0) {
      companies = allCompanies.filter(c => c.product_ids.includes(v.productId));
    }
    if (companyTypeFilter !== "all") {
      companies = companies.filter(c => c.type === companyTypeFilter);
    }
    if (companyFilter) {
      companies = companies.filter(c =>
        c.name.toLowerCase().includes(companyFilter.toLowerCase())
      );
    }
    return companies;
  }, [selectedVerticalIdx, activeVerticals, allCompanies, companyTypeFilter, companyFilter]);

  const allCompaniesForVertical = useMemo(() => {
    if (selectedVerticalIdx === null || !activeVerticals[selectedVerticalIdx]) return [];
    const v = activeVerticals[selectedVerticalIdx];
    let companies = allCompanies.filter(c =>
      c.product_ids.includes(v.productId) && (
        c.industry?.toLowerCase().includes(v.vertical.split("/")[0].trim().toLowerCase()) ||
        v.customers.some(cn => cn.toLowerCase() === c.name?.toLowerCase())
      )
    );
    if (companies.length === 0) {
      companies = allCompanies.filter(c => c.product_ids.includes(v.productId));
    }
    return companies;
  }, [selectedVerticalIdx, activeVerticals, allCompanies]);

  // ── Column 4: Leads ──
  const activeLeads = useMemo(() => {
    if (!selectedProductId) return [];
    let leads = leadsByProduct[selectedProductId] || [];
    if (selectedCompanyIdx !== null && activeCompanies[selectedCompanyIdx]) {
      const companyName = activeCompanies[selectedCompanyIdx].name;
      leads = leads.filter(l => l.company?.toLowerCase() === companyName.toLowerCase());
    } else if (selectedVerticalIdx !== null && activeVerticals[selectedVerticalIdx]) {
      const v = activeVerticals[selectedVerticalIdx];
      const vertLeads = leads.filter(l =>
        l.vertical?.toLowerCase().includes(v.vertical.split("/")[0].trim().toLowerCase())
      );
      if (vertLeads.length > 0) leads = vertLeads;
    }
    if (leadRoleFilter !== "all") {
      leads = leads.filter(l => l.role === leadRoleFilter);
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
  }, [selectedProductId, selectedCompanyIdx, selectedVerticalIdx, activeCompanies, activeVerticals, leadsByProduct, leadRoleFilter, leadFilter]);

  const totalLeadsForContext = useMemo(() => {
    if (!selectedProductId) return 0;
    let leads = leadsByProduct[selectedProductId] || [];
    if (selectedCompanyIdx !== null && activeCompanies[selectedCompanyIdx]) {
      const cn = activeCompanies[selectedCompanyIdx].name;
      leads = leads.filter(l => l.company?.toLowerCase() === cn.toLowerCase());
    }
    return leads.length;
  }, [selectedProductId, selectedCompanyIdx, activeCompanies, leadsByProduct]);

  // Pagination
  const totalLeadPages = Math.max(1, Math.ceil(activeLeads.length / LEADS_PER_PAGE));
  const safePage = Math.min(leadPage, totalLeadPages);
  const paginatedLeads = activeLeads.slice((safePage - 1) * LEADS_PER_PAGE, safePage * LEADS_PER_PAGE);

  // ── Selection handlers ──
  function selectProduct(id: string) {
    setSelectedProductId(prev => prev === id ? null : id);
    setSelectedVerticalIdx(null);
    setSelectedCompanyIdx(null);
    setSelectedLeadIdx(null);
    setLeadPage(1);
  }
  function selectVertical(idx: number) {
    setSelectedVerticalIdx(prev => prev === idx ? null : idx);
    setSelectedCompanyIdx(null);
    setSelectedLeadIdx(null);
    setLeadPage(1);
  }
  function selectCompany(idx: number) {
    setSelectedCompanyIdx(prev => prev === idx ? null : idx);
    setSelectedLeadIdx(null);
    setLeadPage(1);
  }

  // Count helpers
  function getProductLeadCount(productId: string) {
    return (leadsByProduct[productId] || []).length;
  }
  function getVerticalLeadCount(v: DerivedVertical) {
    const leads = leadsByProduct[v.productId] || [];
    const matched = leads.filter(l =>
      l.vertical?.toLowerCase().includes(v.vertical.split("/")[0].trim().toLowerCase())
    );
    return matched.length > 0 ? matched.length : leads.length;
  }
  function getCompanyLeadCount(company: DerivedCompany) {
    if (!selectedProductId) return 0;
    return (leadsByProduct[selectedProductId] || []).filter(l =>
      l.company?.toLowerCase() === company.name.toLowerCase()
    ).length;
  }

  // Breadcrumb
  const breadcrumb = [companyName];
  if (selectedProductId) {
    const p = data.products.find(p => p.id === selectedProductId);
    if (p) breadcrumb.push(p.name);
  }
  if (selectedVerticalIdx !== null && activeVerticals[selectedVerticalIdx]) {
    breadcrumb.push(activeVerticals[selectedVerticalIdx].vertical);
  }
  if (selectedCompanyIdx !== null && activeCompanies[selectedCompanyIdx]) {
    breadcrumb.push(activeCompanies[selectedCompanyIdx].name);
  }

  // Sheet title
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
    <div className="space-y-2">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-xs text-muted-foreground px-1 flex-wrap">
        {breadcrumb.map((b, i) => (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="w-3 h-3" />}
            <span className={i === breadcrumb.length - 1 ? "text-foreground font-medium" : ""}>{b}</span>
          </span>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 text-[10px] text-muted-foreground px-1">
        <span className="flex items-center gap-1"><Building2 className="w-3 h-3 text-primary" /> Customer</span>
        <span className="flex items-center gap-1"><Swords className="w-3 h-3 text-orange-500" /> Conquest</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" /> DM</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> Champion</span>
        <span className="flex items-center gap-1 ml-2"><Info className="w-3 h-3" /> Hover card for details</span>
      </div>

      {/* 4-column browser */}
      <div className="flex gap-1 h-[500px]">
        {/* Col 1: Products */}
        <div className="flex flex-col min-w-[200px] flex-[1.3] border border-border rounded-lg overflow-hidden bg-card">
          <ColumnHeader title="Products" count={filteredProducts.length} total={data.products.length}>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
              <Input
                placeholder="Filter..."
                value={productFilter}
                onChange={e => setProductFilter(e.target.value)}
                className="h-7 text-xs pl-7 bg-background"
              />
            </div>
          </ColumnHeader>
          <ScrollArea className="flex-1">
            <div className="p-1.5 space-y-1">
              {filteredProducts.map(product => (
                <SelectableCard
                  key={product.id}
                  active={selectedProductId === product.id}
                  onClick={() => selectProduct(product.id)}
                  onInfoClick={() => setDetailItem({ type: "product", data: product, leadCount: getProductLeadCount(product.id) })}
                >
                  <div className="flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="text-[11px] font-medium text-foreground truncate flex-1">{product.name}</span>
                    <Badge variant="secondary" className="text-[9px] h-3.5 px-1 shrink-0">
                      {getProductLeadCount(product.id)}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{product.target_user}</p>
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

        {/* Col 2: Verticals */}
        <div className="flex flex-col min-w-[200px] flex-[1.3] border border-border rounded-lg overflow-hidden bg-card">
          <ColumnHeader title="Verticals" count={activeVerticals.length} total={allVerticalsForProduct.length}>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
              <Input
                placeholder="Filter..."
                value={verticalFilter}
                onChange={e => setVerticalFilter(e.target.value)}
                className="h-7 text-xs pl-7 bg-background"
                disabled={!selectedProductId}
              />
            </div>
          </ColumnHeader>
          <ScrollArea className="flex-1">
            <div className="p-1.5 space-y-1">
              {!selectedProductId ? (
                <p className="text-[10px] text-muted-foreground p-2 text-center">Select a product</p>
              ) : activeVerticals.length === 0 ? (
                <p className="text-[10px] text-muted-foreground p-2 text-center">No verticals</p>
              ) : activeVerticals.map((v, i) => (
                <SelectableCard
                  key={`${v.vertical}-${i}`}
                  active={selectedVerticalIdx === i}
                  onClick={() => selectVertical(i)}
                  onInfoClick={() => setDetailItem({ type: "vertical", data: v })}
                >
                  <div className="flex items-center gap-1.5">
                    <Target className="w-3 h-3 text-muted-foreground shrink-0" />
                    <span className="text-[11px] font-medium text-foreground truncate flex-1">{v.vertical}</span>
                    <Badge variant="secondary" className="text-[9px] h-3.5 px-1 shrink-0">
                      {getVerticalLeadCount(v)}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{v.segment}</p>
                  <div className="flex items-center gap-2 mt-1 text-[9px] text-muted-foreground">
                    <span className="flex items-center gap-0.5 truncate"><UserCheck className="w-2.5 h-2.5 shrink-0" /> {v.dm}</span>
                  </div>
                </SelectableCard>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Col 3: Companies */}
        <div className="flex flex-col min-w-[140px] flex-[0.8] border border-border rounded-lg overflow-hidden bg-card">
          <ColumnHeader title="Companies" count={activeCompanies.length} total={allCompaniesForVertical.length}>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
              <Input
                placeholder="Filter..."
                value={companyFilter}
                onChange={e => setCompanyFilter(e.target.value)}
                className="h-7 text-xs pl-7 bg-background"
                disabled={selectedVerticalIdx === null}
              />
            </div>
            <div className="flex gap-0.5">
              {(["all", "customer", "conquest"] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setCompanyTypeFilter(t)}
                  className={`text-[9px] px-1.5 py-0.5 rounded transition-colors ${
                    companyTypeFilter === t
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-accent"
                  }`}
                >
                  {t === "all" ? "All" : t === "customer" ? "Cust" : "Conq"}
                </button>
              ))}
            </div>
          </ColumnHeader>
          <ScrollArea className="flex-1">
            <div className="p-1.5 space-y-1">
              {selectedVerticalIdx === null ? (
                <p className="text-[10px] text-muted-foreground p-2 text-center">Select a vertical</p>
              ) : activeCompanies.length === 0 ? (
                <p className="text-[10px] text-muted-foreground p-2 text-center">No companies</p>
              ) : activeCompanies.map((c, i) => (
                <SelectableCard
                  key={c.name}
                  active={selectedCompanyIdx === i}
                  onClick={() => selectCompany(i)}
                  onInfoClick={() => setDetailItem({ type: "company", data: c, leadCount: getCompanyLeadCount(c) })}
                  className={c.type === "conquest" ? "border-orange-500/20" : "border-primary/20"}
                >
                  <div className="flex items-center gap-1.5">
                    {c.type === "conquest"
                      ? <Swords className="w-3 h-3 text-orange-500 shrink-0" />
                      : <Building2 className="w-3 h-3 text-primary shrink-0" />}
                    <span className="text-[11px] font-medium text-foreground truncate flex-1">{c.name}</span>
                    <Badge variant="secondary" className="text-[9px] h-3.5 px-1 shrink-0">
                      {getCompanyLeadCount(c)}
                    </Badge>
                  </div>
                  {c.type === "conquest" && c.uses_competitor && (
                    <p className="text-[9px] text-orange-600 mt-0.5 truncate">Uses {c.uses_competitor}</p>
                  )}
                </SelectableCard>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Col 4: Leads */}
        <div className="flex flex-col min-w-[200px] flex-[1.2] border border-border rounded-lg overflow-hidden bg-card">
          <ColumnHeader title="Leads" count={activeLeads.length} total={totalLeadsForContext}>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
              <Input
                placeholder="Search name, title..."
                value={leadFilter}
                onChange={e => { setLeadFilter(e.target.value); setLeadPage(1); }}
                className="h-7 text-xs pl-7 bg-background"
                disabled={!selectedProductId}
              />
            </div>
            <div className="flex gap-0.5">
              {(["all", "dm", "champion"] as const).map(r => (
                <button
                  key={r}
                  onClick={() => { setLeadRoleFilter(r); setLeadPage(1); }}
                  className={`text-[9px] px-1.5 py-0.5 rounded transition-colors ${
                    leadRoleFilter === r
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-accent"
                  }`}
                >
                  {r === "all" ? "All" : r === "dm" ? "DM" : "Champ"}
                </button>
              ))}
            </div>
          </ColumnHeader>
          <ScrollArea className="flex-1">
            <div className="p-1.5 space-y-1">
              {!selectedProductId ? (
                <p className="text-[10px] text-muted-foreground p-2 text-center">Select a product</p>
              ) : paginatedLeads.length === 0 ? (
                <p className="text-[10px] text-muted-foreground p-2 text-center">No leads found</p>
              ) : paginatedLeads.map((lead, i) => (
                <SelectableCard
                  key={lead.linkedin_url + i}
                  active={selectedLeadIdx === i}
                  onClick={() => { setSelectedLeadIdx(prev => prev === i ? null : i); setDetailItem({ type: "lead", data: lead }); }}
                  onInfoClick={() => setDetailItem({ type: "lead", data: lead })}
                  className={lead.role === "dm" ? "border-blue-500/20" : "border-green-500/20"}
                >
                  <div className="flex items-start gap-2">
                    {lead.photo_url ? (
                      <img src={lead.photo_url} alt="" className="w-5 h-5 rounded-full shrink-0 mt-0.5" />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                        <Users className="w-2.5 h-2.5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-medium text-foreground truncate">{lead.name}</div>
                      <div className="text-[10px] text-muted-foreground truncate">{lead.title}</div>
                    </div>
                    <Badge
                      variant="secondary"
                      className={`text-[8px] h-3 px-1 border-0 shrink-0 ${lead.role === "dm" ? "bg-blue-500/15 text-blue-700" : "bg-green-500/15 text-green-700"}`}
                    >
                      {lead.role === "dm" ? "DM" : "CH"}
                    </Badge>
                  </div>
                </SelectableCard>
              ))}
            </div>
          </ScrollArea>
          {totalLeadPages > 1 && (
            <div className="flex items-center justify-between px-2 py-1.5 border-t border-border/50 shrink-0">
              <button
                onClick={() => setLeadPage(p => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                className="text-[10px] text-muted-foreground hover:text-foreground disabled:opacity-30 flex items-center gap-0.5"
              >
                <ChevronLeft className="w-3 h-3" /> Prev
              </button>
              <span className="text-[10px] text-muted-foreground">{safePage}/{totalLeadPages}</span>
              <button
                onClick={() => setLeadPage(p => Math.min(totalLeadPages, p + 1))}
                disabled={safePage >= totalLeadPages}
                className="text-[10px] text-muted-foreground hover:text-foreground disabled:opacity-30 flex items-center gap-0.5"
              >
                Next <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Detail Sheet */}
      <Sheet open={!!detailItem} onOpenChange={(open) => { if (!open) setDetailItem(null); }}>
        <SheetContent className="w-[400px] sm:max-w-[400px]">
          <SheetHeader>
            <SheetTitle>{getSheetTitle()}</SheetTitle>
            <SheetDescription>
              {detailItem?.type === "product" && "Product details"}
              {detailItem?.type === "vertical" && "Vertical & buyer mapping"}
              {detailItem?.type === "company" && "Company details"}
              {detailItem?.type === "lead" && "Lead profile"}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4">
            {detailItem?.type === "product" && <ProductDetail product={detailItem.data} leadCount={detailItem.leadCount} />}
            {detailItem?.type === "vertical" && <VerticalDetail vertical={detailItem.data} />}
            {detailItem?.type === "company" && <CompanyDetail company={detailItem.data} leadCount={detailItem.leadCount} />}
            {detailItem?.type === "lead" && <LeadDetail lead={detailItem.data} />}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

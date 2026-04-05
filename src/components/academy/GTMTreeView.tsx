import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Building2, Package, Users, Linkedin, Target, Swords,
  UserCheck, Globe, Mail, Search, ChevronLeft, ChevronRight,
} from "lucide-react";
import type { GTMTreeData, GTMProduct, GTMLead } from "./gtm-types";

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
}

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
  active, onClick, children, className = "",
}: {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
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
  );
}

/* ── Main component ── */
export default function GTMTreeView({ companyName, data }: GTMTreeViewProps) {
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedVerticalIdx, setSelectedVerticalIdx] = useState<number | null>(null);
  const [selectedCompanyIdx, setSelectedCompanyIdx] = useState<number | null>(null);
  const [selectedLeadIdx, setSelectedLeadIdx] = useState<number | null>(null);

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

  // ── Column 2: Verticals (filtered by selected product) ──
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

  // ── Column 3: Companies (filtered by selected vertical) ──
  const activeCompanies = useMemo(() => {
    if (selectedVerticalIdx === null || !activeVerticals[selectedVerticalIdx]) return [];
    const v = activeVerticals[selectedVerticalIdx];
    let companies = allCompanies.filter(c =>
      c.product_ids.includes(v.productId) && (
        c.industry?.toLowerCase().includes(v.vertical.split("/")[0].trim().toLowerCase()) ||
        v.customers.some(cn => cn.toLowerCase() === c.name?.toLowerCase())
      )
    );
    // Fallback: show all companies for this product if no vertical match
    if (companies.length === 0) {
      companies = allCompanies.filter(c => c.product_ids.includes(v.productId));
    }
    // Apply filters
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

    // Filter by selected company
    if (selectedCompanyIdx !== null && activeCompanies[selectedCompanyIdx]) {
      const companyName = activeCompanies[selectedCompanyIdx].name;
      leads = leads.filter(l => l.company?.toLowerCase() === companyName.toLowerCase());
    }
    // Filter by selected vertical
    else if (selectedVerticalIdx !== null && activeVerticals[selectedVerticalIdx]) {
      const v = activeVerticals[selectedVerticalIdx];
      const vertLeads = leads.filter(l =>
        l.vertical?.toLowerCase().includes(v.vertical.split("/")[0].trim().toLowerCase())
      );
      if (vertLeads.length > 0) leads = vertLeads;
    }

    // Role filter
    if (leadRoleFilter !== "all") {
      leads = leads.filter(l => l.role === leadRoleFilter);
    }
    // Text filter
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

  // Selected lead detail
  const selectedLead = selectedLeadIdx !== null ? paginatedLeads[selectedLeadIdx] : null;

  // ── Selection handlers with cascade reset ──
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
  if (selectedLead) breadcrumb.push(selectedLead.name);

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
      </div>

      {/* 5-column browser */}
      <div className="flex gap-1 h-[500px]">
        {/* Col 1: Products */}
        <div className="flex flex-col w-48 shrink-0 border border-border rounded-lg overflow-hidden bg-card">
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
        <div className="flex flex-col w-44 shrink-0 border border-border rounded-lg overflow-hidden bg-card">
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
                <SelectableCard key={`${v.vertical}-${i}`} active={selectedVerticalIdx === i} onClick={() => selectVertical(i)}>
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
        <div className="flex flex-col w-44 shrink-0 border border-border rounded-lg overflow-hidden bg-card">
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
        <div className="flex flex-col flex-1 min-w-[200px] border border-border rounded-lg overflow-hidden bg-card">
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
                  onClick={() => setSelectedLeadIdx(prev => prev === i ? null : i)}
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
          {/* Pagination */}
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

        {/* Col 5: Lead Detail */}
        <div className="flex flex-col w-56 shrink-0 border border-border rounded-lg overflow-hidden bg-card">
          <ColumnHeader title="Detail" count={selectedLead ? 1 : 0} total={1} />
          <ScrollArea className="flex-1">
            {selectedLead ? (
              <div className="p-3 space-y-3">
                {/* Photo + name */}
                <div className="flex flex-col items-center text-center gap-2">
                  {selectedLead.photo_url ? (
                    <img src={selectedLead.photo_url} alt="" className="w-14 h-14 rounded-full" />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
                      <Users className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <div className="text-sm font-semibold text-foreground">{selectedLead.name}</div>
                    <div className="text-[11px] text-muted-foreground">{selectedLead.title}</div>
                    <div className="text-[11px] text-muted-foreground">@ {selectedLead.company}</div>
                  </div>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-1 justify-center">
                  <Badge className={`text-[10px] ${selectedLead.role === "dm" ? "bg-blue-500/15 text-blue-700 border-blue-500/30" : "bg-green-500/15 text-green-700 border-green-500/30"}`} variant="outline">
                    {selectedLead.role === "dm" ? "Decision Maker" : "Champion"}
                  </Badge>
                  <Badge className={`text-[10px] ${selectedLead.type === "conquest" ? "bg-orange-500/15 text-orange-700 border-orange-500/30" : "bg-primary/15 text-primary border-primary/30"}`} variant="outline">
                    {selectedLead.type === "conquest" ? "Conquest" : "Customer"}
                  </Badge>
                </div>

                {/* Product + Vertical */}
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <Package className="w-3 h-3 text-primary shrink-0" />
                    <span className="text-muted-foreground">Product:</span>
                    <span className="text-foreground font-medium truncate">{selectedLead.product_name}</span>
                  </div>
                  {selectedLead.vertical && (
                    <div className="flex items-center gap-1.5">
                      <Target className="w-3 h-3 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">Vertical:</span>
                      <span className="text-foreground truncate">{selectedLead.vertical}</span>
                    </div>
                  )}
                  {selectedLead.competitor_using && (
                    <div className="flex items-center gap-1.5">
                      <Swords className="w-3 h-3 text-orange-500 shrink-0" />
                      <span className="text-muted-foreground">Uses:</span>
                      <span className="text-orange-600 truncate">{selectedLead.competitor_using}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="space-y-1.5">
                  {selectedLead.linkedin_url && (
                    <a
                      href={selectedLead.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 w-full px-3 py-2 rounded-md bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors justify-center"
                    >
                      <Linkedin className="w-3.5 h-3.5" /> View LinkedIn
                    </a>
                  )}
                  {selectedLead.email && (
                    <a
                      href={`mailto:${selectedLead.email}`}
                      className="flex items-center gap-2 w-full px-3 py-2 rounded-md border border-border text-xs font-medium hover:bg-accent transition-colors justify-center text-foreground"
                    >
                      <Mail className="w-3.5 h-3.5" /> {selectedLead.email}
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-[11px] text-muted-foreground p-4 text-center">
                Click a lead to see full details
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}

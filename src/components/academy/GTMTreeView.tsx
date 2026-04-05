import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Building2, Package, Users, Linkedin, Target, Swords,
  ChevronRight, UserCheck, Globe, Mail,
} from "lucide-react";
import type { GTMTreeData, GTMProduct, GTMLead } from "./gtm-types";

interface GTMTreeViewProps {
  companyName: string;
  data: GTMTreeData;
}

/* ── Connector line ── */
function Connector({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center shrink-0 ${className}`}>
      <div className="w-6 h-px bg-border" />
      <ChevronRight className="w-3 h-3 text-muted-foreground -ml-1" />
    </div>
  );
}

/* ── Card shells ── */
function TreeCard({
  children,
  active,
  onClick,
  className = "",
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        text-left p-3 rounded-lg border transition-all w-full
        ${active ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-card hover:border-primary/30"}
        ${onClick ? "cursor-pointer" : "cursor-default"}
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

  // Derive unique verticals from mappings
  const verticalsByProduct = useMemo(() => {
    const map: Record<string, { vertical: string; segment: string; dm: string; champion: string; customers: string[] }[]> = {};
    for (const m of data.mappings) {
      if (!map[m.product_id]) map[m.product_id] = [];
      map[m.product_id].push({
        vertical: m.vertical,
        segment: m.segment,
        dm: m.dm.title,
        champion: m.champion.title,
        customers: m.known_customers || [],
      });
    }
    return map;
  }, [data.mappings]);

  // Companies (customers + conquest) indexed by product
  const companiesByProduct = useMemo(() => {
    const map: Record<string, (typeof data.customers[0] | typeof data.conquest_targets[0])[]> = {};
    for (const c of [...data.customers, ...data.conquest_targets]) {
      for (const pid of c.product_ids) {
        if (!map[pid]) map[pid] = [];
        map[pid].push(c);
      }
    }
    return map;
  }, [data.customers, data.conquest_targets]);

  // Leads indexed by product
  const leadsByProduct = useMemo(() => {
    const map: Record<string, GTMLead[]> = {};
    for (const l of data.leads) {
      if (!map[l.product_id]) map[l.product_id] = [];
      map[l.product_id].push(l);
    }
    return map;
  }, [data.leads]);

  const filteredProducts = selectedProductId
    ? data.products.filter((p) => p.id === selectedProductId)
    : data.products;

  return (
    <div className="space-y-2">
      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground px-1 pb-2 border-b border-border/40">
        <span className="flex items-center gap-1"><Package className="w-3 h-3" /> Products</span>
        <span className="flex items-center gap-1"><Target className="w-3 h-3" /> Verticals</span>
        <span className="flex items-center gap-1"><Building2 className="w-3 h-3 text-primary" /> Customers</span>
        <span className="flex items-center gap-1"><Swords className="w-3 h-3 text-orange-500" /> Conquest</span>
        <span className="flex items-center gap-1"><Linkedin className="w-3 h-3 text-blue-600" /> Leads</span>
        {selectedProductId && (
          <button onClick={() => setSelectedProductId(null)} className="ml-auto text-primary hover:underline">
            Show all products
          </button>
        )}
      </div>

      {/* Company root */}
      <div className="flex items-start gap-0">
        <div className="shrink-0 w-44">
          <TreeCard className="bg-primary/5 border-primary/30">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary shrink-0" />
              <div>
                <div className="font-semibold text-sm text-foreground">{companyName}</div>
                <p className="text-[10px] text-muted-foreground line-clamp-2 mt-0.5">{data.company_summary}</p>
              </div>
            </div>
          </TreeCard>
        </div>

        <Connector />

        {/* Product column */}
        <div className="flex flex-col gap-2 min-w-0">
          {filteredProducts.map((product) => (
            <ProductBranch
              key={product.id}
              product={product}
              verticals={verticalsByProduct[product.id] || []}
              companies={companiesByProduct[product.id] || []}
              leads={leadsByProduct[product.id] || []}
              selected={selectedProductId === product.id}
              onSelect={() => setSelectedProductId(selectedProductId === product.id ? null : product.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Product branch ── */
function ProductBranch({
  product,
  verticals,
  companies,
  leads,
  selected,
  onSelect,
}: {
  product: GTMProduct;
  verticals: { vertical: string; segment: string; dm: string; champion: string; customers: string[] }[];
  companies: any[];
  leads: GTMLead[];
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <div className="flex items-start gap-0">
      {/* Product card */}
      <div className="shrink-0 w-44">
        <TreeCard active={selected} onClick={onSelect}>
          <div className="flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5 text-primary shrink-0" />
            <Badge variant="outline" className="text-[10px] h-4 px-1">{product.id}</Badge>
            <span className="text-xs font-medium text-foreground truncate">{product.name}</span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1">{product.target_user}</p>
          {product.competitors.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {product.competitors.slice(0, 2).map((c) => (
                <Badge key={c} variant="secondary" className="text-[9px] h-3.5 px-1 bg-orange-500/10 text-orange-600 border-0">{c}</Badge>
              ))}
            </div>
          )}
        </TreeCard>
      </div>

      <Connector />

      {/* Verticals + companies + leads */}
      <div className="flex flex-col gap-1.5 min-w-0">
        {verticals.length > 0 ? (
          verticals.map((v, i) => {
            const vCompanies = companies.filter((c) =>
              c.industry?.toLowerCase().includes(v.vertical.split("/")[0].trim().toLowerCase()) ||
              v.customers.some((cn: string) => cn.toLowerCase() === c.name?.toLowerCase())
            );
            // Fallback: if no industry match, distribute companies across verticals
            const fallbackCompanies = i === 0 && vCompanies.length === 0 ? companies : [];
            const displayCompanies = vCompanies.length > 0 ? vCompanies : fallbackCompanies;

            const vLeads = leads.filter((l) =>
              l.vertical?.toLowerCase().includes(v.vertical.split("/")[0].trim().toLowerCase())
            );
            const fallbackLeads = i === 0 && vLeads.length === 0 ? leads : [];
            const displayLeads = vLeads.length > 0 ? vLeads : fallbackLeads;

            return (
              <div key={`${v.vertical}-${i}`} className="flex items-start gap-0">
                {/* Vertical card */}
                <div className="shrink-0 w-40">
                  <TreeCard>
                    <div className="flex items-center gap-1.5">
                      <Target className="w-3 h-3 text-muted-foreground shrink-0" />
                      <span className="text-[11px] font-medium text-foreground truncate">{v.vertical}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{v.segment}</p>
                    <div className="flex items-center gap-2 mt-1 text-[9px] text-muted-foreground">
                      <span className="flex items-center gap-0.5"><UserCheck className="w-2.5 h-2.5" /> DM: {v.dm}</span>
                    </div>
                  </TreeCard>
                </div>

                {displayCompanies.length > 0 || displayLeads.length > 0 ? <Connector /> : null}

                {/* Companies + Leads column */}
                <div className="flex flex-col gap-1 min-w-0">
                  {displayCompanies.map((c: any) => {
                    const companyLeads = displayLeads.filter((l) => l.company?.toLowerCase() === c.name?.toLowerCase());
                    return (
                      <div key={c.name} className="flex items-start gap-0">
                        <div className="shrink-0 w-40">
                          <TreeCard className={c.type === "conquest" ? "border-orange-500/30 bg-orange-500/5" : "border-primary/20 bg-primary/5"}>
                            <div className="flex items-center gap-1.5">
                              {c.type === "conquest"
                                ? <Swords className="w-3 h-3 text-orange-500 shrink-0" />
                                : <Building2 className="w-3 h-3 text-primary shrink-0" />}
                              <span className="text-[11px] font-medium text-foreground truncate">{c.name}</span>
                            </div>
                            {c.type === "conquest" && c.uses_competitor && (
                              <p className="text-[9px] text-orange-600 mt-0.5">Uses {c.uses_competitor}</p>
                            )}
                            {c.evidence && <p className="text-[9px] text-muted-foreground mt-0.5 line-clamp-1">{c.evidence}</p>}
                          </TreeCard>
                        </div>

                        {companyLeads.length > 0 && <Connector />}
                        <div className="flex flex-col gap-1">
                          {companyLeads.map((lead) => (
                            <LeadCard key={lead.linkedin_url} lead={lead} />
                          ))}
                        </div>
                      </div>
                    );
                  })}

                  {/* Leads not matched to a company */}
                  {displayLeads
                    .filter((l) => !displayCompanies.some((c: any) => c.name?.toLowerCase() === l.company?.toLowerCase()))
                    .map((lead) => (
                      <LeadCard key={lead.linkedin_url} lead={lead} />
                    ))}
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-xs text-muted-foreground py-2">No ICP mappings</div>
        )}
      </div>
    </div>
  );
}

/* ── Lead card ── */
function LeadCard({ lead }: { lead: GTMLead }) {
  return (
    <a
      href={lead.linkedin_url}
      target="_blank"
      rel="noopener noreferrer"
      className="block"
    >
      <TreeCard className={`w-52 ${lead.role === "dm" ? "border-blue-500/30 bg-blue-500/5" : "border-green-500/30 bg-green-500/5"} hover:shadow-md`}>
        <div className="flex items-start gap-2">
          {lead.photo_url ? (
            <img src={lead.photo_url} alt="" className="w-6 h-6 rounded-full shrink-0 mt-0.5" />
          ) : (
            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
              <Users className="w-3 h-3 text-muted-foreground" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-medium text-foreground truncate">{lead.name}</div>
            <div className="text-[10px] text-muted-foreground truncate">{lead.title}</div>
            <div className="text-[10px] text-muted-foreground truncate">@ {lead.company}</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
          <Badge
            variant="secondary"
            className={`text-[9px] h-3.5 px-1 border-0 ${lead.role === "dm" ? "bg-blue-500/15 text-blue-700" : "bg-green-500/15 text-green-700"}`}
          >
            {lead.role === "dm" ? "Decision Maker" : "Champion"}
          </Badge>
          {lead.type === "conquest" && (
            <Badge variant="secondary" className="text-[9px] h-3.5 px-1 border-0 bg-orange-500/15 text-orange-700">
              Conquest
            </Badge>
          )}
          <div className="flex items-center gap-1 ml-auto">
            <Linkedin className="w-2.5 h-2.5 text-blue-600" />
            {lead.email && <Mail className="w-2.5 h-2.5 text-muted-foreground" />}
          </div>
        </div>
      </TreeCard>
    </a>
  );
}

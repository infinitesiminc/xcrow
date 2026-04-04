import { useState } from "react";
import { ChevronDown, ChevronRight, Globe, CheckCircle2, Layers, Users, Building2 } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";

interface PageAnalyzed {
  url: string;
  path: string;
  category: string;
}

interface NicheItem {
  label: string;
  description?: string | null;
  parent_label?: string | null;
  niche_type?: string;
}

interface ICPInsightsPanelProps {
  websiteUrl: string;
  pagesAnalyzed: PageAnalyzed[];
  companySummary: string;
  icpSummary: string;
  niches?: NicheItem[];
}

const CATEGORY_LABELS: Record<string, string> = {
  homepage: "Homepage content & positioning",
  about: "Company model signals",
  solutions: "Product offering data",
  products: "Product offering data",
  services: "Service offering data",
  pricing: "Market tier signals",
  customers: "Customer evidence",
  "case-stud": "Customer evidence",
  industries: "Vertical market signals",
  partners: "Ecosystem signals",
  integrations: "Integration ecosystem",
  "use-cases": "Use case patterns",
  for: "Target audience signals",
  platform: "Platform capabilities",
};

function getCategoryLabel(category: string): string {
  return CATEGORY_LABELS[category] || `${category.charAt(0).toUpperCase()}${category.slice(1)} page data`;
}

const NICHE_ICONS: Record<string, typeof Layers> = {
  vertical: Layers,
  segment: Building2,
  persona: Users,
};

const NICHE_COLORS: Record<string, string> = {
  vertical: "bg-primary/10 text-primary",
  segment: "bg-accent/50 text-accent-foreground",
  persona: "bg-muted text-muted-foreground",
};

export function ICPInsightsPanel({ websiteUrl, pagesAnalyzed, companySummary, icpSummary, niches = [] }: ICPInsightsPanelProps) {
  const [open, setOpen] = useState(true);

  if (!websiteUrl && pagesAnalyzed.length === 0 && niches.length === 0) return null;

  const displayUrl = websiteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const verticals = niches.filter(n => n.niche_type === "vertical");
  const segments = niches.filter(n => n.niche_type === "segment");
  const personas = niches.filter(n => n.niche_type === "persona");

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button className="w-full px-4 py-2.5 flex items-center gap-2 text-left border-b border-border/40 bg-card/50 hover:bg-card/80 transition-colors">
          {open ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
          <Globe className="w-3.5 h-3.5 text-primary shrink-0" />
          <span className="text-xs font-medium text-foreground truncate">{displayUrl}</span>
          <span className="text-xs text-muted-foreground">· {pagesAnalyzed.length} pages analyzed</span>
          {niches.length > 0 && (
            <span className="text-xs text-muted-foreground">· {verticals.length} verticals · {segments.length} segments</span>
          )}
          <div className="flex-1" />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="px-4 py-3 border-b border-border/40 bg-muted/20 space-y-3">
          {/* Summaries */}
          {(companySummary || icpSummary) && (
            <div className="space-y-1.5">
              {companySummary && (
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Summary:</span> {companySummary}
                </p>
              )}
              {icpSummary && (
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">ICP:</span> {icpSummary}
                </p>
              )}
            </div>
          )}

          {/* Niche tree */}
          {verticals.length > 0 && (
            <div className="space-y-2 pt-1 border-t border-border/30">
              <p className="text-xs font-medium text-foreground">Discovered ICP Tree</p>
              {verticals.map((v) => {
                const vSegments = segments.filter(s => s.parent_label === v.label);
                return (
                  <div key={v.label} className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Layers className="w-3 h-3 text-primary shrink-0" />
                      <Badge variant="secondary" className="text-[10px] h-5 bg-primary/10 text-primary border-0">{v.label}</Badge>
                    </div>
                    {vSegments.map((s) => {
                      const sPersonas = personas.filter(p => p.parent_label === s.label);
                      return (
                        <div key={s.label} className="ml-5 space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <Building2 className="w-2.5 h-2.5 text-muted-foreground shrink-0" />
                            <span className="text-[11px] text-foreground">{s.label}</span>
                          </div>
                          {sPersonas.map((p) => (
                            <div key={p.label} className="ml-4 flex items-center gap-1.5">
                              <Users className="w-2.5 h-2.5 text-muted-foreground shrink-0" />
                              <span className="text-[10px] text-muted-foreground">{p.label}</span>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}

          {/* Pages list */}
          {pagesAnalyzed.length > 0 && (
            <div className="space-y-1 pt-1 border-t border-border/30">
              <p className="text-xs font-medium text-foreground">Pages Analyzed</p>
              {pagesAnalyzed.map((page, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
                  <span className="font-mono text-muted-foreground w-28 truncate">{page.path}</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="text-foreground">{getCategoryLabel(page.category)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

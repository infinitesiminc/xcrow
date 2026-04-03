import { useState } from "react";
import { ChevronDown, ChevronRight, Globe, CheckCircle2 } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface PageAnalyzed {
  url: string;
  path: string;
  category: string;
}

interface ICPInsightsPanelProps {
  websiteUrl: string;
  pagesAnalyzed: PageAnalyzed[];
  companySummary: string;
  icpSummary: string;
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

export function ICPInsightsPanel({ websiteUrl, pagesAnalyzed, companySummary, icpSummary }: ICPInsightsPanelProps) {
  const [open, setOpen] = useState(false);

  if (!websiteUrl && pagesAnalyzed.length === 0) return null;

  const displayUrl = websiteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button className="w-full px-4 py-2.5 flex items-center gap-2 text-left border-b border-border/40 bg-card/50 hover:bg-card/80 transition-colors">
          {open ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
          <Globe className="w-3.5 h-3.5 text-primary shrink-0" />
          <span className="text-xs font-medium text-foreground truncate">{displayUrl}</span>
          <span className="text-xs text-muted-foreground">· {pagesAnalyzed.length} pages analyzed</span>
          <div className="flex-1" />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="px-4 py-3 border-b border-border/40 bg-muted/20 space-y-3">
          {/* Pages list */}
          {pagesAnalyzed.length > 0 && (
            <div className="space-y-1">
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

          {/* Summaries */}
          {(companySummary || icpSummary) && (
            <div className="space-y-1.5 pt-1 border-t border-border/30">
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
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

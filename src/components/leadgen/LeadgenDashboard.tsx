import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Target, Mail, Download, Loader2, Zap } from "lucide-react";
import { LeadPipeline } from "./LeadPipeline";
import { ICPInsightsPanel } from "./ICPInsightsPanel";
import TargetingCards from "./TargetingCards";
import TargetZone, { type DroppedCard } from "./TargetZone";
import type { SavedLead, LeadStatus, OutreachEntry } from "./useLeadsCRUD";
import type { Lead } from "./LeadCard";
import type { GTMTreeData } from "@/components/academy/gtm-types";

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

interface LeadgenDashboardProps {
  leads: SavedLead[];
  outreach: OutreachEntry[];
  onUpdateStatus: (id: string, status: LeadStatus) => void;
  onDraftEmail: (lead: Lead) => void;
  onExportCSV: () => void;
  onGenerateAll?: () => void;
  onEnrichAll?: () => void;
  onScoreAll?: () => void;
  onDraftAll?: () => void;
  isGenerating?: boolean;
  isEnriching?: boolean;
  onSelectLead?: (lead: SavedLead) => void;
  onFindLookalikes?: (lead: SavedLead) => void;
  // ICP Insights
  websiteUrl?: string;
  pagesAnalyzed?: PageAnalyzed[];
  companySummary?: string;
  icpSummary?: string;
  niches?: NicheItem[];
  // GTM tree data for targeting cards
  gtmTreeData?: GTMTreeData | null;
  onGenerateFromTargeting?: (cards: DroppedCard[]) => void;
  onStopGenerating?: () => void;
}

export function LeadgenDashboard({
  leads,
  outreach,
  onUpdateStatus,
  onDraftEmail,
  onExportCSV,
  onGenerateAll,
  onEnrichAll,
  onScoreAll,
  onDraftAll,
  isGenerating,
  isEnriching,
  onSelectLead,
  onFindLookalikes,
  websiteUrl,
  pagesAnalyzed,
  companySummary,
  icpSummary,
  niches,
  gtmTreeData,
  onGenerateFromTargeting,
  onStopGenerating,
}: LeadgenDashboardProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [droppedCards, setDroppedCards] = useState<DroppedCard[]>([]);

  const droppedIds = new Set(droppedCards.map(c => c.id));

  // Auto-select single product
  useEffect(() => {
    if (gtmTreeData && gtmTreeData.products.length === 1 && droppedCards.length === 0) {
      const p = gtmTreeData.products[0];
      setDroppedCards([{ id: `product-${p.id}`, type: "product", label: p.name, description: p.description, meta: p.pricing_model }]);
    }
  }, [gtmTreeData]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    if (selectedIds.size === leads.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(leads.map(l => l.id)));
    }
  }, [leads, selectedIds.size]);

  function handleToggleCard(item: { id: string; type: "product" | "vertical"; label: string; description: string; meta?: string }) {
    setDroppedCards(prev => {
      const exists = prev.some(c => c.id === item.id);
      if (exists) return prev.filter(c => c.id !== item.id);
      return [...prev, item];
    });
  }

  function handleGenerate() {
    if (onGenerateFromTargeting && droppedCards.length > 0) {
      onGenerateFromTargeting(droppedCards);
    }
  }

  return (
    <div className="flex flex-1 min-w-0 h-full">
      {/* LEFT COLUMN: Targeting inputs (33%) */}
      {gtmTreeData && (
        <div className="w-2/5 min-w-[320px] max-w-[480px] border-r border-border/40 flex flex-col h-full shrink-0">
          {companySummary && (
            <div className="px-3 py-2 bg-card/40 flex items-start gap-2 text-xs border-b border-border/40">
              <span className="font-medium text-foreground shrink-0">Summary</span>
              <p className="text-muted-foreground line-clamp-3 leading-relaxed">{companySummary}</p>
            </div>
          )}
          <TargetingCards treeData={gtmTreeData} selectedIds={droppedIds} onToggle={handleToggleCard} />
          <div className="mt-auto border-t border-border/30">
            <TargetZone
              cards={droppedCards}
              onGenerate={handleGenerate}
              isGenerating={isGenerating}
              onStop={onStopGenerating}
            />
          </div>
        </div>
      )}

      {/* RIGHT COLUMN: Leads (67%) */}
      <div className="flex flex-col flex-1 min-w-0 h-full">
        {/* Company summary when no GTM data */}
        {companySummary && !gtmTreeData && (
          <ICPInsightsPanel
            websiteUrl={websiteUrl || ""}
            pagesAnalyzed={pagesAnalyzed || []}
            companySummary={companySummary}
            icpSummary={icpSummary || ""}
            niches={niches}
          />
        )}

        {/* Action Toolbar */}
        <div className="border-b border-border/40 bg-card/30 px-4 py-2 flex items-center gap-2 shrink-0 flex-wrap">
          <span className="text-xs font-medium text-muted-foreground mr-1">
            {leads.length} leads
            {selectedIds.size > 0 && ` · ${selectedIds.size} selected`}
          </span>
          <div className="flex-1" />
          <Button
            variant="default"
            size="sm"
            className="h-7 gap-1.5 text-xs"
            disabled={isGenerating}
            onClick={() => onGenerateAll?.()}
          >
            {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
            Generate All
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1.5 text-xs"
            disabled={isEnriching || leads.length === 0}
            onClick={() => onEnrichAll?.()}
          >
            {isEnriching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            Enrich
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1.5 text-xs"
            disabled={leads.length === 0}
            onClick={() => onScoreAll?.()}
          >
            <Target className="w-3.5 h-3.5" />
            Score
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1.5 text-xs"
            disabled={leads.length === 0}
            onClick={() => onDraftAll?.()}
          >
            <Mail className="w-3.5 h-3.5" />
            Draft
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1.5 text-xs"
            disabled={leads.length === 0}
            onClick={onExportCSV}
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </Button>
        </div>

        {/* Lead Pipeline */}
        <LeadPipeline
          leads={leads}
          onUpdateStatus={onUpdateStatus}
          onDraftEmail={onDraftEmail}
          onExportCSV={onExportCSV}
          outreachCount={outreach.length}
          onSelectLead={onSelectLead}
          onFindLookalikes={onFindLookalikes}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onSelectAll={selectAll}
        />
      </div>
    </div>
  );
}

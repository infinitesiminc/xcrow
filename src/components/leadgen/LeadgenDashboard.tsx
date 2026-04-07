import { useState, useCallback, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
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
  onDraftAll?: () => void;
  isGenerating?: boolean;
  isEnriching?: boolean;
  onSelectLead?: (lead: SavedLead) => void;
  onFindLookalikes?: (lead: SavedLead) => void;
  websiteUrl?: string;
  pagesAnalyzed?: PageAnalyzed[];
  companySummary?: string;
  icpSummary?: string;
  niches?: NicheItem[];
  gtmTreeData?: GTMTreeData | null;
  onGenerateFromTargeting?: (cards: DroppedCard[]) => void;
  onStopGenerating?: () => void;
  loadingProducts?: boolean;
  loadingPersonas?: boolean;
  droppedCards: DroppedCard[];
  setDroppedCards: React.Dispatch<React.SetStateAction<DroppedCard[]>>;
  hasCustomizations?: boolean;
  onResetToDefaults?: () => void;
}

export function LeadgenDashboard({
  leads,
  outreach,
  onUpdateStatus,
  onDraftEmail,
  onExportCSV,
  onGenerateAll,
  onEnrichAll,
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
  loadingProducts,
  loadingPersonas,
}: LeadgenDashboardProps) {
  const isMobile = useIsMobile();
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

  // Mobile layout: everything stacks vertically, no fixed-height constraints
  if (isMobile) {
    return (
      <div className="flex flex-col flex-1 min-w-0 overflow-auto pb-20">
        {/* Targeting section: Generate CTA first, then selectors */}
        {gtmTreeData && (
          <div className="border-b border-border/40">
            <TargetZone
              cards={droppedCards}
              onGenerate={handleGenerate}
              isGenerating={isGenerating}
              onStop={onStopGenerating}
            />
            <TargetingCards treeData={gtmTreeData} selectedIds={droppedIds} onToggle={handleToggleCard} loadingProducts={loadingProducts} loadingPersonas={loadingPersonas} />
          </div>
        )}

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

        {/* Lead count bar */}
        <div className="border-b border-border/40 bg-card/30 px-3 py-1.5 flex items-center gap-2 shrink-0">
          <span className="text-xs font-medium text-muted-foreground">
            {leads.length} leads
            {selectedIds.size > 0 && ` · ${selectedIds.size} selected`}
          </span>
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
    );
  }

  // Desktop layout: 40/60 split
  return (
    <div className="flex flex-row flex-1 min-w-0 h-full overflow-hidden">
      {/* LEFT COLUMN: Targeting inputs */}
      {gtmTreeData && (
        <div className="w-2/5 min-w-[320px] max-w-[480px] border-r border-border/40 flex flex-col shrink-0 h-full overflow-auto">
          <div className="border-b border-border/30">
            <TargetZone
              cards={droppedCards}
              onGenerate={handleGenerate}
              isGenerating={isGenerating}
              onStop={onStopGenerating}
            />
          </div>
          <TargetingCards treeData={gtmTreeData} selectedIds={droppedIds} onToggle={handleToggleCard} loadingProducts={loadingProducts} loadingPersonas={loadingPersonas} />
        </div>
      )}

      {/* RIGHT COLUMN: Leads */}
      <div className="flex flex-col flex-1 min-w-0 min-h-0">
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

        {/* Lead count bar */}
        <div className="border-b border-border/40 bg-card/30 px-4 py-2 flex items-center gap-2 shrink-0">
          <span className="text-xs font-medium text-muted-foreground">
            {leads.length} leads
            {selectedIds.size > 0 && ` · ${selectedIds.size} selected`}
          </span>
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

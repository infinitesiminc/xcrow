import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Sparkles, Target, Mail, Download, Loader2 } from "lucide-react";
import { LeadPipeline } from "./LeadPipeline";
import { ICPInsightsPanel } from "./ICPInsightsPanel";
import type { SavedLead, LeadStatus, OutreachEntry } from "./useLeadsCRUD";
import type { Lead } from "./LeadCard";

interface PageAnalyzed {
  url: string;
  path: string;
  category: string;
}

interface LeadgenDashboardProps {
  leads: SavedLead[];
  outreach: OutreachEntry[];
  activeNiche: string | null;
  onUpdateStatus: (id: string, status: LeadStatus) => void;
  onDraftEmail: (lead: Lead) => void;
  onExportCSV: () => void;
  onBatchFind?: (niche: string) => void;
  onEnrichLeads?: (niche: string) => void;
  onScoreLeads?: (niche: string) => void;
  onDraftAll?: (niche: string) => void;
  onExportNiche?: (niche: string) => void;
  isFinding?: boolean;
  isEnriching?: boolean;
  onSelectLead?: (lead: SavedLead) => void;
  onFindLookalikes?: (lead: SavedLead) => void;
  // ICP Insights
  websiteUrl?: string;
  pagesAnalyzed?: PageAnalyzed[];
  companySummary?: string;
  icpSummary?: string;
}

export function LeadgenDashboard({
  leads,
  outreach,
  activeNiche,
  onUpdateStatus,
  onDraftEmail,
  onExportCSV,
  onBatchFind,
  onEnrichLeads,
  onScoreLeads,
  onDraftAll,
  onExportNiche,
  isFinding,
  isEnriching,
  onSelectLead,
  onFindLookalikes,
  websiteUrl,
  pagesAnalyzed,
  companySummary,
  icpSummary,
}: LeadgenDashboardProps) {
  const normalizeNicheLabel = (value?: string | null) =>
    (value || "").toLowerCase().replace(/[()]/g, " ").replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();

  const filteredLeads = useMemo(() => {
    if (!activeNiche) return leads;
    const target = normalizeNicheLabel(activeNiche);
    return leads.filter((l) => {
      const leadTag = normalizeNicheLabel(l.niche_tag || "Uncategorized");
      return leadTag === target || leadTag.includes(target) || target.includes(leadTag);
    });
  }, [leads, activeNiche]);

  const filteredOutreach = useMemo(() => {
    if (!activeNiche) return outreach;
    const nicheLeadIds = new Set(filteredLeads.map((l) => l.id));
    return outreach.filter((o) => nicheLeadIds.has(o.lead_id));
  }, [outreach, activeNiche, filteredLeads]);

  return (
    <div className="flex flex-col flex-1 min-w-0 h-full">
      {/* ICP Insights Panel */}
      <ICPInsightsPanel
        websiteUrl={websiteUrl || ""}
        pagesAnalyzed={pagesAnalyzed || []}
        companySummary={companySummary || ""}
        icpSummary={icpSummary || ""}
      />

      {/* Action Toolbar */}
      <div className="border-b border-border/40 bg-card/30 px-4 py-2 flex items-center gap-2 shrink-0 flex-wrap">
        <span className="text-xs font-medium text-muted-foreground mr-1">
          {activeNiche || "All Leads"}
        </span>
        <div className="flex-1" />
        <Button
          variant="outline"
          size="sm"
          className="h-7 gap-1.5 text-xs"
          disabled={!activeNiche || isFinding}
          onClick={() => activeNiche && onBatchFind?.(activeNiche)}
        >
          {isFinding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
          +Batch
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-7 gap-1.5 text-xs"
          disabled={!activeNiche || isEnriching}
          onClick={() => activeNiche && onEnrichLeads?.(activeNiche)}
        >
          {isEnriching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          Enrich
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-7 gap-1.5 text-xs"
          disabled={!activeNiche}
          onClick={() => activeNiche && onScoreLeads?.(activeNiche)}
        >
          <Target className="w-3.5 h-3.5" />
          Score
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-7 gap-1.5 text-xs"
          disabled={!activeNiche}
          onClick={() => activeNiche && onDraftAll?.(activeNiche)}
        >
          <Mail className="w-3.5 h-3.5" />
          Draft
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-7 gap-1.5 text-xs"
          disabled={!activeNiche}
          onClick={() => activeNiche && onExportNiche?.(activeNiche)}
        >
          <Download className="w-3.5 h-3.5" />
          Export
        </Button>
      </div>

      {/* Lead Pipeline (full area) */}
      <LeadPipeline
        leads={filteredLeads}
        onUpdateStatus={onUpdateStatus}
        onDraftEmail={onDraftEmail}
        onExportCSV={onExportCSV}
        outreachCount={filteredOutreach.length}
        onSelectLead={onSelectLead}
        onFindLookalikes={onFindLookalikes}
      />
    </div>
  );
}

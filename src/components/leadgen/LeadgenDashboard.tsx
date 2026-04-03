import { useState, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Clock } from "lucide-react";
import { LeadPipeline } from "./LeadPipeline";
import { ActivityLog } from "./ActivityLog";
import { NicheFunnelMap } from "./NicheFunnelMap";
import type { SavedLead, LeadStatus, OutreachEntry, NicheEntry } from "./useLeadsCRUD";
import type { Lead } from "./LeadCard";

interface NicheLeadLike {
  niche_tag?: string | null;
}

interface LeadgenDashboardProps {
  leads: SavedLead[];
  outreach: OutreachEntry[];
  activeNiche: string | null;
  onSelectNiche: (niche: string | null) => void;
  nicheLeads: NicheLeadLike[];
  savedNiches?: NicheEntry[];
  onUpdateStatus: (id: string, status: LeadStatus) => void;
  onDraftEmail: (lead: Lead) => void;
  onExportCSV: () => void;
  onFindLeads?: (niche: string) => void;
  onEnrichLeads?: (niche: string) => void;
  onScoreLeads?: (niche: string) => void;
  onDraftAll?: (niche: string) => void;
  onExportNiche?: (niche: string) => void;
  isFinding?: boolean;
  isEnriching?: boolean;
  onSelectLead?: (lead: SavedLead) => void;
}

export function LeadgenDashboard({
  leads,
  outreach,
  activeNiche,
  onSelectNiche,
  nicheLeads,
  savedNiches,
  onUpdateStatus,
  onDraftEmail,
  onExportCSV,
  onFindLeads,
  onEnrichLeads,
  onScoreLeads,
  onDraftAll,
  onExportNiche,
  isFinding,
  isEnriching,
}: LeadgenDashboardProps) {
  const [tab, setTab] = useState("pipeline");

  const filteredLeads = useMemo(() => {
    if (!activeNiche) return leads;
    return leads.filter((l) => (l.niche_tag || "Uncategorized") === activeNiche);
  }, [leads, activeNiche]);

  const filteredOutreach = useMemo(() => {
    if (!activeNiche) return outreach;
    const nicheLeadIds = new Set(filteredLeads.map((l) => l.id));
    return outreach.filter((o) => nicheLeadIds.has(o.lead_id));
  }, [outreach, activeNiche, filteredLeads]);

  return (
    <div className="flex flex-col flex-1 min-w-0 h-full">
      {/* Funnel Map */}
      <NicheFunnelMap
        leads={nicheLeads}
        savedNiches={savedNiches}
        activeNiche={activeNiche}
        onSelectNiche={onSelectNiche}
        onFindLeads={onFindLeads}
        onEnrichLeads={onEnrichLeads}
        onScoreLeads={onScoreLeads}
        onDraftAll={onDraftAll}
        onExportNiche={onExportNiche}
        isFinding={isFinding}
        isEnriching={isEnriching}
      />

      {/* Pipeline / Activity tabs */}
      <Tabs value={tab} onValueChange={setTab} className="flex flex-col flex-1 min-h-0">
        <div className="border-b border-border/40 bg-card/30 px-4 shrink-0 flex items-center gap-3">
          <TabsList className="bg-transparent h-10 gap-1">
            <TabsTrigger value="pipeline" className="gap-1.5 text-xs data-[state=active]:bg-primary/10">
              <BarChart3 className="w-3.5 h-3.5" /> Pipeline
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-1.5 text-xs data-[state=active]:bg-primary/10">
              <Clock className="w-3.5 h-3.5" /> Activity
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="pipeline" className="flex-1 m-0 overflow-hidden">
          <LeadPipeline
            leads={filteredLeads}
            onUpdateStatus={onUpdateStatus}
            onDraftEmail={onDraftEmail}
            onExportCSV={onExportCSV}
            outreachCount={filteredOutreach.length}
          />
        </TabsContent>

        <TabsContent value="activity" className="flex-1 m-0 overflow-hidden">
          <ActivityLog entries={filteredOutreach} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

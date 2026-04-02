import { useState, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Clock } from "lucide-react";
import { LeadPipeline } from "./LeadPipeline";
import { ActivityLog } from "./ActivityLog";
import type { SavedLead, LeadStatus, OutreachEntry } from "./useLeadsCRUD";
import type { Lead } from "./LeadCard";

interface LeadgenDashboardProps {
  leads: SavedLead[];
  outreach: OutreachEntry[];
  activeNiche: string | null;
  onUpdateStatus: (id: string, status: LeadStatus) => void;
  onDraftEmail: (lead: Lead) => void;
  onExportCSV: () => void;
}

export function LeadgenDashboard({
  leads,
  outreach,
  activeNiche,
  onUpdateStatus,
  onDraftEmail,
  onExportCSV,
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
      <Tabs value={tab} onValueChange={setTab} className="flex flex-col h-full">
        <div className="border-b border-border/40 bg-card/30 px-4 shrink-0 flex items-center gap-3">
          <TabsList className="bg-transparent h-10 gap-1">
            <TabsTrigger value="pipeline" className="gap-1.5 text-xs data-[state=active]:bg-primary/10">
              <BarChart3 className="w-3.5 h-3.5" /> Pipeline
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-1.5 text-xs data-[state=active]:bg-primary/10">
              <Clock className="w-3.5 h-3.5" /> Activity
            </TabsTrigger>
          </TabsList>
          {activeNiche && (
            <span className="text-xs text-primary font-medium truncate max-w-[200px]">
              → {activeNiche}
            </span>
          )}
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

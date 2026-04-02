import { useState, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Clock, Search, UserCheck, Mail, Download, Loader2, Target } from "lucide-react";
import { LeadPipeline } from "./LeadPipeline";
import { ActivityLog } from "./ActivityLog";
import type { SavedLead, LeadStatus, OutreachEntry } from "./useLeadsCRUD";
import type { Lead } from "./LeadCard";

interface LeadgenDashboardProps {
  leads: SavedLead[];
  outreach: OutreachEntry[];
  activeNiche: string | null;
  activeNicheDescription?: string | null;
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
}

export function LeadgenDashboard({
  leads,
  outreach,
  activeNiche,
  activeNicheDescription,
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

  const leadCount = filteredLeads.length;

  return (
    <div className="flex flex-col flex-1 min-w-0 h-full">
      {/* ICP Action Bar — shown when a niche is selected */}
      {activeNiche && (
        <div className="border-b border-border/40 bg-card/40 px-4 py-2.5 shrink-0">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                <Target className="w-3.5 h-3.5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">{activeNiche}</p>
                {activeNicheDescription && (
                  <p className="text-xs text-muted-foreground truncate max-w-xs">{activeNicheDescription}</p>
                )}
              </div>
              <Badge variant="secondary" className="text-xs px-1.5 py-0 shrink-0">
                {leadCount} leads
              </Badge>
            </div>

            <div className="flex items-center gap-1.5 ml-auto flex-wrap">
              <Button
                variant="default"
                size="sm"
                className="h-7 text-xs gap-1.5"
                onClick={() => onFindLeads?.(activeNiche)}
                disabled={isFinding}
              >
                {isFinding ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
                Find Leads
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1.5"
                onClick={() => onEnrichLeads?.(activeNiche)}
                disabled={isEnriching || leadCount === 0}
              >
                {isEnriching ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserCheck className="w-3 h-3" />}
                Enrich
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1.5"
                onClick={() => onScoreLeads?.(activeNiche)}
                disabled={leadCount === 0}
              >
                <BarChart3 className="w-3 h-3" />
                Score
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1.5"
                onClick={() => onDraftAll?.(activeNiche)}
                disabled={leadCount === 0}
              >
                <Mail className="w-3 h-3" />
                Draft
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1.5 text-muted-foreground"
                onClick={() => onExportNiche?.(activeNiche)}
                disabled={leadCount === 0}
              >
                <Download className="w-3 h-3" />
                CSV
              </Button>
            </div>
          </div>
        </div>
      )}

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

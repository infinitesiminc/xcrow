import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, MessageSquare, Clock } from "lucide-react";
import { LeadPipeline } from "./LeadPipeline";
import { ActivityLog } from "./ActivityLog";
import type { SavedLead, LeadStatus, OutreachEntry } from "./useLeadsCRUD";
import type { Lead } from "./LeadCard";

interface LeadgenDashboardProps {
  leads: SavedLead[];
  outreach: OutreachEntry[];
  onUpdateStatus: (id: string, status: LeadStatus) => void;
  onDraftEmail: (lead: Lead) => void;
  onExportCSV: () => void;
  chatContent: React.ReactNode;
  defaultTab?: string;
}

export function LeadgenDashboard({
  leads,
  outreach,
  onUpdateStatus,
  onDraftEmail,
  onExportCSV,
  chatContent,
  defaultTab = "pipeline",
}: LeadgenDashboardProps) {
  const [tab, setTab] = useState(defaultTab);

  return (
    <div className="flex flex-col h-full">
      <Tabs value={tab} onValueChange={setTab} className="flex flex-col h-full">
        <div className="border-b border-border/40 bg-card/30 px-4 shrink-0">
          <TabsList className="bg-transparent h-10 gap-1">
            <TabsTrigger value="pipeline" className="gap-1.5 text-xs data-[state=active]:bg-primary/10">
              <BarChart3 className="w-3.5 h-3.5" /> Pipeline
            </TabsTrigger>
            <TabsTrigger value="chat" className="gap-1.5 text-xs data-[state=active]:bg-primary/10">
              <MessageSquare className="w-3.5 h-3.5" /> Chat
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-1.5 text-xs data-[state=active]:bg-primary/10">
              <Clock className="w-3.5 h-3.5" /> Activity
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="pipeline" className="flex-1 m-0 overflow-hidden">
          <LeadPipeline
            leads={leads}
            onUpdateStatus={onUpdateStatus}
            onDraftEmail={onDraftEmail}
            onExportCSV={onExportCSV}
            outreachCount={outreach.length}
          />
        </TabsContent>

        <TabsContent value="chat" className="flex-1 m-0 overflow-hidden">
          {chatContent}
        </TabsContent>

        <TabsContent value="activity" className="flex-1 m-0 overflow-hidden">
          <ActivityLog entries={outreach} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

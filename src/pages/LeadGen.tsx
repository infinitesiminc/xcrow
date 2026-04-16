import { useState, useMemo, useCallback, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { LeadGenSidebar } from "@/components/leadgen/LeadGenSidebar";
import { parseReportText, type ParsedReport } from "@/components/leadgen/ResearchSection";
import LeadsTableSection from "@/components/leadgen/LeadsTableSection";
import { useLeadsCRUD, type SavedLead } from "@/components/leadgen/useLeadsCRUD";
import { useWorkspaces } from "@/hooks/use-workspaces";
import { DockedChat } from "@/components/leadgen/DockedChat";
import { PipelineChat, type PersonaPrefill } from "@/components/leadgen/PipelineChat";
import { DraftEmailModal } from "@/components/leadgen/DraftEmailModal";
import { NetworkManager } from "@/components/leadgen/NetworkManager";
import { WarmPathDrawer } from "@/components/leadgen/WarmPathDrawer";

export default function LeadGen() {
  const { user } = useAuth();
  const [domain, setDomain] = useState("");
  const [draftLead, setDraftLead] = useState<SavedLead | null>(null);
  const [warmPathLead, setWarmPathLead] = useState<SavedLead | null>(null);
  const [networkOpen, setNetworkOpen] = useState(false);
  const [pendingPersona, setPendingPersona] = useState<PersonaPrefill | null>(null);
  const [restoredReport, setRestoredReport] = useState<ParsedReport | null>(null);

  const workspaceKey = useMemo(
    () => domain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "") || "default",
    [domain],
  );
  const { workspaces, upsertWorkspace, touchWorkspace, deleteWorkspace } = useWorkspaces(user?.id);
  const { leads, outreach, upsertLeads, updateLeadStatus, deleteLead, exportCSV } = useLeadsCRUD(user?.id, workspaceKey);

  /* Restore latest workspace report on mount */
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await (supabase.from("research_jobs") as any)
        .select("domain, status, report_text")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      if (data?.domain && data.status === "complete") {
        setDomain(data.domain);
        if (data.report_text) setRestoredReport(parseReportText(data.report_text));
      }
    })();
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelectWorkspace = useCallback(async (key: string) => {
    if (!user) return;
    setDomain(key);
    setRestoredReport(null);
    touchWorkspace(key);
    const { data } = await (supabase.from("research_jobs") as any)
      .select("report_text")
      .eq("user_id", user.id)
      .eq("domain", key)
      .eq("status", "complete")
      .order("completed_at", { ascending: false })
      .limit(1)
      .single();
    if (data?.report_text) setRestoredReport(parseReportText(data.report_text));
  }, [user, touchWorkspace]);

  const handleNewResearch = useCallback(() => {
    setDomain("");
    setRestoredReport(null);
  }, []);

  const handleDeleteWorkspace = useCallback(async (key: string) => {
    await deleteWorkspace(key);
    if (workspaceKey === key) {
      setDomain("");
      setRestoredReport(null);
    }
  }, [deleteWorkspace, workspaceKey]);

  const handleRerunWorkspace = useCallback((key: string) => {
    setDomain(key);
    setRestoredReport(null);
  }, []);

  const handleFindLookalikes = useCallback((lead: SavedLead) => {
    const title = lead.title || "VP";
    const company = lead.company || "";
    setPendingPersona({
      personaTitle: `Lookalikes of ${lead.name}`,
      titles: [title],
      painPoints: [],
      buyingTriggers: [`Find 20 people with similar title "${title}" at other companies (exclude ${company}).`],
    });
  }, []);

  const handleDraftEmail = useCallback((lead: SavedLead) => {
    setDraftLead(lead);
  }, []);

  const showRightPanel = leads.length > 0;

  return (
    <>
      <Helmet>
        <title>Xcrow Lead Gen — AI Research Pipeline</title>
        <meta name="description" content="Chat with the Xcrow co-pilot to research a company, identify decision-makers, and source qualified leads end-to-end." />
      </Helmet>
      <Navbar />
      <div className="overflow-hidden">
        <SidebarProvider defaultOpen={false}>
          <div className="h-[calc(100vh-56px)] flex w-full overflow-hidden">
            <LeadGenSidebar
              activeSection="research"
              onSelectSection={() => {}}
              websiteUrl={domain || undefined}
              personaCount={restoredReport?.personas.length || 0}
              leadCount={leads.length}
              outreachCount={outreach.length}
              researchComplete={!!restoredReport}
              workspaces={workspaces}
              activeWorkspaceKey={workspaceKey !== "default" ? workspaceKey : undefined}
              onSelectWorkspace={handleSelectWorkspace}
              onNewResearch={handleNewResearch}
              onDeleteWorkspace={handleDeleteWorkspace}
              onRerunWorkspace={handleRerunWorkspace}
              onOpenNetwork={() => setNetworkOpen(true)}
            />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
              <header className="h-12 flex items-center border-b border-border px-4 shrink-0">
                <SidebarTrigger className="mr-3" />
                <span className="text-sm font-medium">Lead Gen Co-pilot</span>
                {workspaceKey !== "default" && (
                  <span className="ml-2 text-xs text-muted-foreground font-mono">— {workspaceKey}</span>
                )}
              </header>

              <DockedChat
                chat={
                  <PipelineChat
                    context={{
                      workspaceKey,
                      leadCount: leads.length,
                      initialReport: restoredReport,
                    }}
                    actions={{
                      onLeadsFound: (newLeads) => upsertLeads(newLeads),
                      onDomainConfirmed: (d) => setDomain(d),
                      onResearchComplete: (report, d) => {
                        setRestoredReport(report);
                        upsertWorkspace(d.toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, ""), d);
                      },
                    }}
                    pendingPersona={pendingPersona}
                    onPersonaConsumed={() => setPendingPersona(null)}
                  />
                }
                right={
                  showRightPanel ? (
                    <div className="px-6 pt-6 pb-2">
                      <div className="max-w-4xl mx-auto">
                        <LeadsTableSection
                          leads={leads}
                          outreach={outreach}
                          onUpdateStatus={updateLeadStatus}
                          onDeleteLead={deleteLead}
                          onExportCSV={exportCSV}
                          onDraftEmail={handleDraftEmail}
                          onFindLookalikes={handleFindLookalikes}
                          onWarmPath={(l) => setWarmPathLead(l)}
                          userId={user?.id}
                        />
                      </div>
                    </div>
                  ) : undefined
                }
              />
            </div>

            <DraftEmailModal
              lead={draftLead}
              open={!!draftLead}
              onOpenChange={open => { if (!open) setDraftLead(null); }}
              userId={user?.id}
              workspaceKey={workspaceKey !== "default" ? workspaceKey : undefined}
            />

            <NetworkManager
              open={networkOpen}
              onOpenChange={setNetworkOpen}
              workspaceKey={workspaceKey}
              userId={user?.id}
            />

            <WarmPathDrawer
              lead={warmPathLead}
              open={!!warmPathLead}
              onOpenChange={open => { if (!open) setWarmPathLead(null); }}
              workspaceKey={workspaceKey}
              onUsePath={(lead) => {
                setWarmPathLead(null);
                setDraftLead(lead);
              }}
            />
          </div>
        </SidebarProvider>
      </div>
    </>
  );
}

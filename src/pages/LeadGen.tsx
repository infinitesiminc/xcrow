import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { LeadGenSidebar } from "@/components/leadgen/LeadGenSidebar";
import ResearchSection, { useResearchStream, parseReportText, type ParsedPersona } from "@/components/leadgen/ResearchSection";
import { ResearchSummaryCard } from "@/components/leadgen/ResearchSummaryCard";
import PersonasSection from "@/components/leadgen/PersonasSection";
import LeadsTableSection from "@/components/leadgen/LeadsTableSection";
import { useLeadsCRUD, type SavedLead } from "@/components/leadgen/useLeadsCRUD";
import { useWorkspaces } from "@/hooks/use-workspaces";
import { DockedChat } from "@/components/leadgen/DockedChat";
import { PipelineChat, type PersonaPrefill } from "@/components/leadgen/PipelineChat";
import { DraftEmailModal } from "@/components/leadgen/DraftEmailModal";

export default function LeadGen() {
  const { user } = useAuth();
  const [domain, setDomain] = useState("");
  const [loadingPersona, setLoadingPersona] = useState<string | null>(null);
  const [draftLead, setDraftLead] = useState<SavedLead | null>(null);
  const [pendingPersona, setPendingPersona] = useState<PersonaPrefill | null>(null);

  const research = useResearchStream();
  const workspaceKey = useMemo(() => domain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "") || "default", [domain]);
  const { workspaces, upsertWorkspace, touchWorkspace, deleteWorkspace } = useWorkspaces(user?.id);
  const { leads, outreach, loading: leadsLoading, upsertLeads, updateLeadStatus, deleteLead, exportCSV, refetch } = useLeadsCRUD(user?.id, workspaceKey);

  const leadCountByPersona = useMemo(() => {
    const map: Record<string, number> = {};
    for (const l of leads) {
      if (l.persona_tag) map[l.persona_tag] = (map[l.persona_tag] || 0) + 1;
    }
    return map;
  }, [leads]);

  const icpContext = useMemo(() => {
    if (!research.report) return undefined;
    const r = research.report;
    const lines: string[] = [];
    if (r.companySummary) lines.push(`Company: ${r.companySummary}`);
    if (r.personas.length > 0) {
      lines.push("ICP Personas:");
      for (const p of r.personas) {
        lines.push(`- ${p.title}`);
        if (p.titles.length > 0) lines.push(`  Search titles: ${p.titles.join(", ")}`);
        if (p.painPoints.length > 0) lines.push(`  Pain points: ${p.painPoints.join("; ")}`);
        if (p.buyingTriggers.length > 0) lines.push(`  Buying triggers: ${p.buyingTriggers.join("; ")}`);
      }
    }
    if (r.prospectDomains.length > 0) lines.push(`Target domains: ${r.prospectDomains.slice(0, 10).join(", ")}`);
    if (r.industryKeywords?.length) lines.push(`Industry keywords: ${r.industryKeywords.join(", ")}`);
    return lines.join("\n");
  }, [research.report]);

  // On mount: resume latest in-flight job
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await (supabase.from("research_jobs") as any)
        .select("domain, status")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      if (data?.domain && ["pending", "processing"].includes(data.status)) {
        setDomain(data.domain);
        await research.resumeIfRunning(user.id, data.domain);
      }
    })();
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-create workspace when research completes
  useEffect(() => {
    if (research.isComplete && research.report && domain.trim()) {
      upsertWorkspace(workspaceKey, domain.trim());
    }
  }, [research.isComplete]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelectWorkspace = useCallback(async (key: string) => {
    if (!user) return;
    setDomain(key);
    touchWorkspace(key);
    const resumed = await research.resumeIfRunning(user.id, key);
    if (resumed) return;
    const { data } = await (supabase.from("research_jobs") as any)
      .select("report_text, domain")
      .eq("user_id", user.id)
      .eq("domain", key)
      .eq("status", "complete")
      .order("completed_at", { ascending: false })
      .limit(1)
      .single();
    if (data?.report_text) {
      research.restore(parseReportText(data.report_text));
    } else {
      research.forceReset();
    }
  }, [user, touchWorkspace, research]);

  const handleNewResearch = useCallback(() => {
    setDomain("");
    research.forceReset();
  }, [research]);

  const handleDeleteWorkspace = useCallback(async (key: string) => {
    await deleteWorkspace(key);
    if (workspaceKey === key) {
      setDomain("");
      research.forceReset();
    }
  }, [deleteWorkspace, workspaceKey, research]);

  const handleRerunWorkspace = useCallback((key: string) => {
    setDomain(key);
    research.forceReset();
    setTimeout(() => research.start(key), 100);
  }, [research]);

  const handleFindLeadsChat = useCallback((persona: ParsedPersona) => {
    setPendingPersona({
      personaTitle: persona.title,
      titles: persona.titles,
      painPoints: persona.painPoints,
      buyingTriggers: persona.buyingTriggers,
    });
  }, []);

  const handleDraftEmail = useCallback((lead: SavedLead) => {
    setDraftLead(lead);
  }, []);

  const handleStartResearch = useCallback(() => {
    if (domain.trim()) research.start(domain.trim());
  }, [domain, research]);

  // Determine what to show inline for research
  const showResearchInput = research.isInitial || research.running || (!!research.error && !research.running);
  const showResearchSummary = research.isComplete && !!research.report;

  return (
    <>
      <Helmet>
        <title>Xcrow Lead Gen — AI Research Pipeline</title>
        <meta name="description" content="Enter a company URL and get deep AI research — market position, buyer personas, competitors, and pipeline targets." />
      </Helmet>
      <Navbar />
      <div className="pt-14">
        <SidebarProvider defaultOpen={false}>
          <div className="min-h-[calc(100vh-56px)] flex w-full">
            <LeadGenSidebar
              activeSection="research"
              onSelectSection={() => {}}
              websiteUrl={domain || undefined}
              personaCount={research.report?.personas.length || 0}
              leadCount={leads.length}
              outreachCount={outreach.length}
              researchComplete={research.isComplete}
              workspaces={workspaces}
              activeWorkspaceKey={workspaceKey !== "default" ? workspaceKey : undefined}
              onSelectWorkspace={handleSelectWorkspace}
              onNewResearch={handleNewResearch}
              onDeleteWorkspace={handleDeleteWorkspace}
              onRerunWorkspace={handleRerunWorkspace}
            />

            {/* Main scrollable dashboard */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
              <header className="h-12 flex items-center border-b border-border px-4 shrink-0">
                <SidebarTrigger className="mr-3" />
                <span className="text-sm font-medium">Dashboard</span>
                {workspaceKey !== "default" && (
                  <span className="ml-2 text-xs text-muted-foreground font-mono">— {workspaceKey}</span>
                )}
              </header>
              <div className="flex-1 flex min-h-0 overflow-hidden">
                {/* Docked chat panel — LEFT */}
                <DockedChat>
                  <PipelineChat
                    context={{
                      workspaceKey,
                      activeSection: "research",
                      researchStatus: research.running ? "running" : research.isComplete ? "complete" : "not_started",
                      personaCount: research.report?.personas.length || 0,
                      personaNames: research.report?.personas.map(p => p.title) || [],
                      leadCount: leads.length,
                      leadsWithoutEmail: leads.filter(l => !l.email).length,
                      icpContext,
                    }}
                    actions={{
                      onNavigate: () => {},
                      onFindLeads: (personaTitle) => {
                        const persona = research.report?.personas.find(p => p.title === personaTitle);
                        if (persona) handleFindLeadsChat(persona);
                      },
                      onDraftEmail: (leadName) => {
                        const lead = leads.find(l => l.name.toLowerCase().includes(leadName.toLowerCase()));
                        if (lead) setDraftLead(lead);
                      },
                      onExportCSV: exportCSV,
                      onStartResearch: (d) => {
                        setDomain(d);
                        research.start(d);
                      },
                    }}
                    pendingPersona={pendingPersona}
                    onPersonaConsumed={() => setPendingPersona(null)}
                  />
                </DockedChat>

                {/* Main scrollable dashboard — RIGHT */}
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="max-w-4xl mx-auto space-y-6">
                    {showResearchInput && (
                      <ResearchSection
                        domain={domain}
                        onDomainChange={setDomain}
                        onStart={handleStartResearch}
                        phases={research.phases}
                        elapsed={research.elapsed}
                        running={research.running}
                        error={research.error}
                        isComplete={research.isComplete}
                        isInitial={research.isInitial}
                        report={research.report}
                      />
                    )}

                    {showResearchSummary && (
                      <ResearchSummaryCard report={research.report!} elapsed={research.elapsed} />
                    )}

                    {research.isComplete && research.report && (
                      <PersonasSection
                        report={research.report}
                        leadCountByPersona={leadCountByPersona}
                        onFindLeads={handleFindLeadsChat}
                        loadingPersona={loadingPersona}
                      />
                    )}

                    {research.isComplete && (
                      <LeadsTableSection
                        leads={leads}
                        outreach={outreach}
                        onUpdateStatus={updateLeadStatus}
                        onDeleteLead={deleteLead}
                        onExportCSV={exportCSV}
                        onDraftEmail={handleDraftEmail}
                        userId={user?.id}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>

            <DraftEmailModal
              lead={draftLead}
              open={!!draftLead}
              onOpenChange={open => { if (!open) setDraftLead(null); }}
              userId={user?.id}
              workspaceKey={workspaceKey !== "default" ? workspaceKey : undefined}
            />
          </div>
        </SidebarProvider>
      </div>
    </>
  );
}

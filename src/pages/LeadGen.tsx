import { useState, useMemo, useCallback, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { LeadGenSidebar, type SidebarSection } from "@/components/leadgen/LeadGenSidebar";
import ResearchSection, { useResearchStream, parseReportText, type ParsedPersona } from "@/components/leadgen/ResearchSection";
import PersonasSection from "@/components/leadgen/PersonasSection";
import LeadsTableSection from "@/components/leadgen/LeadsTableSection";
import { useLeadsCRUD, type SavedLead } from "@/components/leadgen/useLeadsCRUD";
import { useWorkspaces } from "@/hooks/use-workspaces";
import { FloatingChat } from "@/components/leadgen/FloatingChat";
import { PipelineChat, type PipelineChatContext, type PipelineChatActions } from "@/components/leadgen/PipelineChat";
import { DraftEmailModal } from "@/components/leadgen/DraftEmailModal";

/* ══════════════════════════════════════════════════════════
   Main LeadGen Page
   ══════════════════════════════════════════════════════════ */
export default function LeadGen() {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<SidebarSection>("research");
  const [domain, setDomain] = useState("");
  const [loadingPersona, setLoadingPersona] = useState<string | null>(null);
  const [draftLead, setDraftLead] = useState<SavedLead | null>(null);

  // Research
  const research = useResearchStream();

  // Workspace key derived from domain
  const workspaceKey = useMemo(() => domain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "") || "default", [domain]);
  const { workspaces, upsertWorkspace, touchWorkspace, deleteWorkspace } = useWorkspaces(user?.id);

  // Leads CRUD
  const { leads, outreach, loading: leadsLoading, upsertLeads, updateLeadStatus, deleteLead, exportCSV, refetch } = useLeadsCRUD(user?.id, workspaceKey);

  // Lead count by persona
  const leadCountByPersona = useMemo(() => {
    const map: Record<string, number> = {};
    for (const l of leads) {
      if (l.persona_tag) map[l.persona_tag] = (map[l.persona_tag] || 0) + 1;
    }
    return map;
  }, [leads]);

  // On mount: resume only the latest still-valid in-flight job
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
        const resumed = await research.resumeIfRunning(user.id, data.domain);
        if (resumed) setActiveSection("research");
      }
    })();
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-navigate to personas when research completes & create workspace
  useEffect(() => {
    if (research.isComplete && research.report && activeSection === "research") {
      setActiveSection("personas");
      if (domain.trim()) {
        upsertWorkspace(workspaceKey, domain.trim());
      }
    }
  }, [research.isComplete]); // eslint-disable-line react-hooks/exhaustive-deps

  // Restore workspace: load cached report from research_jobs
  const handleSelectWorkspace = useCallback(async (key: string) => {
    if (!user) return;
    setDomain(key);
    touchWorkspace(key);

    // First check if there's an active research job running for this domain
    const resumed = await research.resumeIfRunning(user.id, key);
    if (resumed) {
      setActiveSection("research");
      return;
    }

    // Otherwise load cached completed report
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
      setActiveSection("personas");
    } else {
      research.forceReset();
      setActiveSection("research");
    }
  }, [user, touchWorkspace, research]);

  // New research: clear state
  const handleNewResearch = useCallback(() => {
    setDomain("");
    research.forceReset();
    setActiveSection("research");
  }, [research]);

  // Delete workspace
  const handleDeleteWorkspace = useCallback(async (key: string) => {
    await deleteWorkspace(key);
    if (workspaceKey === key) {
      setDomain("");
      research.forceReset();
      setActiveSection("research");
    }
  }, [deleteWorkspace, workspaceKey, research]);

  // Re-run research for a workspace
  const handleRerunWorkspace = useCallback((key: string) => {
    setDomain(key);
    research.forceReset();
    setActiveSection("research");
    setTimeout(() => research.start(key), 100);
  }, [research]);

  // Find leads for a persona via Apollo
  const handleFindLeads = useCallback(async (persona: ParsedPersona) => {
    if (!user || loadingPersona) return;
    setLoadingPersona(persona.title);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const { data: { session } } = await supabase.auth.getSession();

      // Filter out overly-specific titles that Apollo can't match
      const usableTitles = persona.titles
        .filter(t => t.length <= 40 && !t.includes("/") && !t.includes("(") && !t.includes(" - "))
        .slice(0, 5);
      
      // If all titles were filtered out, use generic decision-maker titles
      const searchTitles = usableTitles.length > 0
        ? usableTitles
        : ["VP of Sales", "Director of Business Development", "Chief Revenue Officer", "VP of Operations", "Director of Procurement"];

      const resp = await fetch(`${supabaseUrl}/functions/v1/search-apollo`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session?.access_token ?? supabaseKey}`, "apikey": supabaseKey },
        body: JSON.stringify({
          search_mode: "people",
          person_titles: searchTitles,
          person_seniorities: ["director", "vp", "c_suite", "owner"],
          organization_locations: ["United States"],
          per_page: 10,
        }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        console.error("Apollo search error:", errData);
        throw new Error(`HTTP ${resp.status}: ${errData.error || "Unknown"}`);
      }
      const data = await resp.json();
      const people = data.people || [];
      console.log(`Apollo returned ${people.length} people for persona "${persona.title}"`);

      if (people.length > 0) {
        const newLeads = people.map((p: any) => ({
          name: p.name,
          title: p.title,
          company: p.company,
          email: p.email,
          linkedin: p.linkedin,
          phone: p.phone,
          photo_url: p.photo_url,
          apollo_id: p.apollo_id,
          address: p.address,
          source: "apollo",
          persona_tag: persona.title,
          reason: `Matched persona: ${persona.title}`,
        }));
        await upsertLeads(newLeads);

        await refetch();
      }
    } catch (e) {
      console.error("Apollo search failed:", e);
    } finally {
      setLoadingPersona(null);
    }
  }, [user, loadingPersona, research.report, upsertLeads, refetch, workspaceKey]);

  const handleDraftEmail = useCallback((lead: SavedLead) => {
    setDraftLead(lead);
  }, []);

  // Enrichment removed — leads arrive with full contact data from Apollo

  const handleStartResearch = useCallback(() => {
    if (domain.trim()) research.start(domain.trim());
  }, [domain, research]);

  const renderSection = () => {
    switch (activeSection) {
      case "research":
        return (
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
        );
      case "personas":
        return (
          <PersonasSection
            report={research.report}
            leadCountByPersona={leadCountByPersona}
            onFindLeads={handleFindLeads}
            loadingPersona={loadingPersona}
          />
        );
      case "leads":
        return (
          <LeadsTableSection
            leads={leads}
            outreach={outreach}
            onUpdateStatus={updateLeadStatus}
            onDeleteLead={deleteLead}
            onExportCSV={exportCSV}
            onDraftEmail={handleDraftEmail}
            userId={user?.id}
          />
        );
    }
  };

  return (
    <>
      <Helmet>
        <title>Xcrow Lead Gen — AI Research Pipeline</title>
        <meta name="description" content="Enter a company URL and get deep AI research — market position, buyer personas, competitors, and pipeline targets." />
      </Helmet>
      <Navbar />
      <div className="pt-14">
        <SidebarProvider>
          <div className="min-h-[calc(100vh-56px)] flex w-full">
            <LeadGenSidebar
              activeSection={activeSection}
              onSelectSection={setActiveSection}
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

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
              <header className="h-12 flex items-center border-b border-border px-4 shrink-0">
                <SidebarTrigger className="mr-3" />
                <span className="text-sm font-medium capitalize">{activeSection}</span>
                {workspaceKey !== "default" && (
                  <span className="ml-2 text-xs text-muted-foreground font-mono">
                    — {workspaceKey}
                  </span>
                )}
              </header>
              <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-5xl mx-auto">
                  {renderSection()}
                </div>
              </div>
            </div>

            <FloatingChat>
              <PipelineChat
                context={{
                  workspaceKey,
                  activeSection,
                  researchStatus: research.running ? "running" : research.isComplete ? "complete" : "not_started",
                  personaCount: research.report?.personas.length || 0,
                  personaNames: research.report?.personas.map(p => p.title) || [],
                  leadCount: leads.length,
                  leadsWithoutEmail: leads.filter(l => !l.email).length,
                }}
                actions={{
                  onNavigate: (section) => setActiveSection(section as SidebarSection),
                  onFindLeads: (personaTitle) => {
                    const persona = research.report?.personas.find(p => p.title === personaTitle);
                    if (persona) handleFindLeads(persona);
                  },
                  onDraftEmail: (leadName) => {
                    const lead = leads.find(l => l.name.toLowerCase().includes(leadName.toLowerCase()));
                    if (lead) setDraftLead(lead);
                  },
                  onExportCSV: exportCSV,
                  onStartResearch: (domain) => {
                    setDomain(domain);
                    research.start(domain);
                  },
                }}
              />
            </FloatingChat>

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

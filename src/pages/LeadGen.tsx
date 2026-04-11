import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { Bot, User, Loader2, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { parseSSEStream } from "@/lib/sse-parser";
import Navbar from "@/components/Navbar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { LeadGenSidebar, type SidebarSection } from "@/components/leadgen/LeadGenSidebar";
import ResearchSection, { useResearchStream, type ParsedPersona } from "@/components/leadgen/ResearchSection";
import PersonasSection from "@/components/leadgen/PersonasSection";
import LeadsTableSection from "@/components/leadgen/LeadsTableSection";
import OutreachSection from "@/components/leadgen/OutreachSection";
import { useLeadsCRUD, type SavedLead } from "@/components/leadgen/useLeadsCRUD";
import { useWorkspaces } from "@/hooks/use-workspaces";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from "react-markdown";

/* ── Chat ── */
interface ChatMessage { role: "user" | "assistant"; content: string; }

function PipelineChat({ leadCount }: { leadCount: number }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        role: "assistant",
        content: leadCount > 0
          ? `You have **${leadCount} leads**. I can help find more, draft outreach, or analyze your pipeline.`
          : `Let's build your lead pipeline. Enter a company URL on the left to start ICP research.`,
      }]);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isStreaming) return;
    setMessages(prev => [...prev, { role: "user", content: text }]);
    setInput("");
    setIsStreaming(true);
    let buf = "";
    const upsert = (chunk: string) => {
      buf += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && prev.length > 1 && prev[prev.length - 2]?.role === "user") {
          return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: buf } : m);
        }
        return [...prev, { role: "assistant", content: buf }];
      });
    };
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const { data: { session } } = await supabase.auth.getSession();
      const resp = await fetch(`${supabaseUrl}/functions/v1/leadgen-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session?.access_token ?? supabaseKey}`, "apikey": supabaseKey },
        body: JSON.stringify({
          website: "xcrow.com",
          messages: [
            { role: "system", content: "You are the Xcrow Lead Gen assistant. Help find leads, draft outreach, analyze pipeline. Be concise." },
            ...messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
            { role: "user", content: text },
          ],
        }),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const reader = resp.body?.getReader();
      if (!reader) throw new Error("No body");
      await parseSSEStream(reader, { onTextDelta: upsert, onLeads: () => {}, onDone: () => {} });
    } catch { upsert("\n\n⚠️ Something went wrong."); }
    finally { setIsStreaming(false); inputRef.current?.focus(); }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border flex items-center gap-2 shrink-0">
        <Bot className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium">Assistant</span>
      </div>
      <ScrollArea className="flex-1 px-4 py-3">
        <div className="space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : ""}`}>
              {msg.role === "assistant" && (
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
              )}
              <div className={`rounded-lg px-3.5 py-2.5 max-w-[85%] text-sm ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted/60 text-foreground"}`}>
                {msg.role === "assistant" ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:my-1"><ReactMarkdown>{msg.content}</ReactMarkdown></div>
                ) : <p className="whitespace-pre-wrap">{msg.content}</p>}
              </div>
              {msg.role === "user" && (
                <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-4 h-4 text-primary-foreground" />
                </div>
              )}
            </div>
          ))}
          {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
            <div className="flex gap-2.5">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0"><Bot className="w-4 h-4 text-primary" /></div>
              <div className="bg-muted/60 rounded-lg px-3.5 py-2.5"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>
      <div className="border-t border-border p-3 shrink-0">
        <div className="flex gap-2">
          <Textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Ask anything..." className="min-h-[42px] max-h-[120px] resize-none text-sm" rows={1} />
          <Button size="icon" onClick={handleSend} disabled={!input.trim() || isStreaming} className="shrink-0 h-[42px] w-[42px]">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   Main LeadGen Page
   ══════════════════════════════════════════════════════════ */
export default function LeadGen() {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<SidebarSection>("research");
  const [domain, setDomain] = useState("");
  const [loadingPersona, setLoadingPersona] = useState<string | null>(null);

  // Research
  const research = useResearchStream();

  // Workspace key derived from domain
  const workspaceKey = useMemo(() => domain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "") || "default", [domain]);
  const { upsertWorkspace } = useWorkspaces(user?.id);

  // Leads CRUD
  const { leads, outreach, loading: leadsLoading, upsertLeads, updateLeadStatus, deleteLead, exportCSV } = useLeadsCRUD(user?.id, workspaceKey);

  // Lead count by persona
  const leadCountByPersona = useMemo(() => {
    const map: Record<string, number> = {};
    for (const l of leads) {
      if (l.persona_tag) map[l.persona_tag] = (map[l.persona_tag] || 0) + 1;
    }
    return map;
  }, [leads]);

  // Auto-navigate to personas when research completes
  useEffect(() => {
    if (research.isComplete && research.report && activeSection === "research") {
      setActiveSection("personas");
      // Upsert workspace
      if (domain.trim()) upsertWorkspace(workspaceKey, domain.trim());
    }
  }, [research.isComplete]); // eslint-disable-line react-hooks/exhaustive-deps

  // Find leads for a persona via Apollo
  const handleFindLeads = useCallback(async (persona: ParsedPersona) => {
    if (!user || loadingPersona) return;
    setLoadingPersona(persona.title);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const { data: { session } } = await supabase.auth.getSession();

      const domains = research.report?.prospectDomains?.slice(0, 10) || [];
      const resp = await fetch(`${supabaseUrl}/functions/v1/search-apollo`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session?.access_token ?? supabaseKey}`, "apikey": supabaseKey },
        body: JSON.stringify({
          person_titles: persona.titles.slice(0, 5),
          person_seniorities: ["director", "vp", "c_suite", "owner"],
          q_organization_domains: domains.length > 0 ? domains.join("\n") : undefined,
          per_page: 5,
        }),
      });

      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      const people = data.people || [];

      if (people.length > 0) {
        const newLeads = people.map((p: any) => ({
          name: p.name || `${p.first_name} ${p.last_name}`,
          title: p.title,
          company: p.organization?.name || p.organization_name,
          email: p.email,
          linkedin: p.linkedin_url,
          phone: p.phone_number,
          source: "apollo",
          persona_tag: persona.title,
          score: p.score,
          reason: `Matched persona: ${persona.title}`,
        }));
        await upsertLeads(newLeads);
      }
    } catch (e) {
      console.error("Apollo search failed:", e);
    } finally {
      setLoadingPersona(null);
    }
  }, [user, loadingPersona, research.report, upsertLeads]);

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
            onUpdateStatus={updateLeadStatus}
            onDeleteLead={deleteLead}
            onExportCSV={exportCSV}
          />
        );
      case "outreach":
        return <OutreachSection outreach={outreach} />;
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
            />

            <div className="flex-1 flex min-w-0">
              {/* Main panel */}
              <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <header className="h-12 flex items-center border-b border-border px-4 shrink-0">
                  <SidebarTrigger className="mr-3" />
                  <span className="text-sm font-medium capitalize">{activeSection}</span>
                </header>
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="max-w-4xl mx-auto">
                    {renderSection()}
                  </div>
                </div>
              </div>

              {/* Chat panel */}
              <div className="w-[380px] shrink-0 border-l border-border flex flex-col overflow-hidden hidden lg:flex">
                <PipelineChat leadCount={leads.length} />
              </div>
            </div>
          </div>
        </SidebarProvider>
      </div>
    </>
  );
}

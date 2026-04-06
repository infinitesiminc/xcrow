import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { parseSSEStream } from "@/lib/sse-parser";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Loader2, MessageSquare, Mail, Check, X, Users, Globe, Sparkles, ArrowRight, Target, MapPin, Copy } from "lucide-react";
import CrowHuntingLoader from "@/components/CrowHuntingLoader";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { LeadgenDashboard } from "@/components/leadgen/LeadgenDashboard";
import { useLeadsCRUD } from "@/components/leadgen/useLeadsCRUD";
import { LeadDetailDrawer } from "@/components/leadgen/LeadDetailDrawer";
import type { Lead } from "@/components/leadgen/LeadCard";
import type { SavedLead } from "@/components/leadgen/useLeadsCRUD";
import type { GTMTreeData } from "@/components/academy/gtm-types";
import type { DroppedCard } from "@/components/leadgen/TargetZone";
import { useWorkspaces } from "@/hooks/use-workspaces";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/leadgen-chat`;
const SCOUT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/leadgen-scout`;
const FETCH_TIMEOUT_MS = 120_000;

/** Fetch with automatic timeout via AbortSignal */
function fetchWithTimeout(url: string, opts: RequestInit & { timeout?: number } = {}): Promise<Response> {
  const { timeout = FETCH_TIMEOUT_MS, ...fetchOpts } = opts;
  const controller = new AbortController();
  const existingSignal = fetchOpts.signal;
  if (existingSignal) {
    existingSignal.addEventListener("abort", () => controller.abort());
  }
  const timer = setTimeout(() => controller.abort(), timeout);
  return fetch(url, { ...fetchOpts, signal: controller.signal }).finally(() => clearTimeout(timer));
}

type ChatItem =
  | { type: "user"; content: string }
  | { type: "assistant"; content: string }
  | { type: "leads"; leads: Lead[] };

const formatAssistantMessage = (text: string): string => {
  if (!text) return text;
  let result = text.replace(/\r\n/g, "\n").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n");
  const lines = result.split("\n");
  const optionRe = /^(?:[-*•]\s*)?(?:\d+[.)]\s*)?(\*\*[^*]+\*\*|[A-Z][A-Za-z0-9&/',()+\s]{2,120})\s*(?:—|–|--)\s+.+$/;
  const optionIndexes: number[] = [];
  lines.forEach((line, i) => { if (optionRe.test(line.trim())) optionIndexes.push(i); });
  if (optionIndexes.length >= 2) {
    let n = 1;
    for (const idx of optionIndexes) {
      const cleaned = lines[idx].trim().replace(/^[-*•]\s*/, "").replace(/^\d+[.)]\s*/, "");
      lines[idx] = `${n++}. ${cleaned}`;
    }
    const firstIdx = optionIndexes[0];
    if (firstIdx > 0 && lines[firstIdx - 1].trim() !== "") lines.splice(firstIdx, 0, "");
    const lastIdx = optionIndexes[optionIndexes.length - 1] + (firstIdx > 0 && lines[firstIdx - 1]?.trim() === "" ? 1 : 0);
    if (lastIdx < lines.length - 1 && lines[lastIdx + 1]?.trim() !== "") lines.splice(lastIdx + 1, 0, "");
    result = lines.join("\n");
  }
  return result;
};

const normalizeNicheLabel = (value?: string | null) =>
  (value || "")
    .toLowerCase()
    .replace(/[()]/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const normalizeWorkspaceKey = (value?: string | null) => {
  const raw = (value || "").trim();
  if (!raw) return "";

  try {
    const parsed = new URL(raw.includes("://") ? raw : `https://${raw}`);
    return parsed.hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return raw
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .split("/")[0]
      .trim();
  }
};

const sourceMatchesWorkspace = (source: string | null | undefined, workspaceKey: string) =>
  !!workspaceKey && normalizeWorkspaceKey(source) === workspaceKey;

const leadMatchesNiche = (lead: { niche_tag?: string | null }, niche: string | null) => {
  if (!niche) return true;
  const leadTag = normalizeNicheLabel(lead.niche_tag || "Uncategorized");
  const target = normalizeNicheLabel(niche);
  return leadTag === target || leadTag.includes(target) || target.includes(leadTag);
};

export default function Leadgen() {
  const { user, profile, openAuthModal } = useAuth();
  const { workspaces, upsertWorkspace, touchWorkspace, deleteWorkspace } = useWorkspaces(user?.id);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState<ChatItem[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [localNiches, setLocalNiches] = useState<Array<{ label: string; description: string | null; parent_label: string | null; niche_type: string }>>([]);
  const [localWorkspaceKey, setLocalWorkspaceKey] = useState("");
  const [activeNiche, setActiveNiche] = useState<string | null>(null);
  const [isFindingLeads, setIsFindingLeads] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const [isEnrichingLeads, setIsEnrichingLeads] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const activeNicheRef = useRef<string | null>(null);
  activeNicheRef.current = activeNiche;

  const [websiteUrl, setWebsiteUrl] = useState("");
  const [targetLocation, setTargetLocation] = useState("");
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveryPhase, setDiscoveryPhase] = useState("");
  const [companySummary, setCompanySummary] = useState("");
  const [icpSummary, setIcpSummary] = useState("");
  const [pagesScraped, setPagesScraped] = useState(0);
  const [pagesAnalyzed, setPagesAnalyzed] = useState<Array<{ url: string; path: string; category: string }>>([]);
  const [hasDiscovered, setHasDiscovered] = useState(false);
   const [isAutoSeeding, setIsAutoSeeding] = useState(false);
   const [editingLocation, setEditingLocation] = useState(false);
   const [gtmTreeData, setGtmTreeData] = useState<GTMTreeData | null>(null);
   const [gtmPersonasLoading, setGtmPersonasLoading] = useState(false);
   const [isGtmLoading, setIsGtmLoading] = useState(false);

  const activeWorkspaceKey = useMemo(() => normalizeWorkspaceKey(websiteUrl), [websiteUrl]);

  const {
    leads: savedLeads, outreach, niches: savedNiches,
    upsertLeads, upsertNiches, updateLeadStatus, deleteLead, logOutreach, exportCSV,
  } = useLeadsCRUD(user?.id, activeWorkspaceKey || undefined);

  const currentLocalNiches = useMemo(
    () => (activeWorkspaceKey && localWorkspaceKey === activeWorkspaceKey ? localNiches : []),
    [activeWorkspaceKey, localWorkspaceKey, localNiches]
  );

  useEffect(() => {
    if (!activeWorkspaceKey) {
      setHasDiscovered(false);
      return;
    }

    setHasDiscovered(currentLocalNiches.length > 0 || savedNiches.length > 0 || savedLeads.length > 0);
  }, [activeWorkspaceKey, currentLocalNiches.length, savedNiches.length, savedLeads.length]);

  const [draftModalOpen, setDraftModalOpen] = useState(false);
  const [draftLead, setDraftLead] = useState<Lead | null>(null);
  const [draftLoading, setDraftLoading] = useState(false);
  const [draftSubject, setDraftSubject] = useState("");
  const [draftBody, setDraftBody] = useState("");
  const [draftCtaText, setDraftCtaText] = useState("");
  const [sending, setSending] = useState(false);
  const [selectedLead, setSelectedLead] = useState<SavedLead | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [leadViewCount, setLeadViewCount] = useState(0);

  // Normalize domain for cache key
  const normalizeWebsiteKey = (url: string): string =>
    url.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, "").toLowerCase();

  // Write-through cache helper
  const updateGtmCache = useCallback((websiteKey: string, stepResults: Record<string, any>, tree: GTMTreeData, companyData: Record<string, any>) => {
    supabase.from("leadhunter_cache").upsert({
      website_key: websiteKey,
      company_data: companyData as any,
      step_results: stepResults as any,
      tree_data: tree as any,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    }, { onConflict: "website_key" }).then(() => {});
  }, []);

  // Fetch GTM tree data (products, verticals, buyer roles) via multi-step pipeline — with cache
  const fetchGtmAnalysis = useCallback(async (website: string) => {
    setIsGtmLoading(true);
    try {
      const domain = website.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
      const websiteKey = normalizeWebsiteKey(domain);
      const company = { id: domain, name: domain.split(".")[0], website: `https://${domain}` };

      try {
        const { data: cached } = await supabase
          .from("leadhunter_cache")
          .select("*")
          .eq("website_key", websiteKey)
          .gt("expires_at", new Date().toISOString())
          .maybeSingle();

        if (cached?.tree_data && cached?.step_results) {
          const cachedTree = cached.tree_data as any;
          const hasProducts = cachedTree?.products?.length > 0;
          const hasMappings = cachedTree?.mappings?.length > 0;

          if (hasProducts) {
            if (cachedTree.company_summary) setCompanySummary(cachedTree.company_summary);
            setGtmTreeData({
              company_summary: cachedTree.company_summary || "",
              products: cachedTree.products || [],
              customers: cachedTree.customers || [],
              conquest_targets: cachedTree.conquest_targets || [],
              mappings: cachedTree.mappings || [],
              leads: cachedTree.leads || [],
            });
            setGtmPersonasLoading(false);
            console.log(`[GTM] Loaded from cache: ${cachedTree.products.length} products, ${cachedTree.mappings?.length || 0} personas`);

            if (!hasMappings) {
              setGtmPersonasLoading(true);
              const stepResults = cached.step_results as Record<string, any>;
              const r3 = await supabase.functions.invoke("gtm-analyze", {
                body: { stepId: "icp-buyers", company, previousResults: stepResults },
              });
              let d3 = r3.data;
              if (d3 instanceof Blob) d3 = JSON.parse(await d3.text());
              const mappings = d3?.structured?.mappings || [];
              const updatedTree: GTMTreeData = { ...cachedTree, mappings };
              setGtmTreeData(updatedTree);
              stepResults["icp-buyers"] = d3;
              updateGtmCache(websiteKey, stepResults, updatedTree, cached.company_data as any);
              setGtmPersonasLoading(false);
            }
            return;
          }
        }
      } catch (e) {
        console.warn("[GTM] Cache lookup failed, running fresh:", e);
      }

      const previousResults: Record<string, any> = {};

      const r1 = await supabase.functions.invoke("gtm-analyze", {
        body: { stepId: "products", company, previousResults },
      });
      let d1 = r1.data;
      if (d1 instanceof Blob) d1 = JSON.parse(await d1.text());
      if (!d1?.structured?.products) {
        setGtmTreeData(null);
        return;
      }
      previousResults["products"] = d1;
      const products = d1.structured.products;
      const summary = d1.structured.company_summary || "";
      const hq = d1.structured.headquarters || "";
      if (summary) setCompanySummary(summary);
      if (hq) setTargetLocation(hq);

      setGtmTreeData({
        company_summary: summary,
        products,
        customers: [],
        conquest_targets: [],
        mappings: [],
        leads: [],
      });
      setGtmPersonasLoading(true);

      const [r2, r3] = await Promise.all([
        supabase.functions.invoke("gtm-analyze", {
          body: { stepId: "customers", company, previousResults },
        }),
        supabase.functions.invoke("gtm-analyze", {
          body: { stepId: "icp-buyers", company, previousResults },
        }),
      ]);

      let d2 = r2.data;
      if (d2 instanceof Blob) d2 = JSON.parse(await d2.text());
      let d3 = r3.data;
      if (d3 instanceof Blob) d3 = JSON.parse(await d3.text());

      previousResults["customers"] = d2;
      previousResults["icp-buyers"] = d3;

      const fullTree: GTMTreeData = {
        company_summary: summary,
        products,
        customers: d2?.structured?.customers || [],
        conquest_targets: d2?.structured?.competitors_customers || [],
        mappings: d3?.structured?.mappings || [],
        leads: [],
      };
      setGtmTreeData(fullTree);
      setGtmPersonasLoading(false);
      updateGtmCache(websiteKey, previousResults, fullTree, company);
    } catch (e) {
      console.warn("GTM analysis unavailable:", e);
      setGtmTreeData(null);
      setGtmPersonasLoading(false);
    } finally {
      setIsGtmLoading(false);
    }
  }, [updateGtmCache]);

  // Generate leads from targeting cards
  const handleGenerateFromTargeting = useCallback(async (cards: DroppedCard[]) => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setIsFindingLeads(true);

    const productNames = cards.filter(c => c.type === "product").map(c => c.label);
    const verticalNames = cards.filter(c => c.type === "vertical").map(c => `${c.label} (DM: ${c.meta || "Decision Maker"})`);

    const contextParts = [
      websiteUrl ? `My company website is ${websiteUrl}.` : "",
      companySummary ? `Company: ${companySummary}.` : "",
      targetLocation ? `Target location: ${targetLocation}. Only find leads in this area.` : "",
      productNames.length > 0 ? `Products to sell: ${productNames.join(", ")}.` : "",
      verticalNames.length > 0 ? `Target verticals & buyer roles: ${verticalNames.join("; ")}.` : "",
    ].filter(Boolean).join(" ");

    toast.info("Finding targeted leads based on your criteria...");

    try {
      const resp = await fetchWithTimeout(CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({
          messages: [{ role: "user", content: `${contextParts}\n\nI have already chosen the product, vertical, buyer role, and geography. Do not ask follow-up questions or restate the briefing. Immediately call run_lead_search and return 5 real decision-makers as leads for this exact ICP. Use the selected vertical and buyer role as the core ICP, prefer different companies, and include verified emails when available.` }],
        }),
        signal: controller.signal,
      });
      if (!resp.ok) throw new Error("Search failed");
      const reader = resp.body!.getReader();
      const foundLeads: Lead[] = [];
      const nicheTag = verticalNames[0] || productNames[0] || "targeted";
      await parseSSEStream(reader, {
        onLeads: (leads) => foundLeads.push(...leads.map((l: Lead) => ({ ...l, niche_tag: nicheTag, source: websiteUrl || "targeting" }))),
      }, controller.signal);
      if (foundLeads.length > 0) {
        if (user) {
          await upsertLeads(foundLeads);
        } else {
          setItems((prev) => [...prev, { type: "leads", leads: foundLeads }]);
        }
        toast.success(`Added ${foundLeads.length} targeted leads!`);
      } else {
        toast.info("No leads found. Try different targeting criteria.");
      }
    } catch (e: any) {
      if (e.name === "AbortError") {
        toast.info("Lead generation stopped.");
      } else {
        toast.error(e.message || "Lead search failed");
      }
    } finally {
      abortRef.current = null;
      setIsFindingLeads(false);
    }
  }, [user, websiteUrl, companySummary, targetLocation, upsertLeads]);

  const handleStopGenerating = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  }, []);

  // Always hydrate websiteUrl from URL param (even if data already exists)
  const autoDiscoverRef = useRef(false);
  useEffect(() => {
    const website = searchParams.get("website") || sessionStorage.getItem("pendingWebsite");
    if (website) {
      sessionStorage.removeItem("pendingWebsite");
      setWebsiteUrl(website);
      setSearchParams({}, { replace: true });
      // Also track workspace for authenticated users
      if (user) {
        const wk = normalizeWorkspaceKey(website);
        if (wk) upsertWorkspace(wk, wk);
      }
    }
    if (website && !autoDiscoverRef.current && !hasDiscovered && !isDiscovering) {
      autoDiscoverRef.current = true;
      setTimeout(() => {
        setIsDiscovering(true);
        setDiscoveryPhase("Mapping site pages...");
        setTimeout(() => setDiscoveryPhase("Scraping key pages (about, solutions, customers)..."), 3000);
        setTimeout(() => setDiscoveryPhase("Analyzing business model & customers..."), 7000);
        setTimeout(() => setDiscoveryPhase("Building 3-layer ICP tree..."), 11000);
        fetchWithTimeout(SCOUT_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
          body: JSON.stringify({ website: website.trim() }),
        })
          .then(r => r.json())
          .then(data => {
            if (!data.success) throw new Error(data.error || "Discovery failed");
            setCompanySummary(data.company_summary || "");
            setIcpSummary(data.icp_summary || "");
            setPagesScraped(data.pages_scraped || 1);
            setPagesAnalyzed(data.pages_analyzed || []);
            const niches = data.niches as Array<{ label: string; description: string; parent_label: string | null; niche_type: string }>;
            setLocalWorkspaceKey(normalizeWorkspaceKey(website));
            setLocalNiches(niches);
            if (user) {
              upsertNiches(niches.map(n => ({ label: n.label, description: n.description || "", parent_label: n.parent_label, niche_type: n.niche_type as any })));
            }
            setHasDiscovered(true);
            setChatOpen(false);
            toast.success(`ICP mapped: ${niches.filter(n => n.niche_type === "vertical").length} verticals discovered`);
            // Track workspace
            const wk = normalizeWorkspaceKey(website);
            upsertWorkspace(wk, wk);
            // Trigger GTM analysis for product/vertical cards
            fetchGtmAnalysis(website.trim());
          })
          .catch((e: any) => toast.error(e.message || "Failed to analyze website"))
          .finally(() => { setIsDiscovering(false); setDiscoveryPhase(""); });
      }, 100);
    }
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  const sidebarNiches = useMemo(
    () => currentLocalNiches.map((n, index) => ({
      id: `local-${index}-${n.label}`,
      label: n.label,
      description: n.description,
      status: "active",
      lead_count: 0,
      created_at: new Date().toISOString(),
      parent_label: n.parent_label,
      niche_type: n.niche_type as any,
    })),
    [currentLocalNiches]
  );

  const allLeads = useMemo(() => {
    const leads: Lead[] = [];
    const seen = new Set<string>();
    for (const item of items) {
      if (item.type === "leads") {
        for (const l of item.leads) {
          const key = `${l.name}|${l.email || ""}|${l.company || ""}`;
          if (!seen.has(key)) { seen.add(key); leads.push(l); }
        }
      }
    }
    return leads;
  }, [items]);

  useEffect(() => {
    if (user && allLeads.length > 0) upsertLeads(allLeads);
  }, [allLeads, user, upsertLeads]);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);
  useEffect(() => { scrollToBottom(); }, [items, scrollToBottom]);

  // --- Discovery: single URL input ---
  const handleDiscover = async () => {
    const url = websiteUrl.trim();
    if (!url) return;
    setIsDiscovering(true);
    setDiscoveryPhase("Mapping site pages...");

    try {
      setTimeout(() => setDiscoveryPhase("Scraping key pages (about, solutions, customers)..."), 3000);
      setTimeout(() => setDiscoveryPhase("Analyzing business model & customers..."), 7000);
      setTimeout(() => setDiscoveryPhase("Building 3-layer ICP tree..."), 11000);

      const resp = await fetchWithTimeout(SCOUT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ website: url }),
      });

      const data = await resp.json();
      if (!resp.ok || !data.success) throw new Error(data.error || "Discovery failed");

      setCompanySummary(data.company_summary || "");
      setIcpSummary(data.icp_summary || "");
      setPagesScraped(data.pages_scraped || 1);
      setPagesAnalyzed(data.pages_analyzed || []);

      // Populate niches
      const niches = data.niches as Array<{ label: string; description: string; parent_label: string | null; niche_type: string }>;
      setLocalWorkspaceKey(activeWorkspaceKey);
      setLocalNiches(niches);

      // Persist to DB if authed
      if (user) {
        upsertNiches(niches.map(n => ({
          label: n.label,
          description: n.description || "",
          parent_label: n.parent_label,
          niche_type: n.niche_type as any,
        })));
      }

      setHasDiscovered(true);
      setChatOpen(false);
      toast.success(`ICP mapped: ${niches.filter(n => n.niche_type === "vertical").length} verticals discovered`);
      // Track workspace
      upsertWorkspace(activeWorkspaceKey, activeWorkspaceKey);
      fetchGtmAnalysis(url);

      // Auto-seed 1 lead per persona
      handleAutoSeed(niches);
    } catch (e: any) {
      toast.error(e.message || "Failed to analyze website");
    } finally {
      setIsDiscovering(false);
      setDiscoveryPhase("");
    }
  };

  // --- Draft email cache (keyed by lead email) ---
  const draftCacheRef = useRef<Record<string, { subject: string; body: string }>>({}); 

  // --- Chat handlers (kept for follow-up) ---
  const handleDraftEmail = async (lead: Lead) => {
    if (!user) { openAuthModal(); return; }
    if (!lead.email) { toast.error("This lead has no email address."); return; }
    setDraftLead(lead); setDraftModalOpen(true);

    // Check cache first
    const cached = draftCacheRef.current[lead.email];
    if (cached) {
      setDraftSubject(cached.subject); setDraftBody(cached.body); setDraftCtaText("");
      setDraftLoading(false);
      return;
    }

    setDraftLoading(true);
    setDraftSubject(""); setDraftBody(""); setDraftCtaText("");
    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/draft-outreach`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({
          lead: { name: lead.name, title: lead.title, company: lead.company, email: lead.email, reason: lead.reason, summary: lead.summary },
          senderInfo: { name: profile?.displayName || user.email?.split("@")[0], company: profile?.company || "", website: websiteUrl },
        }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Failed to draft");
      const subject = data.draft.subject || "";
      const body = data.draft.body || "";
      draftCacheRef.current[lead.email] = { subject, body };
      setDraftSubject(subject); setDraftBody(body); setDraftCtaText(data.draft.ctaText || "");
    } catch (e: any) {
      toast.error(e.message || "Failed to generate draft"); setDraftModalOpen(false);
    } finally { setDraftLoading(false); }
  };

  const recordDraftOpen = useCallback(async () => {
    if (!user || !draftLead?.email) return;

    const matchedLead = savedLeads.find((l) => l.email === draftLead.email && l.company === draftLead.company);
    if (!matchedLead) return;

    await Promise.all([
      logOutreach(matchedLead.id, "email", draftSubject, draftBody),
      matchedLead.status === "new"
        ? updateLeadStatus(matchedLead.id, "contacted")
        : Promise.resolve(),
    ]);
  }, [draftBody, draftLead, draftSubject, logOutreach, savedLeads, updateLeadStatus, user]);

  const handleSendEmail = async () => {
    if (!draftLead?.email || !draftSubject || !draftBody) return;
    const mailto = `mailto:${draftLead.email}?subject=${encodeURIComponent(draftSubject)}&body=${encodeURIComponent(draftBody)}`;

    setSending(true);

    try {
      window.location.assign(mailto);
      await recordDraftOpen();
      toast.success(`Tried your email app for ${draftLead.email}`);
    } catch {
      toast.error("Could not open your email app. Use Gmail instead.");
    } finally {
      setSending(false);
    }
  };

  const handleOpenGmailDraft = async () => {
    if (!draftLead?.email || !draftSubject || !draftBody) return;

    setSending(true);

    try {
      const params = new URLSearchParams({
        view: "cm",
        fs: "1",
        to: draftLead.email,
        su: draftSubject,
        body: draftBody,
      });
      const gmailUrl = `https://mail.google.com/mail/?${params.toString()}`;
      const popup = window.open(gmailUrl, "_blank", "noopener,noreferrer");

      if (!popup) {
        window.location.assign(gmailUrl);
      }

      await recordDraftOpen();
      toast.success(`Opened Gmail draft for ${draftLead.email}`);
      setDraftModalOpen(false);
    } catch {
      toast.error("Could not open Gmail draft.");
    } finally {
      setSending(false);
    }
  };

  const handleCopyDraft = async () => {
    if (!draftLead?.email || !draftSubject || !draftBody) return;

    try {
      await navigator.clipboard.writeText(`To: ${draftLead.email}\nSubject: ${draftSubject}\n\n${draftBody}`);
      toast.success("Draft copied to clipboard.");
    } catch {
      toast.error("Could not copy the draft.");
    }
  };

  const sendMessage = async (overrideText?: string) => {
    const text = (overrideText || input).trim();
    if (!text || isStreaming) return;
    const userItem: ChatItem = { type: "user", content: text };
    const allItems = [...items, userItem];
    setItems(allItems); setInput(""); setIsStreaming(true);
    let assistantSoFar = "";
    try {
      const apiMessages = allItems.filter((it): it is ChatItem & { type: "user" | "assistant" } => it.type !== "leads").map((m) => ({ role: m.type, content: m.content }));
      const resp = await fetchWithTimeout(CHAT_URL, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` }, body: JSON.stringify({ messages: apiMessages }) });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        setItems((prev) => [...prev, { type: "assistant", content: (err as any).error || "Something went wrong." }]);
        setIsStreaming(false); return;
      }
      const reader = resp.body!.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      const upsert = (chunk: string) => {
        assistantSoFar += chunk;
        const normalizedContent = formatAssistantMessage(assistantSoFar);
        setItems((prev) => {
          const last = prev[prev.length - 1];
          if (last?.type === "assistant") return prev.map((m, i) => (i === prev.length - 1 && m.type === "assistant" ? { ...m, content: normalizedContent } : m));
          return [...prev, { type: "assistant", content: normalizedContent }];
        });
      };
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let newlineIdx: number;
        while ((newlineIdx = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, newlineIdx);
          buf = buf.slice(newlineIdx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            if (parsed.type === "niches" && parsed.niches) {
              setLocalNiches((prev) => {
                const seen = new Set(prev.map((n) => n.label));
                const merged = [...prev];
                const parentLabel = activeNicheRef.current;
                const parentEntry = parentLabel ? prev.find((n) => n.label === parentLabel) : null;
                const nicheType = !parentLabel ? "vertical" : parentEntry?.niche_type === "vertical" ? "segment" : "persona";
                for (const niche of parsed.niches as Array<{ label: string; description?: string }>) {
                  if (!seen.has(niche.label)) {
                    seen.add(niche.label);
                    merged.push({ label: niche.label, description: niche.description || null, parent_label: parentLabel, niche_type: nicheType });
                  }
                }
                return merged;
              });
              if (user) {
                const parentEntry = currentLocalNiches.find((n) => n.label === activeNicheRef.current);
                const nicheType = !activeNicheRef.current ? "vertical" : parentEntry?.niche_type === "vertical" ? "segment" : "persona";
                upsertNiches((parsed.niches as Array<{ label: string; description?: string }>).map(n => ({ ...n, description: n.description || "", parent_label: activeNicheRef.current, niche_type: nicheType as any })));
              }
              continue;
            }
            if (parsed.type === "leads" && parsed.leads) { setItems((prev) => [...prev, { type: "leads", leads: parsed.leads }]); continue; }
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) upsert(content);
          } catch { buf = line + "\n" + buf; break; }
        }
      }
      if (buf.trim()) {
        for (let raw of buf.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            if (parsed.type === "niches" && parsed.niches) {
              setLocalNiches((prev) => {
                const seen = new Set(prev.map((n) => n.label));
                const merged = [...prev];
                const parentLabel = activeNicheRef.current;
                const parentEntry = parentLabel ? prev.find((n) => n.label === parentLabel) : null;
                const nicheType = !parentLabel ? "vertical" : parentEntry?.niche_type === "vertical" ? "segment" : "persona";
                for (const niche of parsed.niches as Array<{ label: string; description?: string }>) {
                  if (!seen.has(niche.label)) {
                    seen.add(niche.label);
                    merged.push({ label: niche.label, description: niche.description || null, parent_label: parentLabel, niche_type: nicheType });
                  }
                }
                return merged;
              });
              if (user) {
                const parentEntry = currentLocalNiches.find((n) => n.label === activeNicheRef.current);
                const nicheType = !activeNicheRef.current ? "vertical" : parentEntry?.niche_type === "vertical" ? "segment" : "persona";
                upsertNiches((parsed.niches as Array<{ label: string; description?: string }>).map(n => ({ ...n, description: n.description || "", parent_label: activeNicheRef.current, niche_type: nicheType as any })));
              }
              continue;
            }
            if (parsed.type === "leads" && parsed.leads) { setItems((prev) => [...prev, { type: "leads", leads: parsed.leads }]); continue; }
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) upsert(content);
          } catch {}
        }
      }
    } catch (e) {
      console.error("Chat error:", e);
      setItems((prev) => [...prev, { type: "assistant", content: "Connection error. Please try again." }]);
    }
    setIsStreaming(false);
  };

  // ICP Action Handlers
  const handleFindLeads = async (niche: string) => {
    if (!user) { openAuthModal(); return; }
    setIsFindingLeads(true);
    toast.info(`Searching for "${niche}" leads...`);

    try {
      const nicheEntry = currentLocalNiches.find((n) => n.label === niche);
      const parentNiche = nicheEntry?.parent_label ? currentLocalNiches.find((n) => n.label === nicheEntry.parent_label) : null;
      const grandparentNiche = parentNiche?.parent_label ? currentLocalNiches.find((n) => n.label === parentNiche.parent_label) : null;
      
      const contextParts = [
        websiteUrl ? `My company website is ${websiteUrl}.` : "",
        companySummary ? `Company: ${companySummary}.` : "",
        icpSummary ? `ICP Summary: ${icpSummary}.` : "",
        targetLocation ? `Target location/geography: ${targetLocation}. Only find leads physically located in or near this area.` : "",
        grandparentNiche ? `Industry vertical: ${grandparentNiche.label}${grandparentNiche.description ? ` — ${grandparentNiche.description}` : ""}.` : "",
        parentNiche ? `Market segment: ${parentNiche.label}${parentNiche.description ? ` — ${parentNiche.description}` : ""}.` : "",
        `Target persona: ${niche}${nicheEntry?.description ? ` — ${nicheEntry.description}` : ""}.`,
      ].filter(Boolean).join(" ");

      const resp = await fetchWithTimeout(CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({
          messages: [
            { role: "user", content: `${contextParts}\n\nI've already confirmed my ICP. Skip all discovery questions. Immediately run a lead search for "${niche}" prospects. Find real people with verified emails who match this persona.` },
          ],
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Search failed" }));
        throw new Error(err.error || "Search failed");
      }

      const reader = resp.body!.getReader();
      const foundLeads: Lead[] = [];
      await parseSSEStream(reader, {
        onLeads: (leads) => foundLeads.push(...leads.map((l: Lead) => ({ ...l, niche_tag: niche, source: websiteUrl || "chat" }))),
      });

      if (foundLeads.length > 0) {
        await upsertLeads(foundLeads);
        setActiveNiche(niche);
        toast.success(`Added ${foundLeads.length} leads to your pipeline!`);
      } else {
        toast.info("No leads found for this niche. Try broadening your criteria.");
      }
    } catch (e: any) {
      toast.error(e.message || "Lead search failed");
    } finally {
      setIsFindingLeads(false);
    }
  };

  const handleEnrichLeads = async (niche: string) => {
    if (!user) { openAuthModal(); return; }
    setIsEnrichingLeads(true);
    const nicheLeads = savedLeads.filter((l) => leadMatchesNiche(l, niche) && !l.email);
    if (nicheLeads.length === 0) {
      toast.info("All leads in this niche already have contact details.");
      setIsEnrichingLeads(false); return;
    }
    toast.info(`Enriching ${nicheLeads.length} leads...`);
    try {
      const resp = await fetchWithTimeout(CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({
          messages: [{ role: "user", content: `Enrich contacts for leads in the "${niche}" niche — find email addresses and phone numbers for the ${nicheLeads.length} leads missing contact info.` }],
        }),
      });
      if (!resp.ok) throw new Error("Enrichment failed");
      const reader = resp.body!.getReader();
      const enrichedLeads: Lead[] = [];
      await parseSSEStream(reader, {
        onLeads: (leads) => enrichedLeads.push(...leads.map((lead: Lead) => ({ ...lead, niche_tag: niche, source: websiteUrl || "chat" }))),
      });
      if (enrichedLeads.length > 0) {
        await upsertLeads(enrichedLeads);
        toast.success(`Enriched ${enrichedLeads.length} leads!`);
      } else {
        toast.info("No additional contact info found.");
      }
    } catch (e: any) {
      toast.error(e.message || "Enrichment failed");
    } finally {
      setIsEnrichingLeads(false);
    }
  };

  const handleScoreLeads = (_niche: string) => {
    // Score is embedded at lead generation time
  };

  const handleDraftAllOutreach = (niche: string) => {
    if (!user) { openAuthModal(); return; }
    const nicheLeads = savedLeads.filter((l) => leadMatchesNiche(l, niche) && l.email && l.status === "new");
    if (nicheLeads.length === 0) { toast.info("No uncontacted leads with emails in this niche."); return; }
    handleDraftEmail(nicheLeads[0]);
  };

  const handleExportNiche = (niche: string) => {
    const nicheLeads = savedLeads.filter((l) => leadMatchesNiche(l, niche));
    if (nicheLeads.length === 0) { toast.info("No leads to export in this niche."); return; }
    const headers = ["Name", "Title", "Company", "Email", "Phone", "LinkedIn", "Status", "Source"];
    const rows = nicheLeads.map((l) => [l.name, l.title || "", l.company || "", l.email || "", l.phone || "", l.linkedin || "", l.status, l.source || ""]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${(v || "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `leads-${niche.replace(/[^a-zA-Z0-9]/g, "-")}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  // --- Batch find: request 5 leads for a niche ---
  const handleBatchFind = async (niche: string) => {
    if (!user) { openAuthModal(); return; }
    setIsFindingLeads(true);
    toast.info(`Finding batch of leads for "${niche}"...`);
    try {
      const nicheEntry = currentLocalNiches.find((n) => n.label === niche);
      const parentNiche = nicheEntry?.parent_label ? currentLocalNiches.find((n) => n.label === nicheEntry.parent_label) : null;
      const grandparentNiche = parentNiche?.parent_label ? currentLocalNiches.find((n) => n.label === parentNiche.parent_label) : null;
      const contextParts = [
        websiteUrl ? `My company website is ${websiteUrl}.` : "",
        companySummary ? `Company: ${companySummary}.` : "",
        targetLocation ? `Target location/geography: ${targetLocation}. Only find leads in this area.` : "",
        grandparentNiche ? `Industry vertical: ${grandparentNiche.label}.` : "",
        parentNiche ? `Market segment: ${parentNiche.label}.` : "",
        `Target persona: ${niche}${nicheEntry?.description ? ` — ${nicheEntry.description}` : ""}.`,
      ].filter(Boolean).join(" ");
      const resp = await fetchWithTimeout(CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({
          messages: [{ role: "user", content: `${contextParts}\n\nSkip discovery. Find exactly 5 real people with verified emails matching this persona "${niche}". Return them as leads.` }],
        }),
      });
      if (!resp.ok) throw new Error("Batch search failed");
      const reader = resp.body!.getReader();
      const foundLeads: Lead[] = [];
      await parseSSEStream(reader, {
        onLeads: (leads) => foundLeads.push(...leads.map((l: Lead) => ({ ...l, niche_tag: niche, source: websiteUrl || "chat" }))),
      });
      if (foundLeads.length > 0) {
        await upsertLeads(foundLeads);
        setActiveNiche(niche);
        toast.success(`Added ${foundLeads.length} leads!`);
      } else {
        toast.info("No leads found. Try a different niche.");
      }
    } catch (e: any) {
      toast.error(e.message || "Batch search failed");
    } finally {
      setIsFindingLeads(false);
    }
  };

  // --- Find lookalikes from a single lead ---
  const handleFindLookalikes = async (lead: SavedLead) => {
    if (!user) { openAuthModal(); return; }
    setIsFindingLeads(true);
    toast.info(`Finding lookalikes for ${lead.name}...`);
    try {
      const resp = await fetchWithTimeout(CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({
          messages: [{ role: "user", content: `Find 3 people similar to ${lead.name} at ${lead.company || "their company"} (${lead.title || "similar role"}) — same industry, role level, and company size. Return them as leads with verified emails.` }],
        }),
      });
      if (!resp.ok) throw new Error("Lookalike search failed");
      const reader = resp.body!.getReader();
      const foundLeads: Lead[] = [];
      await parseSSEStream(reader, {
        onLeads: (leads) => foundLeads.push(...leads.map((l: Lead) => ({ ...l, niche_tag: lead.niche_tag, source: websiteUrl || "chat" }))),
      });
      if (foundLeads.length > 0) {
        await upsertLeads(foundLeads);
        toast.success(`Found ${foundLeads.length} lookalikes!`);
      } else {
        toast.info("No lookalikes found.");
      }
    } catch (e: any) {
      toast.error(e.message || "Lookalike search failed");
    } finally {
      setIsFindingLeads(false);
    }
  };

   // --- Auto-seed: 1 lead per persona niche after discovery ---
  const handleAutoSeed = async (niches: Array<{ label: string; description: string | null; parent_label: string | null; niche_type: string }>) => {
    if (!user) return;
    // Prefer personas, fall back to segments if none
    let targets = niches.filter(n => n.niche_type === "persona");
    if (targets.length === 0) targets = niches.filter(n => n.niche_type === "segment");
    if (targets.length === 0) return;
    setIsAutoSeeding(true);
    toast.info(`Seeding ${targets.length} personas in parallel...`, { id: "auto-seed" });
    await Promise.allSettled(targets.map(t => handleFindLeads(t.label)));
    setIsAutoSeeding(false);
    toast.success(`Seeded ${targets.length} sample leads!`, { id: "auto-seed" });
  };

  const chatOnlyItems = items.filter(it => it.type !== "leads");
  const filteredPanelLeads = useMemo(() => {
    if (!activeNiche) return allLeads;
    return allLeads.filter((lead) => (lead.niche_tag || "Uncategorized") === activeNiche);
  }, [allLeads, activeNiche]);

  const sidebarSavedNiches = useMemo(() => {
    const seen = new Set<string>();
    const merged: typeof savedNiches = [];
    for (const n of (user ? savedNiches : [])) {
      if (!seen.has(n.label)) { seen.add(n.label); merged.push(n); }
    }
    for (const n of sidebarNiches) {
      if (!seen.has(n.label)) { seen.add(n.label); merged.push(n); }
    }
    return merged;
  }, [user, savedNiches, sidebarNiches]);

  const dashboardLeads = useMemo(() => {
    if (user) return savedLeads;
    return filteredPanelLeads.map((l, i) => ({
      ...l,
      id: `temp-${i}-${l.name}-${l.company || ""}`,
      status: "new" as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      niche_tag: l.niche_tag,
    }));
  }, [user, savedLeads, filteredPanelLeads]);

  // Workspace switch handler — load cached data for selected workspace
  const handleSwitchWorkspace = useCallback(async (websiteKey: string) => {
    touchWorkspace(websiteKey);
    autoDiscoverRef.current = true; // prevent autoDiscover from re-triggering
    setWebsiteUrl(websiteKey);
    setSearchParams({}, { replace: true });
    // Reset state
    setLocalNiches([]);
    setLocalWorkspaceKey("");
    setCompanySummary("");
    setIcpSummary("");
    setPagesScraped(0);
    setPagesAnalyzed([]);
    setGtmTreeData(null);
    setHasDiscovered(false);
    setIsGtmLoading(true);

    // Load directly from GTM cache — no scout re-run
    try {
      const { data: cached } = await supabase
        .from("leadhunter_cache")
        .select("*")
        .eq("website_key", websiteKey)
        .gt("expires_at", new Date().toISOString())
        .maybeSingle();

      if (cached?.tree_data) {
        const cachedTree = cached.tree_data as any;
        if (cachedTree.company_summary) setCompanySummary(cachedTree.company_summary);
        setGtmTreeData({
          company_summary: cachedTree.company_summary || "",
          products: cachedTree.products || [],
          customers: cachedTree.customers || [],
          conquest_targets: cachedTree.conquest_targets || [],
          mappings: cachedTree.mappings || [],
          leads: cachedTree.leads || [],
        });
        setHasDiscovered(true);
        setIsGtmLoading(false);
        return;
      }
    } catch (e) {
      console.warn("[Workspace] Cache miss, triggering fresh analysis:", e);
    }

    // Cache miss — trigger fresh analysis via URL param
    setIsGtmLoading(false);
    navigate(`/leadhunter?website=${encodeURIComponent(websiteKey)}`, { replace: true });
    setTimeout(() => { autoDiscoverRef.current = false; }, 0);
  }, [touchWorkspace, navigate, setSearchParams]);

  const handleDeleteWorkspace = useCallback(async (websiteKey: string) => {
    await deleteWorkspace(websiteKey);
    if (activeWorkspaceKey === websiteKey) {
      setWebsiteUrl("");
      setHasDiscovered(false);
      setGtmTreeData(null);
      setCompanySummary("");
    }
    toast.success("Workspace removed");
  }, [deleteWorkspace, activeWorkspaceKey]);

  const handleNewWorkspace = useCallback(() => {
    autoDiscoverRef.current = false;
    setWebsiteUrl("");
    setHasDiscovered(false);
    setLocalWorkspaceKey("");
    setLocalNiches([]);
    setCompanySummary("");
    setIcpSummary("");
    setPagesScraped(0);
    setPagesAnalyzed([]);
    setGtmTreeData(null);
    setIsGtmLoading(false);
    setGtmPersonasLoading(false);
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  // Auto-load most recent workspace for logged-in users with no context
  const autoLoadedRef = useRef(false);
  useEffect(() => {
    if (autoLoadedRef.current) return;
    if (!user || hasDiscovered || isDiscovering || searchParams.get("website") || sessionStorage.getItem("pendingWebsite") || websiteUrl) return;
    if (workspaces.length > 0) {
      autoLoadedRef.current = true;
      const most = workspaces[0]; // already sorted by last_accessed_at DESC
      handleSwitchWorkspace(most.website_key);
    }
  }, [user, workspaces, hasDiscovered, isDiscovering, searchParams, websiteUrl, handleSwitchWorkspace]);

  // Redirect to homepage if no website param and no existing data
  // Only redirect unauthenticated users with no context back to homepage
  useEffect(() => {
    if (!user && !hasDiscovered && !isDiscovering && !searchParams.get("website") && !sessionStorage.getItem("pendingWebsite") && !websiteUrl) {
      navigate("/", { replace: true });
    }
  }, [user, hasDiscovered, isDiscovering, searchParams, websiteUrl, navigate]);

  // Discovery loading screen — skeleton overlay matching dashboard layout
  const discoveryLoading = (
    <div className="flex-1 flex min-h-0 relative">
      {/* Skeleton background matching LeadgenDashboard layout */}
      <div className="flex flex-1 min-w-0 h-full opacity-40 animate-pulse">
        {/* Left column skeleton (targeting cards) */}
        <div className="w-2/5 min-w-[320px] max-w-[480px] border-r border-border/40 flex flex-col h-full shrink-0">
          <div className="px-3 py-2 bg-card/40 border-b border-border/40">
            <div className="h-3 w-20 bg-muted rounded mb-1.5" />
            <div className="h-2.5 w-full bg-muted/60 rounded" />
            <div className="h-2.5 w-3/4 bg-muted/60 rounded mt-1" />
          </div>
          {/* Product cards skeleton */}
          <div className="p-3 space-y-1.5">
            <div className="h-3 w-16 bg-muted rounded mb-2" />
            {[1, 2, 3].map(i => (
              <div key={`p${i}`} className="h-9 rounded-lg bg-muted/50 border border-border/30" />
            ))}
          </div>
          {/* Persona cards skeleton */}
          <div className="p-3 space-y-1.5 border-t border-border/30">
            <div className="h-3 w-16 bg-muted rounded mb-2" />
            {[1, 2, 3, 4, 5].map(i => (
              <div key={`v${i}`} className="h-9 rounded-lg bg-muted/50 border border-border/30" />
            ))}
          </div>
          {/* Target zone skeleton */}
          <div className="mt-auto border-t border-border/30 p-3">
            <div className="h-16 rounded-lg border-2 border-dashed border-border/40 bg-muted/20" />
          </div>
        </div>
        {/* Right column skeleton (leads area) */}
        <div className="flex flex-col flex-1 min-w-0 h-full">
          {/* Toolbar skeleton */}
          <div className="border-b border-border/40 bg-card/30 px-4 py-2 flex items-center gap-2">
            <div className="h-3 w-16 bg-muted rounded" />
            <div className="flex-1" />
            {[1, 2, 3, 4, 5].map(i => (
              <div key={`btn${i}`} className="h-7 w-16 bg-muted/60 rounded" />
            ))}
          </div>
          {/* Lead rows skeleton */}
          <div className="p-4 space-y-2.5">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={`lead${i}`} className="flex items-center gap-3 h-12 px-3 rounded-lg bg-muted/30 border border-border/20">
                <div className="w-8 h-8 rounded-full bg-muted/60" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-32 bg-muted/60 rounded" />
                  <div className="h-2.5 w-48 bg-muted/40 rounded" />
                </div>
                <div className="h-5 w-14 bg-muted/40 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Centered overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-[2px]">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center px-6 py-8 rounded-2xl bg-card/90 border border-border/60 shadow-lg max-w-sm"
        >
          <CrowHuntingLoader size="md" label="" className="mb-2" />
          <h2 className="text-lg font-semibold text-foreground mb-1">
            {isDiscovering
              ? `Analyzing ${websiteUrl ? new URL(websiteUrl.includes("://") ? websiteUrl : `https://${websiteUrl}`).hostname.replace("www.", "") : "website"}`
              : "Loading product map..."}
          </h2>
          <p className="text-xs text-muted-foreground mb-4">
            {isDiscovering ? "This usually takes 15–30 seconds" : "Extracting products and personas..."}
          </p>
          {(discoveryPhase || !isDiscovering) && (
            <motion.div
              key={discoveryPhase || "products"}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center gap-2 text-xs text-primary"
            >
              <Sparkles className="w-3 h-3" />
              {discoveryPhase || "Mapping product lines..."}
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );


  // --- Generate All: seed leads for all persona niches ---
  const handleGenerateAll = async () => {
    if (!user) { openAuthModal(); return; }
    const allNiches = currentLocalNiches.length > 0 ? currentLocalNiches : savedNiches.map(n => ({ label: n.label, description: n.description, parent_label: n.parent_label || null, niche_type: n.niche_type || "vertical" }));
    // Prefer personas, fall back to segments
    let targets = allNiches.filter(n => n.niche_type === "persona");
    if (targets.length === 0) targets = allNiches.filter(n => n.niche_type === "segment");
    if (targets.length === 0) { toast.info("No niches found. Re-analyze your website first."); return; }
    setIsFindingLeads(true);
    for (let i = 0; i < targets.length; i++) {
      toast.info(`Generating leads ${i + 1}/${targets.length}: ${targets[i].label}`, { id: "gen-all" });
      await handleFindLeads(targets[i].label);
    }
    setIsFindingLeads(false);
    toast.success(`Generated leads for ${targets.length} niches!`, { id: "gen-all" });
  };

  // --- Enrich All: enrich all leads missing emails ---
  const handleEnrichAll = async () => {
    if (!user) { openAuthModal(); return; }
    const leadsToEnrich = savedLeads.filter(l => !l.email);
    if (leadsToEnrich.length === 0) { toast.info("All leads already have contact details."); return; }
    setIsEnrichingLeads(true);
    toast.info(`Enriching ${leadsToEnrich.length} leads...`);
    // Use first niche as context (enrichment is cross-niche)
    await handleEnrichLeads(leadsToEnrich[0]?.niche_tag || "all");
    setIsEnrichingLeads(false);
  };

  // --- Draft All: draft for first uncontacted lead with email ---
  const handleDraftAllSimple = () => {
    if (!user) { openAuthModal(); return; }
    const lead = savedLeads.find(l => l.email && l.status === "new");
    if (!lead) { toast.info("No uncontacted leads with emails."); return; }
    handleDraftEmail(lead);
  };


  const hasWebsiteContext = !!websiteUrl || !!searchParams.get("website") || !!sessionStorage.getItem("pendingWebsite");
  const showSkeleton = hasWebsiteContext && (isDiscovering || isGtmLoading);

  const EmptyState = () => {
    const [emptyInput, setEmptyInput] = useState("");
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Globe className="w-7 h-7 text-primary" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">Enter a website to start</h2>
          <p className="text-sm text-muted-foreground mb-6">Drop any company URL to discover their products, map buyer personas, and generate qualified leads.</p>
          <form
            className="flex gap-2 max-w-sm mx-auto"
            onSubmit={(e) => { e.preventDefault(); const url = emptyInput.trim(); if (url) navigate(`/leadhunter?website=${encodeURIComponent(url)}`); }}
          >
            <div className="relative flex-1">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={emptyInput}
                onChange={(e) => setEmptyInput(e.target.value)}
                placeholder="company.com"
                className="pl-9 h-10"
              />
            </div>
            <Button type="submit" className="gap-1.5" disabled={!emptyInput.trim()}>
              <Sparkles className="w-4 h-4" />
              Analyze
            </Button>
          </form>
        </div>
      </div>
    );
  };

  const mainContent = (
    <div className="flex flex-col h-full min-h-0">
      {!hasWebsiteContext && !hasDiscovered ? <EmptyState /> : showSkeleton ? discoveryLoading : (
        <div className="flex flex-col flex-1 min-h-0 w-full">
          {/* Consolidated header strip: URL + location + summary */}
          <div className="border-b border-border/40 bg-card/30 px-3 py-1.5 flex items-center gap-2 shrink-0">
            <form
              className="flex items-center gap-1.5 shrink-0"
              onSubmit={(e) => { e.preventDefault(); const url = websiteUrl.trim(); if (url) navigate(`/leadhunter?website=${encodeURIComponent(url)}`); }}
            >
              <div className="relative w-[160px]">
                <Globe className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                <Input
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="yourcompany.com"
                  className="pl-7 h-7 text-xs"
                  disabled={isDiscovering}
                />
              </div>
              {/* Location chip */}
              {editingLocation ? (
                <form
                  className="flex items-center gap-1"
                  onSubmit={(e) => { e.preventDefault(); setEditingLocation(false); }}
                >
                  <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
                  <Input
                    autoFocus
                    value={targetLocation}
                    onChange={(e) => setTargetLocation(e.target.value)}
                    onBlur={() => setEditingLocation(false)}
                    placeholder="e.g. New York, USA"
                    className="h-6 w-[120px] text-xs px-1.5"
                  />
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setEditingLocation(true)}
                  className="inline-flex items-center gap-1 h-6 px-2 rounded-md text-xs border border-dashed border-border/60 text-muted-foreground hover:text-foreground hover:border-border transition-colors shrink-0"
                >
                  <MapPin className="w-3 h-3 shrink-0" />
                  {targetLocation || "Location"}
                </button>
              )}
              {targetLocation && !editingLocation && (
                <button
                  type="button"
                  onClick={() => setTargetLocation("")}
                  className="text-muted-foreground hover:text-foreground w-4 h-4 flex items-center justify-center"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
              <Button type="submit" variant="outline" size="sm" className="h-7 text-xs gap-1 px-2" disabled={!websiteUrl.trim() || isDiscovering}>
                {isDiscovering ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                Analyze
              </Button>
            </form>
            {/* Company summary inline */}
            {companySummary && (
              <p className="text-xs text-muted-foreground truncate flex-1 min-w-0 px-2 border-l border-border/40">
                {companySummary}
              </p>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="text-xs gap-1 text-muted-foreground hover:text-foreground h-7 px-2 shrink-0"
              onClick={handleNewWorkspace}
            >
              <ArrowRight className="w-3 h-3" />
              Reset
            </Button>
          </div>
          <LeadgenDashboard
            leads={dashboardLeads}
            outreach={outreach}
            onUpdateStatus={updateLeadStatus}
            onDraftEmail={handleDraftEmail}
            onExportCSV={exportCSV}
            onGenerateAll={handleGenerateAll}
            onEnrichAll={handleEnrichAll}
            
            onDraftAll={handleDraftAllSimple}
            isGenerating={isFindingLeads}
            isEnriching={isEnrichingLeads}
            onSelectLead={(lead) => {
              const nextCount = leadViewCount + 1;
              setLeadViewCount(nextCount);
              if (!user && nextCount >= 2) {
                toast("Sign up to save leads & unlock full details", { icon: "🔒" });
                openAuthModal();
                return;
              }
              setSelectedLead(lead);
              setDrawerOpen(true);
            }}
            onFindLookalikes={handleFindLookalikes}
            websiteUrl={websiteUrl}
            pagesAnalyzed={pagesAnalyzed}
            companySummary={companySummary}
            icpSummary={icpSummary}
            niches={currentLocalNiches.length > 0 ? currentLocalNiches : savedNiches.map(n => ({ label: n.label, description: n.description, parent_label: n.parent_label, niche_type: n.niche_type }))}
            gtmTreeData={gtmTreeData}
            onGenerateFromTargeting={handleGenerateFromTargeting}
            onStopGenerating={handleStopGenerating}
            loadingPersonas={gtmPersonasLoading}
          />
        </div>
      )}

      {/* Floating Chat Dock */}
      <AnimatePresence>
        {chatOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-20 right-4 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[calc(100vh-8rem)] bg-card border border-border/60 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="border-b border-border/40 bg-card/80 backdrop-blur px-4 py-2.5 flex items-center gap-3 shrink-0">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                <MessageSquare className="w-3.5 h-3.5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xs font-semibold text-foreground">Xcrow Scout</h2>
                <p className="text-xs text-muted-foreground">AI-guided lead discovery</p>
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => setChatOpen(false)}>
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>

            <ScrollArea className="flex-1 px-3">
              <div className="py-4 space-y-3">
                {chatOnlyItems.length === 0 && (
                  <div className="flex gap-1.5">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="w-3 h-3 text-primary" />
                    </div>
                    <div className="bg-muted/50 border border-border/30 rounded-2xl rounded-bl-md px-3 py-2 max-w-[85%] text-xs">
                      Your ICP map is ready! Click <strong>Find Leads</strong> on any niche to start prospecting, or ask me anything about your market.
                    </div>
                  </div>
                )}
                {chatOnlyItems.map((item, i) => (
                  <div key={i}>
                    {item.type === "user" && (
                      <div className="flex justify-end gap-1.5">
                        <div className="bg-primary text-primary-foreground rounded-2xl rounded-br-md px-3 py-2 max-w-[85%] text-xs">{item.content}</div>
                        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                          <User className="w-3 h-3 text-muted-foreground" />
                        </div>
                      </div>
                    )}
                    {item.type === "assistant" && (
                      <div className="flex gap-1.5">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                          <Bot className="w-3 h-3 text-primary" />
                        </div>
                        <div className="bg-muted border border-border/40 rounded-2xl rounded-bl-md px-4 py-3 max-w-[85%] text-sm text-foreground prose prose-sm dark:prose-invert prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-strong:text-primary [&_ol]:list-decimal [&_ol]:pl-4 leading-relaxed">
                          <ReactMarkdown>{formatAssistantMessage(item.content)}</ReactMarkdown>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {isStreaming && chatOnlyItems[chatOnlyItems.length - 1]?.type !== "assistant" && (
                  <div className="flex gap-1.5">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Bot className="w-3 h-3 text-primary" />
                    </div>
                    <div className="bg-muted/50 border border-border/30 rounded-2xl rounded-bl-md px-3 py-2.5">
                      <Loader2 className="w-3.5 h-3.5 text-muted-foreground animate-spin" />
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
            </ScrollArea>

            <div className="border-t border-border/40 bg-card/80 backdrop-blur px-3 py-2 shrink-0">
              <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); sendMessage(); }}>
                <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about your market..." className="flex-1 bg-muted/20 border-border/40 h-8 text-xs" />
                <Button type="submit" size="icon" className="h-8 w-8" disabled={!input.trim()}><Send className="w-3.5 h-3.5" /></Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB */}
      {hasDiscovered && !chatOpen && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors"
          onClick={() => setChatOpen(true)}
        >
          <MessageSquare className="w-5 h-5" />
          {isStreaming && <span className="absolute top-0 right-0 w-3 h-3 rounded-full bg-primary border-2 border-background animate-pulse" />}
        </motion.button>
      )}
    </div>
  );

  return (
    <>
      <Helmet>
        <title>Xcrow — B2B Lead Hunter | Find Perfect Leads From One Website</title>
        <meta name="description" content="The only lead hunter that finds hyper-accurate B2B prospects from a single website entry. Drop your URL — AI finds, qualifies, and delivers your perfect leads." />
      </Helmet>
      <Navbar
        workspaces={workspaces}
        activeWorkspaceKey={activeWorkspaceKey}
        onSwitchWorkspace={handleSwitchWorkspace}
        onDeleteWorkspace={handleDeleteWorkspace}
        onNewWorkspace={handleNewWorkspace}
      />
      <div className="flex flex-col h-screen pt-14">
        {mainContent}
      </div>

      {/* Lead Detail Drawer */}
      <LeadDetailDrawer
        lead={selectedLead}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        outreach={outreach}
        onUpdateStatus={updateLeadStatus}
        onDraftEmail={handleDraftEmail}
        onDelete={deleteLead}
        userId={user?.id}
      />

      {/* Email Draft Modal */}
      <Dialog open={draftModalOpen} onOpenChange={setDraftModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-primary" /> Email to {draftLead?.name}
            </DialogTitle>
          </DialogHeader>
          {draftLoading ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">AI is drafting your email...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">To</label>
                <Input value={draftLead?.email || ""} disabled className="bg-muted/30 text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Subject</label>
                <Input value={draftSubject} onChange={(e) => setDraftSubject(e.target.value)} className="text-sm" placeholder="Email subject..." />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Body</label>
                <Textarea value={draftBody} onChange={(e) => setDraftBody(e.target.value)} className="text-sm min-h-[180px] whitespace-pre-wrap" placeholder="Email body..." />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0 sm:flex-wrap sm:justify-between">
            <p className="w-full text-xs text-muted-foreground sm:order-1">
              If your desktop email app does nothing, use Gmail or copy the draft.
            </p>
            <Button variant="ghost" size="sm" onClick={() => setDraftModalOpen(false)} disabled={sending}>
              <X className="w-3.5 h-3.5 mr-1" /> Cancel
            </Button>
            <Button variant="outline" size="sm" onClick={handleCopyDraft} disabled={draftLoading || sending || !draftSubject || !draftBody} className="gap-1.5">
              <Copy className="w-3.5 h-3.5" /> Copy Draft
            </Button>
            <Button variant="outline" size="sm" onClick={handleSendEmail} disabled={draftLoading || sending || !draftSubject || !draftBody} className="gap-1.5">
              <Mail className="w-3.5 h-3.5" /> Email App
            </Button>
            <Button size="sm" onClick={handleOpenGmailDraft} disabled={draftLoading || sending || !draftSubject || !draftBody} className="gap-1.5">
              {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              {sending ? "Opening..." : "Open in Gmail"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

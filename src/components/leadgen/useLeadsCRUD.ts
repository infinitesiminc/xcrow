import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { classifySeniority } from "@/lib/seniority-classifier";
import type { Lead } from "./LeadCard";

export type LeadStatus = "new" | "contacted" | "replied" | "won" | "lost";

export interface SavedLead extends Lead {
  id: string;
  status: LeadStatus;
  created_at: string;
  updated_at: string;
  niche_tag?: string;
  source?: string | null;
  workspace_key?: string;
  rating?: number | null;
  score?: number;
  seniority_rank?: number | null;
  decision_role?: string | null;
}

export interface OutreachEntry {
  id: string;
  lead_id: string;
  channel: string;
  subject: string | null;
  body: string | null;
  sent_at: string;
  status: string;
  lead_name?: string;
  lead_email?: string;
}

export type NicheType = "vertical" | "segment" | "persona";

export interface NicheEntry {
  id: string;
  label: string;
  description: string | null;
  status: string;
  lead_count: number;
  created_at: string;
  parent_label?: string | null;
  niche_type?: NicheType;
  workspace_key?: string;
}

export function useLeadsCRUD(userId: string | undefined, workspaceKey?: string) {
  const [leads, setLeads] = useState<SavedLead[]>([]);
  const [outreach, setOutreach] = useState<OutreachEntry[]>([]);
  const [niches, setNiches] = useState<NicheEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeads = useCallback(async () => {
    if (!userId || !workspaceKey) {
      setLeads([]);
      return;
    }

    const { data } = await (supabase.from("saved_leads") as any)
      .select("*")
      .eq("user_id", userId)
      .eq("workspace_key", workspaceKey)
      .order("created_at", { ascending: false });

    if (data) setLeads((data as any[]).map((d: any) => ({ ...d, score: d.rating ?? undefined })) as unknown as SavedLead[]);
  }, [userId, workspaceKey]);

  const fetchOutreach = useCallback(async () => {
    if (!userId || !workspaceKey) {
      setOutreach([]);
      return;
    }

    const { data } = await (supabase.from("outreach_log") as any)
      .select("*, saved_leads!inner(name, email, workspace_key)")
      .eq("user_id", userId)
      .eq("saved_leads.workspace_key", workspaceKey)
      .order("sent_at", { ascending: false })
      .limit(100);

    if (data) {
      setOutreach(
        data.map((r: any) => ({
          id: r.id,
          lead_id: r.lead_id,
          channel: r.channel,
          subject: r.subject,
          body: r.body,
          sent_at: r.sent_at,
          status: r.status,
          lead_name: r.saved_leads?.name,
          lead_email: r.saved_leads?.email,
        }))
      );
    }
  }, [userId, workspaceKey]);

  const fetchNiches = useCallback(async () => {
    if (!userId || !workspaceKey) {
      setNiches([]);
      return;
    }

    const { data } = await (supabase.from("leadgen_niches") as any)
      .select("*")
      .eq("user_id", userId)
      .eq("workspace_key", workspaceKey)
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (data) setNiches(data as unknown as NicheEntry[]);
  }, [userId, workspaceKey]);

  useEffect(() => {
    if (!userId || !workspaceKey) {
      setLeads([]);
      setOutreach([]);
      setNiches([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    Promise.all([fetchLeads(), fetchOutreach(), fetchNiches()]).finally(() => setLoading(false));
  }, [userId, workspaceKey, fetchLeads, fetchOutreach, fetchNiches]);

  const upsertLeads = useCallback(
    async (newLeads: Lead[]) => {
      if (!userId || !workspaceKey || newLeads.length === 0) return;

      const rows = newLeads.map((l) => {
        const seniority = classifySeniority(l.title);
        return {
          user_id: userId,
          workspace_key: workspaceKey,
          name: l.name,
          title: l.title || null,
          company: l.company || null,
          email: l.email || null,
          phone: l.phone || null,
          linkedin: l.linkedin || null,
          website: l.website || null,
          address: l.address || null,
          source: l.source || workspaceKey,
          email_confidence: l.email_confidence != null ? String(l.email_confidence) : null,
          summary: l.summary || null,
          reason: l.reason || null,
          photo_url: l.photo_url || null,
          status: "new" as const,
          niche_tag: l.niche_tag || null,
          rating: l.score != null ? l.score : null,
          persona_tag: l.persona_tag || null,
          apollo_id: (l as any).apollo_id || null,
          seniority_rank: seniority.rank,
          decision_role: seniority.decisionRole,
        };
      });

      for (const row of rows) {
        const { error } = await (supabase.from("saved_leads") as any).insert(row);
        if (error && !error.message?.includes("duplicate")) {
          console.error("Failed to insert lead:", error.message);
        }
      }

      await fetchLeads();
    },
    [userId, workspaceKey, fetchLeads]
  );

  const upsertNiches = useCallback(
    async (newNiches: { label: string; description: string; parent_label?: string | null; niche_type?: NicheType }[]) => {
      if (!userId || !workspaceKey || newNiches.length === 0) return;

      const rows = newNiches.map((n) => ({
        user_id: userId,
        workspace_key: workspaceKey,
        label: n.label.slice(0, 120),
        description: n.description || null,
        parent_label: n.parent_label || null,
        niche_type: n.niche_type || "vertical",
        status: "active",
      }));

      await (supabase.from("leadgen_niches") as any).upsert(rows, {
        onConflict: "user_id,workspace_key,label",
        ignoreDuplicates: true,
      });

      await fetchNiches();
    },
    [userId, workspaceKey, fetchNiches]
  );

  const deleteLead = useCallback(
    async (leadId: string) => {
      await supabase.from("saved_leads").delete().eq("id", leadId);
      setLeads((prev) => prev.filter((l) => l.id !== leadId));
    },
    []
  );

  const updateLeadStatus = useCallback(
    async (leadId: string, status: LeadStatus) => {
      await supabase.from("saved_leads").update({ status }).eq("id", leadId);
      setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, status } : l)));
    },
    []
  );

  const logOutreach = useCallback(
    async (leadId: string, channel: string, subject: string, body: string) => {
      if (!userId) return;
      await supabase.from("outreach_log").insert({
        user_id: userId,
        lead_id: leadId,
        channel,
        subject,
        body,
      });
      await fetchOutreach();
    },
    [userId, fetchOutreach]
  );

  const exportCSV = useCallback(() => {
    if (leads.length === 0) return;
    const headers = ["Name", "Title", "Company", "Email", "Phone", "LinkedIn", "Location", "Status", "Decision-Making Role", "Seniority Rank"];
    const rows = leads.map((l) => [l.name, l.title || "", l.company || "", l.email || "", l.phone || "", l.linkedin || "", l.address || "", l.status, l.decision_role || "", l.seniority_rank != null ? String(l.seniority_rank) : ""]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${(v || "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-${workspaceKey || "workspace"}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [leads, workspaceKey]);

  return { leads, outreach, niches, loading, upsertLeads, upsertNiches, updateLeadStatus, deleteLead, logOutreach, exportCSV, refetch: fetchLeads };
}

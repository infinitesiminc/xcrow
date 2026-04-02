import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Lead } from "./LeadCard";

export type LeadStatus = "new" | "contacted" | "replied" | "won" | "lost";

export interface SavedLead extends Lead {
  id: string;
  status: LeadStatus;
  created_at: string;
  updated_at: string;
  niche_tag?: string;
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

export interface NicheEntry {
  id: string;
  label: string;
  description: string | null;
  status: string;
  lead_count: number;
  created_at: string;
  parent_label?: string | null;
}

export function useLeadsCRUD(userId: string | undefined) {
  const [leads, setLeads] = useState<SavedLead[]>([]);
  const [outreach, setOutreach] = useState<OutreachEntry[]>([]);
  const [niches, setNiches] = useState<NicheEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeads = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from("saved_leads")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (data) setLeads(data as unknown as SavedLead[]);
  }, [userId]);

  const fetchOutreach = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from("outreach_log")
      .select("*, saved_leads(name, email)")
      .eq("user_id", userId)
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
  }, [userId]);

  const fetchNiches = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from("leadgen_niches")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("created_at", { ascending: false });
    if (data) setNiches(data as unknown as NicheEntry[]);
  }, [userId]);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    Promise.all([fetchLeads(), fetchOutreach(), fetchNiches()]).finally(() => setLoading(false));
  }, [userId, fetchLeads, fetchOutreach, fetchNiches]);

  const upsertLeads = useCallback(
    async (newLeads: Lead[]) => {
      if (!userId || newLeads.length === 0) return;
      const rows = newLeads.map((l) => ({
        user_id: userId,
        name: l.name,
        title: l.title || null,
        company: l.company || null,
        email: l.email || null,
        phone: l.phone || null,
        linkedin: l.linkedin || null,
        website: l.website || null,
        address: l.address || null,
        source: l.source || "chat",
        email_confidence: l.email_confidence != null ? String(l.email_confidence) : null,
        summary: l.summary || null,
        reason: l.reason || null,
        photo_url: l.photo_url || null,
        status: "new" as const,
        niche_tag: l.niche_tag || null,
      }));
      await supabase.from("saved_leads").upsert(rows, {
        onConflict: "user_id,email,company",
        ignoreDuplicates: true,
      } as any);
      await fetchLeads();
    },
    [userId, fetchLeads]
  );

  const upsertNiches = useCallback(
    async (newNiches: { label: string; description: string }[]) => {
      if (!userId || newNiches.length === 0) return;
      const rows = newNiches.map((n) => ({
        user_id: userId,
        label: n.label.slice(0, 120),
        description: n.description || null,
        status: "active",
      }));
      // Use upsert on user_id+label unique constraint
      await (supabase.from("leadgen_niches") as any).upsert(rows, {
        onConflict: "user_id,label",
        ignoreDuplicates: true,
      });
      await fetchNiches();
    },
    [userId, fetchNiches]
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
    const headers = ["Name", "Title", "Company", "Email", "Phone", "LinkedIn", "Status", "Source"];
    const rows = leads.map((l) => [l.name, l.title || "", l.company || "", l.email || "", l.phone || "", l.linkedin || "", l.status, l.source || ""]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${(v || "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [leads]);

  return { leads, outreach, niches, loading, upsertLeads, upsertNiches, updateLeadStatus, logOutreach, exportCSV, refetch: fetchLeads };
}

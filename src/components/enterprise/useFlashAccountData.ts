import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AccountContact {
  id: string;
  account_id: string;
  name: string;
  title: string | null;
  email: string | null;
  phone: string | null;
  linkedin: string | null;
  score: number | null;
  reason: string | null;
  outreach_status: string;
  created_at: string;
}

export interface AccountActivity {
  id: string;
  account_id: string;
  activity_type: string;
  description: string;
  metadata: Record<string, any>;
  user_id: string | null;
  created_at: string;
}

export interface LinkedGarage {
  id: string;
  name: string;
  address: string | null;
  lat: number;
  lng: number;
  rating: number | null;
  reviews_count: number | null;
  capacity: number | null;
  operator_guess: string | null;
}

export function useFlashAccountData(accountId: string | null) {
  const [contacts, setContacts] = useState<AccountContact[]>([]);
  const [activities, setActivities] = useState<AccountActivity[]>([]);
  const [linkedGarages, setLinkedGarages] = useState<LinkedGarage[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!accountId) {
      setContacts([]);
      setActivities([]);
      setLinkedGarages([]);
      return;
    }
    setLoading(true);
    try {
      const [contactsRes, activitiesRes, garagesRes] = await Promise.all([
        (supabase.from("flash_account_contacts") as any)
          .select("*")
          .eq("account_id", accountId)
          .order("score", { ascending: false, nullsFirst: false }),
        (supabase.from("flash_account_activities") as any)
          .select("*")
          .eq("account_id", accountId)
          .order("created_at", { ascending: false })
          .limit(50),
        (supabase.from("discovered_garages") as any)
          .select("id,name,address,lat,lng,rating,reviews_count,capacity,operator_guess")
          .eq("account_id", accountId)
          .order("capacity", { ascending: false, nullsFirst: false }),
      ]);
      if (contactsRes.data) setContacts(contactsRes.data);
      if (activitiesRes.data) setActivities(activitiesRes.data);
      if (garagesRes.data) setLinkedGarages(garagesRes.data);
    } catch (e) {
      console.error("Failed to fetch account data:", e);
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  const saveContacts = useCallback(async (
    acctId: string,
    leads: { name: string; title?: string; email?: string; linkedin?: string; score?: number; reason?: string }[]
  ) => {
    if (!leads.length) return;
    const rows = leads.map((l) => ({
      account_id: acctId,
      name: l.name,
      title: l.title || null,
      email: l.email || null,
      linkedin: l.linkedin || null,
      score: l.score ?? null,
      reason: l.reason || null,
      outreach_status: "new",
    }));
    const { error } = await (supabase.from("flash_account_contacts") as any).upsert(rows, {
      onConflict: "account_id,name",
      ignoreDuplicates: true,
    });
    if (error) console.error("Failed to save contacts:", error.message);
    // Re-fetch
    const { data } = await (supabase.from("flash_account_contacts") as any)
      .select("*")
      .eq("account_id", acctId)
      .order("score", { ascending: false, nullsFirst: false });
    if (data) setContacts(data);
  }, []);

  const logActivity = useCallback(async (
    acctId: string,
    activityType: string,
    description: string,
    metadata: Record<string, any> = {}
  ) => {
    await (supabase.from("flash_account_activities") as any).insert({
      account_id: acctId,
      activity_type: activityType,
      description,
      metadata,
    });
  }, []);

  const updateStage = useCallback(async (acctId: string, newStage: string) => {
    await (supabase.from("flash_accounts") as any)
      .update({ stage: newStage, updated_at: new Date().toISOString() })
      .eq("id", acctId);
    await logActivity(acctId, "stage_change", `Stage changed to ${newStage}`);
  }, [logActivity]);

  const updateNotes = useCallback(async (acctId: string, notes: string) => {
    await (supabase.from("flash_accounts") as any)
      .update({ notes, updated_at: new Date().toISOString() })
      .eq("id", acctId);
  }, []);

  return {
    contacts, activities, linkedGarages, loading,
    fetchAll, saveContacts, logActivity, updateStage, updateNotes,
  };
}

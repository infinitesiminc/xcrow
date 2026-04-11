import { useCallback, useState } from "react";
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

interface Activity {
  id: string;
  account_id: string;
  activity_type: string;
  description: string;
  created_at: string;
  metadata: any;
}

interface LinkedGarage {
  id: string;
  name: string;
  address: string | null;
  capacity: number | null;
  rating: number | null;
}

export function useFlashAccountData(accountId: string) {
  const [contacts, setContacts] = useState<AccountContact[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [linkedGarages, setLinkedGarages] = useState<LinkedGarage[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [contactsRes, activitiesRes, garagesRes] = await Promise.all([
        (supabase.from("flash_account_contacts") as any).select("*").eq("account_id", accountId).order("score", { ascending: false }),
        (supabase.from("flash_account_activities") as any).select("*").eq("account_id", accountId).order("created_at", { ascending: false }).limit(20),
        (supabase.from("discovered_garages") as any).select("id, name, address, capacity, rating").eq("account_id", accountId),
      ]);
      setContacts(contactsRes.data || []);
      setActivities(activitiesRes.data || []);
      setLinkedGarages(garagesRes.data || []);
    } catch (e) {
      console.error("Failed to fetch account data:", e);
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  const saveContacts = useCallback(async (accId: string, leads: { name: string; title?: string; email?: string; linkedin?: string; score?: number; reason?: string }[]) => {
    for (const lead of leads) {
      await (supabase.from("flash_account_contacts") as any).upsert({
        account_id: accId,
        name: lead.name,
        title: lead.title || null,
        email: lead.email || null,
        linkedin: lead.linkedin || null,
        score: lead.score ?? null,
        reason: lead.reason || null,
        outreach_status: "new",
      }, { onConflict: "account_id,name" }).select();
    }
    // Refetch
    const { data } = await (supabase.from("flash_account_contacts") as any).select("*").eq("account_id", accId).order("score", { ascending: false });
    if (data) setContacts(data);
  }, []);

  const logActivity = useCallback(async (accId: string, activityType: string, description: string, metadata: any = {}) => {
    await (supabase.from("flash_account_activities") as any).insert({
      account_id: accId,
      activity_type: activityType,
      description,
      metadata,
    });
  }, []);

  const updateStage = useCallback(async (accId: string, stage: string) => {
    await (supabase.from("flash_accounts") as any).update({ stage }).eq("id", accId);
    await logActivity(accId, "stage_change", `Stage changed to ${stage}`);
  }, [logActivity]);

  return { contacts, activities, linkedGarages, loading, fetchAll, saveContacts, logActivity, updateStage };
}

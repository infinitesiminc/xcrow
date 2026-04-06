import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface UserWorkspace {
  id: string;
  website_key: string;
  display_name: string | null;
  logo_url: string | null;
  last_accessed_at: string;
  created_at: string;
}

export function useWorkspaces(userId: string | undefined) {
  const [workspaces, setWorkspaces] = useState<UserWorkspace[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchWorkspaces = useCallback(async () => {
    if (!userId) { setWorkspaces([]); return; }
    setLoading(true);
    const { data } = await (supabase.from("user_workspaces") as any)
      .select("*")
      .eq("user_id", userId)
      .order("last_accessed_at", { ascending: false });
    if (data) setWorkspaces(data as UserWorkspace[]);
    setLoading(false);
  }, [userId]);

  useEffect(() => { fetchWorkspaces(); }, [fetchWorkspaces]);

  const upsertWorkspace = useCallback(async (websiteKey: string, displayName?: string, logoUrl?: string) => {
    if (!userId || !websiteKey) return;
    await (supabase.from("user_workspaces") as any).upsert({
      user_id: userId,
      website_key: websiteKey,
      display_name: displayName || websiteKey,
      logo_url: logoUrl || null,
      last_accessed_at: new Date().toISOString(),
    }, { onConflict: "user_id,website_key" });
    await fetchWorkspaces();
  }, [userId, fetchWorkspaces]);

  const touchWorkspace = useCallback(async (websiteKey: string) => {
    if (!userId || !websiteKey) return;
    await (supabase.from("user_workspaces") as any)
      .update({ last_accessed_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("website_key", websiteKey);
  }, [userId]);

  const deleteWorkspace = useCallback(async (websiteKey: string) => {
    if (!userId || !websiteKey) return;
    await (supabase.from("user_workspaces") as any)
      .delete()
      .eq("user_id", userId)
      .eq("website_key", websiteKey);
    await fetchWorkspaces();
  }, [userId, fetchWorkspaces]);

  return { workspaces, loading, upsertWorkspace, touchWorkspace, deleteWorkspace, refetch: fetchWorkspaces };
}

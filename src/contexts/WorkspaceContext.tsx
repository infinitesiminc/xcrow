import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const SUPERADMIN_IDS = [
  "7be41055-be68-4cab-b63c-f3b0c483e6eb",
  "bb10735b-051e-4bb5-918e-931a9c79d0fd",
];

interface WorkspaceInfo {
  id: string;
  name: string;
  join_code: string;
}

interface WorkspaceContextType {
  workspace: WorkspaceInfo | null;
  workspaceId: string | null;
  loading: boolean;
  isSuperAdmin: boolean;
  /** True when superadmin is viewing another workspace via ?workspace= */
  isImpersonating: boolean;
  /** Refresh workspace data */
  refresh: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType>({
  workspace: null,
  workspaceId: null,
  loading: true,
  isSuperAdmin: false,
  isImpersonating: false,
  refresh: async () => {},
});

export const useWorkspace = () => useContext(WorkspaceContext);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [workspace, setWorkspace] = useState<WorkspaceInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const isSuperAdmin = !!user && SUPERADMIN_IDS.includes(user.id);
  const overrideWsId = searchParams.get("workspace");
  const isImpersonating = isSuperAdmin && !!overrideWsId;

  const fetchWorkspace = useCallback(async () => {
    if (!user) {
      setWorkspace(null);
      setLoading(false);
      return;
    }
    setLoading(true);

    // If superadmin passes ?workspace=<id>, use that
    if (isSuperAdmin && overrideWsId) {
      const { data } = await supabase
        .from("company_workspaces")
        .select("id, name, join_code")
        .eq("id", overrideWsId)
        .single();
      setWorkspace(data ?? null);
      setLoading(false);
      return;
    }

    // Otherwise, find user's own workspace (creator first, then member)
    let { data } = await supabase
      .from("company_workspaces")
      .select("id, name, join_code")
      .eq("created_by", user.id)
      .limit(1)
      .maybeSingle();

    if (!data) {
      const { data: membership } = await supabase
        .from("workspace_members")
        .select("workspace_id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

      if (membership) {
        const { data: ws } = await supabase
          .from("company_workspaces")
          .select("id, name, join_code")
          .eq("id", membership.workspace_id)
          .single();
        data = ws;
      }
    }

    setWorkspace(data ?? null);
    setLoading(false);
  }, [user, isSuperAdmin, overrideWsId]);

  useEffect(() => {
    fetchWorkspace();
  }, [fetchWorkspace]);

  return (
    <WorkspaceContext.Provider value={{
      workspace,
      workspaceId: workspace?.id ?? null,
      loading,
      isSuperAdmin,
      isImpersonating,
      refresh: fetchWorkspace,
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

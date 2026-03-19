import { useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface UsageGateResult {
  allowed: boolean;
  used: number;
  limit: number;
  loading: boolean;
  check: () => Promise<boolean>;
  increment: () => Promise<void>;
}

export function useUsageGate(type: "analysis" | "simulation"): UsageGateResult {
  const { user, isPro } = useAuth();
  const [used, setUsed] = useState(0);
  const [limit, setLimit] = useState(3);
  const [allowed, setAllowed] = useState(true);
  const [loading, setLoading] = useState(false);

  const check = useCallback(async (): Promise<boolean> => {
    if (isPro || !user) {
      setAllowed(true);
      return true;
    }
    setLoading(true);
    try {
      const { data } = await supabase.rpc("check_usage_limit" as any, {
        _user_id: user.id,
        _type: type,
      });
      const result = data as any;
      if (result) {
        setUsed(result.used ?? 0);
        setLimit(result.limit ?? 3);
        setAllowed(result.allowed ?? false);
        setLoading(false);
        return result.allowed ?? false;
      }
    } catch (err) {
      console.error("Usage check failed:", err);
    }
    setLoading(false);
    return true; // fail open
  }, [user, isPro, type]);

  const increment = useCallback(async () => {
    if (isPro || !user) return;
    try {
      await supabase.rpc("increment_usage" as any, {
        _user_id: user.id,
        _type: type,
      });
    } catch (err) {
      console.error("Usage increment failed:", err);
    }
  }, [user, isPro, type]);

  return { allowed, used, limit, loading, check, increment };
}

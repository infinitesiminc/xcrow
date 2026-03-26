import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useCredits() {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setBalance(0);
      setLoading(false);
      return;
    }
    const { data } = await supabase.rpc("get_credit_balance" as any, { _user_id: user.id });
    setBalance(typeof data === "number" ? data : 0);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const deduct = useCallback(async (amount: number, reason: string, metadata?: Record<string, any>): Promise<boolean> => {
    if (!user) return false;
    const { data } = await supabase.rpc("deduct_credits" as any, {
      _user_id: user.id,
      _amount: amount,
      _reason: reason,
      _metadata: metadata || {},
    });
    if (data === true) {
      setBalance(prev => prev - amount);
      return true;
    }
    return false;
  }, [user]);

  return { balance, loading, refresh, deduct };
}

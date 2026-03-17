import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Reads a feature flag from the feature_flags table.
 * Returns { enabled, loading }.
 */
export function useFeatureFlag(key: string) {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("feature_flags" as any)
        .select("enabled")
        .eq("key", key)
        .single();
      setEnabled(!!(data as any)?.enabled);
      setLoading(false);
    })();
  }, [key]);

  return { enabled, loading };
}

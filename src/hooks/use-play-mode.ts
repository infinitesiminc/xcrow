import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type PlayMode = "explorer" | "fast_track";

export function usePlayMode() {
  const { user } = useAuth();
  const [mode, setModeState] = useState<PlayMode>("explorer");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("play_mode")
        .eq("id", user.id)
        .single();
      if (data) {
        const row = data as any;
        setModeState(row.play_mode === "fast_track" ? "fast_track" : "explorer");
      }
      setLoading(false);
    })();
  }, [user]);

  const setMode = useCallback(async (newMode: PlayMode) => {
    if (!user) return;
    setModeState(newMode);
    await supabase
      .from("profiles")
      .update({ play_mode: newMode } as any)
      .eq("id", user.id);
  }, [user]);

  return { mode, setMode, loading };
}

/**
 * Adaptive Mode Nudge — detects behavioral signals and suggests
 * Explorer ↔ Fast Track mode switching via a dismissible toast.
 *
 * Triggers:
 * - Explorer user with short avg sessions (<8 min) → suggest Fast Track
 * - Fast Track user with long avg sessions (>25 min) → suggest Explorer
 * - Explorer user who skips lore (>3 sim starts within 5 min) → suggest Fast Track
 * - Fast Track user browsing map/territory pages often → suggest Explorer
 */
import { useEffect, useRef, useCallback } from "react";
import { usePlayMode, type PlayMode } from "@/hooks/use-play-mode";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const NUDGE_COOLDOWN_KEY = "mode_nudge_dismissed_at";
const COOLDOWN_MS = 3 * 24 * 60 * 60 * 1000; // 3 days
const SESSION_START_KEY = "session_start_ts";
const SIM_STARTS_KEY = "sim_starts_recent";

function wasDismissedRecently(): boolean {
  try {
    const ts = localStorage.getItem(NUDGE_COOLDOWN_KEY);
    if (!ts) return false;
    return Date.now() - Number(ts) < COOLDOWN_MS;
  } catch {
    return false;
  }
}

function dismissNudge() {
  try { localStorage.setItem(NUDGE_COOLDOWN_KEY, String(Date.now())); } catch {}
}

function getSessionMinutes(): number {
  try {
    const start = Number(localStorage.getItem(SESSION_START_KEY) || "0");
    if (!start) return 0;
    return (Date.now() - start) / 60_000;
  } catch { return 0; }
}

function recordSessionStart() {
  try {
    if (!localStorage.getItem(SESSION_START_KEY)) {
      localStorage.setItem(SESSION_START_KEY, String(Date.now()));
    }
  } catch {}
}

function recordSimStart() {
  try {
    const raw = localStorage.getItem(SIM_STARTS_KEY);
    const starts: number[] = raw ? JSON.parse(raw) : [];
    starts.push(Date.now());
    // Keep only last 10
    const trimmed = starts.slice(-10);
    localStorage.setItem(SIM_STARTS_KEY, JSON.stringify(trimmed));
  } catch {}
}

function getRecentSimStartCount(withinMinutes: number): number {
  try {
    const raw = localStorage.getItem(SIM_STARTS_KEY);
    if (!raw) return 0;
    const starts: number[] = JSON.parse(raw);
    const cutoff = Date.now() - withinMinutes * 60_000;
    return starts.filter(t => t > cutoff).length;
  } catch { return 0; }
}

export function useAdaptiveModeNudge() {
  const { user } = useAuth();
  const { mode, setMode } = usePlayMode();
  const { toast } = useToast();
  const nudgedRef = useRef(false);

  // Track session start
  useEffect(() => {
    if (user) recordSessionStart();
  }, [user]);

  const checkAndNudge = useCallback(() => {
    if (!user || nudgedRef.current || wasDismissedRecently()) return;

    const sessionMin = getSessionMinutes();

    // Explorer → Fast Track nudges
    if (mode === "explorer") {
      // Short session pattern
      if (sessionMin > 5 && sessionMin < 8) {
        nudgedRef.current = true;
        showNudge("fast_track");
        return;
      }
      // Rapid sim starts (skipping lore)
      if (getRecentSimStartCount(5) >= 3) {
        nudgedRef.current = true;
        showNudge("fast_track");
        return;
      }
    }

    // Fast Track → Explorer nudges
    if (mode === "fast_track") {
      if (sessionMin > 25) {
        nudgedRef.current = true;
        showNudge("explorer");
        return;
      }
    }
  }, [user, mode]);

  const showNudge = (suggestedMode: PlayMode) => {
    const isExplorer = suggestedMode === "explorer";
    toast({
      title: isExplorer ? "🗺️ Enjoying the journey?" : "⚡ Short on time?",
      description: isExplorer
        ? "You've been playing a while — switch to Explorer mode for the full RPG experience with lore and side quests."
        : "Switch to Fast Track for quick, focused skill sprints without the lore.",
      duration: 12000,
      action: (
        <div className="flex gap-2 mt-1">
          <button
            onClick={() => { setMode(suggestedMode); dismissNudge(); }}
            className="px-3 py-1 text-xs font-semibold rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Switch
          </button>
          <button
            onClick={() => dismissNudge()}
            className="px-3 py-1 text-xs font-semibold rounded-full bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
          >
            Not now
          </button>
        </div>
      ),
    });
  };

  // Check periodically (every 2 min)
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(checkAndNudge, 120_000);
    // Also check once after initial load
    const timeout = setTimeout(checkAndNudge, 30_000);
    return () => { clearInterval(interval); clearTimeout(timeout); };
  }, [user, checkAndNudge]);

  return { recordSimStart };
}

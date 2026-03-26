/**
 * useSimCheckpoints — Save and resume mid-simulation checkpoints.
 */
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { SimMessage, SimSession, SimMode, LearningObjective } from "@/lib/simulator";

export interface SimCheckpoint {
  id: string;
  taskName: string;
  jobTitle: string;
  company: string | null;
  level: number;
  mode: string;
  roundCount: number;
  turnCount: number;
  messages: SimMessage[];
  objectiveStatus: Record<string, boolean>;
  scaffoldingTiers: Record<string, number>;
  objectiveFailCounts: Record<string, number>;
  sessionData: any;
  createdAt: string;
  updatedAt: string;
}

export function useSimCheckpoints() {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);

  const saveCheckpoint = useCallback(async (data: {
    taskName: string;
    jobTitle: string;
    company?: string;
    level: number;
    mode: SimMode;
    roundCount: number;
    turnCount: number;
    messages: SimMessage[];
    objectiveStatus: Record<string, boolean>;
    scaffoldingTiers: Record<string, number>;
    objectiveFailCounts: Record<string, number>;
    session: SimSession | null;
  }): Promise<string | null> => {
    if (!user) return null;
    setSaving(true);
    try {
      // Upsert: update existing active checkpoint for same task, or create new
      const { data: existing } = await supabase
        .from("sim_checkpoints" as any)
        .select("id")
        .eq("user_id", user.id)
        .eq("task_name", data.taskName)
        .eq("job_title", data.jobTitle)
        .eq("status", "active")
        .limit(1)
        .single();

      const payload = {
        user_id: user.id,
        task_name: data.taskName,
        job_title: data.jobTitle,
        company: data.company || null,
        level: data.level,
        mode: data.mode,
        round_count: data.roundCount,
        turn_count: data.turnCount,
        messages: data.messages,
        objective_status: data.objectiveStatus,
        scaffolding_tiers: data.scaffoldingTiers,
        objective_fail_counts: data.objectiveFailCounts,
        session_data: data.session ? {
          sessionId: data.session.sessionId,
          systemPrompt: data.session.systemPrompt,
          openingMessage: data.session.openingMessage,
          briefing: data.session.briefing,
          tips: data.session.tips,
          learningObjectives: data.session.learningObjectives,
          scenario: data.session.scenario,
          config: data.session.config,
          level: data.session.level,
        } : {},
        updated_at: new Date().toISOString(),
        status: "active",
      };

      if (existing && (existing as any).id) {
        await supabase
          .from("sim_checkpoints" as any)
          .update(payload as any)
          .eq("id", (existing as any).id);
        return (existing as any).id;
      } else {
        const { data: inserted } = await supabase
          .from("sim_checkpoints" as any)
          .insert(payload as any)
          .select("id")
          .single();
        return (inserted as any)?.id || null;
      }
    } catch (err) {
      console.error("Failed to save checkpoint:", err);
      return null;
    } finally {
      setSaving(false);
    }
  }, [user]);

  const loadCheckpoints = useCallback(async (): Promise<SimCheckpoint[]> => {
    if (!user) return [];
    const { data } = await supabase
      .from("sim_checkpoints" as any)
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("updated_at", { ascending: false })
      .limit(10);
    if (!data) return [];
    return (data as any[]).map(row => ({
      id: row.id,
      taskName: row.task_name,
      jobTitle: row.job_title,
      company: row.company,
      level: row.level,
      mode: row.mode,
      roundCount: row.round_count,
      turnCount: row.turn_count,
      messages: row.messages || [],
      objectiveStatus: row.objective_status || {},
      scaffoldingTiers: row.scaffolding_tiers || {},
      objectiveFailCounts: row.objective_fail_counts || {},
      sessionData: row.session_data || {},
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }, [user]);

  const deleteCheckpoint = useCallback(async (id: string) => {
    if (!user) return;
    await supabase
      .from("sim_checkpoints" as any)
      .update({ status: "completed" } as any)
      .eq("id", id);
  }, [user]);

  return { saveCheckpoint, loadCheckpoints, deleteCheckpoint, saving };
}

import { supabase } from "@/integrations/supabase/client";

export type SimMode = "assess" | "upskill";

export interface SimScenario {
  id: string;
  title: string;
  description: string;
  slug: string;
  difficulty?: number;
}

export interface SimSession {
  sessionId: string;
  systemPrompt: string;
  openingMessage: string;
  briefing: string;
  tips: string[];
  scenario: SimScenario;
}

export interface SimMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface SimScoreResult {
  overall: number;
  categories: { name: string; score: number; feedback: string }[];
  summary: string;
}

async function simFetch<T>(action: string, payload: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke("sim-chat", {
    body: { action, payload },
  });
  if (error) throw new Error(`Simulator error: ${error.message}`);
  return data as T;
}

export async function compileSession(
  taskName: string,
  jobTitle: string,
  company?: string,
  difficulty = 3,
  mode: SimMode = "assess",
  taskMeta?: { currentState?: string; trend?: string; impactLevel?: string },
): Promise<SimSession> {
  return simFetch("compile", { taskName, jobTitle, company, difficulty, mode, taskMeta });
}

export async function chatTurn(
  messages: SimMessage[],
  round: number,
  turnCount: number,
  role: string,
  mode: SimMode = "assess",
  taskMeta?: { currentState?: string; trend?: string; impactLevel?: string },
): Promise<string> {
  const { data, error } = await supabase.functions.invoke("sim-chat", {
    body: { action: "chat", payload: { messages, round, turnCount, role, mode, taskMeta } },
  });
  if (error) throw new Error(`Chat error: ${error.message}`);
  return typeof data === "string" ? data : JSON.stringify(data);
}

export async function scoreSession(
  transcript: SimMessage[],
  scenario: SimScenario | null,
  mode: SimMode = "assess",
): Promise<SimScoreResult> {
  return simFetch("score", { transcript, scenario, mode });
}

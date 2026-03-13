import { supabase } from "@/integrations/supabase/client";

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
): Promise<SimSession> {
  return simFetch("compile", { taskName, jobTitle, company, difficulty });
}

export async function chatTurn(
  messages: SimMessage[],
  round: number,
  turnCount: number,
  role: string,
): Promise<string> {
  const { data, error } = await supabase.functions.invoke("sim-chat", {
    body: { action: "chat", payload: { messages, round, turnCount, role } },
  });
  if (error) throw new Error(`Chat error: ${error.message}`);
  return typeof data === "string" ? data : JSON.stringify(data);
}

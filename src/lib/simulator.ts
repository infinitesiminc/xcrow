const SIM_API = "https://zwwyomcqvthlgjvphwym.supabase.co/functions/v1/sim-api";
const SIM_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3d3lvbWNxdnRobGdqdnBod3ltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MDI2MDgsImV4cCI6MjA4NjQ3ODYwOH0.bo9-sl3w1hOYY6UTXme8BEgrrw_UubuxwjwemTZMo8c";

const headers = {
  "Content-Type": "application/json",
  apikey: SIM_ANON_KEY,
};

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
  scenario: SimScenario;
}

export interface SimMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface SimScore {
  overall: number;
  categories: { name: string; score: number; feedback: string }[];
  summary: string;
}

async function simFetch<T>(action: string, payload: Record<string, unknown>): Promise<T> {
  const res = await fetch(SIM_API, {
    method: "POST",
    headers,
    body: JSON.stringify({ action, payload }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Simulator error (${res.status}): ${text}`);
  }
  return res.json();
}

export async function fetchScenarios(slug: string): Promise<SimScenario[]> {
  return simFetch("scenarios", { slug });
}

export async function compileSession(scenarioId: string, difficulty = 3): Promise<SimSession> {
  return simFetch("compile", { scenarioId, difficulty });
}

export async function chatTurn(
  messages: SimMessage[],
  round: number,
  turnCount: number,
  role: string,
): Promise<string> {
  const res = await fetch(SIM_API, {
    method: "POST",
    headers,
    body: JSON.stringify({ action: "chat", payload: { messages, round, turnCount, role } }),
  });
  if (!res.ok) throw new Error(`Chat error: ${res.status}`);
  
  // Handle streaming or plain text
  const text = await res.text();
  return text;
}

export async function scoreTranscript(
  transcript: SimMessage[],
  scenario: SimScenario,
): Promise<SimScore> {
  return simFetch("score", { transcript, scenario });
}

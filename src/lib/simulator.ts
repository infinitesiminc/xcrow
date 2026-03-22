import { supabase } from "@/integrations/supabase/client";

export type SimMode = "assess" | "upskill";

export interface LearningObjective {
  id: string;
  label: string;
  description: string;
  pillar: string;
}

export interface SimScenario {
  id: string;
  title: string;
  description: string;
  slug: string;
  difficulty?: number;
}

export interface SimConfig {
  minRounds: number;
  maxRounds: number;
  objectiveCount: number;
}

export interface SimSession {
  sessionId: string;
  systemPrompt: string;
  openingMessage: string;
  briefing: string;
  tips: string[];
  learningObjectives: LearningObjective[];
  scenario: SimScenario;
  config?: SimConfig;
}

export interface SimMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ObjectiveResult {
  id: string;
  label: string;
  met: boolean;
  evidence: string;
  assisted?: boolean;
}

export interface ElevationNarrative {
  before: string;
  after: string;
  shift_summary: string;
  emerging_skills: string[];
  analogy: string;
}

export interface SimScoreResult {
  overall: number;
  categories: { name: string; score: number; feedback: string }[];
  summary: string;
  objectiveResults?: ObjectiveResult[];
}

async function simFetch<T>(action: string, payload: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke("sim-chat", {
    body: { action, payload },
  });
  if (error) throw new Error(`Simulator error: ${error.message}`);
  return data as T;
}

export interface CoachingContext {
  weakCategory: string;
  weakScore: number;
  tip: string;
  previousOverall: number;
}

export async function compileSession(
  taskName: string,
  jobTitle: string,
  company?: string,
  difficulty = 3,
  mode: SimMode = "assess",
  taskMeta?: { currentState?: string; trend?: string; impactLevel?: string },
  coaching?: CoachingContext,
): Promise<SimSession> {
  return simFetch("compile", { taskName, jobTitle, company, difficulty, mode, taskMeta, coaching });
}

export async function chatTurn(
  messages: SimMessage[],
  round: number,
  turnCount: number,
  role: string,
  mode: SimMode = "assess",
  taskMeta?: { currentState?: string; trend?: string; impactLevel?: string },
  learningObjectives?: LearningObjective[],
  objectiveStatus?: Record<string, boolean>,
  scaffoldingTiers?: Record<string, number>,
  targetObjectiveId?: string,
): Promise<string> {
  const { data, error } = await supabase.functions.invoke("sim-chat", {
    body: { action: "chat", payload: { messages, round, turnCount, role, mode, taskMeta, learningObjectives, objectiveStatus, scaffoldingTiers, targetObjectiveId } },
  });
  if (error) throw new Error(`Chat error: ${error.message}`);
  return typeof data === "string" ? data : JSON.stringify(data);
}

export async function scoreSession(
  transcript: SimMessage[],
  scenario: SimScenario | null,
  mode: SimMode = "assess",
  learningObjectives?: LearningObjective[],
  scaffoldingTiers?: Record<string, number>,
): Promise<SimScoreResult> {
  return simFetch("score", { transcript, scenario, mode, learningObjectives, scaffoldingTiers });
}

export async function generateElevation(
  jobTitle: string,
  taskName: string,
  company?: string,
  tasks?: { name: string; aiExposure?: number }[],
): Promise<ElevationNarrative> {
  return simFetch("elevate", { jobTitle, company, taskName, tasks });
}

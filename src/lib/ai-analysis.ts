import { JobAnalysisResult } from "@/types/analysis";

export async function analyzeJobWithAI(
  jobTitle: string,
  company: string,
  jobDescription?: string,
  jdUrl?: string,
): Promise<JobAnalysisResult> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Backend not configured");
  }

  const response = await fetch(`${supabaseUrl}/functions/v1/analyze-job`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${supabaseKey}`,
    },
    body: JSON.stringify({ jobTitle, company, jobDescription, jdUrl }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to analyze job");
  }

  const data = await response.json();
  return data as JobAnalysisResult;
}

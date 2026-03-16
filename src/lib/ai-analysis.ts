import { JobAnalysisResult } from "@/types/analysis";
import { supabase } from "@/integrations/supabase/client";

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

  // Use the user's session token if available for usage tracking
  const { data: { session } } = await supabase.auth.getSession();
  const authToken = session?.access_token || supabaseKey;

  const response = await fetch(`${supabaseUrl}/functions/v1/analyze-job`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
      apikey: supabaseKey,
    },
    body: JSON.stringify({ jobTitle, company, jobDescription, jdUrl }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    if (errorData.error === "usage_limit") {
      const err = new Error(errorData.message || "Usage limit reached");
      (err as any).code = "usage_limit";
      (err as any).used = errorData.used;
      (err as any).limit = errorData.limit;
      throw err;
    }
    throw new Error(errorData.error || "Failed to analyze job");
  }

  const data = await response.json();
  return data as JobAnalysisResult;
}

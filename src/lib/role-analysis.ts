import { supabase } from "@/integrations/supabase/client";
import type { JobAnalysisResult, SkillCategory, SkillPriority, TaskAnalysis, TaskPriority } from "@/types/analysis";

const toTaskState = (value: string | null | undefined): TaskAnalysis["currentState"] => {
  if (value === "mostly_human" || value === "human_ai" || value === "mostly_ai") return value;
  return "human_ai";
};

const toTrend = (value: string | null | undefined): TaskAnalysis["trend"] => {
  if (value === "stable" || value === "increasing_ai" || value === "fully_ai_soon") return value;
  return "increasing_ai";
};

const toImpact = (value: string | null | undefined): TaskAnalysis["impactLevel"] => {
  if (value === "low" || value === "medium" || value === "high") return value;
  return "medium";
};

const toTaskPriority = (value: string | null | undefined): TaskPriority => {
  if (value === "low" || value === "medium" || value === "high") return value;
  return "medium";
};

const toSkillPriority = (value: string | null | undefined): SkillPriority => {
  if (value === "low" || value === "medium" || value === "high") return value;
  return "medium";
};

const toSkillCategory = (value: string | null | undefined): SkillCategory => {
  if (value === "ai_tools" || value === "human_skills" || value === "new_capabilities") return value;
  if (value?.includes("human")) return "human_skills";
  if (value?.includes("tool")) return "ai_tools";
  return "new_capabilities";
};

export async function fetchStructuredRoleAnalysis(
  jobTitle: string,
  company?: string,
): Promise<(JobAnalysisResult & { jobId: string }) | null> {
  if (!jobTitle.trim()) return null;

  const normalizedCompany = company?.trim() || "";

  const jobQuery = normalizedCompany
    ? supabase
        .from("jobs")
        .select("id, title, augmented_percent, automation_risk_percent, new_skills_percent, companies!inner(name)")
        .eq("title", jobTitle)
        .eq("companies.name", normalizedCompany)
        .limit(1)
        .maybeSingle()
    : supabase
        .from("jobs")
        .select("id, title, augmented_percent, automation_risk_percent, new_skills_percent, companies(name)")
        .eq("title", jobTitle)
        .limit(1)
        .maybeSingle();

  const { data: jobData, error: jobError } = (await jobQuery) as { data: any; error: any };
  if (jobError || !jobData?.id) return null;

  const [taskRes, skillRes] = await Promise.all([
    supabase
      .from("job_task_clusters")
      .select("cluster_name, description, ai_exposure_score, job_impact_score, priority, ai_state, ai_trend, impact_level")
      .eq("job_id", jobData.id)
      .order("sort_order"),
    supabase
      .from("job_skills")
      .select("name, category, priority, description")
      .eq("job_id", jobData.id)
      .order("priority", { ascending: true }),
  ]);

  const tasks = (taskRes.data || []).map((task: any) => ({
    name: task.cluster_name,
    description: task.description || "",
    currentState: toTaskState(task.ai_state),
    trend: toTrend(task.ai_trend),
    impactLevel: toImpact(task.impact_level),
    aiExposureScore: task.ai_exposure_score ?? 50,
    jobImpactScore: task.job_impact_score ?? 50,
    priority: toTaskPriority(task.priority),
  }));

  if (!tasks.length) return null;

  const skills = (skillRes.data || []).map((skill: any) => ({
    name: skill.name,
    priority: toSkillPriority(skill.priority),
    category: toSkillCategory(skill.category),
    description: skill.description || "",
    resources: [],
    relatedTasks: [],
  }));

  const companyName = normalizedCompany || jobData.companies?.name || "";

  return {
    jobId: jobData.id,
    jobTitle: jobData.title || jobTitle,
    company: companyName,
    summary: {
      augmentedPercent: jobData.augmented_percent ?? 0,
      automationRiskPercent: jobData.automation_risk_percent ?? 0,
      newSkillsPercent: jobData.new_skills_percent ?? 0,
    },
    tasks,
    skills,
    dbEnhanced: true,
  };
}

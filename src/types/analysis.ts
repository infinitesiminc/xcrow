export type AIImpactLevel = "low" | "medium" | "high";
export type TaskState = "mostly_human" | "human_ai" | "mostly_ai";
export type TrendDirection = "stable" | "increasing_ai" | "fully_ai_soon";
export type SkillPriority = "high" | "medium" | "low";
export type SkillCategory = "ai_tools" | "human_skills" | "new_capabilities";
export type TaskPriority = "high" | "medium" | "low";

export interface TaskAnalysis {
  name: string;
  currentState: TaskState;
  trend: TrendDirection;
  impactLevel: AIImpactLevel;
  description: string;
  aiExposureScore?: number;
  priority?: TaskPriority;
}

export interface ToolResource {
  name: string;
  url: string;
  summary: string;
}

export interface SkillRecommendation {
  name: string;
  priority: SkillPriority;
  category: SkillCategory;
  description: string;
  resources?: ToolResource[];
  relatedTasks?: string[];
}

export interface CuratedSkill {
  name: string;
  priority: string | null;
  category: string;
}

export interface IndustryBenchmark {
  industry: string;
  totalRoles: number;
  avgAutomationRisk: number;
  avgAugmented: number;
  rolesInSameIndustry: { title: string; automationRisk: number; augmented: number }[];
}

export interface JobAnalysisResult {
  jobTitle: string;
  company: string;
  summary: {
    augmentedPercent: number;
    automationRiskPercent: number;
    newSkillsPercent: number;
  };
  tasks: TaskAnalysis[];
  skills: SkillRecommendation[];
  curatedSkills?: CuratedSkill[];
  industryBenchmark?: IndustryBenchmark;
  dbEnhanced?: boolean;
}

export interface SavedRoleData {
  job_title: string;
  company: string | null;
  bookmarked_at: string;
  augmented_percent: number | null;
  automation_risk_percent: number | null;
  new_skills_percent: number | null;
}

export interface PracticedRoleData {
  job_title: string;
  task_name: string;
  company: string | null;
  completed_at: string;
  correct_answers: number;
  total_questions: number;
  skills_earned: any;
  tool_awareness_score: number | null;
  human_value_add_score: number | null;
  adaptive_thinking_score: number | null;
  domain_judgment_score: number | null;
}

export interface TargetRole {
  job_id: string;
  title: string;
  company: string | null;
}

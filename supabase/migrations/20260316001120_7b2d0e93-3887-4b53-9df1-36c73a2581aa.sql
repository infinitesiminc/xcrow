ALTER TABLE public.job_task_clusters
  ADD COLUMN IF NOT EXISTS ai_state text DEFAULT 'human_ai',
  ADD COLUMN IF NOT EXISTS ai_trend text DEFAULT 'increasing_ai',
  ADD COLUMN IF NOT EXISTS impact_level text DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS priority text DEFAULT 'important';
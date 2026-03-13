
CREATE TABLE public.analysis_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_title text NOT NULL,
  company text,
  tasks_count int NOT NULL DEFAULT 0,
  augmented_percent int NOT NULL DEFAULT 0,
  automation_risk_percent int NOT NULL DEFAULT 0,
  analyzed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, job_title, company)
);

ALTER TABLE public.analysis_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own history" ON public.analysis_history
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own history" ON public.analysis_history
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own history" ON public.analysis_history
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

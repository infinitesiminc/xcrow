
CREATE TABLE public.custom_simulations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  job_title text NOT NULL,
  company text,
  task_name text NOT NULL,
  source_type text NOT NULL DEFAULT 'prompt',
  source_prompt text,
  source_document_text text,
  recommended_template text NOT NULL DEFAULT 'quick-pulse',
  ai_state text DEFAULT 'human_ai',
  ai_trend text DEFAULT 'increasing_ai',
  impact_level text DEFAULT 'medium',
  priority text DEFAULT 'important',
  sim_duration integer DEFAULT 3,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.custom_simulations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own custom sims"
  ON public.custom_simulations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own custom sims"
  ON public.custom_simulations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own custom sims"
  ON public.custom_simulations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

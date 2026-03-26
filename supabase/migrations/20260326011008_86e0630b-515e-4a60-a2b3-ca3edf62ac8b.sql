
-- Prompt lab attempts table for tracking user prompt practice
CREATE TABLE public.prompt_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  skill_id TEXT NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'guided',
  scenario_prompt TEXT NOT NULL,
  user_prompt TEXT NOT NULL,
  score_clarity INTEGER NOT NULL DEFAULT 0,
  score_specificity INTEGER NOT NULL DEFAULT 0,
  score_technique INTEGER NOT NULL DEFAULT 0,
  score_output_quality INTEGER NOT NULL DEFAULT 0,
  total_score INTEGER GENERATED ALWAYS AS (score_clarity + score_specificity + score_technique + score_output_quality) STORED,
  ai_feedback TEXT,
  improved_prompt TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.prompt_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own attempts" ON public.prompt_attempts
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can insert own attempts" ON public.prompt_attempts
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Index for fast lookups
CREATE INDEX idx_prompt_attempts_user_skill ON public.prompt_attempts (user_id, skill_id, created_at DESC);

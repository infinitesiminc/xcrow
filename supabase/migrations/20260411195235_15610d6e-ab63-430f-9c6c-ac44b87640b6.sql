CREATE TABLE public.research_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  domain text NOT NULL,
  company_context text,
  status text NOT NULL DEFAULT 'processing',
  progress integer NOT NULL DEFAULT 0,
  current_phase text DEFAULT 'PHASE_01',
  report_text text,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE public.research_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own research jobs"
ON public.research_jobs FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own research jobs"
ON public.research_jobs FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE INDEX idx_research_jobs_user_status ON public.research_jobs(user_id, status);
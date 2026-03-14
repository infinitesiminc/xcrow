CREATE TABLE public.cached_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_title_lower text NOT NULL,
  company_lower text NOT NULL DEFAULT '',
  result jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (job_title_lower, company_lower)
);

ALTER TABLE public.cached_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read cached analyses"
  ON public.cached_analyses FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Service role can insert cached analyses"
  ON public.cached_analyses FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update cached analyses"
  ON public.cached_analyses FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);
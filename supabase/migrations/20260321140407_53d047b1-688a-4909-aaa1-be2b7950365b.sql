
CREATE TABLE public.job_future_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES public.jobs(id) ON DELETE CASCADE,
  cluster_name text NOT NULL,
  skill_id text NOT NULL,
  skill_name text NOT NULL,
  category text NOT NULL,
  description text,
  icon_emoji text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (job_id, cluster_name, skill_id)
);

ALTER TABLE public.job_future_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read future skills"
  ON public.job_future_skills FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Service role can manage future skills"
  ON public.job_future_skills FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

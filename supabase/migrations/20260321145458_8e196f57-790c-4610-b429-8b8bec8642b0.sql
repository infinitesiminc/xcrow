
CREATE TABLE public.canonical_future_skills (
  id text PRIMARY KEY,
  name text NOT NULL,
  category text NOT NULL,
  description text,
  icon_emoji text,
  demand_count integer NOT NULL DEFAULT 1,
  job_count integer NOT NULL DEFAULT 1,
  avg_relevance integer DEFAULT 50,
  aliases text[] DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX idx_canonical_future_skills_category ON public.canonical_future_skills(category);
CREATE INDEX idx_canonical_future_skills_demand ON public.canonical_future_skills(demand_count DESC);

-- RLS
ALTER TABLE public.canonical_future_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read canonical skills"
  ON public.canonical_future_skills FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Service role can manage canonical skills"
  ON public.canonical_future_skills FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Add canonical_skill_id to job_future_skills for linking
ALTER TABLE public.job_future_skills ADD COLUMN canonical_skill_id text REFERENCES public.canonical_future_skills(id);
CREATE INDEX idx_job_future_skills_canonical ON public.job_future_skills(canonical_skill_id);

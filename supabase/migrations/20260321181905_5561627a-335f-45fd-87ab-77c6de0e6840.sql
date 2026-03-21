
-- Table to store AI-analyzed skill discovery suggestions
CREATE TABLE public.skill_discovery_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_name text NOT NULL,
  category text NOT NULL,
  demand_count integer NOT NULL DEFAULT 1,
  job_count integer NOT NULL DEFAULT 1,
  avg_exposure integer NOT NULL DEFAULT 50,
  avg_impact integer NOT NULL DEFAULT 50,
  ai_analysis jsonb NOT NULL DEFAULT '{}'::jsonb,
  action text NOT NULL DEFAULT 'new', -- 'new', 'merge', 'alias', 'ignore'
  merge_target_id text, -- canonical_future_skills.id to merge into
  status text NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  discovered_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid
);

ALTER TABLE public.skill_discovery_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmins can manage suggestions"
  ON public.skill_discovery_suggestions FOR ALL
  TO authenticated
  USING (public.is_superadmin(auth.uid()))
  WITH CHECK (public.is_superadmin(auth.uid()));

CREATE POLICY "Service role can manage suggestions"
  ON public.skill_discovery_suggestions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Index for quick lookups
CREATE INDEX idx_skill_discovery_status ON public.skill_discovery_suggestions(status);
CREATE UNIQUE INDEX idx_skill_discovery_name ON public.skill_discovery_suggestions(lower(skill_name)) WHERE status = 'pending';

CREATE TABLE public.subvertical_agent_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vertical_id integer NOT NULL,
  vertical_name text NOT NULL,
  sub_vertical text NOT NULL,
  agent_score integer NOT NULL DEFAULT 50,
  agent_verdict text,
  automatable_workflows jsonb DEFAULT '[]'::jsonb,
  agent_play text,
  workflow_types text[] DEFAULT '{}'::text[],
  scored_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(vertical_id, sub_vertical)
);

ALTER TABLE public.subvertical_agent_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read subvertical agent scores"
  ON public.subvertical_agent_scores FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Service role can manage subvertical agent scores"
  ON public.subvertical_agent_scores FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
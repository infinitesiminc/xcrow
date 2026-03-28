
CREATE TABLE public.vertical_agent_scores (
  vertical_id integer PRIMARY KEY,
  vertical_name text NOT NULL,
  agent_score integer NOT NULL DEFAULT 0,
  agent_verdict text,
  key_opportunities text[],
  workflow_types text[],
  scored_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.vertical_agent_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read vertical agent scores"
ON public.vertical_agent_scores
FOR SELECT
TO anon, authenticated
USING (true);

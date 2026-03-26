
CREATE TABLE public.sim_checkpoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  task_name text NOT NULL,
  job_title text NOT NULL,
  company text,
  level smallint NOT NULL DEFAULT 1,
  mode text NOT NULL DEFAULT 'assess',
  round_count integer NOT NULL DEFAULT 1,
  turn_count integer NOT NULL DEFAULT 1,
  messages jsonb NOT NULL DEFAULT '[]'::jsonb,
  objective_status jsonb NOT NULL DEFAULT '{}'::jsonb,
  scaffolding_tiers jsonb NOT NULL DEFAULT '{}'::jsonb,
  objective_fail_counts jsonb NOT NULL DEFAULT '{}'::jsonb,
  session_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'active'
);

ALTER TABLE public.sim_checkpoints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own checkpoints"
  ON public.sim_checkpoints FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own checkpoints"
  ON public.sim_checkpoints FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own checkpoints"
  ON public.sim_checkpoints FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own checkpoints"
  ON public.sim_checkpoints FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_sim_checkpoints_user_status ON public.sim_checkpoints (user_id, status);

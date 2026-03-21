
CREATE TABLE public.task_future_predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES public.jobs(id) ON DELETE CASCADE,
  cluster_name text NOT NULL,
  prediction jsonb NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '30 days'),
  UNIQUE (job_id, cluster_name)
);

ALTER TABLE public.task_future_predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read predictions" ON public.task_future_predictions
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Service role can manage predictions" ON public.task_future_predictions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

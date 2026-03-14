
-- Drop the incorrectly structured table
DROP TABLE IF EXISTS public.task_clusters;

-- Create with correct schema matching the activation pipeline output
CREATE TABLE public.job_task_clusters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id text UNIQUE,
  job_id uuid REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  cluster_name text NOT NULL,
  description text,
  outcome text,
  skill_names text[],
  sort_order integer DEFAULT 0
);

CREATE INDEX idx_job_task_clusters_job_id ON public.job_task_clusters(job_id);

ALTER TABLE public.job_task_clusters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read job_task_clusters" ON public.job_task_clusters FOR SELECT TO anon, authenticated USING (true);

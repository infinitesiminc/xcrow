
-- Companies table
CREATE TABLE public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id text UNIQUE,
  name text NOT NULL,
  slug text UNIQUE,
  industry text,
  logo_url text,
  website text,
  employee_range text,
  headquarters text,
  description text,
  imported_at timestamptz NOT NULL DEFAULT now()
);

-- Jobs table
CREATE TABLE public.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id text UNIQUE,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  title text NOT NULL,
  slug text,
  status text DEFAULT 'active',
  seniority text,
  department text,
  description text,
  augmented_percent integer DEFAULT 0,
  automation_risk_percent integer DEFAULT 0,
  new_skills_percent integer DEFAULT 0,
  imported_at timestamptz NOT NULL DEFAULT now()
);

-- Task clusters for jobs
CREATE TABLE public.task_clusters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id text UNIQUE,
  job_id uuid REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  current_state text,
  trend text,
  impact_level text,
  description text,
  sort_order integer DEFAULT 0
);

-- Skills for jobs
CREATE TABLE public.job_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id text UNIQUE,
  job_id uuid REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  priority text,
  category text,
  description text
);

-- Simulation scenarios
CREATE TABLE public.scenarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id text UNIQUE,
  job_id uuid REFERENCES public.jobs(id) ON DELETE CASCADE,
  title text NOT NULL,
  slug text,
  description text,
  difficulty integer DEFAULT 3
);

-- Indexes
CREATE INDEX idx_jobs_company_id ON public.jobs(company_id);
CREATE INDEX idx_jobs_slug ON public.jobs(slug);
CREATE INDEX idx_task_clusters_job_id ON public.task_clusters(job_id);
CREATE INDEX idx_job_skills_job_id ON public.job_skills(job_id);
CREATE INDEX idx_scenarios_job_id ON public.scenarios(job_id);
CREATE INDEX idx_scenarios_slug ON public.scenarios(slug);

-- Enable RLS (public read, no write from client)
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scenarios ENABLE ROW LEVEL SECURITY;

-- Public read policies (dataset is public content)
CREATE POLICY "Public read companies" ON public.companies FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public read jobs" ON public.jobs FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public read task_clusters" ON public.task_clusters FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public read job_skills" ON public.job_skills FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public read scenarios" ON public.scenarios FOR SELECT TO anon, authenticated USING (true);

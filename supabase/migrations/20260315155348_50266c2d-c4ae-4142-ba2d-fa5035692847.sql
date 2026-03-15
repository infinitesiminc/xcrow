
-- Add ATS-related columns to companies
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS careers_url text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS detected_ats_platform text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS brand_color text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS context text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS is_demo boolean DEFAULT false;

-- Add location and source_url to jobs
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS location text;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS source_url text;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS difficulty integer DEFAULT 3;

-- Allow service_role to insert/update companies and jobs (for sync function)
CREATE POLICY "Service role can insert companies"
  ON public.companies FOR INSERT TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update companies"
  ON public.companies FOR UPDATE TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Service role can insert jobs"
  ON public.jobs FOR INSERT TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update jobs"
  ON public.jobs FOR UPDATE TO service_role
  USING (true) WITH CHECK (true);

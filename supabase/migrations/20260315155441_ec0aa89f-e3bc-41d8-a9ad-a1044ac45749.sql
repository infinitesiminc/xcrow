
-- Add unique constraints on external_id for upsert support
CREATE UNIQUE INDEX IF NOT EXISTS companies_external_id_unique ON public.companies (external_id) WHERE external_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS jobs_external_id_unique ON public.jobs (external_id) WHERE external_id IS NOT NULL;

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS company_type text,
  ADD COLUMN IF NOT EXISTS funding_stage text,
  ADD COLUMN IF NOT EXISTS funding_total text,
  ADD COLUMN IF NOT EXISTS founded_year integer;
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS estimated_arr text,
ADD COLUMN IF NOT EXISTS estimated_employees text,
ADD COLUMN IF NOT EXISTS estimated_funding text,
ADD COLUMN IF NOT EXISTS enrichment_confidence text,
ADD COLUMN IF NOT EXISTS enriched_at timestamptz;
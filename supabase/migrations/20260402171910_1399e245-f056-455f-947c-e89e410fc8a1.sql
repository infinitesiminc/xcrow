-- Add ICP criteria column to leadgen_niches
ALTER TABLE public.leadgen_niches
ADD COLUMN icp_criteria jsonb DEFAULT '{}'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN public.leadgen_niches.icp_criteria IS 'Structured ICP profile: {industry, company_size, job_titles, region, buyer_persona, keywords}';

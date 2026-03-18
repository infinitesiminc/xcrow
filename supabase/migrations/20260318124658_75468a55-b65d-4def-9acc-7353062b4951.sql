CREATE UNIQUE INDEX companies_name_lower_seed_unique 
ON public.companies (lower(name)) 
WHERE workspace_id IS NULL;
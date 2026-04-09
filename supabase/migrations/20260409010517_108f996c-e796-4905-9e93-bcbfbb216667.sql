ALTER TABLE public.discovered_garages
ADD COLUMN capacity integer DEFAULT NULL,
ADD COLUMN capacity_source text DEFAULT NULL;
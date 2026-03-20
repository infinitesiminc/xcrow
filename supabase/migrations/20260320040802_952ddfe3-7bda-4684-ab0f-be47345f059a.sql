ALTER TABLE public.completed_simulations
ADD COLUMN IF NOT EXISTS elevation_narrative jsonb DEFAULT NULL;
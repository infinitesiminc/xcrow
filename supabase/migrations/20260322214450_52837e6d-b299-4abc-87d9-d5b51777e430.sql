ALTER TABLE public.completed_simulations 
ADD COLUMN IF NOT EXISTS sim_level smallint NOT NULL DEFAULT 1;
-- Add hierarchy columns
ALTER TABLE public.discovered_garages
  ADD COLUMN IF NOT EXISTS state text,
  ADD COLUMN IF NOT EXISTS country text DEFAULT 'US';

-- Backfill existing LA data
UPDATE public.discovered_garages
SET state = 'California', country = 'US'
WHERE city = 'Los Angeles' AND state IS NULL;

-- Indexes for aggregation queries
CREATE INDEX IF NOT EXISTS idx_garages_country ON public.discovered_garages (country);
CREATE INDEX IF NOT EXISTS idx_garages_state ON public.discovered_garages (state);
CREATE INDEX IF NOT EXISTS idx_garages_city_state ON public.discovered_garages (city, state);
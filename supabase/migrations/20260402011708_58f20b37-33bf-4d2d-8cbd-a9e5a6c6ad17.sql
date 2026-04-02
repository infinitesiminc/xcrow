-- Add lead_type to separate B2B and B2C pools
ALTER TABLE public.saved_leads
  ADD COLUMN IF NOT EXISTS lead_type text NOT NULL DEFAULT 'b2b',
  ADD COLUMN IF NOT EXISTS google_maps_url text,
  ADD COLUMN IF NOT EXISTS rating numeric,
  ADD COLUMN IF NOT EXISTS reviews_count integer;

-- Add index for filtering by lead_type
CREATE INDEX IF NOT EXISTS idx_saved_leads_lead_type ON public.saved_leads (user_id, lead_type);

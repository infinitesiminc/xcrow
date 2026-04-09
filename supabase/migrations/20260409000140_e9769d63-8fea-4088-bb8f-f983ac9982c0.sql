
CREATE TABLE public.discovered_garages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  place_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  address TEXT,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  rating NUMERIC(2,1),
  reviews_count INTEGER DEFAULT 0,
  photo_reference TEXT,
  types TEXT[] DEFAULT '{}',
  operator_guess TEXT,
  city TEXT DEFAULT 'Los Angeles',
  scan_zone TEXT,
  price_level INTEGER,
  business_status TEXT,
  website TEXT,
  phone TEXT,
  total_ratings INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.discovered_garages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmins can view discovered garages"
  ON public.discovered_garages FOR SELECT
  TO authenticated
  USING (public.is_superadmin(auth.uid()));

CREATE POLICY "Superadmins can insert discovered garages"
  ON public.discovered_garages FOR INSERT
  TO authenticated
  WITH CHECK (public.is_superadmin(auth.uid()));

CREATE POLICY "Superadmins can update discovered garages"
  ON public.discovered_garages FOR UPDATE
  TO authenticated
  USING (public.is_superadmin(auth.uid()));

CREATE POLICY "Superadmins can delete discovered garages"
  ON public.discovered_garages FOR DELETE
  TO authenticated
  USING (public.is_superadmin(auth.uid()));

CREATE INDEX idx_discovered_garages_city ON public.discovered_garages(city);
CREATE INDEX idx_discovered_garages_coords ON public.discovered_garages(lat, lng);
CREATE INDEX idx_discovered_garages_scan_zone ON public.discovered_garages(scan_zone);

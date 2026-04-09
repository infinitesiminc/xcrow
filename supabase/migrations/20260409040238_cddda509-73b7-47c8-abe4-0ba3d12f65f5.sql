
-- Create scan_corridors table for city-scalable corridor configs
CREATE TABLE public.scan_corridors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  city TEXT NOT NULL,
  region_key TEXT NOT NULL,
  label TEXT NOT NULL,
  lat_start DOUBLE PRECISION NOT NULL,
  lat_end DOUBLE PRECISION NOT NULL,
  lng_start DOUBLE PRECISION NOT NULL,
  lng_end DOUBLE PRECISION NOT NULL,
  step DOUBLE PRECISION NOT NULL DEFAULT 0.008,
  priority INTEGER NOT NULL DEFAULT 0,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(city, region_key)
);

ALTER TABLE public.scan_corridors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmins can manage scan corridors"
  ON public.scan_corridors FOR ALL TO authenticated
  USING (is_superadmin(auth.uid()))
  WITH CHECK (is_superadmin(auth.uid()));

-- Create scan_progress table to track per-corridor scan state
CREATE TABLE public.scan_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  corridor_id UUID NOT NULL REFERENCES public.scan_corridors(id) ON DELETE CASCADE,
  last_zone_index INTEGER NOT NULL DEFAULT 0,
  total_zones INTEGER NOT NULL DEFAULT 0,
  garages_found INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(corridor_id)
);

ALTER TABLE public.scan_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmins can manage scan progress"
  ON public.scan_progress FOR ALL TO authenticated
  USING (is_superadmin(auth.uid()))
  WITH CHECK (is_superadmin(auth.uid()));

-- Triggers for updated_at
CREATE TRIGGER update_scan_corridors_updated_at
  BEFORE UPDATE ON public.scan_corridors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_scan_progress_updated_at
  BEFORE UPDATE ON public.scan_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed LA corridors
INSERT INTO public.scan_corridors (city, region_key, label, lat_start, lat_end, lng_start, lng_end, step, priority) VALUES
  ('Los Angeles', 'dtla', 'Downtown LA', 34.025, 34.065, -118.285, -118.225, 0.008, 1),
  ('Los Angeles', 'hollywood', 'Hollywood / Koreatown / Mid-Wilshire', 34.055, 34.105, -118.365, -118.285, 0.008, 2),
  ('Los Angeles', 'westside', 'Westside (Beverly Hills, Century City, Westwood)', 34.035, 34.085, -118.435, -118.365, 0.008, 3),
  ('Los Angeles', 'santa_monica', 'Santa Monica / Venice / Marina del Rey', 33.975, 34.035, -118.510, -118.435, 0.008, 4),
  ('Los Angeles', 'lax', 'LAX / El Segundo / Inglewood', 33.925, 33.975, -118.430, -118.350, 0.008, 5),
  ('Los Angeles', 'pasadena', 'Pasadena / Glendale / Burbank', 34.120, 34.200, -118.310, -118.130, 0.010, 6),
  ('Los Angeles', 'valley', 'San Fernando Valley (Sherman Oaks, Encino, Van Nuys)', 34.140, 34.210, -118.500, -118.380, 0.010, 7),
  ('Los Angeles', 'south_la', 'South LA / USC / Exposition Park', 33.980, 34.025, -118.310, -118.240, 0.008, 8);

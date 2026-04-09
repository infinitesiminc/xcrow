CREATE OR REPLACE FUNCTION public.get_corridor_garage_counts()
RETURNS TABLE(region_key text, garage_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    sc.region_key,
    COUNT(dg.id)::bigint AS garage_count
  FROM public.scan_corridors sc
  LEFT JOIN public.discovered_garages dg 
    ON dg.scan_zone LIKE sc.region_key || '-%' 
    OR dg.scan_zone = sc.label
  WHERE sc.enabled = true
  GROUP BY sc.region_key, sc.priority
  ORDER BY sc.priority;
$$;
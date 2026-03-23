
CREATE OR REPLACE FUNCTION public.get_kingdom_populations()
RETURNS TABLE(job_title text, player_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    cs.job_title,
    COUNT(DISTINCT cs.user_id)::bigint AS player_count
  FROM public.completed_simulations cs
  GROUP BY cs.job_title
  ORDER BY player_count DESC
  LIMIT 200;
$$;

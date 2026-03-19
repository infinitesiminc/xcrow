
CREATE OR REPLACE FUNCTION public.get_market_skill_demand(top_n integer DEFAULT 100)
RETURNS TABLE(
  skill_name text,
  demand_count bigint,
  avg_exposure integer,
  avg_impact integer,
  high_priority_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    unnest(skill_names) AS skill_name,
    COUNT(*)::bigint AS demand_count,
    ROUND(AVG(COALESCE(ai_exposure_score, 50)))::integer AS avg_exposure,
    ROUND(AVG(COALESCE(job_impact_score, 50)))::integer AS avg_impact,
    COUNT(*) FILTER (WHERE priority = 'high')::bigint AS high_priority_count
  FROM public.job_task_clusters
  WHERE skill_names IS NOT NULL AND array_length(skill_names, 1) > 0
  GROUP BY unnest(skill_names)
  ORDER BY demand_count DESC
  LIMIT top_n;
$$;

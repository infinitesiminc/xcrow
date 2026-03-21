
-- Drop the unique index that uses an expression (can't be used by upsert)
DROP INDEX IF EXISTS idx_skill_discovery_name;

-- Add a generated column for normalized name to enable proper upsert
ALTER TABLE public.skill_discovery_suggestions
  ADD COLUMN IF NOT EXISTS skill_name_lower text GENERATED ALWAYS AS (lower(trim(skill_name))) STORED;

-- Create unique index on the generated column + status for dedup
CREATE UNIQUE INDEX idx_skill_discovery_name_pending
  ON public.skill_discovery_suggestions(skill_name_lower)
  WHERE status = 'pending';

-- RPC to get Level 2 future skill demand (from job_future_skills, not job_task_clusters)
CREATE OR REPLACE FUNCTION public.get_future_skill_demand(top_n integer DEFAULT 100)
RETURNS TABLE(
  skill_name text,
  category text,
  demand_count bigint,
  job_count bigint,
  avg_exposure integer,
  avg_impact integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    jfs.skill_name,
    jfs.category,
    COUNT(*)::bigint AS demand_count,
    COUNT(DISTINCT jfs.job_id)::bigint AS job_count,
    COALESCE(
      ROUND(AVG(jtc.ai_exposure_score))::integer,
      50
    ) AS avg_exposure,
    COALESCE(
      ROUND(AVG(jtc.job_impact_score))::integer,
      50
    ) AS avg_impact
  FROM public.job_future_skills jfs
  LEFT JOIN public.job_task_clusters jtc
    ON jtc.job_id = jfs.job_id AND jtc.cluster_name = jfs.cluster_name
  WHERE jfs.canonical_skill_id IS NULL
  GROUP BY jfs.skill_name, jfs.category
  ORDER BY demand_count DESC
  LIMIT top_n;
$$;

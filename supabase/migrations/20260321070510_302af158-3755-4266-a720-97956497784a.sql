
CREATE OR REPLACE FUNCTION public.get_skill_drop_matches(_skill_id text, _limit integer DEFAULT 5)
RETURNS TABLE(
  cluster_name text,
  job_title text,
  company_name text,
  job_id uuid,
  ai_exposure_score integer,
  skill_names text[],
  matched_keywords text[]
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    jtc.cluster_name,
    j.title AS job_title,
    c.name AS company_name,
    j.id AS job_id,
    jtc.ai_exposure_score,
    jtc.skill_names,
    array(
      SELECT DISTINCT kw
      FROM unnest(s.keywords) kw, unnest(jtc.skill_names) sn
      WHERE lower(sn) LIKE '%' || kw || '%'
    ) AS matched_keywords
  FROM public.skills s
  CROSS JOIN public.job_task_clusters jtc
  JOIN public.jobs j ON j.id = jtc.job_id
  LEFT JOIN public.companies c ON c.id = j.company_id
  WHERE s.id = _skill_id
    AND jtc.skill_names IS NOT NULL
    AND array_length(jtc.skill_names, 1) > 0
    AND EXISTS (
      SELECT 1 FROM unnest(s.keywords) kw, unnest(jtc.skill_names) sn
      WHERE lower(sn) LIKE '%' || kw || '%'
    )
  ORDER BY array_length(
    array(
      SELECT DISTINCT kw
      FROM unnest(s.keywords) kw, unnest(jtc.skill_names) sn
      WHERE lower(sn) LIKE '%' || kw || '%'
    ), 1
  ) DESC NULLS LAST
  LIMIT _limit;
$$;

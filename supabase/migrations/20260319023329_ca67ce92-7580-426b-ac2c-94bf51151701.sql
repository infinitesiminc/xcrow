CREATE OR REPLACE FUNCTION public.get_company_stats()
RETURNS TABLE(company_id uuid, job_count bigint, analyzed_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    j.company_id,
    COUNT(DISTINCT j.id) AS job_count,
    COUNT(DISTINCT jtc.job_id) AS analyzed_count
  FROM public.jobs j
  LEFT JOIN public.job_task_clusters jtc ON jtc.job_id = j.id
  WHERE j.company_id IS NOT NULL
  GROUP BY j.company_id;
$$;
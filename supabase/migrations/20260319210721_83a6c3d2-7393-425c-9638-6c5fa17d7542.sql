
CREATE OR REPLACE FUNCTION public.get_school_dashboard_stats()
RETURNS TABLE(
  total_schools bigint,
  total_customers bigint,
  total_hbcus bigint,
  total_scraped bigint,
  total_enrollment bigint,
  pipeline_stage text,
  pipeline_count bigint,
  carnegie_class text,
  carnegie_count bigint,
  state text,
  state_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH base AS (
    SELECT * FROM public.school_accounts
  ),
  kpis AS (
    SELECT
      COUNT(*)::bigint AS total_schools,
      COUNT(*) FILTER (WHERE pipeline_stage = 'customer' OR (plan_status = 'active' AND used_seats > 0))::bigint AS total_customers,
      COUNT(*) FILTER (WHERE is_hbcu = true)::bigint AS total_hbcus,
      COALESCE(SUM(enrollment), 0)::bigint AS total_enrollment
    FROM base
  ),
  scraped AS (
    SELECT COUNT(DISTINCT school_id)::bigint AS total_scraped
    FROM public.school_curricula WHERE status = 'completed'
  ),
  pipeline AS (
    SELECT COALESCE(pipeline_stage, 'prospect') AS stage, COUNT(*)::bigint AS cnt
    FROM base GROUP BY COALESCE(pipeline_stage, 'prospect')
  ),
  carnegie AS (
    SELECT COALESCE(carnegie_class, 'Unknown') AS cls, COUNT(*)::bigint AS cnt
    FROM base GROUP BY COALESCE(carnegie_class, 'Unknown')
    ORDER BY cnt DESC LIMIT 7
  ),
  states AS (
    SELECT state AS st, COUNT(*)::bigint AS cnt
    FROM base WHERE state IS NOT NULL
    GROUP BY state ORDER BY cnt DESC LIMIT 15
  )
  SELECT
    k.total_schools, k.total_customers, k.total_hbcus, s.total_scraped, k.total_enrollment,
    p.stage, p.cnt,
    c.cls, c.cnt,
    st.st, st.cnt
  FROM kpis k
  CROSS JOIN scraped s
  CROSS JOIN pipeline p
  CROSS JOIN carnegie c
  CROSS JOIN states st;
$$;

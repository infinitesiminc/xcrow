
CREATE OR REPLACE FUNCTION public.get_admin_user_stats()
RETURNS TABLE(
  user_id uuid,
  display_name text,
  email text,
  career_stage text,
  school_name text,
  company text,
  job_title text,
  created_at timestamptz,
  onboarding_completed boolean,
  total_sims bigint,
  total_analyses bigint,
  total_xp bigint,
  last_active timestamptz
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    p.id AS user_id,
    COALESCE(p.display_name, 'Anonymous') AS display_name,
    u.email,
    p.career_stage,
    p.school_name,
    p.company,
    p.job_title,
    p.created_at,
    p.onboarding_completed,
    COALESCE(sim_counts.total_sims, 0)::bigint AS total_sims,
    COALESCE(analysis_counts.total_analyses, 0)::bigint AS total_analyses,
    COALESCE(sim_counts.total_xp, 0)::bigint AS total_xp,
    GREATEST(p.created_at, sim_counts.last_sim, analysis_counts.last_analysis) AS last_active
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  LEFT JOIN LATERAL (
    SELECT
      COUNT(*)::bigint AS total_sims,
      MAX(completed_at) AS last_sim,
      COALESCE(SUM(
        CASE
          WHEN skills_earned IS NOT NULL AND skills_earned != '[]'::jsonb
          THEN (SELECT COALESCE(SUM((elem->>'xp')::int), 0) FROM jsonb_array_elements(skills_earned) AS elem)
          ELSE 100
        END
      ), 0)::bigint AS total_xp
    FROM public.completed_simulations cs
    WHERE cs.user_id = p.id
  ) sim_counts ON true
  LEFT JOIN LATERAL (
    SELECT
      COUNT(*)::bigint AS total_analyses,
      MAX(analyzed_at) AS last_analysis
    FROM public.analysis_history ah
    WHERE ah.user_id = p.id
  ) analysis_counts ON true
  WHERE is_superadmin(auth.uid())
  ORDER BY p.created_at DESC;
$$;

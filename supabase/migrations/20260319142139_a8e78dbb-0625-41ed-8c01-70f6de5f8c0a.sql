
CREATE OR REPLACE FUNCTION public.get_leaderboard()
RETURNS TABLE(
  user_id uuid,
  display_name text,
  total_xp bigint,
  skills_unlocked bigint,
  tasks_completed bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    cs.user_id,
    COALESCE(p.display_name, 'Anonymous') AS display_name,
    COALESCE(SUM(
      CASE
        WHEN cs.skills_earned IS NOT NULL AND cs.skills_earned != '[]'::jsonb
        THEN (SELECT COALESCE(SUM((elem->>'xp')::int), 0) FROM jsonb_array_elements(cs.skills_earned) AS elem)
        ELSE 100
      END
    ), 0)::bigint AS total_xp,
    COUNT(DISTINCT cs.task_name)::bigint AS tasks_completed,
    COUNT(DISTINCT cs.task_name)::bigint AS skills_unlocked
  FROM public.completed_simulations cs
  LEFT JOIN public.profiles p ON p.id = cs.user_id
  GROUP BY cs.user_id, p.display_name
  ORDER BY total_xp DESC
  LIMIT 100;
$$;

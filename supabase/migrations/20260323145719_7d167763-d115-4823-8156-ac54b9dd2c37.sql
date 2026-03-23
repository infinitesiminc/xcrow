
CREATE OR REPLACE FUNCTION public.get_friend_activity(_user_id uuid, _limit integer DEFAULT 20)
RETURNS TABLE(
  user_id uuid,
  display_name text,
  avatar_id text,
  username text,
  activity_type text,
  job_title text,
  task_name text,
  skills_earned jsonb,
  total_xp integer,
  completed_at timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    cs.user_id,
    COALESCE(p.display_name, 'Unknown') AS display_name,
    p.avatar_id,
    p.username,
    'quest_complete' AS activity_type,
    cs.job_title,
    cs.task_name,
    cs.skills_earned,
    COALESCE(
      (SELECT SUM((elem->>'xp')::int)::int FROM jsonb_array_elements(cs.skills_earned) AS elem),
      100
    ) AS total_xp,
    cs.completed_at
  FROM public.completed_simulations cs
  JOIN public.profiles p ON p.id = cs.user_id
  WHERE cs.user_id IN (
    SELECT CASE
      WHEN f.requester_id = _user_id THEN f.recipient_id
      ELSE f.requester_id
    END
    FROM public.friendships f
    WHERE f.status = 'accepted'
      AND (f.requester_id = _user_id OR f.recipient_id = _user_id)
  )
  ORDER BY cs.completed_at DESC
  LIMIT _limit;
$$;

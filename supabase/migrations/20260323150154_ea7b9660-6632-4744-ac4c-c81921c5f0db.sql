
CREATE OR REPLACE FUNCTION public.get_friends_last_sims(_user_id uuid)
RETURNS TABLE(
  friend_id uuid,
  job_title text,
  task_name text,
  company text,
  completed_at timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT DISTINCT ON (cs.user_id)
    cs.user_id AS friend_id,
    cs.job_title,
    cs.task_name,
    cs.company,
    cs.completed_at
  FROM public.completed_simulations cs
  WHERE cs.user_id IN (
    SELECT CASE
      WHEN f.requester_id = _user_id THEN f.recipient_id
      ELSE f.requester_id
    END
    FROM public.friendships f
    WHERE f.status = 'accepted'
      AND (f.requester_id = _user_id OR f.recipient_id = _user_id)
  )
  ORDER BY cs.user_id, cs.completed_at DESC;
$$;

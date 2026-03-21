
-- Add username column to profiles for public profile URLs
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username text UNIQUE;

-- Create index for fast username lookups
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_idx ON public.profiles (username) WHERE username IS NOT NULL;

-- Create a function to get public profile data (security definer to bypass RLS)
CREATE OR REPLACE FUNCTION public.get_public_profile(_username text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _profile record;
  _stats record;
  _result jsonb;
BEGIN
  -- Get basic profile info
  SELECT id, display_name, username, career_stage, school_name, company, job_title
  INTO _profile
  FROM public.profiles
  WHERE username = _username;

  IF _profile IS NULL THEN
    RETURN NULL;
  END IF;

  -- Get quest stats
  SELECT
    COUNT(*)::int AS total_quests,
    COUNT(DISTINCT task_name)::int AS unique_tasks,
    COALESCE(SUM(
      CASE
        WHEN skills_earned IS NOT NULL AND skills_earned != '[]'::jsonb
        THEN (SELECT COALESCE(SUM((elem->>'xp')::int), 0) FROM jsonb_array_elements(skills_earned) AS elem)
        ELSE 100
      END
    ), 0)::int AS total_xp,
    COALESCE(AVG(
      (COALESCE(tool_awareness_score, 0) + COALESCE(human_value_add_score, 0) +
       COALESCE(adaptive_thinking_score, 0) + COALESCE(domain_judgment_score, 0)) / 4.0
    ), 0)::int AS avg_score
  INTO _stats
  FROM public.completed_simulations
  WHERE user_id = _profile.id;

  _result := jsonb_build_object(
    'display_name', _profile.display_name,
    'username', _profile.username,
    'career_stage', _profile.career_stage,
    'school_name', _profile.school_name,
    'company', _profile.company,
    'job_title', _profile.job_title,
    'total_quests', _stats.total_quests,
    'unique_tasks', _stats.unique_tasks,
    'total_xp', _stats.total_xp,
    'avg_score', _stats.avg_score,
    'skills', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'skill_id', se->>'skillId',
        'xp', (se->>'xp')::int,
        'category', se->>'category'
      )), '[]'::jsonb)
      FROM public.completed_simulations cs,
           jsonb_array_elements(cs.skills_earned) se
      WHERE cs.user_id = _profile.id
        AND cs.skills_earned IS NOT NULL
        AND cs.skills_earned != '[]'::jsonb
    )
  );

  RETURN _result;
END;
$$;

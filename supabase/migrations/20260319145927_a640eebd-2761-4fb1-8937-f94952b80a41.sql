
-- 1. Update check_usage_limit to 3/3 limits
CREATE OR REPLACE FUNCTION public.check_usage_limit(_user_id uuid, _type text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _period timestamp with time zone := date_trunc('month', now());
  _used integer := 0;
  _limit integer;
BEGIN
  SELECT CASE _type
    WHEN 'analysis' THEN analyses_used
    WHEN 'simulation' THEN simulations_used
    ELSE 0
  END INTO _used
  FROM public.user_usage
  WHERE user_id = _user_id AND period_start = _period;

  _used := COALESCE(_used, 0);

  _limit := CASE _type
    WHEN 'analysis' THEN 3
    WHEN 'simulation' THEN 3
    ELSE 0
  END;

  RETURN jsonb_build_object(
    'used', _used,
    'limit', _limit,
    'allowed', _used < _limit
  );
END;
$$;

-- 2. get_school_students RPC
CREATE OR REPLACE FUNCTION public.get_school_students(_school_id uuid)
RETURNS TABLE(
  seat_id uuid,
  user_id uuid,
  invite_email text,
  status text,
  provisioned_at timestamptz,
  activated_at timestamptz,
  display_name text,
  email text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    ss.id AS seat_id,
    ss.user_id,
    ss.invite_email,
    ss.status,
    ss.provisioned_at,
    ss.activated_at,
    p.display_name,
    ss.invite_email AS email
  FROM public.school_seats ss
  LEFT JOIN public.profiles p ON p.id = ss.user_id
  WHERE ss.school_id = _school_id
    AND public.is_school_admin(auth.uid(), _school_id)
  ORDER BY ss.provisioned_at DESC;
$$;

-- 3. get_school_analytics RPC
CREATE OR REPLACE FUNCTION public.get_school_analytics(_school_id uuid)
RETURNS TABLE(
  user_id uuid,
  display_name text,
  total_sims bigint,
  total_xp bigint,
  avg_score numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    ss.user_id,
    COALESCE(p.display_name, ss.invite_email, 'Unknown') AS display_name,
    COUNT(cs.id)::bigint AS total_sims,
    COALESCE(SUM(
      CASE
        WHEN cs.skills_earned IS NOT NULL AND cs.skills_earned != '[]'::jsonb
        THEN (SELECT COALESCE(SUM((elem->>'xp')::int), 0) FROM jsonb_array_elements(cs.skills_earned) AS elem)
        ELSE CASE WHEN cs.id IS NOT NULL THEN 100 ELSE 0 END
      END
    ), 0)::bigint AS total_xp,
    COALESCE(AVG(
      (COALESCE(cs.tool_awareness_score, 0) + COALESCE(cs.human_value_add_score, 0) +
       COALESCE(cs.adaptive_thinking_score, 0) + COALESCE(cs.domain_judgment_score, 0)) / 4.0
    ), 0)::numeric AS avg_score
  FROM public.school_seats ss
  LEFT JOIN public.profiles p ON p.id = ss.user_id
  LEFT JOIN public.completed_simulations cs ON cs.user_id = ss.user_id
  WHERE ss.school_id = _school_id
    AND ss.status = 'active'
    AND public.is_school_admin(auth.uid(), _school_id)
  GROUP BY ss.user_id, p.display_name, ss.invite_email;
$$;

-- 4. Trigger to auto-update used_seats count
CREATE OR REPLACE FUNCTION public.update_school_used_seats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.school_accounts
  SET used_seats = (
    SELECT COUNT(*) FROM public.school_seats
    WHERE school_id = COALESCE(NEW.school_id, OLD.school_id)
      AND status = 'active'
  )
  WHERE id = COALESCE(NEW.school_id, OLD.school_id);
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_update_used_seats
AFTER INSERT OR UPDATE OR DELETE ON public.school_seats
FOR EACH ROW EXECUTE FUNCTION public.update_school_used_seats();

-- 5. Domain-based auto-provisioning on signup
CREATE OR REPLACE FUNCTION public.auto_provision_school_seat()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _email text;
  _domain text;
  _school record;
  _existing_seat uuid;
BEGIN
  -- Get user email
  SELECT email INTO _email FROM auth.users WHERE id = NEW.id;
  IF _email IS NULL THEN RETURN NEW; END IF;

  _domain := split_part(_email, '@', 2);

  -- Check for invited seat matching email
  UPDATE public.school_seats
  SET user_id = NEW.id, status = 'active', activated_at = now()
  WHERE invite_email = _email AND status = 'invited' AND user_id IS NULL
  RETURNING id INTO _existing_seat;

  IF _existing_seat IS NOT NULL THEN RETURN NEW; END IF;

  -- Check domain match
  SELECT sa.id, sa.total_seats, sa.used_seats
  INTO _school
  FROM public.school_accounts sa
  WHERE sa.domain = _domain
    AND sa.plan_status = 'active'
    AND (sa.expires_at IS NULL OR sa.expires_at > now())
  LIMIT 1;

  IF _school IS NOT NULL AND _school.used_seats < _school.total_seats THEN
    -- Check no existing seat for this user in this school
    IF NOT EXISTS (
      SELECT 1 FROM public.school_seats
      WHERE school_id = _school.id AND user_id = NEW.id
    ) THEN
      INSERT INTO public.school_seats (school_id, user_id, status, activated_at)
      VALUES (_school.id, NEW.id, 'active', now());
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_provision_school_seat
AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.auto_provision_school_seat();

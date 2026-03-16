
-- Track per-user usage of analyses and simulations
CREATE TABLE public.user_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  analyses_used integer NOT NULL DEFAULT 0,
  simulations_used integer NOT NULL DEFAULT 0,
  period_start timestamp with time zone NOT NULL DEFAULT date_trunc('month', now()),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, period_start)
);

ALTER TABLE public.user_usage ENABLE ROW LEVEL SECURITY;

-- Users can read their own usage
CREATE POLICY "Users can read own usage"
  ON public.user_usage FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Service role and user can insert/update
CREATE POLICY "Users can insert own usage"
  ON public.user_usage FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage usage"
  ON public.user_usage FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Function to increment usage (called from edge functions)
CREATE OR REPLACE FUNCTION public.increment_usage(
  _user_id uuid,
  _type text  -- 'analysis' or 'simulation'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _period timestamp with time zone := date_trunc('month', now());
  _row user_usage%ROWTYPE;
BEGIN
  INSERT INTO public.user_usage (user_id, period_start)
  VALUES (_user_id, _period)
  ON CONFLICT (user_id, period_start) DO NOTHING;

  IF _type = 'analysis' THEN
    UPDATE public.user_usage
    SET analyses_used = analyses_used + 1, updated_at = now()
    WHERE user_id = _user_id AND period_start = _period
    RETURNING * INTO _row;
  ELSIF _type = 'simulation' THEN
    UPDATE public.user_usage
    SET simulations_used = simulations_used + 1, updated_at = now()
    WHERE user_id = _user_id AND period_start = _period
    RETURNING * INTO _row;
  END IF;

  RETURN jsonb_build_object(
    'analyses_used', _row.analyses_used,
    'simulations_used', _row.simulations_used
  );
END;
$$;

-- Function to check usage limits (called from edge functions)
CREATE OR REPLACE FUNCTION public.check_usage_limit(
  _user_id uuid,
  _type text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

  -- Free tier limits
  _limit := CASE _type
    WHEN 'analysis' THEN 1
    WHEN 'simulation' THEN 1
    ELSE 0
  END;

  RETURN jsonb_build_object(
    'used', _used,
    'limit', _limit,
    'allowed', _used < _limit
  );
END;
$$;

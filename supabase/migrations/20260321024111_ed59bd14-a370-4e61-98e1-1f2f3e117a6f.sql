
-- Platform config key-value store for editable policies
CREATE TABLE public.platform_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  label TEXT,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID
);

ALTER TABLE public.platform_config ENABLE ROW LEVEL SECURITY;

-- Anyone can read config
CREATE POLICY "Anyone can read platform config"
  ON public.platform_config FOR SELECT
  TO authenticated, anon
  USING (true);

-- Superadmins can manage
CREATE POLICY "Superadmins can manage platform config"
  ON public.platform_config FOR ALL
  TO authenticated
  USING (is_superadmin(auth.uid()))
  WITH CHECK (is_superadmin(auth.uid()));

-- Seed default values
INSERT INTO public.platform_config (key, value, label, description) VALUES
  ('free_sim_limit', '3', 'Free Sim Limit', 'Base number of simulations per month for free users'),
  ('referral_bonus_sims', '2', 'Referral Bonus Sims', 'Bonus simulation credits awarded per referral (both sides)'),
  ('analyses_unlimited', 'true', 'Analyses Unlimited', 'Whether analyses are unlimited for all users (true/false)'),
  ('free_analysis_limit', '3', 'Free Analysis Limit', 'Analyses per month for free users (only if analyses_unlimited = false)'),
  ('adaptive_sim_threshold', '60', 'Adaptive Sim Threshold', 'Score threshold below which adaptive retry sims are queued'),
  ('adaptive_sim_max_attempts', '3', 'Adaptive Max Attempts', 'Maximum retry attempts for adaptive simulations per category');

-- Update check_usage_limit to read from platform_config
CREATE OR REPLACE FUNCTION public.check_usage_limit(_user_id uuid, _type text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _period timestamp with time zone := date_trunc('month', now());
  _used integer := 0;
  _base_limit integer;
  _referral_bonus_per integer;
  _referral_bonus integer;
  _was_referred boolean;
  _total_limit integer;
  _analyses_unlimited boolean;
BEGIN
  -- Read config from platform_config
  SELECT COALESCE((SELECT value::integer FROM public.platform_config WHERE key = 'free_sim_limit'), 3) INTO _base_limit;
  SELECT COALESCE((SELECT value::integer FROM public.platform_config WHERE key = 'referral_bonus_sims'), 2) INTO _referral_bonus_per;
  SELECT COALESCE((SELECT value::boolean FROM public.platform_config WHERE key = 'analyses_unlimited'), true) INTO _analyses_unlimited;

  IF _type = 'analysis' AND _analyses_unlimited THEN
    RETURN jsonb_build_object('used', 0, 'limit', 999, 'allowed', true);
  END IF;

  IF _type = 'analysis' AND NOT _analyses_unlimited THEN
    SELECT COALESCE((SELECT value::integer FROM public.platform_config WHERE key = 'free_analysis_limit'), 3) INTO _base_limit;
  END IF;

  SELECT CASE _type
    WHEN 'simulation' THEN simulations_used
    WHEN 'analysis' THEN analyses_used
    ELSE 0
  END INTO _used
  FROM public.user_usage
  WHERE user_id = _user_id AND period_start = _period;

  _used := COALESCE(_used, 0);

  -- Referrer bonus: +N per referral, no cap
  SELECT COALESCE(COUNT(*), 0) * _referral_bonus_per INTO _referral_bonus
  FROM public.referrals
  WHERE referrer_id = _user_id AND credited = true;

  -- Referred user bonus: +N if they signed up via referral
  SELECT EXISTS(SELECT 1 FROM public.referrals WHERE referred_user_id = _user_id) INTO _was_referred;
  IF _was_referred THEN
    _referral_bonus := _referral_bonus + _referral_bonus_per;
  END IF;

  _total_limit := _base_limit + _referral_bonus;

  RETURN jsonb_build_object(
    'used', _used,
    'limit', _total_limit,
    'allowed', _used < _total_limit,
    'referral_bonus', _referral_bonus,
    'referral_count', (SELECT COUNT(*) FROM public.referrals WHERE referrer_id = _user_id AND credited = true)
  );
END;
$function$;

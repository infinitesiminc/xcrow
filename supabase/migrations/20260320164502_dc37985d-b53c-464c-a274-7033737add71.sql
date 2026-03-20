
-- Referrals table
CREATE TABLE public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL,
  referred_user_id uuid NOT NULL,
  referral_code text NOT NULL,
  credited boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(referred_user_id)
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own referrals" ON public.referrals
  FOR SELECT TO authenticated USING (auth.uid() = referrer_id);

CREATE POLICY "Users can see if they were referred" ON public.referrals
  FOR SELECT TO authenticated USING (auth.uid() = referred_user_id);

CREATE POLICY "Service role can manage referrals" ON public.referrals
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Add referral_code to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code text UNIQUE;

-- Generate referral codes for existing users
UPDATE public.profiles SET referral_code = substr(md5(id::text || now()::text), 1, 8) WHERE referral_code IS NULL;

-- Auto-generate referral code on new profile
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := substr(md5(NEW.id::text || now()::text), 1, 8);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_referral_code
  BEFORE INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.generate_referral_code();

-- Update check_usage_limit to remove analysis gating and add referral bonus for sims
CREATE OR REPLACE FUNCTION public.check_usage_limit(_user_id uuid, _type text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  _period timestamp with time zone := date_trunc('month', now());
  _used integer := 0;
  _base_limit integer;
  _referral_bonus integer;
  _total_limit integer;
BEGIN
  -- Analysis is now unlimited
  IF _type = 'analysis' THEN
    RETURN jsonb_build_object('used', 0, 'limit', 999, 'allowed', true);
  END IF;

  SELECT CASE _type
    WHEN 'simulation' THEN simulations_used
    ELSE 0
  END INTO _used
  FROM public.user_usage
  WHERE user_id = _user_id AND period_start = _period;

  _used := COALESCE(_used, 0);
  _base_limit := 3;

  -- Count referral bonus (2 sims per successful referral, no cap)
  SELECT COALESCE(COUNT(*), 0) * 2 INTO _referral_bonus
  FROM public.referrals
  WHERE referrer_id = _user_id AND credited = true;

  _total_limit := _base_limit + _referral_bonus;

  RETURN jsonb_build_object(
    'used', _used,
    'limit', _total_limit,
    'allowed', _used < _total_limit,
    'referral_bonus', _referral_bonus,
    'referral_count', _referral_bonus / 2
  );
END;
$$;

-- Function to process a referral when a new user signs up with a code
CREATE OR REPLACE FUNCTION public.process_referral(_referred_user_id uuid, _referral_code text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  _referrer_id uuid;
BEGIN
  -- Find referrer by code
  SELECT id INTO _referrer_id FROM public.profiles WHERE referral_code = _referral_code;
  IF _referrer_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid referral code');
  END IF;
  IF _referrer_id = _referred_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot refer yourself');
  END IF;

  -- Insert referral (unique on referred_user_id prevents double-counting)
  INSERT INTO public.referrals (referrer_id, referred_user_id, referral_code)
  VALUES (_referrer_id, _referred_user_id, _referral_code)
  ON CONFLICT (referred_user_id) DO NOTHING;

  -- Give referred user +2 bonus sims by crediting them as a "referrer" of a phantom entry
  -- Actually, we handle referred user bonus in check_usage_limit by also counting referred entries
  RETURN jsonb_build_object('success', true, 'referrer_id', _referrer_id);
END;
$$;

-- Update check_usage_limit to also give bonus to referred users
-- We need to also count if user WAS referred (gives them +2 bonus)
CREATE OR REPLACE FUNCTION public.check_usage_limit(_user_id uuid, _type text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  _period timestamp with time zone := date_trunc('month', now());
  _used integer := 0;
  _base_limit integer;
  _referral_bonus integer;
  _was_referred boolean;
  _total_limit integer;
BEGIN
  IF _type = 'analysis' THEN
    RETURN jsonb_build_object('used', 0, 'limit', 999, 'allowed', true);
  END IF;

  SELECT CASE _type
    WHEN 'simulation' THEN simulations_used
    ELSE 0
  END INTO _used
  FROM public.user_usage
  WHERE user_id = _user_id AND period_start = _period;

  _used := COALESCE(_used, 0);
  _base_limit := 3;

  -- Referrer bonus: +2 per referral, no cap
  SELECT COALESCE(COUNT(*), 0) * 2 INTO _referral_bonus
  FROM public.referrals
  WHERE referrer_id = _user_id AND credited = true;

  -- Referred user bonus: +2 if they signed up via referral
  SELECT EXISTS(SELECT 1 FROM public.referrals WHERE referred_user_id = _user_id) INTO _was_referred;
  IF _was_referred THEN
    _referral_bonus := _referral_bonus + 2;
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
$$;

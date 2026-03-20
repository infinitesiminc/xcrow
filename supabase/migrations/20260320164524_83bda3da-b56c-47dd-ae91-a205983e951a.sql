
CREATE OR REPLACE FUNCTION public.process_referral(_referred_user_id uuid, _referral_code text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  _referrer_id uuid;
BEGIN
  SELECT id INTO _referrer_id FROM public.profiles WHERE referral_code = _referral_code;
  IF _referrer_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid referral code');
  END IF;
  IF _referrer_id = _referred_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot refer yourself');
  END IF;
  INSERT INTO public.referrals (referrer_id, referred_user_id, referral_code)
  VALUES (_referrer_id, _referred_user_id, _referral_code)
  ON CONFLICT (referred_user_id) DO NOTHING;
  RETURN jsonb_build_object('success', true, 'referrer_id', _referrer_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := substr(md5(NEW.id::text || now()::text), 1, 8);
  END IF;
  RETURN NEW;
END;
$$;

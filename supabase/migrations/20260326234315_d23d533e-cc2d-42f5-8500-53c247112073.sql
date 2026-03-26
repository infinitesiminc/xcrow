
-- Table to track Champion grants (admin comps, referral rewards, etc.)
CREATE TABLE public.user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  source text NOT NULL DEFAULT 'admin_grant',
  plan text NOT NULL DEFAULT 'champion',
  starts_at timestamp with time zone NOT NULL DEFAULT now(),
  ends_at timestamp with time zone,
  created_by uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX idx_user_subscriptions_user_active 
  ON public.user_subscriptions (user_id, ends_at);

-- RLS
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can read their own subscriptions
CREATE POLICY "Users can read own subscriptions"
  ON public.user_subscriptions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Superadmins can manage all
CREATE POLICY "Superadmins can manage subscriptions"
  ON public.user_subscriptions FOR ALL TO authenticated
  USING (public.is_superadmin(auth.uid()))
  WITH CHECK (public.is_superadmin(auth.uid()));

-- Service role can manage (for triggers/functions)
CREATE POLICY "Service role can manage subscriptions"
  ON public.user_subscriptions FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Helper function to check if user has active grant
CREATE OR REPLACE FUNCTION public.has_active_grant(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_subscriptions
    WHERE user_id = _user_id
      AND (ends_at IS NULL OR ends_at > now())
  );
$$;

-- Trigger function: auto-grant 30-day Champion on referral
CREATE OR REPLACE FUNCTION public.grant_referral_champion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Grant to referrer
  INSERT INTO public.user_subscriptions (user_id, source, plan, ends_at, metadata)
  VALUES (
    NEW.referrer_id, 'referral', 'champion',
    now() + interval '30 days',
    jsonb_build_object('referred_user_id', NEW.referred_user_id, 'referral_id', NEW.id)
  );
  -- Grant to referred user
  INSERT INTO public.user_subscriptions (user_id, source, plan, ends_at, metadata)
  VALUES (
    NEW.referred_user_id, 'referral', 'champion',
    now() + interval '30 days',
    jsonb_build_object('referrer_id', NEW.referrer_id, 'referral_id', NEW.id)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_referral_champion_grant
  AFTER INSERT ON public.referrals
  FOR EACH ROW
  EXECUTE FUNCTION public.grant_referral_champion();

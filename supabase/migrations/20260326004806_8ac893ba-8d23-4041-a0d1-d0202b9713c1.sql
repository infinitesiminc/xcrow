
-- Credit ledger table
CREATE TABLE public.credit_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  delta INTEGER NOT NULL,
  reason TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast balance queries
CREATE INDEX idx_credit_ledger_user_id ON public.credit_ledger (user_id);

-- Materialized view for current balance
CREATE OR REPLACE FUNCTION public.get_credit_balance(_user_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(delta), 0)::INTEGER
  FROM public.credit_ledger
  WHERE user_id = _user_id;
$$;

-- Deduct credits (returns false if insufficient)
CREATE OR REPLACE FUNCTION public.deduct_credits(_user_id UUID, _amount INTEGER, _reason TEXT, _metadata JSONB DEFAULT '{}')
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_balance INTEGER;
BEGIN
  SELECT COALESCE(SUM(delta), 0) INTO current_balance
  FROM public.credit_ledger
  WHERE user_id = _user_id;

  IF current_balance < _amount THEN
    RETURN FALSE;
  END IF;

  INSERT INTO public.credit_ledger (user_id, delta, reason, metadata)
  VALUES (_user_id, -_amount, _reason, _metadata);

  RETURN TRUE;
END;
$$;

-- Grant credits
CREATE OR REPLACE FUNCTION public.grant_credits(_user_id UUID, _amount INTEGER, _reason TEXT, _metadata JSONB DEFAULT '{}')
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.credit_ledger (user_id, delta, reason, metadata)
  VALUES (_user_id, _amount, _reason, _metadata);
END;
$$;

-- Add play_mode column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS play_mode TEXT NOT NULL DEFAULT 'explorer';

-- RLS policies for credit_ledger
ALTER TABLE public.credit_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own credits"
  ON public.credit_ledger
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Grant initial 50 credits on profile creation via trigger
CREATE OR REPLACE FUNCTION public.grant_initial_credits()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.credit_ledger (user_id, delta, reason)
  VALUES (NEW.id, 50, 'welcome_bonus');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_profile_created_grant_credits
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.grant_initial_credits();


-- Credit costs reference table
CREATE TABLE IF NOT EXISTS public.credit_costs (
  action text PRIMARY KEY,
  cost integer NOT NULL DEFAULT 1,
  label text,
  description text
);

ALTER TABLE public.credit_costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read credit costs"
  ON public.credit_costs FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Superadmins can manage credit costs"
  ON public.credit_costs FOR ALL
  TO authenticated
  USING (is_superadmin(auth.uid()))
  WITH CHECK (is_superadmin(auth.uid()));

-- Seed default costs
INSERT INTO public.credit_costs (action, cost, label, description) VALUES
  ('simulation_l1', 1, 'Level 1 Simulation', 'AI Mastery technique comparison quest'),
  ('simulation_l2', 2, 'Level 2 Boss Battle', 'Human Edge guided audit quest'),
  ('prompt_lab', 1, 'Prompt Lab Session', 'Prompt engineering practice round'),
  ('role_analysis', 0, 'Role Analysis', 'Free for all users'),
  ('career_chat', 1, 'Career Scout Chat', 'AI career advisor conversation'),
  ('npc_duel', 1, 'NPC Duel Challenge', 'Wandering rival timed skill duel')
ON CONFLICT (action) DO NOTHING;

-- Employer sponsorship table
CREATE TABLE IF NOT EXISTS public.employer_sponsorships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  sponsor_name text NOT NULL,
  sponsor_email text,
  total_credits_granted integer NOT NULL DEFAULT 0,
  credits_remaining integer NOT NULL DEFAULT 0,
  target_skills text[] DEFAULT '{}',
  target_territories text[] DEFAULT '{}',
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz
);

ALTER TABLE public.employer_sponsorships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmins can manage sponsorships"
  ON public.employer_sponsorships FOR ALL
  TO authenticated
  USING (is_superadmin(auth.uid()))
  WITH CHECK (is_superadmin(auth.uid()));

CREATE POLICY "Anyone can read active sponsorships"
  ON public.employer_sponsorships FOR SELECT
  TO authenticated
  USING (status = 'active');

-- Sponsored credit grants (links a sponsorship to specific users)
CREATE TABLE IF NOT EXISTS public.sponsored_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sponsorship_id uuid REFERENCES public.employer_sponsorships(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  credits_granted integer NOT NULL DEFAULT 0,
  granted_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sponsored_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own sponsored credits"
  ON public.sponsored_credits FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Superadmins can manage sponsored credits"
  ON public.sponsored_credits FOR ALL
  TO authenticated
  USING (is_superadmin(auth.uid()))
  WITH CHECK (is_superadmin(auth.uid()));

-- Function: get credit balance (sum of ledger)
CREATE OR REPLACE FUNCTION public.get_credit_balance(_user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(delta), 0)::integer
  FROM public.credit_ledger
  WHERE user_id = _user_id;
$$;

-- Function: deduct credits atomically
CREATE OR REPLACE FUNCTION public.deduct_credits(
  _user_id uuid,
  _amount integer,
  _reason text,
  _metadata jsonb DEFAULT '{}'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_balance integer;
BEGIN
  SELECT COALESCE(SUM(delta), 0) INTO current_balance
  FROM public.credit_ledger
  WHERE user_id = _user_id;

  IF current_balance < _amount THEN
    RETURN false;
  END IF;

  INSERT INTO public.credit_ledger (user_id, delta, reason, metadata)
  VALUES (_user_id, -_amount, _reason, _metadata);

  RETURN true;
END;
$$;

-- Function: grant credits (for sponsorship, purchases, rewards)
CREATE OR REPLACE FUNCTION public.grant_credits(
  _user_id uuid,
  _amount integer,
  _reason text,
  _metadata jsonb DEFAULT '{}'
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.credit_ledger (user_id, delta, reason, metadata)
  VALUES (_user_id, _amount, _reason, _metadata);
$$;

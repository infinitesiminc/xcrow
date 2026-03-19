
-- School accounts for B2B institutional licensing
CREATE TABLE public.school_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  domain text, -- e.g. "harvard.edu" for domain-based matching
  contact_email text,
  total_seats integer NOT NULL DEFAULT 0,
  used_seats integer NOT NULL DEFAULT 0,
  plan_status text NOT NULL DEFAULT 'active',
  stripe_customer_id text,
  stripe_subscription_id text,
  price_per_seat_cents integer NOT NULL DEFAULT 700, -- $7/student/year default
  billing_interval text NOT NULL DEFAULT 'year',
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  created_by uuid
);

ALTER TABLE public.school_accounts ENABLE ROW LEVEL SECURITY;

-- School admins table
CREATE TABLE public.school_admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.school_accounts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'admin',
  added_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(school_id, user_id)
);

ALTER TABLE public.school_admins ENABLE ROW LEVEL SECURITY;

-- School seats (students provisioned by school)
CREATE TABLE public.school_seats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.school_accounts(id) ON DELETE CASCADE,
  user_id uuid,
  invite_email text,
  status text NOT NULL DEFAULT 'invited', -- invited, active, revoked
  provisioned_at timestamptz NOT NULL DEFAULT now(),
  activated_at timestamptz,
  UNIQUE(school_id, user_id)
);

ALTER TABLE public.school_seats ENABLE ROW LEVEL SECURITY;

-- Helper function: check if user is a school admin
CREATE OR REPLACE FUNCTION public.is_school_admin(_user_id uuid, _school_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.school_admins
    WHERE user_id = _user_id AND school_id = _school_id
  );
$$;

-- Helper: check if user has an active school seat
CREATE OR REPLACE FUNCTION public.has_school_seat(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.school_seats ss
    JOIN public.school_accounts sa ON sa.id = ss.school_id
    WHERE ss.user_id = _user_id
      AND ss.status = 'active'
      AND sa.plan_status = 'active'
      AND (sa.expires_at IS NULL OR sa.expires_at > now())
  );
$$;

-- RLS: school_accounts
CREATE POLICY "School admins can read own school" ON public.school_accounts
  FOR SELECT TO authenticated
  USING (is_school_admin(auth.uid(), id));

CREATE POLICY "Superadmins can manage schools" ON public.school_accounts
  FOR ALL TO authenticated
  USING (is_superadmin(auth.uid()))
  WITH CHECK (is_superadmin(auth.uid()));

-- RLS: school_admins
CREATE POLICY "Admins can read own admin record" ON public.school_admins
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "School admins can manage admins" ON public.school_admins
  FOR ALL TO authenticated
  USING (is_school_admin(auth.uid(), school_id))
  WITH CHECK (is_school_admin(auth.uid(), school_id));

CREATE POLICY "Superadmins can manage school admins" ON public.school_admins
  FOR ALL TO authenticated
  USING (is_superadmin(auth.uid()))
  WITH CHECK (is_superadmin(auth.uid()));

-- RLS: school_seats
CREATE POLICY "Users can read own seat" ON public.school_seats
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "School admins can manage seats" ON public.school_seats
  FOR ALL TO authenticated
  USING (is_school_admin(auth.uid(), school_id))
  WITH CHECK (is_school_admin(auth.uid(), school_id));

CREATE POLICY "Superadmins can manage school seats" ON public.school_seats
  FOR ALL TO authenticated
  USING (is_superadmin(auth.uid()))
  WITH CHECK (is_superadmin(auth.uid()));

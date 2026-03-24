CREATE TABLE public.competition_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  full_name text NOT NULL,
  email text NOT NULL,
  university text NOT NULL,
  graduation_year integer,
  user_id uuid,
  UNIQUE(email)
);

ALTER TABLE public.competition_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can register" ON public.competition_registrations
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Users can read own registration" ON public.competition_registrations
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Superadmins can read all" ON public.competition_registrations
  FOR SELECT TO authenticated
  USING (public.is_superadmin(auth.uid()));
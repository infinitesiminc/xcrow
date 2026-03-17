
CREATE TABLE public.user_use_case_interests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  use_case text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, use_case)
);

ALTER TABLE public.user_use_case_interests ENABLE ROW LEVEL SECURITY;

-- Users can insert their own interests
CREATE POLICY "Users can insert own interests"
  ON public.user_use_case_interests
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can read own interests
CREATE POLICY "Users can read own interests"
  ON public.user_use_case_interests
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Users can delete own interests
CREATE POLICY "Users can delete own interests"
  ON public.user_use_case_interests
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Superadmins can read all interests
CREATE POLICY "Superadmins can read all interests"
  ON public.user_use_case_interests
  FOR SELECT TO authenticated
  USING (public.is_superadmin(auth.uid()));

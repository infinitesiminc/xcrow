
-- Allow superadmins to read all profiles
CREATE POLICY "Superadmins can read all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.is_superadmin(auth.uid()));

-- Allow superadmins to read all workspace_members
CREATE POLICY "Superadmins can read all workspace members"
  ON public.workspace_members FOR SELECT
  TO authenticated
  USING (public.is_superadmin(auth.uid()));

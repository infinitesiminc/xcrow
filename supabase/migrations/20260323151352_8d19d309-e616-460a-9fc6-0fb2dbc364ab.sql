
-- Allow authenticated users to read any profile (needed for social features: allies, search, public profiles)
CREATE POLICY "Authenticated users can read all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to read school name/city/state for autocomplete
CREATE POLICY "Authenticated users can search schools"
ON public.school_accounts
FOR SELECT
TO authenticated
USING (true);

-- Add graduation year and degree type to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS graduation_year integer;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS degree_type text;
CREATE POLICY "Superadmins can update any company"
ON public.companies FOR UPDATE
TO authenticated
USING (is_superadmin(auth.uid()))
WITH CHECK (is_superadmin(auth.uid()));
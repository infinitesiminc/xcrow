
-- Allow users to delete their own analysis history
CREATE POLICY "Users can delete own history"
ON public.analysis_history
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Allow users to delete their own profile
CREATE POLICY "Users can delete own profile"
ON public.profiles
FOR DELETE
TO authenticated
USING (auth.uid() = id);

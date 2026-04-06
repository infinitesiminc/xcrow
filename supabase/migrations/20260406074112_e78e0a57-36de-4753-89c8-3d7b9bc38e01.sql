-- Tighten leadhunter_cache: only authenticated users can insert/update
DROP POLICY IF EXISTS "Anyone can insert cache" ON public.leadhunter_cache;
DROP POLICY IF EXISTS "Anyone can update cache" ON public.leadhunter_cache;

CREATE POLICY "Authenticated users can insert cache"
  ON public.leadhunter_cache
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update cache"
  ON public.leadhunter_cache
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Also allow service_role for edge functions
CREATE POLICY "Service role can manage cache"
  ON public.leadhunter_cache
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
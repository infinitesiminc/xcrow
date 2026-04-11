CREATE POLICY "Service role can update research jobs"
ON public.research_jobs FOR UPDATE
USING (true)
WITH CHECK (true);
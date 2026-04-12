-- 1. Fix research_jobs UPDATE: restrict to service_role only
DROP POLICY IF EXISTS "Service role can update research jobs" ON public.research_jobs;
CREATE POLICY "Service role can update research jobs"
  ON public.research_jobs
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 2. Fix leadhunter_cache SELECT: restrict to authenticated
DROP POLICY IF EXISTS "Anyone can read cache" ON public.leadhunter_cache;
CREATE POLICY "Authenticated users can read cache"
  ON public.leadhunter_cache
  FOR SELECT
  TO authenticated
  USING (true);

-- 3. Fix draft_emails: change from public to authenticated
DROP POLICY IF EXISTS "Users can create own drafts" ON public.draft_emails;
DROP POLICY IF EXISTS "Users can delete own drafts" ON public.draft_emails;
DROP POLICY IF EXISTS "Users can update own drafts" ON public.draft_emails;
DROP POLICY IF EXISTS "Users can view own drafts" ON public.draft_emails;

CREATE POLICY "Users can view own drafts" ON public.draft_emails FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own drafts" ON public.draft_emails FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own drafts" ON public.draft_emails FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own drafts" ON public.draft_emails FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 4. Fix lead_notes: change from public to authenticated
DROP POLICY IF EXISTS "Users can create own lead notes" ON public.lead_notes;
DROP POLICY IF EXISTS "Users can delete own lead notes" ON public.lead_notes;
DROP POLICY IF EXISTS "Users can update own lead notes" ON public.lead_notes;
DROP POLICY IF EXISTS "Users can view own lead notes" ON public.lead_notes;

CREATE POLICY "Users can view own lead notes" ON public.lead_notes FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own lead notes" ON public.lead_notes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own lead notes" ON public.lead_notes FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own lead notes" ON public.lead_notes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 5. Fix leadgen_niches: change from public to authenticated
DROP POLICY IF EXISTS "Users can create their own niches" ON public.leadgen_niches;
DROP POLICY IF EXISTS "Users can delete their own niches" ON public.leadgen_niches;
DROP POLICY IF EXISTS "Users can update their own niches" ON public.leadgen_niches;
DROP POLICY IF EXISTS "Users can view their own niches" ON public.leadgen_niches;

CREATE POLICY "Users can view their own niches" ON public.leadgen_niches FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own niches" ON public.leadgen_niches FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own niches" ON public.leadgen_niches FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own niches" ON public.leadgen_niches FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 6. Fix saved_leads: change from public to authenticated
DROP POLICY IF EXISTS "Users can delete own leads" ON public.saved_leads;
DROP POLICY IF EXISTS "Users can insert own leads" ON public.saved_leads;
DROP POLICY IF EXISTS "Users can update own leads" ON public.saved_leads;
DROP POLICY IF EXISTS "Users can view own leads" ON public.saved_leads;

CREATE POLICY "Users can view own leads" ON public.saved_leads FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own leads" ON public.saved_leads FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own leads" ON public.saved_leads FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own leads" ON public.saved_leads FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 7. Fix outreach_log: change from public to authenticated
DROP POLICY IF EXISTS "Users can insert own outreach" ON public.outreach_log;
DROP POLICY IF EXISTS "Users can view own outreach" ON public.outreach_log;

CREATE POLICY "Users can view own outreach" ON public.outreach_log FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own outreach" ON public.outreach_log FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 8. Fix federal_tax_liens: change from public to authenticated
DROP POLICY IF EXISTS "Users can create their own liens" ON public.federal_tax_liens;
DROP POLICY IF EXISTS "Users can delete their own liens" ON public.federal_tax_liens;
DROP POLICY IF EXISTS "Users can update their own liens" ON public.federal_tax_liens;
DROP POLICY IF EXISTS "Users can view their own liens" ON public.federal_tax_liens;

CREATE POLICY "Users can view their own liens" ON public.federal_tax_liens FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own liens" ON public.federal_tax_liens FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own liens" ON public.federal_tax_liens FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own liens" ON public.federal_tax_liens FOR DELETE TO authenticated USING (auth.uid() = user_id);
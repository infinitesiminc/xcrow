
-- Remove duplicates keeping only the latest entry per user_id/job_title/company
DELETE FROM public.analysis_history a
USING public.analysis_history b
WHERE a.id < b.id
  AND a.user_id = b.user_id
  AND a.job_title = b.job_title
  AND COALESCE(a.company, '') = COALESCE(b.company, '');

-- Create unique index for upsert to work
CREATE UNIQUE INDEX analysis_history_user_job_company_idx
ON public.analysis_history (user_id, job_title, COALESCE(company, ''));

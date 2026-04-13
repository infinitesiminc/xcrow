
-- Add seniority ranking and decision role explanation to saved_leads
ALTER TABLE public.saved_leads 
  ADD COLUMN IF NOT EXISTS seniority_rank integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS decision_role text DEFAULT NULL;

-- Index for sorting by seniority
CREATE INDEX IF NOT EXISTS idx_saved_leads_seniority_rank 
  ON public.saved_leads (user_id, workspace_key, seniority_rank NULLS LAST);

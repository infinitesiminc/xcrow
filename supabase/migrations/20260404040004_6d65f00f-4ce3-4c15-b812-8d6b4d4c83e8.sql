ALTER TABLE public.saved_leads
ADD COLUMN IF NOT EXISTS workspace_key text;

ALTER TABLE public.leadgen_niches
ADD COLUMN IF NOT EXISTS workspace_key text;

UPDATE public.saved_leads
SET workspace_key = lower(trim(coalesce(source, website, 'default')))
WHERE workspace_key IS NULL;

UPDATE public.leadgen_niches
SET workspace_key = 'default'
WHERE workspace_key IS NULL;

ALTER TABLE public.saved_leads
ALTER COLUMN workspace_key SET DEFAULT 'default';

ALTER TABLE public.saved_leads
ALTER COLUMN workspace_key SET NOT NULL;

ALTER TABLE public.leadgen_niches
ALTER COLUMN workspace_key SET DEFAULT 'default';

ALTER TABLE public.leadgen_niches
ALTER COLUMN workspace_key SET NOT NULL;

DROP INDEX IF EXISTS public.idx_saved_leads_dedup;
DROP INDEX IF EXISTS public.idx_leadgen_niches_user_label;

CREATE UNIQUE INDEX IF NOT EXISTS idx_saved_leads_workspace_dedup
ON public.saved_leads (user_id, workspace_key, COALESCE(email, ''), COALESCE(company, ''));

CREATE INDEX IF NOT EXISTS idx_saved_leads_user_workspace
ON public.saved_leads (user_id, workspace_key);

CREATE UNIQUE INDEX IF NOT EXISTS idx_leadgen_niches_user_workspace_label
ON public.leadgen_niches (user_id, workspace_key, label);

CREATE INDEX IF NOT EXISTS idx_leadgen_niches_user_workspace
ON public.leadgen_niches (user_id, workspace_key);
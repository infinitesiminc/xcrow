
ALTER TABLE public.school_accounts
  ADD COLUMN IF NOT EXISTS ipeds_id text UNIQUE,
  ADD COLUMN IF NOT EXISTS institution_type text DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS carnegie_class text,
  ADD COLUMN IF NOT EXISTS state text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS enrollment integer,
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS pipeline_stage text DEFAULT 'prospect',
  ADD COLUMN IF NOT EXISTS latitude numeric,
  ADD COLUMN IF NOT EXISTS longitude numeric,
  ADD COLUMN IF NOT EXISTS is_hbcu boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS catalog_url text;

CREATE INDEX IF NOT EXISTS idx_school_accounts_state ON public.school_accounts(state);
CREATE INDEX IF NOT EXISTS idx_school_accounts_pipeline_stage ON public.school_accounts(pipeline_stage);
CREATE INDEX IF NOT EXISTS idx_school_accounts_institution_type ON public.school_accounts(institution_type);

-- Import log: one row per import operation
CREATE TABLE public.import_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  initiated_by uuid REFERENCES auth.users(id),
  source text NOT NULL, -- 'sync-company-jobs', 'enrich-company', 'detect-ats', 'bulk-analyze'
  action text NOT NULL, -- 'companies', 'jobs', 'ats-detect', 'analyze'
  target_company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  target_company_name text,
  ats_platform text,
  result_status text NOT NULL DEFAULT 'success', -- 'success', 'partial', 'error'
  items_processed int NOT NULL DEFAULT 0,
  items_created int NOT NULL DEFAULT 0,
  items_updated int NOT NULL DEFAULT 0,
  items_skipped int NOT NULL DEFAULT 0,
  flags_raised int NOT NULL DEFAULT 0,
  duration_ms int,
  metadata jsonb DEFAULT '{}'::jsonb,
  error_message text
);

-- Import flags: edge cases needing superadmin review
CREATE TABLE public.import_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  import_log_id uuid REFERENCES public.import_log(id) ON DELETE CASCADE,
  flag_type text NOT NULL, -- 'name_collision', 'slug_probe_failed', 'ats_mismatch', 'zero_jobs', 'data_quality', 'merge_conflict'
  severity text NOT NULL DEFAULT 'info', -- 'info', 'warn', 'action_required'
  status text NOT NULL DEFAULT 'open', -- 'open', 'resolved', 'dismissed'
  resolved_at timestamptz,
  resolved_by uuid REFERENCES auth.users(id),
  resolution_note text,
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  company_name text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  suggested_action text -- human-readable suggestion
);

-- RLS: superadmin only
ALTER TABLE public.import_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmins can manage import_log" ON public.import_log
  FOR ALL TO authenticated
  USING (public.is_superadmin(auth.uid()))
  WITH CHECK (public.is_superadmin(auth.uid()));

CREATE POLICY "Service role can manage import_log" ON public.import_log
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Superadmins can manage import_flags" ON public.import_flags
  FOR ALL TO authenticated
  USING (public.is_superadmin(auth.uid()))
  WITH CHECK (public.is_superadmin(auth.uid()));

CREATE POLICY "Service role can manage import_flags" ON public.import_flags
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Index for fast lookups
CREATE INDEX idx_import_log_created ON public.import_log(created_at DESC);
CREATE INDEX idx_import_flags_status ON public.import_flags(status) WHERE status = 'open';
CREATE INDEX idx_import_flags_log ON public.import_flags(import_log_id);
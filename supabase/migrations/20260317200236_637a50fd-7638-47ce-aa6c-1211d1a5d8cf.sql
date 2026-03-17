
-- Feature flags table for admin-controlled toggles
CREATE TABLE public.feature_flags (
  key TEXT PRIMARY KEY,
  enabled BOOLEAN NOT NULL DEFAULT false,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID
);

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- Everyone can read flags
CREATE POLICY "Anyone can read feature flags"
ON public.feature_flags FOR SELECT
USING (true);

-- Only superadmins can modify flags
CREATE POLICY "Superadmins can manage feature flags"
ON public.feature_flags FOR ALL
USING (public.is_superadmin(auth.uid()))
WITH CHECK (public.is_superadmin(auth.uid()));

-- Seed the update notifications flag (disabled by default)
INSERT INTO public.feature_flags (key, enabled, description)
VALUES ('show_update_notifications', false, 'Show task-update badges and banners on the Learning Path when AI assessments change');

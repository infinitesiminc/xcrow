
-- Curriculum scrape jobs
CREATE TABLE public.school_curricula (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.school_accounts(id) ON DELETE CASCADE,
  source_url text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  programs_found integer NOT NULL DEFAULT 0,
  programs_parsed integer NOT NULL DEFAULT 0,
  error_message text,
  initiated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE public.school_curricula ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmins can manage curricula"
  ON public.school_curricula FOR ALL
  TO authenticated
  USING (is_superadmin(auth.uid()))
  WITH CHECK (is_superadmin(auth.uid()));

CREATE POLICY "School admins can read own curricula"
  ON public.school_curricula FOR SELECT
  TO authenticated
  USING (is_school_admin(auth.uid(), school_id));

-- Parsed courses/programs
CREATE TABLE public.school_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  curriculum_id uuid NOT NULL REFERENCES public.school_curricula(id) ON DELETE CASCADE,
  school_id uuid NOT NULL REFERENCES public.school_accounts(id) ON DELETE CASCADE,
  program_name text NOT NULL,
  degree_type text,
  department text,
  source_url text,
  description text,
  skills_extracted jsonb DEFAULT '[]'::jsonb,
  skill_categories jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.school_courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmins can manage courses"
  ON public.school_courses FOR ALL
  TO authenticated
  USING (is_superadmin(auth.uid()))
  WITH CHECK (is_superadmin(auth.uid()));

CREATE POLICY "School admins can read own courses"
  ON public.school_courses FOR SELECT
  TO authenticated
  USING (is_school_admin(auth.uid(), school_id));

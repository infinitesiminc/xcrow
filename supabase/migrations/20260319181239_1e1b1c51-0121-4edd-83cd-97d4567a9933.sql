
-- Add enriched columns to school_courses for deeper extraction
ALTER TABLE public.school_courses
  ADD COLUMN IF NOT EXISTS tools_taught jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS ai_content_flag boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS learning_outcomes jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS industry_sectors jsonb DEFAULT '[]'::jsonb;

-- Individual courses within a program
CREATE TABLE public.school_course_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES public.school_courses(id) ON DELETE CASCADE NOT NULL,
  school_id uuid REFERENCES public.school_accounts(id) ON DELETE CASCADE NOT NULL,
  course_code text,
  course_name text NOT NULL,
  description text,
  skills jsonb DEFAULT '[]'::jsonb,
  tools jsonb DEFAULT '[]'::jsonb,
  is_ai_related boolean DEFAULT false,
  competency_level text DEFAULT 'introductory',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.school_course_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "School admins can read own course items"
  ON public.school_course_items FOR SELECT
  TO authenticated
  USING (is_school_admin(auth.uid(), school_id));

CREATE POLICY "Superadmins can manage course items"
  ON public.school_course_items FOR ALL
  TO authenticated
  USING (is_superadmin(auth.uid()))
  WITH CHECK (is_superadmin(auth.uid()));

CREATE POLICY "Service role can manage course items"
  ON public.school_course_items FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

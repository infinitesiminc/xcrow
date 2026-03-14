
CREATE TABLE public.bookmarked_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_title text NOT NULL,
  company text,
  augmented_percent integer DEFAULT 0,
  automation_risk_percent integer DEFAULT 0,
  new_skills_percent integer DEFAULT 0,
  bookmarked_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, job_title, company)
);

ALTER TABLE public.bookmarked_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own bookmarks" ON public.bookmarked_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own bookmarks" ON public.bookmarked_roles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own bookmarks" ON public.bookmarked_roles FOR DELETE TO authenticated USING (auth.uid() = user_id);

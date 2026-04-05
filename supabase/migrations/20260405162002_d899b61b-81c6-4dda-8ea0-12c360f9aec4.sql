
-- ============================================
-- GTM Academy Schema
-- ============================================

-- 1. Academy Modules (the 11 modules)
CREATE TABLE public.academy_modules (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  phase TEXT NOT NULL DEFAULT 'find',
  sort_order INTEGER NOT NULL DEFAULT 0,
  icon_emoji TEXT DEFAULT '📘',
  prerequisite_module_id TEXT REFERENCES public.academy_modules(id),
  pass_threshold INTEGER NOT NULL DEFAULT 70,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.academy_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read modules"
  ON public.academy_modules FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Superadmins can manage modules"
  ON public.academy_modules FOR ALL
  TO authenticated
  USING (is_superadmin(auth.uid()))
  WITH CHECK (is_superadmin(auth.uid()));

-- 2. Academy Lessons (lessons within modules)
CREATE TABLE public.academy_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id TEXT NOT NULL REFERENCES public.academy_modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  lesson_type TEXT NOT NULL DEFAULT 'concept',
  sort_order INTEGER NOT NULL DEFAULT 0,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  xp_reward INTEGER NOT NULL DEFAULT 50,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.academy_lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read lessons"
  ON public.academy_lessons FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Superadmins can manage lessons"
  ON public.academy_lessons FOR ALL
  TO authenticated
  USING (is_superadmin(auth.uid()))
  WITH CHECK (is_superadmin(auth.uid()));

-- 3. User Lesson Progress
CREATE TABLE public.user_lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  lesson_id UUID NOT NULL REFERENCES public.academy_lessons(id) ON DELETE CASCADE,
  module_id TEXT NOT NULL REFERENCES public.academy_modules(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'locked',
  score INTEGER,
  judgment_score INTEGER,
  speed_score INTEGER,
  override_score INTEGER,
  tool_score INTEGER,
  attempts INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

ALTER TABLE public.user_lesson_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own progress"
  ON public.user_lesson_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
  ON public.user_lesson_progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON public.user_lesson_progress FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Superadmins can read all progress"
  ON public.user_lesson_progress FOR SELECT
  TO authenticated
  USING (is_superadmin(auth.uid()));

-- 4. XP Ledger
CREATE TABLE public.xp_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  delta INTEGER NOT NULL,
  reason TEXT NOT NULL,
  lesson_id UUID REFERENCES public.academy_lessons(id),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.xp_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own xp"
  ON public.xp_ledger FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own xp"
  ON public.xp_ledger FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Superadmins can read all xp"
  ON public.xp_ledger FOR SELECT
  TO authenticated
  USING (is_superadmin(auth.uid()));

-- 5. User Streaks
CREATE TABLE public.user_streaks (
  user_id UUID PRIMARY KEY,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
  freeze_remaining INTEGER NOT NULL DEFAULT 1,
  streak_multiplier NUMERIC(3,1) NOT NULL DEFAULT 1.0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own streak"
  ON public.user_streaks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can upsert own streak"
  ON public.user_streaks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own streak"
  ON public.user_streaks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- 6. User Badges
CREATE TABLE public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  badge_key TEXT NOT NULL,
  badge_label TEXT NOT NULL,
  badge_emoji TEXT DEFAULT '🏅',
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_key)
);

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own badges"
  ON public.user_badges FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own badges"
  ON public.user_badges FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Superadmins can read all badges"
  ON public.user_badges FOR SELECT
  TO authenticated
  USING (is_superadmin(auth.uid()));

-- Helper function: get total XP for a user
CREATE OR REPLACE FUNCTION public.get_user_xp(_user_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(delta), 0)::integer
  FROM public.xp_ledger
  WHERE user_id = _user_id
$$;

-- Helper function: get user level from XP
CREATE OR REPLACE FUNCTION public.get_user_level(_user_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN get_user_xp(_user_id) < 1000 THEN GREATEST(1, get_user_xp(_user_id) / 200 + 1)
    WHEN get_user_xp(_user_id) < 3000 THEN 6 + (get_user_xp(_user_id) - 1000) / 400
    WHEN get_user_xp(_user_id) < 7000 THEN 11 + (get_user_xp(_user_id) - 3000) / 800
    WHEN get_user_xp(_user_id) < 15000 THEN 16 + (get_user_xp(_user_id) - 7000) / 1600
    ELSE 21 + (get_user_xp(_user_id) - 15000) / 3000
  END
$$;

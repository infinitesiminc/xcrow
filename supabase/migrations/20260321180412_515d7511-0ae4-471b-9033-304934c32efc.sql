
-- Skill Drop Events table
CREATE TABLE public.skill_drop_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  skill_id text REFERENCES public.skills(id) ON DELETE SET NULL,
  rarity text NOT NULL DEFAULT 'rare',
  status text NOT NULL DEFAULT 'draft',
  starts_at timestamp with time zone,
  ends_at timestamp with time zone,
  tier_1_label text NOT NULL DEFAULT 'Rare',
  tier_1_threshold integer NOT NULL DEFAULT 1,
  tier_2_label text NOT NULL DEFAULT 'Epic',
  tier_2_threshold integer NOT NULL DEFAULT 3,
  tier_3_label text NOT NULL DEFAULT 'Legendary',
  tier_3_threshold integer NOT NULL DEFAULT 5,
  tier_3_perfect_required boolean NOT NULL DEFAULT true,
  banner_emoji text DEFAULT '⚔️',
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- User participation in drop events
CREATE TABLE public.skill_drop_participations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.skill_drop_events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  sims_completed integer NOT NULL DEFAULT 0,
  best_score integer NOT NULL DEFAULT 0,
  tier_earned text,
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- RLS
ALTER TABLE public.skill_drop_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_drop_participations ENABLE ROW LEVEL SECURITY;

-- Events: anyone can read active events, superadmins can manage
CREATE POLICY "Anyone can read active events"
  ON public.skill_drop_events FOR SELECT
  TO anon, authenticated
  USING (status = 'active');

CREATE POLICY "Superadmins can manage events"
  ON public.skill_drop_events FOR ALL
  TO authenticated
  USING (public.is_superadmin(auth.uid()))
  WITH CHECK (public.is_superadmin(auth.uid()));

-- Participations: users can read/insert/update own
CREATE POLICY "Users can read own participations"
  ON public.skill_drop_participations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can join events"
  ON public.skill_drop_participations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own participations"
  ON public.skill_drop_participations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Superadmins can read all participations for analytics
CREATE POLICY "Superadmins can read all participations"
  ON public.skill_drop_participations FOR SELECT
  TO authenticated
  USING (public.is_superadmin(auth.uid()));

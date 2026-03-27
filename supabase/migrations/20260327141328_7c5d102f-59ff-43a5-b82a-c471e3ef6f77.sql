
-- Disrupt game rooms (created by professor)
CREATE TABLE public.disrupt_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code text NOT NULL UNIQUE,
  name text NOT NULL DEFAULT 'Disruption Battle',
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL DEFAULT 'lobby', -- lobby, drafting, battling, scoring, completed
  duration_minutes integer NOT NULL DEFAULT 30,
  max_teams integer NOT NULL DEFAULT 8,
  max_team_size integer NOT NULL DEFAULT 5,
  started_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Teams within a room
CREATE TABLE public.disrupt_teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES public.disrupt_rooms(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  color text NOT NULL DEFAULT '#8B5CF6',
  incumbent_id text, -- references disruption-incumbents data key
  cluster_id text,
  current_step integer NOT NULL DEFAULT 0,
  total_score integer NOT NULL DEFAULT 0,
  step_scores jsonb DEFAULT '[]'::jsonb,
  battle_transcript jsonb DEFAULT '[]'::jsonb,
  score_result jsonb,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(room_id, name)
);

-- Team members
CREATE TABLE public.disrupt_team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES public.disrupt_teams(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL DEFAULT 'member', -- captain, member
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(team_id, user_id)
);

-- Enable RLS
ALTER TABLE public.disrupt_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disrupt_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disrupt_team_members ENABLE ROW LEVEL SECURITY;

-- Room policies: anyone authenticated can read, creator can update
CREATE POLICY "Anyone can read rooms" ON public.disrupt_rooms FOR SELECT TO authenticated USING (true);
CREATE POLICY "Creator can insert rooms" ON public.disrupt_rooms FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Creator can update rooms" ON public.disrupt_rooms FOR UPDATE TO authenticated USING (auth.uid() = created_by);

-- Team policies: room members can read, room members can insert/update
CREATE POLICY "Anyone can read teams" ON public.disrupt_teams FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert teams" ON public.disrupt_teams FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Team members can update teams" ON public.disrupt_teams FOR UPDATE TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.disrupt_team_members WHERE team_id = disrupt_teams.id AND user_id = auth.uid()));

-- Member policies
CREATE POLICY "Anyone can read members" ON public.disrupt_team_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can join teams" ON public.disrupt_team_members FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Members can leave" ON public.disrupt_team_members FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Enable realtime for live scoreboard
ALTER PUBLICATION supabase_realtime ADD TABLE public.disrupt_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.disrupt_teams;
ALTER PUBLICATION supabase_realtime ADD TABLE public.disrupt_team_members;

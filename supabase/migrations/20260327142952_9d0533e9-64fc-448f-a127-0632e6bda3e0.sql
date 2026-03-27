
-- Add Act 2 & 3 columns to disrupt_teams
ALTER TABLE public.disrupt_teams
  ADD COLUMN IF NOT EXISTS venture_canvas jsonb DEFAULT null,
  ADD COLUMN IF NOT EXISTS pitch_data jsonb DEFAULT null,
  ADD COLUMN IF NOT EXISTS act integer NOT NULL DEFAULT 1;

-- Create votes table for Act 3 class voting
CREATE TABLE public.disrupt_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES public.disrupt_rooms(id) ON DELETE CASCADE NOT NULL,
  voter_id uuid NOT NULL,
  team_id uuid REFERENCES public.disrupt_teams(id) ON DELETE CASCADE NOT NULL,
  viability integer NOT NULL CHECK (viability >= 1 AND viability <= 5),
  clarity integer NOT NULL CHECK (clarity >= 1 AND clarity <= 5),
  defensibility integer NOT NULL CHECK (defensibility >= 1 AND defensibility <= 5),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (room_id, voter_id, team_id)
);

ALTER TABLE public.disrupt_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can insert votes" ON public.disrupt_votes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = voter_id);

CREATE POLICY "Anyone can read votes in their room" ON public.disrupt_votes
  FOR SELECT TO authenticated USING (true);

-- Enable realtime for votes
ALTER PUBLICATION supabase_realtime ADD TABLE public.disrupt_votes;

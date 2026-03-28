
-- Vertical mapping for Software Factory
CREATE TABLE public.company_vertical_map (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  vertical_id integer NOT NULL,
  vertical_name text NOT NULL,
  sub_vertical text,
  role text NOT NULL DEFAULT 'incumbent' CHECK (role IN ('incumbent', 'disruptor', 'transitioning')),
  confidence numeric(3,2) DEFAULT 0.80,
  classified_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, vertical_id)
);

-- Index for fast vertical lookups
CREATE INDEX idx_cvm_vertical ON public.company_vertical_map(vertical_id);
CREATE INDEX idx_cvm_role ON public.company_vertical_map(role);

-- RLS
ALTER TABLE public.company_vertical_map ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read vertical map"
  ON public.company_vertical_map FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Service role can manage vertical map"
  ON public.company_vertical_map FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

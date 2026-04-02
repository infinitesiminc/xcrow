
CREATE TABLE public.leadgen_niches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  lead_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.leadgen_niches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own niches"
  ON public.leadgen_niches FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own niches"
  ON public.leadgen_niches FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own niches"
  ON public.leadgen_niches FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own niches"
  ON public.leadgen_niches FOR DELETE
  USING (auth.uid() = user_id);

CREATE UNIQUE INDEX idx_leadgen_niches_user_label ON public.leadgen_niches (user_id, label);
CREATE INDEX idx_leadgen_niches_user ON public.leadgen_niches (user_id);

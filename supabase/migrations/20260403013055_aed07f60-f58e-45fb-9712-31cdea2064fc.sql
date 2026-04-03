CREATE TABLE public.lead_notes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id uuid NOT NULL REFERENCES public.saved_leads(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.lead_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own lead notes"
  ON public.lead_notes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own lead notes"
  ON public.lead_notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own lead notes"
  ON public.lead_notes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own lead notes"
  ON public.lead_notes FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_lead_notes_lead_id ON public.lead_notes(lead_id);
CREATE INDEX idx_lead_notes_user_id ON public.lead_notes(user_id);

CREATE TRIGGER update_lead_notes_updated_at
  BEFORE UPDATE ON public.lead_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
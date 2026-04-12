
CREATE TABLE public.lead_topups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  leads_granted INTEGER NOT NULL DEFAULT 50,
  leads_used INTEGER NOT NULL DEFAULT 0,
  stripe_session_id TEXT,
  purchased_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.lead_topups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own topups"
ON public.lead_topups
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE INDEX idx_lead_topups_user ON public.lead_topups(user_id);

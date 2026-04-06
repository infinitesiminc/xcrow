
CREATE TABLE public.draft_emails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  lead_id UUID REFERENCES public.saved_leads(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  workspace_key TEXT NOT NULL DEFAULT 'default',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, lead_id)
);

ALTER TABLE public.draft_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own drafts" ON public.draft_emails FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own drafts" ON public.draft_emails FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own drafts" ON public.draft_emails FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own drafts" ON public.draft_emails FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_draft_emails_updated_at
  BEFORE UPDATE ON public.draft_emails
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

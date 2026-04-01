
-- Reusable updated_at function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Lead status enum
CREATE TYPE public.lead_status AS ENUM ('new', 'contacted', 'replied', 'won', 'lost');

-- Saved leads table
CREATE TABLE public.saved_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  title TEXT,
  company TEXT,
  email TEXT,
  phone TEXT,
  linkedin TEXT,
  website TEXT,
  address TEXT,
  source TEXT DEFAULT 'chat',
  email_confidence TEXT,
  summary TEXT,
  reason TEXT,
  photo_url TEXT,
  status lead_status NOT NULL DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_saved_leads_dedup ON public.saved_leads (user_id, COALESCE(email, ''), COALESCE(company, ''));

ALTER TABLE public.saved_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own leads" ON public.saved_leads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own leads" ON public.saved_leads FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own leads" ON public.saved_leads FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own leads" ON public.saved_leads FOR DELETE USING (auth.uid() = user_id);

-- Outreach log table
CREATE TABLE public.outreach_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  lead_id UUID REFERENCES public.saved_leads(id) ON DELETE CASCADE NOT NULL,
  channel TEXT NOT NULL DEFAULT 'email',
  subject TEXT,
  body TEXT,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'sent'
);

ALTER TABLE public.outreach_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own outreach" ON public.outreach_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own outreach" ON public.outreach_log FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Updated_at trigger
CREATE TRIGGER update_saved_leads_updated_at
  BEFORE UPDATE ON public.saved_leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

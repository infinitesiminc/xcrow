
ALTER TABLE public.saved_leads ADD COLUMN niche_tag text NULL;
CREATE INDEX idx_saved_leads_niche_tag ON public.saved_leads (user_id, niche_tag);


CREATE TABLE public.leadhunter_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  website_key TEXT NOT NULL UNIQUE,
  company_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  step_results JSONB NOT NULL DEFAULT '{}'::jsonb,
  tree_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days')
);

CREATE INDEX idx_leadhunter_cache_website ON public.leadhunter_cache (website_key);

ALTER TABLE public.leadhunter_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read cache"
  ON public.leadhunter_cache FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert cache"
  ON public.leadhunter_cache FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update cache"
  ON public.leadhunter_cache FOR UPDATE
  USING (true);

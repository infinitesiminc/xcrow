
CREATE TABLE public.user_workspaces (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  website_key TEXT NOT NULL,
  display_name TEXT,
  logo_url TEXT,
  last_accessed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, website_key)
);

ALTER TABLE public.user_workspaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own workspaces"
  ON public.user_workspaces FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own workspaces"
  ON public.user_workspaces FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workspaces"
  ON public.user_workspaces FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own workspaces"
  ON public.user_workspaces FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_user_workspaces_user_last ON public.user_workspaces (user_id, last_accessed_at DESC);

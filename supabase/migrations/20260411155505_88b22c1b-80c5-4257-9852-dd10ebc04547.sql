-- Add persona_tag column to saved_leads
ALTER TABLE public.saved_leads ADD COLUMN IF NOT EXISTS persona_tag text;

-- Create index for persona_tag queries
CREATE INDEX IF NOT EXISTS idx_saved_leads_persona_tag ON public.saved_leads (workspace_key, persona_tag) WHERE persona_tag IS NOT NULL;

-- Create function to aggregate persona performance from outreach outcomes
CREATE OR REPLACE FUNCTION public.get_persona_performance(_workspace_key text)
RETURNS TABLE (
  persona_tag text,
  total_leads bigint,
  contacted bigint,
  replied bigint,
  won bigint,
  lost bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    sl.persona_tag,
    COUNT(*) as total_leads,
    COUNT(*) FILTER (WHERE sl.status = 'contacted') as contacted,
    COUNT(*) FILTER (WHERE sl.status = 'replied') as replied,
    COUNT(*) FILTER (WHERE sl.status = 'won') as won,
    COUNT(*) FILTER (WHERE sl.status = 'lost') as lost
  FROM public.saved_leads sl
  WHERE sl.workspace_key = _workspace_key 
    AND sl.persona_tag IS NOT NULL
    AND sl.user_id = auth.uid()
  GROUP BY sl.persona_tag
  ORDER BY total_leads DESC;
$$;
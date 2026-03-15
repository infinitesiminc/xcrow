CREATE TABLE public.ticker_headlines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date text NOT NULL,
  text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ticker_headlines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access" ON public.ticker_headlines
  FOR SELECT TO anon, authenticated USING (true);

-- Seed with initial data
INSERT INTO public.ticker_headlines (date, text) VALUES
  ('Mar 14', 'Software sector meltdown: ~$2T erased as AI tools threaten legacy subscriptions'),
  ('Mar 12', 'CrowdStrike, Zscaler, Cloudflare slide after Anthropic''s Claude Code security tool launch'),
  ('Mar 11', 'Salesforce, Intuit, ServiceNow down 20%+ on AI replacement fears'),
  ('Mar 10', 'Thomson Reuters plunges in record one-day drop over Claude legal plugin threat'),
  ('Mar 7', 'Block Inc. plans to lay off nearly half its workforce as AI automates operations'),
  ('Mar 5', 'Atlassian cuts ~10% of staff to redirect resources toward AI'),
  ('Mar 3', 'ServiceNow using AI to eliminate 90% of human customer service use cases'),
  ('Feb 28', 'AI-driven tax tools pressure Raymond James & LPL Financial share prices'),
  ('Feb 26', 'CBRE & JLL fall ~12% on commercial real estate AI automation concerns'),
  ('Feb 24', 'Nvidia slides as hyperscaler CapEx scrutiny intensifies amid uncertain AI ROI'),
  ('Feb 21', 'IBM drops on fears AI adoption disrupts its traditional enterprise business'),
  ('Feb 19', 'Agentic AI shift fuels sell first, ask later panic across tech sector'),
  ('Feb 17', 'White-collar roles in coding, marketing & support eroding faster than expected');
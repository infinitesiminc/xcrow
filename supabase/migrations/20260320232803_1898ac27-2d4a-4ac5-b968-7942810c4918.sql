
-- Skills taxonomy table (replaces hardcoded SKILL_TAXONOMY)
CREATE TABLE public.skills (
  id text PRIMARY KEY,
  name text NOT NULL,
  category text NOT NULL,
  keywords text[] NOT NULL DEFAULT '{}',
  ai_exposure integer NOT NULL DEFAULT 50,
  human_edge text,
  unlock_type text NOT NULL DEFAULT 'default',
  unlock_requirement jsonb DEFAULT NULL,
  is_default boolean NOT NULL DEFAULT true,
  description text,
  icon_emoji text,
  rarity text NOT NULL DEFAULT 'common',
  drop_expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- User skill unlocks (tracks which skills each user has access to)
CREATE TABLE public.user_skill_unlocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  skill_id text NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  unlock_method text NOT NULL DEFAULT 'default',
  UNIQUE (user_id, skill_id)
);

-- Enable RLS
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_skill_unlocks ENABLE ROW LEVEL SECURITY;

-- Skills: public read, service role can manage
CREATE POLICY "Anyone can read skills" ON public.skills FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Service role can manage skills" ON public.skills FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Superadmins can manage skills" ON public.skills FOR ALL TO authenticated USING (public.is_superadmin(auth.uid())) WITH CHECK (public.is_superadmin(auth.uid()));

-- User skill unlocks: users own their unlocks
CREATE POLICY "Users can read own unlocks" ON public.user_skill_unlocks FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own unlocks" ON public.user_skill_unlocks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Service role can manage unlocks" ON public.user_skill_unlocks FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Enable realtime for skills so drops appear live
ALTER PUBLICATION supabase_realtime ADD TABLE public.skills;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_skill_unlocks;

-- Seed the 31 default skills
INSERT INTO public.skills (id, name, category, keywords, ai_exposure, human_edge, unlock_type, is_default, rarity) VALUES
('code-dev', 'Software Dev', 'technical', ARRAY['code','development','engineering','component','pipeline','deploy','api','software','build','feature','frontend','backend','module'], 72, 'System thinking', 'default', true, 'common'),
('system-design', 'System Architecture', 'technical', ARRAY['architecture','system design','platform','infrastructure','migration','scalab','distributed','microservice'], 35, 'Trade-off reasoning', 'default', true, 'common'),
('testing-qa', 'Testing & QA', 'technical', ARRAY['test','qa','regression','bug','quality','validation','code review'], 78, 'Edge-case intuition', 'default', true, 'common'),
('security', 'Cybersecurity', 'technical', ARRAY['security','threat','vulnerability','cybersecurity','encryption','access control'], 55, 'Adversarial thinking', 'default', true, 'common'),
('data-engineering', 'Data Engineering', 'technical', ARRAY['data pipeline','warehouse','etl','data quality','schema','database','data model'], 68, 'Data governance', 'default', true, 'common'),
('ai-ml', 'AI & ML', 'technical', ARRAY['model','training','ml',' ai ','machine learning','prediction','deep learning','nlp','simulation'], 60, 'Problem framing', 'default', true, 'common'),
('devops', 'DevOps & Cloud', 'technical', ARRAY['devops','container','monitoring','incident','deployment','kubernetes','cloud','terraform'], 65, 'Incident judgment', 'default', true, 'common'),
('prompt-eng', 'Prompt Engineering', 'technical', ARRAY['prompt','llm','generative ai','chatgpt','copilot','prompt engineering'], 85, 'Intent clarity', 'default', true, 'common'),
('data-analysis', 'Data Analysis', 'analytical', ARRAY['analysis','analytics','data','metrics','dashboard','reporting','insight','kpi','visualization'], 80, 'Asking the right questions', 'default', true, 'common'),
('financial-modeling', 'Financial Modeling', 'analytical', ARRAY['financial model','valuation','forecast','budget','revenue','pricing','accounting','tax','invoice'], 70, 'Assumption judgment', 'default', true, 'common'),
('research', 'Research & Discovery', 'analytical', ARRAY['research','audit','review','hypothesis','market research','competitive','survey','user research'], 75, 'Novel hypotheses', 'default', true, 'common'),
('process-optimization', 'Process Optimization', 'analytical', ARRAY['process','optimization','workflow','automation','efficiency','funnel','streamline','logistics'], 60, 'Change management', 'default', true, 'common'),
('risk-assessment', 'Risk Assessment', 'analytical', ARRAY['risk','mitigation','scenario analysis','compliance','safety','crisis','governance'], 50, 'Judgment under uncertainty', 'default', true, 'common'),
('critical-thinking', 'Critical Thinking', 'analytical', ARRAY['critical thinking','problem solving','reasoning','logic','evaluation','decision making'], 30, 'Structured reasoning', 'default', true, 'common'),
('stakeholder-mgmt', 'Stakeholder Mgmt', 'communication', ARRAY['stakeholder','client','customer','relationship','cross-functional','collaboration','consulting'], 15, 'Trust building', 'default', true, 'common'),
('writing-docs', 'Writing & Docs', 'communication', ARRAY['documentation','writing','copy','content','email','knowledge base','communication','specification'], 82, 'Voice & persuasion', 'default', true, 'common'),
('presentation', 'Presentation', 'communication', ARRAY['presentation','reporting','pitch','deck','storytelling','proposal','board','public speaking'], 65, 'Executive presence', 'default', true, 'common'),
('negotiation', 'Negotiation', 'communication', ARRAY['negotiation','deal','closing','persuasion','contract negotiation'], 10, 'Empathy & leverage', 'default', true, 'common'),
('sales', 'Sales & Biz Dev', 'communication', ARRAY['sales','revenue','prospect','lead','pipeline','account','demo','customer acquisition','consultative selling'], 30, 'Relationship building', 'default', true, 'common'),
('project-mgmt', 'Project Mgmt', 'leadership', ARRAY['project','sprint','planning','coordination','launch','milestone','agile','roadmap','program'], 40, 'Priority judgment', 'default', true, 'common'),
('strategy', 'Strategy & Planning', 'leadership', ARRAY['strategy','roadmap','positioning','go-to-market','planning','vision','growth','expansion','strategic thinking','strategic planning'], 25, 'Competitive intuition', 'default', true, 'common'),
('team-mgmt', 'Team Leadership', 'leadership', ARRAY['team','coaching','talent','hiring','people','leadership','management','mentoring','training','mentorship'], 12, 'Empathy & culture', 'default', true, 'common'),
('vendor-mgmt', 'Vendor & Supply Chain', 'leadership', ARRAY['vendor','supplier','procurement','supply chain','inventory','sourcing'], 45, 'Relationship leverage', 'default', true, 'common'),
('change-mgmt', 'Change Management', 'leadership', ARRAY['change management','transformation','adoption','stakeholder alignment','organizational change'], 20, 'Organizational empathy', 'default', true, 'common'),
('design-ux', 'Design & UX', 'creative', ARRAY['design','ux','wireframe','prototype','usability','ui','user experience','figma'], 55, 'Empathy-driven design', 'default', true, 'common'),
('brand-creative', 'Brand & Creative', 'creative', ARRAY['brand','creative','identity','campaign','concept','influencer','community'], 50, 'Cultural resonance', 'default', true, 'common'),
('content-seo', 'Content & SEO', 'creative', ARRAY['seo','content','blog','social media','organic','editorial','content strategy'], 78, 'Audience intuition', 'default', true, 'common'),
('product-sense', 'Product Sense', 'creative', ARRAY['product strategy','product sense','product knowledge','feature prioritization','user needs','product vision'], 30, 'User empathy', 'default', true, 'common'),
('regulatory', 'Regulatory & Legal', 'compliance', ARRAY['regulatory','compliance','legal','policy','patent','contract','litigation','governance','privacy'], 45, 'Jurisdictional judgment', 'default', true, 'common'),
('audit-control', 'Audit & Controls', 'compliance', ARRAY['audit','reconciliation','month-end','internal control','assurance','financial statement'], 70, 'Materiality judgment', 'default', true, 'common'),
('emotional-iq', 'Emotional Intelligence', 'leadership', ARRAY['emotional intelligence','empathy','self-awareness','conflict resolution','interpersonal','active listening'], 8, 'Human connection', 'default', true, 'common');

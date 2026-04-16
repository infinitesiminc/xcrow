-- user_network: relationship graph per workspace
CREATE TABLE public.user_network (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  workspace_key text NOT NULL DEFAULT 'default',
  category text NOT NULL CHECK (category IN ('customer','investor','partner','team')),
  name text NOT NULL,
  company text,
  notes text,
  source text NOT NULL DEFAULT 'manual' CHECK (source IN ('manual','auto_discovered')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_network_user_workspace ON public.user_network(user_id, workspace_key);

ALTER TABLE public.user_network ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own network" ON public.user_network FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own network" ON public.user_network FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own network" ON public.user_network FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own network" ON public.user_network FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_user_network_updated_at BEFORE UPDATE ON public.user_network FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- warm_paths: cache of generated intro paths
CREATE TABLE public.warm_paths (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  lead_id uuid NOT NULL,
  workspace_key text NOT NULL DEFAULT 'default',
  paths jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, lead_id)
);

CREATE INDEX idx_warm_paths_lead ON public.warm_paths(lead_id);

ALTER TABLE public.warm_paths ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own warm paths" ON public.warm_paths FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own warm paths" ON public.warm_paths FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own warm paths" ON public.warm_paths FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- workspace_settings: per-workspace toggles (auto-discover network)
CREATE TABLE public.workspace_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  workspace_key text NOT NULL DEFAULT 'default',
  auto_discover_network boolean NOT NULL DEFAULT false,
  last_discovered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, workspace_key)
);

ALTER TABLE public.workspace_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own workspace settings" ON public.workspace_settings FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own workspace settings" ON public.workspace_settings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own workspace settings" ON public.workspace_settings FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_workspace_settings_updated_at BEFORE UPDATE ON public.workspace_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
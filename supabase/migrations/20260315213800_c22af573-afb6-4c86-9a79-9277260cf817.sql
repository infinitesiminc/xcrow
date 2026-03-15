
-- Company workspaces created by HR admins
CREATE TABLE public.company_workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  join_code text UNIQUE NOT NULL,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.company_workspaces ENABLE ROW LEVEL SECURITY;

-- Members of a workspace
CREATE TABLE public.workspace_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.company_workspaces(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member',
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, user_id)
);

ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

-- RLS: Workspace creators can manage their workspaces
CREATE POLICY "Creators can read own workspaces"
  ON public.company_workspaces FOR SELECT TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Creators can insert workspaces"
  ON public.company_workspaces FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Creators can update own workspaces"
  ON public.company_workspaces FOR UPDATE TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Creators can delete own workspaces"
  ON public.company_workspaces FOR DELETE TO authenticated
  USING (created_by = auth.uid());

-- Members in workspaces they belong to can read workspace info
CREATE POLICY "Members can read their workspace"
  ON public.company_workspaces FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.workspace_members wm
    WHERE wm.workspace_id = id AND wm.user_id = auth.uid()
  ));

-- Anyone can look up a workspace by join code (for joining)
CREATE POLICY "Anyone can lookup by join code"
  ON public.company_workspaces FOR SELECT TO authenticated
  USING (true);

-- RLS: workspace_members
-- Admins can see all members of their workspaces
CREATE POLICY "Workspace admins can read members"
  ON public.workspace_members FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.workspace_members admin_check
    WHERE admin_check.workspace_id = workspace_id
    AND admin_check.user_id = auth.uid()
    AND admin_check.role = 'admin'
  ));

-- Members can read their own membership
CREATE POLICY "Members can read own membership"
  ON public.workspace_members FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Authenticated users can join (insert themselves)
CREATE POLICY "Users can join workspaces"
  ON public.workspace_members FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Admins can remove members
CREATE POLICY "Admins can delete members"
  ON public.workspace_members FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.workspace_members admin_check
    WHERE admin_check.workspace_id = workspace_id
    AND admin_check.user_id = auth.uid()
    AND admin_check.role = 'admin'
  ));

-- Members can leave (delete own)
CREATE POLICY "Members can leave"
  ON public.workspace_members FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Security definer function to look up completed_simulations for workspace members
CREATE OR REPLACE FUNCTION public.get_workspace_progress(p_workspace_id uuid)
RETURNS TABLE(
  user_id uuid,
  display_name text,
  job_title text,
  task_name text,
  sim_job_title text,
  correct_answers int,
  total_questions int,
  completed_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    cs.user_id,
    p.display_name,
    p.job_title,
    cs.task_name,
    cs.job_title as sim_job_title,
    cs.correct_answers,
    cs.total_questions,
    cs.completed_at
  FROM public.workspace_members wm
  JOIN public.completed_simulations cs ON cs.user_id = wm.user_id
  JOIN public.profiles p ON p.id = wm.user_id
  WHERE wm.workspace_id = p_workspace_id
  AND EXISTS (
    SELECT 1 FROM public.workspace_members admin_check
    WHERE admin_check.workspace_id = p_workspace_id
    AND admin_check.user_id = auth.uid()
    AND admin_check.role = 'admin'
  )
$$;

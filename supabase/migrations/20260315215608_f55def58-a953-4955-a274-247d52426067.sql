-- Prevent recursive RLS checks by moving workspace lookups into SECURITY DEFINER helpers
CREATE OR REPLACE FUNCTION public.is_workspace_member(_workspace_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.workspace_members wm
    WHERE wm.workspace_id = _workspace_id
      AND wm.user_id = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_workspace_admin(_workspace_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.workspace_members wm
    WHERE wm.workspace_id = _workspace_id
      AND wm.user_id = _user_id
      AND wm.role = 'admin'
  );
$$;

-- Replace recursive SELECT policy on workspace_members
DROP POLICY IF EXISTS "Members can read workspace members" ON public.workspace_members;
CREATE POLICY "Members can read workspace members"
ON public.workspace_members
FOR SELECT
TO authenticated
USING (public.is_workspace_member(workspace_id, auth.uid()));

-- Replace admin delete policy with non-recursive helper
DROP POLICY IF EXISTS "Admins can delete members" ON public.workspace_members;
CREATE POLICY "Admins can delete members"
ON public.workspace_members
FOR DELETE
TO authenticated
USING (public.is_workspace_admin(workspace_id, auth.uid()));

-- Fix workspace read policy for members
DROP POLICY IF EXISTS "Members can read their workspace" ON public.company_workspaces;
CREATE POLICY "Members can read their workspace"
ON public.company_workspaces
FOR SELECT
TO authenticated
USING (
  created_by = auth.uid()
  OR public.is_workspace_member(id, auth.uid())
);
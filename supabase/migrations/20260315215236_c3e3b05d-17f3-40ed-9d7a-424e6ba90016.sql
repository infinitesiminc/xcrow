
-- Drop the circular admin-check policy
DROP POLICY IF EXISTS "Workspace admins can read members" ON public.workspace_members;

-- Allow members to read all members in their own workspace
CREATE POLICY "Members can read workspace members"
  ON public.workspace_members FOR SELECT TO authenticated
  USING (
    workspace_id IN (
      SELECT wm.workspace_id FROM public.workspace_members wm WHERE wm.user_id = auth.uid()
    )
  );

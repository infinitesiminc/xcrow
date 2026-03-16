
-- Add workspace_id to companies table
ALTER TABLE public.companies 
  ADD COLUMN workspace_id uuid REFERENCES public.company_workspaces(id) ON DELETE SET NULL;

-- Add workspace_id to jobs table  
ALTER TABLE public.jobs
  ADD COLUMN workspace_id uuid REFERENCES public.company_workspaces(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX idx_companies_workspace_id ON public.companies(workspace_id);
CREATE INDEX idx_jobs_workspace_id ON public.jobs(workspace_id);

-- RLS: workspace members can read their workspace's companies
CREATE POLICY "Workspace members can read workspace companies"
ON public.companies
FOR SELECT
TO authenticated
USING (
  workspace_id IS NOT NULL 
  AND is_workspace_member(workspace_id, auth.uid())
);

-- RLS: workspace members can read their workspace's jobs
CREATE POLICY "Workspace members can read workspace jobs"
ON public.jobs
FOR SELECT
TO authenticated
USING (
  workspace_id IS NOT NULL 
  AND is_workspace_member(workspace_id, auth.uid())
);

-- Allow authenticated users to insert companies (for workspace-scoped imports)
CREATE POLICY "Authenticated users can insert companies"
ON public.companies
FOR INSERT
TO authenticated
WITH CHECK (
  workspace_id IS NOT NULL
  AND is_workspace_member(workspace_id, auth.uid())
);

-- Allow authenticated users to update their workspace companies
CREATE POLICY "Workspace members can update workspace companies"
ON public.companies
FOR UPDATE
TO authenticated
USING (
  workspace_id IS NOT NULL
  AND is_workspace_member(workspace_id, auth.uid())
);

-- Allow authenticated users to insert jobs for their workspace
CREATE POLICY "Authenticated users can insert jobs"
ON public.jobs
FOR INSERT
TO authenticated
WITH CHECK (
  workspace_id IS NOT NULL
  AND is_workspace_member(workspace_id, auth.uid())
);

-- Allow authenticated users to update their workspace jobs
CREATE POLICY "Workspace members can update workspace jobs"
ON public.jobs
FOR UPDATE
TO authenticated
USING (
  workspace_id IS NOT NULL
  AND is_workspace_member(workspace_id, auth.uid())
);

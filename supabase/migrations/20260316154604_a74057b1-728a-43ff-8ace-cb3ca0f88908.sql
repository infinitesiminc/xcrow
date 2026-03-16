
-- Create superadmin check function
CREATE OR REPLACE FUNCTION public.is_superadmin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT _user_id IN (
    '7be41055-be68-4cab-b63c-f3b0c483e6eb'::uuid,
    'bb10735b-051e-4bb5-918e-931a9c79d0fd'::uuid
  );
$$;

-- Update get_workspace_progress to allow superadmins
CREATE OR REPLACE FUNCTION public.get_workspace_progress(p_workspace_id uuid)
RETURNS TABLE(
  user_id uuid, display_name text, job_title text, task_name text,
  sim_job_title text, correct_answers integer, total_questions integer,
  completed_at timestamp with time zone, department text,
  tool_awareness_score integer, human_value_add_score integer,
  adaptive_thinking_score integer, domain_judgment_score integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    cs.user_id, p.display_name, p.job_title, cs.task_name,
    cs.job_title as sim_job_title, cs.correct_answers, cs.total_questions,
    cs.completed_at, cs.department,
    cs.tool_awareness_score, cs.human_value_add_score,
    cs.adaptive_thinking_score, cs.domain_judgment_score
  FROM public.workspace_members wm
  JOIN public.completed_simulations cs ON cs.user_id = wm.user_id
  JOIN public.profiles p ON p.id = wm.user_id
  WHERE wm.workspace_id = p_workspace_id
  AND (
    public.is_superadmin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.workspace_members admin_check
      WHERE admin_check.workspace_id = p_workspace_id
      AND admin_check.user_id = auth.uid()
      AND admin_check.role = 'admin'
    )
  )
$$;

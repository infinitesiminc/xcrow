
DROP FUNCTION IF EXISTS public.get_workspace_progress(uuid);

CREATE FUNCTION public.get_workspace_progress(p_workspace_id uuid)
 RETURNS TABLE(
   user_id uuid,
   display_name text,
   job_title text,
   task_name text,
   sim_job_title text,
   correct_answers integer,
   total_questions integer,
   completed_at timestamp with time zone,
   department text,
   tool_awareness_score integer,
   human_value_add_score integer,
   adaptive_thinking_score integer,
   domain_judgment_score integer
 )
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    cs.user_id,
    p.display_name,
    p.job_title,
    cs.task_name,
    cs.job_title as sim_job_title,
    cs.correct_answers,
    cs.total_questions,
    cs.completed_at,
    cs.department,
    cs.tool_awareness_score,
    cs.human_value_add_score,
    cs.adaptive_thinking_score,
    cs.domain_judgment_score
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
$function$;

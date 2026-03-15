-- Adaptive simulation queue table
CREATE TABLE public.simulation_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  job_title text NOT NULL,
  task_name text NOT NULL,
  department text,
  weak_category text NOT NULL,
  weak_score integer NOT NULL,
  threshold integer NOT NULL DEFAULT 60,
  attempt_number integer NOT NULL DEFAULT 1,
  max_attempts integer NOT NULL DEFAULT 3,
  status text NOT NULL DEFAULT 'pending',
  source_simulation_id uuid,
  coaching_tip text,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

-- RLS
ALTER TABLE public.simulation_queue ENABLE ROW LEVEL SECURITY;

-- Users can read their own queue
CREATE POLICY "Users can read own queue"
  ON public.simulation_queue FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can update own queue entries (mark completed)
CREATE POLICY "Users can update own queue"
  ON public.simulation_queue FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Service role / triggers can insert
CREATE POLICY "Service can insert queue"
  ON public.simulation_queue FOR INSERT
  TO public
  WITH CHECK (true);

-- Workspace admins can read their members' queues
CREATE POLICY "Admins can read workspace queue"
  ON public.simulation_queue FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.user_id = simulation_queue.user_id
      AND public.is_workspace_admin(wm.workspace_id, auth.uid())
    )
  );

-- Coaching tips per category
CREATE OR REPLACE FUNCTION get_coaching_tip(category text, score integer)
RETURNS text
LANGUAGE sql IMMUTABLE
AS $$
  SELECT CASE category
    WHEN 'tool_awareness' THEN
      CASE WHEN score < 30 THEN 'Focus on understanding which AI tools exist for your domain and when to use them vs. manual approaches.'
           WHEN score < 50 THEN 'You know the basics — now practice identifying the right AI tool for specific task variations.'
           ELSE 'Almost there! Sharpen your ability to evaluate AI tool limitations and failure modes.'
      END
    WHEN 'human_value_add' THEN
      CASE WHEN score < 30 THEN 'Practice identifying what humans uniquely contribute: judgment, ethics, stakeholder empathy, and creative problem-framing.'
           WHEN score < 50 THEN 'You see the human role — now work on articulating WHY human oversight matters in specific scenarios.'
           ELSE 'Strong foundation! Focus on edge cases where human intervention is critical but non-obvious.'
      END
    WHEN 'adaptive_thinking' THEN
      CASE WHEN score < 30 THEN 'Start by practicing how to pivot your approach when AI outputs are unexpected or wrong.'
           WHEN score < 50 THEN 'Good instincts — now practice combining AI suggestions with your domain knowledge to create better outcomes.'
           ELSE 'Nearly expert! Work on rapid adaptation strategies for novel AI-disrupted scenarios.'
      END
    WHEN 'domain_judgment' THEN
      CASE WHEN score < 30 THEN 'Focus on understanding your domain deeply enough to evaluate whether AI recommendations make sense.'
           WHEN score < 50 THEN 'Solid domain knowledge — practice applying it to validate AI-generated outputs in tricky scenarios.'
           ELSE 'Strong judgment! Focus on communicating your domain expertise to shape AI tool adoption decisions.'
      END
    ELSE 'Continue practicing to improve your AI readiness in this area.'
  END
$$;

-- Trigger function: auto-queue retries for scores below threshold
CREATE OR REPLACE FUNCTION auto_queue_adaptive_sim()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _threshold integer := 60;
  _categories text[] := ARRAY['tool_awareness', 'human_value_add', 'adaptive_thinking', 'domain_judgment'];
  _scores integer[];
  _cat text;
  _score integer;
  _existing_attempts integer;
BEGIN
  _scores := ARRAY[
    COALESCE(NEW.tool_awareness_score, 100),
    COALESCE(NEW.human_value_add_score, 100),
    COALESCE(NEW.adaptive_thinking_score, 100),
    COALESCE(NEW.domain_judgment_score, 100)
  ];

  FOR i IN 1..4 LOOP
    _cat := _categories[i];
    _score := _scores[i];

    IF _score < _threshold THEN
      -- Count existing attempts for this user+task+category
      SELECT COALESCE(MAX(attempt_number), 0)
      INTO _existing_attempts
      FROM public.simulation_queue
      WHERE user_id = NEW.user_id
        AND task_name = NEW.task_name
        AND weak_category = _cat;

      -- Only queue if under max attempts (3)
      IF _existing_attempts < 3 THEN
        INSERT INTO public.simulation_queue (
          user_id, job_title, task_name, department,
          weak_category, weak_score, threshold,
          attempt_number, source_simulation_id, coaching_tip
        ) VALUES (
          NEW.user_id, NEW.job_title, NEW.task_name, NEW.department,
          _cat, _score, _threshold,
          _existing_attempts + 1, NEW.id,
          get_coaching_tip(_cat, _score)
        );
      ELSE
        -- Max attempts reached — mark as escalated if not already
        UPDATE public.simulation_queue
        SET status = 'escalated'
        WHERE user_id = NEW.user_id
          AND task_name = NEW.task_name
          AND weak_category = _cat
          AND status = 'pending';
      END IF;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

-- Attach trigger to completed_simulations
CREATE TRIGGER trg_auto_queue_adaptive_sim
  AFTER INSERT ON public.completed_simulations
  FOR EACH ROW
  EXECUTE FUNCTION auto_queue_adaptive_sim();

-- Enable realtime for simulation_queue
ALTER PUBLICATION supabase_realtime ADD TABLE public.simulation_queue;

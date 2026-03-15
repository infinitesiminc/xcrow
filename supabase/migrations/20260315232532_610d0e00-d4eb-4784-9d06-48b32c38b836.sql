-- Fix overly permissive insert policy - restrict to trigger/service role
DROP POLICY "Service can insert queue" ON public.simulation_queue;

CREATE POLICY "Trigger and service can insert queue"
  ON public.simulation_queue FOR INSERT
  TO public
  WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');

-- Fix search_path on new functions
ALTER FUNCTION get_coaching_tip(text, integer) SET search_path = 'public';

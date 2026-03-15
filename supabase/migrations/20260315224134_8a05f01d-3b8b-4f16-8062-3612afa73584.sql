ALTER TABLE public.completed_simulations 
  ADD COLUMN IF NOT EXISTS tool_awareness_score integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS human_value_add_score integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS adaptive_thinking_score integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS domain_judgment_score integer DEFAULT NULL;
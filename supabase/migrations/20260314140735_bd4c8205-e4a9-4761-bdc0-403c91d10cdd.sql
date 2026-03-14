ALTER TABLE public.completed_simulations
ADD COLUMN correct_answers integer NOT NULL DEFAULT 0,
ADD COLUMN total_questions integer NOT NULL DEFAULT 0,
ADD COLUMN experience_level text DEFAULT 'exploring';
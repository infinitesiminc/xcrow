ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS country text;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS work_mode text;
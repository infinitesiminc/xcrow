ALTER TABLE public.competition_registrations ADD COLUMN job_title text;
ALTER TABLE public.competition_registrations ADD COLUMN student_count integer;
ALTER TABLE public.competition_registrations DROP COLUMN graduation_year;
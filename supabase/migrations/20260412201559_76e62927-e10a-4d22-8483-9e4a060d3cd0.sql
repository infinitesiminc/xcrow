
-- 1. Drop the trigger that crashes signup
DROP TRIGGER IF EXISTS trg_auto_provision_school_seat ON public.profiles;

-- 2. Drop RLS policies that reference is_school_admin
DROP POLICY IF EXISTS "School admins can manage seats" ON public.school_seats;
DROP POLICY IF EXISTS "School admins can read own curricula" ON public.school_curricula;
DROP POLICY IF EXISTS "School admins can read own courses" ON public.school_courses;

-- 3. Drop all remaining policies on these tables
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('school_seats','school_courses','school_curricula')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END$$;

-- 4. Drop the tables
DROP TABLE IF EXISTS public.school_courses CASCADE;
DROP TABLE IF EXISTS public.school_curricula CASCADE;
DROP TABLE IF EXISTS public.school_seats CASCADE;

-- 5. Drop orphaned school functions
DROP FUNCTION IF EXISTS public.auto_provision_school_seat();
DROP FUNCTION IF EXISTS public.has_school_seat(uuid);
DROP FUNCTION IF EXISTS public.is_school_admin(uuid, uuid);
DROP FUNCTION IF EXISTS public.update_school_used_seats();
DROP FUNCTION IF EXISTS public.get_school_analytics(uuid);
DROP FUNCTION IF EXISTS public.get_school_students(uuid);
DROP FUNCTION IF EXISTS public.get_school_dashboard_stats();

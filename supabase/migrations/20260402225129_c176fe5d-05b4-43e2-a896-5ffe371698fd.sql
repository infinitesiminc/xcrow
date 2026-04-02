
-- Drop workspace-related RLS policies on companies first
DROP POLICY IF EXISTS "Workspace members can read workspace companies" ON public.companies;
DROP POLICY IF EXISTS "Authenticated users can insert companies" ON public.companies;
DROP POLICY IF EXISTS "Workspace members can update workspace companies" ON public.companies;

-- Now safely drop workspace_id and is_demo columns
ALTER TABLE public.companies DROP COLUMN IF EXISTS workspace_id;
ALTER TABLE public.companies DROP COLUMN IF EXISTS is_demo;

-- Drop all legacy tables
DROP TABLE IF EXISTS public.disrupt_votes CASCADE;
DROP TABLE IF EXISTS public.disrupt_team_members CASCADE;
DROP TABLE IF EXISTS public.disrupt_teams CASCADE;
DROP TABLE IF EXISTS public.disrupt_rooms CASCADE;
DROP TABLE IF EXISTS public.company_vertical_map CASCADE;
DROP TABLE IF EXISTS public.import_flags CASCADE;
DROP TABLE IF EXISTS public.import_log CASCADE;
DROP TABLE IF EXISTS public.job_future_skills CASCADE;
DROP TABLE IF EXISTS public.job_skills CASCADE;
DROP TABLE IF EXISTS public.job_task_clusters CASCADE;
DROP TABLE IF EXISTS public.scenarios CASCADE;
DROP TABLE IF EXISTS public.jobs CASCADE;
DROP TABLE IF EXISTS public.company_workspaces CASCADE;
DROP TABLE IF EXISTS public.employer_sponsorships CASCADE;
DROP TABLE IF EXISTS public.school_admins CASCADE;
DROP TABLE IF EXISTS public.school_accounts CASCADE;
DROP TABLE IF EXISTS public.school_course_items CASCADE;
DROP TABLE IF EXISTS public.canonical_future_skills CASCADE;
DROP TABLE IF EXISTS public.cached_analyses CASCADE;
DROP TABLE IF EXISTS public.analysis_history CASCADE;
DROP TABLE IF EXISTS public.bookmarked_roles CASCADE;
DROP TABLE IF EXISTS public.competition_registrations CASCADE;
DROP TABLE IF EXISTS public.completed_simulations CASCADE;
DROP TABLE IF EXISTS public.custom_simulations CASCADE;
DROP TABLE IF EXISTS public.friend_messages CASCADE;
DROP TABLE IF EXISTS public.friendships CASCADE;
DROP TABLE IF EXISTS public.prompt_attempts CASCADE;
DROP TABLE IF EXISTS public.referrals CASCADE;

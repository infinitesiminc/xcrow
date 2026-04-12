DROP FUNCTION IF EXISTS public.auto_befriend_bot() CASCADE;
DROP FUNCTION IF EXISTS public.check_friendship_rate_limit() CASCADE;
DROP FUNCTION IF EXISTS public.check_message_rate_limit() CASCADE;
DROP FUNCTION IF EXISTS public.get_friends_last_sims(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_friend_activity(uuid, integer) CASCADE;
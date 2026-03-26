
-- Rate-limit friend requests: max 20 per hour per user
CREATE OR REPLACE FUNCTION public.check_friendship_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  recent_count integer;
BEGIN
  SELECT COUNT(*) INTO recent_count
  FROM public.friendships
  WHERE requester_id = NEW.requester_id
    AND created_at > now() - interval '1 hour';
  
  IF recent_count >= 20 THEN
    RAISE EXCEPTION 'Rate limit exceeded: too many friend requests. Try again later.';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_friendship_rate_limit
  BEFORE INSERT ON public.friendships
  FOR EACH ROW
  EXECUTE FUNCTION public.check_friendship_rate_limit();

-- Rate-limit DMs: max 60 per hour per sender
CREATE OR REPLACE FUNCTION public.check_message_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  recent_count integer;
BEGIN
  SELECT COUNT(*) INTO recent_count
  FROM public.friend_messages
  WHERE sender_id = NEW.sender_id
    AND created_at > now() - interval '1 hour';
  
  IF recent_count >= 60 THEN
    RAISE EXCEPTION 'Rate limit exceeded: too many messages. Try again later.';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_message_rate_limit
  BEFORE INSERT ON public.friend_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.check_message_rate_limit();

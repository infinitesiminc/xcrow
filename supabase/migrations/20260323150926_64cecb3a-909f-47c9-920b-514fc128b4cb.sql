
-- Trigger function: auto-send friend request from bot to every new profile
-- The bot user ID will be stored in platform_config
CREATE OR REPLACE FUNCTION public.auto_befriend_bot()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _bot_id uuid;
BEGIN
  -- Get bot user ID from config
  SELECT value::uuid INTO _bot_id
  FROM public.platform_config
  WHERE key = 'bot_user_id';
  
  IF _bot_id IS NULL THEN RETURN NEW; END IF;
  IF NEW.id = _bot_id THEN RETURN NEW; END IF;
  
  -- Check no existing friendship
  IF NOT EXISTS (
    SELECT 1 FROM public.friendships
    WHERE (requester_id = _bot_id AND recipient_id = NEW.id)
       OR (requester_id = NEW.id AND recipient_id = _bot_id)
  ) THEN
    INSERT INTO public.friendships (requester_id, recipient_id, status)
    VALUES (_bot_id, NEW.id, 'accepted');
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_befriend_bot ON public.profiles;
CREATE TRIGGER trg_auto_befriend_bot
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_befriend_bot();

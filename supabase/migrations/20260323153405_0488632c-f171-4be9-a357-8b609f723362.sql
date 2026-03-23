
-- Update auto_befriend_bot to also send welcome DMs from the bot
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
    
    -- Send welcome message from bot
    INSERT INTO public.friend_messages (sender_id, recipient_id, content)
    VALUES (_bot_id, NEW.id, '⚔️ Welcome to Xcrow, adventurer! I''m your training partner. Head to the Allies tab to see what quests I''m running — try to beat my score or send me a challenge!');
    
    -- Send challenge message after a moment
    INSERT INTO public.friend_messages (sender_id, recipient_id, content, created_at)
    VALUES (_bot_id, NEW.id, '🗡️ I just finished a quest — check my profile to see it, then hit "Try" to take it on yourself. Let''s see who scores higher!', now() + interval '2 seconds');
  END IF;
  
  RETURN NEW;
END;
$$;

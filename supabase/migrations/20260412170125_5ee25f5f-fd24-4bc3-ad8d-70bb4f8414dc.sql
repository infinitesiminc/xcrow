-- Add tone column
ALTER TABLE public.draft_emails ADD COLUMN IF NOT EXISTS tone text NOT NULL DEFAULT 'intro';

-- Drop old unique constraint (find and drop it)
DO $$
DECLARE
  _con text;
BEGIN
  SELECT conname INTO _con
  FROM pg_constraint
  WHERE conrelid = 'public.draft_emails'::regclass
    AND contype = 'u'
    AND array_length(conkey, 1) = 2;
  IF _con IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.draft_emails DROP CONSTRAINT %I', _con);
  END IF;
END$$;

-- Add new unique constraint
ALTER TABLE public.draft_emails ADD CONSTRAINT draft_emails_user_lead_tone_unique UNIQUE (user_id, lead_id, tone);
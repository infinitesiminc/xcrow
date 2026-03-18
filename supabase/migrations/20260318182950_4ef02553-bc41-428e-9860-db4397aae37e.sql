CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data ->> 'full_name',
      NEW.raw_user_meta_data ->> 'name',
      NEW.raw_user_meta_data ->> 'display_name',
      NEW.email
    )
  );
  RETURN NEW;
END;
$function$;

UPDATE public.profiles p
SET display_name = COALESCE(
  u.raw_user_meta_data ->> 'full_name',
  u.raw_user_meta_data ->> 'name',
  p.display_name
)
FROM auth.users u
WHERE p.id = u.id
AND (p.display_name = u.email OR p.display_name IS NULL)
AND (u.raw_user_meta_data ->> 'full_name' IS NOT NULL OR u.raw_user_meta_data ->> 'name' IS NOT NULL);
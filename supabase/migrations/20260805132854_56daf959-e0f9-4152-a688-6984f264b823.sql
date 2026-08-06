CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  claim_owner boolean := lower(NEW.email) IN ('francisizegbune@gmail.com','izegbunehillary7@gmail.com')
                         AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE is_owner);
BEGIN
  INSERT INTO public.profiles (id, full_name, email, is_owner)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name', NEW.email, claim_owner)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'customer')
  ON CONFLICT (user_id, role) DO NOTHING;

  IF claim_owner THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;
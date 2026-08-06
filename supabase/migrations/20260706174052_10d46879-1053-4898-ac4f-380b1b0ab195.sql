-- Storage RLS: staff can manage objects in the private "media" bucket.
-- Public reads are served through a service-role proxy route, so no anon read policy.
CREATE POLICY "Staff read media" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'media' AND private.is_staff(auth.uid()));
CREATE POLICY "Staff upload media" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'media' AND private.is_staff(auth.uid()));
CREATE POLICY "Staff update media" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'media' AND private.is_staff(auth.uid()))
  WITH CHECK (bucket_id = 'media' AND private.is_staff(auth.uid()));
CREATE POLICY "Staff delete media" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'media' AND private.is_staff(auth.uid()));

-- Auto-grant the admin role to the business owner's email addresses on signup.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name', NEW.email)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'customer')
  ON CONFLICT (user_id, role) DO NOTHING;

  IF lower(NEW.email) IN ('francisizegbune@gmail.com','izegbunehillary7@gmail.com') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;

-- Promote the owner if the account already exists.
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role FROM auth.users
WHERE lower(email) IN ('francisizegbune@gmail.com','izegbunehillary7@gmail.com')
ON CONFLICT (user_id, role) DO NOTHING;
-- 1. Profile status + owner flag
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS is_owner boolean NOT NULL DEFAULT false;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_account_status_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_account_status_check
  CHECK (account_status IN ('active','disabled','pending'));

CREATE UNIQUE INDEX IF NOT EXISTS profiles_single_owner_idx
  ON public.profiles (is_owner) WHERE is_owner;

-- 2. Helper functions (owner-aware, status-aware)
CREATE OR REPLACE FUNCTION private.is_owner(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = _user_id AND is_owner);
$$;

CREATE OR REPLACE FUNCTION private.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.profiles p ON p.id = ur.user_id
    WHERE ur.user_id = _user_id
      AND ur.role IN ('admin','staff')
      AND p.account_status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.profiles p ON p.id = ur.user_id
    WHERE ur.user_id = _user_id
      AND ur.role = _role
      AND p.account_status = 'active'
  );
$$;

-- 3. Only the owner may grant/revoke privileged roles; owner rows are immutable
CREATE OR REPLACE FUNCTION public.guard_user_roles()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  caller uuid := auth.uid();
  target uuid := COALESCE(NEW.user_id, OLD.user_id);
  target_role app_role := COALESCE(NEW.role, OLD.role);
BEGIN
  -- service_role / database jobs (no auth context) bypass these checks
  IF caller IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = target AND is_owner)
     AND NOT private.is_owner(caller) THEN
    RAISE EXCEPTION 'The owner account cannot be modified.';
  END IF;

  IF target_role IN ('admin','staff') AND NOT private.is_owner(caller) THEN
    RAISE EXCEPTION 'Only the owner can grant or remove administrator access.';
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS guard_user_roles_trg ON public.user_roles;
CREATE TRIGGER guard_user_roles_trg
  BEFORE INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.guard_user_roles();

-- 4. Nobody can self-promote to owner or edit the owner's profile
CREATE OR REPLACE FUNCTION public.guard_profiles()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  caller uuid := auth.uid();
BEGIN
  IF caller IS NULL THEN
    RETURN NEW;
  END IF;

  IF OLD.is_owner AND caller <> OLD.id THEN
    RAISE EXCEPTION 'The owner account cannot be modified.';
  END IF;

  IF NEW.is_owner IS DISTINCT FROM OLD.is_owner AND NOT private.is_owner(caller) THEN
    RAISE EXCEPTION 'Ownership cannot be changed.';
  END IF;

  IF NEW.account_status IS DISTINCT FROM OLD.account_status
     AND NOT private.is_owner(caller) THEN
    RAISE EXCEPTION 'Only the owner can change account status.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_profiles_trg ON public.profiles;
CREATE TRIGGER guard_profiles_trg
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_profiles();

-- 5. Signups are always plain customers; the owner is seeded by email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  is_owner_email boolean := lower(NEW.email) = 'francisizegbune@gmail.com';
BEGIN
  INSERT INTO public.profiles (id, full_name, email, is_owner)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name', NEW.email,
          is_owner_email AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE is_owner))
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'customer')
  ON CONFLICT (user_id, role) DO NOTHING;

  IF is_owner_email THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- 6. Owner can read/update every profile
DROP POLICY IF EXISTS "Owner manages profiles" ON public.profiles;
CREATE POLICY "Owner manages profiles" ON public.profiles
  FOR UPDATE TO authenticated
  USING (private.is_owner(auth.uid()))
  WITH CHECK (private.is_owner(auth.uid()));

-- 7. Public read access to product images in storage
DROP POLICY IF EXISTS "Public read media" ON storage.objects;
CREATE POLICY "Public read media" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'media');
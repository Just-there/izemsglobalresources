-- Add a flag controlling which settings are readable by the public.
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT false;

-- Replace the wide-open public SELECT policy with one restricted to public rows.
DROP POLICY IF EXISTS "Settings are public" ON public.site_settings;

CREATE POLICY "Public settings are readable"
  ON public.site_settings
  FOR SELECT
  TO anon, authenticated
  USING (is_public = true);

-- Staff can still read every row (their ALL policy already covers this),
-- but add an explicit staff SELECT for clarity of intent.
CREATE POLICY "Staff read all settings"
  ON public.site_settings
  FOR SELECT
  TO authenticated
  USING (private.is_staff(auth.uid()));

-- Keep the founder/owner photo (and any future safe keys) publicly visible.
UPDATE public.site_settings
  SET is_public = true
  WHERE key IN ('owner_image_url');
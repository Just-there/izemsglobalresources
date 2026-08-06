
DROP POLICY IF EXISTS "Anyone can submit a quote request" ON public.quotes;
REVOKE INSERT ON public.quotes FROM anon;
REVOKE USAGE ON SEQUENCE public.quote_number_seq FROM anon;

CREATE POLICY "Staff can create quotes"
  ON public.quotes FOR INSERT TO authenticated
  WITH CHECK (private.is_staff(auth.uid()));

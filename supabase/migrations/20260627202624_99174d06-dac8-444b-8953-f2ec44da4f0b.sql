-- Trigger-only function: no direct callers needed
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;

-- Role-check helpers: signed-in users only (used inside RLS policies)
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.is_staff(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated;

-- Rewrite anon-facing policies so the anon role never invokes a security-definer fn
DROP POLICY "Active products are public" ON public.products;
CREATE POLICY "Public can view active products" ON public.products
  FOR SELECT TO anon, authenticated USING (status = 'active');
CREATE POLICY "Staff can view all products" ON public.products
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

DROP POLICY "Approved reviews are public" ON public.reviews;
CREATE POLICY "Public can view approved reviews" ON public.reviews
  FOR SELECT TO anon, authenticated USING (is_approved = true);
CREATE POLICY "Auth can view own or all reviews" ON public.reviews
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_staff(auth.uid()));
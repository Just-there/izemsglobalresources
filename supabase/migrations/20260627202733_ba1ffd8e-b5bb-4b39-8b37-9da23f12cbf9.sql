-- Private schema, hidden from the Data API
CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role); $$;

CREATE OR REPLACE FUNCTION private.is_staff(_user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin','staff')); $$;

REVOKE EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION private.is_staff(uuid) FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_staff(uuid) TO authenticated;

-- Recreate every policy that referenced the public helpers
DROP POLICY "Users view own profile" ON public.profiles;
CREATE POLICY "Users view own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id OR private.is_staff(auth.uid()));

DROP POLICY "Users view own roles" ON public.user_roles;
CREATE POLICY "Users view own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR private.has_role(auth.uid(),'admin'));
DROP POLICY "Admins manage roles" ON public.user_roles;
CREATE POLICY "Admins manage roles" ON public.user_roles
  FOR ALL TO authenticated USING (private.has_role(auth.uid(),'admin')) WITH CHECK (private.has_role(auth.uid(),'admin'));

DROP POLICY "Staff manage categories" ON public.categories;
CREATE POLICY "Staff manage categories" ON public.categories
  FOR ALL TO authenticated USING (private.is_staff(auth.uid())) WITH CHECK (private.is_staff(auth.uid()));

DROP POLICY "Staff can view all products" ON public.products;
CREATE POLICY "Staff can view all products" ON public.products
  FOR SELECT TO authenticated USING (private.is_staff(auth.uid()));
DROP POLICY "Staff manage products" ON public.products;
CREATE POLICY "Staff manage products" ON public.products
  FOR ALL TO authenticated USING (private.is_staff(auth.uid())) WITH CHECK (private.is_staff(auth.uid()));

DROP POLICY "Staff manage messages" ON public.messages;
CREATE POLICY "Staff manage messages" ON public.messages
  FOR ALL TO authenticated USING (private.is_staff(auth.uid())) WITH CHECK (private.is_staff(auth.uid()));

DROP POLICY "Staff manage subscribers" ON public.newsletter_subscribers;
CREATE POLICY "Staff manage subscribers" ON public.newsletter_subscribers
  FOR ALL TO authenticated USING (private.is_staff(auth.uid())) WITH CHECK (private.is_staff(auth.uid()));

DROP POLICY "Auth can view own or all reviews" ON public.reviews;
CREATE POLICY "Auth can view own or all reviews" ON public.reviews
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR private.is_staff(auth.uid()));
DROP POLICY "Staff manage reviews" ON public.reviews;
CREATE POLICY "Staff manage reviews" ON public.reviews
  FOR ALL TO authenticated USING (private.is_staff(auth.uid())) WITH CHECK (private.is_staff(auth.uid()));

DROP POLICY "Customers view own orders" ON public.orders;
CREATE POLICY "Customers view own orders" ON public.orders
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR private.is_staff(auth.uid()));
DROP POLICY "Staff manage orders" ON public.orders;
CREATE POLICY "Staff manage orders" ON public.orders
  FOR ALL TO authenticated USING (private.is_staff(auth.uid())) WITH CHECK (private.is_staff(auth.uid()));

DROP POLICY "View items of accessible orders" ON public.order_items;
CREATE POLICY "View items of accessible orders" ON public.order_items
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND (o.user_id = auth.uid() OR private.is_staff(auth.uid())))
  );
DROP POLICY "Staff manage order items" ON public.order_items;
CREATE POLICY "Staff manage order items" ON public.order_items
  FOR ALL TO authenticated USING (private.is_staff(auth.uid())) WITH CHECK (private.is_staff(auth.uid()));

-- Drop the now-unused public helpers
DROP FUNCTION public.has_role(uuid, public.app_role);
DROP FUNCTION public.is_staff(uuid);
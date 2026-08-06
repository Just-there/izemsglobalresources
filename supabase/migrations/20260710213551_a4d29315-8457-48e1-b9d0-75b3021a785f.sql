
-- ============ ENUMS ============
CREATE TYPE public.quote_status AS ENUM ('pending','reviewing','awaiting_customer','approved','rejected','completed','cancelled');
CREATE TYPE public.quote_urgency AS ENUM ('low','normal','high','urgent');
CREATE TYPE public.payment_status AS ENUM ('pending','paid','refunded');
CREATE TYPE public.fulfillment_status AS ENUM ('processing','packed','ready_for_dispatch','shipped','delivered','cancelled');

-- ============ QUOTE NUMBER SEQUENCE ============
CREATE SEQUENCE public.quote_number_seq;

-- ============ QUOTES ============
CREATE TABLE public.quotes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_number text UNIQUE,
  customer_name text NOT NULL,
  company text,
  email text NOT NULL,
  phone text,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text,
  category text,
  quantity numeric,
  dimensions text,
  delivery_location text,
  urgency public.quote_urgency NOT NULL DEFAULT 'normal',
  notes text,
  internal_notes text,
  assigned_staff uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status public.quote_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.quotes TO authenticated;
GRANT INSERT ON public.quotes TO anon;
GRANT ALL ON public.quotes TO service_role;
GRANT USAGE ON SEQUENCE public.quote_number_seq TO authenticated, anon, service_role;

ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a quote request"
  ON public.quotes FOR INSERT TO anon, authenticated
  WITH CHECK (true);
CREATE POLICY "Staff can view quotes"
  ON public.quotes FOR SELECT TO authenticated
  USING (private.is_staff(auth.uid()));
CREATE POLICY "Staff can update quotes"
  ON public.quotes FOR UPDATE TO authenticated
  USING (private.is_staff(auth.uid()))
  WITH CHECK (private.is_staff(auth.uid()));
CREATE POLICY "Staff can delete quotes"
  ON public.quotes FOR DELETE TO authenticated
  USING (private.is_staff(auth.uid()));

CREATE OR REPLACE FUNCTION public.set_quote_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.quote_number IS NULL THEN
    NEW.quote_number := 'Q-' || to_char(now(), 'YYYY') || '-' ||
      lpad(nextval('public.quote_number_seq')::text, 6, '0');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_quote_number_trg
  BEFORE INSERT ON public.quotes
  FOR EACH ROW EXECUTE FUNCTION public.set_quote_number();

CREATE TRIGGER update_quotes_updated_at
  BEFORE UPDATE ON public.quotes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ ACTIVITY LOG ============
CREATE TABLE public.activity_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_name text,
  action text NOT NULL,
  entity_type text,
  entity_id text,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.activity_log TO authenticated;
GRANT ALL ON public.activity_log TO service_role;

ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view activity"
  ON public.activity_log FOR SELECT TO authenticated
  USING (private.is_staff(auth.uid()));
CREATE POLICY "Staff can log activity"
  ON public.activity_log FOR INSERT TO authenticated
  WITH CHECK (private.is_staff(auth.uid()));

-- ============ NOTIFICATIONS ============
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  body text,
  type text NOT NULL DEFAULT 'info',
  link text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (private.is_staff(auth.uid()));
CREATE POLICY "Staff can create notifications"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (private.is_staff(auth.uid()));
CREATE POLICY "Staff can update notifications"
  ON public.notifications FOR UPDATE TO authenticated
  USING (private.is_staff(auth.uid()))
  WITH CHECK (private.is_staff(auth.uid()));
CREATE POLICY "Staff can delete notifications"
  ON public.notifications FOR DELETE TO authenticated
  USING (private.is_staff(auth.uid()));

-- ============ PRODUCTS EXTRA FIELDS ============
ALTER TABLE public.products
  ADD COLUMN product_code text,
  ADD COLUMN brand text,
  ADD COLUMN short_description text,
  ADD COLUMN material text,
  ADD COLUMN dimensions text,
  ADD COLUMN weight text,
  ADD COLUMN thickness text,
  ADD COLUMN color text,
  ADD COLUMN grade text,
  ADD COLUMN applications text[] NOT NULL DEFAULT '{}',
  ADD COLUMN warehouse text,
  ADD COLUMN supplier text,
  ADD COLUMN cost_price numeric,
  ADD COLUMN selling_price numeric,
  ADD COLUMN min_stock integer NOT NULL DEFAULT 0,
  ADD COLUMN max_stock integer,
  ADD COLUMN seo_title text,
  ADD COLUMN meta_description text,
  ADD COLUMN og_image_url text;

-- ============ ORDERS EXTRA FIELDS ============
ALTER TABLE public.orders
  ADD COLUMN company text,
  ADD COLUMN payment_status public.payment_status NOT NULL DEFAULT 'pending',
  ADD COLUMN fulfillment_status public.fulfillment_status NOT NULL DEFAULT 'processing',
  ADD COLUMN assigned_staff uuid REFERENCES auth.users(id) ON DELETE SET NULL;

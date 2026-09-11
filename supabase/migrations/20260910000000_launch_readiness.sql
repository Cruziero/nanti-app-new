-- Additive launch migration. Existing records remain intact.
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS memory_snapshot jsonb;
ALTER TABLE public.waiting_items ADD COLUMN IF NOT EXISTS memory_snapshot jsonb;
ALTER TABLE public.inbox_items ADD COLUMN IF NOT EXISTS memory_snapshot jsonb;
CREATE TABLE public.launch_settings (
 user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 preferences jsonb NOT NULL DEFAULT '{}', updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.launch_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY launch_settings_owner ON public.launch_settings FOR ALL TO authenticated USING(user_id=auth.uid()) WITH CHECK(user_id=auth.uid());
CREATE TABLE public.launch_subscriptions (
 user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 trial_started_at timestamptz NOT NULL DEFAULT now(),
 trial_ends_at timestamptz NOT NULL DEFAULT (now()+interval '10 days'),
 paid_until timestamptz,
 CONSTRAINT trial_length CHECK(trial_ends_at=trial_started_at+interval '10 days')
);
ALTER TABLE public.launch_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY subscription_owner_read ON public.launch_subscriptions FOR SELECT TO authenticated USING(user_id=auth.uid());
CREATE TABLE public.launch_orders (
 id text PRIMARY KEY, user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 amount integer NOT NULL CHECK(amount=25000), status text NOT NULL DEFAULT 'pending',
 checkout_url text, created_at timestamptz NOT NULL DEFAULT now(), applied_at timestamptz
);
ALTER TABLE public.launch_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY orders_owner_read ON public.launch_orders FOR SELECT TO authenticated USING(user_id=auth.uid());
CREATE INDEX launch_orders_owner_idx ON public.launch_orders(user_id,created_at DESC);
CREATE TABLE public.launch_rate_limits (key text PRIMARY KEY, hits integer NOT NULL, expires_at timestamptz NOT NULL);
ALTER TABLE public.launch_rate_limits ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.contact_requests (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, email text NOT NULL,
 company text, message text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.contact_requests ENABLE ROW LEVEL SECURITY;
-- Only trusted server code may accept contact requests or change entitlements.
REVOKE ALL ON public.launch_rate_limits, public.contact_requests FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.launch_subscriptions, public.launch_orders FROM anon, authenticated;
CREATE OR REPLACE FUNCTION public.launch_consume_rate(p_key text,p_limit integer,p_seconds integer)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE n integer;
BEGIN
 INSERT INTO launch_rate_limits(key,hits,expires_at) VALUES(p_key,1,now()+make_interval(secs=>p_seconds))
 ON CONFLICT(key) DO UPDATE SET hits=CASE WHEN launch_rate_limits.expires_at<=now() THEN 1 ELSE launch_rate_limits.hits+1 END,
 expires_at=CASE WHEN launch_rate_limits.expires_at<=now() THEN now()+make_interval(secs=>p_seconds) ELSE launch_rate_limits.expires_at END
 RETURNING hits INTO n;
 RETURN n<=p_limit;
END $$;
REVOKE ALL ON FUNCTION public.launch_consume_rate(text,integer,integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.launch_consume_rate(text,integer,integer) TO service_role;
CREATE OR REPLACE FUNCTION public.launch_apply_payment(p_order text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE o launch_orders%ROWTYPE; base timestamptz;
BEGIN
 SELECT * INTO o FROM launch_orders WHERE id=p_order FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Unknown order'; END IF;
 IF o.applied_at IS NOT NULL THEN RETURN; END IF;
 INSERT INTO launch_subscriptions(user_id) VALUES(o.user_id) ON CONFLICT DO NOTHING;
 SELECT greatest(now(),trial_ends_at,coalesce(paid_until,now())) INTO base FROM launch_subscriptions WHERE user_id=o.user_id FOR UPDATE;
 UPDATE launch_subscriptions SET paid_until=base+interval '1 month' WHERE user_id=o.user_id;
 UPDATE launch_orders SET status='paid',applied_at=now() WHERE id=p_order;
END $$;
REVOKE ALL ON FUNCTION public.launch_apply_payment(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.launch_apply_payment(text) TO service_role;

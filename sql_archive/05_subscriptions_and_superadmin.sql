-- =======================================================
-- ROASTERMANAGER - SUBSCRIPTIONS & SUPERADMIN SCHEMA
-- =======================================================

-- 1. Add subscription columns to tenants table (if not exists)
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS subscription_tier TEXT NOT NULL DEFAULT 'Free';
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS subscription_status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '30 days');
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS max_users INTEGER NOT NULL DEFAULT 15;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- 2. Ensure Superadmin user role upgrade mechanism
-- We handle the assignment of the 'Superadmin' role seamlessly in our Auth actions,
-- but we make sure the 'Superadmin' role check is supported by our profiles schema.
-- The profiles table has a `role` TEXT column, so 'Superadmin' is fully compatible.

-- 3. Verify RLS remains robust
-- Since the Superadmin Dashboard will fetch and manage system data exclusively on the server
-- using the Supabase Service Role client, it will securely bypass RLS without compromising
-- tenant-level isolation for normal coaches, parents, and players.

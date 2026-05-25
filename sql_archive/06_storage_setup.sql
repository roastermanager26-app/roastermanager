-- =======================================================
-- ROASTERMANAGER - STORAGE BUCKETS & POLICIES SETUP
-- =======================================================

-- 1. Create Storage Buckets (if not exist)
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('drills', 'drills', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('billboard', 'billboard', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('clubs', 'clubs', true) ON CONFLICT (id) DO NOTHING;

-- 2. Setup Storage Policies for 'avatars'
DROP POLICY IF EXISTS "Avatar Images Upload" ON storage.objects;
DROP POLICY IF EXISTS "Avatar Images Update" ON storage.objects;
DROP POLICY IF EXISTS "Avatar Images Delete" ON storage.objects;
DROP POLICY IF EXISTS "Avatar Images View" ON storage.objects;

CREATE POLICY "Avatar Images Upload" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'avatars');
CREATE POLICY "Avatar Images Update" ON storage.objects FOR UPDATE TO public USING (bucket_id = 'avatars');
CREATE POLICY "Avatar Images Delete" ON storage.objects FOR DELETE TO public USING (bucket_id = 'avatars');
CREATE POLICY "Avatar Images View" ON storage.objects FOR SELECT TO public USING (bucket_id = 'avatars');

-- 3. Setup Storage Policies for 'drills'
DROP POLICY IF EXISTS "Drills Storage Upload" ON storage.objects;
DROP POLICY IF EXISTS "Drills Storage Update" ON storage.objects;
DROP POLICY IF EXISTS "Drills Storage Delete" ON storage.objects;
DROP POLICY IF EXISTS "Drills Storage View" ON storage.objects;

CREATE POLICY "Drills Storage Upload" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'drills');
CREATE POLICY "Drills Storage Update" ON storage.objects FOR UPDATE TO public USING (bucket_id = 'drills');
CREATE POLICY "Drills Storage Delete" ON storage.objects FOR DELETE TO public USING (bucket_id = 'drills');
CREATE POLICY "Drills Storage View" ON storage.objects FOR SELECT TO public USING (bucket_id = 'drills');

-- 4. Setup Storage Policies for 'billboard'
DROP POLICY IF EXISTS "Billboard images are public" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload billboard images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own billboard images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own billboard images" ON storage.objects;

CREATE POLICY "Billboard images are public" ON storage.objects FOR SELECT TO public USING (bucket_id = 'billboard');
CREATE POLICY "Authenticated users can upload billboard images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'billboard');
CREATE POLICY "Users can update their own billboard images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'billboard');
CREATE POLICY "Users can delete their own billboard images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'billboard');

-- 5. Setup Storage Policies for 'clubs'
DROP POLICY IF EXISTS "Club Images Upload" ON storage.objects;
DROP POLICY IF EXISTS "Club Images Update" ON storage.objects;
DROP POLICY IF EXISTS "Club Images Delete" ON storage.objects;
DROP POLICY IF EXISTS "Club Images View" ON storage.objects;

CREATE POLICY "Club Images Upload" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'clubs');
CREATE POLICY "Club Images Update" ON storage.objects FOR UPDATE TO public USING (bucket_id = 'clubs');
CREATE POLICY "Club Images Delete" ON storage.objects FOR DELETE TO public USING (bucket_id = 'clubs');
CREATE POLICY "Club Images View" ON storage.objects FOR SELECT TO public USING (bucket_id = 'clubs');

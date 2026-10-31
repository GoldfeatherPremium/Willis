-- ============================================================
-- HomeAtlas RLS / cross-user isolation tests
-- Run with psql against your Supabase project (or in the SQL editor).
-- Each check should return 0 rows (meaning isolation held).
-- ============================================================

-- Replace the three ids below with real rows from your project.
-- user_a owns homeA; user_b is unrelated.
-- \set ua '00000000-0000-0000-0000-00000000000a'
-- \set ub '00000000-0000-0000-0000-00000000000b'
-- \set homeA '00000000-0000-0000-0000-00000000000c'

-- 1. Non-member cannot select from a home.
set role authenticated;
select set_config('request.jwt.claim.sub', :'ub', true);
select count(*) as leak
from public.homes
where id = :'homeA';
-- expected: 0

-- 2. Non-member cannot select rooms of another home.
select count(*) as leak
from public.rooms
where home_id = :'homeA';
-- expected: 0

-- 3. Non-member cannot select objects of another home.
select count(*) as leak
from public.objects
where home_id = :'homeA';
-- expected: 0

-- 4. Owner can see their own home.
select set_config('request.jwt.claim.sub', :'ua', true);
select count(*) as owner_visible
from public.homes
where id = :'homeA';
-- expected: 1

-- 5. Anonymous cannot see anything.
reset role;
select count(*) as anon_leak
from public.homes;
-- expected: 0

-- 6. Storage bucket path is user-scoped (policy uses foldername[1] = uid).
select count(*) as storage_leak
from storage.objects
where bucket_id = 'home-media'
  and (storage.foldername(name))[1] <> :'ua'::text;
-- expected: 0

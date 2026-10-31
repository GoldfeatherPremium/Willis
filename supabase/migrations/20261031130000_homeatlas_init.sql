-- ============================================================
-- HomeAtlas initial schema
-- Extensions, enums, tables, RLS, functions, views, storage.
-- Mirrors src/lib/types/database.ts (source of truth: SQL).
-- ============================================================

-- Extensions --------------------------------------------------
create extension if not exists vector with schema extensions;
create extension if not exists pg_trgm;

-- Defer function body validation: helpers reference tables that
-- are created later in this migration.
set check_function_bodies = off;

-- Enums ------------------------------------------------------
create type public.plan_id as enum ('explorer','personal','family','collector');
create type public.subscription_status as enum ('trialing','active','past_due','canceled','unpaid','incomplete');
create type public.scan_status as enum ('pending','validated','processing','completed','failed','canceled');
create type public.job_status as enum ('queued','running','completed','failed','canceled');
create type public.observation_verification as enum ('unverified','confirmed','corrected');
create type public.spatial_entity_type as enum ('zone','furniture','container','object','room');
create type public.spatial_relationship_type as enum ('contains','in','located_in','near','part_of');
create type public.activity_type as enum (
  'home_created','room_created','scan_started','scan_completed','scan_failed',
  'object_created','object_updated','object_verified','object_location_changed',
  'report_generated','member_added','subscription_changed'
);
create type public.home_type as enum ('house','apartment','studio','loft','townhouse','other');
create type public.room_type as enum ('living_room','kitchen','bedroom','bathroom','study','storage','hallway','garage','balcony','other');
create type public.object_category as enum ('furniture','electronics','appliance','book','accessory','clothing','collectible','storage_container','document','other');
create type public.scan_capture_type as enum ('photos','video','mixed');
create type public.asset_kind as enum ('image','video','audio');
create type public.document_kind as enum ('receipt','manual','warranty','other');
create type public.notification_type as enum ('scan_completed','scan_failed','object_verified','family_invite','subscription','system');
create type public.member_role as enum ('owner','admin','member','viewer');

-- profiles ----------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- subscriptions ----------------------------------------------
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  plan public.plan_id not null default 'explorer',
  status public.subscription_status not null default 'active',
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  stripe_customer_id text,
  stripe_subscription_id text,
  price_cents integer not null default 0,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index subscriptions_user_active_idx on public.subscriptions(user_id) where status in ('trialing','active','past_due');
create index subscriptions_user_idx on public.subscriptions(user_id);

-- homes -------------------------------------------------------
create table public.homes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  home_type public.home_type not null default 'house',
  address text,
  currency text not null default 'usd',
  thumbnail_url text,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);
create index homes_owner_idx on public.homes(owner_id);
create index homes_archived_idx on public.homes(archived_at);

-- home_members -----------------------------------------------
create table public.home_members (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.member_role not null default 'member',
  created_at timestamptz not null default now(),
  unique (home_id, user_id)
);
create index home_members_user_idx on public.home_members(user_id);

-- rooms -------------------------------------------------------
create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(id) on delete cascade,
  name text not null,
  room_type public.room_type not null default 'other',
  floor integer not null default 0,
  position jsonb,
  width numeric not null default 4,
  length numeric not null default 5,
  height numeric not null default 2.7,
  thumbnail_url text,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);
create index rooms_home_idx on public.rooms(home_id);

-- scans -------------------------------------------------------
create table public.scans (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  home_id uuid not null references public.homes(id) on delete cascade,
  status public.scan_status not null default 'pending',
  provider text not null,
  provider_job_id text,
  capture_type public.scan_capture_type not null default 'photos',
  quality_score numeric,
  error text,
  is_simulated boolean not null default false,
  raw_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz
);
create index scans_room_idx on public.scans(room_id);
create index scans_home_idx on public.scans(home_id);
create index scans_status_idx on public.scans(status);

-- scan_assets -------------------------------------------------
create table public.scan_assets (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid not null references public.scans(id) on delete cascade,
  kind public.asset_kind not null default 'image',
  storage_path text not null,
  mime_type text,
  size_bytes bigint,
  width integer,
  height integer,
  duration_ms integer,
  created_at timestamptz not null default now()
);
create index scan_assets_scan_idx on public.scan_assets(scan_id);

-- reconstruction_jobs ----------------------------------------
create table public.reconstruction_jobs (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid not null references public.scans(id) on delete cascade,
  home_id uuid not null references public.homes(id) on delete cascade,
  room_id uuid not null references public.rooms(id) on delete cascade,
  provider text not null,
  provider_job_id text,
  status public.job_status not null default 'queued',
  attempt integer not null default 0,
  progress numeric not null default 0,
  result_uri text,
  result_type text,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);
create index reconstruction_jobs_scan_idx on public.reconstruction_jobs(scan_id);
create index reconstruction_jobs_status_idx on public.reconstruction_jobs(status);

-- objects -----------------------------------------------------
create table public.objects (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(id) on delete cascade,
  room_id uuid references public.rooms(id) on delete set null,
  name text not null,
  category public.object_category not null default 'other',
  description text,
  brand text,
  model text,
  serial_number text,
  condition text,
  value_cents integer,
  thumbnail_url text,
  image_storage_path text,
  created_by uuid not null references public.profiles(id) on delete restrict,
  source_scan_id uuid references public.scans(id) on delete set null,
  ai_extracted jsonb,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);
create index objects_home_idx on public.objects(home_id);
create index objects_room_idx on public.objects(room_id);
create index objects_name_trgm_idx on public.objects using gin (name gin_trgm_ops);

-- object_observations ----------------------------------------
create table public.object_observations (
  id uuid primary key default gen_random_uuid(),
  object_id uuid not null references public.objects(id) on delete cascade,
  scan_id uuid references public.scans(id) on delete set null,
  room_id uuid references public.rooms(id) on delete set null,
  container_object_id uuid references public.objects(id) on delete set null,
  position jsonb,
  coordinate_frame text not null default 'room',
  observed_at timestamptz not null default now(),
  confidence numeric not null default 1,
  source text not null default 'ai',
  verification_status public.observation_verification not null default 'unverified',
  created_at timestamptz not null default now()
);
create index object_observations_object_idx on public.object_observations(object_id);
create index object_observations_scan_idx on public.object_observations(scan_id);

-- object_locations (current + history) -----------------------
create table public.object_locations (
  id uuid primary key default gen_random_uuid(),
  object_id uuid not null references public.objects(id) on delete cascade,
  home_id uuid not null references public.homes(id) on delete cascade,
  room_id uuid references public.rooms(id) on delete set null,
  container_object_id uuid references public.objects(id) on delete set null,
  position jsonb,
  coordinate_frame text not null default 'room',
  observed_at timestamptz not null default now(),
  source text not null default 'ai',
  confidence numeric not null default 1,
  verification_status public.observation_verification not null default 'unverified',
  is_current boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index object_locations_object_idx on public.object_locations(object_id);
create index object_locations_current_idx on public.object_locations(object_id) where is_current;

-- spatial_nodes ----------------------------------------------
create table public.spatial_nodes (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(id) on delete cascade,
  entity_type public.spatial_entity_type not null,
  entity_id uuid not null,
  parent_node_id uuid references public.spatial_nodes(id) on delete set null,
  label text,
  position jsonb,
  created_at timestamptz not null default now(),
  unique (home_id, entity_type, entity_id)
);
create index spatial_nodes_home_idx on public.spatial_nodes(home_id);

-- spatial_relationships --------------------------------------
create table public.spatial_relationships (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(id) on delete cascade,
  source_node_id uuid not null references public.spatial_nodes(id) on delete cascade,
  target_node_id uuid not null references public.spatial_nodes(id) on delete cascade,
  relationship_type public.spatial_relationship_type not null,
  strength numeric not null default 1,
  metadata jsonb,
  created_at timestamptz not null default now(),
  unique (source_node_id, target_node_id, relationship_type)
);
create index spatial_relationships_home_idx on public.spatial_relationships(home_id);

-- object_documents -------------------------------------------
create table public.object_documents (
  id uuid primary key default gen_random_uuid(),
  object_id uuid not null references public.objects(id) on delete cascade,
  home_id uuid not null references public.homes(id) on delete cascade,
  kind public.document_kind not null default 'receipt',
  storage_path text not null,
  filename text not null,
  mime_type text,
  size_bytes bigint,
  uploaded_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);
create index object_documents_object_idx on public.object_documents(object_id);

-- object_embeddings ------------------------------------------
create table public.object_embeddings (
  id uuid primary key default gen_random_uuid(),
  object_id uuid not null unique references public.objects(id) on delete cascade,
  embedding extensions.vector(1536) not null,
  model text not null default 'text-embedding-3-small',
  updated_at timestamptz not null default now()
);

-- conversations & messages -----------------------------------
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  home_id uuid references public.homes(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null default 'Chat',
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index conversations_user_idx on public.conversations(user_id);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null,
  tool_calls jsonb,
  created_at timestamptz not null default now()
);
create index messages_conversation_idx on public.messages(conversation_id);

-- activity_events --------------------------------------------
create table public.activity_events (
  id uuid primary key default gen_random_uuid(),
  home_id uuid references public.homes(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  type public.activity_type not null,
  payload jsonb,
  created_at timestamptz not null default now()
);
create index activity_events_home_idx on public.activity_events(home_id);
create index activity_events_created_idx on public.activity_events(created_at desc);

-- notifications ----------------------------------------------
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  home_id uuid references public.homes(id) on delete cascade,
  type public.notification_type not null default 'system',
  title text not null,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications(user_id) where read_at is null;

-- processing_usage -------------------------------------------
create table public.processing_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  event_type text not null,
  units numeric not null default 1,
  metered_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index processing_usage_user_idx on public.processing_usage(user_id, metered_at);

-- Access helpers (used by RLS policies) ----------------------
create or replace function public.is_home_member(home_id uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.home_members hm
    where hm.home_id = $1 and hm.user_id = auth.uid()
  );
$$;

create or replace function public.is_home_owner(home_id uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.home_members hm
    where hm.home_id = $1 and hm.user_id = auth.uid() and hm.role = 'owner'
  );
$$;

create or replace function public.is_home_admin(home_id uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.home_members hm
    where hm.home_id = $1 and hm.user_id = auth.uid() and hm.role in ('owner','admin')
  );
$$;

create or replace function public.get_my_home_ids()
returns uuid[]
language sql stable security definer
set search_path = public
as $$
  select coalesce(array_agg(home_id), '{}') from public.home_members where user_id = auth.uid();
$$;

-- updated_at trigger -----------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger subscriptions_updated_at before update on public.subscriptions
  for each row execute function public.set_updated_at();
create trigger homes_updated_at before update on public.homes
  for each row execute function public.set_updated_at();
create trigger rooms_updated_at before update on public.rooms
  for each row execute function public.set_updated_at();
create trigger scans_updated_at before update on public.scans
  for each row execute function public.set_updated_at();
create trigger reconstruction_jobs_updated_at before update on public.reconstruction_jobs
  for each row execute function public.set_updated_at();
create trigger objects_updated_at before update on public.objects
  for each row execute function public.set_updated_at();
create trigger object_locations_updated_at before update on public.object_locations
  for each row execute function public.set_updated_at();
create trigger object_embeddings_updated_at before update on public.object_embeddings
  for each row execute function public.set_updated_at();
create trigger conversations_updated_at before update on public.conversations
  for each row execute function public.set_updated_at();

-- new user handler --------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'));
  insert into public.subscriptions (user_id, plan, price_cents)
  values (new.id, 'explorer', 0);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- quotas ------------------------------------------------------
create or replace function public.calculate_current_month_captures(user_id uuid)
returns integer
language sql stable security definer
set search_path = public
as $$
  select count(*)::int
  from public.scans s
  join public.homes h on h.id = s.home_id
  where h.owner_id = $1
    and s.created_at >= date_trunc('month', now())
    and s.status <> 'canceled';
$$;

-- user_homes view ---------------------------------------------
create or replace view public.user_homes
with (security_invoker = true)
as
select
  h.id as home_id,
  h.name,
  h.home_type,
  h.owner_id,
  h.is_demo,
  h.created_at,
  hm.role as member_role,
  (select count(*)::int from public.rooms r where r.home_id = h.id and r.archived_at is null) as room_count,
  (select count(*)::int from public.objects o where o.home_id = h.id and o.archived_at is null) as object_count,
  (select max(s.completed_at) from public.scans s where s.home_id = h.id) as last_scan_at
from public.homes h
join public.home_members hm on hm.home_id = h.id
where h.archived_at is null;

-- semantic search helper --------------------------------------
create or replace function public.search_objects_semantic(
  p_home_id uuid,
  p_query_embedding extensions.vector(1536),
  p_limit integer default 20
)
returns table (object_id uuid, similarity double precision)
language sql stable
security definer
set search_path = public
as $$
  select oe.object_id, 1 - (oe.embedding <=> p_query_embedding) as similarity
  from public.object_embeddings oe
  join public.objects o on o.id = oe.object_id
  where o.home_id = p_home_id and o.archived_at is null
  order by oe.embedding <=> p_query_embedding
  limit p_limit;
$$;

-- demo home ----------------------------------------------------
create or replace function public.create_demo_home()
returns uuid
language plpgsql security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_home uuid;
  v_living uuid; v_kitchen uuid; v_bedroom uuid; v_study uuid; v_storage uuid;
begin
  if v_user is null then raise exception 'Not authenticated'; end if;

  insert into public.homes (owner_id, name, home_type, address, is_demo)
  values (v_user, 'Demo Home', 'house', '123 Sample Street', true)
  returning id into v_home;

  insert into public.home_members (home_id, user_id, role)
  values (v_home, v_user, 'owner');

  insert into public.rooms (home_id, name, room_type, floor, position, width, length, height, is_demo)
  values
    (v_home, 'Living Room', 'living_room', 0, '{"x":0,"y":0,"z":0}', 6, 7, 2.8, true),
    (v_home, 'Kitchen', 'kitchen', 0, '{"x":7,"y":0,"z":0}', 4, 4, 2.7, true),
    (v_home, 'Bedroom', 'bedroom', 1, '{"x":0,"y":0,"z":6}', 4, 5, 2.7, true),
    (v_home, 'Study', 'study', 1, '{"x":5,"y":0,"z":6}', 3.5, 4, 2.7, true),
    (v_home, 'Storage Room', 'storage', 0, '{"x":12,"y":0,"z":4}', 3, 3, 2.5, true)
  returning id into v_storage;

  select id into v_living from public.rooms where home_id = v_home order by created_at limit 1;
  select id into v_kitchen from public.rooms where home_id = v_home order by created_at limit 1 offset 1;
  select id into v_bedroom from public.rooms where home_id = v_home order by created_at limit 1 offset 2;
  select id into v_study from public.rooms where home_id = v_home order by created_at limit 1 offset 3;
  select id into v_storage from public.rooms where home_id = v_home order by created_at limit 1 offset 4;

  insert into public.objects (home_id, room_id, name, category, description, brand, model, created_by, is_demo)
  values
    (v_home, v_living, 'Sofa', 'furniture', '3-seater fabric sofa', 'IKEA', 'Soderhamn', v_user, true),
    (v_home, v_living, 'Coffee Table', 'furniture', 'Oak coffee table', null, null, v_user, true),
    (v_home, v_living, 'Television', 'electronics', '55-inch 4K TV', 'LG', 'C3', v_user, true),
    (v_home, v_kitchen, 'Refrigerator', 'appliance', 'French-door refrigerator', 'Samsung', 'RS27T5200', v_user, true),
    (v_home, v_kitchen, 'Microwave', 'appliance', 'Countertop microwave', 'Panasonic', 'NN-SN966S', v_user, true),
    (v_home, v_bedroom, 'Nightstand', 'furniture', 'Walnut nightstand', null, null, v_user, true),
    (v_home, v_bedroom, 'Lamp', 'accessory', 'Table lamp with warm bulb', 'IKEA', 'Lersta', v_user, true),
    (v_home, v_study, 'Desk', 'furniture', 'Standing desk', 'Fully', 'Jarvis', v_user, true),
    (v_home, v_study, 'Desk Chair', 'furniture', 'Ergonomic office chair', 'Herman Miller', 'Aeron', v_user, true),
    (v_home, v_study, 'Laptop', 'electronics', '13-inch laptop', 'Apple', 'MacBook Air M3', v_user, true),
    (v_home, v_study, 'Camera', 'electronics', 'Mirrorless camera', 'Sony', 'A7 IV', v_user, true),
    (v_home, v_study, 'Camera Battery', 'electronics', 'NP-FZ100 battery', 'Sony', 'NP-FZ100', v_user, true),
    (v_home, v_study, 'Camera Charger', 'electronics', 'Dual battery charger', 'Sony', 'BC-QZ1', v_user, true),
    (v_home, v_study, 'Headphones', 'accessory', 'Over-ear wireless headphones', 'Sony', 'WH-1000XM5', v_user, true),
    (v_home, v_study, 'Collectible Figures', 'collectible', 'Set of 6 designer figures', null, null, v_user, true),
    (v_home, v_storage, 'Storage Box', 'storage_container', 'Large clear storage box', null, null, v_user, true),
    (v_home, v_storage, 'Suitcase', 'accessory', 'Hard-shell suitcase', 'Samsonite', 'Freeform', v_user, true),
    (v_home, v_storage, 'Books', 'book', 'Box of paperback books', null, null, v_user, true);

  insert into public.object_observations (object_id, room_id, position, confidence, source, verification_status)
  select o.id, o.room_id, '{"x":0.5,"y":0.5,"z":0.5}', 0.99, 'ai', 'unverified'
  from public.objects o where o.home_id = v_home;

  insert into public.object_locations (object_id, home_id, room_id, position, source, confidence, verification_status, is_current)
  select o.id, o.home_id, o.room_id, '{"x":0.5,"y":0.5,"z":0.5}', 'ai', 0.99, 'unverified', true
  from public.objects o where o.home_id = v_home;

  insert into public.activity_events (home_id, actor_id, type, payload)
  values (v_home, v_user, 'home_created', jsonb_build_object('demo', true));

  insert into public.conversations (home_id, user_id, title, is_demo)
  values (v_home, v_user, 'Demo conversation', true);

  return v_home;
end;
$$;

-- ============================================================
-- RLS
-- ============================================================
alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.homes enable row level security;
alter table public.home_members enable row level security;
alter table public.rooms enable row level security;
alter table public.scans enable row level security;
alter table public.scan_assets enable row level security;
alter table public.reconstruction_jobs enable row level security;
alter table public.objects enable row level security;
alter table public.object_observations enable row level security;
alter table public.object_locations enable row level security;
alter table public.spatial_nodes enable row level security;
alter table public.spatial_relationships enable row level security;
alter table public.object_documents enable row level security;
alter table public.object_embeddings enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.activity_events enable row level security;
alter table public.notifications enable row level security;
alter table public.processing_usage enable row level security;

-- profiles
create policy profiles_select_own on public.profiles for select using (id = auth.uid());
create policy profiles_insert_own on public.profiles for insert with check (id = auth.uid());
create policy profiles_update_own on public.profiles for update using (id = auth.uid());

-- subscriptions
create policy subscriptions_select_own on public.subscriptions for select using (user_id = auth.uid());
create policy subscriptions_insert_own on public.subscriptions for insert with check (user_id = auth.uid());
create policy subscriptions_update_own on public.subscriptions for update using (user_id = auth.uid());

-- homes
create policy homes_select_member on public.homes for select using (public.is_home_member(id));
create policy homes_insert_owner on public.homes for insert with check (owner_id = auth.uid());
create policy homes_update_owner on public.homes for update using (public.is_home_owner(id));
create policy homes_delete_owner on public.homes for delete using (public.is_home_owner(id));

-- home_members
create policy home_members_select_own on public.home_members for select using (user_id = auth.uid() or public.is_home_member(home_id));
create policy home_members_insert_owner on public.home_members for insert with check (public.is_home_admin(home_id) or user_id = auth.uid());
create policy home_members_update_owner on public.home_members for update using (public.is_home_admin(home_id));
create policy home_members_delete_owner on public.home_members for delete using (public.is_home_admin(home_id));

-- rooms
create policy rooms_select_member on public.rooms for select using (public.is_home_member(home_id));
create policy rooms_insert_member on public.rooms for insert with check (public.is_home_member(home_id));
create policy rooms_update_member on public.rooms for update using (public.is_home_member(home_id));
create policy rooms_delete_owner on public.rooms for delete using (public.is_home_admin(home_id));

-- scans
create policy scans_select_member on public.scans for select using (public.is_home_member(home_id));
create policy scans_insert_member on public.scans for insert with check (public.is_home_member(home_id));
create policy scans_update_member on public.scans for update using (public.is_home_member(home_id));
create policy scans_delete_member on public.scans for delete using (public.is_home_member(home_id));

-- scan_assets
create policy scan_assets_select_member on public.scan_assets for select
  using (exists (select 1 from public.scans s where s.id = scan_id and public.is_home_member(s.home_id)));
create policy scan_assets_insert_member on public.scan_assets for insert
  with check (exists (select 1 from public.scans s where s.id = scan_id and public.is_home_member(s.home_id)));
create policy scan_assets_update_member on public.scan_assets for update
  using (exists (select 1 from public.scans s where s.id = scan_id and public.is_home_member(s.home_id)));
create policy scan_assets_delete_member on public.scan_assets for delete
  using (exists (select 1 from public.scans s where s.id = scan_id and public.is_home_member(s.home_id)));

-- reconstruction_jobs
create policy jobs_select_member on public.reconstruction_jobs for select using (public.is_home_member(home_id));
create policy jobs_insert_member on public.reconstruction_jobs for insert with check (public.is_home_member(home_id));
create policy jobs_update_member on public.reconstruction_jobs for update using (public.is_home_member(home_id));
create policy jobs_delete_member on public.reconstruction_jobs for delete using (public.is_home_member(home_id));

-- objects
create policy objects_select_member on public.objects for select using (public.is_home_member(home_id));
create policy objects_insert_member on public.objects for insert with check (public.is_home_member(home_id));
create policy objects_update_member on public.objects for update using (public.is_home_member(home_id));
create policy objects_delete_member on public.objects for delete using (public.is_home_member(home_id));

-- object_observations
create policy observations_select_member on public.object_observations for select
  using (exists (select 1 from public.objects o where o.id = object_id and public.is_home_member(o.home_id)));
create policy observations_insert_member on public.object_observations for insert
  with check (exists (select 1 from public.objects o where o.id = object_id and public.is_home_member(o.home_id)));
create policy observations_update_member on public.object_observations for update
  using (exists (select 1 from public.objects o where o.id = object_id and public.is_home_member(o.home_id)));
create policy observations_delete_member on public.object_observations for delete
  using (exists (select 1 from public.objects o where o.id = object_id and public.is_home_member(o.home_id)));

-- object_locations
create policy locations_select_member on public.object_locations for select using (public.is_home_member(home_id));
create policy locations_insert_member on public.object_locations for insert with check (public.is_home_member(home_id));
create policy locations_update_member on public.object_locations for update using (public.is_home_member(home_id));
create policy locations_delete_member on public.object_locations for delete using (public.is_home_member(home_id));

-- spatial_nodes
create policy nodes_select_member on public.spatial_nodes for select using (public.is_home_member(home_id));
create policy nodes_insert_member on public.spatial_nodes for insert with check (public.is_home_member(home_id));
create policy nodes_update_member on public.spatial_nodes for update using (public.is_home_member(home_id));
create policy nodes_delete_member on public.spatial_nodes for delete using (public.is_home_member(home_id));

-- spatial_relationships
create policy rels_select_member on public.spatial_relationships for select using (public.is_home_member(home_id));
create policy rels_insert_member on public.spatial_relationships for insert with check (public.is_home_member(home_id));
create policy rels_update_member on public.spatial_relationships for update using (public.is_home_member(home_id));
create policy rels_delete_member on public.spatial_relationships for delete using (public.is_home_member(home_id));

-- object_documents
create policy documents_select_member on public.object_documents for select using (public.is_home_member(home_id));
create policy documents_insert_member on public.object_documents for insert with check (public.is_home_member(home_id));
create policy documents_update_member on public.object_documents for update using (public.is_home_member(home_id));
create policy documents_delete_member on public.object_documents for delete using (public.is_home_member(home_id));

-- object_embeddings
create policy embeddings_select_member on public.object_embeddings for select
  using (exists (select 1 from public.objects o where o.id = object_id and public.is_home_member(o.home_id)));
create policy embeddings_insert_member on public.object_embeddings for insert
  with check (exists (select 1 from public.objects o where o.id = object_id and public.is_home_member(o.home_id)));
create policy embeddings_update_member on public.object_embeddings for update
  using (exists (select 1 from public.objects o where o.id = object_id and public.is_home_member(o.home_id)));
create policy embeddings_delete_member on public.object_embeddings for delete
  using (exists (select 1 from public.objects o where o.id = object_id and public.is_home_member(o.home_id)));

-- conversations
create policy conversations_select_own on public.conversations for select
  using (user_id = auth.uid() or (home_id is not null and public.is_home_member(home_id)));
create policy conversations_insert_own on public.conversations for insert
  with check (user_id = auth.uid() and (home_id is null or public.is_home_member(home_id)));
create policy conversations_update_own on public.conversations for update
  using (user_id = auth.uid() or (home_id is not null and public.is_home_member(home_id)));
create policy conversations_delete_own on public.conversations for delete
  using (user_id = auth.uid());

-- messages
create policy messages_select_own on public.messages for select
  using (exists (select 1 from public.conversations c
    where c.id = conversation_id and (c.user_id = auth.uid() or (c.home_id is not null and public.is_home_member(c.home_id)))));
create policy messages_insert_own on public.messages for insert
  with check (exists (select 1 from public.conversations c
    where c.id = conversation_id and (c.user_id = auth.uid() or (c.home_id is not null and public.is_home_member(c.home_id)))));

-- activity_events
create policy events_select_member on public.activity_events for select
  using (home_id is null or public.is_home_member(home_id));

-- notifications
create policy notifications_select_own on public.notifications for select using (user_id = auth.uid());
create policy notifications_update_own on public.notifications for update using (user_id = auth.uid());
create policy notifications_delete_own on public.notifications for delete using (user_id = auth.uid());

-- processing_usage
create policy usage_select_own on public.processing_usage for select using (user_id = auth.uid());
create policy usage_insert_own on public.processing_usage for insert with check (user_id = auth.uid());

-- ============================================================
-- Storage buckets (private) + policies
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('home-media', 'home-media', false, 52428800, array['image/jpeg','image/png','image/webp','video/mp4','video/quicktime']),
  ('documents', 'documents', false, 20971520, array['application/pdf','image/jpeg','image/png','application/zip','text/plain','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  ('exports', 'exports', false, 52428800, array['application/pdf','text/csv','application/zip'])
on conflict (id) do nothing;

create policy home_media_insert_own on storage.objects for insert
  with check (bucket_id = 'home-media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy home_media_select_own on storage.objects for select
  using (bucket_id = 'home-media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy home_media_update_own on storage.objects for update
  using (bucket_id = 'home-media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy home_media_delete_own on storage.objects for delete
  using (bucket_id = 'home-media' and (storage.foldername(name))[1] = auth.uid()::text);

create policy documents_insert_own on storage.objects for insert
  with check (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);
create policy documents_select_own on storage.objects for select
  using (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);
create policy documents_delete_own on storage.objects for delete
  using (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);

create policy exports_insert_own on storage.objects for insert
  with check (bucket_id = 'exports' and (storage.foldername(name))[1] = auth.uid()::text);
create policy exports_select_own on storage.objects for select
  using (bucket_id = 'exports' and (storage.foldername(name))[1] = auth.uid()::text);
create policy exports_delete_own on storage.objects for delete
  using (bucket_id = 'exports' and (storage.foldername(name))[1] = auth.uid()::text);

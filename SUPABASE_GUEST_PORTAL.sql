-- OurPlans complete Supabase schema.
-- Run once in Supabase SQL Editor. Keep service-role keys server-side only.

-- Owner workspace, used by the existing browser Cloud sync.
create table if not exists public.wedding_plans (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.wedding_plans enable row level security;
drop policy if exists "Owners can read their wedding plan" on public.wedding_plans;
create policy "Owners can read their wedding plan" on public.wedding_plans
  for select to authenticated using (auth.uid() = user_id);
drop policy if exists "Owners can insert their wedding plan" on public.wedding_plans;
create policy "Owners can insert their wedding plan" on public.wedding_plans
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Owners can update their wedding plan" on public.wedding_plans;
create policy "Owners can update their wedding plan" on public.wedding_plans
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Public guest portal payload. No anon/authenticated policies are created.
-- Only the Vercel server function accesses this table with the service-role key.
create table if not exists public.wedding_guest_data (
  wedding_id text primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.wedding_guest_data enable row level security;

-- Public read bucket for shared guest photos. Uploads are accepted only via the server API.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('wedding-gallery', 'wedding-gallery', true, 2097152, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true, file_size_limit = 2097152,
  allowed_mime_types = array['image/jpeg','image/png','image/webp'];

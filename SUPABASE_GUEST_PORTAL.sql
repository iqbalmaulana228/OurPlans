-- Run this SQL once in Supabase SQL Editor for the shared guest portal.
create table if not exists public.wedding_guest_data (
  wedding_id text primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.wedding_guest_data enable row level security;
-- No anon/authenticated policies are added. Only the server-side service-role API accesses this table.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('wedding-gallery', 'wedding-gallery', true, 2097152, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true, file_size_limit = 2097152, allowed_mime_types = array['image/jpeg','image/png','image/webp'];

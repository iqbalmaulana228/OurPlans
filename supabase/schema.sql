-- OurPlans V2: Supabase PostgreSQL
-- Run this script in Supabase SQL Editor.
create table if not exists public.wedding_plans (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.wedding_plans enable row level security;
drop policy if exists "Owners can read their wedding data" on public.wedding_plans;
create policy "Owners can read their wedding data" on public.wedding_plans
  for select to authenticated using (auth.uid() = user_id);
drop policy if exists "Owners can insert their wedding data" on public.wedding_plans;
create policy "Owners can insert their wedding data" on public.wedding_plans
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Owners can update their wedding data" on public.wedding_plans;
create policy "Owners can update their wedding data" on public.wedding_plans
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

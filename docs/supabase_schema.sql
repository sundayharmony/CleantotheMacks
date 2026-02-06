-- Supabase schema for Clean To The Mack's
-- Run in Supabase SQL editor

-- Extensions
create extension if not exists "pgcrypto";

-- Profiles table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'user' check (role in ('user', 'admin')),
  name text,
  email text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Bookings table
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  status text not null default 'pending',
  property_type text not null,
  name text,
  email text,
  phone text,
  address text,
  complexity text,
  home_size text,
  bedrooms integer,
  bathrooms integer,
  square_footage integer,
  business_name text,
  office_type text,
  number_of_floors integer,
  number_of_employees integer,
  preferred_date date,
  additional_info text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Updated at trigger
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists bookings_updated_at on public.bookings;
create trigger bookings_updated_at
before update on public.bookings
for each row execute function public.set_updated_at();

-- Admin check helper
create or replace function public.is_admin(user_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = user_id and role = 'admin'
  );
$$ language sql stable;

-- RLS
alter table public.profiles enable row level security;
alter table public.bookings enable row level security;

-- Profiles policies
drop policy if exists "profiles_read_own" on public.profiles;
create policy "profiles_read_own"
on public.profiles for select
using (auth.uid() = id or public.is_admin(auth.uid()));

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles for update
using (auth.uid() = id or public.is_admin(auth.uid()))
with check (auth.uid() = id or public.is_admin(auth.uid()));

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles for insert
with check (auth.uid() = id);

-- Bookings policies
drop policy if exists "bookings_read_own" on public.bookings;
create policy "bookings_read_own"
on public.bookings for select
using (auth.uid() = user_id or public.is_admin(auth.uid()));

drop policy if exists "bookings_insert_own" on public.bookings;
create policy "bookings_insert_own"
on public.bookings for insert
with check (
  (auth.uid() = user_id)
  or (auth.uid() is null and user_id is null)
);

drop policy if exists "bookings_update_own" on public.bookings;
create policy "bookings_update_own"
on public.bookings for update
using (auth.uid() = user_id or public.is_admin(auth.uid()))
with check (auth.uid() = user_id or public.is_admin(auth.uid()));

drop policy if exists "bookings_delete_own" on public.bookings;
create policy "bookings_delete_own"
on public.bookings for delete
using (auth.uid() = user_id or public.is_admin(auth.uid()));

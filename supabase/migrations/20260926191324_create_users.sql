-- Enums

create type public.user_role as enum ('staff', 'parent', 'admin');
create type public.user_status as enum ('pending', 'active');

comment on type public.user_role is 'Allowed roles inside a daycare.';
comment on type public.user_status is 'Account lifecycle status.';

-- Table: public.users

create table public.users (
  id                    uuid primary key references auth.users (id) on delete cascade,
  daycare_id            uuid not null references public.daycares (id) on delete restrict,
  role                  public.user_role   not null,
  status                public.user_status not null default 'active',
  full_name             text not null,
  avatar_url            text,
  notify_on_post        boolean not null default true,
  daily_summary_enabled boolean not null default true,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

comment on table public.users is
  'Public profile linked to auth.users; one row per daycare member.';
comment on column public.users.id is
  'Matches auth.users.id; profile is deleted when the auth user is deleted.';
comment on column public.users.daycare_id is
  'Daycare this user belongs to; deleting the daycare is blocked while users exist.';
comment on column public.users.role is
  'Role inside the daycare.';
comment on column public.users.status is
  'Account status; defaults to active.';
comment on column public.users.full_name is
  'Display name.';
comment on column public.users.avatar_url is
  'Optional avatar URL (Storage bucket to be added in a future spec).';
comment on column public.users.notify_on_post is
  'Whether the user wants push/email notifications on new posts.';
comment on column public.users.daily_summary_enabled is
  'Whether the user wants a daily summary email.';

-- Indexes

create index users_daycare_id_idx on public.users (daycare_id);

-- Row Level Security

alter table public.users enable row level security;

-- Helpers / triggers

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger users_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

-- Returns the daycare_id of the currently authenticated user.
-- SECURITY DEFINER avoids infinite recursion when this function is used
-- inside RLS policies that reference public.users.
create or replace function public.current_daycare_id()
returns uuid
language sql stable
security definer set search_path = public
as $$
  select daycare_id from public.users where id = auth.uid();
$$;

comment on function public.current_daycare_id() is
  'Returns the authenticated user daycare_id; used by RLS policies.';

-- Trigger that creates a public profile whenever a new auth user is created.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, daycare_id, role, full_name)
  values (
    new.id,
    (new.raw_user_meta_data ->> 'daycare_id')::uuid,
    coalesce((new.raw_user_meta_data ->> 'role')::public.user_role, 'parent'),
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

comment on function public.handle_new_user() is
  'Creates the public.users profile after a new auth.users row is inserted.';

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS policies on public.users

create policy users_select_same_daycare on public.users
  for select to authenticated
  using (daycare_id = public.current_daycare_id());

create policy users_update_own on public.users
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- RLS policies on public.daycares (completes SPEC 07)

create policy daycares_select_own on public.daycares
  for select to authenticated
  using (id = public.current_daycare_id());

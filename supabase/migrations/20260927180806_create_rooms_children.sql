-- Migration: create rooms and children tables with RLS.

create type public.child_status as enum ('active', 'archived');
comment on type public.child_status is 'Lifecycle status for a child record.';

create table public.rooms (
  id         uuid primary key default gen_random_uuid(),
  daycare_id uuid not null references public.daycares (id) on delete restrict,
  name       text not null,
  created_at timestamptz not null default now()
);

comment on table public.rooms is 'Daycare rooms (e.g. Soles, Lunas, Arcoiris).';
comment on column public.rooms.daycare_id is 'Owning daycare.';
comment on column public.rooms.name is 'Display name of the room.';

create index rooms_daycare_id_idx on public.rooms (daycare_id);

alter table public.rooms enable row level security;

create table public.children (
  id            uuid primary key default gen_random_uuid(),
  room_id       uuid not null references public.rooms (id) on delete restrict,
  full_name     text not null,
  birth_date    date not null,
  enrolled_at   date not null default current_date,
  medical_notes text,
  allergy_tags  text[] not null default '{}',
  photo_consent boolean not null default true,
  status        public.child_status not null default 'active',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.children is 'Children enrolled in a daycare room.';
comment on column public.children.room_id is 'Assigned room.';
comment on column public.children.full_name is 'Full name of the child.';
comment on column public.children.birth_date is 'Date of birth.';
comment on column public.children.enrolled_at is 'Enrollment date; defaults to today.';
comment on column public.children.medical_notes is 'Free-form medical notes.';
comment on column public.children.allergy_tags is 'English allergy tags, e.g. {peanut,lactose}.';
comment on column public.children.photo_consent is 'Whether photo sharing is allowed.';
comment on column public.children.status is 'active or archived (soft delete).';

create index children_room_id_idx on public.children (room_id);

alter table public.children enable row level security;

create trigger children_updated_at
  before update on public.children
  for each row execute function public.set_updated_at();

-- Helper to read the authenticated user's role without triggering RLS recursion.
-- Placed in the private schema so it is not exposed via PostgREST.
create or replace function private.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.users where id = (select auth.uid())
$$;

comment on function private.current_user_role() is 'Returns the role of the current authenticated user; used by RLS policies.';

grant execute on function private.current_user_role() to authenticated;
revoke execute on function private.current_user_role() from public;

-- Rooms are read-only from the client; managed via seed/CLI.
create policy "rooms_select_own"
  on public.rooms
  for select
  to authenticated
  using (daycare_id = private.current_daycare_id());

-- Children can only be managed by staff/admin of the same daycare.
create policy "children_select_staff"
  on public.children
  for select
  to authenticated
  using (
    private.current_user_role() in ('staff', 'admin')
    and exists (
      select 1
      from public.rooms r
      where r.id = public.children.room_id
        and r.daycare_id = private.current_daycare_id()
    )
  );

create policy "children_insert_staff"
  on public.children
  for insert
  to authenticated
  with check (
    private.current_user_role() in ('staff', 'admin')
    and exists (
      select 1
      from public.rooms r
      where r.id = public.children.room_id
        and r.daycare_id = private.current_daycare_id()
    )
  );

create policy "children_update_staff"
  on public.children
  for update
  to authenticated
  using (
    private.current_user_role() in ('staff', 'admin')
    and exists (
      select 1
      from public.rooms r
      where r.id = public.children.room_id
        and r.daycare_id = private.current_daycare_id()
    )
  )
  with check (
    private.current_user_role() in ('staff', 'admin')
    and exists (
      select 1
      from public.rooms r
      where r.id = public.children.room_id
        and r.daycare_id = private.current_daycare_id()
    )
  );

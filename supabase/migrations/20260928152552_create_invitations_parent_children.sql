-- Enums

create type public.invitation_status as enum ('pending', 'accepted', 'expired', 'cancelled');
create type public.relationship_type as enum ('father', 'mother', 'guardian');

comment on type public.invitation_status is 'Lifecycle status of a parent invitation.';
comment on type public.relationship_type is 'Relationship of a guardian to a child.';

-- Table: public.invitations

create table public.invitations (
  id           uuid primary key default gen_random_uuid(),
  child_id     uuid not null references public.children (id) on delete cascade,
  invited_by   uuid not null references public.users (id) on delete restrict,
  full_name    text not null,
  email        text not null,
  relationship public.relationship_type not null,
  code         text not null unique,
  status       public.invitation_status not null default 'pending',
  expires_at   timestamptz not null,
  accepted_at  timestamptz,
  created_at   timestamptz not null default now()
);

comment on table public.invitations is 'Invitations created by staff to link a parent/guardian to a child.';
comment on column public.invitations.child_id is 'Child the invitee will be linked to.';
comment on column public.invitations.invited_by is 'Staff member who created the invitation.';
comment on column public.invitations.full_name is 'Display name of the invited guardian.';
comment on column public.invitations.email is 'Email address the invitation is sent to; must match the signup email.';
comment on column public.invitations.relationship is 'Guardian relationship to the child.';
comment on column public.invitations.code is 'Short unique invitation code.';
comment on column public.invitations.status is 'Pending until accepted; expired/cancelled are terminal.';
comment on column public.invitations.expires_at is 'Invitation expiration timestamp (currently 7 days after creation).';
comment on column public.invitations.accepted_at is 'Timestamp when the invitation was accepted.';

-- Table: public.parent_children

create table public.parent_children (
  id           uuid primary key default gen_random_uuid(),
  parent_id    uuid not null references public.users (id) on delete cascade,
  child_id     uuid not null references public.children (id) on delete cascade,
  relationship public.relationship_type not null,
  created_at   timestamptz not null default now(),
  unique (parent_id, child_id)
);

comment on table public.parent_children is 'Many-to-many link between guardians and children, with relationship type.';
comment on column public.parent_children.parent_id is 'Linked guardian (public.users, role parent).';
comment on column public.parent_children.child_id is 'Linked child.';
comment on column public.parent_children.relationship is 'Relationship of this guardian to the child.';

-- Indexes

create index invitations_child_id_idx on public.invitations (child_id);
create index parent_children_parent_id_idx on public.parent_children (parent_id);
create index parent_children_child_id_idx on public.parent_children (child_id);

-- Row Level Security

alter table public.invitations enable row level security;
alter table public.parent_children enable row level security;

-- Trigger: extend handle_new_user to atomically accept invitations on signup.
-- The user profile insert is preserved; if an invitation_id is present in
-- raw_user_meta_data, we validate and accept it in the same transaction.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  inv_id uuid;
  inv_record public.invitations%rowtype;
begin
  -- Create the public profile as before.
  insert into public.users (id, daycare_id, role, full_name)
  values (
    new.id,
    (new.raw_user_meta_data ->> 'daycare_id')::uuid,
    coalesce((new.raw_user_meta_data ->> 'role')::public.user_role, 'parent'),
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1))
  );

  -- If this signup came from an invitation, accept it atomically.
  if new.raw_user_meta_data ? 'invitation_id' then
    inv_id := (new.raw_user_meta_data ->> 'invitation_id')::uuid;

    select * into inv_record
    from public.invitations
    where id = inv_id
    for update;

    if inv_record is null then
      raise exception 'Invitation not found';
    end if;

    if inv_record.status != 'pending' then
      raise exception 'Invitation is not pending';
    end if;

    if inv_record.expires_at <= now() then
      raise exception 'Invitation has expired';
    end if;

    if lower(inv_record.email) != lower(new.email) then
      raise exception 'Email does not match invitation';
    end if;

    update public.invitations
    set status = 'accepted', accepted_at = now()
    where id = inv_id;

    insert into public.parent_children (parent_id, child_id, relationship)
    values (new.id, inv_record.child_id, inv_record.relationship);
  end if;

  return new;
end;
$$;

comment on function public.handle_new_user() is
  'Creates the public.users profile after a new auth.users row is inserted; atomically accepts an invitation when invitation_id is present in metadata.';

-- Function: lookup an invitation by its short code for the activation screen.
-- Exposed to anon because the activation page is accessed without a session.

create or replace function public.invitation_by_code(p_code text)
returns table (
  child_full_name text,
  room_name       text,
  daycare_id      uuid,
  full_name       text,
  email           text,
  relationship    public.relationship_type,
  status          public.invitation_status,
  expires_at      timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.full_name::text as child_full_name,
    r.name::text      as room_name,
    r.daycare_id,
    i.full_name,
    i.email,
    i.relationship,
    i.status,
    i.expires_at
  from public.invitations i
  join public.children c on c.id = i.child_id
  join public.rooms r on r.id = c.room_id
  where i.code = lower(p_code);
$$;

comment on function public.invitation_by_code(text) is
  'Returns invitation details by code for the public activation screen.';

grant execute on function public.invitation_by_code(text) to anon, authenticated;

-- RLS policies: invitations

create policy invitations_select_staff on public.invitations
  for select to authenticated
  using (
    current_user_role() in ('staff','admin')
    and exists (
      select 1
      from public.children c
      join public.rooms r on r.id = c.room_id
      where c.id = child_id and r.daycare_id = current_daycare_id()
    )
  );

create policy invitations_insert_staff on public.invitations
  for insert to authenticated
  with check (
    current_user_role() in ('staff','admin')
    and exists (
      select 1
      from public.children c
      join public.rooms r on r.id = c.room_id
      where c.id = child_id and r.daycare_id = current_daycare_id()
    )
  );

create policy invitations_cancel_staff on public.invitations
  for update to authenticated
  using (
    current_user_role() in ('staff','admin')
    and status = 'pending'
    and exists (
      select 1
      from public.children c
      join public.rooms r on r.id = c.room_id
      where c.id = child_id and r.daycare_id = current_daycare_id()
    )
  )
  with check (status = 'cancelled');

-- RLS policies: parent_children

create policy parent_children_select_staff on public.parent_children
  for select to authenticated
  using (
    current_user_role() in ('staff','admin')
    and exists (
      select 1
      from public.children c
      join public.rooms r on r.id = c.room_id
      where c.id = child_id and r.daycare_id = current_daycare_id()
    )
  );

create policy parent_children_select_own on public.parent_children
  for select to authenticated
  using (parent_id = auth.uid());

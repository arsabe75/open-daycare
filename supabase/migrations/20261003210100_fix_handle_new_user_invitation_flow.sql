-- Migration: fix_handle_new_user_invitation_flow
--
-- Security fix: the auth.users trigger previously trusted raw_user_meta_data
-- for daycare_id and role. A self-registered user could therefore join any
-- daycare and choose any role (including admin). This migration makes the
-- validated invitation the only trusted self-signup path and derives all
-- authorization attributes from the invitation itself.
--
-- BREAKING CHANGE: creating a public.users profile by passing raw
-- daycare_id/role in auth metadata is no longer supported. Staff/admin
-- profiles must be created through a secure server-side flow (see
-- private.create_staff_profile below) or by inserting into public.users
-- directly with a privileged role.

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  inv_id uuid;
  inv_record public.invitations%rowtype;
  v_daycare_id uuid;
begin
  if new.raw_user_meta_data ->> 'invitation_id' is not null then
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

    -- Derive the daycare from the invitation's child -> room. Never trust the
    -- daycare_id value submitted in raw_user_meta_data.
    select r.daycare_id into v_daycare_id
    from public.children c
    join public.rooms r on r.id = c.room_id
    where c.id = inv_record.child_id;

    if v_daycare_id is null then
      raise exception 'Could not determine daycare from invitation';
    end if;

    -- Create the parent profile using only validated invitation data.
    -- ON CONFLICT handles the edge case where the auth user already exists.
    insert into public.users (id, daycare_id, role, full_name, status)
    values (
      new.id,
      v_daycare_id,
      'parent',
      coalesce(inv_record.full_name, split_part(new.email, '@', 1)),
      'active'
    )
    on conflict (id) do update set
      daycare_id = excluded.daycare_id,
      role = 'parent',
      full_name = excluded.full_name,
      status = 'active';

    update public.invitations
    set status = 'accepted', accepted_at = now()
    where id = inv_id;

    insert into public.parent_children (parent_id, child_id, relationship)
    values (new.id, inv_record.child_id, inv_record.relationship);
  end if;

  return new;
end;
$$;

comment on function private.handle_new_user() is
  'Creates the public.users profile after auth.users insertion using only validated invitation data.';


-- Optional secure helper for server-side staff/admin creation.
-- Call this from a Server Action / Edge Function running with service_role,
-- or expose it as a SECURITY DEFINER RPC only after verifying the caller is
-- an admin of the target daycare.
create or replace function private.create_staff_profile(
  p_user_id uuid,
  p_daycare_id uuid,
  p_role user_role,
  p_full_name text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_role not in ('staff', 'admin') then
    raise exception 'Only staff or admin roles are allowed';
  end if;

  insert into public.users (id, daycare_id, role, full_name, status)
  values (p_user_id, p_daycare_id, p_role, p_full_name, 'active');
end;
$$;

comment on function private.create_staff_profile(uuid, uuid, user_role, text) is
  'Server-side helper to create staff/admin profiles without trusting client metadata.';

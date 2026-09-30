-- Add invitation id to invitation_by_code so the activation flow can pass it
-- in the signup metadata for the trigger to accept the invitation.

-- Drop and recreate because adding a column changes the return type.
drop function if exists public.invitation_by_code(text);

create function public.invitation_by_code(p_code text)
returns table (
  id              uuid,
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
    i.id,
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

grant execute on function public.invitation_by_code(text) to anon, authenticated;

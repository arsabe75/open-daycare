-- invitation_by_code must be case-insensitive because codes are displayed
-- in uppercase but can be typed or linked in any case.

create or replace function public.invitation_by_code(p_code text)
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
  where lower(i.code) = lower(p_code);
$$;

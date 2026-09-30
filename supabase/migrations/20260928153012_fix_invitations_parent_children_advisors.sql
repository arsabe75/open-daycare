-- Fix advisor warnings introduced by create_invitations_parent_children.

-- Add missing index on the invited_by foreign key.
create index if not exists invitations_invited_by_idx on public.invitations (invited_by);

-- Revoke RPC access to internal security-definer helpers.
-- They remain usable inside RLS policies and triggers (owned by the same role).
revoke execute on function public.current_daycare_id() from anon, authenticated;
revoke execute on function public.current_user_role() from anon, authenticated;
revoke execute on function public.handle_new_user() from anon, authenticated;

-- Combine the two permissive SELECT policies on parent_children into one
-- and use (select auth.uid()) to avoid per-row evaluation of auth.uid().
drop policy if exists parent_children_select_staff on public.parent_children;
drop policy if exists parent_children_select_own on public.parent_children;

create policy parent_children_select on public.parent_children
  for select to authenticated
  using (
    parent_id = (select auth.uid())
    or (
      current_user_role() in ('staff','admin')
      and exists (
        select 1
        from public.children c
        join public.rooms r on r.id = c.room_id
        where c.id = child_id and r.daycare_id = current_daycare_id()
      )
    )
  );

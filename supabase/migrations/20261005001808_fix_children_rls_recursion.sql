
create or replace function private.child_in_daycare(p_child_id uuid, p_daycare_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.children c
    join public.rooms r on r.id = c.room_id
    where c.id = p_child_id and r.daycare_id = p_daycare_id
  );
$$;

comment on function private.child_in_daycare(uuid, uuid) is 'Returns true if a child belongs to the given daycare.';

drop policy if exists children_select_staff on public.children;
drop policy if exists children_select_parent on public.children;

create policy children_select_staff on public.children
  for select to authenticated
  using (
    private.current_user_role() in ('staff','admin')
    and private.child_in_daycare(public.children.id, private.current_daycare_id())
  );

create policy children_select_parent on public.children
  for select to authenticated
  using (
    exists (
      select 1
      from public.parent_children pcc
      where pcc.parent_id = (select auth.uid())
        and pcc.child_id = public.children.id
    )
  );

drop policy if exists parent_children_select_staff on public.parent_children;

create policy parent_children_select_staff on public.parent_children
  for select to authenticated
  using (
    private.current_user_role() in ('staff','admin')
    and private.child_in_daycare(public.parent_children.child_id, private.current_daycare_id())
  );
;

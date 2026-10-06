
drop policy if exists parent_children_select on public.parent_children;

create policy parent_children_select_own on public.parent_children
  for select to authenticated
  using (parent_id = (select auth.uid()));

create policy parent_children_select_staff on public.parent_children
  for select to authenticated
  using (
    private.current_user_role() in ('staff','admin')
    and exists (
      select 1
      from public.children c
      join public.rooms r on r.id = c.room_id
      where c.id = public.parent_children.child_id
        and r.daycare_id = private.current_daycare_id()
    )
  );
;


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
;

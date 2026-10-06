
create or replace function private.post_daycare_id(p_post_id uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select r.daycare_id
  from public.posts p
  left join public.rooms r on r.id = p.room_id
  where p.id = p_post_id;
$$;

comment on function private.post_daycare_id(uuid) is 'Returns the daycare of a post via its room.';

create or replace function private.post_daycare_id_safe(p_post_id uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select r.daycare_id from public.posts p join public.rooms r on r.id = p.room_id where p.id = p_post_id),
    (select r2.daycare_id
     from public.post_children pc
     join public.children c on c.id = pc.child_id
     join public.rooms r2 on r2.id = c.room_id
     where pc.post_id = p_post_id
     limit 1)
  );
$$;

comment on function private.post_daycare_id_safe(uuid) is 'Returns the daycare of a post, falling back to any tagged child room.';

create policy posts_select_staff on public.posts
  for select to authenticated
  using (
    private.current_user_role() in ('staff','admin')
    and private.current_daycare_id() = private.post_daycare_id_safe(id)
  );

create policy posts_select_parent on public.posts
  for select to authenticated
  using (
    private.current_user_role() = 'parent'
    and (
      exists (
        select 1
        from public.post_children pc
        join public.parent_children pcc on pcc.child_id = pc.child_id
        where pc.post_id = public.posts.id
          and pcc.parent_id = (select auth.uid())
      )
      or (
        public.posts.type = 'announcement'
        and public.posts.room_id is not null
        and exists (
          select 1
          from public.parent_children pcc
          join public.children c on c.id = pcc.child_id
          where pcc.parent_id = (select auth.uid())
            and c.room_id = public.posts.room_id
        )
      )
    )
  );

create policy posts_insert_staff on public.posts
  for insert to authenticated
  with check (
    private.current_user_role() in ('staff','admin')
    and author_id = (select auth.uid())
    and (
      room_id is null
      or exists (
        select 1 from public.rooms r
        where r.id = room_id and r.daycare_id = private.current_daycare_id()
      )
    )
  );

create policy post_children_select_staff on public.post_children
  for select to authenticated
  using (
    private.current_user_role() in ('staff','admin')
    and private.current_daycare_id() = private.post_daycare_id_safe(post_id)
  );

create policy post_children_select_parent on public.post_children
  for select to authenticated
  using (
    private.current_user_role() = 'parent'
    and exists (
      select 1 from public.posts p where p.id = post_id
      and (
        exists (
          select 1
          from public.post_children pc
          join public.parent_children pcc on pcc.child_id = pc.child_id
          where pc.post_id = p.id
            and pcc.parent_id = (select auth.uid())
        )
        or (
          p.type = 'announcement'
          and p.room_id is not null
          and exists (
            select 1
            from public.parent_children pcc
            join public.children c on c.id = pcc.child_id
            where pcc.parent_id = (select auth.uid())
              and c.room_id = p.room_id
          )
        )
      )
    )
  );

create policy post_children_insert_staff on public.post_children
  for insert to authenticated
  with check (
    private.current_user_role() in ('staff','admin')
    and exists (
      select 1
      from public.children c
      join public.rooms r on r.id = c.room_id
      where c.id = child_id and r.daycare_id = private.current_daycare_id()
    )
  );

create policy post_photos_select_staff on public.post_photos
  for select to authenticated
  using (
    private.current_user_role() in ('staff','admin')
    and private.current_daycare_id() = private.post_daycare_id_safe(post_id)
  );

create policy post_photos_select_parent on public.post_photos
  for select to authenticated
  using (
    private.current_user_role() = 'parent'
    and exists (
      select 1 from public.posts p where p.id = post_id
      and (
        exists (
          select 1
          from public.post_children pc
          join public.parent_children pcc on pcc.child_id = pc.child_id
          where pc.post_id = p.id
            and pcc.parent_id = (select auth.uid())
        )
        or (
          p.type = 'announcement'
          and p.room_id is not null
          and exists (
            select 1
            from public.parent_children pcc
            join public.children c on c.id = pcc.child_id
            where pcc.parent_id = (select auth.uid())
              and c.room_id = p.room_id
          )
        )
      )
    )
  );

create policy post_photos_insert_staff on public.post_photos
  for insert to authenticated
  with check (
    private.current_user_role() in ('staff','admin')
    and private.current_daycare_id() = private.post_daycare_id_safe(post_id)
  );

create policy reactions_select on public.reactions
  for select to authenticated
  using (
    private.current_user_role() in ('staff','admin')
    and private.current_daycare_id() = private.post_daycare_id_safe(post_id)
  );

create policy reactions_select_parent on public.reactions
  for select to authenticated
  using (
    private.current_user_role() = 'parent'
    and exists (
      select 1 from public.posts p where p.id = post_id
      and (
        exists (
          select 1
          from public.post_children pc
          join public.parent_children pcc on pcc.child_id = pc.child_id
          where pc.post_id = p.id
            and pcc.parent_id = (select auth.uid())
        )
        or (
          p.type = 'announcement'
          and p.room_id is not null
          and exists (
            select 1
            from public.parent_children pcc
            join public.children c on c.id = pcc.child_id
            where pcc.parent_id = (select auth.uid())
              and c.room_id = p.room_id
          )
        )
      )
    )
  );

create policy reactions_insert_own on public.reactions
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and (
      (private.current_user_role() in ('staff','admin')
       and private.current_daycare_id() = private.post_daycare_id_safe(post_id))
      or
      (private.current_user_role() = 'parent'
       and exists (
         select 1 from public.posts p where p.id = post_id
         and (
           exists (
             select 1
             from public.post_children pc
             join public.parent_children pcc on pcc.child_id = pc.child_id
             where pc.post_id = p.id
               and pcc.parent_id = (select auth.uid())
           )
           or (
             p.type = 'announcement'
             and p.room_id is not null
             and exists (
               select 1
               from public.parent_children pcc
               join public.children c on c.id = pcc.child_id
               where pcc.parent_id = (select auth.uid())
                 and c.room_id = p.room_id
             )
           )
         )
       ))
    )
  );

create policy reactions_delete_own on public.reactions
  for delete to authenticated
  using (user_id = (select auth.uid()));

create policy comments_select on public.comments
  for select to authenticated
  using (
    private.current_user_role() in ('staff','admin')
    and private.current_daycare_id() = private.post_daycare_id_safe(post_id)
  );

create policy comments_select_parent on public.comments
  for select to authenticated
  using (
    private.current_user_role() = 'parent'
    and exists (
      select 1 from public.posts p where p.id = post_id
      and (
        exists (
          select 1
          from public.post_children pc
          join public.parent_children pcc on pcc.child_id = pc.child_id
          where pc.post_id = p.id
            and pcc.parent_id = (select auth.uid())
        )
        or (
          p.type = 'announcement'
          and p.room_id is not null
          and exists (
            select 1
            from public.parent_children pcc
            join public.children c on c.id = pcc.child_id
            where pcc.parent_id = (select auth.uid())
              and c.room_id = p.room_id
          )
        )
      )
    )
  );

create policy comments_insert on public.comments
  for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and (
      (private.current_user_role() in ('staff','admin')
       and private.current_daycare_id() = private.post_daycare_id_safe(post_id))
      or
      (private.current_user_role() = 'parent'
       and exists (
         select 1 from public.posts p where p.id = post_id
         and (
           exists (
             select 1
             from public.post_children pc
             join public.parent_children pcc on pcc.child_id = pc.child_id
             where pc.post_id = p.id
               and pcc.parent_id = (select auth.uid())
           )
           or (
             p.type = 'announcement'
             and p.room_id is not null
             and exists (
               select 1
               from public.parent_children pcc
               join public.children c on c.id = pcc.child_id
               where pcc.parent_id = (select auth.uid())
                 and c.room_id = p.room_id
             )
           )
         )
       ))
    )
  );

insert into storage.buckets (id, name, public)
values ('post-photos', 'post-photos', false)
on conflict (id) do nothing;

create policy "post_photos_insert_staff"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'post-photos'
    and private.current_user_role() in ('staff','admin')
    and (storage.foldername(name))[1] = (select private.current_daycare_id()::text)
  );

create policy "post_photos_select_staff"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'post-photos'
    and private.current_user_role() in ('staff','admin')
    and (storage.foldername(name))[1] = (select private.current_daycare_id()::text)
  );

create policy "post_photos_select_parent"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'post-photos'
    and private.current_user_role() = 'parent'
    and (storage.foldername(name))[1] = (select private.current_daycare_id()::text)
  );

create policy "post_photos_delete_staff"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'post-photos'
    and private.current_user_role() in ('staff','admin')
    and (storage.foldername(name))[1] = (select private.current_daycare_id()::text)
  );

create policy "post_photos_update_staff"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'post-photos'
    and private.current_user_role() in ('staff','admin')
    and (storage.foldername(name))[1] = (select private.current_daycare_id()::text)
  )
  with check (
    bucket_id = 'post-photos'
    and private.current_user_role() in ('staff','admin')
    and (storage.foldername(name))[1] = (select private.current_daycare_id()::text)
  );
;

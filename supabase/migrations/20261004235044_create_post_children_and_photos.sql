
create table public.post_children (
  post_id  uuid not null references public.posts (id) on delete cascade,
  child_id uuid not null references public.children (id) on delete cascade,
  primary key (post_id, child_id)
);

comment on table public.post_children is 'Many-to-many link between posts and tagged children.';

create index post_children_post_id_idx on public.post_children (post_id);
create index post_children_child_id_idx on public.post_children (child_id);

alter table public.post_children enable row level security;

create table public.post_photos (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.posts (id) on delete cascade,
  url        text not null,
  width      int,
  height     int,
  position   int not null default 0,
  created_at timestamptz not null default now()
);

comment on table public.post_photos is 'Photos attached to a post.';
comment on column public.post_photos.url is 'Storage path inside the post-photos bucket.';

create index post_photos_post_id_idx on public.post_photos (post_id);

alter table public.post_photos enable row level security;
;


create type public.post_type as enum (
  'food', 'nap', 'activity', 'achievement', 'mood', 'photo', 'announcement'
);

comment on type public.post_type is 'Kind of feed post shown in the UI.';

create table public.posts (
  id           uuid primary key default gen_random_uuid(),
  author_id    uuid not null references public.users (id) on delete restrict,
  room_id      uuid references public.rooms (id) on delete set null,
  type         public.post_type not null,
  title        text,
  body         text not null,
  published_at timestamptz not null default now(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on table public.posts is 'Feed posts created by staff/admin.';
comment on column public.posts.author_id is 'Staff/admin that authored the post.';
comment on column public.posts.room_id is 'Optional room scope (e.g. for announcements).';
comment on column public.posts.type is 'UI category of the post.';
comment on column public.posts.title is 'Optional title, mainly for announcements.';
comment on column public.posts.body is 'Main text content.';
comment on column public.posts.published_at is 'Moment the post becomes visible.';

create index posts_author_id_idx on public.posts (author_id);
create index posts_room_id_idx on public.posts (room_id);
create index posts_published_at_idx on public.posts (published_at desc);

alter table public.posts enable row level security;

create trigger posts_updated_at
  before update on public.posts
  for each row execute function public.set_updated_at();
;

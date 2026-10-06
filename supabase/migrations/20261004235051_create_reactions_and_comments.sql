
create table public.reactions (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.posts (id) on delete cascade,
  user_id    uuid not null references public.users (id) on delete cascade,
  type       text not null default 'love',
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);

comment on table public.reactions is 'Parent/staff reactions to a post.';

create index reactions_post_id_idx on public.reactions (post_id);
create index reactions_user_id_idx on public.reactions (user_id);

alter table public.reactions enable row level security;

create table public.comments (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.posts (id) on delete cascade,
  author_id  uuid not null references public.users (id) on delete restrict,
  body       text not null,
  created_at timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on table public.comments is 'Comments on posts.';

create index comments_post_id_idx on public.comments (post_id);
create index comments_author_id_idx on public.comments (author_id);

alter table public.comments enable row level security;

create trigger comments_updated_at
  before update on public.comments
  for each row execute function public.set_updated_at();
;

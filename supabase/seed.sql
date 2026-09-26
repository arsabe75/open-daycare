insert into public.daycares (id, name)
values ('00000000-0000-0000-0000-000000000001', 'Guardería Sala Soles')
on conflict (id) do nothing;

insert into auth.users (
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values (
  '00000000-0000-0000-0000-000000000002',
  'authenticated',
  'authenticated',
  'arsabe75@gmail.com',
  crypt('Homero&75', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"daycare_id":"00000000-0000-0000-0000-000000000001","role":"staff","full_name":"Arturo Sandoval"}',
  now(),
  now()
)
on conflict (id) do nothing;

insert into auth.identities (
  provider_id,
  user_id,
  identity_data,
  provider,
  created_at,
  updated_at
)
values (
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000002',
  jsonb_build_object(
    'sub', '00000000-0000-0000-0000-000000000002',
    'email', 'arsabe75@gmail.com'
  ),
  'email',
  now(),
  now()
)
on conflict do nothing;

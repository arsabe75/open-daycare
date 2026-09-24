insert into public.daycares (id, name)
values ('00000000-0000-0000-0000-000000000001', 'Guardería Sala Soles')
on conflict (id) do nothing;

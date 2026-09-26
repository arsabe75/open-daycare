# SPEC 08 — Tabla `users`, enums y trigger de perfil

> **Estado:** Implementado
> **Depende de:** SPEC 07 (tabla `daycares` + flujo de migraciones CLI)
> **Fecha:** 2026-09-26
> **Objetivo:** Crear en el proyecto remoto `zzlqzrhtkerovwzwcbfp` los enums `user_role`/`user_status`, la tabla `users` con RLS (políticas propias y de `daycares`), el trigger que crea el perfil desde `auth.users`, y un usuario staff de prueba vía seed.

## Alcance

**Dentro:**

- `supabase/migrations/<timestamp>_create_users.sql` (generado con `npx supabase migration new create_users`):
  - **Enums:** `public.user_role` (`staff`, `parent`, `admin`) y `public.user_status` (`pending`, `active`). Solo estos dos; el resto se crea con sus tablas.
  - **Tabla `public.users`** según el diccionario:
    - `id uuid primary key references auth.users (id) on delete cascade` — sin `gen_random_uuid()`: el UUID viene de Auth.
    - `daycare_id uuid not null references public.daycares (id) on delete restrict` — un usuario pertenece a exactamente una guardería; una guardería tiene muchos usuarios.
    - `role user_role not null`, `status user_status not null default 'active'`.
    - `full_name text not null`, `avatar_url text` (nullable).
    - `notify_on_post boolean not null default true`, `daily_summary_enabled boolean not null default true`.
    - `created_at` / `updated_at timestamptz not null default now()`.
  - **Índice** `users_daycare_id_idx on public.users (daycare_id)` (búsquedas por guardería, FK).
  - **Trigger `updated_at`:** función `public.set_updated_at()` + trigger `BEFORE UPDATE` en `users`.
  - **Función helper `public.current_daycare_id()`:** `stable`, `security definer`, `set search_path = public` — devuelve el `daycare_id` del usuario autenticado. Evita recursión infinita en políticas RLS que consultan la propia tabla.
  - **Trigger de perfil:** función `public.handle_new_user()` (`security definer`, `set search_path = public`) que lee `raw_user_meta_data` (`daycare_id`, `role`, `full_name`) e inserta en `public.users`; defaults defensivos: `role` → `parent`, `full_name` → parte local del email. Trigger `AFTER INSERT ON auth.users FOR EACH ROW`.
  - **RLS en `users`** (activado, sin INSERT/DELETE para clientes — el perfil lo crea el trigger):
    - `users_select_same_daycare`: SELECT de filas del propio daycare (`daycare_id = current_daycare_id()` — incluye la propia fila; el staff puede ver a los padres de su guardería).
    - `users_update_own`: UPDATE solo de la propia fila (`using`/`with check` `id = auth.uid()`).
  - **RLS en `daycares`** (pendiente del SPEC 07):
    - `daycares_select_own`: SELECT donde `id = current_daycare_id()`. Sin INSERT/UPDATE/DELETE para clientes.
  - `comment on table/column` breves en inglés.
- `supabase/seed.sql` (extender, idempotente):
  - **Usuario staff de prueba:** insert directo en `auth.users` con UUID fijo `00000000-0000-0000-0000-000000000002`, email `arsabe75@gmail.com`, password `Homero&75` hasheada con `crypt(..., gen_salt('bf'))`, `aud/role = 'authenticated'`, `email_confirmed_at = now()`, `raw_app_meta_data` de provider email y `raw_user_meta_data` con `daycare_id = '00000000-0000-0000-0000-000000000001'`, `role = 'staff'`, `full_name = 'Arturo Sandoval'`; `on conflict (id) do nothing`.
  - Insert correspondiente en `auth.identities` (provider `email`) para que el login funcione; `on conflict do nothing`.
  - El trigger `handle_new_user` crea automáticamente la fila en `public.users`.
- Aplicar con `npx supabase db push` y cargar el seed en remoto (`--include-seed` o vía MCP, como en SPEC 07).
- Verificación remota vía MCP: `list_tables` (estructura de `users`), `list_migrations`, select del staff en `public.users`, pruebas RLS (consulta anónima no devuelve filas), `get_advisors` security/performance sin avisos nuevos.

**Fuera de alcance (para specs futuros):**

- Resto de enums (`relationship_type`, `invitation_status`, `post_type`, `child_status`) y tablas (`rooms`, `children`, …).
- Conexión Next.js (`@supabase/ssr`, clientes en `lib/supabase/`), flujo de signup real desde la app y reemplazo de mocks de SPEC 01–06.
- Gestión de `avatar_url` (subida a Storage), preferencias de notificación en la UI.
- Políticas de escritura sobre `daycares` (solo el seed/CLI crean guarderías).

## Modelo de datos

```sql
-- supabase/migrations/<timestamp>_create_users.sql (esqueleto)
create type public.user_role   as enum ('staff', 'parent', 'admin');
create type public.user_status as enum ('pending', 'active');

create table public.users (
  id                    uuid primary key references auth.users (id) on delete cascade,
  daycare_id            uuid not null references public.daycares (id) on delete restrict,
  role                  public.user_role   not null,
  status                public.user_status not null default 'active',
  full_name             text not null,
  avatar_url            text,
  notify_on_post        boolean not null default true,
  daily_summary_enabled boolean not null default true,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index users_daycare_id_idx on public.users (daycare_id);
alter table public.users enable row level security;

create function public.current_daycare_id() returns uuid
language sql stable security definer set search_path = public as $$
  select daycare_id from public.users where id = auth.uid()
$$;

create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, daycare_id, role, full_name)
  values (
    new.id,
    (new.raw_user_meta_data ->> 'daycare_id')::uuid,
    coalesce((new.raw_user_meta_data ->> 'role')::public.user_role, 'parent'),
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- + set_updated_at() y políticas RLS de users y daycares
```

No hay código TypeScript nuevo; solo cambian archivos dentro de `supabase/`.

## Plan de implementación

1. Consultar Context7 (`supabase/docs`): trigger `handle_new_user` actual, columnas requeridas por `auth.users`/`auth.identities` para seeds, y flags vigentes de `db push --include-seed`.
2. `npx supabase migration new create_users` y escribir el SQL completo (enums, tabla, índices, funciones, triggers, RLS de `users` y `daycares`).
3. Extender `supabase/seed.sql` con el usuario staff (auth.users + auth.identities), manteniendo el seed de `daycares`.
4. `npx supabase db push` y aplicar el seed en remoto.
5. Verificación MCP: `list_tables verbose` (columnas/defaults/PK/FK de `users`), `list_migrations` (`create_daycares` + `create_users`), `select * from public.users` → 1 fila staff con `role='staff'`, `daycare_id` del seed, `status='active'`.
6. Verificación RLS: consulta con API key anónima → 0 filas en `users` y `daycares`; re-ejecutar el seed no duplica filas.
7. `get_advisors` security y performance sin avisos nuevos atribuibles a `users`/`daycares` (el INFO `rls_enabled_no_policy` de `daycares` debe desaparecer al crear la política).
8. Verificación del repo: `npm run lint`, `npx tsc --noEmit`, `npm run build` siguen pasando.

## Criterios de aceptación

- [x] La migración `<timestamp>_create_users.sql` existe en `supabase/migrations/` y está registrada en el historial remoto.
- [x] Existen los enums `public.user_role` (staff/parent/admin) y `public.user_status` (pending/active), y únicamente esos dos nuevos.
- [x] `public.users` tiene exactamente las columnas del diccionario con tipos, defaults y `daycare_id NOT NULL` → FK a `daycares`; `id` FK a `auth.users` con `ON DELETE CASCADE`; índice por `daycare_id`; `updated_at` se actualiza solo vía trigger.
- [x] RLS activado en `users` con políticas SELECT (mismo daycare) y UPDATE (fila propia); sin INSERT/DELETE. RLS en `daycares` con SELECT (`id = current_daycare_id()`); consultas anónimas no devuelven filas.
- [x] El trigger `on_auth_user_created` existe y todo nuevo usuario en `auth.users` genera su perfil en `public.users` leyendo `raw_user_meta_data`.
- [x] El seed creó el usuario staff: login `arsabe75@gmail.com` / `Homero&75` existe en `auth.users` + `auth.identities`, y su perfil en `public.users` tiene UUID `00000000-0000-0000-0000-000000000002`, `role='staff'`, `full_name='Arturo Sandoval'`, daycare `00000000-0000-0000-0000-000000000001`; re-ejecutar el seed es idempotente.
- [x] `get_advisors` no reporta avisos nuevos por `users`/`daycares` (search_path fijo en las funciones SECURITY DEFINER).
- [x] `npm run lint`, `npx tsc --noEmit` y `npm run build` pasan sin errores.

## Decisiones

- **Sí:** solo los enums que `users` necesita; los demás se crean con sus tablas (evita DDL muerto).
- **Sí:** trigger en `auth.users` con `security definer` y `search_path` explícito — sigue la nota del diccionario y la best practice `function_search_path_mutable`.
- **Sí:** función helper `current_daycare_id()` en vez de subselects a `users` dentro de las políticas — evita recursión RLS y centraliza la lógica de pertenencia.
- **Sí:** seed con insert directo en `auth.users`/`auth.identities` (UUID fijo, `on conflict do nothing`) — sin Docker ni app conectada, es la única vía idempotente desde SQL; documentado como patrón de prueba, no de producción.
- **Sí:** SELECT amplio por daycare (no solo fila propia) — el staff necesita ver a los padres de su guardería (base para SPEC futuros: invitaciones, feed).
- **No:** política de escritura en `daycares` ni rol `admin` global sin daycare; el modelo es multi-tenant simple por guardería.
- **Sí:** `on delete restrict` en `daycare_id` — no se puede borrar una guardería con usuarios.

## Riesgos

- El insert directo en `auth.users` depende de permisos del rol `postgres` sobre el schema `auth` en el proyecto hospedado; si falla, el fallback es el Auth Admin API con la `service_role` key (queda registrado como alternativa).
- Las columnas obligatorias de `auth.users`/`auth.identities` pueden variar entre versiones de Supabase Auth; el paso 1 (Context7) y la verificación del paso 5 lo cubren.
- Si `db push --include-seed` no existe/funciona en la versión instalada, aplicar el seed vía MCP `execute_sql` (como ya hizo SPEC 07).

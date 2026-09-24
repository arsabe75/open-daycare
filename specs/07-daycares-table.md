# SPEC 07 — Tabla `daycares` con patrón de migraciones

> **Estado:** Aprobado
> **Depende de:** — (primer spec de base de datos; los SPEC 01–06 son solo UI)
> **Fecha:** 2026-09-24
> **Objetivo:** Dejar configurado el flujo de migraciones de Supabase CLI en el repo y crear la tabla `daycares` (con RLS activado y seed inicial) en el proyecto remoto `zzlqzrhtkerovwzwcbfp`.

## Alcance

**Dentro:**

- Instalar el CLI de Supabase como devDependency (`npm install -D supabase`) y ejecutar `supabase init` → genera `supabase/config.toml` (+ `.gitignore` para `supabase/.temp` y `supabase/.branches`).
- `supabase link --project-ref zzlqzrhtkerovwzwcbfp` usando `SUPABASE_DB_PASSWORD` (ya está en `.env`).
- **Limpieza del historial remoto:** borrar vía MCP (`execute_sql`) las filas de prueba de `supabase_migrations.schema_migrations` (`20260923232449` create_test_table, `20260923232831` drop_test_table) para arrancar con historial limpio y coherente con el repo.
- `supabase/migrations/<timestamp>_create_daycares.sql` (generado con `supabase migration new create_daycares`):
  - `create table public.daycares` — `id uuid PK default gen_random_uuid()`, `name text not null`, `created_at timestamptz not null default now()`.
  - `alter table public.daycares enable row level security;` (sin políticas: deny-by-default hasta que exista `users`).
  - `comment on table public.daycares is '...';` breve.
- `supabase/seed.sql` (nuevo): insert idempotente de una guardería con UUID fijo `00000000-0000-0000-0000-000000000001`, nombre `Guardería Sala Soles`, `on conflict (id) do nothing`.
- Aplicar al remoto con `supabase db push` y cargar el seed en remoto (`db push --include-seed` o ejecutando `seed.sql` vía MCP).
- Verificación remota vía MCP: `list_tables` (columnas/PK correctas), `list_migrations` (solo `create_daycares`), consulta al seed y `get_advisors` (security/performance) sin avisos nuevos por `daycares`.

**Fuera de alcance (para specs futuros):**

- Resto de las tablas del diccionario (`users`, `rooms`, `children`, …), enums y triggers sobre `auth.users`.
- Políticas RLS concretas sobre `daycares` (llegan con el spec de `users`, que define quién puede ver qué).
- Conexión desde Next.js: `@supabase/ssr`, keys `NEXT_PUBLIC_*` en `.env`, clientes en `lib/supabase/`.
- Reemplazar los mocks en memoria de los SPEC 01–06 por datos reales.
- Stack local con Docker (`supabase start` / `db reset`): no hay Docker en esta máquina; el flujo es repo → remoto.

## Modelo de datos

```sql
-- supabase/migrations/<timestamp>_create_daycares.sql
create table public.daycares (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  created_at timestamptz not null default now()
);

alter table public.daycares enable row level security;

comment on table public.daycares is
  'Root entity: one row per daycare (guardería).';

-- supabase/seed.sql
insert into public.daycares (id, name)
values ('00000000-0000-0000-0000-000000000001', 'Guardería Sala Soles')
on conflict (id) do nothing;
```

No hay código TypeScript nuevo ni cambios en `lib/` o `app/`. Los únicos archivos del repo que cambian: `package.json`/`package-lock.json` (devDep `supabase`), `.gitignore` (o `supabase/.gitignore` generado por `init`) y la carpeta `supabase/` nueva.

## Plan de implementación

1. Limpiar el historial remoto: `execute_sql` (MCP) → `delete from supabase_migrations.schema_migrations where version in ('20260923232449','20260923232831');` y confirmar con `list_migrations`.
2. `npm install -D supabase` y `npx supabase init` (responder mínimo: sin generación de funciones Edge). Revisar el `.gitignore` generado.
3. `npx supabase link --project-ref zzlqzrhtkerovwzwcbfp` (usa `SUPABASE_DB_PASSWORD` de `.env`; tras la limpieza del paso 1, `migration fetch` no trae nada).
4. Consultar Context7 (`supabase/docs`) por el flujo actual de migraciones CLI (`migration new`, `db push`, seed) para no asumir flags desactualizados.
5. `npx supabase migration new create_daycares` y escribir el SQL de la sección anterior en el archivo generado.
6. Escribir `supabase/seed.sql`.
7. `npx supabase db push --include-seed` (o `db push` + aplicar `seed.sql` vía MCP si el flag no existe en la versión instalada).
8. Verificación remota vía MCP: `list_tables verbose` (estructura), `list_migrations` (solo `create_daycares`), `select` del seed, `get_advisors` security y performance sin avisos nuevos.
9. Verificación final del repo: `npm run lint`, `npx tsc --noEmit` y `npm run build` siguen pasando (no se tocó código de app).

## Criterios de aceptación

- [x] `supabase/` existe en el repo con `config.toml`, `migrations/<timestamp>_create_daycares.sql` y `seed.sql`; `supabase/.temp` y `.branches` están gitignoreados.
  > Nota: la migración se llama `20260924225511_create_daycares.sql` y coincide con el registro remoto en `supabase_migrations.schema_migrations`.
- [x] La tabla `public.daycares` existe en remoto con exactamente `id uuid PK (default gen_random_uuid())`, `name text NOT NULL`, `created_at timestamptz NOT NULL (default now())`.
- [x] RLS está activado en `daycares` y no existen políticas; una consulta anónima vía API no devuelve filas.
- [x] El historial remoto (`supabase_migrations.schema_migrations`) contiene únicamente la migración `create_daycares`; las 2 de prueba fueron eliminadas.
- [x] El seed dejó exactamente 1 fila: id `00000000-0000-0000-0000-000000000001`, name `Guardería Sala Soles`; re-ejecutar el seed no duplica la fila.
- [x] `get_advisors` (security y performance) no reporta avisos nuevos atribuibles a `daycares`.
  > Nota: security reporta un lint `INFO` `rls_enabled_no_policy` sobre `public.daycares`, que es el comportamiento esperado por diseño (RLS activado sin políticas hasta el spec de `users`). Los warnings restantes (`rls_auto_enable()`) son preexistentes y no están relacionados con `daycares`.
- [x] `npm run lint`, `npx tsc --noEmit` y `npm run build` pasan sin errores.

## Decisiones

- **Sí:** CLI como devDependency npm + `link` + `db push` contra remoto; sin Docker no hay stack local, y esto cumple el espíritu de AGENTS.md ("preferir CLI") con migraciones versionadas en el repo.
- **No:** aplicar DDL directo vía MCP `apply_migration` — queda descartado como patrón principal; el MCP se usa solo para verificar, limpiar historial y (si hace falta) ejecutar el seed.
- **Sí:** limpiar las 2 migraciones de prueba del historial remoto antes de linkear (decisión explícita del usuario), para que repo y remoto nazcan sincronizados.
- **Sí:** RLS activado desde el día 1 sin políticas (deny-by-default, best practice `security-rls-disabled`); las políticas llegan con la tabla `users`.
- **Sí:** seed con UUID fijo + `on conflict do nothing` — idempotente y referenciable desde specs futuros; fuera de las migraciones (no se mezcla datos con DDL).
- **No:** constraint `check` adicional sobre `name` (ej. no-blank) ni columna `updated_at`: el diccionario de referencia define exactamente 3 columnas y lo seguimos al pie.
- **No:** código de cliente Next.js en este spec; sin tablas que consumir aún, agrandaría el alcance sin valor.

## Riesgos

- El CLI npm descarga un binario en la instalación; si falla en Windows, alternativa es winget/scoop (mismo flujo posterior).
- `db push` pide la contraseña de DB: si `SUPABASE_DB_PASSWORD` de `.env` no coincide con la real del proyecto, el link/push fallará — verificar en el paso 3 antes de continuar.
- Borrar filas de `supabase_migrations.schema_migrations` es irreversible; son solo entradas de prueba ya confirmadas como tales (las tablas no existen), riesgo acotado.

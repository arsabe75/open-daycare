# SPEC 09 — Autenticación real (email/password) y protección de rutas

> **Estado:** Aprobado
> **Depende de:** SPEC 03 (UI de login), SPEC 08 (tabla `users` + seed staff)
> **Fecha:** 2026-09-26
> **Objetivo:** Conectar `/login` con Supabase Auth usando email y contraseña, proteger todas las rutas excepto `/login` y `/activate-account` con el proxy de Next.js 16, y hacer que el sidebar muestre el usuario real y permita cerrar sesión.

## Alcance

**Dentro:**

- **Migración de `middleware.ts` → `proxy.ts`** (convención renombrada en Next.js 16; documentada en `node_modules/next/dist/docs/`):
  - `utils/supabase/middleware.ts` → `utils/supabase/proxy.ts` con una función `updateSession(request)`: crear cliente con `createServerClient`, llamar `await supabase.auth.getClaims()` (patrón oficial actual de Supabase; usar SSR sin `getClaims()` cierra la sesión de forma aleatoria).
  - `middleware.ts` raíz → `proxy.ts` (`export async function proxy`, mismo `matcher`).
- **Protección de rutas en `proxy.ts`:**
  - Sin sesión y ruta no pública → redirigir a `/login`.
  - Con sesión en `/login` o `/activate-account` → redirigir a `/`.
  - Rutas públicas: `/login` y `/activate-account` (esta última sigue siendo UI estática).
- **Login real:**
  - `lib/actions/auth.ts` (`"use server"`): `login(formData)` con `supabase.auth.signInWithPassword({ email, password })`; en éxito `revalidatePath('/', 'layout')` + `redirect('/')`; en error devuelve `{ error }` (sin redirigir).
  - `components/auth/login-form.tsx` (client component) con `useActionState`, componiendo los `AuthField`/`AuthSubmit` existentes y un mensaje de error rojo inline dentro de la tarjeta ("Email o contraseña incorrectos").
  - `app/login/page.tsx` usa `LoginForm`; se elimina el mock `defaultValue="caro@opendaycare.com"`.
  - `AuthSubmit` soporta renderizarse como `<button type="submit">` cuando no reciba `href` (hoy siempre es un Link).
- **Logout real:** `logout()` en `lib/actions/auth.ts` con `supabase.auth.signOut()` + `revalidatePath('/', 'layout')` + `redirect('/login')`. El Link del sidebar pasa a ser un `<form action={logout}>` con el mismo estilo de botón.
- **Usuario real en el sidebar:**
  - `lib/current-user.ts`: `getCurrentUserProfile()` (server) → `supabase.auth.getUser()` + consulta a `public.users` (`full_name`, `role`) con join a `daycares` (`name`).
  - `Sidebar`/`SidebarWithDialog` reciben la prop `user: CurrentUserProfile`; el pie reemplaza "Caro Giménez · Maestra · Soles" por el nombre real, la inicial de `full_name` en el avatar y `role · daycare` (p. ej., "Arturo Sandoval · staff · Sala Soles").
  - Las páginas `app/page.tsx`, `app/kids/page.tsx` y `app/kids/[id]/page.tsx` obtienen el perfil y lo pasan como props (`HomeView` lo recibe y reenvía).
- **Actualización de `AGENTS.md`:** las referencias a `middleware.ts`/`utils/supabase/middleware` se renombran a `proxy`.

**Fuera de alcance (para specs futuros):**

- Signup público (la app es por invitación) y el flujo real de `/activate-account` (sigue siendo UI estática).
- `/forgot-password` (el link todavía da 404).
- Reemplazar los datos mock del feed/kids por datos reales de Supabase.
- Protección por server component (en cada `page.tsx`) más allá del proxy; cuando los datos sean reales, RLS los protegerá.
- Proveedores OAuth, MFA y sesiones "recordarme".
- Versión móvil.

## Modelo de datos

No hay tablas ni migraciones nuevas. Solo un tipo TypeScript derivado:

```ts
// lib/current-user.ts
export type CurrentUserProfile = {
  fullName: string; // public.users.full_name
  role: "staff" | "parent" | "admin"; // public.users.role
  daycareName: string; // public.daycares.name
};
// getCurrentUserProfile(): Promise<CurrentUserProfile | null>
// null si no hay sesión o no existe perfil en public.users.
```

Los datos de sesión viven en las cookies `sb-*` que `@supabase/ssr` gestiona; no se persiste estado nuevo.

## Plan de implementación

1. Leer `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md` y verificar en Context7 el patrón vigente de `updateSession` + `getClaims()`.
2. Crear `utils/supabase/proxy.ts` con `updateSession(request)` (cliente + `getClaims()` + redirecciones: sin sesión a `/login`, con sesión en `/login`|`/activate-account` a `/`) y eliminar `utils/supabase/middleware.ts`. Prueba manual: acceder a `/` sin sesión redirige a `/login`.
3. Reemplazar `middleware.ts` raíz por `proxy.ts` (`export async function proxy` → `updateSession(request)`, mismo `matcher`).
4. Crear `lib/actions/auth.ts` con `login` (`signInWithPassword` + `revalidatePath` + `redirect('/')`, devuelve `{ error }` en fallo) y `logout` (`signOut` + `redirect('/login')`).
5. Modificar `components/auth/auth-submit.tsx`: sin `href` renderiza un `<button type="submit">` con los mismos estilos.
6. Crear `components/auth/login-form.tsx` (cliente, `useActionState`, error inline) y conectarlo a `app/login/page.tsx`; eliminar el `defaultValue` mock. Prueba manual: login `arsabe75@gmail.com` / `Homero&75` va a `/`; contraseña incorrecta muestra el mensaje sin navegar.
7. Crear `lib/current-user.ts` con `getCurrentUserProfile()`.
8. Modificar `components/sidebar.tsx` y `components/sidebar-with-dialog.tsx` (prop `user`, pie real, logout como `<form action={logout}>`).
9. Modificar `app/page.tsx`, `components/feed/home-view.tsx`, `app/kids/page.tsx` y `app/kids/[id]/page.tsx` para obtener y reenviar el perfil.
10. Actualizar las referencias de middleware → proxy en `AGENTS.md`.
11. Verificación final: `npm run lint`, `npx tsc --noEmit`, `npm run build`, y el flujo manual completo (protección, login, redirección de login autenticado, logout, volver atrás).

## Criterios de aceptación

- [ ] Los archivos `middleware.ts` y `utils/supabase/middleware.ts` ya no existen; existen `proxy.ts` (raíz, `export proxy`) y `utils/supabase/proxy.ts`, y el `matcher` se conserva.
- [ ] Acceder a `/`, `/kids` o `/kids/[id]` sin sesión redirige a `/login`.
- [ ] `/login` y `/activate-account` son accesibles sin sesión.
- [ ] El login con `arsabe75@gmail.com` / `Homero&75` crea cookies `sb-*` y redirige a `/`.
- [ ] Credenciales incorrectas muestran un mensaje de error inline en la tarjeta de `/login` sin cambiar la URL.
- [ ] Acceder a `/login` o `/activate-account` con sesión activa redirige a `/`.
- [ ] El pie del sidebar muestra "Arturo Sandoval", el avatar con la inicial "A", y el rol y nombre de guardería desde `public.users`/`public.daycares` (no "Caro Giménez · Maestra · Soles").
- [ ] El botón de logout en el sidebar destruye la sesión y redirige a `/login`; volver a `/` redirige de nuevo a `/login`.
- [ ] Ningún código cliente expone la service role ni ninguna clave distinta a la publishable.
- [ ] `npm run lint`, `npx tsc --noEmit` y `npm run build` pasan sin errores.

## Decisiones

- **Sí:** Protección de rutas en `proxy.ts` usando `supabase.auth.getClaims()` — patrón oficial actual de Supabase (Context7); `getUser()` en el middleware está desaconsejado, y omitir `getClaims()` cierra la sesión aleatoriamente con SSR.
- **Sí:** Migración `middleware.ts` → `proxy.ts` en este spec — Next.js 16 depreca explícitamente la convención anterior y el proyecto debe cumplir los avisos de `node_modules/next/dist/docs/`.
- **Sí:** Protección solo a nivel de proxy (optimista), sin `getUser()` por página — los datos siguen siendo mock, y cuando sean reales RLS (SPEC 08) los protegerá; los chequeos por página quedan registrados como refuerzo futuro.
- **Sí:** Server actions + `useActionState` con error inline — mantiene al usuario en `/login` sin crear la ruta `/error` de los ejemplos de Supabase (peor UX).
- **Sí:** Login y logout centralizados en `lib/actions/auth.ts` — logout se consume desde el sidebar en varias páginas; ubicarlo en `app/login/actions.ts` no lo representaría bien.
- **Sí:** Perfil real obtenido en páginas server y pasado por props a `Sidebar` — evita un segundo cliente en el browser y flashes de carga; `Sidebar` sigue siendo cliente (recibe `onNewPost`).
- **No:** Signup/activación real — el modelo es por invitación y la tabla `invitations` aún no existe; va en su propio spec.
- **No:** Forgot password — Supabase requiere un flujo y emails aún no configurados.

## Riesgos

| Riesgo                                                                   | Mitigación                                                                                                                                  |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `redirect()` dentro de una action usada con `useActionState`             | El patrón está soportado en Next 16/React 19; si falla, el fallback es hacer `redirect` tras `setState` exitoso — se verifica en el paso 6. |
| Páginas que usan `cookies()` se vuelven dinámicas (rompe build estático) | Es esperado y correcto: todas las páginas protegidas requieren sesión; `npm run build` lo verifica en el paso 11.                           |
| No existe perfil en `public.users` (usuario sin trigger)                 | `getCurrentUserProfile()` devuelve `null` y el sidebar muestra un fallback neutro (inicial del email, sin nombre).                          |

## Lo que NO está en este spec

- Signup, activación real de cuenta o forgot password.
- Reemplazar los datos mock del feed/kids por consultas reales.
- Protección por server component ni roles/permisos por UI.
- Versión móvil.

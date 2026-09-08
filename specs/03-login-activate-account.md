# SPEC 03 — Login y activación de cuenta (solo UI)

> **Estado:** Implementado
> **Depende de:** SPEC 01, SPEC 02
> **Fecha:** 2026-09-08
> **Objetivo:** Implementar las plantillas `references/pantallas/login.dc.html` y `references/pantallas/activar-cuenta.dc.html` como las rutas `/login` y `/activate-account` con estilo visual idéntico, sin el selector de rol Personal/Familia y sin comportamiento real.

## Alcance

**Dentro:**

- Ruta `/login` (`app/login/page.tsx`): layout de 2 columnas — panel izquierdo con gradiente coral (`#F6A98E → #F2937A → #EC7E62`), círculos decorativos, logo OpenDayCare, título "El día de cada niño, compartido con su familia.", subtítulo y pie "🌿 Guardería Sala Soles"; columna derecha con tarjeta de formulario (máx. 392px): título "Iniciar sesión", subtítulo, campo EMAIL (`defaultValue="caro@opendaycare.com"`), campo CONTRASEÑA (password, placeholder "••••••••"), link "¿Olvidaste tu contraseña?", CTA "Iniciar sesión" y pie "¿Te invitó la guardería? Activá tu cuenta".
- **Excluir el bloque "INGRESO COMO"** con los botones Personal/Familia de la plantilla (decisión del usuario).
- Ruta `/activate-account` (`app/activate-account/page.tsx`): tarjeta centrada (máx. 440px) con ícono sol, título "Bienvenida a OpenDayCare", subtítulo, tarjeta de invitación (avatar "M" `#A9D9E8`/`#1F7A93`, "Te invitaron a seguir a", "Mateo · Sala Soles"), campo CÓDIGO DE INVITACIÓN (`defaultValue="7K4P9"`, estilo Fredoka letter-spacing 3px), campo EMAIL (`defaultValue="lucia.fernandez@gmail.com"`), campo CREAR CONTRASEÑA (borde `#F2A78E`), caja de autorización amarilla (`#FBF1D6`) con checkbox verde tachado (`defaultChecked`), CTA "Activar mi cuenta" y pie "¿Ya tenés cuenta? Iniciar sesión".
- Componentes compartidos en `components/auth/`: `auth-field.tsx` (label uppercase `#94887B` + input borde `#EADFD0` radio 14px) y `auth-submit.tsx` (CTA gradiente `#F4977E → #EE8164` con sombra, renderizado como Link).
- Links: CTAs de ambas pantallas → `/`; "¿Olvidaste tu contraseña?" → `/forgot-password` (404 hoy); "Activá tu cuenta" → `/activate-account`; "Iniciar sesión" (pie de activación) → `/login`.
- Metadata por página (`export const metadata`): títulos "Iniciar sesión · OpenDayCare" y "Activar tu cuenta · OpenDayCare".
- El logout del sidebar (`components/sidebar.tsx:153`, href `/login`) ya apunta a la ruta nueva; no requiere cambios.

**Fuera de alcance (para specs futuros):**

- Autenticación real, sesiones, validación de formularios y envío.
- Pantallas `/forgot-password`, familia-feed (`familia-feed.dc.html`) y el resto de las plantillas.
- Selector de rol Personal/Familia (eliminado por decisión del usuario).
- Renombrar los links en español restantes del SPEC 01 (`/crear-publicacion`, `/avisos`, `/mi-cuenta`, `/detalle-publicacion`, `/foto`).
- Versión móvil / responsive.

## Modelo de datos

Este spec no introduce estructuras de datos nuevas. Los datos de la pantalla de activación (Mateo · Sala Soles, avatar "M", código `7K4P9`, email `lucia.fernandez@gmail.com`) quedan hardcodeados en `app/activate-account/page.tsx`; no se crea ningún `lib/data/` ni se modifica `children.ts`.

## Plan de implementación

1. Leer la documentación incluida en `node_modules/next/dist/docs/` (layouts-and-pages, linking-and-navigating, metadata) para respetar las APIs vigentes de Next.js 16.
2. Crear `components/auth/auth-field.tsx` y `components/auth/auth-submit.tsx`.
3. Crear `app/login/page.tsx`: panel de marca izquierdo + formulario derecho componiendo los componentes de `auth/`, con los mismos colores, tipografías, radios, sombras y espaciados de la plantilla, omitiendo el selector de rol.
4. Crear `app/activate-account/page.tsx` con la tarjeta centrada y los datos hardcodeados.
5. Verificación manual: `npm run dev`, comparar `/login` y `/activate-account` contra ambas plantillas en desktop; comprobar navegación de CTAs a `/`, links cruzados entre pantallas, 404 de `/forgot-password` y que el logout del sidebar ahora navegue a `/login`.
6. Verificación final: `npm run lint`, `npx tsc --noEmit` y `npm run build` sin errores.

## Criterios de aceptación

- [x] `/login` renderiza visualmente idéntico a `references/pantallas/login.dc.html` en desktop, excepto el bloque "INGRESO COMO" que no existe.
- [x] Los inputs de `/login` tienen `defaultValue="caro@opendaycare.com"` y placeholder "••••••••", son editables y la página es server component (sin `"use client"`).
- [x] "¿Olvidaste tu contraseña?" linkea a `/forgot-password` (404 hoy); el CTA "Iniciar sesión" a `/`; "Activá tu cuenta" a `/activate-account`.
- [x] `/activate-account` renderiza visualmente idéntico a `references/pantallas/activar-cuenta.dc.html` en desktop.
- [x] La tarjeta de invitación muestra "Mateo · Sala Soles" con avatar "M"; código y email tienen los `defaultValue` de la plantilla; el checkbox de autorización se renderiza marcado y puede desmarcarse sin JS.
- [x] El CTA "Activar mi cuenta" linkea a `/`; "Iniciar sesión" del pie a `/login`.
- [x] El logout del sidebar navega a `/login` y ambas páginas renderizan sin sidebar.
- [x] Ningún input ni botón ejecuta lógica real (sin handlers, validación ni mutaciones).
- [x] `npm run lint`, `npx tsc --noEmit` y `npm run build` pasan sin errores.

## Decisiones

- **Sí:** rutas en inglés `/login` y `/activate-account` (preferencia del usuario fijada en SPEC 02); `/login` concreta el link que el sidebar ya tenía.
- **No:** selector de rol Personal/Familia. El usuario indicó que no se ocupa; se elimina del login sin reemplazo.
- **Sí:** ambos CTAs principales linkean a `/`. Es la única pantalla "post-auth" que existe; se descarta `/family-feed` (404) y botón inerte.
- **Sí:** server components con `defaultValue`/`defaultChecked`. Interactividad nativa del browser sin JS, consistente con el patrón "solo UI" de SPEC 01/02; se descartan client components controlados.
- **Sí:** datos de invitación hardcodeados en la página. Es una pantalla estática única; no amerita un archivo en `lib/data/`.
- **Sí:** componentes compartidos `auth-field.tsx` y `auth-submit.tsx` en `components/auth/`; ambas pantallas repiten labels, inputs y CTA.
- **Sí:** `/forgot-password` como ruta futura que da 404, misma filosofía de links de SPEC 01/02.
- **No:** autenticación y validación reales; van en un spec futuro con DB.
- **No:** versión móvil; las plantillas son desktop-only.

## Lo que NO está en este spec

- Autenticación real, sesiones y validación de formularios.
- Pantalla de forgot-password y el feed de familia.
- Selector de rol Personal/Familia.
- Versión móvil y modo oscuro.

# SPEC 02 — Niños: lista y perfil (solo UI)

> **Estado:** Implementado
> **Depende de:** SPEC 01
> **Fecha:** 2026-09-07
> **Objetivo:** Implementar las plantillas `references/pantallas/ninos.dc.html` y `references/pantallas/perfil-nino.dc.html` como las rutas `/kids` y `/kids/[id]` con estilo visual idéntico, datos mock tipados y componentes reutilizables, sin comportamiento real.

## Alcance

**Dentro:**

- Ruta `/kids` (`app/kids/page.tsx`): encabezado ("GESTIÓN" / "Niños") con botón "Agregar niño", caja de búsqueda visual, separador "SALA SOLES · 8 niños" (conteo derivado de los datos) y grilla de 2 columnas con las 8 tarjetas de niños.
- Ruta `/kids/[id]` (`app/kids/[id]/page.tsx`): perfil con link "Volver a Niños", cabecera (avatar 84px, nombre, "{edad} años · Sala {sala}", botón "Editar"), caja roja de alergias (solo si el niño tiene notas), tarjeta de detalles (Fecha de nacimiento, Sala, Ingreso), columna derecha con botón oscuro "Resumen del día" y tarjeta "PADRES VINCULADOS" con opción "Vincular otro padre".
- Datos mock tipados en `lib/data/children.ts`: perfil completo de los 8 niños (Mateo replica exactamente la plantilla; el resto, mock coherente con los subtítulos de la lista).
- Componentes en `components/kids/`: `child-avatar.tsx` (círculo con inicial, tamaños card/perfil), `child-card.tsx` (tarjeta con hover: borde `#F2A78E` + `translateY(-2px)`, transición .15s), `search-box.tsx`, y en `components/kids/profile/`: `allergy-alert.tsx`, `child-details.tsx`, `linked-parents.tsx`.
- Modificar `components/sidebar.tsx`: nueva prop `activeHref` (default `"/"`), item Niños cambia `/ninos` → `/kids`; en `/kids` y `/kids/[id]` se ve "Niños" activo (bg `#FBE3D8`, texto `#D9583C`, font 800). Feed en `/` queda igual.
- Links a rutas futuras en inglés: `/kids/new` (Agregar niño y Editar), `/daily-summary` (Resumen del día), `/link-parent` (Vincular otro padre). Dan 404 hoy, como en SPEC 01.
- `notFound()` en `/kids/[id]` cuando el id no existe en el mock.
- `app/globals.css`: scrollbar custom (10px, thumb `#E4D6C4`), color de placeholder `#B6A99B`, `input` con fuente heredada y focus sin outline.

**Fuera de alcance (para specs futuros):**

- Pantallas `/kids/new`, `/daily-summary`, `/link-parent` y el resto de las plantillas.
- Comportamiento real: filtrado de la búsqueda, agregar/editar niño, vincular padres.
- Autenticación, base de datos, persistencia y APIs.
- Renombrar los links en español restantes del SPEC 01 (`/crear-publicacion`, `/avisos`, `/mi-cuenta`, `/detalle-publicacion`, `/foto`).
- Versión móvil / responsive.

## Modelo de datos

```ts
// lib/data/children.ts
export type ParentRelation = "mom" | "dad";
export type ParentStatus = "active" | "pending";

export interface Avatar {
  initial: string; // "M"
  bg: string; // "#A9D9E8"
  color: string; // "#1F7A93" (en padres vinculados: "#FFFFFF")
}

export interface LinkedParent {
  id: string;
  name: string; // "Lucía Fernández"
  relation: ParentRelation; // → "Mamá" / "Papá"
  status: ParentStatus; // → subtítulo y badge
  avatar: Avatar;
}

export interface Child {
  id: string; // "1" → /kids/1
  name: string; // "Mateo Fernández"
  age: number; // 3 → "3 años"
  room: string; // "Soles"
  avatar: Avatar;
  allergyBadge?: string; // "MANÍ" | "LACTOSA" → badge de la tarjeta
  allergyNotes?: string; // texto largo de la caja roja del perfil
  birthDate: string; // "12 mar 2022"
  admission: string; // "feb 2025"
  linkedParents: LinkedParent[];
}
```

Reglas de derivación (en los componentes, no en los datos):

- **Badge derecho de la tarjeta:** `allergyBadge` presente → badge alerta (`#FBD8CC`/`#D9684A`); si no y `linkedParents.length === 0` → badge "VINCULAR" (`#F9D2DE`/`#C56486`); si no → chevron `#CBB89F`.
- **Subtítulo de la tarjeta:** `"{age} años · N padres vinculados"` (1 → "1 padre vinculado"; 0 → "sin padres vinculados").
- **Padres:** `active` → subtítulo "Mamá/Papá · activa" + badge "ACTIVA" (`#CFEBD8`/`#3E9B6C`); `pending` → "Mamá/Papá · invitación enviada" + badge "PENDIENTE" (`#F7E7A6`/`#9A7B1E`).
- Mateo: badge MANÍ, notas "Alergia al maní. Evitar frutos secos. Lleva inhalador en la mochila.", padres Lucía (mom, active) y Diego (dad, pending). Tomás: badge LACTOSA con notas coherentes. Valentina: `linkedParents` vacío.

## Plan de implementación

1. Leer la documentación incluida en `node_modules/next/dist/docs/` (rutas dinámicas y `params` como promesa, tipos generados `PageProps`, `notFound`, linking) para respetar las APIs vigentes de Next.js 16.
2. Crear `lib/data/children.ts` con los tipos y los 8 niños mock de perfil completo.
3. Modificar `components/sidebar.tsx` (prop `activeHref` con default `"/"`, href de Niños → `/kids`); `app/page.tsx` no requiere cambios por el default.
4. Crear `components/kids/child-avatar.tsx`, `components/kids/child-card.tsx` (Link a `/kids/{id}` con hover) y `components/kids/search-box.tsx`.
5. Crear `app/kids/page.tsx` componiendo sidebar (`activeHref="/kids"`) + encabezado + búsqueda + separador con conteo derivado + grilla de 8 tarjetas.
6. Crear `components/kids/profile/allergy-alert.tsx`, `child-details.tsx` y `linked-parents.tsx`.
7. Crear `app/kids/[id]/page.tsx`: buscar el niño por id, `notFound()` si no existe, y componer back-link, cabecera con Editar, columna izquierda (alerta condicional + detalles) y columna derecha (Resumen del día + padres vinculados).
8. Ajustar `app/globals.css` con scrollbar, placeholder y estilos base de `input`.
9. Verificación manual: `npm run dev`, comparar `/kids` y los 8 perfiles contra ambas plantillas en desktop; comprobar sidebar activo en `/`, `/kids` y `/kids/1`; comprobar 404 en `/kids/999` y los hrefs a rutas futuras.
10. Verificación final: `npm run lint`, `npx tsc --noEmit` y `npm run build` sin errores.

## Criterios de aceptación

- [x] `/kids` renderiza la lista visualmente idéntica a `references/pantallas/ninos.dc.html` en desktop (colores, tipografías Fredoka/Nunito, radios, sombras, espaciados).
- [x] La grilla muestra exactamente 8 tarjetas en 2 columnas y el separador dice "SALA SOLES · 8 niños" con conteo derivado de los datos.
- [x] Las tarjetas muestran badge MANÍ (Mateo), LACTOSA (Tomás) y VINCULAR (Valentina); las otras 5 muestran chevron.
- [x] El hover de una tarjeta cambia el borde a `#F2A78E` y la eleva 2px con transición de .15s.
- [x] El input de búsqueda se renderiza con placeholder "Buscar niño…" y no tiene handlers ni filtrado.
- [x] El sidebar muestra "Niños" activo en `/kids` y `/kids/[id]`, y Feed sigue activo en `/`.
- [x] Las tarjetas linkean a `/kids/{id}`; "Agregar niño" y "Editar" a `/kids/new`; "Resumen del día" a `/daily-summary`; "Vincular otro padre" a `/link-parent` (404 hoy).
- [x] `/kids/[id]` renderiza el perfil idéntico a `references/pantallas/perfil-nino.dc.html` con los datos de cada niño; el de Mateo coincide punto por punto con la plantilla.
- [x] Un niño sin `allergyNotes` no renderiza la caja roja; Valentina renderiza la tarjeta de padres solo con "Vincular otro padre".
- [x] `/kids/999` (id inexistente) responde con la 404 de Next.js vía `notFound()`.
- [x] Ningún botón ejecuta lógica real (sin mutaciones ni navegación fuera de los links declarados).
- [x] `npm run lint`, `npx tsc --noEmit` y `npm run build` pasan sin errores.

## Decisiones

- **Sí:** rutas en inglés `/kids` y `/kids/[id]` (preferencia del usuario: nada de nombres de página en español en el código). Implica actualizar el link `/ninos` → `/kids` del sidebar y sobrescribe ese punto del SPEC 01.
- **Sí:** el resto de los links en español del SPEC 01 quedan intactos; cada spec futuro renombrará su ruta al implementarla.
- **Sí:** hrefs futuros en inglés (`/kids/new`, `/daily-summary`, `/link-parent`) aunque den 404, misma filosofía que SPEC 01.
- **Sí:** mock completo para los 8 niños en `lib/data/children.ts`; cualquier perfil renderiza correcto sin datos inventados en la UI.
- **Sí:** badge y subtítulo de la tarjeta derivados de los datos (`allergyBadge`, `linkedParents.length`), no hardcodeados por niño.
- **Sí:** Sidebar sigue siendo server component con prop `activeHref`; se descarta `usePathname` (evita convertirlo en client component permanente).
- **Sí:** búsqueda puramente visual; el filtrado es comportamiento y quedó excluido ("solo interfaces y componentes").
- **Sí:** `notFound()` para ids inexistentes; se descartan redirect y fallback a Mateo.
- **Sí:** tipos internos en inglés (`mom`/`dad`, `active`/`pending`) y copy visible en español mapeado en componentes ("Mamá", "ACTIVA", "invitación enviada"), siguiendo la convención del SPEC 01.
- **Sí:** componentes server-only (sin `"use client"`); no hay interactividad.
- **Sí:** estilos globales de scrollbar/placeholder/input en `globals.css`; afectan también al feed, pero son parte de la identidad visual de las plantillas.
- **No:** pantallas `/kids/new`, `/daily-summary` y `/link-parent`; van en specs propios.
- **No:** versión móvil; las plantillas son desktop-only.

## Riesgos

- Los estilos globales nuevos (scrollbar, placeholder) impactan la página `/` ya entregada; el riesgo visual es bajo pero conviene comparar el feed en la verificación manual.
- Los datos mock de los 7 perfiles no plantillados son inventados; un spec futuro (DB real) podría contradecirlos. Quedan aislados en `lib/data/children.ts` para reemplazo sencillo.

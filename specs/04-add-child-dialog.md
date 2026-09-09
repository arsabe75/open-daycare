# SPEC 04 — Diálogo "Agregar niño"

> **Estado:** Aprobado
> **Depende de:** SPEC 02
> **Fecha:** 2026-09-09
> **Objetivo:** Implementar el diálogo de `references/pantallas/agregar-nino.dc.html` al presionar "+ Agregar niño" en `/kids`, con validación de obligatorios (nombre, fecha de nacimiento con máscara DD/MM/AAAA, sala), 3 salas mock y alta del niño en estado local.

## Alcance

**Dentro:**

- `lib/data/rooms.ts`: 3 salas mock tipadas — Soles, Lunas, Arcoíris.
- `lib/child-utils.ts`: helpers puros — validación de fecha DD/MM/AAAA real, cálculo de edad, formateo a "12 mar 2022", parseo de alergias por comas, derivación de avatar (inicial + color de paleta por ciclo) y construcción del `Child` nuevo.
- `components/kids/add-child/masked-date-input.tsx`: input con máscara propia DD/MM/AAAA (solo dígitos, "/" automáticos, máx. 10 chars), sin dependencias.
- `components/kids/add-child/room-select.tsx`: dropdown custom idéntico a la plantilla (botón con sala + chevron, lista desplegable con las 3 salas); preseleccionado "Soles".
- `components/kids/add-child/add-child-dialog.tsx`: diálogo client component — backdrop oscuro, tarjeta centrada (máx. 520px, `#FBF4EC`, borde `#ECE0D0`, radio 24px, sombra), cabecera Cancelar / "Agregar niño" (Fredoka) / Guardar, campos NOMBRE COMPLETO, FECHA DE NACIMIENTO + SALA en fila, ALERGIAS (etiquetas) y NOTAS MÉDICAS, con estilos idénticos a la plantilla.
- `components/kids/kids-view.tsx`: client component que recibe `children` y `rooms`, renderiza encabezado (con botón "+ Agregar niño" que ahora **abre el diálogo**), búsqueda, separador con conteo derivado y grilla; mantiene la lista en `useState` inicializada con los 8 mock.
- `app/kids/page.tsx`: pasa a componer Sidebar (server) + `KidsView`; el botón ya no es un Link a `/kids/new`.
- Validación al presionar "Guardar": errores inline en coral (`#D9583C`) bajo cada campo (nombre vacío, fecha inválida/incompleta, sala sin seleccionar); si es válida, se deriva el `Child`, se agrega a la lista, se cierra el diálogo y se limpia el formulario.
- Cierre sin guardar: "Cancelar", tecla ESC y click en el backdrop.
- Datos derivados del niño nuevo: `age` desde la fecha, `birthDate` "12 mar 2022", `avatar` inicial + paleta en ciclo, `allergyBadge` = primera etiqueta en mayúsculas, `allergyNotes` = notas médicas si hay, si no el texto de alergias; `admission` = mes/año actual; `linkedParents` = [] (badge VINCULAR).

**Fuera de alcance (para specs futuros):**

- Persistencia real (localStorage, DB, API): el niño agregado vive solo en memoria hasta recargar.
- Edición de niños: "Editar" del perfil sigue linkeando a `/kids/new` (404).
- Agrupación de la grilla por sala (secciones "SALA LUNAS", etc.); hoy la lista muestra todos los niños bajo el separador existente con conteo derivado del total visible.
- Editar/eliminar desde el diálogo, subida de fotos, validación de duplicados.
- Versión móvil / responsive.

## Modelo de datos

```ts
// lib/data/rooms.ts
export interface Room {
  id: string; // "soles"
  name: string; // "Soles"
}
export const rooms: Room[]; // Soles, Lunas, Arcoíris
```

`Child` (SPEC 02) no cambia; se construye uno nuevo vía `lib/child-utils.ts`. El estado de la lista vive en `kids-view.tsx` (`useState<Child[]>` inicializado con `children` de `lib/data/children.ts`).

## Plan de implementación

1. Leer `node_modules/next/dist/docs/` (client components, eventos, composición server/client).
2. Crear `lib/data/rooms.ts`.
3. Crear `lib/child-utils.ts` con validación/derivación pura.
4. Crear `masked-date-input.tsx` y `room-select.tsx`.
5. Crear `add-child-dialog.tsx` (formulario, validación inline, ESC/backdrop/Cancelar, onAdd).
6. Crear `kids-view.tsx` y actualizar `app/kids/page.tsx`.
7. Verificación manual: `npm run dev` + Playwright MCP (capturas en `.playwright-mcp/`), comparar el diálogo contra la plantilla; probar alta válida, errores inline, ESC/backdrop/Cancelar.
8. Verificación final: `npm run lint`, `npx tsc --noEmit` y `npm run build`.

## Criterios de aceptación

- [x] En `/kids`, "+ Agregar niño" abre el diálogo (ya no navega a `/kids/new`) y este es visualmente idéntico a `references/pantallas/agregar-nino.dc.html` en desktop.
- [x] El input de fecha aplica máscara DD/MM/AAAA: solo acepta dígitos, inserta "/" automáticamente y limita a 10 caracteres.
- [x] El selector SALA es un dropdown custom con las 3 salas de `lib/data/rooms.ts`, preseleccionado "Soles".
- [x] "Guardar" con nombre vacío, fecha incompleta/inválida (ej. 31/02/2024) o sala sin seleccionar muestra errores inline en coral y no agrega ni cierra.
- [x] "Guardar" válido agrega el niño a la grilla (tarjeta con avatar, edad y badge correctos), actualiza el conteo del separador, cierra el diálogo y limpia el formulario.
- [x] El niño agregado con alergias muestra `allergyBadge` (primera etiqueta) y sin padres vinculados muestra badge VINCULAR.
- [x] El diálogo se cierra sin guardar con "Cancelar", ESC y click en el backdrop.
- [x] El estado es solo en memoria: al recargar `/kids` vuelven los 8 niños mock.
- [x] "Editar" en `/kids/[id]` sigue linkeando a `/kids/new` (404); no se creó la ruta.
- [x] `npm run lint`, `npx tsc --noEmit` y `npm run build` pasan sin errores.

## Decisiones

- **Sí:** estado en memoria (`useState`) en `kids-view.tsx`; se descarta localStorage (riesgo de mismatch SSR y no hay DB aún).
- **Sí:** 3 salas mock en `lib/data/rooms.ts` (Soles, Lunas, Arcoíris), archivo propio porque son una entidad nueva.
- **Sí:** máscara de fecha custom sin dependencias; el proyecto tiene cero libs de UI y la máscara es trivial.
- **Sí:** dropdown custom de sala (no `<select>` nativo) para coincidencia exacta con la plantilla; preselección "Soles".
- **Sí:** validación con errores inline al intentar guardar; botón siempre clickeable (mejor feedback que deshabilitarlo).
- **Sí:** alergias con parseo por comas (primera → badge, todas → notas) y notas médicas opcionales.
- **Sí:** derivación automática de age/birthDate/avatar/admission para que la tarjeta nueva sea consistente con las existentes.
- **Sí:** `/kids` mantiene un solo bloque de grilla; la agrupación por sala queda fuera (el separador actual dice "SALA SOLES" y se conserva con conteo del total visible).
- **No:** `/kids/new` como ruta; el diálogo la reemplaza para el alta, y Editar sigue apuntando al link futuro.

## Riesgos

- Convertir la grilla en client component puede afectar hidratación/estilos mínimos de `/kids`; mitigar comparando visualmente contra el estado actual.
- La máscara custom puede tener edge cases de cursor (backspace sobre "/"); se acepta comportamiento simple de reformateo.
- El niño agregado se pierde al recargar (decisión explícita); puede sorprender en la demo.

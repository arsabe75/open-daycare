# Open Daycare

Aplicación web para la gestión de una guardería, construida con Next.js, React, TypeScript, Tailwind CSS v4 y Supabase.

## Stack

- **Framework:** [Next.js](https://nextjs.org) 16.3.4 (App Router)
- **UI:** React 19.2.8, Tailwind CSS v4
- **Lenguaje:** TypeScript 5 (modo estricto)
- **Backend / Base de datos:** [Supabase](https://supabase.com) (Postgres, Auth)
- **Cliente Supabase:** [`@supabase/ssr`](https://github.com/supabase/ssr) + [`@supabase/supabase-js`](https://github.com/supabase/supabase-js)
- **Package manager:** npm (`package-lock.json`)

## Requisitos previos

- [Node.js](https://nodejs.org/) (versión recomendada por Next.js 16)
- Cuenta de Supabase con acceso al proyecto
- [Supabase CLI](https://supabase.com/docs/guides/local-development/cli) instalado. En este proyecto ya está incluido como dependencia de desarrollo, por lo que puedes usarlo con `npx supabase`.

## Configuración inicial

1. Clona el repositorio e instala las dependencias:

   ```bash
   npm install
   ```

2. Crea el archivo de variables de entorno:

   ```bash
   cp .env.example .env.local
   ```

3. Completa las variables de entorno en `.env.local`. Los valores los encuentras en el panel de Supabase del proyecto, en **Settings > API**:

   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

   > No incluyas la service role key en el cliente ni en variables públicas.

## Levantar el proyecto en local

Una vez configuradas las variables de entorno, inicia el servidor de desarrollo:

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

### Otros comandos útiles

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Inicia el servidor de desarrollo en `http://localhost:3000` |
| `npm run build` | Genera la build de producción |
| `npm start` | Inicia la aplicación en modo producción (requiere build previa) |
| `npm run lint` | Ejecuta ESLint (`eslint.config.mjs`) |
| `npx tsc --noEmit` | Verifica los tipos de TypeScript |

## Autenticación con Supabase

El proyecto utiliza el MCP de Supabase para tareas de gestión, pero cualquier cambio en el esquema de la base de datos debe realizarse a través de migraciones versionadas usando el Supabase CLI.

### 1. Autenticar el MCP de Supabase en OpenCode

Para que el agente de OpenCode pueda interactuar con el MCP de Supabase, ejecuta:

```bash
opencode mcp auth supabase
```

Este comando vincula tu sesión de Supabase con el entorno de OpenCode y permite que el MCP gestione el proyecto (esquema, migraciones, logs, etc.).

### 2. Iniciar sesión con el CLI de Supabase

Para que el CLI pueda acceder a tus proyectos de Supabase, primero debes autenticarte:

```bash
npx supabase login
```

Este comando abrirá el navegador y te pedirá que inicies sesión con tu cuenta de Supabase. Si prefieres no usar el navegador, puedes usar un token personal:

```bash
npx supabase login --no-browser --token <tu-access-token>
```

Puedes crear un token de acceso personal en el panel de Supabase: **Account > Access Tokens**.

### 3. Vincular el proyecto local con Supabase

Una vez autenticado con el CLI, vincula tu entorno local al proyecto remoto:

```bash
npx supabase link --project-ref <project-ref>
```

El `project-ref` aparece en la URL del proyecto de Supabase: `https://supabase.com/dashboard/project/<project-ref>`.

### 4. Trabajar en equipo

Para que el resto del equipo pueda gestionar el proyecto con el CLI y el MCP:

1. Cada miembro debe tener una cuenta de Supabase.
2. El propietario del proyecto debe invitarlos desde el panel de Supabase: **Project Settings > Team**.
3. Cada miembro ejecuta en su máquina:

   ```bash
   opencode mcp auth supabase
   npx supabase login
   npx supabase link --project-ref <project-ref>
   ```

> El CLI almacena el token de acceso de forma segura en el almacenamiento de credenciales nativo del sistema operativo. Si este no está disponible, se guarda en `~/.supabase/access-token`.

## Supabase: desarrollo local (opcional)

Si prefieres trabajar con una instancia local de Supabase antes de aplicar cambios al proyecto remoto:

```bash
npx supabase start
npx supabase stop
```

Para aplicar migraciones al proyecto vinculado:

```bash
npx supabase db push
```

## Estructura del proyecto

```text
app/                    # Rutas y páginas de Next.js (App Router)
utils/supabase/         # Helpers de Supabase (cliente, servidor, proxy/middleware)
references/             # Material de referencia de diseño y base de datos
public/                 # Archivos estáticos
```

## Más información

- [Documentación de Next.js](https://nextjs.org/docs)
- [Documentación de Supabase](https://supabase.com/docs)
- [Guía de desarrollo local de Supabase](https://supabase.com/docs/guides/local-development)

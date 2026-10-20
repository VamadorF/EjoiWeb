# eJoi Web

Cliente web de escritorio de eJoi. Usa el mismo backend que la app móvil (`eJoi-BE` y `eJoi-BE-Image`); no hay BFF ni base de datos propia.

## Requisitos

- Node.js 22 LTS (ver `.nvmrc`)

## Comandos

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Servidor de desarrollo (Vite) |
| `npm run build` | Typecheck + build de producción |
| `npm run preview` | Vista previa del build |
| `npm run typecheck` | Solo TypeScript |
| `npm run lint` | ESLint |
| `npm run test` | Vitest (una pasada) |
| `npm run verify` | typecheck + lint + test + build |

## Estructura (prevista)

- `src/` — código de la SPA
- `src/app-shared/` — módulos sincronizados desde `ejoiFE` (se añade en la tarjeta WEB-00b)
- `src/platform/` — shims de plataforma (HTTP, almacenamiento, env)
- `.cursor/rules/ponytail.mdc` — regla de desarrollo Ponytail para Cursor

## Relación con ejoiFE

La lógica compartida con la app se copiará a `src/app-shared/` desde un commit conocido de `ejoiFE`, con manifiesto verificable en CI. Hasta entonces este repositorio solo contiene el bootstrap Vite + React + TypeScript.

## Variables de entorno

Copia `.env.example` a `.env.local` y ajusta según el entorno. En desarrollo, las peticiones a `/api` se proxyean al backend local (`VITE_DEV_API_PROXY_TARGET`).

## Publicación

**No publicar** este sitio hasta que QA web (SCRUM-116) esté aprobada. `index.html` incluye `noindex` (DP-47).

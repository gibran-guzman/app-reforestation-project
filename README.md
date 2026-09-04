# Lloa Reforestation

Plataforma web para registrar y dar seguimiento a proyectos de reforestación. Centraliza especies, zonas, plantaciones, fotografías y monitoreos de supervivencia para proporcionar trazabilidad ambiental y reportes operativos.

El proyecto está compuesto por un frontend Angular y una API REST en Node.js/Express. La persistencia usa PostgreSQL y la autenticación, el almacenamiento de fotografías y las políticas de acceso se integran con Supabase.

## Requisitos previos

- Node.js 22 LTS o compatible con la imagen `node:22-alpine` del proyecto.
- `pnpm` 11.1.1 para el servidor y el workspace raíz.
- npm, incluido con Node.js, para el cliente Angular.
- Una instancia PostgreSQL 16 o superior con PostGIS habilitado.
- Un proyecto Supabase con Auth y permisos para usar Storage.
- Git, si se va a clonar el repositorio.

La base de datos debe aceptar conexiones mediante `DATABASE_URL`. Las migraciones crean las tablas, índices, políticas y funciones espaciales necesarias.

## Instalación local

Ejecuta estos comandos desde la raíz del repositorio:

```bash
corepack enable
corepack install --global pnpm@11.1.1
pnpm install
pnpm install:all
cp server/.env.production.example .env
cp .env server/.env
```

Edita `.env` y reemplaza los valores de ejemplo. Para trabajar en desarrollo, usa al menos:

```dotenv
NODE_ENV=development
CORS_ORIGIN=http://localhost:4200
```

`server/.env` es necesario porque el script de migraciones carga ese archivo explícitamente. Si modificas `.env`, vuelve a copiarlo a `server/.env` antes de migrar.

Ejecuta las migraciones:

```bash
pnpm migrate
```

Inicia la API en una terminal:

```bash
pnpm dev:server
```

Inicia Angular en otra terminal:

```bash
pnpm dev:client
```

La aplicación estará disponible en `http://localhost:4200`. El proxy de Angular redirige `/api` hacia `http://localhost:3000`.

## Uso rápido

Comprueba que la API puede acceder a la base de datos:

```bash
curl -i http://localhost:3000/health
```

La respuesta correcta es HTTP `200` con un cuerpo similar a:

```json
{"status":"ok","service":"Lloa Reforestation API"}
```

Consulta una configuración pública sin autenticación:

```bash
curl http://localhost:3000/api/config/soil-textures
```

Para probar un flujo autenticado, usa un usuario existente de Supabase:

```bash
curl -i -c cookies.txt \
	-H 'Content-Type: application/json' \
	-d '{"email":"usuario@example.com","password":"tu-password"}' \
	http://localhost:3000/api/auth/login

curl -b cookies.txt http://localhost:3000/api/auth/me
curl -b cookies.txt 'http://localhost:3000/api/plantings?page=1&limit=50'
```

El endpoint `/health` devuelve HTTP `503` si PostgreSQL no está disponible. Las rutas `/api/species`, `/api/zones`, `/api/plantings`, `/api/monitoring` y `/api/reports` requieren autenticación según la operación solicitada.

## Variables de entorno

Guarda las variables en `.env` para la ejecución desde la raíz y en `server/.env` para ejecutar el migrador directamente. No subas archivos `.env` ni claves privadas al repositorio.

| Variable | Descripción | Ejemplo | Obligatoria |
| --- | --- | --- | --- |
| `DATABASE_URL` | URI de conexión a PostgreSQL. | `postgresql://postgres:password@localhost:5432/reforestation` | Sí |
| `SUPABASE_URL` | URL del proyecto Supabase. | `https://project-ref.supabase.co` | Sí |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave de servicio para operaciones administrativas del backend. | `eyJhbGciOi...` | Sí |
| `SUPABASE_ANON_KEY` | Clave pública usada por el flujo de autenticación de usuarios. | `eyJhbGciOi...` | Sí |
| `NODE_ENV` | Entorno de ejecución. | `development` | No, `development` |
| `PORT` | Puerto HTTP de Express. | `3000` | No, `3000` |
| `CORS_ORIGIN` | Origen permitido por CORS. En desarrollo se usa `http://localhost:4200`; en producción debe declararse. | `https://app.example.com` | Sí en producción |
| `DB_SSL_REJECT_UNAUTHORIZED` | Controla la validación del certificado TLS de PostgreSQL. | `false` | No |
| `LOGIN_ENCRYPTION_PRIVATE_KEY` | Clave RSA privada persistente, codificada en Base64, para el cifrado del login. | `base64-encoded-PKCS8-PEM` | Sí en producción |
| `COOKIE_SECURE` | Fuerza cookies `Secure` cuando vale `true`. En producción se activa automáticamente. | `true` | No |
| `LOG_LEVEL` | Nivel de logs de Pino. | `info` | No, `info` |
| `SENTRY_DSN` | DSN de Sentry. Si se omite, Sentry no se inicializa. | `https://public@sentry.example/1` | No |
| `SENTRY_TRACES_SAMPLE_RATE` | Porcentaje decimal de trazas enviadas a Sentry. | `0.1` | No, `0.1` |
| `CLUSTER_ENABLED` | Activa múltiples workers de Node.js cuando vale `true`. | `false` | No, `false` |
| `WORKERS` | Número de workers cuando el clustering está activo. | `2` | No, número de CPUs |

Para producción, genera una clave RSA persistente y conviértela a Base64:

```bash
openssl genrsa -out login.key 2048
base64 -w0 login.key
```

No uses `SUPABASE_SERVICE_ROLE_KEY` ni `LOGIN_ENCRYPTION_PRIVATE_KEY` en el código del cliente.

## Docker

Configura `.env` en la raíz con las variables requeridas y ejecuta:

```bash
docker compose up --build
```

El contenedor ejecuta todas las migraciones pendientes antes de iniciar Express y publica la aplicación en `http://localhost:3000`. El build compila Angular en modo producción y Express sirve los archivos generados desde `public/`.

Para detenerlo:

```bash
docker compose down
```

## Comandos principales

| Comando | Descripción |
| --- | --- |
| `pnpm dev:server` | Inicia la API en modo desarrollo. |
| `pnpm dev:client` | Inicia el servidor de desarrollo de Angular. |
| `pnpm migrate` | Ejecuta las migraciones SQL pendientes. |
| `pnpm build` | Compila Angular y copia el resultado a `public/`. |
| `pnpm build:prod` | Instala dependencias de producción y genera el build completo. |
| `pnpm start` | Inicia Express desde la raíz. |
| `pnpm lint:server` | Ejecuta ESLint sobre el servidor. |
| `docker compose up --build` | Construye y ejecuta la aplicación completa. |

## Tests

Ejecuta la suite del servidor:

```bash
pnpm --dir server test
```

Ejecuta los tests del cliente en Chrome Headless:

```bash
npm --prefix client test
```

Para desarrollo iterativo del servidor:

```bash
pnpm --dir server test:watch
```

También puedes validar el servidor con `pnpm lint:server` y el cliente con:

```bash
npm --prefix client exec tsc -- --noEmit --project client/tsconfig.app.json
```

## Estructura del proyecto

```text
.
├── client/                 # Aplicación Angular, PWA, vistas y servicios HTTP
│   ├── src/app/            # Componentes, páginas, guards, modelos y servicios
│   ├── src/environments/   # Configuración de entorno del cliente
│   └── public/             # Manifest, iconos, Leaflet y robots.txt
├── server/                 # API REST Express
│   ├── src/config/         # Base de datos, Supabase, cookies y constantes
│   ├── src/controllers/    # Controladores HTTP
│   ├── src/middleware/     # Autenticación, validación, límites y errores
│   ├── src/repositories/   # Acceso a datos
│   ├── src/routes/         # Rutas `/api`
│   ├── src/services/       # Lógica de dominio e integraciones
│   ├── src/db/migrations/  # Migraciones SQL versionadas
│   └── scripts/sql/        # Seeds y scripts SQL operativos
├── scripts/                # Automatización de builds raíz
├── Dockerfile              # Build multi-stage de cliente y servidor
├── docker-compose.yml      # Ejecución del servicio en Docker
└── package.json            # Scripts y dependencias del workspace raíz
```

## Migraciones y datos iniciales

Las migraciones se ejecutan en orden y registran su estado en la tabla `migrations`. Para cargar datos de referencia, revisa antes de ejecutar los scripts:

- `server/scripts/sql/02-seed-gad-lloa.sql` reinicia datos de la aplicación y carga el dataset de GAD Lloa.
- `server/scripts/sql/03-seed-supabase-production.sql` conserva datos ajenos al rango sembrado y requiere que los usuarios existan previamente en Supabase Auth.

Los seeds pueden modificar o eliminar datos. Úsalos únicamente sobre la base de datos prevista.

## Contribuir

1. Crea una rama desde la rama principal: `feature/<descripcion>` o `fix/<descripcion>`.
2. Instala dependencias con `pnpm install` y `pnpm install:all`.
3. Ejecuta los tests y linters afectados antes de abrir el pull request.
4. Mantén los cambios enfocados y describe el comportamiento modificado y cualquier cambio de configuración.
5. No incluyas secretos, archivos `.env`, builds de `public/` ni artefactos de cobertura.

Los hooks de Husky/lint-staged validan JavaScript del servidor y TypeScript del cliente en archivos staged.

# Lloa Reforestation — Plataforma de Trazabilidad Ambiental

Sistema de Control para Proyectos de Reforestación Ambiental en la Parroquia Rural Lloa, Pichincha.

> Respuesta tecnológica a la crisis forestal en las laderas del volcán Guagua Pichincha.  
> Automatiza el seguimiento de áreas intervenidas para reducir la tasa de mortalidad de plántulas (>60% actual)  
> mediante monitoreo edafológico, georreferenciación y seguimiento fitosanitario sistemático.

---

## Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Frontend | Angular + Bootstrap 5 + TypeScript | 20 |
| Backend | Node.js + Express | 4.22.2 |
| Base de datos | PostgreSQL + PostGIS (gestionado por Supabase) | 16+ |
| Infraestructura | Supabase | — |
| Mapas | Leaflet | — |
| Logger | Pino | — |
| Autenticación | JWT (Supabase Auth + HttpOnly cookies) | — |
| Almacenamiento | Supabase Storage | — |
| Subida de archivos | Multer | 2.1 |
| Error tracking | Sentry (condicional) | 10 |
| Migraciones | node-pg-migrate | — |
| CI/CD | GitHub Actions | — |
| Contenedor | Docker | — |

---

## ⚙️ Estado Actual — Fase 1 Completa (Sprints 1-3)

### Sprint 1 — Infraestructura ✅
- [x] Estructura monorepo (client + server)
- [x] Servidor Express 4 con capas: routes → controller → service → repository
- [x] Pool de conexiones PostgreSQL configurado
- [x] Endpoint `POST /api/species` con validación de entrada
- [x] Logger estructurado (pino)
- [x] Middleware global de errores con discriminación por tipo
- [x] Seguridad básica: helmet, CORS restringido
- [x] Scaffold Angular 20 con Bootstrap 5 y routing
- [x] Linter (ESLint) configurado y pasando en 0 warnings/errors

### Sprint 2 — Autenticación + Modelo Geoespacial ✅
- [x] Integración Supabase Auth (signup, login, refresh token, /me)
- [x] Middleware de autenticación (`authenticate`) y autorización por roles (`authorize`)
- [x] Roles: Admin y Técnico
- [x] Protección de rutas backend con JWT
- [x] Extensión PostGIS habilitada + migración `001_initial_schema.sql`
- [x] Tabla `intervention_zones` con geometría `Polygon, SRID 4326` + índice GIST
- [x] Tabla `planting_sites` con `location GEOMETRY(Point, 4326)` + índice GIST
- [x] Tabla `monitoring_records` con control de supervivencia
- [x] Tabla `profiles` extendida de Supabase Auth con RLS
- [x] Funciones SQL: `is_point_in_zone()`, `find_zone_by_point()`
- [x] CRUD completo `intervention_zones` (5 endpoints)
- [x] Validación de entrada con `express-validator`

### Sprint 3 — Gestión de Zonas y Especies ✅
- [x] CRUD `intervention_zones` — listar, obtener, crear, actualizar, eliminar
- [x] CRUD `species_catalog` — listar, obtener, crear, actualizar, eliminar

---

## Roadmap — 18 Sprints / ~340 horas

### Fase 1: Fundamentos de Datos (Sprints 1-3)

| Sprint | Horas | Historias | Descripción |
|--------|-------|-----------|-------------|
| **1** ✅ | 20 | — | Infraestructura, monorepo, DB pool, API base, scaffold Angular |
| **2** ✅ | 25 | HU5, HU4 | PostGIS + modelo geoespacial + autenticación JWT + roles |
| **3** ✅ | 20 | HU5 (cont.) | CRUD zonas de intervención + CRUD catálogo de especies (admin) |

**HU4 — Autenticación segura**
- [x] Integrar Supabase Auth
- [x] Roles: Admin, Técnico
- [x] Login + refresh token con Supabase
- [x] Tokens en HttpOnly cookies (elimina vector XSS de localStorage)
- [x] `POST /api/auth/logout` limpia cookies
- [x] Rate limiting en auth endpoints
- [x] Protección de rutas backend con middleware (cookie + header)
- [x] Protección de rutas frontend (guards)
- [x] Interceptor HTTP con `withCredentials: true`
- [ ] Registro de usuarios solo por Admin (endpoint existe sin restricción)

**HU5 — Modelado geoespacial**
- [x] Activar extensión PostGIS
- [x] Tabla `intervention_zones` con geometría (Polygon, SRID 4326)
- [x] Tabla `planting_sites` con columna `location GEOMETRY(Point, 4326)`
- [x] Índice espacial (`GIST`)
- [x] Validación de coordenadas (funciones SQL `is_point_in_zone`, `find_zone_by_point`)

**Nuevo — Gestión de zonas y especies**
- [x] CRUD `intervention_zones` (nombre, polígono, responsable)
- [x] CRUD `species_catalog` — listar, obtener, crear, actualizar, eliminar

---

### Fase 2: Captura en Campo (Sprints 4-8)

| Sprint | Horas | Historias | Descripción |
|--------|-------|-----------|-------------|
| **4** ✅ | 25 | HU1 | Formulario de registro de plántula + geolocalización GPS + galería de plantaciones |
| **5** | 20 | HU2 | Service Worker + IndexedDB + detección de conectividad |
| **6** | 20 | HU2 | Sincronización automática + resolución de conflictos |
| **7** ✅ | 15 | HU1 | Captura de foto + almacenamiento (Supabase Storage) + compresión client-side |
| **8** | 20 | HU3 | Consulta de historial con filtros y trazabilidad |

**HU1 — Registro de nueva plántula**
- [x] Formulario con campos:
  - Especie (selector desde `species_catalog`)
  - Zona de intervención
  - Variables edafológicas: pH, textura, humedad
  - Fecha de siembra
- [x] Captura GPS automática (Geolocation API) con reintento
- [x] Fallback: ingreso manual de coordenadas + clic/arrastre en mapa Leaflet
- [x] Foto de la plántula (opcional) con compresión client-side (Canvas → WebP)
- [x] Validación completa del lado cliente y servidor
- [x] Vista de galería con thumbnails de todas las plantaciones

**HU2 — Sincronización offline**
- [x] Almacenamiento local en IndexedDB (Dexie.js)
- [x] Cola de sincronización con reintentos (backoff exponencial)
- [x] Badge visual de registros pendientes
- [ ] Resolución de conflictos (último escritor gana + notificación)
- [x] Sincronización de fotos (background sync si es posible)
- [ ] Service Worker con estrategia "Network First, fallback to Cache"

**HU3 — Consulta de historial**
- [ ] Vista de trazabilidad por plántula (línea de tiempo)
- [ ] Filtros: zona, especie, rango de fechas, estado de salud
- [ ] Paginación + búsqueda
- [ ] Detalle de cada medición: foto, coordenadas, variables, evolución

---

### Fase 3: Reportes y Analítica (Sprints 9-14)

| Sprint | Horas | Historias | Descripción |
|--------|-------|-----------|-------------|
| **9** | 20 | HU6 | Endpoints de estadísticas + generación PDF server-side |
| **10** | 15 | HU6 | Exportación Excel + dashboard básico |
| **11** | 20 | HU7 | Integración Leaflet + mapa de puntos de siembra |
| **12** | 20 | HU7 | Mapa de calor de mortalidad con filtros |
| **13** | 15 | — | Dashboard general: cards de resumen, gráficos de evolución |
| **14** | 15 | — | Refinamiento UI/UX, responsive, accesibilidad |

**HU6 — Generación de reportes**
- [ ] Endpoint `GET /api/reports/survival-rate` con filtros
- [ ] Generación PDF (puppeteer o pdfkit)
- [ ] Generación Excel (exceljs)
- [ ] Dashboard con resúmenes estadísticos
- [ ] Tabla de tasa de supervivencia por zona y especie

**HU7 — Mapa de calor de mortalidad**
- [ ] Mapa Leaflet con tiles OpenStreetMap
- [ ] Capa de puntos de siembra con íconos por estado
- [ ] Capa de calor (Leaflet.heat) para mortalidad
- [ ] Filtros: especie, período, zona
- [ ] Popup con detalle al hacer clic en cada punto

---

### Fase 4: Cierre y Documentación (Sprints 15-18)

| Sprint | Horas | Descripción |
|--------|-------|-------------|
| **15** | 20 | Pruebas de usuario + QA + correcciones |
| **16** | 15 | Documentación técnica (API docs, arquitectura, despliegue) |
| **17** | 15 | Despliegue en producción (Supabase + Vercel/Netlify) |
| **18** | 10 | Buffer de contingencia |

---

## 📐 Arquitectura — Flujo de Datos

```
┌─────────────────────────────────────────────────────────┐
│                     CLIENTE (PWA)                        │
│                                                         │
│  ┌──────────┐   ┌──────────┐   ┌────────────────────┐  │
│  │ Angular  │   │  Leaflet │   │  Service Worker     │  │
│  │ (UI)     │   │  (Mapas) │   │  + IndexedDB        │  │
│  └────┬─────┘   └──────────┘   └─────────┬──────────┘  │
│       │          tokens en                │              │
│       │          memoria (no localStorage)│  Sync Queue  │
│       │          HTTP/REST                │              │
│       ▼          withCredentials: true    ▼              │
└─────────────────────────────────────────────────────────┘
               │ HttpOnly cookies (JWT)      │
               │                              │
               └──────────────┬───────────────┘
                              ▼
┌─────────────────────────────────────────────────────────┐
│                   SERVER (Express 4.22.2)                │
│                                                         │
│  ┌──────────┐   ┌──────────┐   ┌────────────────────┐  │
│  │  Routes  │──▶│Controller│──▶│     Service         │  │
│  └──────────┘   └──────────┘   └─────────┬──────────┘  │
│                                          │              │
│                                 ┌────────▼────────┐     │
│                                 │   Validator +    │     │
│                                 │   Repository     │     │
│                                 └────────┬────────┘     │
│                                          │              │
│  ┌───────────────────────────────────────┘              │
│  │  Middleware: cookie-parser → Auth (cookie/header)    │
│  │  → pino-http → ErrorHandler → rate-limit → Sentry   │
│  │  Cluster (opt-in) | requestTimeout: 30s              │
└──┼──────────────────────────────────────────────────────┘
   │
   ▼
┌─────────────────────────────────────────────────────────┐
│            SUPABASE (PostgreSQL + PostGIS)               │
│                                                         │
│  species_catalog │ intervention_zones │ planting_sites  │
│  soil_readings   │ health_monitoring  │ users           │
│                                                         │
│  Migraciones: node-pg-migrate (001, 002)                │
└─────────────────────────────────────────────────────────┘
```

---

## 📁 Estructura del Proyecto

```
app-reforestation-project/
├── .github/workflows/               # CI/CD (GitHub Actions)
├── client/                          # Angular 20 PWA
│   └── src/app/
│       ├── components/              # Componentes reutilizables
│       ├── pages/                   # Páginas (rutas)
│       ├── services/                # Servicios HTTP + offline
│       ├── guards/                  # Route guards (auth, admin)
│       ├── interceptors/            # Auth interceptor (withCredentials)
│       └── models/                  # Interfaces TypeScript
│
├── server/                          # API Express 4.22.2
│   └── src/
│       ├── config/                  # DB, env, cookie helper
│       ├── controllers/             # Capa de presentación (req/res)
│       ├── services/                # Lógica de negocio
│       ├── repositories/            # Acceso a datos (SQL)
│       ├── validators/              # Validación de entrada
│       ├── middleware/              # Auth (cookie/header), error handler
│       ├── utils/                   # Logger, response helpers
│       ├── errors/                  # Clases de error custom
│       ├── routes/                  # Definición de rutas
│       └── db/                      # Migraciones (node-pg-migrate)
│
├── Dockerfile                       # Multi-stage build
├── .dockerignore
└── package.json                     # Orquestación monorepo
```

---

## 🚀 Cómo empezar

```bash
# Requisitos
# - Node.js >= 22 (server), >= 20 (client)
# - pnpm >= 11
# - Una cuenta en Supabase (la base de datos es el PostgreSQL de Supabase, con PostGIS)

# 1. Clonar e instalar
git clone <repo>
pnpm --dir server install
npm --prefix client install

# 2. Configurar variables de entorno
cp server/.env.example server/.env
# Editar: DATABASE_URL (Supabase → Project Settings → Database → Connection string → URI),
# CORS_ORIGIN, SUPABASE_URL, SUPABASE_ANON_KEY
# Opcional: SENTRY_DSN, SESSION_SECRET, CLUSTER_ENABLED

# 3. Ejecutar migraciones de base de datos (se aplican sobre el PostgreSQL de Supabase)
pnpm --dir server migrate

# 4. Iniciar servidor (http://localhost:3000)
pnpm --dir server start

# 5. Iniciar cliente (http://localhost:4200)
npm --prefix client start
```

---

## 🐳 Despliegue con Docker

```bash
# Construir imagen multi-stage
docker build -t app-reforestation .

# Ejecutar (las migraciones corren automáticamente al iniciar)
docker run -p 3000:3000 \
  -e DATABASE_URL=postgres://... \
  -e SUPABASE_URL=https://... \
  -e SUPABASE_ANON_KEY=... \
  -e CORS_ORIGIN=http://localhost:4200 \
  -e SENTRY_DSN=... \
  -e SESSION_SECRET=... \
  app-reforestation

# Modo cluster (usa todos los CPUs)
docker run -p 3000:3000 -e CLUSTER_ENABLED=true ... app-reforestation
```

El servidor Express sirve el build de producción de Angular desde `/app/public`. Las migraciones se ejecutan con `node-pg-migrate` antes de iniciar el servidor.

---

## ☁️ Despliegue en Seenode (reemplaza VPS + ngrok)

Seenode hospeda el servidor Express **y** sirve el build estático de Angular desde una sola URL pública con SSL. Es el reemplazo directo del esquema `VPS + ngrok`: ya no necesitas un túnel ni un dominio ngrok efímero.

### 1. Prepara el proyecto localmente

```bash
# Instalar dependencias (una sola vez)
pnpm --dir server install
npm --prefix client install
```

### 2. Crea el Web Service desde el dashboard de Seenode

1. En [cloud.seenode.com](https://cloud.seenode.com) crea un **Web Service** y conecta tu repositorio de GitHub/GitLab.
2. Configura los comandos y el puerto (el proyecto ya trae los scripts en `package.json`):

   | Campo | Valor |
   |-------|-------|
   | **Build Command** | `npm run build:seenode` |
   | **Start Command** | `node server/src/index.js` |
   | **Port** | `3000` |

   - `npm run build:seenode` instala las dependencias del server (prod) y del cliente, compila Angular y copia el build a `./public` (la carpeta que Express sirve automáticamente).
   - El servidor escucha en `process.env.PORT || 3000`, por eso el puerto debe ser `3000`.

3. Añade estas variables de entorno en el dashboard:

   ```
   NODE_ENV=production
   PORT=3000
   CORS_ORIGIN=https://TU-URL-SEENODE.seenode.app   # reemplaza por tu URL real
   DATABASE_URL=postgresql://postgres.<PROJECT_REF>:<PASSWORD>@aws-0-<REGION>.pooler.supabase.com:6543/postgres?sslmode=require
   SUPABASE_URL=https://<PROJECT_REF>.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=<SERVICE_ROLE_KEY>
   SUPABASE_ANON_KEY=<ANON_KEY>
   LOGIN_ENCRYPTION_PRIVATE_KEY=<clave-rsa-base64>
   # Opcional:
   SENTRY_DSN=
   ```

   > ⚠️ `NODE_ENV=production` es obligatorio: activa el CSP de Helmet, las cookies `secure`, el CORS restringido y la redirección SPA (sirve `index.html` desde `./public`).

### 3. Ejecutar migraciones

Cuando tengas `DATABASE_URL` configurado, ejecuta las migraciones una vez:

```bash
npm run migrate
```

(o desde el dashboard de Seenode añade `migrate` al Start Command la primera vez: `node server/src/db/migrate.js && node server/src/index.js`).

### 4. Despliegue automático

Cada push a la rama conectada vuelve a construir y desplegar automáticamente. Actualiza tu URL real en `client/src/index.html` (canonical), `client/public/robots.txt` y `client/public/sitemap.xml` (que hoy usan un marcador `TU-URL-SEENODE.seenode.app`).

---

## 🤖 CI/CD

El workflow de GitHub Actions (`.github/workflows/ci.yml`) ejecuta en cada PR/push a `main`:

| Job | Pasos |
|-----|-------|
| **Server** | `pnpm lint` + `pnpm test` (526 tests) |
| **Client** | `npm test` (349 tests, ChromeHeadless) + `npm run build --production` |

---

## 📄 API Endpoints (Progresivos)

| Método | Ruta | HU | Estado |
|--------|------|----|--------|
| `GET` | `/health` | — | ✅ |
| `POST` | `/api/species` | — | ✅ |
| `POST` | `/api/auth/signup` | HU4 | ✅ |
| `POST` | `/api/auth/login` | HU4 | ✅ |
| `POST` | `/api/auth/refresh` | HU4 | ✅ |
| `POST` | `/api/auth/logout` | HU4 | ✅ |
| `GET` | `/api/auth/me` | HU4 | ✅ |
| `GET` | `/api/zones` | — | ✅ |
| `GET` | `/api/zones/:id` | — | ✅ |
| `POST` | `/api/zones` | — | ✅ |
| `PUT` | `/api/zones/:id` | — | ✅ |
| `DELETE` | `/api/zones/:id` | — | ✅ |
| `GET` | `/api/config` | — | ✅ |
| `GET` | `/api/species` | — | ✅ |
| `GET` | `/api/species/:id` | — | ✅ |
| `PUT` | `/api/species/:id` | — | ✅ |
| `DELETE` | `/api/species/:id` | — | ✅ |
| `GET` | `/api/plantings` | HU1 | ✅ |
| `POST` | `/api/plantings` | HU1 | ✅ |
| `POST` | `/api/plantings/:id/photo` | HU1 | ✅ |
| `GET` | `/api/plantings/:id` | HU3 | ✅ |
| `POST` | `/api/plantings/sync` | HU2 | ✅ |
| `GET` | `/api/reports/survival-rate` | HU6 | ✅ |
| `GET` | `/api/reports/species-stats` | HU6 | ✅ |
| `GET` | `/api/reports/zone-summary` | HU6 | ✅ |
| `GET` | `/api/reports/evolution` | HU6 | ✅ |
| `GET` | `/api/analytics/heatmap` | HU7 | ✅ |

---

## 📊 Criterios de Éxito

- [ ] Tasa de mortalidad de plántulas < 40% al primer año
- [ ] Sincronización offline funcional en zonas sin cobertura
- [ ] Reportes exportables (PDF/Excel) para rendición de cuentas del GAD
- [ ] Mapa de calor operativo con datos de campo reales
- [x] Autenticación con roles (backend)
- [ ] Auditoría de cambios
- [ ] 0 regresiones de seguridad (helmet, CORS, JWT, rate limiting)

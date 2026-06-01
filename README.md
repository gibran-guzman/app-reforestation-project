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
| Backend | Node.js + Express | 5 |
| Base de datos | PostgreSQL + PostGIS | 16+ |
| Infraestructura | Supabase | — |
| Mapas | Leaflet | — |
| Logger | Pino | — |
| Autenticación | JWT (Supabase Auth) | — |
| Almacenamiento | Supabase Storage | — |
| Subida de archivos | Multer | 2.1 |

---

## ⚙️ Estado Actual — Fase 1 Completa (Sprints 1-3)

### Sprint 1 — Infraestructura ✅
- [x] Estructura monorepo (client + server)
- [x] Servidor Express 5 con capas: routes → controller → service → repository
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
- [ ] Rate limiting en auth endpoints
- [x] Protección de rutas backend con middleware
- [ ] Protección de rutas frontend (guards)
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
- [ ] Service Worker con estrategia "Network First, fallback to Cache"
- [ ] Almacenamiento local en IndexedDB (Dexie.js)
- [ ] Cola de sincronización con reintentos (backoff exponencial)
- [ ] Badge visual de registros pendientes
- [ ] Resolución de conflictos (último escritor gana + notificación)
- [ ] Sincronización de fotos (background sync si es posible)

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
│       │                                  │              │
│       │          HTTP/REST               │  Sync Queue  │
│       ▼                                  ▼              │
└─────────────────────────────────────────────────────────┘
               │                              │
               │                     ┌────────┘
               ▼                     ▼
┌─────────────────────────────────────────────────────────┐
│                   SERVER (Express 5)                     │
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
│  │  Middleware: Auth(JWT) → ErrorHandler → Logger       │
└──┼──────────────────────────────────────────────────────┘
   │
   ▼
┌─────────────────────────────────────────────────────────┐
│            SUPABASE (PostgreSQL + PostGIS)               │
│                                                         │
│  species_catalog │ intervention_zones │ planting_sites  │
│  soil_readings   │ health_monitoring  │ users           │
└─────────────────────────────────────────────────────────┘
```

---

## 📁 Estructura del Proyecto

```
app-reforestation-project/
├── client/                          # Angular 20 PWA
│   └── src/app/
│       ├── components/              # Componentes reutilizables
│       ├── pages/                   # Páginas (rutas)
│       ├── services/                # Servicios HTTP + offline
│       └── models/                  # Interfaces TypeScript
│
├── server/                          # API Express 5
│   └── src/
│       ├── config/                  # DB, env
│       ├── controllers/             # Capa de presentación (req/res)
│       ├── services/                # Lógica de negocio
│       ├── repositories/            # Acceso a datos (SQL)
│       ├── validators/              # Validación de entrada
│       ├── middleware/              # Auth, error handler
│       ├── utils/                   # Logger, helpers
│       ├── errors/                  # Clases de error custom
│       └── routes/                  # Definición de rutas
│
└── package.json                     # Orquestación monorepo
```

---

## 🚀 Cómo empezar

```bash
# Requisitos
# - Node.js >= 20
# - pnpm >= 8
# - PostgreSQL 16+ con PostGIS
# - Una cuenta en Supabase (o PostgreSQL local)

# 1. Clonar e instalar
git clone <repo>
pnpm --dir server install
npm --prefix client install

# 2. Configurar variables de entorno
cp server/.env.example server/.env
# Editar DATABASE_URL, CORS_ORIGIN, JWT_SECRET, etc.

# 3. Crear tablas base
psql "$DATABASE_URL" -f server/src/db/schema.sql

# 4. Iniciar servidor (http://localhost:3000)
pnpm --dir server start

# 5. Iniciar cliente (http://localhost:4200)
npm --prefix client start
```

---

## 📄 API Endpoints (Progresivos)

| Método | Ruta | HU | Estado |
|--------|------|----|--------|
| `GET` | `/health` | — | ✅ |
| `POST` | `/api/species` | — | ✅ |
| `POST` | `/api/auth/signup` | HU4 | ✅ |
| `POST` | `/api/auth/login` | HU4 | ✅ |
| `GET` | `/api/auth/me` | HU4 | ✅ |
| `GET` | `/api/zones` | — | ✅ |
| `GET` | `/api/zones/:id` | — | ✅ |
| `POST` | `/api/zones` | — | ✅ |
| `PUT` | `/api/zones/:id` | — | ✅ |
| `DELETE` | `/api/zones/:id` | — | ✅ |
| `GET` | `/api/species` | — | ✅ |
| `GET` | `/api/species/:id` | — | ✅ |
| `PUT` | `/api/species/:id` | — | ✅ |
| `DELETE` | `/api/species/:id` | — | ✅ |
| `GET` | `/api/plantings` | HU1 | ✅ |
| `POST` | `/api/plantings` | HU1 | ✅ |
| `POST` | `/api/plantings/:id/photo` | HU1 | ✅ |
| `GET` | `/api/plantings/:id` | HU3 | ✅ |
| `POST` | `/api/plantings/sync` | HU2 | ❌ |
| `GET` | `/api/reports/survival-rate` | HU6 | ❌ |
| `GET` | `/api/analytics/heatmap` | HU7 | ❌ |

---

## 📊 Criterios de Éxito

- [ ] Tasa de mortalidad de plántulas < 40% al primer año
- [ ] Sincronización offline funcional en zonas sin cobertura
- [ ] Reportes exportables (PDF/Excel) para rendición de cuentas del GAD
- [ ] Mapa de calor operativo con datos de campo reales
- [x] Autenticación con roles (backend)
- [ ] Auditoría de cambios
- [ ] 0 regresiones de seguridad (helmet, CORS, JWT, rate limiting)

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

---

## ⚙️ Estado Actual — Sprint 1 (Completado)

- [x] Estructura monorepo (client + server)
- [x] Servidor Express 5 con capas: routes → controller → service → repository
- [x] Pool de conexiones PostgreSQL configurado
- [x] Endpoint `POST /api/species` con validación de entrada
- [x] Logger estructurado (pino)
- [x] Middleware global de errores con discriminación por tipo
- [x] Seguridad básica: helmet, CORS restringido, rate-limit por payload
- [x] Scaffold Angular 20 con Bootstrap 5 y routing
- [x] Linter (ESLint) configurado y pasando en 0 warnings/errors

---

## Roadmap — 18 Sprints / ~340 horas

### Fase 1: Fundamentos de Datos (Sprints 1-3)

| Sprint | Horas | Historias | Descripción |
|--------|-------|-----------|-------------|
| **1** ✅ | 20 | — | Infraestructura, monorepo, DB pool, API base, scaffold Angular |
| **2** | 25 | HU5, HU4 | PostGIS + modelo geoespacial + autenticación JWT + roles |
| **3** | 20 | HU5 (cont.) | CRUD zonas de intervención + CRUD catálogo de especies (admin) |

**HU4 — Autenticación segura**
- [ ] Integrar Supabase Auth o JWT propio
- [ ] Roles: Admin, Técnico
- [ ] Login + refresh token + rate limiting
- [ ] Protección de rutas (frontend y backend)
- [ ] Registro de usuarios solo por Admin

**HU5 — Modelado geoespacial**
- [ ] Activar extensión PostGIS
- [ ] Tabla `intervention_zones` con geometría (Polygon, SRID 4326)
- [ ] Tabla `planting_sites` con columna `location GEOMETRY(Point, 4326)`
- [ ] Índice espacial (`GIST`)
- [ ] Validación de coordenadas dentro de zonas permitidas

**Nuevo — Gestión de zonas y especies**
- [ ] CRUD `intervention_zones` (nombre, polígono, responsable)
- [ ] CRUD `species_catalog` (nombre científico, nombre común, altitud recomendada, tipo de suelo)

---

### Fase 2: Captura en Campo (Sprints 4-8)

| Sprint | Horas | Historias | Descripción |
|--------|-------|-----------|-------------|
| **4** | 25 | HU1 | Formulario de registro de plántula + geolocalización GPS |
| **5** | 20 | HU2 | Service Worker + IndexedDB + detección de conectividad |
| **6** | 20 | HU2 | Sincronización automática + resolución de conflictos |
| **7** | 15 | HU1 | Captura de foto + almacenamiento (local → servidor) |
| **8** | 20 | HU3 | Consulta de historial con filtros y trazabilidad |

**HU1 — Registro de nueva plántula**
- [ ] Formulario con campos:
  - Especie (selector desde `species_catalog`)
  - Zona de intervención
  - Variables edafológicas: pH, textura, humedad
  - Estado de supervivencia + vigor
  - Fecha de siembra
- [ ] Captura GPS automática (Geolocation API)
- [ ] Fallback: ingreso manual de coordenadas
- [ ] Foto de la plántula (opcional)
- [ ] Validación completa del lado cliente y servidor

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
| `POST` | `/api/auth/login` | HU4 | ❌ |
| `POST` | `/api/auth/register` | HU4 | ❌ |
| `GET/POST` | `/api/zones` | — | ❌ |
| `GET/POST` | `/api/plantings` | HU1 | ❌ |
| `GET` | `/api/plantings/:id` | HU3 | ❌ |
| `POST` | `/api/plantings/sync` | HU2 | ❌ |
| `GET` | `/api/reports/survival-rate` | HU6 | ❌ |
| `GET` | `/api/analytics/heatmap` | HU7 | ❌ |

---

## 📊 Criterios de Éxito

- [ ] Tasa de mortalidad de plántulas < 40% al primer año
- [ ] Sincronización offline funcional en zonas sin cobertura
- [ ] Reportes exportables (PDF/Excel) para rendición de cuentas del GAD
- [ ] Mapa de calor operativo con datos de campo reales
- [ ] Autenticación con roles y auditoría de cambios
- [ ] 0 regresiones de seguridad (helmet, CORS, JWT, rate limiting)

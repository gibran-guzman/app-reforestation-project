# Planificación — Lloa Reforestation

> Progreso y tracking del desarrollo. Actualizado: 2026-06-02 — Semanas 1-2 completadas, Sprints 9-12 completados

---

## Leyenda

- `⬜` Pendiente
- `🔄` En progreso
- `✅` Completado
- `❌` Bloqueado

---

## Resumen de Avance

| Fase | Sprints | Avance |
|------|---------|--------|
| **1 — Fundamentos de Datos** | 1, 2, 3 | ✅ **100%** |
| **2 — Captura en Campo** | 4, 5, 6, 7, 8 | ✅ **100%** |
| **3 — Reportes y Analítica** | 9, 10, 11, 12, 13, 14 | ✅ **67%** (Sprints 9-12 listos) |
| **4 — Cierre y Documentación** | 15, 16, 17, 18 | ⬜ **0%** |

---

## Fase 1: Fundamentos de Datos ✅

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
- [x] CRUD `species` — listar, obtener, crear, actualizar, eliminar

---

## Fase 2: Captura en Campo

### Sprint 4 — Registro de Plántula (HU1) ✅
- [x] Formulario con especie, zona, variables edafológicas, fecha de siembra
- [x] Captura GPS automática (Geolocation API) con reintento
- [x] Fallback: ingreso manual de coordenadas + clic/arrastre en mapa Leaflet
- [x] Foto de la plántula con compresión client-side (Canvas → WebP)
- [x] Validación completa cliente (rangos, tipos, campos requeridos)
- [x] Validación servidor (express-validator + point-in-zone PostGIS)
- [x] Galería con thumbnails, estados loading/empty/error
- [x] `POST /api/plantings` — crear plantación
- [x] `GET /api/plantings` — listar con nombre de especie y zona
- [x] `GET /api/plantings/:id` — detalle individual con nombres
- [x] `POST /api/plantings/:id/photo` — subir foto comprimida a Supabase Storage
- [x] Manejo de errores consistente en zoneController (try/catch/next)
- [x] Bugfix: JOIN contra `species_catalog` → `species` (tabla incorrecta)

---

### Sprint 5 — Service Worker + IndexedDB (HU2)
**20h — Prioridad: 🔴 Alta (sin offline no hay campo)**

#### Service Worker
- [x] PWA configurado con `@angular/pwa` + `@angular/service-worker@20`
- [x] `ngsw-config.json` con estrategia híbrida:
  - API catálogos (species, zones): `freshness` (network first, cache 1d)
  - API plantings: `performance` (cache first, 50 entries, 1d)
  - Assets: prefetch app shell, lazy con prefetch para imágenes
- [x] `manifest.webmanifest` con nombre "Lloa Reforestación", icons, standalone display
- [x] Service Worker registrado en `app.config.ts` con `provideServiceWorker`
- [x] `index.html` con manifest link + theme-color `#198754`
- [x] Iconos PWA generados (72x72 a 512x512)

#### IndexedDB (Dexie.js)
- [x] Dexie.js instalado (`dexie@4.4.3`)
- [x] Schema DB local: `pendingPlantings`, `pendingPhotos` con autoincrement ID
- [x] Servicio `OfflineService` con:
  - `savePlanting(data, photo?)` — guarda plantación pendiente en IndexedDB
  - `getPendingPlantings()` — lista registros pendientes
  - `removePlanting(id)` — elimina después de sync exitoso
  - `incrementRetry(id)` — backoff para reintentos
  - `pendingCount` signal — contador reactivo de pendientes
  - Alerta si almacenamiento local > 80%

#### Conectividad
- [x] `ConnectivityService` con signal reactiva (`navigator.onLine` + eventos online/offline)
- [x] Badge "Online"/"Offline" en navbar con indicador de color
- [x] Badge de registros pendientes en navbar (`pendingCount`)
- [x] Estado de conexión + pendientes en dashboard
- [x] Navbar: enlace "Crear usuario" en dropdown solo para admin

#### Archivos creados/modificados
```
client/src/app/
├── services/
│   ├── offline.service.ts          # NUEVO — Dexie CRUD + cola
│   ├── connectivity.service.ts     # NUEVO — estado online/offline
│   └── index.ts                    # MOD — export nuevos servicios
├── components/navbar/navbar.ts     # MOD — connectivity + offline signals
├── components/navbar/navbar.html   # MOD — badges online/offline/pendientes
├── pages/dashboard/dashboard.ts    # MOD — connectivity + offline signals
├── pages/dashboard/dashboard.html  # MOD — badges conexión + pendientes
├── pages/register/register.ts      # MOD — admin-only user creation
├── pages/register/register.html    # MOD — formulario con selector de rol
├── app.routes.ts                   # MOD — adminGuard en /register
├── app.config.ts                   # MOD — provideServiceWorker
├── ngsw-config.json                # NUEVO — estrategia cache SW
├── public/manifest.webmanifest     # NUEVO — PWA manifest
├── public/icons/                   # NUEVO — iconos PWA
└── package.json                    # MOD — @angular/service-worker
```

#### Integración offline (completado)
- [x] `PlantingForm` detecta `connectivity.online()` — si offline, guarda en IndexedDB vía `OfflineService.savePlanting()`
- [x] `SyncService` con `effect()` que escucha cambios de conectividad y sincroniza automáticamente al reconectar
- [x] Sincronización manual desde dashboard con botón "Sincronizar ahora"
- [x] Dashboard: lista de registros pendientes con fecha, especie/zona, estado de reintentos
- [x] Sync con backoff: máximo 5 reintentos antes de descartar
- [x] Sync incluye fotos: después de crear plantación online, sube la foto
- [x] Badge de pendientes reactivo en navbar y dashboard

---

### Sprint 6 — Sincronización Automática (HU2) ✅
**20h — Prioridad: 🔴 Alta (depende de Sprint 5)**

- [x] Cola de sincronización con reintentos (backoff exponencial, max 5 reintentos)
- [x] `POST /api/plantings/sync` endpoint para sync batch con resultados por ítem
- [x] Envío de fotos pendientes post-sync
- [x] Resolución de conflictos (último escritor gana + notificación `conflict: 'resolved'`)
- [x] Badge visual de registros pendientes de sincronizar (`pendingCount` signal)
- [x] Trigger automático al recuperar conectividad (`effect()` en `sync.service.ts`)
- [x] Indicador de progreso de sync (`progress` signal con barra en dashboard)
- [x] Botón "Actualizar lista" en dashboard para refresco manual

---

### Sprint 7 — Captura de Foto (HU1) ✅
- [x] Captura con `<input capture="environment">`
- [x] Compresión client-side: Canvas → WebP, max 1200px, calidad 0.8
- [x] Subida a Supabase Storage bucket `planting-photos`
- [x] Middleware Multer con memoryStorage, límite 5MB, solo JPG/PNG/WebP
- [x] Actualización de `photo_url` en registro de plantación

---

### Sprint 8 — Historial con Filtros (HU3) ✅
**20h — Prioridad: 🟡 Media**

- [x] Vista de trazabilidad por plántula (línea de tiempo vertical con indicador de estado)
- [x] Filtros: zona, especie, rango de fechas (`zone_id`, `species_id`, `from`, `to`)
- [x] Paginación en `GET /api/plantings` (page, limit, meta)
- [x] Detalle de medición: foto, coordenadas, pH, humedad, textura, evolución
- [x] Componente `PlantingDetail` con timeline de monitoreos

#### Tareas técnicas
- [x] Endpoint `GET /api/plantings?page=&limit=&zone_id=&species_id=&from=&to=` con WHERE dinámico
- [x] Servicio `MonitoringService` + `monitoringRepository` (CRUD sobre `monitoring_records`)
- [x] Validación de monitoreo en servidor (`monitoringValidator.js`)
- [x] Componente Timeline con badges de supervivencia (vivo/estresado/muerto)

---

## Fase 2B — Seguridad (HU4 Pendants)
**4-6h — Prioridad: 🔴 Alta (previo a deploy)**

- [x] Rate limiting en auth endpoints (`express-rate-limit`) — 10 intentos/login cada 15min, 3 signup/hora
- [x] Rate limiter middleware modular (`server/src/middleware/rateLimiter.js`)
- [x] Guard de ruta frontend — `authGuard` + `adminGuard` en todas las rutas protegidas
- [x] Restricción: solo Admin puede crear usuarios — middleware `authenticate` + `authorize('admin')` en `POST /api/auth/signup`
- [x] Página `/register` protegida con `adminGuard` + convertida en creación de usuarios con selector de rol
- [x] Navbar: enlace "Crear usuario" visible solo para admin
- [x] Server linter OK · Client build OK

---

## Fase 3: Reportes y Analítica

### Sprint 9 — Estadísticas + PDF (HU6) ✅
**20h — Prioridad: 🟡 Media**

- [x] Endpoint `GET /api/reports/survival-rate` con filtros (zone_id, species_id, from, to) y CTE con última medición
- [x] Endpoint `GET /api/reports/species-stats` — total y supervivencia por especie
- [x] Endpoint `GET /api/reports/zone-summary` — total y supervivencia por zona
- [x] Generación PDF server-side con pdfkit (resumen general + tabla detallada)
- [x] Diseño de template PDF: branding GAD, gráfica de barras de supervivencia, footer con paginación
- [x] Validación de filtros en servidor (`reportsValidator.js` + 7 tests)
- [x] Chart.js instalado en frontend con gráficos doughnut (distribución) y barra apilada (por especie)
- [x] Página `/reports` en frontend con cards resumen, barras de distribución, tablas por especie/zona
- [x] Filtros por especie y zona en la vista de reportes
- [x] Botón "Exportar PDF" con descarga tipo blob

### Sprint 10 — Dashboard (HU6) ✅
**10h — Prioridad: 🟡 Media**

- [x] Dashboard básico: 4 cards de resumen (total, monitoreadas, supervivencia %, sin monitoreo)
- [x] Tabla de supervivencia por especie (total, vivas, estresadas, muertas, %)
- [x] Tabla de supervivencia por zona (total, vivas, estresadas, muertas, %)
- [x] Colores dinámicos por rango de supervivencia (verde ≥70%, amarillo ≥40%, rojo <40%)
- [x] Estados loading/error/empty para cada tabla
- [x] Login: eliminado enlace "Crear cuenta" (registro solo admin)

> 📝 Excel export excluído del alcance por decisión del usuario

### Sprint 11 — Mapa de Puntos de Siembra (HU7) ✅
**20h — Prioridad: 🟢 Baja — Completado 2026-06-02**

- [x] Endpoint `GET /api/plantings/geojson` con datos geoespaciales
- [x] Capa de puntos en Leaflet con íconos por estado (circleMarker coloreado por supervivencia)
- [x] Popup con detalle al hacer clic (especie, zona, fechas, estado, foto)
- [x] Filtros: especie, zona, período (desde/hasta)
- [+] UX: manejo de errores con alerta + reintentar, estado vacío, spinner de carga, popup estilizado, responsive

### Sprint 12 — Mapa de Calor de Mortalidad (HU7) ✅
**20h — Prioridad: 🟢 Baja — Completado 2026-06-02**

- [x] Endpoint `GET /api/analytics/heatmap` con datos agregados (peso por estado: dead=1, struggling=0.5, alive=0)
- [x] Leaflet.heat integrado con gradiente personalizado verde→rojo
- [x] Capa de calor para mortalidad con lat/lng/weight
- [x] Selector de período para animación temporal (mes/trimestre/año) con slider + play/pausa

### Sprint 13 — Refinamiento Dashboard
**15h — Prioridad: 🟢 Baja**

- [ ] ⬜ Cards de resumen con indicadores clave
- [ ] ⬜ Gráficos de evolución (Chart.js o similar)
- [ ] ⬜ Tabla de últimas plantaciones registradas

### Sprint 14 — UI/UX
**15h — Prioridad: 🟢 Baja**

- [ ] ⬜ Refinamiento responsive (mobile-first)
- [ ] ⬜ Estados vacíos en todas las vistas
- [ ] ⬜ Skeletons de carga
- [ ] ⬜ Accesibilidad (alt text, ARIA, contraste)
- [ ] ⬜ Pruebas en dispositivos móviles reales

---

## Code Review (Post-Sprint 10) ✅
**Duración: ~8h — 29 archivos modificados**

### Performance
- [x] `syncBatch`: pre-fetch de zonas/especies con `Promise.all` + Map cache (elimina N+1 queries)
- [x] `reportsRepository`: paginación de 1000 filas/página en consultas de reportes
- [x] `plantingRepository.update()`: SET dinámico (no sobreescribe campos con `undefined`)
- [x] `photoService`: `crypto.randomUUID` en vez de `Math.random`, lookup table MIME_EXT

### Clean Code
- [x] `reports.service.ts`: helper `buildParams()` DRY para filtros en 4 métodos
- [x] `speciesValidator`: helper `validateAltitudeRange()` extraído (DRY en create/update)
- [x] `planting-form.ts`: método `placeMarker()` extraído, `takeUntilDestroyed`, fix flujo foto
- [x] `planting-list.ts`: helper `pageArray()` para paginación
- [x] `plantingRepository`: `listColumns` movido antes de `findById` (fix TDZ), `findByZoneId` eliminado (muerto)
- [x] `reports.ts`: helper `buildFilters()`, chart con `effect()`, error handlers agregados
- [x] `connectivity.service`: import `effect` eliminado (no usado)

### Error Handling
- [x] `auth.service`: limpiar token si `me()` falla (auto-logout en token inválido)
- [x] Auth middleware: mensaje claro para perfil sin rol
- [x] `planting-detail`, `reports`: errores del servidor propagados a UI
- [x] `planting-form`: error de foto manejado graceful (navega con advertencia)

### Patterns
- [x] `photoController`: usa `plantingService` en vez de repository directo
- [x] `plantingService`: método `updatePhotoUrl()` con verificación de existencia
- [x] `reportsController`: `validateReportFilters()` en species-stats y zone-summary
- [x] `index.js`: graceful shutdown (SIGTERM/SIGINT)
- [x] `zoneRepository`: geometría default polygon si no se provee
- [x] `zoneValidator`: geometry opcional en creación
- [x] `db.js`: SSL config condicional via `DB_SSL_REJECT_UNAUTHORIZED`

### Fixes Post-Test
- [x] `is_point_in_zone`: creada en DB local + script SQL guardado (`server/scripts/sql/01-is-point-in-zone.sql`)
- [x] Auth: perfiles migrados a DB local (`db.query`) para evitar RLS de Supabase Data API
- [x] Login: filtro de rate limiting aplicado correctamente

---

## Fase 4: Cierre y Documentación

### Sprint 15 — QA
**20h — Prioridad: 🟢 Baja**

- [ ] ⬜ Pruebas de usuario con técnicos de campo
- [ ] ⬜ Correcciones de bugs encontrados
- [ ] ⬜ Pruebas de estrés en sincronización offline
- [ ] ⬜ Pruebas en red 3G/4G simulada

### Sprint 16 — Documentación
**15h — Prioridad: 🟢 Baja**

- [ ] ⬜ Documentación de API endpoints
- [ ] ⬜ Diagrama de arquitectura actualizado
- [ ] ⬜ Guía de despliegue
- [ ] ⬜ Manual de usuario para técnicos

### Sprint 17 — Deploy
**15h — Prioridad: 🟢 Baja**

- [ ] ⬜ Configurar dominio y SSL
- [ ] ⬜ Desplegar Supabase (producción)
- [ ] ⬜ Desplegar API en Vercel/Netlify/Railway
- [ ] ⬜ Desplegar cliente como PWA
- [ ] ⬜ Verificar HTTPs, CORS, variables de entorno

### Sprint 18 — Buffer
**10h — Prioridad: 🟢 Baja**

- [ ] ⬜ Contingencia para imprevistos

---

## Timeline Sugerido

```
Semana 1   (01-05 Jun) ████████████████████  ✅ HU4 pendants + Sprint 5 (SW + IndexedDB)
Semana 2   (08-12 Jun) ████████████████████  ✅ Sprint 6 (Sync automático) + Sprint 8 (Historial)
Semana 3   (15-19 Jun) ████████████████████  ✅ Sprint 9 (Reportes + PDF)
Semana 4-5 (22-03 Jul) ████████████████████  ✅ Sprint 10 (Dashboard) + Code Review
Semana 6-7 (06-17 Jul) ████████████████████  Sprint 11-12 (Mapas + Heatmap)
Semana 8   (20-24 Jul) ████████░░░░░░░░░░░░  Sprint 13-14 (UI/UX)
Semana 9-10 (27-07 Aug) ██████████████████  Sprint 15-18 (QA + Doc + Deploy)
```

**Total estimado restante:** ~170 horas

---

## Notas Técnicas

### Decisiones de arquitectura para sprints próximos

| Decisión | Opción elegida | Razón |
|----------|---------------|-------|
| Offline DB | Dexie.js (wrapper IndexedDB) | API simple, promesas, tipado |
| Estrategia SW | Network First → Cache | Los datos de API cambian, mejor siempre online si hay conexión |
| Background Sync | `navigator.serviceWorker.ready.sync.register` | Nativo, no requiere librería externa |
| PDF | pdfkit (server-side) | Control total sobre el layout, sin dependencias pesadas |
| Excel | exceljs | Soporta estilos, fórmulas, imágenes |
| Gráficos dashboard | Chart.js | Liviano, Angular-friendly con ng2-charts |
| Heatmap | Leaflet.heat | Plugin maduro para Leaflet |

### CRITICAL — Pendientes pre-deploy
- [x] Rate limiting en auth (`express-rate-limit`) — 10 intentos/login cada 15min, 3 signup/hora
- [ ] ⬜ Validar que `CORS_ORIGIN` en producción solo permita el dominio real
- [x] Deshabilitar registro abierto (`POST /api/auth/signup` solo para admin con middleware `authorize`)
- [ ] ⬜ Agregar Helmet CSP en producción
- [ ] ⬜ Revisar variables de entorno en `.env.example`
- [x] Perfiles de usuario migrados a DB local (bypass RLS Supabase Data API)
- [x] Función `is_point_in_zone` creada en DB local + script versionado

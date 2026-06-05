# Cannabis Club Manager

## Plantilla base
Stackwise Inventory Management System Template (TanStack Start + React + Tailwind + shadcn/ui).

## Estado actual
Frontend visual funcional con datos ficticios (mock). No hay backend real conectado.

## Módulos visibles
- Dashboard — `/app`
- Socios / Pacientes — `/app/socios`
- Productos / Stock — `/app/catalog`
- Movimientos — `/app/movements`
- Alertas — `/app/alerts`
- Usuarios y Roles — `/app/usuarios`
- Auditoría — `/app/auditoria`
- Configuración — `/app/settings`

## Datos mock / seeds
Los datos ficticios viven en:
- `src/lib/demo/` — store en memoria (`DemoStore`) y seeds:
  - `seed-members.ts`
  - `seed-products.ts`
  - `seed-stock.ts`
  - `seed-alerts.ts`
  - `seed-users.ts`
  - `seed-audit.ts`
  - `seed-settings.ts`
- `src/services/_mockStore.ts` — singleton que expone el store a los services.

Todo es in-memory: se reinicia al recargar.

## Services preparados
Capa pensada para reemplazar luego por llamadas HTTP reales. Cada función
tiene un comentario `TODO: reemplazar mock por llamada a API Node.js`.

- `src/services/memberService.ts` — `getMembers()`, `getMemberById(id)`
- `src/services/productService.ts` — `getProducts()`
- `src/services/stockService.ts` — `getStockMovements()`
- `src/services/alertService.ts` — `getAlerts()`
- `src/services/userService.ts` — `getAppUsers()`
- `src/services/auditService.ts` — `getAuditEntries()`
- `src/services/settingsService.ts` — `getSettings()`

## Qué NO está implementado
- Backend real (Node.js / Express / API HTTP)
- Base de datos (SQLite / PostgreSQL)
- Autenticación real (login real, hashing, sesiones)
- JWT / refresh tokens
- Integración AFIP / ARCA
- 2FA
- Backups (locales o cifrados)
- Offline-first real (service worker / sync)
- Persistencia real (todo es in-memory)
- Roles y permisos aplicados a nivel API
- Auditoría real (los registros son mock)

## Próximo paso recomendado
Continuar el desarrollo local/offline en VS Code:

1. Crear backend Node.js + Express en una carpeta `server/`.
2. Definir base de datos: **SQLite** para arranque rápido o **PostgreSQL**
   para producción.
3. Modelar tablas a partir de los seeds en `src/lib/demo/`.
4. Exponer endpoints REST siguiendo los `TODO` de cada service.
5. Reemplazar el cuerpo de cada función en `src/services/*` por `fetch()`
   al endpoint correspondiente — la UI no necesita cambios.
6. Sumar auth real (JWT), validaciones (Zod) y middleware de roles.

## Scripts
- `bun install` — instalar dependencias
- `bun dev` — entorno de desarrollo
- `bun run build` — build de producción


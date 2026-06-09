# Backend Fase 2.1 — Usuarios, Roles y Permisos

## Tablas creadas

| Tabla          | Modelo Prisma | Descripción                                 |
|----------------|---------------|---------------------------------------------|
| `usuarios`     | `Usuario`     | Usuarios internos del sistema               |
| `roles`        | `Rol`         | Roles de acceso (administrador/operador/auditor) |
| `permisos`     | `Permiso`     | Claves de permiso por módulo y acción       |
| `usuario_roles`| `UsuarioRol`  | Relación N:N usuario ↔ rol                  |
| `rol_permisos` | `RolPermiso`  | Relación N:N rol ↔ permiso                  |

Todos los IDs son `Int @id @default(autoincrement())`.

## Relaciones

```
usuarios  ──< usuario_roles >── roles
roles     ──< rol_permisos  >── permisos
```

- `usuario_roles.usuario_id` → `usuarios.id` (CASCADE delete)
- `usuario_roles.rol_id`     → `roles.id` (RESTRICT)
- `rol_permisos.rol_id`      → `roles.id` (CASCADE delete)
- `rol_permisos.permiso_id`  → `permisos.id` (CASCADE delete)

## Roles base

| Slug            | Nombre          | Descripción                                     |
|-----------------|-----------------|-------------------------------------------------|
| `administrador` | Administrador   | Acceso completo al sistema                      |
| `operador`      | Operador        | Gestión operativa, sin usuarios ni configuración|
| `auditor`       | Auditor         | Lectura y exportación para control interno      |

## Matriz de permisos

### Administrador — todos los permisos

### Operador
`dashboard.ver` · `cultivo.ver/crear/editar/exportar` · `socios.ver/crear/editar/exportar` ·
`productos_stock.ver/crear/editar/exportar` · `movimientos.ver/crear/exportar` ·
`alertas.ver/editar` · `auditoria.ver`

### Auditor
`dashboard.ver/exportar` · `cultivo.ver/exportar` · `socios.ver/exportar` ·
`productos_stock.ver/exportar` · `movimientos.ver/exportar` · `alertas.ver/exportar` ·
`usuarios_roles.ver/exportar` · `auditoria.ver/exportar` · `configuracion.ver`

## Endpoints creados

### Usuarios — `/api/users`
| Método   | Ruta          | Descripción                              |
|----------|---------------|------------------------------------------|
| GET      | `/api/users`  | Listar todos (sin password_hash)         |
| GET      | `/api/users/:id` | Obtener uno                           |
| POST     | `/api/users`  | Crear (hashea password)                  |
| PATCH    | `/api/users/:id` | Editar (password solo si viene explícito)|
| DELETE   | `/api/users/:id` | Baja lógica (estado → inactivo)       |

### Roles — `/api/roles`
| Método | Ruta                       | Descripción                      |
|--------|----------------------------|----------------------------------|
| GET    | `/api/roles`               | Listar roles                     |
| GET    | `/api/roles/:id`           | Obtener rol con permisos         |
| POST   | `/api/roles`               | Crear rol                        |
| PATCH  | `/api/roles/:id`           | Editar rol                       |
| GET    | `/api/roles/:id/permissions` | Ver permisos del rol           |
| PUT    | `/api/roles/:id/permissions` | Reemplazar permisos del rol    |

### Permisos — `/api/permissions`
| Método | Ruta              | Descripción              |
|--------|-------------------|--------------------------|
| GET    | `/api/permissions`| Listar todos los permisos|

### Auth — `/api/auth`
| Método | Ruta              | Descripción                                |
|--------|-------------------|--------------------------------------------|
| POST   | `/api/auth/login` | Login por username/password                |

**Respuesta de login:**
```json
{
  "usuario": { "id": 1, "username": "admin", "nombre": "Administrador", ... },
  "roles":   [{ "slug": "administrador", "nombre": "Administrador" }],
  "permisos": [{ "clavePermiso": "cultivo.ver", "modulo": "cultivo", "accion": "ver" }, ...]
}
```

> **Nota:** Esta fase NO implementa JWT ni middleware de autenticación de sesión.
> Eso queda pendiente para Fase 2.2. El login devuelve los datos, pero no existe
> cookie/token persistente aún.

## Usuarios de prueba

> ⚠️ SOLO PARA DESARROLLO LOCAL. Cambiar contraseñas antes de producción.

| codigo_usuario | username   | password      | Rol             |
|----------------|------------|---------------|-----------------|
| USR-0001       | admin      | Admin123!     | Administrador   |
| USR-0002       | cultivo01  | Cultivo123!   | Operador        |
| USR-0003       | stock01    | Stock123!     | Operador        |
| USR-0004       | auditor01  | Auditor123!   | Auditor         |

## Comandos

Desde `/server`:

```bash
npm install
npx prisma migrate dev --name add_usuarios_roles_permisos
npm run prisma:seed
npm run dev
```

## Probar login

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin123!"}'
```

## Pendiente para Fase 2.2

- [ ] Middleware de autenticación JWT
- [ ] `POST /api/auth/refresh` (refresh token)
- [ ] Logout / invalidación de sesión
- [ ] Frontend: pantalla de login real (reemplazar demo mode)
- [ ] Guard de rutas con permisos reales en el frontend
- [ ] Recuperación de contraseña

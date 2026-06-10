# Backend — Módulo Socios / Pacientes

## Tablas creadas

### `socios`

| Campo                | Tipo      | Notas                                              |
|---------------------|-----------|----------------------------------------------------|
| `id`                | INTEGER PK autoincrement |                                    |
| `codigo_socio`      | TEXT UNIQUE | Ej: SOC-0001                                    |
| `nombre`            | TEXT       | Requerido                                          |
| `apellido`          | TEXT       | Requerido                                          |
| `dni`               | TEXT UNIQUE nullable |                                         |
| `fecha_nacimiento`  | DATETIME nullable |                                             |
| `telefono`          | TEXT nullable |                                                |
| `email`             | TEXT nullable |                                                |
| `direccion`         | TEXT nullable |                                                |
| `localidad`         | TEXT nullable |                                                |
| `provincia`         | TEXT nullable |                                                |
| `estado`            | TEXT default `activo` | Enum: activo, pendiente, suspendido, inactivo |
| `tipo_socio`        | TEXT nullable | Enum: paciente, socio, cultivador_solidario, otro |
| `cupo_mensual_gramos` | REAL nullable |                                           |
| `observaciones`     | TEXT nullable |                                                |
| `creado_en`         | DATETIME default now |                                         |
| `actualizado_en`    | DATETIME updatedAt |                                          |

### `documentos_socio`

| Campo              | Tipo      | Notas                                               |
|-------------------|-----------|-----------------------------------------------------|
| `id`              | INTEGER PK autoincrement |                                      |
| `socio_id`        | INTEGER FK → socios.id (CASCADE) | Requerido          |
| `tipo_documento`  | TEXT       | Enum: dni, reprocann, certificado_medico, autorizacion, otro |
| `numero_documento`| TEXT nullable |                                                 |
| `fecha_emision`   | DATETIME nullable |                                              |
| `fecha_vencimiento` | DATETIME nullable |                                            |
| `estado`          | TEXT default `vigente` | Enum: vigente, por_vencer, vencido, pendiente, inactivo |
| `archivo_url`     | TEXT nullable | Reservado para carga futura de archivos         |
| `observaciones`   | TEXT nullable |                                                 |
| `creado_en`       | DATETIME default now |                                          |
| `actualizado_en`  | DATETIME updatedAt |                                           |

## Relaciones

```
socios (1) ──── (N) documentos_socio
```

- Un socio puede tener múltiples documentos.
- Al eliminar un socio, sus documentos se eliminan en cascada (ON DELETE CASCADE).
- El DELETE de socio es **lógico** (estado → inactivo), no físico.
- El DELETE de documento es **lógico** (estado → inactivo), preservando historial.

## Endpoints

### Socios

| Método | Ruta                  | Descripción                                      |
|--------|-----------------------|--------------------------------------------------|
| GET    | `/api/members`        | Listar socios (incluye documentos). Filtros: `estado`, `tipoSocio`, `search` |
| GET    | `/api/members/:id`    | Detalle del socio con todos sus documentos       |
| POST   | `/api/members`        | Crear socio nuevo                                |
| PATCH  | `/api/members/:id`    | Editar datos del socio                           |
| DELETE | `/api/members/:id`    | Baja lógica: cambia `estado` → `inactivo`        |

### Documentos

| Método | Ruta                              | Descripción                              |
|--------|-----------------------------------|------------------------------------------|
| GET    | `/api/members/:id/documents`      | Listar documentos de un socio            |
| POST   | `/api/members/:id/documents`      | Agregar documento a un socio             |
| PATCH  | `/api/member-documents/:id`       | Editar un documento                      |
| DELETE | `/api/member-documents/:id`       | Baja lógica del documento (estado → inactivo) |

## Campos del payload para crear socio

```json
{
  "codigoSocio": "SOC-0001",
  "nombre": "Juan",
  "apellido": "Pérez",
  "dni": "30111222",
  "fechaNacimiento": "1988-05-10",
  "telefono": "1123456789",
  "email": "juan@example.com",
  "direccion": "Av. Siempre Viva 123",
  "localidad": "CABA",
  "provincia": "Buenos Aires",
  "estado": "activo",
  "tipoSocio": "paciente",
  "cupoMensualGramos": 40,
  "observaciones": "Socio de prueba."
}
```

## Estados posibles

### Socio (`estado`)
| Valor       | Frontend label |
|-------------|----------------|
| `activo`    | Activo         |
| `pendiente` | Pendiente      |
| `suspendido`| Suspendido     |
| `inactivo`  | Inactivo       |

### Documento (`estado`)
| Valor       | Significado                            |
|-------------|----------------------------------------|
| `vigente`   | Documento activo y dentro de vigencia  |
| `por_vencer`| Vence en ≤30 días                      |
| `vencido`   | Fecha de vencimiento superada          |
| `pendiente` | En trámite o sin fecha de vencimiento  |
| `inactivo`  | Eliminado lógicamente                  |

### Tipos de documento (`tipoDocumento`)
- `dni`
- `reprocann`
- `certificado_medico`
- `autorizacion`
- `otro`

### Tipos de socio (`tipoSocio`)
- `paciente`
- `socio`
- `cultivador_solidario`
- `otro`

## Comandos

```bash
# Desde el directorio /server

# Aplicar migración
npx prisma migrate deploy

# Regenerar cliente Prisma (requiere servidor detenido)
npx prisma generate

# Ejecutar seed (crea socios y documentos de prueba)
npx prisma db seed
```

## Socios de prueba (seed)

| Código    | Nombre          | DNI      | Estado    | Tipo     | Cupo |
|-----------|-----------------|----------|-----------|----------|------|
| SOC-0001  | Juan Pérez      | 30111222 | activo    | paciente | 40 g |
| SOC-0002  | María Gómez     | 28555777 | activo    | paciente | 30 g |
| SOC-0003  | Carlos Rodríguez| 33777888 | pendiente | socio    | 25 g |
| SOC-0004  | Ana Martínez    | 25999888 | suspendido| paciente | 20 g |

## Documentos de prueba (seed)

| Socio    | Tipo              | Estado     | Vencimiento            |
|----------|-------------------|------------|------------------------|
| SOC-0001 | reprocann         | vigente    | hoy + 180 días         |
| SOC-0001 | certificado_medico| vigente    | hoy + 210 días         |
| SOC-0002 | reprocann         | por_vencer | hoy + 20 días          |
| SOC-0002 | certificado_medico| vigente    | hoy + 90 días          |
| SOC-0003 | reprocann         | pendiente  | sin fecha              |
| SOC-0003 | certificado_medico| pendiente  | sin fecha              |
| SOC-0004 | reprocann         | vencido    | hace 60 días           |
| SOC-0004 | certificado_medico| vencido    | hace 10 días           |

## Pendiente para fase de Stock / Dispensas

- Tabla `dispensas` con campos: `socio_id`, `fecha`, `gramos`, `operador_id`
- Campo `currentMonthUsageGrams` calculado sumando dispensas del mes en curso
- Endpoint `GET /api/members/:id/consumo-mensual` para consultar cupo restante
- Validación de cupo en endpoint de nueva dispensa (`POST /api/dispensas`)
- Alertas automáticas cuando uso supere el 80% del cupo mensual
- Historial de dispensas en detalle del socio

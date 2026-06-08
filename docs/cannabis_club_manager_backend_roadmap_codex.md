# Cannabis Club Manager - Roadmap Backend en 3 Instancias + Prompts para Codex

## 1. Decision base del proyecto

El proyecto se va a ordenar en 3 instancias para no intentar rehacer todo el backend de una sola vez:

1. **Cultivo**
2. **Usuarios + Socios**
3. **Stock + Dispensas**

La prioridad es crear una base nueva limpia, usando el frontend actual como base visual y reutilizando solo lo util del backend existente.

### Convenciones obligatorias de base de datos

- Base inicial: **SQLite + Prisma**.
- Primary Key en todas las tablas: `id Int @id @default(autoincrement())`.
- No usar `cuid()`, `uuid()` ni IDs tipo texto como claves primarias.
- Foreign Keys siempre con formato `nombre_tabla_id`.
- Tablas y columnas en `snake_case` usando `@@map` y `@map` si se mantiene naming Prisma en camelCase.
- Mantener codigos visibles solo en entidades operativas importantes.
- Los codigos visibles no reemplazan al `id`; solo sirven para busqueda, pantalla, comprobantes y trazabilidad humana.

### Estado actual detectado en el ZIP

- Frontend: React + TanStack Router + Tailwind + shadcn/ui.
- Backend: Node.js + Express + Prisma.
- Base fisica `.db`: no incluida en el ZIP.
- Schema actual: existe `server/prisma/schema.prisma` con modelos de cultivo usando IDs `String @id @default(cuid())`.
- Rutas backend actuales: `/api/cultivation/...` para beds, plants, genetics, mothers, environmental logs, irrigation logs, measurements, operational tasks y VPD.
- Varias pantallas siguen usando mock data.

---

## 2. Instancia 1 - Cultivo

### Objetivo

Armar primero el nucleo fuerte del sistema: salas, camillas, geneticas, madres, lotes, plantas, registros de cultivo y cosechas.

Esta instancia no debe implementar login real, permisos avanzados, socios, stock ni dispensas.

### Tablas principales

- `salas_cultivo`
- `camillas`
- `geneticas`
- `madres`
- `lotes_cultivo`
- `plantas`
- `registros_ambientales`
- `riegos`
- `mediciones_cultivo`
- `tareas_cultivo`
- `cosechas`

### Codigos visibles

- `salas_cultivo.codigo_sala`
- `camillas.codigo_camilla`
- `geneticas.codigo_genetica`
- `madres.codigo_madre`
- `lotes_cultivo.codigo_lote`
- `plantas.codigo_planta`
- `cosechas.codigo_cosecha`

### Relaciones principales

- `camillas.sala_cultivo_id -> salas_cultivo.id`
- `madres.genetica_id -> geneticas.id`
- `lotes_cultivo.genetica_id -> geneticas.id`
- `lotes_cultivo.sala_cultivo_id -> salas_cultivo.id`
- `plantas.camilla_id -> camillas.id`
- `plantas.genetica_id -> geneticas.id`
- `plantas.madre_id -> madres.id`
- `plantas.lote_cultivo_id -> lotes_cultivo.id`
- `registros_ambientales.sala_cultivo_id -> salas_cultivo.id`
- `registros_ambientales.camilla_id -> camillas.id`
- `registros_ambientales.lote_cultivo_id -> lotes_cultivo.id`
- `riegos.planta_id -> plantas.id`
- `riegos.camilla_id -> camillas.id`
- `riegos.lote_cultivo_id -> lotes_cultivo.id`
- `mediciones_cultivo.planta_id -> plantas.id`
- `mediciones_cultivo.madre_id -> madres.id`
- `cosechas.lote_cultivo_id -> lotes_cultivo.id`

### Criterio de cierre de instancia 1

Al finalizar esta instancia, el sistema debe permitir:

- Crear salas de cultivo.
- Crear camillas asociadas a salas.
- Crear geneticas.
- Crear madres asociadas a geneticas.
- Crear lotes de cultivo.
- Crear plantas asociadas a camilla, genetica, madre opcional y lote.
- Registrar datos ambientales.
- Registrar riegos.
- Registrar mediciones.
- Registrar tareas de cultivo sin usuario real todavia.
- Cerrar un lote con una cosecha.
- Ejecutar seed de prueba y levantar el backend sin errores.

### Prompt para Codex - Instancia 1

```text
Estoy trabajando en el proyecto Cannabis Club Manager. Quiero avanzar SOLO con la INSTANCIA 1: Cultivo.

Contexto del proyecto actual:
- Frontend: React + TanStack Router + Tailwind + shadcn/ui.
- Backend: Node.js + Express + Prisma en /server.
- Base prevista: SQLite local.
- El ZIP/proyecto actual no trae archivo .db fisico.
- Ya existe server/prisma/schema.prisma con modelos de cultivo, pero usa IDs String con cuid().
- Ya existen rutas Express para /api/cultivation/beds, plants, genetics, mothers, environmental-logs, irrigation-logs, measurements, operational-tasks y vpd.
- Varias pantallas del frontend todavia usan mock data.

Objetivo de esta tarea:
Reconstruir el backend de cultivo sobre una base nueva limpia, manteniendo el patron Express + Prisma + Zod, pero cambiando el modelo de datos a IDs numericos autoincrementales y relaciones reales.

Reglas obligatorias de base de datos:
1. Todas las tablas deben tener `id Int @id @default(autoincrement())`.
2. No usar cuid(), uuid() ni String como Primary Key.
3. Todas las Foreign Keys deben llamarse con formato `nombre_tabla_id`.
4. Usar nombres reales de tablas en snake_case mediante `@@map` y, si corresponde, columnas en snake_case con `@map`.
5. Mantener codigos visibles solo en entidades operativas importantes. Ejemplos:
   - codigo_sala
   - codigo_camilla
   - codigo_genetica
   - codigo_madre
   - codigo_lote
   - codigo_planta
   - codigo_cosecha
6. Los codigos visibles son unicos y sirven para pantalla/busqueda, pero las relaciones siempre deben usar el id numerico.

Modelos que deben existir en esta instancia:
- SalaCultivo -> tabla salas_cultivo
- Camilla -> tabla camillas
- Genetica -> tabla geneticas
- Madre -> tabla madres
- LoteCultivo -> tabla lotes_cultivo
- Planta -> tabla plantas
- RegistroAmbiental -> tabla registros_ambientales
- Riego -> tabla riegos
- MedicionCultivo -> tabla mediciones_cultivo
- TareaCultivo -> tabla tareas_cultivo
- Cosecha -> tabla cosechas

Relaciones minimas:
- camillas.sala_cultivo_id -> salas_cultivo.id
- madres.genetica_id -> geneticas.id
- lotes_cultivo.genetica_id -> geneticas.id
- lotes_cultivo.sala_cultivo_id -> salas_cultivo.id
- plantas.camilla_id -> camillas.id
- plantas.genetica_id -> geneticas.id
- plantas.madre_id -> madres.id nullable
- plantas.lote_cultivo_id -> lotes_cultivo.id nullable
- registros_ambientales.sala_cultivo_id -> salas_cultivo.id nullable
- registros_ambientales.camilla_id -> camillas.id nullable
- registros_ambientales.lote_cultivo_id -> lotes_cultivo.id nullable
- riegos.planta_id -> plantas.id nullable
- riegos.camilla_id -> camillas.id nullable
- riegos.lote_cultivo_id -> lotes_cultivo.id nullable
- mediciones_cultivo.planta_id -> plantas.id nullable
- mediciones_cultivo.madre_id -> madres.id nullable
- cosechas.lote_cultivo_id -> lotes_cultivo.id

Importante sobre salas y camillas:
- La capacidad real se define en camillas con `capacidad_maxima_plantas`.
- No guardar capacidad total fija en salas para evitar datos duplicados.
- La capacidad de una sala debe calcularse sumando la capacidad de sus camillas.

Trabajo solicitado:
1. Reemplazar el schema actual de Prisma por el schema limpio de Instancia 1.
2. Adaptar o recrear los servicios, controllers, schemas Zod y routes de cultivo para que funcionen con IDs numericos.
3. Crear rutas CRUD para salas de cultivo, camillas, geneticas, madres, lotes, plantas, registros ambientales, riegos, mediciones, tareas y cosechas.
4. Mantener el endpoint de VPD si ya existe y sigue siendo util.
5. Actualizar el seed para crear datos de prueba coherentes: al menos 2 salas, 3 camillas, 3 geneticas, 2 madres, 2 lotes, varias plantas, registros ambientales, riegos, mediciones, tareas y una cosecha de ejemplo.
6. No implementar login, roles, socios, stock ni dispensas en esta instancia.
7. No hacer grandes cambios visuales de frontend salvo los estrictamente necesarios para que no rompa la app.
8. Documentar en un archivo `docs/backend-instancia-1-cultivo.md` las tablas creadas, relaciones, endpoints y comandos para levantar la base.

Comandos esperados:
- npm install dentro de /server si hace falta.
- npx prisma migrate dev
- npm run prisma:seed
- npm run build

Criterios de aceptacion:
- El backend compila sin errores.
- Prisma migrate crea una base SQLite nueva.
- Prisma seed carga datos de prueba.
- Los endpoints principales de cultivo responden correctamente.
- No quedan IDs cuid/String como claves primarias en los modelos de cultivo.
- Las Foreign Keys usan el formato `nombre_tabla_id`.
- La documentacion de instancia 1 queda creada.

Antes de modificar, revisa la estructura actual del repo. Ejecuta los cambios de forma incremental y evita mezclar esta tarea con usuarios, socios, stock o dispensas.
```

---

## 3. Instancia 2 - Usuarios, roles y socios

### Objetivo

Agregar la parte humana del sistema: usuarios internos, roles, socios/pacientes, documentacion, alertas y auditoria basica.

Esta instancia empieza a conectar usuarios con acciones del modulo cultivo, pero todavia no implementa stock ni dispensas.

### Tablas principales

- `usuarios`
- `roles`
- `usuario_roles`
- `socios`
- `documentos_socio`
- `auditoria`
- `alertas`

### Codigos visibles

- `usuarios.codigo_usuario`
- `socios.codigo_socio`

No hace falta codigo visible en roles, usuario_roles, documentos_socio, auditoria ni alertas.

### Relaciones principales

- `usuario_roles.usuario_id -> usuarios.id`
- `usuario_roles.rol_id -> roles.id`
- `documentos_socio.socio_id -> socios.id`
- `auditoria.usuario_id -> usuarios.id`
- `alertas.usuario_id -> usuarios.id nullable`
- `alertas.socio_id -> socios.id nullable`

### Conexiones nuevas hacia cultivo

- `tareas_cultivo.usuario_asignado_id -> usuarios.id nullable`
- `tareas_cultivo.usuario_creador_id -> usuarios.id nullable`
- `tareas_cultivo.usuario_completado_id -> usuarios.id nullable`
- `cosechas.usuario_responsable_id -> usuarios.id nullable`
- `riegos.usuario_id -> usuarios.id nullable`
- `mediciones_cultivo.usuario_id -> usuarios.id nullable`
- `registros_ambientales.usuario_id -> usuarios.id nullable`

### Prompt para Codex - Instancia 2

```text
Estoy trabajando en el proyecto Cannabis Club Manager. Ya debe estar terminada la INSTANCIA 1: Cultivo. Ahora quiero avanzar SOLO con la INSTANCIA 2: Usuarios, roles y socios.

No implementes stock ni dispensas todavia.

Contexto actual esperado:
- Backend Express + Prisma + Zod en /server.
- Base SQLite creada desde Prisma.
- Los modelos de cultivo ya usan IDs numericos autoincrementales.
- Las Foreign Keys ya usan formato `nombre_tabla_id`.
- Ya existen tablas de cultivo: salas_cultivo, camillas, geneticas, madres, lotes_cultivo, plantas, registros_ambientales, riegos, mediciones_cultivo, tareas_cultivo y cosechas.

Objetivo de esta tarea:
Agregar usuarios internos, roles, socios/pacientes, documentacion, alertas y auditoria basica, manteniendo la misma convencion de base de datos.

Reglas obligatorias:
1. Todas las nuevas tablas deben tener `id Int @id @default(autoincrement())`.
2. No usar cuid(), uuid() ni String como Primary Key.
3. Todas las Foreign Keys deben llamarse con formato `nombre_tabla_id`.
4. Usar snake_case para tablas y columnas mediante `@@map` y `@map` si corresponde.
5. Usar codigos visibles solo en:
   - usuarios.codigo_usuario
   - socios.codigo_socio
6. No implementar stock, productos, movimientos de stock ni dispensas en esta instancia.

Modelos nuevos:
- Usuario -> tabla usuarios
- Rol -> tabla roles
- UsuarioRol -> tabla usuario_roles
- Socio -> tabla socios
- DocumentoSocio -> tabla documentos_socio
- Auditoria -> tabla auditoria
- Alerta -> tabla alertas

Campos sugeridos para usuarios:
- id
- codigo_usuario
- nombre
- apellido
- email
- password_hash nullable por ahora si no se implementa login real
- estado
- ultimo_acceso_en nullable
- creado_en
- actualizado_en

Campos sugeridos para socios:
- id
- codigo_socio
- nombre
- apellido
- dni unique nullable
- telefono
- email
- estado
- fecha_alta
- cupo_mensual_gramos
- observaciones
- creado_en
- actualizado_en

Estados sugeridos de socio:
- activo
- pendiente
- suspendido
- inactivo

Tipos sugeridos de documento:
- reprocann
- certificado_medico
- dni_frente
- dni_dorso
- otro

Conexiones nuevas hacia cultivo:
- tareas_cultivo.usuario_asignado_id -> usuarios.id nullable
- tareas_cultivo.usuario_creador_id -> usuarios.id nullable
- tareas_cultivo.usuario_completado_id -> usuarios.id nullable
- cosechas.usuario_responsable_id -> usuarios.id nullable
- riegos.usuario_id -> usuarios.id nullable
- mediciones_cultivo.usuario_id -> usuarios.id nullable
- registros_ambientales.usuario_id -> usuarios.id nullable

Trabajo solicitado:
1. Actualizar Prisma schema agregando los modelos de usuarios, roles, socios, documentos, auditoria y alertas.
2. Crear migracion nueva sin destruir los modelos de cultivo ya creados en instancia 1.
3. Crear services/controllers/routes/schemas Zod para:
   - /api/users
   - /api/roles
   - /api/members o /api/socios, elegir una sola convencion y documentarla
   - /api/member-documents o /api/documentos-socio
   - /api/audit
   - /api/alerts
4. Crear endpoints CRUD basicos para usuarios y socios.
5. Crear endpoints para asociar roles a usuarios.
6. Crear endpoints para cargar/listar documentos de socios.
7. Crear auditoria basica para acciones importantes: crear/actualizar/eliminar socio, crear/actualizar usuario, cambios de estado y cambios de documentacion.
8. Actualizar tareas, cosechas, riegos, mediciones y registros ambientales para poder asociar usuario cuando corresponda.
9. Actualizar seed con usuarios, roles, socios y documentos de prueba.
10. Documentar en `docs/backend-instancia-2-usuarios-socios.md` las tablas, relaciones, endpoints y decisiones tomadas.

Criterios de aceptacion:
- El backend compila sin errores.
- Prisma migrate crea la migracion de instancia 2.
- Prisma seed carga roles, usuarios, socios y documentos de prueba.
- Los endpoints de usuarios y socios responden correctamente.
- Las relaciones hacia cultivo funcionan con usuario_id nullable.
- No se implementa stock ni dispensas todavia.
- La documentacion de instancia 2 queda creada.

Antes de modificar, revisa la instancia 1 existente y respeta sus convenciones. No cambies nombres ya definidos salvo que sea estrictamente necesario y lo documentes.
```

---

## 4. Instancia 3 - Stock, productos y dispensas

### Objetivo

Cerrar el circuito completo del club:

**Cosecha -> producto/lote final -> stock -> entrega a socio -> movimiento auditado.**

Esta instancia depende de que ya existan cultivo, usuarios y socios.

### Tablas principales

- `productos`
- `productos_lote`
- `ubicaciones_stock`
- `movimientos_stock`
- `dispensas`
- `detalle_dispensa`
- `cupos_socio`
- `ajustes_stock`

### Codigos visibles

- `productos.codigo_producto`
- `productos_lote.codigo_producto_lote`
- `movimientos_stock.codigo_movimiento`
- `dispensas.codigo_dispensa`

### Relaciones principales

- `productos_lote.producto_id -> productos.id`
- `productos_lote.cosecha_id -> cosechas.id nullable`
- `productos_lote.genetica_id -> geneticas.id nullable`
- `productos_lote.lote_cultivo_id -> lotes_cultivo.id nullable`
- `movimientos_stock.producto_lote_id -> productos_lote.id`
- `movimientos_stock.usuario_id -> usuarios.id`
- `movimientos_stock.ubicacion_origen_id -> ubicaciones_stock.id nullable`
- `movimientos_stock.ubicacion_destino_id -> ubicaciones_stock.id nullable`
- `dispensas.socio_id -> socios.id`
- `dispensas.usuario_id -> usuarios.id`
- `detalle_dispensa.dispensa_id -> dispensas.id`
- `detalle_dispensa.producto_lote_id -> productos_lote.id`
- `cupos_socio.socio_id -> socios.id`

### Prompt para Codex - Instancia 3

```text
Estoy trabajando en el proyecto Cannabis Club Manager. Ya deben estar terminadas:
- INSTANCIA 1: Cultivo.
- INSTANCIA 2: Usuarios, roles y socios.

Ahora quiero avanzar SOLO con la INSTANCIA 3: Stock, productos y dispensas.

Contexto actual esperado:
- Backend Express + Prisma + Zod en /server.
- Base SQLite creada con Prisma.
- Todas las tablas usan IDs numericos autoincrementales.
- Todas las Foreign Keys usan formato `nombre_tabla_id`.
- Ya existen cultivo, cosechas, usuarios, roles, socios, documentos, alertas y auditoria basica.

Objetivo de esta tarea:
Crear el modulo de stock para controlar productos, lotes de producto, ubicaciones, movimientos, cupos de socios y dispensas. La trazabilidad debe conectar cultivo con stock y stock con socio.

Reglas obligatorias:
1. Todas las nuevas tablas deben tener `id Int @id @default(autoincrement())`.
2. No usar cuid(), uuid() ni String como Primary Key.
3. Todas las Foreign Keys deben llamarse con formato `nombre_tabla_id`.
4. Usar snake_case para tablas y columnas mediante `@@map` y `@map` si corresponde.
5. Los codigos visibles solo deben usarse en entidades operativas importantes:
   - productos.codigo_producto
   - productos_lote.codigo_producto_lote
   - movimientos_stock.codigo_movimiento
   - dispensas.codigo_dispensa

Modelos nuevos:
- Producto -> tabla productos
- ProductoLote -> tabla productos_lote
- UbicacionStock -> tabla ubicaciones_stock
- MovimientoStock -> tabla movimientos_stock
- Dispensa -> tabla dispensas
- DetalleDispensa -> tabla detalle_dispensa
- CupoSocio -> tabla cupos_socio
- AjusteStock -> tabla ajustes_stock

Categorias sugeridas de producto:
- flores
- aceite
- extracto
- insumo
- otro

Tipos sugeridos de movimiento_stock:
- entrada
- salida
- ajuste
- traslado
- merma
- dispensa
- devolucion
- descarte

Relaciones minimas:
- productos_lote.producto_id -> productos.id
- productos_lote.cosecha_id -> cosechas.id nullable
- productos_lote.genetica_id -> geneticas.id nullable
- productos_lote.lote_cultivo_id -> lotes_cultivo.id nullable
- movimientos_stock.producto_lote_id -> productos_lote.id
- movimientos_stock.usuario_id -> usuarios.id
- movimientos_stock.ubicacion_origen_id -> ubicaciones_stock.id nullable
- movimientos_stock.ubicacion_destino_id -> ubicaciones_stock.id nullable
- dispensas.socio_id -> socios.id
- dispensas.usuario_id -> usuarios.id
- detalle_dispensa.dispensa_id -> dispensas.id
- detalle_dispensa.producto_lote_id -> productos_lote.id
- cupos_socio.socio_id -> socios.id

Reglas funcionales importantes:
1. Una cosecha puede convertirse en uno o varios productos_lote.
2. productos_lote debe permitir conocer su origen: cosecha, genetica y lote_cultivo cuando aplique.
3. Todo ingreso, salida, ajuste, traslado, merma, descarte o dispensa debe generar un movimiento_stock.
4. Una dispensa debe generar automaticamente:
   - registro en dispensas
   - registro en detalle_dispensa
   - movimiento_stock tipo dispensa
   - actualizacion/control de cupo mensual del socio
   - entrada en auditoria
5. No permitir dispensar mas cantidad que el stock disponible del producto_lote.
6. No permitir dispensar a socios inactivos, suspendidos o con documentacion critica vencida si ya existe ese estado en instancia 2.
7. Si el socio supera el cupo mensual, devolver error claro.

Trabajo solicitado:
1. Actualizar Prisma schema agregando los modelos de stock, productos, cupos y dispensas.
2. Crear migracion nueva sin romper instancias 1 y 2.
3. Crear services/controllers/routes/schemas Zod para:
   - /api/products
   - /api/product-batches o /api/productos-lote, elegir una convencion y documentarla
   - /api/stock-locations
   - /api/stock-movements
   - /api/dispensations o /api/dispensas
   - /api/member-quotas o /api/cupos-socio
4. Crear endpoints CRUD para productos y ubicaciones.
5. Crear endpoints para crear lotes de producto desde cosecha.
6. Crear endpoints para movimientos de stock.
7. Crear endpoint transaccional para registrar dispensa completa.
8. Actualizar seed con productos, lotes de producto, ubicaciones, stock inicial, cupos y dispensas de prueba.
9. Crear validaciones claras con Zod y errores legibles.
10. Documentar en `docs/backend-instancia-3-stock-dispensas.md` las tablas, relaciones, endpoints, reglas funcionales y flujo completo de dispensa.

Criterios de aceptacion:
- El backend compila sin errores.
- Prisma migrate crea la migracion de instancia 3.
- Prisma seed carga datos de prueba completos.
- Se puede crear producto y lote de producto.
- Se puede registrar entrada de stock.
- Se puede registrar una dispensa completa en una transaccion.
- La dispensa descuenta stock correctamente.
- La dispensa controla cupo mensual del socio.
- La dispensa genera movimiento_stock y auditoria.
- No se rompe el modulo de cultivo ni usuarios/socios.
- La documentacion de instancia 3 queda creada.

Antes de modificar, revisa las instancias 1 y 2 y respeta todas las convenciones ya definidas.
```

---

## 5. Recomendacion de uso con Codex

No enviar los 3 prompts juntos para que implemente todo. Usarlos asi:

1. Pegar solo el prompt de Instancia 1.
2. Revisar que compile, que migre y que seed funcione.
3. Probar endpoints principales.
4. Recien despues pegar el prompt de Instancia 2.
5. Repetir validacion.
6. Recien al final pegar Instancia 3.

Esto reduce errores, evita mezclar dominios y permite revisar el modelo de base en cada etapa antes de seguir.
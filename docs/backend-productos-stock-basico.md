# Backend Productos / Stock — Referencia

## Tablas (Prisma + SQLite)

| Modelo Prisma      | Tabla SQL              | Descripción                         |
|--------------------|------------------------|-------------------------------------|
| `CategoriaProducto`| `categorias_producto`  | Categorías de productos             |
| `Producto`         | `productos`            | Catálogo de productos               |
| `UbicacionStock`   | `ubicaciones_stock`    | Áreas físicas de almacenamiento     |
| `LoteProducto`     | `lotes_producto`       | Lotes con stock y trazabilidad      |

### `categorias_producto`
| Campo           | Tipo     | Notas                  |
|-----------------|----------|------------------------|
| id              | Int PK   | Autoincrement          |
| codigo_categoria| String   | Único (CAT-FLORES, …)  |
| nombre          | String   |                        |
| descripcion     | String?  |                        |
| estado          | String   | activa / inactiva      |

### `productos`
| Campo                  | Tipo    | Notas                                              |
|------------------------|---------|----------------------------------------------------|
| id                     | Int PK  |                                                    |
| codigo_producto        | String  | Único (PROD-001, …)                                |
| categoria_producto_id  | Int?    | FK → categorias_producto                           |
| nombre                 | String  |                                                    |
| tipo_producto          | String  | flor / aceite / extracto / comestible / insumo / otro |
| unidad_medida          | String  | gramos / mililitros / unidades                     |
| requiere_lote          | Boolean | default true                                       |
| requiere_trazabilidad  | Boolean | default true                                       |
| estado                 | String  | activo / inactivo                                  |

### `ubicaciones_stock`
| Campo            | Tipo    | Notas                                              |
|------------------|---------|----------------------------------------------------|
| id               | Int PK  |                                                    |
| codigo_ubicacion | String  | Único (DEP-001, CUR-001, HEL-001, …)              |
| nombre           | String  |                                                    |
| tipo             | String  | deposito / freezer / heladera / sala_curado / armario / otro |
| estado           | String  | activa / inactiva                                  |

### `lotes_producto`
| Campo               | Tipo     | Notas                                      |
|---------------------|----------|--------------------------------------------|
| id                  | Int PK   |                                            |
| codigo_lote_producto| String   | Único (PRODLOT-2026-001, …)               |
| producto_id         | Int      | FK → productos                             |
| cosecha_id          | Int?     | FK → cosechas (opcional)                   |
| lote_cultivo_id     | Int?     | FK → lotes_cultivo (opcional)              |
| genetica_id         | Int?     | FK → geneticas (opcional)                  |
| ubicacion_stock_id  | Int?     | FK → ubicaciones_stock (opcional)          |
| fecha_ingreso       | DateTime | default now()                              |
| fecha_vencimiento   | DateTime?|                                            |
| cantidad_inicial    | Float    |                                            |
| cantidad_disponible | Float    |                                            |
| cantidad_reservada  | Float    | default 0                                  |
| unidad_medida       | String   | gramos / mililitros / unidades             |
| estado              | String   | disponible / reservado / agotado / bloqueado / descartado / en_analisis |

---

## Endpoints API

### Categorías — `/api/products/categories`

| Método | Ruta                            | Descripción                                   |
|--------|---------------------------------|-----------------------------------------------|
| GET    | /api/products/categories        | Listar categorías (orden alfabético)          |
| POST   | /api/products/categories        | Crear categoría                               |
| GET    | /api/products/categories/:id    | Obtener categoría por ID                      |
| PATCH  | /api/products/categories/:id    | Actualizar categoría                          |
| DELETE | /api/products/categories/:id    | Inactivar (si tiene productos) o eliminar     |

### Productos — `/api/products`

| Método | Ruta               | Query params                       | Descripción              |
|--------|--------------------|------------------------------------|--------------------------|
| GET    | /api/products      | estado, tipoProducto, categoriaId  | Listar productos         |
| POST   | /api/products      |                                    | Crear producto           |
| GET    | /api/products/:id  |                                    | Obtener producto         |
| PATCH  | /api/products/:id  |                                    | Actualizar producto      |
| DELETE | /api/products/:id  |                                    | Inactivar o eliminar     |

### Ubicaciones — `/api/stock/locations`

| Método | Ruta                        | Descripción                                     |
|--------|-----------------------------|-------------------------------------------------|
| GET    | /api/stock/locations        | Listar ubicaciones                              |
| POST   | /api/stock/locations        | Crear ubicación                                 |
| GET    | /api/stock/locations/:id    | Obtener ubicación                               |
| PATCH  | /api/stock/locations/:id    | Actualizar ubicación                            |
| DELETE | /api/stock/locations/:id    | Inactivar (si tiene lotes) o eliminar           |

### Lotes de producto — `/api/product-batches`

| Método | Ruta                             | Query params                                | Descripción                 |
|--------|----------------------------------|---------------------------------------------|-----------------------------|
| GET    | /api/product-batches             | estado, productoId, geneticaId, ubicacionId | Listar lotes                |
| POST   | /api/product-batches             |                                             | Crear lote                  |
| GET    | /api/product-batches/summary     |                                             | KPIs de resumen             |
| GET    | /api/product-batches/:id         |                                             | Obtener lote                |
| PATCH  | /api/product-batches/:id         |                                             | Actualizar lote             |
| DELETE | /api/product-batches/:id         |                                             | Descartar lote (soft-delete)|

**Respuesta de `/api/product-batches/summary`:**
```json
{
  "productosActivos": 4,
  "lotesDisponibles": 3,
  "stockTotalDisponible": 760,
  "lotesBloqueadosAnalisis": 0,
  "proximosVencimientos": 0,
  "totalLotes": 4
}
```

---

## Estados y transiciones

### Producto
`activo` ↔ `inactivo`
- DELETE con lotes → marca `inactivo`
- DELETE sin lotes → elimina físicamente

### Lote de producto
`disponible` → `reservado` → `agotado` → `descartado`
`disponible` → `bloqueado` / `en_analisis` → `disponible`
- DELETE siempre marca `descartado` (nunca elimina físicamente)

### Categoría / Ubicación
`activa` ↔ `inactiva`
- DELETE con dependientes → marca `inactiva`
- DELETE sin dependientes → elimina físicamente

---

## Comandos de referencia

```bash
# Sincronizar esquema con la DB (desarrollo)
cd server && npx prisma db push

# Regenerar cliente Prisma (detener el servidor primero)
cd server && npx prisma generate

# Ejecutar seed
cd server && npx prisma db seed

# Ver datos en el explorador
cd server && npx prisma studio
```

---

## Archivos frontend

| Archivo                              | Rol                                        |
|--------------------------------------|--------------------------------------------|
| `src/types/products.ts`              | Tipos TypeScript (IDs numéricos)           |
| `src/services/productService.ts`     | CRUD de categorías y productos             |
| `src/services/productBatchService.ts`| CRUD de lotes + summary                   |
| `src/services/stockLocationService.ts`| CRUD de ubicaciones                      |
| `src/routes/app.catalog.tsx`         | Página con KPIs + Tabs (Productos/Lotes/Ubicaciones) |

---

## Pendientes / próximas iteraciones

- Dispensas: endpoint `POST /api/product-batches/:id/dispense` con trazabilidad por socio
- Importar lotes desde cosechas: integración directa en flujo de cosecha
- Ajuste de stock: endpoint de corrección con motivo auditado
- CSV export en cada tab del catálogo
- Alertas automáticas por stock bajo o vencimiento próximo

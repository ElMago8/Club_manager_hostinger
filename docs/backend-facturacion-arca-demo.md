# Backend Facturacion ARCA Demo

## Alcance

La seccion `/app/facturacion` usa datos reales de la base SQLite mediante Prisma, pero la integracion con ARCA queda simulada. No se solicitan CAE reales, no se usan certificados, no se generan PDF fiscales ni se envia informacion a servicios externos.

## Tablas

- `comprobantes_facturacion`: cabecera del comprobante, socio relacionado, estados simulados de ARCA/cobro, importes y trazabilidad.
- `items_comprobante_facturacion`: detalle de conceptos facturados por comprobante.
- `pagos_comprobante_facturacion`: pagos registrados contra un comprobante.

Relaciones principales:

- `comprobantes_facturacion.socio_id -> socios.id`
- `items_comprobante_facturacion.comprobante_facturacion_id -> comprobantes_facturacion.id`
- `pagos_comprobante_facturacion.comprobante_facturacion_id -> comprobantes_facturacion.id`
- `comprobantes_facturacion.comprobante_relacionado_id -> comprobantes_facturacion.id`

Todas las tablas usan `id Int @id @default(autoincrement())` y columnas/FKs en snake_case mediante `@map`/`@@map`.

## Endpoints

Base: `/api/billing`

- `GET /invoices`: lista comprobantes con socio, items, pagos y comprobante relacionado.
- `GET /invoices/:id`: devuelve un comprobante por id.
- `POST /invoices`: crea un comprobante demo persistido.
- `PATCH /invoices/:id`: actualiza datos del comprobante.
- `DELETE /invoices/:id`: baja demo sin eliminar fisicamente, para conservar trazabilidad.
- `POST /invoices/:id/mark-paid`: registra un pago y marca el comprobante como pagado.
- `POST /invoices/:id/credit-note`: genera una nota de credito relacionada.
- `POST /invoices/:id/debit-note`: genera una nota de debito relacionada.

## Frontend

La pantalla `/app/facturacion` consume:

- `GET /api/billing/invoices`
- `GET /api/members`

Permite crear comprobantes, marcar pagos y generar notas relacionadas en modo simulado. Mantiene un aviso visible indicando que ARCA no esta integrado fiscalmente.

## Seed

El seed crea comprobantes demo idempotentes si existen socios cargados. Si no hay socios, omite los comprobantes de facturacion para no crear datos huerfanos.

## Comandos

Desde `/server`:

```bash
npx prisma generate
npx prisma migrate deploy
npm run prisma:seed
npm run build
```

En una base local ya existente con historial de migraciones desalineado, se puede sincronizar estructura para desarrollo con:

```bash
npx prisma db push
```

No subir archivos `.db` al repositorio.

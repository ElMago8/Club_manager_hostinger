-- CreateTable comprobantes_facturacion
CREATE TABLE "comprobantes_facturacion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "codigo_comprobante" TEXT NOT NULL,
    "socio_id" INTEGER NOT NULL,
    "tipo_comprobante" TEXT NOT NULL,
    "punto_venta" TEXT,
    "numero_comprobante" TEXT,
    "fecha_emision" DATETIME NOT NULL,
    "fecha_vencimiento_pago" DATETIME,
    "concepto" TEXT NOT NULL,
    "condicion_iva" TEXT NOT NULL DEFAULT 'consumidor_final',
    "cuit_dni" TEXT,
    "razon_social" TEXT,
    "domicilio" TEXT,
    "subtotal" REAL NOT NULL DEFAULT 0,
    "iva" REAL NOT NULL DEFAULT 0,
    "total" REAL NOT NULL,
    "moneda" TEXT NOT NULL DEFAULT 'ARS',
    "estado_arca" TEXT NOT NULL DEFAULT 'pendiente',
    "estado_cobro" TEXT NOT NULL DEFAULT 'impago',
    "cae" TEXT,
    "vencimiento_cae" DATETIME,
    "pdf_url" TEXT,
    "observaciones" TEXT,
    "comprobante_relacionado_id" INTEGER,
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" DATETIME NOT NULL,
    CONSTRAINT "comprobantes_facturacion_socio_id_fkey" FOREIGN KEY ("socio_id") REFERENCES "socios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "comprobantes_facturacion_comprobante_relacionado_id_fkey" FOREIGN KEY ("comprobante_relacionado_id") REFERENCES "comprobantes_facturacion" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "comprobantes_facturacion_codigo_comprobante_key" ON "comprobantes_facturacion"("codigo_comprobante");
CREATE INDEX "comprobantes_facturacion_socio_id_idx" ON "comprobantes_facturacion"("socio_id");
CREATE INDEX "comprobantes_facturacion_comprobante_relacionado_id_idx" ON "comprobantes_facturacion"("comprobante_relacionado_id");
CREATE INDEX "comprobantes_facturacion_fecha_emision_idx" ON "comprobantes_facturacion"("fecha_emision");
CREATE INDEX "comprobantes_facturacion_estado_arca_idx" ON "comprobantes_facturacion"("estado_arca");
CREATE INDEX "comprobantes_facturacion_estado_cobro_idx" ON "comprobantes_facturacion"("estado_cobro");

-- CreateTable items_comprobante_facturacion
CREATE TABLE "items_comprobante_facturacion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "comprobante_facturacion_id" INTEGER NOT NULL,
    "descripcion" TEXT NOT NULL,
    "cantidad" REAL NOT NULL,
    "precio_unitario" REAL NOT NULL,
    "subtotal" REAL NOT NULL,
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "items_comprobante_facturacion_comprobante_facturacion_id_fkey" FOREIGN KEY ("comprobante_facturacion_id") REFERENCES "comprobantes_facturacion" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "items_comprobante_facturacion_comprobante_facturacion_id_idx" ON "items_comprobante_facturacion"("comprobante_facturacion_id");

-- CreateTable pagos_comprobante_facturacion
CREATE TABLE "pagos_comprobante_facturacion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "comprobante_facturacion_id" INTEGER NOT NULL,
    "fecha_pago" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "monto" REAL NOT NULL,
    "medio_pago" TEXT NOT NULL,
    "referencia" TEXT,
    "observaciones" TEXT,
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pagos_comprobante_facturacion_comprobante_facturacion_id_fkey" FOREIGN KEY ("comprobante_facturacion_id") REFERENCES "comprobantes_facturacion" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "pagos_comprobante_facturacion_comprobante_facturacion_id_idx" ON "pagos_comprobante_facturacion"("comprobante_facturacion_id");
CREATE INDEX "pagos_comprobante_facturacion_fecha_pago_idx" ON "pagos_comprobante_facturacion"("fecha_pago");

PRAGMA foreign_keys=OFF;

CREATE TABLE "new_comprobantes_facturacion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "codigo_comprobante" TEXT NOT NULL,
    "socio_id" INTEGER,
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

INSERT INTO "new_comprobantes_facturacion" (
    "id",
    "codigo_comprobante",
    "socio_id",
    "tipo_comprobante",
    "punto_venta",
    "numero_comprobante",
    "fecha_emision",
    "fecha_vencimiento_pago",
    "concepto",
    "condicion_iva",
    "cuit_dni",
    "razon_social",
    "domicilio",
    "subtotal",
    "iva",
    "total",
    "moneda",
    "estado_arca",
    "estado_cobro",
    "cae",
    "vencimiento_cae",
    "pdf_url",
    "observaciones",
    "comprobante_relacionado_id",
    "creado_en",
    "actualizado_en"
)
SELECT
    "id",
    "codigo_comprobante",
    "socio_id",
    "tipo_comprobante",
    "punto_venta",
    "numero_comprobante",
    "fecha_emision",
    "fecha_vencimiento_pago",
    "concepto",
    "condicion_iva",
    "cuit_dni",
    "razon_social",
    "domicilio",
    "subtotal",
    "iva",
    "total",
    "moneda",
    "estado_arca",
    "estado_cobro",
    "cae",
    "vencimiento_cae",
    "pdf_url",
    "observaciones",
    "comprobante_relacionado_id",
    "creado_en",
    "actualizado_en"
FROM "comprobantes_facturacion";

DROP TABLE "comprobantes_facturacion";
ALTER TABLE "new_comprobantes_facturacion" RENAME TO "comprobantes_facturacion";

CREATE UNIQUE INDEX "comprobantes_facturacion_codigo_comprobante_key" ON "comprobantes_facturacion"("codigo_comprobante");
CREATE INDEX "comprobantes_facturacion_socio_id_idx" ON "comprobantes_facturacion"("socio_id");
CREATE INDEX "comprobantes_facturacion_comprobante_relacionado_id_idx" ON "comprobantes_facturacion"("comprobante_relacionado_id");
CREATE INDEX "comprobantes_facturacion_fecha_emision_idx" ON "comprobantes_facturacion"("fecha_emision");
CREATE INDEX "comprobantes_facturacion_estado_arca_idx" ON "comprobantes_facturacion"("estado_arca");
CREATE INDEX "comprobantes_facturacion_estado_cobro_idx" ON "comprobantes_facturacion"("estado_cobro");

PRAGMA foreign_keys=ON;

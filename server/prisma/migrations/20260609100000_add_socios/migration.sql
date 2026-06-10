-- CreateTable: socios
CREATE TABLE "socios" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "codigo_socio" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "dni" TEXT,
    "fecha_nacimiento" DATETIME,
    "telefono" TEXT,
    "email" TEXT,
    "direccion" TEXT,
    "localidad" TEXT,
    "provincia" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'activo',
    "tipo_socio" TEXT,
    "cupo_mensual_gramos" REAL,
    "observaciones" TEXT,
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" DATETIME NOT NULL
);

CREATE UNIQUE INDEX "socios_codigo_socio_key" ON "socios"("codigo_socio");
CREATE UNIQUE INDEX "socios_dni_key" ON "socios"("dni");

-- CreateTable: documentos_socio
CREATE TABLE "documentos_socio" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "socio_id" INTEGER NOT NULL,
    "tipo_documento" TEXT NOT NULL,
    "numero_documento" TEXT,
    "fecha_emision" DATETIME,
    "fecha_vencimiento" DATETIME,
    "estado" TEXT NOT NULL DEFAULT 'vigente',
    "archivo_url" TEXT,
    "observaciones" TEXT,
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" DATETIME NOT NULL,
    CONSTRAINT "documentos_socio_socio_id_fkey" FOREIGN KEY ("socio_id") REFERENCES "socios" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "documentos_socio_socio_id_idx" ON "documentos_socio"("socio_id");

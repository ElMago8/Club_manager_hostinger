/*
  Warnings:

  - You are about to drop the column `entorno_cultivo` on the `cosechas` table. All the data in the column will be lost.
  - You are about to drop the column `tipo_cultivo` on the `cosechas` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "clonadores" ADD COLUMN "contador_inicio_en" DATETIME;

-- AlterTable
ALTER TABLE "geneticas" ADD COLUMN "origen" TEXT;
ALTER TABLE "geneticas" ADD COLUMN "perfil_cannabinoide" TEXT;

-- AlterTable
ALTER TABLE "salas_cultivo" ADD COLUMN "entorno_cultivo" TEXT;
ALTER TABLE "salas_cultivo" ADD COLUMN "tipo_cultivo" TEXT;

-- CreateTable
CREATE TABLE "sistemas_riego" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "codigo_riego" TEXT NOT NULL,
    "camilla_id" INTEGER NOT NULL,
    "picos_por_planta" REAL,
    "horario_apertura" TEXT,
    "cantidad_litros" REAL,
    "tanque" TEXT,
    "frecuencia_tiempo" TEXT,
    "sistema_regado" TEXT NOT NULL,
    "sistema_regado_custom" TEXT,
    "notas" TEXT,
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" DATETIME NOT NULL,
    CONSTRAINT "sistemas_riego_camilla_id_fkey" FOREIGN KEY ("camilla_id") REFERENCES "camillas" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "categorias_producto" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "codigo_categoria" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'activa',
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "productos" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "codigo_producto" TEXT NOT NULL,
    "categoria_producto_id" INTEGER,
    "nombre" TEXT NOT NULL,
    "tipo_producto" TEXT NOT NULL,
    "unidad_medida" TEXT NOT NULL DEFAULT 'gramos',
    "descripcion" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'activo',
    "requiere_lote" BOOLEAN NOT NULL DEFAULT true,
    "requiere_trazabilidad" BOOLEAN NOT NULL DEFAULT true,
    "cantidad" REAL,
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" DATETIME NOT NULL,
    CONSTRAINT "productos_categoria_producto_id_fkey" FOREIGN KEY ("categoria_producto_id") REFERENCES "categorias_producto" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ubicaciones_stock" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "codigo_ubicacion" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "descripcion" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'activa',
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "lotes_producto" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "codigo_lote_producto" TEXT NOT NULL,
    "producto_id" INTEGER NOT NULL,
    "cosecha_id" INTEGER,
    "lote_cultivo_id" INTEGER,
    "genetica_id" INTEGER,
    "ubicacion_stock_id" INTEGER,
    "fecha_ingreso" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_vencimiento" DATETIME,
    "cantidad_inicial" REAL NOT NULL DEFAULT 0,
    "cantidad_disponible" REAL NOT NULL DEFAULT 0,
    "cantidad_reservada" REAL NOT NULL DEFAULT 0,
    "unidad_medida" TEXT NOT NULL DEFAULT 'gramos',
    "estado" TEXT NOT NULL DEFAULT 'disponible',
    "observaciones" TEXT,
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" DATETIME NOT NULL,
    CONSTRAINT "lotes_producto_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "lotes_producto_cosecha_id_fkey" FOREIGN KEY ("cosecha_id") REFERENCES "cosechas" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "lotes_producto_lote_cultivo_id_fkey" FOREIGN KEY ("lote_cultivo_id") REFERENCES "lotes_cultivo" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "lotes_producto_genetica_id_fkey" FOREIGN KEY ("genetica_id") REFERENCES "geneticas" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "lotes_producto_ubicacion_stock_id_fkey" FOREIGN KEY ("ubicacion_stock_id") REFERENCES "ubicaciones_stock" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_cosechas" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "codigo_cosecha" TEXT NOT NULL,
    "lote_cultivo_id" INTEGER NOT NULL,
    "sala_cultivo_id" INTEGER,
    "fecha_cosecha" DATETIME NOT NULL,
    "peso_humedo_gramos" REAL,
    "peso_seco_gramos" REAL,
    "peso_merma_gramos" REAL,
    "estado" TEXT NOT NULL DEFAULT 'registrada',
    "secado_inicio_en" DATETIME,
    "curado_inicio_en" DATETIME,
    "observaciones" TEXT,
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" DATETIME NOT NULL,
    CONSTRAINT "cosechas_lote_cultivo_id_fkey" FOREIGN KEY ("lote_cultivo_id") REFERENCES "lotes_cultivo" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "cosechas_sala_cultivo_id_fkey" FOREIGN KEY ("sala_cultivo_id") REFERENCES "salas_cultivo" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_cosechas" ("actualizado_en", "codigo_cosecha", "creado_en", "estado", "fecha_cosecha", "id", "lote_cultivo_id", "observaciones", "peso_humedo_gramos", "peso_merma_gramos", "peso_seco_gramos") SELECT "actualizado_en", "codigo_cosecha", "creado_en", "estado", "fecha_cosecha", "id", "lote_cultivo_id", "observaciones", "peso_humedo_gramos", "peso_merma_gramos", "peso_seco_gramos" FROM "cosechas";
DROP TABLE "cosechas";
ALTER TABLE "new_cosechas" RENAME TO "cosechas";
CREATE UNIQUE INDEX "cosechas_codigo_cosecha_key" ON "cosechas"("codigo_cosecha");
CREATE INDEX "cosechas_lote_cultivo_id_idx" ON "cosechas"("lote_cultivo_id");
CREATE INDEX "cosechas_sala_cultivo_id_idx" ON "cosechas"("sala_cultivo_id");
CREATE TABLE "new_mediciones_cultivo" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "fecha" DATETIME NOT NULL,
    "hora" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "sala_cultivo_id" INTEGER NOT NULL,
    "camilla_id" INTEGER,
    "clonador_id" INTEGER,
    "planta_id" INTEGER,
    "madre_id" INTEGER,
    "ph_liquido" REAL,
    "ppm_liquido" REAL,
    "ec_liquido" REAL,
    "ph_sustrato" REAL,
    "ppm_sustrato" REAL,
    "ec_sustrato" REAL,
    "ph_drenaje" REAL,
    "ppm_drenaje" REAL,
    "ec_drenaje" REAL,
    "temp_agua" REAL,
    "temp_sustrato" REAL,
    "estado" TEXT NOT NULL DEFAULT 'normal',
    "metodo" TEXT,
    "responsable" TEXT,
    "observaciones" TEXT,
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" DATETIME NOT NULL,
    CONSTRAINT "mediciones_cultivo_sala_cultivo_id_fkey" FOREIGN KEY ("sala_cultivo_id") REFERENCES "salas_cultivo" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "mediciones_cultivo_camilla_id_fkey" FOREIGN KEY ("camilla_id") REFERENCES "camillas" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "mediciones_cultivo_clonador_id_fkey" FOREIGN KEY ("clonador_id") REFERENCES "clonadores" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "mediciones_cultivo_planta_id_fkey" FOREIGN KEY ("planta_id") REFERENCES "plantas" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "mediciones_cultivo_madre_id_fkey" FOREIGN KEY ("madre_id") REFERENCES "madres" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_mediciones_cultivo" ("actualizado_en", "camilla_id", "clonador_id", "creado_en", "estado", "fecha", "hora", "id", "madre_id", "metodo", "observaciones", "ph_drenaje", "ph_liquido", "ph_sustrato", "planta_id", "ppm_drenaje", "ppm_liquido", "ppm_sustrato", "responsable", "sala_cultivo_id", "tipo") SELECT "actualizado_en", "camilla_id", "clonador_id", "creado_en", "estado", "fecha", "hora", "id", "madre_id", "metodo", "observaciones", "ph_drenaje", "ph_liquido", "ph_sustrato", "planta_id", "ppm_drenaje", "ppm_liquido", "ppm_sustrato", "responsable", "sala_cultivo_id", "tipo" FROM "mediciones_cultivo";
DROP TABLE "mediciones_cultivo";
ALTER TABLE "new_mediciones_cultivo" RENAME TO "mediciones_cultivo";
CREATE INDEX "mediciones_cultivo_sala_cultivo_id_idx" ON "mediciones_cultivo"("sala_cultivo_id");
CREATE INDEX "mediciones_cultivo_camilla_id_idx" ON "mediciones_cultivo"("camilla_id");
CREATE INDEX "mediciones_cultivo_clonador_id_idx" ON "mediciones_cultivo"("clonador_id");
CREATE INDEX "mediciones_cultivo_planta_id_idx" ON "mediciones_cultivo"("planta_id");
CREATE INDEX "mediciones_cultivo_madre_id_idx" ON "mediciones_cultivo"("madre_id");
CREATE INDEX "mediciones_cultivo_fecha_idx" ON "mediciones_cultivo"("fecha");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "sistemas_riego_codigo_riego_key" ON "sistemas_riego"("codigo_riego");

-- CreateIndex
CREATE INDEX "sistemas_riego_camilla_id_idx" ON "sistemas_riego"("camilla_id");

-- CreateIndex
CREATE UNIQUE INDEX "categorias_producto_codigo_categoria_key" ON "categorias_producto"("codigo_categoria");

-- CreateIndex
CREATE UNIQUE INDEX "productos_codigo_producto_key" ON "productos"("codigo_producto");

-- CreateIndex
CREATE INDEX "productos_categoria_producto_id_idx" ON "productos"("categoria_producto_id");

-- CreateIndex
CREATE UNIQUE INDEX "ubicaciones_stock_codigo_ubicacion_key" ON "ubicaciones_stock"("codigo_ubicacion");

-- CreateIndex
CREATE UNIQUE INDEX "lotes_producto_codigo_lote_producto_key" ON "lotes_producto"("codigo_lote_producto");

-- CreateIndex
CREATE INDEX "lotes_producto_producto_id_idx" ON "lotes_producto"("producto_id");

-- CreateIndex
CREATE INDEX "lotes_producto_cosecha_id_idx" ON "lotes_producto"("cosecha_id");

-- CreateIndex
CREATE INDEX "lotes_producto_lote_cultivo_id_idx" ON "lotes_producto"("lote_cultivo_id");

-- CreateIndex
CREATE INDEX "lotes_producto_genetica_id_idx" ON "lotes_producto"("genetica_id");

-- CreateIndex
CREATE INDEX "lotes_producto_ubicacion_stock_id_idx" ON "lotes_producto"("ubicacion_stock_id");

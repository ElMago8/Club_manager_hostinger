/*
  Warnings:

  - You are about to drop the column `tipo_substrato` on the `cosechas` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_cosechas" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "codigo_cosecha" TEXT NOT NULL,
    "lote_cultivo_id" INTEGER NOT NULL,
    "fecha_cosecha" DATETIME NOT NULL,
    "peso_humedo_gramos" REAL,
    "peso_seco_gramos" REAL,
    "peso_merma_gramos" REAL,
    "entorno_cultivo" TEXT,
    "tipo_cultivo" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'registrada',
    "observaciones" TEXT,
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" DATETIME NOT NULL,
    CONSTRAINT "cosechas_lote_cultivo_id_fkey" FOREIGN KEY ("lote_cultivo_id") REFERENCES "lotes_cultivo" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_cosechas" ("actualizado_en", "codigo_cosecha", "creado_en", "estado", "fecha_cosecha", "id", "lote_cultivo_id", "observaciones", "peso_humedo_gramos", "peso_merma_gramos", "peso_seco_gramos", "tipo_cultivo") SELECT "actualizado_en", "codigo_cosecha", "creado_en", "estado", "fecha_cosecha", "id", "lote_cultivo_id", "observaciones", "peso_humedo_gramos", "peso_merma_gramos", "peso_seco_gramos", "tipo_cultivo" FROM "cosechas";
DROP TABLE "cosechas";
ALTER TABLE "new_cosechas" RENAME TO "cosechas";
CREATE UNIQUE INDEX "cosechas_codigo_cosecha_key" ON "cosechas"("codigo_cosecha");
CREATE INDEX "cosechas_lote_cultivo_id_idx" ON "cosechas"("lote_cultivo_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

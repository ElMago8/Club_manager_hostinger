-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_camillas" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "codigo_camilla" TEXT NOT NULL,
    "sala_cultivo_id" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'camilla',
    "estado" TEXT NOT NULL DEFAULT 'activa',
    "capacidad_maxima_plantas" INTEGER NOT NULL,
    "descripcion" TEXT,
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" DATETIME NOT NULL,
    CONSTRAINT "camillas_sala_cultivo_id_fkey" FOREIGN KEY ("sala_cultivo_id") REFERENCES "salas_cultivo" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_camillas" ("actualizado_en", "capacidad_maxima_plantas", "codigo_camilla", "creado_en", "descripcion", "estado", "id", "nombre", "sala_cultivo_id") SELECT "actualizado_en", "capacidad_maxima_plantas", "codigo_camilla", "creado_en", "descripcion", "estado", "id", "nombre", "sala_cultivo_id" FROM "camillas";
DROP TABLE "camillas";
ALTER TABLE "new_camillas" RENAME TO "camillas";
CREATE UNIQUE INDEX "camillas_codigo_camilla_key" ON "camillas"("codigo_camilla");
CREATE INDEX "camillas_sala_cultivo_id_idx" ON "camillas"("sala_cultivo_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

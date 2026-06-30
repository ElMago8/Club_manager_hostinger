-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_registros_ambientales" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sala_cultivo_id" INTEGER NOT NULL,
    "lote_cultivo_id" INTEGER,
    "camilla_id" INTEGER,
    "temperatura" REAL NOT NULL,
    "humedad" REAL NOT NULL,
    "vpd" REAL,
    "co2" INTEGER,
    "observaciones" TEXT,
    "registrado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "registros_ambientales_sala_cultivo_id_fkey" FOREIGN KEY ("sala_cultivo_id") REFERENCES "salas_cultivo" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "registros_ambientales_lote_cultivo_id_fkey" FOREIGN KEY ("lote_cultivo_id") REFERENCES "lotes_cultivo" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "registros_ambientales_camilla_id_fkey" FOREIGN KEY ("camilla_id") REFERENCES "camillas" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_registros_ambientales" ("co2", "creado_en", "humedad", "id", "lote_cultivo_id", "observaciones", "registrado_en", "sala_cultivo_id", "temperatura", "vpd") SELECT "co2", "creado_en", "humedad", "id", "lote_cultivo_id", "observaciones", "registrado_en", "sala_cultivo_id", "temperatura", "vpd" FROM "registros_ambientales";
DROP TABLE "registros_ambientales";
ALTER TABLE "new_registros_ambientales" RENAME TO "registros_ambientales";
CREATE INDEX "registros_ambientales_sala_cultivo_id_idx" ON "registros_ambientales"("sala_cultivo_id");
CREATE INDEX "registros_ambientales_lote_cultivo_id_idx" ON "registros_ambientales"("lote_cultivo_id");
CREATE INDEX "registros_ambientales_camilla_id_idx" ON "registros_ambientales"("camilla_id");
CREATE INDEX "registros_ambientales_registrado_en_idx" ON "registros_ambientales"("registrado_en");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

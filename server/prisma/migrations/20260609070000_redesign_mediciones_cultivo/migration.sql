-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_mediciones_cultivo" (
    "id"              INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "fecha"           DATETIME NOT NULL,
    "hora"            TEXT NOT NULL,
    "tipo"            TEXT NOT NULL,
    "sala_cultivo_id" INTEGER NOT NULL,
    "camilla_id"      INTEGER,
    "planta_id"       INTEGER,
    "madre_id"        INTEGER,
    "ph_liquido"      REAL,
    "ppm_liquido"     REAL,
    "ph_sustrato"     REAL,
    "ppm_sustrato"    REAL,
    "ph_drenaje"      REAL,
    "ppm_drenaje"     REAL,
    "estado"          TEXT NOT NULL DEFAULT 'normal',
    "responsable"     TEXT,
    "observaciones"   TEXT,
    "creado_en"       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en"  DATETIME NOT NULL,
    CONSTRAINT "mediciones_cultivo_sala_cultivo_id_fkey" FOREIGN KEY ("sala_cultivo_id") REFERENCES "salas_cultivo" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "mediciones_cultivo_camilla_id_fkey"      FOREIGN KEY ("camilla_id")      REFERENCES "camillas"       ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "mediciones_cultivo_planta_id_fkey"       FOREIGN KEY ("planta_id")       REFERENCES "plantas"        ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "mediciones_cultivo_madre_id_fkey"        FOREIGN KEY ("madre_id")        REFERENCES "madres"         ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
DROP TABLE "mediciones_cultivo";
ALTER TABLE "new_mediciones_cultivo" RENAME TO "mediciones_cultivo";
CREATE INDEX "mediciones_cultivo_sala_cultivo_id_idx" ON "mediciones_cultivo"("sala_cultivo_id");
CREATE INDEX "mediciones_cultivo_camilla_id_idx"      ON "mediciones_cultivo"("camilla_id");
CREATE INDEX "mediciones_cultivo_planta_id_idx"       ON "mediciones_cultivo"("planta_id");
CREATE INDEX "mediciones_cultivo_madre_id_idx"        ON "mediciones_cultivo"("madre_id");
CREATE INDEX "mediciones_cultivo_fecha_idx"           ON "mediciones_cultivo"("fecha");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

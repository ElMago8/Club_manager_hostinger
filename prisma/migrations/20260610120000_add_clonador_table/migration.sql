-- CreateTable clonadores
CREATE TABLE "clonadores" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "codigo_clonador" TEXT NOT NULL,
    "sala_cultivo_id" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'activa',
    "capacidad_maxima_esquejes" INTEGER NOT NULL,
    "responsable" TEXT,
    "descripcion" TEXT,
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" DATETIME NOT NULL,
    CONSTRAINT "clonadores_sala_cultivo_id_fkey" FOREIGN KEY ("sala_cultivo_id") REFERENCES "salas_cultivo" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "clonadores_codigo_clonador_key" ON "clonadores"("codigo_clonador");
CREATE INDEX "clonadores_sala_cultivo_id_idx" ON "clonadores"("sala_cultivo_id");

-- Remove tipo from camillas
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_camillas" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "codigo_camilla" TEXT NOT NULL,
    "sala_cultivo_id" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
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

-- Update plantas: make camillaId nullable, add clonadorId/posicionClonador
CREATE TABLE "new_plantas" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "codigo_planta" TEXT NOT NULL,
    "nombre_planta" TEXT NOT NULL,
    "lote_cultivo_id" INTEGER,
    "genetica_id" INTEGER NOT NULL,
    "madre_id" INTEGER,
    "camilla_id" INTEGER,
    "posicion_camilla" INTEGER,
    "clonador_id" INTEGER,
    "posicion_clonador" INTEGER,
    "origen" TEXT NOT NULL,
    "etapa" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'activa',
    "fecha_inicio" DATETIME NOT NULL,
    "fecha_inicio_etapa" DATETIME,
    "maceta_codigo" TEXT,
    "maceta_litros" REAL,
    "tipo_maceta" TEXT,
    "sustrato" TEXT,
    "estado_sanitario" TEXT DEFAULT 'bueno',
    "observaciones" TEXT,
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" DATETIME NOT NULL,
    CONSTRAINT "plantas_lote_cultivo_id_fkey" FOREIGN KEY ("lote_cultivo_id") REFERENCES "lotes_cultivo" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "plantas_genetica_id_fkey" FOREIGN KEY ("genetica_id") REFERENCES "geneticas" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "plantas_madre_id_fkey" FOREIGN KEY ("madre_id") REFERENCES "madres" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "plantas_camilla_id_fkey" FOREIGN KEY ("camilla_id") REFERENCES "camillas" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "plantas_clonador_id_fkey" FOREIGN KEY ("clonador_id") REFERENCES "clonadores" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_plantas" ("actualizado_en", "camilla_id", "codigo_planta", "creado_en", "estado", "estado_sanitario", "etapa", "fecha_inicio", "fecha_inicio_etapa", "genetica_id", "id", "lote_cultivo_id", "maceta_codigo", "maceta_litros", "madre_id", "nombre_planta", "observaciones", "origen", "posicion_camilla", "sustrato", "tipo_maceta") SELECT "actualizado_en", "camilla_id", "codigo_planta", "creado_en", "estado", "estado_sanitario", "etapa", "fecha_inicio", "fecha_inicio_etapa", "genetica_id", "id", "lote_cultivo_id", "maceta_codigo", "maceta_litros", "madre_id", "nombre_planta", "observaciones", "origen", "posicion_camilla", "sustrato", "tipo_maceta" FROM "plantas";
DROP TABLE "plantas";
ALTER TABLE "new_plantas" RENAME TO "plantas";
CREATE UNIQUE INDEX "plantas_codigo_planta_key" ON "plantas"("codigo_planta");
CREATE UNIQUE INDEX "plantas_camilla_id_posicion_camilla_key" ON "plantas"("camilla_id", "posicion_camilla");
CREATE UNIQUE INDEX "plantas_clonador_id_posicion_clonador_key" ON "plantas"("clonador_id", "posicion_clonador");
CREATE INDEX "plantas_lote_cultivo_id_idx" ON "plantas"("lote_cultivo_id");
CREATE INDEX "plantas_genetica_id_idx" ON "plantas"("genetica_id");
CREATE INDEX "plantas_madre_id_idx" ON "plantas"("madre_id");
CREATE INDEX "plantas_camilla_id_idx" ON "plantas"("camilla_id");
CREATE INDEX "plantas_clonador_id_idx" ON "plantas"("clonador_id");

-- Add clonador_id to mediciones_cultivo
ALTER TABLE "mediciones_cultivo" ADD COLUMN "clonador_id" INTEGER REFERENCES "clonadores"("id") ON DELETE SET NULL;
CREATE INDEX "mediciones_cultivo_clonador_id_idx" ON "mediciones_cultivo"("clonador_id");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

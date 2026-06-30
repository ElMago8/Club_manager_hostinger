PRAGMA foreign_keys=OFF;

DROP TABLE IF EXISTS "CultivationMeasurement";
DROP TABLE IF EXISTS "OperationalTask";
DROP TABLE IF EXISTS "IrrigationLog";
DROP TABLE IF EXISTS "EnvironmentalLog";
DROP TABLE IF EXISTS "Plant";
DROP TABLE IF EXISTS "MotherPlant";
DROP TABLE IF EXISTS "Genetics";
DROP TABLE IF EXISTS "GrowBed";

PRAGMA foreign_keys=ON;

CREATE TABLE "salas_cultivo" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "codigo_sala" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'activa',
    "descripcion" TEXT,
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" DATETIME NOT NULL
);

CREATE TABLE "camillas" (
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

CREATE TABLE "geneticas" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "codigo_genetica" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "thc_estimado" REAL,
    "cbd_estimado" REAL,
    "tiempo_floracion_dias" INTEGER,
    "estado" TEXT NOT NULL DEFAULT 'activa',
    "descripcion" TEXT,
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" DATETIME NOT NULL
);

CREATE TABLE "madres" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "codigo_madre" TEXT NOT NULL,
    "genetica_id" INTEGER NOT NULL,
    "sala_cultivo_id" INTEGER NOT NULL,
    "camilla_id" INTEGER NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'activa',
    "fecha_inicio" DATETIME NOT NULL,
    "observaciones" TEXT,
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" DATETIME NOT NULL,
    CONSTRAINT "madres_genetica_id_fkey" FOREIGN KEY ("genetica_id") REFERENCES "geneticas" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "madres_sala_cultivo_id_fkey" FOREIGN KEY ("sala_cultivo_id") REFERENCES "salas_cultivo" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "madres_camilla_id_fkey" FOREIGN KEY ("camilla_id") REFERENCES "camillas" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "lotes_cultivo" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "codigo_lote" TEXT NOT NULL,
    "genetica_id" INTEGER NOT NULL,
    "sala_cultivo_id" INTEGER NOT NULL,
    "fecha_inicio" DATETIME NOT NULL,
    "fecha_inicio_floracion" DATETIME,
    "fecha_estimada_cosecha" DATETIME,
    "fecha_cosecha_real" DATETIME,
    "estado" TEXT NOT NULL DEFAULT 'activo',
    "observaciones" TEXT,
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" DATETIME NOT NULL,
    CONSTRAINT "lotes_cultivo_genetica_id_fkey" FOREIGN KEY ("genetica_id") REFERENCES "geneticas" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "lotes_cultivo_sala_cultivo_id_fkey" FOREIGN KEY ("sala_cultivo_id") REFERENCES "salas_cultivo" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "plantas" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "codigo_planta" TEXT NOT NULL,
    "lote_cultivo_id" INTEGER,
    "genetica_id" INTEGER NOT NULL,
    "madre_id" INTEGER,
    "camilla_id" INTEGER NOT NULL,
    "posicion_camilla" INTEGER NOT NULL,
    "origen" TEXT NOT NULL,
    "etapa" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'activa',
    "fecha_inicio" DATETIME NOT NULL,
    "fecha_inicio_etapa" DATETIME,
    "maceta_codigo" TEXT,
    "maceta_litros" REAL,
    "tipo_maceta" TEXT,
    "sustrato" TEXT,
    "observaciones" TEXT,
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" DATETIME NOT NULL,
    CONSTRAINT "plantas_lote_cultivo_id_fkey" FOREIGN KEY ("lote_cultivo_id") REFERENCES "lotes_cultivo" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "plantas_genetica_id_fkey" FOREIGN KEY ("genetica_id") REFERENCES "geneticas" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "plantas_madre_id_fkey" FOREIGN KEY ("madre_id") REFERENCES "madres" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "plantas_camilla_id_fkey" FOREIGN KEY ("camilla_id") REFERENCES "camillas" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "registros_ambientales" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sala_cultivo_id" INTEGER NOT NULL,
    "lote_cultivo_id" INTEGER,
    "temperatura" REAL NOT NULL,
    "humedad" REAL NOT NULL,
    "vpd" REAL,
    "co2" INTEGER,
    "observaciones" TEXT,
    "registrado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "registros_ambientales_sala_cultivo_id_fkey" FOREIGN KEY ("sala_cultivo_id") REFERENCES "salas_cultivo" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "registros_ambientales_lote_cultivo_id_fkey" FOREIGN KEY ("lote_cultivo_id") REFERENCES "lotes_cultivo" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "riegos" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "planta_id" INTEGER,
    "lote_cultivo_id" INTEGER,
    "tipo_riego" TEXT NOT NULL,
    "volumen_litros" REAL NOT NULL,
    "ph" REAL,
    "ec" REAL,
    "observaciones" TEXT,
    "fecha_riego" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "riegos_planta_id_fkey" FOREIGN KEY ("planta_id") REFERENCES "plantas" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "riegos_lote_cultivo_id_fkey" FOREIGN KEY ("lote_cultivo_id") REFERENCES "lotes_cultivo" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "mediciones_cultivo" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "planta_id" INTEGER NOT NULL,
    "altura_cm" REAL,
    "diametro_tallo_mm" REAL,
    "cantidad_nodos" INTEGER,
    "estado_general" TEXT,
    "observaciones" TEXT,
    "fecha_medicion" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "mediciones_cultivo_planta_id_fkey" FOREIGN KEY ("planta_id") REFERENCES "plantas" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "tareas_cultivo" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "tipo" TEXT NOT NULL,
    "prioridad" TEXT NOT NULL DEFAULT 'media',
    "estado" TEXT NOT NULL DEFAULT 'pendiente',
    "sala_cultivo_id" INTEGER,
    "camilla_id" INTEGER,
    "lote_cultivo_id" INTEGER,
    "planta_id" INTEGER,
    "fecha_programada" DATETIME NOT NULL,
    "fecha_completada" DATETIME,
    "observaciones" TEXT,
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" DATETIME NOT NULL,
    CONSTRAINT "tareas_cultivo_sala_cultivo_id_fkey" FOREIGN KEY ("sala_cultivo_id") REFERENCES "salas_cultivo" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "tareas_cultivo_camilla_id_fkey" FOREIGN KEY ("camilla_id") REFERENCES "camillas" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "tareas_cultivo_lote_cultivo_id_fkey" FOREIGN KEY ("lote_cultivo_id") REFERENCES "lotes_cultivo" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "tareas_cultivo_planta_id_fkey" FOREIGN KEY ("planta_id") REFERENCES "plantas" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "cosechas" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "codigo_cosecha" TEXT NOT NULL,
    "lote_cultivo_id" INTEGER NOT NULL,
    "fecha_cosecha" DATETIME NOT NULL,
    "peso_humedo_gramos" REAL,
    "peso_seco_gramos" REAL,
    "peso_merma_gramos" REAL,
    "estado" TEXT NOT NULL DEFAULT 'registrada',
    "observaciones" TEXT,
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" DATETIME NOT NULL,
    CONSTRAINT "cosechas_lote_cultivo_id_fkey" FOREIGN KEY ("lote_cultivo_id") REFERENCES "lotes_cultivo" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "salas_cultivo_codigo_sala_key" ON "salas_cultivo"("codigo_sala");
CREATE UNIQUE INDEX "camillas_codigo_camilla_key" ON "camillas"("codigo_camilla");
CREATE INDEX "camillas_sala_cultivo_id_idx" ON "camillas"("sala_cultivo_id");
CREATE UNIQUE INDEX "geneticas_codigo_genetica_key" ON "geneticas"("codigo_genetica");
CREATE UNIQUE INDEX "madres_codigo_madre_key" ON "madres"("codigo_madre");
CREATE INDEX "madres_genetica_id_idx" ON "madres"("genetica_id");
CREATE INDEX "madres_sala_cultivo_id_idx" ON "madres"("sala_cultivo_id");
CREATE INDEX "madres_camilla_id_idx" ON "madres"("camilla_id");
CREATE UNIQUE INDEX "lotes_cultivo_codigo_lote_key" ON "lotes_cultivo"("codigo_lote");
CREATE INDEX "lotes_cultivo_genetica_id_idx" ON "lotes_cultivo"("genetica_id");
CREATE INDEX "lotes_cultivo_sala_cultivo_id_idx" ON "lotes_cultivo"("sala_cultivo_id");
CREATE UNIQUE INDEX "plantas_codigo_planta_key" ON "plantas"("codigo_planta");
CREATE UNIQUE INDEX "plantas_camilla_id_posicion_camilla_key" ON "plantas"("camilla_id", "posicion_camilla");
CREATE INDEX "plantas_lote_cultivo_id_idx" ON "plantas"("lote_cultivo_id");
CREATE INDEX "plantas_genetica_id_idx" ON "plantas"("genetica_id");
CREATE INDEX "plantas_madre_id_idx" ON "plantas"("madre_id");
CREATE INDEX "plantas_camilla_id_idx" ON "plantas"("camilla_id");
CREATE INDEX "registros_ambientales_sala_cultivo_id_idx" ON "registros_ambientales"("sala_cultivo_id");
CREATE INDEX "registros_ambientales_lote_cultivo_id_idx" ON "registros_ambientales"("lote_cultivo_id");
CREATE INDEX "registros_ambientales_registrado_en_idx" ON "registros_ambientales"("registrado_en");
CREATE INDEX "riegos_planta_id_idx" ON "riegos"("planta_id");
CREATE INDEX "riegos_lote_cultivo_id_idx" ON "riegos"("lote_cultivo_id");
CREATE INDEX "riegos_fecha_riego_idx" ON "riegos"("fecha_riego");
CREATE INDEX "mediciones_cultivo_planta_id_idx" ON "mediciones_cultivo"("planta_id");
CREATE INDEX "mediciones_cultivo_fecha_medicion_idx" ON "mediciones_cultivo"("fecha_medicion");
CREATE INDEX "tareas_cultivo_estado_idx" ON "tareas_cultivo"("estado");
CREATE INDEX "tareas_cultivo_prioridad_idx" ON "tareas_cultivo"("prioridad");
CREATE INDEX "tareas_cultivo_tipo_idx" ON "tareas_cultivo"("tipo");
CREATE INDEX "tareas_cultivo_sala_cultivo_id_idx" ON "tareas_cultivo"("sala_cultivo_id");
CREATE INDEX "tareas_cultivo_camilla_id_idx" ON "tareas_cultivo"("camilla_id");
CREATE INDEX "tareas_cultivo_lote_cultivo_id_idx" ON "tareas_cultivo"("lote_cultivo_id");
CREATE INDEX "tareas_cultivo_planta_id_idx" ON "tareas_cultivo"("planta_id");
CREATE INDEX "tareas_cultivo_fecha_programada_idx" ON "tareas_cultivo"("fecha_programada");
CREATE UNIQUE INDEX "cosechas_codigo_cosecha_key" ON "cosechas"("codigo_cosecha");
CREATE INDEX "cosechas_lote_cultivo_id_idx" ON "cosechas"("lote_cultivo_id");

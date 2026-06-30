-- CreateTable
CREATE TABLE "usuarios" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "codigo_usuario" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT,
    "email" TEXT,
    "password_hash" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'activo',
    "ultimo_login_en" DATETIME,
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "roles" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "slug" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'activo',
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "permisos" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "clave_permiso" TEXT NOT NULL,
    "modulo" TEXT NOT NULL,
    "accion" TEXT NOT NULL,
    "descripcion" TEXT,
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "usuario_roles" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "usuario_id" INTEGER NOT NULL,
    "rol_id" INTEGER NOT NULL,
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "usuario_roles_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "usuario_roles_rol_id_fkey" FOREIGN KEY ("rol_id") REFERENCES "roles" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "rol_permisos" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "rol_id" INTEGER NOT NULL,
    "permiso_id" INTEGER NOT NULL,
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "rol_permisos_rol_id_fkey" FOREIGN KEY ("rol_id") REFERENCES "roles" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "rol_permisos_permiso_id_fkey" FOREIGN KEY ("permiso_id") REFERENCES "permisos" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_plantas" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "codigo_planta" TEXT NOT NULL,
    "nombre_planta" TEXT NOT NULL,
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
INSERT INTO "new_plantas" ("actualizado_en", "camilla_id", "codigo_planta", "creado_en", "estado", "etapa", "fecha_inicio", "fecha_inicio_etapa", "genetica_id", "id", "lote_cultivo_id", "maceta_codigo", "maceta_litros", "madre_id", "nombre_planta", "observaciones", "origen", "posicion_camilla", "sustrato", "tipo_maceta") SELECT "actualizado_en", "camilla_id", "codigo_planta", "creado_en", "estado", "etapa", "fecha_inicio", "fecha_inicio_etapa", "genetica_id", "id", "lote_cultivo_id", "maceta_codigo", "maceta_litros", "madre_id", "nombre_planta", "observaciones", "origen", "posicion_camilla", "sustrato", "tipo_maceta" FROM "plantas";
DROP TABLE "plantas";
ALTER TABLE "new_plantas" RENAME TO "plantas";
CREATE UNIQUE INDEX "plantas_codigo_planta_key" ON "plantas"("codigo_planta");
CREATE INDEX "plantas_lote_cultivo_id_idx" ON "plantas"("lote_cultivo_id");
CREATE INDEX "plantas_genetica_id_idx" ON "plantas"("genetica_id");
CREATE INDEX "plantas_madre_id_idx" ON "plantas"("madre_id");
CREATE INDEX "plantas_camilla_id_idx" ON "plantas"("camilla_id");
CREATE UNIQUE INDEX "plantas_camilla_id_posicion_camilla_key" ON "plantas"("camilla_id", "posicion_camilla");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_codigo_usuario_key" ON "usuarios"("codigo_usuario");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_username_key" ON "usuarios"("username");

-- CreateIndex
CREATE UNIQUE INDEX "roles_slug_key" ON "roles"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "roles_nombre_key" ON "roles"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "permisos_clave_permiso_key" ON "permisos"("clave_permiso");

-- CreateIndex
CREATE INDEX "usuario_roles_usuario_id_idx" ON "usuario_roles"("usuario_id");

-- CreateIndex
CREATE INDEX "usuario_roles_rol_id_idx" ON "usuario_roles"("rol_id");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_roles_usuario_id_rol_id_key" ON "usuario_roles"("usuario_id", "rol_id");

-- CreateIndex
CREATE INDEX "rol_permisos_rol_id_idx" ON "rol_permisos"("rol_id");

-- CreateIndex
CREATE INDEX "rol_permisos_permiso_id_idx" ON "rol_permisos"("permiso_id");

-- CreateIndex
CREATE UNIQUE INDEX "rol_permisos_rol_id_permiso_id_key" ON "rol_permisos"("rol_id", "permiso_id");

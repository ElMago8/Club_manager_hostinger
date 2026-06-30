ALTER TABLE "madres" ADD COLUMN "nombre_madre" TEXT;
ALTER TABLE "madres" ADD COLUMN "estado_sanitario" TEXT NOT NULL DEFAULT 'bueno';
ALTER TABLE "madres" ADD COLUMN "fecha_ultimo_corte" DATETIME;
ALTER TABLE "madres" ADD COLUMN "cantidad_esquejes_disponibles" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "madres" ADD COLUMN "origen" TEXT;

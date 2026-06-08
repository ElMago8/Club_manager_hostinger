ALTER TABLE "salas_cultivo" ADD COLUMN "potencia_watts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "salas_cultivo" ADD COLUMN "tipo_riego" TEXT NOT NULL DEFAULT 'manual';
ALTER TABLE "salas_cultivo" ADD COLUMN "tiene_aire_acondicionado" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "salas_cultivo" ADD COLUMN "tiene_deshumidificador" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "salas_cultivo" ADD COLUMN "sensores" TEXT;

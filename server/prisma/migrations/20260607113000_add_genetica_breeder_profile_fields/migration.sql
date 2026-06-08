ALTER TABLE "geneticas" ADD COLUMN "breeder" TEXT;
ALTER TABLE "geneticas" ADD COLUMN "sativa_porcentaje" REAL;
ALTER TABLE "geneticas" ADD COLUMN "indica_porcentaje" REAL;
ALTER TABLE "geneticas" ADD COLUMN "sabor" TEXT;
ALTER TABLE "geneticas" ADD COLUMN "efecto" TEXT;
ALTER TABLE "geneticas" ADD COLUMN "aroma" TEXT;
ALTER TABLE "geneticas" ADD COLUMN "observaciones" TEXT;

UPDATE "geneticas"
SET "observaciones" = "descripcion"
WHERE "observaciones" IS NULL
  AND "descripcion" IS NOT NULL;

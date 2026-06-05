-- CreateTable
CREATE TABLE "CultivationMeasurement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "measurementType" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "time" TEXT NOT NULL,
    "roomId" TEXT,
    "bedId" TEXT,
    "plantId" TEXT,
    "motherPlantId" TEXT,
    "batchId" TEXT,
    "relatedModule" TEXT NOT NULL DEFAULT 'general',
    "substratePH" REAL,
    "substratePPM" REAL,
    "substrateEC" REAL,
    "liquidPH" REAL,
    "liquidPPM" REAL,
    "liquidEC" REAL,
    "runoffPH" REAL,
    "runoffPPM" REAL,
    "runoffEC" REAL,
    "waterTempC" REAL,
    "substrateTempC" REAL,
    "measurementMethod" TEXT,
    "responsibleName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'normal',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CultivationMeasurement_bedId_fkey" FOREIGN KEY ("bedId") REFERENCES "GrowBed" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CultivationMeasurement_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "Plant" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CultivationMeasurement_motherPlantId_fkey" FOREIGN KEY ("motherPlantId") REFERENCES "MotherPlant" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- AlterTable
ALTER TABLE "IrrigationLog" ADD COLUMN "ppmIn" REAL;
ALTER TABLE "IrrigationLog" ADD COLUMN "ppmRunoff" REAL;
ALTER TABLE "IrrigationLog" ADD COLUMN "substratePH" REAL;
ALTER TABLE "IrrigationLog" ADD COLUMN "substratePPM" REAL;
ALTER TABLE "IrrigationLog" ADD COLUMN "substrateEC" REAL;

-- CreateIndex
CREATE INDEX "CultivationMeasurement_roomId_idx" ON "CultivationMeasurement"("roomId");
CREATE INDEX "CultivationMeasurement_bedId_idx" ON "CultivationMeasurement"("bedId");
CREATE INDEX "CultivationMeasurement_plantId_idx" ON "CultivationMeasurement"("plantId");
CREATE INDEX "CultivationMeasurement_motherPlantId_idx" ON "CultivationMeasurement"("motherPlantId");
CREATE INDEX "CultivationMeasurement_batchId_idx" ON "CultivationMeasurement"("batchId");
CREATE INDEX "CultivationMeasurement_measurementType_idx" ON "CultivationMeasurement"("measurementType");
CREATE INDEX "CultivationMeasurement_status_idx" ON "CultivationMeasurement"("status");
CREATE INDEX "CultivationMeasurement_relatedModule_idx" ON "CultivationMeasurement"("relatedModule");
CREATE INDEX "CultivationMeasurement_date_idx" ON "CultivationMeasurement"("date");

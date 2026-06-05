-- CreateTable
CREATE TABLE "GrowBed" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "roomId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'empty',
    "maxPlants" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Plant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "internalCode" TEXT NOT NULL,
    "bedId" TEXT NOT NULL,
    "bedPosition" INTEGER NOT NULL,
    "batchId" TEXT,
    "geneticsId" TEXT,
    "motherPlantId" TEXT,
    "origin" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'normal',
    "startDate" DATETIME NOT NULL,
    "stageStartDate" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Plant_bedId_fkey" FOREIGN KEY ("bedId") REFERENCES "GrowBed" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Plant_geneticsId_fkey" FOREIGN KEY ("geneticsId") REFERENCES "Genetics" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Plant_motherPlantId_fkey" FOREIGN KEY ("motherPlantId") REFERENCES "MotherPlant" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Genetics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "breeder" TEXT,
    "type" TEXT NOT NULL DEFAULT 'unknown',
    "dominantProfile" TEXT NOT NULL DEFAULT 'unknown',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "MotherPlant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "geneticsId" TEXT NOT NULL,
    "roomId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "startDate" DATETIME NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MotherPlant_geneticsId_fkey" FOREIGN KEY ("geneticsId") REFERENCES "Genetics" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EnvironmentalLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bedId" TEXT,
    "batchId" TEXT,
    "date" DATETIME NOT NULL,
    "time" TEXT NOT NULL,
    "airTempC" REAL NOT NULL,
    "relativeHumidity" REAL NOT NULL,
    "leafTempC" REAL,
    "co2ppm" INTEGER,
    "calculatedVPD" REAL NOT NULL,
    "vpdStatus" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "EnvironmentalLog_bedId_fkey" FOREIGN KEY ("bedId") REFERENCES "GrowBed" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "IrrigationLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bedId" TEXT,
    "batchId" TEXT,
    "plantId" TEXT,
    "date" DATETIME NOT NULL,
    "time" TEXT NOT NULL,
    "irrigationType" TEXT NOT NULL,
    "litersPrepared" REAL NOT NULL,
    "litersApplied" REAL NOT NULL,
    "phIn" REAL,
    "ecIn" REAL,
    "phRunoff" REAL,
    "ecRunoff" REAL,
    "runoffPercentage" REAL,
    "recipeName" TEXT,
    "nutrientsNotes" TEXT,
    "responsibleName" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "IrrigationLog_bedId_fkey" FOREIGN KEY ("bedId") REFERENCES "GrowBed" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "IrrigationLog_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "Plant" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "GrowBed_code_key" ON "GrowBed"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Plant_internalCode_key" ON "Plant"("internalCode");

-- CreateIndex
CREATE INDEX "Plant_bedId_idx" ON "Plant"("bedId");

-- CreateIndex
CREATE INDEX "Plant_geneticsId_idx" ON "Plant"("geneticsId");

-- CreateIndex
CREATE INDEX "Plant_motherPlantId_idx" ON "Plant"("motherPlantId");

-- CreateIndex
CREATE UNIQUE INDEX "Plant_bedId_bedPosition_key" ON "Plant"("bedId", "bedPosition");

-- CreateIndex
CREATE UNIQUE INDEX "MotherPlant_code_key" ON "MotherPlant"("code");

-- CreateIndex
CREATE INDEX "MotherPlant_geneticsId_idx" ON "MotherPlant"("geneticsId");

-- CreateIndex
CREATE INDEX "EnvironmentalLog_bedId_idx" ON "EnvironmentalLog"("bedId");

-- CreateIndex
CREATE INDEX "EnvironmentalLog_date_idx" ON "EnvironmentalLog"("date");

-- CreateIndex
CREATE INDEX "EnvironmentalLog_vpdStatus_idx" ON "EnvironmentalLog"("vpdStatus");

-- CreateIndex
CREATE INDEX "IrrigationLog_bedId_idx" ON "IrrigationLog"("bedId");

-- CreateIndex
CREATE INDEX "IrrigationLog_plantId_idx" ON "IrrigationLog"("plantId");

-- CreateIndex
CREATE INDEX "IrrigationLog_date_idx" ON "IrrigationLog"("date");

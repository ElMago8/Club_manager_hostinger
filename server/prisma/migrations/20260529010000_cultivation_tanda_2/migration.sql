-- AlterTable
ALTER TABLE "Plant" ADD COLUMN "potCode" TEXT;
ALTER TABLE "Plant" ADD COLUMN "potSizeLiters" REAL;
ALTER TABLE "Plant" ADD COLUMN "potType" TEXT;
ALTER TABLE "Plant" ADD COLUMN "substrate" TEXT;

-- CreateTable
CREATE TABLE "OperationalTask" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "taskType" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "dueDate" DATETIME NOT NULL,
    "dueTime" TEXT,
    "assignedToName" TEXT,
    "assignedToUserId" TEXT,
    "roomId" TEXT,
    "bedId" TEXT,
    "plantId" TEXT,
    "batchId" TEXT,
    "relatedModule" TEXT NOT NULL DEFAULT 'cultivation',
    "recurrenceType" TEXT NOT NULL DEFAULT 'none',
    "recurrenceInterval" INTEGER,
    "completedAt" DATETIME,
    "completedByName" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "OperationalTask_bedId_fkey" FOREIGN KEY ("bedId") REFERENCES "GrowBed" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "OperationalTask_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "Plant" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "OperationalTask_status_idx" ON "OperationalTask"("status");
CREATE INDEX "OperationalTask_priority_idx" ON "OperationalTask"("priority");
CREATE INDEX "OperationalTask_taskType_idx" ON "OperationalTask"("taskType");
CREATE INDEX "OperationalTask_dueDate_idx" ON "OperationalTask"("dueDate");
CREATE INDEX "OperationalTask_bedId_idx" ON "OperationalTask"("bedId");
CREATE INDEX "OperationalTask_plantId_idx" ON "OperationalTask"("plantId");

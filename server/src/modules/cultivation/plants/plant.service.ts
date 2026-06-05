import { prisma } from "../../../config/prisma.js";
import { ApiError } from "../../../utils/ApiError.js";
import type { z } from "zod";
import type { bulkCreatePlantsSchema, createPlantSchema, plantFiltersSchema, updatePlantSchema, updatePlantStageSchema, updatePlantStatusSchema } from "./plant.schema.js";

type PlantFilters = z.infer<typeof plantFiltersSchema>;
type CreatePlantInput = z.infer<typeof createPlantSchema>;
type UpdatePlantInput = z.infer<typeof updatePlantSchema>;
type UpdatePlantStatusInput = z.infer<typeof updatePlantStatusSchema>;
type UpdatePlantStageInput = z.infer<typeof updatePlantStageSchema>;
type BulkCreatePlantsInput = z.infer<typeof bulkCreatePlantsSchema>;

async function getBedOrThrow(bedId: string) {
  const bed = await prisma.growBed.findUnique({ where: { id: bedId } });
  if (!bed) throw new ApiError(404, "Grow bed not found.");
  return bed;
}

async function assertPositionAvailable(bedId: string, bedPosition: number, ignoredPlantId?: string) {
  const bed = await getBedOrThrow(bedId);
  if (bedPosition > bed.maxPlants) throw new ApiError(400, "bedPosition cannot be greater than bed maxPlants.");
  const existing = await prisma.plant.findFirst({
    where: { bedId, bedPosition, id: ignoredPlantId ? { not: ignoredPlantId } : undefined },
  });
  if (existing) throw new ApiError(409, "A plant already exists in that bed position.");
}

async function assertCapacityAvailable(bedId: string, adding: number, ignoredPlantId?: string) {
  const bed = await getBedOrThrow(bedId);
  if (bed.maxPlants > 100) throw new ApiError(400, "Grow bed capacity cannot exceed 100 plants.");
  const currentPlants = await prisma.plant.count({
    where: { bedId, id: ignoredPlantId ? { not: ignoredPlantId } : undefined },
  });
  if (currentPlants + adding > bed.maxPlants) throw new ApiError(400, "Not enough available capacity in this grow bed.");
}

async function getFreePositions(bedId: string) {
  const bed = await getBedOrThrow(bedId);
  const plants = await prisma.plant.findMany({ where: { bedId }, select: { bedPosition: true } });
  const occupied = new Set(plants.map((plant) => plant.bedPosition));
  return Array.from({ length: Math.min(bed.maxPlants, 100) }, (_, index) => index + 1).filter((position) => !occupied.has(position));
}

function buildPotCode(bedCode: string, position: number, prefix?: string) {
  const sequence = String(position).padStart(3, "0");
  return `${prefix ?? `${bedCode}-POT`}-${sequence}`;
}

const includeRelations = {
  bed: true,
  genetics: true,
  motherPlant: true,
};

export const plantService = {
  list(filters: PlantFilters) {
    return prisma.plant.findMany({
      where: filters,
      include: includeRelations,
      orderBy: [{ bedId: "asc" }, { bedPosition: "asc" }],
    });
  },

  async create(data: CreatePlantInput) {
    await assertCapacityAvailable(data.bedId, 1);
    await assertPositionAvailable(data.bedId, data.bedPosition);
    return prisma.plant.create({ data, include: includeRelations });
  },

  async bulkCreate(data: BulkCreatePlantsInput) {
    await assertCapacityAvailable(data.bedId, data.count);
    const bed = await getBedOrThrow(data.bedId);
    const freePositions = await getFreePositions(data.bedId);
    if (freePositions.length < data.count) throw new ApiError(400, "Not enough free positions in this grow bed.");

    const created = [];
    for (let index = 0; index < data.count; index += 1) {
      const sequence = String(index + 1).padStart(3, "0");
      created.push(
        await prisma.plant.create({
          data: {
            internalCode: `${data.internalCodePrefix}-${Date.now()}-${sequence}`,
            bedId: data.bedId,
            bedPosition: freePositions[index],
            batchId: data.batchId,
            geneticsId: data.geneticsId,
            motherPlantId: data.motherPlantId,
            origin: data.origin,
            stage: data.stage,
            status: data.status,
            startDate: data.startDate,
            stageStartDate: data.stageStartDate,
            potCode: buildPotCode(bed.code, freePositions[index], data.potCodePrefix),
            potSizeLiters: data.potSizeLiters,
            potType: data.potType,
            substrate: data.substrate,
            notes: data.notes,
          },
          include: includeRelations,
        }),
      );
    }
    return created;
  },

  async getById(id: string) {
    const plant = await prisma.plant.findUnique({ where: { id }, include: includeRelations });
    if (!plant) throw new ApiError(404, "Plant not found.");
    return plant;
  },

  async update(id: string, data: UpdatePlantInput) {
    const current = await this.getById(id);
    const nextBedId = data.bedId ?? current.bedId;
    const nextPosition = data.bedPosition ?? current.bedPosition;
    await assertCapacityAvailable(nextBedId, 1, id);
    await assertPositionAvailable(nextBedId, nextPosition, id);
    return prisma.plant.update({ where: { id }, data, include: includeRelations });
  },

  async updateStatus(id: string, data: UpdatePlantStatusInput) {
    await this.getById(id);
    return prisma.plant.update({ where: { id }, data, include: includeRelations });
  },

  async updateStage(id: string, data: UpdatePlantStageInput) {
    await this.getById(id);
    return prisma.plant.update({ where: { id }, data, include: includeRelations });
  },
};

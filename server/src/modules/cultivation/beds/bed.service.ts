import { prisma } from "../../../config/prisma.js";
import { ApiError } from "../../../utils/ApiError.js";
import type { createBedSchema, updateBedCapacitySchema, updateBedSchema, updateBedStatusSchema } from "./bed.schema.js";
import type { z } from "zod";

type CreateBedInput = z.infer<typeof createBedSchema>;
type UpdateBedInput = z.infer<typeof updateBedSchema>;
type UpdateBedStatusInput = z.infer<typeof updateBedStatusSchema>;
type UpdateBedCapacityInput = z.infer<typeof updateBedCapacitySchema>;

async function assertMaxPlantsCanChange(id: string, maxPlants?: number) {
  if (maxPlants === undefined) return;
  const assignedPlants = await prisma.plant.count({ where: { bedId: id } });
  if (maxPlants < assignedPlants) {
    throw new ApiError(400, "maxPlants cannot be lower than assigned plants count.");
  }
}

export const bedService = {
  list() {
    return prisma.growBed.findMany({ orderBy: { createdAt: "desc" }, include: { _count: { select: { plants: true } } } });
  },

  async create(data: CreateBedInput) {
    return prisma.growBed.create({ data });
  },

  async getById(id: string) {
    const bed = await prisma.growBed.findUnique({
      where: { id },
      include: { plants: true, _count: { select: { plants: true } } },
    });
    if (!bed) throw new ApiError(404, "Grow bed not found.");
    return bed;
  },

  async update(id: string, data: UpdateBedInput) {
    await this.getById(id);
    await assertMaxPlantsCanChange(id, data.maxPlants);
    return prisma.growBed.update({ where: { id }, data });
  },

  async updateStatus(id: string, data: UpdateBedStatusInput) {
    await this.getById(id);
    return prisma.growBed.update({ where: { id }, data });
  },

  async getBedOccupancy(bedId: string) {
    const bed = await prisma.growBed.findUnique({
      where: { id: bedId },
      include: { _count: { select: { plants: true } } },
    });
    if (!bed) throw new ApiError(404, "Grow bed not found.");
    const occupied = bed._count.plants;
    const available = Math.max(bed.maxPlants - occupied, 0);
    const occupancyPercentage = bed.maxPlants > 0 ? Number(((occupied / bed.maxPlants) * 100).toFixed(1)) : 0;
    return { bedId, maxPlants: bed.maxPlants, occupied, available, occupancyPercentage };
  },

  async updateCapacity(id: string, data: UpdateBedCapacityInput) {
    const occupied = await prisma.plant.count({ where: { bedId: id } });
    if (data.maxPlants < occupied) {
      throw new ApiError(400, "No se puede reducir la capacidad por debajo de la cantidad actual de plantas asignadas.");
    }
    await this.getById(id);
    return prisma.growBed.update({ where: { id }, data });
  },
};

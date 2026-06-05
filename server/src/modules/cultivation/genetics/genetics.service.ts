import { prisma } from "../../../config/prisma.js";
import { ApiError } from "../../../utils/ApiError.js";
import type { z } from "zod";
import type { createGeneticsSchema, updateGeneticsSchema } from "./genetics.schema.js";

type CreateGeneticsInput = z.infer<typeof createGeneticsSchema>;
type UpdateGeneticsInput = z.infer<typeof updateGeneticsSchema>;

export const geneticsService = {
  list() {
    return prisma.genetics.findMany({ include: { _count: { select: { plants: true, motherPlants: true } } }, orderBy: { name: "asc" } });
  },
  create(data: CreateGeneticsInput) {
    const { assignToBed, ...geneticsData } = data;
    if (!assignToBed) return prisma.genetics.create({ data: geneticsData });

    return prisma.$transaction(async (tx) => {
      const bed = await tx.growBed.findUnique({ where: { id: assignToBed.bedId } });
      if (!bed) throw new ApiError(404, "Grow bed not found.");
      if (bed.status === "out_of_use") throw new ApiError(400, "No se puede asignar plantas a una camilla fuera de uso.");
      if (bed.maxPlants > 100) throw new ApiError(400, "Grow bed capacity cannot exceed 100 plants.");

      const occupiedPlants = await tx.plant.findMany({
        where: { bedId: bed.id },
        select: { bedPosition: true },
      });
      const occupied = new Set(occupiedPlants.map((plant) => plant.bedPosition));
      const freePositions = Array.from({ length: Math.min(bed.maxPlants, 100) }, (_, index) => index + 1).filter(
        (position) => !occupied.has(position),
      );

      if (freePositions.length < assignToBed.plantCount) {
        throw new ApiError(400, "No hay posiciones libres suficientes en la camilla seleccionada.");
      }

      const genetics = await tx.genetics.create({ data: geneticsData });
      const now = Date.now();
      for (let index = 0; index < assignToBed.plantCount; index += 1) {
        const position = freePositions[index];
        const sequence = String(position).padStart(3, "0");
        await tx.plant.create({
          data: {
            internalCode: `PL-${bed.code}-${now}-${sequence}`,
            bedId: bed.id,
            bedPosition: position,
            batchId: assignToBed.batchId,
            geneticsId: genetics.id,
            motherPlantId: assignToBed.motherPlantId,
            origin: assignToBed.origin,
            stage: assignToBed.stage,
            status: assignToBed.status,
            startDate: assignToBed.startDate ?? new Date(),
            stageStartDate: assignToBed.startDate ?? new Date(),
            potCode: `${bed.code}-POT-${sequence}`,
            potSizeLiters: assignToBed.potSizeLiters,
            potType: assignToBed.potType,
            substrate: assignToBed.substrate,
            notes: assignToBed.notes,
          },
        });
      }

      return tx.genetics.findUniqueOrThrow({
        where: { id: genetics.id },
        include: { _count: { select: { plants: true, motherPlants: true } } },
      });
    });
  },
  async getById(id: string) {
    const genetics = await prisma.genetics.findUnique({ where: { id }, include: { plants: true, motherPlants: true } });
    if (!genetics) throw new ApiError(404, "Genetics not found.");
    return genetics;
  },
  async update(id: string, data: UpdateGeneticsInput) {
    await this.getById(id);
    return prisma.genetics.update({ where: { id }, data });
  },
};

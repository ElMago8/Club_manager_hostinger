import { prisma } from "../../../config/prisma.js";
import { ApiError } from "../../../utils/ApiError.js";
import type { z } from "zod";
import { getMeasurementStatus } from "../measurements/measurement.service.js";
import type { createIrrigationLogSchema, irrigationFiltersSchema } from "./irrigation.schema.js";

type CreateIrrigationLogInput = z.infer<typeof createIrrigationLogSchema>;
type IrrigationFilters = z.infer<typeof irrigationFiltersSchema>;

async function assertRelations(data: CreateIrrigationLogInput) {
  if (data.bedId) {
    const bed = await prisma.growBed.findUnique({ where: { id: data.bedId } });
    if (!bed) throw new ApiError(404, "Grow bed not found.");
  }
  if (data.plantId) {
    const plant = await prisma.plant.findUnique({ where: { id: data.plantId } });
    if (!plant) throw new ApiError(404, "Plant not found.");
  }
}

export const irrigationService = {
  list(filters: IrrigationFilters) {
    return prisma.irrigationLog.findMany({
      where: {
        bedId: filters.bedId,
        plantId: filters.plantId,
        batchId: filters.batchId,
        date: {
          gte: filters.dateFrom,
          lte: filters.dateTo,
        },
      },
      include: { bed: true, plant: true },
      orderBy: [{ date: "desc" }, { time: "desc" }],
    });
  },

  async create(data: CreateIrrigationLogInput) {
    await assertRelations(data);
    const log = await prisma.irrigationLog.create({ data, include: { bed: true, plant: true } });
    const hasMeasurementValues = [
      data.phIn,
      data.ppmIn,
      data.ecIn,
      data.phRunoff,
      data.ppmRunoff,
      data.ecRunoff,
      data.substratePH,
      data.substratePPM,
      data.substrateEC,
    ].some((value) => value !== undefined);

    if (hasMeasurementValues) {
      const measurement = {
        measurementType: "mixed" as const,
        date: data.date,
        time: data.time,
        bedId: data.bedId,
        plantId: data.plantId,
        batchId: data.batchId,
        relatedModule: "irrigation" as const,
        liquidPH: data.phIn,
        liquidPPM: data.ppmIn,
        liquidEC: data.ecIn,
        runoffPH: data.phRunoff,
        runoffPPM: data.ppmRunoff,
        runoffEC: data.ecRunoff,
        substratePH: data.substratePH,
        substratePPM: data.substratePPM,
        substrateEC: data.substrateEC,
        responsibleName: data.responsibleName,
        notes: data.notes,
      };

      await prisma.cultivationMeasurement.create({
        data: { ...measurement, status: getMeasurementStatus(measurement) },
      });
    }

    return log;
  },

  async getById(id: string) {
    const log = await prisma.irrigationLog.findUnique({ where: { id }, include: { bed: true, plant: true } });
    if (!log) throw new ApiError(404, "Irrigation log not found.");
    return log;
  },
};

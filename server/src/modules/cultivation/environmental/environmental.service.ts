import { prisma } from "../../../config/prisma.js";
import { calculateVPD, getVPDStatus } from "../../../utils/vpdCalculator.js";
import { ApiError } from "../../../utils/ApiError.js";
import type { z } from "zod";
import type { createEnvironmentalLogSchema, environmentalFiltersSchema } from "./environmental.schema.js";

type CreateEnvironmentalLogInput = z.infer<typeof createEnvironmentalLogSchema>;
type EnvironmentalFilters = z.infer<typeof environmentalFiltersSchema>;

export const environmentalService = {
  list(filters: EnvironmentalFilters) {
    return prisma.environmentalLog.findMany({
      where: {
        bedId: filters.bedId,
        batchId: filters.batchId,
        vpdStatus: filters.vpdStatus,
        date: {
          gte: filters.dateFrom,
          lte: filters.dateTo,
        },
      },
      include: { bed: true },
      orderBy: [{ date: "desc" }, { time: "desc" }],
    });
  },

  async create(data: CreateEnvironmentalLogInput) {
    if (data.bedId) {
      const bed = await prisma.growBed.findUnique({ where: { id: data.bedId } });
      if (!bed) throw new ApiError(404, "Grow bed not found.");
    }
    const calculatedVPD = calculateVPD({
      airTempC: data.airTempC,
      relativeHumidity: data.relativeHumidity,
      leafTempC: data.leafTempC,
      defaultLeafOffset: -2.8,
    });
    const vpdStatus = getVPDStatus(calculatedVPD, data.stage);
    const { stage: _stage, ...logData } = data;
    return prisma.environmentalLog.create({
      data: {
        ...logData,
        calculatedVPD,
        vpdStatus,
      },
      include: { bed: true },
    });
  },

  async getById(id: string) {
    const log = await prisma.environmentalLog.findUnique({ where: { id }, include: { bed: true } });
    if (!log) throw new ApiError(404, "Environmental log not found.");
    return log;
  },
};

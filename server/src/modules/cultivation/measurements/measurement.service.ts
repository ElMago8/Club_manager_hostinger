import { prisma } from "../../../config/prisma.js";
import { ApiError } from "../../../utils/ApiError.js";
import type { z } from "zod";
import type { createMeasurementSchema, measurementFiltersSchema, updateMeasurementSchema } from "./measurement.schema.js";

type CreateMeasurementInput = z.infer<typeof createMeasurementSchema>;
type UpdateMeasurementInput = z.infer<typeof updateMeasurementSchema>;
type MeasurementFilters = z.infer<typeof measurementFiltersSchema>;
type MeasurementStatus = "normal" | "observation" | "alert" | "critical";
type MeasurementRelationsInput = {
  bedId?: string | null;
  plantId?: string | null;
  motherPlantId?: string | null;
};
type MeasurementStatusInput = {
  liquidPH?: number | null;
  substratePH?: number | null;
  liquidPPM?: number | null;
  substratePPM?: number | null;
};

const STATUS_WEIGHT: Record<MeasurementStatus, number> = {
  normal: 0,
  observation: 1,
  alert: 2,
  critical: 3,
};

const RANGE_RULES = {
  liquidPH: [
    { status: "normal", min: 5.5, max: 6.8 },
    { status: "observation", min: 5.2, max: 7.2 },
    { status: "alert", min: 4.8, max: 7.6 },
  ],
  substratePH: [
    { status: "normal", min: 5.8, max: 7.0 },
    { status: "observation", min: 5.5, max: 7.3 },
    { status: "alert", min: 5.0, max: 7.8 },
  ],
  liquidPPM: [
    { status: "normal", min: 300, max: 1400 },
    { status: "observation", min: 0, max: 1800 },
    { status: "alert", min: 0, max: 2200 },
  ],
  substratePPM: [
    { status: "normal", min: 300, max: 1600 },
    { status: "observation", min: 0, max: 2000 },
    { status: "alert", min: 0, max: 2500 },
  ],
} as const;

function classifyValue(value: number | null | undefined, rules: readonly { status: string; min: number; max: number }[]): MeasurementStatus {
  if (value === undefined || value === null) return "normal";
  const match = rules.find((rule) => value >= rule.min && value <= rule.max);
  return (match?.status ?? "critical") as MeasurementStatus;
}

export function getMeasurementStatus(measurement: MeasurementStatusInput): MeasurementStatus {
  const statuses: MeasurementStatus[] = [
    classifyValue(measurement.liquidPH, RANGE_RULES.liquidPH),
    classifyValue(measurement.substratePH, RANGE_RULES.substratePH),
    classifyValue(measurement.liquidPPM, RANGE_RULES.liquidPPM),
    classifyValue(measurement.substratePPM, RANGE_RULES.substratePPM),
  ];

  return statuses.reduce((worst, status) => (STATUS_WEIGHT[status] > STATUS_WEIGHT[worst] ? status : worst), "normal");
}

async function assertRelations(data: MeasurementRelationsInput) {
  if (data.bedId) {
    const bed = await prisma.growBed.findUnique({ where: { id: data.bedId } });
    if (!bed) throw new ApiError(404, "Grow bed not found.");
  }
  if (data.plantId) {
    const plant = await prisma.plant.findUnique({ where: { id: data.plantId } });
    if (!plant) throw new ApiError(404, "Plant not found.");
  }
  if (data.motherPlantId) {
    const motherPlant = await prisma.motherPlant.findUnique({ where: { id: data.motherPlantId } });
    if (!motherPlant) throw new ApiError(404, "Mother plant not found.");
  }
}

function measurementWhere(filters: MeasurementFilters) {
  return {
    roomId: filters.roomId,
    bedId: filters.bedId,
    plantId: filters.plantId,
    motherPlantId: filters.motherPlantId,
    batchId: filters.batchId,
    measurementType: filters.measurementType,
    status: filters.status,
    relatedModule: filters.relatedModule,
    date: {
      gte: filters.dateFrom,
      lte: filters.dateTo,
    },
  };
}

function avg(values: Array<number | null>) {
  const cleanValues = values.filter((value): value is number => typeof value === "number");
  if (cleanValues.length === 0) return null;
  return Number((cleanValues.reduce((total, value) => total + value, 0) / cleanValues.length).toFixed(2));
}

export const measurementService = {
  list(filters: MeasurementFilters) {
    return prisma.cultivationMeasurement.findMany({
      where: measurementWhere(filters),
      include: { bed: true, plant: true, motherPlant: true },
      orderBy: [{ date: "desc" }, { time: "desc" }],
    });
  },

  async summary(filters: MeasurementFilters) {
    const measurements = await prisma.cultivationMeasurement.findMany({
      where: measurementWhere(filters),
      orderBy: [{ date: "desc" }, { time: "desc" }],
    });
    const latest = measurements.slice(0, 6);
    const outOfRange = measurements.filter((item) => item.status === "alert" || item.status === "critical");

    return {
      latestMeasurements: latest,
      outOfRangeMeasurements: outOfRange.slice(0, 10),
      averageLiquidPH: avg(measurements.map((item) => item.liquidPH)),
      averageSubstratePH: avg(measurements.map((item) => item.substratePH)),
      averageLiquidPPM: avg(measurements.map((item) => item.liquidPPM)),
      averageSubstratePPM: avg(measurements.map((item) => item.substratePPM)),
      alertsCount: measurements.filter((item) => item.status === "alert").length,
      criticalCount: measurements.filter((item) => item.status === "critical").length,
    };
  },

  async create(data: CreateMeasurementInput) {
    await assertRelations(data);
    return prisma.cultivationMeasurement.create({
      data: { ...data, status: getMeasurementStatus(data) },
      include: { bed: true, plant: true, motherPlant: true },
    });
  },

  async getById(id: string) {
    const measurement = await prisma.cultivationMeasurement.findUnique({
      where: { id },
      include: { bed: true, plant: true, motherPlant: true },
    });
    if (!measurement) throw new ApiError(404, "Measurement not found.");
    return measurement;
  },

  async update(id: string, data: UpdateMeasurementInput) {
    const current = await this.getById(id);
    const merged = { ...current, ...data };
    await assertRelations(merged);
    return prisma.cultivationMeasurement.update({
      where: { id },
      data: { ...data, status: getMeasurementStatus(merged) },
      include: { bed: true, plant: true, motherPlant: true },
    });
  },

  async delete(id: string) {
    await this.getById(id);
    await prisma.cultivationMeasurement.delete({ where: { id } });
    return { ok: true };
  },
};

import { cultivationMeasurements } from "@/data/cultivationMockData";
import { apiRequest, withMockFallback } from "@/services/cultivationApi";
import type {
  CultivationMeasurement,
  MeasurementRelatedModule,
  MeasurementStatus,
  MeasurementSummary,
  MeasurementType,
} from "@/types/cultivation";

export interface MeasurementFilters {
  roomId?: string;
  bedId?: string;
  plantId?: string;
  motherPlantId?: string;
  batchId?: string;
  measurementType?: MeasurementType;
  status?: MeasurementStatus;
  dateFrom?: string;
  dateTo?: string;
  relatedModule?: MeasurementRelatedModule;
}

export type CreateMeasurementPayload = Omit<CultivationMeasurement, "id" | "status"> & {
  status?: MeasurementStatus;
};

const STATUS_WEIGHT: Record<MeasurementStatus, number> = {
  normal: 0,
  observation: 1,
  alert: 2,
  critical: 3,
};

function queryString(filters: MeasurementFilters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  return params.toString();
}

function classifyPh(value: number | undefined, normalMin: number, normalMax: number, obsMin: number, obsMax: number, alertMin: number, alertMax: number): MeasurementStatus {
  if (value === undefined) return "normal";
  if (value >= normalMin && value <= normalMax) return "normal";
  if (value >= obsMin && value <= obsMax) return "observation";
  if (value >= alertMin && value <= alertMax) return "alert";
  return "critical";
}

function classifyPpm(value: number | undefined, normalMax: number, observationMax: number, alertMax: number): MeasurementStatus {
  if (value === undefined) return "normal";
  if (value >= 300 && value <= normalMax) return "normal";
  if (value <= observationMax) return "observation";
  if (value <= alertMax) return "alert";
  return "critical";
}

export function getLocalMeasurementStatus(measurement: Partial<CultivationMeasurement>): MeasurementStatus {
  const statuses: MeasurementStatus[] = [
    classifyPh(measurement.liquidPH, 5.5, 6.8, 5.2, 7.2, 4.8, 7.6),
    classifyPh(measurement.substratePH, 5.8, 7, 5.5, 7.3, 5, 7.8),
    classifyPpm(measurement.liquidPPM, 1400, 1800, 2200),
    classifyPpm(measurement.substratePPM, 1600, 2000, 2500),
  ];
  return statuses.reduce((worst, status) => (STATUS_WEIGHT[status] > STATUS_WEIGHT[worst] ? status : worst), "normal");
}

function normalizeMeasurement(item: CultivationMeasurement): CultivationMeasurement {
  return {
    ...item,
    date: item.date.slice(0, 10),
    roomId: item.roomId ?? undefined,
    bedId: item.bedId ?? undefined,
    plantId: item.plantId ?? undefined,
    motherPlantId: item.motherPlantId ?? undefined,
    batchId: item.batchId ?? undefined,
    notes: item.notes ?? undefined,
  };
}

function filterMockMeasurements(filters: MeasurementFilters) {
  return cultivationMeasurements
    .filter((item) => {
      if (filters.roomId && item.roomId !== filters.roomId) return false;
      if (filters.bedId && item.bedId !== filters.bedId) return false;
      if (filters.plantId && item.plantId !== filters.plantId) return false;
      if (filters.motherPlantId && item.motherPlantId !== filters.motherPlantId) return false;
      if (filters.batchId && item.batchId !== filters.batchId) return false;
      if (filters.measurementType && item.measurementType !== filters.measurementType) return false;
      if (filters.status && item.status !== filters.status) return false;
      if (filters.relatedModule && item.relatedModule !== filters.relatedModule) return false;
      if (filters.dateFrom && item.date < filters.dateFrom) return false;
      if (filters.dateTo && item.date > filters.dateTo) return false;
      return true;
    })
    .sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`));
}

function average(values: Array<number | undefined>) {
  const cleanValues = values.filter((value): value is number => typeof value === "number");
  if (!cleanValues.length) return null;
  return Number((cleanValues.reduce((total, value) => total + value, 0) / cleanValues.length).toFixed(2));
}

function mockSummary(filters: MeasurementFilters): MeasurementSummary {
  const measurements = filterMockMeasurements(filters);
  return {
    latestMeasurements: measurements.slice(0, 6),
    outOfRangeMeasurements: measurements.filter((item) => item.status === "alert" || item.status === "critical").slice(0, 10),
    averageLiquidPH: average(measurements.map((item) => item.liquidPH)),
    averageSubstratePH: average(measurements.map((item) => item.substratePH)),
    averageLiquidPPM: average(measurements.map((item) => item.liquidPPM)),
    averageSubstratePPM: average(measurements.map((item) => item.substratePPM)),
    alertsCount: measurements.filter((item) => item.status === "alert").length,
    criticalCount: measurements.filter((item) => item.status === "critical").length,
  };
}

export async function getMeasurements(filters: MeasurementFilters = {}): Promise<CultivationMeasurement[]> {
  const qs = queryString(filters);
  return withMockFallback(
    async () => (await apiRequest<CultivationMeasurement[]>(`/cultivation/measurements${qs ? `?${qs}` : ""}`)).map(normalizeMeasurement),
    () => filterMockMeasurements(filters),
  );
}

export async function getMeasurementSummary(filters: MeasurementFilters = {}): Promise<MeasurementSummary> {
  const qs = queryString(filters);
  return withMockFallback(
    async () => apiRequest<MeasurementSummary>(`/cultivation/measurements/summary${qs ? `?${qs}` : ""}`),
    () => mockSummary(filters),
  );
}

export async function createMeasurement(payload: CreateMeasurementPayload): Promise<CultivationMeasurement> {
  return withMockFallback(
    async () =>
      normalizeMeasurement(
        await apiRequest<CultivationMeasurement>("/cultivation/measurements", {
          method: "POST",
          body: JSON.stringify(payload),
        }),
      ),
    () => {
      const measurement: CultivationMeasurement = {
        ...payload,
        id: `measurement-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        status: getLocalMeasurementStatus(payload),
      };
      cultivationMeasurements.unshift(measurement);
      return measurement;
    },
  );
}

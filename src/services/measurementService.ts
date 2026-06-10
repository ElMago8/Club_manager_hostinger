import { cultivationMeasurements } from "@/data/cultivationMockData";
import { apiRequest, withMockFallback } from "@/services/cultivationApi";
import type {
  CultivationMeasurement,
  MeasurementMethod,
  MeasurementRelatedModule,
  MeasurementStatus,
  MeasurementSummary,
  MeasurementType,
} from "@/types/cultivation";

export interface MeasurementFilters {
  roomId?: string;
  bedId?: string;
  clonadorId?: string;
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

interface ApiMedicion {
  id: number;
  fecha: string;
  hora: string;
  tipo: string;
  salaCultivoId: number;
  camillaId: number | null;
  clonadorId?: number | null;
  plantaId: number | null;
  madreId: number | null;
  phLiquido: number | null;
  ppmLiquido: number | null;
  phSustrato: number | null;
  ppmSustrato: number | null;
  phDrenaje: number | null;
  ppmDrenaje: number | null;
  estado: string;
  metodo: string | null;
  responsable: string | null;
  observaciones: string | null;
}

const STATUS_WEIGHT: Record<MeasurementStatus, number> = {
  normal: 0,
  observation: 1,
  alert: 2,
  critical: 3,
};

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

function mapApiMedicion(item: ApiMedicion): CultivationMeasurement {
  const date = new Date(item.fecha).toISOString().slice(0, 10);
  const status = (["normal", "observation", "alert", "critical"].includes(item.estado)
    ? item.estado
    : "normal") as MeasurementStatus;

  const relatedModule: MeasurementRelatedModule =
    item.madreId != null ? "mother"
    : item.plantaId != null ? "plant"
    : item.camillaId != null ? "bed"
    : "general";

  return {
    id: String(item.id),
    measurementType: (item.tipo as MeasurementType) ?? "mixed",
    date,
    time: item.hora,
    roomId: String(item.salaCultivoId),
    bedId: item.camillaId != null ? String(item.camillaId) : undefined,
    clonadorId: item.clonadorId != null ? String(item.clonadorId) : undefined,
    plantId: item.plantaId != null ? String(item.plantaId) : undefined,
    motherPlantId: item.madreId != null ? String(item.madreId) : undefined,
    relatedModule,
    liquidPH: item.phLiquido ?? undefined,
    liquidPPM: item.ppmLiquido ?? undefined,
    substratePH: item.phSustrato ?? undefined,
    substratePPM: item.ppmSustrato ?? undefined,
    runoffPH: item.phDrenaje ?? undefined,
    runoffPPM: item.ppmDrenaje ?? undefined,
    measurementMethod: (item.metodo as MeasurementMethod) ?? undefined,
    responsibleName: item.responsable ?? undefined,
    notes: item.observaciones ?? undefined,
    status,
  };
}

function toApiPayload(payload: CreateMeasurementPayload) {
  const estado = payload.status ?? getLocalMeasurementStatus(payload);
  return {
    fecha: payload.date,
    hora: payload.time,
    tipo: payload.measurementType,
    salaCultivoId: Number(payload.roomId),
    camillaId: payload.bedId ? Number(payload.bedId) : undefined,
    plantaId: payload.plantId ? Number(payload.plantId) : undefined,
    madreId: payload.motherPlantId ? Number(payload.motherPlantId) : undefined,
    phLiquido: payload.liquidPH,
    ppmLiquido: payload.liquidPPM,
    phSustrato: payload.substratePH,
    ppmSustrato: payload.substratePPM,
    phDrenaje: payload.runoffPH,
    ppmDrenaje: payload.runoffPPM,
    estado,
    metodo: payload.measurementMethod,
    responsable: payload.responsibleName,
    observaciones: payload.notes,
  };
}

function buildQueryParams(filters: MeasurementFilters): string {
  const params = new URLSearchParams();
  if (filters.roomId) params.set("salaCultivoId", filters.roomId);
  if (filters.bedId) params.set("camillaId", filters.bedId);
  if (filters.clonadorId) params.set("clonadorId", filters.clonadorId);
  if (filters.plantId) params.set("plantaId", filters.plantId);
  if (filters.motherPlantId) params.set("madreId", filters.motherPlantId);
  if (filters.status) params.set("estado", filters.status);
  if (filters.measurementType) params.set("tipo", filters.measurementType);
  if (filters.dateFrom) params.set("fechaDesde", filters.dateFrom);
  if (filters.dateTo) params.set("fechaHasta", filters.dateTo);
  return params.toString();
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
  const qs = buildQueryParams(filters);
  return withMockFallback(
    async () =>
      (await apiRequest<ApiMedicion[]>(`/cultivation/measurements${qs ? `?${qs}` : ""}`)).map(mapApiMedicion),
    () => filterMockMeasurements(filters),
  );
}

export async function getMeasurementSummary(filters: MeasurementFilters = {}): Promise<MeasurementSummary> {
  return withMockFallback(
    async () => {
      const measurements = (await apiRequest<ApiMedicion[]>("/cultivation/measurements")).map(mapApiMedicion);
      const filtered = filters.roomId
        ? measurements.filter((item) => item.roomId === filters.roomId)
        : measurements;
      return {
        latestMeasurements: filtered.slice(0, 6),
        outOfRangeMeasurements: filtered.filter((item) => item.status === "alert" || item.status === "critical").slice(0, 10),
        averageLiquidPH: average(filtered.map((item) => item.liquidPH)),
        averageSubstratePH: average(filtered.map((item) => item.substratePH)),
        averageLiquidPPM: average(filtered.map((item) => item.liquidPPM)),
        averageSubstratePPM: average(filtered.map((item) => item.substratePPM)),
        alertsCount: filtered.filter((item) => item.status === "alert").length,
        criticalCount: filtered.filter((item) => item.status === "critical").length,
      };
    },
    () => mockSummary(filters),
  );
}

export async function createMeasurement(payload: CreateMeasurementPayload): Promise<CultivationMeasurement> {
  return withMockFallback(
    async () =>
      mapApiMedicion(
        await apiRequest<ApiMedicion>("/cultivation/measurements", {
          method: "POST",
          body: JSON.stringify(toApiPayload(payload)),
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

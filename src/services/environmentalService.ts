import { environmentalLogs } from "@/data/cultivationMockData";
import { apiRequest, withMockFallback } from "@/services/cultivationApi";
import type { EnvironmentalLog } from "@/types/cultivation";
import { calculateVPD, getVPDStatus } from "@/utils/vpdCalculator";

export interface EnvironmentalLogFilters {
  roomId?: string;
  bedId?: string;
  batchId?: string;
  dateFrom?: string;
  dateTo?: string;
  vpdStatus?: EnvironmentalLog["vpdStatus"];
}

type CreateEnvironmentalLogPayload = Omit<
  EnvironmentalLog,
  "id" | "calculatedVPD" | "vpdStatus"
> & {
  id?: string;
  stage?: string;
};

export interface VPDPreviewPayload {
  airTempC: number;
  relativeHumidity: number;
  leafTempC?: number;
  stage?: string;
}

export interface VPDPreview {
  calculatedVPD: number;
  vpdStatus: NonNullable<EnvironmentalLog["vpdStatus"]>;
}

type ApiVPDStatus = "low" | "optimal" | "high" | "critical";

interface ApiEnvironmentalLog {
  id: string;
  bedId?: string | null;
  batchId?: string | null;
  date: string;
  time: string;
  airTempC: number;
  relativeHumidity: number;
  leafTempC?: number | null;
  co2ppm?: number | null;
  calculatedVPD?: number | null;
  vpdStatus?: ApiVPDStatus | null;
  notes?: string | null;
  bed?: {
    roomId?: string | null;
  } | null;
}

interface ApiVPDPreview {
  calculatedVPD: number;
  vpdStatus: ApiVPDStatus;
}

const API_TO_UI_VPD_STATUS: Record<ApiVPDStatus, NonNullable<EnvironmentalLog["vpdStatus"]>> = {
  low: "bajo",
  optimal: "optimo",
  high: "alto",
  critical: "critico",
};

const UI_TO_API_VPD_STATUS: Record<NonNullable<EnvironmentalLog["vpdStatus"]>, ApiVPDStatus> = {
  bajo: "low",
  optimo: "optimal",
  alto: "high",
  critico: "critical",
};

function createMockId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function buildVPDResult(payload: VPDPreviewPayload): VPDPreview {
  const calculatedVPD = calculateVPD({
    airTempC: payload.airTempC,
    relativeHumidity: payload.relativeHumidity,
    leafTempC: payload.leafTempC,
    defaultLeafOffset: -2.8,
  });

  return {
    calculatedVPD,
    vpdStatus: getVPDStatus(calculatedVPD, payload.stage),
  };
}

function dateOnly(value: string): string {
  return value.slice(0, 10);
}

function mapApiEnvironmentalLog(log: ApiEnvironmentalLog): EnvironmentalLog {
  return {
    id: log.id,
    roomId: log.bed?.roomId ?? "room-sin-asignar",
    bedId: log.bedId ?? undefined,
    batchId: log.batchId ?? undefined,
    date: dateOnly(log.date),
    time: log.time,
    airTempC: log.airTempC,
    relativeHumidity: log.relativeHumidity,
    leafTempC: log.leafTempC ?? undefined,
    co2ppm: log.co2ppm ?? undefined,
    calculatedVPD: log.calculatedVPD ?? undefined,
    vpdStatus: log.vpdStatus ? API_TO_UI_VPD_STATUS[log.vpdStatus] : undefined,
    recordedByUserId: "backend",
    notes: log.notes ?? undefined,
  };
}

function toApiEnvironmentalFilters(filters: EnvironmentalLogFilters): Record<string, string> {
  return Object.fromEntries(
    Object.entries({
      bedId: filters.bedId,
      batchId: filters.batchId,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      vpdStatus: filters.vpdStatus ? UI_TO_API_VPD_STATUS[filters.vpdStatus] : undefined,
    }).filter(([, value]) => value),
  ) as Record<string, string>;
}

export async function getEnvironmentalLogs(
  filters: EnvironmentalLogFilters = {},
): Promise<EnvironmentalLog[]> {
  return withMockFallback(
    async () => {
      const query = new URLSearchParams(toApiEnvironmentalFilters(filters));
      const logs = await apiRequest<ApiEnvironmentalLog[]>(
        `/cultivation/environmental-logs${query.size ? `?${query.toString()}` : ""}`,
      );
      return logs.map(mapApiEnvironmentalLog).filter((log) => !filters.roomId || log.roomId === filters.roomId);
    },
    () => environmentalLogs.filter((log) => {
    if (filters.roomId && log.roomId !== filters.roomId) return false;
    if (filters.bedId && log.bedId !== filters.bedId) return false;
    if (filters.batchId && log.batchId !== filters.batchId) return false;
    if (filters.dateFrom && log.date < filters.dateFrom) return false;
    if (filters.dateTo && log.date > filters.dateTo) return false;
    if (filters.vpdStatus && log.vpdStatus !== filters.vpdStatus) return false;
    return true;
    }),
  );
}

export async function createEnvironmentalLog(
  payload: CreateEnvironmentalLogPayload,
): Promise<EnvironmentalLog> {
  return withMockFallback(
    async () =>
      mapApiEnvironmentalLog(
        await apiRequest<ApiEnvironmentalLog>("/cultivation/environmental-logs", {
          method: "POST",
          body: JSON.stringify({
            bedId: payload.bedId,
            batchId: payload.batchId,
            date: payload.date,
            time: payload.time,
            airTempC: payload.airTempC,
            relativeHumidity: payload.relativeHumidity,
            leafTempC: payload.leafTempC,
            co2ppm: payload.co2ppm,
            stage: payload.stage,
            notes: payload.notes,
          }),
        }),
      ),
    () => {
      const { stage, ...logPayload } = payload;
      const { calculatedVPD, vpdStatus } = buildVPDResult({
        airTempC: logPayload.airTempC,
        relativeHumidity: logPayload.relativeHumidity,
        leafTempC: logPayload.leafTempC,
        stage,
      });

      const newLog: EnvironmentalLog = {
        ...logPayload,
        id: logPayload.id ?? createMockId("env-log"),
        calculatedVPD,
        vpdStatus,
      };

      environmentalLogs.push(newLog);
      return newLog;
    },
  );
}

export async function calculateVPDPreview(payload: VPDPreviewPayload): Promise<VPDPreview> {
  return withMockFallback(
    async () => {
      const preview = await apiRequest<ApiVPDPreview>("/cultivation/vpd/preview", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      return {
        calculatedVPD: preview.calculatedVPD,
        vpdStatus: API_TO_UI_VPD_STATUS[preview.vpdStatus],
      };
    },
    () => buildVPDResult(payload),
  );
}

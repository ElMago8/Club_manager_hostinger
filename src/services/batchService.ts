import { batches } from "@/data/cultivationMockData";
import { apiRequest, withMockFallback } from "@/services/cultivationApi";
import type { Batch } from "@/types/cultivation";

interface ApiBatch {
  id: string | number;
  code?: string;
  codigoLote?: string;
  geneticsId?: string;
  geneticaId?: number | null;
  roomId?: string;
  salaCultivoId?: number | null;
  status?: string;
  estado?: string;
  startDate?: string;
  fechaInicio?: string;
  floweringStartDate?: string | null;
  fechaInicioFloracion?: string | null;
  estimatedHarvestDate?: string | null;
  fechaEstimadaCosecha?: string | null;
  realHarvestDate?: string | null;
  fechaCosechaReal?: string | null;
  notes?: string | null;
  observaciones?: string | null;
  genetica?: { nombre: string } | null;
  salaCultivo?: { nombre: string } | null;
}

export interface CreateBatchPayload {
  code: string;
  geneticsId: string;
  roomId: string;
  status: string;
  startDate: string;
  floweringStartDate?: string;
  estimatedHarvestDate?: string;
  realHarvestDate?: string;
  notes?: string;
}

function emptyToUndefined(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function toApiBatchPayload(payload: CreateBatchPayload) {
  return {
    codigoLote: payload.code.trim(),
    geneticaId: Number(payload.geneticsId),
    salaCultivoId: Number(payload.roomId),
    estado: payload.status,
    fechaInicio: payload.startDate,
    fechaInicioFloracion: emptyToUndefined(payload.floweringStartDate),
    fechaEstimadaCosecha: emptyToUndefined(payload.estimatedHarvestDate),
    fechaCosechaReal: emptyToUndefined(payload.realHarvestDate),
    observaciones: emptyToUndefined(payload.notes),
  };
}

function mapApiBatch(item: ApiBatch): Batch {
  return {
    id: String(item.id),
    code: item.codigoLote ?? item.code ?? "",
    geneticsId: item.geneticaId ? String(item.geneticaId) : (item.geneticsId ?? ""),
    geneticsName: item.genetica?.nombre,
    roomId: item.salaCultivoId ? String(item.salaCultivoId) : (item.roomId ?? ""),
    roomName: item.salaCultivo?.nombre,
    status: item.estado ?? item.status ?? "activo",
    startDate: (item.fechaInicio ?? item.startDate ?? "").slice(0, 10),
    floweringStartDate: (item.fechaInicioFloracion ?? item.floweringStartDate ?? undefined)?.slice(0, 10),
    estimatedHarvestDate: (item.fechaEstimadaCosecha ?? item.estimatedHarvestDate ?? undefined)?.slice(0, 10),
    realHarvestDate: (item.fechaCosechaReal ?? item.realHarvestDate ?? undefined)?.slice(0, 10),
    notes: item.observaciones ?? item.notes ?? undefined,
  };
}

export async function getBatches(): Promise<Batch[]> {
  return withMockFallback(
    async () => (await apiRequest<ApiBatch[]>("/cultivation/batches")).map(mapApiBatch),
    () => batches,
  );
}

export async function getBatchById(id: string): Promise<Batch | null> {
  if (!/^\d+$/.test(id)) {
    return batches.find((b) => b.id === id) ?? null;
  }
  return withMockFallback(
    async () => mapApiBatch(await apiRequest<ApiBatch>(`/cultivation/batches/${id}`)),
    () => batches.find((b) => b.id === id) ?? null,
  );
}

export async function createBatch(payload: CreateBatchPayload): Promise<Batch> {
  return mapApiBatch(
    await apiRequest<ApiBatch>("/cultivation/batches", {
      method: "POST",
      body: JSON.stringify(toApiBatchPayload(payload)),
    }),
  );
}

export async function updateBatch(id: string, payload: CreateBatchPayload): Promise<Batch> {
  return mapApiBatch(
    await apiRequest<ApiBatch>(`/cultivation/batches/${id}`, {
      method: "PUT",
      body: JSON.stringify(toApiBatchPayload(payload)),
    }),
  );
}

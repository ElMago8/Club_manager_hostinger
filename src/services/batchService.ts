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
  estimatedHarvestDate?: string | null;
  fechaCosechaEstimada?: string | null;
  notes?: string | null;
  observaciones?: string | null;
  genetica?: { nombre: string } | null;
  salaCultivo?: { nombre: string } | null;
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
    estimatedHarvestDate: (item.fechaCosechaEstimada ?? item.estimatedHarvestDate ?? undefined)?.slice(0, 10),
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

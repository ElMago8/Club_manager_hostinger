import { harvests } from "@/data/cultivationMockData";
import { apiRequest, withMockFallback } from "@/services/cultivationApi";
import type { Harvest, HarvestStatus } from "@/types/cultivation";

type CreateHarvestPayload = Omit<Harvest, "id"> & { id?: string };
type UpdateHarvestPayload = Partial<Omit<Harvest, "id">>;

interface ApiHarvest {
  id: string | number;
  code?: string;
  codigoCosecha?: string;
  batchId?: string;
  loteCultivoId?: number | null;
  salaCultivoId?: number | null;
  status?: HarvestStatus;
  estado?: HarvestStatus;
  harvestDate?: string;
  fechaCosecha?: string;
  wetWeightGrams?: number | null;
  pesoHumedoGramos?: number | null;
  dryWeightGrams?: number | null;
  pesoSecoGramos?: number | null;
  shrinkageGrams?: number | null;
  pesoMermaGramos?: number | null;
  secadoInicioEn?: string | null;
  curadoInicioEn?: string | null;
  notes?: string | null;
  observaciones?: string | null;
  salaCultivo?: { nombre: string; entornoCultivo?: string | null; tipoCultivo?: string | null } | null;
  loteCultivo?: {
    codigoLote?: string;
    genetica?: { nombre: string } | null;
    salaCultivo?: { nombre: string; entornoCultivo?: string | null; tipoCultivo?: string | null } | null;
  } | null;
}

function mapApiHarvest(item: ApiHarvest): Harvest {
  return {
    id: String(item.id),
    code: item.codigoCosecha ?? item.code ?? "",
    batchId: item.loteCultivoId ? String(item.loteCultivoId) : (item.batchId ?? ""),
    batchCode: item.loteCultivo?.codigoLote,
    geneticsName: item.loteCultivo?.genetica?.nombre,
    roomId: item.salaCultivoId ? String(item.salaCultivoId) : undefined,
    roomName: item.salaCultivo?.nombre ?? item.loteCultivo?.salaCultivo?.nombre,
    harvestDate: (item.fechaCosecha ?? item.harvestDate ?? "").slice(0, 10),
    wetWeightGrams: item.pesoHumedoGramos ?? item.wetWeightGrams ?? undefined,
    dryWeightGrams: item.pesoSecoGramos ?? item.dryWeightGrams ?? undefined,
    shrinkageGrams: item.pesoMermaGramos ?? item.shrinkageGrams ?? undefined,
    cultivationType: item.salaCultivo?.entornoCultivo ?? item.loteCultivo?.salaCultivo?.entornoCultivo ?? undefined,
    growMedium: item.salaCultivo?.tipoCultivo ?? item.loteCultivo?.salaCultivo?.tipoCultivo ?? undefined,
    status: item.estado ?? item.status ?? "registrada",
    secadoInicioEn: item.secadoInicioEn ?? undefined,
    curadoInicioEn: item.curadoInicioEn ?? undefined,
    notes: item.observaciones ?? item.notes ?? undefined,
  };
}

function toApiPayload(payload: CreateHarvestPayload | UpdateHarvestPayload) {
  return {
    codigoCosecha: payload.code,
    loteCultivoId: payload.batchId ? Number(payload.batchId) : undefined,
    salaCultivoId: payload.roomId ? Number(payload.roomId) : null,
    estado: payload.status,
    fechaCosecha: payload.harvestDate,
    pesoHumedoGramos: payload.wetWeightGrams ?? null,
    pesoSecoGramos: payload.dryWeightGrams ?? null,
    pesoMermaGramos: payload.shrinkageGrams ?? null,
    secadoInicioEn: payload.secadoInicioEn ?? undefined,
    curadoInicioEn: payload.curadoInicioEn ?? undefined,
    observaciones: payload.notes?.trim() || null,
  };
}

function createMockId(): string {
  return `harvest-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function getHarvests(): Promise<Harvest[]> {
  return withMockFallback(
    async () => (await apiRequest<ApiHarvest[]>("/cultivation/harvests")).map(mapApiHarvest),
    () => harvests,
  );
}

export async function getHarvestById(id: string): Promise<Harvest | null> {
  if (!/^\d+$/.test(id)) {
    return harvests.find((h) => h.id === id) ?? null;
  }
  return withMockFallback(
    async () => mapApiHarvest(await apiRequest<ApiHarvest>(`/cultivation/harvests/${id}`)),
    () => harvests.find((h) => h.id === id) ?? null,
  );
}

export async function createHarvest(payload: CreateHarvestPayload): Promise<Harvest> {
  return withMockFallback(
    async () =>
      mapApiHarvest(
        await apiRequest<ApiHarvest>("/cultivation/harvests", {
          method: "POST",
          body: JSON.stringify(toApiPayload(payload)),
        }),
      ),
    () => {
      const newHarvest: Harvest = { ...payload, id: payload.id ?? createMockId() };
      harvests.push(newHarvest);
      return newHarvest;
    },
  );
}

export async function updateHarvest(id: string, payload: UpdateHarvestPayload): Promise<Harvest> {
  return withMockFallback(
    async () =>
      mapApiHarvest(
        await apiRequest<ApiHarvest>(`/cultivation/harvests/${id}`, {
          method: "PUT",
          body: JSON.stringify(toApiPayload(payload)),
        }),
      ),
    () => {
      const idx = harvests.findIndex((h) => h.id === id);
      if (idx === -1) throw new Error("Cosecha no encontrada.");
      Object.assign(harvests[idx], payload);
      return harvests[idx];
    },
  );
}

export async function deleteHarvest(id: string): Promise<void> {
  return withMockFallback(
    async () => {
      await apiRequest<unknown>(`/cultivation/harvests/${id}`, { method: "DELETE" });
    },
    () => {
      const idx = harvests.findIndex((h) => h.id === id);
      if (idx === -1) throw new Error("Cosecha no encontrada.");
      harvests.splice(idx, 1);
    },
  );
}

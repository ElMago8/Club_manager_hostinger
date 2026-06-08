import { motherPlants, plants } from "@/data/cultivationMockData";
import { apiRequest, withMockFallback } from "@/services/cultivationApi";
import type { MotherPlant } from "@/types/cultivation";

type CreateMotherPlantPayload = Omit<MotherPlant, "id"> & { id?: string };
type UpdateMotherPlantPayload = Partial<Omit<MotherPlant, "id">>;
type ApiMotherStatus = "active" | "observation" | "discarded" | "archived" | MotherPlant["status"];

interface ApiMotherPlant {
  id: string | number;
  code?: string;
  codigoMadre?: string;
  name?: string | null;
  nombreMadre?: string | null;
  geneticsId?: string;
  geneticaId?: number;
  roomId?: string | null;
  salaCultivoId?: number | null;
  bedId?: string | null;
  camillaId?: number | null;
  status: ApiMotherStatus;
  estado?: ApiMotherStatus;
  sanitaryStatus?: MotherPlant["sanitaryStatus"] | null;
  estadoSanitario?: MotherPlant["sanitaryStatus"] | null;
  startDate?: string;
  fechaInicio?: string;
  lastCutDate?: string | null;
  fechaUltimoCorte?: string | null;
  availableClones?: number | null;
  cantidadEsquejesDisponibles?: number | null;
  origin?: string | null;
  origen?: string | null;
  notes?: string | null;
  observaciones?: string | null;
  genetics?: {
    name: string;
    nombre?: string;
  } | null;
  genetica?: {
    nombre: string;
  } | null;
  _count?: {
    plants?: number;
    plantas?: number;
  };
}

export interface MotherPlantWithPlantCount extends MotherPlant {
  derivedPlantsCount: number;
}

const API_TO_UI_STATUS: Record<ApiMotherStatus, MotherPlant["status"]> = {
  active: "activa",
  observation: "observacion",
  discarded: "descartada",
  archived: "archivada",
  activa: "activa",
  observacion: "observacion",
  descartada: "descartada",
  archivada: "archivada",
};

const UI_TO_API_STATUS: Record<MotherPlant["status"], ApiMotherStatus> = {
  activa: "active",
  observacion: "observation",
  descartada: "discarded",
  archivada: "archived",
};

function createMockId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function countPlantsFromMotherPlant(motherPlantId: string): number {
  return plants.filter((plant) => plant.motherPlantId === motherPlantId).length;
}

function withPlantCount(motherPlant: MotherPlant): MotherPlantWithPlantCount {
  return {
    ...motherPlant,
    derivedPlantsCount: countPlantsFromMotherPlant(motherPlant.id),
  };
}

function dateOnly(value: string): string {
  return value.slice(0, 10);
}

function mapApiMotherPlant(motherPlant: ApiMotherPlant): MotherPlantWithPlantCount {
  const status = motherPlant.estado ?? motherPlant.status;

  return {
    id: String(motherPlant.id),
    code: motherPlant.codigoMadre ?? motherPlant.code ?? "",
    name: motherPlant.nombreMadre ?? motherPlant.name ?? undefined,
    geneticsId: motherPlant.geneticsId ?? (motherPlant.geneticaId ? String(motherPlant.geneticaId) : ""),
    geneticsName: motherPlant.genetica?.nombre ?? motherPlant.genetics?.nombre ?? motherPlant.genetics?.name ?? "Genetica pendiente",
    roomId: motherPlant.roomId ?? (motherPlant.salaCultivoId ? String(motherPlant.salaCultivoId) : undefined),
    bedId: motherPlant.bedId ?? (motherPlant.camillaId ? String(motherPlant.camillaId) : undefined),
    status: API_TO_UI_STATUS[status],
    sanitaryStatus: motherPlant.estadoSanitario ?? motherPlant.sanitaryStatus ?? "bueno",
    startDate: dateOnly(motherPlant.fechaInicio ?? motherPlant.startDate ?? ""),
    lastCutDate: motherPlant.fechaUltimoCorte || motherPlant.lastCutDate ? dateOnly(motherPlant.fechaUltimoCorte ?? motherPlant.lastCutDate ?? "") : undefined,
    availableClones: motherPlant.cantidadEsquejesDisponibles ?? motherPlant.availableClones ?? 0,
    origin: motherPlant.origen ?? motherPlant.origin ?? undefined,
    notes: motherPlant.observaciones ?? motherPlant.notes ?? undefined,
    derivedPlantsCount: motherPlant._count?.plants ?? motherPlant._count?.plantas ?? 0,
  };
}

function optionalString(value: string | undefined): string | null | undefined {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function toApiMotherPlantPayload(payload: CreateMotherPlantPayload | UpdateMotherPlantPayload) {
  return {
    codigoMadre: payload.code,
    nombreMadre: optionalString(payload.name),
    geneticaId: payload.geneticsId ? Number(payload.geneticsId) : undefined,
    salaCultivoId: payload.roomId ? Number(payload.roomId) : undefined,
    camillaId: payload.bedId ? Number(payload.bedId) : undefined,
    estado: payload.status,
    estadoSanitario: payload.sanitaryStatus,
    fechaInicio: payload.startDate,
    fechaUltimoCorte: payload.lastCutDate || undefined,
    cantidadEsquejesDisponibles: payload.availableClones,
    origen: optionalString(payload.origin),
    observaciones: optionalString(payload.notes),
  };
}

export async function getMotherPlants(): Promise<MotherPlantWithPlantCount[]> {
  return withMockFallback(
    async () => (await apiRequest<ApiMotherPlant[]>("/cultivation/mothers")).map(mapApiMotherPlant),
    () => motherPlants.map(withPlantCount),
  );
}

export async function getMotherPlantById(id: string): Promise<MotherPlantWithPlantCount | null> {
  return withMockFallback(
    async () => mapApiMotherPlant(await apiRequest<ApiMotherPlant>(`/cultivation/mothers/${id}`)),
    () => {
      const motherPlant = motherPlants.find((item) => item.id === id);
      return motherPlant ? withPlantCount(motherPlant) : null;
    },
  );
}

export async function getMotherPlantsByGenetics(geneticsId: string): Promise<MotherPlantWithPlantCount[]> {
  return (await getMotherPlants()).filter((motherPlant) => motherPlant.geneticsId === geneticsId);
}

export async function createMotherPlant(payload: CreateMotherPlantPayload): Promise<MotherPlantWithPlantCount> {
  return withMockFallback(
    async () =>
      mapApiMotherPlant(
        await apiRequest<ApiMotherPlant>("/cultivation/mothers", {
          method: "POST",
          body: JSON.stringify(toApiMotherPlantPayload(payload)),
        }),
      ),
    () => {
      const newMotherPlant: MotherPlant = {
        ...payload,
        id: payload.id ?? createMockId("mother"),
      };

      motherPlants.push(newMotherPlant);
      return withPlantCount(newMotherPlant);
    },
  );
}

export async function updateMotherPlant(
  id: string,
  payload: UpdateMotherPlantPayload,
): Promise<MotherPlantWithPlantCount> {
  const motherPlant = motherPlants.find((item) => item.id === id);

  return withMockFallback(
    async () =>
      mapApiMotherPlant(
        await apiRequest<ApiMotherPlant>(`/cultivation/mothers/${id}`, {
          method: "PUT",
          body: JSON.stringify(toApiMotherPlantPayload(payload)),
        }),
      ),
    () => {
      if (!motherPlant) {
        throw new Error("Planta madre no encontrada.");
      }

      Object.assign(motherPlant, payload);
      return withPlantCount(motherPlant);
    },
  );
}

export async function deleteMotherPlant(id: string): Promise<void> {
  return withMockFallback(
    async () => {
      await apiRequest<unknown>(`/cultivation/mothers/${id}`, { method: "DELETE" });
    },
    () => {
      const index = motherPlants.findIndex((item) => item.id === id);
      if (index === -1) {
        throw new Error("Planta madre no encontrada.");
      }

      motherPlants.splice(index, 1);
    },
  );
}

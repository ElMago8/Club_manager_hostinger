import { motherPlants, plants } from "@/data/cultivationMockData";
import { apiRequest, withMockFallback } from "@/services/cultivationApi";
import type { MotherPlant } from "@/types/cultivation";

type CreateMotherPlantPayload = Omit<MotherPlant, "id"> & { id?: string };
type UpdateMotherPlantPayload = Partial<Omit<MotherPlant, "id">>;
type ApiMotherStatus = "active" | "observation" | "discarded" | "archived";

interface ApiMotherPlant {
  id: string;
  code: string;
  geneticsId: string;
  roomId?: string | null;
  status: ApiMotherStatus;
  startDate: string;
  notes?: string | null;
  genetics?: {
    name: string;
  } | null;
  _count?: {
    plants?: number;
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
  return {
    id: motherPlant.id,
    code: motherPlant.code,
    geneticsId: motherPlant.geneticsId,
    geneticsName: motherPlant.genetics?.name ?? "Genetica pendiente",
    roomId: motherPlant.roomId ?? undefined,
    status: API_TO_UI_STATUS[motherPlant.status],
    startDate: dateOnly(motherPlant.startDate),
    notes: motherPlant.notes ?? undefined,
    derivedPlantsCount: motherPlant._count?.plants ?? 0,
  };
}

function toApiMotherPlantPayload(payload: CreateMotherPlantPayload | UpdateMotherPlantPayload) {
  return {
    code: payload.code,
    geneticsId: payload.geneticsId,
    roomId: payload.roomId,
    status: payload.status ? UI_TO_API_STATUS[payload.status] : undefined,
    startDate: payload.startDate,
    notes: payload.notes,
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

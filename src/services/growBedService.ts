import { growBeds } from "@/data/cultivationMockData";
import { apiRequest, withMockFallback } from "@/services/cultivationApi";
import type { GrowBed } from "@/types/cultivation";

type CreateGrowBedPayload = Omit<GrowBed, "id" | "currentPlants"> & {
  id?: string;
  currentPlants?: number;
};

type UpdateGrowBedPayload = Partial<Omit<GrowBed, "id">>;
export interface GrowBedOccupancy {
  bedId: string;
  maxPlants: number;
  occupied: number;
  available: number;
  occupancyPercentage: number;
}

type ApiBedStatus = "empty" | "active" | "cleaning" | "maintenance" | "out_of_use";

interface ApiGrowBed {
  id: string;
  name: string;
  code: string;
  roomId?: string | null;
  status: ApiBedStatus;
  maxPlants: number;
  notes?: string | null;
  _count?: {
    plants?: number;
  };
}

const API_TO_UI_STATUS: Record<ApiBedStatus, GrowBed["status"]> = {
  empty: "vacia",
  active: "activa",
  cleaning: "limpieza",
  maintenance: "mantenimiento",
  out_of_use: "fuera_de_uso",
};

const UI_TO_API_STATUS: Record<GrowBed["status"], ApiBedStatus> = {
  vacia: "empty",
  activa: "active",
  limpieza: "cleaning",
  mantenimiento: "maintenance",
  fuera_de_uso: "out_of_use",
};

function createMockId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function validateMaxPlants(maxPlants: number, currentPlants = 0): void {
  if (maxPlants < 0) {
    throw new Error("La capacidad maxima no puede ser menor a 0.");
  }

  if (maxPlants > 100) {
    throw new Error("La capacidad maxima no puede ser mayor a 100 plantas.");
  }

  if (maxPlants < currentPlants) {
    throw new Error("La capacidad maxima no puede quedar por debajo de las plantas actuales.");
  }
}

function mapApiGrowBed(bed: ApiGrowBed): GrowBed {
  return {
    id: bed.id,
    name: bed.name,
    code: bed.code,
    roomId: bed.roomId ?? "room-sin-asignar",
    status: API_TO_UI_STATUS[bed.status],
    maxPlants: bed.maxPlants,
    currentPlants: bed._count?.plants ?? 0,
    notes: bed.notes ?? undefined,
  };
}

function toApiGrowBedPayload(payload: CreateGrowBedPayload | UpdateGrowBedPayload) {
  return {
    name: payload.name,
    code: payload.code,
    roomId: payload.roomId,
    status: payload.status ? UI_TO_API_STATUS[payload.status] : undefined,
    maxPlants: payload.maxPlants,
    notes: payload.notes,
  };
}

export async function getGrowBeds(): Promise<GrowBed[]> {
  return withMockFallback(
    async () => (await apiRequest<ApiGrowBed[]>("/cultivation/beds")).map(mapApiGrowBed),
    () => growBeds,
  );
}

export async function getGrowBedsByRoom(roomId: string): Promise<GrowBed[]> {
  return withMockFallback(
    async () => (await getGrowBeds()).filter((bed) => bed.roomId === roomId),
    () => growBeds.filter((bed) => bed.roomId === roomId),
  );
}

export async function getGrowBedById(id: string): Promise<GrowBed | null> {
  return withMockFallback(
    async () => mapApiGrowBed(await apiRequest<ApiGrowBed>(`/cultivation/beds/${id}`)),
    () => growBeds.find((bed) => bed.id === id) ?? null,
  );
}

export async function createGrowBed(payload: CreateGrowBedPayload): Promise<GrowBed> {
  const currentPlants = payload.currentPlants ?? 0;
  validateMaxPlants(payload.maxPlants, currentPlants);

  return withMockFallback(
    async () =>
      mapApiGrowBed(
        await apiRequest<ApiGrowBed>("/cultivation/beds", {
          method: "POST",
          body: JSON.stringify(toApiGrowBedPayload(payload)),
        }),
      ),
    () => {
      const newBed: GrowBed = {
        ...payload,
        id: payload.id ?? createMockId("bed"),
        currentPlants,
      };

      growBeds.push(newBed);
      return newBed;
    },
  );
}

export async function updateGrowBed(id: string, payload: UpdateGrowBedPayload): Promise<GrowBed> {
  const bed = growBeds.find((item) => item.id === id);

  if (!bed) {
    throw new Error("Camilla de cultivo no encontrada.");
  }

  const nextMaxPlants = payload.maxPlants ?? bed.maxPlants;
  const nextCurrentPlants = payload.currentPlants ?? bed.currentPlants;
  validateMaxPlants(nextMaxPlants, nextCurrentPlants);

  return withMockFallback(
    async () =>
      mapApiGrowBed(
        await apiRequest<ApiGrowBed>(`/cultivation/beds/${id}`, {
          method: "PUT",
          body: JSON.stringify(toApiGrowBedPayload(payload)),
        }),
      ),
    () => {
      Object.assign(bed, payload);
      return bed;
    },
  );
}

export async function getGrowBedOccupancy(id: string): Promise<GrowBedOccupancy> {
  return withMockFallback(
    async () => apiRequest<GrowBedOccupancy>(`/cultivation/beds/${id}/occupancy`),
    () => {
      const bed = growBeds.find((item) => item.id === id);
      if (!bed) throw new Error("Camilla de cultivo no encontrada.");
      const occupied = bed.currentPlants;
      const available = Math.max(bed.maxPlants - occupied, 0);
      return {
        bedId: id,
        maxPlants: bed.maxPlants,
        occupied,
        available,
        occupancyPercentage: bed.maxPlants > 0 ? Number(((occupied / bed.maxPlants) * 100).toFixed(1)) : 0,
      };
    },
  );
}

export async function updateGrowBedCapacity(id: string, maxPlants: number): Promise<GrowBed> {
  return withMockFallback(
    async () =>
      mapApiGrowBed(
        await apiRequest<ApiGrowBed>(`/cultivation/beds/${id}/capacity`, {
          method: "PATCH",
          body: JSON.stringify({ maxPlants }),
        }),
      ),
    () => updateGrowBed(id, { maxPlants }),
  );
}

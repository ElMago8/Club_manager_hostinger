import { growBeds, plants } from "@/data/cultivationMockData";
import { apiRequest, withMockFallback } from "@/services/cultivationApi";
import type { Plant, PlantStage, PlantStatus } from "@/types/cultivation";

export interface PlantFilters {
  roomId?: string;
  bedId?: string;
  geneticsId?: string;
  batchId?: string;
  motherPlantId?: string;
  stage?: PlantStage;
  status?: PlantStatus;
}

type CreatePlantPayload = Omit<Plant, "id"> & { id?: string };
type UpdatePlantPayload = Partial<Omit<Plant, "id">>;

type ApiPlantOrigin = "seed" | "clone" | "internal_mother" | "external_purchase" | "other";
type ApiPlantStage = "clone" | "vegetative" | "flowering" | "harvest" | "drying" | "curing" | "released" | "discarded";
type ApiPlantStatus = "normal" | "observation" | "alert" | "discarded" | "harvested";

interface ApiPlant {
  id: string;
  internalCode: string;
  bedId: string;
  bedPosition: number;
  batchId?: string | null;
  geneticsId?: string | null;
  motherPlantId?: string | null;
  origin: ApiPlantOrigin;
  stage: ApiPlantStage;
  status: ApiPlantStatus;
  startDate: string;
  stageStartDate?: string | null;
  potCode?: string | null;
  potSizeLiters?: number | null;
  potType?: string | null;
  substrate?: string | null;
  notes?: string | null;
  bed?: {
    roomId?: string | null;
  } | null;
  genetics?: {
    name: string;
  } | null;
  motherPlant?: {
    code: string;
  } | null;
}

export interface BulkCreatePlantsForBedPayload {
  bedId: string;
  count: number;
  plant: Omit<CreatePlantPayload, "bedId" | "bedPosition" | "internalCode"> & {
    internalCodePrefix?: string;
  };
}

const API_TO_UI_ORIGIN: Record<ApiPlantOrigin, Plant["origin"]> = {
  seed: "semilla",
  clone: "esqueje",
  internal_mother: "madre_interna",
  external_purchase: "compra_externa",
  other: "otro",
};

const UI_TO_API_ORIGIN: Record<Plant["origin"], ApiPlantOrigin> = {
  semilla: "seed",
  esqueje: "clone",
  madre_interna: "internal_mother",
  compra_externa: "external_purchase",
  otro: "other",
};

const API_TO_UI_STAGE: Record<ApiPlantStage, PlantStage> = {
  clone: "esqueje",
  vegetative: "vegetativo",
  flowering: "floracion",
  harvest: "cosecha",
  drying: "secado",
  curing: "curado",
  released: "liberado",
  discarded: "descartado",
};

const UI_TO_API_STAGE: Record<PlantStage, ApiPlantStage> = {
  esqueje: "clone",
  vegetativo: "vegetative",
  floracion: "flowering",
  cosecha: "harvest",
  secado: "drying",
  curado: "curing",
  liberado: "released",
  descartado: "discarded",
};

const API_TO_UI_STATUS: Record<ApiPlantStatus, PlantStatus> = {
  normal: "normal",
  observation: "observacion",
  alert: "alerta",
  discarded: "descartada",
  harvested: "cosechada",
};

const UI_TO_API_STATUS: Record<PlantStatus, ApiPlantStatus> = {
  normal: "normal",
  observacion: "observation",
  alerta: "alert",
  descartada: "discarded",
  cosechada: "harvested",
};

function createMockId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getBedOrThrow(bedId: string) {
  const bed = growBeds.find((item) => item.id === bedId);

  if (!bed) {
    throw new Error("Camilla de cultivo no encontrada.");
  }

  return bed;
}

function getActivePlantsByBed(bedId: string): Plant[] {
  return plants.filter((plant) => plant.bedId === bedId && plant.status !== "descartada");
}

function syncBedCurrentPlants(bedId: string): void {
  const bed = growBeds.find((item) => item.id === bedId);

  if (bed) {
    bed.currentPlants = getActivePlantsByBed(bedId).length;
  }
}

function validateBedCapacity(bedId: string, addedPlants = 1, ignoredPlantId?: string): void {
  const bed = getBedOrThrow(bedId);
  const activePlants = getActivePlantsByBed(bedId).filter((plant) => plant.id !== ignoredPlantId);
  const capacity = Math.min(bed.maxPlants, 100);

  if (bed.maxPlants > 100) {
    throw new Error("La camilla no puede superar las 100 plantas de capacidad.");
  }

  if (activePlants.length + addedPlants > capacity) {
    throw new Error("No hay capacidad disponible en la camilla seleccionada.");
  }
}

function validateUniqueBedPosition(bedId: string, bedPosition: number, ignoredPlantId?: string): void {
  const duplicatedPosition = plants.some(
    (plant) =>
      plant.bedId === bedId &&
      plant.bedPosition === bedPosition &&
      plant.id !== ignoredPlantId &&
      plant.status !== "descartada",
  );

  if (duplicatedPosition) {
    throw new Error("Ya existe una planta en esa posicion de la camilla.");
  }
}

function getFreePositionsForBed(bedId: string): number[] {
  const bed = getBedOrThrow(bedId);
  const occupiedPositions = new Set(
    getActivePlantsByBed(bedId).map((plant) => plant.bedPosition),
  );

  return Array.from({ length: Math.min(bed.maxPlants, 100) }, (_, index) => index + 1).filter(
    (position) => !occupiedPositions.has(position),
  );
}

function dateOnly(value?: string | null): string | undefined {
  return value ? value.slice(0, 10) : undefined;
}

function mapApiPlant(plant: ApiPlant): Plant {
  return {
    id: plant.id,
    internalCode: plant.internalCode,
    roomId: plant.bed?.roomId ?? "room-sin-asignar",
    bedId: plant.bedId,
    bedPosition: plant.bedPosition,
    batchId: plant.batchId ?? undefined,
    geneticsId: plant.geneticsId ?? undefined,
    geneticsName: plant.genetics?.name,
    motherPlantId: plant.motherPlantId ?? undefined,
    motherPlantCode: plant.motherPlant?.code,
    origin: API_TO_UI_ORIGIN[plant.origin],
    stage: API_TO_UI_STAGE[plant.stage],
    status: API_TO_UI_STATUS[plant.status],
    startDate: dateOnly(plant.startDate) ?? "",
    stageStartDate: dateOnly(plant.stageStartDate),
    potCode: plant.potCode ?? undefined,
    potSizeLiters: plant.potSizeLiters ?? undefined,
    potType: plant.potType ?? undefined,
    substrate: plant.substrate ?? undefined,
    notes: plant.notes ?? undefined,
  };
}

function toApiPlantPayload(payload: CreatePlantPayload | UpdatePlantPayload) {
  return {
    internalCode: payload.internalCode,
    bedId: payload.bedId,
    bedPosition: payload.bedPosition,
    batchId: payload.batchId,
    geneticsId: payload.geneticsId,
    motherPlantId: payload.motherPlantId,
    origin: payload.origin ? UI_TO_API_ORIGIN[payload.origin] : undefined,
    stage: payload.stage ? UI_TO_API_STAGE[payload.stage] : undefined,
    status: payload.status ? UI_TO_API_STATUS[payload.status] : undefined,
    startDate: payload.startDate,
    stageStartDate: payload.stageStartDate,
    potCode: payload.potCode,
    potSizeLiters: payload.potSizeLiters,
    potType: payload.potType,
    substrate: payload.substrate,
    notes: payload.notes,
  };
}

function toApiPlantFilters(filters: PlantFilters): Record<string, string> {
  return Object.fromEntries(
    Object.entries({
      bedId: filters.bedId,
      geneticsId: filters.geneticsId,
      batchId: filters.batchId,
      motherPlantId: filters.motherPlantId,
      stage: filters.stage ? UI_TO_API_STAGE[filters.stage] : undefined,
      status: filters.status ? UI_TO_API_STATUS[filters.status] : undefined,
    }).filter(([, value]) => value),
  ) as Record<string, string>;
}

export async function getPlants(filters: PlantFilters = {}): Promise<Plant[]> {
  return withMockFallback(
    async () => {
      const query = new URLSearchParams(toApiPlantFilters(filters));
      const apiPlants = await apiRequest<ApiPlant[]>(
        `/cultivation/plants${query.size ? `?${query.toString()}` : ""}`,
      );
      return apiPlants.map(mapApiPlant).filter((plant) => !filters.roomId || plant.roomId === filters.roomId);
    },
    () => plants.filter((plant) => {
    if (filters.roomId && plant.roomId !== filters.roomId) return false;
    if (filters.bedId && plant.bedId !== filters.bedId) return false;
    if (filters.geneticsId && plant.geneticsId !== filters.geneticsId) return false;
    if (filters.batchId && plant.batchId !== filters.batchId) return false;
    if (filters.motherPlantId && plant.motherPlantId !== filters.motherPlantId) return false;
    if (filters.stage && plant.stage !== filters.stage) return false;
    if (filters.status && plant.status !== filters.status) return false;
    return true;
    }),
  );
}

export async function getPlantsByBed(bedId: string): Promise<Plant[]> {
  return getPlants({ bedId });
}

export async function getPlantById(id: string): Promise<Plant | null> {
  return withMockFallback(
    async () => mapApiPlant(await apiRequest<ApiPlant>(`/cultivation/plants/${id}`)),
    () => plants.find((plant) => plant.id === id) ?? null,
  );
}

export async function createPlant(payload: CreatePlantPayload): Promise<Plant> {
  return withMockFallback(
    async () =>
      mapApiPlant(
        await apiRequest<ApiPlant>("/cultivation/plants", {
          method: "POST",
          body: JSON.stringify(toApiPlantPayload(payload)),
        }),
      ),
    () => {
      validateBedCapacity(payload.bedId);
      validateUniqueBedPosition(payload.bedId, payload.bedPosition);

      const newPlant: Plant = {
        ...payload,
        id: payload.id ?? createMockId("plant"),
      };

      plants.push(newPlant);
      syncBedCurrentPlants(newPlant.bedId);

      return newPlant;
    },
  );
}

export async function updatePlant(id: string, payload: UpdatePlantPayload): Promise<Plant> {
  const plant = plants.find((item) => item.id === id);

  return withMockFallback(
    async () =>
      mapApiPlant(
        await apiRequest<ApiPlant>(`/cultivation/plants/${id}`, {
          method: "PUT",
          body: JSON.stringify(toApiPlantPayload(payload)),
        }),
      ),
    () => {
      if (!plant) {
        throw new Error("Planta no encontrada.");
      }

      const nextBedId = payload.bedId ?? plant.bedId;
      const nextBedPosition = payload.bedPosition ?? plant.bedPosition;
      const previousBedId = plant.bedId;

      validateBedCapacity(nextBedId, 1, plant.id);
      validateUniqueBedPosition(nextBedId, nextBedPosition, plant.id);

      Object.assign(plant, payload);
      syncBedCurrentPlants(previousBedId);
      syncBedCurrentPlants(plant.bedId);

      return plant;
    },
  );
}

export async function bulkCreatePlantsForBed(payload: BulkCreatePlantsForBedPayload): Promise<Plant[]> {
  return withMockFallback(
    async () =>
      (
        await apiRequest<ApiPlant[]>("/cultivation/plants/bulk", {
          method: "POST",
          body: JSON.stringify({
            bedId: payload.bedId,
            count: payload.count,
            internalCodePrefix: payload.plant.internalCodePrefix ?? "PLANT",
            batchId: payload.plant.batchId,
            geneticsId: payload.plant.geneticsId,
            motherPlantId: payload.plant.motherPlantId,
            origin: UI_TO_API_ORIGIN[payload.plant.origin],
            stage: UI_TO_API_STAGE[payload.plant.stage],
            status: UI_TO_API_STATUS[payload.plant.status],
            startDate: payload.plant.startDate,
            stageStartDate: payload.plant.stageStartDate,
            potSizeLiters: payload.plant.potSizeLiters,
            potType: payload.plant.potType,
            substrate: payload.plant.substrate,
            notes: payload.plant.notes,
          }),
        })
      ).map(mapApiPlant),
    () => {
      if (payload.count < 1) {
        throw new Error("La cantidad de plantas a crear debe ser mayor a 0.");
      }

      if (payload.count > 100) {
        throw new Error("No se pueden crear mas de 100 plantas por camilla.");
      }

      validateBedCapacity(payload.bedId, payload.count);

      const freePositions = getFreePositionsForBed(payload.bedId);

      if (freePositions.length < payload.count) {
        throw new Error("No hay posiciones libres suficientes en la camilla.");
      }

      const createdPlants = freePositions.slice(0, payload.count).map((bedPosition, index) => {
        const sequence = String(index + 1).padStart(2, "0");
        const plant: Plant = {
          ...payload.plant,
          id: createMockId("plant"),
          internalCode: `${payload.plant.internalCodePrefix ?? "PL-MOCK"}-${sequence}`,
          bedId: payload.bedId,
          bedPosition,
        };

        plants.push(plant);
        return plant;
      });

      syncBedCurrentPlants(payload.bedId);

      return createdPlants;
    },
  );
}

export async function updatePlantStage(
  id: string,
  payload: Pick<Plant, "stage"> & Pick<Partial<Plant>, "stageStartDate" | "notes">,
): Promise<Plant> {
  return withMockFallback(
    async () =>
      mapApiPlant(
        await apiRequest<ApiPlant>(`/cultivation/plants/${id}/stage`, {
          method: "PATCH",
          body: JSON.stringify({
            stage: UI_TO_API_STAGE[payload.stage],
            stageStartDate: payload.stageStartDate,
            notes: payload.notes,
          }),
        }),
      ),
    () => updatePlant(id, payload),
  );
}

export async function updatePlantStatus(
  id: string,
  payload: Pick<Plant, "status"> & Pick<Partial<Plant>, "notes">,
): Promise<Plant> {
  return withMockFallback(
    async () =>
      mapApiPlant(
        await apiRequest<ApiPlant>(`/cultivation/plants/${id}/status`, {
          method: "PATCH",
          body: JSON.stringify({
            status: UI_TO_API_STATUS[payload.status],
            notes: payload.notes,
          }),
        }),
      ),
    () => updatePlant(id, payload),
  );
}

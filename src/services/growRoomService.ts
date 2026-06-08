import { growRooms } from "@/data/cultivationMockData";
import { apiRequest, withMockFallback } from "@/services/cultivationApi";
import type { GrowRoom, GrowRoomTechnicalConfig, RoomStatus, RoomType } from "@/types/cultivation";

type CreateGrowRoomPayload = {
  code: string;
  name: string;
  type: RoomType;
  status: RoomStatus;
  installedPowerWatts: number;
  irrigationSystem: "manual" | "automatico";
  hasAirConditioning: boolean;
  hasDehumidifier: boolean;
  installedSensors: string[];
  notes?: string;
};

type UpdateGrowRoomPayload = Partial<CreateGrowRoomPayload>;

interface ApiGrowRoom {
  id: number;
  codigoSala: string;
  nombre: string;
  tipo: RoomType;
  estado: RoomStatus;
  potenciaWatts?: number;
  tipoRiego?: "manual" | "automatico" | "mixto";
  tieneAireAcondicionado?: boolean;
  tieneDeshumidificador?: boolean;
  sensores?: string | null;
  descripcion?: string | null;
}

const defaultTechnicalConfig: GrowRoomTechnicalConfig = {
  lightingType: "led",
  installedPowerWatts: 0,
  irrigationSystem: "manual",
  hasAirConditioning: false,
  hasDehumidifier: false,
  installedSensors: [],
};

function mapApiGrowRoom(room: ApiGrowRoom): GrowRoom {
  const installedSensors = room.sensores
    ? room.sensores.split(",").map((sensor) => sensor.trim()).filter(Boolean)
    : [];

  return {
    id: String(room.id),
    code: room.codigoSala,
    name: room.nombre,
    type: room.tipo,
    status: room.estado,
    technicalConfig: {
      ...defaultTechnicalConfig,
      installedPowerWatts: room.potenciaWatts ?? 0,
      irrigationSystem: room.tipoRiego ?? "manual",
      hasAirConditioning: room.tieneAireAcondicionado ?? false,
      hasDehumidifier: room.tieneDeshumidificador ?? false,
      installedSensors: installedSensors as GrowRoomTechnicalConfig["installedSensors"],
    },
    notes: room.descripcion ?? undefined,
  };
}

function toApiGrowRoomPayload(payload: CreateGrowRoomPayload) {
  return {
    codigoSala: payload.code,
    nombre: payload.name,
    tipo: payload.type,
    estado: payload.status,
    potenciaWatts: payload.installedPowerWatts,
    tipoRiego: payload.irrigationSystem,
    tieneAireAcondicionado: payload.hasAirConditioning,
    tieneDeshumidificador: payload.hasDehumidifier,
    sensores: payload.installedSensors.map((sensor) => sensor.trim()).filter(Boolean).join(","),
    descripcion: payload.notes,
  };
}

export async function getGrowRooms(): Promise<GrowRoom[]> {
  return withMockFallback(
    async () => (await apiRequest<ApiGrowRoom[]>("/cultivation/rooms")).map(mapApiGrowRoom),
    () => growRooms,
  );
}

export async function getGrowRoomById(id: string): Promise<GrowRoom | null> {
  return withMockFallback(
    async () => mapApiGrowRoom(await apiRequest<ApiGrowRoom>(`/cultivation/rooms/${id}`)),
    () => growRooms.find((room) => room.id === id) ?? null,
  );
}

export async function createGrowRoom(payload: CreateGrowRoomPayload): Promise<GrowRoom> {
  return withMockFallback(
    async () =>
      mapApiGrowRoom(
        await apiRequest<ApiGrowRoom>("/cultivation/rooms", {
          method: "POST",
          body: JSON.stringify(toApiGrowRoomPayload(payload)),
        }),
      ),
    () => {
      const newRoom: GrowRoom = {
        id: `room-${Date.now()}`,
        code: payload.code,
        name: payload.name,
        type: payload.type,
        status: payload.status,
        technicalConfig: {
          ...defaultTechnicalConfig,
          installedPowerWatts: payload.installedPowerWatts,
          irrigationSystem: payload.irrigationSystem,
          hasAirConditioning: payload.hasAirConditioning,
          hasDehumidifier: payload.hasDehumidifier,
          installedSensors: payload.installedSensors as GrowRoomTechnicalConfig["installedSensors"],
        },
        notes: payload.notes,
      };

      growRooms.push(newRoom);
      return newRoom;
    },
  );
}

export async function updateGrowRoom(id: string, payload: UpdateGrowRoomPayload): Promise<GrowRoom> {
  return withMockFallback(
    async () =>
      mapApiGrowRoom(
        await apiRequest<ApiGrowRoom>(`/cultivation/rooms/${id}`, {
          method: "PUT",
          body: JSON.stringify(toApiGrowRoomPayload({
            code: payload.code ?? "",
            name: payload.name ?? "",
            type: payload.type ?? "vegetativo",
            status: payload.status ?? "activa",
            installedPowerWatts: payload.installedPowerWatts ?? 0,
            irrigationSystem: payload.irrigationSystem ?? "manual",
            hasAirConditioning: payload.hasAirConditioning ?? false,
            hasDehumidifier: payload.hasDehumidifier ?? false,
            installedSensors: payload.installedSensors ?? [],
            notes: payload.notes,
          })),
        }),
      ),
    () => {
      const room = growRooms.find((item) => item.id === id);
      if (!room) throw new Error("Sala de cultivo no encontrada.");

      if (payload.code !== undefined) room.code = payload.code;
      if (payload.name !== undefined) room.name = payload.name;
      if (payload.type !== undefined) room.type = payload.type;
      if (payload.status !== undefined) room.status = payload.status;
      if (payload.notes !== undefined) room.notes = payload.notes;
      room.technicalConfig = {
        ...room.technicalConfig,
        installedPowerWatts: payload.installedPowerWatts ?? room.technicalConfig.installedPowerWatts,
        irrigationSystem: payload.irrigationSystem ?? room.technicalConfig.irrigationSystem,
        hasAirConditioning: payload.hasAirConditioning ?? room.technicalConfig.hasAirConditioning,
        hasDehumidifier: payload.hasDehumidifier ?? room.technicalConfig.hasDehumidifier,
        installedSensors: payload.installedSensors ?? room.technicalConfig.installedSensors,
      };

      return room;
    },
  );
}

export async function deleteGrowRoom(id: string): Promise<void> {
  return withMockFallback(
    async () => {
      await apiRequest<unknown>(`/cultivation/rooms/${id}`, { method: "DELETE" });
    },
    () => {
      const index = growRooms.findIndex((room) => room.id === id);
      if (index === -1) {
        throw new Error("Sala de cultivo no encontrada.");
      }

      growRooms.splice(index, 1);
    },
  );
}

export async function updateGrowRoomTechnicalConfig(
  id: string,
  payload: Partial<GrowRoomTechnicalConfig>,
): Promise<GrowRoom> {
  return withMockFallback(
    async () =>
      mapApiGrowRoom(
        await apiRequest<ApiGrowRoom>(`/cultivation/rooms/${id}`, {
          method: "PUT",
          body: JSON.stringify({
            potenciaWatts: payload.installedPowerWatts,
            tipoRiego: payload.irrigationSystem,
            tieneAireAcondicionado: payload.hasAirConditioning,
            tieneDeshumidificador: payload.hasDehumidifier,
            sensores: payload.installedSensors?.map((sensor) => sensor.trim()).filter(Boolean).join(","),
            descripcion: payload.notes,
          }),
        }),
      ),
    () => {
      const room = growRooms.find((item) => item.id === id);

      if (!room) {
        throw new Error("Sala de cultivo no encontrada.");
      }

      room.technicalConfig = {
        ...room.technicalConfig,
        ...payload,
      };

      return room;
    },
  );
}

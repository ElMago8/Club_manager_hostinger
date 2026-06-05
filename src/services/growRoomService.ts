import { growRooms } from "@/data/cultivationMockData";
import type { GrowRoom, GrowRoomTechnicalConfig } from "@/types/cultivation";

// TODO: reemplazar mock data por API REST cuando exista backend.
export async function getGrowRooms(): Promise<GrowRoom[]> {
  return growRooms;
}

// TODO: reemplazar mock data por API REST cuando exista backend.
export async function getGrowRoomById(id: string): Promise<GrowRoom | null> {
  return growRooms.find((room) => room.id === id) ?? null;
}

// TODO: reemplazar mock data por API REST cuando exista backend.
export async function updateGrowRoomTechnicalConfig(
  id: string,
  payload: Partial<GrowRoomTechnicalConfig>,
): Promise<GrowRoom> {
  const room = growRooms.find((item) => item.id === id);

  if (!room) {
    throw new Error("Sala de cultivo no encontrada.");
  }

  room.technicalConfig = {
    ...room.technicalConfig,
    ...payload,
  };

  return room;
}

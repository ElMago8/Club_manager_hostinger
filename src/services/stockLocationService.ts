import { apiRequest } from "@/services/cultivationApi";
import type {
  CreateUbicacionPayload,
  UbicacionStock,
  UpdateUbicacionPayload,
} from "@/types/products";

export async function getUbicaciones(): Promise<UbicacionStock[]> {
  return apiRequest<UbicacionStock[]>("/stock/locations");
}

export async function createUbicacion(payload: CreateUbicacionPayload): Promise<UbicacionStock> {
  return apiRequest<UbicacionStock>("/stock/locations", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateUbicacion(id: number, payload: UpdateUbicacionPayload): Promise<UbicacionStock> {
  return apiRequest<UbicacionStock>(`/stock/locations/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteUbicacion(id: number): Promise<UbicacionStock> {
  return apiRequest<UbicacionStock>(`/stock/locations/${id}`, { method: "DELETE" });
}

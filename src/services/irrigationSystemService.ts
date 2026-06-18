import { apiRequest } from "@/services/cultivationApi";

export type SistemaRegadoTipo = "goteo" | "continuo_intermitente" | "otro";

export interface SistemaRiego {
  id: string;
  codigoRiego: string;
  camillaId: string;
  picosPorPlanta?: number | null;
  horarioApertura?: string | null;
  cantidadLitros?: number | null;
  tanque?: string | null;
  frecuenciaTiempo?: string | null;
  sistemaRegado: SistemaRegadoTipo;
  sistemaRegadoCustom?: string | null;
  notas?: string | null;
  creadoEn: string;
  actualizadoEn: string;
  camilla?: { nombre: string; codigoCamilla: string } | null;
}

interface ApiSistemaRiego {
  id: number;
  codigoRiego: string;
  camillaId: number;
  picosPorPlanta?: number | null;
  horarioApertura?: string | null;
  cantidadLitros?: number | null;
  tanque?: string | null;
  frecuenciaTiempo?: string | null;
  sistemaRegado: string;
  sistemaRegadoCustom?: string | null;
  notas?: string | null;
  creadoEn: string;
  actualizadoEn: string;
  camilla?: { nombre: string; codigoCamilla: string } | null;
}

export type CreateSistemaRiegoPayload = Omit<SistemaRiego, "id" | "creadoEn" | "actualizadoEn" | "camilla">;
export type UpdateSistemaRiegoPayload = Partial<CreateSistemaRiegoPayload>;

function mapApi(r: ApiSistemaRiego): SistemaRiego {
  return {
    id: String(r.id),
    codigoRiego: r.codigoRiego,
    camillaId: String(r.camillaId),
    picosPorPlanta: r.picosPorPlanta ?? null,
    horarioApertura: r.horarioApertura ?? null,
    cantidadLitros: r.cantidadLitros ?? null,
    tanque: r.tanque ?? null,
    frecuenciaTiempo: r.frecuenciaTiempo ?? null,
    sistemaRegado: r.sistemaRegado as SistemaRegadoTipo,
    sistemaRegadoCustom: r.sistemaRegadoCustom ?? null,
    notas: r.notas ?? null,
    creadoEn: r.creadoEn,
    actualizadoEn: r.actualizadoEn,
    camilla: r.camilla ?? null,
  };
}

export async function getSistemaRiegoByCamilla(camillaId: string): Promise<SistemaRiego[]> {
  const data = await apiRequest<ApiSistemaRiego[]>(
    `/cultivation/irrigation-systems?camillaId=${camillaId}`,
  );
  return data.map(mapApi);
}

export async function getSistemaRiegoById(id: string): Promise<SistemaRiego> {
  const data = await apiRequest<ApiSistemaRiego>(`/cultivation/irrigation-systems/${id}`);
  return mapApi(data);
}

export async function createSistemaRiego(payload: CreateSistemaRiegoPayload): Promise<SistemaRiego> {
  const data = await apiRequest<ApiSistemaRiego>("/cultivation/irrigation-systems", {
    method: "POST",
    body: JSON.stringify({
      ...payload,
      camillaId: Number(payload.camillaId),
    }),
  });
  return mapApi(data);
}

export async function updateSistemaRiego(id: string, payload: UpdateSistemaRiegoPayload): Promise<SistemaRiego> {
  const data = await apiRequest<ApiSistemaRiego>(`/cultivation/irrigation-systems/${id}`, {
    method: "PUT",
    body: JSON.stringify({
      ...payload,
      camillaId: payload.camillaId ? Number(payload.camillaId) : undefined,
    }),
  });
  return mapApi(data);
}

export async function deleteSistemaRiego(id: string): Promise<void> {
  await apiRequest<unknown>(`/cultivation/irrigation-systems/${id}`, { method: "DELETE" });
}

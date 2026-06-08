import { genetics } from "@/data/cultivationMockData";
import { apiRequest, withMockFallback } from "@/services/cultivationApi";
import type { Genetics } from "@/types/cultivation";

export interface AssignGeneticsToBedPayload {
  bedId: string;
  plantCount: number;
  motherPlantId?: string;
  batchId?: string;
  origin?: "semilla" | "esqueje" | "madre_interna" | "compra_externa" | "otro";
  stage?: "esqueje" | "vegetativo" | "floracion" | "cosecha" | "secado" | "curado" | "liberado" | "descartado";
  status?: "normal" | "observacion" | "alerta" | "descartada" | "cosechada";
  startDate?: string;
  potSizeLiters?: number;
  potType?: string;
  substrate?: string;
  notes?: string;
}

type CreateGeneticsPayload = Omit<Genetics, "id"> & {
  id?: string;
  assignToBed?: AssignGeneticsToBedPayload;
};
type UpdateGeneticsPayload = Partial<Omit<Genetics, "id">>;

interface ApiGenetics {
  id: number | string;
  codigoGenetica?: string;
  nombre?: string;
  name?: string;
  breeder?: string | null;
  tipo?: string | null;
  type?: string | null;
  thcEstimado?: number | null;
  sativaPorcentaje?: number | null;
  indicaPorcentaje?: number | null;
  sabor?: string | null;
  efecto?: string | null;
  aroma?: string | null;
  observaciones?: string | null;
  descripcion?: string | null;
  notes?: string | null;
}

function createMockId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createGeneticsCode(name: string): string {
  const slug = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toUpperCase()
    .slice(0, 24) || "GENETICA";

  return `GEN-${slug}-${Date.now().toString(36).toUpperCase()}`;
}

function normalizeType(type?: string | null): Genetics["type"] {
  if (type === "feminized") return "feminizada";
  if (type === "automatic") return "automatica";
  if (type === "clone") return "esqueje";
  if (type === "unknown") return "desconocida";
  if (type === "regular" || type === "feminizada" || type === "automatica" || type === "esqueje" || type === "desconocida") {
    return type;
  }
  return "desconocida";
}

function dominantProfileFromPercentages(indica?: number, sativa?: number): Genetics["dominantProfile"] {
  if (typeof indica !== "number" || typeof sativa !== "number") return "desconocida";
  if (indica === sativa) return "hibrida";
  return indica > sativa ? "indica" : "sativa";
}

function optionalString(value: string | undefined): string | null | undefined {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function mapApiGenetics(item: ApiGenetics): Genetics {
  const indicaPercent = item.indicaPorcentaje ?? undefined;
  const sativaPercent = item.sativaPorcentaje ?? undefined;

  return {
    id: String(item.id),
    name: item.nombre ?? item.name ?? "",
    breeder: item.breeder ?? undefined,
    type: normalizeType(item.tipo ?? item.type),
    dominantProfile: dominantProfileFromPercentages(indicaPercent, sativaPercent),
    thcPercent: item.thcEstimado ?? undefined,
    sativaPercent,
    indicaPercent,
    taste: item.sabor ?? undefined,
    effect: item.efecto ?? undefined,
    aroma: item.aroma ?? undefined,
    notes: item.observaciones ?? item.notes ?? item.descripcion ?? undefined,
  };
}

function toApiGeneticsPayload(payload: CreateGeneticsPayload | UpdateGeneticsPayload) {
  const isCreatePayload = "assignToBed" in payload;
  const trimmedName = payload.name?.trim();

  return {
    codigoGenetica: isCreatePayload && trimmedName ? createGeneticsCode(trimmedName) : undefined,
    nombre: trimmedName,
    breeder: optionalString(payload.breeder),
    tipo: payload.type,
    thcEstimado: payload.thcPercent,
    sativaPorcentaje: payload.sativaPercent,
    indicaPorcentaje: payload.indicaPercent,
    sabor: optionalString(payload.taste),
    efecto: optionalString(payload.effect),
    aroma: optionalString(payload.aroma),
    observaciones: optionalString(payload.notes),
  };
}

export async function getGenetics(): Promise<Genetics[]> {
  return withMockFallback(
    async () => (await apiRequest<ApiGenetics[]>("/cultivation/genetics")).map(mapApiGenetics),
    () => genetics,
  );
}

export async function getGeneticsById(id: string): Promise<Genetics> {
  return withMockFallback(
    async () => mapApiGenetics(await apiRequest<ApiGenetics>(`/cultivation/genetics/${id}`)),
    () => {
      const item = genetics.find((genetic) => genetic.id === id);
      if (!item) {
        throw new Error("Genetica no encontrada.");
      }
      return item;
    },
  );
}

export async function createGenetics(payload: CreateGeneticsPayload): Promise<Genetics> {
  return withMockFallback(
    async () =>
      mapApiGenetics(
        await apiRequest<ApiGenetics>("/cultivation/genetics", {
          method: "POST",
          body: JSON.stringify(toApiGeneticsPayload(payload)),
        }),
      ),
    () => {
      const newGenetics: Genetics = {
        ...payload,
        id: payload.id ?? createMockId("gen"),
      };

      genetics.push(newGenetics);
      return newGenetics;
    },
  );
}

export async function updateGenetics(id: string, payload: UpdateGeneticsPayload): Promise<Genetics> {
  const item = genetics.find((genetic) => genetic.id === id);

  return withMockFallback(
    async () =>
      mapApiGenetics(
        await apiRequest<ApiGenetics>(`/cultivation/genetics/${id}`, {
          method: "PUT",
          body: JSON.stringify(toApiGeneticsPayload(payload)),
        }),
      ),
    () => {
      if (!item) {
        throw new Error("Genetica no encontrada.");
      }

      Object.assign(item, payload);
      return item;
    },
  );
}

export async function deleteGenetics(id: string): Promise<void> {
  return withMockFallback(
    async () => {
      await apiRequest<unknown>(`/cultivation/genetics/${id}`, { method: "DELETE" });
    },
    () => {
      const index = genetics.findIndex((genetic) => genetic.id === id);
      if (index === -1) {
        throw new Error("Genetica no encontrada.");
      }

      genetics.splice(index, 1);
    },
  );
}

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

type ApiGeneticsType = "regular" | "feminized" | "automatic" | "clone" | "unknown";
type ApiDominantProfile = "indica" | "sativa" | "hybrid" | "unknown";

interface ApiGenetics {
  id: string;
  name: string;
  breeder?: string | null;
  type: ApiGeneticsType;
  dominantProfile: ApiDominantProfile;
  notes?: string | null;
}

const API_TO_UI_TYPE: Record<ApiGeneticsType, Genetics["type"]> = {
  regular: "regular",
  feminized: "feminizada",
  automatic: "automatica",
  clone: "esqueje",
  unknown: "desconocida",
};

const UI_TO_API_TYPE: Record<Genetics["type"], ApiGeneticsType> = {
  regular: "regular",
  feminizada: "feminized",
  automatica: "automatic",
  esqueje: "clone",
  desconocida: "unknown",
};

const API_TO_UI_PROFILE: Record<ApiDominantProfile, Genetics["dominantProfile"]> = {
  indica: "indica",
  sativa: "sativa",
  hybrid: "hibrida",
  unknown: "desconocida",
};

const UI_TO_API_PROFILE: Record<Genetics["dominantProfile"], ApiDominantProfile> = {
  indica: "indica",
  sativa: "sativa",
  hibrida: "hybrid",
  desconocida: "unknown",
};

function createMockId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function mapApiGenetics(item: ApiGenetics): Genetics {
  return {
    id: item.id,
    name: item.name,
    breeder: item.breeder ?? undefined,
    type: API_TO_UI_TYPE[item.type],
    dominantProfile: API_TO_UI_PROFILE[item.dominantProfile],
    notes: item.notes ?? undefined,
  };
}

function toApiGeneticsPayload(payload: CreateGeneticsPayload | UpdateGeneticsPayload) {
  const assignToBed = "assignToBed" in payload ? payload.assignToBed : undefined;
  return {
    name: payload.name,
    breeder: payload.breeder,
    type: payload.type ? UI_TO_API_TYPE[payload.type] : undefined,
    dominantProfile: payload.dominantProfile ? UI_TO_API_PROFILE[payload.dominantProfile] : undefined,
    notes: payload.notes,
    assignToBed: assignToBed
      ? {
          ...assignToBed,
          origin: assignToBed.origin ? {
            semilla: "seed",
            esqueje: "clone",
            madre_interna: "internal_mother",
            compra_externa: "external_purchase",
            otro: "other",
          }[assignToBed.origin] : undefined,
          stage: assignToBed.stage ? {
            esqueje: "clone",
            vegetativo: "vegetative",
            floracion: "flowering",
            cosecha: "harvest",
            secado: "drying",
            curado: "curing",
            liberado: "released",
            descartado: "discarded",
          }[assignToBed.stage] : undefined,
          status: assignToBed.status ? {
            normal: "normal",
            observacion: "observation",
            alerta: "alert",
            descartada: "discarded",
            cosechada: "harvested",
          }[assignToBed.status] : undefined,
        }
      : undefined,
  };
}

export async function getGenetics(): Promise<Genetics[]> {
  return withMockFallback(
    async () => (await apiRequest<ApiGenetics[]>("/cultivation/genetics")).map(mapApiGenetics),
    () => genetics,
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

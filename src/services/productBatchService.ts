import { apiRequest } from "@/services/cultivationApi";
import type {
  CreateLoteProductoPayload,
  LoteProducto,
  ProductBatchSummary,
  UpdateLoteProductoPayload,
} from "@/types/products";

export async function getLotesProducto(params?: {
  estado?: string;
  productoId?: number;
  geneticaId?: number;
  ubicacionId?: number;
}): Promise<LoteProducto[]> {
  const qs = params
    ? "?" + new URLSearchParams(
        Object.fromEntries(
          Object.entries(params)
            .filter(([, v]) => v !== undefined)
            .map(([k, v]) => [k, String(v)]),
        ),
      ).toString()
    : "";
  return apiRequest<LoteProducto[]>(`/product-batches${qs}`);
}

export async function getProductBatchSummary(): Promise<ProductBatchSummary> {
  return apiRequest<ProductBatchSummary>("/product-batches/summary");
}

export async function createLoteProducto(payload: CreateLoteProductoPayload): Promise<LoteProducto> {
  return apiRequest<LoteProducto>("/product-batches", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateLoteProducto(id: number, payload: UpdateLoteProductoPayload): Promise<LoteProducto> {
  return apiRequest<LoteProducto>(`/product-batches/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function descartarLote(id: number): Promise<LoteProducto> {
  return apiRequest<LoteProducto>(`/product-batches/${id}`, { method: "DELETE" });
}

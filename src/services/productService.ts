import { apiRequest } from "@/services/cultivationApi";
import type {
  CategoriaProducto,
  CreateCategoriaPayload,
  CreateProductoPayload,
  Producto,
  UpdateCategoriaPayload,
  UpdateProductoPayload,
} from "@/types/products";

// ─── Categorías ───────────────────────────────────────────────────────────────

export async function getCategorias(): Promise<CategoriaProducto[]> {
  return apiRequest<CategoriaProducto[]>("/products/categories");
}

export async function createCategoria(payload: CreateCategoriaPayload): Promise<CategoriaProducto> {
  return apiRequest<CategoriaProducto>("/products/categories", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateCategoria(id: number, payload: UpdateCategoriaPayload): Promise<CategoriaProducto> {
  return apiRequest<CategoriaProducto>(`/products/categories/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteCategoria(id: number): Promise<CategoriaProducto> {
  return apiRequest<CategoriaProducto>(`/products/categories/${id}`, { method: "DELETE" });
}

// ─── Productos ────────────────────────────────────────────────────────────────

export async function getProductos(params?: { estado?: string; tipoProducto?: string }): Promise<Producto[]> {
  const qs = params ? "?" + new URLSearchParams(params as Record<string, string>).toString() : "";
  return apiRequest<Producto[]>(`/products${qs}`);
}

export async function createProducto(payload: CreateProductoPayload): Promise<Producto> {
  return apiRequest<Producto>("/products", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateProducto(id: number, payload: UpdateProductoPayload): Promise<Producto> {
  return apiRequest<Producto>(`/products/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteProducto(id: number): Promise<Producto> {
  return apiRequest<Producto>(`/products/${id}`, { method: "DELETE" });
}

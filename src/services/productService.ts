import { getMockStore } from "./_mockStore";
import type { Item } from "@/types/inventory";

// TODO: reemplazar mock por llamada a API Node.js (GET /api/products).
export async function getProducts(): Promise<Item[]> {
  return getMockStore().getItems();
}

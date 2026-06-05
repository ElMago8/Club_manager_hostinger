import { getMockStore } from "./_mockStore";
import type { StockMovement } from "@/types/inventory";

// TODO: reemplazar mock por llamada a API Node.js (GET /api/stock/movements).
export async function getStockMovements(): Promise<StockMovement[]> {
  return getMockStore().getMovements();
}

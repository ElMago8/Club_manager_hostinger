import { getMockStore } from "./_mockStore";
import type { AppUser } from "@/types/inventory";

// TODO: reemplazar mock por llamada a API Node.js (GET /api/users).
export async function getAppUsers(): Promise<AppUser[]> {
  return getMockStore().getAppUsers();
}

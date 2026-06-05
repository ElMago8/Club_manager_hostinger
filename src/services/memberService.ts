import { getMockStore } from "./_mockStore";
import type { Member } from "@/types/inventory";

// TODO: reemplazar mock por llamada a API Node.js (GET /api/members).
export async function getMembers(): Promise<Member[]> {
  return getMockStore().getMembers();
}

// TODO: reemplazar mock por llamada a API Node.js (GET /api/members/:id).
export async function getMemberById(id: string): Promise<Member | null> {
  return getMockStore().getMembers().find((m) => m.id === id) ?? null;
}

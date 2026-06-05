import { getMockStore } from "./_mockStore";
import type { AuditEntry } from "@/types/inventory";

// TODO: reemplazar mock por llamada a API Node.js (GET /api/audit).
export async function getAuditEntries(): Promise<AuditEntry[]> {
  return getMockStore().getAuditEntries();
}

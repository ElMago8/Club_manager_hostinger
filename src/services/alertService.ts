import { getMockStore } from "./_mockStore";
import type { Notification } from "@/types/inventory";

// TODO: reemplazar mock por llamada a API Node.js (GET /api/alerts).
export async function getAlerts(): Promise<Notification[]> {
  return getMockStore().getNotifications();
}

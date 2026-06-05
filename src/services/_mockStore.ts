import { DemoStore } from "@/lib/demo-store";

/**
 * Singleton compartido por los services frontend.
 *
 * Este store es 100% mock en memoria. Cuando exista backend Node.js + Express,
 * los services dejarán de usarlo y harán fetch real a la API.
 */
let _store: DemoStore | null = null;

export function getMockStore(): DemoStore {
  if (!_store) _store = new DemoStore();
  return _store;
}

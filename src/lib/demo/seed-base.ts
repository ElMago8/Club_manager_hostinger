import type { Category, Supplier, Location } from "@/types/inventory";

const ts = (daysAgo: number) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
};

// Categorías internas del club (no comerciales)
export const categories: Category[] = [
  { id: "cat-fl", name: "Flores", description: "Flores secas por variedad y lote", parentId: null, createdAt: ts(180), updatedAt: ts(180) },
  { id: "cat-ac", name: "Aceites", description: "Aceites elaborados para uso terapéutico", parentId: null, createdAt: ts(180), updatedAt: ts(180) },
  { id: "cat-ex", name: "Extractos", description: "Extractos y resinas internas", parentId: null, createdAt: ts(180), updatedAt: ts(180) },
  { id: "cat-in", name: "Insumos", description: "Insumos para cultivo y elaboración", parentId: null, createdAt: ts(180), updatedAt: ts(180) },
  { id: "cat-ot", name: "Otros", description: "Materiales y elementos auxiliares", parentId: null, createdAt: ts(180), updatedAt: ts(180) },
];

// Fuentes internas (estructura Supplier reutilizada para compatibilidad).
// El módulo "Suppliers" está oculto en la navegación; estos registros sólo dan
// contexto a items, movimientos y auditoría.
export const suppliers: Supplier[] = [
  { id: "sup-01", name: "Cultivo Sala A", contactName: "Responsable cultivo A", email: "cultivo.a@hipnosis-demo.local", phone: "—", address: "Sala A · uso interno", leadTimeDays: 0, rating: 5, isActive: true, notes: "Cultivo propio del club", createdAt: ts(180), updatedAt: ts(20) },
  { id: "sup-02", name: "Cultivo Sala B", contactName: "Responsable cultivo B", email: "cultivo.b@hipnosis-demo.local", phone: "—", address: "Sala B · uso interno", leadTimeDays: 0, rating: 5, isActive: true, notes: "Cultivo propio del club", createdAt: ts(180), updatedAt: ts(15) },
  { id: "sup-03", name: "Elaboración interna", contactName: "Responsable elaboración", email: "elaboracion@hipnosis-demo.local", phone: "—", address: "Laboratorio interno", leadTimeDays: 0, rating: 5, isActive: true, notes: "Aceites y extractos elaborados internamente", createdAt: ts(180), updatedAt: ts(10) },
  { id: "sup-04", name: "Insumos generales", contactName: "Encargado insumos", email: "insumos@hipnosis-demo.local", phone: "—", address: "Depósito de insumos", leadTimeDays: 0, rating: 5, isActive: true, notes: "Material auxiliar y consumibles", createdAt: ts(180), updatedAt: ts(8) },
];

// Ubicaciones internas (Salas y depósitos)
export const locations: Location[] = [
  { id: "loc-01", name: "Depósito Central", type: "warehouse", parentId: null, description: "Depósito principal del club", address: "Sede interna", isActive: true, createdAt: ts(180), updatedAt: ts(5) },
  { id: "loc-01-z1", name: "Sala Dispensa", type: "zone", parentId: "loc-01", description: "Zona de dispensa autorizada", address: "", isActive: true, createdAt: ts(160), updatedAt: ts(5) },
  { id: "loc-01-z2", name: "Zona Aceites y Extractos", type: "zone", parentId: "loc-01", description: "Almacenaje de aceites y extractos", address: "", isActive: true, createdAt: ts(160), updatedAt: ts(5) },
  { id: "loc-01-z1-a1", name: "Estante Flores", type: "aisle", parentId: "loc-01-z1", description: "Frascos por variedad y lote", address: "", isActive: true, createdAt: ts(150), updatedAt: ts(5) },
  { id: "loc-01-z1-a2", name: "Estante Aceites", type: "aisle", parentId: "loc-01-z2", description: "Aceites por concentración", address: "", isActive: true, createdAt: ts(150), updatedAt: ts(5) },
  { id: "loc-01-z2-a1", name: "Estante Insumos", type: "aisle", parentId: "loc-01-z2", description: "Frascos, etiquetas, material", address: "", isActive: true, createdAt: ts(150), updatedAt: ts(5) },
  { id: "loc-02", name: "Sala Cultivo A", type: "warehouse", parentId: null, description: "Sala de cultivo propio A", address: "Sede interna", isActive: true, createdAt: ts(180), updatedAt: ts(10) },
  { id: "loc-03", name: "Sala Cultivo B", type: "warehouse", parentId: null, description: "Sala de cultivo propio B", address: "Sede interna", isActive: true, createdAt: ts(180), updatedAt: ts(20) },
];

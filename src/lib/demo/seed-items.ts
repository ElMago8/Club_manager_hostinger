import type { Item } from "@/types/inventory";
import { ItemStatus } from "@/types/inventory";

const ts = (daysAgo: number) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
};

// Producto interno (estructura `Item` reutilizada por compatibilidad).
// `sku` se utiliza como Código de Lote interno (LOT-...).
// `costPrice` y `sellingPrice` se mantienen en 0 — no se usan precios en el club.
const product = (
  idx: number,
  name: string,
  catId: string,
  srcId: string,
  locId: string,
  unit: string,
  stock: number,
  reorder: number,
  lot: string,
): Item => ({
  id: `prd-${String(idx).padStart(3, "0")}`,
  sku: lot,
  barcode: null,
  name,
  description: `${name} · uso interno del club`,
  categoryId: catId,
  status: ItemStatus.Active,
  unit,
  currentStock: stock,
  reorderPoint: reorder,
  reorderQuantity: reorder * 2,
  costPrice: 0,
  sellingPrice: 0,
  locationId: locId,
  supplierId: srcId,
  imageUrl: null,
  customFields: {},
  createdAt: ts(120),
  updatedAt: ts(Math.floor(Math.random() * 20)),
});

// 20 productos internos · ~10 sanos, ~6 stock bajo, ~4 sin stock
export const items: Item[] = [
  // Flores — 8
  product(1, "Flor · Variedad Hipnosis", "cat-fl", "sup-01", "loc-01-z1-a1", "g", 420, 100, "LOT-FL-2026-001"),
  product(2, "Flor · Variedad Serena", "cat-fl", "sup-01", "loc-01-z1-a1", "g", 85, 100, "LOT-FL-2026-002"),
  product(3, "Flor · Variedad Aurora", "cat-fl", "sup-02", "loc-01-z1-a1", "g", 260, 80, "LOT-FL-2026-003"),
  product(4, "Flor · Variedad Boreal", "cat-fl", "sup-02", "loc-01-z1-a1", "g", 0, 80, "LOT-FL-2026-004"),
  product(5, "Flor · Variedad Lumen", "cat-fl", "sup-01", "loc-01-z1-a1", "g", 175, 60, "LOT-FL-2026-005"),
  product(6, "Flor · Variedad Bruma", "cat-fl", "sup-02", "loc-01-z1-a1", "g", 38, 60, "LOT-FL-2026-006"),
  product(7, "Flor · Variedad Calima", "cat-fl", "sup-01", "loc-01-z1-a1", "g", 310, 90, "LOT-FL-2026-007"),
  product(8, "Flor · Variedad Solsticio", "cat-fl", "sup-02", "loc-01-z1-a1", "g", 0, 60, "LOT-FL-2026-008"),

  // Aceites — 5
  product(9, "Aceite Base 10mg/ml", "cat-ac", "sup-03", "loc-01-z1-a2", "ml", 2400, 800, "LOT-AC-2026-001"),
  product(10, "Aceite Equilibrado 20mg/ml", "cat-ac", "sup-03", "loc-01-z1-a2", "ml", 950, 600, "LOT-AC-2026-002"),
  product(11, "Aceite Nocturno 30mg/ml", "cat-ac", "sup-03", "loc-01-z1-a2", "ml", 420, 500, "LOT-AC-2026-003"),
  product(12, "Aceite Diurno 15mg/ml", "cat-ac", "sup-03", "loc-01-z1-a2", "ml", 1180, 600, "LOT-AC-2026-004"),
  product(13, "Aceite Reserva 40mg/ml", "cat-ac", "sup-03", "loc-01-z1-a2", "ml", 0, 300, "LOT-AC-2026-005"),

  // Extractos — 3
  product(14, "Extracto Resina · Lote 01", "cat-ex", "sup-03", "loc-01-z2", "g", 48, 25, "LOT-EX-2026-001"),
  product(15, "Extracto Resina · Lote 02", "cat-ex", "sup-03", "loc-01-z2", "g", 12, 25, "LOT-EX-2026-002"),
  product(16, "Extracto Hash interno", "cat-ex", "sup-03", "loc-01-z2", "g", 0, 20, "LOT-EX-2026-003"),

  // Insumos — 3
  product(17, "Frascos vidrio 30ml", "cat-in", "sup-04", "loc-01-z2-a1", "u", 540, 150, "LOT-IN-2026-001"),
  product(18, "Etiquetas trazabilidad", "cat-in", "sup-04", "loc-01-z2-a1", "u", 90, 200, "LOT-IN-2026-002"),
  product(19, "Bolsas selladas pequeñas", "cat-in", "sup-04", "loc-01-z2-a1", "u", 320, 200, "LOT-IN-2026-003"),

  // Otros — 1
  product(20, "Material auxiliar de sala", "cat-ot", "sup-04", "loc-01-z2-a1", "u", 65, 30, "LOT-OT-2026-001"),
];

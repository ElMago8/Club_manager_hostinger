import type {
  StockMovement,
  PurchaseOrder,
  PurchaseOrderItem,
  InventoryRequest,
  RequestItem,
} from "@/types/inventory";
import {
  MovementType,
  OrderStatus,
  RequestStatus,
} from "@/types/inventory";
import { items } from "./seed-items";

const ts = (daysAgo: number, hour = 10) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
};

// Movement.type mapping interno:
//   Received  → cosecha / entrada
//   Shipped   → dispensa / salida
//   Adjusted  → ajuste / merma
const types = [MovementType.Received, MovementType.Shipped, MovementType.Adjusted];

const movementReasons: Record<MovementType, string[]> = {
  [MovementType.Received]: ["Cosecha", "Entrada interna", "Reposición desde sala"],
  [MovementType.Shipped]: ["Dispensa autorizada", "Dispensa a socio", "Dispensa programada"],
  [MovementType.Adjusted]: ["Ajuste de inventario", "Merma registrada", "Reconciliación"],
  [MovementType.Transferred]: ["Traslado entre salas"],
};

const operators = ["op.lucia", "op.matias", "op.romina", "admin.club"];

export function generateMovements(): StockMovement[] {
  const movements: StockMovement[] = [];
  for (let i = 0; i < 80; i++) {
    const daysAgo = Math.floor((i / 80) * 35);
    const hour = 9 + (i % 9);
    const itemIdx = i % items.length;
    const type = types[i % 3];
    const baseQty = type === MovementType.Shipped ? -(1 + (i % 5)) : 5 + (i % 25);
    const qty = type === MovementType.Adjusted && i % 2 === 0 ? -Math.abs(baseQty) : baseQty;
    const reasons = movementReasons[type];
    const reason = reasons[i % reasons.length];
    movements.push({
      id: `mov-${String(i + 1).padStart(3, "0")}`,
      itemId: items[itemIdx].id,
      type,
      quantity: qty,
      fromLocationId: type === MovementType.Shipped ? "loc-01-z1" : null,
      toLocationId: type === MovementType.Received ? "loc-01" : null,
      reference: `MOV-${String(2026000 + i)}`,
      notes: reason,
      performedBy: operators[i % operators.length],
      createdAt: ts(daysAgo, hour),
    });
  }
  return movements;
}

// Las órdenes de compra / requests están fuera del alcance MVP (módulos ocultos).
// Se conservan en el seed para no romper imports; se usa lenguaje neutro interno.
export function generatePurchaseOrders(): PurchaseOrder[] {
  const mk = (items: PurchaseOrderItem[]) => items.reduce((s, i) => s + i.quantityOrdered * i.unitCost, 0);
  const po1: PurchaseOrderItem[] = [
    { id: "poi-01", purchaseOrderId: "po-01", itemId: "prd-017", quantityOrdered: 200, quantityReceived: 0, unitCost: 0 },
    { id: "poi-02", purchaseOrderId: "po-01", itemId: "prd-018", quantityOrdered: 300, quantityReceived: 0, unitCost: 0 },
  ];
  const po2: PurchaseOrderItem[] = [
    { id: "poi-03", purchaseOrderId: "po-02", itemId: "prd-019", quantityOrdered: 250, quantityReceived: 250, unitCost: 0 },
  ];
  return [
    {
      id: "po-01", orderNumber: "REP-2026-001", supplierId: "sup-04", status: OrderStatus.Submitted,
      items: po1, totalCost: mk(po1), expectedDelivery: ts(-3),
      notes: "Reposición interna de insumos", createdBy: "admin.club", createdAt: ts(4), updatedAt: ts(2),
    },
    {
      id: "po-02", orderNumber: "REP-2026-002", supplierId: "sup-04", status: OrderStatus.Received,
      items: po2, totalCost: mk(po2), expectedDelivery: ts(10),
      notes: "Reposición de bolsas selladas", createdBy: "admin.club", createdAt: ts(15), updatedAt: ts(9),
    },
  ];
}

export function generateRequests(): InventoryRequest[] {
  const mkItems = (rid: string, ids: string[]): RequestItem[] =>
    ids.map((itemId, i) => ({
      id: `ri-${rid}-${i + 1}`,
      requestId: rid,
      itemId,
      quantity: 5 + i * 2,
      notes: "",
    }));

  return [
    {
      id: "req-01",
      requestNumber: "SOL-2026-001",
      title: "Solicitud interna · insumos para dispensa",
      status: RequestStatus.Pending,
      priority: "normal" as const,
      items: mkItems("req-01", ["prd-017", "prd-018"]),
      requestedBy: "op.lucia",
      approvedBy: null,
      reason: "Reposición de frascos y etiquetas para próxima dispensa",
      createdAt: ts(2),
      updatedAt: ts(2),
    },
    {
      id: "req-02",
      requestNumber: "SOL-2026-002",
      title: "Solicitud interna · traslado desde Sala Cultivo",
      status: RequestStatus.Approved,
      priority: "normal" as const,
      items: mkItems("req-02", ["prd-001", "prd-005"]),
      requestedBy: "op.matias",
      approvedBy: "admin.club",
      reason: "Traslado de flores curadas a depósito",
      createdAt: ts(6),
      updatedAt: ts(4),
    },
  ];
}

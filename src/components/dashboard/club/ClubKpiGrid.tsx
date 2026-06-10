import { Users, UserPlus, Boxes, AlertTriangle, Scale, ArrowLeftRight, BellRing, ShieldAlert } from "lucide-react";
import { MetricCard } from "@/components/dashboard/MetricCard";
import type { Item, Member, StockMovement, Notification } from "@/types/inventory";
import { MovementType } from "@/types/inventory";

interface Props {
  members: Member[];
  items: Item[];
  movements: StockMovement[];
  alerts: Notification[];
}

function startOfMonth(): number {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function startOfDay(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function ClubKpiGrid({ members, items, movements, alerts }: Props) {
  const monthStart = startOfMonth();
  const dayStart = startOfDay();
  const in30Days = Date.now() + 30 * 86_400_000;

  const activeMembers = members.filter((m) => m.status === "active").length;
  const pendingMembers = members.filter((m) => m.status === "pending").length;
  const inStock = items.filter((i) => i.currentStock > i.reorderPoint).length;
  const lowStock = items.filter((i) => i.currentStock > 0 && i.currentStock <= i.reorderPoint).length;

  const dispensedGrams = movements
    .filter((m) => m.type === MovementType.Shipped && new Date(m.createdAt).getTime() >= monthStart)
    .filter((m) => {
      const item = items.find((i) => i.id === m.itemId);
      return item?.unit === "g";
    })
    .reduce((sum, m) => sum + Math.abs(m.quantity), 0);

  const todaysMovements = movements.filter((m) => new Date(m.createdAt).getTime() >= dayStart).length;
  const openAlerts = alerts.filter((a) => !a.isRead).length;
  const expiringCredentials = members.filter((m) => {
    if (!m.reprocannExpirationDate) return false;
    const t = new Date(m.reprocannExpirationDate).getTime();
    return t > Date.now() && t <= in30Days;
  }).length;

  return (
    <div data-tour="metrics" className="rounded-xl border border-border bg-card p-3 shadow-xs">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        <MetricCard label="Socios activos" value={activeMembers} accentColor="healthy" icon={Users} />
        <MetricCard label="Socios pendientes" value={pendingMembers} accentColor="warning" icon={UserPlus} />
        <MetricCard label="Productos en stock" value={inStock} accentColor="healthy" icon={Boxes} />
        <MetricCard label="Stock bajo" value={lowStock} accentColor="warning" icon={AlertTriangle} />
        <MetricCard label="Gramos dispensados (mes)" value={dispensedGrams} accentColor="neutral" icon={Scale} />
        <MetricCard label="Movimientos del día" value={todaysMovements} accentColor="neutral" icon={ArrowLeftRight} />
        <MetricCard label="Alertas abiertas" value={openAlerts} accentColor="danger" icon={BellRing} />
        <MetricCard label="Credenciales por vencer" value={expiringCredentials} accentColor="warning" icon={ShieldAlert } />
      </div>
    </div>
  );
}

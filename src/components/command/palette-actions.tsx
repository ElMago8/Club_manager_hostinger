import { Plus, ArrowRightLeft, FileDown } from "lucide-react";
import type { useNavigate } from "@tanstack/react-router";
import type { usePermissions } from "@/hooks/usePermissions";

export interface ActionDef {
  label: string;
  icon: React.ReactNode;
  shortcut?: string;
  action: (navigate: ReturnType<typeof useNavigate>) => void;
  permission?: Parameters<ReturnType<typeof usePermissions>["can"]>[0];
}

/**
 * Acciones rápidas de la paleta de comandos.
 * Acciones de proveedores, órdenes de compra y solicitudes de stock se
 * retiran del alcance del MVP visual del club.
 */
export const ACTIONS: ActionDef[] = [
  {
    label: "Nuevo producto",
    icon: <Plus className="h-4 w-4" />,
    shortcut: "N P",
    action: (nav) => nav({ to: "/app/catalog", search: {} }),
    permission: "create_item",
  },
  {
    label: "Nuevo movimiento",
    icon: <ArrowRightLeft className="h-4 w-4" />,
    shortcut: "N M",
    action: (nav) => nav({ to: "/app/movements", search: { item: undefined } }),
    permission: "log_movement",
  },
  {
    label: "Exportar productos (CSV)",
    icon: <FileDown className="h-4 w-4" />,
    action: (nav) => nav({ to: "/app/catalog", search: {} }),
    permission: "export_data",
  },
];

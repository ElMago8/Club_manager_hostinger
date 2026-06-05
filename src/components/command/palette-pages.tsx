import {
  LayoutDashboard,
  Users,
  Package,
  ArrowRightLeft,
  BellRing,
  ShieldCheck,
  FileSearch,
  Settings,
} from "lucide-react";

export interface PageDef {
  label: string;
  path: string;
  icon: React.ReactNode;
}

/**
 * Páginas visibles en la paleta de comandos.
 * Suppliers, Purchase Orders, Locations, Analytics, AI Insights, Requests y
 * Help quedan fuera del alcance del MVP visual y por eso no se listan aquí.
 */
export const PAGES: PageDef[] = [
  { label: "Dashboard", path: "/app/dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: "Socios · Pacientes", path: "/app/socios", icon: <Users className="h-4 w-4" /> },
  { label: "Productos · Stock", path: "/app/catalog", icon: <Package className="h-4 w-4" /> },
  { label: "Movimientos", path: "/app/movements", icon: <ArrowRightLeft className="h-4 w-4" /> },
  { label: "Alertas", path: "/app/alertas", icon: <BellRing className="h-4 w-4" /> },
  { label: "Usuarios y Roles", path: "/app/usuarios", icon: <ShieldCheck className="h-4 w-4" /> },
  { label: "Auditoría", path: "/app/auditoria", icon: <FileSearch className="h-4 w-4" /> },
  { label: "Configuración", path: "/app/settings", icon: <Settings className="h-4 w-4" /> },
];

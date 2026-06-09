import {
  LayoutDashboard,
  Users,
  Package,
  ArrowLeftRight,
  BellRing,
  ShieldCheck,
  FileSearch,
  Settings,
  Leaf,
  ChevronDown,
} from "lucide-react";
import { Link, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import tickerLogo from "@/assets/ticker-transparent.png";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface CultivoSection {
  label: string;
  href: string;
}

/**
 * Navegación interna del MVP visual.
 *
 * Solo módulos del alcance Fase 2. Suppliers, Purchase Orders, Locations,
 * Analytics, AI Insights, Requests y Help quedan fuera de la navegación
 * principal (sus rutas internas siguen existiendo pero no son visibles
 * desde aquí ni desde BottomNav / CommandPalette).
 */
const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/app/dashboard", icon: LayoutDashboard },
  { label: "Socios · Pacientes", href: "/app/socios", icon: Users },
  { label: "Productos · Stock", href: "/app/catalog", icon: Package },
  { label: "Cultivo", href: "/app/cultivo", icon: Leaf },
  { label: "Movimientos", href: "/app/movements", icon: ArrowLeftRight },
  { label: "Alertas", href: "/app/alertas", icon: BellRing },
  { label: "Usuarios y Roles", href: "/app/usuarios", icon: ShieldCheck },
  { label: "Auditoría", href: "/app/auditoria", icon: FileSearch },
  { label: "Configuración", href: "/app/settings", icon: Settings },
];

const CULTIVO_SECTIONS: CultivoSection[] = [
  { label: "Cultivo general", href: "/app/cultivo" },
  { label: "Salas", href: "/app/cultivo/salas" },
  { label: "Camillas", href: "/app/cultivo/camillas" },
  { label: "Plantas", href: "/app/cultivo/plantas" },
  { label: "Geneticas", href: "/app/cultivo/geneticas" },
  { label: "Madres", href: "/app/cultivo/madres" },
  { label: "Calendario operativo", href: "/app/cultivo/calendario" },
  { label: "Parametros ambientales", href: "/app/cultivo/ambiente" },
  { label: "Mediciones pH / PPM", href: "/app/cultivo/mediciones" },
  { label: "Tabla VPD", href: "/app/cultivo/vpd" },
  { label: "Cosechas", href: "/app/cultivo/cosechas" },
] as const;

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const location = useLocation();
  const isActive = (href: string) => location.pathname === href;
  const [cultivoOpen, setCultivoOpen] = useState(location.pathname.startsWith("/app/cultivo"));

  useEffect(() => {
    if (location.pathname.startsWith("/app/cultivo")) setCultivoOpen(true);
  }, [location.pathname]);

  return (
    <nav
      data-tour="sidebar"
      className="flex h-full flex-col bg-sidebar text-sidebar-foreground"
    >
      <div className="flex h-14 items-center gap-2 px-5">
        <img
          src={tickerLogo}
          alt=""
          aria-hidden="true"
          className="h-5 w-5 shrink-0 object-contain"
        />
        <span className="text-sm font-semibold tracking-tight text-sidebar-foreground">
          Cannabis Club Manager
        </span>
      </div>

      <div className="px-3 pb-2">
        <span className="block px-2 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-sidebar-foreground/50">
          Panel interno
        </span>
      </div>

      <div className="sidebar-scrollbar flex-1 overflow-y-auto px-3 pb-3">
        <div className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            if (item.href === "/app/cultivo") {
              return (
                <div key={item.href} className="space-y-0.5">
                  <button
                    type="button"
                    onClick={() => setCultivoOpen((open) => !open)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors",
                      isActive(item.href)
                        ? "bg-sidebar-accent/90 font-medium text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                    )}
                    aria-expanded={cultivoOpen}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span className="min-w-0 flex-1">{item.label}</span>
                    <ChevronDown
                      className={cn(
                        "h-3.5 w-3.5 shrink-0 transition-transform",
                        cultivoOpen && "rotate-180",
                      )}
                    />
                  </button>

                  {cultivoOpen && (
                    <div className="ml-7 space-y-0.5 border-l border-sidebar-border/70 pl-2">
                      {CULTIVO_SECTIONS.map((section) => (
                        <Link
                          key={section.href}
                          to={section.href}
                          onClick={onNavigate}
                          className={cn(
                            "block rounded-md px-3 py-1.5 text-xs transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                            (section.href === "/app/cultivo"
                              ? location.pathname === section.href
                              : location.pathname === section.href || location.pathname.startsWith(`${section.href}/`))
                              ? "bg-sidebar-accent/70 text-sidebar-foreground"
                              : "text-sidebar-foreground/70",
                          )}
                        >
                          {section.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  isActive(item.href)
                    ? "bg-sidebar-accent/90 font-medium text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="border-t border-sidebar-border px-5 py-3">
        <p className="text-[10px] leading-relaxed text-sidebar-foreground/55">
          Entorno de demostración · datos ficticios. Sin backend ni base de
          datos real.
        </p>
      </div>
    </nav>
  );
}

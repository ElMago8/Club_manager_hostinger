import type { Notification } from "@/types/inventory";
import { subHours, subDays, subMinutes } from "date-fns";

export function generateNotifications(): Notification[] {
  const now = new Date();
  return [
    {
      id: "notif-001",
      type: "zero_stock",
      title: "Sin stock: Flor · Variedad Boreal",
      message: "Lote LOT-FL-2026-004 quedó en 0 g. Programar reposición desde Sala Cultivo.",
      isRead: false,
      link: "/app/catalog?item=prd-004",
      referenceId: "prd-004",
      createdAt: subMinutes(now, 25).toISOString(),
    },
    {
      id: "notif-002",
      type: "low_stock",
      title: "Stock bajo: Flor · Variedad Serena",
      message: "Lote LOT-FL-2026-002 está en 85 g, por debajo del mínimo (100 g).",
      isRead: false,
      link: "/app/catalog?item=prd-002",
      referenceId: "prd-002",
      createdAt: subHours(now, 2).toISOString(),
    },
    {
      id: "notif-003",
      type: "low_stock",
      title: "Stock bajo: Aceite Nocturno 30mg/ml",
      message: "Lote LOT-AC-2026-003 está en 420 ml, por debajo del mínimo (500 ml).",
      isRead: false,
      link: "/app/catalog?item=prd-011",
      referenceId: "prd-011",
      createdAt: subHours(now, 6).toISOString(),
    },
    {
      id: "notif-004",
      type: "low_stock",
      title: "Stock bajo: Extracto Resina · Lote 02",
      message: "Lote LOT-EX-2026-002 está en 12 g, por debajo del mínimo (25 g).",
      isRead: true,
      link: "/app/catalog?item=prd-015",
      referenceId: "prd-015",
      createdAt: subDays(now, 1).toISOString(),
    },
    {
      id: "notif-005",
      type: "system",
      title: "Credencial próxima a vencer",
      message: "La credencial HC-0014 vence en menos de 15 días. Revisar documentación del socio.",
      isRead: true,
      link: "/app/socios",
      referenceId: "mem-014",
      createdAt: subDays(now, 2).toISOString(),
    },
    {
      id: "notif-006",
      type: "low_stock",
      title: "Stock bajo: Etiquetas trazabilidad",
      message: "Lote LOT-IN-2026-002 está en 90 u, por debajo del mínimo (200 u).",
      isRead: false,
      link: "/app/catalog?item=prd-018",
      referenceId: "prd-018",
      createdAt: subHours(now, 4).toISOString(),
    },
    {
      id: "notif-007",
      type: "system",
      title: "Bienvenido a Cannabis Club Manager",
      message: "Tu entorno administrativo está listo. Revisá el dashboard para comenzar.",
      isRead: true,
      link: "/app/dashboard",
      referenceId: null,
      createdAt: subDays(now, 5).toISOString(),
    },
  ];
}

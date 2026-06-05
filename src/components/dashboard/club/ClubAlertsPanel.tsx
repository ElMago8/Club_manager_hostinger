import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Notification } from "@/types/inventory";

interface Props {
  alerts: Notification[];
}

const PRIORITY: Record<Notification["type"], { label: string; tone: "danger" | "warning" | "neutral" }> = {
  zero_stock: { label: "Crítica", tone: "danger" },
  low_stock: { label: "Media", tone: "warning" },
  po_overdue: { label: "Alta", tone: "danger" },
  po_reminder: { label: "Baja", tone: "neutral" },
  request_update: { label: "Baja", tone: "neutral" },
  system: { label: "Media", tone: "warning" },
};

const TONE_CLASSES = {
  danger: "bg-stock-out/10 text-stock-out border-stock-out/30",
  warning: "bg-stock-low/10 text-stock-low border-stock-low/30",
  neutral: "bg-muted text-muted-foreground border-border",
};

export function ClubAlertsPanel({ alerts }: Props) {
  const rows = alerts.slice(0, 6);

  return (
    <Card className="shadow-xs">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Alertas que requieren atención</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay alertas pendientes.</p>
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((a) => {
              const p = PRIORITY[a.type];
              return (
                <li key={a.id} className="flex items-start justify-between gap-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`text-[10px] font-medium ${TONE_CLASSES[p.tone]}`}>{p.label}</Badge>
                      <span className="truncate text-sm font-medium text-foreground">{a.title}</span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{a.message}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1 text-right">
                    <span className="text-[11px] text-muted-foreground">
                      {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true, locale: es })}
                    </span>
                    <Badge variant="outline" className="text-[10px]">
                      {a.isRead ? "En revisión" : "Pendiente"}
                    </Badge>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Bell, Search, CheckCircle2 } from "lucide-react";
import { useDemo } from "@/hooks/useDemo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import type { Notification, NotificationType } from "@/types/inventory";

export const Route = createFileRoute("/app/alertas")({
  head: () => ({ meta: [{ title: "Alertas · Cannabis Club Manager" }] }),
  component: AlertasPage,
});

type Priority = "critica" | "media" | "informativa";
type AlertStatus = "abierta" | "en_revision" | "resuelta";

const TYPE_LABEL: Record<NotificationType, string> = {
  zero_stock: "Sin stock",
  low_stock: "Stock bajo",
  po_reminder: "Recordatorio",
  po_overdue: "Vencido",
  request_update: "Solicitud",
  system: "Sistema",
};

const PRIORITY_BY_TYPE: Record<NotificationType, Priority> = {
  zero_stock: "critica",
  low_stock: "media",
  po_overdue: "critica",
  po_reminder: "media",
  request_update: "informativa",
  system: "informativa",
};

const PRIORITY_LABEL: Record<Priority, string> = {
  critica: "Crítica",
  media: "Media",
  informativa: "Informativa",
};

const PRIORITY_CLASS: Record<Priority, string> = {
  critica: "bg-red-500/10 text-red-700 border-red-200",
  media: "bg-amber-500/10 text-amber-700 border-amber-200",
  informativa: "bg-sky-500/10 text-sky-700 border-sky-200",
};

const STATUS_LABEL: Record<AlertStatus, string> = {
  abierta: "Abierta",
  en_revision: "En revisión",
  resuelta: "Resuelta",
};

const STATUS_CLASS: Record<AlertStatus, string> = {
  abierta: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
  en_revision: "bg-amber-500/10 text-amber-700 border-amber-200",
  resuelta: "bg-muted text-muted-foreground border-border",
};

const RESPONSIBLES = ["admin.club", "op.lucia", "op.matias", "op.romina"];

interface AlertRow {
  id: string;
  notification: Notification;
  priority: Priority;
  status: AlertStatus;
  responsible: string;
  entity: string;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString("es-AR", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function daysUntil(iso: string): number {
  return Math.floor((new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function AlertasPage() {
  const { demoStore, version } = useDemo();
  const [resolved, setResolved] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | NotificationType>("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | Priority>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | AlertStatus>("all");
  const [selected, setSelected] = useState<AlertRow | null>(null);

  const baseRows = useMemo<AlertRow[]>(() => {
    if (!demoStore) return [];
    const notifications = demoStore.getNotifications();
    const items = demoStore.getItems();
    const itemMap = new Map(items.map((i) => [i.id, i]));
    return notifications.map((n, i) => {
      const entity = n.referenceId
        ? itemMap.get(n.referenceId)?.name ?? n.referenceId
        : "Sistema";
      return {
        id: n.id,
        notification: n,
        priority: PRIORITY_BY_TYPE[n.type] ?? "informativa",
        status: (n.isRead ? "en_revision" : "abierta") as AlertStatus,
        responsible: RESPONSIBLES[i % RESPONSIBLES.length],
        entity,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demoStore, version]);

  const rows = useMemo<AlertRow[]>(
    () => baseRows.map((r) => (resolved.has(r.id) ? { ...r, status: "resuelta" as AlertStatus } : r)),
    [baseRows, resolved],
  );

  const stats = useMemo(() => {
    if (!demoStore) return { abiertas: 0, criticas: 0, stockBajo: 0, credenciales: 0, docMedicos: 0 };
    let abiertas = 0, criticas = 0;
    for (const r of rows) {
      if (r.status !== "resuelta") abiertas++;
      if (r.priority === "critica" && r.status !== "resuelta") criticas++;
    }
    const items = demoStore.getItems();
    const stockBajo = items.filter((i) => i.currentStock > 0 && i.currentStock <= i.reorderPoint).length;
    const members = demoStore.getMembers();
    const credenciales = members.filter((m) => {
      if (!m.reprocannExpirationDate) return false;
      const d = daysUntil(m.reprocannExpirationDate);
      return d >= 0 && d <= 30;
    }).length;
    const docMedicos = members.filter((m) => {
      if (!m.medicalDocumentExpirationDate) return false;
      const d = daysUntil(m.medicalDocumentExpirationDate);
      return d >= 0 && d <= 30;
    }).length;
    return { abiertas, criticas, stockBajo, credenciales, docMedicos };
  }, [rows, demoStore]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (typeFilter !== "all" && r.notification.type !== typeFilter) return false;
      if (priorityFilter !== "all" && r.priority !== priorityFilter) return false;
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (!q) return true;
      return (
        r.notification.title.toLowerCase().includes(q) ||
        r.notification.message.toLowerCase().includes(q) ||
        r.entity.toLowerCase().includes(q)
      );
    });
  }, [rows, search, typeFilter, priorityFilter, statusFilter]);

  const cards = [
    { label: "Alertas abiertas", value: stats.abiertas },
    { label: "Alertas críticas", value: stats.criticas },
    { label: "Stock bajo", value: stats.stockBajo },
    { label: "Credenciales por vencer", value: stats.credenciales },
    { label: "Documentos médicos por vencer", value: stats.docMedicos },
  ];

  const markResolved = (row: AlertRow) => {
    setResolved((prev) => new Set(prev).add(row.id));
    toast.success(`Alerta marcada como resuelta · ${row.notification.title}`);
  };

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Alertas</h1>
        <p className="text-sm text-muted-foreground">Seguimiento de stock, cupos, documentación y eventos internos.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">{c.label}</p>
            <p className="mt-1 font-mono text-2xl font-semibold text-foreground">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="h-9 pl-8 bg-card"
              placeholder="Buscar alerta"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as typeof typeFilter)}>
            <SelectTrigger className="h-9 bg-card"><SelectValue placeholder="Tipo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              {Object.entries(TYPE_LABEL).map(([v, l]) => (
                <SelectItem key={v} value={v}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as typeof priorityFilter)}>
            <SelectTrigger className="h-9 bg-card"><SelectValue placeholder="Prioridad" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las prioridades</SelectItem>
              <SelectItem value="critica">Crítica</SelectItem>
              <SelectItem value="media">Media</SelectItem>
              <SelectItem value="informativa">Informativa</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
            <SelectTrigger className="h-9 bg-card"><SelectValue placeholder="Estado" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="abierta">Abierta</SelectItem>
              <SelectItem value="en_revision">En revisión</SelectItem>
              <SelectItem value="resuelta">Resuelta</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-border bg-card py-16 text-center">
          <Bell className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">No hay alertas que coincidan con los filtros</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[150px]">Fecha</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Prioridad</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Entidad</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Responsable</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id} className="cursor-pointer hover:bg-muted/40" onClick={() => setSelected(r)}>
                  <TableCell className="text-xs text-muted-foreground">{fmtDate(r.notification.createdAt)}</TableCell>
                  <TableCell className="text-sm">{TYPE_LABEL[r.notification.type]}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={PRIORITY_CLASS[r.priority]}>{PRIORITY_LABEL[r.priority]}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">{r.notification.title}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{r.entity}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={STATUS_CLASS[r.status]}>{STATUS_LABEL[r.status]}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{r.responsible}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSelected(r); }}>
                        Ver detalle
                      </Button>
                      {r.status !== "resuelta" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1 text-emerald-700 hover:text-emerald-800"
                          onClick={(e) => { e.stopPropagation(); markResolved(r); }}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" /> Resolver
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AlertDetailSheet
        row={selected}
        onClose={() => setSelected(null)}
        onResolve={(r) => { markResolved(r); setSelected(null); }}
      />
    </div>
  );
}

interface DetailProps {
  row: AlertRow | null;
  onClose: () => void;
  onResolve: (r: AlertRow) => void;
}

function AlertDetailSheet({ row, onClose, onResolve }: DetailProps) {
  const open = row !== null;
  if (!row) {
    return (
      <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
        <SheetContent />
      </Sheet>
    );
  }
  const n = row.notification;
  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent className="w-[420px] sm:max-w-[460px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{n.title}</SheetTitle>
          <SheetDescription>{fmtDate(n.createdAt)}</SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-4 text-sm">
          <div className="flex gap-2">
            <Badge variant="outline" className={PRIORITY_CLASS[row.priority]}>{PRIORITY_LABEL[row.priority]}</Badge>
            <Badge variant="outline" className={STATUS_CLASS[row.status]}>{STATUS_LABEL[row.status]}</Badge>
          </div>

          <Row label="Tipo" value={TYPE_LABEL[n.type]} />
          <Row label="Entidad" value={row.entity} />
          <Row label="Responsable" value={row.responsible} mono />

          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Mensaje</p>
            <p className="text-foreground">{n.message}</p>
          </div>

          <div className="rounded-md border border-sky-300 bg-sky-50 px-3 py-2 text-xs text-sky-800">
            El envío real de avisos (email, WhatsApp) se habilitará cuando exista backend.
          </div>

          {row.status !== "resuelta" && (
            <Button className="w-full gap-1.5" onClick={() => onResolve(row)}>
              <CheckCircle2 className="h-4 w-4" /> Marcar como resuelta
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className={mono ? "font-mono text-xs" : ""}>{value}</span>
    </div>
  );
}

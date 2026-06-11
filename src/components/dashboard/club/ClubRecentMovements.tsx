import { useEffect, useMemo, useState, type ReactNode } from "react";
import { format } from "date-fns";
import { ChevronDown, ChevronUp, ChevronsUpDown, Expand, Eye, EyeOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Item, StockMovement } from "@/types/inventory";
import { MovementType } from "@/types/inventory";

interface Props {
  movements: StockMovement[];
  items: Item[];
}

const TYPE_LABEL: Record<MovementType, string> = {
  [MovementType.Received]: "Cosecha - Entrada",
  [MovementType.Shipped]: "Dispensa",
  [MovementType.Adjusted]: "Ajuste - Merma",
  [MovementType.Transferred]: "Traslado",
};

type SortKey = "fecha" | "tipo" | "producto" | "cantidad" | "responsable";
type SortDir = "asc" | "desc";

type MovementRow = {
  movement: StockMovement;
  item: Item | undefined;
  fecha: number;
  tipo: string;
  producto: string;
  cantidad: number;
  responsable: string;
};

type MovementFilters = {
  producto: string;
  tipo: string;
  responsable: string;
  fechaDesde: string;
  fechaHasta: string;
  cantidadMin: string;
  cantidadMax: string;
};

const EMPTY_FILTERS: MovementFilters = {
  producto: "",
  tipo: "",
  responsable: "",
  fechaDesde: "",
  fechaHasta: "",
  cantidadMin: "",
  cantidadMax: "",
};

function compareValues(a: unknown, b: unknown) {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b), "es", { sensitivity: "base", numeric: true });
}

export function ClubRecentMovements({ movements, items }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("fecha");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [showQuantity, setShowQuantity] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [filters, setFilters] = useState<MovementFilters>(EMPTY_FILTERS);

  const itemMap = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);

  useEffect(() => {
    if (!showQuantity && sortKey === "cantidad") {
      setSortKey("fecha");
      setSortDir("desc");
    }
  }, [showQuantity, sortKey]);

  function handleSort(key: SortKey) {
    if (!showQuantity && key === "cantidad") return;
    if (sortKey === key) {
      setSortDir((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDir(key === "fecha" ? "desc" : "asc");
  }

  const allRows = useMemo<MovementRow[]>(() => {
    return movements
      .map((movement) => {
        const item = itemMap.get(movement.itemId);
        const cantidad = Math.abs(movement.quantity);
        return {
          movement,
          item,
          fecha: new Date(movement.createdAt).getTime(),
          tipo: TYPE_LABEL[movement.type],
          producto: item?.name ?? "",
          cantidad,
          responsable: movement.performedBy,
        };
      })
  }, [itemMap, movements]);

  const latestRows = useMemo(() => sortRows(allRows, "fecha", "desc").slice(0, 8), [allRows]);
  const rows = useMemo(() => sortRows(latestRows, sortKey, sortDir), [latestRows, sortDir, sortKey]);
  const sortedExpandedRows = useMemo(() => sortRows(allRows, sortKey, sortDir), [allRows, sortDir, sortKey]);

  const expandedRows = useMemo(() => {
    const producto = filters.producto.trim().toLowerCase();
    const tipo = filters.tipo.trim().toLowerCase();
    const responsable = filters.responsable.trim().toLowerCase();
    const desde = filters.fechaDesde ? new Date(`${filters.fechaDesde}T00:00:00`).getTime() : null;
    const hasta = filters.fechaHasta ? new Date(`${filters.fechaHasta}T23:59:59`).getTime() : null;
    const min = filters.cantidadMin ? Number(filters.cantidadMin) : null;
    const max = filters.cantidadMax ? Number(filters.cantidadMax) : null;

    return sortedExpandedRows.filter((row) => {
      if (producto && !row.producto.toLowerCase().includes(producto)) return false;
      if (tipo && !row.tipo.toLowerCase().includes(tipo)) return false;
      if (responsable && !row.responsable.toLowerCase().includes(responsable)) return false;
      if (desde !== null && row.fecha < desde) return false;
      if (hasta !== null && row.fecha > hasta) return false;
      if (min !== null && Number.isFinite(min) && row.cantidad < min) return false;
      if (max !== null && Number.isFinite(max) && row.cantidad > max) return false;
      return true;
    });
  }, [filters, sortedExpandedRows]);

  return (
    <>
    <Card className="shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle className="text-base font-semibold">Ultimos movimientos</CardTitle>
        <Button variant="outline" size="sm" className="gap-2" onClick={() => setExpanded(true)}>
          <Expand className="h-4 w-4" />
          Expandir
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <MovementsTable rows={rows} sortKey={sortKey} sortDir={sortDir} showQuantity={showQuantity} onSort={handleSort} onToggleQuantity={() => setShowQuantity((current) => !current)} />
      </CardContent>
    </Card>
    <Dialog open={expanded} onOpenChange={setExpanded}>
      <DialogContent className="max-h-[88vh] max-w-6xl overflow-hidden p-0">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle>Movimientos completos</DialogTitle>
          <DialogDescription>Filtra y ordena el historial completo de movimientos.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 overflow-y-auto px-6 py-4">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Input placeholder="Producto" value={filters.producto} onChange={(e) => setFilters((current) => ({ ...current, producto: e.target.value }))} />
            <Input placeholder="Tipo" value={filters.tipo} onChange={(e) => setFilters((current) => ({ ...current, tipo: e.target.value }))} />
            <Input placeholder="Responsable" value={filters.responsable} onChange={(e) => setFilters((current) => ({ ...current, responsable: e.target.value }))} />
            <div className="flex gap-2">
              <Input type="number" placeholder="Cant. min" value={filters.cantidadMin} onChange={(e) => setFilters((current) => ({ ...current, cantidadMin: e.target.value }))} />
              <Input type="number" placeholder="Cant. max" value={filters.cantidadMax} onChange={(e) => setFilters((current) => ({ ...current, cantidadMax: e.target.value }))} />
            </div>
            <Input type="date" value={filters.fechaDesde} onChange={(e) => setFilters((current) => ({ ...current, fechaDesde: e.target.value }))} />
            <Input type="date" value={filters.fechaHasta} onChange={(e) => setFilters((current) => ({ ...current, fechaHasta: e.target.value }))} />
            <Button variant="outline" onClick={() => setFilters(EMPTY_FILTERS)}>Limpiar filtros</Button>
            <div className="flex items-center text-sm text-muted-foreground">{expandedRows.length} movimientos</div>
          </div>
          <div className="overflow-x-auto rounded-md border">
            <MovementsTable rows={expandedRows} sortKey={sortKey} sortDir={sortDir} showQuantity={showQuantity} onSort={handleSort} onToggleQuantity={() => setShowQuantity((current) => !current)} compact={false} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}

function sortRows(rows: MovementRow[], sortKey: SortKey, sortDir: SortDir) {
  return [...rows].sort((a, b) => {
    const result = compareValues(a[sortKey], b[sortKey]);
    return sortDir === "asc" ? result : -result;
  });
}

function MovementsTable({
  rows,
  sortKey,
  sortDir,
  showQuantity,
  onSort,
  onToggleQuantity,
  compact = true,
}: {
  rows: MovementRow[];
  sortKey: SortKey;
  sortDir: SortDir;
  showQuantity: boolean;
  onSort: (key: SortKey) => void;
  onToggleQuantity: () => void;
  compact?: boolean;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <SortableHead className="pl-6" label="Fecha" sortKey="fecha" activeKey={sortKey} dir={sortDir} onSort={onSort} />
          <SortableHead label="Tipo" sortKey="tipo" activeKey={sortKey} dir={sortDir} onSort={onSort} />
          <SortableHead label="Producto" sortKey="producto" activeKey={sortKey} dir={sortDir} onSort={onSort} />
          <SortableHead
            className="text-right"
            label={
              <span className="inline-flex items-center gap-2">
                Cantidad
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  title={showQuantity ? "Ocultar cantidad" : "Mostrar cantidad"}
                  onClick={(event) => {
                    event.stopPropagation();
                    onToggleQuantity();
                  }}
                >
                  {showQuantity ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                </Button>
              </span>
            }
            sortKey="cantidad"
            activeKey={sortKey}
            dir={sortDir}
            onSort={onSort}
            disabled={!showQuantity}
          />
          <SortableHead className="pr-6" label="Responsable" sortKey="responsable" activeKey={sortKey} dir={sortDir} onSort={onSort} />
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">No hay movimientos para mostrar.</TableCell>
          </TableRow>
        ) : rows.map(({ movement, item, cantidad }) => (
          <TableRow key={movement.id}>
            <TableCell className="pl-6 text-xs text-muted-foreground">
              {format(new Date(movement.createdAt), compact ? "dd/MM HH:mm" : "dd/MM/yyyy HH:mm")}
            </TableCell>
            <TableCell>
              <Badge variant="outline" className="text-[10px]">{TYPE_LABEL[movement.type]}</Badge>
            </TableCell>
            <TableCell className="max-w-[220px] truncate text-sm">{item?.name ?? "-"}</TableCell>
            <TableCell className="text-right font-mono text-sm">
              {showQuantity ? `${cantidad} ${item?.unit ?? ""}` : <span className="font-sans text-xs text-muted-foreground">Oculta</span>}
            </TableCell>
            <TableCell className="pr-6 text-xs text-muted-foreground">{movement.performedBy}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function SortableHead({
  label,
  sortKey,
  activeKey,
  dir,
  onSort,
  className,
  disabled = false,
}: {
  label: ReactNode;
  sortKey: SortKey;
  activeKey: SortKey;
  dir: SortDir;
  onSort: (key: SortKey) => void;
  className?: string;
  disabled?: boolean;
}) {
  const active = activeKey === sortKey;
  const alignRight = className?.includes("text-right");

  return (
    <TableHead
      className={`${disabled ? "cursor-default" : "cursor-pointer"} select-none ${className ?? ""}`}
      onClick={() => !disabled && onSort(sortKey)}
    >
      <span className={`inline-flex items-center gap-1 ${alignRight ? "justify-end" : ""}`}>
        {label}
        {!disabled && (
          active
            ? dir === "asc"
              ? <ChevronUp className="h-3 w-3 shrink-0" />
              : <ChevronDown className="h-3 w-3 shrink-0" />
            : <ChevronsUpDown className="h-3 w-3 shrink-0 opacity-30" />
        )}
      </span>
    </TableHead>
  );
}

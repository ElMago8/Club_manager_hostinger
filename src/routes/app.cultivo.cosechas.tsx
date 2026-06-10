import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { Pencil, Plus, Trash2, Wheat } from "lucide-react";
import { DeleteConfirmDialog } from "@/components/cultivation/DeleteConfirmDialog";
import { CultivationStatusMessage } from "@/components/cultivation/RelationshipWarning";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useSortable } from "@/hooks/useSortable";
import { SortHead } from "@/components/ui/sort-head";
import { deleteHarvest, getHarvests } from "@/services/harvestService";
import type { Harvest, HarvestStatus } from "@/types/cultivation";

export const Route = createFileRoute("/app/cultivo/cosechas")({
  head: () => ({ meta: [{ title: "Cosechas · Cannabis Club Manager" }] }),
  component: HarvestsPage,
});

const STATUS_CLASS: Record<HarvestStatus, string> = {
  registrada:        "border-sky-200 bg-sky-500/10 text-sky-700",
  en_secado:         "border-amber-200 bg-amber-500/10 text-amber-700",
  seca:              "border-lime-200 bg-lime-500/10 text-lime-700",
  en_curado:         "border-violet-200 bg-violet-500/10 text-violet-700",
  lista_para_stock:  "border-emerald-200 bg-emerald-500/10 text-emerald-700",
  descartada:        "border-muted bg-muted text-muted-foreground",
};

const STATUS_LABEL: Record<HarvestStatus, string> = {
  registrada:        "Registrada",
  en_secado:         "En secado",
  seca:              "Seca",
  en_curado:         "En curado",
  lista_para_stock:  "Stock",
  descartada:        "Descartada",
};

function fmt(n?: number) {
  if (n == null) return "—";
  return n >= 1000 ? `${(n / 1000).toFixed(2)} kg` : `${n} g`;
}

function pct(wet?: number, dry?: number) {
  if (!wet || !dry) return "—";
  return `${((dry / wet) * 100).toFixed(1)}%`;
}

function HarvestsPage() {
  const location = useLocation();
  const [harvests, setHarvests] = useState<Harvest[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteTarget, setDeleteTarget] = useState<Harvest | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      setHarvests(await getHarvests());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [location.pathname]);

  const filtered = useMemo(() => {
    if (statusFilter === "all") return harvests;
    return harvests.filter((h) => h.status === statusFilter);
  }, [harvests, statusFilter]);

  const { sorted, col: sCol, dir: sDir, toggle: sort } = useSortable(filtered);

  const totalDryGrams = harvests.reduce((sum, h) => sum + (h.dryWeightGrams ?? 0), 0);

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteHarvest(deleteTarget.id);
      setMessage("Cosecha eliminada.");
      setDeleteTarget(null);
      await load();
    } catch (e: unknown) {
      setMessage(e instanceof Error ? e.message : "Error al eliminar.");
      setDeleteTarget(null);
    }
  }

  const countByStatus = (s: HarvestStatus) => harvests.filter((h) => h.status === s).length;

  const isSubRoute = location.pathname !== "/app/cultivo/cosechas";

  return (
    <>
      <Outlet />
      {!isSubRoute && (
        <div className="mx-auto max-w-[1400px] space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight">Cosechas</h1>
              <p className="text-sm text-muted-foreground">Registro y seguimiento de cosechas por lote.</p>
            </div>
            <Button asChild>
              <Link to="/app/cultivo/cosechas/nueva">
                <Plus className="mr-2 h-4 w-4" />
                Nueva cosecha
              </Link>
            </Button>
          </div>

          {message && <CultivationStatusMessage message={message} />}

          {/* Tarjetas de estadísticas */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{harvests.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">En secado</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-amber-600">{countByStatus("en_secado")}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">En curado</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-violet-600">{countByStatus("en_curado")}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Listas para stock</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-emerald-600">{countByStatus("lista_para_stock")}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Peso seco total</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{fmt(totalDryGrams)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Filtro */}
          <div className="flex items-center gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="registrada">Registrada</SelectItem>
                <SelectItem value="en_secado">En secado</SelectItem>
                <SelectItem value="seca">Seca</SelectItem>
                <SelectItem value="en_curado">En curado</SelectItem>
                <SelectItem value="lista_para_stock">Stock</SelectItem>
                <SelectItem value="descartada">Descartada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tabla */}
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
                  Cargando cosechas...
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
                  <Wheat className="h-8 w-8 opacity-40" />
                  <p className="text-sm">No hay cosechas registradas.</p>
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/app/cultivo/cosechas/nueva">Registrar primera cosecha</Link>
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <SortHead label="Código"       sortKey="code"            col={sCol} dir={sDir} onSort={sort} />
                        <SortHead label="Lote"         sortKey="batchCode"       col={sCol} dir={sDir} onSort={sort} />
                        <SortHead label="Genética"     sortKey="geneticsName"    col={sCol} dir={sDir} onSort={sort} />
                        <SortHead label="Sala"         sortKey="roomName"        col={sCol} dir={sDir} onSort={sort} />
                        <SortHead label="Fecha"        sortKey="harvestDate"     col={sCol} dir={sDir} onSort={sort} />
                        <SortHead label="Peso húmedo"  sortKey="wetWeightGrams"  col={sCol} dir={sDir} onSort={sort} className="text-right" />
                        <SortHead label="Peso seco"    sortKey="dryWeightGrams"  col={sCol} dir={sDir} onSort={sort} className="text-right" />
                        <TableHead className="text-right">Merma</TableHead>
                        <TableHead className="text-right">Rendimiento</TableHead>
                        <SortHead label="Estado"       sortKey="status"          col={sCol} dir={sDir} onSort={sort} />
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sorted.map((h) => (
                        <TableRow key={h.id}>
                          <TableCell className="font-mono font-medium">{h.code}</TableCell>
                          <TableCell>{h.batchCode ?? "—"}</TableCell>
                          <TableCell>{h.geneticsName ?? "—"}</TableCell>
                          <TableCell>{h.roomName ?? "—"}</TableCell>
                          <TableCell className="whitespace-nowrap">{h.harvestDate}</TableCell>
                          <TableCell className="text-right font-mono">{fmt(h.wetWeightGrams)}</TableCell>
                          <TableCell className="text-right font-mono">{fmt(h.dryWeightGrams)}</TableCell>
                          <TableCell className="text-right font-mono">{fmt(h.shrinkageGrams)}</TableCell>
                          <TableCell className="text-right font-mono">{pct(h.wetWeightGrams, h.dryWeightGrams)}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={STATUS_CLASS[h.status]}>
                              {STATUS_LABEL[h.status]}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" asChild>
                                <Link to="/app/cultivo/cosechas/nueva" search={{ edit: h.id }}>
                                  <Pencil className="h-4 w-4" />
                                </Link>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive"
                                onClick={() => setDeleteTarget(h)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <DeleteConfirmDialog
            open={!!deleteTarget}
            entityLabel="cosecha"
            itemName={deleteTarget?.code}
            onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
            onConfirm={handleDelete}
          />
        </div>
      )}
    </>
  );
}

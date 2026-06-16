import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { MoreVertical, Package, Pencil, Plus, Scale, StopCircle, Timer, Trash2, Wheat, Wind } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DeleteConfirmDialog } from "@/components/cultivation/DeleteConfirmDialog";
import { CultivationStatusMessage } from "@/components/cultivation/RelationshipWarning";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useSortable } from "@/hooks/useSortable";
import { SortHead } from "@/components/ui/sort-head";
import { deleteHarvest, getHarvests } from "@/services/harvestService";
import { apiRequest } from "@/services/cultivationApi";
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

function elapsedLabel(startIso: string, now: number): string {
  const ms = now - new Date(startIso).getTime();
  if (ms < 0) return "0h";
  const totalHours = Math.floor(ms / 3_600_000);
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  return days > 0 ? `${days}d ${hours}h` : `${totalHours}h`;
}

function HarvestsPage() {
  const location = useLocation();
  const [harvests, setHarvests] = useState<Harvest[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteTarget, setDeleteTarget] = useState<Harvest | null>(null);
  const [stopTarget, setStopTarget] = useState<Harvest | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(interval);
  }, []);

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

  async function handleStopCounter(h: Harvest) {
    const field = h.status === "en_secado" ? "secadoInicioEn" : "curadoInicioEn";
    await apiRequest(`/cultivation/harvests/${h.id}`, {
      method: "PUT",
      body: JSON.stringify({ [field]: null }),
    });
    setStopTarget(null);
    await load();
  }

  async function handleStartCounter(h: Harvest) {
    const field = h.status === "en_secado" ? "secadoInicioEn" : "curadoInicioEn";
    await apiRequest(`/cultivation/harvests/${h.id}`, {
      method: "PUT",
      body: JSON.stringify({ [field]: new Date().toISOString() }),
    });
    await load();
  }

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
              <Link to="/app/cultivo/cosechas/nueva" search={{ edit: undefined }}>
                <Plus className="mr-2 h-4 w-4" />
                Nueva cosecha
              </Link>
            </Button>
          </div>

          {message && <CultivationStatusMessage message={message} />}

          {/* Tarjetas de estadísticas */}
          <div className="rounded-xl border border-border bg-card p-3 shadow-xs">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {([
                { label: "Total",          value: harvests.length,                Icon: Wheat,    accent: "bg-slate-500",  panel: "bg-slate-500/10",  iconClass: "text-slate-600 dark:text-slate-400" },
                { label: "En secado",      value: countByStatus("en_secado"),     Icon: Wind,     accent: "bg-amber-500",  panel: "bg-amber-500/10",  iconClass: "text-amber-600 dark:text-amber-400" },
                { label: "En curado",      value: countByStatus("en_curado"),     Icon: Timer,    accent: "bg-violet-500", panel: "bg-violet-500/10", iconClass: "text-violet-600 dark:text-violet-400" },
                { label: "Stock",          value: countByStatus("lista_para_stock"), Icon: Package, accent: "bg-emerald-500", panel: "bg-emerald-500/10", iconClass: "text-emerald-600 dark:text-emerald-400" },
                { label: "Peso seco total", value: fmt(totalDryGrams),            Icon: Scale,    accent: "bg-teal-500",   panel: "bg-teal-500/10",   iconClass: "text-teal-600 dark:text-teal-400" },
              ] as const).map(({ label, value, Icon, accent, panel, iconClass }) => (
                <div key={label} className={`relative overflow-hidden rounded-lg ${panel} px-5 py-4`}>
                  <span className={`absolute left-0 top-3 h-[calc(100%-1.5rem)] w-1 rounded-r-full ${accent}`} />
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{label}</p>
                      <p className="mt-2 font-mono text-3xl font-semibold leading-none text-foreground">{value}</p>
                    </div>
                    <Icon className={`mt-1 h-5 w-5 shrink-0 ${iconClass}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Filtro */}
          <div className="flex items-center gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
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
                    <Link to="/app/cultivo/cosechas/nueva" search={{ edit: undefined }}>Registrar primera cosecha</Link>
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto [&_td]:text-center [&_th]:text-center">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <SortHead label="Código"       sortKey="code"            col={sCol} dir={sDir} onSort={sort} />
                        <SortHead label="Lote"         sortKey="batchCode"       col={sCol} dir={sDir} onSort={sort} />
                        <SortHead label="Genética"     sortKey="geneticsName"    col={sCol} dir={sDir} onSort={sort} />
                        <SortHead label="Sala"         sortKey="roomName"        col={sCol} dir={sDir} onSort={sort} />
                        <SortHead label="Entorno"      sortKey="cultivationType" col={sCol} dir={sDir} onSort={sort} />
                        <SortHead label="Tipo cultivo" sortKey="growMedium"      col={sCol} dir={sDir} onSort={sort} />
                        <SortHead label="Fecha"        sortKey="harvestDate"     col={sCol} dir={sDir} onSort={sort} />
                        <SortHead label="Peso húmedo"  sortKey="wetWeightGrams"  col={sCol} dir={sDir} onSort={sort} className="text-right" />
                        <SortHead label="Peso seco"    sortKey="dryWeightGrams"  col={sCol} dir={sDir} onSort={sort} className="text-right" />
                        <TableHead className="text-right">Merma</TableHead>
                        <SortHead label="Estado"       sortKey="status"          col={sCol} dir={sDir} onSort={sort} />
                        <TableHead>Tiempo Transcurrido</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sorted.map((h) => (
                        <TableRow key={h.id}>
                          <TableCell className="font-mono font-medium">{h.code}</TableCell>
                          <TableCell>{h.batchCode ?? "—"}</TableCell>
                          <TableCell>{h.geneticsName ?? "—"}</TableCell>
                          <TableCell>{h.roomName ?? "—"}</TableCell>
                          <TableCell>{h.cultivationType ?? "—"}</TableCell>
                          <TableCell>{h.growMedium ?? "—"}</TableCell>
                          <TableCell className="whitespace-nowrap">{h.harvestDate}</TableCell>
                          <TableCell className="text-right font-mono">{fmt(h.wetWeightGrams)}</TableCell>
                          <TableCell className="text-right font-mono">{fmt(h.dryWeightGrams)}</TableCell>
                          <TableCell className="text-right font-mono">{fmt(h.shrinkageGrams)}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={STATUS_CLASS[h.status]}>
                              {STATUS_LABEL[h.status]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {h.status === "en_secado" || h.status === "en_curado" ? (
                              (() => {
                                const start = h.status === "en_secado" ? h.secadoInicioEn : h.curadoInicioEn;
                                return start
                                  ? (
                                    <div className="flex items-center justify-center gap-1.5">
                                      <span className="font-mono text-sm">{elapsedLabel(start, now)}</span>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 w-6 cursor-pointer p-0 text-muted-foreground hover:text-destructive"
                                        onClick={() => setStopTarget(h)}
                                      >
                                        <StopCircle className="h-3.5 w-3.5" />
                                      </Button>
                                    </div>
                                  )
                                  : <Button size="sm" variant="outline" className="h-7 cursor-pointer text-xs" onClick={() => void handleStartCounter(h)}>Iniciar</Button>;
                              })()
                            ) : "—"}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link to="/app/cultivo/cosechas/nueva" search={{ edit: h.id }}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Editar
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteTarget(h)}>
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Eliminar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
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

          <Dialog open={!!stopTarget} onOpenChange={(open) => { if (!open) setStopTarget(null); }}>
            <DialogContent className="sm:max-w-[380px]">
              <DialogHeader>
                <DialogTitle>Detener contador</DialogTitle>
                <DialogDescription>
                  ¿Detener el contador de {stopTarget?.code}? Se perderá el tiempo registrado y podrás iniciarlo nuevamente.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setStopTarget(null)}>Cancelar</Button>
                <Button variant="destructive" onClick={() => stopTarget && void handleStopCounter(stopTarget)}>
                  <StopCircle className="mr-2 h-4 w-4" />
                  Detener
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </>
  );
}

import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { Eye, MoreVertical, Plus } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SortHead } from "@/components/ui/sort-head";
import { useSortable } from "@/hooks/useSortable";
import { getClonadores } from "@/services/growBedService";
import { getGrowRooms } from "@/services/growRoomService";
import { getMeasurements } from "@/services/measurementService";
import type { BedStatus, CultivationMeasurement, GrowBed, GrowRoom, MeasurementStatus } from "@/types/cultivation";

export const Route = createFileRoute("/app/cultivo/clonador")({
  head: () => ({ meta: [{ title: "Clonadores · Cannabis Club Manager" }] }),
  component: ClonadoresPage,
});

const STATUS_LABEL: Record<BedStatus, string> = {
  vacia: "Vacío",
  activa: "Activo",
  limpieza: "Limpieza",
  mantenimiento: "Mantenimiento",
  fuera_de_uso: "Fuera de uso",
};

const STATUS_CLASS: Record<BedStatus, string> = {
  vacia: "border-muted bg-muted text-muted-foreground",
  activa: "border-emerald-200 bg-emerald-500/10 text-emerald-700",
  limpieza: "border-sky-200 bg-sky-500/10 text-sky-700",
  mantenimiento: "border-amber-200 bg-amber-500/10 text-amber-700",
  fuera_de_uso: "border-red-200 bg-red-500/10 text-red-700",
};

const PARAM_STATUS_CLASS: Record<MeasurementStatus, string> = {
  normal: "border-emerald-200 bg-emerald-500/10 text-emerald-700",
  observation: "border-sky-200 bg-sky-500/10 text-sky-700",
  alert: "border-amber-200 bg-amber-500/10 text-amber-700",
  critical: "border-red-200 bg-red-500/10 text-red-700",
};

function ClonadoresPage() {
  const location = useLocation();
  const [clonadores, setClonadores] = useState<GrowBed[]>([]);
  const [rooms, setRooms] = useState<GrowRoom[]>([]);
  const [measurements, setMeasurements] = useState<CultivationMeasurement[]>([]);
  const [roomId, setRoomId] = useState("all");
  const [status, setStatus] = useState<"all" | BedStatus>("all");
  const [capacity, setCapacity] = useState("");
  const [occupancy, setOccupancy] = useState<"all" | "with_plants" | "empty">("all");
  const [showSubstratePH, setShowSubstratePH] = useState(false);
  const [showSubstratePPM, setShowSubstratePPM] = useState(false);
  const [showLiquidPH, setShowLiquidPH] = useState(false);
  const [showLiquidPPM, setShowLiquidPPM] = useState(false);

  useEffect(() => {
    void Promise.all([getClonadores(), getGrowRooms(), getMeasurements()]).then(([nextClonadores, nextRooms, nextMeasurements]) => {
      setClonadores(nextClonadores);
      setRooms(nextRooms);
      setMeasurements(nextMeasurements);
    });
  }, []);

  const filtered = useMemo(() => {
    const minCap = Number(capacity);
    return clonadores.filter((c) => {
      if (roomId !== "all" && c.roomId !== roomId) return false;
      if (status !== "all" && c.status !== status) return false;
      if (capacity && Number.isFinite(minCap) && c.maxPlants < minCap) return false;
      if (occupancy === "with_plants" && c.currentPlants <= 0) return false;
      if (occupancy === "empty" && c.currentPlants > 0) return false;
      return true;
    });
  }, [clonadores, capacity, occupancy, roomId, status]);

  function roomName(id: string) {
    return rooms.find((r) => r.id === id)?.name ?? id;
  }

  const flat = useMemo(() => filtered.map((c) => ({ ...c, _roomName: roomName(c.roomId) })), [filtered, rooms]);
  const { sorted, col: sCol, dir: sDir, toggle: sort } = useSortable(flat);

  function latestMeasurement(clonadorId: string) {
    return measurements.find((m) => m.clonadorId === clonadorId);
  }

  if (location.pathname !== "/app/cultivo/clonador") return <Outlet />;

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Clonadores</h1>
          <p className="text-sm text-muted-foreground">
            Gestión de clonadores: capacidad, esquejes y envío a camillas.
          </p>
        </header>
        <Button asChild className="gap-2">
          <Link to="/app/cultivo/clonador/nueva" search={{ edit: undefined }}>
            <Plus className="h-4 w-4" />
            Nuevo clonador
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Filtrá clonadores por sala, estado, capacidad u ocupación.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            <Select value={roomId} onValueChange={setRoomId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las salas</SelectItem>
                {rooms.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={(v) => setStatus(v as "all" | BedStatus)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="vacia">Vacío</SelectItem>
                <SelectItem value="activa">Activo</SelectItem>
                <SelectItem value="limpieza">Limpieza</SelectItem>
                <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                <SelectItem value="fuera_de_uso">Fuera de uso</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="number" min={0} max={60}
              placeholder="Capacidad mínima"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
            />
            <Select value={occupancy} onValueChange={(v) => setOccupancy(v as typeof occupancy)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="with_plants">Con esquejes</SelectItem>
                <SelectItem value="empty">Vacíos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-sm text-muted-foreground">Columnas de mediciones:</span>
            {([
              ["showSubstratePH", "PH sustrato", showSubstratePH, setShowSubstratePH],
              ["showSubstratePPM", "PPM sustrato", showSubstratePPM, setShowSubstratePPM],
              ["showLiquidPH", "PH líquido", showLiquidPH, setShowLiquidPH],
              ["showLiquidPPM", "PPM líquido", showLiquidPPM, setShowLiquidPPM],
            ] as [string, string, boolean, (v: boolean) => void][]).map(([id, label, checked, setter]) => (
              <div key={id} className="flex items-center gap-2">
                <Checkbox id={id} checked={checked} onCheckedChange={(v) => setter(Boolean(v))} />
                <Label htmlFor={id} className="cursor-pointer text-sm">{label}</Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Listado de clonadores</CardTitle>
          <CardDescription>{sorted.length} clonador{sorted.length !== 1 ? "es" : ""} encontrado{sorted.length !== 1 ? "s" : ""}.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border [&_td]:text-center [&_th]:text-center">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortHead label="Nombre"             sortKey="name"              col={sCol} dir={sDir} onSort={sort} />
                  <SortHead label="Código"             sortKey="code"              col={sCol} dir={sDir} onSort={sort} />
                  <SortHead label="Sala"               sortKey="_roomName"         col={sCol} dir={sDir} onSort={sort} />
                  <SortHead label="Estado"             sortKey="status"            col={sCol} dir={sDir} onSort={sort} />
                  <SortHead label="Cap. máxima"        sortKey="maxPlants"         col={sCol} dir={sDir} onSort={sort} />
                  <SortHead label="Esquejes actuales"  sortKey="currentPlants"     col={sCol} dir={sDir} onSort={sort} />
                  {showSubstratePH && <TableHead>PH sustrato</TableHead>}
                  {showSubstratePPM && <TableHead>PPM sustrato</TableHead>}
                  {showLiquidPH && <TableHead>PH líquido</TableHead>}
                  {showLiquidPPM && <TableHead>PPM líquido</TableHead>}
                  <SortHead label="Responsable"        sortKey="responsibleUserId" col={sCol} dir={sDir} onSort={sort} />
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8 + (showSubstratePH ? 1 : 0) + (showSubstratePPM ? 1 : 0) + (showLiquidPH ? 1 : 0) + (showLiquidPPM ? 1 : 0)} className="py-10 text-muted-foreground">
                      No hay clonadores registrados.
                    </TableCell>
                  </TableRow>
                ) : sorted.map((c) => {
                  const latest = latestMeasurement(c.id);
                  return (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell className="font-mono text-xs">{c.code}</TableCell>
                      <TableCell>{roomName(c.roomId)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={STATUS_CLASS[c.status]}>
                          {STATUS_LABEL[c.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{c.maxPlants}</TableCell>
                      <TableCell className="font-mono text-xs">{c.currentPlants}</TableCell>
                      {showSubstratePH && <TableCell className="font-mono text-xs">{latest?.substratePH ?? "-"}</TableCell>}
                      {showSubstratePPM && <TableCell className="font-mono text-xs">{latest?.substratePPM ?? "-"}</TableCell>}
                      {showLiquidPH && <TableCell className="font-mono text-xs">{latest?.liquidPH ?? "-"}</TableCell>}
                      {showLiquidPPM && <TableCell className="font-mono text-xs">{latest?.liquidPPM ?? "-"}</TableCell>}
                      <TableCell>{c.responsibleUserId ?? "Sin asignar"}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link to="/app/cultivo/clonador/$id" params={{ id: c.id }}>
                                <Eye className="mr-2 h-4 w-4" />
                                Ver detalles
                              </Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

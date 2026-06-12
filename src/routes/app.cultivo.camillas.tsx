import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { Eye, MoreVertical, Plus } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useSortable } from "@/hooks/useSortable";
import { SortHead } from "@/components/ui/sort-head";
import { getGrowBeds } from "@/services/growBedService";
import { getGrowRooms } from "@/services/growRoomService";
import { getMeasurements } from "@/services/measurementService";
import type { BedStatus, CultivationMeasurement, GrowBed, GrowRoom, MeasurementStatus } from "@/types/cultivation";

export const Route = createFileRoute("/app/cultivo/camillas")({
  head: () => ({ meta: [{ title: "Camillas · Cannabis Club Manager" }] }),
  component: GrowBedsPage,
});

const STATUS_LABEL: Record<BedStatus, string> = {
  vacia: "Vacia",
  activa: "Activa",
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

const MEASUREMENT_COLUMNS = [
  { key: "substratePH", label: "PH sustrato", getValue: (item?: CultivationMeasurement) => item?.substratePH },
  { key: "substratePPM", label: "PPM sustrato", getValue: (item?: CultivationMeasurement) => item?.substratePPM },
  { key: "liquidPH", label: "PH liquido", getValue: (item?: CultivationMeasurement) => item?.liquidPH },
  { key: "liquidPPM", label: "PPM liquido", getValue: (item?: CultivationMeasurement) => item?.liquidPPM },
  { key: "runoffPH", label: "PH drenaje", getValue: (item?: CultivationMeasurement) => item?.runoffPH },
  { key: "runoffPPM", label: "PPM drenaje", getValue: (item?: CultivationMeasurement) => item?.runoffPPM },
] as const;

type MeasurementColumnKey = typeof MEASUREMENT_COLUMNS[number]["key"];

function splitMeasurementLabel(label: string) {
  const [first, ...rest] = label.split(" ");
  return { first, second: rest.join(" ") };
}

function GrowBedsPage() {
  const location = useLocation();
  const [beds, setBeds] = useState<GrowBed[]>([]);
  const [rooms, setRooms] = useState<GrowRoom[]>([]);
  const [measurements, setMeasurements] = useState<CultivationMeasurement[]>([]);
  const [roomId, setRoomId] = useState("all");
  const [status, setStatus] = useState<"all" | BedStatus>("all");
  const [capacity, setCapacity] = useState("");
  const [occupancy, setOccupancy] = useState<"all" | "with_plants" | "empty">("all");
  const [visibleMeasurementColumns, setVisibleMeasurementColumns] = useState<MeasurementColumnKey[]>([
    "substratePH",
    "substratePPM",
    "liquidPH",
    "liquidPPM",
    "runoffPH",
    "runoffPPM",
  ]);

  useEffect(() => {
    void Promise.all([getGrowBeds(), getGrowRooms(), getMeasurements()]).then(([nextBeds, nextRooms, nextMeasurements]) => {
      setBeds(nextBeds);
      setRooms(nextRooms);
      setMeasurements(nextMeasurements);
    });
  }, []);

  const filteredBeds = useMemo(() => {
    const minCapacity = Number(capacity);
    return beds.filter((bed) => {
      if (roomId !== "all" && bed.roomId !== roomId) return false;
      if (status !== "all" && bed.status !== status) return false;
      if (capacity && Number.isFinite(minCapacity) && bed.maxPlants < minCapacity) return false;
      if (occupancy === "with_plants" && bed.currentPlants <= 0) return false;
      if (occupancy === "empty" && bed.currentPlants > 0) return false;
      return true;
    });
  }, [beds, capacity, occupancy, roomId, status]);

  function roomName(id: string): string {
    return rooms.find((room) => room.id === id)?.name ?? id;
  }

  const flatBeds = useMemo(() => filteredBeds.map((b) => ({
    ...b,
    _roomName: roomName(b.roomId),
  })), [filteredBeds, rooms]);

  const { sorted, col: sCol, dir: sDir, toggle: sort } = useSortable(flatBeds);

  function latestBedMeasurement(bedId: string) {
    return measurements.find((item) => item.bedId === bedId);
  }

  function toggleMeasurementColumn(key: MeasurementColumnKey, checked: boolean) {
    setVisibleMeasurementColumns((current) =>
      checked ? [...current, key] : current.filter((item) => item !== key),
    );
  }

  if (location.pathname !== "/app/cultivo/camillas") {
    return <Outlet />;
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Camillas</h1>
          <p className="text-sm text-muted-foreground">
            Administracion visual de camillas, capacidad y ocupacion por sala.
          </p>
        </header>

        <Button asChild className="gap-2">
          <Link to="/app/cultivo/camillas/nueva" search={{ edit: undefined }}>
            <Plus className="h-4 w-4" />
            Nueva camilla
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Filtra camillas por sala, estado, capacidad u ocupacion.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          <Select value={roomId} onValueChange={setRoomId}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las salas</SelectItem>
              {rooms.map((room) => (
                <SelectItem key={room.id} value={room.id}>{room.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={(value) => setStatus(value as "all" | BedStatus)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="vacia">Vacia</SelectItem>
              <SelectItem value="activa">Activa</SelectItem>
              <SelectItem value="limpieza">Limpieza</SelectItem>
              <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
              <SelectItem value="fuera_de_uso">Fuera de uso</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="number"
            min={0}
            max={100}
            placeholder="Capacidad minima"
            value={capacity}
            onChange={(event) => setCapacity(event.target.value)}
          />
          <Select value={occupancy} onValueChange={(value) => setOccupancy(value as typeof occupancy)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="with_plants">Con plantas</SelectItem>
              <SelectItem value="empty">Vacias</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Listado de camillas</CardTitle>
          <CardDescription>Datos conectados al backend local de cultivo.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-0">
          <div className="mx-4 rounded-md border border-input bg-background/70 p-3 shadow-sm dark:bg-muted/35 dark:shadow-[0_0_0_1px_color-mix(in_oklch,var(--input)_45%,transparent)]">
            <p className="text-sm font-medium">Elementos de medicion visibles</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
              {MEASUREMENT_COLUMNS.map((column) => {
                const checked = visibleMeasurementColumns.includes(column.key);

                return (
                  <label
                    key={column.key}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted/60"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(nextChecked) => toggleMeasurementColumn(column.key, Boolean(nextChecked))}
                    />
                    {column.label}
                  </label>
                );
              })}
            </div>
          </div>
          <div className="overflow-x-auto rounded-b-md border-t [&_td]:text-center [&_th]:text-center [&_td]:px-2 [&_th]:px-2 [&_td]:py-2 [&_th]:py-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortHead label="Nombre"    sortKey="name"              col={sCol} dir={sDir} onSort={sort} />
                  <SortHead label="Codigo"    sortKey="code"              col={sCol} dir={sDir} onSort={sort} />
                  <SortHead label="Sala"      sortKey="_roomName"         col={sCol} dir={sDir} onSort={sort} />
                  <SortHead label="Estado"    sortKey="status"            col={sCol} dir={sDir} onSort={sort} />
                  <SortHead label={<span className="flex flex-col items-center leading-tight"><span>Capacidad</span><span>máxima</span></span>} sortKey="maxPlants"         col={sCol} dir={sDir} onSort={sort} />
                  <SortHead label={<span className="flex flex-col items-center leading-tight"><span>Plantas</span><span>actuales</span></span>} sortKey="currentPlants"     col={sCol} dir={sDir} onSort={sort} />
                  {MEASUREMENT_COLUMNS.filter((column) => visibleMeasurementColumns.includes(column.key)).map((column) => {
                    const { first, second } = splitMeasurementLabel(column.label);

                    return (
                      <TableHead key={column.key}>
                        <span className="flex flex-col items-center leading-tight">
                          <span>{first}</span>
                          <span>{second}</span>
                        </span>
                      </TableHead>
                    );
                  })}
                  {visibleMeasurementColumns.length ? (
                    <TableHead><span className="flex flex-col items-center leading-tight"><span>Estado</span><span>parametros</span></span></TableHead>
                  ) : null}
                  <SortHead label={<span className="flex flex-col items-center leading-tight"><span>Lote</span><span>principal</span></span>} sortKey="mainBatchId"       col={sCol} dir={sDir} onSort={sort} />
                  <SortHead label="Responsable" sortKey="responsibleUserId" col={sCol} dir={sDir} onSort={sort} />
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((bed) => {
                  const latest = latestBedMeasurement(bed.id);
                  return (
                    <TableRow key={bed.id}>
                      <TableCell className="font-medium">{bed.name}</TableCell>
                      <TableCell className="font-mono text-xs">{bed.code}</TableCell>
                      <TableCell>{roomName(bed.roomId)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={STATUS_CLASS[bed.status]}>
                          {STATUS_LABEL[bed.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{bed.maxPlants}</TableCell>
                      <TableCell className="font-mono text-xs">{bed.currentPlants}</TableCell>
                      {MEASUREMENT_COLUMNS.filter((column) => visibleMeasurementColumns.includes(column.key)).map((column) => (
                        <TableCell key={column.key} className="font-mono text-xs">{column.getValue(latest) ?? "-"}</TableCell>
                      ))}
                      {visibleMeasurementColumns.length ? (
                        <TableCell>
                          {latest ? <Badge variant="outline" className={PARAM_STATUS_CLASS[latest.status]}>{latest.status}</Badge> : "-"}
                        </TableCell>
                      ) : null}
                      <TableCell className="font-mono text-xs">{bed.mainBatchId ?? "-"}</TableCell>
                      <TableCell>{bed.responsibleUserId ?? "Sin asignar"}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link to="/app/cultivo/camillas/$id" params={{ id: bed.id }}>
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


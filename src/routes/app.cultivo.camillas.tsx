import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { Eye, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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

function GrowBedsPage() {
  const location = useLocation();
  const [beds, setBeds] = useState<GrowBed[]>([]);
  const [rooms, setRooms] = useState<GrowRoom[]>([]);
  const [measurements, setMeasurements] = useState<CultivationMeasurement[]>([]);
  const [roomId, setRoomId] = useState("all");
  const [status, setStatus] = useState<"all" | BedStatus>("all");
  const [capacity, setCapacity] = useState("");
  const [occupancy, setOccupancy] = useState<"all" | "with_plants" | "empty">("all");

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

  function latestBedMeasurement(bedId: string) {
    return measurements.find((item) => item.bedId === bedId);
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
        <CardContent>
          <div className="overflow-x-auto rounded-md border [&_td]:text-center [&_th]:text-center">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Codigo</TableHead>
                  <TableHead>Sala</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Capacidad maxima</TableHead>
                  <TableHead>Plantas actuales</TableHead>
                  <TableHead>pH sustrato</TableHead>
                  <TableHead>PPM sustrato</TableHead>
                  <TableHead>pH liquido</TableHead>
                  <TableHead>PPM liquido</TableHead>
                  <TableHead>Estado parametros</TableHead>
                  <TableHead>Lote principal</TableHead>
                  <TableHead>Responsable</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBeds.map((bed) => {
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
                      <TableCell className="font-mono text-xs">{latest?.substratePH ?? "-"}</TableCell>
                      <TableCell className="font-mono text-xs">{latest?.substratePPM ?? "-"}</TableCell>
                      <TableCell className="font-mono text-xs">{latest?.liquidPH ?? "-"}</TableCell>
                      <TableCell className="font-mono text-xs">{latest?.liquidPPM ?? "-"}</TableCell>
                      <TableCell>
                        {latest ? <Badge variant="outline" className={PARAM_STATUS_CLASS[latest.status]}>{latest.status}</Badge> : "-"}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{bed.mainBatchId ?? "-"}</TableCell>
                      <TableCell>{bed.responsibleUserId ?? "Sin asignar"}</TableCell>
                      <TableCell>
                        <div className="flex justify-center gap-1 whitespace-nowrap">
                          <Button asChild variant="ghost" size="sm" className="gap-1">
                            <Link to="/app/cultivo/camillas/$id" params={{ id: bed.id }}>
                              <Eye className="h-4 w-4" />
                            Ver
                            </Link>
                          </Button>
                        </div>
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

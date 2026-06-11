import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { MoreVertical, Pencil, Plus, Snowflake, Trash2, Wind } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DeleteConfirmDialog } from "@/components/cultivation/DeleteConfirmDialog";
import { CultivationStatusMessage } from "@/components/cultivation/RelationshipWarning";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useSortable } from "@/hooks/useSortable";
import { SortHead } from "@/components/ui/sort-head";
import { deleteGrowRoom, getGrowRooms } from "@/services/growRoomService";
import type { GrowRoom, RoomStatus, SensorType } from "@/types/cultivation";

export const Route = createFileRoute("/app/cultivo/salas")({
  head: () => ({ meta: [{ title: "Salas de cultivo · Cannabis Club Manager" }] }),
  component: GrowRoomsPage,
});

const STATUS_LABEL: Record<RoomStatus, string> = {
  activa: "Activa",
  limpieza: "Limpieza",
  mantenimiento: "Mantenimiento",
  fuera_de_uso: "Fuera de uso",
};

const STATUS_CLASS: Record<RoomStatus, string> = {
  activa: "border-emerald-200 bg-emerald-500/10 text-emerald-700",
  limpieza: "border-sky-200 bg-sky-500/10 text-sky-700",
  mantenimiento: "border-amber-200 bg-amber-500/10 text-amber-700",
  fuera_de_uso: "border-muted bg-muted text-muted-foreground",
};

const SENSOR_LABEL: Record<SensorType, string> = {
  temperatura: "Temperatura",
  humedad: "Humedad",
  co2: "CO₂",
  vpd: "VPD",
  temperatura_hoja: "Temp. hoja",
  ph: "PH",
  ec: "EC",
  otro: "Otro",
};

const SENSOR_CLASS: Record<SensorType, string> = {
  temperatura: "border-red-200 bg-red-500/10 text-red-700",
  humedad: "border-sky-200 bg-sky-500/10 text-sky-700",
  co2: "border-emerald-200 bg-emerald-500/10 text-emerald-700",
  vpd: "border-violet-200 bg-violet-500/10 text-violet-700",
  temperatura_hoja: "border-orange-200 bg-orange-500/10 text-orange-700",
  ph: "border-yellow-200 bg-yellow-500/10 text-yellow-700",
  ec: "border-cyan-200 bg-cyan-500/10 text-cyan-700",
  otro: "border-muted bg-muted text-muted-foreground",
};

function yesNo(value: boolean): string {
  return value ? "Si" : "No";
}

function GrowRoomsPage() {
  const location = useLocation();
  const [rooms, setRooms] = useState<GrowRoom[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<GrowRoom | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    void getGrowRooms().then(setRooms);
  }, []);

  const flatRooms = useMemo(() => rooms.map((r) => ({
    ...r,
    _powerWatts: r.technicalConfig.installedPowerWatts,
    _irrigation: r.technicalConfig.irrigationSystem,
  })), [rooms]);

  const { sorted, col: sCol, dir: sDir, toggle: sort } = useSortable(flatRooms);

  if (location.pathname !== "/app/cultivo/salas") {
    return <Outlet />;
  }

  async function handleDelete() {
    if (!deleteTarget) return;

    try {
      await deleteGrowRoom(deleteTarget.id);
      setRooms((current) => current.filter((item) => item.id !== deleteTarget.id));
      setDeleteTarget(null);
      setMessage("Sala eliminada correctamente.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo eliminar la sala.");
    }
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Salas</h1>
          <p className="text-sm text-muted-foreground">
            Vista tecnica de salas registradas para el seguimiento interno de cultivo.
          </p>
        </div>
        <Button asChild className="gap-2">
          <Link to="/app/cultivo/salas/nueva" search={{ edit: undefined }}>
            <Plus className="h-4 w-4" />
            Nueva sala
          </Link>
        </Button>
      </header>

      <div className="grid gap-3 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Salas registradas</CardDescription>
            <CardTitle className="font-mono text-2xl">{rooms.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Potencia instalada</CardDescription>
            <CardTitle className="font-mono text-2xl">
              {rooms.reduce((total, room) => total + room.technicalConfig.installedPowerWatts, 0)} W
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Salas activas</CardDescription>
            <CardTitle className="font-mono text-2xl">
              {rooms.filter((room) => room.status === "activa").length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listado de salas</CardTitle>
          <CardDescription>Datos conectados al backend local de cultivo.</CardDescription>
          {message ? <CultivationStatusMessage message={message} /> : null}
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border [&_td]:text-center [&_th]:text-center">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortHead label="Nombre"         sortKey="name"        col={sCol} dir={sDir} onSort={sort} />
                  <SortHead label="Codigo"         sortKey="code"        col={sCol} dir={sDir} onSort={sort} />
                  <SortHead label="Tipo"           sortKey="type"        col={sCol} dir={sDir} onSort={sort} />
                  <SortHead label="Estado"         sortKey="status"      col={sCol} dir={sDir} onSort={sort} />
                  <SortHead label="Potencia"       sortKey="_powerWatts" col={sCol} dir={sDir} onSort={sort} />
                  <SortHead label="Riego"          sortKey="_irrigation" col={sCol} dir={sDir} onSort={sort} />
                  <TableHead>A/C</TableHead>
                  <TableHead>Deshumidificador</TableHead>
                  <TableHead>Sensores</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((room) => (
                  <TableRow key={room.id}>
                    <TableCell className="font-medium">{room.name}</TableCell>
                    <TableCell className="font-mono text-xs">{room.code}</TableCell>
                    <TableCell className="capitalize">{room.type}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={STATUS_CLASS[room.status]}>
                        {STATUS_LABEL[room.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {room.technicalConfig.installedPowerWatts} W
                    </TableCell>
                    <TableCell className="capitalize">{room.technicalConfig.irrigationSystem}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center justify-center gap-1 text-sm">
                        <Snowflake className="h-3.5 w-3.5 text-muted-foreground" />
                        {yesNo(room.technicalConfig.hasAirConditioning)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center justify-center gap-1 text-sm">
                        <Wind className="h-3.5 w-3.5 text-muted-foreground" />
                        {yesNo(room.technicalConfig.hasDehumidifier)}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[240px]">
                      <div className="flex flex-wrap justify-center gap-1">
                        {room.technicalConfig.installedSensors.map((sensor) => (
                          <Badge key={sensor} variant="outline" className={SENSOR_CLASS[sensor]}>
                            {SENSOR_LABEL[sensor]}
                          </Badge>
                        ))}
                      </div>
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
                            <Link to="/app/cultivo/salas/nueva" search={{ edit: room.id }}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Editar
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteTarget(room)}>
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
        </CardContent>
      </Card>
      <DeleteConfirmDialog
        open={Boolean(deleteTarget)}
        entityLabel="sala"
        itemName={deleteTarget?.name}
        description={`Estas por eliminar la sala ${deleteTarget?.name ?? ""}. Si tiene camillas o registros asociados, la base puede impedir la eliminacion.`}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}

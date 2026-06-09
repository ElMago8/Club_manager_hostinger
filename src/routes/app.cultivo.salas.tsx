import { useEffect, useState } from "react";
import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { Pencil, Plus, Snowflake, Trash2, Wind } from "lucide-react";
import { DeleteConfirmDialog } from "@/components/cultivation/DeleteConfirmDialog";
import { CultivationStatusMessage } from "@/components/cultivation/RelationshipWarning";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { deleteGrowRoom, getGrowRooms } from "@/services/growRoomService";
import type { GrowRoom, RoomStatus } from "@/types/cultivation";

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
                  <TableHead>Nombre</TableHead>
                  <TableHead>Codigo</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Potencia</TableHead>
                  <TableHead>Riego</TableHead>
                  <TableHead>A/C</TableHead>
                  <TableHead>Deshumidificador</TableHead>
                  <TableHead>Sensores</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rooms.map((room) => (
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
                          <Badge key={sensor} variant="secondary" className="capitalize">
                            {sensor.replace("_", " ")}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center gap-1 whitespace-nowrap">
                      <Button asChild variant="ghost" size="sm" className="gap-1 text-emerald-700 hover:text-emerald-800">
                        <Link to="/app/cultivo/salas/nueva" search={{ edit: room.id }}>
                          <Pencil className="h-4 w-4" />
                          Editar
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1 text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(room)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Eliminar
                      </Button>
                      </div>
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

import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowRight, Leaf } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getEnvironmentalLogs } from "@/services/environmentalService";
import { getGenetics } from "@/services/geneticsService";
import { getGrowBeds } from "@/services/growBedService";
import { getGrowRooms } from "@/services/growRoomService";
import { getMotherPlants, type MotherPlantWithPlantCount } from "@/services/motherPlantService";
import { getPlants } from "@/services/plantService";
import type { EnvironmentalLog, Genetics, GrowBed, GrowRoom, Plant } from "@/types/cultivation";

export const Route = createFileRoute("/app/cultivo/resumen")({
  head: () => ({ meta: [{ title: "Resumen de cultivo · Cannabis Club Manager" }] }),
  component: CultivationSummaryPage,
});

const VPD_STATUS_CLASS: Record<NonNullable<EnvironmentalLog["vpdStatus"]>, string> = {
  bajo: "border-sky-200 bg-sky-500/10 text-sky-700",
  optimo: "border-emerald-200 bg-emerald-500/10 text-emerald-700",
  alto: "border-amber-200 bg-amber-500/10 text-amber-700",
  critico: "border-red-200 bg-red-500/10 text-red-700",
};

function CultivationSummaryPage() {
  const [rooms, setRooms] = useState<GrowRoom[]>([]);
  const [beds, setBeds] = useState<GrowBed[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [genetics, setGenetics] = useState<Genetics[]>([]);
  const [mothers, setMothers] = useState<MotherPlantWithPlantCount[]>([]);
  const [logs, setLogs] = useState<EnvironmentalLog[]>([]);

  useEffect(() => {
    void Promise.all([
      getGrowRooms(),
      getGrowBeds(),
      getPlants(),
      getGenetics(),
      getMotherPlants(),
      getEnvironmentalLogs(),
    ]).then(([nextRooms, nextBeds, nextPlants, nextGenetics, nextMothers, nextLogs]) => {
      setRooms(nextRooms);
      setBeds(nextBeds);
      setPlants(nextPlants);
      setGenetics(nextGenetics);
      setMothers(nextMothers);
      setLogs(nextLogs);
    });
  }, []);

  const activePlants = plants.filter((plant) => plant.status !== "descartada" && plant.status !== "cosechada");
  const activeLots = new Set(activePlants.map((plant) => plant.batchId).filter(Boolean)).size;
  const vpdAlerts = logs.filter((log) => log.vpdStatus && log.vpdStatus !== "optimo");
  const latestLogs = [...logs].sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`)).slice(0, 5);
  const observationPlants = plants.filter((plant) => plant.status === "observacion" || plant.status === "alerta");
  const activeMothers = mothers.filter((mother) => mother.status === "activa");

  const bedOccupancy = useMemo(
    () =>
      beds
        .map((bed) => ({
          ...bed,
          occupancy: bed.maxPlants > 0 ? Math.round((bed.currentPlants / bed.maxPlants) * 100) : 0,
        }))
        .sort((a, b) => b.occupancy - a.occupancy)
        .slice(0, 5),
    [beds],
  );

  const geneticsRanking = useMemo(() => {
    const counts = new Map<string, number>();
    for (const plant of plants) {
      if (plant.geneticsId) counts.set(plant.geneticsId, (counts.get(plant.geneticsId) ?? 0) + 1);
    }
    return genetics
      .map((item) => ({ ...item, plantsCount: counts.get(item.id) ?? 0 }))
      .sort((a, b) => b.plantsCount - a.plantsCount)
      .slice(0, 5);
  }, [genetics, plants]);

  const roomAlerts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const log of vpdAlerts) counts.set(log.roomId, (counts.get(log.roomId) ?? 0) + 1);
    return rooms
      .map((room) => ({ room, alerts: counts.get(room.id) ?? 0 }))
      .filter((item) => item.alerts > 0)
      .sort((a, b) => b.alerts - a.alerts);
  }, [rooms, vpdAlerts]);

  function roomName(roomId: string): string {
    return rooms.find((room) => room.id === roomId)?.name ?? roomId;
  }

  function bedName(bedId?: string): string {
    if (!bedId) return "-";
    return beds.find((bed) => bed.id === bedId)?.name ?? bedId;
  }

  const cards = [
    { label: "Salas activas", value: rooms.filter((room) => room.status === "activa").length },
    { label: "Camillas activas", value: beds.filter((bed) => bed.status === "activa").length },
    { label: "Plantas activas", value: activePlants.length },
    { label: "Lotes activos", value: activeLots },
    { label: "Geneticas activas", value: genetics.length },
    { label: "Madres activas", value: activeMothers.length },
    { label: "Alertas VPD", value: vpdAlerts.length },
    { label: "Registros ambientales", value: logs.length },
  ];

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Resumen de cultivo</h1>
          <p className="text-sm text-muted-foreground">Dashboard operativo del modulo con datos mock.</p>
        </header>
        <Button asChild variant="outline" className="gap-2">
          <Link to="/app/cultivo/ambiente">
            Parametros ambientales
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="pb-2">
              <CardDescription>{card.label}</CardDescription>
              <CardTitle className="font-mono text-2xl">{card.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Ultimos registros ambientales</CardTitle>
            <CardDescription>Lecturas recientes con estado VPD.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Sala</TableHead>
                    <TableHead>Camilla</TableHead>
                    <TableHead>VPD</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {latestLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{log.date} {log.time}</TableCell>
                      <TableCell>{roomName(log.roomId)}</TableCell>
                      <TableCell>{bedName(log.bedId)}</TableCell>
                      <TableCell className="font-mono text-xs">{log.calculatedVPD ?? "-"} kPa</TableCell>
                      <TableCell>
                        {log.vpdStatus ? <Badge variant="outline" className={VPD_STATUS_CLASS[log.vpdStatus]}>{log.vpdStatus}</Badge> : null}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Camillas con mayor ocupacion</CardTitle>
            <CardDescription>Ordenadas por porcentaje de uso.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {bedOccupancy.map((bed) => (
              <div key={bed.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                <div>
                  <p className="font-medium">{bed.name}</p>
                  <p className="text-xs text-muted-foreground">{roomName(bed.roomId)} · {bed.currentPlants}/{bed.maxPlants}</p>
                </div>
                <Badge variant="secondary">{bed.occupancy}%</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Plantas en observacion</CardTitle>
            <CardDescription>Estados observacion o alerta.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {observationPlants.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin plantas en observacion.</p>
            ) : observationPlants.slice(0, 5).map((plant) => (
              <div key={plant.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                <div>
                  <p className="font-mono text-xs font-medium">{plant.internalCode}</p>
                  <p className="text-xs text-muted-foreground">{plant.geneticsName ?? "genetica pendiente"} · {bedName(plant.bedId)}</p>
                </div>
                <Badge variant="outline">{plant.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Salas con alertas</CardTitle>
            <CardDescription>Alertas VPD no optimas por sala.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {roomAlerts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin alertas ambientales.</p>
            ) : roomAlerts.map(({ room, alerts }) => (
              <div key={room.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                <span className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-600" />{room.name}</span>
                <Badge variant="outline">{alerts}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Madres activas</CardTitle>
            <CardDescription>Madres disponibles y plantas asociadas.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {activeMothers.map((mother) => (
              <div key={mother.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                <div>
                  <p className="font-mono text-xs font-medium">{mother.code}</p>
                  <p className="text-xs text-muted-foreground">{mother.geneticsName}</p>
                </div>
                <Badge variant="secondary">{mother.derivedPlantsCount}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Geneticas con mas plantas</CardTitle>
            <CardDescription>Ranking por asociacion en plantas mock.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {geneticsRanking.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                <span className="flex items-center gap-2"><Leaf className="h-4 w-4 text-muted-foreground" />{item.name}</span>
                <Badge variant="secondary">{item.plantsCount}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

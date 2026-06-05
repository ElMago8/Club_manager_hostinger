import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { ArrowRight, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getGenetics } from "@/services/geneticsService";
import { getGrowBeds } from "@/services/growBedService";
import { getGrowRooms } from "@/services/growRoomService";
import { getMotherPlants } from "@/services/motherPlantService";
import { getPlants, type PlantFilters } from "@/services/plantService";
import type { Genetics, GrowBed, GrowRoom, MotherPlant, Plant, PlantStage, PlantStatus } from "@/types/cultivation";

export const Route = createFileRoute("/app/cultivo/plantas")({
  head: () => ({ meta: [{ title: "Plantas · Cannabis Club Manager" }] }),
  component: PlantsPage,
});

const PLANT_STATUS_CLASS: Record<PlantStatus, string> = {
  normal: "border-emerald-200 bg-emerald-500/10 text-emerald-700",
  observacion: "border-sky-200 bg-sky-500/10 text-sky-700",
  alerta: "border-amber-200 bg-amber-500/10 text-amber-700",
  descartada: "border-muted bg-muted text-muted-foreground",
  cosechada: "border-violet-200 bg-violet-500/10 text-violet-700",
};

function PlantsPage() {
  const location = useLocation();
  const [plants, setPlants] = useState<Plant[]>([]);
  const [rooms, setRooms] = useState<GrowRoom[]>([]);
  const [beds, setBeds] = useState<GrowBed[]>([]);
  const [genetics, setGenetics] = useState<Genetics[]>([]);
  const [mothers, setMothers] = useState<MotherPlant[]>([]);
  const [filters, setFilters] = useState({
    roomId: "all",
    bedId: "all",
    geneticsId: "all",
    batchId: "",
    motherPlantId: "all",
    stage: "all",
    status: "all",
  });

  useEffect(() => {
    void Promise.all([getPlants(), getGrowRooms(), getGrowBeds(), getGenetics(), getMotherPlants()]).then(
      ([nextPlants, nextRooms, nextBeds, nextGenetics, nextMothers]) => {
        setPlants(nextPlants);
        setRooms(nextRooms);
        setBeds(nextBeds);
        setGenetics(nextGenetics);
        setMothers(nextMothers);
      },
    );
  }, []);

  const filteredBeds = useMemo(() => {
    if (filters.roomId === "all") return beds;
    return beds.filter((bed) => bed.roomId === filters.roomId);
  }, [beds, filters.roomId]);

  async function applyFilters() {
    const serviceFilters: PlantFilters = {};
    if (filters.roomId !== "all") serviceFilters.roomId = filters.roomId;
    if (filters.bedId !== "all") serviceFilters.bedId = filters.bedId;
    if (filters.geneticsId !== "all") serviceFilters.geneticsId = filters.geneticsId;
    if (filters.batchId) serviceFilters.batchId = filters.batchId;
    if (filters.motherPlantId !== "all") serviceFilters.motherPlantId = filters.motherPlantId;
    if (filters.stage !== "all") serviceFilters.stage = filters.stage as PlantStage;
    if (filters.status !== "all") serviceFilters.status = filters.status as PlantStatus;
    setPlants(await getPlants(serviceFilters));
  }

  function roomName(id: string): string {
    return rooms.find((room) => room.id === id)?.name ?? id;
  }

  function bedName(id: string): string {
    return beds.find((bed) => bed.id === id)?.name ?? id;
  }

  function motherCode(id?: string): string {
    if (!id) return "-";
    return mothers.find((mother) => mother.id === id)?.code ?? id;
  }

  if (location.pathname !== "/app/cultivo/plantas") {
    return <Outlet />;
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Plantas</h1>
          <p className="text-sm text-muted-foreground">Listado operativo de plantas por sala, camilla y posicion.</p>
        </header>

        <Button asChild className="gap-2">
          <Link to="/app/cultivo/plantas/nueva">
            <Plus className="h-4 w-4" />
            Nueva planta
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Filtra plantas usando services mock.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          <Select value={filters.roomId} onValueChange={(roomId) => setFilters({ ...filters, roomId, bedId: "all" })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las salas</SelectItem>
              {rooms.map((room) => <SelectItem key={room.id} value={room.id}>{room.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filters.bedId} onValueChange={(bedId) => setFilters({ ...filters, bedId })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las camillas</SelectItem>
              {filteredBeds.map((bed) => <SelectItem key={bed.id} value={bed.id}>{bed.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filters.geneticsId} onValueChange={(geneticsId) => setFilters({ ...filters, geneticsId })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las geneticas</SelectItem>
              {genetics.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input placeholder="Lote" value={filters.batchId} onChange={(event) => setFilters({ ...filters, batchId: event.target.value })} />
          <Select value={filters.motherPlantId} onValueChange={(motherPlantId) => setFilters({ ...filters, motherPlantId })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las madres</SelectItem>
              {mothers.map((mother) => <SelectItem key={mother.id} value={mother.id}>{mother.code}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filters.stage} onValueChange={(stage) => setFilters({ ...filters, stage })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las etapas</SelectItem>
              <SelectItem value="esqueje">Esqueje</SelectItem>
              <SelectItem value="vegetativo">Vegetativo</SelectItem>
              <SelectItem value="floracion">Floracion</SelectItem>
              <SelectItem value="cosecha">Cosecha</SelectItem>
              <SelectItem value="secado">Secado</SelectItem>
              <SelectItem value="curado">Curado</SelectItem>
              <SelectItem value="liberado">Liberado</SelectItem>
              <SelectItem value="descartado">Descartado</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.status} onValueChange={(status) => setFilters({ ...filters, status })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="observacion">Observacion</SelectItem>
              <SelectItem value="alerta">Alerta</SelectItem>
              <SelectItem value="descartada">Descartada</SelectItem>
              <SelectItem value="cosechada">Cosechada</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => void applyFilters()}>Aplicar filtros</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Listado de plantas</CardTitle>
          <CardDescription>{plants.length} registros mock encontrados.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Codigo interno</TableHead>
                  <TableHead>Genetica</TableHead>
                  <TableHead>Lote</TableHead>
                  <TableHead>Sala</TableHead>
                  <TableHead>Camilla</TableHead>
                  <TableHead>Posicion</TableHead>
                  <TableHead>Madre</TableHead>
                  <TableHead>Etapa</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plants.map((plant) => (
                  <TableRow key={plant.id}>
                    <TableCell className="font-mono text-xs font-medium">{plant.internalCode}</TableCell>
                    <TableCell>{plant.geneticsName ?? "genetica pendiente"}</TableCell>
                    <TableCell className="font-mono text-xs">{plant.batchId ?? "-"}</TableCell>
                    <TableCell>{roomName(plant.roomId)}</TableCell>
                    <TableCell>{bedName(plant.bedId)}</TableCell>
                    <TableCell className="font-mono text-xs">{plant.bedPosition}</TableCell>
                    <TableCell className="font-mono text-xs">{motherCode(plant.motherPlantId)}</TableCell>
                    <TableCell className="capitalize">{plant.stage}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={PLANT_STATUS_CLASS[plant.status]}>{plant.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="ghost" size="sm" className="gap-1">
                        <Link to="/app/cultivo/plantas/$id" params={{ id: plant.id }}>
                          Ver
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

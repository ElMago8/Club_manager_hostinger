import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react";
import { DeleteConfirmDialog } from "@/components/cultivation/DeleteConfirmDialog";
import { RelationshipWarning } from "@/components/cultivation/RelationshipWarning";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getGenetics } from "@/services/geneticsService";
import { deleteGrowBed, getGrowBedById, getGrowBedOccupancy, updateGrowBedCapacity, type GrowBedOccupancy } from "@/services/growBedService";
import { getGrowRoomById } from "@/services/growRoomService";
import { getMeasurements } from "@/services/measurementService";
import { getMotherPlants } from "@/services/motherPlantService";
import { bulkCreatePlantsForBed, getPlantsByBed, updatePlantStage, updatePlantStatus } from "@/services/plantService";
import type {
  BedStatus,
  CultivationMeasurement,
  Genetics,
  GrowBed,
  GrowRoom,
  MeasurementStatus,
  MotherPlant,
  Plant,
  PlantOrigin,
  PlantStage,
  PlantStatus,
} from "@/types/cultivation";

export const Route = createFileRoute("/app/cultivo/camillas/$id")({
  head: () => ({ meta: [{ title: "Detalle de camilla · Cannabis Club Manager" }] }),
  component: GrowBedDetailPage,
});

const BED_STATUS_CLASS: Record<BedStatus, string> = {
  vacia: "border-muted bg-muted text-muted-foreground",
  activa: "border-emerald-200 bg-emerald-500/10 text-emerald-700",
  limpieza: "border-sky-200 bg-sky-500/10 text-sky-700",
  mantenimiento: "border-amber-200 bg-amber-500/10 text-amber-700",
  fuera_de_uso: "border-red-200 bg-red-500/10 text-red-700",
};

const PLANT_STATUS_CLASS: Record<PlantStatus, string> = {
  normal: "border-emerald-200 bg-emerald-500/10 text-emerald-700",
  observacion: "border-sky-200 bg-sky-500/10 text-sky-700",
  alerta: "border-amber-200 bg-amber-500/10 text-amber-700",
  descartada: "border-muted bg-muted text-muted-foreground",
  cosechada: "border-violet-200 bg-violet-500/10 text-violet-700",
};

const PLANT_STAGE_CLASS: Record<PlantStage, string> = {
  vegetativo: "border-emerald-200 bg-emerald-500/15 text-emerald-800 hover:bg-emerald-500/20",
  floracion: "border-fuchsia-200 bg-fuchsia-500/15 text-fuchsia-800 hover:bg-fuchsia-500/20",
  cosecha: "border-amber-200 bg-amber-500/20 text-amber-900 hover:bg-amber-500/25",
  secado: "border-orange-200 bg-orange-500/20 text-orange-900 hover:bg-orange-500/25",
  curado: "border-violet-200 bg-violet-500/15 text-violet-800 hover:bg-violet-500/20",
  liberado: "border-sky-200 bg-sky-500/15 text-sky-800 hover:bg-sky-500/20",
  a_limpiar: "border-teal-200 bg-teal-500/15 text-teal-800 hover:bg-teal-500/20",
  a_reparar: "border-rose-200 bg-rose-500/15 text-rose-800 hover:bg-rose-500/20",
};

const STAGE_LABEL: Record<PlantStage, string> = {
  vegetativo: "Vegetativo",
  floracion: "Floracion",
  cosecha: "Cosecha",
  secado: "Secado",
  curado: "Curado",
  liberado: "Liberado",
  a_limpiar: "A Limpiar",
  a_reparar: "A Reparar",
};

const PARAM_STATUS_CLASS: Record<MeasurementStatus, string> = {
  normal: "border-emerald-200 bg-emerald-500/10 text-emerald-700",
  observation: "border-sky-200 bg-sky-500/10 text-sky-700",
  alert: "border-amber-200 bg-amber-500/10 text-amber-700",
  critical: "border-red-200 bg-red-500/10 text-red-700",
};

type BulkForm = {
  count: string;
  geneticsId: string;
  batchId: string;
  motherPlantId: string;
  origin: PlantOrigin;
  stage: PlantStage;
  status: PlantStatus;
  startDate: string;
  notes: string;
  potSizeLiters: string;
  potType: string;
  substrate: string;
};

const initialBulkForm: BulkForm = {
  count: "1",
  geneticsId: "none",
  batchId: "",
  motherPlantId: "none",
  origin: "esqueje",
  stage: "vegetativo",
  status: "normal",
  startDate: "2026-05-26",
  notes: "",
  potSizeLiters: "",
  potType: "",
  substrate: "",
};

function shortCode(code: string): string {
  const parts = code.split("-");
  return parts.slice(-2).join("-");
}

function GrowBedDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [bed, setBed] = useState<GrowBed | null>(null);
  const [room, setRoom] = useState<GrowRoom | null>(null);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [occupancy, setOccupancy] = useState<GrowBedOccupancy | null>(null);
  const [genetics, setGenetics] = useState<Genetics[]>([]);
  const [mothers, setMothers] = useState<MotherPlant[]>([]);
  const [measurements, setMeasurements] = useState<CultivationMeasurement[]>([]);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkForm, setBulkForm] = useState<BulkForm>(initialBulkForm);
  const [bulkError, setBulkError] = useState("");
  const [bulkMessage, setBulkMessage] = useState("");
  const [capacityValue, setCapacityValue] = useState("");
  const [capacityError, setCapacityError] = useState("");
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [quickNotes, setQuickNotes] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState("");

  async function loadData() {
    const nextBed = await getGrowBedById(id);
    setBed(nextBed);
    setPlants(nextBed ? await getPlantsByBed(nextBed.id) : []);
    setOccupancy(nextBed ? await getGrowBedOccupancy(nextBed.id) : null);
    setCapacityValue(nextBed ? String(nextBed.maxPlants) : "");
    setRoom(nextBed ? await getGrowRoomById(nextBed.roomId) : null);
    const nextGenetics = await getGenetics();
    setGenetics(nextGenetics);
    setBulkForm((current) => ({
      ...current,
      geneticsId: current.geneticsId === "none" ? nextGenetics[0]?.id ?? "none" : current.geneticsId,
    }));
    setMothers(await getMotherPlants());
    setMeasurements(nextBed ? await getMeasurements({ bedId: nextBed.id }) : []);
  }

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const plantsByPosition = useMemo(() => {
    const map = new Map<number, Plant>();
    for (const plant of plants) map.set(plant.bedPosition, plant);
    return map;
  }, [plants]);

  const predominantGenetics = useMemo(() => {
    const counts = new Map<string, number>();
    for (const plant of plants) {
      const name = plant.geneticsName ?? "genetica pendiente";
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Sin plantas";
  }, [plants]);

  const freePositions = bed ? Math.max(Math.min(bed.maxPlants, 100) - plants.filter((p) => p.status !== "descartada").length, 0) : 0;
  const latestMeasurement = measurements[0];

  async function handleBulkCreate() {
    if (!bed) return;
    setBulkError("");
    setBulkMessage("");

    if (bed.status === "fuera_de_uso") {
      setBulkError("No se puede cargar plantas en una camilla fuera de uso.");
      return;
    }

    const count = Number(bulkForm.count);
    if (!Number.isFinite(count) || count < 1 || count > 100) {
      setBulkError("La cantidad debe estar entre 1 y 100 plantas.");
      return;
    }

    const selectedGenetics = genetics.find((item) => item.id === bulkForm.geneticsId);
    const selectedMother = mothers.find((item) => item.id === bulkForm.motherPlantId);

    if (!selectedGenetics) {
      setBulkError("Selecciona una genetica para crear plantas en la camilla.");
      return;
    }

    try {
      await bulkCreatePlantsForBed({
        bedId: bed.id,
        count,
        plant: {
          roomId: bed.roomId,
          batchId: bulkForm.batchId || undefined,
          cycleId: undefined,
          geneticsId: selectedGenetics.id,
          geneticsName: selectedGenetics.name,
          motherPlantId: selectedMother?.id,
          motherPlantCode: selectedMother?.code,
          origin: bulkForm.origin,
          stage: bulkForm.stage,
          status: bulkForm.status,
          startDate: bulkForm.startDate,
          stageStartDate: bulkForm.startDate,
          notes: bulkForm.notes || undefined,
          potSizeLiters: bulkForm.potSizeLiters ? Number(bulkForm.potSizeLiters) : undefined,
          potType: bulkForm.potType || undefined,
          substrate: bulkForm.substrate || undefined,
          internalCodePrefix: `PL-${bed.code}`,
        },
      });
      await loadData();
      setBulkMessage("Carga masiva creada correctamente en posiciones libres.");
      setBulkOpen(false);
    } catch (error) {
      setBulkError(error instanceof Error ? error.message : "No se pudo crear la carga masiva.");
    }
  }

  async function handleCapacityUpdate() {
    if (!bed) return;
    setCapacityError("");
    const maxPlants = Number(capacityValue);
    if (!Number.isFinite(maxPlants) || maxPlants < 0 || maxPlants > 100) {
      setCapacityError("La capacidad debe estar entre 0 y 100.");
      return;
    }
    try {
      await updateGrowBedCapacity(bed.id, maxPlants);
      await loadData();
    } catch (error) {
      setCapacityError(error instanceof Error ? error.message : "No se pudo actualizar la capacidad.");
    }
  }

  async function handleQuickPlantSave() {
    if (!selectedPlant) return;
    await updatePlantStage(selectedPlant.id, {
      stage: selectedPlant.stage,
      stageStartDate: selectedPlant.stageStartDate,
      notes: quickNotes || undefined,
    });
    await updatePlantStatus(selectedPlant.id, {
      status: selectedPlant.status,
      notes: quickNotes || undefined,
    });
    setSelectedPlant(null);
    setQuickNotes("");
    await loadData();
  }

  async function handleDeleteBed() {
    if (!bed) return;

    try {
      await deleteGrowBed(bed.id);
      await navigate({ to: "/app/cultivo/camillas" });
    } catch (error) {
      setDeleteMessage(error instanceof Error ? error.message : "No se pudo eliminar la camilla.");
      setDeleteOpen(false);
    }
  }

  if (!bed) {
    return (
      <div className="mx-auto max-w-[1000px] space-y-4">
        <Button asChild variant="ghost" size="sm">
          <Link to="/app/cultivo/camillas">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Link>
        </Button>
        <Card>
          <CardContent className="py-10 text-sm text-muted-foreground">Camilla no encontrada.</CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <Button asChild variant="ghost" size="sm" className="-ml-2">
            <Link to="/app/cultivo/camillas">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Camillas
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight">{bed.name}</h1>
          <p className="text-sm text-muted-foreground">Grilla de posiciones y ocupacion de plantas.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild className="gap-2 bg-emerald-700 hover:bg-emerald-800">
            <Link to="/app/cultivo/camillas/nueva" search={{ edit: bed.id }}>
              <Pencil className="h-4 w-4" />
              Editar
            </Link>
          </Button>
          <Button
            variant="outline"
            className="gap-2 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
            Eliminar
          </Button>
          <Button onClick={() => setBulkOpen(true)} className="gap-2" disabled={bed.status === "fuera_de_uso"}>
            <Plus className="h-4 w-4" />
            Carga masiva de plantas
          </Button>
        </div>
      </div>

      {bulkMessage ? <p className="rounded-md border border-emerald-200 bg-emerald-500/10 p-3 text-sm text-emerald-700">{bulkMessage}</p> : null}
      {deleteMessage ? <RelationshipWarning message={deleteMessage} /> : null}

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Ficha de camilla</CardTitle>
            <CardDescription>Datos operativos y capacidad.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm md:grid-cols-2">
            <div><p className="text-muted-foreground">Codigo</p><p className="font-mono">{bed.code}</p></div>
            <div><p className="text-muted-foreground">Sala asociada</p><p>{room?.name ?? bed.roomId}</p></div>
            <div><p className="text-muted-foreground">Estado</p><Badge variant="outline" className={BED_STATUS_CLASS[bed.status]}>{bed.status.replace("_", " ")}</Badge></div>
            <div><p className="text-muted-foreground">Capacidad maxima</p><p className="font-mono">{bed.maxPlants}</p></div>
            <div><p className="text-muted-foreground">Plantas actuales</p><p className="font-mono">{bed.currentPlants}</p></div>
            <div><p className="text-muted-foreground">Lote principal</p><p className="font-mono">{bed.mainBatchId ?? "-"}</p></div>
            <div><p className="text-muted-foreground">Genetica predominante</p><p>{predominantGenetics}</p></div>
            <div><p className="text-muted-foreground">Responsable</p><p>{bed.responsibleUserId ?? "Sin asignar"}</p></div>
            <div className="md:col-span-2"><p className="text-muted-foreground">Observaciones</p><p>{bed.notes ?? "Sin observaciones"}</p></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Capacidad disponible</CardTitle>
            <CardDescription>Capacidad maxima de macetas/plantas y ocupacion real.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-3">
            <div className="rounded-md border p-3">
              <p className="text-xs text-muted-foreground">Maximo</p>
              <p className="font-mono text-2xl font-semibold">{occupancy?.maxPlants ?? Math.min(bed.maxPlants, 100)}</p>
            </div>
            <div className="rounded-md border p-3">
              <p className="text-xs text-muted-foreground">Ocupadas</p>
              <p className="font-mono text-2xl font-semibold">{occupancy?.occupied ?? plants.length}</p>
            </div>
            <div className="rounded-md border p-3">
              <p className="text-xs text-muted-foreground">Libres</p>
              <p className="font-mono text-2xl font-semibold">{occupancy?.available ?? freePositions}</p>
            </div>
            <div className="col-span-3 space-y-2 rounded-md border p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Ocupacion</p>
                  <p className="font-mono text-sm">{occupancy?.occupancyPercentage ?? 0}%</p>
                </div>
                <div className="flex items-center gap-2">
                  <Input className="w-24" type="number" min={0} max={100} value={capacityValue} onChange={(event) => setCapacityValue(event.target.value)} />
                  <Button variant="outline" size="sm" onClick={() => void handleCapacityUpdate()}>Editar capacidad</Button>
                </div>
              </div>
              {capacityError ? <p className="text-sm text-red-600">{capacityError}</p> : null}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Control de parametros</CardTitle>
          <CardDescription>Ultimas mediciones quimicas asociadas a esta camilla.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Ultimo pH sustrato", latestMeasurement?.substratePH],
            ["Ultimo PPM sustrato", latestMeasurement?.substratePPM],
            ["Ultimo EC sustrato", latestMeasurement?.substrateEC],
            ["Ultimo pH liquido", latestMeasurement?.liquidPH],
            ["Ultimo PPM liquido", latestMeasurement?.liquidPPM],
            ["Ultimo EC liquido", latestMeasurement?.liquidEC],
            ["Ultimo pH drenaje", latestMeasurement?.runoffPH],
            ["Ultimo PPM drenaje", latestMeasurement?.runoffPPM],
          ].map(([label, value]) => (
            <div key={label} className="rounded-md border p-3">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="font-mono text-xl font-semibold">{value ?? "-"}</p>
            </div>
          ))}
          <div className="flex items-center justify-between rounded-md border p-3 sm:col-span-2 lg:col-span-4">
            <span className="text-muted-foreground">Estado general</span>
            {latestMeasurement ? (
              <Badge variant="outline" className={PARAM_STATUS_CLASS[latestMeasurement.status]}>{latestMeasurement.status}</Badge>
            ) : (
              <span>Sin mediciones</span>
            )}
          </div>
          <Button asChild variant="outline" className="gap-2 sm:col-span-2 lg:col-span-4">
            <Link to="/app/cultivo/mediciones" search={{}}>
              <Plus className="h-4 w-4" />
              Registrar medicion
            </Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Grilla de posiciones</CardTitle>
          <CardDescription>Slots generados desde 1 hasta la capacidad maxima de la camilla.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {(Object.keys(STAGE_LABEL) as PlantStage[]).map((stage) => (
              <span
                key={stage}
                className={[
                  "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
                  PLANT_STAGE_CLASS[stage],
                ].join(" ")}
              >
                {STAGE_LABEL[stage]}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-5 gap-2 sm:grid-cols-8 md:grid-cols-10 xl:grid-cols-12">
            {Array.from({ length: Math.min(bed.maxPlants, 100) }, (_, index) => {
              const position = index + 1;
              const plant = plantsByPosition.get(position);
              return (
                <button
                  key={position}
                  type="button"
                  onClick={() => {
                    if (plant) {
                      setSelectedPlant(plant);
                      setQuickNotes(plant.notes ?? "");
                    }
                  }}
                  className={[
                    "aspect-square rounded-md border p-1 text-left transition-colors",
                    plant ? PLANT_STAGE_CLASS[plant.stage] : "border-dashed bg-muted/30 text-muted-foreground hover:bg-muted/50",
                  ].join(" ")}
                >
                  <span className="block font-mono text-[10px] leading-none">#{position}</span>
                  <span className="mt-1 block truncate text-[11px] font-medium">
                    {plant ? shortCode(plant.internalCode) : "vacio"}
                  </span>
                  {plant ? <span className="block truncate text-[10px]">{STAGE_LABEL[plant.stage]}</span> : null}
                  {plant ? <span className="block truncate text-[10px]">{plant.potCode ?? (plant.potSizeLiters ? `${plant.potSizeLiters} L` : plant.status)}</span> : null}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Carga masiva de plantas</DialogTitle>
            <DialogDescription>Crea plantas en posiciones libres sin superar la capacidad disponible.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Cantidad</Label>
              <Input type="number" min={1} max={100} value={bulkForm.count} onChange={(e) => setBulkForm({ ...bulkForm, count: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Genetica</Label>
              <Select value={bulkForm.geneticsId} onValueChange={(geneticsId) => setBulkForm({ ...bulkForm, geneticsId })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Genetica pendiente</SelectItem>
                  {genetics.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Lote</Label>
              <Input value={bulkForm.batchId} onChange={(e) => setBulkForm({ ...bulkForm, batchId: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Madre de origen</Label>
              <Select value={bulkForm.motherPlantId} onValueChange={(motherPlantId) => setBulkForm({ ...bulkForm, motherPlantId })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin madre</SelectItem>
                  {mothers.map((item) => <SelectItem key={item.id} value={item.id}>{item.code}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Origen</Label>
              <Select value={bulkForm.origin} onValueChange={(origin) => setBulkForm({ ...bulkForm, origin: origin as PlantOrigin })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="semilla">Semilla</SelectItem>
                  <SelectItem value="esqueje">Esqueje</SelectItem>
                  <SelectItem value="madre_interna">Madre interna</SelectItem>
                  <SelectItem value="compra_externa">Compra externa</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Etapa</Label>
              <Select value={bulkForm.stage} onValueChange={(stage) => setBulkForm({ ...bulkForm, stage: stage as PlantStage })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="vegetativo">Vegetativo</SelectItem>
                  <SelectItem value="floracion">Floracion</SelectItem>
                  <SelectItem value="cosecha">Cosecha</SelectItem>
                  <SelectItem value="secado">Secado</SelectItem>
                  <SelectItem value="curado">Curado</SelectItem>
                  <SelectItem value="liberado">Liberado</SelectItem>
                  <SelectItem value="a_limpiar">A Limpiar</SelectItem>
                  <SelectItem value="a_reparar">A Reparar</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select value={bulkForm.status} onValueChange={(status) => setBulkForm({ ...bulkForm, status: status as PlantStatus })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="observacion">Observacion</SelectItem>
                  <SelectItem value="alerta">Alerta</SelectItem>
                  <SelectItem value="descartada">Descartada</SelectItem>
                  <SelectItem value="cosechada">Cosechada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Fecha de inicio</Label>
              <Input type="date" value={bulkForm.startDate} onChange={(e) => setBulkForm({ ...bulkForm, startDate: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Tamano maceta L</Label>
              <Input type="number" min={0} value={bulkForm.potSizeLiters} onChange={(e) => setBulkForm({ ...bulkForm, potSizeLiters: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Tipo de maceta</Label>
              <Input value={bulkForm.potType} onChange={(e) => setBulkForm({ ...bulkForm, potType: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Sustrato</Label>
              <Input value={bulkForm.substrate} onChange={(e) => setBulkForm({ ...bulkForm, substrate: e.target.value })} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Observaciones</Label>
              <Textarea value={bulkForm.notes} onChange={(e) => setBulkForm({ ...bulkForm, notes: e.target.value })} />
            </div>
          </div>
          {bulkError ? <p className="rounded-md border border-red-200 bg-red-500/10 p-3 text-sm text-red-700">{bulkError}</p> : null}
          <Button onClick={handleBulkCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Crear plantas
          </Button>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={deleteOpen}
        entityLabel="camilla"
        itemName={bed.name}
        description={`Estas por eliminar la camilla ${bed.name}. Si tiene plantas, madres o tareas asociadas, la base no va a permitir la eliminacion.`}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDeleteBed}
      />

      <Dialog open={Boolean(selectedPlant)} onOpenChange={(open) => !open && setSelectedPlant(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar planta</DialogTitle>
            <DialogDescription>Actualiza etapa, estado y observaciones rapidas de la maceta seleccionada.</DialogDescription>
          </DialogHeader>
          {selectedPlant ? (
            <div className="grid gap-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">Planta</p>
                  <p className="font-mono text-sm">{selectedPlant.internalCode}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Maceta</p>
                  <p className="font-mono text-sm">{selectedPlant.potCode ?? `${selectedPlant.potSizeLiters ?? "-"} L`}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Etapa</Label>
                <Select value={selectedPlant.stage} onValueChange={(stage) => setSelectedPlant({ ...selectedPlant, stage: stage as PlantStage })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vegetativo">Vegetativo</SelectItem>
                    <SelectItem value="floracion">Floracion</SelectItem>
                    <SelectItem value="cosecha">Cosecha</SelectItem>
                    <SelectItem value="secado">Secado</SelectItem>
                    <SelectItem value="curado">Curado</SelectItem>
                    <SelectItem value="liberado">Liberado</SelectItem>
                    <SelectItem value="a_limpiar">A Limpiar</SelectItem>
                    <SelectItem value="a_reparar">A Reparar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select value={selectedPlant.status} onValueChange={(status) => setSelectedPlant({ ...selectedPlant, status: status as PlantStatus })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="observacion">Observacion</SelectItem>
                    <SelectItem value="alerta">Alerta</SelectItem>
                    <SelectItem value="descartada">Descartada</SelectItem>
                    <SelectItem value="cosechada">Cosechada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Observaciones rapidas</Label>
                <Textarea value={quickNotes} onChange={(event) => setQuickNotes(event.target.value)} />
              </div>
              <Button onClick={() => void handleQuickPlantSave()}>Guardar cambios</Button>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

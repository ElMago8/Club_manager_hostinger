import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Droplets, MoreVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { BulkCreatePlantsDialog } from "@/components/cultivation/BulkCreatePlantsDialog";
import { DeleteConfirmDialog } from "@/components/cultivation/DeleteConfirmDialog";
import { RelationshipWarning } from "@/components/cultivation/RelationshipWarning";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getGenetics } from "@/services/geneticsService";
import {
  createSistemaRiego,
  deleteSistemaRiego,
  getSistemaRiegoByCamilla,
  updateSistemaRiego,
  type SistemaRegadoTipo,
  type SistemaRiego,
} from "@/services/irrigationSystemService";
import { deleteGrowBed, getGrowBedById, getGrowBedOccupancy, updateGrowBedCapacity, type GrowBedOccupancy } from "@/services/growBedService";
import { getGrowRoomById } from "@/services/growRoomService";
import { getMeasurements } from "@/services/measurementService";
import { getMotherPlants } from "@/services/motherPlantService";
import { getPlantsByBed, updatePlantStage, updatePlantStatus } from "@/services/plantService";
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

const PLANT_STATUS_LABEL: Record<PlantStatus, string> = {
  normal: "Normal",
  observacion: "Observación",
  alerta: "Alerta",
  descartada: "Descartada",
  cosechada: "Cosechada",
};

const PLANT_ORIGIN_LABEL: Record<PlantOrigin, string> = {
  semilla: "Semilla",
  esqueje: "Esqueje",
  madre: "Madre",
  planta: "Planta",
};


const SISTEMA_REGADO_LABEL: Record<SistemaRegadoTipo, string> = {
  goteo: "Por goteo",
  continuo_intermitente: "Riego continuo intermitente",
  otro: "Otro",
};

type RiegoForm = {
  codigoRiego: string;
  picosPorPlanta: string;
  horarioApertura: string;
  cantidadLitros: string;
  tanque: string;
  frecuenciaTiempo: string;
  sistemaRegado: SistemaRegadoTipo;
  sistemaRegadoCustom: string;
  notas: string;
};

function initialRiegoForm(): RiegoForm {
  return {
    codigoRiego: "",
    picosPorPlanta: "",
    horarioApertura: "",
    cantidadLitros: "",
    tanque: "",
    frecuenciaTiempo: "",
    sistemaRegado: "goteo" as SistemaRegadoTipo,
    sistemaRegadoCustom: "",
    notas: "",
  };
}

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
  // ─── Sistema de Riego ────────────────────────────────────────────────────────
  const [riegos, setRiegos] = useState<SistemaRiego[]>([]);
  const [riegoForm, setRiegoForm] = useState(initialRiegoForm());
  const [riegoSaving, setRiegoSaving] = useState(false);
  const [riegoError, setRiegoError] = useState("");
  const [editRiego, setEditRiego] = useState<SistemaRiego | null>(null);
  const [editRiegoForm, setEditRiegoForm] = useState(initialRiegoForm());
  const [editRiegoSaving, setEditRiegoSaving] = useState(false);
  const [editRiegoError, setEditRiegoError] = useState("");
  const [deleteRiegoId, setDeleteRiegoId] = useState<string | null>(null);
  // ─────────────────────────────────────────────────────────────────────────────
  const [capacityValue, setCapacityValue] = useState("");
  const [capacityError, setCapacityError] = useState("");
  const [detailPlant, setDetailPlant] = useState<Plant | null>(null);
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [quickNotes, setQuickNotes] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState("");
  const [gridStage, setGridStage] = useState<PlantStage | null>(null);

  async function loadData() {
    const nextBed = await getGrowBedById(id);
    setBed(nextBed);
    setPlants(nextBed ? await getPlantsByBed(nextBed.id) : []);
    setOccupancy(nextBed ? await getGrowBedOccupancy(nextBed.id) : null);
    setCapacityValue(nextBed ? String(nextBed.maxPlants) : "");
    setRoom(nextBed ? await getGrowRoomById(nextBed.roomId) : null);
    const [nextGenetics, nextMothers, nextMeasurements, nextRiegos] = await Promise.all([
      getGenetics(),
      getMotherPlants(),
      nextBed ? getMeasurements({ bedId: nextBed.id }) : Promise.resolve([]),
      nextBed ? getSistemaRiegoByCamilla(nextBed.id) : Promise.resolve([]),
    ]);
    setGenetics(nextGenetics);
    setMothers(nextMothers);
    setMeasurements(nextMeasurements);
    setRiegos(nextRiegos);
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


  async function handleRiegoCreate() {
    if (!bed) return;
    setRiegoError("");
    if (!riegoForm.codigoRiego.trim()) { setRiegoError("El código de riego es requerido."); return; }
    if (!riegoForm.sistemaRegado) { setRiegoError("Seleccioná un sistema de regado."); return; }
    if (riegoForm.sistemaRegado === "otro" && !riegoForm.sistemaRegadoCustom.trim()) {
      setRiegoError("Describí el sistema de regado personalizado."); return;
    }
    setRiegoSaving(true);
    try {
      await createSistemaRiego({
        codigoRiego: riegoForm.codigoRiego.trim(),
        camillaId: bed.id,
        picosPorPlanta: riegoForm.picosPorPlanta ? Number(riegoForm.picosPorPlanta) : undefined,
        horarioApertura: riegoForm.horarioApertura || undefined,
        cantidadLitros: riegoForm.cantidadLitros ? Number(riegoForm.cantidadLitros) : undefined,
        tanque: riegoForm.tanque || undefined,
        frecuenciaTiempo: riegoForm.frecuenciaTiempo || undefined,
        sistemaRegado: riegoForm.sistemaRegado,
        sistemaRegadoCustom: riegoForm.sistemaRegado === "otro" ? riegoForm.sistemaRegadoCustom : undefined,
        notas: riegoForm.notas || undefined,
      });
      setRiegos(await getSistemaRiegoByCamilla(bed.id));
      setRiegoForm(initialRiegoForm());
    } catch (err) {
      setRiegoError(err instanceof Error ? err.message : "No se pudo crear el sistema de riego.");
    } finally {
      setRiegoSaving(false);
    }
  }

  async function handleRiegoEdit() {
    if (!editRiego) return;
    setEditRiegoError("");
    if (!editRiegoForm.codigoRiego.trim()) { setEditRiegoError("El código de riego es requerido."); return; }
    if (editRiegoForm.sistemaRegado === "otro" && !editRiegoForm.sistemaRegadoCustom.trim()) {
      setEditRiegoError("Describí el sistema de regado personalizado."); return;
    }
    setEditRiegoSaving(true);
    try {
      await updateSistemaRiego(editRiego.id, {
        codigoRiego: editRiegoForm.codigoRiego.trim(),
        picosPorPlanta: editRiegoForm.picosPorPlanta ? Number(editRiegoForm.picosPorPlanta) : undefined,
        horarioApertura: editRiegoForm.horarioApertura || undefined,
        cantidadLitros: editRiegoForm.cantidadLitros ? Number(editRiegoForm.cantidadLitros) : undefined,
        tanque: editRiegoForm.tanque || undefined,
        frecuenciaTiempo: editRiegoForm.frecuenciaTiempo || undefined,
        sistemaRegado: editRiegoForm.sistemaRegado,
        sistemaRegadoCustom: editRiegoForm.sistemaRegado === "otro" ? editRiegoForm.sistemaRegadoCustom : undefined,
        notas: editRiegoForm.notas || undefined,
      });
      setRiegos(await getSistemaRiegoByCamilla(bed!.id));
      setEditRiego(null);
    } catch (err) {
      setEditRiegoError(err instanceof Error ? err.message : "No se pudo actualizar.");
    } finally {
      setEditRiegoSaving(false);
    }
  }

  async function handleRiegoDelete() {
    if (!deleteRiegoId || !bed) return;
    try {
      await deleteSistemaRiego(deleteRiegoId);
      setRiegos(await getSistemaRiegoByCamilla(bed.id));
      setDeleteRiegoId(null);
    } catch (err) {
      setDeleteRiegoId(null);
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
            ["Ultimo PH sustrato", latestMeasurement?.substratePH],
            ["Ultimo PPM sustrato", latestMeasurement?.substratePPM],
            ["Ultimo EC sustrato", latestMeasurement?.substrateEC],
            ["Ultimo PH liquido", latestMeasurement?.liquidPH],
            ["Ultimo PPM liquido", latestMeasurement?.liquidPPM],
            ["Ultimo EC liquido", latestMeasurement?.liquidEC],
            ["Ultimo PH drenaje", latestMeasurement?.runoffPH],
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

      {/* ── Sistema de Riego ──────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Droplets className="h-5 w-5" />
            Sistema de riego
          </CardTitle>
          <CardDescription>Configuraciones de riego asociadas a esta camilla.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Formulario de nuevo riego */}
          <div className="space-y-3">
            <p className="text-sm font-medium">Nuevo sistema de riego</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1">
                <Label>Código de riego *</Label>
                <Input
                  placeholder="Ej: RIE-001"
                  value={riegoForm.codigoRiego}
                  onChange={(e) => setRiegoForm((f) => ({ ...f, codigoRiego: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Picos por planta</Label>
                <Input
                  type="number"
                  min={0}
                  placeholder="Ej: 2"
                  value={riegoForm.picosPorPlanta}
                  onChange={(e) => setRiegoForm((f) => ({ ...f, picosPorPlanta: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Horario de apertura</Label>
                <Input
                  type="time"
                  value={riegoForm.horarioApertura}
                  onChange={(e) => setRiegoForm((f) => ({ ...f, horarioApertura: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Cantidad de litros</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.1"
                  placeholder="Ej: 1.5"
                  value={riegoForm.cantidadLitros}
                  onChange={(e) => setRiegoForm((f) => ({ ...f, cantidadLitros: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Tanque</Label>
                <Input
                  placeholder="Nombre o código del tanque"
                  value={riegoForm.tanque}
                  onChange={(e) => setRiegoForm((f) => ({ ...f, tanque: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Frecuencia de tiempo</Label>
                <Input
                  placeholder="Ej: cada 6 hs"
                  value={riegoForm.frecuenciaTiempo}
                  onChange={(e) => setRiegoForm((f) => ({ ...f, frecuenciaTiempo: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Sistema de regado *</Label>
                <Select
                  value={riegoForm.sistemaRegado}
                  onValueChange={(v) => setRiegoForm((f) => ({ ...f, sistemaRegado: v as SistemaRegadoTipo, sistemaRegadoCustom: "" }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="goteo">Por goteo</SelectItem>
                    <SelectItem value="continuo_intermitente">Riego continuo intermitente</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {riegoForm.sistemaRegado === "otro" ? (
                <div className="space-y-1">
                  <Label>Descripción del sistema *</Label>
                  <Input
                    placeholder="Describí el sistema"
                    value={riegoForm.sistemaRegadoCustom}
                    onChange={(e) => setRiegoForm((f) => ({ ...f, sistemaRegadoCustom: e.target.value }))}
                  />
                </div>
              ) : null}
              <div className="space-y-1 sm:col-span-2 lg:col-span-3">
                <Label>Notas</Label>
                <Textarea
                  placeholder="Observaciones adicionales"
                  value={riegoForm.notas}
                  onChange={(e) => setRiegoForm((f) => ({ ...f, notas: e.target.value }))}
                />
              </div>
            </div>
            {riegoError ? (
              <p className="rounded-md border border-red-200 bg-red-500/10 p-3 text-sm text-red-700">{riegoError}</p>
            ) : null}
            <Button onClick={() => void handleRiegoCreate()} disabled={riegoSaving} className="gap-2">
              <Plus className="h-4 w-4" />
              {riegoSaving ? "Guardando…" : "Agregar sistema de riego"}
            </Button>
          </div>

          {/* Tabla */}
          {riegos.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Picos/planta</TableHead>
                    <TableHead>Horario apertura</TableHead>
                    <TableHead>Litros</TableHead>
                    <TableHead>Tanque</TableHead>
                    <TableHead>Frecuencia</TableHead>
                    <TableHead>Sistema</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {riegos.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-sm font-medium">{r.codigoRiego}</TableCell>
                      <TableCell>{r.picosPorPlanta ?? "—"}</TableCell>
                      <TableCell>{r.horarioApertura ?? "—"}</TableCell>
                      <TableCell>{r.cantidadLitros != null ? `${r.cantidadLitros} L` : "—"}</TableCell>
                      <TableCell>{r.tanque ?? "—"}</TableCell>
                      <TableCell>{r.frecuenciaTiempo ?? "—"}</TableCell>
                      <TableCell>
                        {r.sistemaRegado === "otro"
                          ? r.sistemaRegadoCustom ?? "Otro"
                          : SISTEMA_REGADO_LABEL[r.sistemaRegado]}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setEditRiegoForm({
                                  codigoRiego: r.codigoRiego,
                                  picosPorPlanta: r.picosPorPlanta != null ? String(r.picosPorPlanta) : "",
                                  horarioApertura: r.horarioApertura ?? "",
                                  cantidadLitros: r.cantidadLitros != null ? String(r.cantidadLitros) : "",
                                  tanque: r.tanque ?? "",
                                  frecuenciaTiempo: r.frecuenciaTiempo ?? "",
                                  sistemaRegado: r.sistemaRegado,
                                  sistemaRegadoCustom: r.sistemaRegadoCustom ?? "",
                                  notas: r.notas ?? "",
                                });
                                setEditRiego(r);
                              }}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600 focus:text-red-600"
                              onClick={() => setDeleteRiegoId(r.id)}
                            >
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
          ) : (
            <p className="text-sm text-muted-foreground">No hay sistemas de riego registrados para esta camilla.</p>
          )}
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
              <button
                key={stage}
                type="button"
                onClick={() => setGridStage((prev) => (prev === stage ? null : stage))}
                className={[
                  "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium transition-all",
                  PLANT_STAGE_CLASS[stage],
                  gridStage === stage
                    ? "ring-2 ring-offset-1 ring-current scale-105 shadow-sm"
                    : gridStage !== null
                      ? "opacity-40"
                      : "",
                ].join(" ")}
              >
                {STAGE_LABEL[stage]}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-5 gap-2 sm:grid-cols-8 md:grid-cols-10 xl:grid-cols-12">
            {Array.from({ length: Math.min(bed.maxPlants, 100) }, (_, index) => {
              const position = index + 1;
              const plant = plantsByPosition.get(position);
              const displayStage = gridStage ?? plant?.stage;
              return (
                <button
                  key={position}
                  type="button"
                  onClick={() => { if (plant) setDetailPlant(plant); }}
                  className={[
                    "min-h-[6rem] rounded-md border p-1 text-left transition-colors",
                    displayStage
                      ? PLANT_STAGE_CLASS[displayStage]
                      : "border-dashed bg-muted/30 text-muted-foreground hover:bg-muted/50",
                  ].join(" ")}
                >
                  <span className="block font-mono text-[10px] leading-none">#{position}</span>
                  <span className="mt-0.5 block truncate text-[11px] font-medium leading-tight">
                    {plant ? shortCode(plant.internalCode) : "vacío"}
                  </span>
                  {plant ? <span className="block truncate text-[10px] leading-tight">{STAGE_LABEL[displayStage ?? plant.stage]}</span> : null}
                  {plant ? <span className="block truncate text-[10px] leading-tight opacity-80">{PLANT_STATUS_LABEL[plant.status]}</span> : null}
                  {plant ? (
                    <span className="block truncate text-[10px] leading-tight opacity-70">
                      {plant.motherPlantCode ?? "Sin madre"}
                    </span>
                  ) : null}
                  {plant ? (
                    <span className="block truncate text-[10px] font-medium leading-tight">
                      {plant.geneticsName ?? "Sin genética"}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Modal de detalle de planta */}
      <Dialog open={Boolean(detailPlant)} onOpenChange={(open) => { if (!open) setDetailPlant(null); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalle de planta</DialogTitle>
            <DialogDescription>
              Información completa de la planta seleccionada.
            </DialogDescription>
          </DialogHeader>
          {detailPlant ? (
            <div className="space-y-4">
              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">Código</p>
                  <p className="font-mono">{detailPlant.internalCode}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Nombre</p>
                  <p>{detailPlant.plantName ?? "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Madre de origen</p>
                  <p className="font-mono">{detailPlant.motherPlantCode ?? "Sin madre"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Camilla</p>
                  <p className="font-mono">{bed?.name ?? detailPlant.bedId}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Posición</p>
                  <p className="font-mono">#{detailPlant.bedPosition}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Lote</p>
                  <p className="font-mono">{detailPlant.batchId ?? "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Etapa</p>
                  <Badge variant="outline" className={PLANT_STAGE_CLASS[detailPlant.stage]}>
                    {STAGE_LABEL[detailPlant.stage]}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Estado</p>
                  <Badge variant="outline" className={PLANT_STATUS_CLASS[detailPlant.status]}>
                    {PLANT_STATUS_LABEL[detailPlant.status]}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Origen</p>
                  <p>{PLANT_ORIGIN_LABEL[detailPlant.origin]}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Fecha inicio</p>
                  <p className="font-mono">{detailPlant.startDate ?? "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Fecha inicio etapa</p>
                  <p className="font-mono">{detailPlant.stageStartDate ?? "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Código maceta</p>
                  <p className="font-mono">{detailPlant.potCode ?? "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Litros maceta</p>
                  <p className="font-mono">{detailPlant.potSizeLiters != null ? `${detailPlant.potSizeLiters} L` : "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Tipo maceta</p>
                  <p>{detailPlant.potType ?? "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Sustrato</p>
                  <p>{detailPlant.substrate ?? "-"}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs text-muted-foreground">Observaciones</p>
                  <p className="whitespace-pre-wrap">{detailPlant.notes ?? "-"}</p>
                </div>
                <div className="sm:col-span-2 space-y-2">
                  <p className="text-xs text-muted-foreground">Genética</p>
                  <p className="font-semibold">{detailPlant.geneticsName ?? "Sin genética"}</p>
                  {(() => {
                    const gen = genetics.find((g) => g.id === detailPlant.geneticsId);
                    if (!gen || (gen.sativaPercent == null && gen.indicaPercent == null)) return null;
                    const sativa = gen.sativaPercent ?? 0;
                    const indica = gen.indicaPercent ?? 0;
                    const dominant = sativa >= indica ? "sativa" : "indica";
                    return (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="text-green-700">{sativa}% Sativa</span>
                          <span className="text-violet-700">{indica}% Indica</span>
                        </div>
                        <div className="flex h-3 overflow-hidden rounded-full border">
                          <div className="bg-green-500 transition-all" style={{ width: `${sativa}%` }} />
                          <div className="bg-violet-500 transition-all" style={{ width: `${indica}%` }} />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Predomina:{" "}
                          <span className={`font-semibold ${dominant === "sativa" ? "text-green-700" : "text-violet-700"}`}>
                            {dominant === "sativa" ? "Sativa" : "Indica"}
                          </span>
                        </p>
                      </div>
                    );
                  })()}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setDetailPlant(null)}>Cerrar</Button>
                <Button
                  className="gap-2"
                  onClick={() => {
                    const plant = detailPlant;
                    setDetailPlant(null);
                    setSelectedPlant(plant);
                    setQuickNotes(plant.notes ?? "");
                  }}
                >
                  <Pencil className="h-4 w-4" />
                  Editar planta
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Dialog Editar Riego */}
      <Dialog open={Boolean(editRiego)} onOpenChange={(open) => { if (!open) setEditRiego(null); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar sistema de riego</DialogTitle>
            <DialogDescription>Modificá los datos del sistema de riego.</DialogDescription>
          </DialogHeader>
          {editRiego ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>Código de riego *</Label>
                <Input
                  value={editRiegoForm.codigoRiego}
                  onChange={(e) => setEditRiegoForm((f) => ({ ...f, codigoRiego: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Picos por planta</Label>
                <Input
                  type="number"
                  min={0}
                  value={editRiegoForm.picosPorPlanta}
                  onChange={(e) => setEditRiegoForm((f) => ({ ...f, picosPorPlanta: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Horario de apertura</Label>
                <Input
                  type="time"
                  value={editRiegoForm.horarioApertura}
                  onChange={(e) => setEditRiegoForm((f) => ({ ...f, horarioApertura: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Cantidad de litros</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.1"
                  value={editRiegoForm.cantidadLitros}
                  onChange={(e) => setEditRiegoForm((f) => ({ ...f, cantidadLitros: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Tanque</Label>
                <Input
                  value={editRiegoForm.tanque}
                  onChange={(e) => setEditRiegoForm((f) => ({ ...f, tanque: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Frecuencia de tiempo</Label>
                <Input
                  value={editRiegoForm.frecuenciaTiempo}
                  onChange={(e) => setEditRiegoForm((f) => ({ ...f, frecuenciaTiempo: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Sistema de regado *</Label>
                <Select
                  value={editRiegoForm.sistemaRegado}
                  onValueChange={(v) => setEditRiegoForm((f) => ({ ...f, sistemaRegado: v as SistemaRegadoTipo, sistemaRegadoCustom: "" }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="goteo">Por goteo</SelectItem>
                    <SelectItem value="continuo_intermitente">Riego continuo intermitente</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {editRiegoForm.sistemaRegado === "otro" ? (
                <div className="space-y-1">
                  <Label>Descripción del sistema *</Label>
                  <Input
                    value={editRiegoForm.sistemaRegadoCustom}
                    onChange={(e) => setEditRiegoForm((f) => ({ ...f, sistemaRegadoCustom: e.target.value }))}
                  />
                </div>
              ) : null}
              <div className="space-y-1 sm:col-span-2">
                <Label>Notas</Label>
                <Textarea
                  value={editRiegoForm.notas}
                  onChange={(e) => setEditRiegoForm((f) => ({ ...f, notas: e.target.value }))}
                />
              </div>
            </div>
          ) : null}
          {editRiegoError ? (
            <p className="rounded-md border border-red-200 bg-red-500/10 p-3 text-sm text-red-700">{editRiegoError}</p>
          ) : null}
          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" onClick={() => setEditRiego(null)}>Cancelar</Button>
            <Button onClick={() => void handleRiegoEdit()} disabled={editRiegoSaving}>
              {editRiegoSaving ? "Guardando…" : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Confirmar Eliminar Riego */}
      <Dialog open={Boolean(deleteRiegoId)} onOpenChange={(open) => { if (!open) setDeleteRiegoId(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar sistema de riego</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. ¿Confirmás la eliminación?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteRiegoId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => void handleRiegoDelete()}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BulkCreatePlantsDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        beds={bed ? [bed] : []}
        genetics={genetics}
        mothers={mothers}
        defaultBedId={bed?.id}
        onSuccess={() => void loadData()}
      />

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

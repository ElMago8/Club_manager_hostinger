import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, FlaskConical, Pencil, Plus, SendHorizonal, Timer, TimerOff, Trash2 } from "lucide-react";
import { DeleteConfirmDialog } from "@/components/cultivation/DeleteConfirmDialog";
import { RelationshipWarning } from "@/components/cultivation/RelationshipWarning";
import { BulkCreateClonadorDialog } from "@/components/cultivation/BulkCreateClonadorDialog";
import { Badge } from "@/components/ui/badge";
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
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getCamillasOnly, deleteClonador, getClonadorById, getClonadorOccupancy, updateClonadorCapacity, sendToGrowBed, type GrowBedOccupancy } from "@/services/growBedService";
import { getMeasurements } from "@/services/measurementService";
import { getGrowRoomById } from "@/services/growRoomService";
import { getGenetics } from "@/services/geneticsService";
import { getMotherPlants } from "@/services/motherPlantService";
import { apiRequest } from "@/services/cultivationApi";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { getPlants } from "@/services/plantService";
import type { BedStatus, CultivationMeasurement, Genetics, GrowBed, GrowRoom, MeasurementStatus, MotherPlant, Plant, PlantOrigin, PlantStage, PlantStatus } from "@/types/cultivation";

export const Route = createFileRoute("/app/cultivo/clonador/$id")({
  head: () => ({ meta: [{ title: "Detalle de clonador · Cannabis Club Manager" }] }),
  component: ClonadorDetailPage,
});

const BED_STATUS_CLASS: Record<BedStatus, string> = {
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

const PLANT_STATUS_CLASS: Record<PlantStatus, string> = {
  normal: "border-emerald-200 bg-emerald-500/10 text-emerald-700",
  observacion: "border-sky-200 bg-sky-500/10 text-sky-700",
  alerta: "border-amber-200 bg-amber-500/10 text-amber-700",
  descartada: "border-muted bg-muted text-muted-foreground",
  cosechada: "border-violet-200 bg-violet-500/10 text-violet-700",
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

function shortCode(code: string): string {
  const parts = code.split("-");
  return parts.slice(-2).join("-");
}

function elapsedLabel(startIso: string, now: number): string {
  const ms = now - new Date(startIso).getTime();
  if (ms < 0) return "0h";
  const totalHours = Math.floor(ms / 3_600_000);
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  return days > 0 ? `${days}d ${hours}h` : `${totalHours}h`;
}

function ClonadorDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [clonador, setClonador] = useState<GrowBed | null>(null);
  const [room, setRoom] = useState<GrowRoom | null>(null);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [occupancy, setOccupancy] = useState<GrowBedOccupancy | null>(null);
  const [measurements, setMeasurements] = useState<CultivationMeasurement[]>([]);
  const [camillas, setCamillas] = useState<GrowBed[]>([]);
  const [genetics, setGenetics] = useState<Genetics[]>([]);
  const [mothers, setMothers] = useState<MotherPlant[]>([]);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [capacityValue, setCapacityValue] = useState("");
  const [capacityError, setCapacityError] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sendOpen, setSendOpen] = useState(false);
  const [targetCamillaId, setTargetCamillaId] = useState("");
  const [sendError, setSendError] = useState("");
  const [sendLoading, setSendLoading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState("");
  const [stopContadorOpen, setStopContadorOpen] = useState(false);
  const [detailPlant, setDetailPlant] = useState<Plant | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const [incSubstratePH, setIncSubstratePH] = useState(false);
  const [incSubstratePPM, setIncSubstratePPM] = useState(false);
  const [incLiquidPH, setIncLiquidPH] = useState(false);
  const [incLiquidPPM, setIncLiquidPPM] = useState(false);
  const [mSubstratePH, setMSubstratePH] = useState("");
  const [mSubstratePPM, setMSubstratePPM] = useState("");
  const [mLiquidPH, setMLiquidPH] = useState("");
  const [mLiquidPPM, setMLiquidPPM] = useState("");
  const [mSaving, setMSaving] = useState(false);
  const [mError, setMError] = useState("");
  const [mDeleteId, setMDeleteId] = useState<string | null>(null);
  const [mDeleting, setMDeleting] = useState(false);

  async function loadData() {
    const next = await getClonadorById(id);
    setClonador(next);
    if (!next) return;
    setPlants(await getPlants({ clonadorId: next.id }));
    setOccupancy(await getClonadorOccupancy(next.id));
    setCapacityValue(String(next.maxPlants));
    setRoom(await getGrowRoomById(next.roomId));
    setMeasurements(await getMeasurements({ clonadorId: next.id }));
    setCamillas(await getCamillasOnly());
    const [nextGenetics, nextMothers] = await Promise.all([getGenetics(), getMotherPlants()]);
    setGenetics(nextGenetics);
    setMothers(nextMothers);
  }

  useEffect(() => { void loadData(); }, [id]);

  const plantsByPosition = useMemo(() => {
    const m = new Map<number, Plant>();
    for (const p of plants) m.set(p.bedPosition, p);
    return m;
  }, [plants]);

  const latestMeasurement = measurements[0];
  const activePlants = plants.filter((p) => p.status !== "descartada");
  const freeSlots = clonador ? Math.max(clonador.maxPlants - activePlants.length, 0) : 0;

  function toggleSelect(plantId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(plantId)) next.delete(plantId);
      else next.add(plantId);
      return next;
    });
  }

  async function handleCapacityUpdate() {
    if (!clonador) return;
    setCapacityError("");
    const max = Number(capacityValue);
    if (!Number.isFinite(max) || max < 0 || max > 60) {
      setCapacityError("La capacidad debe estar entre 0 y 60."); return;
    }
    try {
      await updateClonadorCapacity(clonador.id, max);
      await loadData();
    } catch (err) {
      setCapacityError(err instanceof Error ? err.message : "Error al actualizar.");
    }
  }

  async function handleSendToCamilla() {
    if (!clonador || !targetCamillaId || selected.size === 0) return;
    setSendError("");
    setSendLoading(true);
    try {
      await sendToGrowBed(clonador.id, [...selected], targetCamillaId);
      setSelected(new Set());
      setSendOpen(false);
      setTargetCamillaId("");
      await loadData();
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "No se pudieron mover los esquejes.");
    } finally {
      setSendLoading(false);
    }
  }

  function optNum(v: string) {
    const n = Number(v);
    return v.trim() && Number.isFinite(n) ? n : undefined;
  }

  const anyMedicion = incSubstratePH || incSubstratePPM || incLiquidPH || incLiquidPPM;

  async function handleRegisterMedicion() {
    if (!clonador || !anyMedicion) return;
    setMError("");
    setMSaving(true);
    try {
      await apiRequest("/cultivation/measurements", {
        method: "POST",
        body: JSON.stringify({
          fecha: new Date().toISOString().slice(0, 10),
          hora: new Date().toTimeString().slice(0, 5),
          tipo: "mixed",
          salaCultivoId: Number(clonador.roomId),
          clonadorId: Number(clonador.id),
          phSustrato: incSubstratePH ? optNum(mSubstratePH) : undefined,
          ppmSustrato: incSubstratePPM ? optNum(mSubstratePPM) : undefined,
          phLiquido: incLiquidPH ? optNum(mLiquidPH) : undefined,
          ppmLiquido: incLiquidPPM ? optNum(mLiquidPPM) : undefined,
          estado: "normal",
          metodo: "manual_meter",
        }),
      });
      setMSubstratePH(""); setMSubstratePPM(""); setMLiquidPH(""); setMLiquidPPM("");
      setIncSubstratePH(false); setIncSubstratePPM(false); setIncLiquidPH(false); setIncLiquidPPM(false);
      await loadData();
    } catch (err) {
      setMError(err instanceof Error ? err.message : "No se pudo registrar la medición.");
    } finally {
      setMSaving(false);
    }
  }

  async function handleDeleteMedicion(id: string) {
    setMDeleting(true);
    try {
      await apiRequest(`/cultivation/measurements/${id}`, { method: "DELETE" });
      setMDeleteId(null);
      await loadData();
    } catch {
      // silently reload
      setMDeleteId(null);
    } finally {
      setMDeleting(false);
    }
  }

  async function handleDelete() {
    if (!clonador) return;
    try {
      await deleteClonador(clonador.id);
      await navigate({ to: "/app/cultivo/clonador" });
    } catch (err) {
      setDeleteMessage(err instanceof Error ? err.message : "No se pudo eliminar el clonador.");
      setDeleteOpen(false);
    }
  }

  if (!clonador) {
    return (
      <div className="mx-auto max-w-[1000px] space-y-4">
        <Button asChild variant="ghost" size="sm">
          <Link to="/app/cultivo/clonador"><ArrowLeft className="mr-2 h-4 w-4" />Volver</Link>
        </Button>
        <Card><CardContent className="py-10 text-sm text-muted-foreground">Clonador no encontrado.</CardContent></Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <Button asChild variant="ghost" size="sm" className="-ml-2">
            <Link to="/app/cultivo/clonador"><ArrowLeft className="mr-2 h-4 w-4" />Clonadores</Link>
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight">{clonador.name}</h1>
          <p className="text-sm text-muted-foreground">Grilla de esquejes y ocupación del clonador.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setBulkDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Ingreso múltiple
          </Button>
          <Button asChild className="gap-2 bg-emerald-700 hover:bg-emerald-800">
            <Link to="/app/cultivo/clonador/nueva" search={{ edit: clonador.id }}>
              <Pencil className="h-4 w-4" />Editar
            </Link>
          </Button>
          <Button
            variant="outline"
            className="gap-2 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="h-4 w-4" />Eliminar
          </Button>
          {selected.size > 0 && (
            <Button className="gap-2" onClick={() => setSendOpen(true)}>
              <SendHorizonal className="h-4 w-4" />
              Enviar a camilla ({selected.size})
            </Button>
          )}
        </div>
      </div>

      {deleteMessage && <RelationshipWarning message={deleteMessage} />}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Ficha de clonador</CardTitle>
            <CardDescription>Datos operativos y capacidad.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm md:grid-cols-2">
            <div><p className="text-muted-foreground">Código</p><p className="font-mono">{clonador.code}</p></div>
            <div><p className="text-muted-foreground">Sala asociada</p><p>{room?.name ?? clonador.roomId}</p></div>
            <div>
              <p className="text-muted-foreground">Estado</p>
              <Badge variant="outline" className={BED_STATUS_CLASS[clonador.status]}>
                {clonador.status.replace(/_/g, " ")}
              </Badge>
            </div>
            <div><p className="text-muted-foreground">Capacidad máxima</p><p className="font-mono">{clonador.maxPlants} esquejes</p></div>
            <div><p className="text-muted-foreground">Esquejes actuales</p><p className="font-mono">{clonador.currentPlants}</p></div>
            <div><p className="text-muted-foreground">Responsable</p><p>{clonador.responsibleUserId ?? "Sin asignar"}</p></div>
            <div className="md:col-span-2"><p className="text-muted-foreground">Observaciones</p><p>{clonador.notes ?? "Sin observaciones"}</p></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Capacidad disponible</CardTitle>
            <CardDescription>Slots ocupados vs. capacidad máxima.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-3">
            <div className="rounded-md border p-3">
              <p className="text-xs text-muted-foreground">Máximo</p>
              <p className="font-mono text-2xl font-semibold">{occupancy?.maxPlants ?? clonador.maxPlants}</p>
            </div>
            <div className="rounded-md border p-3">
              <p className="text-xs text-muted-foreground">Ocupados</p>
              <p className="font-mono text-2xl font-semibold">{occupancy?.occupied ?? activePlants.length}</p>
            </div>
            <div className="rounded-md border p-3">
              <p className="text-xs text-muted-foreground">Libres</p>
              <p className="font-mono text-2xl font-semibold">{occupancy?.available ?? freeSlots}</p>
            </div>
            <div className="col-span-3 space-y-2 rounded-md border p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Ocupación</p>
                  <p className="font-mono text-sm">{occupancy?.occupancyPercentage ?? 0}%</p>
                </div>
                <div className="flex items-center gap-2">
                  <Input className="w-20" type="number" min={0} max={60}
                    value={capacityValue} onChange={(e) => setCapacityValue(e.target.value)} />
                  <Button variant="outline" size="sm" onClick={() => void handleCapacityUpdate()}>
                    Editar capacidad
                  </Button>
                </div>
              </div>
              {capacityError && <p className="text-sm text-red-600">{capacityError}</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mediciones</CardTitle>
          <CardDescription>Seleccioná los parámetros a registrar y completá los valores.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {latestMeasurement && (
            <div className="rounded-md border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground">Última medición registrada · {latestMeasurement.date}</p>
                  <Badge variant="outline" className={PARAM_STATUS_CLASS[latestMeasurement.status]}>
                    {latestMeasurement.status}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                  onClick={() => setMDeleteId(latestMeasurement.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {([
                  ["substratePH", "PH sustrato", latestMeasurement.substratePH],
                  ["substratePPM", "PPM sustrato", latestMeasurement.substratePPM],
                  ["liquidPH", "PH líquido", latestMeasurement.liquidPH],
                  ["liquidPPM", "PPM líquido", latestMeasurement.liquidPPM],
                ] as [string, string, number | undefined][]).map(([key, label, value]) => (
                  <div key={key} className={`space-y-1.5 ${value == null ? "opacity-40" : ""}`}>
                    <div className="flex items-center gap-2">
                      <Checkbox checked={value != null} disabled className="pointer-events-none" />
                      <Label className="text-xs text-muted-foreground cursor-default">{label}</Label>
                    </div>
                    <p className="font-mono text-lg font-semibold pl-6">{value ?? "-"}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {measurements.length > 1 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Historial de mediciones</p>
              <div className="divide-y rounded-md border text-xs">
                {measurements.slice(1).map((m) => (
                  <div key={m.id} className="flex items-center justify-between gap-3 px-3 py-2">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground">
                      <span className="font-mono">{m.date} {m.time}</span>
                      {m.substratePH != null && <span>PH sus: <span className="font-mono font-medium text-foreground">{m.substratePH}</span></span>}
                      {m.substratePPM != null && <span>PPM sus: <span className="font-mono font-medium text-foreground">{m.substratePPM}</span></span>}
                      {m.liquidPH != null && <span>PH liq: <span className="font-mono font-medium text-foreground">{m.liquidPH}</span></span>}
                      {m.liquidPPM != null && <span>PPM liq: <span className="font-mono font-medium text-foreground">{m.liquidPPM}</span></span>}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge variant="outline" className={`text-[10px] py-0 ${PARAM_STATUS_CLASS[m.status]}`}>{m.status}</Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => setMDeleteId(m.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-md border p-4 space-y-4">
            <p className="text-sm font-medium">Registrar nueva medición</p>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox id="incSubstratePH" checked={incSubstratePH} onCheckedChange={(v) => setIncSubstratePH(Boolean(v))} />
                  <Label htmlFor="incSubstratePH" className="cursor-pointer text-sm">PH sustrato</Label>
                </div>
                {incSubstratePH && (
                  <Input type="number" min="0" max="14" step="0.01" placeholder="0.00"
                    value={mSubstratePH} onChange={(e) => setMSubstratePH(e.target.value)} />
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox id="incSubstratePPM" checked={incSubstratePPM} onCheckedChange={(v) => setIncSubstratePPM(Boolean(v))} />
                  <Label htmlFor="incSubstratePPM" className="cursor-pointer text-sm">PPM sustrato</Label>
                </div>
                {incSubstratePPM && (
                  <Input type="number" min="0" step="1" placeholder="0"
                    value={mSubstratePPM} onChange={(e) => setMSubstratePPM(e.target.value)} />
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox id="incLiquidPH" checked={incLiquidPH} onCheckedChange={(v) => setIncLiquidPH(Boolean(v))} />
                  <Label htmlFor="incLiquidPH" className="cursor-pointer text-sm">PH líquido</Label>
                </div>
                {incLiquidPH && (
                  <Input type="number" min="0" max="14" step="0.01" placeholder="0.00"
                    value={mLiquidPH} onChange={(e) => setMLiquidPH(e.target.value)} />
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox id="incLiquidPPM" checked={incLiquidPPM} onCheckedChange={(v) => setIncLiquidPPM(Boolean(v))} />
                  <Label htmlFor="incLiquidPPM" className="cursor-pointer text-sm">PPM líquido</Label>
                </div>
                {incLiquidPPM && (
                  <Input type="number" min="0" step="1" placeholder="0"
                    value={mLiquidPPM} onChange={(e) => setMLiquidPPM(e.target.value)} />
                )}
              </div>
            </div>

            {anyMedicion && (
              <div className="flex justify-end">
                <Button className="gap-2" disabled={mSaving} onClick={() => void handleRegisterMedicion()}>
                  <FlaskConical className="h-4 w-4" />
                  {mSaving ? "Registrando..." : "Registrar medición"}
                </Button>
              </div>
            )}

            {mError && (
              <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{mError}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-6">
            <div>
              <CardTitle>Grilla de esquejes</CardTitle>
              <CardDescription>
                Hacé click para seleccionar esquejes. Seleccionados: {selected.size}.
                {selected.size > 0 && (
                  <button
                    type="button"
                    className="ml-2 text-xs text-primary underline"
                    onClick={() => setSelected(new Set())}
                  >
                    Limpiar selección
                  </button>
                )}
              </CardDescription>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              {clonador.contadorInicioEn ? (
                <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-500/10 px-3 py-1.5 text-sm text-amber-700">
                  <span className="font-mono font-semibold">{elapsedLabel(clonador.contadorInicioEn, now)}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto cursor-pointer p-0 text-amber-700 hover:text-amber-900"
                    onClick={() => setStopContadorOpen(true)}
                  >
                    <TimerOff className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button variant="outline" className="gap-2 cursor-pointer" onClick={() => {
                  void apiRequest(`/cultivation/clonadores/${clonador.id}`, {
                    method: "PUT",
                    body: JSON.stringify({ contadorInicioEn: new Date().toISOString() }),
                  }).then(() => loadData());
                }}>
                  <Timer className="h-4 w-4" />
                  Activar contador
                </Button>
              )}
              {selected.size > 0 && (
                <Button size="sm" className="gap-2" onClick={() => setSendOpen(true)}>
                  <SendHorizonal className="h-4 w-4" />
                  Enviar a camilla ({selected.size})
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8 xl:grid-cols-10">
            {Array.from({ length: Math.min(clonador.maxPlants, 60) }, (_, idx) => {
              const position = idx + 1;
              const plant = plantsByPosition.get(position);
              const isSelected = plant ? selected.has(plant.id) : false;
              return (
                <button
                  key={position}
                  type="button"
                  onClick={() => {
                    if (plant) {
                      if (isSelected) {
                        toggleSelect(plant.id);
                      } else {
                        setDetailPlant(plant);
                      }
                    }
                  }}
                  onContextMenu={(e) => { e.preventDefault(); if (plant) toggleSelect(plant.id); }}
                  className={[
                    "min-h-[5.5rem] rounded-md border p-1.5 text-left transition-colors",
                    plant
                      ? [
                          PLANT_STAGE_CLASS[plant.stage] ?? "border-slate-200 bg-slate-100 text-slate-800",
                          isSelected ? "ring-2 ring-primary ring-offset-1 shadow-md" : "",
                        ].join(" ")
                      : "border-dashed border-muted bg-muted/20 cursor-default",
                  ].join(" ")}
                  title={plant ? `#${position} · ${plant.internalCode} · click para ver detalles, clic derecho para seleccionar` : `#${position} · vacío`}
                >
                  <span className="block font-mono text-[10px] leading-none opacity-70">#{position}</span>
                  <span className="mt-0.5 block truncate text-[11px] font-semibold leading-tight">
                    {plant ? shortCode(plant.internalCode) : "vacío"}
                  </span>
                  {plant && <span className="block truncate text-[10px] leading-tight">{STAGE_LABEL[plant.stage]}</span>}
                  {plant && <span className="block truncate text-[10px] leading-tight opacity-80">{PLANT_STATUS_LABEL[plant.status]}</span>}
                  {plant && (
                    <span className="block truncate text-[10px] leading-tight opacity-70">
                      {plant.motherPlantCode ?? "Sin madre"}
                    </span>
                  )}
                  {plant && (
                    <span className="block truncate text-[10px] font-medium leading-tight">
                      {plant.geneticsName ?? "Sin genética"}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Modal Enviar a camilla */}
      <Dialog open={sendOpen} onOpenChange={(o) => { setSendOpen(o); if (!o) setSendError(""); }}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>Enviar esquejes a camilla</DialogTitle>
            <DialogDescription>
              Seleccionaste {selected.size} esqueje{selected.size !== 1 ? "s" : ""}. Elegí la camilla destino.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Select value={targetCamillaId} onValueChange={setTargetCamillaId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar camilla" />
              </SelectTrigger>
              <SelectContent>
                {camillas.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} · {c.code} ({c.maxPlants - c.currentPlants} libres)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {sendError && (
              <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                {sendError}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendOpen(false)} disabled={sendLoading}>
              Cancelar
            </Button>
            <Button
              disabled={!targetCamillaId || sendLoading}
              onClick={() => void handleSendToCamilla()}
              className="gap-2"
            >
              <SendHorizonal className="h-4 w-4" />
              {sendLoading ? "Enviando..." : "Confirmar envío"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal confirmar detener contador */}
      <Dialog open={stopContadorOpen} onOpenChange={setStopContadorOpen}>
        <DialogContent className="sm:max-w-[380px]">
          <DialogHeader>
            <DialogTitle>Detener contador</DialogTitle>
            <DialogDescription>
              ¿Querés detener el contador? Se perderá el tiempo registrado{clonador.contadorInicioEn ? ` (${elapsedLabel(clonador.contadorInicioEn, now)})` : ""}.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStopContadorOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                void apiRequest(`/cultivation/clonadores/${clonador.id}`, {
                  method: "PUT",
                  body: JSON.stringify({ contadorInicioEn: null }),
                }).then(() => { setStopContadorOpen(false); void loadData(); });
              }}
            >
              <TimerOff className="mr-2 h-4 w-4" />
              Detener
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={deleteOpen}
        entityLabel="clonador"
        itemName={clonador.name}
        description={`Estás por eliminar el clonador ${clonador.name}. Si tiene esquejes u otros datos asociados, no se podrá eliminar.`}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDelete}
      />

      {/* Modal detalle de esqueje */}
      <Dialog open={Boolean(detailPlant)} onOpenChange={(open) => { if (!open) setDetailPlant(null); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalle de esqueje</DialogTitle>
            <DialogDescription>Información completa del esqueje seleccionado.</DialogDescription>
          </DialogHeader>
          {detailPlant && (
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
                  <p className="text-xs text-muted-foreground">Posición en clonador</p>
                  <p className="font-mono">#{detailPlant.bedPosition}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Lote</p>
                  <p className="font-mono">{detailPlant.batchId ?? "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Fecha inicio</p>
                  <p className="font-mono">{detailPlant.startDate ?? "-"}</p>
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
                  <p className="text-xs text-muted-foreground">Fecha inicio etapa</p>
                  <p className="font-mono">{detailPlant.stageStartDate ?? "-"}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs text-muted-foreground">Genética</p>
                  <p className="font-semibold">{detailPlant.geneticsName ?? "Sin genética"}</p>
                  {(() => {
                    const gen = genetics.find((g) => g.id === detailPlant.geneticsId);
                    if (!gen || (gen.sativaPercent == null && gen.indicaPercent == null)) return null;
                    const sativa = gen.sativaPercent ?? 0;
                    const indica = gen.indicaPercent ?? 0;
                    return (
                      <div className="mt-1.5 space-y-1">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="text-green-700">{sativa}% Sativa</span>
                          <span className="text-violet-700">{indica}% Indica</span>
                        </div>
                        <div className="flex h-3 overflow-hidden rounded-full border">
                          <div className="bg-green-500 transition-all" style={{ width: `${sativa}%` }} />
                          <div className="bg-violet-500 transition-all" style={{ width: `${indica}%` }} />
                        </div>
                      </div>
                    );
                  })()}
                </div>
                {detailPlant.notes && (
                  <div className="sm:col-span-2">
                    <p className="text-xs text-muted-foreground">Observaciones</p>
                    <p className="whitespace-pre-wrap text-sm">{detailPlant.notes}</p>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <Button variant="outline" size="sm" asChild>
                  <Link to="/app/cultivo/plantas">
                    Ver en lista
                  </Link>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => { setDetailPlant(null); toggleSelect(detailPlant.id); }}
                >
                  Seleccionar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <BulkCreateClonadorDialog
        open={bulkDialogOpen}
        onOpenChange={setBulkDialogOpen}
        clonadorId={clonador.id}
        clonadorName={clonador.name}
        freeSlots={freeSlots}
        genetics={genetics}
        mothers={mothers}
        onSuccess={() => void loadData()}
      />

      <Dialog open={mDeleteId !== null} onOpenChange={(open) => { if (!open) setMDeleteId(null); }}>
        <DialogContent className="sm:max-w-[380px]">
          <DialogHeader>
            <DialogTitle>Eliminar medición</DialogTitle>
            <DialogDescription>
              ¿Eliminar esta medición? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMDeleteId(null)} disabled={mDeleting}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={mDeleting}
              onClick={() => { if (mDeleteId) void handleDeleteMedicion(mDeleteId); }}
            >
              {mDeleting ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

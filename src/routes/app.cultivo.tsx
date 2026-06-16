import { type FormEvent, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { createFileRoute, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DateInput } from "@/components/ui/date-input";
import { Input } from "@/components/ui/input";
import { Label as FormLabel } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Dna,
  Eye,
  FileText,
  LayersIcon,
  LayoutGrid,
  Leaf,
  MoreVertical,
  Pencil,
  Plus,
  Save,
  Sprout,
  TestTube,
  Timer,
  Trash2,
  TrendingUp,
  Upload,
  Warehouse,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Cell, Label, Pie, PieChart } from "recharts";
import { getEnvironmentalLogs } from "@/services/environmentalService";
import { getGenetics } from "@/services/geneticsService";
import { getGrowBeds } from "@/services/growBedService";
import { getGrowRooms } from "@/services/growRoomService";
import { getMotherPlants, type MotherPlantWithPlantCount } from "@/services/motherPlantService";
import { getPlants } from "@/services/plantService";
import { createBatch, getBatches, updateBatch, type CreateBatchPayload } from "@/services/batchService";
import type { Batch, EnvironmentalLog, Genetics, GrowBed, GrowRoom, Plant } from "@/types/cultivation";

type CultivoSection = "resumen" | "trazabilidad" | "lotes" | "rendimientos" | "inventario";

export const Route = createFileRoute("/app/cultivo")({
  head: () => ({
    meta: [
      { title: "Cultivo · Cannabis Club Manager" },
      { name: "description", content: "Trazabilidad y seguimiento de cultivo interno." },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): { section?: CultivoSection } => {
    const section = search.section;
    if (
      section === "resumen" ||
      section === "trazabilidad" ||
      section === "lotes" ||
      section === "rendimientos" ||
      section === "inventario"
    ) {
      return { section };
    }
    return {};
  },
  component: CultivoPage,
});

type Priority = "alta" | "media" | "baja";
type TaskStatus = "pendiente" | "en curso" | "completada";

const tareas: Array<{
  tarea: string;
  responsable: string;
  prioridad: Priority;
  estado: TaskStatus;
  fecha: string;
}> = [
  { tarea: "Revisar sala Floración 1", responsable: "M. López", prioridad: "alta", estado: "pendiente", fecha: "Hoy · 14:00" },
  { tarea: "Medir parámetros de drenaje", responsable: "J. Pérez", prioridad: "media", estado: "en curso", fecha: "Hoy · 17:30" },
  { tarea: "Inspección sanitaria", responsable: "S. Gómez", prioridad: "alta", estado: "pendiente", fecha: "Mañana · 09:00" },
  { tarea: "Preparar cosecha", responsable: "R. Díaz", prioridad: "media", estado: "pendiente", fecha: "Jue · 08:00" },
];

const geneticas: Array<{
  genetica: string;
  tipo: string;
  rendimiento: string;
  estado: string;
  notas: string;
}> = [
  { genetica: "Northern Lights", tipo: "Índica", rendimiento: "450 g/m²", estado: "activa", notas: "Buen comportamiento en sala 2." },
  { genetica: "Amnesia Haze", tipo: "Sativa", rendimiento: "500 g/m²", estado: "activa", notas: "Sensible a humedad alta." },
  { genetica: "Critical +", tipo: "Híbrida", rendimiento: "550 g/m²", estado: "en prueba", notas: "Ciclo corto · revisar floración." },
  { genetica: "White Widow", tipo: "Híbrida", rendimiento: "480 g/m²", estado: "archivada", notas: "Reemplazada por lote nuevo." },
];

const madres: Array<{
  madre: string;
  sanitario: "óptimo" | "observación" | "tratamiento";
  esquejes: number;
  revision: string;
}> = [
  { madre: "Madre NL-01", sanitario: "óptimo", esquejes: 24, revision: "Vie · 10:00" },
  { madre: "Madre AH-02", sanitario: "observación", esquejes: 12, revision: "Hoy · 16:00" },
  { madre: "Madre CR-03", sanitario: "óptimo", esquejes: 30, revision: "Lun · 09:30" },
  { madre: "Madre WW-04", sanitario: "tratamiento", esquejes: 0, revision: "Mié · 11:00" },
];

type QCStatus = "Aprobado" | "Pendiente" | "Observado" | "Retenido";

const controlesCalidad: Array<{
  lote: string;
  tipo: string;
  estado: QCStatus;
  fecha: string;
  resultado: string;
  archivo: string;
}> = [
  { lote: "FL-2026-05-KB01", tipo: "Metales pesados", estado: "Aprobado", fecha: "2026-05-10", resultado: "< 0,5 ppm", archivo: "Informe metales pesados · PDF" },
  { lote: "FL-2026-05-KB01", tipo: "Microbiología", estado: "Aprobado", fecha: "2026-05-11", resultado: "Negativo", archivo: "Microbiología lote FL-2026-05-KB01 · PDF" },
  { lote: "FL-2026-04-AH02", tipo: "Potencia", estado: "Observado", fecha: "2026-05-08", resultado: "18,2 % THC", archivo: "Potencia lote FL-2026-04-AH02 · PDF" },
  { lote: "FL-2026-04-AH02", tipo: "Pesticidas", estado: "Retenido", fecha: "2026-05-09", resultado: "Traza detectada", archivo: "Pesticidas lote FL-2026-04-AH02 · PDF" },
  { lote: "FL-2026-03-WW03", tipo: "Humedad", estado: "Pendiente", fecha: "2026-05-12", resultado: "En análisis", archivo: "Humedad lote FL-2026-03-WW03 · PDF" },
];

const archivosLotes: Array<{
  lote: string;
  tipoArchivo: string;
  nombre: string;
  estado: "Activo" | "Archivado";
  fecha: string;
}> = [
  { lote: "FL-2026-05-KB01", tipoArchivo: "Informe laboratorio", nombre: "Lab-FL-2026-05-KB01.pdf", estado: "Activo", fecha: "2026-05-10" },
  { lote: "FL-2026-05-KB01", tipoArchivo: "Foto de lote", nombre: "Foto-FL-2026-05-KB01-01.jpg", estado: "Activo", fecha: "2026-05-09" },
  { lote: "FL-2026-04-AH02", tipoArchivo: "Registro técnico", nombre: "Reg-Tec-FL-2026-04-AH02.pdf", estado: "Activo", fecha: "2026-04-28" },
  { lote: "FL-2026-04-AH02", tipoArchivo: "Acta interna", nombre: "Acta-FL-2026-04-AH02.pdf", estado: "Archivado", fecha: "2026-04-15" },
  { lote: "FL-2026-03-WW03", tipoArchivo: "Control sanitario", nombre: "Sanitario-FL-2026-03-WW03.pdf", estado: "Activo", fecha: "2026-03-20" },
];

type CuradoStatus = "En curado" | "Liberado" | "Retenido" | "Observado";
type UploadTarget = {
  source: "control" | "archivo";
  lote: string;
  title: string;
  description: string;
};
type DetailTarget = {
  title: string;
  rows: Array<{ label: string; value: string }>;
};

const BATCH_STATUS_OPTIONS = ["activo", "floracion", "cosechado", "cerrado", "descartado"];

function todayInputDate() {
  return new Date().toISOString().slice(0, 10);
}

function emptyBatchForm(): CreateBatchPayload {
  return {
    code: "",
    geneticsId: "",
    roomId: "",
    status: "activo",
    startDate: todayInputDate(),
    floweringStartDate: "",
    estimatedHarvestDate: "",
    realHarvestDate: "",
    notes: "",
  };
}

function batchToForm(batch: Batch): CreateBatchPayload {
  return {
    code: batch.code,
    geneticsId: batch.geneticsId,
    roomId: batch.roomId,
    status: batch.status,
    startDate: batch.startDate || todayInputDate(),
    floweringStartDate: batch.floweringStartDate ?? "",
    estimatedHarvestDate: batch.estimatedHarvestDate ?? "",
    realHarvestDate: batch.realHarvestDate ?? "",
    notes: batch.notes ?? "",
  };
}

const rendimientosLote: Array<{
  lote: string;
  genetica: string;
  sala: string;
  pesoSeco: string;
  merma: string;
  diasFlora: number;
  incidencias: string;
  estado: CuradoStatus;
}> = [
  { lote: "FL-2026-05-KB01", genetica: "Critical +", sala: "Sala A", pesoSeco: "2.340 g", merma: "8,2 %", diasFlora: 58, incidencias: "Ninguna", estado: "Liberado" },
  { lote: "FL-2026-04-AH02", genetica: "Amnesia Haze", sala: "Sala B", pesoSeco: "1.890 g", merma: "12,1 %", diasFlora: 65, incidencias: "Mildiu leve", estado: "Retenido" },
  { lote: "FL-2026-03-WW03", genetica: "White Widow", sala: "Sala A", pesoSeco: "2.120 g", merma: "9,5 %", diasFlora: 60, incidencias: "Ninguna", estado: "Liberado" },
  { lote: "FL-2026-02-NL01", genetica: "Northern Lights", sala: "Sala C", pesoSeco: "1.560 g", merma: "15,3 %", diasFlora: 55, incidencias: "Plagas menores", estado: "Observado" },
];

const rendimientosGenetica: Array<{
  genetica: string;
  promedio: string;
  lotesCompletados: number;
  incidencias: string;
  estado: string;
}> = [
  { genetica: "Critical +", promedio: "550 g/m²", lotesCompletados: 6, incidencias: "Baja", estado: "Óptima" },
  { genetica: "Northern Lights", promedio: "450 g/m²", lotesCompletados: 8, incidencias: "Baja", estado: "Óptima" },
  { genetica: "Amnesia Haze", promedio: "480 g/m²", lotesCompletados: 4, incidencias: "Media", estado: "En revisión" },
  { genetica: "White Widow", promedio: "480 g/m²", lotesCompletados: 5, incidencias: "Baja", estado: "Óptima" },
];

const rendimientosSala: Array<{
  sala: string;
  lotesCompletados: number;
  pesoSecoTotal: string;
  incidencias: string;
  promedio: string;
}> = [
  { sala: "Sala A", lotesCompletados: 7, pesoSecoTotal: "14.200 g", incidencias: "Baja", promedio: "2.028 g/lote" },
  { sala: "Sala B", lotesCompletados: 5, pesoSecoTotal: "9.800 g", incidencias: "Media", promedio: "1.960 g/lote" },
  { sala: "Sala C", lotesCompletados: 3, pesoSecoTotal: "5.100 g", incidencias: "Alta", promedio: "1.700 g/lote" },
];

const curadoAvanzado: Array<{
  lote: string;
  genetica: string;
  fechaIngreso: string;
  diasCurado: number;
  pesoSecoFinal: string;
  estado: CuradoStatus;
  observaciones: string;
}> = [
  { lote: "FL-2026-05-KB01", genetica: "Critical +", fechaIngreso: "2026-05-10", diasCurado: 14, pesoSecoFinal: "2.340 g", estado: "En curado", observaciones: "Humedad estable · 62 % RH" },
  { lote: "FL-2026-04-AH02", genetica: "Amnesia Haze", fechaIngreso: "2026-04-28", diasCurado: 26, pesoSecoFinal: "1.890 g", estado: "Retenido", observaciones: "Esperando resultado de laboratorio." },
  { lote: "FL-2026-03-WW03", genetica: "White Widow", fechaIngreso: "2026-03-15", diasCurado: 45, pesoSecoFinal: "2.120 g", estado: "Liberado", observaciones: "Aprobado para stock." },
  { lote: "FL-2026-02-NL01", genetica: "Northern Lights", fechaIngreso: "2026-02-20", diasCurado: 60, pesoSecoFinal: "1.560 g", estado: "Observado", observaciones: "Revisar olor antes de liberar." },
];

const STOCK_COLORS = ["#0f766e", "#f59e0b", "#2563eb", "#dc2626", "#7c3aed"];

function parseGramValue(value: string): number {
  return Number(value.replace(/\./g, "").replace(",", ".").replace(/[^\d.]/g, "")) || 0;
}

const stockPorGenetica = Array.from(
  curadoAvanzado.reduce((stockMap, row) => {
    stockMap.set(row.genetica, (stockMap.get(row.genetica) ?? 0) + parseGramValue(row.pesoSecoFinal));
    return stockMap;
  }, new Map<string, number>()),
).map(([genetica, cantidad], index) => ({
  genetica,
  cantidad,
  fill: STOCK_COLORS[index % STOCK_COLORS.length],
}));

const stockTotal = stockPorGenetica.reduce((total, item) => total + item.cantidad, 0);

const stockChartConfig = {
  cantidad: {
    label: "Stock",
  },
} satisfies ChartConfig;

const VPD_STATUS_CLASS: Record<NonNullable<EnvironmentalLog["vpdStatus"]>, string> = {
  bajo: "border-sky-200 bg-sky-500/10 text-sky-700",
  optimo: "border-emerald-200 bg-emerald-500/10 text-emerald-700",
  alto: "border-amber-200 bg-amber-500/10 text-amber-700",
  critico: "border-red-200 bg-red-500/10 text-red-700",
};

function priorityVariant(p: Priority): "default" | "secondary" | "destructive" {
  if (p === "alta") return "destructive";
  if (p === "media") return "default";
  return "secondary";
}

function statusVariant(s: TaskStatus): "default" | "secondary" | "outline" {
  if (s === "en curso") return "default";
  if (s === "completada") return "secondary";
  return "outline";
}

function sanitaryVariant(s: "óptimo" | "observación" | "tratamiento"): "default" | "secondary" | "destructive" {
  if (s === "óptimo") return "secondary";
  if (s === "observación") return "default";
  return "destructive";
}

function qcStatusVariant(s: QCStatus): "default" | "secondary" | "outline" | "destructive" {
  if (s === "Aprobado") return "secondary";
  if (s === "Observado") return "default";
  if (s === "Retenido") return "destructive";
  return "outline";
}

function curadoVariant(s: CuradoStatus): "default" | "secondary" | "outline" | "destructive" {
  if (s === "Liberado") return "secondary";
  if (s === "En curado") return "default";
  if (s === "Retenido") return "destructive";
  return "outline";
}

function CultivoPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { section } = Route.useSearch();
  const activeSection = section ?? "resumen";

  const [rooms, setRooms] = useState<GrowRoom[]>([]);
  const [beds, setBeds] = useState<GrowBed[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [genetics, setGenetics] = useState<Genetics[]>([]);
  const [mothers, setMothers] = useState<MotherPlantWithPlantCount[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [logs, setLogs] = useState<EnvironmentalLog[]>([]);
  const [batchFormOpen, setBatchFormOpen] = useState(false);
  const [editingBatchId, setEditingBatchId] = useState<string | null>(null);
  const [batchSaving, setBatchSaving] = useState(false);
  const [batchForm, setBatchForm] = useState<CreateBatchPayload>(() => emptyBatchForm());
  const [batchDetailTarget, setBatchDetailTarget] = useState<Batch | null>(null);
  const [uploadTarget, setUploadTarget] = useState<UploadTarget | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [detailTarget, setDetailTarget] = useState<DetailTarget | null>(null);

  useEffect(() => {
    void Promise.all([
      getGrowRooms(),
      getGrowBeds(),
      getPlants(),
      getGenetics(),
      getMotherPlants(),
      getBatches(),
      getEnvironmentalLogs(),
    ]).then(([nextRooms, nextBeds, nextPlants, nextGenetics, nextMothers, nextBatches, nextLogs]) => {
      setRooms(nextRooms);
      setBeds(nextBeds);
      setPlants(nextPlants);
      setGenetics(nextGenetics);
      setMothers(nextMothers);
      setBatches(nextBatches);
      setLogs(nextLogs);
    });
  }, []);

  const activePlants = plants.filter((plant) => plant.status !== "descartada" && plant.status !== "cosechada");
  const activeLots = batches.filter((batch) => batch.status === "activo" || batch.status === "floracion").length;
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

  const resumeCards: Array<{ label: string; value: number; Icon: LucideIcon; accent: string; panel: string; iconClass: string }> = [
    { label: "Salas activas",        value: rooms.filter((room) => room.status === "activa").length, Icon: Warehouse,    accent: "bg-sky-500",    panel: "bg-sky-500/10",    iconClass: "text-sky-600 dark:text-sky-400" },
    { label: "Camillas activas",     value: beds.filter((bed) => bed.status === "activa").length,   Icon: LayoutGrid,   accent: "bg-teal-500",   panel: "bg-teal-500/10",   iconClass: "text-teal-600 dark:text-teal-400" },
    { label: "Plantas activas",      value: activePlants.length,                                     Icon: Sprout,       accent: "bg-emerald-500", panel: "bg-emerald-500/10", iconClass: "text-emerald-600 dark:text-emerald-400" },
    { label: "Lotes activos",        value: activeLots,                                              Icon: LayersIcon,   accent: "bg-indigo-500", panel: "bg-indigo-500/10", iconClass: "text-indigo-600 dark:text-indigo-400" },
    { label: "Geneticas activas",    value: genetics.length,                                         Icon: Dna,          accent: "bg-violet-500", panel: "bg-violet-500/10", iconClass: "text-violet-600 dark:text-violet-400" },
    { label: "Madres activas",       value: activeMothers.length,                                    Icon: Leaf,         accent: "bg-lime-500",   panel: "bg-lime-500/10",   iconClass: "text-lime-600 dark:text-lime-400" },
    { label: "Alertas VPD",          value: vpdAlerts.length,                                        Icon: AlertTriangle, accent: "bg-amber-500", panel: "bg-amber-500/10", iconClass: "text-amber-600 dark:text-amber-400" },
    { label: "Registros ambientales", value: logs.length,                                            Icon: Activity,     accent: "bg-slate-500",  panel: "bg-slate-500/10",  iconClass: "text-slate-600 dark:text-slate-400" },
  ];

  function roomName(roomId: string): string {
    return rooms.find((room) => room.id === roomId)?.name ?? roomId;
  }

  function bedName(bedId?: string): string {
    if (!bedId) return "-";
    return beds.find((bed) => bed.id === bedId)?.name ?? bedId;
  }

  function closeUploadModal() {
    setUploadTarget(null);
    setUploadFile(null);
  }

  function handleUploadSubmit() {
    if (!uploadTarget || !uploadFile) {
      toast.error("Selecciona un archivo para subir.");
      return;
    }

    toast.success(`Archivo "${uploadFile.name}" asociado al lote ${uploadTarget.lote} (demo).`);
    closeUploadModal();
  }

  function openNewBatchForm() {
    setEditingBatchId(null);
    setBatchForm(emptyBatchForm());
    setBatchDetailTarget(null);
    setBatchFormOpen(true);
  }

  function openEditBatchForm(batch: Batch) {
    setEditingBatchId(batch.id);
    setBatchForm(batchToForm(batch));
    setBatchDetailTarget(null);
    setBatchFormOpen(true);
  }

  function closeBatchForm() {
    setEditingBatchId(null);
    setBatchForm(emptyBatchForm());
    setBatchFormOpen(false);
  }

  async function handleSubmitBatch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!batchForm.code.trim() || !batchForm.geneticsId || !batchForm.roomId || !batchForm.startDate) {
      toast.error("Completa codigo, genetica, sala y fecha de inicio.");
      return;
    }

    setBatchSaving(true);
    try {
      const savedBatch = editingBatchId
        ? await updateBatch(editingBatchId, batchForm)
        : await createBatch(batchForm);
      setBatches((current) => [savedBatch, ...current.filter((batch) => batch.id !== savedBatch.id)]);
      closeBatchForm();
      toast.success(`Lote ${savedBatch.code} ${editingBatchId ? "actualizado" : "creado"} correctamente.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo guardar el lote.";
      toast.error(message);
    } finally {
      setBatchSaving(false);
    }
  }

  function mockPendingAction(action: string, lote: string) {
    toast.info(`${action} de lote ${lote} pendiente de integracion.`);
  }

  if (location.pathname !== "/app/cultivo") {
    return <Outlet />;
  }

  return (
    <div className="mx-auto max-w-[1200px] space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Cultivo</h1>
        <p className="text-sm text-muted-foreground">
          Seguimiento operativo de salas, genéticas y trazabilidad interna.
        </p>
      </header>

      <Tabs
        value={activeSection}
        onValueChange={(value) =>
          navigate({ to: "/app/cultivo", search: { section: value as CultivoSection } })
        }
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="trazabilidad">Trazabilidad avanzada</TabsTrigger>
          <TabsTrigger value="lotes">Lotes</TabsTrigger>
          <TabsTrigger value="rendimientos">Rendimientos</TabsTrigger>
          <TabsTrigger value="inventario">Inventario</TabsTrigger>
        </TabsList>

        <TabsContent value="resumen" className="space-y-6">
          <div className="flex justify-end">
            <Button asChild variant="outline" className="gap-2">
              <Link to="/app/cultivo/ambiente">
                Parametros ambientales
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="rounded-xl border border-border bg-card p-3 shadow-xs">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {resumeCards.map(({ label, value, Icon, accent, panel, iconClass }) => (
                <div key={label} className={`relative overflow-hidden rounded-lg ${panel} px-5 py-4`}>
                  <span className={`absolute left-0 top-3 h-[calc(100%-1.5rem)] w-1 rounded-r-full ${accent}`} />
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{label}</p>
                      <p className="mt-2 font-mono text-3xl font-semibold leading-none text-foreground">{value}</p>
                    </div>
                    <Icon className={`mt-1 h-5 w-5 shrink-0 ${iconClass}`} />
                  </div>
                </div>
              ))}
            </div>
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
                            {log.vpdStatus ? (
                              <Badge variant="outline" className={VPD_STATUS_CLASS[log.vpdStatus]}>
                                {log.vpdStatus}
                              </Badge>
                            ) : null}
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
                    <span className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      {room.name}
                    </span>
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
                    <span className="flex items-center gap-2">
                      <Leaf className="h-4 w-4 text-muted-foreground" />
                      {item.name}
                    </span>
                    <Badge variant="secondary">{item.plantsCount}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trazabilidad" className="space-y-10">
          {/* === GENÉTICAS === */}
          <section className="space-y-4">
            <div className="space-y-1 border-l-2 border-primary/60 pl-3">
              <h2 className="text-lg font-semibold tracking-tight">Genéticas</h2>
              <p className="text-sm text-muted-foreground">
                Seguimiento técnico de variedades, madres, esquejes y comportamiento observado.
              </p>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Leaf className="h-4 w-4 text-muted-foreground" />
                  <CardTitle>Ficha de genéticas</CardTitle>
                </div>
                <CardDescription>Catálogo interno de variedades en uso o evaluación.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Genética</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Rendimiento estimado</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Notas internas</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {geneticas.map((g) => (
                        <TableRow key={g.genetica}>
                          <TableCell className="font-medium">{g.genetica}</TableCell>
                          <TableCell>{g.tipo}</TableCell>
                          <TableCell className="font-mono text-xs">{g.rendimiento}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{g.estado}</Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{g.notas}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Sprout className="h-4 w-4 text-muted-foreground" />
                  <CardTitle>Madres y esquejes</CardTitle>
                </div>
                <CardDescription>Seguimiento sanitario de plantas madre y propagación.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Planta madre</TableHead>
                        <TableHead>Estado sanitario</TableHead>
                        <TableHead>Esquejes generados</TableHead>
                        <TableHead>Próxima revisión</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {madres.map((m) => (
                        <TableRow key={m.madre}>
                          <TableCell className="font-medium">{m.madre}</TableCell>
                          <TableCell>
                            <Badge variant={sanitaryVariant(m.sanitario)}>{m.sanitario}</Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs">{m.esquejes}</TableCell>
                          <TableCell className="text-muted-foreground">{m.revision}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </section>

        </TabsContent>

        <TabsContent value="lotes" className="space-y-4">
          {/* === LOTES === */}
          <section className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1 border-l-2 border-primary/60 pl-3">
                <h2 className="text-lg font-semibold tracking-tight">Lotes</h2>
                <p className="text-sm text-muted-foreground">
                  Trazabilidad documental, controles de calidad y rendimiento productivo por lote.
                </p>
              </div>
              <Button
                className="gap-2 self-start"
                onClick={openNewBatchForm}
              >
                <Plus className="h-4 w-4" />
                Nuevo lote
              </Button>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Sprout className="h-4 w-4 text-muted-foreground" />
                  <CardTitle>Lotes de cultivo</CardTitle>
                </div>
                <CardDescription>Registros reales desde backend y base de datos.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {batchFormOpen ? (
                  <section className="rounded-md border bg-muted/20 p-4">
                    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground">{editingBatchId ? "Edicion operativa" : "Alta operativa"}</p>
                        <h3 className="text-xl font-semibold tracking-tight">{editingBatchId ? "Editar lote" : "Nuevo lote"}</h3>
                        <p className="text-sm text-muted-foreground">
                          {editingBatchId
                            ? "Modifica los datos principales del lote seleccionado."
                            : "Registra un lote de cultivo con sus relaciones principales."}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={closeBatchForm}
                      >
                        Cerrar
                      </Button>
                    </div>

                    <form className="space-y-5" onSubmit={handleSubmitBatch}>
                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                          <FormLabel htmlFor="batch-code">Codigo de lote</FormLabel>
                          <Input
                            id="batch-code"
                            value={batchForm.code}
                            onChange={(event) => setBatchForm((current) => ({ ...current, code: event.target.value }))}
                            placeholder="LOT-2026-001"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <FormLabel>Genetica</FormLabel>
                          <Select
                            value={batchForm.geneticsId || undefined}
                            onValueChange={(value) => setBatchForm((current) => ({ ...current, geneticsId: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona genetica" />
                            </SelectTrigger>
                            <SelectContent>
                              {genetics.map((item) => (
                                <SelectItem key={item.id} value={item.id}>
                                  {item.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <FormLabel>Sala</FormLabel>
                          <Select
                            value={batchForm.roomId || undefined}
                            onValueChange={(value) => setBatchForm((current) => ({ ...current, roomId: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona sala" />
                            </SelectTrigger>
                            <SelectContent>
                              {rooms.map((room) => (
                                <SelectItem key={room.id} value={room.id}>
                                  {room.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <FormLabel htmlFor="batch-start">Fecha inicio</FormLabel>
                          <DateInput
                            id="batch-start"
                            value={batchForm.startDate}
                            onChange={(v) => setBatchForm((current) => ({ ...current, startDate: v }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <FormLabel htmlFor="batch-flowering">Inicio floracion</FormLabel>
                          <DateInput
                            id="batch-flowering"
                            value={batchForm.floweringStartDate}
                            onChange={(v) => setBatchForm((current) => ({ ...current, floweringStartDate: v }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <FormLabel htmlFor="batch-estimated">Cosecha estimada</FormLabel>
                          <DateInput
                            id="batch-estimated"
                            value={batchForm.estimatedHarvestDate}
                            onChange={(v) => setBatchForm((current) => ({ ...current, estimatedHarvestDate: v }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <FormLabel htmlFor="batch-real">Cosecha real</FormLabel>
                          <DateInput
                            id="batch-real"
                            value={batchForm.realHarvestDate}
                            onChange={(v) => setBatchForm((current) => ({ ...current, realHarvestDate: v }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <FormLabel>Estado</FormLabel>
                          <Select
                            value={batchForm.status}
                            onValueChange={(value) => setBatchForm((current) => ({ ...current, status: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {BATCH_STATUS_OPTIONS.map((status) => (
                                <SelectItem key={status} value={status}>
                                  {status}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2 md:col-span-3">
                          <FormLabel htmlFor="batch-notes">Observaciones</FormLabel>
                          <Textarea
                            id="batch-notes"
                            value={batchForm.notes}
                            onChange={(event) => setBatchForm((current) => ({ ...current, notes: event.target.value }))}
                            placeholder="Notas operativas del lote"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={closeBatchForm}
                        >
                          Cancelar
                        </Button>
                        <Button type="submit" className="gap-2" disabled={batchSaving}>
                          <Save className="h-4 w-4" />
                          {batchSaving ? "Guardando..." : editingBatchId ? "Guardar cambios" : "Guardar lote"}
                        </Button>
                      </div>
                    </form>
                  </section>
                ) : null}

                {batchDetailTarget ? (
                  <BatchDetailSection
                    item={batchDetailTarget}
                    geneticsName={batchDetailTarget.geneticsName ?? genetics.find((item) => item.id === batchDetailTarget.geneticsId)?.name ?? "-"}
                    roomName={batchDetailTarget.roomName ?? roomName(batchDetailTarget.roomId)}
                    onClose={() => setBatchDetailTarget(null)}
                    onEdit={() => openEditBatchForm(batchDetailTarget)}
                  />
                ) : null}

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Lote</TableHead>
                        <TableHead>Genetica</TableHead>
                        <TableHead>Sala</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Inicio</TableHead>
                        <TableHead>Inicio flora</TableHead>
                        <TableHead>Cosecha est.</TableHead>
                        <TableHead className="w-[80px] text-center">Accion</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {batches.length > 0 ? (
                        batches.map((batch) => (
                          <TableRow key={batch.id}>
                            <TableCell className="font-mono text-xs font-medium">{batch.code}</TableCell>
                            <TableCell>{batch.geneticsName ?? genetics.find((item) => item.id === batch.geneticsId)?.name ?? "-"}</TableCell>
                            <TableCell>{batch.roomName ?? roomName(batch.roomId)}</TableCell>
                            <TableCell>
                              <Badge variant={batch.status === "descartado" ? "destructive" : "secondary"}>{batch.status}</Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground">{batch.startDate || "-"}</TableCell>
                            <TableCell className="text-muted-foreground">{batch.floweringStartDate || "-"}</TableCell>
                            <TableCell className="text-muted-foreground">{batch.estimatedHarvestDate || "-"}</TableCell>
                            <TableCell className="text-center">
                              <LoteRowActions
                                onView={() => {
                                  setEditingBatchId(null);
                                  setBatchFormOpen(false);
                                  setBatchDetailTarget(batch);
                                }}
                                onEdit={() => openEditBatchForm(batch)}
                                onDelete={() => mockPendingAction("Eliminacion", batch.code)}
                              />
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={8} className="h-20 text-center text-sm text-muted-foreground">
                            Todavia no hay lotes registrados.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <TestTube className="h-4 w-4 text-muted-foreground" />
                  <CardTitle>Control de calidad / laboratorio</CardTitle>
                </div>
                <CardDescription>Registro visual de controles por lote y tipo de análisis.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Lote</TableHead>
                        <TableHead>Tipo de control</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Resultado</TableHead>
                        <TableHead>Archivo</TableHead>
                        <TableHead className="w-[80px] text-center">Accion</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {controlesCalidad.map((c) => (
                        <TableRow key={`${c.lote}-${c.tipo}`}>
                          <TableCell className="font-mono text-xs font-medium">{c.lote}</TableCell>
                          <TableCell>{c.tipo}</TableCell>
                          <TableCell>
                            <Badge variant={qcStatusVariant(c.estado)}>{c.estado}</Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{c.fecha}</TableCell>
                          <TableCell>{c.resultado}</TableCell>
                          <TableCell className="text-muted-foreground text-xs">{c.archivo}</TableCell>
                          <TableCell className="text-center">
                            <LoteRowActions
                              onView={() =>
                                setDetailTarget({
                                  title: `Control ${c.tipo} - ${c.lote}`,
                                  rows: [
                                    { label: "Lote", value: c.lote },
                                    { label: "Tipo de control", value: c.tipo },
                                    { label: "Estado", value: c.estado },
                                    { label: "Fecha", value: c.fecha },
                                    { label: "Resultado", value: c.resultado },
                                    { label: "Archivo", value: c.archivo },
                                  ],
                                })
                              }
                              onEdit={() => mockPendingAction("Edicion", c.lote)}
                              onDelete={() => mockPendingAction("Eliminacion", c.lote)}
                              onUpload={() =>
                                setUploadTarget({
                                  source: "control",
                                  lote: c.lote,
                                  title: `Subir archivo de control - ${c.lote}`,
                                  description: `Adjunta un informe o respaldo para el control "${c.tipo}" con estado ${c.estado}.`,
                                })
                              }
                            />
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
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <CardTitle>Archivos asociados a lotes</CardTitle>
                </div>
                <CardDescription>Documentación técnica y registros vinculados a lotes de cultivo.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Lote</TableHead>
                        <TableHead>Tipo de archivo</TableHead>
                        <TableHead>Nombre del archivo</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead className="w-[80px] text-center">Accion</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {archivosLotes.map((a) => (
                        <TableRow key={`${a.lote}-${a.nombre}`}>
                          <TableCell className="font-mono text-xs font-medium">{a.lote}</TableCell>
                          <TableCell>{a.tipoArchivo}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{a.nombre}</TableCell>
                          <TableCell>
                            <Badge variant={a.estado === "Activo" ? "secondary" : "outline"}>{a.estado}</Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{a.fecha}</TableCell>
                          <TableCell className="text-center">
                            <LoteRowActions
                              onView={() =>
                                setDetailTarget({
                                  title: `Archivo ${a.nombre}`,
                                  rows: [
                                    { label: "Lote", value: a.lote },
                                    { label: "Tipo de archivo", value: a.tipoArchivo },
                                    { label: "Nombre", value: a.nombre },
                                    { label: "Estado", value: a.estado },
                                    { label: "Fecha", value: a.fecha },
                                  ],
                                })
                              }
                              onEdit={() => mockPendingAction("Edicion de archivo", a.lote)}
                              onDelete={() => mockPendingAction("Eliminacion de archivo", a.lote)}
                              onUpload={() =>
                                setUploadTarget({
                                  source: "archivo",
                                  lote: a.lote,
                                  title: `Subir archivo asociado - ${a.lote}`,
                                  description: `Adjunta o reemplaza documentacion para "${a.nombre}".`,
                                })
                              }
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </section>
        </TabsContent>

        <TabsContent value="rendimientos" className="space-y-4">
          <section className="flex flex-col gap-4">
            <div className="space-y-1 border-l-2 border-primary/60 pl-3">
              <h2 className="text-lg font-semibold tracking-tight">Rendimientos</h2>
              <p className="text-sm text-muted-foreground">
                Indicadores visuales de rendimiento por sala, genética y lote.
              </p>
            </div>

            <Card className="order-3">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  <CardTitle>Rendimientos por lote</CardTitle>
                </div>
                <CardDescription>Métricas de producción y merma por lote finalizado.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Lote</TableHead>
                        <TableHead>Genética</TableHead>
                        <TableHead>Sala</TableHead>
                        <TableHead>Peso seco</TableHead>
                        <TableHead>Merma %</TableHead>
                        <TableHead>Días flora</TableHead>
                        <TableHead>Incidencias</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rendimientosLote.map((r) => (
                        <TableRow key={r.lote}>
                          <TableCell className="font-mono text-xs font-medium">{r.lote}</TableCell>
                          <TableCell>{r.genetica}</TableCell>
                          <TableCell>{r.sala}</TableCell>
                          <TableCell className="font-mono text-xs">{r.pesoSeco}</TableCell>
                          <TableCell className="font-mono text-xs">{r.merma}</TableCell>
                          <TableCell className="font-mono text-xs">{r.diasFlora}</TableCell>
                          <TableCell className="text-muted-foreground text-xs">{r.incidencias}</TableCell>
                          <TableCell>
                            <Badge variant={curadoVariant(r.estado)}>{r.estado}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <Card className="order-2">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <CardTitle>Rendimiento por genética</CardTitle>
                </div>
                <CardDescription>Promedio de producción e incidencias por variedad.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Genética</TableHead>
                        <TableHead>Rendimiento promedio</TableHead>
                        <TableHead>Lotes completados</TableHead>
                        <TableHead>Incidencias</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rendimientosGenetica.map((r) => (
                        <TableRow key={r.genetica}>
                          <TableCell className="font-medium">{r.genetica}</TableCell>
                          <TableCell className="font-mono text-xs">{r.promedio}</TableCell>
                          <TableCell className="font-mono text-xs">{r.lotesCompletados}</TableCell>
                          <TableCell className="text-muted-foreground text-xs">{r.incidencias}</TableCell>
                          <TableCell>
                            <Badge variant={r.estado === "Óptima" ? "secondary" : "outline"}>{r.estado}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <Card className="order-1">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Warehouse className="h-4 w-4 text-muted-foreground" />
                  <CardTitle>Rendimiento por sala</CardTitle>
                </div>
                <CardDescription>Consolidado de producción e incidencias por sala de cultivo.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Sala</TableHead>
                        <TableHead>Lotes completados</TableHead>
                        <TableHead>Peso seco total</TableHead>
                        <TableHead>Incidencias</TableHead>
                        <TableHead>Rendimiento promedio</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rendimientosSala.map((r) => (
                        <TableRow key={r.sala}>
                          <TableCell className="font-medium">{r.sala}</TableCell>
                          <TableCell className="font-mono text-xs">{r.lotesCompletados}</TableCell>
                          <TableCell className="font-mono text-xs">{r.pesoSecoTotal}</TableCell>
                          <TableCell className="text-muted-foreground text-xs">{r.incidencias}</TableCell>
                          <TableCell className="font-mono text-xs">{r.promedio}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </section>

        </TabsContent>

        <TabsContent value="inventario" className="space-y-4">
          <section className="space-y-4">
            <div className="space-y-1 border-l-2 border-primary/60 pl-3">
              <h2 className="text-lg font-semibold tracking-tight">Inventario</h2>
              <p className="text-sm text-muted-foreground">
                Stock visual por genética y seguimiento interno de curado por lote.
              </p>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Warehouse className="h-4 w-4 text-muted-foreground" />
                  <CardTitle>Stock</CardTitle>
                </div>
                <CardDescription>Distribución visual del stock ficticio disponible por genética.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 lg:grid-cols-[minmax(260px,360px)_1fr] lg:items-center">
                  <ChartContainer config={stockChartConfig} className="mx-auto aspect-square h-[240px]">
                    <PieChart>
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent hideLabel nameKey="genetica" />}
                      />
                      <Pie
                        data={stockPorGenetica}
                        dataKey="cantidad"
                        nameKey="genetica"
                        innerRadius={64}
                        outerRadius={92}
                        strokeWidth={4}
                      >
                        {stockPorGenetica.map((item) => (
                          <Cell key={item.genetica} fill={item.fill} />
                        ))}
                        <Label
                          content={({ viewBox }) => {
                            if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                              return (
                                <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                                  <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-2xl font-semibold">
                                    {stockTotal.toLocaleString("es-AR")}
                                  </tspan>
                                  <tspan x={viewBox.cx} y={(viewBox.cy ?? 0) + 22} className="fill-muted-foreground text-xs">
                                    g totales
                                  </tspan>
                                </text>
                              );
                            }
                          }}
                        />
                      </Pie>
                    </PieChart>
                  </ChartContainer>

                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Stock total</p>
                      <p className="font-mono text-2xl font-semibold">{stockTotal.toLocaleString("es-AR")} g</p>
                    </div>

                    <div className="grid gap-2">
                      {stockPorGenetica.map((item) => (
                        <div key={item.genetica} className="flex items-center justify-between rounded-md border px-3 py-2">
                          <span className="flex min-w-0 items-center gap-2 text-sm">
                            <span
                              className="h-2.5 w-2.5 shrink-0 rounded-full"
                              style={{ backgroundColor: item.fill }}
                            />
                            <span className="truncate">{item.genetica}</span>
                          </span>
                          <span className="font-mono text-sm">{item.cantidad.toLocaleString("es-AR")} g</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Timer className="h-4 w-4 text-muted-foreground" />
                  <CardTitle>Curado avanzado</CardTitle>
                </div>
                <CardDescription>Seguimiento visual del tiempo de curado y estado de liberación por lote.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Lote</TableHead>
                        <TableHead>Genética</TableHead>
                        <TableHead>Fecha ingreso</TableHead>
                        <TableHead>Días en curado</TableHead>
                        <TableHead>Peso seco final</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Observaciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {curadoAvanzado.map((c) => (
                        <TableRow key={c.lote}>
                          <TableCell className="font-mono text-xs font-medium">{c.lote}</TableCell>
                          <TableCell>{c.genetica}</TableCell>
                          <TableCell className="text-muted-foreground">{c.fechaIngreso}</TableCell>
                          <TableCell className="font-mono text-xs">{c.diasCurado}</TableCell>
                          <TableCell className="font-mono text-xs">{c.pesoSecoFinal}</TableCell>
                          <TableCell>
                            <Badge variant={curadoVariant(c.estado)}>{c.estado}</Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-xs">{c.observaciones}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </section>
        </TabsContent>

      </Tabs>

      <Dialog open={Boolean(detailTarget)} onOpenChange={(open) => !open && setDetailTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {detailTarget?.title ?? "Detalle de lote"}
            </DialogTitle>
            <DialogDescription>Informacion asociada a la fila seleccionada.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 rounded-md border bg-muted/30 p-3">
            {detailTarget?.rows.map((row) => (
              <div key={row.label} className="grid gap-1 text-sm sm:grid-cols-[140px_1fr]">
                <span className="font-medium text-muted-foreground">{row.label}</span>
                <span>{row.value || "-"}</span>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailTarget(null)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(uploadTarget)} onOpenChange={(open) => !open && closeUploadModal()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              {uploadTarget?.title ?? "Subir archivo"}
            </DialogTitle>
            <DialogDescription>
              Selecciona un archivo para asociarlo al lote y conservar la trazabilidad documental.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-md border bg-muted/30 p-3 text-sm">
              <p className="font-medium">Lote {uploadTarget?.lote ?? "-"}</p>
              <p className="mt-1 text-muted-foreground">{uploadTarget?.description}</p>
            </div>

            <div className="space-y-1.5">
              <FormLabel htmlFor="lote-upload-file">Archivo</FormLabel>
              <div className="flex min-h-10 items-center gap-2 rounded-md border border-input bg-background/70 px-2 py-1.5 shadow-sm dark:bg-muted/35">
                <Input
                  id="lote-upload-file"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx,.csv"
                  className="sr-only"
                  onChange={(event) => setUploadFile(event.target.files?.[0] ?? null)}
                />
                <FormLabel
                  htmlFor="lote-upload-file"
                  className="inline-flex h-8 cursor-pointer items-center gap-2 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
                >
                  <Upload className="h-3.5 w-3.5" />
                  Seleccionar archivo
                </FormLabel>
                <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
                  {uploadFile ? uploadFile.name : "Sin archivos seleccionados"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Formatos sugeridos: PDF, imagen, planilla o documento tecnico.
              </p>
            </div>

            {uploadFile ? (
              <div className="flex items-center justify-between rounded-md border px-3 py-2 text-xs">
                <span className="truncate font-medium">{uploadFile.name}</span>
                <span className="shrink-0 text-muted-foreground">{Math.ceil(uploadFile.size / 1024)} KB</span>
              </div>
            ) : null}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeUploadModal}>Cancelar</Button>
            <Button className="gap-2" onClick={handleUploadSubmit}>
              <Upload className="h-4 w-4" />
              Subir archivo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function LoteRowActions({
  onView,
  onEdit,
  onDelete,
  onUpload,
}: {
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onUpload?: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreVertical className="h-4 w-4" />
          <span className="sr-only">Abrir acciones</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onView}>
          <Eye className="mr-2 h-4 w-4" />
          Ver
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onEdit}>
          <Pencil className="mr-2 h-4 w-4" />
          Editar
        </DropdownMenuItem>
        {onUpload ? (
          <DropdownMenuItem onClick={onUpload}>
            <Upload className="mr-2 h-4 w-4" />
            Subir
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={onDelete}>
          <Trash2 className="mr-2 h-4 w-4" />
          Eliminar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function BatchDetailSection({
  item,
  geneticsName,
  roomName,
  onClose,
  onEdit,
}: {
  item: Batch;
  geneticsName: string;
  roomName: string;
  onClose: () => void;
  onEdit: () => void;
}) {
  return (
    <section className="rounded-md border bg-muted/20 p-4">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">Detalle de lote</p>
          <h3 className="text-xl font-semibold tracking-tight">{item.code}</h3>
          <p className="text-sm text-muted-foreground">{geneticsName} - {roomName}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>Cerrar</Button>
          <Button type="button" size="sm" className="gap-2" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
            Editar
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-3 rounded-md border bg-background/70 p-3">
          <h4 className="text-sm font-semibold">Ficha principal</h4>
          <BatchDetailRow label="Codigo lote" value={item.code} />
          <BatchDetailRow label="Genetica" value={geneticsName} />
          <BatchDetailRow label="Sala" value={roomName} />
        </div>

        <div className="space-y-3 rounded-md border bg-background/70 p-3">
          <h4 className="text-sm font-semibold">Estado</h4>
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-muted-foreground">Estado</span>
            <Badge variant={item.status === "descartado" ? "destructive" : "secondary"}>{item.status}</Badge>
          </div>
          <BatchDetailRow label="ID genetica" value={item.geneticsId} />
          <BatchDetailRow label="ID sala" value={item.roomId} />
        </div>

        <div className="space-y-3 rounded-md border bg-background/70 p-3">
          <h4 className="text-sm font-semibold">Fechas</h4>
          <BatchDetailRow label="Inicio" value={item.startDate} />
          <BatchDetailRow label="Inicio flora" value={item.floweringStartDate} />
          <BatchDetailRow label="Cosecha est." value={item.estimatedHarvestDate} />
          <BatchDetailRow label="Cosecha real" value={item.realHarvestDate} />
        </div>
      </div>

      <div className="mt-4 rounded-md border bg-background/70 p-3">
        <h4 className="text-sm font-semibold">Observaciones</h4>
        <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{item.notes || "Sin observaciones."}</p>
      </div>
    </section>
  );
}

function BatchDetailRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value || "-"}</span>
    </div>
  );
}

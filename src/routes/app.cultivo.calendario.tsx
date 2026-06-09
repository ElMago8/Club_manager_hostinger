import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Clock, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { getGrowBeds } from "@/services/growBedService";
import { getPlants } from "@/services/plantService";
import {
  completeOperationalTask,
  createOperationalTask,
  getOperationalTasks,
  updateOperationalTaskStatus,
  type OperationalTask,
  type OperationalTaskPriority,
  type OperationalTaskStatus,
  type OperationalTaskType,
} from "@/services/operationalCalendarService";
import type { GrowBed, Plant } from "@/types/cultivation";

export const Route = createFileRoute("/app/cultivo/calendario")({
  head: () => ({ meta: [{ title: "Calendario operativo · Cannabis Club Manager" }] }),
  component: OperationalCalendarPage,
});

const TASK_TYPE_LABEL: Record<OperationalTaskType, string> = {
  irrigation: "Riego",
  nutrition: "Nutricion",
  environmental_check: "Control ambiental",
  drainage_check: "Drenaje",
  sanitary_inspection: "Inspeccion sanitaria",
  pruning: "Poda",
  transplant: "Trasplante",
  harvest_preparation: "Preparar cosecha",
  harvest: "Cosecha",
  drying_check: "Secado",
  curing_check: "Curado",
  cleaning: "Limpieza",
  maintenance: "Mantenimiento",
  inventory_check: "Stock insumos",
  custom: "Personalizada",
};

const PRIORITY_LABEL: Record<OperationalTaskPriority, string> = {
  low: "Baja",
  medium: "Media",
  high: "Alta",
  critical: "Critica",
};

const STATUS_LABEL: Record<OperationalTaskStatus, string> = {
  pending: "Pendiente",
  in_progress: "En curso",
  completed: "Completada",
  cancelled: "Cancelada",
  overdue: "Vencida",
};

const PRIORITY_CLASS: Record<OperationalTaskPriority, string> = {
  low: "border-muted bg-muted text-muted-foreground",
  medium: "border-sky-200 bg-sky-500/10 text-sky-700",
  high: "border-amber-200 bg-amber-500/10 text-amber-700",
  critical: "border-red-200 bg-red-500/10 text-red-700",
};

const STATUS_CLASS: Record<OperationalTaskStatus, string> = {
  pending: "border-slate-200 bg-slate-500/10 text-slate-700",
  in_progress: "border-sky-200 bg-sky-500/10 text-sky-700",
  completed: "border-emerald-200 bg-emerald-500/10 text-emerald-700",
  cancelled: "border-muted bg-muted text-muted-foreground",
  overdue: "border-red-200 bg-red-500/10 text-red-700",
};

const emptyForm = {
  title: "",
  description: "",
  taskType: "environmental_check" as OperationalTaskType,
  priority: "medium" as OperationalTaskPriority,
  status: "pending" as OperationalTaskStatus,
  dueDate: "2026-05-29",
  dueTime: "",
  assignedToName: "",
  bedId: "none",
  plantId: "none",
  batchId: "",
  recurrenceType: "none",
  notes: "",
};

function dateOnly(value: string) {
  return value.slice(0, 10);
}

function OperationalCalendarPage() {
  const [tasks, setTasks] = useState<OperationalTask[]>([]);
  const [beds, setBeds] = useState<GrowBed[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState("");
  const [filters, setFilters] = useState({
    status: "all",
    priority: "all",
    taskType: "all",
    assignedToName: "",
    dateFrom: "",
    dateTo: "",
    bedId: "all",
    plantId: "all",
    overdueOnly: false,
  });

  async function loadData() {
    const serviceFilters: Parameters<typeof getOperationalTasks>[0] = {};
    if (filters.status !== "all") serviceFilters.status = filters.status as OperationalTaskStatus;
    if (filters.priority !== "all") serviceFilters.priority = filters.priority as OperationalTaskPriority;
    if (filters.taskType !== "all") serviceFilters.taskType = filters.taskType as OperationalTaskType;
    if (filters.assignedToName) serviceFilters.assignedToName = filters.assignedToName;
    if (filters.dateFrom) serviceFilters.dateFrom = filters.dateFrom;
    if (filters.dateTo) serviceFilters.dateTo = filters.dateTo;
    if (filters.bedId !== "all") serviceFilters.bedId = filters.bedId;
    if (filters.plantId !== "all") serviceFilters.plantId = filters.plantId;
    if (filters.overdueOnly) serviceFilters.overdueOnly = true;
    setTasks(await getOperationalTasks(serviceFilters));
  }

  useEffect(() => {
    void Promise.all([getGrowBeds(), getPlants()]).then(([nextBeds, nextPlants]) => {
      setBeds(nextBeds);
      setPlants(nextPlants);
    });
  }, []);

  useEffect(() => {
    void loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status, filters.priority, filters.taskType, filters.assignedToName, filters.dateFrom, filters.dateTo, filters.bedId, filters.plantId, filters.overdueOnly]);

  const cards = useMemo(() => {
    const today = "2026-05-29";
    const weekLimit = "2026-06-05";
    return {
      pending: tasks.filter((task) => task.status === "pending").length,
      inProgress: tasks.filter((task) => task.status === "in_progress").length,
      completedToday: tasks.filter((task) => task.status === "completed" && task.completedAt?.startsWith(today)).length,
      overdue: tasks.filter((task) => task.status === "overdue").length,
      critical: tasks.filter((task) => task.priority === "critical").length,
      thisWeek: tasks.filter((task) => dateOnly(task.dueDate) >= today && dateOnly(task.dueDate) <= weekLimit).length,
    };
  }, [tasks]);

  async function handleCreateTask() {
    if (!form.title.trim()) {
      setMessage("El titulo es obligatorio.");
      return;
    }
    if (form.priority === "critical" && !form.description.trim()) {
      setMessage("Las tareas criticas requieren descripcion.");
      return;
    }
    await createOperationalTask({
      ...form,
      description: form.description || undefined,
      dueTime: form.dueTime || undefined,
      assignedToName: form.assignedToName || undefined,
      bedId: form.bedId === "none" ? undefined : form.bedId,
      plantId: form.plantId === "none" ? undefined : form.plantId,
      batchId: form.batchId || undefined,
      relatedModule: form.plantId !== "none" ? "plant" : form.bedId !== "none" ? "bed" : "cultivation",
      recurrenceType: form.recurrenceType as "none",
      recurrenceInterval: undefined,
      notes: form.notes || undefined,
    });
    setForm(emptyForm);
    setMessage("Tarea creada correctamente.");
    await loadData();
  }

  function relatedLabel(task: OperationalTask) {
    if (task.plant) return `Planta ${task.plant.internalCode}`;
    if (task.bed) return `Camilla ${task.bed.name}`;
    if (task.batchId) return `Lote ${task.batchId}`;
    return "General";
  }

  async function setStatus(id: string, status: OperationalTaskStatus) {
    await updateOperationalTaskStatus(id, status);
    await loadData();
  }

  return (
    <div className="mx-auto max-w-[1500px] space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Calendario operativo</h1>
        <p className="text-sm text-muted-foreground">Tareas reales del backend para cultivo, camillas, plantas y controles internos.</p>
      </header>

      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        {[
          ["Pendientes", cards.pending],
          ["En curso", cards.inProgress],
          ["Completadas hoy", cards.completedToday],
          ["Vencidas", cards.overdue],
          ["Criticas", cards.critical],
          ["Esta semana", cards.thisWeek],
        ].map(([label, value]) => (
          <Card key={label}>
            <CardHeader className="pb-2">
              <CardDescription>{label}</CardDescription>
              <CardTitle className="font-mono text-2xl">{value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[420px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Crear tarea</CardTitle>
            <CardDescription>Agenda una tarea operativa con datos ficticios.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2"><Label>Titulo</Label><Input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></div>
            <div className="space-y-2"><Label>Descripcion</Label><Textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={form.taskType} onValueChange={(taskType) => setForm({ ...form, taskType: taskType as OperationalTaskType })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(TASK_TYPE_LABEL).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Prioridad</Label>
                <Select value={form.priority} onValueChange={(priority) => setForm({ ...form, priority: priority as OperationalTaskPriority })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(PRIORITY_LABEL).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Fecha limite</Label><Input type="date" value={form.dueDate} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} /></div>
              <div className="space-y-2"><Label>Hora limite</Label><Input type="time" value={form.dueTime} onChange={(event) => setForm({ ...form, dueTime: event.target.value })} /></div>
              <div className="space-y-2"><Label>Responsable</Label><Input value={form.assignedToName} onChange={(event) => setForm({ ...form, assignedToName: event.target.value })} /></div>
              <div className="space-y-2"><Label>Lote</Label><Input value={form.batchId} onChange={(event) => setForm({ ...form, batchId: event.target.value })} /></div>
              <div className="space-y-2">
                <Label>Camilla</Label>
                <Select value={form.bedId} onValueChange={(bedId) => setForm({ ...form, bedId, plantId: "none" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="none">Sin camilla</SelectItem>{beds.map((bed) => <SelectItem key={bed.id} value={bed.id}>{bed.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Planta</Label>
                <Select value={form.plantId} onValueChange={(plantId) => setForm({ ...form, plantId })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="none">Sin planta</SelectItem>{plants.filter((plant) => form.bedId === "none" || plant.bedId === form.bedId).map((plant) => <SelectItem key={plant.id} value={plant.id}>{plant.internalCode}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2"><Label>Notas</Label><Textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></div>
            </div>
            {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
            <Button onClick={() => void handleCreateTask()} className="w-full gap-2"><Plus className="h-4 w-4" />Crear tarea</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tareas operativas</CardTitle>
            <CardDescription>Listado filtrable conectado al backend local.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-4">
              <Select value={filters.status} onValueChange={(status) => setFilters({ ...filters, status })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todos los estados</SelectItem>{Object.entries(STATUS_LABEL).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select>
              <Select value={filters.priority} onValueChange={(priority) => setFilters({ ...filters, priority })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todas las prioridades</SelectItem>{Object.entries(PRIORITY_LABEL).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select>
              <Select value={filters.taskType} onValueChange={(taskType) => setFilters({ ...filters, taskType })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todos los tipos</SelectItem>{Object.entries(TASK_TYPE_LABEL).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select>
              <Input placeholder="Responsable" value={filters.assignedToName} onChange={(event) => setFilters({ ...filters, assignedToName: event.target.value })} />
              <Input type="date" value={filters.dateFrom} onChange={(event) => setFilters({ ...filters, dateFrom: event.target.value })} />
              <Input type="date" value={filters.dateTo} onChange={(event) => setFilters({ ...filters, dateTo: event.target.value })} />
              <Select value={filters.bedId} onValueChange={(bedId) => setFilters({ ...filters, bedId })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todas las camillas</SelectItem>{beds.map((bed) => <SelectItem key={bed.id} value={bed.id}>{bed.name}</SelectItem>)}</SelectContent></Select>
              <div className="flex items-center gap-2 rounded-md border px-3">
                <Checkbox checked={filters.overdueOnly} onCheckedChange={(checked) => setFilters({ ...filters, overdueOnly: checked === true })} />
                <span className="text-sm">Solo vencidas</span>
              </div>
            </div>

            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tarea</TableHead><TableHead>Tipo</TableHead><TableHead>Responsable</TableHead><TableHead>Prioridad</TableHead><TableHead>Estado</TableHead><TableHead>Fecha</TableHead><TableHead>Hora</TableHead><TableHead>Relacionado con</TableHead><TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell className="font-medium">{task.title}</TableCell>
                      <TableCell>{TASK_TYPE_LABEL[task.taskType]}</TableCell>
                      <TableCell>{task.assignedToName ?? "-"}</TableCell>
                      <TableCell><Badge variant="outline" className={PRIORITY_CLASS[task.priority]}>{PRIORITY_LABEL[task.priority]}</Badge></TableCell>
                      <TableCell><Badge variant="outline" className={STATUS_CLASS[task.status]}>{STATUS_LABEL[task.status]}</Badge></TableCell>
                      <TableCell className="font-mono text-xs">{dateOnly(task.dueDate)}</TableCell>
                      <TableCell className="font-mono text-xs">{task.dueTime ?? "-"}</TableCell>
                      <TableCell>{relatedLabel(task)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" title="Marcar en curso" onClick={() => void setStatus(task.id, "in_progress")}><Clock className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="sm" title="Completar" onClick={() => void completeOperationalTask(task.id, "Operador demo").then(loadData)}><CheckCircle2 className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => void setStatus(task.id, "cancelled")}>Cancelar</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

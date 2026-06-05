import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Pencil, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getGrowBedById } from "@/services/growBedService";
import { getGrowRoomById } from "@/services/growRoomService";
import { getPlantById, updatePlant } from "@/services/plantService";
import type { GrowBed, GrowRoom, Plant, PlantStage, PlantStatus } from "@/types/cultivation";

export const Route = createFileRoute("/app/cultivo/plantas/$id")({
  head: () => ({ meta: [{ title: "Detalle de planta · Cannabis Club Manager" }] }),
  component: PlantDetailPage,
});

const PLANT_STATUS_CLASS: Record<PlantStatus, string> = {
  normal: "border-emerald-200 bg-emerald-500/10 text-emerald-700",
  observacion: "border-sky-200 bg-sky-500/10 text-sky-700",
  alerta: "border-amber-200 bg-amber-500/10 text-amber-700",
  descartada: "border-muted bg-muted text-muted-foreground",
  cosechada: "border-violet-200 bg-violet-500/10 text-violet-700",
};

function PlantDetailPage() {
  const { id } = Route.useParams();
  const [plant, setPlant] = useState<Plant | null>(null);
  const [room, setRoom] = useState<GrowRoom | null>(null);
  const [bed, setBed] = useState<GrowBed | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Pick<Plant, "stage" | "status" | "stageStartDate" | "notes">>({
    stage: "vegetativo",
    status: "normal",
    stageStartDate: "",
    notes: "",
  });
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadData() {
      const nextPlant = await getPlantById(id);
      setPlant(nextPlant);
      setForm({
        stage: nextPlant?.stage ?? "vegetativo",
        status: nextPlant?.status ?? "normal",
        stageStartDate: nextPlant?.stageStartDate ?? "",
        notes: nextPlant?.notes ?? "",
      });
      setRoom(nextPlant ? await getGrowRoomById(nextPlant.roomId) : null);
      setBed(nextPlant ? await getGrowBedById(nextPlant.bedId) : null);
    }

    void loadData();
  }, [id]);

  async function handleSave() {
    if (!plant) return;
    const updated = await updatePlant(plant.id, {
      stage: form.stage,
      status: form.status,
      stageStartDate: form.stageStartDate || undefined,
      notes: form.notes || undefined,
    });
    setPlant({ ...updated });
    setEditing(false);
    setMessage("Planta actualizada en mock data.");
  }

  if (!plant) {
    return (
      <div className="mx-auto max-w-[1000px] space-y-4">
        <Button asChild variant="ghost" size="sm">
          <Link to="/app/cultivo/plantas">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Link>
        </Button>
        <Card>
          <CardContent className="py-10 text-sm text-muted-foreground">Planta no encontrada.</CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1100px] space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <Button asChild variant="ghost" size="sm" className="-ml-2">
            <Link to="/app/cultivo/plantas">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Plantas
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight">{plant.internalCode}</h1>
          <p className="text-sm text-muted-foreground">Detalle operativo de planta por posicion.</p>
        </div>
        <Button variant={editing ? "secondary" : "outline"} onClick={() => setEditing((value) => !value)} className="gap-2">
          <Pencil className="h-4 w-4" />
          {editing ? "Cancelar edicion" : "Editar"}
        </Button>
      </div>

      {message ? <p className="rounded-md border border-emerald-200 bg-emerald-500/10 p-3 text-sm text-emerald-700">{message}</p> : null}

      <Card>
        <CardHeader>
          <CardTitle>Ficha de planta</CardTitle>
          <CardDescription>Informacion mock preparada para futura API REST.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm md:grid-cols-3">
          <div><p className="text-muted-foreground">Codigo interno</p><p className="font-mono">{plant.internalCode}</p></div>
          <div><p className="text-muted-foreground">Genetica</p><p>{plant.geneticsName ?? "genetica pendiente"}</p></div>
          <div><p className="text-muted-foreground">Lote</p><p className="font-mono">{plant.batchId ?? "-"}</p></div>
          <div><p className="text-muted-foreground">Sala</p><p>{room?.name ?? plant.roomId}</p></div>
          <div><p className="text-muted-foreground">Camilla</p><p>{bed?.name ?? plant.bedId}</p></div>
          <div><p className="text-muted-foreground">Posicion</p><p className="font-mono">{plant.bedPosition}</p></div>
          <div><p className="text-muted-foreground">Codigo de maceta</p><p className="font-mono">{plant.potCode ?? "-"}</p></div>
          <div><p className="text-muted-foreground">Tamano de maceta</p><p className="font-mono">{plant.potSizeLiters ? `${plant.potSizeLiters} L` : "-"}</p></div>
          <div><p className="text-muted-foreground">Tipo de maceta</p><p>{plant.potType ?? "-"}</p></div>
          <div><p className="text-muted-foreground">Sustrato</p><p>{plant.substrate ?? "-"}</p></div>
          <div><p className="text-muted-foreground">Madre de origen</p><p className="font-mono">{plant.motherPlantCode ?? "-"}</p></div>
          <div><p className="text-muted-foreground">Origen</p><p className="capitalize">{plant.origin.replace("_", " ")}</p></div>
          <div><p className="text-muted-foreground">Etapa</p><p className="capitalize">{plant.stage}</p></div>
          <div><p className="text-muted-foreground">Estado</p><Badge variant="outline" className={PLANT_STATUS_CLASS[plant.status]}>{plant.status}</Badge></div>
          <div><p className="text-muted-foreground">Fecha de inicio</p><p>{plant.startDate}</p></div>
          <div><p className="text-muted-foreground">Inicio de etapa</p><p>{plant.stageStartDate ?? "-"}</p></div>
          <div className="md:col-span-3"><p className="text-muted-foreground">Observaciones</p><p>{plant.notes ?? "Sin observaciones"}</p></div>
        </CardContent>
      </Card>

      {editing ? (
        <Card>
          <CardHeader>
            <CardTitle>Edicion visual simple</CardTitle>
            <CardDescription>Actualiza estado, etapa y observaciones en mock data.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Etapa</Label>
                <Select value={form.stage} onValueChange={(stage) => setForm({ ...form, stage: stage as PlantStage })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
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
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select value={form.status} onValueChange={(status) => setForm({ ...form, status: status as PlantStatus })}>
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
                <Label>Fecha inicio etapa</Label>
                <Input
                  type="date"
                  value={form.stageStartDate ?? ""}
                  onChange={(event) => setForm({ ...form, stageStartDate: event.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Observaciones</Label>
              <Textarea value={form.notes ?? ""} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
            </div>
            <Button onClick={handleSave} className="gap-2">
              <Save className="h-4 w-4" />
              Guardar cambios
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

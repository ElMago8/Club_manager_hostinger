import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Pencil, Plus, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { getGenetics } from "@/services/geneticsService";
import { getGrowRooms } from "@/services/growRoomService";
import { getMeasurements } from "@/services/measurementService";
import { createMotherPlant, getMotherPlants, updateMotherPlant, type MotherPlantWithPlantCount } from "@/services/motherPlantService";
import type { CultivationMeasurement, Genetics, GrowRoom, MeasurementStatus, MotherPlant } from "@/types/cultivation";

export const Route = createFileRoute("/app/cultivo/madres")({
  head: () => ({ meta: [{ title: "Plantas madre · Cannabis Club Manager" }] }),
  component: MotherPlantsPage,
});

type MotherStatus = MotherPlant["status"];
type MotherForm = Omit<MotherPlant, "id" | "geneticsName"> & { geneticsName?: string };

const STATUS_CLASS: Record<MotherStatus, string> = {
  activa: "border-emerald-200 bg-emerald-500/10 text-emerald-700",
  observacion: "border-sky-200 bg-sky-500/10 text-sky-700",
  descartada: "border-muted bg-muted text-muted-foreground",
  archivada: "border-amber-200 bg-amber-500/10 text-amber-700",
};

const PARAM_STATUS_CLASS: Record<MeasurementStatus, string> = {
  normal: "border-emerald-200 bg-emerald-500/10 text-emerald-700",
  observation: "border-sky-200 bg-sky-500/10 text-sky-700",
  alert: "border-amber-200 bg-amber-500/10 text-amber-700",
  critical: "border-red-200 bg-red-500/10 text-red-700",
};

const emptyForm: MotherForm = {
  code: "",
  geneticsId: "",
  geneticsName: "",
  roomId: "",
  status: "activa",
  startDate: "2026-05-26",
  notes: "",
};

function MotherPlantsPage() {
  const [mothers, setMothers] = useState<MotherPlantWithPlantCount[]>([]);
  const [genetics, setGenetics] = useState<Genetics[]>([]);
  const [rooms, setRooms] = useState<GrowRoom[]>([]);
  const [measurements, setMeasurements] = useState<CultivationMeasurement[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<MotherForm>(emptyForm);
  const [message, setMessage] = useState("");

  async function loadData() {
    const [nextMothers, nextGenetics, nextRooms, nextMeasurements] = await Promise.all([getMotherPlants(), getGenetics(), getGrowRooms(), getMeasurements()]);
    setMothers(nextMothers);
    setGenetics(nextGenetics);
    setRooms(nextRooms);
    setMeasurements(nextMeasurements);
    setForm((current) => ({
      ...current,
      geneticsId: current.geneticsId || nextGenetics[0]?.id || "",
      geneticsName: current.geneticsName || nextGenetics[0]?.name || "",
      roomId: current.roomId || nextRooms[0]?.id || "",
    }));
  }

  useEffect(() => {
    void loadData();
  }, []);

  function roomName(id?: string): string {
    if (!id) return "-";
    return rooms.find((room) => room.id === id)?.name ?? id;
  }

  function latestMotherMeasurement(motherPlantId: string) {
    return measurements.find((item) => item.motherPlantId === motherPlantId);
  }

  function updateGeneticsSelection(geneticsId: string) {
    const selected = genetics.find((item) => item.id === geneticsId);
    setForm({ ...form, geneticsId, geneticsName: selected?.name ?? "" });
  }

  function startCreate() {
    setEditingId(null);
    setForm({
      ...emptyForm,
      geneticsId: genetics[0]?.id ?? "",
      geneticsName: genetics[0]?.name ?? "",
      roomId: rooms[0]?.id ?? "",
    });
    setMessage("");
  }

  function startEdit(item: MotherPlantWithPlantCount) {
    setEditingId(item.id);
    setForm({
      code: item.code,
      geneticsId: item.geneticsId,
      geneticsName: item.geneticsName,
      roomId: item.roomId ?? "",
      status: item.status,
      startDate: item.startDate,
      notes: item.notes ?? "",
    });
    setMessage("");
  }

  async function handleSave() {
    if (!form.code.trim() || !form.geneticsId) {
      setMessage("Codigo y genetica son obligatorios.");
      return;
    }

    const payload = {
      ...form,
      roomId: form.roomId || undefined,
      notes: form.notes || undefined,
      geneticsName: form.geneticsName || genetics.find((item) => item.id === form.geneticsId)?.name || "Genetica pendiente",
    };

    if (editingId) {
      await updateMotherPlant(editingId, payload);
      setMessage("Madre actualizada en mock data.");
    } else {
      await createMotherPlant(payload);
      setMessage("Madre creada en mock data.");
    }

    startCreate();
    await loadData();
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Plantas madre</h1>
        <p className="text-sm text-muted-foreground">Registro mock de madres y plantas asociadas por origen.</p>
      </header>

      <div className="grid gap-4 xl:grid-cols-[420px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? "Editar madre" : "Crear madre"}</CardTitle>
            <CardDescription>Formulario visual local, sin backend conectado.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Codigo</Label>
              <Input value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Genetica</Label>
              <Select value={form.geneticsId} onValueChange={updateGeneticsSelection}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {genetics.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Sala</Label>
              <Select value={form.roomId ?? ""} onValueChange={(roomId) => setForm({ ...form, roomId })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {rooms.map((room) => <SelectItem key={room.id} value={room.id}>{room.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select value={form.status} onValueChange={(status) => setForm({ ...form, status: status as MotherStatus })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="activa">Activa</SelectItem>
                    <SelectItem value="observacion">Observacion</SelectItem>
                    <SelectItem value="descartada">Descartada</SelectItem>
                    <SelectItem value="archivada">Archivada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Fecha de inicio</Label>
                <Input type="date" value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Observaciones</Label>
              <Textarea value={form.notes ?? ""} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
            </div>
            {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
            <div className="flex gap-2">
              <Button onClick={handleSave} className="gap-2">
                {editingId ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {editingId ? "Guardar cambios" : "Crear madre"}
              </Button>
              {editingId ? <Button variant="outline" onClick={startCreate}>Cancelar</Button> : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Listado de madres</CardTitle>
            <CardDescription>Conteos calculados desde plantas mock.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Codigo</TableHead>
                    <TableHead>Genetica</TableHead>
                    <TableHead>Sala</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha inicio</TableHead>
                    <TableHead>Plantas/esquejes</TableHead>
                    <TableHead>pH sustrato</TableHead>
                    <TableHead>PPM sustrato</TableHead>
                    <TableHead>Estado parametros</TableHead>
                    <TableHead>Observaciones</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mothers.map((item) => {
                    const latest = latestMotherMeasurement(item.id);
                    return (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-xs font-medium">{item.code}</TableCell>
                      <TableCell>{item.geneticsName}</TableCell>
                      <TableCell>{roomName(item.roomId)}</TableCell>
                      <TableCell><Badge variant="outline" className={STATUS_CLASS[item.status]}>{item.status}</Badge></TableCell>
                      <TableCell>{item.startDate}</TableCell>
                      <TableCell className="font-mono text-xs">{item.derivedPlantsCount}</TableCell>
                      <TableCell className="font-mono text-xs">{latest?.substratePH ?? "-"}</TableCell>
                      <TableCell className="font-mono text-xs">{latest?.substratePPM ?? "-"}</TableCell>
                      <TableCell>
                        {latest ? <Badge variant="outline" className={PARAM_STATUS_CLASS[latest.status]}>{latest.status}</Badge> : "-"}
                      </TableCell>
                      <TableCell className="max-w-[220px] truncate text-muted-foreground">{item.notes ?? "-"}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="gap-1" onClick={() => startEdit(item)}>
                          <Pencil className="h-4 w-4" />
                          Editar
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

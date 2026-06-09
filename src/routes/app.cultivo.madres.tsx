import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Pencil, Plus, Save, Trash2 } from "lucide-react";
import { DeleteConfirmDialog } from "@/components/cultivation/DeleteConfirmDialog";
import { ExpandableTextCell } from "@/components/cultivation/ExpandableTextCell";
import { CultivationStatusMessage } from "@/components/cultivation/RelationshipWarning";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { getGenetics } from "@/services/geneticsService";
import { getGrowBeds } from "@/services/growBedService";
import { getGrowRooms } from "@/services/growRoomService";
import { createMotherPlant, deleteMotherPlant, getMotherPlants, updateMotherPlant, type MotherPlantWithPlantCount } from "@/services/motherPlantService";
import type { Genetics, GrowBed, GrowRoom, MotherPlant } from "@/types/cultivation";

export const Route = createFileRoute("/app/cultivo/madres")({
  head: () => ({ meta: [{ title: "Plantas madre · Cannabis Club Manager" }] }),
  component: MotherPlantsPage,
});

type MotherStatus = MotherPlant["status"];
type MotherSanitaryStatus = NonNullable<MotherPlant["sanitaryStatus"]>;
type MotherForm = Omit<MotherPlant, "id" | "geneticsName"> & { geneticsName?: string };

const STATUS_CLASS: Record<MotherStatus, string> = {
  activa: "border-emerald-200 bg-emerald-500/10 text-emerald-700",
  observacion: "border-sky-200 bg-sky-500/10 text-sky-700",
  descartada: "border-muted bg-muted text-muted-foreground",
  archivada: "border-amber-200 bg-amber-500/10 text-amber-700",
};

const SANITARY_STATUS_CLASS: Record<MotherSanitaryStatus, string> = {
  bueno: "border-emerald-200 bg-emerald-500/10 text-emerald-700",
  preventivo: "border-amber-200 bg-amber-500/10 text-amber-700",
  observacion: "border-sky-200 bg-sky-500/10 text-sky-700",
  critico: "border-red-200 bg-red-500/10 text-red-700",
};

const SANITARY_STATUS_LABEL: Record<MotherSanitaryStatus, string> = {
  bueno: "Bueno",
  preventivo: "Preventivo",
  observacion: "En observacion",
  critico: "Critico",
};

const emptyForm: MotherForm = {
  code: "",
  name: "",
  geneticsId: "",
  geneticsName: "",
  roomId: "",
  bedId: "",
  status: "activa",
  sanitaryStatus: "bueno",
  startDate: "2026-05-26",
  lastCutDate: "",
  availableClones: 0,
  origin: "",
  notes: "",
};

function MotherPlantsPage() {
  const [mothers, setMothers] = useState<MotherPlantWithPlantCount[]>([]);
  const [genetics, setGenetics] = useState<Genetics[]>([]);
  const [rooms, setRooms] = useState<GrowRoom[]>([]);
  const [beds, setBeds] = useState<GrowBed[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MotherPlantWithPlantCount | null>(null);
  const [form, setForm] = useState<MotherForm>(emptyForm);
  const [message, setMessage] = useState("");

  async function loadData() {
    const [nextMothers, nextGenetics, nextRooms, nextBeds] = await Promise.all([getMotherPlants(), getGenetics(), getGrowRooms(), getGrowBeds()]);
    setMothers(nextMothers);
    setGenetics(nextGenetics);
    setRooms(nextRooms);
    setBeds(nextBeds);
    const firstRoomId = nextRooms[0]?.id ?? nextBeds[0]?.roomId ?? "";
    const firstBed = nextBeds.find((bed) => bed.roomId === firstRoomId) ?? nextBeds[0];
    setForm((current) => ({
      ...current,
      geneticsId: current.geneticsId || nextGenetics[0]?.id || "",
      geneticsName: current.geneticsName || nextGenetics[0]?.name || "",
      roomId: current.roomId || firstRoomId,
      bedId: current.bedId || firstBed?.id || "",
    }));
  }

  useEffect(() => {
    void loadData();
  }, []);

  function roomName(id?: string): string {
    if (!id) return "-";
    return rooms.find((room) => room.id === id)?.name ?? id;
  }

  function bedName(id?: string): string {
    if (!id) return "-";
    return beds.find((bed) => bed.id === id)?.name ?? id;
  }

  function bedsByRoom(roomId?: string): GrowBed[] {
    return roomId ? beds.filter((bed) => bed.roomId === roomId) : beds;
  }

  function updateGeneticsSelection(geneticsId: string) {
    const selected = genetics.find((item) => item.id === geneticsId);
    setForm({ ...form, geneticsId, geneticsName: selected?.name ?? "" });
  }

  function startCreate() {
    const firstRoomId = rooms[0]?.id ?? beds[0]?.roomId ?? "";
    const firstBed = beds.find((bed) => bed.roomId === firstRoomId) ?? beds[0];
    setEditingId(null);
    setForm({
      ...emptyForm,
      geneticsId: genetics[0]?.id ?? "",
      geneticsName: genetics[0]?.name ?? "",
      roomId: firstRoomId,
      bedId: firstBed?.id ?? "",
    });
    setMessage("");
  }

  function startEdit(item: MotherPlantWithPlantCount) {
    setEditingId(item.id);
    setForm({
      code: item.code,
      name: item.name ?? "",
      geneticsId: item.geneticsId,
      geneticsName: item.geneticsName,
      roomId: item.roomId ?? "",
      bedId: item.bedId ?? "",
      status: item.status,
      sanitaryStatus: item.sanitaryStatus ?? "bueno",
      startDate: item.startDate,
      lastCutDate: item.lastCutDate ?? "",
      availableClones: item.availableClones ?? 0,
      origin: item.origin ?? "",
      notes: item.notes ?? "",
    });
    setMessage("");
  }

  async function handleSave() {
    if (!form.code.trim() || !form.geneticsId || !form.roomId || !form.bedId) {
      setMessage("Codigo, genetica, sala y camilla son obligatorios.");
      return;
    }

    const payload = {
      ...form,
      name: form.name?.trim() || undefined,
      roomId: form.roomId || undefined,
      bedId: form.bedId || undefined,
      lastCutDate: form.lastCutDate || undefined,
      availableClones: form.availableClones ?? 0,
      origin: form.origin?.trim() || undefined,
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

  async function handleDelete() {
    if (!deleteTarget) return;

    try {
      await deleteMotherPlant(deleteTarget.id);
      setMothers((current) => current.filter((mother) => mother.id !== deleteTarget.id));
      if (editingId === deleteTarget.id) startCreate();
      setDeleteTarget(null);
      setMessage("Madre eliminada correctamente.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo eliminar la madre.");
    }
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Plantas madre</h1>
        <p className="text-sm text-muted-foreground">Registro mock de madres y plantas asociadas por origen.</p>
      </header>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? "Editar madre" : "Crear madre"}</CardTitle>
            <CardDescription>Formulario visual local, sin backend conectado.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="space-y-2">
                <Label>Codigo madre</Label>
                <Input value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Nombre madre</Label>
                <Input value={form.name ?? ""} onChange={(event) => setForm({ ...form, name: event.target.value })} />
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
              <Select
                value={form.roomId ?? ""}
                onValueChange={(roomId) => {
                  const nextBed = beds.find((bed) => bed.roomId === roomId);
                  setForm({ ...form, roomId, bedId: nextBed?.id ?? "" });
                }}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {rooms.map((room) => <SelectItem key={room.id} value={room.id}>{room.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Camilla</Label>
              <Select value={form.bedId ?? ""} onValueChange={(bedId) => setForm({ ...form, bedId })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {bedsByRoom(form.roomId).map((bed) => <SelectItem key={bed.id} value={bed.id}>{bed.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
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
              <Label>Estado sanitario</Label>
              <Select value={form.sanitaryStatus ?? "bueno"} onValueChange={(sanitaryStatus) => setForm({ ...form, sanitaryStatus: sanitaryStatus as MotherSanitaryStatus })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bueno">Bueno</SelectItem>
                  <SelectItem value="preventivo">Preventivo</SelectItem>
                  <SelectItem value="observacion">En observacion</SelectItem>
                  <SelectItem value="critico">Critico</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Fecha de inicio</Label>
              <Input type="date" value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Fecha ultimo corte</Label>
              <Input type="date" value={form.lastCutDate ?? ""} onChange={(event) => setForm({ ...form, lastCutDate: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Esquejes disponibles</Label>
              <Input
                type="number"
                min="0"
                step="1"
                value={form.availableClones ?? 0}
                onChange={(event) => setForm({ ...form, availableClones: Number(event.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label>Origen</Label>
              <Input value={form.origin ?? ""} onChange={(event) => setForm({ ...form, origin: event.target.value })} />
            </div>
            </div>
            <div className="space-y-2">
              <Label>Observaciones</Label>
              <Textarea value={form.notes ?? ""} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
            </div>
            {message ? <CultivationStatusMessage message={message} /> : null}
            <div className="flex flex-wrap gap-2">
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
            <div className="overflow-x-auto rounded-md border [&_td]:text-center [&_th]:text-center">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Codigo</TableHead>
                    <TableHead>Nombre madre</TableHead>
                    <TableHead>Genetica</TableHead>
                    <TableHead>Sala</TableHead>
                    <TableHead>Camilla</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Estado sanitario</TableHead>
                    <TableHead>Fecha inicio</TableHead>
                    <TableHead>Fecha ultimo corte</TableHead>
                    <TableHead>Esquejes disponibles</TableHead>
                    <TableHead>Origen</TableHead>
                    <TableHead>Observaciones</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mothers.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-xs font-medium">{item.code}</TableCell>
                      <TableCell>{item.name ?? "-"}</TableCell>
                      <TableCell>{item.geneticsName}</TableCell>
                      <TableCell>{roomName(item.roomId)}</TableCell>
                      <TableCell>{bedName(item.bedId)}</TableCell>
                      <TableCell><Badge variant="outline" className={STATUS_CLASS[item.status]}>{item.status}</Badge></TableCell>
                      <TableCell>
                        <SanitaryStatusSelect
                          value={item.sanitaryStatus ?? "bueno"}
                          onChange={async (next) => {
                            setMothers((prev) => prev.map((m) => m.id === item.id ? { ...m, sanitaryStatus: next } : m));
                            await updateMotherPlant(item.id, { sanitaryStatus: next });
                          }}
                        />
                      </TableCell>
                      <TableCell>{item.startDate}</TableCell>
                      <TableCell>{item.lastCutDate ?? "-"}</TableCell>
                      <TableCell className="font-mono text-xs">{item.availableClones ?? 0}</TableCell>
                      <TableCell>{item.origin ?? "-"}</TableCell>
                      <TableCell>
                        <ExpandableTextCell title={`Observaciones de ${item.code}`} text={item.notes} className="max-w-[220px]" />
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center gap-1 whitespace-nowrap">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1 text-emerald-700 hover:text-emerald-800"
                          onClick={() => startEdit(item)}
                        >
                          <Pencil className="h-4 w-4" />
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1 text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(item)}
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
      </div>
      <DeleteConfirmDialog
        open={Boolean(deleteTarget)}
        entityLabel="madre"
        itemName={deleteTarget?.code}
        description={`Estas por eliminar la madre ${deleteTarget?.code ?? ""}. Si tiene plantas asociadas, la base puede impedir la eliminacion.`}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}

function SanitaryStatusSelect({
  value,
  onChange,
}: {
  value: MotherSanitaryStatus;
  onChange: (next: MotherSanitaryStatus) => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);

  async function handleChange(next: string) {
    setLoading(true);
    try {
      await onChange(next as MotherSanitaryStatus);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Select value={value} onValueChange={handleChange} disabled={loading}>
      <SelectTrigger className={`h-7 w-[140px] border text-xs font-medium ${SANITARY_STATUS_CLASS[value]}`}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="bueno">Bueno</SelectItem>
        <SelectItem value="preventivo">Preventivo</SelectItem>
        <SelectItem value="observacion">En observacion</SelectItem>
        <SelectItem value="critico">Critico</SelectItem>
      </SelectContent>
    </Select>
  );
}

import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Scissors, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createClonador, getClonadorById, updateClonador } from "@/services/growBedService";
import { getGrowRooms } from "@/services/growRoomService";
import type { BedStatus, GrowRoom } from "@/types/cultivation";

export const Route = createFileRoute("/app/cultivo/clonador/nueva")({
  validateSearch: (search: Record<string, unknown>) => ({
    edit: search.edit != null ? String(search.edit) : undefined,
  }),
  head: () => ({ meta: [{ title: "Nuevo clonador - Cannabis Club Manager" }] }),
  component: NewClonadorPage,
});

type ClonadorForm = {
  name: string;
  code: string;
  roomId: string;
  status: BedStatus;
  maxPlants: string;
  currentPlants: string;
  responsibleUserId: string;
  notes: string;
};

const initialForm: ClonadorForm = {
  name: "",
  code: "",
  roomId: "",
  status: "activa",
  maxPlants: "30",
  currentPlants: "0",
  responsibleUserId: "",
  notes: "",
};

function NewClonadorPage() {
  const navigate = useNavigate();
  const { edit: editId } = Route.useSearch();
  const [rooms, setRooms] = useState<GrowRoom[]>([]);
  const [form, setForm] = useState<ClonadorForm>(initialForm);
  const [loading, setLoading] = useState(Boolean(editId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const nextRooms = await getGrowRooms();
      setRooms(nextRooms);

      if (editId) {
        try {
          const bed = await getClonadorById(editId);
          if (!bed) { setError("Clonador no encontrado."); return; }
          setForm({
            name: bed.name,
            code: bed.code,
            roomId: bed.roomId,
            status: bed.status,
            maxPlants: String(bed.maxPlants),
            currentPlants: String(bed.currentPlants),
            responsibleUserId: bed.responsibleUserId ?? "",
            notes: bed.notes ?? "",
          });
        } catch (err) {
          setError(err instanceof Error ? err.message : "No se pudo cargar el clonador.");
        } finally {
          setLoading(false);
        }
        return;
      }

      setForm((cur) => ({ ...cur, roomId: cur.roomId || nextRooms[0]?.id || "" }));
      setLoading(false);
    }
    void load();
  }, [editId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const maxPlants = Number(form.maxPlants);
    const currentPlants = Number(form.currentPlants);

    if (!form.name.trim()) { setError("El nombre es obligatorio."); return; }
    if (!form.code.trim()) { setError("El código es obligatorio."); return; }
    if (!form.roomId) { setError("Seleccioná una sala."); return; }
    if (!Number.isInteger(maxPlants) || maxPlants < 0 || maxPlants > 60) {
      setError("La capacidad máxima debe estar entre 0 y 60 esquejes."); return;
    }
    if (!Number.isInteger(currentPlants) || currentPlants < 0) {
      setError("Los esquejes actuales deben ser un número entero ≥ 0."); return;
    }
    if (currentPlants > maxPlants) {
      setError("Los esquejes actuales no pueden superar la capacidad máxima."); return;
    }

    try {
      setSaving(true);
      const payload = {
        name: form.name.trim(),
        code: form.code.trim(),
        roomId: form.roomId,
        status: form.status,
        maxPlants,
        currentPlants,
        responsibleUserId: form.responsibleUserId.trim() || undefined,
        notes: form.notes.trim() || undefined,
      };

      const bed = editId ? await updateClonador(editId, payload) : await createClonador(payload);
      await navigate({ to: "/app/cultivo/clonador/$id", params: { id: bed.id } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el clonador.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1100px] space-y-6">
      <div className="space-y-1">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link to="/app/cultivo/clonador">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Clonadores
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">
          {editId ? "Editar clonador" : "Nuevo clonador"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {editId ? "Modificación operativa del clonador." : "Registro de un nuevo clonador con capacidad y sala asociada."}
        </p>
      </div>

      {error && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>
      )}

      {loading ? (
        <Card><CardContent className="p-6 text-sm text-muted-foreground">Cargando datos...</CardContent></Card>
      ) : (
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Scissors className="h-6 w-6" />
              </div>
              <CardTitle>{editId ? "Editar clonador" : "Crear clonador"}</CardTitle>
              <CardDescription>Completá los datos del clonador.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre</Label>
                <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Código</Label>
                <Input id="code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Sala</Label>
                <Select value={form.roomId} onValueChange={(roomId) => setForm({ ...form, roomId })}>
                  <SelectTrigger><SelectValue placeholder="Seleccioná sala" /></SelectTrigger>
                  <SelectContent>
                    {rooms.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select value={form.status} onValueChange={(s) => setForm({ ...form, status: s as BedStatus })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="activa">Activo</SelectItem>
                    <SelectItem value="vacia">Vacío</SelectItem>
                    <SelectItem value="limpieza">Limpieza</SelectItem>
                    <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                    <SelectItem value="fuera_de_uso">Fuera de uso</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxPlants">Capacidad máxima (esquejes)</Label>
                <Input id="maxPlants" type="number" min="0" max="60" step="1"
                  value={form.maxPlants} onChange={(e) => setForm({ ...form, maxPlants: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currentPlants">Esquejes actuales</Label>
                <Input id="currentPlants" type="number" min="0" step="1"
                  value={form.currentPlants} onChange={(e) => setForm({ ...form, currentPlants: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="responsibleUserId">Responsable</Label>
                <Input id="responsibleUserId" value={form.responsibleUserId}
                  onChange={(e) => setForm({ ...form, responsibleUserId: e.target.value })} />
              </div>
              <div className="space-y-2 md:col-span-3">
                <Label htmlFor="notes">Observaciones</Label>
                <Textarea id="notes" value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
              <div className="flex justify-end md:col-span-3">
                <Button type="submit" disabled={saving} className="gap-2">
                  <Save className="h-4 w-4" />
                  {saving ? "Guardando..." : editId ? "Guardar cambios" : "Guardar clonador"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      )}
    </div>
  );
}

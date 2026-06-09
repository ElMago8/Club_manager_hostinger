import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Save, Warehouse } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createGrowRoom, getGrowRoomById, updateGrowRoom } from "@/services/growRoomService";
import type { RoomStatus, RoomType } from "@/types/cultivation";

export const Route = createFileRoute("/app/cultivo/salas/nueva")({
  validateSearch: (search: Record<string, unknown>) => ({
    edit: typeof search.edit === "string" ? search.edit : undefined,
  }),
  head: () => ({ meta: [{ title: "Nueva sala - Cannabis Club Manager" }] }),
  component: NewGrowRoomPage,
});

type GrowRoomForm = {
  code: string;
  name: string;
  type: RoomType;
  status: RoomStatus;
  installedPowerWatts: string;
  irrigationSystem: "manual" | "automatico";
  hasAirConditioning: "si" | "no";
  hasDehumidifier: "si" | "no";
  sensors: string;
  notes: string;
};

const initialForm: GrowRoomForm = {
  code: "",
  name: "",
  type: "vegetativo",
  status: "activa",
  installedPowerWatts: "0",
  irrigationSystem: "manual",
  hasAirConditioning: "no",
  hasDehumidifier: "no",
  sensors: "",
  notes: "",
};

function NewGrowRoomPage() {
  const navigate = useNavigate();
  const { edit: editId } = Route.useSearch();
  const [form, setForm] = useState<GrowRoomForm>(initialForm);
  const [loading, setLoading] = useState(Boolean(editId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!editId) {
      setLoading(false);
      return;
    }

    const safeId = editId;

    async function loadRoom() {
      try {
        const room = await getGrowRoomById(safeId);
        if (!room) {
          setError("Sala no encontrada.");
          return;
        }

        setForm({
          code: room.code,
          name: room.name,
          type: room.type,
          status: room.status,
          installedPowerWatts: String(room.technicalConfig.installedPowerWatts),
          irrigationSystem: room.technicalConfig.irrigationSystem === "automatico" ? "automatico" : "manual",
          hasAirConditioning: room.technicalConfig.hasAirConditioning ? "si" : "no",
          hasDehumidifier: room.technicalConfig.hasDehumidifier ? "si" : "no",
          sensors: room.technicalConfig.installedSensors.join(", "),
          notes: room.notes ?? "",
        });
      } finally {
        setLoading(false);
      }
    }

    void loadRoom();
  }, [editId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!form.code.trim()) {
      setError("El codigo de sala es obligatorio.");
      return;
    }

    if (!form.name.trim()) {
      setError("El nombre de sala es obligatorio.");
      return;
    }

    const installedPowerWatts = Number(form.installedPowerWatts);
    if (!Number.isInteger(installedPowerWatts) || installedPowerWatts < 0) {
      setError("La potencia debe ser un numero entero mayor o igual a 0.");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        code: form.code.trim(),
        name: form.name.trim(),
        type: form.type,
        status: form.status,
        installedPowerWatts,
        irrigationSystem: form.irrigationSystem,
        hasAirConditioning: form.hasAirConditioning === "si",
        hasDehumidifier: form.hasDehumidifier === "si",
        installedSensors: form.sensors.split(",").map((sensor) => sensor.trim()).filter(Boolean),
        notes: form.notes.trim() || undefined,
      };

      const room = editId ? await updateGrowRoom(editId, payload) : await createGrowRoom(payload);

      await navigate({ to: "/app/cultivo/salas/$id", params: { id: room.id } });
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "No se pudo crear la sala.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-[900px] space-y-6">
      <div className="space-y-1">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link to="/app/cultivo/salas">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Salas
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">{editId ? "Editar sala" : "Nueva sala"}</h1>
        <p className="text-sm text-muted-foreground">
          {editId ? "Modificacion de sala de cultivo segun la estructura actual de la base." : "Alta de sala de cultivo segun la estructura actual de la base."}
        </p>
      </div>

      {error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {loading ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">Cargando datos de la sala...</CardContent>
        </Card>
      ) : (
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Warehouse className="h-6 w-6" />
            </div>
            <CardTitle>{editId ? "Editar sala" : "Crear sala"}</CardTitle>
            <CardDescription>La capacidad total se calcula desde sus camillas, no se carga aca.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="code">Codigo de sala</Label>
              <Input
                id="code"
                value={form.code}
                onChange={(event) => setForm({ ...form, code: event.target.value })}
                placeholder="SALA-FL-01"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                placeholder="Floracion 1"
              />
            </div>

            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={form.type} onValueChange={(type) => setForm({ ...form, type: type as RoomType })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vegetativo">Vegetativo</SelectItem>
                  <SelectItem value="floracion">Floracion</SelectItem>
                  <SelectItem value="madres">Madres</SelectItem>
                  <SelectItem value="esquejes">Esquejes</SelectItem>
                  <SelectItem value="secado">Secado</SelectItem>
                  <SelectItem value="curado">Curado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Estado</Label>
              <Select value={form.status} onValueChange={(status) => setForm({ ...form, status: status as RoomStatus })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="activa">Activa</SelectItem>
                  <SelectItem value="limpieza">Limpieza</SelectItem>
                  <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                  <SelectItem value="fuera_de_uso">Fuera de uso</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="installedPowerWatts">Potencia</Label>
              <Input
                id="installedPowerWatts"
                type="number"
                min="0"
                step="1"
                value={form.installedPowerWatts}
                onChange={(event) => setForm({ ...form, installedPowerWatts: event.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Riego</Label>
              <Select
                value={form.irrigationSystem}
                onValueChange={(irrigationSystem) =>
                  setForm({ ...form, irrigationSystem: irrigationSystem as "manual" | "automatico" })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="automatico">Automatico</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>A/C</Label>
              <Select
                value={form.hasAirConditioning}
                onValueChange={(hasAirConditioning) =>
                  setForm({ ...form, hasAirConditioning: hasAirConditioning as "si" | "no" })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="si">Si</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Deshumidificador</Label>
              <Select
                value={form.hasDehumidifier}
                onValueChange={(hasDehumidifier) =>
                  setForm({ ...form, hasDehumidifier: hasDehumidifier as "si" | "no" })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="si">Si</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="sensors">Sensores</Label>
              <Input
                id="sensors"
                value={form.sensors}
                onChange={(event) => setForm({ ...form, sensors: event.target.value })}
                placeholder="temperatura, humedad, co2"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">Descripcion</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(event) => setForm({ ...form, notes: event.target.value })}
                placeholder="Observaciones operativas de la sala"
              />
            </div>

            <div className="flex justify-end md:col-span-2">
              <Button type="submit" disabled={saving} className="gap-2">
                <Save className="h-4 w-4" />
                {saving ? "Guardando..." : editId ? "Guardar cambios" : "Guardar sala"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
      )}
    </div>
  );
}

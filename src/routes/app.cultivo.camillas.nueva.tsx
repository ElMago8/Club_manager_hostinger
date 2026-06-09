import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Ruler, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createGrowBed, getGrowBedById, updateGrowBed } from "@/services/growBedService";
import { getGrowRooms } from "@/services/growRoomService";
import { createMeasurement, getLocalMeasurementStatus, getMeasurements } from "@/services/measurementService";
import type { BedStatus, GrowRoom, MeasurementMethod } from "@/types/cultivation";

export const Route = createFileRoute("/app/cultivo/camillas/nueva")({
  validateSearch: (search: Record<string, unknown>) => ({
    edit: typeof search.edit === "string" ? search.edit : undefined,
  }),
  head: () => ({ meta: [{ title: "Nueva camilla - Cannabis Club Manager" }] }),
  component: NewGrowBedPage,
});

const today = new Date().toISOString().slice(0, 10);

type GrowBedForm = {
  name: string;
  code: string;
  roomId: string;
  status: BedStatus;
  maxPlants: string;
  currentPlants: string;
  mainBatchId: string;
  responsibleUserId: string;
  substratePH: string;
  substratePPM: string;
  liquidPH: string;
  liquidPPM: string;
  measurementMethod: MeasurementMethod;
  notes: string;
};

const initialForm: GrowBedForm = {
  name: "",
  code: "",
  roomId: "",
  status: "activa",
  maxPlants: "30",
  currentPlants: "0",
  mainBatchId: "",
  responsibleUserId: "",
  substratePH: "",
  substratePPM: "",
  liquidPH: "",
  liquidPPM: "",
  measurementMethod: "manual_meter",
  notes: "",
};

function optionalNumber(value: string): number | undefined {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function optionalFieldValue(value: number | string | undefined | null) {
  return value === undefined || value === null ? "" : String(value);
}

function NewGrowBedPage() {
  const navigate = useNavigate();
  const { edit: editId } = Route.useSearch();
  const [rooms, setRooms] = useState<GrowRoom[]>([]);
  const [form, setForm] = useState<GrowBedForm>(initialForm);
  const [loading, setLoading] = useState(Boolean(editId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadRooms() {
      const nextRooms = await getGrowRooms();
      setRooms(nextRooms);

      if (editId) {
        try {
          const bed = await getGrowBedById(editId);

          if (!bed) {
            setError("Camilla no encontrada.");
            return;
          }

          let latestMeasurement: Awaited<ReturnType<typeof getMeasurements>>[number] | undefined;
          try {
            const measurements = await getMeasurements({ bedId: editId });
            latestMeasurement = measurements[0];
          } catch {
            // mediciones opcionales — si fallan no bloquean la carga de la camilla
          }

          setForm({
            name: bed.name,
            code: bed.code,
            roomId: bed.roomId,
            status: bed.status,
            maxPlants: String(bed.maxPlants),
            currentPlants: String(bed.currentPlants),
            mainBatchId: bed.mainBatchId ?? latestMeasurement?.batchId ?? "",
            responsibleUserId: bed.responsibleUserId ?? latestMeasurement?.responsibleName ?? "",
            substratePH: optionalFieldValue(latestMeasurement?.substratePH),
            substratePPM: optionalFieldValue(latestMeasurement?.substratePPM),
            liquidPH: optionalFieldValue(latestMeasurement?.liquidPH),
            liquidPPM: optionalFieldValue(latestMeasurement?.liquidPPM),
            measurementMethod: latestMeasurement?.measurementMethod ?? "manual_meter",
            notes: bed.notes ?? "",
          });
        } catch (err) {
          setError(err instanceof Error ? err.message : "No se pudo cargar la camilla.");
        } finally {
          setLoading(false);
        }
        return;
      }

      setForm((current) => ({ ...current, roomId: current.roomId || nextRooms[0]?.id || "" }));
      setLoading(false);
    }

    void loadRooms();
  }, [editId]);

  const previewStatus = getLocalMeasurementStatus({
    substratePH: optionalNumber(form.substratePH),
    substratePPM: optionalNumber(form.substratePPM),
    liquidPH: optionalNumber(form.liquidPH),
    liquidPPM: optionalNumber(form.liquidPPM),
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const maxPlants = Number(form.maxPlants);
    const currentPlants = Number(form.currentPlants);
    const hasInitialMeasurement = Boolean(
      form.substratePH || form.substratePPM || form.liquidPH || form.liquidPPM,
    );

    if (!form.name.trim()) {
      setError("El nombre de la camilla es obligatorio.");
      return;
    }

    if (!form.code.trim()) {
      setError("El codigo de la camilla es obligatorio.");
      return;
    }

    if (!form.roomId) {
      setError("Selecciona una sala.");
      return;
    }

    if (!Number.isInteger(maxPlants) || maxPlants < 0 || maxPlants > 100) {
      setError("La capacidad maxima debe ser un numero entero entre 0 y 100.");
      return;
    }

    if (!Number.isInteger(currentPlants) || currentPlants < 0) {
      setError("Las plantas actuales deben ser un numero entero mayor o igual a 0.");
      return;
    }

    if (currentPlants > maxPlants) {
      setError("Las plantas actuales no pueden superar la capacidad maxima.");
      return;
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
        mainBatchId: form.mainBatchId.trim() || undefined,
        responsibleUserId: form.responsibleUserId.trim() || undefined,
        notes: form.notes.trim() || undefined,
      };

      const bed = editId ? await updateGrowBed(editId, payload) : await createGrowBed(payload);

      if (hasInitialMeasurement) {
        await createMeasurement({
          measurementType: "mixed",
          date: today,
          time: new Date().toTimeString().slice(0, 5),
          roomId: bed.roomId,
          bedId: bed.id,
          batchId: form.mainBatchId.trim() || undefined,
          relatedModule: "bed",
          substratePH: optionalNumber(form.substratePH),
          substratePPM: optionalNumber(form.substratePPM),
          liquidPH: optionalNumber(form.liquidPH),
          liquidPPM: optionalNumber(form.liquidPPM),
          measurementMethod: form.measurementMethod,
          responsibleName: form.responsibleUserId.trim() || undefined,
        });
      }

      await navigate({ to: "/app/cultivo/camillas/$id", params: { id: bed.id } });
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "No se pudo crear la camilla.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1100px] space-y-6">
      <div className="space-y-1">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link to="/app/cultivo/camillas">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Camillas
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">{editId ? "Editar camilla" : "Nueva camilla"}</h1>
        <p className="text-sm text-muted-foreground">
          {editId ? "Modificacion operativa de camilla, capacidad y sala asociada." : "Alta operativa de camilla con capacidad, sala y parametros iniciales."}
        </p>
      </div>

      {error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>
      ) : null}

      {loading ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">Cargando datos de la camilla...</CardContent>
        </Card>
      ) : (
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Ruler className="h-6 w-6" />
            </div>
            <CardTitle>{editId ? "Editar camilla" : "Crear camilla"}</CardTitle>
            <CardDescription>Completa los datos principales que aparecen en el listado.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Camilla A" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">Codigo</Label>
              <Input id="code" value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} placeholder="FL1-A" />
            </div>

            <div className="space-y-2">
              <Label>Sala</Label>
              <Select value={form.roomId} onValueChange={(roomId) => setForm({ ...form, roomId })}>
                <SelectTrigger><SelectValue placeholder="Selecciona sala" /></SelectTrigger>
                <SelectContent>
                  {rooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>{room.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Estado</Label>
              <Select value={form.status} onValueChange={(status) => setForm({ ...form, status: status as BedStatus })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="activa">Activa</SelectItem>
                  <SelectItem value="vacia">Vacia</SelectItem>
                  <SelectItem value="limpieza">Limpieza</SelectItem>
                  <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                  <SelectItem value="fuera_de_uso">Fuera de uso</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxPlants">Capacidad maxima</Label>
              <Input id="maxPlants" type="number" min="0" max="100" step="1" value={form.maxPlants} onChange={(event) => setForm({ ...form, maxPlants: event.target.value })} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currentPlants">Plantas actuales</Label>
              <Input id="currentPlants" type="number" min="0" step="1" value={form.currentPlants} onChange={(event) => setForm({ ...form, currentPlants: event.target.value })} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mainBatchId">Lote principal</Label>
              <Input id="mainBatchId" value={form.mainBatchId} onChange={(event) => setForm({ ...form, mainBatchId: event.target.value })} placeholder="Opcional" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="responsibleUserId">Responsable</Label>
              <Input id="responsibleUserId" value={form.responsibleUserId} onChange={(event) => setForm({ ...form, responsibleUserId: event.target.value })} placeholder="Sin asignar" />
            </div>

            <div className="space-y-2">
              <Label>Metodo de medicion</Label>
              <Select value={form.measurementMethod} onValueChange={(measurementMethod) => setForm({ ...form, measurementMethod: measurementMethod as MeasurementMethod })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual_meter">Medidor manual</SelectItem>
                  <SelectItem value="drops">Gotas</SelectItem>
                  <SelectItem value="lab">Laboratorio</SelectItem>
                  <SelectItem value="sensor">Sensor</SelectItem>
                  <SelectItem value="estimated">Estimado</SelectItem>
                  <SelectItem value="other">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="substratePH">pH sustrato</Label>
              <Input id="substratePH" type="number" min="0" max="14" step="0.01" value={form.substratePH} onChange={(event) => setForm({ ...form, substratePH: event.target.value })} placeholder="Opcional" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="substratePPM">PPM sustrato</Label>
              <Input id="substratePPM" type="number" min="0" step="1" value={form.substratePPM} onChange={(event) => setForm({ ...form, substratePPM: event.target.value })} placeholder="Opcional" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="liquidPH">pH liquido</Label>
              <Input id="liquidPH" type="number" min="0" max="14" step="0.01" value={form.liquidPH} onChange={(event) => setForm({ ...form, liquidPH: event.target.value })} placeholder="Opcional" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="liquidPPM">PPM liquido</Label>
              <Input id="liquidPPM" type="number" min="0" step="1" value={form.liquidPPM} onChange={(event) => setForm({ ...form, liquidPPM: event.target.value })} placeholder="Opcional" />
            </div>

            <div className="space-y-2">
              <Label>Estado parametros</Label>
              <div className="flex h-10 items-center rounded-md border bg-muted/40 px-3 text-sm capitalize">
                {previewStatus}
              </div>
            </div>

            <div className="space-y-2 md:col-span-3">
              <Label htmlFor="notes">Observaciones</Label>
              <Textarea id="notes" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="Notas internas" />
            </div>

            <div className="flex justify-end md:col-span-3">
              <Button type="submit" disabled={saving} className="gap-2">
                <Save className="h-4 w-4" />
                {saving ? "Guardando..." : editId ? "Guardar cambios" : "Guardar camilla"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
      )}
    </div>
  );
}

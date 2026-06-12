import { useEffect, useRef, useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Save, Warehouse } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createGrowRoom, getGrowRoomById, updateGrowRoom } from "@/services/growRoomService";
import type { RoomStatus, RoomType } from "@/types/cultivation";

const PRESET_ENTORNOS = ["indoor", "outdoor", "invernadero"] as const;
const PRESET_MEDIOS   = ["sustrato", "fibra_de_coco", "lana_de_roca", "hidroponia", "aeroponia"] as const;
const ROOM_TYPE_OPTIONS: Array<{ value: RoomType; label: string }> = [
  { value: "vegetativo", label: "Vegetativo" },
  { value: "floracion", label: "Floracion" },
  { value: "madres", label: "Madres" },
  { value: "esquejes", label: "Esquejes" },
  { value: "secado", label: "Secado" },
  { value: "curado", label: "Curado" },
];

export const Route = createFileRoute("/app/cultivo/salas/nueva")({
  validateSearch: (search: Record<string, unknown>) => ({
    edit: search.edit != null ? String(search.edit) : undefined,
  }),
  head: () => ({ meta: [{ title: "Nueva sala - Cannabis Club Manager" }] }),
  component: NewGrowRoomPage,
});

type GrowRoomForm = {
  code: string;
  name: string;
  type: string;
  status: RoomStatus;
  installedPowerWatts: string;
  irrigationSystem: "manual" | "automatico";
  hasAirConditioning: "si" | "no";
  hasDehumidifier: "si" | "no";
  sensors: string;
  cultivationType: string;
  growMedium: string;
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
  cultivationType: "",
  growMedium: "",
  notes: "",
};

function parseRoomTypes(value?: string): string[] {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function joinRoomTypes(values: string[]): string {
  return values.join(", ");
}

function NewGrowRoomPage() {
  const navigate = useNavigate();
  const { edit: editId } = Route.useSearch();
  const [form, setForm] = useState<GrowRoomForm>(initialForm);
  const [loading, setLoading] = useState(Boolean(editId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [customTypeOpen, setCustomTypeOpen] = useState(false);
  const [customTypeInput, setCustomTypeInput] = useState("");
  const customTypeRef = useRef<HTMLInputElement>(null);
  const [customMediumOpen, setCustomMediumOpen] = useState(false);
  const [customMediumInput, setCustomMediumInput] = useState("");
  const customMediumRef = useRef<HTMLInputElement>(null);

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
          cultivationType: room.cultivationType ?? "",
          growMedium: room.growMedium ?? "",
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

    if (!parseRoomTypes(form.type).length) {
      setError("Selecciona al menos un tipo de sala.");
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
        cultivationType: form.cultivationType.trim() || undefined,
        growMedium: form.growMedium.trim() || undefined,
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
              <Label>Tipo (Permite varias opciones)</Label>
              <div className="grid gap-2 rounded-md border border-input bg-background/70 p-3 shadow-sm dark:bg-muted/35 dark:shadow-[0_0_0_1px_color-mix(in_oklch,var(--input)_45%,transparent)] sm:grid-cols-2">
                {ROOM_TYPE_OPTIONS.map((option) => {
                  const selectedTypes = parseRoomTypes(form.type);
                  const checked = selectedTypes.includes(option.value);

                  return (
                    <label key={option.value} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/60">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(nextChecked) => {
                          const nextTypes = nextChecked
                            ? [...selectedTypes, option.value]
                            : selectedTypes.filter((item) => item !== option.value);
                          setForm({ ...form, type: joinRoomTypes(nextTypes) });
                        }}
                      />
                      {option.label}
                    </label>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                Seleccionadas: {parseRoomTypes(form.type).length ? parseRoomTypes(form.type).join(", ") : "ninguna"}
              </p>
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

            <div className="space-y-2">
              <Label>Entorno de cultivo</Label>
              <Select
                value={PRESET_ENTORNOS.includes(form.cultivationType as typeof PRESET_ENTORNOS[number]) ? form.cultivationType : form.cultivationType ? "otro" : ""}
                onValueChange={(v) => { if (v === "otro") { setCustomTypeInput(""); setCustomTypeOpen(true); } else setForm({ ...form, cultivationType: v }); }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar entorno">
                    {form.cultivationType && !PRESET_ENTORNOS.includes(form.cultivationType as typeof PRESET_ENTORNOS[number]) ? form.cultivationType : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="indoor">Indoor</SelectItem>
                  <SelectItem value="outdoor">Outdoor</SelectItem>
                  <SelectItem value="invernadero">Invernadero</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tipo de cultivo</Label>
              <Select
                value={PRESET_MEDIOS.includes(form.growMedium as typeof PRESET_MEDIOS[number]) ? form.growMedium : form.growMedium ? "otro" : ""}
                onValueChange={(v) => { if (v === "otro") { setCustomMediumInput(""); setCustomMediumOpen(true); } else setForm({ ...form, growMedium: v }); }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo">
                    {form.growMedium && !PRESET_MEDIOS.includes(form.growMedium as typeof PRESET_MEDIOS[number]) ? form.growMedium : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sustrato">Sustrato</SelectItem>
                  <SelectItem value="fibra_de_coco">Fibra de coco</SelectItem>
                  <SelectItem value="lana_de_roca">Lana de roca</SelectItem>
                  <SelectItem value="hidroponia">Hidroponia</SelectItem>
                  <SelectItem value="aeroponia">Aeroponia</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
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

      {/* Modal entorno personalizado */}
      <Dialog open={customTypeOpen} onOpenChange={(open) => { if (!open && !form.cultivationType) setForm((f) => ({ ...f, cultivationType: "" })); setCustomTypeOpen(open); }}>
        <DialogContent className="sm:max-w-[380px]">
          <DialogHeader><DialogTitle>Entorno de cultivo personalizado</DialogTitle></DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="customType">Describí el entorno de cultivo</Label>
            <Input id="customType" ref={customTypeRef} autoFocus value={customTypeInput}
              onChange={(e) => setCustomTypeInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (customTypeInput.trim()) { setForm((f) => ({ ...f, cultivationType: customTypeInput.trim() })); setCustomTypeOpen(false); } } }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCustomTypeOpen(false)}>Cancelar</Button>
            <Button disabled={!customTypeInput.trim()} onClick={() => { setForm((f) => ({ ...f, cultivationType: customTypeInput.trim() })); setCustomTypeOpen(false); }}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal tipo de cultivo personalizado */}
      <Dialog open={customMediumOpen} onOpenChange={(open) => { if (!open && !form.growMedium) setForm((f) => ({ ...f, growMedium: "" })); setCustomMediumOpen(open); }}>
        <DialogContent className="sm:max-w-[380px]">
          <DialogHeader><DialogTitle>Tipo de cultivo personalizado</DialogTitle></DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="customMedium">Describí el tipo de cultivo</Label>
            <Input id="customMedium" ref={customMediumRef} autoFocus value={customMediumInput}
              onChange={(e) => setCustomMediumInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (customMediumInput.trim()) { setForm((f) => ({ ...f, growMedium: customMediumInput.trim() })); setCustomMediumOpen(false); } } }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCustomMediumOpen(false)}>Cancelar</Button>
            <Button disabled={!customMediumInput.trim()} onClick={() => { setForm((f) => ({ ...f, growMedium: customMediumInput.trim() })); setCustomMediumOpen(false); }}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

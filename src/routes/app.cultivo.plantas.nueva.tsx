import { useEffect, useMemo, useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getGenetics } from "@/services/geneticsService";
import { getGrowBeds } from "@/services/growBedService";
import { getMotherPlants } from "@/services/motherPlantService";
import { createPlant, getPlantById, updatePlant } from "@/services/plantService";
import type { Genetics, GrowBed, MotherPlant, PlantOrigin, PlantStage, PlantStatus } from "@/types/cultivation";

export const Route = createFileRoute("/app/cultivo/plantas/nueva")({
  validateSearch: (search: Record<string, unknown>) => ({
    edit: typeof search.edit === "string" ? search.edit : undefined,
  }),
  head: () => ({ meta: [{ title: "Nueva planta - Cannabis Club Manager" }] }),
  component: NewPlantPage,
});

const today = new Date().toISOString().slice(0, 10);
const NEW_GENETICS_OPTION = "__new_genetics__";

function hasAvailablePlantSlot(bed: GrowBed): boolean {
  return bed.currentPlants < bed.maxPlants;
}

function NewPlantPage() {
  const navigate = useNavigate();
  const { edit: editId } = Route.useSearch();
  const [beds, setBeds] = useState<GrowBed[]>([]);
  const [genetics, setGenetics] = useState<Genetics[]>([]);
  const [mothers, setMothers] = useState<MotherPlant[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    internalCode: "",
    plantName: "",
    bedId: "",
    bedPosition: "1",
    batchId: "",
    geneticsId: "none",
    motherPlantId: "none",
    origin: "esqueje" as PlantOrigin,
    stage: "vegetativo" as PlantStage,
    status: "normal" as PlantStatus,
    sanitaryStatus: "bueno" as "bueno" | "preventivo" | "observacion" | "critico",
    startDate: today,
    stageStartDate: today,
    potSizeLiters: "",
    potType: "",
    substrate: "",
    notes: "",
  });

  useEffect(() => {
    async function loadOptions() {
      const [nextBeds, nextGenetics, nextMothers] = await Promise.all([
        getGrowBeds(),
        getGenetics(),
        getMotherPlants(),
      ]);

      setBeds(nextBeds);
      setGenetics(nextGenetics);
      setMothers(nextMothers);

      const plantToEdit = editId ? await getPlantById(editId) : null;
      const firstBed = nextBeds.find(hasAvailablePlantSlot);

      setForm((current) => ({
        ...current,
        internalCode: plantToEdit?.internalCode ?? current.internalCode,
        plantName: plantToEdit?.plantName ?? current.plantName,
        bedId: plantToEdit?.bedId ?? firstBed?.id ?? "",
        bedPosition: plantToEdit ? String(plantToEdit.bedPosition) : current.bedPosition,
        batchId: plantToEdit?.batchId ?? current.batchId,
        geneticsId: plantToEdit?.geneticsId ?? (current.geneticsId === "none" ? nextGenetics[0]?.id ?? "none" : current.geneticsId),
        motherPlantId: plantToEdit?.motherPlantId ?? current.motherPlantId,
        origin: plantToEdit?.origin ?? current.origin,
        stage: plantToEdit?.stage ?? current.stage,
        status: plantToEdit?.status ?? current.status,
        sanitaryStatus: plantToEdit?.sanitaryStatus ?? current.sanitaryStatus,
        startDate: plantToEdit?.startDate ?? current.startDate,
        stageStartDate: plantToEdit?.stageStartDate ?? plantToEdit?.startDate ?? current.stageStartDate,
        potSizeLiters: plantToEdit?.potSizeLiters ? String(plantToEdit.potSizeLiters) : current.potSizeLiters,
        potType: plantToEdit?.potType ?? current.potType,
        substrate: plantToEdit?.substrate ?? current.substrate,
        notes: plantToEdit?.notes ?? current.notes,
      }));
    }

    void loadOptions();
  }, [editId]);

  const filteredMothers = useMemo(() => {
    if (form.geneticsId === "none") return mothers;
    return mothers.filter((mother) => mother.geneticsId === form.geneticsId);
  }, [mothers, form.geneticsId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const selectedBed = beds.find((bed) => bed.id === form.bedId);
    const bedPosition = Number(form.bedPosition);
    const potSizeLiters = form.potSizeLiters ? Number(form.potSizeLiters) : undefined;

    if (!selectedBed) {
      setError("Selecciona una camilla.");
      return;
    }

    if (!form.internalCode.trim()) {
      setError("Ingresa el codigo interno de la planta.");
      return;
    }

    if (!form.plantName.trim()) {
      setError("Ingresa el nombre de la planta.");
      return;
    }

    if (form.geneticsId === "none") {
      setError("Selecciona una genetica para la planta.");
      return;
    }

    if (!Number.isInteger(bedPosition) || bedPosition < 1) {
      setError("La posicion debe ser un numero entero mayor a 0.");
      return;
    }

    if (potSizeLiters !== undefined && (!Number.isFinite(potSizeLiters) || potSizeLiters <= 0)) {
      setError("El tamano de maceta debe ser mayor a 0.");
      return;
    }

    try {
      setSaving(true);
      const selectedGenetics = genetics.find((item) => item.id === form.geneticsId);
      const selectedMother = mothers.find((item) => item.id === form.motherPlantId);
      const payload = {
        internalCode: form.internalCode.trim(),
        plantName: form.plantName.trim(),
        roomId: selectedBed.roomId,
        bedId: form.bedId,
        bedPosition,
        batchId: form.batchId.trim() || undefined,
        geneticsId: form.geneticsId === "none" ? undefined : form.geneticsId,
        geneticsName: selectedGenetics?.name,
        motherPlantId: form.motherPlantId === "none" ? undefined : form.motherPlantId,
        motherPlantCode: selectedMother?.code,
        origin: form.origin,
        stage: form.stage,
        status: form.status,
        sanitaryStatus: form.sanitaryStatus,
        startDate: form.startDate,
        stageStartDate: form.stageStartDate || undefined,
        potSizeLiters,
        potType: form.potType.trim() || undefined,
        substrate: form.substrate.trim() || undefined,
        notes: form.notes.trim() || undefined,
      };

      if (editId) {
        await updatePlant(editId, payload);
      } else {
        await createPlant(payload);
      }

      await navigate({ to: "/app/cultivo/plantas" });
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "No se pudo guardar la planta.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1100px] space-y-6">
      <div className="space-y-1">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link to="/app/cultivo/plantas">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Plantas
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">{editId ? "Editar planta" : "Nueva planta"}</h1>
        <p className="text-sm text-muted-foreground">
          {editId ? "Actualiza los datos operativos de la planta." : "Alta operativa de planta individual por sala, camilla y posicion."}
        </p>
      </div>

      {error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>
      ) : null}

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>{editId ? "Editar planta" : "Crear planta"}</CardTitle>
            <CardDescription>Define donde queda registrada la planta dentro del cultivo.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="internalCode">Codigo interno</Label>
              <Input
                id="internalCode"
                value={form.internalCode}
                onChange={(event) => setForm({ ...form, internalCode: event.target.value })}
                placeholder="PL-2026-001"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="plantName">Nombre planta</Label>
              <Input
                id="plantName"
                value={form.plantName}
                onChange={(event) => setForm({ ...form, plantName: event.target.value })}
                placeholder="Madre 1 - esqueje A"
              />
            </div>

            <div className="space-y-2">
              <Label>Camilla</Label>
              <Select value={form.bedId} onValueChange={(bedId) => setForm({ ...form, bedId })}>
                <SelectTrigger><SelectValue placeholder="Selecciona camilla" /></SelectTrigger>
                <SelectContent>
                  {beds.map((bed) => {
                    const isCurrentBed = editId && bed.id === form.bedId;
                    const isFull = !hasAvailablePlantSlot(bed) && !isCurrentBed;
                    return (
                    <SelectItem key={bed.id} value={bed.id} disabled={isFull}>
                      {bed.name} - {bed.currentPlants}/{bed.maxPlants}{isFull ? " - Llena" : ""}
                    </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bedPosition">Posicion</Label>
              <Input
                id="bedPosition"
                type="number"
                min="1"
                step="1"
                value={form.bedPosition}
                onChange={(event) => setForm({ ...form, bedPosition: event.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="batchId">Lote</Label>
              <Input
                id="batchId"
                value={form.batchId}
                onChange={(event) => setForm({ ...form, batchId: event.target.value })}
                placeholder="Opcional"
              />
            </div>

            <div className="space-y-2">
              <Label>Genetica</Label>
              <Select
                value={form.geneticsId}
                onValueChange={(geneticsId) => {
                  if (geneticsId === NEW_GENETICS_OPTION) {
                    void navigate({ to: "/app/cultivo/geneticas/nueva" });
                    return;
                  }

                  setForm({ ...form, geneticsId, motherPlantId: "none" });
                }}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NEW_GENETICS_OPTION}>Nueva genética</SelectItem>
                  <SelectItem value="none" disabled>Selecciona genetica</SelectItem>
                  {genetics.map((item) => (
                    <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Datos de seguimiento</CardTitle>
            <CardDescription>Estado inicial y trazabilidad basica de la planta.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Planta madre</Label>
              <Select value={form.motherPlantId} onValueChange={(motherPlantId) => setForm({ ...form, motherPlantId })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin asignar</SelectItem>
                  {filteredMothers.map((mother) => (
                    <SelectItem key={mother.id} value={mother.id}>
                      {mother.code} - {mother.geneticsName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Origen de la madre</Label>
              <Select value={form.origin} onValueChange={(origin) => setForm({ ...form, origin: origin as PlantOrigin })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="semilla">Semilla</SelectItem>
                  <SelectItem value="esqueje">Esqueje</SelectItem>
                  <SelectItem value="madre_interna">Madre interna</SelectItem>
                  <SelectItem value="compra_externa">Compra externa</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Etapa</Label>
              <Select value={form.stage} onValueChange={(stage) => setForm({ ...form, stage: stage as PlantStage })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="vegetativo">Vegetativo</SelectItem>
                  <SelectItem value="floracion">Floracion</SelectItem>
                  <SelectItem value="cosecha">Cosecha</SelectItem>
                  <SelectItem value="secado">Secado</SelectItem>
                  <SelectItem value="curado">Curado</SelectItem>
                  <SelectItem value="liberado">Liberado</SelectItem>
                  <SelectItem value="a_limpiar">A Limpiar</SelectItem>
                  <SelectItem value="a_reparar">A Reparar</SelectItem>
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
              <Label>Estado sanitario</Label>
              <Select value={form.sanitaryStatus} onValueChange={(v) => setForm({ ...form, sanitaryStatus: v as typeof form.sanitaryStatus })}>
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
              <Label htmlFor="startDate">Fecha de inicio</Label>
              <Input
                id="startDate"
                type="date"
                value={form.startDate}
                onChange={(event) => setForm({ ...form, startDate: event.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stageStartDate">Inicio de etapa</Label>
              <Input
                id="stageStartDate"
                type="date"
                value={form.stageStartDate}
                onChange={(event) => setForm({ ...form, stageStartDate: event.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="potSizeLiters">Tamano de maceta (L)</Label>
              <Input
                id="potSizeLiters"
                type="number"
                min="0"
                step="0.1"
                value={form.potSizeLiters}
                onChange={(event) => setForm({ ...form, potSizeLiters: event.target.value })}
                placeholder="Opcional"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="potType">Tipo de maceta</Label>
              <Input
                id="potType"
                value={form.potType}
                onChange={(event) => setForm({ ...form, potType: event.target.value })}
                placeholder="Opcional"
              />
            </div>

            <div className="space-y-2 md:col-span-3">
              <Label htmlFor="substrate">Sustrato</Label>
              <Input
                id="substrate"
                value={form.substrate}
                onChange={(event) => setForm({ ...form, substrate: event.target.value })}
                placeholder="Opcional"
              />
            </div>

            <div className="space-y-2 md:col-span-3">
              <Label htmlFor="notes">Observaciones</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(event) => setForm({ ...form, notes: event.target.value })}
                placeholder="Notas internas"
              />
            </div>

            <div className="flex justify-end md:col-span-3">
              <Button type="submit" disabled={saving} className="gap-2">
                <Save className="h-4 w-4" />
                {saving ? "Guardando..." : editId ? "Guardar cambios" : "Guardar planta"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}

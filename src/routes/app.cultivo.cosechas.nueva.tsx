import { useEffect, useMemo, useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { ArrowLeft, Save, Wheat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getBatches } from "@/services/batchService";
import { createHarvest, getHarvestById, updateHarvest } from "@/services/harvestService";
import { getGrowRooms } from "@/services/growRoomService";
import type { Batch, GrowRoom, HarvestStatus } from "@/types/cultivation";

export const Route = createFileRoute("/app/cultivo/cosechas/nueva")({
  head: () => ({ meta: [{ title: "Nueva cosecha - Cannabis Club Manager" }] }),
  validateSearch: (search: Record<string, unknown>) => ({
    edit: typeof search.edit === "string" ? search.edit : undefined,
  }),
  component: NewHarvestPage,
});

const today = new Date().toISOString().slice(0, 10);

type HarvestForm = {
  code: string;
  batchId: string;
  roomId: string;
  harvestDate: string;
  wetWeight: string;
  dryWeight: string;
  shrinkage: string;
  status: HarvestStatus;
  notes: string;
};

type WeightField = "wetWeight" | "dryWeight" | "shrinkage";

const initialForm: HarvestForm = {
  code: "",
  batchId: "",
  roomId: "",
  harvestDate: today,
  wetWeight: "",
  dryWeight: "",
  shrinkage: "",
  status: "en_secado",
  notes: "",
};

function parseWeight(value: string): number | undefined {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

function formatCalculatedWeight(value: number): string {
  return Number(value.toFixed(2)).toString();
}

function getCalculatedWeight(form: HarvestForm): { field: WeightField; value: string } | null {
  const wetWeight = parseWeight(form.wetWeight);
  const dryWeight = parseWeight(form.dryWeight);
  const shrinkage = parseWeight(form.shrinkage);
  const filled = [wetWeight, dryWeight, shrinkage].filter((value) => value !== undefined);

  if (filled.length !== 2) return null;

  if (wetWeight === undefined && dryWeight !== undefined && shrinkage !== undefined) {
    return { field: "wetWeight", value: formatCalculatedWeight(dryWeight + shrinkage) };
  }

  if (dryWeight === undefined && wetWeight !== undefined && shrinkage !== undefined) {
    const value = wetWeight - shrinkage;
    return value >= 0 ? { field: "dryWeight", value: formatCalculatedWeight(value) } : null;
  }

  if (shrinkage === undefined && wetWeight !== undefined && dryWeight !== undefined) {
    const value = wetWeight - dryWeight;
    return value >= 0 ? { field: "shrinkage", value: formatCalculatedWeight(value) } : null;
  }

  return null;
}

function NewHarvestPage() {
  const navigate = useNavigate();
  const { edit: editId } = useSearch({ from: "/app/cultivo/cosechas/nueva" });
  const [form, setForm] = useState<HarvestForm>(initialForm);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [rooms, setRooms] = useState<GrowRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [batchList, roomList] = await Promise.all([getBatches(), getGrowRooms()]);
        setBatches(batchList);
        setRooms(roomList);

        if (editId) {
          const harvest = await getHarvestById(editId);
          if (!harvest) {
            setError("Cosecha no encontrada.");
            return;
          }
          setForm({
            code: harvest.code,
            batchId: harvest.batchId,
            roomId: harvest.roomId ?? "",
            harvestDate: harvest.harvestDate,
            wetWeight: harvest.wetWeightGrams != null ? String(harvest.wetWeightGrams) : "",
            dryWeight: harvest.dryWeightGrams != null ? String(harvest.dryWeightGrams) : "",
            shrinkage: harvest.shrinkageGrams != null ? String(harvest.shrinkageGrams) : "",
            status: harvest.status,
            notes: harvest.notes ?? "",
          });
        }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Error al cargar datos.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [editId]);

  const selectedBatch = useMemo(() => batches.find((b) => b.id === form.batchId), [batches, form.batchId]);
  const calculatedWeight = useMemo(() => getCalculatedWeight(form), [form]);

  function set(key: keyof HarvestForm, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function weightValue(field: WeightField): string {
    return form[field] || (calculatedWeight?.field === field ? calculatedWeight.value : "");
  }

  function weightClass(field: WeightField): string {
    return calculatedWeight?.field === field
      ? "border-amber-400 bg-amber-500/15 font-semibold text-amber-900 ring-1 ring-amber-400/60 dark:border-amber-300 dark:bg-amber-400/20 dark:text-amber-100"
      : "";
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!form.code.trim()) { setError("El código de cosecha es obligatorio."); return; }
    if (!form.batchId) { setError("Seleccioná un lote de cultivo."); return; }
    if (!form.harvestDate) { setError("La fecha de cosecha es obligatoria."); return; }

    const wetWeightGrams = weightValue("wetWeight") ? parseFloat(weightValue("wetWeight")) : undefined;
    const dryWeightGrams = weightValue("dryWeight") ? parseFloat(weightValue("dryWeight")) : undefined;
    const shrinkageGrams = weightValue("shrinkage") ? parseFloat(weightValue("shrinkage")) : undefined;

    if (wetWeightGrams !== undefined && (isNaN(wetWeightGrams) || wetWeightGrams < 0)) {
      setError("El peso húmedo debe ser un número válido mayor o igual a 0.");
      return;
    }
    if (dryWeightGrams !== undefined && (isNaN(dryWeightGrams) || dryWeightGrams < 0)) {
      setError("El peso seco debe ser un número válido mayor o igual a 0.");
      return;
    }
    if (shrinkageGrams !== undefined && (isNaN(shrinkageGrams) || shrinkageGrams < 0)) {
      setError("La merma debe ser un número válido mayor o igual a 0.");
      return;
    }

    if (
      wetWeightGrams !== undefined &&
      dryWeightGrams !== undefined &&
      shrinkageGrams !== undefined &&
      Math.abs(wetWeightGrams - dryWeightGrams - shrinkageGrams) > 0.01
    ) {
      setError("Los pesos no coinciden: peso humedo debe ser igual a peso seco mas merma.");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        code: form.code.trim(),
        batchId: form.batchId,
        batchCode: selectedBatch?.code,
        geneticsName: selectedBatch?.geneticsName,
        roomId: form.roomId || undefined,
        harvestDate: form.harvestDate,
        wetWeightGrams,
        dryWeightGrams,
        shrinkageGrams,
        status: form.status,
        notes: form.notes.trim() || undefined,
      };

      if (editId) {
        await updateHarvest(editId, payload);
      } else {
        await createHarvest(payload);
      }

      await navigate({ to: "/app/cultivo/cosechas" });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "No se pudo guardar la cosecha.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-[800px] space-y-6">
      <div className="space-y-1">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link to="/app/cultivo/cosechas">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Cosechas
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">
          {editId ? "Editar cosecha" : "Nueva cosecha"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {editId
            ? "Modificá los datos de la cosecha registrada."
            : "Registrá una nueva cosecha asociada a un lote de cultivo."}
        </p>
      </div>

      {error && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      )}

      {loading ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">Cargando datos...</CardContent>
        </Card>
      ) : (
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Wheat className="h-6 w-6" />
              </div>
              <CardTitle>{editId ? "Editar cosecha" : "Registrar cosecha"}</CardTitle>
              <CardDescription>Registrá los datos de la cosecha y su estado actual.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">

              {/* Código */}
              <div className="space-y-2">
                <Label htmlFor="code">Código de cosecha *</Label>
                <Input
                  id="code"
                  placeholder="COS-2026-003"
                  value={form.code}
                  onChange={(e) => set("code", e.target.value)}
                />
              </div>

              {/* Fecha */}
              <div className="space-y-2">
                <Label htmlFor="harvestDate">Fecha de cosecha *</Label>
                <Input
                  id="harvestDate"
                  type="date"
                  value={form.harvestDate}
                  onChange={(e) => set("harvestDate", e.target.value)}
                />
              </div>

              {/* Lote */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="batchId">Lote de cultivo *</Label>
                <Select value={form.batchId} onValueChange={(v) => set("batchId", v)}>
                  <SelectTrigger id="batchId">
                    <SelectValue placeholder="Seleccionar lote" />
                  </SelectTrigger>
                  <SelectContent>
                    {batches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.code}
                        {b.geneticsName ? ` · ${b.geneticsName}` : ""}
                        {b.roomName ? ` · ${b.roomName}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sala de cultivo */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="roomId">Sala de cultivo</Label>
                <Select value={form.roomId} onValueChange={(v) => set("roomId", v === "none" ? "" : v)}>
                  <SelectTrigger id="roomId">
                    <SelectValue placeholder="Seleccionar sala (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin sala asignada</SelectItem>
                    {rooms.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name} · {r.code}
                        {r.cultivationType ? ` · ${r.cultivationType}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Peso húmedo */}
              <div className="space-y-2">
                <Label htmlFor="wetWeight">Peso húmedo (g)</Label>
                <Input
                  id="wetWeight"
                  type="number"
                  min={0}
                  step="any"
                  placeholder="Ej: 1800"
                  value={weightValue("wetWeight")}
                  onChange={(e) => set("wetWeight", e.target.value)}
                  className={weightClass("wetWeight")}
                />
                {calculatedWeight?.field === "wetWeight" ? (
                  <p className="text-xs font-medium text-amber-700 dark:text-amber-300">Calculado automaticamente.</p>
                ) : null}
              </div>

              {/* Peso seco */}
              <div className="space-y-2">
                <Label htmlFor="dryWeight">Peso seco (g)</Label>
                <Input
                  id="dryWeight"
                  type="number"
                  min={0}
                  step="any"
                  placeholder="Ej: 420"
                  value={weightValue("dryWeight")}
                  onChange={(e) => set("dryWeight", e.target.value)}
                  className={weightClass("dryWeight")}
                />
                {calculatedWeight?.field === "dryWeight" ? (
                  <p className="text-xs font-medium text-amber-700 dark:text-amber-300">Calculado automaticamente.</p>
                ) : null}
              </div>

              {/* Merma (manual) */}
              <div className="space-y-2">
                <Label htmlFor="shrinkage">Merma (g)</Label>
                <Input
                  id="shrinkage"
                  type="number"
                  min={0}
                  step="any"
                  placeholder="Ej: 1380"
                  value={weightValue("shrinkage")}
                  onChange={(e) => set("shrinkage", e.target.value)}
                  className={weightClass("shrinkage")}
                />
                {calculatedWeight?.field === "shrinkage" ? (
                  <p className="text-xs font-medium text-amber-700 dark:text-amber-300">Calculado automaticamente.</p>
                ) : null}
              </div>

              {/* Estado */}
              <div className="space-y-2">
                <Label htmlFor="status">Estado</Label>
                <Select value={form.status} onValueChange={(v) => set("status", v as HarvestStatus)}>
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en_secado">En secado</SelectItem>
                    <SelectItem value="en_curado">En curado</SelectItem>
                    <SelectItem value="lista_para_stock">Stock</SelectItem>
                    <SelectItem value="descartada">Descartada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Observaciones */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="notes">Observaciones</Label>
                <Textarea
                  id="notes"
                  placeholder="Notas adicionales sobre la cosecha..."
                  rows={3}
                  value={form.notes}
                  onChange={(e) => set("notes", e.target.value)}
                />
              </div>

              {/* Acciones */}
              <div className="flex gap-3 md:col-span-2">
                <Button type="submit" disabled={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? "Guardando..." : editId ? "Guardar cambios" : "Registrar cosecha"}
                </Button>
                <Button asChild variant="outline" type="button">
                  <Link to="/app/cultivo/cosechas">Cancelar</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      )}
    </div>
  );
}

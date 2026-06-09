import { useEffect, useMemo, useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Save, Wheat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getBatches } from "@/services/batchService";
import { createHarvest, getHarvestById, updateHarvest } from "@/services/harvestService";
import type { Batch, HarvestStatus } from "@/types/cultivation";

export const Route = createFileRoute("/app/cultivo/cosechas/nueva")({
  head: () => ({ meta: [{ title: "Nueva cosecha - Cannabis Club Manager" }] }),
  component: NewHarvestPage,
});

const today = new Date().toISOString().slice(0, 10);

type HarvestForm = {
  code: string;
  batchId: string;
  harvestDate: string;
  wetWeight: string;
  dryWeight: string;
  status: HarvestStatus;
  notes: string;
};

const initialForm: HarvestForm = {
  code: "",
  batchId: "",
  harvestDate: today,
  wetWeight: "",
  dryWeight: "",
  status: "registrada",
  notes: "",
};

function getEditIdFromUrl() {
  return typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("edit") : null;
}

function NewHarvestPage() {
  const navigate = useNavigate();
  const [editId, setEditId] = useState<string | null>(() => getEditIdFromUrl());
  const [form, setForm] = useState<HarvestForm>(initialForm);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const id = getEditIdFromUrl();
    setEditId(id);

    async function load() {
      try {
        const batchList = await getBatches();
        setBatches(batchList);

        if (id) {
          const harvest = await getHarvestById(id);
          if (!harvest) {
            setError("Cosecha no encontrada.");
            return;
          }
          setForm({
            code: harvest.code,
            batchId: harvest.batchId,
            harvestDate: harvest.harvestDate,
            wetWeight: harvest.wetWeightGrams != null ? String(harvest.wetWeightGrams) : "",
            dryWeight: harvest.dryWeightGrams != null ? String(harvest.dryWeightGrams) : "",
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
  }, []);

  const wetNum = parseFloat(form.wetWeight);
  const dryNum = parseFloat(form.dryWeight);
  const shrinkage = !isNaN(wetNum) && !isNaN(dryNum) ? Math.max(0, wetNum - dryNum) : null;
  const rendimiento = !isNaN(wetNum) && !isNaN(dryNum) && wetNum > 0 ? ((dryNum / wetNum) * 100).toFixed(1) : null;

  const selectedBatch = useMemo(() => batches.find((b) => b.id === form.batchId), [batches, form.batchId]);

  function set(key: keyof HarvestForm, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!form.code.trim()) { setError("El código de cosecha es obligatorio."); return; }
    if (!form.batchId) { setError("Seleccioná un lote de cultivo."); return; }
    if (!form.harvestDate) { setError("La fecha de cosecha es obligatoria."); return; }

    const wetWeightGrams = form.wetWeight ? parseFloat(form.wetWeight) : undefined;
    const dryWeightGrams = form.dryWeight ? parseFloat(form.dryWeight) : undefined;

    if (wetWeightGrams !== undefined && (isNaN(wetWeightGrams) || wetWeightGrams < 0)) {
      setError("El peso húmedo debe ser un número válido mayor o igual a 0.");
      return;
    }
    if (dryWeightGrams !== undefined && (isNaN(dryWeightGrams) || dryWeightGrams < 0)) {
      setError("El peso seco debe ser un número válido mayor o igual a 0.");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        code: form.code.trim(),
        batchId: form.batchId,
        batchCode: selectedBatch?.code,
        geneticsName: selectedBatch?.geneticsName,
        roomName: selectedBatch?.roomName,
        harvestDate: form.harvestDate,
        wetWeightGrams,
        dryWeightGrams,
        shrinkageGrams: shrinkage ?? undefined,
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
              <CardDescription>La merma y el rendimiento se calculan automáticamente desde los pesos.</CardDescription>
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

              {/* Peso húmedo */}
              <div className="space-y-2">
                <Label htmlFor="wetWeight">Peso húmedo (g)</Label>
                <Input
                  id="wetWeight"
                  type="number"
                  min={0}
                  step={1}
                  placeholder="Ej: 1800"
                  value={form.wetWeight}
                  onChange={(e) => set("wetWeight", e.target.value)}
                />
              </div>

              {/* Peso seco */}
              <div className="space-y-2">
                <Label htmlFor="dryWeight">Peso seco (g)</Label>
                <Input
                  id="dryWeight"
                  type="number"
                  min={0}
                  step={1}
                  placeholder="Ej: 420"
                  value={form.dryWeight}
                  onChange={(e) => set("dryWeight", e.target.value)}
                />
              </div>

              {/* Merma (calc) */}
              <div className="space-y-2">
                <Label>Merma (g)</Label>
                <Input
                  readOnly
                  value={shrinkage != null ? String(shrinkage) : ""}
                  placeholder="Calculada automáticamente"
                  className="bg-muted text-muted-foreground"
                />
              </div>

              {/* Rendimiento (display) */}
              <div className="space-y-2">
                <Label>Rendimiento (%)</Label>
                <Input
                  readOnly
                  value={rendimiento != null ? `${rendimiento} %` : ""}
                  placeholder="Calculado automáticamente"
                  className="bg-muted text-muted-foreground"
                />
              </div>

              {/* Estado */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="status">Estado</Label>
                <Select value={form.status} onValueChange={(v) => set("status", v as HarvestStatus)}>
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="registrada">Registrada</SelectItem>
                    <SelectItem value="en_secado">En secado</SelectItem>
                    <SelectItem value="seca">Seca</SelectItem>
                    <SelectItem value="en_curado">En curado</SelectItem>
                    <SelectItem value="lista_para_stock">Lista para stock</SelectItem>
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

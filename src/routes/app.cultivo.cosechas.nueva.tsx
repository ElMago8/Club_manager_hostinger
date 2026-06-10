import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { ArrowLeft, Save, Wheat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getBatches } from "@/services/batchService";
import { createHarvest, getHarvestById, updateHarvest } from "@/services/harvestService";
import type { Batch, HarvestStatus } from "@/types/cultivation";

const PRESET_ENTORNOS = ["indoor", "outdoor", "invernadero"] as const;
const PRESET_MEDIOS   = ["sustrato", "fibra_de_coco", "lana_de_roca", "hidroponia", "aeroponia"] as const;

const MEDIO_LABEL: Record<string, string> = {
  sustrato:      "Sustrato",
  fibra_de_coco: "Fibra de coco",
  lana_de_roca:  "Lana de roca",
  hidroponia:    "Hidroponia",
  aeroponia:     "Aeroponia",
};

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
  harvestDate: string;
  wetWeight: string;
  dryWeight: string;
  shrinkage: string;
  cultivationType: string;   // Entorno de cultivo
  growMedium: string;        // Tipo de cultivo
  status: HarvestStatus;
  notes: string;
};

const initialForm: HarvestForm = {
  code: "",
  batchId: "",
  harvestDate: today,
  wetWeight: "",
  dryWeight: "",
  shrinkage: "",
  cultivationType: "",
  growMedium: "",
  status: "en_secado",
  notes: "",
};

function NewHarvestPage() {
  const navigate = useNavigate();
  const { edit: editId } = useSearch({ from: "/app/cultivo/cosechas/nueva" });
  const [form, setForm] = useState<HarvestForm>(initialForm);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [customTypeOpen, setCustomTypeOpen] = useState(false);
  const [customTypeInput, setCustomTypeInput] = useState("");
  const customTypeRef = useRef<HTMLInputElement>(null);
  const [customMediumOpen, setCustomMediumOpen] = useState(false);
  const [customMediumInput, setCustomMediumInput] = useState("");
  const customMediumRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const batchList = await getBatches();
        setBatches(batchList);

        if (editId) {
          const harvest = await getHarvestById(editId);
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
            shrinkage: harvest.shrinkageGrams != null ? String(harvest.shrinkageGrams) : "",
            cultivationType: harvest.cultivationType ?? "",
            growMedium: harvest.growMedium ?? "",
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
    const shrinkageGrams = form.shrinkage ? parseFloat(form.shrinkage) : undefined;

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
        shrinkageGrams,
        cultivationType: form.cultivationType || undefined,
        growMedium: form.growMedium || undefined,
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

              {/* Entorno de cultivo */}
              <div className="space-y-2">
                <Label htmlFor="cultivationType">Entorno de cultivo</Label>
                <Select
                  value={
                    PRESET_ENTORNOS.includes(form.cultivationType as typeof PRESET_ENTORNOS[number])
                      ? form.cultivationType
                      : form.cultivationType ? "otro" : ""
                  }
                  onValueChange={(val) => {
                    if (val === "otro") { setCustomTypeInput(""); setCustomTypeOpen(true); }
                    else set("cultivationType", val);
                  }}
                >
                  <SelectTrigger id="cultivationType">
                    <SelectValue placeholder="Seleccionar entorno">
                      {form.cultivationType && !PRESET_ENTORNOS.includes(form.cultivationType as typeof PRESET_ENTORNOS[number])
                        ? form.cultivationType : undefined}
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

              {/* Tipo de cultivo */}
              <div className="space-y-2">
                <Label htmlFor="growMedium">Tipo de cultivo</Label>
                <Select
                  value={
                    PRESET_MEDIOS.includes(form.growMedium as typeof PRESET_MEDIOS[number])
                      ? form.growMedium
                      : form.growMedium ? "otro" : ""
                  }
                  onValueChange={(val) => {
                    if (val === "otro") { setCustomMediumInput(""); setCustomMediumOpen(true); }
                    else set("growMedium", val);
                  }}
                >
                  <SelectTrigger id="growMedium">
                    <SelectValue placeholder="Seleccionar tipo">
                      {form.growMedium && !PRESET_MEDIOS.includes(form.growMedium as typeof PRESET_MEDIOS[number])
                        ? form.growMedium : undefined}
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

              {/* Peso húmedo */}
              <div className="space-y-2">
                <Label htmlFor="wetWeight">Peso húmedo (g)</Label>
                <Input
                  id="wetWeight"
                  type="number"
                  min={0}
                  step="any"
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
                  step="any"
                  placeholder="Ej: 420"
                  value={form.dryWeight}
                  onChange={(e) => set("dryWeight", e.target.value)}
                />
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
                  value={form.shrinkage}
                  onChange={(e) => set("shrinkage", e.target.value)}
                />
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

      {/* Modal entorno personalizado */}
      <Dialog open={customTypeOpen} onOpenChange={(open) => {
        if (!open && !form.cultivationType) set("cultivationType", "");
        setCustomTypeOpen(open);
      }}>
        <DialogContent className="sm:max-w-[380px]">
          <DialogHeader>
            <DialogTitle>Entorno de cultivo personalizado</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="customType">Describí el entorno de cultivo</Label>
            <Input
              id="customType"
              ref={customTypeRef}
              autoFocus
              value={customTypeInput}
              onChange={(e) => setCustomTypeInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (customTypeInput.trim()) {
                    set("cultivationType", customTypeInput.trim());
                    setCustomTypeOpen(false);
                  }
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" className="cursor-pointer" onClick={() => setCustomTypeOpen(false)}>
              Cancelar
            </Button>
            <Button
              className="cursor-pointer"
              disabled={!customTypeInput.trim()}
              onClick={() => {
                set("cultivationType", customTypeInput.trim());
                setCustomTypeOpen(false);
              }}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Modal tipo de cultivo personalizado */}
      <Dialog open={customMediumOpen} onOpenChange={(open) => {
        if (!open && !form.growMedium) set("growMedium", "");
        setCustomMediumOpen(open);
      }}>
        <DialogContent className="sm:max-w-[380px]">
          <DialogHeader>
            <DialogTitle>Tipo de cultivo personalizado</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="customMedium">Describí el tipo de cultivo</Label>
            <Input
              id="customMedium"
              ref={customMediumRef}
              autoFocus
              value={customMediumInput}
              onChange={(e) => setCustomMediumInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (customMediumInput.trim()) {
                    set("growMedium", customMediumInput.trim());
                    setCustomMediumOpen(false);
                  }
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" className="cursor-pointer" onClick={() => setCustomMediumOpen(false)}>
              Cancelar
            </Button>
            <Button
              className="cursor-pointer"
              disabled={!customMediumInput.trim()}
              onClick={() => {
                set("growMedium", customMediumInput.trim());
                setCustomMediumOpen(false);
              }}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

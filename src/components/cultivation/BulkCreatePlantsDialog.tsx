import { useMemo, useState } from "react";
import { AlertTriangle, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DateInput } from "@/components/ui/date-input";
import { toast } from "sonner";
import { bulkCreatePlantsForBed } from "@/services/plantService";
import type {
  Genetics,
  GrowBed,
  MotherPlant,
  Plant,
  PlantOrigin,
  PlantStage,
  PlantStatus,
} from "@/types/cultivation";

// ─── Helpers ─────────────────────────────────────────────────────────────────

type Step = "form" | "preview";

interface FormState {
  cantidad: number;
  bedId: string;
  geneticsId: string;
  geneticsFromMother: boolean;
  motherPlantId: string;
  batchId: string;
  origin: PlantOrigin;
  stage: PlantStage;
  status: PlantStatus;
  startDate: string;
  notes: string;
  internalCodePrefix: string;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

const EMPTY_FORM: FormState = {
  cantidad: 1,
  bedId: "",
  geneticsId: "",
  geneticsFromMother: false,
  motherPlantId: "",
  batchId: "",
  origin: "esqueje",
  stage: "vegetativo",
  status: "normal",
  startDate: todayISO(),
  notes: "",
  internalCodePrefix: "PLT",
};

const ORIGEN_LABEL: Record<PlantOrigin, string> = {
  semilla: "Semilla",
  esqueje: "Esqueje interno",
  madre: "Madre interna",
  planta: "Planta externa",
};

const ETAPA_LABEL: Record<PlantStage, string> = {
  vegetativo: "Vegetativo",
  floracion: "Floración",
  cosecha: "Cosecha",
  secado: "Secado",
  curado: "Curado",
  liberado: "Liberado",
  a_limpiar: "A limpiar",
  a_reparar: "A reparar",
};

const ESTADO_LABEL: Record<PlantStatus, string> = {
  normal: "Normal",
  observacion: "Observación",
  alerta: "Alerta",
  descartada: "Descartada",
  cosechada: "Cosechada",
};

// ─── Componente principal ─────────────────────────────────────────────────────

interface BulkCreatePlantsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  beds: GrowBed[];
  genetics: Genetics[];
  mothers: MotherPlant[];
  onSuccess: (plants: Plant[]) => void;
  /** Si se pasa, la camilla queda pre-seleccionada y bloqueada */
  defaultBedId?: string;
}

export function BulkCreatePlantsDialog({
  open,
  onOpenChange,
  beds,
  genetics,
  mothers,
  onSuccess,
  defaultBedId,
}: BulkCreatePlantsDialogProps) {
  const [step, setStep] = useState<Step>("form");
  const [form, setForm] = useState<FormState>(() => ({
    ...EMPTY_FORM,
    bedId: defaultBedId ?? "",
  }));
  const [saving, setSaving] = useState(false);

  const camillasBeds = useMemo(
    () => beds.filter((b) => b.tipo === "camilla"),
    [beds],
  );

  const selectedBed = useMemo(
    () => camillasBeds.find((b) => b.id === form.bedId),
    [camillasBeds, form.bedId],
  );

  const selectedGenetics = useMemo(
    () => genetics.find((g) => g.id === form.geneticsId),
    [genetics, form.geneticsId],
  );

  const selectedMother = useMemo(
    () => mothers.find((m) => m.id === form.motherPlantId),
    [mothers, form.motherPlantId],
  );

  const freeSlots = selectedBed
    ? selectedBed.maxPlants - selectedBed.currentPlants
    : null;

  const capacityWarning =
    freeSlots !== null && form.cantidad > freeSlots
      ? `La camilla ${selectedBed?.name ?? ""} tiene solo ${freeSlots} posición${freeSlots !== 1 ? "es" : ""} libre${freeSlots !== 1 ? "s" : ""}.`
      : null;

  // Filas de vista previa (máx 10 visibles)
  const previewRows = useMemo(
    () =>
      Array.from({ length: Math.min(form.cantidad, 10) }, (_, i) => ({
        key: i,
        estimatedCode: `${form.internalCodePrefix}-${String(i + 1).padStart(4, "0")}`,
      })),
    [form.cantidad, form.internalCodePrefix],
  );

  function resetAndClose() {
    setStep("form");
    setForm({ ...EMPTY_FORM, bedId: defaultBedId ?? "" });
    onOpenChange(false);
  }

  function handleMotherChange(motherPlantId: string) {
    const mother = mothers.find((m) => m.id === motherPlantId);
    setForm((prev) => ({
      ...prev,
      motherPlantId,
      geneticsId: mother?.geneticsId ?? prev.geneticsId,
      geneticsFromMother: !!mother?.geneticsId,
    }));
  }

  function validate(): string | null {
    if (!form.bedId) return "Seleccioná una camilla.";
    if (!form.geneticsId) return "Seleccioná una genética.";
    if (!form.startDate) return "Ingresá una fecha de ingreso.";
    if (!form.internalCodePrefix.trim()) return "El prefijo de código no puede estar vacío.";
    if (form.cantidad < 1 || form.cantidad > 100)
      return "La cantidad debe estar entre 1 y 100.";
    return null;
  }

  function handleNext() {
    const error = validate();
    if (error) {
      toast.error(error);
      return;
    }
    setStep("preview");
  }

  async function handleSubmit() {
    setSaving(true);
    try {
      const roomId = selectedBed?.roomId ?? "";
      const created = await bulkCreatePlantsForBed({
        bedId: form.bedId,
        count: form.cantidad,
        plant: {
          roomId,
          geneticsId: form.geneticsId || undefined,
          motherPlantId: form.motherPlantId || undefined,
          batchId: form.batchId || undefined,
          origin: form.origin,
          stage: form.stage,
          status: form.status,
          startDate: form.startDate,
          notes: form.notes || undefined,
          internalCodePrefix: form.internalCodePrefix,
        },
      });
      toast.success(`${created.length} plantas creadas correctamente.`);
      onSuccess(created);
      resetAndClose();
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "No se pudieron crear las plantas.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) resetAndClose();
        else onOpenChange(o);
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Ingreso múltiple de plantas
          </DialogTitle>
          <DialogDescription>
            Creá varias plantas con el mismo origen, genética, lote y ubicación.
          </DialogDescription>
        </DialogHeader>

        {step === "form" ? (
          <FormStep
            form={form}
            setForm={setForm}
            beds={camillasBeds}
            genetics={genetics}
            mothers={mothers}
            capacityWarning={capacityWarning}
            onMotherChange={handleMotherChange}
            bedLocked={!!defaultBedId}
          />
        ) : (
          <PreviewStep
            form={form}
            previewRows={previewRows}
            selectedBed={selectedBed}
            selectedGenetics={selectedGenetics}
            selectedMother={selectedMother}
          />
        )}

        <DialogFooter className="gap-2 pt-2">
          {step === "form" ? (
            <>
              <Button variant="outline" onClick={resetAndClose}>
                Cancelar
              </Button>
              <Button onClick={handleNext}>Ver vista previa</Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setStep("form")}>
                Volver
              </Button>
              <Button onClick={handleSubmit} disabled={saving}>
                {saving
                  ? "Creando plantas…"
                  : `Crear ${form.cantidad} planta${form.cantidad !== 1 ? "s" : ""}`}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Step Form ────────────────────────────────────────────────────────────────

function FormStep({
  form,
  setForm,
  beds,
  genetics,
  mothers,
  capacityWarning,
  onMotherChange,
  bedLocked = false,
}: {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  beds: GrowBed[];
  genetics: Genetics[];
  mothers: MotherPlant[];
  capacityWarning: string | null;
  onMotherChange: (id: string) => void;
  bedLocked?: boolean;
}) {
  const selectedBed = beds.find((b) => b.id === form.bedId);

  return (
    <div className="grid gap-4 py-1">
      {/* Fila 1: Cantidad + Camilla */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Cantidad *</Label>
          <Input
            type="number"
            min={1}
            max={100}
            value={form.cantidad}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                cantidad: Math.max(1, Math.min(100, parseInt(e.target.value) || 1)),
              }))
            }
          />
        </div>
        <div className="space-y-1">
          <Label>Camilla *</Label>
          {bedLocked ? (
            <div className="flex h-9 items-center rounded-md border bg-muted/40 px-3 text-sm text-muted-foreground">
              {selectedBed?.name ?? form.bedId}
            </div>
          ) : (
            <Select
              value={form.bedId || "_none"}
              onValueChange={(v) =>
                setForm((f) => ({ ...f, bedId: v === "_none" ? "" : v }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccioná camilla" />
              </SelectTrigger>
              <SelectContent>
                {beds.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}{" "}
                    <span className="text-muted-foreground">
                      ({b.currentPlants}/{b.maxPlants})
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Alerta capacidad */}
      {capacityWarning && (
        <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {capacityWarning}
        </div>
      )}

      {/* Fila 2: Madre + Genética */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Madre (opcional)</Label>
          <Select
            value={form.motherPlantId || "_none"}
            onValueChange={(v) =>
              onMotherChange(v === "_none" ? "" : v)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Sin madre" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_none">Sin madre</SelectItem>
              {mothers.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.code}
                  {m.name ? ` – ${m.name}` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>
            Genética *
            {form.geneticsFromMother && (
              <span className="ml-1.5 text-xs text-muted-foreground">
                (de la madre)
              </span>
            )}
          </Label>
          <Select
            value={form.geneticsId || "_none"}
            onValueChange={(v) =>
              setForm((f) => ({
                ...f,
                geneticsId: v === "_none" ? "" : v,
                geneticsFromMother: false,
              }))
            }
            disabled={form.geneticsFromMother}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccioná genética" />
            </SelectTrigger>
            <SelectContent>
              {genetics.map((g) => (
                <SelectItem key={g.id} value={g.id}>
                  {g.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Fila 3: Origen + Etapa */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Origen</Label>
          <Select
            value={form.origin}
            onValueChange={(v) =>
              setForm((f) => ({ ...f, origin: v as PlantOrigin }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(ORIGEN_LABEL) as PlantOrigin[]).map((o) => (
                <SelectItem key={o} value={o}>
                  {ORIGEN_LABEL[o]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Etapa</Label>
          <Select
            value={form.stage}
            onValueChange={(v) =>
              setForm((f) => ({ ...f, stage: v as PlantStage }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(ETAPA_LABEL) as PlantStage[]).map((s) => (
                <SelectItem key={s} value={s}>
                  {ETAPA_LABEL[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Fila 4: Estado + Fecha ingreso */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Estado</Label>
          <Select
            value={form.status}
            onValueChange={(v) =>
              setForm((f) => ({ ...f, status: v as PlantStatus }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(ESTADO_LABEL) as PlantStatus[]).map((s) => (
                <SelectItem key={s} value={s}>
                  {ESTADO_LABEL[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Fecha de ingreso *</Label>
          <DateInput
            value={form.startDate}
            onChange={(v) => setForm((f) => ({ ...f, startDate: v }))}
          />
        </div>
      </div>

      {/* Fila 5: Lote + Prefijo */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>ID de lote (opcional)</Label>
          <Input
            placeholder="ej: 3"
            value={form.batchId}
            onChange={(e) =>
              setForm((f) => ({ ...f, batchId: e.target.value }))
            }
          />
        </div>
        <div className="space-y-1">
          <Label>Prefijo de código</Label>
          <Input
            value={form.internalCodePrefix}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                internalCodePrefix: e.target.value.toUpperCase().replace(/\s/g, ""),
              }))
            }
          />
        </div>
      </div>

      {/* Observaciones */}
      <div className="space-y-1">
        <Label>Observaciones (opcional)</Label>
        <Textarea
          rows={2}
          placeholder="Notas sobre este ingreso…"
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
        />
      </div>
    </div>
  );
}

// ─── Step Preview ─────────────────────────────────────────────────────────────

function PreviewStep({
  form,
  previewRows,
  selectedBed,
  selectedGenetics,
  selectedMother,
}: {
  form: FormState;
  previewRows: { key: number; estimatedCode: string }[];
  selectedBed?: GrowBed;
  selectedGenetics?: Genetics;
  selectedMother?: MotherPlant;
}) {
  return (
    <div className="space-y-4 py-1">
      {/* Resumen */}
      <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm">
        <p className="font-medium">
          Se crearán{" "}
          <span className="text-primary">{form.cantidad} plantas</span>
        </p>
        <div className="mt-1.5 grid grid-cols-2 gap-x-6 gap-y-0.5 text-muted-foreground">
          <span>Camilla: <strong className="text-foreground">{selectedBed?.name ?? "—"}</strong></span>
          <span>Genética: <strong className="text-foreground">{selectedGenetics?.name ?? "—"}</strong></span>
          <span>Madre: <strong className="text-foreground">{selectedMother?.code ?? "Sin madre"}</strong></span>
          <span>Origen: <strong className="text-foreground">{ORIGEN_LABEL[form.origin]}</strong></span>
          <span>Etapa: <strong className="text-foreground">{ETAPA_LABEL[form.stage]}</strong></span>
          <span>Estado: <strong className="text-foreground">{ESTADO_LABEL[form.status]}</strong></span>
        </div>
      </div>

      {/* Tabla estimada */}
      <div className="rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código estimado</TableHead>
              <TableHead>Genética</TableHead>
              <TableHead>Madre</TableHead>
              <TableHead>Camilla</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {previewRows.map((row) => (
              <TableRow key={row.key}>
                <TableCell className="font-mono text-xs font-medium">
                  {row.estimatedCode}
                </TableCell>
                <TableCell className="text-sm">{selectedGenetics?.name ?? "—"}</TableCell>
                <TableCell className="font-mono text-xs">
                  {selectedMother?.code ?? "—"}
                </TableCell>
                <TableCell className="text-sm">{selectedBed?.name ?? "—"}</TableCell>
              </TableRow>
            ))}
            {form.cantidad > 10 && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="py-2 text-center text-xs text-muted-foreground"
                >
                  … y {form.cantidad - 10} planta{form.cantidad - 10 !== 1 ? "s" : ""} más
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-muted-foreground">
        * Los códigos finales son asignados por el servidor. La numeración mostrada es estimada.
      </p>
    </div>
  );
}

import { useMemo, useState } from "react";
import { AlertTriangle, FlaskConical } from "lucide-react";
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
import { bulkCreatePlantsForClonador } from "@/services/plantService";
import type {
  Genetics,
  MotherPlant,
  Plant,
  PlantOrigin,
  PlantStage,
  PlantStatus,
} from "@/types/cultivation";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Step = "form" | "preview";

interface FormState {
  cantidad: number;
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
  geneticsId: "",
  geneticsFromMother: false,
  motherPlantId: "",
  batchId: "",
  origin: "esqueje",
  stage: "vegetativo",
  status: "normal",
  startDate: todayISO(),
  notes: "",
  internalCodePrefix: "ESQ",
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

// ─── Props ────────────────────────────────────────────────────────────────────

interface BulkCreateClonadorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clonadorId: string;
  clonadorName: string;
  freeSlots: number;
  genetics: Genetics[];
  mothers: MotherPlant[];
  onSuccess: (plants: Plant[]) => void;
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function BulkCreateClonadorDialog({
  open,
  onOpenChange,
  clonadorId,
  clonadorName,
  freeSlots,
  genetics,
  mothers,
  onSuccess,
}: BulkCreateClonadorDialogProps) {
  const [step, setStep] = useState<Step>("form");
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const selectedGenetics = useMemo(
    () => genetics.find((g) => g.id === form.geneticsId),
    [genetics, form.geneticsId],
  );

  const selectedMother = useMemo(
    () => mothers.find((m) => m.id === form.motherPlantId),
    [mothers, form.motherPlantId],
  );

  const capacityWarning =
    form.cantidad > freeSlots
      ? `El clonador ${clonadorName} tiene solo ${freeSlots} posición${freeSlots !== 1 ? "es" : ""} libre${freeSlots !== 1 ? "s" : ""}.`
      : null;

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
    setForm(EMPTY_FORM);
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
    if (!form.geneticsId) return "Seleccioná una genética.";
    if (!form.startDate) return "Ingresá una fecha de ingreso.";
    if (!form.internalCodePrefix.trim()) return "El prefijo de código no puede estar vacío.";
    if (form.cantidad < 1 || form.cantidad > 60)
      return "La cantidad debe estar entre 1 y 60.";
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
      const created = await bulkCreatePlantsForClonador({
        clonadorId,
        count: form.cantidad,
        geneticsId: form.geneticsId || undefined,
        motherPlantId: form.motherPlantId || undefined,
        batchId: form.batchId || undefined,
        origin: form.origin,
        stage: form.stage,
        status: form.status,
        startDate: form.startDate,
        notes: form.notes || undefined,
        internalCodePrefix: form.internalCodePrefix,
      });
      toast.success(
        `${created.length} esqueje${created.length !== 1 ? "s" : ""} creado${created.length !== 1 ? "s" : ""} correctamente.`,
      );
      onSuccess(created);
      resetAndClose();
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "No se pudieron crear los esquejes.",
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
            <FlaskConical className="h-5 w-5" />
            Ingreso múltiple de esquejes
          </DialogTitle>
          <DialogDescription>
            Creá varios esquejes con la misma genética en{" "}
            <span className="font-medium">{clonadorName}</span>.
          </DialogDescription>
        </DialogHeader>

        {step === "form" ? (
          <FormStep
            form={form}
            setForm={setForm}
            genetics={genetics}
            mothers={mothers}
            capacityWarning={capacityWarning}
            onMotherChange={handleMotherChange}
          />
        ) : (
          <PreviewStep
            form={form}
            previewRows={previewRows}
            clonadorName={clonadorName}
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
                  ? "Creando esquejes…"
                  : `Crear ${form.cantidad} esqueje${form.cantidad !== 1 ? "s" : ""}`}
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
  genetics,
  mothers,
  capacityWarning,
  onMotherChange,
}: {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  genetics: Genetics[];
  mothers: MotherPlant[];
  capacityWarning: string | null;
  onMotherChange: (id: string) => void;
}) {
  return (
    <div className="grid gap-4 py-1">
      {/* Cantidad */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Cantidad de esquejes *</Label>
          <Input
            type="number"
            min={1}
            max={60}
            value={form.cantidad}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                cantidad: Math.max(1, Math.min(60, parseInt(e.target.value) || 1)),
              }))
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

      {/* Alerta capacidad */}
      {capacityWarning && (
        <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {capacityWarning}
        </div>
      )}

      {/* Madre + Genética */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Madre (opcional)</Label>
          <Select
            value={form.motherPlantId || "_none"}
            onValueChange={(v) => onMotherChange(v === "_none" ? "" : v)}
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
              <span className="ml-1.5 text-xs text-muted-foreground">(de la madre)</span>
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

      {/* Origen + Etapa */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Origen</Label>
          <Select
            value={form.origin}
            onValueChange={(v) => setForm((f) => ({ ...f, origin: v as PlantOrigin }))}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {(Object.keys(ORIGEN_LABEL) as PlantOrigin[]).map((o) => (
                <SelectItem key={o} value={o}>{ORIGEN_LABEL[o]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Etapa</Label>
          <Select
            value={form.stage}
            onValueChange={(v) => setForm((f) => ({ ...f, stage: v as PlantStage }))}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {(Object.keys(ETAPA_LABEL) as PlantStage[]).map((s) => (
                <SelectItem key={s} value={s}>{ETAPA_LABEL[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Estado + Fecha */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Estado</Label>
          <Select
            value={form.status}
            onValueChange={(v) => setForm((f) => ({ ...f, status: v as PlantStatus }))}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {(Object.keys(ESTADO_LABEL) as PlantStatus[]).map((s) => (
                <SelectItem key={s} value={s}>{ESTADO_LABEL[s]}</SelectItem>
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

      {/* Lote + Observaciones */}
      <div className="space-y-1">
        <Label>ID de lote (opcional)</Label>
        <Input
          placeholder="ej: 3"
          value={form.batchId}
          onChange={(e) => setForm((f) => ({ ...f, batchId: e.target.value }))}
        />
      </div>
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
  clonadorName,
  selectedGenetics,
  selectedMother,
}: {
  form: FormState;
  previewRows: { key: number; estimatedCode: string }[];
  clonadorName: string;
  selectedGenetics?: Genetics;
  selectedMother?: MotherPlant;
}) {
  return (
    <div className="space-y-4 py-1">
      <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm">
        <p className="font-medium">
          Se crearán{" "}
          <span className="text-primary">
            {form.cantidad} esqueje{form.cantidad !== 1 ? "s" : ""}
          </span>{" "}
          en <span className="font-semibold">{clonadorName}</span>
        </p>
        <div className="mt-1.5 grid grid-cols-2 gap-x-6 gap-y-0.5 text-muted-foreground">
          <span>Genética: <strong className="text-foreground">{selectedGenetics?.name ?? "—"}</strong></span>
          <span>Madre: <strong className="text-foreground">{selectedMother?.code ?? "Sin madre"}</strong></span>
          <span>Origen: <strong className="text-foreground">{ORIGEN_LABEL[form.origin]}</strong></span>
          <span>Etapa: <strong className="text-foreground">{ETAPA_LABEL[form.stage]}</strong></span>
        </div>
      </div>

      <div className="rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código estimado</TableHead>
              <TableHead>Genética</TableHead>
              <TableHead>Madre</TableHead>
              <TableHead>Clonador</TableHead>
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
                <TableCell className="text-sm">{clonadorName}</TableCell>
              </TableRow>
            ))}
            {form.cantidad > 10 && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="py-2 text-center text-xs text-muted-foreground"
                >
                  … y {form.cantidad - 10} esqueje{form.cantidad - 10 !== 1 ? "s" : ""} más
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

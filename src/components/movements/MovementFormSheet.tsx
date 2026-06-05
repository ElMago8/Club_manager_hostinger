import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { MovementType } from "@/types/inventory";
import type { Item, Location, StockMovement } from "@/types/inventory";
import { useCreateMovement } from "@/hooks/useInventoryMutations";

interface MovementFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: Item[];
  locations: Location[];
  /** Pre-selected item (locks the field) */
  preSelectedItemId?: string | null;
}

type DisplayType = "cosecha" | "entrada" | "dispensa" | "salida" | "ajuste" | "merma";

const TYPE_OPTIONS: { value: DisplayType; label: string }[] = [
  { value: "cosecha", label: "Cosecha" },
  { value: "entrada", label: "Entrada" },
  { value: "dispensa", label: "Dispensa" },
  { value: "salida", label: "Salida" },
  { value: "ajuste", label: "Ajuste" },
  { value: "merma", label: "Merma" },
];

const DISPLAY_TO_ENUM: Record<DisplayType, MovementType> = {
  cosecha: MovementType.Received,
  entrada: MovementType.Received,
  dispensa: MovementType.Shipped,
  salida: MovementType.Shipped,
  ajuste: MovementType.Adjusted,
  merma: MovementType.Adjusted,
};



function directionForType(type: MovementType): "in" | "out" | "configurable" {
  if (type === MovementType.Received) return "in";
  if (type === MovementType.Shipped) return "out";
  if (type === MovementType.Transferred) return "out";
  return "configurable";
}

export function MovementFormSheet({
  open,
  onOpenChange,
  items,
  locations,
  preSelectedItemId,
}: MovementFormSheetProps) {
  const { mutate, isLoading } = useCreateMovement();

  const [itemId, setItemId] = useState("");
  const [displayType, setDisplayType] = useState<DisplayType>("entrada");
  const type = DISPLAY_TO_ENUM[displayType];
  const [quantity, setQuantity] = useState("");
  const [direction, setDirection] = useState<"in" | "out">("in");
  const [reference, setReference] = useState("");
  const [member, setMember] = useState("");
  const [responsible, setResponsible] = useState("");
  const [observation, setObservation] = useState("");
  const [fromLocationId, setFromLocationId] = useState("");
  const [toLocationId, setToLocationId] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when opening
  useEffect(() => {
    if (open) {
      setItemId(preSelectedItemId ?? "");
      setDisplayType("entrada");
      setQuantity("");
      setDirection("in");
      setReference("");
      setMember("");
      setResponsible("");
      setObservation("");
      setFromLocationId("");
      setToLocationId("");
      setErrors({});
    }
  }, [open, preSelectedItemId]);

  // Auto-set direction when type changes
  useEffect(() => {
    if (displayType === "merma") setDirection("out");
    else if (type === MovementType.Received) setDirection("in");
    else if (type === MovementType.Shipped) setDirection("out");
  }, [displayType, type]);



  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!itemId) errs.itemId = "El producto es obligatorio";

    const num = Number(quantity);
    const qty = parseInt(quantity, 10);
    if (!quantity || isNaN(qty) || qty <= 0 || !Number.isInteger(num)) {
      errs.quantity = "La cantidad debe ser un entero positivo";
    }

    // Adjusted: motivo requerido
    if (type === MovementType.Adjusted && !reference.trim()) {
      errs.reference = "El motivo es obligatorio para ajustes";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    const qty = parseInt(quantity, 10);
    const selectedItem = items.find((i) => i.id === itemId);
    const signedQty = direction === "in" ? qty : -qty;
    const noteParts = [
      member ? `Socio: ${member}` : "",
      observation,
    ].filter(Boolean);

    const movement: StockMovement = {
      id: crypto.randomUUID(),
      itemId,
      type,
      quantity: signedQty,
      fromLocationId: null,
      toLocationId: null,
      reference: reference || TYPE_OPTIONS.find((o) => o.value === displayType)?.label || "",
      notes: noteParts.join(" · "),
      performedBy: responsible || "demo.user",
      createdAt: new Date().toISOString(),
    };



    mutate(movement, {
      onSuccess: () => {
        const label = selectedItem?.name ?? itemId;
        const sign = direction === "in" ? "+" : "−";
        const typeLabel = TYPE_OPTIONS.find((o) => o.value === displayType)?.label ?? displayType;
        toast.success(`Movimiento registrado: ${sign}${qty} ${label} (${typeLabel})`, {
          duration: 5000,
        });
        onOpenChange(false);
      },
      onError: (e) => toast.error(e.message || "No se pudo registrar el movimiento. Intentá de nuevo."),
    });
  };

  const isTransfer = type === MovementType.Transferred;
  const isAdjusted = type === MovementType.Adjusted;
  const isDispensa = displayType === "dispensa";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:max-w-[440px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Registrar movimiento</SheetTitle>
          <SheetDescription>Registrá un movimiento de stock del club.</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* Type */}
          <div>
            <Label className="mb-1.5 block text-sm">Tipo de movimiento</Label>
            <Select value={displayType} onValueChange={(v) => setDisplayType(v as DisplayType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isDispensa && (
            <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              La validación real de cupo y stock se implementará en backend.
            </div>
          )}
          {isAdjusted && (
            <div className="rounded-md border border-sky-300 bg-sky-50 px-3 py-2 text-xs text-sky-800">
              Este movimiento quedará registrado en auditoría cuando exista backend real.
            </div>
          )}

          {/* Item */}
          <div>
            <Label className="mb-1.5 block text-sm">Producto *</Label>
            <Select
              value={itemId || "__none__"}
              onValueChange={(v) => setItemId(v === "__none__" ? "" : v)}
              disabled={!!preSelectedItemId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar producto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__" disabled>Seleccionar producto</SelectItem>
                {items.map((i) => (
                  <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.itemId && <p className="mt-1 text-xs text-destructive">{errors.itemId}</p>}
          </div>

          {/* Quantity */}
          <div>
            <Label className="mb-1.5 block text-sm">Cantidad *</Label>
            <Input
              type="number"
              min={1}
              step={1}
              placeholder="Ingresá la cantidad"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
            {errors.quantity && <p className="mt-1 text-xs text-destructive">{errors.quantity}</p>}
          </div>

          {/* Member (optional) */}
          <div>
            <Label className="mb-1.5 block text-sm">Socio asociado (opcional)</Label>
            <Input
              placeholder="Credencial o nombre del socio"
              value={member}
              onChange={(e) => setMember(e.target.value)}
            />
          </div>

          {/* Responsible */}
          <div>
            <Label className="mb-1.5 block text-sm">Responsable</Label>
            <Input
              placeholder="Usuario interno responsable"
              value={responsible}
              onChange={(e) => setResponsible(e.target.value)}
            />
          </div>

          {/* Reason / reference */}
          <div>
            <Label className="mb-1.5 block text-sm">Motivo{isAdjusted ? " *" : ""}</Label>
            <Input
              placeholder={isAdjusted ? "Motivo del ajuste (requerido)" : "Motivo del movimiento"}
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
            {errors.reference && <p className="mt-1 text-xs text-destructive">{errors.reference}</p>}
          </div>

          {/* Observation */}
          <div>
            <Label className="mb-1.5 block text-sm">Observaciones</Label>
            <Textarea
              placeholder="Notas internas (opcional)"
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button onClick={handleSave} disabled={isLoading} className="flex-1">
              {isLoading ? "Guardando…" : "Guardar movimiento"}
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}


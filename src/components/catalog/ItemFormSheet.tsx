import { useEffect } from "react";
import { HelpTooltip } from "@/components/shared/HelpTooltip";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Item, Category, Supplier, Location } from "@/types/inventory";
import { ItemStatus } from "@/types/inventory";

const schema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  sku: z.string().min(1, "El lote es obligatorio"),
  description: z.string(),
  categoryId: z.string(),
  supplierId: z.string(),
  unit: z.string().min(1, "La unidad es obligatoria"),
  currentStock: z.coerce.number().min(0),
  reorderPoint: z.coerce.number().min(0),
  status: z.nativeEnum(ItemStatus),
});

type FormValues = z.infer<typeof schema>;

interface ItemFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: Item | null;
  categories: Category[];
  suppliers: Supplier[];
  locations: Location[];
  existingSkus: string[];
  onSave: (data: Partial<Item>) => void;
  loading?: boolean;
}

export function ItemFormSheet({
  open,
  onOpenChange,
  item,
  categories,
  suppliers,
  locations: _locations,
  existingSkus,
  onSave,
  loading,
}: ItemFormSheetProps) {
  void _locations;
  const isEdit = !!item;

  const { register, handleSubmit, reset, setValue, watch, formState: { errors }, setError } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      sku: "",
      description: "",
      categoryId: "",
      supplierId: "",
      unit: "unidades",
      currentStock: 0,
      reorderPoint: 0,
      status: ItemStatus.Active,
    },
  });

  useEffect(() => {
    if (open && item) {
      reset({
        name: item.name,
        sku: item.sku,
        description: item.description,
        categoryId: item.categoryId ?? "",
        supplierId: item.supplierId ?? "",
        unit: item.unit,
        currentStock: item.currentStock,
        reorderPoint: item.reorderPoint,
        status: item.status,
      });
    } else if (open) {
      reset();
    }
  }, [open, item, reset]);

  const onSubmit = (data: FormValues) => {
    const skuConflict = existingSkus.filter((s) => s === data.sku);
    const allowed = isEdit && item?.sku === data.sku ? 1 : 0;
    if (skuConflict.length > allowed) {
      setError("sku", { message: "Este lote ya existe" });
      return;
    }
    onSave({
      ...data,
      categoryId: data.categoryId || null,
      supplierId: data.supplierId || null,
    });
  };

  const inputCls = "h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary";
  const labelCls = "text-sm font-medium";
  const errCls = "text-xs text-destructive";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[480px] overflow-y-auto">
        <SheetTitle>{isEdit ? "Editar producto" : "Nuevo producto"}</SheetTitle>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6">
          {/* Información básica */}
          <fieldset className="space-y-3">
            <legend className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Información básica</legend>
            <div>
              <label className={labelCls}>Nombre *</label>
              <input {...register("name")} className={inputCls} />
              {errors.name && <p className={errCls}>{errors.name.message}</p>}
            </div>
            <div>
              <label className={`${labelCls} flex items-center gap-1`}>Lote * <HelpTooltip text="Código interno único que identifica el lote o partida del producto." /></label>
              <input {...register("sku")} className={inputCls} placeholder="LOT-XX-AAAA-NNN" />
              {errors.sku && <p className={errCls}>{errors.sku.message}</p>}
            </div>
            <div>
              <label className={labelCls}>Categoría</label>
              <Select value={watch("categoryId") ?? ""} onValueChange={(v) => setValue("categoryId", v || "")}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Seleccionar categoría" /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className={labelCls}>Unidad</label>
              <input {...register("unit")} className={inputCls} placeholder="gramos, unidades, ml…" />
            </div>
          </fieldset>

          {/* Stock */}
          <fieldset className="space-y-3">
            <legend className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Stock</legend>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Stock actual</label>
                <input type="number" {...register("currentStock")} className={inputCls} />
              </div>
              <div>
                <label className={`${labelCls} flex items-center gap-1`}>Stock mínimo <HelpTooltip text="Cantidad mínima antes de disparar una alerta de bajo stock." /></label>
                <input type="number" {...register("reorderPoint")} className={inputCls} />
              </div>
            </div>
          </fieldset>

          {/* Fuente interna */}
          <fieldset className="space-y-3">
            <legend className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Fuente interna</legend>
            <Select value={watch("supplierId") ?? ""} onValueChange={(v) => setValue("supplierId", v || "")}>
              <SelectTrigger className="h-9"><SelectValue placeholder="Seleccionar fuente interna" /></SelectTrigger>
              <SelectContent>
                {suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </fieldset>

          {/* Estado */}
          <fieldset className="space-y-3">
            <legend className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Estado</legend>
            <Select value={watch("status")} onValueChange={(v) => setValue("status", v as ItemStatus)}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ItemStatus.Active}>Activo</SelectItem>
                <SelectItem value={ItemStatus.Discontinued}>Inactivo</SelectItem>
                <SelectItem value={ItemStatus.Archived}>Archivado</SelectItem>
              </SelectContent>
            </Select>
          </fieldset>

          {/* Notas */}
          <fieldset className="space-y-3">
            <legend className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Notas</legend>
            <textarea {...register("description")} rows={3} className={`${inputCls} h-auto py-2`} placeholder="Observaciones internas del producto o lote" />
          </fieldset>

          {/* Acciones */}
          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Guardando…" : "Guardar"}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancelar
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

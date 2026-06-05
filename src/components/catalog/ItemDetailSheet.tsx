import { format } from "date-fns";
import { X, Pencil, Archive, Package } from "lucide-react";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/StatusBadge";
import { PermissionGate } from "@/hooks/usePermissions";
import { MovementTimeline } from "@/components/catalog/MovementTimeline";
// BarcodeDisplay intentionally removed from view; module kept for compatibility
import { CustomFieldsTab } from "@/components/catalog/CustomFieldsTab";
import { useMovements } from "@/hooks/useInventoryData";
import { useUpdateItem } from "@/hooks/useInventoryMutations";
import type { Item, Category, Supplier, Location } from "@/types/inventory";

type StockStatus = "in-stock" | "low-stock" | "out-of-stock";

function stockStatus(item: Item): StockStatus {
  if (item.currentStock === 0) return "out-of-stock";
  if (item.currentStock <= item.reorderPoint) return "low-stock";
  return "in-stock";
}

function stockColor(item: Item) {
  const s = stockStatus(item);
  if (s === "out-of-stock") return "text-stock-out";
  if (s === "low-stock") return "text-stock-low";
  return "text-stock-healthy";
}

interface ItemDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: Item | null | undefined;
  categories: Category[];
  suppliers: Supplier[];
  locations: Location[];
  onEdit?: (item: Item) => void;
  onArchive?: (item: Item) => void;
}

interface DetailRowProps {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}

function DetailRow({ label, value, mono }: DetailRowProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={mono ? "font-mono text-sm" : "text-sm"}>{value || "—"}</span>
    </div>
  );
}

export function ItemDetailSheet({
  open,
  onOpenChange,
  item,
  categories,
  suppliers,
  locations,
  onEdit,
  onArchive,
}: ItemDetailSheetProps) {
  const { data: allMovements } = useMovements();
  const updateItem = useUpdateItem();

  if (!item) return null;

  const category = categories.find((c) => c.id === item.categoryId);
  const supplier = suppliers.find((s) => s.id === item.supplierId);
  const location = locations.find((l) => l.id === item.locationId);
  const status = stockStatus(item);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[560px] overflow-y-auto p-0">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-border bg-card px-6 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-lg font-semibold text-foreground">{item.name}</h2>
              <div className="mt-1 flex items-center gap-2">
                <StatusBadge status={status} />
                <StatusBadge status={item.status} />
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <PermissionGate permission="edit_item">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit?.(item)} aria-label="Edit">
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onArchive?.(item)} aria-label="Archive">
                  <Archive className="h-4 w-4" />
                </Button>
              </PermissionGate>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onOpenChange(false)} aria-label="Close">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="px-6 pt-4 pb-8">
          <TabsList className="w-full">
            <TabsTrigger value="overview" className="flex-1">Resumen</TabsTrigger>
            <TabsTrigger value="history" className="flex-1">Historial</TabsTrigger>
            <TabsTrigger value="custom" className="flex-1">Campos personalizados</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6 space-y-6">
            {/* Image placeholder */}
            <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-border bg-muted/30">
              <Package className="h-10 w-10 text-muted-foreground/40" />
            </div>

            {/* Stock hero */}
            <div className="rounded-lg border border-border bg-card p-4 text-center">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Stock actual</p>
              <p className={`mt-1 font-mono text-3xl font-bold ${stockColor(item)}`}>
                {item.currentStock}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">{item.unit}</p>
            </div>

            {/* Detail grid */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <DetailRow label="Lote" value={item.sku} mono />
              <DetailRow label="Categoría" value={category?.name} />
              <DetailRow label="Unidad" value={item.unit} />
              <DetailRow label="Stock mínimo" value={item.reorderPoint} />
              <DetailRow label="Fuente interna" value={supplier?.name} />
              <DetailRow label="Sala / ubicación" value={location?.name} />
              <DetailRow label="Notas" value={item.description} />
              <DetailRow label="Creado" value={format(new Date(item.createdAt), "dd/MM/yyyy")} />
              <DetailRow label="Actualizado" value={format(new Date(item.updatedAt), "dd/MM/yyyy")} />
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <MovementTimeline movements={allMovements} itemId={item.id} />
          </TabsContent>

          <TabsContent value="custom" className="mt-6">
            <CustomFieldsTab
              customFields={item.customFields}
              onUpdate={(fields) => updateItem.mutate({ id: item.id, updates: { customFields: fields } })}
            />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

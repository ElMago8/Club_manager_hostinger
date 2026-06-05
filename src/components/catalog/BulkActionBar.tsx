import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Category, Supplier, Location } from "@/types/inventory";
import { ItemStatus } from "@/types/inventory";

interface BulkActionBarProps {
  selectedCount: number;
  categories: Category[];
  suppliers: Supplier[];
  locations: Location[];
  onUpdateCategory: (categoryId: string) => void;
  onUpdateSupplier: (supplierId: string) => void;
  onUpdateLocation: (locationId: string) => void;
  onUpdateStatus: (status: ItemStatus) => void;
  onDeselectAll: () => void;
  onPrintLabels?: () => void;
}

const STATUS_OPTIONS = [
  { value: ItemStatus.Active, label: "Activo" },
  { value: ItemStatus.Discontinued, label: "Inactivo" },
  { value: ItemStatus.Archived, label: "Archivado" },
];

export function BulkActionBar({
  selectedCount,
  categories,
  suppliers,
  locations: _locations,
  onUpdateCategory,
  onUpdateSupplier,
  onUpdateLocation: _onUpdateLocation,
  onUpdateStatus,
  onDeselectAll,
  onPrintLabels: _onPrintLabels,
}: BulkActionBarProps) {
  void _locations;
  void _onUpdateLocation;
  void _onPrintLabels;
  if (selectedCount === 0) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-between gap-3 border-t border-border bg-card px-4 py-3 shadow-lg animate-in slide-in-from-bottom duration-300 sm:px-6"
      role="toolbar"
      aria-label="Acciones masivas"
    >
      <span className="shrink-0 text-sm font-medium text-foreground">
        {selectedCount} producto{selectedCount !== 1 ? "s" : ""} seleccionado{selectedCount !== 1 ? "s" : ""}
      </span>

      <div className="flex flex-wrap items-center gap-2">
        <Select onValueChange={onUpdateCategory}>
          <SelectTrigger className="h-8 w-[140px] text-xs">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select onValueChange={onUpdateSupplier}>
          <SelectTrigger className="h-8 w-[160px] text-xs">
            <SelectValue placeholder="Fuente interna" />
          </SelectTrigger>
          <SelectContent>
            {suppliers.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select onValueChange={(v) => onUpdateStatus(v as ItemStatus)}>
          <SelectTrigger className="h-8 w-[130px] text-xs">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="ghost" size="sm" onClick={onDeselectAll} className="h-8 gap-1 text-xs">
          <X className="h-3 w-3" />
          Deseleccionar
        </Button>
      </div>
    </div>
  );
}

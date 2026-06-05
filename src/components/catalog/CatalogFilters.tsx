import { useState } from "react";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import type { Category, Supplier, Location } from "@/types/inventory";
import type { ItemFilters } from "@/lib/demo-store";

interface CatalogFiltersProps {
  filters: ItemFilters;
  onChange: (f: ItemFilters) => void;
  categories: Category[];
  suppliers: Supplier[];
  locations: Location[];
}

const STATUS_OPTIONS = [
  { value: "all", label: "Todos los estados" },
  { value: "in-stock", label: "En stock" },
  { value: "low-stock", label: "Bajo stock" },
  { value: "out-of-stock", label: "Sin stock" },
];

export function CatalogFilters({ filters, onChange, categories, suppliers, locations: _locations }: CatalogFiltersProps) {
  void _locations;
  const [mobileOpen, setMobileOpen] = useState(false);

  const activeCount = [filters.categoryId, filters.supplierId, filters.status, filters.search].filter(Boolean).length;

  const update = (patch: Partial<ItemFilters>) => onChange({ ...filters, ...patch });
  const clear = () => onChange({});

  const filterControls = (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
      <input
        type="text"
        placeholder="Buscar producto o lote…"
        value={filters.search ?? ""}
        onChange={(e) => update({ search: e.target.value || undefined })}
        className="h-9 w-full rounded-md border border-input bg-card px-3 text-sm outline-none transition-colors focus:border-primary sm:w-56"
      />

      <Select value={filters.categoryId ?? "all"} onValueChange={(v) => update({ categoryId: v === "all" ? undefined : v })}>
        <SelectTrigger className="h-9 w-full sm:w-40"><SelectValue placeholder="Categoría" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas las categorías</SelectItem>
          {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
        </SelectContent>
      </Select>

      <Select value={filters.status ?? "all"} onValueChange={(v) => update({ status: v === "all" ? undefined : v })}>
        <SelectTrigger className="h-9 w-full sm:w-40"><SelectValue placeholder="Estado" /></SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
        </SelectContent>
      </Select>

      <Select value={filters.supplierId ?? "all"} onValueChange={(v) => update({ supplierId: v === "all" ? undefined : v })}>
        <SelectTrigger className="h-9 w-full sm:w-44"><SelectValue placeholder="Fuente interna" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas las fuentes</SelectItem>
          {suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
        </SelectContent>
      </Select>

      {activeCount > 0 && (
        <Button variant="ghost" size="sm" onClick={clear} className="gap-1 text-muted-foreground">
          <X className="h-3 w-3" />Limpiar filtros
        </Button>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <div className="hidden sm:block">{filterControls}</div>

      {/* Mobile */}
      <div className="sm:hidden">
        <Button variant="outline" size="sm" onClick={() => setMobileOpen(true)} className="gap-2">
          <Filter className="h-4 w-4" />
          Filtros
          {activeCount > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">{activeCount}</span>
          )}
        </Button>
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="bottom" className="max-h-[80vh]">
            <SheetTitle>Filtros</SheetTitle>
            <div className="mt-4">{filterControls}</div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}

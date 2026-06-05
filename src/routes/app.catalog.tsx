import { useState, useMemo, useCallback, useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Plus, Upload } from "lucide-react";
import { toast } from "sonner";
import { Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CSVExportButton, type CSVColumn } from "@/components/data/CSVExportButton";
import { CSVImportSheet, type ImportField } from "@/components/data/CSVImportSheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CatalogTable, type SortState } from "@/components/catalog/CatalogTable";
import { CatalogFilters } from "@/components/catalog/CatalogFilters";
import { ItemFormSheet } from "@/components/catalog/ItemFormSheet";
import { BulkActionBar } from "@/components/catalog/BulkActionBar";
import { ItemDetailSheet } from "@/components/catalog/ItemDetailSheet";
import { RowActionsMenu } from "@/components/catalog/RowActionsMenu";
import { MovementFormSheet } from "@/components/movements/MovementFormSheet";
// printBarcodeLabels removed from view (no commercial barcode feature)
import { useItems, useCategories, useSuppliers, useLocations, useMovements } from "@/hooks/useInventoryData";
import { format } from "date-fns";
import { useCreateItem, useUpdateItem, useDeleteItem } from "@/hooks/useInventoryMutations";
import { PermissionGate, usePermissions } from "@/hooks/usePermissions";
import { useRole } from "@/hooks/useRole";
import type { Item } from "@/types/inventory";
import { ItemStatus } from "@/types/inventory";
import type { ItemFilters } from "@/lib/demo-store";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";

interface CatalogSearch {
  item?: string;
  newItem?: string;
}

export const Route = createFileRoute("/app/catalog")({
  component: CatalogPage,
  head: () => ({ meta: [{ title: "Productos · Stock · Cannabis Club Manager" }] }),
  validateSearch: (search: Record<string, unknown>): CatalogSearch => ({
    item: typeof search.item === "string" ? search.item : undefined,
    newItem: typeof search.newItem === "string" ? search.newItem : undefined,
  }),
});

function CatalogPage() {
  const { item: itemId, newItem } = Route.useSearch();
  const navigate = useNavigate();

  // Auto-open create form when navigated with newItem param
  useEffect(() => {
    if (newItem) {
      setSheetOpen(true);
      navigate({ to: "/app/catalog", search: {}, replace: true });
    }
  }, [newItem, navigate]);

  const [filters, setFilters] = useState<ItemFilters>({});
  const [sort, setSort] = useState<SortState>({ key: "name", dir: "asc" });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editItem, setEditItem] = useState<Item | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Item | null>(null);
  const [movementItemId, setMovementItemId] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const importFields = useMemo<ImportField[]>(() => [
    { key: "name", label: "Nombre", required: true },
    { key: "sku", label: "Lote", required: true },
    { key: "description", label: "Notas" },
    { key: "category", label: "Categoría" },
    { key: "supplier", label: "Fuente interna" },
    { key: "quantity", label: "Stock actual", numeric: true },
    { key: "reorderPoint", label: "Stock mínimo", numeric: true },
    { key: "unit", label: "Unidad" },
  ], []);

  // Strip stock-level status before passing to store
  const storeFilters = useMemo(() => {
    const { status, ...rest } = filters;
    return rest;
  }, [filters]);

  const { data: allItems } = useItems(storeFilters);
  const { data: categories } = useCategories();
  const { data: suppliers } = useSuppliers();
  const { data: locations } = useLocations();
  const createItem = useCreateItem();
  const updateItem = useUpdateItem();
  const deleteItem = useDeleteItem();
  const { can } = usePermissions();
  const { isAdmin } = useRole();

  // Derive detail item from URL search param
  const detailItem = useMemo(() => {
    if (!itemId) return null;
    return allItems.find((i) => i.id === itemId) ?? null;
  }, [itemId, allItems]);

  const openDetail = useCallback((item: Item) => {
    navigate({ to: "/app/catalog", search: { item: item.id } });
  }, [navigate]);

  const closeDetail = useCallback(() => {
    navigate({ to: "/app/catalog", search: {} });
  }, [navigate]);
  const items = useMemo(() => {
    let result = allItems.filter((i) => i.status !== ItemStatus.Archived);
    if (filters.status === "in-stock") result = result.filter((i) => i.currentStock > i.reorderPoint);
    else if (filters.status === "low-stock") result = result.filter((i) => i.currentStock > 0 && i.currentStock <= i.reorderPoint);
    else if (filters.status === "out-of-stock") result = result.filter((i) => i.currentStock === 0);
    return result;
  }, [allItems, filters.status]);

  const existingSkus = useMemo(() => allItems.map((i) => i.sku), [allItems]);

  const csvColumns = useMemo<CSVColumn<Item>[]>(() => [
    { header: "Nombre", accessor: (i) => i.name },
    { header: "Lote", accessor: (i) => i.sku },
    { header: "Categoría", accessor: (i) => categories.find((c) => c.id === i.categoryId)?.name ?? "" },
    { header: "Fuente interna", accessor: (i) => suppliers.find((s) => s.id === i.supplierId)?.name ?? "" },
    { header: "Stock actual", accessor: (i) => i.currentStock },
    { header: "Stock mínimo", accessor: (i) => i.reorderPoint },
    { header: "Unidad", accessor: (i) => i.unit },
    { header: "Estado", accessor: (i) => i.status },
  ], [categories, suppliers]);

  const handleSave = useCallback((data: Partial<Item>) => {
    if (editItem) {
      updateItem.mutate({ id: editItem.id, updates: data }, {
        onSuccess: () => { toast.success("Producto actualizado"); setSheetOpen(false); setEditItem(null); },
        onError: (e) => toast.error(e.message || "No se pudo actualizar el producto."),
      });
    } else {
      const newItem: Item = {
        id: `item-${Date.now()}`,
        sku: data.sku ?? "",
        barcode: null,
        name: data.name ?? "",
        description: data.description ?? "",
        categoryId: data.categoryId ?? null,
        status: data.status ?? ItemStatus.Active,
        unit: data.unit ?? "unidades",
        currentStock: data.currentStock ?? 0,
        reorderPoint: data.reorderPoint ?? 0,
        reorderQuantity: 0,
        costPrice: 0,
        sellingPrice: 0,
        locationId: data.locationId ?? null,
        supplierId: data.supplierId ?? null,
        imageUrl: null,
        customFields: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      createItem.mutate(newItem, {
        onSuccess: () => {
          toast.success("Producto creado", {
            action: { label: "Deshacer", onClick: () => { deleteItem.mutate(newItem.id, { onSuccess: () => toast.success("Creación deshecha") }); } },
            duration: 5000,
          });
          setSheetOpen(false);
        },
        onError: (e) => toast.error(e.message || "No se pudo crear el producto."),
      });
    }
  }, [editItem, createItem, updateItem, deleteItem]);

  const handleDelete = useCallback(() => {
    if (!deleteTarget) return;
    if (isAdmin) {
      deleteItem.mutate(deleteTarget.id, {
        onSuccess: () => { toast.success(`${deleteTarget.name} eliminado`); setDeleteTarget(null); },
        onError: (e) => toast.error(e.message || "No se pudo eliminar."),
      });
    } else {
      updateItem.mutate({ id: deleteTarget.id, updates: { status: ItemStatus.Archived } }, {
        onSuccess: () => { toast.success(`${deleteTarget.name} archivado`); setDeleteTarget(null); },
        onError: (e) => toast.error(e.message || "No se pudo archivar."),
      });
    }
  }, [deleteTarget, isAdmin, deleteItem, updateItem]);

  const openEdit = (item: Item) => { setEditItem(item); setSheetOpen(true); };
  const openCreate = () => { setEditItem(null); setSheetOpen(true); };

  const handleBulkUpdate = useCallback((updates: Partial<Item>) => {
    const ids = Array.from(selected);
    const count = ids.length;
    ids.forEach((id) => {
      updateItem.mutate({ id, updates });
    });
    toast.success(`${count} producto${count !== 1 ? "s" : ""} actualizado${count !== 1 ? "s" : ""}`);
    setSelected(new Set());
  }, [selected, updateItem]);

  const actionRenderer = (item: Item) => (
    <RowActionsMenu
      item={item}
      onViewDetails={(i) => openDetail(i)}
      onEdit={(i) => openEdit(i)}
      onLogMovement={(i) => setMovementItemId(i.id)}
      onDelete={(i) => setDeleteTarget(i)}
    />
  );

  // KPI calculations
  const activeItems = useMemo(() => allItems.filter((i) => i.status === ItemStatus.Active), [allItems]);
  const totalStock = useMemo(() => activeItems.reduce((sum, i) => sum + i.currentStock, 0), [activeItems]);
  const lowStockCount = useMemo(() => activeItems.filter((i) => i.currentStock > 0 && i.currentStock <= i.reorderPoint).length, [activeItems]);
  const { data: allMovements } = useMovements();
  const lastEntry = useMemo(() => {
    const entries = allMovements.filter((m) => m.type === "received").sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return entries[0];
  }, [allMovements]);
  const lastExit = useMemo(() => {
    const exits = allMovements.filter((m) => m.type === "shipped" || m.type === "adjusted").sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return exits[0];
  }, [allMovements]);

  const fmtDate = (iso?: string) => iso ? format(new Date(iso), "dd/MM/yyyy") : "—";

  const kpis = [
    { label: "Productos activos", value: activeItems.length.toString(), hint: `${allItems.length} en total` },
    { label: "Stock total", value: totalStock.toString(), hint: "Unidades" },
    { label: "Productos con stock bajo", value: lowStockCount.toString(), hint: lowStockCount === 0 ? "Sin alertas" : "Requieren atención" },
    { label: "Último ingreso", value: fmtDate(lastEntry?.createdAt), hint: lastEntry ? "Cosecha · ajuste" : "Sin registros" },
    { label: "Última dispensa", value: fmtDate(lastExit?.createdAt), hint: lastExit ? "Salida registrada" : "Sin registros" },
  ];

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Productos · Stock</h1>
          <p className="text-sm text-muted-foreground">Control visual de productos, lotes, unidades y stock mínimo.</p>
        </div>
        <div className="flex items-center gap-2">
          <CSVExportButton
            data={items}
            columns={csvColumns}
            filename="productos-stock"
          />
          <PermissionGate permission="create_item">
            <Button variant="outline" size="sm" className="hidden gap-1.5 sm:inline-flex" onClick={() => setImportOpen(true)}>
              <Upload className="h-4 w-4" />Importar
            </Button>
          </PermissionGate>
          <PermissionGate permission="create_item">
            <Button onClick={openCreate} className="hidden gap-1.5 sm:inline-flex">
              <Plus className="h-4 w-4" />Nuevo producto
            </Button>
          </PermissionGate>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {kpis.map((k) => (
          <Card key={k.label} className="p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{k.label}</p>
            <p className="mt-1 font-mono text-2xl font-semibold text-foreground">{k.value}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{k.hint}</p>
          </Card>
        ))}
      </div>

      <Card className="p-4">
        <CatalogFilters filters={filters} onChange={setFilters} categories={categories} suppliers={suppliers} locations={locations} />
      </Card>

      <ErrorBoundary>
      {allItems.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Todavía no hay productos cargados"
          description="Comenzá a construir el catálogo cargando el primer producto o lote."
          actionLabel={can("create_item") ? "Cargar primer producto" : undefined}
          onAction={can("create_item") ? openCreate : undefined}
        />
      ) : (
        <CatalogTable
          items={items}
          categories={categories}
          suppliers={suppliers}
          locations={locations}
          sort={sort}
          onSortChange={setSort}
          selected={selected}
          onSelectedChange={setSelected}
          onRowClick={(item) => openDetail(item)}
          actionRenderer={actionRenderer}
          showCheckboxes={can("edit_item")}
        />
      )}
      </ErrorBoundary>

      <ItemFormSheet
        open={sheetOpen}
        onOpenChange={(v) => { setSheetOpen(v); if (!v) setEditItem(null); }}
        item={editItem}
        categories={categories}
        suppliers={suppliers}
        locations={locations}
        existingSkus={existingSkus}
        onSave={handleSave}
        loading={createItem.isLoading || updateItem.isLoading}
      />

      <ItemDetailSheet
        open={!!detailItem}
        onOpenChange={(v) => { if (!v) closeDetail(); }}
        item={detailItem}
        categories={categories}
        suppliers={suppliers}
        locations={locations}
        onEdit={(item) => { closeDetail(); openEdit(item); }}
        onArchive={(item) => { closeDetail(); setDeleteTarget(item); }}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isAdmin ? "Eliminar" : "Archivar"} {deleteTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              {isAdmin
                ? "Esta acción no se puede deshacer. El historial de movimientos se conserva, pero el producto será eliminado."
                : "El producto será archivado y dejará de aparecer en la vista por defecto."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>{isAdmin ? "Eliminar" : "Archivar"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <PermissionGate permission="create_item">
        <button
          type="button"
          onClick={openCreate}
          className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-amber-accent shadow-lg transition-transform hover:scale-105 sm:hidden"
          aria-label="Nuevo producto"
        >
          <Plus className="h-6 w-6" />
        </button>
      </PermissionGate>

      <PermissionGate permission="edit_item">
        <BulkActionBar
          selectedCount={selected.size}
          categories={categories}
          suppliers={suppliers}
          locations={locations}
          onUpdateCategory={(id) => handleBulkUpdate({ categoryId: id })}
          onUpdateSupplier={(id) => handleBulkUpdate({ supplierId: id })}
          onUpdateLocation={(id) => handleBulkUpdate({ locationId: id })}
          onUpdateStatus={(s) => handleBulkUpdate({ status: s })}
          onDeselectAll={() => setSelected(new Set())}
        />
      </PermissionGate>

      <MovementFormSheet
        open={!!movementItemId}
        onOpenChange={(v) => { if (!v) setMovementItemId(null); }}
        items={allItems}
        locations={locations}
        preSelectedItemId={movementItemId}
      />

      <CSVImportSheet
        open={importOpen}
        onOpenChange={setImportOpen}
        fields={importFields}
        entityName="productos"
        existingSkus={existingSkus}
        knownCategories={categories.map((c) => c.name)}
        knownSuppliers={suppliers.map((s) => s.name)}
        onImport={async (rows) => {
          let created = 0;
          let failed = 0;
          for (const row of rows) {
            try {
              const newItem: Item = {
                id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                sku: row.sku ?? "",
                barcode: null,
                name: row.name ?? "",
                description: row.description ?? "",
                categoryId: categories.find((c) => c.name.toLowerCase() === row.category?.toLowerCase())?.id ?? null,
                status: ItemStatus.Active,
                unit: row.unit || "unidades",
                currentStock: Number(row.quantity) || 0,
                reorderPoint: Number(row.reorderPoint) || 0,
                reorderQuantity: 0,
                costPrice: 0,
                sellingPrice: 0,
                locationId: null,
                supplierId: suppliers.find((s) => s.name.toLowerCase() === row.supplier?.toLowerCase())?.id ?? null,
                imageUrl: null,
                customFields: {},
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };
              createItem.mutate(newItem);
              created++;
            } catch {
              failed++;
            }
          }
          toast.success(`${created} producto${created !== 1 ? "s" : ""} importado${created !== 1 ? "s" : ""}${failed > 0 ? `, ${failed} con error` : ""}`);
          return { created, failed };
        }}
      />
    </div>
  );
}

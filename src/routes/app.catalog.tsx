import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  BarChart3,
  BoxIcon,
  Layers,
  MoreVertical,
  Package,
  PackageCheck,
  Pencil,
  Plus,
  Search,
  Trash2,
  Warehouse,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DateInput } from "@/components/ui/date-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  getCategorias,
  createProducto,
  updateProducto,
  deleteProducto,
  getProductos,
} from "@/services/productService";
import {
  createLoteProducto,
  descartarLote,
  getLotesProducto,
  getProductBatchSummary,
  updateLoteProducto,
} from "@/services/productBatchService";
import {
  createUbicacion,
  deleteUbicacion,
  getUbicaciones,
  updateUbicacion,
} from "@/services/stockLocationService";
import type {
  CategoriaProducto,
  CreateLoteProductoPayload,
  CreateProductoPayload,
  CreateUbicacionPayload,
  EstadoLote,
  LoteProducto,
  ProductBatchSummary,
  Producto,
  TipoProducto,
  TipoUbicacion,
  UbicacionStock,
  UnidadMedida,
} from "@/types/products";
import { format } from "date-fns";

export const Route = createFileRoute("/app/catalog")({
  component: CatalogPage,
  head: () => ({ meta: [{ title: "Productos · Stock · Cannabis Club Manager" }] }),
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TIPO_LABEL: Record<TipoProducto, string> = {
  flor: "Flor",
  aceite: "Aceite",
  extracto: "Extracto",
  comestible: "Comestible",
  insumo: "Insumo",
  otro: "Otro",
};

const TIPO_UBICACION_LABEL: Record<TipoUbicacion, string> = {
  deposito: "Depósito",
  freezer: "Freezer",
  heladera: "Heladera",
  sala_curado: "Sala de curado",
  armario: "Armario",
  otro: "Otro",
};

const ESTADO_LOTE_LABEL: Record<EstadoLote, string> = {
  disponible: "Disponible",
  reservado: "Reservado",
  agotado: "Agotado",
  bloqueado: "Bloqueado",
  descartado: "Descartado",
  en_analisis: "En análisis",
};

const ESTADO_LOTE_CLASS: Record<EstadoLote, string> = {
  disponible: "border-emerald-200 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  reservado:  "border-sky-200 bg-sky-500/10 text-sky-700 dark:text-sky-400",
  agotado:    "border-slate-200 bg-slate-500/10 text-slate-600 dark:text-slate-400",
  bloqueado:  "border-red-200 bg-red-500/10 text-red-700 dark:text-red-400",
  descartado: "border-slate-200 bg-slate-100/50 text-slate-400",
  en_analisis:"border-amber-200 bg-amber-500/10 text-amber-700 dark:text-amber-400",
};

function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  return format(new Date(iso), "dd/MM/yyyy");
}

function generateCodigo(prefix: string) {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}`;
}

// ─── KPI Cards ───────────────────────────────────────────────────────────────

interface KpiCardDef {
  label: string;
  value: string | number;
  hint: string;
  Icon: React.ComponentType<{ className?: string }>;
  accent: string;
  panel: string;
  iconClass: string;
}

function KpiCards({ summary }: { summary: ProductBatchSummary | null }) {
  const cards: KpiCardDef[] = [
    {
      label: "Productos activos",
      value: summary?.productosActivos ?? "—",
      hint: "Registrados en el sistema",
      Icon: Package,
      accent: "bg-sky-500",
      panel: "bg-sky-500/10",
      iconClass: "text-sky-600 dark:text-sky-400",
    },
    {
      label: "Stock disponible",
      value: summary ? `${summary.stockTotalDisponible.toFixed(0)} u` : "—",
      hint: "Suma de lotes disponibles",
      Icon: BarChart3,
      accent: "bg-emerald-500",
      panel: "bg-emerald-500/10",
      iconClass: "text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "Lotes disponibles",
      value: summary?.lotesDisponibles ?? "—",
      hint: `${summary?.totalLotes ?? 0} en total`,
      Icon: Layers,
      accent: "bg-teal-500",
      panel: "bg-teal-500/10",
      iconClass: "text-teal-600 dark:text-teal-400",
    },
    {
      label: "Bloqueados / análisis",
      value: summary?.lotesBloqueadosAnalisis ?? "—",
      hint: summary?.lotesBloqueadosAnalisis ? "Requieren atención" : "Sin alertas",
      Icon: AlertTriangle,
      accent: "bg-amber-500",
      panel: "bg-amber-500/10",
      iconClass: "text-amber-600 dark:text-amber-400",
    },
    {
      label: "Próximos a vencer",
      value: summary?.proximosVencimientos ?? "—",
      hint: "Vencen en los próximos 30 días",
      Icon: PackageCheck,
      accent: "bg-violet-500",
      panel: "bg-violet-500/10",
      iconClass: "text-violet-600 dark:text-violet-400",
    },
  ];

  return (
    <div className="rounded-xl border border-border bg-card p-3 shadow-xs">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {cards.map(({ label, value, hint, Icon, accent, panel, iconClass }) => (
          <div key={label} className={`relative overflow-hidden rounded-lg ${panel} px-5 py-4`}>
            <span className={`absolute left-0 top-3 h-[calc(100%-1.5rem)] w-1 rounded-r-full ${accent}`} />
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{label}</p>
                <p className="mt-2 font-mono text-3xl font-semibold leading-none text-foreground">{value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
              </div>
              <Icon className={`mt-1 h-5 w-5 shrink-0 ${iconClass}`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tab Productos ────────────────────────────────────────────────────────────

type ProductoForm = {
  codigoProducto: string;
  nombre: string;
  tipoProducto: TipoProducto;
  unidadMedida: UnidadMedida;
  categoriaProductoId: string;
  descripcion: string;
  requiereLote: boolean;
  requiereTrazabilidad: boolean;
  estado: "activo" | "inactivo";
};

const EMPTY_PRODUCTO_FORM: ProductoForm = {
  codigoProducto: "",
  nombre: "",
  tipoProducto: "flor",
  unidadMedida: "gramos",
  categoriaProductoId: "",
  descripcion: "",
  requiereLote: true,
  requiereTrazabilidad: true,
  estado: "activo",
};

function TabProductos({
  productos,
  categorias,
  onRefresh,
}: {
  productos: Producto[];
  categorias: CategoriaProducto[];
  onRefresh: () => void;
}) {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Producto | null>(null);
  const [form, setForm] = useState<ProductoForm>(EMPTY_PRODUCTO_FORM);
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return productos.filter(
      (p) =>
        p.nombre.toLowerCase().includes(q) ||
        p.codigoProducto.toLowerCase().includes(q) ||
        (p.categoria?.nombre.toLowerCase().includes(q) ?? false),
    );
  }, [productos, search]);

  function openCreate() {
    setEditTarget(null);
    setForm({ ...EMPTY_PRODUCTO_FORM, codigoProducto: generateCodigo("PROD") });
    setDialogOpen(true);
  }

  function openEdit(p: Producto) {
    setEditTarget(p);
    setForm({
      codigoProducto: p.codigoProducto,
      nombre: p.nombre,
      tipoProducto: p.tipoProducto,
      unidadMedida: p.unidadMedida,
      categoriaProductoId: p.categoriaProductoId ? String(p.categoriaProductoId) : "",
      descripcion: p.descripcion ?? "",
      requiereLote: p.requiereLote,
      requiereTrazabilidad: p.requiereTrazabilidad,
      estado: p.estado,
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.nombre.trim() || !form.codigoProducto.trim()) {
      toast.error("Nombre y código son obligatorios.");
      return;
    }
    setSaving(true);
    try {
      const payload: CreateProductoPayload = {
        codigoProducto: form.codigoProducto,
        nombre: form.nombre,
        tipoProducto: form.tipoProducto,
        unidadMedida: form.unidadMedida,
        categoriaProductoId: form.categoriaProductoId ? Number(form.categoriaProductoId) : null,
        descripcion: form.descripcion || null,
        requiereLote: form.requiereLote,
        requiereTrazabilidad: form.requiereTrazabilidad,
        estado: form.estado,
      };
      if (editTarget) {
        await updateProducto(editTarget.id, payload);
        toast.success("Producto actualizado");
      } else {
        await createProducto(payload);
        toast.success("Producto creado");
      }
      setDialogOpen(false);
      onRefresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar el producto.");
    } finally {
      setSaving(false);
    }
  }

  async function handleInactivate(p: Producto) {
    try {
      await deleteProducto(p.id);
      toast.success(`${p.nombre} ${p.estado === "activo" ? "inactivado" : "eliminado"}`);
      onRefresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo inactivar el producto.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar productos…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button onClick={openCreate} className="gap-1.5">
          <Plus className="h-4 w-4" />
          Nuevo producto
        </Button>
      </div>

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Unidad</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-24 text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                  No hay productos{search ? " que coincidan con la búsqueda" : " registrados"}.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">{p.codigoProducto}</TableCell>
                  <TableCell className="font-medium">{p.nombre}</TableCell>
                  <TableCell>{TIPO_LABEL[p.tipoProducto]}</TableCell>
                  <TableCell className="capitalize">{p.unidadMedida}</TableCell>
                  <TableCell>{p.categoria?.nombre ?? "—"}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        p.estado === "activo"
                          ? "border-emerald-200 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                          : "border-slate-200 bg-slate-100/50 text-slate-400"
                      }
                    >
                      {p.estado === "activo" ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(p)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleInactivate(p)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {p.estado === "activo" ? "Inactivar" : "Eliminar"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editTarget ? "Editar producto" : "Nuevo producto"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Código</Label>
                <Input
                  value={form.codigoProducto}
                  onChange={(e) => setForm((f) => ({ ...f, codigoProducto: e.target.value }))}
                  disabled={!!editTarget}
                />
              </div>
              <div className="space-y-1">
                <Label>Nombre *</Label>
                <Input
                  value={form.nombre}
                  onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Tipo</Label>
                <Select
                  value={form.tipoProducto}
                  onValueChange={(v) => setForm((f) => ({ ...f, tipoProducto: v as TipoProducto }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(TIPO_LABEL) as TipoProducto[]).map((t) => (
                      <SelectItem key={t} value={t}>{TIPO_LABEL[t]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Unidad de medida</Label>
                <Select
                  value={form.unidadMedida}
                  onValueChange={(v) => setForm((f) => ({ ...f, unidadMedida: v as UnidadMedida }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gramos">Gramos</SelectItem>
                    <SelectItem value="mililitros">Mililitros</SelectItem>
                    <SelectItem value="unidades">Unidades</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Categoría</Label>
                <Select
                  value={form.categoriaProductoId || "_none"}
                  onValueChange={(v) => setForm((f) => ({ ...f, categoriaProductoId: v === "_none" ? "" : v }))}
                >
                  <SelectTrigger><SelectValue placeholder="Sin categoría" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">Sin categoría</SelectItem>
                    {categorias.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Estado</Label>
                <Select
                  value={form.estado}
                  onValueChange={(v) => setForm((f) => ({ ...f, estado: v as "activo" | "inactivo" }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="activo">Activo</SelectItem>
                    <SelectItem value="inactivo">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Descripción</Label>
              <Textarea
                value={form.descripcion}
                onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
                rows={2}
              />
            </div>
            <div className="flex gap-4 text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.requiereLote}
                  onChange={(e) => setForm((f) => ({ ...f, requiereLote: e.target.checked }))}
                  className="rounded"
                />
                Requiere lote
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.requiereTrazabilidad}
                  onChange={(e) => setForm((f) => ({ ...f, requiereTrazabilidad: e.target.checked }))}
                  className="rounded"
                />
                Requiere trazabilidad
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Guardando…" : editTarget ? "Guardar cambios" : "Crear producto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Tab Lotes ────────────────────────────────────────────────────────────────

type LoteForm = {
  codigoLoteProducto: string;
  productoId: string;
  ubicacionStockId: string;
  cantidadInicial: string;
  cantidadDisponible: string;
  unidadMedida: UnidadMedida;
  estado: EstadoLote;
  fechaIngreso: string;
  fechaVencimiento: string;
  observaciones: string;
};

const EMPTY_LOTE_FORM: LoteForm = {
  codigoLoteProducto: "",
  productoId: "",
  ubicacionStockId: "",
  cantidadInicial: "0",
  cantidadDisponible: "0",
  unidadMedida: "gramos",
  estado: "disponible",
  fechaIngreso: new Date().toISOString().slice(0, 10),
  fechaVencimiento: "",
  observaciones: "",
};

function TabLotes({
  lotes,
  productos,
  ubicaciones,
  onRefresh,
}: {
  lotes: LoteProducto[];
  productos: Producto[];
  ubicaciones: UbicacionStock[];
  onRefresh: () => void;
}) {
  const [search, setSearch] = useState("");
  const [filterEstado, setFilterEstado] = useState<EstadoLote | "todos">("todos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<LoteProducto | null>(null);
  const [form, setForm] = useState<LoteForm>(EMPTY_LOTE_FORM);
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return lotes.filter((l) => {
      if (filterEstado !== "todos" && l.estado !== filterEstado) return false;
      return (
        l.codigoLoteProducto.toLowerCase().includes(q) ||
        (l.producto?.nombre.toLowerCase().includes(q) ?? false) ||
        (l.ubicacionStock?.nombre.toLowerCase().includes(q) ?? false)
      );
    });
  }, [lotes, search, filterEstado]);

  function openCreate() {
    setEditTarget(null);
    setForm({ ...EMPTY_LOTE_FORM, codigoLoteProducto: generateCodigo("PRODLOT") });
    setDialogOpen(true);
  }

  function openEdit(l: LoteProducto) {
    setEditTarget(l);
    setForm({
      codigoLoteProducto: l.codigoLoteProducto,
      productoId: String(l.productoId),
      ubicacionStockId: l.ubicacionStockId ? String(l.ubicacionStockId) : "",
      cantidadInicial: String(l.cantidadInicial),
      cantidadDisponible: String(l.cantidadDisponible),
      unidadMedida: l.unidadMedida,
      estado: l.estado,
      fechaIngreso: l.fechaIngreso.slice(0, 10),
      fechaVencimiento: l.fechaVencimiento?.slice(0, 10) ?? "",
      observaciones: l.observaciones ?? "",
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.productoId) { toast.error("Seleccioná un producto."); return; }
    const cantInicial = parseFloat(form.cantidadInicial);
    const cantDisponible = parseFloat(form.cantidadDisponible);
    if (isNaN(cantInicial) || isNaN(cantDisponible)) { toast.error("Las cantidades deben ser números."); return; }
    if (cantDisponible > cantInicial) { toast.error("La cantidad disponible no puede superar la inicial."); return; }

    setSaving(true);
    try {
      const payload: CreateLoteProductoPayload = {
        codigoLoteProducto: form.codigoLoteProducto,
        productoId: Number(form.productoId),
        ubicacionStockId: form.ubicacionStockId ? Number(form.ubicacionStockId) : null,
        cantidadInicial: cantInicial,
        cantidadDisponible: cantDisponible,
        unidadMedida: form.unidadMedida,
        estado: form.estado,
        fechaIngreso: form.fechaIngreso || undefined,
        fechaVencimiento: form.fechaVencimiento || null,
        observaciones: form.observaciones || null,
      };
      if (editTarget) {
        await updateLoteProducto(editTarget.id, payload);
        toast.success("Lote actualizado");
      } else {
        await createLoteProducto(payload);
        toast.success("Lote creado");
      }
      setDialogOpen(false);
      onRefresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar el lote.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDescartar(l: LoteProducto) {
    try {
      await descartarLote(l.id);
      toast.success(`Lote ${l.codigoLoteProducto} descartado`);
      onRefresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo descartar el lote.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <div className="relative max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar lotes…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 w-52"
            />
          </div>
          <Select
            value={filterEstado}
            onValueChange={(v) => setFilterEstado(v as EstadoLote | "todos")}
          >
            <SelectTrigger className="w-40"><SelectValue placeholder="Estado" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los estados</SelectItem>
              {(Object.keys(ESTADO_LOTE_LABEL) as EstadoLote[]).map((e) => (
                <SelectItem key={e} value={e}>{ESTADO_LOTE_LABEL[e]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={openCreate} className="gap-1.5">
          <Plus className="h-4 w-4" />
          Nuevo lote
        </Button>
      </div>

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código lote</TableHead>
              <TableHead>Producto</TableHead>
              <TableHead>Disponible</TableHead>
              <TableHead>Inicial</TableHead>
              <TableHead>Ubicación</TableHead>
              <TableHead>Vencimiento</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-24 text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                  No hay lotes{search || filterEstado !== "todos" ? " que coincidan" : " registrados"}.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((l) => (
                <TableRow key={l.id} className={l.estado === "descartado" ? "opacity-50" : undefined}>
                  <TableCell className="font-mono text-xs text-muted-foreground">{l.codigoLoteProducto}</TableCell>
                  <TableCell className="font-medium">{l.producto?.nombre ?? `Producto #${l.productoId}`}</TableCell>
                  <TableCell>
                    {l.cantidadDisponible} <span className="text-xs text-muted-foreground">{l.unidadMedida}</span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{l.cantidadInicial}</TableCell>
                  <TableCell>{l.ubicacionStock?.nombre ?? "—"}</TableCell>
                  <TableCell>{fmtDate(l.fechaVencimiento)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={ESTADO_LOTE_CLASS[l.estado]}>
                      {ESTADO_LOTE_LABEL[l.estado]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" disabled={l.estado === "descartado"}>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(l)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleDescartar(l)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Descartar lote
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editTarget ? "Editar lote" : "Nuevo lote de producto"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Código lote</Label>
                <Input
                  value={form.codigoLoteProducto}
                  onChange={(e) => setForm((f) => ({ ...f, codigoLoteProducto: e.target.value }))}
                  disabled={!!editTarget}
                />
              </div>
              <div className="space-y-1">
                <Label>Producto *</Label>
                <Select
                  value={form.productoId || "_none"}
                  onValueChange={(v) => {
                    if (v === "_none") return;
                    const p = productos.find((p) => String(p.id) === v);
                    setForm((f) => ({
                      ...f,
                      productoId: v,
                      unidadMedida: p?.unidadMedida ?? f.unidadMedida,
                    }));
                  }}
                  disabled={!!editTarget}
                >
                  <SelectTrigger><SelectValue placeholder="Seleccionar…" /></SelectTrigger>
                  <SelectContent>
                    {productos.filter((p) => p.estado === "activo").map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>{p.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label>Cant. inicial</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.001"
                  value={form.cantidadInicial}
                  onChange={(e) => setForm((f) => ({ ...f, cantidadInicial: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Cant. disponible</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.001"
                  value={form.cantidadDisponible}
                  onChange={(e) => setForm((f) => ({ ...f, cantidadDisponible: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Unidad</Label>
                <Select
                  value={form.unidadMedida}
                  onValueChange={(v) => setForm((f) => ({ ...f, unidadMedida: v as UnidadMedida }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gramos">Gramos</SelectItem>
                    <SelectItem value="mililitros">Mililitros</SelectItem>
                    <SelectItem value="unidades">Unidades</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Ubicación</Label>
                <Select
                  value={form.ubicacionStockId || "_none"}
                  onValueChange={(v) => setForm((f) => ({ ...f, ubicacionStockId: v === "_none" ? "" : v }))}
                >
                  <SelectTrigger><SelectValue placeholder="Sin ubicación" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">Sin ubicación</SelectItem>
                    {ubicaciones.filter((u) => u.estado === "activa").map((u) => (
                      <SelectItem key={u.id} value={String(u.id)}>{u.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Estado</Label>
                <Select
                  value={form.estado}
                  onValueChange={(v) => setForm((f) => ({ ...f, estado: v as EstadoLote }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(ESTADO_LOTE_LABEL) as EstadoLote[])
                      .filter((e) => e !== "descartado")
                      .map((e) => (
                        <SelectItem key={e} value={e}>{ESTADO_LOTE_LABEL[e]}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Fecha ingreso</Label>
                <DateInput
                  value={form.fechaIngreso}
                  onChange={(v) => setForm((f) => ({ ...f, fechaIngreso: v }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Fecha vencimiento</Label>
                <DateInput
                  value={form.fechaVencimiento}
                  onChange={(v) => setForm((f) => ({ ...f, fechaVencimiento: v }))}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Observaciones</Label>
              <Textarea
                value={form.observaciones}
                onChange={(e) => setForm((f) => ({ ...f, observaciones: e.target.value }))}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Guardando…" : editTarget ? "Guardar cambios" : "Crear lote"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Tab Ubicaciones ─────────────────────────────────────────────────────────

type UbicacionForm = {
  codigoUbicacion: string;
  nombre: string;
  tipo: TipoUbicacion;
  descripcion: string;
  estado: "activa" | "inactiva";
};

const EMPTY_UBICACION_FORM: UbicacionForm = {
  codigoUbicacion: "",
  nombre: "",
  tipo: "deposito",
  descripcion: "",
  estado: "activa",
};

function TabUbicaciones({
  ubicaciones,
  onRefresh,
}: {
  ubicaciones: UbicacionStock[];
  onRefresh: () => void;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<UbicacionStock | null>(null);
  const [form, setForm] = useState<UbicacionForm>(EMPTY_UBICACION_FORM);
  const [saving, setSaving] = useState(false);

  function openCreate() {
    setEditTarget(null);
    setForm({ ...EMPTY_UBICACION_FORM, codigoUbicacion: generateCodigo("UB") });
    setDialogOpen(true);
  }

  function openEdit(u: UbicacionStock) {
    setEditTarget(u);
    setForm({
      codigoUbicacion: u.codigoUbicacion,
      nombre: u.nombre,
      tipo: u.tipo,
      descripcion: u.descripcion ?? "",
      estado: u.estado,
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.nombre.trim() || !form.codigoUbicacion.trim()) {
      toast.error("Nombre y código son obligatorios.");
      return;
    }
    setSaving(true);
    try {
      const payload: CreateUbicacionPayload = {
        codigoUbicacion: form.codigoUbicacion,
        nombre: form.nombre,
        tipo: form.tipo,
        descripcion: form.descripcion || null,
        estado: form.estado,
      };
      if (editTarget) {
        await updateUbicacion(editTarget.id, payload);
        toast.success("Ubicación actualizada");
      } else {
        await createUbicacion(payload);
        toast.success("Ubicación creada");
      }
      setDialogOpen(false);
      onRefresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar la ubicación.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(u: UbicacionStock) {
    try {
      await deleteUbicacion(u.id);
      toast.success(`${u.nombre} eliminada/inactivada`);
      onRefresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo eliminar la ubicación.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Button onClick={openCreate} className="gap-1.5">
          <Plus className="h-4 w-4" />
          Nueva ubicación
        </Button>
      </div>

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-24 text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ubicaciones.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                  No hay ubicaciones registradas.
                </TableCell>
              </TableRow>
            ) : (
              ubicaciones.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">{u.codigoUbicacion}</TableCell>
                  <TableCell className="font-medium">{u.nombre}</TableCell>
                  <TableCell>{TIPO_UBICACION_LABEL[u.tipo]}</TableCell>
                  <TableCell className="text-muted-foreground">{u.descripcion ?? "—"}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        u.estado === "activa"
                          ? "border-emerald-200 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                          : "border-slate-200 bg-slate-100/50 text-slate-400"
                      }
                    >
                      {u.estado === "activa" ? "Activa" : "Inactiva"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(u)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleDelete(u)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {u.estado === "activa" ? "Inactivar" : "Eliminar"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editTarget ? "Editar ubicación" : "Nueva ubicación de stock"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Código</Label>
                <Input
                  value={form.codigoUbicacion}
                  onChange={(e) => setForm((f) => ({ ...f, codigoUbicacion: e.target.value }))}
                  disabled={!!editTarget}
                />
              </div>
              <div className="space-y-1">
                <Label>Nombre *</Label>
                <Input
                  value={form.nombre}
                  onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Tipo</Label>
                <Select
                  value={form.tipo}
                  onValueChange={(v) => setForm((f) => ({ ...f, tipo: v as TipoUbicacion }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(TIPO_UBICACION_LABEL) as TipoUbicacion[]).map((t) => (
                      <SelectItem key={t} value={t}>{TIPO_UBICACION_LABEL[t]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Estado</Label>
                <Select
                  value={form.estado}
                  onValueChange={(v) => setForm((f) => ({ ...f, estado: v as "activa" | "inactiva" }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="activa">Activa</SelectItem>
                    <SelectItem value="inactiva">Inactiva</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Descripción</Label>
              <Textarea
                value={form.descripcion}
                onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Guardando…" : editTarget ? "Guardar cambios" : "Crear ubicación"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

function CatalogPage() {
  const [summary, setSummary] = useState<ProductBatchSummary | null>(null);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [lotes, setLotes] = useState<LoteProducto[]>([]);
  const [ubicaciones, setUbicaciones] = useState<UbicacionStock[]>([]);
  const [categorias, setCategorias] = useState<CategoriaProducto[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [sumRes, prodRes, lotesRes, ubRes, catRes] = await Promise.all([
        getProductBatchSummary(),
        getProductos(),
        getLotesProducto(),
        getUbicaciones(),
        getCategorias(),
      ]);
      setSummary(sumRes);
      setProductos(prodRes);
      setLotes(lotesRes);
      setUbicaciones(ubRes);
      setCategorias(catRes);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudieron cargar los datos de productos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadAll(); }, [loadAll]);

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Productos · Stock</h1>
          <p className="text-sm text-muted-foreground">Control de productos, lotes y ubicaciones de stock.</p>
        </div>
        {loading && (
          <span className="text-sm text-muted-foreground">Cargando…</span>
        )}
      </div>

      <KpiCards summary={summary} />

      <Tabs defaultValue="productos">
        <TabsList className="mb-2">
          <TabsTrigger value="productos" className="gap-2">
            <Package className="h-4 w-4" />
            Productos
          </TabsTrigger>
          <TabsTrigger value="lotes" className="gap-2">
            <BoxIcon className="h-4 w-4" />
            Lotes
          </TabsTrigger>
          <TabsTrigger value="ubicaciones" className="gap-2">
            <Warehouse className="h-4 w-4" />
            Ubicaciones
          </TabsTrigger>
        </TabsList>

        <TabsContent value="productos">
          <TabProductos productos={productos} categorias={categorias} onRefresh={loadAll} />
        </TabsContent>

        <TabsContent value="lotes">
          <TabLotes
            lotes={lotes}
            productos={productos}
            ubicaciones={ubicaciones}
            onRefresh={loadAll}
          />
        </TabsContent>

        <TabsContent value="ubicaciones">
          <TabUbicaciones ubicaciones={ubicaciones} onRefresh={loadAll} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

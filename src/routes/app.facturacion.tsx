import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Download,
  Eye,
  EyeOff,
  FileMinus2,
  FilePlus2,
  FileText,
  Filter,
  Landmark,
  MoreVertical,
  Plus,
  Receipt,
  Search,
  Trash2,
  TrendingDown,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Textarea } from "@/components/ui/textarea";
import {
  createBillingInvoice,
  createCreditNote,
  createDebitNote,
  getBillingInvoices,
  getBillingMembers,
  markBillingInvoicePaid,
  type ArcaStatus,
  type BillingInvoice,
  type BillingMember,
  type CobroStatus,
  type ComprobanteType,
} from "@/services/billingService";

export const Route = createFileRoute("/app/facturacion")({
  head: () => ({ meta: [{ title: "Facturacion ARCA - Cannabis Club Manager" }] }),
  component: FacturacionPage,
});

type Periodo = "mes" | "30dias" | "90dias" | "anual";
type SortDir = "asc" | "desc";
type InvoiceSortKey =
  | "fecha"
  | "tipo"
  | "numero"
  | "socio"
  | "codigoSocio"
  | "documento"
  | "condicionIva"
  | "concepto"
  | "total"
  | "estadoArca"
  | "estadoCobro";

const TYPE_LABEL: Record<ComprobanteType, string> = {
  factura_c: "Factura C",
  nota_credito_c: "Nota de credito C",
  nota_debito_c: "Nota de debito C",
  recibo_interno: "Recibo interno",
};
const ARCA_LABEL: Record<ArcaStatus, string> = {
  aprobado: "Aprobado",
  pendiente: "Pendiente",
  observado: "Observado",
  rechazado: "Rechazado",
};
const COBRO_LABEL: Record<CobroStatus, string> = {
  pagado: "Pagado",
  impago: "Impago",
  parcial: "Parcial",
  vencido: "Vencido",
};
const ARCA_CLASS: Record<ArcaStatus, string> = {
  aprobado: "border-emerald-200 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  pendiente: "border-sky-200 bg-sky-500/10 text-sky-700 dark:text-sky-400",
  observado: "border-amber-200 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  rechazado: "border-red-200 bg-red-500/10 text-red-700 dark:text-red-400",
};
const COBRO_CLASS: Record<CobroStatus, string> = {
  pagado: "border-emerald-200 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  impago: "border-amber-200 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  parcial: "border-violet-200 bg-violet-500/10 text-violet-700 dark:text-violet-400",
  vencido: "border-red-200 bg-red-500/10 text-red-700 dark:text-red-400",
};

type NewForm = {
  socioId: string;
  tipo: ComprobanteType;
  concepto: string;
  fecha: string;
  vencimientoPago: string;
  importe: string;
  condicionIva: string;
  observaciones: string;
};

const today = new Date().toISOString().slice(0, 10);

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(value);
}

function isInPeriod(fecha: string, periodo: Periodo): boolean {
  const date = new Date(`${fecha}T00:00:00`);
  const now = new Date();
  if (periodo === "mes") return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
  if (periodo === "30dias") {
    const cutoff = new Date(now); cutoff.setDate(cutoff.getDate() - 30);
    return date >= cutoff;
  }
  if (periodo === "90dias") {
    const cutoff = new Date(now); cutoff.setDate(cutoff.getDate() - 90);
    return date >= cutoff;
  }
  return date.getFullYear() === now.getFullYear();
}

function memberLabel(member: BillingMember) {
  return `${member.codigoSocio} · ${member.nombreCompleto}${member.dni ? ` · DNI ${member.dni}` : ""}`;
}

function formatCondicionIva(value: string) {
  const normalized = value.trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (normalized === "consumidor_final" || normalized.includes("consumidor")) return "Cons F";

  const labels: Record<string, string> = {
    monotributista: "Mono",
    responsable_inscripto: "Resp Ins",
    exento: "Exento",
  };
  return labels[normalized] ?? value;
}

function compareValues(a: unknown, b: unknown) {
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a ?? "").localeCompare(String(b ?? ""), "es", { numeric: true, sensitivity: "base" });
}

function invoiceSortValue(invoice: BillingInvoice, key: InvoiceSortKey) {
  if (key === "fecha") return invoice.fechaEmision;
  if (key === "tipo") return TYPE_LABEL[invoice.tipoComprobante];
  if (key === "numero") return invoice.numeroComprobante ?? invoice.codigoComprobante;
  if (key === "socio") return invoice.socio?.nombreCompleto ?? invoice.razonSocial ?? "";
  if (key === "codigoSocio") return invoice.socio?.codigoSocio ?? "";
  if (key === "documento") return invoice.cuitDni ?? "";
  if (key === "condicionIva") return formatCondicionIva(invoice.condicionIva);
  if (key === "concepto") return invoice.concepto;
  if (key === "total") return invoice.total;
  if (key === "estadoArca") return ARCA_LABEL[invoice.estadoArca];
  return COBRO_LABEL[invoice.estadoCobro];
}

function formatDateForInput(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : value;
}

function maskDateInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function maskedDateToIso(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 8) return "";
  return `${digits.slice(4, 8)}-${digits.slice(2, 4)}-${digits.slice(0, 2)}`;
}

function isValidIsoDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

function FacturacionPage() {
  const [comprobantes, setComprobantes] = useState<BillingInvoice[]>([]);
  const [socios, setSocios] = useState<BillingMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterArca, setFilterArca] = useState<ArcaStatus | "todos">("todos");
  const [filterCobro, setFilterCobro] = useState<CobroStatus | "todos">("todos");
  const [filterTipo, setFilterTipo] = useState<ComprobanteType | "todos">("todos");
  const [filterPeriodo, setFilterPeriodo] = useState<Periodo>("mes");
  const [detailItem, setDetailItem] = useState<BillingInvoice | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sortKey, setSortKey] = useState<InvoiceSortKey>("fecha");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [showFacturado, setShowFacturado] = useState(false);
  const [showPendiente, setShowPendiente] = useState(false);
  const [fechaInput, setFechaInput] = useState(formatDateForInput(today));
  const [newForm, setNewForm] = useState<NewForm>({
    socioId: "",
    tipo: "factura_c",
    concepto: "",
    fecha: today,
    vencimientoPago: "",
    importe: "",
    condicionIva: "consumidor_final",
    observaciones: "",
  });

  async function loadData() {
    setLoading(true);
    try {
      const [nextInvoices, nextMembers] = await Promise.all([getBillingInvoices(), getBillingMembers()]);
      setComprobantes(nextInvoices);
      setSocios(nextMembers);
      setNewForm((current) => ({ ...current, socioId: current.socioId || nextMembers[0]?.id || "" }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo cargar facturacion.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const selectedSocio = socios.find((socio) => socio.id === newForm.socioId);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return comprobantes.filter((c) => {
      if (filterArca !== "todos" && c.estadoArca !== filterArca) return false;
      if (filterCobro !== "todos" && c.estadoCobro !== filterCobro) return false;
      if (filterTipo !== "todos" && c.tipoComprobante !== filterTipo) return false;
      if (!isInPeriod(c.fechaEmision, filterPeriodo)) return false;
      if (!q) return true;
      const socioText = `${c.socio?.nombreCompleto ?? c.razonSocial ?? ""} ${c.socio?.codigoSocio ?? ""}`;
      return [
        socioText,
        c.cuitDni,
        c.numeroComprobante,
        c.codigoComprobante,
        c.cae,
        c.concepto,
      ].some((value) => value?.toLowerCase().includes(q));
    });
  }, [comprobantes, search, filterArca, filterCobro, filterTipo, filterPeriodo]);

  const stats = useMemo(() => {
    const inPeriod = comprobantes.filter((c) => isInPeriod(c.fechaEmision, filterPeriodo));
    const totalFacturado = inPeriod.reduce((sum, c) => sum + c.total, 0);
    const pendienteCobro = inPeriod
      .filter((c) => c.estadoCobro === "impago" || c.estadoCobro === "vencido" || c.estadoCobro === "parcial")
      .reduce((sum, c) => sum + Math.abs(c.total), 0);
    const observados = inPeriod.filter((c) => c.estadoArca === "observado").length;
    const sociosSet = new Set(inPeriod.map((c) => c.socioId));
    return { count: inPeriod.length, totalFacturado, pendienteCobro, observados, socios: sociosSet.size };
  }, [comprobantes, filterPeriodo]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const result = compareValues(invoiceSortValue(a, sortKey), invoiceSortValue(b, sortKey));
      return sortDir === "asc" ? result : -result;
    });
  }, [filtered, sortKey, sortDir]);

  function handleSort(key: InvoiceSortKey) {
    if (sortKey === key) {
      setSortDir((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDir(key === "fecha" ? "desc" : "asc");
  }

  function handleFechaInput(value: string) {
    const next = maskDateInput(value);
    setFechaInput(next);
    setNewForm((current) => ({ ...current, fecha: maskedDateToIso(next) }));
  }

  async function handleNewSave() {
    if (!selectedSocio) {
      toast.error("Selecciona un socio real.");
      return;
    }
    if (!newForm.concepto.trim() || !newForm.importe) {
      toast.error("Completa concepto e importe.");
      return;
    }
    const importe = Number(newForm.importe);
    if (!Number.isFinite(importe) || importe <= 0) {
      toast.error("El importe debe ser mayor a 0.");
      return;
    }
    if (!isValidIsoDate(newForm.fecha)) {
      toast.error("Ingresa una fecha valida con formato dd/mm/aaaa.");
      return;
    }

    try {
      setSaving(true);
      const invoice = await createBillingInvoice({
        socio_id: Number(selectedSocio.id),
        tipo_comprobante: newForm.tipo,
        punto_venta: "0001",
        fecha_emision: newForm.fecha,
        fecha_vencimiento_pago: newForm.vencimientoPago || undefined,
        concepto: newForm.concepto.trim(),
        condicion_iva: newForm.condicionIva,
        subtotal: importe,
        iva: 0,
        total: newForm.tipo === "nota_credito_c" ? -importe : importe,
        estado_arca: "pendiente",
        estado_cobro: "impago",
        observaciones: newForm.observaciones.trim() || undefined,
        items: [{
          descripcion: newForm.concepto.trim(),
          cantidad: 1,
          precio_unitario: importe,
          subtotal: newForm.tipo === "nota_credito_c" ? -importe : importe,
        }],
      });
      setComprobantes((current) => [invoice, ...current]);
      setShowNewModal(false);
      setNewForm({
        socioId: socios[0]?.id || "",
        tipo: "factura_c",
        concepto: "",
        fecha: today,
        vencimientoPago: "",
        importe: "",
        condicionIva: "consumidor_final",
        observaciones: "",
      });
      setFechaInput(formatDateForInput(today));
      toast.success("Comprobante creado en base de datos.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo crear el comprobante.");
    } finally {
      setSaving(false);
    }
  }

  async function updateInvoice(action: () => Promise<BillingInvoice>, message: string) {
    try {
      const invoice = await action();
      setComprobantes((current) => [invoice, ...current.filter((item) => item.id !== invoice.id)]);
      setDetailItem((current) => (current?.id === invoice.id ? invoice : current));
      toast.success(message);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo completar la accion.");
    }
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-4 pb-8">
      <div className="rounded-xl border bg-card px-4 py-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-3">
            <Badge variant="outline" className="gap-1.5 border-amber-300 bg-amber-500/10 text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              <Landmark className="h-3 w-3" />
              Administracion
            </Badge>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Facturacion ARCA</h1>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Generacion y seguimiento de comprobantes asociados a socios del club.
              </p>
            </div>
          </div>

          <Button className="gap-2" onClick={() => setShowNewModal(true)}>
            <Plus className="h-4 w-4" />
            Nueva factura
          </Button>
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-800/50 dark:bg-amber-950/30 dark:text-amber-400">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          Integracion ARCA en modo simulado. Los comprobantes se guardan en base de datos, pero no se informan fiscalmente.
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <SummaryCard title="Comprobantes del mes" value={String(stats.count)} description={`${stats.socios} socios facturados`} icon={<FileText className="h-4 w-4" />} />
        <SummaryCard
          title="Facturado del mes"
          value={showFacturado ? formatCurrency(stats.totalFacturado) : "••••"}
          description="Total bruto emitido"
          icon={<TrendingUp className="h-4 w-4 text-emerald-500" />}
          action={<VisibilityButton visible={showFacturado} label="facturado del mes" onToggle={() => setShowFacturado((current) => !current)} />}
        />
        <SummaryCard
          title="Pendiente de cobro"
          value={showPendiente ? formatCurrency(stats.pendienteCobro) : "••••"}
          description="Impago + parcial + vencido"
          icon={<TrendingDown className="h-4 w-4 text-amber-500" />}
          action={<VisibilityButton visible={showPendiente} label="pendiente de cobro" onToggle={() => setShowPendiente((current) => !current)} />}
        />
        <SummaryCard title="Observados ARCA" value={String(stats.observados)} description="Requieren revision" icon={<AlertCircle className="h-4 w-4 text-amber-500" />} />
        <SummaryCard title="Socios facturados" value={String(stats.socios)} description="Unicos del periodo" icon={<Users className="h-4 w-4" />} />
      </div>

      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px] flex-1">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-8" placeholder="Buscar por socio, codigo, DNI, comprobante o CAE" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Filter className="h-3.5 w-3.5" /> Filtrar:</div>
            <Select value={filterPeriodo} onValueChange={(v) => setFilterPeriodo(v as Periodo)}>
              <SelectTrigger className="w-[135px]"><Calendar className="mr-1.5 h-3.5 w-3.5" /><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="mes">Este mes</SelectItem>
                <SelectItem value="30dias">Ultimos 30 dias</SelectItem>
                <SelectItem value="90dias">Ultimos 90 dias</SelectItem>
                <SelectItem value="anual">Anio actual</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterArca} onValueChange={(v) => setFilterArca(v as typeof filterArca)}>
              <SelectTrigger className="w-[135px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">ARCA · Todos</SelectItem>
                {Object.entries(ARCA_LABEL).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterCobro} onValueChange={(v) => setFilterCobro(v as typeof filterCobro)}>
              <SelectTrigger className="w-[135px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Cobro · Todos</SelectItem>
                {Object.entries(COBRO_LABEL).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterTipo} onValueChange={(v) => setFilterTipo(v as typeof filterTipo)}>
              <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Tipo · Todos</SelectItem>
                {Object.entries(TYPE_LABEL).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
              </SelectContent>
            </Select>
            {(search || filterArca !== "todos" || filterCobro !== "todos" || filterTipo !== "todos") && (
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={() => { setSearch(""); setFilterArca("todos"); setFilterCobro("todos"); setFilterTipo("todos"); }}>
                <X className="h-3 w-3" /> Limpiar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <InvoiceSortHead label="Fecha" sortKey="fecha" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
                  <InvoiceSortHead label="Tipo" sortKey="tipo" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
                  <InvoiceSortHead label="Nro comprobante" sortKey="numero" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
                  <InvoiceSortHead label="Socio / Cliente" sortKey="socio" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
                  <InvoiceSortHead label="Codigo socio" sortKey="codigoSocio" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
                  <InvoiceSortHead label="CUIT / DNI" sortKey="documento" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
                  <InvoiceSortHead label="Condicion IVA" sortKey="condicionIva" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
                  <InvoiceSortHead label="Concepto" sortKey="concepto" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
                  <InvoiceSortHead label="Total" sortKey="total" activeKey={sortKey} dir={sortDir} onSort={handleSort} className="text-right" />
                  <InvoiceSortHead label="Estado ARCA" sortKey="estadoArca" activeKey={sortKey} dir={sortDir} onSort={handleSort} className="text-center" />
                  <InvoiceSortHead label="Estado cobro" sortKey="estadoCobro" activeKey={sortKey} dir={sortDir} onSort={handleSort} className="text-center" />
                  <TableHead className="h-9 px-2 text-center text-xs">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={12} className="py-12 text-center text-sm text-muted-foreground">Cargando comprobantes...</TableCell></TableRow>
                ) : sorted.length === 0 ? (
                  <TableRow><TableCell colSpan={12} className="py-12 text-center text-sm text-muted-foreground">No hay comprobantes que coincidan con los filtros aplicados.</TableCell></TableRow>
                ) : sorted.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="whitespace-nowrap px-2 py-2 text-xs">{c.fechaEmision}</TableCell>
                    <TableCell className="whitespace-nowrap px-2 py-2 text-xs">{TYPE_LABEL[c.tipoComprobante]}</TableCell>
                    <TableCell className="px-2 py-2 font-mono text-xs">{c.numeroComprobante ?? c.codigoComprobante}</TableCell>
                    <TableCell className="px-2 py-2"><span className="text-xs font-medium">{c.socio?.nombreCompleto ?? c.razonSocial ?? "-"}</span></TableCell>
                    <TableCell className="px-2 py-2 text-xs text-muted-foreground">{c.socio?.codigoSocio ?? "-"}</TableCell>
                    <TableCell className="px-2 py-2 font-mono text-xs">{c.cuitDni ?? "-"}</TableCell>
                    <TableCell className="px-2 py-2 text-xs">{formatCondicionIva(c.condicionIva)}</TableCell>
                    <TableCell className="max-w-[180px] truncate px-2 py-2 text-xs">{c.concepto}</TableCell>
                    <TableCell className="whitespace-nowrap px-2 py-2 text-right text-xs font-medium">
                      <span className={c.total < 0 ? "text-red-600 dark:text-red-400" : ""}>{formatCurrency(c.total)}</span>
                    </TableCell>
                    <TableCell className="px-2 py-2 text-center"><Badge variant="outline" className={`px-2 text-[11px] ${ARCA_CLASS[c.estadoArca]}`}>{ARCA_LABEL[c.estadoArca]}</Badge></TableCell>
                    <TableCell className="px-2 py-2 text-center"><Badge variant="outline" className={`px-2 text-[11px] ${COBRO_CLASS[c.estadoCobro]}`}>{COBRO_LABEL[c.estadoCobro]}</Badge></TableCell>
                    <TableCell className="px-2 py-2 text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setDetailItem(c)}><Eye className="mr-2 h-4 w-4" />Ver detalle</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toast.info("PDF real pendiente de integracion.")}><Download className="mr-2 h-4 w-4" />Descargar PDF</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => void updateInvoice(() => createCreditNote(c.id), "Nota de credito demo generada.")}><FileMinus2 className="mr-2 h-4 w-4" />Generar nota de credito</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => void updateInvoice(() => createDebitNote(c.id), "Nota de debito demo generada.")}><FilePlus2 className="mr-2 h-4 w-4" />Generar nota de debito</DropdownMenuItem>
                          {c.estadoCobro !== "pagado" && (
                            <DropdownMenuItem onClick={() => void updateInvoice(() => markBillingInvoicePaid(c.id), "Comprobante marcado como pagado.")}><CheckCircle2 className="mr-2 h-4 w-4" />Marcar como pagado</DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => toast.info("Baja fisica deshabilitada para conservar trazabilidad.")}><Trash2 className="mr-2 h-4 w-4" />Eliminar demo</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="border-t px-4 py-2.5 text-xs text-muted-foreground">{filtered.length} de {comprobantes.length} comprobantes · Datos persistidos con ARCA simulado</div>
        </CardContent>
      </Card>

      <Dialog open={Boolean(detailItem)} onOpenChange={(open) => !open && setDetailItem(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Receipt className="h-4 w-4" />Detalle de comprobante</DialogTitle>
            <DialogDescription>Datos guardados en base local. CAE y estado ARCA son simulados.</DialogDescription>
          </DialogHeader>
          {detailItem && <InvoiceDetail invoice={detailItem} />}
          <DialogFooter><Button variant="outline" onClick={() => setDetailItem(null)}>Cerrar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showNewModal} onOpenChange={setShowNewModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Plus className="h-4 w-4" />Nueva factura</DialogTitle>
            <DialogDescription>El comprobante se guarda en base de datos. No se envia a ARCA.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4">
            {!socios.length && (
              <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-800/50 dark:bg-amber-950/30 dark:text-amber-300">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                No hay socios disponibles para facturar. Revisá que el backend esté activo y que existan socios cargados.
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Socio</Label>
              <Select value={newForm.socioId} onValueChange={(v) => setNewForm({ ...newForm, socioId: v })}>
                <SelectTrigger><SelectValue placeholder="Selecciona socio" /></SelectTrigger>
                <SelectContent>{socios.map((s) => <SelectItem key={s.id} value={s.id}>{memberLabel(s)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {selectedSocio && (
              <div className="rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                DNI/CUIT: {selectedSocio.dni ?? "-"} · Razon social: {selectedSocio.nombreCompleto} · Domicilio: {selectedSocio.direccion ?? "-"}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold">Tipo</Label>
                <Select value={newForm.tipo} onValueChange={(v) => setNewForm({ ...newForm, tipo: v as ComprobanteType })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(TYPE_LABEL).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="nf-fecha" className="text-sm font-semibold">Fecha</Label>
                <Input
                  id="nf-fecha"
                  type="text"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="dd/mm/aaaa"
                  value={fechaInput}
                  onChange={(e) => handleFechaInput(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nf-concepto" className="text-sm font-semibold">Concepto</Label>
              <Input id="nf-concepto" value={newForm.concepto} onChange={(e) => setNewForm({ ...newForm, concepto: e.target.value })} placeholder="Ej: Cuota mensual socio" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="nf-importe" className="text-sm font-semibold">Importe total ($)</Label>
                <Input id="nf-importe" type="number" min="1" step="1" value={newForm.importe} onChange={(e) => setNewForm({ ...newForm, importe: e.target.value })} placeholder="Ej: 50000" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold">Condicion IVA</Label>
                <Select value={newForm.condicionIva} onValueChange={(v) => setNewForm({ ...newForm, condicionIva: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="consumidor_final">Consumidor final</SelectItem>
                    <SelectItem value="monotributista">Monotributista</SelectItem>
                    <SelectItem value="responsable_inscripto">Responsable inscripto</SelectItem>
                    <SelectItem value="exento">Exento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nf-obs" className="text-sm font-semibold">Observaciones</Label>
              <Textarea id="nf-obs" rows={2} value={newForm.observaciones} onChange={(e) => setNewForm({ ...newForm, observaciones: e.target.value })} placeholder="Opcional" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewModal(false)}>Cancelar</Button>
            <Button onClick={handleNewSave} disabled={saving || !socios.length} className="gap-2"><Plus className="h-4 w-4" />{saving ? "Guardando..." : "Crear factura"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InvoiceSortHead({
  label,
  sortKey,
  activeKey,
  dir,
  onSort,
  className = "",
}: {
  label: string;
  sortKey: InvoiceSortKey;
  activeKey: InvoiceSortKey;
  dir: SortDir;
  onSort: (key: InvoiceSortKey) => void;
  className?: string;
}) {
  const active = activeKey === sortKey;
  const justify = className.includes("text-right")
    ? "justify-end"
    : className.includes("text-center")
      ? "justify-center"
      : "";
  const Icon = active ? (dir === "asc" ? ChevronUp : ChevronDown) : ChevronsUpDown;

  return (
    <TableHead className={`h-9 select-none px-2 text-xs ${className}`}>
      <button type="button" className={`inline-flex w-full items-center gap-1.5 ${justify}`} onClick={() => onSort(sortKey)}>
        <span>{label}</span>
        <Icon className={`h-3.5 w-3.5 ${active ? "text-primary" : "text-muted-foreground/70"}`} />
      </button>
    </TableHead>
  );
}

function VisibilityButton({ visible, label, onToggle }: { visible: boolean; label: string; onToggle: () => void }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="h-7 w-7 text-muted-foreground hover:text-foreground"
      title={visible ? `Ocultar ${label}` : `Mostrar ${label}`}
      aria-label={visible ? `Ocultar ${label}` : `Mostrar ${label}`}
      onClick={onToggle}
    >
      {visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
    </Button>
  );
}

function SummaryCard({ title, value, description, icon, action }: { title: string; value: string; description: string; icon: React.ReactNode; action?: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-2 pt-4">
        <CardTitle className="flex items-center justify-between gap-2 text-xs font-medium text-muted-foreground">
          <span>{title}</span>
          <span className="flex items-center gap-1">
            {action}
            {icon}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function InvoiceDetail({ invoice }: { invoice: BillingInvoice }) {
  return (
    <div className="space-y-4 text-sm">
      <div className="rounded-md border bg-muted/40 px-3 py-2.5 text-xs text-muted-foreground">Integracion ARCA simulada.</div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
        <DetailRow label="Tipo" value={TYPE_LABEL[invoice.tipoComprobante]} />
        <DetailRow label="Nro comprobante" value={invoice.numeroComprobante ?? invoice.codigoComprobante} mono />
        <DetailRow label="Fecha emision" value={invoice.fechaEmision} />
        <DetailRow label="Socio" value={invoice.socio?.nombreCompleto ?? invoice.razonSocial ?? "-"} />
        <DetailRow label="Codigo socio" value={invoice.socio?.codigoSocio ?? "-"} />
        <DetailRow label="DNI / CUIT" value={invoice.cuitDni ?? "-"} mono />
        <DetailRow label="Condicion IVA" value={invoice.condicionIva} />
        <DetailRow label="CAE simulado" value={invoice.cae ?? "-"} mono />
      </div>
      <div className="rounded-md border p-3 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Items</p>
        {invoice.items.length ? invoice.items.map((item) => (
          <div key={item.id} className="flex justify-between gap-4 text-sm">
            <span>{item.descripcion} x {item.cantidad}</span>
            <span className="font-medium">{formatCurrency(item.subtotal)}</span>
          </div>
        )) : <p className="text-xs text-muted-foreground">Sin items cargados.</p>}
        <div className="border-t pt-2 text-right font-semibold">Total: {formatCurrency(invoice.total)}</div>
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
        <div className="space-y-1"><p className="text-xs text-muted-foreground">Estado ARCA</p><Badge variant="outline" className={`text-xs ${ARCA_CLASS[invoice.estadoArca]}`}>{ARCA_LABEL[invoice.estadoArca]}</Badge></div>
        <div className="space-y-1"><p className="text-xs text-muted-foreground">Estado cobro</p><Badge variant="outline" className={`text-xs ${COBRO_CLASS[invoice.estadoCobro]}`}>{COBRO_LABEL[invoice.estadoCobro]}</Badge></div>
      </div>
      {invoice.observaciones && <DetailRow label="Observaciones" value={invoice.observaciones} />}
    </div>
  );
}

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`font-medium ${mono ? "font-mono text-xs" : "text-sm"}`}>{value}</p>
    </div>
  );
}

import { apiRequest, withMockFallback } from "@/services/cultivationApi";

export type ArcaStatus = "aprobado" | "pendiente" | "observado" | "rechazado";
export type CobroStatus = "pagado" | "impago" | "parcial" | "vencido";
export type ComprobanteType = "factura_c" | "nota_credito_c" | "nota_debito_c" | "recibo_interno";

export interface BillingMember {
  id: string;
  codigoSocio: string;
  nombreCompleto: string;
  dni?: string;
  direccion?: string;
}

export interface BillingInvoiceItem {
  id: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface BillingPayment {
  id: string;
  fechaPago: string;
  monto: number;
  medioPago: string;
  referencia?: string;
  observaciones?: string;
}

export interface BillingInvoice {
  id: string;
  codigoComprobante: string;
  socioId?: string;
  tipoComprobante: ComprobanteType;
  puntoVenta?: string;
  numeroComprobante?: string;
  fechaEmision: string;
  fechaVencimientoPago?: string;
  concepto: string;
  condicionIva: string;
  cuitDni?: string;
  razonSocial?: string;
  domicilio?: string;
  subtotal: number;
  iva: number;
  total: number;
  moneda: string;
  estadoArca: ArcaStatus;
  estadoCobro: CobroStatus;
  cae?: string;
  vencimientoCae?: string;
  pdfUrl?: string;
  observaciones?: string;
  comprobanteRelacionadoId?: string;
  socio?: BillingMember;
  items: BillingInvoiceItem[];
  pagos: BillingPayment[];
}

export interface CreateBillingInvoicePayload {
  socio_id?: number;
  tipo_comprobante: ComprobanteType;
  punto_venta?: string;
  fecha_emision: string;
  fecha_vencimiento_pago?: string;
  concepto: string;
  condicion_iva: string;
  cuit_dni?: string;
  razon_social?: string;
  domicilio?: string;
  subtotal: number;
  iva: number;
  total: number;
  estado_arca?: ArcaStatus;
  estado_cobro?: CobroStatus;
  observaciones?: string;
  items: Array<{
    descripcion: string;
    cantidad: number;
    precio_unitario: number;
    subtotal: number;
  }>;
}

interface ApiMember {
  id: number;
  codigoSocio: string;
  nombre: string;
  apellido: string;
  dni: string | null;
  direccion: string | null;
}

interface ApiInvoice {
  id: number;
  codigoComprobante: string;
  socioId: number | null;
  tipoComprobante: ComprobanteType;
  puntoVenta: string | null;
  numeroComprobante: string | null;
  fechaEmision: string;
  fechaVencimientoPago: string | null;
  concepto: string;
  condicionIva: string;
  cuitDni: string | null;
  razonSocial: string | null;
  domicilio: string | null;
  subtotal: number;
  iva: number;
  total: number;
  moneda: string;
  estadoArca: ArcaStatus;
  estadoCobro: CobroStatus;
  cae: string | null;
  vencimientoCae: string | null;
  pdfUrl: string | null;
  observaciones: string | null;
  comprobanteRelacionadoId: number | null;
  socio?: ApiMember;
  items?: Array<{
    id: number;
    descripcion: string;
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
  }>;
  pagos?: Array<{
    id: number;
    fechaPago: string;
    monto: number;
    medioPago: string;
    referencia: string | null;
    observaciones: string | null;
  }>;
}

const MOCK_MEMBERS: BillingMember[] = [];
const MOCK_INVOICES: BillingInvoice[] = [];

function dateOnly(value: string | null | undefined) {
  return value ? new Date(value).toISOString().slice(0, 10) : undefined;
}

function mapMember(member: ApiMember): BillingMember {
  return {
    id: String(member.id),
    codigoSocio: member.codigoSocio,
    nombreCompleto: `${member.nombre} ${member.apellido}`.trim(),
    dni: member.dni ?? undefined,
    direccion: member.direccion ?? undefined,
  };
}

function mapInvoice(invoice: ApiInvoice): BillingInvoice {
  return {
    id: String(invoice.id),
    codigoComprobante: invoice.codigoComprobante,
    socioId: invoice.socioId ? String(invoice.socioId) : undefined,
    tipoComprobante: invoice.tipoComprobante,
    puntoVenta: invoice.puntoVenta ?? undefined,
    numeroComprobante: invoice.numeroComprobante ?? undefined,
    fechaEmision: dateOnly(invoice.fechaEmision) ?? "",
    fechaVencimientoPago: dateOnly(invoice.fechaVencimientoPago),
    concepto: invoice.concepto,
    condicionIva: invoice.condicionIva,
    cuitDni: invoice.cuitDni ?? undefined,
    razonSocial: invoice.razonSocial ?? undefined,
    domicilio: invoice.domicilio ?? undefined,
    subtotal: invoice.subtotal,
    iva: invoice.iva,
    total: invoice.total,
    moneda: invoice.moneda,
    estadoArca: invoice.estadoArca,
    estadoCobro: invoice.estadoCobro,
    cae: invoice.cae ?? undefined,
    vencimientoCae: dateOnly(invoice.vencimientoCae),
    pdfUrl: invoice.pdfUrl ?? undefined,
    observaciones: invoice.observaciones ?? undefined,
    comprobanteRelacionadoId: invoice.comprobanteRelacionadoId ? String(invoice.comprobanteRelacionadoId) : undefined,
    socio: invoice.socio ? mapMember(invoice.socio) : undefined,
    items: (invoice.items ?? []).map((item) => ({
      id: String(item.id),
      descripcion: item.descripcion,
      cantidad: item.cantidad,
      precioUnitario: item.precioUnitario,
      subtotal: item.subtotal,
    })),
    pagos: (invoice.pagos ?? []).map((payment) => ({
      id: String(payment.id),
      fechaPago: dateOnly(payment.fechaPago) ?? "",
      monto: payment.monto,
      medioPago: payment.medioPago,
      referencia: payment.referencia ?? undefined,
      observaciones: payment.observaciones ?? undefined,
    })),
  };
}

export async function getBillingMembers(): Promise<BillingMember[]> {
  return withMockFallback(
    async () => (await apiRequest<ApiMember[]>("/members")).map(mapMember),
    () => MOCK_MEMBERS,
  );
}

export async function getBillingInvoices(): Promise<BillingInvoice[]> {
  return withMockFallback(
    async () => (await apiRequest<ApiInvoice[]>("/billing/invoices")).map(mapInvoice),
    () => MOCK_INVOICES,
  );
}

export async function getBillingInvoiceById(id: string): Promise<BillingInvoice> {
  return mapInvoice(await apiRequest<ApiInvoice>(`/billing/invoices/${id}`));
}

export async function createBillingInvoice(payload: CreateBillingInvoicePayload): Promise<BillingInvoice> {
  return mapInvoice(
    await apiRequest<ApiInvoice>("/billing/invoices", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  );
}

export async function markBillingInvoicePaid(id: string): Promise<BillingInvoice> {
  return mapInvoice(
    await apiRequest<ApiInvoice>(`/billing/invoices/${id}/mark-paid`, {
      method: "POST",
      body: JSON.stringify({ medio_pago: "efectivo" }),
    }),
  );
}

export async function createCreditNote(id: string): Promise<BillingInvoice> {
  return mapInvoice(
    await apiRequest<ApiInvoice>(`/billing/invoices/${id}/credit-note`, {
      method: "POST",
      body: JSON.stringify({}),
    }),
  );
}

export async function createDebitNote(id: string): Promise<BillingInvoice> {
  return mapInvoice(
    await apiRequest<ApiInvoice>(`/billing/invoices/${id}/debit-note`, {
      method: "POST",
      body: JSON.stringify({}),
    }),
  );
}

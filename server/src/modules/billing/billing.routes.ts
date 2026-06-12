import { Router, type NextFunction, type Request, type Response } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/ApiError.js";

const intId = z.coerce.number().int().positive();

const invoiceTypes = ["factura_c", "nota_credito_c", "nota_debito_c", "recibo_interno"] as const;
const arcaStatuses = ["aprobado", "pendiente", "observado", "rechazado"] as const;
const paymentStatuses = ["pagado", "impago", "parcial", "vencido"] as const;
const paymentMethods = ["efectivo", "transferencia", "mercado_pago", "otro"] as const;

const optionalText = z.string().trim().min(1).optional().or(z.literal("").transform(() => undefined));

const invoiceItemSchema = z.object({
  descripcion: z.string().trim().min(1),
  cantidad: z.coerce.number().positive(),
  precioUnitario: z.coerce.number().nonnegative().optional(),
  precio_unitario: z.coerce.number().nonnegative().optional(),
  subtotal: z.coerce.number(),
}).transform((item) => ({
  descripcion: item.descripcion,
  cantidad: item.cantidad,
  precioUnitario: item.precioUnitario ?? item.precio_unitario ?? 0,
  subtotal: item.subtotal,
}));

const rawInvoiceSchema = z.object({
  socioId: intId.optional(),
  socio_id: intId.optional(),
  tipoComprobante: z.enum(invoiceTypes).optional(),
  tipo_comprobante: z.enum(invoiceTypes).optional(),
  puntoVenta: optionalText,
  punto_venta: optionalText,
  numeroComprobante: optionalText,
  numero_comprobante: optionalText,
  fechaEmision: z.coerce.date().optional(),
  fecha_emision: z.coerce.date().optional(),
  fechaVencimientoPago: z.coerce.date().optional(),
  fecha_vencimiento_pago: z.coerce.date().optional(),
  concepto: optionalText,
  condicionIva: optionalText,
  condicion_iva: optionalText,
  cuitDni: optionalText,
  cuit_dni: optionalText,
  razonSocial: optionalText,
  razon_social: optionalText,
  domicilio: optionalText,
  subtotal: z.coerce.number().default(0),
  iva: z.coerce.number().default(0),
  total: z.coerce.number().optional(),
  moneda: optionalText,
  estadoArca: z.enum(arcaStatuses).optional(),
  estado_arca: z.enum(arcaStatuses).optional(),
  estadoCobro: z.enum(paymentStatuses).optional(),
  estado_cobro: z.enum(paymentStatuses).optional(),
  cae: optionalText,
  vencimientoCae: z.coerce.date().optional(),
  vencimiento_cae: z.coerce.date().optional(),
  pdfUrl: optionalText,
  pdf_url: optionalText,
  observaciones: optionalText,
  comprobanteRelacionadoId: intId.optional(),
  comprobante_relacionado_id: intId.optional(),
  items: z.array(invoiceItemSchema).optional(),
});

function normalizeInvoiceBody(body: Record<string, any>) {
  return {
    socioId: body.socioId ?? body.socio_id,
    tipoComprobante: body.tipoComprobante ?? body.tipo_comprobante,
    puntoVenta: body.puntoVenta ?? body.punto_venta ?? "0001",
    numeroComprobante: body.numeroComprobante ?? body.numero_comprobante,
    fechaEmision: body.fechaEmision ?? body.fecha_emision,
    fechaVencimientoPago: body.fechaVencimientoPago ?? body.fecha_vencimiento_pago,
    concepto: body.concepto,
    condicionIva: body.condicionIva ?? body.condicion_iva ?? "consumidor_final",
    cuitDni: body.cuitDni ?? body.cuit_dni,
    razonSocial: body.razonSocial ?? body.razon_social,
    domicilio: body.domicilio,
    subtotal: body.subtotal,
    iva: body.iva,
    total: body.total,
    moneda: body.moneda ?? "ARS",
    estadoArca: body.estadoArca ?? body.estado_arca ?? "pendiente",
    estadoCobro: body.estadoCobro ?? body.estado_cobro ?? "impago",
    cae: body.cae,
    vencimientoCae: body.vencimientoCae ?? body.vencimiento_cae,
    pdfUrl: body.pdfUrl ?? body.pdf_url,
    observaciones: body.observaciones,
    comprobanteRelacionadoId: body.comprobanteRelacionadoId ?? body.comprobante_relacionado_id,
    items: body.items,
  };
}

const invoiceSchema = rawInvoiceSchema.transform(normalizeInvoiceBody).superRefine((body, ctx) => {
  if (!body.socioId && !body.razonSocial) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Indica un socio o una razon social manual.", path: ["razon_social"] });
  if (!body.tipoComprobante) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "tipo_comprobante es requerido.", path: ["tipo_comprobante"] });
  if (!body.fechaEmision) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "fecha_emision es requerida.", path: ["fecha_emision"] });
  if (!body.concepto) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "concepto es requerido.", path: ["concepto"] });
  if (body.total === undefined || body.total === 0) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "El total no puede ser 0.", path: ["total"] });
});

const invoiceUpdateSchema = rawInvoiceSchema.partial().transform(normalizeInvoiceBody).superRefine((body, ctx) => {
  if (body.total === 0) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "El total no puede ser 0.", path: ["total"] });
});

type InvoiceCreateInput = z.infer<typeof invoiceSchema>;
type InvoiceUpdateInput = z.infer<typeof invoiceUpdateSchema>;

const markPaidSchema = z.object({
  fechaPago: z.coerce.date().optional(),
  fecha_pago: z.coerce.date().optional(),
  monto: z.coerce.number().positive().optional(),
  medioPago: z.enum(paymentMethods).optional(),
  medio_pago: z.enum(paymentMethods).optional(),
  referencia: optionalText,
  observaciones: optionalText,
}).transform((body) => ({
  fechaPago: body.fechaPago ?? body.fecha_pago ?? new Date(),
  monto: body.monto,
  medioPago: body.medioPago ?? body.medio_pago ?? "efectivo",
  referencia: body.referencia,
  observaciones: body.observaciones,
}));

const relatedNoteSchema = z.object({
  concepto: optionalText,
  total: z.coerce.number().positive().optional(),
  observaciones: optionalText,
});

function parseId(req: Request) {
  return intId.parse(req.params.id);
}

function includeInvoiceRelations() {
  return {
    socio: true,
    items: true,
    pagos: { orderBy: { fechaPago: "desc" as const } },
    comprobanteRelacionado: true,
  };
}

function prefixForType(type: string) {
  if (type === "nota_credito_c") return "NC";
  if (type === "nota_debito_c") return "ND";
  if (type === "recibo_interno") return "REC";
  return "FAC";
}

async function nextSequence() {
  return (await prisma.comprobanteFacturacion.count()) + 1;
}

async function buildCodes(type: string, pointOfSale = "0001") {
  const seq = await nextSequence();
  const prefix = prefixForType(type);
  return {
    codigoComprobante: `${prefix}-${String(seq).padStart(6, "0")}`,
    numeroComprobante: `${pointOfSale}-${String(seq).padStart(8, "0")}`,
  };
}

function invoiceDataFromBody(body: InvoiceCreateInput, socio: Awaited<ReturnType<typeof prisma.socio.findUnique>>) {
  if (body.socioId && !socio) throw new ApiError(404, "Socio no encontrado.");
  const razonSocial = body.razonSocial ?? (socio ? `${socio.nombre} ${socio.apellido}`.trim() : undefined);
  return {
    socioId: body.socioId ?? null,
    tipoComprobante: body.tipoComprobante!,
    puntoVenta: body.puntoVenta,
    numeroComprobante: body.numeroComprobante,
    fechaEmision: body.fechaEmision!,
    fechaVencimientoPago: body.fechaVencimientoPago,
    concepto: body.concepto!,
    condicionIva: body.condicionIva,
    cuitDni: body.cuitDni ?? socio?.dni ?? undefined,
    razonSocial,
    domicilio: body.domicilio ?? socio?.direccion ?? undefined,
    subtotal: body.subtotal,
    iva: body.iva,
    total: body.total!,
    moneda: body.moneda,
    estadoArca: body.estadoArca,
    estadoCobro: body.estadoCobro,
    cae: body.cae,
    vencimientoCae: body.vencimientoCae,
    pdfUrl: body.pdfUrl,
    observaciones: body.observaciones,
    comprobanteRelacionadoId: body.comprobanteRelacionadoId,
  };
}

export const billingRoutes = Router();

billingRoutes.get("/invoices", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(
      await prisma.comprobanteFacturacion.findMany({
        include: includeInvoiceRelations(),
        orderBy: { fechaEmision: "desc" },
      }),
    );
  } catch (error) {
    next(error);
  }
});

billingRoutes.get("/invoices/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const record = await prisma.comprobanteFacturacion.findUnique({
      where: { id: parseId(req) },
      include: includeInvoiceRelations(),
    });
    if (!record) throw new ApiError(404, "Comprobante no encontrado.");
    res.json(record);
  } catch (error) {
    next(error);
  }
});

billingRoutes.post("/invoices", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = invoiceSchema.parse(req.body);
    const socio = body.socioId ? await prisma.socio.findUnique({ where: { id: body.socioId } }) : null;
    const codes = await buildCodes(body.tipoComprobante!, body.puntoVenta);
    const items = body.items?.length ? body.items : [{
      descripcion: body.concepto!,
      cantidad: 1,
      precioUnitario: Math.abs(body.total!),
      subtotal: body.total!,
    }];

    const record = await prisma.comprobanteFacturacion.create({
      data: {
        codigoComprobante: codes.codigoComprobante,
        ...invoiceDataFromBody({ ...body, numeroComprobante: body.numeroComprobante ?? codes.numeroComprobante }, socio),
        items: { create: items },
      },
      include: includeInvoiceRelations(),
    });
    res.status(201).json(record);
  } catch (error) {
    next(error);
  }
});

billingRoutes.patch("/invoices/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseId(req);
    const body: InvoiceUpdateInput = invoiceUpdateSchema.parse(req.body);
    const existing = await prisma.comprobanteFacturacion.findUnique({ where: { id } });
    if (!existing) throw new ApiError(404, "Comprobante no encontrado.");

    const socioId = body.socioId ?? existing.socioId;
    const socio = socioId ? await prisma.socio.findUnique({ where: { id: socioId } }) : null;
    if (socioId && !socio) throw new ApiError(404, "Socio no encontrado.");

    const data = {
      socioId,
      tipoComprobante: body.tipoComprobante ?? existing.tipoComprobante,
      puntoVenta: body.puntoVenta ?? existing.puntoVenta,
      numeroComprobante: body.numeroComprobante ?? existing.numeroComprobante,
      fechaEmision: body.fechaEmision ?? existing.fechaEmision,
      fechaVencimientoPago: body.fechaVencimientoPago ?? existing.fechaVencimientoPago,
      concepto: body.concepto ?? existing.concepto,
      condicionIva: body.condicionIva ?? existing.condicionIva,
      cuitDni: body.cuitDni ?? existing.cuitDni,
      razonSocial: body.razonSocial ?? existing.razonSocial,
      domicilio: body.domicilio ?? existing.domicilio,
      subtotal: body.subtotal ?? existing.subtotal,
      iva: body.iva ?? existing.iva,
      total: body.total ?? existing.total,
      moneda: body.moneda ?? existing.moneda,
      estadoArca: body.estadoArca ?? existing.estadoArca,
      estadoCobro: body.estadoCobro ?? existing.estadoCobro,
      cae: body.cae ?? existing.cae,
      vencimientoCae: body.vencimientoCae ?? existing.vencimientoCae,
      pdfUrl: body.pdfUrl ?? existing.pdfUrl,
      observaciones: body.observaciones ?? existing.observaciones,
      comprobanteRelacionadoId: body.comprobanteRelacionadoId ?? existing.comprobanteRelacionadoId,
    };

    const record = await prisma.comprobanteFacturacion.update({
      where: { id },
      data: body.items
        ? { ...data, items: { deleteMany: {}, create: body.items } }
        : data,
      include: includeInvoiceRelations(),
    });
    res.json(record);
  } catch (error) {
    next(error);
  }
});

billingRoutes.delete("/invoices/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseId(req);
    res.json(
      await prisma.comprobanteFacturacion.update({
        where: { id },
        data: { estadoCobro: "vencido", observaciones: "Baja demo solicitada. No se elimino fisicamente para conservar trazabilidad." },
        include: includeInvoiceRelations(),
      }),
    );
  } catch (error) {
    next(error);
  }
});

billingRoutes.post("/invoices/:id/mark-paid", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseId(req);
    const body = markPaidSchema.parse(req.body ?? {});
    const invoice = await prisma.comprobanteFacturacion.findUnique({ where: { id } });
    if (!invoice) throw new ApiError(404, "Comprobante no encontrado.");

    const record = await prisma.$transaction(async (tx) => {
      await tx.pagoComprobanteFacturacion.create({
        data: {
          comprobanteFacturacionId: id,
          fechaPago: body.fechaPago,
          monto: body.monto ?? Math.abs(invoice.total),
          medioPago: body.medioPago,
          referencia: body.referencia,
          observaciones: body.observaciones,
        },
      });
      return tx.comprobanteFacturacion.update({
        where: { id },
        data: { estadoCobro: "pagado" },
        include: includeInvoiceRelations(),
      });
    });
    res.json(record);
  } catch (error) {
    next(error);
  }
});

async function createRelatedNote(id: number, noteType: "nota_credito_c" | "nota_debito_c", body: z.infer<typeof relatedNoteSchema>) {
  const invoice = await prisma.comprobanteFacturacion.findUnique({
    where: { id },
    include: { socio: true },
  });
  if (!invoice) throw new ApiError(404, "Comprobante no encontrado.");

  const pointOfSale = invoice.puntoVenta ?? "0001";
  const codes = await buildCodes(noteType, pointOfSale);
  const rawTotal = body.total ?? Math.abs(invoice.total);
  const total = noteType === "nota_credito_c" ? -Math.abs(rawTotal) : Math.abs(rawTotal);
  const concepto = body.concepto ?? (noteType === "nota_credito_c" ? `Nota de credito de ${invoice.numeroComprobante}` : `Nota de debito de ${invoice.numeroComprobante}`);

  return prisma.comprobanteFacturacion.create({
    data: {
      codigoComprobante: codes.codigoComprobante,
      socioId: invoice.socioId,
      tipoComprobante: noteType,
      puntoVenta: pointOfSale,
      numeroComprobante: codes.numeroComprobante,
      fechaEmision: new Date(),
      concepto,
      condicionIva: invoice.condicionIva,
      cuitDni: invoice.cuitDni,
      razonSocial: invoice.razonSocial,
      domicilio: invoice.domicilio,
      subtotal: total,
      iva: 0,
      total,
      moneda: invoice.moneda,
      estadoArca: "pendiente",
      estadoCobro: "impago",
      observaciones: body.observaciones ?? "Comprobante relacionado generado en modo ARCA simulado.",
      comprobanteRelacionadoId: invoice.id,
      items: {
        create: [{
          descripcion: concepto,
          cantidad: 1,
          precioUnitario: Math.abs(total),
          subtotal: total,
        }],
      },
    },
    include: includeInvoiceRelations(),
  });
}

billingRoutes.post("/invoices/:id/credit-note", async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.status(201).json(await createRelatedNote(parseId(req), "nota_credito_c", relatedNoteSchema.parse(req.body ?? {})));
  } catch (error) {
    next(error);
  }
});

billingRoutes.post("/invoices/:id/debit-note", async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.status(201).json(await createRelatedNote(parseId(req), "nota_debito_c", relatedNoteSchema.parse(req.body ?? {})));
  } catch (error) {
    next(error);
  }
});

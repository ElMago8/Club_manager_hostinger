import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type DemoInvoice = {
  codigoSocio: string;
  codigoComprobante: string;
  tipoComprobante: string;
  puntoVenta: string | null;
  numeroComprobante: string | null;
  fechaEmision: string;
  fechaVencimientoPago: string | null;
  concepto: string;
  condicionIva: string;
  subtotal: number;
  iva: number;
  total: number;
  moneda: string;
  estadoArca: string;
  estadoCobro: string;
  cae: string | null;
  vencimientoCae: string | null;
  observaciones: string;
  item: {
    descripcion: string;
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
  };
  pago?: {
    fechaPago: string;
    monto: number;
    medioPago: string;
    referencia: string;
  };
};

type DemoSocio = {
  codigoSocio: string;
  nombre: string;
  apellido: string;
  dni: string;
  direccion: string;
  localidad: string;
  provincia: string;
};

const demoSocios: DemoSocio[] = [
  { codigoSocio: "HC-0001", nombre: "Lucia", apellido: "Aguirre", dni: "30000001", direccion: "Av. Demo 101", localidad: "CABA", provincia: "Buenos Aires" },
  { codigoSocio: "HC-0002", nombre: "Mateo", apellido: "Dominguez", dni: "30000002", direccion: "Av. Demo 102", localidad: "CABA", provincia: "Buenos Aires" },
  { codigoSocio: "HC-0003", nombre: "Sofia", apellido: "Gomez", dni: "30000003", direccion: "Av. Demo 103", localidad: "CABA", provincia: "Buenos Aires" },
  { codigoSocio: "HC-0004", nombre: "Bruno", apellido: "Juarez", dni: "30000004", direccion: "Av. Demo 104", localidad: "CABA", provincia: "Buenos Aires" },
  { codigoSocio: "HC-0005", nombre: "Camila", apellido: "Molina", dni: "30000005", direccion: "Av. Demo 105", localidad: "CABA", provincia: "Buenos Aires" },
  { codigoSocio: "HC-0010", nombre: "Ignacio", apellido: "Castro", dni: "30000010", direccion: "Av. Demo 110", localidad: "CABA", provincia: "Buenos Aires" },
  { codigoSocio: "HC-0009", nombre: "Valentina", apellido: "Yanez", dni: "30000009", direccion: "Av. Demo 109", localidad: "CABA", provincia: "Buenos Aires" },
  { codigoSocio: "HC-0017", nombre: "Florencia", apellido: "Ortega", dni: "30000017", direccion: "Av. Demo 117", localidad: "CABA", provincia: "Buenos Aires" },
  { codigoSocio: "HC-0018", nombre: "Agustin", apellido: "Ramirez", dni: "30000018", direccion: "Av. Demo 118", localidad: "CABA", provincia: "Buenos Aires" },
  { codigoSocio: "HC-0011", nombre: "Martina", apellido: "Falcon", dni: "30000011", direccion: "Av. Demo 111", localidad: "CABA", provincia: "Buenos Aires" },
];

const demoInvoices: DemoInvoice[] = [
  {
    codigoSocio: "HC-0001",
    codigoComprobante: "FAC-000001",
    tipoComprobante: "factura_c",
    puntoVenta: "0001",
    numeroComprobante: "0001-00000001",
    fechaEmision: "2026-06-01",
    fechaVencimientoPago: "2026-06-10",
    concepto: "Cuota mensual socio",
    condicionIva: "consumidor_final",
    subtotal: 30000,
    iva: 0,
    total: 30000,
    moneda: "ARS",
    estadoArca: "aprobado",
    estadoCobro: "pagado",
    cae: "76123456789012",
    vencimientoCae: "2026-06-11",
    observaciones: "Comprobante demo aprobado.",
    item: { descripcion: "Cuota mensual socio", cantidad: 1, precioUnitario: 30000, subtotal: 30000 },
    pago: { fechaPago: "2026-06-03", monto: 30000, medioPago: "transferencia", referencia: "TRX-DEMO-0001" },
  },
  {
    codigoSocio: "HC-0002",
    codigoComprobante: "FAC-000002",
    tipoComprobante: "factura_c",
    puntoVenta: "0001",
    numeroComprobante: "0001-00000002",
    fechaEmision: "2026-06-02",
    fechaVencimientoPago: "2026-06-12",
    concepto: "Cuota mensual socio",
    condicionIva: "consumidor_final",
    subtotal: 40000,
    iva: 0,
    total: 40000,
    moneda: "ARS",
    estadoArca: "aprobado",
    estadoCobro: "impago",
    cae: "76123456789013",
    vencimientoCae: "2026-06-12",
    observaciones: "Comprobante demo pendiente de cobro.",
    item: { descripcion: "Cuota mensual socio", cantidad: 1, precioUnitario: 40000, subtotal: 40000 },
  },
  {
    codigoSocio: "HC-0003",
    codigoComprobante: "FAC-000003",
    tipoComprobante: "factura_c",
    puntoVenta: "0001",
    numeroComprobante: "0001-00000003",
    fechaEmision: "2026-06-03",
    fechaVencimientoPago: "2026-06-13",
    concepto: "Aporte mensual paciente",
    condicionIva: "consumidor_final",
    subtotal: 50000,
    iva: 0,
    total: 50000,
    moneda: "ARS",
    estadoArca: "pendiente",
    estadoCobro: "impago",
    cae: null,
    vencimientoCae: null,
    observaciones: "Comprobante demo pendiente de aprobacion ARCA.",
    item: { descripcion: "Aporte mensual paciente", cantidad: 1, precioUnitario: 50000, subtotal: 50000 },
  },
  {
    codigoSocio: "HC-0004",
    codigoComprobante: "NC-000001",
    tipoComprobante: "nota_credito_c",
    puntoVenta: "0001",
    numeroComprobante: "0001-00000004",
    fechaEmision: "2026-06-04",
    fechaVencimientoPago: null,
    concepto: "Ajuste administrativo",
    condicionIva: "consumidor_final",
    subtotal: -10000,
    iva: 0,
    total: -10000,
    moneda: "ARS",
    estadoArca: "aprobado",
    estadoCobro: "pagado",
    cae: "76123456789014",
    vencimientoCae: "2026-06-14",
    observaciones: "Nota de credito demo por ajuste administrativo.",
    item: { descripcion: "Ajuste administrativo", cantidad: 1, precioUnitario: -10000, subtotal: -10000 },
    pago: { fechaPago: "2026-06-04", monto: -10000, medioPago: "otro", referencia: "NC-DEMO-0001" },
  },
  {
    codigoSocio: "HC-0005",
    codigoComprobante: "FAC-000004",
    tipoComprobante: "factura_c",
    puntoVenta: "0001",
    numeroComprobante: "0001-00000005",
    fechaEmision: "2026-06-05",
    fechaVencimientoPago: "2026-06-15",
    concepto: "Cuota mensual socio",
    condicionIva: "consumidor_final",
    subtotal: 80000,
    iva: 0,
    total: 80000,
    moneda: "ARS",
    estadoArca: "observado",
    estadoCobro: "parcial",
    cae: null,
    vencimientoCae: null,
    observaciones: "Comprobante observado en modo demo.",
    item: { descripcion: "Cuota mensual socio", cantidad: 1, precioUnitario: 80000, subtotal: 80000 },
    pago: { fechaPago: "2026-06-08", monto: 30000, medioPago: "mercado_pago", referencia: "MP-DEMO-0005" },
  },
  {
    codigoSocio: "HC-0010",
    codigoComprobante: "FAC-000005",
    tipoComprobante: "factura_c",
    puntoVenta: "0001",
    numeroComprobante: "0001-00000006",
    fechaEmision: "2026-05-10",
    fechaVencimientoPago: "2026-05-20",
    concepto: "Cuota mensual socio",
    condicionIva: "consumidor_final",
    subtotal: 80000,
    iva: 0,
    total: 80000,
    moneda: "ARS",
    estadoArca: "aprobado",
    estadoCobro: "vencido",
    cae: "76123456789015",
    vencimientoCae: "2026-05-20",
    observaciones: "Factura demo vencida pendiente de cobro.",
    item: { descripcion: "Cuota mensual socio", cantidad: 1, precioUnitario: 80000, subtotal: 80000 },
  },
  {
    codigoSocio: "HC-0009",
    codigoComprobante: "FAC-000006",
    tipoComprobante: "factura_c",
    puntoVenta: "0001",
    numeroComprobante: "0001-00000007",
    fechaEmision: "2026-06-06",
    fechaVencimientoPago: "2026-06-16",
    concepto: "Cuota mensual socio",
    condicionIva: "consumidor_final",
    subtotal: 60000,
    iva: 0,
    total: 60000,
    moneda: "ARS",
    estadoArca: "aprobado",
    estadoCobro: "pagado",
    cae: "76123456789016",
    vencimientoCae: "2026-06-16",
    observaciones: "Pago registrado correctamente.",
    item: { descripcion: "Cuota mensual socio", cantidad: 1, precioUnitario: 60000, subtotal: 60000 },
    pago: { fechaPago: "2026-06-07", monto: 60000, medioPago: "efectivo", referencia: "REC-DEMO-0007" },
  },
  {
    codigoSocio: "HC-0017",
    codigoComprobante: "FAC-000007",
    tipoComprobante: "factura_c",
    puntoVenta: "0001",
    numeroComprobante: "0001-00000008",
    fechaEmision: "2026-06-07",
    fechaVencimientoPago: "2026-06-17",
    concepto: "Aporte mensual paciente",
    condicionIva: "consumidor_final",
    subtotal: 40000,
    iva: 0,
    total: 40000,
    moneda: "ARS",
    estadoArca: "rechazado",
    estadoCobro: "impago",
    cae: null,
    vencimientoCae: null,
    observaciones: "Comprobante rechazado en modo demo para prueba visual.",
    item: { descripcion: "Aporte mensual paciente", cantidad: 1, precioUnitario: 40000, subtotal: 40000 },
  },
  {
    codigoSocio: "HC-0018",
    codigoComprobante: "ND-000001",
    tipoComprobante: "nota_debito_c",
    puntoVenta: "0001",
    numeroComprobante: "0001-00000009",
    fechaEmision: "2026-06-08",
    fechaVencimientoPago: "2026-06-18",
    concepto: "Diferencia administrativa",
    condicionIva: "consumidor_final",
    subtotal: 5000,
    iva: 0,
    total: 5000,
    moneda: "ARS",
    estadoArca: "pendiente",
    estadoCobro: "impago",
    cae: null,
    vencimientoCae: null,
    observaciones: "Nota de debito demo generada por diferencia administrativa.",
    item: { descripcion: "Diferencia administrativa", cantidad: 1, precioUnitario: 5000, subtotal: 5000 },
  },
  {
    codigoSocio: "HC-0011",
    codigoComprobante: "REC-000001",
    tipoComprobante: "recibo_interno",
    puntoVenta: "INT",
    numeroComprobante: "INT-00000001",
    fechaEmision: "2026-06-09",
    fechaVencimientoPago: null,
    concepto: "Recibo interno por aporte",
    condicionIva: "consumidor_final",
    subtotal: 30000,
    iva: 0,
    total: 30000,
    moneda: "ARS",
    estadoArca: "pendiente",
    estadoCobro: "pagado",
    cae: null,
    vencimientoCae: null,
    observaciones: "Recibo interno demo, no informado fiscalmente.",
    item: { descripcion: "Recibo interno por aporte", cantidad: 1, precioUnitario: 30000, subtotal: 30000 },
    pago: { fechaPago: "2026-06-09", monto: 30000, medioPago: "transferencia", referencia: "TRX-DEMO-0010" },
  },
];

function toDate(value: string | null): Date | null {
  return value ? new Date(`${value}T00:00:00.000Z`) : null;
}

function buildDomicilio(socio: { direccion: string | null; localidad: string | null; provincia: string | null }) {
  const parts = [socio.direccion, socio.localidad, socio.provincia].filter(Boolean);
  return parts.length ? parts.join(", ") : null;
}

async function main() {
  let socios = 0;
  let comprobantes = 0;
  let items = 0;
  let pagos = 0;
  const omitted: string[] = [];

  for (const socio of demoSocios) {
    await prisma.socio.upsert({
      where: { codigoSocio: socio.codigoSocio },
      update: {
        nombre: socio.nombre,
        apellido: socio.apellido,
        dni: socio.dni,
        direccion: socio.direccion,
        localidad: socio.localidad,
        provincia: socio.provincia,
        estado: "activo",
        observaciones: "Socio demo creado para Facturacion ARCA.",
      },
      create: {
        codigoSocio: socio.codigoSocio,
        nombre: socio.nombre,
        apellido: socio.apellido,
        dni: socio.dni,
        direccion: socio.direccion,
        localidad: socio.localidad,
        provincia: socio.provincia,
        estado: "activo",
        cupoMensualGramos: 40,
        observaciones: "Socio demo creado para Facturacion ARCA.",
      },
    });
    socios += 1;
  }

  for (const invoice of demoInvoices) {
    const socio = await prisma.socio.findUnique({
      where: { codigoSocio: invoice.codigoSocio },
      select: {
        id: true,
        codigoSocio: true,
        nombre: true,
        apellido: true,
        dni: true,
        direccion: true,
        localidad: true,
        provincia: true,
      },
    });

    if (!socio) {
      omitted.push(invoice.codigoSocio);
      continue;
    }

    await prisma.$transaction(async (tx) => {
      const comprobante = await tx.comprobanteFacturacion.upsert({
        where: { codigoComprobante: invoice.codigoComprobante },
        update: {
          socioId: socio.id,
          tipoComprobante: invoice.tipoComprobante,
          puntoVenta: invoice.puntoVenta,
          numeroComprobante: invoice.numeroComprobante,
          fechaEmision: toDate(invoice.fechaEmision)!,
          fechaVencimientoPago: toDate(invoice.fechaVencimientoPago),
          concepto: invoice.concepto,
          condicionIva: invoice.condicionIva,
          cuitDni: socio.dni,
          razonSocial: `${socio.nombre} ${socio.apellido}`.trim(),
          domicilio: buildDomicilio(socio),
          subtotal: invoice.subtotal,
          iva: invoice.iva,
          total: invoice.total,
          moneda: invoice.moneda,
          estadoArca: invoice.estadoArca,
          estadoCobro: invoice.estadoCobro,
          cae: invoice.cae,
          vencimientoCae: toDate(invoice.vencimientoCae),
          observaciones: invoice.observaciones,
        },
        create: {
          codigoComprobante: invoice.codigoComprobante,
          socioId: socio.id,
          tipoComprobante: invoice.tipoComprobante,
          puntoVenta: invoice.puntoVenta,
          numeroComprobante: invoice.numeroComprobante,
          fechaEmision: toDate(invoice.fechaEmision)!,
          fechaVencimientoPago: toDate(invoice.fechaVencimientoPago),
          concepto: invoice.concepto,
          condicionIva: invoice.condicionIva,
          cuitDni: socio.dni,
          razonSocial: `${socio.nombre} ${socio.apellido}`.trim(),
          domicilio: buildDomicilio(socio),
          subtotal: invoice.subtotal,
          iva: invoice.iva,
          total: invoice.total,
          moneda: invoice.moneda,
          estadoArca: invoice.estadoArca,
          estadoCobro: invoice.estadoCobro,
          cae: invoice.cae,
          vencimientoCae: toDate(invoice.vencimientoCae),
          observaciones: invoice.observaciones,
        },
      });

      await tx.itemComprobanteFacturacion.deleteMany({
        where: { comprobanteFacturacionId: comprobante.id },
      });
      await tx.itemComprobanteFacturacion.create({
        data: {
          comprobanteFacturacionId: comprobante.id,
          descripcion: invoice.item.descripcion,
          cantidad: invoice.item.cantidad,
          precioUnitario: invoice.item.precioUnitario,
          subtotal: invoice.item.subtotal,
        },
      });

      await tx.pagoComprobanteFacturacion.deleteMany({
        where: { comprobanteFacturacionId: comprobante.id },
      });

      if (invoice.pago && (invoice.estadoCobro === "pagado" || invoice.estadoCobro === "parcial")) {
        await tx.pagoComprobanteFacturacion.create({
          data: {
            comprobanteFacturacionId: comprobante.id,
            fechaPago: toDate(invoice.pago.fechaPago)!,
            monto: invoice.pago.monto,
            medioPago: invoice.pago.medioPago,
            referencia: invoice.pago.referencia,
          },
        });
        pagos += 1;
      }

      comprobantes += 1;
      items += 1;
    });
  }

  console.log("Seed Facturacion ARCA demo completado.");
  console.log(`Socios creados/actualizados: ${socios}`);
  console.log(`Comprobantes creados/actualizados: ${comprobantes}`);
  console.log(`Items creados/actualizados: ${items}`);
  console.log(`Pagos creados/actualizados: ${pagos}`);
  console.log(`Socios omitidos: ${omitted.length ? omitted.join(", ") : "ninguno"}`);
}

main()
  .catch((error) => {
    console.error("Error ejecutando seed Facturacion ARCA demo:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

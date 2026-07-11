const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const app = express();

const allowedOrigins = [
  "https://demo-ccm.programate.ar",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:8080",
  "http://localhost:8081",
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("CORS origin not allowed"));
  },
}));

app.use(express.json());

// ─── Health ───────────────────────────────────────────────────────────────────

app.get("/", (_req, res) => {
  res.json({ ok: true, service: "cannabis-club-manager-api", version: "2.0.0" });
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "cannabis-club-manager-api", timestamp: new Date().toISOString() });
});

// ─── Dashboard ────────────────────────────────────────────────────────────────

app.get("/api/dashboard", async (_req, res) => {
  const [
    totalSocios, sociosActivos,
    totalPlantas, plantasActivas, plantasVegetativas, plantasFloración,
    totalSalas,
    ultimasCosechas,
    lotesDisponibles,
    pendientesFacturacion,
  ] = await Promise.all([
    prisma.socio.count(),
    prisma.socio.count({ where: { estado: "activo" } }),
    prisma.planta.count(),
    prisma.planta.count({ where: { estado: "activa" } }),
    prisma.planta.count({ where: { estado: "activa", etapa: "vegetativa" } }),
    prisma.planta.count({ where: { estado: "activa", etapa: "floracion" } }),
    prisma.salaCultivo.count({ where: { estado: "activa" } }),
    prisma.cosecha.findMany({ orderBy: { fechaCosecha: "desc" }, take: 5, include: { loteCultivo: { include: { genetica: true } } } }),
    prisma.loteProducto.count({ where: { estado: "disponible" } }),
    prisma.comprobanteFacturacion.count({ where: { estadoCobro: "impago" } }),
  ]);

  res.json({
    ok: true,
    data: {
      socios: { total: totalSocios, activos: sociosActivos, inactivos: totalSocios - sociosActivos },
      cultivo: {
        totalPlantas, plantasActivas,
        porEtapa: { vegetativa: plantasVegetativas, floracion: plantasFloración },
        totalSalas,
      },
      cosechas: {
        total: ultimasCosechas.length,
        ultimas: ultimasCosechas.map(c => ({
          id: c.id,
          codigo: c.codigoCosecha,
          genetica: c.loteCultivo?.genetica?.nombre ?? "—",
          fechaCosecha: c.fechaCosecha,
          pesoSecoGramos: c.pesoSecoGramos,
          estado: c.estado,
        })),
      },
      stock: { lotesDisponibles },
      facturacion: { pendientescobro: pendientesFacturacion },
    },
  });
});

// ─── Socios ───────────────────────────────────────────────────────────────────

app.get("/api/socios", async (_req, res) => {
  const socios = await prisma.socio.findMany({
    orderBy: { apellido: "asc" },
    include: {
      documentos: { select: { id: true, tipoDocumento: true, estado: true, fechaVencimiento: true } },
    },
  });
  res.json({ ok: true, total: socios.length, data: socios });
});

app.get("/api/socios/:id", async (req, res) => {
  const socio = await prisma.socio.findUnique({
    where: { id: Number(req.params.id) },
    include: {
      documentos: true,
      comprobantes: { orderBy: { fechaEmision: "desc" }, take: 10 },
    },
  });
  if (!socio) return res.status(404).json({ ok: false, message: "Socio no encontrado" });
  res.json({ ok: true, data: socio });
});

// ─── Cultivo ─────────────────────────────────────────────────────────────────

app.get("/api/cultivo", async (_req, res) => {
  const [salas, totalPlantas, totalCosechas, totalMadres] = await Promise.all([
    prisma.salaCultivo.count({ where: { estado: "activa" } }),
    prisma.planta.count({ where: { estado: "activa" } }),
    prisma.cosecha.count(),
    prisma.madre.count({ where: { estado: "activa" } }),
  ]);
  res.json({ ok: true, data: { salas, totalPlantas, totalCosechas, totalMadres } });
});

app.get("/api/cultivo/salas", async (_req, res) => {
  const salas = await prisma.salaCultivo.findMany({
    orderBy: { nombre: "asc" },
    include: {
      _count: { select: { plantas: true, camillas: true, madres: true } },
    },
  });
  res.json({ ok: true, total: salas.length, data: salas });
});

app.get("/api/cultivo/plantas", async (_req, res) => {
  const plantas = await prisma.planta.findMany({
    where: { estado: "activa" },
    orderBy: { fechaInicio: "desc" },
    include: {
      genetica: { select: { id: true, nombre: true, tipo: true } },
      camilla: { select: { id: true, nombre: true, codigoCamilla: true } },
      loteCultivo: { select: { id: true, codigoLote: true, estado: true } },
    },
  });
  res.json({ ok: true, total: plantas.length, data: plantas });
});

app.get("/api/cultivo/cosechas", async (_req, res) => {
  const cosechas = await prisma.cosecha.findMany({
    orderBy: { fechaCosecha: "desc" },
    include: {
      loteCultivo: { include: { genetica: { select: { id: true, nombre: true, tipo: true } } } },
      salaCultivo: { select: { id: true, nombre: true } },
    },
  });
  res.json({ ok: true, total: cosechas.length, data: cosechas });
});

// ─── Stock ────────────────────────────────────────────────────────────────────

app.get("/api/stock", async (_req, res) => {
  const lotes = await prisma.loteProducto.findMany({
    orderBy: { fechaIngreso: "desc" },
    include: {
      producto: { select: { id: true, nombre: true, tipoProducto: true, unidadMedida: true } },
      genetica: { select: { id: true, nombre: true } },
      ubicacionStock: { select: { id: true, nombre: true } },
      cosecha: { select: { id: true, codigoCosecha: true } },
    },
  });
  res.json({ ok: true, total: lotes.length, data: lotes });
});

app.get("/api/stock/alertas", async (_req, res) => {
  // Lotes disponibles con menos de 50g o menos de 10% de la cantidad inicial
  const lotes = await prisma.loteProducto.findMany({
    where: { estado: "disponible" },
    include: {
      producto: { select: { id: true, nombre: true, tipoProducto: true, unidadMedida: true } },
    },
  });
  const alertas = lotes.filter(l =>
    l.cantidadInicial > 0 && (l.cantidadDisponible / l.cantidadInicial) < 0.15
  );
  res.json({ ok: true, total: alertas.length, data: alertas });
});

// ─── Facturación ──────────────────────────────────────────────────────────────

app.get("/api/facturacion", async (_req, res) => {
  const comprobantes = await prisma.comprobanteFacturacion.findMany({
    orderBy: { fechaEmision: "desc" },
    include: {
      socio: { select: { id: true, nombre: true, apellido: true, codigoSocio: true } },
      items: true,
    },
  });
  res.json({ ok: true, total: comprobantes.length, data: comprobantes });
});

app.get("/api/facturacion/:id", async (req, res) => {
  const comprobante = await prisma.comprobanteFacturacion.findUnique({
    where: { id: Number(req.params.id) },
    include: {
      socio: true,
      items: true,
      pagos: true,
    },
  });
  if (!comprobante) return res.status(404).json({ ok: false, message: "Comprobante no encontrado" });
  res.json({ ok: true, data: comprobante });
});

// ─── Auditoría (actividad reciente) ──────────────────────────────────────────

app.get("/api/auditoria", async (_req, res) => {
  const [sociosRecientes, cosechasRecientes, comprobantesRecientes] = await Promise.all([
    prisma.socio.findMany({ orderBy: { creadoEn: "desc" }, take: 10, select: { id: true, nombre: true, apellido: true, creadoEn: true, estado: true } }),
    prisma.cosecha.findMany({ orderBy: { creadoEn: "desc" }, take: 10, select: { id: true, codigoCosecha: true, creadoEn: true, estado: true } }),
    prisma.comprobanteFacturacion.findMany({ orderBy: { creadoEn: "desc" }, take: 10, select: { id: true, codigoComprobante: true, total: true, estadoCobro: true, creadoEn: true } }),
  ]);

  const actividad = [
    ...sociosRecientes.map(s => ({ tipo: "socio", accion: "Alta socio", entidad: `${s.nombre} ${s.apellido}`, fecha: s.creadoEn, estado: s.estado })),
    ...cosechasRecientes.map(c => ({ tipo: "cosecha", accion: "Registro cosecha", entidad: c.codigoCosecha, fecha: c.creadoEn, estado: c.estado })),
    ...comprobantesRecientes.map(f => ({ tipo: "facturacion", accion: "Comprobante emitido", entidad: f.codigoComprobante, fecha: f.creadoEn, estado: f.estadoCobro })),
  ].sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).slice(0, 30);

  res.json({ ok: true, total: actividad.length, data: actividad });
});

// ─── Shutdown limpio ─────────────────────────────────────────────────────────

process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

module.exports = { app };

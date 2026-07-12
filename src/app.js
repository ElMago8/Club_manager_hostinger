const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

// Prisma resuelve rutas relativas desde su propio binario, no desde process.cwd().
// Convertimos a ruta absoluta antes de que Prisma lo lea.
if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith("file:./")) {
  const rel = process.env.DATABASE_URL.replace("file:./", "");
  process.env.DATABASE_URL = "file:" + path.resolve(process.cwd(), rel);
}

const dbUrl = process.env.DATABASE_URL ?? "";
const dbFilePath = dbUrl.replace(/^file:/, "");
console.log("DATABASE_URL (resolved):", dbUrl);
console.log("DB file exists:", (() => { try { return fs.existsSync(dbFilePath); } catch { return "error"; } })());
console.log("DB writable:", (() => { try { fs.accessSync(dbFilePath, fs.constants.W_OK); return true; } catch { return false; } })());

const prisma = new PrismaClient();
const app = express();
const Router = express.Router;

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function id(req) { return Number(req.params.id); }

function notFound(res, msg = "No encontrado") {
  return res.status(404).json({ message: msg });
}

function errHandler(err, _req, res, _next) {
  console.error("API_ERR:", err.code ?? "", err.message, err.meta ? JSON.stringify(err.meta) : "");
  const status = err.statusCode ?? err.status ?? 500;
  res.status(status).json({ message: err.message ?? "Error interno", code: err.code, meta: err.meta });
}

// CRUD básico para un modelo Prisma
function crudRouter(model, opts = {}) {
  const { include, orderBy = { id: "desc" }, filters } = opts;
  const r = Router();

  r.get("/", async (req, res, next) => {
    try {
      const where = filters ? filters(req.query) : undefined;
      res.json(await model.findMany({ where, include, orderBy }));
    } catch (e) { next(e); }
  });

  r.post("/", async (req, res, next) => {
    try {
      res.status(201).json(await model.create({ data: req.body, include }));
    } catch (e) { next(e); }
  });

  r.get("/:id", async (req, res, next) => {
    try {
      const record = await model.findUnique({ where: { id: id(req) }, include });
      if (!record) return notFound(res);
      res.json(record);
    } catch (e) { next(e); }
  });

  r.put("/:id", async (req, res, next) => {
    try {
      res.json(await model.update({ where: { id: id(req) }, data: req.body, include }));
    } catch (e) { next(e); }
  });

  r.delete("/:id", async (req, res, next) => {
    try {
      res.json(await model.delete({ where: { id: id(req) } }));
    } catch (e) { next(e); }
  });

  return r;
}

// ─── Health & Debug ───────────────────────────────────────────────────────────

app.get("/", (_req, res) => res.json({ ok: true, service: "cannabis-club-manager-api", version: "2.0.0" }));
app.get("/api/health", (_req, res) => res.json({ ok: true, service: "cannabis-club-manager-api", timestamp: new Date().toISOString() }));
app.get("/api/debug", (_req, res) => {
  const url = process.env.DATABASE_URL ?? "(no definida)";
  const filePath = url.replace(/^file:/, "");
  let exists = false;
  let stat = null;
  try { stat = fs.statSync(filePath); exists = true; } catch (e) { stat = e.message; }
  res.json({ cwd: process.cwd(), dirname: __dirname, DATABASE_URL: url, filePath, fileExists: exists, stat });
});

// ─── Auth ────────────────────────────────────────────────────────────────────

app.post("/api/auth/login", async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const usuario = await prisma.usuario.findUnique({
      where: { username },
      include: {
        roles: { include: { rol: { include: { permisos: { include: { permiso: true } } } } } },
      },
    });

    if (!usuario) return res.status(401).json({ message: "Credenciales inválidas." });
    if (usuario.estado !== "activo") return res.status(403).json({ message: "El usuario no está activo." });

    const ok = await bcrypt.compare(password, usuario.passwordHash);
    if (!ok) return res.status(401).json({ message: "Credenciales inválidas." });

    await prisma.usuario.update({ where: { id: usuario.id }, data: { ultimoLoginEn: new Date() } });

    const roles = usuario.roles.map(ur => ({ id: ur.rol.id, slug: ur.rol.slug, nombre: ur.rol.nombre }));
    const permisosMap = new Map();
    for (const ur of usuario.roles) {
      for (const rp of ur.rol.permisos) {
        permisosMap.set(rp.permiso.id, { id: rp.permiso.id, clavePermiso: rp.permiso.clavePermiso, modulo: rp.permiso.modulo, accion: rp.permiso.accion });
      }
    }

    res.json({
      usuario: { id: usuario.id, codigoUsuario: usuario.codigoUsuario, username: usuario.username, nombre: usuario.nombre, apellido: usuario.apellido, email: usuario.email, estado: usuario.estado, ultimoLoginEn: usuario.ultimoLoginEn },
      roles,
      permisos: Array.from(permisosMap.values()),
    });
  } catch (e) { next(e); }
});

// ─── Members ─────────────────────────────────────────────────────────────────

const memberRouter = Router();

memberRouter.get("/", async (_req, res, next) => {
  try {
    res.json(await prisma.socio.findMany({ orderBy: { apellido: "asc" } }));
  } catch (e) { next(e); }
});

memberRouter.post("/", async (req, res, next) => {
  try {
    res.status(201).json(await prisma.socio.create({ data: req.body }));
  } catch (e) { next(e); }
});

memberRouter.get("/:id", async (req, res, next) => {
  try {
    const record = await prisma.socio.findUnique({ where: { id: id(req) }, include: { documentos: true, comprobantes: { orderBy: { fechaEmision: "desc" }, take: 20 } } });
    if (!record) return notFound(res, "Socio no encontrado");
    res.json(record);
  } catch (e) { next(e); }
});

memberRouter.put("/:id", async (req, res, next) => {
  try {
    res.json(await prisma.socio.update({ where: { id: id(req) }, data: req.body }));
  } catch (e) { next(e); }
});

memberRouter.delete("/:id", async (req, res, next) => {
  try {
    res.json(await prisma.socio.delete({ where: { id: id(req) } }));
  } catch (e) { next(e); }
});

// Documentos de socio (stub — sin manejo de archivos en demo)
memberRouter.get("/:id/documents", async (req, res, next) => {
  try {
    res.json(await prisma.documentoSocio.findMany({ where: { socioId: id(req) } }));
  } catch (e) { next(e); }
});
memberRouter.post("/:id/documents", async (req, res, next) => {
  try {
    res.status(201).json(await prisma.documentoSocio.create({ data: { socioId: id(req), ...req.body } }));
  } catch (e) { next(e); }
});

app.use("/api/members", memberRouter);

// Member documents standalone routes
app.get("/api/member-documents/:id", async (req, res, next) => {
  try {
    const doc = await prisma.documentoSocio.findUnique({ where: { id: id(req) } });
    if (!doc) return notFound(res);
    res.json(doc);
  } catch (e) { next(e); }
});
app.put("/api/member-documents/:id", async (req, res, next) => {
  try {
    res.json(await prisma.documentoSocio.update({ where: { id: id(req) }, data: req.body }));
  } catch (e) { next(e); }
});
app.delete("/api/member-documents/:id", async (req, res, next) => {
  try {
    res.json(await prisma.documentoSocio.delete({ where: { id: id(req) } }));
  } catch (e) { next(e); }
});

// ─── Cultivation ─────────────────────────────────────────────────────────────

const cultivationRouter = Router();

// Rooms (salas)
cultivationRouter.use("/rooms", crudRouter(prisma.salaCultivo, { orderBy: { id: "desc" } }));

// Beds (camillas)
const bedRouter = Router();
const bedInclude = { _count: { select: { plantas: { where: { estado: { notIn: ["descartada", "discarded"] } } } } } };

bedRouter.get("/", async (_req, res, next) => {
  try { res.json(await prisma.camilla.findMany({ include: bedInclude, orderBy: { id: "desc" } })); }
  catch (e) { next(e); }
});
bedRouter.post("/", async (req, res, next) => {
  try { res.status(201).json(await prisma.camilla.create({ data: req.body, include: bedInclude })); }
  catch (e) { next(e); }
});
bedRouter.get("/:id/occupancy", async (req, res, next) => {
  try {
    const bedId = id(req);
    const camilla = await prisma.camilla.findUnique({ where: { id: bedId } });
    if (!camilla) return notFound(res);
    const occupied = await prisma.planta.count({ where: { camillaId: bedId, estado: { notIn: ["descartada", "discarded"] } } });
    const available = Math.max(camilla.capacidadMaximaPlantas - occupied, 0);
    res.json({ bedId: String(bedId), maxPlants: camilla.capacidadMaximaPlantas, occupied, available, occupancyPercentage: camilla.capacidadMaximaPlantas > 0 ? +((occupied / camilla.capacidadMaximaPlantas) * 100).toFixed(1) : 0 });
  } catch (e) { next(e); }
});
bedRouter.patch("/:id/capacity", async (req, res, next) => {
  try {
    const maxPlants = Number(req.body.maxPlants ?? req.body.capacidadMaximaPlantas);
    res.json(await prisma.camilla.update({ where: { id: id(req) }, data: { capacidadMaximaPlantas: maxPlants }, include: bedInclude }));
  } catch (e) { next(e); }
});
bedRouter.get("/:id", async (req, res, next) => {
  try {
    const record = await prisma.camilla.findUnique({ where: { id: id(req) }, include: { plantas: true, ...bedInclude } });
    if (!record) return notFound(res);
    res.json(record);
  } catch (e) { next(e); }
});
bedRouter.put("/:id", async (req, res, next) => {
  try { res.json(await prisma.camilla.update({ where: { id: id(req) }, data: req.body, include: bedInclude })); }
  catch (e) { next(e); }
});
bedRouter.delete("/:id", async (req, res, next) => {
  try { res.json(await prisma.camilla.delete({ where: { id: id(req) } })); }
  catch (e) { next(e); }
});
cultivationRouter.use("/beds", bedRouter);

// Genetics
cultivationRouter.use("/genetics", crudRouter(prisma.genetica, { orderBy: { id: "desc" } }));

// Mothers
cultivationRouter.use("/mothers", crudRouter(prisma.madre, {
  include: { genetica: true, salaCultivo: true, camilla: true, _count: { select: { plantas: true } } },
  orderBy: { id: "desc" },
}));

// Batches (lotes de cultivo)
cultivationRouter.use("/batches", crudRouter(prisma.loteCultivo, {
  include: { genetica: true, salaCultivo: true },
  orderBy: { id: "desc" },
}));

// Plants
const plantRouter = Router();
const plantInclude = { camilla: true, genetica: true, madre: true, loteCultivo: true };

plantRouter.get("/", async (req, res, next) => {
  try {
    const q = req.query;
    res.json(await prisma.planta.findMany({
      where: {
        camillaId: q.bedId ? Number(q.bedId) : undefined,
        clonadorId: q.clonadorId ? Number(q.clonadorId) : undefined,
        geneticaId: q.geneticsId ? Number(q.geneticsId) : undefined,
        loteCultivoId: q.batchId ? Number(q.batchId) : undefined,
        madreId: q.motherPlantId ? Number(q.motherPlantId) : undefined,
        etapa: q.stage ? String(q.stage) : undefined,
        estado: q.status ? String(q.status) : undefined,
      },
      include: plantInclude,
      orderBy: [{ camillaId: "asc" }, { posicionCamilla: "asc" }],
    }));
  } catch (e) { next(e); }
});
plantRouter.post("/", async (req, res, next) => {
  try {
    res.status(201).json(await prisma.planta.create({ data: req.body, include: plantInclude }));
  } catch (e) { next(e); }
});
plantRouter.post("/bulk", async (req, res, next) => {
  try {
    const { bedId, count, internalCodePrefix = "PLANT", batchId, geneticsId, motherPlantId, origin, stage, status = "normal", startDate, notes } = req.body;
    const camilla = await prisma.camilla.findUnique({ where: { id: Number(bedId) } });
    if (!camilla) return notFound(res, "Camilla no encontrada");

    const occupied = new Set((await prisma.planta.findMany({ where: { camillaId: Number(bedId), estado: { notIn: ["descartada", "discarded"] } }, select: { posicionCamilla: true } })).map(p => p.posicionCamilla));
    const freePositions = Array.from({ length: Math.min(camilla.capacidadMaximaPlantas, 100) }, (_, i) => i + 1).filter(p => !occupied.has(p));

    const existing = await prisma.planta.findMany({ where: { codigoPlanta: { startsWith: `${internalCodePrefix}-` } }, select: { codigoPlanta: true } });
    let maxSeq = 0;
    for (const { codigoPlanta } of existing) {
      const m = codigoPlanta.match(/-(\d+)$/);
      if (m && Number(m[1]) > maxSeq) maxSeq = Number(m[1]);
    }

    const created = [];
    for (let i = 0; i < Number(count); i++) {
      const pos = freePositions[i];
      const seq = String(maxSeq + i + 1).padStart(4, "0");
      const codigoPlanta = `${internalCodePrefix}-${seq}`;
      created.push(await prisma.planta.create({
        data: { codigoPlanta, nombrePlanta: codigoPlanta, camillaId: Number(bedId), posicionCamilla: pos, loteCultivoId: batchId ? Number(batchId) : undefined, geneticaId: Number(geneticsId), madreId: motherPlantId ? Number(motherPlantId) : undefined, origen: origin, etapa: stage, estado: status, fechaInicio: new Date(startDate), observaciones: notes ?? undefined },
        include: plantInclude,
      }));
    }
    res.status(201).json(created);
  } catch (e) { next(e); }
});
plantRouter.patch("/:id/stage", async (req, res, next) => {
  try {
    const etapa = req.body.etapa ?? req.body.stage;
    const fechaInicioEtapa = req.body.fechaInicioEtapa ?? req.body.stageStartDate;
    res.json(await prisma.planta.update({ where: { id: id(req) }, data: { etapa, fechaInicioEtapa: fechaInicioEtapa ? new Date(fechaInicioEtapa) : undefined }, include: plantInclude }));
  } catch (e) { next(e); }
});
plantRouter.patch("/:id/status", async (req, res, next) => {
  try {
    const estado = req.body.estado ?? req.body.status;
    res.json(await prisma.planta.update({ where: { id: id(req) }, data: { estado }, include: plantInclude }));
  } catch (e) { next(e); }
});
plantRouter.get("/:id", async (req, res, next) => {
  try {
    const record = await prisma.planta.findUnique({ where: { id: id(req) }, include: plantInclude });
    if (!record) return notFound(res);
    res.json(record);
  } catch (e) { next(e); }
});
plantRouter.put("/:id", async (req, res, next) => {
  try { res.json(await prisma.planta.update({ where: { id: id(req) }, data: req.body, include: plantInclude })); }
  catch (e) { next(e); }
});
plantRouter.delete("/:id", async (req, res, next) => {
  try { res.json(await prisma.planta.delete({ where: { id: id(req) } })); }
  catch (e) { next(e); }
});
cultivationRouter.use("/plants", plantRouter);

// Environmental logs
function envLogSvp(t) { return 0.61078 * Math.exp((17.27 * t) / (t + 237.3)); }
function calcVPD(airTempC, rh, leafTempC) {
  const leaf = leafTempC ?? airTempC - 2.8;
  return +((envLogSvp(leaf) - envLogSvp(airTempC) * (rh / 100)).toFixed(2));
}
function vpdStatus(vpd) {
  if (vpd < 0.8) return "low";
  if (vpd <= 1.4) return "optimal";
  if (vpd <= 1.8) return "high";
  return "critical";
}
function envLogToApi(r) {
  const dt = new Date(r.registradoEn);
  return {
    id: String(r.id),
    bedId: r.camillaId != null ? String(r.camillaId) : null,
    batchId: null,
    date: dt.toISOString().slice(0, 10),
    time: `${String(dt.getHours()).padStart(2, "0")}:${String(dt.getMinutes()).padStart(2, "0")}`,
    airTempC: r.temperatura,
    relativeHumidity: r.humedad,
    leafTempC: null,
    co2ppm: r.co2 ?? null,
    calculatedVPD: r.vpd ?? null,
    vpdStatus: r.vpd != null ? vpdStatus(r.vpd) : null,
    notes: r.observaciones ?? null,
    bed: { roomId: String(r.salaCultivoId) },
  };
}
const envRouter = Router();
envRouter.get("/", async (_req, res, next) => {
  try { res.json((await prisma.registroAmbiental.findMany({ orderBy: { id: "desc" } })).map(envLogToApi)); }
  catch (e) { next(e); }
});
envRouter.post("/", async (req, res, next) => {
  try {
    const b = req.body;
    const vpd = calcVPD(Number(b.airTempC), Number(b.relativeHumidity), b.leafTempC ? Number(b.leafTempC) : undefined);
    const record = await prisma.registroAmbiental.create({
      data: { salaCultivoId: Number(b.roomId), camillaId: b.bedId && b.bedId !== "none" ? Number(b.bedId) : undefined, temperatura: Number(b.airTempC), humedad: Number(b.relativeHumidity), vpd, co2: b.co2ppm ? Math.round(Number(b.co2ppm)) : undefined, observaciones: b.notes ?? undefined, registradoEn: new Date(`${b.date}T${b.time}:00`) },
    });
    res.status(201).json(envLogToApi(record));
  } catch (e) { next(e); }
});
envRouter.delete("/:id", async (req, res, next) => {
  try { await prisma.registroAmbiental.delete({ where: { id: id(req) } }); res.json({ ok: true }); }
  catch (e) { next(e); }
});
cultivationRouter.use("/environmental-logs", envRouter);

// VPD preview
cultivationRouter.post("/vpd/preview", (req, res, next) => {
  try {
    const vpd = calcVPD(Number(req.body.airTempC), Number(req.body.relativeHumidity), req.body.leafTempC ? Number(req.body.leafTempC) : undefined);
    res.json({ calculatedVPD: vpd, vpdStatus: vpdStatus(vpd) });
  } catch (e) { next(e); }
});

// Measurements
cultivationRouter.use("/measurements", crudRouter(prisma.medicionCultivo, {
  include: { salaCultivo: { select: { id: true, nombre: true } }, camilla: { select: { id: true, nombre: true } }, planta: { select: { id: true, codigoPlanta: true, nombrePlanta: true } }, madre: { select: { id: true, codigoMadre: true, nombreMadre: true } } },
  orderBy: [{ fecha: "desc" }],
}));

// Tasks
cultivationRouter.use("/tasks", crudRouter(prisma.tareaCultivo, { orderBy: { id: "desc" } }));
cultivationRouter.use("/operational-tasks", crudRouter(prisma.tareaCultivo, { orderBy: { id: "desc" } }));

// Harvests (cosechas)
cultivationRouter.use("/harvests", crudRouter(prisma.cosecha, {
  include: { loteCultivo: { include: { genetica: true, salaCultivo: true } }, salaCultivo: true },
  orderBy: { id: "desc" },
}));

// Clonadores
const clonadorInclude = { _count: { select: { esquejes: { where: { estado: { notIn: ["descartada", "discarded"] } } } } } };
const clonadorRouter = crudRouter(prisma.clonador, { include: clonadorInclude, orderBy: { id: "desc" } });
clonadorRouter.get("/:id/occupancy", async (req, res, next) => {
  try {
    const [clon, active] = await Promise.all([
      prisma.clonador.findUnique({ where: { id: id(req) }, select: { capacidadMaximaEsquejes: true } }),
      prisma.planta.count({ where: { clonadorId: id(req), estado: { notIn: ["descartada", "discarded"] } } }),
    ]);
    if (!clon) return notFound(res);
    res.json({ maxPlants: clon.capacidadMaximaEsquejes, occupied: active, available: Math.max(clon.capacidadMaximaEsquejes - active, 0), occupancyPercentage: clon.capacidadMaximaEsquejes > 0 ? Math.round((active / clon.capacidadMaximaEsquejes) * 100) : 0 });
  } catch (e) { next(e); }
});
clonadorRouter.post("/:id/bulk", async (req, res, next) => {
  try {
    const clonadorId = id(req);
    const { count, internalCodePrefix = "ESQ", geneticsId, motherPlantId, batchId, origin = "esqueje", stage = "vegetativo", status = "normal", startDate, notes } = req.body;
    const clonador = await prisma.clonador.findUnique({ where: { id: clonadorId } });
    if (!clonador) return notFound(res);

    const occupiedPos = await prisma.planta.findMany({ where: { clonadorId, estado: { notIn: ["descartada", "discarded"] } }, select: { posicionClonador: true } });
    const occupiedSet = new Set(occupiedPos.map(p => p.posicionClonador).filter(Boolean));
    const freePositions = Array.from({ length: Math.min(clonador.capacidadMaximaEsquejes, 60) }, (_, i) => i + 1).filter(p => !occupiedSet.has(p));

    const existing = await prisma.planta.findMany({ where: { codigoPlanta: { startsWith: `${internalCodePrefix}-` } }, select: { codigoPlanta: true } });
    let maxSeq = 0;
    for (const { codigoPlanta } of existing) {
      const m = codigoPlanta.match(/-(\d+)$/);
      if (m && Number(m[1]) > maxSeq) maxSeq = Number(m[1]);
    }

    const plantIncl = { genetica: true, madre: true, clonador: true };
    const created = [];
    for (let i = 0; i < Number(count); i++) {
      const pos = freePositions[i];
      const seq = String(maxSeq + i + 1).padStart(4, "0");
      const codigoPlanta = `${internalCodePrefix}-${seq}`;
      created.push(await prisma.planta.create({
        data: { codigoPlanta, nombrePlanta: codigoPlanta, clonadorId, posicionClonador: pos, geneticaId: Number(geneticsId), madreId: motherPlantId ? Number(motherPlantId) : undefined, loteCultivoId: batchId ? Number(batchId) : undefined, origen: origin, etapa: stage, estado: status, fechaInicio: new Date(startDate), observaciones: notes ?? undefined },
        include: plantIncl,
      }));
    }
    res.status(201).json(created);
  } catch (e) { next(e); }
});
clonadorRouter.post("/:id/send-to-camilla", async (req, res, next) => {
  try {
    const { plantIds, targetCamillaId } = req.body;
    const occupied = await prisma.planta.findMany({ where: { camillaId: Number(targetCamillaId), estado: { notIn: ["descartada", "discarded"] } }, select: { posicionCamilla: true } });
    const occupiedSet = new Set(occupied.map(p => p.posicionCamilla).filter(Boolean));
    let nextPos = 1;
    await Promise.all(plantIds.map(plantId => {
      while (occupiedSet.has(nextPos)) nextPos++;
      const pos = nextPos++;
      occupiedSet.add(pos);
      return prisma.planta.update({ where: { id: Number(plantId) }, data: { camillaId: Number(targetCamillaId), posicionCamilla: pos, clonadorId: null, posicionClonador: null } });
    }));
    res.json({ moved: plantIds.length });
  } catch (e) { next(e); }
});
cultivationRouter.use("/clonadores", clonadorRouter);

// Irrigation systems
cultivationRouter.use("/irrigation-systems", crudRouter(prisma.sistemaRiego, {
  include: { camilla: { select: { nombre: true, codigoCamilla: true } } },
  orderBy: { id: "desc" },
}));

// Irrigation logs
cultivationRouter.use("/irrigation-logs", crudRouter(prisma.riego, { orderBy: { id: "desc" } }));

app.use("/api/cultivation", cultivationRouter);

// ─── Products ─────────────────────────────────────────────────────────────────

const productRouter = Router();
productRouter.get("/", async (_req, res, next) => {
  try { res.json(await prisma.producto.findMany({ include: { categoria: true }, orderBy: { nombre: "asc" } })); }
  catch (e) { next(e); }
});
productRouter.post("/", async (req, res, next) => {
  try { res.status(201).json(await prisma.producto.create({ data: req.body })); }
  catch (e) { next(e); }
});
productRouter.get("/categories", async (_req, res, next) => {
  try { res.json(await prisma.categoriaProducto.findMany({ orderBy: { nombre: "asc" } })); }
  catch (e) { next(e); }
});
productRouter.post("/categories", async (req, res, next) => {
  try { res.status(201).json(await prisma.categoriaProducto.create({ data: req.body })); }
  catch (e) { next(e); }
});
productRouter.get("/:id", async (req, res, next) => {
  try {
    const record = await prisma.producto.findUnique({ where: { id: id(req) }, include: { categoria: true, lotes: { include: { ubicacionStock: true } } } });
    if (!record) return notFound(res);
    res.json(record);
  } catch (e) { next(e); }
});
productRouter.put("/:id", async (req, res, next) => {
  try { res.json(await prisma.producto.update({ where: { id: id(req) }, data: req.body })); }
  catch (e) { next(e); }
});
productRouter.delete("/:id", async (req, res, next) => {
  try { res.json(await prisma.producto.delete({ where: { id: id(req) } })); }
  catch (e) { next(e); }
});
app.use("/api/products", productRouter);

// Stock locations
app.use("/api/stock/locations", crudRouter(prisma.ubicacionStock, { orderBy: { nombre: "asc" } }));

// Product batches
const batchRouter = Router();
const batchInclude = { producto: true, genetica: true, ubicacionStock: true, cosecha: { select: { id: true, codigoCosecha: true } } };
batchRouter.get("/", async (_req, res, next) => {
  try { res.json(await prisma.loteProducto.findMany({ include: batchInclude, orderBy: { id: "desc" } })); }
  catch (e) { next(e); }
});
batchRouter.get("/summary", async (_req, res, next) => {
  try {
    const [total, disponible, reservado] = await Promise.all([
      prisma.loteProducto.aggregate({ _sum: { cantidadDisponible: true } }),
      prisma.loteProducto.count({ where: { estado: "disponible" } }),
      prisma.loteProducto.aggregate({ _sum: { cantidadReservada: true } }),
    ]);
    res.json({ totalDisponible: total._sum.cantidadDisponible ?? 0, lotesDisponibles: disponible, totalReservado: reservado._sum.cantidadReservada ?? 0 });
  } catch (e) { next(e); }
});
batchRouter.post("/", async (req, res, next) => {
  try { res.status(201).json(await prisma.loteProducto.create({ data: req.body, include: batchInclude })); }
  catch (e) { next(e); }
});
batchRouter.get("/:id", async (req, res, next) => {
  try {
    const record = await prisma.loteProducto.findUnique({ where: { id: id(req) }, include: batchInclude });
    if (!record) return notFound(res);
    res.json(record);
  } catch (e) { next(e); }
});
batchRouter.put("/:id", async (req, res, next) => {
  try { res.json(await prisma.loteProducto.update({ where: { id: id(req) }, data: req.body, include: batchInclude })); }
  catch (e) { next(e); }
});
batchRouter.delete("/:id", async (req, res, next) => {
  try { res.json(await prisma.loteProducto.delete({ where: { id: id(req) } })); }
  catch (e) { next(e); }
});
app.use("/api/product-batches", batchRouter);

// ─── Billing ─────────────────────────────────────────────────────────────────

const billingInclude = { socio: { select: { id: true, nombre: true, apellido: true, codigoSocio: true } }, items: true, pagos: true };
const billingRouter = Router();
billingRouter.get("/", async (_req, res, next) => {
  try { res.json(await prisma.comprobanteFacturacion.findMany({ include: billingInclude, orderBy: { fechaEmision: "desc" } })); }
  catch (e) { next(e); }
});
billingRouter.post("/", async (req, res, next) => {
  try {
    const { items, pagos, ...data } = req.body;
    const created = await prisma.comprobanteFacturacion.create({
      data: { ...data, items: items ? { create: items } : undefined, pagos: pagos ? { create: pagos } : undefined },
      include: billingInclude,
    });
    res.status(201).json(created);
  } catch (e) { next(e); }
});
billingRouter.get("/:id", async (req, res, next) => {
  try {
    const record = await prisma.comprobanteFacturacion.findUnique({ where: { id: id(req) }, include: billingInclude });
    if (!record) return notFound(res);
    res.json(record);
  } catch (e) { next(e); }
});
billingRouter.put("/:id", async (req, res, next) => {
  try {
    const { items, pagos, ...data } = req.body;
    res.json(await prisma.comprobanteFacturacion.update({ where: { id: id(req) }, data, include: billingInclude }));
  } catch (e) { next(e); }
});
billingRouter.delete("/:id", async (req, res, next) => {
  try { res.json(await prisma.comprobanteFacturacion.delete({ where: { id: id(req) } })); }
  catch (e) { next(e); }
});
app.use("/api/billing", billingRouter);

// ─── Users & Roles (minimal) ──────────────────────────────────────────────────

app.use("/api/users", crudRouter(prisma.usuario, { orderBy: { id: "desc" } }));
app.use("/api/roles", crudRouter(prisma.rol, { orderBy: { id: "desc" } }));
app.get("/api/permissions", async (_req, res, next) => {
  try { res.json(await prisma.permiso.findMany({ orderBy: { modulo: "asc" } })); }
  catch (e) { next(e); }
});

// ─── Dashboard ────────────────────────────────────────────────────────────────

app.get("/api/dashboard", async (_req, res, next) => {
  try {
    const [totalSocios, sociosActivos, totalPlantas, plantasActivas, totalSalas, totalCosechas, lotesDisponibles, comprobantesPendientes] = await Promise.all([
      prisma.socio.count(),
      prisma.socio.count({ where: { estado: "activo" } }),
      prisma.planta.count(),
      prisma.planta.count({ where: { estado: "activa" } }),
      prisma.salaCultivo.count({ where: { estado: "activa" } }),
      prisma.cosecha.count(),
      prisma.loteProducto.count({ where: { estado: "disponible" } }),
      prisma.comprobanteFacturacion.count({ where: { estadoCobro: "impago" } }),
    ]);
    res.json({ socios: { total: totalSocios, activos: sociosActivos }, cultivo: { totalPlantas, plantasActivas, totalSalas }, cosechas: { total: totalCosechas }, stock: { lotesDisponibles }, facturacion: { pendientesCobro: comprobantesPendientes } });
  } catch (e) { next(e); }
});

// ─── Error handler ────────────────────────────────────────────────────────────

app.use(errHandler);

process.on("SIGTERM", async () => { await prisma.$disconnect(); process.exit(0); });

module.exports = { app };

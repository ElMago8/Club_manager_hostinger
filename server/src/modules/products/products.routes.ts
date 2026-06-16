import { Router, type NextFunction, type Request, type Response } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/ApiError.js";

const intId = z.coerce.number().int().positive();

function parseId(req: Request) {
  return intId.parse(req.params.id);
}

const optText = z.string().trim().min(1).optional();
const nullText = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? null : v),
  z.string().trim().nullable().optional(),
);

// ─── Schemas ─────────────────────────────────────────────────────────────────

const categoriaSchema = z.object({
  codigoCategoria:  z.string().trim().min(1),
  nombre:           z.string().trim().min(1),
  descripcion:      nullText,
  estado:           z.string().trim().min(1).default("activa"),
});

const productoSchema = z.object({
  codigoProducto:       z.string().trim().min(1),
  categoriaProductoId:  intId.optional().nullable(),
  nombre:               z.string().trim().min(1),
  tipoProducto:         z.enum(["flor", "aceite", "extracto", "comestible", "insumo", "otro"]),
  unidadMedida:         z.enum(["gramos", "mililitros", "unidades"]).default("gramos"),
  descripcion:          nullText,
  estado:               z.enum(["activo", "inactivo"]).default("activo"),
  requiereLote:         z.coerce.boolean().default(true),
  requiereTrazabilidad: z.coerce.boolean().default(true),
});

const ubicacionSchema = z.object({
  codigoUbicacion: z.string().trim().min(1),
  nombre:          z.string().trim().min(1),
  tipo:            z.enum(["deposito", "freezer", "heladera", "sala_curado", "armario", "otro"]),
  descripcion:     nullText,
  estado:          z.string().trim().min(1).default("activa"),
});

const loteProductoSchema = z.object({
  codigoLoteProducto: z.string().trim().min(1),
  productoId:         intId,
  cosechaId:          intId.optional().nullable(),
  loteCultivoId:      intId.optional().nullable(),
  geneticaId:         intId.optional().nullable(),
  ubicacionStockId:   intId.optional().nullable(),
  fechaIngreso:       z.coerce.date().default(() => new Date()),
  fechaVencimiento:   z.coerce.date().optional().nullable(),
  cantidadInicial:    z.coerce.number().min(0).default(0),
  cantidadDisponible: z.coerce.number().min(0).default(0),
  cantidadReservada:  z.coerce.number().min(0).default(0),
  unidadMedida:       z.enum(["gramos", "mililitros", "unidades"]).default("gramos"),
  estado:             z.enum(["disponible", "reservado", "agotado", "bloqueado", "descartado", "en_analisis"]).default("disponible"),
  observaciones:      nullText,
});

// ─── Includes ────────────────────────────────────────────────────────────────

const loteInclude = {
  producto:       { select: { id: true, codigoProducto: true, nombre: true, unidadMedida: true } },
  cosecha:        { select: { id: true, codigoCosecha: true, pesoSecoGramos: true } },
  loteCultivo:    { select: { id: true, codigoLote: true } },
  genetica:       { select: { id: true, nombre: true } },
  ubicacionStock: { select: { id: true, nombre: true, codigoUbicacion: true } },
} as const;

// ─── Categorías ───────────────────────────────────────────────────────────────

function categoriaRoutes() {
  const router = Router();

  router.get("/", async (_req, res, next) => {
    try {
      res.json(await prisma.categoriaProducto.findMany({ orderBy: { nombre: "asc" } }));
    } catch (e) { next(e); }
  });

  router.post("/", async (req, res, next) => {
    try {
      const data = categoriaSchema.parse(req.body);
      res.status(201).json(await prisma.categoriaProducto.create({ data }));
    } catch (e) { next(e); }
  });

  router.get("/:id", async (req, res, next) => {
    try {
      const record = await prisma.categoriaProducto.findUnique({ where: { id: parseId(req) } });
      if (!record) throw new ApiError(404, "Categoría no encontrada.");
      res.json(record);
    } catch (e) { next(e); }
  });

  router.patch("/:id", async (req, res, next) => {
    try {
      res.json(await prisma.categoriaProducto.update({
        where: { id: parseId(req) },
        data: categoriaSchema.partial().parse(req.body),
      }));
    } catch (e) { next(e); }
  });

  router.delete("/:id", async (req, res, next) => {
    try {
      const id = parseId(req);
      const count = await prisma.producto.count({ where: { categoriaProductoId: id } });
      if (count > 0) {
        res.json(await prisma.categoriaProducto.update({ where: { id }, data: { estado: "inactiva" } }));
      } else {
        res.json(await prisma.categoriaProducto.delete({ where: { id } }));
      }
    } catch (e) { next(e); }
  });

  return router;
}

// ─── Productos ────────────────────────────────────────────────────────────────

function productoRoutes() {
  const router = Router();
  const include = { categoria: { select: { id: true, nombre: true, codigoCategoria: true } } } as const;

  router.get("/", async (req, res, next) => {
    try {
      const { estado, tipoProducto, categoriaId } = req.query as Record<string, string | undefined>;
      res.json(await prisma.producto.findMany({
        where: {
          estado: estado ?? undefined,
          tipoProducto: tipoProducto ?? undefined,
          categoriaProductoId: categoriaId ? Number(categoriaId) : undefined,
        },
        include,
        orderBy: { nombre: "asc" },
      }));
    } catch (e) { next(e); }
  });

  router.post("/", async (req, res, next) => {
    try {
      const data = productoSchema.parse(req.body);
      res.status(201).json(await prisma.producto.create({ data, include }));
    } catch (e) { next(e); }
  });

  router.get("/:id", async (req, res, next) => {
    try {
      const record = await prisma.producto.findUnique({ where: { id: parseId(req) }, include });
      if (!record) throw new ApiError(404, "Producto no encontrado.");
      res.json(record);
    } catch (e) { next(e); }
  });

  router.patch("/:id", async (req, res, next) => {
    try {
      res.json(await prisma.producto.update({
        where: { id: parseId(req) },
        data: productoSchema.partial().parse(req.body),
        include,
      }));
    } catch (e) { next(e); }
  });

  router.delete("/:id", async (req, res, next) => {
    try {
      const id = parseId(req);
      const lotes = await prisma.loteProducto.count({ where: { productoId: id } });
      if (lotes > 0) {
        res.json(await prisma.producto.update({ where: { id }, data: { estado: "inactivo" }, include }));
      } else {
        res.json(await prisma.producto.delete({ where: { id }, include }));
      }
    } catch (e) { next(e); }
  });

  return router;
}

// ─── Ubicaciones ──────────────────────────────────────────────────────────────

function ubicacionRoutes() {
  const router = Router();

  router.get("/", async (_req, res, next) => {
    try {
      res.json(await prisma.ubicacionStock.findMany({ orderBy: { nombre: "asc" } }));
    } catch (e) { next(e); }
  });

  router.post("/", async (req, res, next) => {
    try {
      res.status(201).json(await prisma.ubicacionStock.create({ data: ubicacionSchema.parse(req.body) }));
    } catch (e) { next(e); }
  });

  router.get("/:id", async (req, res, next) => {
    try {
      const record = await prisma.ubicacionStock.findUnique({ where: { id: parseId(req) } });
      if (!record) throw new ApiError(404, "Ubicación no encontrada.");
      res.json(record);
    } catch (e) { next(e); }
  });

  router.patch("/:id", async (req, res, next) => {
    try {
      res.json(await prisma.ubicacionStock.update({
        where: { id: parseId(req) },
        data: ubicacionSchema.partial().parse(req.body),
      }));
    } catch (e) { next(e); }
  });

  router.delete("/:id", async (req, res, next) => {
    try {
      const id = parseId(req);
      const lotes = await prisma.loteProducto.count({ where: { ubicacionStockId: id } });
      if (lotes > 0) {
        res.json(await prisma.ubicacionStock.update({ where: { id }, data: { estado: "inactiva" } }));
      } else {
        res.json(await prisma.ubicacionStock.delete({ where: { id } }));
      }
    } catch (e) { next(e); }
  });

  return router;
}

// ─── Lotes de producto ────────────────────────────────────────────────────────

function loteProductoRoutes() {
  const router = Router();

  router.get("/", async (req, res, next) => {
    try {
      const { estado, productoId, geneticaId, ubicacionId } = req.query as Record<string, string | undefined>;
      res.json(await prisma.loteProducto.findMany({
        where: {
          estado: estado ?? undefined,
          productoId: productoId ? Number(productoId) : undefined,
          geneticaId: geneticaId ? Number(geneticaId) : undefined,
          ubicacionStockId: ubicacionId ? Number(ubicacionId) : undefined,
        },
        include: loteInclude,
        orderBy: { id: "desc" },
      }));
    } catch (e) { next(e); }
  });

  router.post("/", async (req, res, next) => {
    try {
      const data = loteProductoSchema.parse(req.body);
      if (data.cantidadDisponible > data.cantidadInicial) {
        throw new ApiError(400, "La cantidad disponible no puede superar la cantidad inicial.");
      }
      res.status(201).json(await prisma.loteProducto.create({ data, include: loteInclude }));
    } catch (e) { next(e); }
  });

  router.get("/summary", async (_req, res, next) => {
    try {
      const [total, activos, bloqueados, vencimientosProximos, stockTotal] = await Promise.all([
        prisma.loteProducto.count(),
        prisma.loteProducto.count({ where: { estado: "disponible" } }),
        prisma.loteProducto.count({ where: { estado: { in: ["bloqueado", "en_analisis"] } } }),
        prisma.loteProducto.count({
          where: {
            fechaVencimiento: { lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
            estado: { not: "descartado" },
          },
        }),
        prisma.loteProducto.aggregate({
          _sum: { cantidadDisponible: true },
          where: { estado: "disponible" },
        }),
      ]);
      const productosActivos = await prisma.producto.count({ where: { estado: "activo" } });
      res.json({
        productosActivos,
        lotesDisponibles: activos,
        stockTotalDisponible: stockTotal._sum.cantidadDisponible ?? 0,
        lotesBloqueadosAnalisis: bloqueados,
        proximosVencimientos: vencimientosProximos,
        totalLotes: total,
      });
    } catch (e) { next(e); }
  });

  router.get("/:id", async (req, res, next) => {
    try {
      const record = await prisma.loteProducto.findUnique({ where: { id: parseId(req) }, include: loteInclude });
      if (!record) throw new ApiError(404, "Lote de producto no encontrado.");
      res.json(record);
    } catch (e) { next(e); }
  });

  router.patch("/:id", async (req, res, next) => {
    try {
      const id = parseId(req);
      const data = loteProductoSchema.partial().parse(req.body);
      if (data.cantidadDisponible != null && data.cantidadInicial != null && data.cantidadDisponible > data.cantidadInicial) {
        throw new ApiError(400, "La cantidad disponible no puede superar la cantidad inicial.");
      }
      res.json(await prisma.loteProducto.update({ where: { id }, data, include: loteInclude }));
    } catch (e) { next(e); }
  });

  router.delete("/:id", async (req, res, next) => {
    try {
      const id = parseId(req);
      res.json(await prisma.loteProducto.update({
        where: { id },
        data: { estado: "descartado" },
        include: loteInclude,
      }));
    } catch (e) { next(e); }
  });

  return router;
}

// ─── Router principal ─────────────────────────────────────────────────────────

export const productsRoutes = Router();

productsRoutes.use("/categories", categoriaRoutes());
productsRoutes.use("/",          productoRoutes());

export const stockLocationsRoutes = Router();
stockLocationsRoutes.use("/", ubicacionRoutes());

export const productBatchesRoutes = Router();
productBatchesRoutes.use("/", loteProductoRoutes());

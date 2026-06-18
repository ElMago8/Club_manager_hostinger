import { Router, type NextFunction, type Request, type Response } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/ApiError.js";

const intId = z.coerce.number().int().positive();
const optionalText = z.string().trim().min(1).optional();
const nullableText = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? null : value),
  z.string().trim().nullable().optional(),
);
const optionalDate = z.coerce.date().optional();

function parseId(req: Request) {
  return intId.parse(req.params.id);
}

type CrudDelegate = {
  findMany: (args?: any) => Promise<unknown>;
  findUnique: (args: any) => Promise<unknown>;
  create: (args: any) => Promise<unknown>;
  update: (args: any) => Promise<unknown>;
  delete: (args: any) => Promise<unknown>;
};

function crudRoutes(delegate: CrudDelegate, createSchema: z.ZodObject<any>, updateSchema = createSchema.partial()) {
  const router = Router();

  router.get("/", async (_req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await delegate.findMany({ orderBy: { id: "desc" } }));
    } catch (error) {
      next(error);
    }
  });

  router.post("/", async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.status(201).json(await delegate.create({ data: createSchema.parse(req.body) }));
    } catch (error) {
      next(error);
    }
  });

  router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const record = await delegate.findUnique({ where: { id: parseId(req) } });
      if (!record) throw new ApiError(404, "Registro no encontrado.");
      res.json(record);
    } catch (error) {
      next(error);
    }
  });

  router.put("/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await delegate.update({ where: { id: parseId(req) }, data: updateSchema.parse(req.body) }));
    } catch (error) {
      next(error);
    }
  });

  router.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await delegate.delete({ where: { id: parseId(req) } }));
    } catch (error) {
      next(error);
    }
  });

  return router;
}

function parseOptionalString(value: unknown) {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function activePlantWhereForCamilla(camillaId: number) {
  return {
    camillaId,
    estado: { notIn: ["descartada", "discarded"] },
  };
}

async function assertCamillaCapacity(camillaId: number, adding = 1, ignoredPlantId?: number) {
  const camilla = await prisma.camilla.findUnique({ where: { id: camillaId } });
  if (!camilla) throw new ApiError(404, "Camilla no encontrada.");

  const currentPlants = await prisma.planta.count({
    where: {
      ...activePlantWhereForCamilla(camillaId),
      id: ignoredPlantId ? { not: ignoredPlantId } : undefined,
    },
  });

  if (currentPlants + adding > camilla.capacidadMaximaPlantas) {
    throw new ApiError(400, "No hay capacidad disponible en la camilla seleccionada.");
  }
}

async function assertCamillaPosition(camillaId: number, posicionCamilla: number, ignoredPlantId?: number) {
  const camilla = await prisma.camilla.findUnique({ where: { id: camillaId } });
  if (!camilla) throw new ApiError(404, "Camilla no encontrada.");
  if (posicionCamilla > camilla.capacidadMaximaPlantas) {
    throw new ApiError(400, "La posicion no puede superar la capacidad maxima de la camilla.");
  }

  const existing = await prisma.planta.findFirst({
    where: {
      camillaId,
      posicionCamilla,
      estado: { notIn: ["descartada", "discarded"] },
      id: ignoredPlantId ? { not: ignoredPlantId } : undefined,
    },
  });

  if (existing) throw new ApiError(409, "Ya existe una planta en esa posicion de la camilla.");
}

function parseCamillaPayload(body: any, partial = false) {
  const parsed = z.object({
    codigoCamilla: z.string().trim().min(1).optional(),
    code: z.string().trim().min(1).optional(),
    salaCultivoId: intId.optional(),
    roomId: intId.optional(),
    nombre: z.string().trim().min(1).optional(),
    name: z.string().trim().min(1).optional(),
    estado: z.string().trim().min(1).optional(),
    status: z.string().trim().min(1).optional(),
    capacidadMaximaPlantas: z.coerce.number().int().min(0).max(100).optional(),
    maxPlants: z.coerce.number().int().min(0).max(100).optional(),
    descripcion: nullableText,
    notes: nullableText,
  }).parse(body);

  const data = {
    codigoCamilla: parsed.codigoCamilla ?? parsed.code,
    salaCultivoId: parsed.salaCultivoId ?? parsed.roomId,
    nombre: parsed.nombre ?? parsed.name,
    estado: parsed.estado ?? parsed.status ?? (!partial ? "activa" : undefined),
    capacidadMaximaPlantas: parsed.capacidadMaximaPlantas ?? parsed.maxPlants,
    descripcion: parsed.descripcion ?? parsed.notes,
  };

  if (!partial && (!data.codigoCamilla || !data.salaCultivoId || !data.nombre || data.capacidadMaximaPlantas === undefined)) {
    throw new ApiError(400, "Codigo, sala, nombre y capacidad de camilla son obligatorios.");
  }

  return Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined));
}

function parsePlantaPayload(body: any, partial = false) {
  const parsed = plantaSchema.partial().extend({
    codigoPlanta: z.string().trim().min(1).optional(),
    nombrePlanta: z.string().trim().min(1).optional(),
  }).parse(body);

  if (!partial && (!parsed.codigoPlanta || !parsed.nombrePlanta || !parsed.geneticaId || !parsed.camillaId || !parsed.posicionCamilla || !parsed.origen || !parsed.etapa || !parsed.fechaInicio)) {
    throw new ApiError(400, "Codigo, nombre, genetica, camilla, posicion, origen, etapa y fecha de inicio son obligatorios.");
  }

  return Object.fromEntries(
    Object.entries(parsed).map(([key, value]) => [key, parseOptionalString(value)]).filter(([, value]) => value !== undefined),
  );
}

function salaRoutes() {
  const router = Router();

  router.get("/", async (_req, res, next) => {
    try {
      res.json(await prisma.salaCultivo.findMany({ orderBy: { id: "desc" } }));
    } catch (error) {
      next(error);
    }
  });

  router.post("/", async (req, res, next) => {
    try {
      res.status(201).json(await prisma.salaCultivo.create({ data: salaCultivoSchema.parse(req.body) }));
    } catch (error) {
      next(error);
    }
  });

  router.get("/:id", async (req, res, next) => {
    try {
      const record = await prisma.salaCultivo.findUnique({ where: { id: parseId(req) } });
      if (!record) throw new ApiError(404, "Sala no encontrada.");
      res.json(record);
    } catch (error) {
      next(error);
    }
  });

  router.put("/:id", async (req, res, next) => {
    try {
      res.json(await prisma.salaCultivo.update({
        where: { id: parseId(req) },
        data: salaCultivoSchema.partial().parse(req.body),
      }));
    } catch (error) {
      next(error);
    }
  });

  router.delete("/:id", async (req, res, next) => {
    try {
      const id = parseId(req);
      const [camillas, madres, lotes, registrosAmbientales, tareasCultivo] = await Promise.all([
        prisma.camilla.count({ where: { salaCultivoId: id } }),
        prisma.madre.count({ where: { salaCultivoId: id } }),
        prisma.loteCultivo.count({ where: { salaCultivoId: id } }),
        prisma.registroAmbiental.count({ where: { salaCultivoId: id } }),
        prisma.tareaCultivo.count({ where: { salaCultivoId: id } }),
      ]);

      const related = [
        camillas ? `${camillas} camilla${camillas === 1 ? "" : "s"}` : "",
        madres ? `${madres} madre${madres === 1 ? "" : "s"}` : "",
        lotes ? `${lotes} lote${lotes === 1 ? "" : "s"} de cultivo` : "",
        registrosAmbientales ? `${registrosAmbientales} registro${registrosAmbientales === 1 ? "" : "s"} ambiental${registrosAmbientales === 1 ? "" : "es"}` : "",
        tareasCultivo ? `${tareasCultivo} tarea${tareasCultivo === 1 ? "" : "s"} de cultivo` : "",
      ].filter(Boolean);

      if (related.length > 0) {
        throw new ApiError(
          409,
          `No se puede eliminar la sala porque tiene datos relacionados: ${related.join(", ")}. Borra o reasigna esos datos antes de eliminarla.`,
        );
      }

      res.json(await prisma.salaCultivo.delete({ where: { id } }));
    } catch (error) {
      next(error);
    }
  });

  return router;
}

function camillaRoutes() {
  const router = Router();

  router.get("/", async (_req, res, next) => {
    try {
      res.json(await prisma.camilla.findMany({
        include: { _count: { select: { plantas: { where: { estado: { notIn: ["descartada", "discarded"] } } } } } },
        orderBy: { id: "desc" },
      }));
    } catch (error) {
      next(error);
    }
  });

  router.post("/", async (req, res, next) => {
    try {
      res.status(201).json(await prisma.camilla.create({ data: parseCamillaPayload(req.body) as any }));
    } catch (error) {
      next(error);
    }
  });

  router.get("/:id/occupancy", async (req, res, next) => {
    try {
      const id = parseId(req);
      const camilla = await prisma.camilla.findUnique({ where: { id } });
      if (!camilla) throw new ApiError(404, "Camilla no encontrada.");
      const occupied = await prisma.planta.count({ where: activePlantWhereForCamilla(id) });
      const available = Math.max(camilla.capacidadMaximaPlantas - occupied, 0);
      const occupancyPercentage = camilla.capacidadMaximaPlantas > 0
        ? Number(((occupied / camilla.capacidadMaximaPlantas) * 100).toFixed(1))
        : 0;
      res.json({ bedId: String(id), maxPlants: camilla.capacidadMaximaPlantas, occupied, available, occupancyPercentage });
    } catch (error) {
      next(error);
    }
  });

  router.patch("/:id/capacity", async (req, res, next) => {
    try {
      const id = parseId(req);
      const maxPlants = z.coerce.number().int().min(0).max(100).parse(req.body.maxPlants ?? req.body.capacidadMaximaPlantas);
      const occupied = await prisma.planta.count({ where: activePlantWhereForCamilla(id) });
      if (maxPlants < occupied) throw new ApiError(400, "No se puede reducir la capacidad por debajo de la cantidad actual de plantas asignadas.");
      res.json(await prisma.camilla.update({ where: { id }, data: { capacidadMaximaPlantas: maxPlants } }));
    } catch (error) {
      next(error);
    }
  });

  router.get("/:id", async (req, res, next) => {
    try {
      const record = await prisma.camilla.findUnique({
        where: { id: parseId(req) },
        include: { plantas: true, _count: { select: { plantas: { where: { estado: { notIn: ["descartada", "discarded"] } } } } } },
      });
      if (!record) throw new ApiError(404, "Camilla no encontrada.");
      res.json(record);
    } catch (error) {
      next(error);
    }
  });

  router.put("/:id", async (req, res, next) => {
    try {
      const id = parseId(req);
      const data = parseCamillaPayload(req.body, true) as any;
      if (data.capacidadMaximaPlantas !== undefined) {
        const occupied = await prisma.planta.count({ where: activePlantWhereForCamilla(id) });
        if (data.capacidadMaximaPlantas < occupied) throw new ApiError(400, "La capacidad no puede quedar por debajo de las plantas actuales.");
      }
      res.json(await prisma.camilla.update({ where: { id }, data }));
    } catch (error) {
      next(error);
    }
  });

  router.delete("/:id", async (req, res, next) => {
    try {
      const id = parseId(req);
      const [plantas, madres, tareasCultivo] = await Promise.all([
        prisma.planta.count({ where: { camillaId: id } }),
        prisma.madre.count({ where: { camillaId: id } }),
        prisma.tareaCultivo.count({ where: { camillaId: id } }),
      ]);

      const related = [
        plantas ? `${plantas} planta${plantas === 1 ? "" : "s"}` : "",
        madres ? `${madres} madre${madres === 1 ? "" : "s"}` : "",
        tareasCultivo ? `${tareasCultivo} tarea${tareasCultivo === 1 ? "" : "s"} de cultivo` : "",
      ].filter(Boolean);

      if (related.length > 0) {
        throw new ApiError(
          409,
          `No se puede eliminar la camilla porque tiene datos relacionados: ${related.join(", ")}. Borra o reasigna esos datos antes de eliminarla.`,
        );
      }

      res.json(await prisma.camilla.delete({ where: { id } }));
    } catch (error) {
      next(error);
    }
  });

  return router;
}

function plantaRoutes() {
  const router = Router();
  const include = { camilla: true, genetica: true, madre: true, loteCultivo: true };

  router.get("/", async (req, res, next) => {
    try {
      const filters = req.query;
      res.json(await prisma.planta.findMany({
        where: {
          camillaId: filters.bedId ? Number(filters.bedId) : undefined,
          clonadorId: filters.clonadorId ? Number(filters.clonadorId) : undefined,
          geneticaId: filters.geneticsId ? Number(filters.geneticsId) : undefined,
          loteCultivoId: filters.batchId ? Number(filters.batchId) : undefined,
          madreId: filters.motherPlantId ? Number(filters.motherPlantId) : undefined,
          etapa: filters.stage ? String(filters.stage) : undefined,
          estado: filters.status ? String(filters.status) : undefined,
        },
        include,
        orderBy: [{ camillaId: "asc" }, { posicionCamilla: "asc" }],
      }));
    } catch (error) {
      next(error);
    }
  });

  router.post("/", async (req, res, next) => {
    try {
      const data = parsePlantaPayload(req.body);
      await assertCamillaCapacity(Number(data.camillaId), 1);
      await assertCamillaPosition(Number(data.camillaId), Number(data.posicionCamilla));
      res.status(201).json(await prisma.planta.create({ data: data as any, include }));
    } catch (error) {
      next(error);
    }
  });

  router.post("/bulk", async (req, res, next) => {
    try {
      const body = z.object({
        bedId: intId,
        count: z.coerce.number().int().min(1).max(100),
        internalCodePrefix: z.string().trim().min(1).default("PLANT"),
        batchId: intId.optional(),
        geneticsId: intId,
        motherPlantId: intId.optional(),
        origin: z.string().trim().min(1),
        stage: z.string().trim().min(1),
        status: z.string().trim().min(1).default("normal"),
        startDate: z.coerce.date(),
        stageStartDate: z.coerce.date().optional(),
        potSizeLiters: z.coerce.number().positive().optional(),
        potType: nullableText,
        substrate: nullableText,
        notes: nullableText,
      }).parse(req.body);

      await assertCamillaCapacity(body.bedId, body.count);
      const camilla = await prisma.camilla.findUnique({ where: { id: body.bedId } });
      if (!camilla) throw new ApiError(404, "Camilla no encontrada.");

      const occupied = new Set(
        (await prisma.planta.findMany({
          where: activePlantWhereForCamilla(body.bedId),
          select: { posicionCamilla: true },
        })).map((plant) => plant.posicionCamilla),
      );
      const freePositions = Array.from(
        { length: Math.min(camilla.capacidadMaximaPlantas, 100) },
        (_, index) => index + 1,
      ).filter((position) => !occupied.has(position));

      if (freePositions.length < body.count) throw new ApiError(400, "No hay posiciones libres suficientes en la camilla.");

      const created = await prisma.$transaction(async (tx) => {
        // Determinar el próximo número secuencial global para el prefijo
        const codigosExistentes = await tx.planta.findMany({
          where: { codigoPlanta: { startsWith: `${body.internalCodePrefix}-` } },
          select: { codigoPlanta: true },
        });
        let maxSeq = 0;
        for (const { codigoPlanta: code } of codigosExistentes) {
          const match = code.match(/-(\d+)$/);
          if (match) {
            const num = parseInt(match[1], 10);
            if (num > maxSeq) maxSeq = num;
          }
        }

        const plants = [];
        for (let index = 0; index < body.count; index += 1) {
          const position = freePositions[index];
          const sequence = String(maxSeq + index + 1).padStart(4, "0");
          const codigoPlanta = `${body.internalCodePrefix}-${sequence}`;
          plants.push(await tx.planta.create({
            data: {
              codigoPlanta,
              nombrePlanta: codigoPlanta,
              camillaId: body.bedId,
              posicionCamilla: position,
              loteCultivoId: body.batchId,
              geneticaId: body.geneticsId,
              madreId: body.motherPlantId,
              origen: body.origin,
              etapa: body.stage,
              estado: body.status,
              fechaInicio: body.startDate,
              fechaInicioEtapa: body.stageStartDate,
              macetaLitros: body.potSizeLiters,
              tipoMaceta: body.potType ?? undefined,
              sustrato: body.substrate ?? undefined,
              observaciones: body.notes ?? undefined,
            },
            include,
          }));
        }
        return plants;
      });

      res.status(201).json(created);
    } catch (error) {
      next(error);
    }
  });

  router.patch("/:id/stage", async (req, res, next) => {
    try {
      const id = parseId(req);
      const etapa = z.string().trim().min(1).parse(req.body.etapa ?? req.body.stage);
      const fechaInicioEtapa = req.body.fechaInicioEtapa ?? req.body.stageStartDate;
      res.json(await prisma.planta.update({
        where: { id },
        data: {
          etapa,
          fechaInicioEtapa: fechaInicioEtapa ? z.coerce.date().parse(fechaInicioEtapa) : undefined,
          observaciones: parseOptionalString(req.body.observaciones ?? req.body.notes) as string | undefined,
        },
        include,
      }));
    } catch (error) {
      next(error);
    }
  });

  router.patch("/:id/status", async (req, res, next) => {
    try {
      const id = parseId(req);
      const estado = z.string().trim().min(1).parse(req.body.estado ?? req.body.status);
      res.json(await prisma.planta.update({
        where: { id },
        data: {
          estado,
          observaciones: parseOptionalString(req.body.observaciones ?? req.body.notes) as string | undefined,
        },
        include,
      }));
    } catch (error) {
      next(error);
    }
  });

  router.get("/:id", async (req, res, next) => {
    try {
      const record = await prisma.planta.findUnique({ where: { id: parseId(req) }, include });
      if (!record) throw new ApiError(404, "Planta no encontrada.");
      res.json(record);
    } catch (error) {
      next(error);
    }
  });

  router.put("/:id", async (req, res, next) => {
    try {
      const id = parseId(req);
      const current = await prisma.planta.findUnique({ where: { id } });
      if (!current) throw new ApiError(404, "Planta no encontrada.");
      const data = parsePlantaPayload(req.body, true);
      const nextCamillaId = Number(data.camillaId ?? current.camillaId);
      const nextPosition = Number(data.posicionCamilla ?? current.posicionCamilla);
      await assertCamillaCapacity(nextCamillaId, 1, id);
      await assertCamillaPosition(nextCamillaId, nextPosition, id);
      res.json(await prisma.planta.update({ where: { id }, data: data as any, include }));
    } catch (error) {
      next(error);
    }
  });

  router.delete("/:id", async (req, res, next) => {
    try {
      res.json(await prisma.planta.delete({ where: { id: parseId(req) } }));
    } catch (error) {
      next(error);
    }
  });

  return router;
}

function madreRoutes() {
  const router = Router();
  const include = { genetica: true, salaCultivo: true, camilla: true, _count: { select: { plantas: true } } };

  router.get("/", async (_req, res, next) => {
    try {
      res.json(await prisma.madre.findMany({ include, orderBy: { id: "desc" } }));
    } catch (error) {
      next(error);
    }
  });

  router.post("/", async (req, res, next) => {
    try {
      res.status(201).json(await prisma.madre.create({ data: madreSchema.parse(req.body), include }));
    } catch (error) {
      next(error);
    }
  });

  router.get("/:id", async (req, res, next) => {
    try {
      const record = await prisma.madre.findUnique({ where: { id: parseId(req) }, include });
      if (!record) throw new ApiError(404, "Madre no encontrada.");
      res.json(record);
    } catch (error) {
      next(error);
    }
  });

  router.put("/:id", async (req, res, next) => {
    try {
      res.json(await prisma.madre.update({ where: { id: parseId(req) }, data: madreSchema.partial().parse(req.body), include }));
    } catch (error) {
      next(error);
    }
  });

  router.delete("/:id", async (req, res, next) => {
    try {
      const id = parseId(req);
      const plantas = await prisma.planta.count({ where: { madreId: id } });

      if (plantas > 0) {
        throw new ApiError(
          409,
          `No se puede eliminar la madre porque tiene ${plantas} planta${plantas === 1 ? "" : "s"} asociada${plantas === 1 ? "" : "s"}. Para conservar la trazabilidad, archivala o descartala, o reasigna esas plantas antes.`,
        );
      }

      res.json(await prisma.madre.delete({ where: { id } }));
    } catch (error) {
      next(error);
    }
  });

  return router;
}

const salaCultivoSchema = z.object({
  codigoSala: z.string().trim().min(1),
  nombre: z.string().trim().min(1),
  tipo: z.string().trim().min(1),
  estado: z.string().trim().min(1).default("activa"),
  potenciaWatts: z.coerce.number().int().min(0).default(0),
  tipoRiego: z.enum(["manual", "automatico", "mixto"]).default("manual"),
  tieneAireAcondicionado: z.coerce.boolean().default(false),
  tieneDeshumidificador: z.coerce.boolean().default(false),
  sensores: optionalText,
  descripcion: optionalText,
  entornoCultivo: optionalText,
  tipoCultivo: optionalText,
});

const camillaSchema = z.object({
  codigoCamilla: z.string().trim().min(1),
  salaCultivoId: intId,
  nombre: z.string().trim().min(1),
  estado: z.string().trim().min(1).default("activa"),
  capacidadMaximaPlantas: z.coerce.number().int().min(0),
  descripcion: optionalText,
});

const geneticaSchema = z.object({
  codigoGenetica: z.string().trim().min(1),
  nombre: z.string().trim().min(1),
  breeder: nullableText,
  origen: nullableText,
  tipo: z.string().trim().min(1),
  perfilCannabionoide: nullableText,
  thcEstimado: z.coerce.number().min(0).max(100).optional(),
  cbdEstimado: z.coerce.number().min(0).max(100).optional(),
  sativaPorcentaje: z.coerce.number().min(0).max(100).optional(),
  indicaPorcentaje: z.coerce.number().min(0).max(100).optional(),
  sabor: nullableText,
  efecto: nullableText,
  aroma: nullableText,
  tiempoFloracionDias: z.coerce.number().int().positive().optional(),
  estado: z.string().trim().min(1).default("activa"),
  descripcion: optionalText,
  observaciones: nullableText,
});

const madreSchema = z.object({
  codigoMadre: z.string().trim().min(1),
  nombreMadre: nullableText,
  geneticaId: intId,
  salaCultivoId: intId,
  camillaId: intId,
  estado: z.string().trim().min(1).default("activa"),
  estadoSanitario: z.enum(["bueno", "preventivo", "observacion", "critico"]).default("bueno"),
  fechaInicio: z.coerce.date(),
  fechaUltimoCorte: optionalDate,
  cantidadEsquejesDisponibles: z.coerce.number().int().min(0).default(0),
  origen: nullableText,
  observaciones: nullableText,
});

const loteCultivoSchema = z.object({
  codigoLote: z.string().trim().min(1),
  geneticaId: intId,
  salaCultivoId: intId,
  fechaInicio: z.coerce.date(),
  fechaInicioFloracion: optionalDate,
  fechaEstimadaCosecha: optionalDate,
  fechaCosechaReal: optionalDate,
  estado: z.string().trim().min(1).default("activo"),
  observaciones: optionalText,
});

function loteCultivoRoutes() {
  const router = Router();
  const include = { genetica: true, salaCultivo: true };

  router.get("/", async (_req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await prisma.loteCultivo.findMany({ include, orderBy: { id: "desc" } }));
    } catch (error) {
      next(error);
    }
  });

  router.post("/", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = loteCultivoSchema.parse(req.body);
      res.status(201).json(await prisma.loteCultivo.create({ data, include }));
    } catch (error) {
      next(error);
    }
  });

  router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const record = await prisma.loteCultivo.findUnique({ where: { id: parseId(req) }, include });
      if (!record) throw new ApiError(404, "Lote no encontrado.");
      res.json(record);
    } catch (error) {
      next(error);
    }
  });

  router.put("/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = loteCultivoSchema.partial().parse(req.body);
      res.json(await prisma.loteCultivo.update({ where: { id: parseId(req) }, data, include }));
    } catch (error) {
      next(error);
    }
  });

  router.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await prisma.loteCultivo.delete({ where: { id: parseId(req) } }));
    } catch (error) {
      next(error);
    }
  });

  return router;
}

const plantaSchema = z.object({
  codigoPlanta: z.string().trim().min(1),
  nombrePlanta: z.string().trim().min(1),
  loteCultivoId: intId.optional(),
  geneticaId: intId,
  madreId: intId.optional(),
  camillaId: intId,
  posicionCamilla: z.coerce.number().int().positive(),
  origen: z.string().trim().min(1),
  etapa: z.string().trim().min(1),
  estado: z.string().trim().min(1).default("activa"),
  estadoSanitario: z.enum(["bueno", "preventivo", "observacion", "critico"]).default("bueno"),
  fechaInicio: z.coerce.date(),
  fechaInicioEtapa: optionalDate,
  macetaCodigo: optionalText,
  macetaLitros: z.coerce.number().positive().optional(),
  tipoMaceta: optionalText,
  sustrato: optionalText,
  observaciones: optionalText,
});

const registroAmbientalSchema = z.object({
  salaCultivoId: intId,
  loteCultivoId: intId.optional(),
  temperatura: z.coerce.number(),
  humedad: z.coerce.number().min(0).max(100),
  vpd: z.coerce.number().optional(),
  co2: z.coerce.number().int().positive().optional(),
  observaciones: optionalText,
  registradoEn: z.coerce.date().default(() => new Date()),
});

const riegoSchema = z.object({
  plantaId: intId.optional(),
  loteCultivoId: intId.optional(),
  tipoRiego: z.string().trim().min(1),
  volumenLitros: z.coerce.number().positive(),
  ph: z.coerce.number().optional(),
  ec: z.coerce.number().optional(),
  observaciones: optionalText,
  fechaRiego: z.coerce.date().default(() => new Date()),
});

const medicionCultivoSchema = z.object({
  fecha: z.coerce.date(),
  hora: z.string().trim().regex(/^\d{2}:\d{2}$/, "Formato HH:MM requerido."),
  tipo: z.string().trim().min(1),
  salaCultivoId: intId,
  camillaId: intId.optional(),
  clonadorId: intId.optional(),
  plantaId: intId.optional(),
  madreId: intId.optional(),
  phLiquido: z.coerce.number().min(0).max(14).optional(),
  ppmLiquido: z.coerce.number().min(0).optional(),
  phSustrato: z.coerce.number().min(0).max(14).optional(),
  ppmSustrato: z.coerce.number().min(0).optional(),
  phDrenaje: z.coerce.number().min(0).max(14).optional(),
  ppmDrenaje: z.coerce.number().min(0).optional(),
  estado: z.string().trim().min(1).default("normal"),
  metodo: optionalText,
  responsable: optionalText,
  observaciones: optionalText,
});

const tareaCultivoSchema = z.object({
  titulo: z.string().trim().min(1),
  descripcion: optionalText,
  tipo: z.string().trim().min(1),
  prioridad: z.string().trim().min(1).default("media"),
  estado: z.string().trim().min(1).default("pendiente"),
  salaCultivoId: intId.optional(),
  camillaId: intId.optional(),
  loteCultivoId: intId.optional(),
  plantaId: intId.optional(),
  fechaProgramada: z.coerce.date(),
  fechaCompletada: optionalDate,
  observaciones: optionalText,
});

const cosechaSchema = z.object({
  codigoCosecha: z.string().trim().min(1),
  loteCultivoId: intId,
  salaCultivoId: intId.optional().nullable(),
  fechaCosecha: z.coerce.date(),
  pesoHumedoGramos: z.coerce.number().min(0).optional(),
  pesoSecoGramos: z.coerce.number().min(0).optional(),
  pesoMermaGramos: z.coerce.number().min(0).optional(),
  estado: z.string().trim().min(1).default("en_secado"),
  secadoInicioEn: z.coerce.date().optional().nullable(),
  curadoInicioEn: z.coerce.date().optional().nullable(),
  observaciones: optionalText,
});

function cosechaRoutes() {
  const router = Router();
  const include = {
    loteCultivo: { include: { genetica: true, salaCultivo: true } },
    salaCultivo: true,
  };

  router.get("/", async (_req, res, next) => {
    try {
      res.json(await prisma.cosecha.findMany({ include, orderBy: { id: "desc" } }));
    } catch (error) {
      next(error);
    }
  });

  router.post("/", async (req, res, next) => {
    try {
      res.status(201).json(await prisma.cosecha.create({ data: cosechaSchema.parse(req.body), include }));
    } catch (error) {
      next(error);
    }
  });

  router.get("/:id", async (req, res, next) => {
    try {
      const record = await prisma.cosecha.findUnique({ where: { id: parseId(req) }, include });
      if (!record) throw new ApiError(404, "Cosecha no encontrada.");
      res.json(record);
    } catch (error) {
      next(error);
    }
  });

  router.put("/:id", async (req, res, next) => {
    try {
      const id = parseId(req);
      const data = cosechaSchema
        .extend({ estado: z.string().trim().min(1).optional() })
        .partial()
        .parse(req.body);
      res.json(await prisma.cosecha.update({ where: { id }, data, include }));
    } catch (error) {
      next(error);
    }
  });

  router.delete("/:id", async (req, res, next) => {
    try {
      res.json(await prisma.cosecha.delete({ where: { id: parseId(req) } }));
    } catch (error) {
      next(error);
    }
  });

  return router;
}

function envLogSvp(tempC: number): number {
  return 0.61078 * Math.exp((17.27 * tempC) / (tempC + 237.3));
}

function envLogCalcVPD(airTempC: number, relativeHumidity: number, leafTempC?: number): number {
  const leaf = leafTempC ?? airTempC - 2.8;
  return Number((envLogSvp(leaf) - envLogSvp(airTempC) * (relativeHumidity / 100)).toFixed(2));
}

function envLogVpdStatus(vpd: number): "low" | "optimal" | "high" | "critical" {
  if (vpd < 0.8) return "low";
  if (vpd <= 1.4) return "optimal";
  if (vpd <= 1.8) return "high";
  return "critical";
}

function envLogToApi(record: {
  id: number;
  salaCultivoId: number;
  camillaId: number | null;
  temperatura: number;
  humedad: number;
  vpd: number | null;
  co2: number | null;
  observaciones: string | null;
  registradoEn: Date;
}) {
  const dt = new Date(record.registradoEn);
  const date = dt.toISOString().slice(0, 10);
  const time = `${String(dt.getHours()).padStart(2, "0")}:${String(dt.getMinutes()).padStart(2, "0")}`;
  return {
    id: String(record.id),
    bedId: record.camillaId != null ? String(record.camillaId) : null,
    batchId: null as null,
    date,
    time,
    airTempC: record.temperatura,
    relativeHumidity: record.humedad,
    leafTempC: null as null,
    co2ppm: record.co2 ?? null,
    calculatedVPD: record.vpd ?? null,
    vpdStatus: record.vpd != null ? envLogVpdStatus(record.vpd) : null,
    notes: record.observaciones ?? null,
    bed: { roomId: String(record.salaCultivoId) },
  };
}

function registroAmbientalRoutes() {
  const router = Router();

  router.get("/", async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const records = await prisma.registroAmbiental.findMany({ orderBy: { id: "desc" } });
      res.json(records.map(envLogToApi));
    } catch (error) {
      next(error);
    }
  });

  router.post("/", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = req.body as Record<string, unknown>;
      const salaCultivoId = intId.parse(body.roomId);
      const camillaId = body.bedId != null && body.bedId !== "" && body.bedId !== "none"
        ? intId.parse(body.bedId)
        : undefined;
      const airTempC = Number(body.airTempC);
      const relativeHumidity = Number(body.relativeHumidity);
      const leafTempC = body.leafTempC != null && body.leafTempC !== "" ? Number(body.leafTempC) : undefined;
      const vpd = envLogCalcVPD(airTempC, relativeHumidity, leafTempC);
      const record = await prisma.registroAmbiental.create({
        data: {
          salaCultivoId,
          camillaId,
          temperatura: airTempC,
          humedad: relativeHumidity,
          vpd,
          co2: body.co2ppm != null && body.co2ppm !== "" ? Math.round(Number(body.co2ppm)) : undefined,
          observaciones: typeof body.notes === "string" && body.notes.trim() ? body.notes.trim() : undefined,
          registradoEn: new Date(`${body.date}T${body.time}:00`),
        },
      });
      res.status(201).json(envLogToApi(record));
    } catch (error) {
      next(error);
    }
  });

  router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const record = await prisma.registroAmbiental.findUnique({ where: { id: parseId(req) } });
      if (!record) throw new ApiError(404, "Registro ambiental no encontrado.");
      res.json(envLogToApi(record));
    } catch (error) {
      next(error);
    }
  });

  router.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
      await prisma.registroAmbiental.delete({ where: { id: parseId(req) } });
      res.json({ ok: true });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

function medicionRoutes() {
  const router = Router();
  const include = {
    salaCultivo: { select: { id: true, nombre: true } },
    camilla: { select: { id: true, nombre: true } },
    clonador: { select: { id: true, nombre: true } },
    planta: { select: { id: true, codigoPlanta: true, nombrePlanta: true } },
    madre: { select: { id: true, codigoMadre: true, nombreMadre: true } },
  };

  router.get("/", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { salaCultivoId, camillaId, clonadorId, plantaId, madreId, estado, tipo, fechaDesde, fechaHasta } = req.query as Record<string, string | undefined>;
      res.json(await prisma.medicionCultivo.findMany({
        where: {
          salaCultivoId: salaCultivoId ? Number(salaCultivoId) : undefined,
          camillaId: camillaId ? Number(camillaId) : undefined,
          clonadorId: clonadorId ? Number(clonadorId) : undefined,
          plantaId: plantaId ? Number(plantaId) : undefined,
          madreId: madreId ? Number(madreId) : undefined,
          estado: estado ?? undefined,
          tipo: tipo ?? undefined,
          fecha: {
            gte: fechaDesde ? new Date(fechaDesde) : undefined,
            lte: fechaHasta ? new Date(fechaHasta) : undefined,
          },
        },
        include,
        orderBy: [{ fecha: "desc" }, { hora: "desc" }],
      }));
    } catch (error) {
      next(error);
    }
  });

  router.post("/", async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.status(201).json(await prisma.medicionCultivo.create({
        data: medicionCultivoSchema.parse(req.body),
        include,
      }));
    } catch (error) {
      next(error);
    }
  });

  router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const record = await prisma.medicionCultivo.findUnique({ where: { id: parseId(req) }, include });
      if (!record) throw new ApiError(404, "Medicion no encontrada.");
      res.json(record);
    } catch (error) {
      next(error);
    }
  });

  router.put("/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await prisma.medicionCultivo.update({
        where: { id: parseId(req) },
        data: medicionCultivoSchema.partial().parse(req.body),
        include,
      }));
    } catch (error) {
      next(error);
    }
  });

  router.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
      await prisma.medicionCultivo.delete({ where: { id: parseId(req) } });
      res.json({ ok: true });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

function clonadorRoutes() {
  const router = Router();

  const clonadorSchema = z.object({
    codigoClonador: z.string().trim().min(1),
    salaCultivoId: intId,
    nombre: z.string().trim().min(1),
    estado: z.string().trim().min(1).default("activa"),
    capacidadMaximaEsquejes: z.coerce.number().int().min(0).max(60),
    contadorInicioEn: z.coerce.date().optional().nullable(),
    responsable: optionalText,
    descripcion: optionalText,
  });

  const include = {
    _count: { select: { esquejes: { where: { estado: { notIn: ["descartada", "discarded"] } } } } },
  };

  router.get("/", async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await prisma.clonador.findMany({ include, orderBy: { id: "desc" } }));
    } catch (error) { next(error); }
  });

  router.post("/", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = clonadorSchema.parse(req.body);
      res.status(201).json(await prisma.clonador.create({ data, include }));
    } catch (error) { next(error); }
  });

  router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const record = await prisma.clonador.findUnique({ where: { id: parseId(req) }, include });
      if (!record) throw new ApiError(404, "Clonador no encontrado.");
      res.json(record);
    } catch (error) { next(error); }
  });

  router.put("/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = clonadorSchema.partial().parse(req.body);
      res.json(await prisma.clonador.update({ where: { id: parseId(req) }, data, include }));
    } catch (error) { next(error); }
  });

  router.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseId(req);
      const count = await prisma.planta.count({ where: { clonadorId: id, estado: { notIn: ["descartada", "discarded"] } } });
      if (count > 0) throw new ApiError(409, `El clonador tiene ${count} esqueje(s) activo(s) y no puede eliminarse.`);
      await prisma.clonador.delete({ where: { id } });
      res.json({ ok: true });
    } catch (error) { next(error); }
  });

  router.get("/:id/occupancy", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseId(req);
      const [clonador, activeCount] = await Promise.all([
        prisma.clonador.findUnique({ where: { id }, select: { capacidadMaximaEsquejes: true } }),
        prisma.planta.count({ where: { clonadorId: id, estado: { notIn: ["descartada", "discarded"] } } }),
      ]);
      if (!clonador) throw new ApiError(404, "Clonador no encontrado.");
      const max = clonador.capacidadMaximaEsquejes;
      res.json({
        maxPlants: max,
        occupied: activeCount,
        available: Math.max(max - activeCount, 0),
        occupancyPercentage: max > 0 ? Math.round((activeCount / max) * 100) : 0,
      });
    } catch (error) { next(error); }
  });

  router.patch("/:id/capacity", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseId(req);
      const { capacity } = z.object({ capacity: z.coerce.number().int().min(0).max(60) }).parse(req.body);
      res.json(await prisma.clonador.update({ where: { id }, data: { capacidadMaximaEsquejes: capacity }, include }));
    } catch (error) { next(error); }
  });

  router.post("/:id/bulk", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const clonadorId = parseId(req);
      console.log("[bulk clonador] clonadorId:", clonadorId, "body:", JSON.stringify(req.body));
      const body = z.object({
        count: z.coerce.number().int().min(1).max(60),
        internalCodePrefix: z.string().trim().min(1).default("ESQ"),
        geneticsId: intId,
        motherPlantId: intId.optional(),
        batchId: intId.optional(),
        origin: z.string().trim().min(1).default("esqueje"),
        stage: z.string().trim().min(1).default("vegetativo"),
        status: z.string().trim().min(1).default("normal"),
        startDate: z.coerce.date(),
        notes: nullableText,
      }).parse(req.body);

      const [clonador, genetica] = await Promise.all([
        prisma.clonador.findUnique({ where: { id: clonadorId } }),
        prisma.genetica.findUnique({ where: { id: body.geneticsId }, select: { id: true } }),
      ]);
      if (!clonador) throw new ApiError(404, "Clonador no encontrado.");
      if (!genetica) throw new ApiError(400, `Genética con ID ${body.geneticsId} no existe. Verificá que esté guardada en la base de datos.`);

      if (body.motherPlantId) {
        const madre = await prisma.madre.findUnique({ where: { id: body.motherPlantId }, select: { id: true } });
        if (!madre) throw new ApiError(400, `Madre con ID ${body.motherPlantId} no existe.`);
      }
      if (body.batchId) {
        const lote = await prisma.loteCultivo.findUnique({ where: { id: body.batchId }, select: { id: true } });
        if (!lote) throw new ApiError(400, `Lote con ID ${body.batchId} no existe.`);
      }

      const activeCount = await prisma.planta.count({
        where: { clonadorId, estado: { notIn: ["descartada", "discarded"] } },
      });
      if (activeCount + body.count > clonador.capacidadMaximaEsquejes) {
        throw new ApiError(400, `No hay capacidad disponible en el clonador. Libres: ${Math.max(clonador.capacidadMaximaEsquejes - activeCount, 0)}.`);
      }

      const occupiedPositions = await prisma.planta.findMany({
        where: { clonadorId, estado: { notIn: ["descartada", "discarded"] } },
        select: { posicionClonador: true },
      });
      const occupiedSet = new Set(occupiedPositions.map((p) => p.posicionClonador).filter(Boolean) as number[]);
      const freePositions = Array.from(
        { length: Math.min(clonador.capacidadMaximaEsquejes, 60) },
        (_, i) => i + 1,
      ).filter((pos) => !occupiedSet.has(pos));

      if (freePositions.length < body.count) {
        throw new ApiError(400, "No hay posiciones libres suficientes en el clonador.");
      }

      const plantInclude = { genetica: true, madre: true, clonador: true };

      const created = await prisma.$transaction(async (tx) => {
        const existing = await tx.planta.findMany({
          where: { codigoPlanta: { startsWith: `${body.internalCodePrefix}-` } },
          select: { codigoPlanta: true },
        });
        let maxSeq = 0;
        for (const { codigoPlanta: code } of existing) {
          const match = code.match(/-(\d+)$/);
          if (match) {
            const num = parseInt(match[1], 10);
            if (num > maxSeq) maxSeq = num;
          }
        }

        const plants = [];
        for (let i = 0; i < body.count; i += 1) {
          const position = freePositions[i];
          const sequence = String(maxSeq + i + 1).padStart(4, "0");
          const codigoPlanta = `${body.internalCodePrefix}-${sequence}`;
          plants.push(await tx.planta.create({
            data: {
              codigoPlanta,
              nombrePlanta: codigoPlanta,
              clonadorId,
              posicionClonador: position,
              geneticaId: body.geneticsId,
              madreId: body.motherPlantId,
              loteCultivoId: body.batchId,
              origen: body.origin,
              etapa: body.stage,
              estado: body.status,
              fechaInicio: body.startDate,
              observaciones: body.notes ?? undefined,
            },
            include: plantInclude,
          }));
        }
        return plants;
      });

      res.status(201).json(created);
    } catch (error) { next(error); }
  });

  router.post("/:id/send-to-camilla", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const clonadorId = parseId(req);
      const { plantIds, targetCamillaId } = z.object({
        plantIds: z.array(intId).min(1),
        targetCamillaId: intId,
      }).parse(req.body);

      const camilla = await prisma.camilla.findUnique({
        where: { id: targetCamillaId },
        include: { _count: { select: { plantas: { where: { estado: { notIn: ["descartada", "discarded"] } } } } } },
      });
      if (!camilla) throw new ApiError(404, "Camilla destino no encontrada.");

      const freeSlots = camilla.capacidadMaximaPlantas - camilla._count.plantas;
      if (plantIds.length > freeSlots) throw new ApiError(409, `La camilla destino solo tiene ${freeSlots} lugar(es) libre(s).`);

      const occupied = await prisma.planta.findMany({
        where: { camillaId: targetCamillaId, estado: { notIn: ["descartada", "discarded"] } },
        select: { posicionCamilla: true },
      });
      const occupiedSet = new Set(occupied.map((p) => p.posicionCamilla).filter(Boolean) as number[]);
      let nextPos = 1;
      const assignments: Array<{ plantId: number; position: number }> = [];
      for (const plantId of plantIds) {
        while (occupiedSet.has(nextPos)) nextPos++;
        assignments.push({ plantId, position: nextPos });
        occupiedSet.add(nextPos);
        nextPos++;
      }

      await Promise.all(
        assignments.map(({ plantId, position }) =>
          prisma.planta.update({
            where: { id: plantId },
            data: { camillaId: targetCamillaId, posicionCamilla: position, clonadorId: null, posicionClonador: null },
          }),
        ),
      );

      res.json({ moved: plantIds.length });
    } catch (error) { next(error); }
  });

  return router;
}

const sistemaRiegoSchema = z.object({
  codigoRiego: z.string().trim().min(1),
  camillaId: intId,
  picosPorPlanta: z.coerce.number().min(0).optional(),
  horarioApertura: optionalText,
  cantidadLitros: z.coerce.number().min(0).optional(),
  tanque: optionalText,
  frecuenciaTiempo: optionalText,
  sistemaRegado: z.enum(["goteo", "continuo_intermitente", "otro"]),
  sistemaRegadoCustom: optionalText,
  notas: optionalText,
});

function sistemaRiegoRoutes() {
  const router = Router();
  const include = { camilla: { select: { nombre: true, codigoCamilla: true } } };

  router.get("/", async (req, res, next) => {
    try {
      const camillaId = req.query.camillaId ? intId.parse(req.query.camillaId) : undefined;
      res.json(
        await prisma.sistemaRiego.findMany({
          where: camillaId ? { camillaId } : undefined,
          include,
          orderBy: { id: "desc" },
        }),
      );
    } catch (error) { next(error); }
  });

  router.post("/", async (req, res, next) => {
    try {
      res.status(201).json(await prisma.sistemaRiego.create({ data: sistemaRiegoSchema.parse(req.body), include }));
    } catch (error) { next(error); }
  });

  router.get("/:id", async (req, res, next) => {
    try {
      const record = await prisma.sistemaRiego.findUnique({ where: { id: parseId(req) }, include });
      if (!record) throw new ApiError(404, "Sistema de riego no encontrado.");
      res.json(record);
    } catch (error) { next(error); }
  });

  router.put("/:id", async (req, res, next) => {
    try {
      res.json(
        await prisma.sistemaRiego.update({
          where: { id: parseId(req) },
          data: sistemaRiegoSchema.partial().parse(req.body),
          include,
        }),
      );
    } catch (error) { next(error); }
  });

  router.delete("/:id", async (req, res, next) => {
    try {
      res.json(await prisma.sistemaRiego.delete({ where: { id: parseId(req) } }));
    } catch (error) { next(error); }
  });

  return router;
}

export const cultivationRoutes = Router();

cultivationRoutes.use("/rooms", salaRoutes());
cultivationRoutes.use("/beds", camillaRoutes());
cultivationRoutes.use("/genetics", crudRoutes(prisma.genetica, geneticaSchema));
cultivationRoutes.use("/mothers", madreRoutes());
cultivationRoutes.use("/batches", loteCultivoRoutes());
cultivationRoutes.use("/plants", plantaRoutes());
cultivationRoutes.use("/environmental-logs", registroAmbientalRoutes());
cultivationRoutes.post("/vpd/preview", (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body as Record<string, unknown>;
    const vpd = envLogCalcVPD(
      Number(body.airTempC),
      Number(body.relativeHumidity),
      body.leafTempC != null && body.leafTempC !== "" ? Number(body.leafTempC) : undefined,
    );
    res.json({ calculatedVPD: vpd, vpdStatus: envLogVpdStatus(vpd) });
  } catch (error) {
    next(error);
  }
});
cultivationRoutes.use("/irrigation-logs", crudRoutes(prisma.riego, riegoSchema));
cultivationRoutes.use("/measurements", medicionRoutes());
cultivationRoutes.use("/tasks", crudRoutes(prisma.tareaCultivo, tareaCultivoSchema));
cultivationRoutes.use("/operational-tasks", crudRoutes(prisma.tareaCultivo, tareaCultivoSchema));
cultivationRoutes.use("/harvests", cosechaRoutes());
cultivationRoutes.use("/clonadores", clonadorRoutes());
cultivationRoutes.use("/irrigation-systems", sistemaRiegoRoutes());

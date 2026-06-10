import fs from "fs";
import path from "path";
import { Router, type NextFunction, type Request, type Response } from "express";
import multer from "multer";
import { z } from "zod";
import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/ApiError.js";

const intId = z.coerce.number().int().positive();
const optionalText = z.string().trim().min(1).optional();
const optionalDate = z.coerce.date().optional();

function parseId(req: Request): number {
  return intId.parse(req.params.id);
}

// ─── Multer — almacenamiento en disco ─────────────────────────────────────────

const UPLOADS_BASE = path.join(process.cwd(), "uploads", "documentos-socio");

const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  const allowed = ["application/pdf", "image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (allowed.includes(file.mimetype)) return cb(null, true);
  cb(new Error("Tipo de archivo no permitido. Use PDF, JPG, PNG o WEBP."));
};

// Multer para POST /api/members/:id/documents — :id es el socioId
const uploadBySocio = multer({
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      const rawId = _req.params.id;
      const socioId = Array.isArray(rawId) ? (rawId[0] ?? "tmp") : (rawId ?? "tmp");
      const dir = path.join(UPLOADS_BASE, socioId);
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`);
    },
  }),
});

// Multer para PATCH /api/member-documents/:id — :id es el documentoId, necesita resolver socioId
const uploadByDoc = multer({
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      prisma.documentoSocio
        .findUnique({ where: { id: Number(_req.params.id) }, select: { socioId: true } })
        .then((doc) => {
          const socioId = String(doc?.socioId ?? "tmp");
          const dir = path.join(UPLOADS_BASE, socioId);
          fs.mkdirSync(dir, { recursive: true });
          cb(null, dir);
        })
        .catch((err) => cb(err as Error, ""));
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`);
    },
  }),
});

// ─── Schemas de validación ────────────────────────────────────────────────────

const socioSchema = z.object({
  codigoSocio:       z.string().trim().min(1),
  nombre:            z.string().trim().min(1),
  apellido:          z.string().trim().min(1),
  dni:               z.string().trim().min(1).optional(),
  fechaNacimiento:   optionalDate,
  telefono:          optionalText,
  email:             z.string().trim().email("Formato de email inválido.").optional().or(z.literal("")),
  direccion:         optionalText,
  localidad:         optionalText,
  provincia:         optionalText,
  estado:            z.enum(["activo", "pendiente", "suspendido", "inactivo"]).default("activo"),
  cupoMensualGramos: z.coerce.number().nonnegative("El cupo no puede ser negativo.").optional(),
  observaciones:     optionalText,
});

const TIPOS_DOCUMENTO = ["credencial", "dni_frente", "dni_dorso", "reprocann", "certificado_medico", "autorizacion", "otro"] as const;

const documentoSchema = z.object({
  tipoDocumento:    z.enum(TIPOS_DOCUMENTO),
  numeroDocumento:  optionalText,
  fechaEmision:     optionalDate,
  fechaVencimiento: optionalDate,
  estado:           z.enum(["vigente", "por_vencer", "vencido", "pendiente"]).default("vigente"),
  observaciones:    optionalText,
});

// ─── Include para queries ─────────────────────────────────────────────────────

const SOCIO_INCLUDE = {
  documentos: {
    where: { estado: { not: "inactivo" } },
    orderBy: [{ tipoDocumento: "asc" as const }, { fechaVencimiento: "desc" as const }],
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseEmail(value: unknown): string | undefined {
  if (typeof value !== "string" || !value.trim()) return undefined;
  return value.trim();
}

function buildSocioData(body: z.infer<typeof socioSchema>) {
  return {
    codigoSocio:       body.codigoSocio,
    nombre:            body.nombre,
    apellido:          body.apellido,
    dni:               body.dni || undefined,
    fechaNacimiento:   body.fechaNacimiento,
    telefono:          body.telefono,
    email:             parseEmail(body.email),
    direccion:         body.direccion,
    localidad:         body.localidad,
    provincia:         body.provincia,
    estado:            body.estado,
    cupoMensualGramos: body.cupoMensualGramos,
    observaciones:     body.observaciones,
  };
}

// ─── Rutas de socios ──────────────────────────────────────────────────────────

function socioRoutes() {
  const router = Router();

  // GET /api/members — listar todos con documentos incluidos
  router.get("/", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { estado, search } = req.query as Record<string, string | undefined>;

      const where: Record<string, unknown> = { estado: { not: "eliminado" } };
      if (estado) where.estado = estado;
      if (search) {
        const q = search.trim();
        where.OR = [
          { nombre: { contains: q } },
          { apellido: { contains: q } },
          { codigoSocio: { contains: q } },
          { dni: { contains: q } },
        ];
      }

      res.json(
        await prisma.socio.findMany({
          where,
          include: SOCIO_INCLUDE,
          orderBy: { id: "desc" },
        }),
      );
    } catch (error) {
      next(error);
    }
  });

  // POST /api/members — crear socio
  router.post("/", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = buildSocioData(socioSchema.parse(req.body));
      res.status(201).json(
        await prisma.socio.create({ data, include: SOCIO_INCLUDE }),
      );
    } catch (error) {
      next(error);
    }
  });

  // GET /api/members/:id — detalle con documentos
  router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const record = await prisma.socio.findUnique({
        where: { id: parseId(req) },
        include: { documentos: { orderBy: [{ tipoDocumento: "asc" }, { fechaVencimiento: "desc" }] } },
      });
      if (!record) throw new ApiError(404, "Socio no encontrado.");
      res.json(record);
    } catch (error) {
      next(error);
    }
  });

  // PATCH /api/members/:id — editar socio
  router.patch("/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = buildSocioData(socioSchema.partial().parse(req.body) as z.infer<typeof socioSchema>);
      res.json(
        await prisma.socio.update({
          where: { id: parseId(req) },
          data,
          include: SOCIO_INCLUDE,
        }),
      );
    } catch (error) {
      next(error);
    }
  });

  // DELETE /api/members/:id — baja lógica (estado → inactivo, libera campos únicos)
  router.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseId(req);
      const existing = await prisma.socio.findUnique({
        where: { id },
        select: { codigoSocio: true, dni: true },
      });
      if (!existing) throw new ApiError(404, "Socio no encontrado.");
      const suffix = `__del${Date.now()}`;
      res.json(
        await prisma.socio.update({
          where: { id },
          data: {
            estado: "eliminado",
            codigoSocio: `${existing.codigoSocio}${suffix}`,
            dni: existing.dni ? `${existing.dni}${suffix}` : undefined,
          },
          include: SOCIO_INCLUDE,
        }),
      );
    } catch (error) {
      next(error);
    }
  });

  return router;
}

// ─── Rutas de documentos del socio ───────────────────────────────────────────

function documentoRoutes() {
  const router = Router({ mergeParams: true });

  // GET /api/members/:id/documents
  router.get("/", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const socioId = intId.parse(req.params.id);
      const socio = await prisma.socio.findUnique({ where: { id: socioId } });
      if (!socio) throw new ApiError(404, "Socio no encontrado.");
      res.json(
        await prisma.documentoSocio.findMany({
          where: { socioId },
          orderBy: [{ tipoDocumento: "asc" }, { fechaVencimiento: "desc" }],
        }),
      );
    } catch (error) {
      next(error);
    }
  });

  // POST /api/members/:id/documents — acepta JSON o multipart/form-data
  router.post(
    "/",
    uploadBySocio.single("arquivo"),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const socioId = intId.parse(req.params.id);
        const socio = await prisma.socio.findUnique({ where: { id: socioId } });
        if (!socio) throw new ApiError(404, "Socio no encontrado.");

        const body = documentoSchema.parse(req.body);

        // Si se subió un archivo, construir la URL relativa y metadata
        let archivoUrl: string | undefined;
        let nombreArchivo: string | undefined;
        let mimeType: string | undefined;
        let tamanioBytes: number | undefined;
        let subidoEn: Date | undefined;

        if (req.file) {
          archivoUrl   = `/uploads/documentos-socio/${socioId}/${req.file.filename}`;
          nombreArchivo = req.file.originalname;
          mimeType      = req.file.mimetype;
          tamanioBytes  = req.file.size;
          subidoEn      = new Date();
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        res.status(201).json(
          await (prisma.documentoSocio.create as any)({
            data: {
              ...body,
              socioId,
              archivoUrl,
              nombreArchivo,
              mimeType,
              tamanioBytes,
              subidoEn,
            },
          }),
        );
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}

// ─── Rutas standalone de documentos (PATCH / DELETE por id de documento) ──────

function documentoStandaloneRoutes() {
  const router = Router();

  // PATCH /api/member-documents/:id — acepta JSON o multipart con nuevo archivo
  router.patch(
    "/:id",
    uploadByDoc.single("arquivo"),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const id = intId.parse(req.params.id);
        const body = documentoSchema.partial().parse(req.body);

        const extra: Record<string, unknown> = {};
        if (req.file) {
          const doc = await prisma.documentoSocio.findUnique({ where: { id } });
          extra.archivoUrl    = `/uploads/documentos-socio/${doc?.socioId ?? "0"}/${req.file.filename}`;
          extra.nombreArchivo = req.file.originalname;
          extra.mimeType      = req.file.mimetype;
          extra.tamanioBytes  = req.file.size;
          extra.subidoEn      = new Date();
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        res.json(
          await (prisma.documentoSocio.update as any)({
            where: { id },
            data: { ...body, ...extra },
          }),
        );
      } catch (error) {
        next(error);
      }
    },
  );

  // DELETE /api/member-documents/:id — soft delete (estado → inactivo)
  router.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = intId.parse(req.params.id);
      res.json(
        await prisma.documentoSocio.update({
          where: { id },
          data: { estado: "inactivo" },
        }),
      );
    } catch (error) {
      next(error);
    }
  });

  return router;
}

// ─── Exports ──────────────────────────────────────────────────────────────────

export const memberRoutes = Router();
memberRoutes.use("/", socioRoutes());
memberRoutes.use("/:id/documents", documentoRoutes());

export const memberDocumentRoutes = documentoStandaloneRoutes();

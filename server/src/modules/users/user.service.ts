import bcrypt from "bcryptjs";
import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import type { CreateUserInput, UpdateUserInput } from "./user.schema.js";

const SALT_ROUNDS = 10;

const SELECT_WITHOUT_HASH = {
  id: true,
  codigoUsuario: true,
  username: true,
  nombre: true,
  apellido: true,
  email: true,
  estado: true,
  ultimoLoginEn: true,
  creadoEn: true,
  actualizadoEn: true,
  roles: {
    select: {
      rol: { select: { id: true, slug: true, nombre: true } },
    },
  },
} as const;

function mapUser(raw: {
  id: number; codigoUsuario: string; username: string; nombre: string;
  apellido: string | null; email: string | null; estado: string;
  ultimoLoginEn: Date | null; creadoEn: Date; actualizadoEn: Date;
  roles: Array<{ rol: { id: number; slug: string; nombre: string } }>;
}) {
  return {
    ...raw,
    roles: raw.roles.map((ur) => ur.rol),
  };
}

export const userService = {
  async list() {
    const users = await prisma.usuario.findMany({
      orderBy: { creadoEn: "desc" },
      select: SELECT_WITHOUT_HASH,
    });
    return users.map(mapUser);
  },

  async getById(id: number) {
    const user = await prisma.usuario.findUnique({
      where: { id },
      select: SELECT_WITHOUT_HASH,
    });
    if (!user) throw new ApiError(404, "Usuario no encontrado.");
    return mapUser(user);
  },

  async create(data: CreateUserInput) {
    const exists = await prisma.usuario.findUnique({ where: { username: data.username } });
    if (exists) throw new ApiError(409, "El username ya está en uso.");

    const roles = await prisma.rol.findMany({ where: { slug: { in: data.roleSlugs } } });
    if (roles.length !== data.roleSlugs.length) {
      throw new ApiError(400, "Uno o más roles no existen.");
    }

    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

    const user = await prisma.usuario.create({
      data: {
        codigoUsuario: data.codigoUsuario,
        username: data.username,
        nombre: data.nombre,
        apellido: data.apellido,
        email: data.email || null,
        passwordHash,
        estado: data.estado,
        roles: { create: roles.map((r) => ({ rolId: r.id })) },
      },
      select: SELECT_WITHOUT_HASH,
    });

    return mapUser(user);
  },

  async update(id: number, data: UpdateUserInput) {
    await this.getById(id);

    const updateData: Record<string, unknown> = {};
    if (data.nombre)   updateData.nombre   = data.nombre;
    if (data.apellido !== undefined) updateData.apellido = data.apellido;
    if (data.email !== undefined)    updateData.email    = data.email || null;
    if (data.estado)   updateData.estado   = data.estado;
    if (data.password) updateData.passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

    await prisma.usuario.update({ where: { id }, data: updateData });

    if (data.roleSlugs) {
      const roles = await prisma.rol.findMany({ where: { slug: { in: data.roleSlugs } } });
      if (roles.length !== data.roleSlugs.length) {
        throw new ApiError(400, "Uno o más roles no existen.");
      }
      await prisma.usuarioRol.deleteMany({ where: { usuarioId: id } });
      await prisma.usuarioRol.createMany({
        data: roles.map((r) => ({ usuarioId: id, rolId: r.id })),
      });
    }

    return this.getById(id);
  },

  async deactivate(id: number) {
    await this.getById(id);
    await prisma.usuario.update({ where: { id }, data: { estado: "inactivo" } });
    return this.getById(id);
  },
};

import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import type { CreateRoleInput, UpdateRoleInput } from "./role.schema.js";

// Los roles base del dominio no pueden eliminarse
const PROTECTED_SLUGS = ["administrador", "operador", "auditor"];

export const roleService = {
  async list() {
    return prisma.rol.findMany({
      orderBy: { id: "asc" },
      include: { _count: { select: { usuarios: true, permisos: true } } },
    });
  },

  async getById(id: number) {
    const rol = await prisma.rol.findUnique({
      where: { id },
      include: { permisos: { include: { permiso: true } } },
    });
    if (!rol) throw new ApiError(404, "Rol no encontrado.");
    return { ...rol, permisos: rol.permisos.map((rp) => rp.permiso) };
  },

  async create(data: CreateRoleInput) {
    const exists = await prisma.rol.findUnique({ where: { slug: data.slug } });
    if (exists) throw new ApiError(409, "El slug ya está en uso.");
    return prisma.rol.create({ data });
  },

  async update(id: number, data: UpdateRoleInput) {
    const rol = await prisma.rol.findUnique({ where: { id } });
    if (!rol) throw new ApiError(404, "Rol no encontrado.");
    return prisma.rol.update({ where: { id }, data });
  },

  async getPermissions(id: number) {
    const rol = await prisma.rol.findUnique({
      where: { id },
      include: { permisos: { include: { permiso: true } } },
    });
    if (!rol) throw new ApiError(404, "Rol no encontrado.");
    return rol.permisos.map((rp) => rp.permiso);
  },

  async setPermissions(id: number, permissionIds: number[]) {
    const rol = await prisma.rol.findUnique({ where: { id } });
    if (!rol) throw new ApiError(404, "Rol no encontrado.");
    if (PROTECTED_SLUGS.includes(rol.slug)) {
      throw new ApiError(403, "No se pueden modificar los permisos de un rol base desde este endpoint. Use el seed.");
    }

    await prisma.rolPermiso.deleteMany({ where: { rolId: id } });
    if (permissionIds.length > 0) {
      await prisma.rolPermiso.createMany({
        data: permissionIds.map((permisoId) => ({ rolId: id, permisoId })),
      });
    }
    return this.getPermissions(id);
  },

  listAllPermissions() {
    return prisma.permiso.findMany({ orderBy: [{ modulo: "asc" }, { accion: "asc" }] });
  },
};

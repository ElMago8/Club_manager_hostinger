/**
 * auth.service — Fase 2.1
 *
 * Login básico: valida username/password, devuelve usuario + roles + permisos.
 * No implementa JWT en esta fase. El middleware de sesión/token queda para Fase 2.2.
 */

import bcrypt from "bcryptjs";
import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import type { LoginInput } from "./auth.schema.js";

export const authService = {
  async login(data: LoginInput) {
    const usuario = await prisma.usuario.findUnique({
      where: { username: data.username },
      include: {
        roles: {
          include: {
            rol: {
              include: {
                permisos: { include: { permiso: true } },
              },
            },
          },
        },
      },
    });

    if (!usuario) throw new ApiError(401, "Credenciales inválidas.");
    if (usuario.estado !== "activo") throw new ApiError(403, "El usuario no está activo.");

    const passwordOk = await bcrypt.compare(data.password, usuario.passwordHash);
    if (!passwordOk) throw new ApiError(401, "Credenciales inválidas.");

    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { ultimoLoginEn: new Date() },
    });

    const roles = usuario.roles.map((ur) => ({
      id:     ur.rol.id,
      slug:   ur.rol.slug,
      nombre: ur.rol.nombre,
    }));

    const permisosSet = new Map<number, { id: number; clavePermiso: string; modulo: string; accion: string }>();
    for (const ur of usuario.roles) {
      for (const rp of ur.rol.permisos) {
        permisosSet.set(rp.permiso.id, {
          id:           rp.permiso.id,
          clavePermiso: rp.permiso.clavePermiso,
          modulo:       rp.permiso.modulo,
          accion:       rp.permiso.accion,
        });
      }
    }

    return {
      usuario: {
        id:            usuario.id,
        codigoUsuario: usuario.codigoUsuario,
        username:      usuario.username,
        nombre:        usuario.nombre,
        apellido:      usuario.apellido,
        email:         usuario.email,
        estado:        usuario.estado,
        ultimoLoginEn: usuario.ultimoLoginEn,
      },
      roles,
      permisos: Array.from(permisosSet.values()),
    };
  },
};

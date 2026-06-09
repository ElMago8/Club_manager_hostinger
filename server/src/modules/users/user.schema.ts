import { z } from "zod";

export const createUserSchema = z.object({
  codigoUsuario: z.string().min(1),
  username:      z.string().min(2).max(50),
  nombre:        z.string().min(1),
  apellido:      z.string().optional(),
  email:         z.string().email().optional().or(z.literal("")),
  password:      z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  estado:        z.enum(["activo", "pendiente", "inactivo", "bloqueado"]).default("activo"),
  roleSlugs:     z.array(z.string()).min(1, "Se requiere al menos un rol"),
});

export const updateUserSchema = z.object({
  nombre:    z.string().min(1).optional(),
  apellido:  z.string().optional(),
  email:     z.string().email().optional().or(z.literal("")),
  password:  z.string().min(8).optional(),
  estado:    z.enum(["activo", "pendiente", "inactivo", "bloqueado"]).optional(),
  roleSlugs: z.array(z.string()).optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

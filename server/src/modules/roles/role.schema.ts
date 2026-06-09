import { z } from "zod";

export const createRoleSchema = z.object({
  slug:        z.string().min(2).max(50).regex(/^[a-z_]+$/, "Solo letras minúsculas y guiones bajos"),
  nombre:      z.string().min(1),
  descripcion: z.string().optional(),
  estado:      z.enum(["activo", "inactivo"]).default("activo"),
});

export const updateRoleSchema = createRoleSchema.partial().omit({ slug: true });

export const setRolePermissionsSchema = z.object({
  permissionIds: z.array(z.number().int().positive()),
});

export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;

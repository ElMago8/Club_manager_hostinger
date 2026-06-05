import { z } from "zod";

export const motherStatusSchema = z.enum(["active", "observation", "discarded", "archived"]);

export const createMotherSchema = z.object({
  code: z.string().min(1),
  geneticsId: z.string().min(1),
  roomId: z.string().optional(),
  status: motherStatusSchema.default("active"),
  startDate: z.coerce.date(),
  notes: z.string().optional(),
});

export const updateMotherSchema = createMotherSchema.partial();

export const updateMotherStatusSchema = z.object({
  status: motherStatusSchema,
});

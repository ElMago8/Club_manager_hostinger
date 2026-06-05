import { z } from "zod";

export const bedStatusSchema = z.enum(["empty", "active", "cleaning", "maintenance", "out_of_use"]);

export const createBedSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  roomId: z.string().optional(),
  status: bedStatusSchema.default("empty"),
  maxPlants: z.number().int().min(0).max(100),
  notes: z.string().optional(),
});

export const updateBedSchema = createBedSchema.partial().extend({
  maxPlants: z.number().int().min(0).max(100).optional(),
});

export const updateBedStatusSchema = z.object({
  status: bedStatusSchema,
});

export const updateBedCapacitySchema = z.object({
  maxPlants: z.number().int().min(0).max(100),
});

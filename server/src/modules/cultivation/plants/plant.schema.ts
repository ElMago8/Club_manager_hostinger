import { z } from "zod";

export const plantOriginSchema = z.enum(["seed", "clone", "internal_mother", "external_purchase", "other"]);
export const plantStageSchema = z.enum(["clone", "vegetative", "flowering", "harvest", "drying", "curing", "released", "discarded"]);
export const plantStatusSchema = z.enum(["normal", "observation", "alert", "discarded", "harvested"]);

export const plantFiltersSchema = z.object({
  bedId: z.string().optional(),
  batchId: z.string().optional(),
  geneticsId: z.string().optional(),
  motherPlantId: z.string().optional(),
  stage: plantStageSchema.optional(),
  status: plantStatusSchema.optional(),
});

export const createPlantSchema = z.object({
  internalCode: z.string().min(1),
  bedId: z.string().min(1),
  bedPosition: z.number().int().min(1),
  batchId: z.string().optional(),
  geneticsId: z.string().optional(),
  motherPlantId: z.string().optional(),
  origin: plantOriginSchema,
  stage: plantStageSchema,
  status: plantStatusSchema.default("normal"),
  startDate: z.coerce.date(),
  stageStartDate: z.coerce.date().optional(),
  potCode: z.string().optional(),
  potSizeLiters: z.number().positive().optional(),
  potType: z.string().optional(),
  substrate: z.string().optional(),
  notes: z.string().optional(),
});

export const updatePlantSchema = createPlantSchema.partial().extend({
  bedPosition: z.number().int().min(1).optional(),
});

export const updatePlantStatusSchema = z.object({
  status: plantStatusSchema,
});

export const bulkCreatePlantsSchema = z.object({
  bedId: z.string().min(1),
  count: z.number().int().min(1).max(100),
  internalCodePrefix: z.string().min(1).default("PLANT"),
  batchId: z.string().optional(),
  geneticsId: z.string().optional(),
  motherPlantId: z.string().optional(),
  origin: plantOriginSchema,
  stage: plantStageSchema,
  status: plantStatusSchema.default("normal"),
  startDate: z.coerce.date(),
  stageStartDate: z.coerce.date().optional(),
  potCodePrefix: z.string().optional(),
  potSizeLiters: z.number().positive().optional(),
  potType: z.string().optional(),
  substrate: z.string().optional(),
  notes: z.string().optional(),
});

export const updatePlantStageSchema = z.object({
  stage: plantStageSchema,
  stageStartDate: z.coerce.date().optional(),
  notes: z.string().optional(),
});

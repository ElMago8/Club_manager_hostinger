import { z } from "zod";

export const geneticsTypeSchema = z.enum(["regular", "feminized", "automatic", "clone", "unknown"]);
export const dominantProfileSchema = z.enum(["indica", "sativa", "hybrid", "unknown"]);
const plantOriginSchema = z.enum(["seed", "clone", "internal_mother", "external_purchase", "other"]);
const plantStageSchema = z.enum(["clone", "vegetative", "flowering", "harvest", "drying", "curing", "released", "discarded"]);
const plantStatusSchema = z.enum(["normal", "observation", "alert", "discarded", "harvested"]);

export const assignGeneticsToBedSchema = z.object({
  bedId: z.string().min(1),
  plantCount: z.number().int().min(1).max(100),
  motherPlantId: z.string().optional(),
  batchId: z.string().optional(),
  origin: plantOriginSchema.default("seed"),
  stage: plantStageSchema.default("vegetative"),
  status: plantStatusSchema.default("normal"),
  startDate: z.coerce.date().optional(),
  potSizeLiters: z.number().positive().optional(),
  potType: z.string().optional(),
  substrate: z.string().optional(),
  notes: z.string().optional(),
});

export const createGeneticsSchema = z.object({
  name: z.string().min(1),
  breeder: z.string().optional(),
  type: geneticsTypeSchema.default("unknown"),
  dominantProfile: dominantProfileSchema.default("unknown"),
  notes: z.string().optional(),
  assignToBed: assignGeneticsToBedSchema.optional(),
});

export const updateGeneticsSchema = createGeneticsSchema.partial();

import { z } from "zod";

export const irrigationTypeSchema = z.enum(["manual", "automatic", "corrective", "water_only", "flush"]);

const optionalPh = z.number().min(0).max(14).optional();
const optionalPpm = z.number().min(0).optional();
const optionalEc = z.number().min(0).optional();

export const irrigationFiltersSchema = z.object({
  bedId: z.string().optional(),
  plantId: z.string().optional(),
  batchId: z.string().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});

export const createIrrigationLogSchema = z.object({
  bedId: z.string().optional(),
  batchId: z.string().optional(),
  plantId: z.string().optional(),
  date: z.coerce.date(),
  time: z.string().min(1),
  irrigationType: irrigationTypeSchema,
  litersPrepared: z.number().min(0),
  litersApplied: z.number().min(0),
  phIn: optionalPh,
  ppmIn: optionalPpm,
  ecIn: optionalEc,
  phRunoff: optionalPh,
  ppmRunoff: optionalPpm,
  ecRunoff: optionalEc,
  substratePH: optionalPh,
  substratePPM: optionalPpm,
  substrateEC: optionalEc,
  runoffPercentage: z.number().min(0).max(100).optional(),
  recipeName: z.string().optional(),
  nutrientsNotes: z.string().optional(),
  responsibleName: z.string().min(1),
  notes: z.string().optional(),
});

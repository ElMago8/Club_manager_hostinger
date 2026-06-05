import { z } from "zod";

export const environmentalFiltersSchema = z.object({
  bedId: z.string().optional(),
  batchId: z.string().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  vpdStatus: z.enum(["low", "optimal", "high", "critical"]).optional(),
});

export const createEnvironmentalLogSchema = z.object({
  bedId: z.string().optional(),
  batchId: z.string().optional(),
  date: z.coerce.date(),
  time: z.string().min(1),
  airTempC: z.number(),
  relativeHumidity: z.number().min(0).max(100),
  leafTempC: z.number().optional(),
  co2ppm: z.number().int().nonnegative().optional(),
  stage: z.string().optional(),
  notes: z.string().optional(),
});

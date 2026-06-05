import { z } from "zod";

export const vpdPreviewSchema = z.object({
  airTempC: z.number(),
  relativeHumidity: z.number().min(0).max(100),
  leafTempC: z.number().optional(),
  defaultLeafOffset: z.number().optional(),
  stage: z.string().optional(),
});

export const vpdTableQuerySchema = z.object({
  leafOffset: z.coerce.number().optional(),
});

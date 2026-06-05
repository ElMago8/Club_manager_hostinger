import { z } from "zod";

export const measurementTypeSchema = z.enum([
  "substrate",
  "liquid_input",
  "runoff",
  "mixed",
  "corrective",
  "routine_check",
]);

export const relatedModuleSchema = z.enum([
  "room",
  "bed",
  "plant",
  "mother",
  "irrigation",
  "environmental",
  "general",
]);

export const measurementStatusSchema = z.enum(["normal", "observation", "alert", "critical"]);

export const measurementMethodSchema = z.enum(["manual_meter", "drops", "lab", "sensor", "estimated", "other"]);

const optionalPh = z.number().min(0).max(14).optional();
const optionalPpm = z.number().min(0).optional();
const optionalEc = z.number().min(0).optional();
const optionalTemp = z.number().min(0).max(50).optional();

function hasAnyValue(values: Array<unknown>) {
  return values.some((value) => value !== undefined && value !== null);
}

const measurementBaseSchema = z.object({
  measurementType: measurementTypeSchema,
  date: z.coerce.date(),
  time: z.string().min(1),
  roomId: z.string().optional(),
  bedId: z.string().optional(),
  plantId: z.string().optional(),
  motherPlantId: z.string().optional(),
  batchId: z.string().optional(),
  relatedModule: relatedModuleSchema.default("general"),
  substratePH: optionalPh,
  substratePPM: optionalPpm,
  substrateEC: optionalEc,
  liquidPH: optionalPh,
  liquidPPM: optionalPpm,
  liquidEC: optionalEc,
  runoffPH: optionalPh,
  runoffPPM: optionalPpm,
  runoffEC: optionalEc,
  waterTempC: optionalTemp,
  substrateTempC: optionalTemp,
  measurementMethod: measurementMethodSchema.optional(),
  responsibleName: z.string().optional(),
  status: measurementStatusSchema.optional(),
  notes: z.string().optional(),
});

function validateRequiredMeasurementValues(data: z.infer<typeof measurementBaseSchema>, ctx: z.RefinementCtx) {
  const requirements: Record<
    z.infer<typeof measurementTypeSchema>,
    { fields: Array<unknown>; message: string } | undefined
  > = {
    substrate: {
      fields: [data.substratePH, data.substratePPM, data.substrateEC],
      message: "substrate measurements require substratePH, substratePPM or substrateEC.",
    },
    liquid_input: {
      fields: [data.liquidPH, data.liquidPPM, data.liquidEC],
      message: "liquid_input measurements require liquidPH, liquidPPM or liquidEC.",
    },
    runoff: {
      fields: [data.runoffPH, data.runoffPPM, data.runoffEC],
      message: "runoff measurements require runoffPH, runoffPPM or runoffEC.",
    },
    mixed: undefined,
    corrective: undefined,
    routine_check: undefined,
  };

  const requirement = requirements[data.measurementType];
  if (requirement && !hasAnyValue(requirement.fields)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: requirement.message, path: ["measurementType"] });
  }
}

export const measurementFiltersSchema = z.object({
  roomId: z.string().optional(),
  bedId: z.string().optional(),
  plantId: z.string().optional(),
  motherPlantId: z.string().optional(),
  batchId: z.string().optional(),
  measurementType: measurementTypeSchema.optional(),
  status: measurementStatusSchema.optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  relatedModule: relatedModuleSchema.optional(),
});

export const createMeasurementSchema = measurementBaseSchema.superRefine(validateRequiredMeasurementValues);

export const updateMeasurementSchema = measurementBaseSchema.partial();

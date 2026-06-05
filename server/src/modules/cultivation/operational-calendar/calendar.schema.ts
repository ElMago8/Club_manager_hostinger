import { z } from "zod";

export const taskTypeSchema = z.enum([
  "irrigation",
  "nutrition",
  "environmental_check",
  "drainage_check",
  "sanitary_inspection",
  "pruning",
  "transplant",
  "harvest_preparation",
  "harvest",
  "drying_check",
  "curing_check",
  "cleaning",
  "maintenance",
  "inventory_check",
  "custom",
]);

export const taskPrioritySchema = z.enum(["low", "medium", "high", "critical"]);
export const taskStatusSchema = z.enum(["pending", "in_progress", "completed", "cancelled", "overdue"]);
export const relatedModuleSchema = z.enum(["cultivation", "bed", "plant", "environmental", "irrigation", "stock", "general"]);
export const recurrenceTypeSchema = z.enum(["none", "daily", "weekly", "monthly", "custom"]);

const taskBaseFields = {
  title: z.string().min(1),
  description: z.string().optional(),
  taskType: taskTypeSchema,
  priority: taskPrioritySchema,
  status: taskStatusSchema.default("pending"),
  dueDate: z.coerce.date(),
  dueTime: z.string().optional(),
  assignedToName: z.string().optional(),
  assignedToUserId: z.string().optional(),
  roomId: z.string().optional(),
  bedId: z.string().optional(),
  plantId: z.string().optional(),
  batchId: z.string().optional(),
  relatedModule: relatedModuleSchema.default("cultivation"),
  recurrenceType: recurrenceTypeSchema.default("none"),
  recurrenceInterval: z.number().int().positive().optional(),
  completedByName: z.string().optional(),
  notes: z.string().optional(),
};

const taskBaseSchema = z
  .object(taskBaseFields)
  .superRefine((value, ctx) => {
    if (value.priority === "critical" && !value.description?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["description"],
        message: "Critical tasks require a description.",
      });
    }
  });

export const createTaskSchema = taskBaseSchema;
export const updateTaskSchema = z.object(taskBaseFields).partial();

export const updateTaskStatusSchema = z.object({
  status: taskStatusSchema,
  notes: z.string().optional(),
});

export const completeTaskSchema = z.object({
  completedByName: z.string().min(1).optional(),
  notes: z.string().optional(),
});

export const taskFiltersSchema = z.object({
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  taskType: taskTypeSchema.optional(),
  assignedToName: z.string().optional(),
  roomId: z.string().optional(),
  bedId: z.string().optional(),
  plantId: z.string().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  overdueOnly: z.coerce.boolean().optional(),
});

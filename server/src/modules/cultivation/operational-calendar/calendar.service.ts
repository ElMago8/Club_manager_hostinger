import { prisma } from "../../../config/prisma.js";
import { ApiError } from "../../../utils/ApiError.js";
import type {
  completeTaskSchema,
  createTaskSchema,
  taskFiltersSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
} from "./calendar.schema.js";
import type { z } from "zod";

type CreateTaskInput = z.infer<typeof createTaskSchema>;
type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
type UpdateTaskStatusInput = z.infer<typeof updateTaskStatusSchema>;
type CompleteTaskInput = z.infer<typeof completeTaskSchema>;
type TaskFilters = z.infer<typeof taskFiltersSchema>;

function dueDateTime(task: { dueDate: Date; dueTime?: string | null }) {
  const due = new Date(task.dueDate);
  const [hours = "23", minutes = "59"] = (task.dueTime ?? "23:59").split(":");
  due.setHours(Number(hours), Number(minutes), 0, 0);
  return due;
}

function normalizeTaskStatus<T extends { status: string; dueDate: Date; dueTime?: string | null }>(task: T): T {
  if ((task.status === "pending" || task.status === "in_progress") && dueDateTime(task).getTime() < Date.now()) {
    return { ...task, status: "overdue" };
  }
  return task;
}

const includeRelations = { bed: true, plant: true };

export const calendarService = {
  async list(filters: TaskFilters) {
    const tasks = await prisma.operationalTask.findMany({
      where: {
        status: filters.overdueOnly ? { in: ["pending", "in_progress", "overdue"] } : filters.status,
        priority: filters.priority,
        taskType: filters.taskType,
        assignedToName: filters.assignedToName ? { contains: filters.assignedToName } : undefined,
        roomId: filters.roomId,
        bedId: filters.bedId,
        plantId: filters.plantId,
        dueDate: {
          gte: filters.dateFrom,
          lte: filters.dateTo,
        },
      },
      include: includeRelations,
      orderBy: [{ dueDate: "asc" }, { dueTime: "asc" }],
    });

    return tasks.map(normalizeTaskStatus).filter((task) => {
      if (!filters.overdueOnly) return true;
      return task.status === "overdue";
    });
  },

  create(data: CreateTaskInput) {
    return prisma.operationalTask.create({ data, include: includeRelations });
  },

  async getById(id: string) {
    const task = await prisma.operationalTask.findUnique({ where: { id }, include: includeRelations });
    if (!task) throw new ApiError(404, "Operational task not found.");
    return normalizeTaskStatus(task);
  },

  async update(id: string, data: UpdateTaskInput) {
    await this.getById(id);
    return prisma.operationalTask.update({ where: { id }, data, include: includeRelations });
  },

  async updateStatus(id: string, data: UpdateTaskStatusInput) {
    await this.getById(id);
    const updateData = data.status === "completed"
      ? { ...data, completedAt: new Date() }
      : data;
    return prisma.operationalTask.update({ where: { id }, data: updateData, include: includeRelations });
  },

  async complete(id: string, data: CompleteTaskInput) {
    await this.getById(id);
    return prisma.operationalTask.update({
      where: { id },
      data: {
        status: "completed",
        completedAt: new Date(),
        completedByName: data.completedByName,
        notes: data.notes,
      },
      include: includeRelations,
    });
  },

  async cancel(id: string) {
    await this.getById(id);
    return prisma.operationalTask.update({ where: { id }, data: { status: "cancelled" }, include: includeRelations });
  },
};

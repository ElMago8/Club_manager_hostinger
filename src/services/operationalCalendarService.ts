import { apiRequest, withMockFallback } from "@/services/cultivationApi";

export type OperationalTaskType =
  | "irrigation"
  | "nutrition"
  | "environmental_check"
  | "drainage_check"
  | "sanitary_inspection"
  | "pruning"
  | "transplant"
  | "harvest_preparation"
  | "harvest"
  | "drying_check"
  | "curing_check"
  | "cleaning"
  | "maintenance"
  | "inventory_check"
  | "custom";

export type OperationalTaskPriority = "low" | "medium" | "high" | "critical";
export type OperationalTaskStatus = "pending" | "in_progress" | "completed" | "cancelled" | "overdue";
export type OperationalTaskRecurrence = "none" | "daily" | "weekly" | "monthly" | "custom";

export interface OperationalTask {
  id: string;
  title: string;
  description?: string | null;
  taskType: OperationalTaskType;
  priority: OperationalTaskPriority;
  status: OperationalTaskStatus;
  dueDate: string;
  dueTime?: string | null;
  assignedToName?: string | null;
  roomId?: string | null;
  bedId?: string | null;
  plantId?: string | null;
  batchId?: string | null;
  relatedModule: string;
  recurrenceType: OperationalTaskRecurrence;
  recurrenceInterval?: number | null;
  completedAt?: string | null;
  completedByName?: string | null;
  notes?: string | null;
  bed?: { id: string; name: string; code: string } | null;
  plant?: { id: string; internalCode: string; bedPosition: number } | null;
}

export interface OperationalTaskFilters {
  status?: OperationalTaskStatus;
  priority?: OperationalTaskPriority;
  taskType?: OperationalTaskType;
  assignedToName?: string;
  roomId?: string;
  bedId?: string;
  plantId?: string;
  dateFrom?: string;
  dateTo?: string;
  overdueOnly?: boolean;
}

export type CreateOperationalTaskPayload = Omit<OperationalTask, "id" | "bed" | "plant" | "completedAt">;

const mockTasks: OperationalTask[] = [];

function queryFromFilters(filters: OperationalTaskFilters) {
  return new URLSearchParams(
    Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== undefined && value !== "")),
  ).toString();
}

export async function getOperationalTasks(filters: OperationalTaskFilters = {}): Promise<OperationalTask[]> {
  return withMockFallback(
    async () => {
      const query = queryFromFilters(filters);
      return apiRequest<OperationalTask[]>(`/cultivation/operational-tasks${query ? `?${query}` : ""}`);
    },
    () => mockTasks,
  );
}

export async function createOperationalTask(payload: CreateOperationalTaskPayload): Promise<OperationalTask> {
  return withMockFallback(
    async () =>
      apiRequest<OperationalTask>("/cultivation/operational-tasks", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    () => {
      const task: OperationalTask = { ...payload, id: `task-${Date.now()}` };
      mockTasks.unshift(task);
      return task;
    },
  );
}

export async function updateOperationalTaskStatus(
  id: string,
  status: OperationalTaskStatus,
): Promise<OperationalTask> {
  return withMockFallback(
    async () =>
      apiRequest<OperationalTask>(`/cultivation/operational-tasks/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    () => {
      const task = mockTasks.find((item) => item.id === id);
      if (!task) throw new Error("Tarea no encontrada.");
      task.status = status;
      return task;
    },
  );
}

export async function completeOperationalTask(id: string, completedByName?: string): Promise<OperationalTask> {
  return withMockFallback(
    async () =>
      apiRequest<OperationalTask>(`/cultivation/operational-tasks/${id}/complete`, {
        method: "PATCH",
        body: JSON.stringify({ completedByName }),
      }),
    () => updateOperationalTaskStatus(id, "completed"),
  );
}

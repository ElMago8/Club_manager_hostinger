import { prisma } from "../../../config/prisma.js";
import { ApiError } from "../../../utils/ApiError.js";
import type { z } from "zod";
import type { createMotherSchema, updateMotherSchema, updateMotherStatusSchema } from "./mother.schema.js";

type CreateMotherInput = z.infer<typeof createMotherSchema>;
type UpdateMotherInput = z.infer<typeof updateMotherSchema>;
type UpdateMotherStatusInput = z.infer<typeof updateMotherStatusSchema>;

const includeRelations = {
  genetics: true,
  _count: { select: { plants: true } },
};

export const motherService = {
  list() {
    return prisma.motherPlant.findMany({ include: includeRelations, orderBy: { createdAt: "desc" } });
  },
  create(data: CreateMotherInput) {
    return prisma.motherPlant.create({ data, include: includeRelations });
  },
  async getById(id: string) {
    const mother = await prisma.motherPlant.findUnique({ where: { id }, include: { genetics: true, plants: true, _count: { select: { plants: true } } } });
    if (!mother) throw new ApiError(404, "Mother plant not found.");
    return mother;
  },
  async update(id: string, data: UpdateMotherInput) {
    await this.getById(id);
    return prisma.motherPlant.update({ where: { id }, data, include: includeRelations });
  },
  async updateStatus(id: string, data: UpdateMotherStatusInput) {
    await this.getById(id);
    return prisma.motherPlant.update({ where: { id }, data, include: includeRelations });
  },
};

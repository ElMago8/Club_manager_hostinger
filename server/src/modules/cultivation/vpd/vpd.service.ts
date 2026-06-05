import { calculateVPD, generateVPDTable, getVPDStatus } from "../../../utils/vpdCalculator.js";
import type { z } from "zod";
import type { vpdPreviewSchema, vpdTableQuerySchema } from "./vpd.schema.js";

type VpdPreviewInput = z.infer<typeof vpdPreviewSchema>;
type VpdTableQuery = z.infer<typeof vpdTableQuerySchema>;

export const vpdService = {
  preview(data: VpdPreviewInput) {
    const calculatedVPD = calculateVPD(data);
    return {
      calculatedVPD,
      vpdStatus: getVPDStatus(calculatedVPD, data.stage),
    };
  },

  table(query: VpdTableQuery) {
    return generateVPDTable({ leafOffset: query.leafOffset ?? 0 });
  },
};

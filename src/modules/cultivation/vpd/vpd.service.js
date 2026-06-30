import { calculateVPD, generateVPDTable, getVPDStatus } from "../../../utils/vpdCalculator.js";
export const vpdService = {
    preview(data) {
        const calculatedVPD = calculateVPD(data);
        return {
            calculatedVPD,
            vpdStatus: getVPDStatus(calculatedVPD, data.stage),
        };
    },
    table(query) {
        return generateVPDTable({ leafOffset: query.leafOffset ?? 0 });
    },
};

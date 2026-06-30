import { vpdPreviewSchema, vpdTableQuerySchema } from "./vpd.schema.js";
import { vpdService } from "./vpd.service.js";
export const vpdController = {
    preview(req, res, next) {
        try {
            res.json(vpdService.preview(vpdPreviewSchema.parse(req.body)));
        }
        catch (error) {
            next(error);
        }
    },
    table(req, res, next) {
        try {
            res.json(vpdService.table(vpdTableQuerySchema.parse(req.query)));
        }
        catch (error) {
            next(error);
        }
    },
};

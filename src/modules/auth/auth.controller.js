import { authService } from "./auth.service.js";
import { loginSchema } from "./auth.schema.js";
export const authController = {
    async login(req, res, next) {
        try {
            res.json(await authService.login(loginSchema.parse(req.body)));
        }
        catch (error) {
            next(error);
        }
    },
};

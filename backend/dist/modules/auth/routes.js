"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const controller_1 = require("./controller");
const auth_1 = require("../../middleware/auth");
exports.authRouter = (0, express_1.Router)();
exports.authRouter.post("/register", controller_1.register);
exports.authRouter.post("/login", controller_1.login);
exports.authRouter.get("/me", auth_1.requireAuth, controller_1.me);
//# sourceMappingURL=routes.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchRouter = void 0;
const express_1 = require("express");
const controller_1 = require("./controller");
const auth_1 = require("../../middleware/auth");
exports.searchRouter = (0, express_1.Router)();
// File search with fuzzy name + AND tags + owner filter
exports.searchRouter.get("/search/files", auth_1.requireAuth, controller_1.searchFiles);
//# sourceMappingURL=routes.js.map
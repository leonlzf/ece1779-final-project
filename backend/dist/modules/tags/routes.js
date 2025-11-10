"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tagsRouter = void 0;
const express_1 = require("express");
const controller_1 = require("./controller");
const auth_1 = require("../../middleware/auth");
exports.tagsRouter = (0, express_1.Router)();
// Tag dictionary search
exports.tagsRouter.get("/tags", auth_1.requireAuth, controller_1.searchTags);
// File tags
exports.tagsRouter.get("/files/:id/tags", auth_1.requireAuth, controller_1.getFileTags);
exports.tagsRouter.put("/files/:id/tags", auth_1.requireAuth, controller_1.replaceFileTags);
exports.tagsRouter.patch("/files/:id/tags", auth_1.requireAuth, controller_1.patchFileTags);
//# sourceMappingURL=routes.js.map
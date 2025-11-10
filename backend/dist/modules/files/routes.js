"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.filesRouter = void 0;
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const auth_1 = require("../../middleware/auth");
const controller_1 = require("./controller");
const upload = (0, multer_1.default)({
    dest: path_1.default.join(process.cwd(), "tmp_uploads"),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});
exports.filesRouter = (0, express_1.Router)();
exports.filesRouter.use(auth_1.requireAuth);
exports.filesRouter.post("/", upload.single("file"), controller_1.createFile);
exports.filesRouter.post("/:id/versions", upload.single("file"), controller_1.addVersion);
exports.filesRouter.get("/", controller_1.listFiles);
exports.filesRouter.get("/:id/versions/:ver/download", controller_1.downloadVersion);
exports.filesRouter.get("/:id", controller_1.getFileMeta);
exports.filesRouter.delete("/:id", controller_1.deleteFile);
//# sourceMappingURL=routes.js.map
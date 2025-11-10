"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.commentsRouter = void 0;
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const ctl = __importStar(require("./controller"));
const sse_1 = require("../../realtime/sse");
exports.commentsRouter = (0, express_1.Router)();
// real-time stream
exports.commentsRouter.get("/files/:id/versions/:ver/comments/stream", sse_1.commentsStream);
// Require JWT authentication for all comment actions
exports.commentsRouter.use(auth_1.requireAuth);
// Create a comment (or a reply)
exports.commentsRouter.post("/files/:id/versions/:ver/comments", ctl.create);
// List all comments (threaded) for a file version
exports.commentsRouter.get("/files/:id/versions/:ver/comments", ctl.list);
// Edit an existing comment
exports.commentsRouter.patch("/comments/:commentId", ctl.update);
// Delete a comment (author or OWNER can delete)
exports.commentsRouter.delete("/comments/:commentId", ctl.remove);
// Optional future features:
// commentsRouter.post("/comments/:commentId/resolve", ctl.resolve);
// commentsRouter.post("/comments/:commentId/reopen", ctl.reopen);
//# sourceMappingURL=routes.js.map
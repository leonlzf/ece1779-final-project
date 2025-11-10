"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/app.ts
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, "../../.env") });
const env_1 = require("./config/env");
const auth_1 = require("./middleware/auth");
const routes_1 = require("./modules/auth/routes");
const routes_2 = require("./modules/files/routes");
const routes_3 = require("./modules/comments/routes");
const sse_1 = require("./realtime/sse");
const routes_4 = require("./modules/tags/routes");
const routes_5 = require("./modules/search/routes");
const db_1 = require("./db");
(0, db_1.testConnection)();
const app = (0, express_1.default)();
/**
 * Global CORS for API.
 * - Only allow requests from CLIENT_URL
 * - Expose Content-Disposition for file downloads
 * - Keep credentials enabled if you send cookies/Authorization
 */
app.use((0, cors_1.default)({
    origin(origin, cb) {
        if (!origin)
            return cb(null, true); // allow non-browser tools
        if (origin === env_1.env.CLIENT_URL)
            return cb(null, true);
        return cb(null, false);
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Content-Disposition"],
    credentials: true,
}));
app.options("*", (0, cors_1.default)());
app.use(express_1.default.static(path_1.default.join(__dirname, "..", "public")));
// Body parsers
app.use(express_1.default.json({ limit: "10mb" }));
app.use(express_1.default.urlencoded({ extended: true, limit: "10mb" }));
// Simple health endpoint for readiness/liveness probes
app.get("/healthz", (_req, res) => res.send("ok"));
// Public routes (no auth)
app.use("/auth", routes_1.authRouter);
/**
 * SSE endpoints:
 * - For EventSource, we keep CORS wide open here to simplify testing across file:// and localhost.
 * - These handlers must flush and keep the connection alive; do not wrap them with global CORS that blocks.
 */
app.get("/files/:id/versions/:ver/comments/stream", (0, cors_1.default)({ origin: (_o, cb) => cb(null, true) }), // allow any origin for SSE stream
sse_1.commentsStream);
// Authenticated routes
// Files API (upload/download/metadata). Protected by JWT.
app.use("/files", auth_1.requireAuth, routes_2.filesRouter);
// Comments API (CRUD under /comments/*). Uses its own auth inside routes if needed.
app.use("/", routes_3.commentsRouter);
// Tags & Search (new). Each router already uses requireAuth inside.
app.use("/", routes_4.tagsRouter); // /tags, /files/:id/tags (PUT/PATCH/GET)
app.use("/", routes_5.searchRouter); // /search/files
// 404 fallback
app.use((req, res) => {
    res.status(404).json({ success: false, error: "Route not found" });
});
// 500 error handler
app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ success: false, error: "Internal server error" });
});
exports.default = app;
//# sourceMappingURL=app.js.map
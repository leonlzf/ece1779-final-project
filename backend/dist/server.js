"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/server.ts
const http_1 = __importDefault(require("http"));
const app_1 = __importDefault(require("./app"));
const env_1 = require("./config/env");
function printRoutes(app) {
    const routes = [];
    const walk = (pathPrefix, stack) => {
        for (const layer of stack) {
            if (layer.name === "router" && layer.handle?.stack) {
                const mount = layer.regexp?.fast_slash
                    ? "/"
                    : String(layer.regexp?.source || "")
                        .replace(/\\\//g, "/")
                        .replace(/^\^/, "")
                        .replace(/\$$/, "")
                        .replace(/\(\?:\(\[\^\\\/]\+\?\)\)/g, ":param");
                walk(pathPrefix + mount, layer.handle.stack);
            }
            if (layer.route) {
                const methods = Object.keys(layer.route.methods)
                    .map((m) => m.toUpperCase())
                    .join(",");
                routes.push(`${methods} ${pathPrefix}${layer.route.path}`);
            }
        }
    };
    const stack = app._router?.stack || [];
    walk("", stack);
    console.log("Registered routes:");
    for (const r of routes)
        console.log("  " + r);
}
const server = http_1.default.createServer(app_1.default);
// server.listen(env.PORT, () => {
//   console.log(`Server listening on http://localhost:${env.PORT}`);
//   printRoutes(app);
// });
// Bind to loopback to avoid EACCES on Windows; Docker: DOCKER=true -> 0.0.0.0
const HOST = process.env.DOCKER ? "0.0.0.0" : "127.0.0.1";
server.listen(env_1.env.PORT, HOST, () => {
    console.log(`Server listening on http://${HOST}:${env_1.env.PORT}`);
    printRoutes(app_1.default);
});
server.on("error", (err) => {
    console.error("Server error:", err);
    process.exit(1);
});
const shutdown = () => {
    console.log("Shutting down...");
    server.close(() => {
        console.log("HTTP server closed.");
        process.exit(0);
    });
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
//# sourceMappingURL=server.js.map
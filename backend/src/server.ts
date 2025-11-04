// src/server.ts
import http from "http";
import type { Application } from "express";
import app from "./app";
import { env } from "./config/env";

function printRoutes(app: Application) {
  type Layer = any;
  const routes: string[] = [];

  const walk = (pathPrefix: string, stack: Layer[]) => {
    for (const layer of stack) {
      if (layer.name === "router" && layer.handle?.stack) {
        const mount =
          layer.regexp?.fast_slash
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

  const stack: Layer[] = app._router?.stack || [];
  walk("", stack);

  console.log("Registered routes:");
  for (const r of routes) console.log("  " + r);
}

const server = http.createServer(app);

server.listen(env.PORT, () => {
  console.log(`Server listening on http://localhost:${env.PORT}`);
  printRoutes(app);
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

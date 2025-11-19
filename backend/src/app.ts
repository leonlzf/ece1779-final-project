// src/app.ts
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), "../../.env") });
import { env } from "./config/env";
import { requireAuth } from "./middleware/auth";
import { authRouter } from "./modules/auth/routes";
import { filesRouter } from "./modules/files/routes";
import { versionsRouter } from "./modules/version/routes";
import { commentsRouter } from "./modules/comments/routes";
import { commentsStream, historyList } from "./realtime/sse";
import { tagsRouter } from "./modules/tags/routes";
import { searchRouter } from "./modules/search/routes";
import { testConnection } from './db';
testConnection();

const app = express();

/**
 * Global CORS for API.
 * - Only allow requests from CLIENT_URL
 * - Expose Content-Disposition for file downloads
 * - Keep credentials enabled if you send cookies/Authorization
 */
app.use(
  cors({
    // origin(origin, cb) {
    //   if (!origin) return cb(null, true);                 // allow non-browser tools
    //   if (origin === env.CLIENT_URL) return cb(null, true);
    //   return cb(null, false);
    // },

     origin(origin, cb) {
      
      // allow non-browser
      if (!origin) return cb(null, true);
      
      //default to dev environment
      if (env.NODE_ENV === "development") {
        return cb(null, true);
      }
      
      //use frontend origin url for prod
      if (origin === env.CLIENT_URL) {
        return cb(null, true);
      }
      
      //denied 
      return cb(null, false);
    },

    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Content-Disposition"],
    credentials: true,
  })
);
app.options("*", cors());
app.use(express.static(path.join(__dirname, "..", "public")));

// Body parsers
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Simple health endpoint for readiness/liveness probes
app.get("/healthz", (_req, res) => res.send("ok"));


// Public routes (no auth)
app.use("/auth", authRouter);

/**
 * SSE endpoints:
 * - For EventSource, we keep CORS wide open here to simplify testing across file:// and localhost.
 * - These handlers must flush and keep the connection alive; do not wrap them with global CORS that blocks.
 */


app.get(
  "/files/:id/versions/:ver/comments/stream",
  cors({ origin: (_o, cb) => cb(null, true) }), // allow any origin for SSE stream
  commentsStream
);

// Authenticated routes
// Files API (upload/download/metadata). Protected by JWT.
app.use("/files", requireAuth, filesRouter);

// Comments API (CRUD under /comments/*). Uses its own auth inside routes if needed.
app.use("/", commentsRouter);

// Tags & Search (new). Each router already uses requireAuth inside.
app.use("/", tagsRouter);   // /tags, /files/:id/tags (PUT/PATCH/GET)
app.use("/", searchRouter); // /search/files


app.use("/", versionsRouter);
// 404 fallback
app.use((req, res) => {
  res.status(404).json({ success: false, error: "Route not found" });
});

// 500 error handler
app.use(
  (err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
);

export default app;

// src/app.ts
import express from "express";
import cors from "cors";
import { env } from "./config/env";
import { requireAuth } from "./middleware/auth";
import { authRouter } from "./modules/auth/routes";
import { filesRouter } from "./modules/files/routes";
import { commentsRouter } from "./modules/comments/routes";
import { commentsStream, historyList } from "./realtime/sse";

const app = express();

app.use(
  cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true);
      if (origin === env.CLIENT_URL) return cb(null, true);
      return cb(null, false);
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Content-Disposition"],
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.get("/healthz", (_req, res) => res.send("ok"));

app.use("/auth", authRouter);

// get saved comment history
app.get(
  "/files/:id/versions/:ver/comments",
  cors({ origin: (_o, cb) => cb(null, true) }),
  historyList
);

// stream for realtime updates
app.get(
  "/files/:id/versions/:ver/comments/stream",
  cors({ origin: (_o, cb) => cb(null, true) }),
  commentsStream
);

app.use("/files", requireAuth, filesRouter);
app.use("/", commentsRouter);               

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, error: "Route not found" });
});

// 500
app.use(
  (err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
);

export default app;

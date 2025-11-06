// src/app.ts
import express from "express";
import cors from "cors";
import { env } from "./config/env";
import { requireAuth } from "./middleware/auth";
import { authRouter } from "./modules/auth/routes";
import { filesRouter } from "./modules/files/routes";
import { commentsRouter } from "./modules/comments/routes";

const app = express();

app.use(
  cors({
    origin: env.CLIENT_URL, // like http://localhost:3000
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.get("/healthz", (_req, res) => res.send("ok"));
app.use("/auth", authRouter);
app.use("/files", requireAuth, filesRouter);
app.use("/", commentsRouter);

app.use((req, res) => {
  res.status(404).json({ success: false, error: "Route not found" });
});


app.use(
  (err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
);

export default app;

import { Request, Response } from "express";
import { EventEmitter } from "events";
import jwt from "jsonwebtoken";
import { env } from "../config/env"; 
import fs from "fs/promises";
import path from "path";
const COMMENT_DIR = path.join(process.cwd(), "data", "comments");

// very small pub/sub bus per fileId@version
const bus = new EventEmitter();
bus.setMaxListeners(1000);

function chan(fileId: string, versionNo: number) {
  return `${fileId}@${versionNo}`;
}

/**
 * SSE stream endpoint
 * GET /files/:id/versions/:ver/comments/stream?token=<JWT>
 * 
 */
export function commentsStream(req: Request, res: Response) {
  const { id, ver } = req.params;
  const versionNo = Number(ver);

  // CORS for SSE
  const origin = (req.headers.origin as string) || "*";
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Vary", "Origin");

  // lightweight auth here
  const token = (req.query.token as string) || "";
  try {
    if (!token) throw new Error("Missing token");
    jwt.verify(token, env.JWT_SECRET);
  } catch {
    return res.status(401).end("Invalid or missing token");
  }

  // SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const send = (type: string, payload: any) => {
    res.write(`event: ${type}\n`);
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  };
  send("ready", { channel: chan(id, versionNo) });

  const listener = (evt: { type: string; payload: any }) => {
    send(evt.type, evt.payload);
  };
  bus.on(chan(id, versionNo), listener);

  const heartbeat = setInterval(() => {
    res.write(`:\n\n`);
  }, 25000);


  req.on("close", () => {
    clearInterval(heartbeat);
    bus.off(chan(id, versionNo), listener);
    res.end();
  });
}

/**
 * Called by controllers to broadcast realtime events.
 */
export function broadcastComment(
  fileId: string,
  versionNo: number,
  type: "comment:created" | "comment:updated" | "comment:deleted",
  payload: any
) {
  bus.emit(chan(fileId, versionNo), { type, payload });
}

// Helper to read comments from disk
export async function historyList(req: Request, res: Response) {
  const { id, ver } = req.params;
  const file = path.join(COMMENT_DIR, `${id}@${ver}.json`);
  try {
    const data = await fs.readFile(file, "utf-8");
    res.json(JSON.parse(data));
  } catch {
    res.json([]); // no file → return empty array
  }
}

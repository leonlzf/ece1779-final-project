// backend/src/realtime/sse.ts
import type { Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { env } from "../config/env";

type CommentEventName = "comment:created" | "comment:updated" | "comment:deleted";

type SSEClient = {
  res: Response;
  userId: string;
};

type ChannelKey = string;

// key: "fileId:versionNo" -> set of connected clients
const channels = new Map<ChannelKey, Set<SSEClient>>();

function channelKey(fileId: string, versionNo: number): ChannelKey {
  return `${fileId}:${versionNo}`;
}

function verifyToken(token: string | null): { userId: string } | null {
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload | string;

    if (typeof decoded === "string") {
      return { userId: decoded };
    }

    // be tolerant about the field name
    const userId =
      (decoded as any).uid ||
      (decoded as any).id ||
      (decoded as any).sub;

    if (!userId) return null;
    return { userId: String(userId) };
  } catch {
    return null;
  }
}

/**
 * SSE endpoint:
 * GET /files/:id/versions/:ver/comments/stream?token=<JWT>
 *
 * In commentsRouter:
 * commentsRouter.get("/files/:id/versions/:ver/comments/stream", commentsStream);
 */
export function commentsStream(req: Request, res: Response) {
  const { id } = req.params;
  const verRaw = req.params.ver;
  const versionNo = Number(verRaw) || 1;

  // token can come from ?token=... OR Authorization: Bearer ...
  const tokenFromQuery =
    typeof req.query.token === "string" ? (req.query.token as string) : undefined;

  const authHeader =
    typeof req.headers.authorization === "string" ? req.headers.authorization : "";
  const tokenFromHeader = authHeader.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : undefined;

  const auth = verifyToken(tokenFromQuery || tokenFromHeader || null);
  if (!auth) {
    res.status(401).json({ success: false, error: "Unauthorized" });
    return;
  }

  // SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  // flush headers if supported
  (res as any).flushHeaders?.();

  const key = channelKey(id, versionNo);
  const client: SSEClient = { res, userId: auth.userId };

  if (!channels.has(key)) {
    channels.set(key, new Set());
  }
  channels.get(key)!.add(client);

  // initial hello so client knows it's connected
  res.write(`event: connected\n`);
  res.write(`data: ${JSON.stringify({ success: true })}\n\n`);

  const cleanup = () => {
    const set = channels.get(key);
    if (!set) return;
    set.delete(client);
    if (set.size === 0) {
      channels.delete(key);
    }
  };

  req.on("close", cleanup);
  req.on("end", cleanup);
}

/**
 * Broadcast a comment event to all clients watching a given file/version.
 */
export function broadcastComment(
  fileId: string,
  versionNo: number,
  event: CommentEventName,
  payload: unknown
) {
  const key = channelKey(fileId, versionNo);
  const set = channels.get(key);
  if (!set || set.size === 0) return;

  const data =
    `event: ${event}\n` + `data: ${JSON.stringify(payload)}\n\n`;

  for (const { res } of set) {
    if (!res.writableEnded) {
      res.write(data);
    }
  }
}

// optional stub
export function historyList(_req: Request, res: Response) {
  res.status(501).json({ success: false, error: "Not implemented" });
}

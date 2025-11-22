import type { Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { env } from "../config/env";

type CommentEventName = "comment:created" | "comment:updated" | "comment:deleted";

type SSEClient = {
  res: Response;
  userId: string;
};

type ChannelKey = string;

const channels = new Map<ChannelKey, Set<SSEClient>>();

function channelKey(fileId: string, versionNo: number) {
  return `${fileId}:${versionNo}`;
}

function verifyToken(raw?: string | null): { userId: string } | null {
  if (!raw) return null;
  try {
    const decoded = jwt.verify(raw, env.JWT_SECRET) as JwtPayload | string;

    if (typeof decoded === "string") {
      return { userId: decoded };
    }

    const userId =
      (decoded as any).uid ||
      (decoded as any).userId ||
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
 * in commentsRouter:
 * commentsRouter.get("/files/:id/versions/:ver/comments/stream", commentsStream);
 */
export function commentsStream(req: Request, res: Response) {
  const fileId = req.params.id;
  const versionNo = Number(req.params.ver);

  if (!fileId || Number.isNaN(versionNo)) {
    res.status(400).json({ success: false, error: "Invalid file id or version" });
    return;
  }

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

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  (res as any).flushHeaders?.();

  const key = channelKey(fileId, versionNo);
  const client: SSEClient = { res, userId: auth.userId };

  if (!channels.has(key)) {
    channels.set(key, new Set());
  }
  channels.get(key)!.add(client);

  res.write(`event: connected\n`);
  res.write(`data: ${JSON.stringify({ success: true })}\n\n`);

  const pingInterval = setInterval(() => {
    if (res.writableEnded) return;
    res.write(`event: ping\n`);
    res.write(`data: "ok"\n\n`);
  }, 25000);

  req.on("close", () => {
    clearInterval(pingInterval);
    const set = channels.get(key);
    if (set) {
      set.delete(client);
      if (set.size === 0) {
        channels.delete(key);
      }
    }
    res.end();
  });
}

/**
 * Broadcast a comment-related event to all SSE clients
 * subscribed to the given fileId + versionNo channel.
 *
 * This is typically called from comments/controller.ts, e.g.:
 *   broadcastComment(fileId, versionNo, "comment:created", createdComment);
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

export function historyList(_req: Request, res: Response) {
  res.status(501).json({ success: false, error: "Not implemented" });
}

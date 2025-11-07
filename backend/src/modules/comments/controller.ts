import type { Request, Response } from "express";
import crypto from "crypto";
import { broadcastComment } from "../../realtime/sse";
import path from "path";
import fs from "fs/promises";

const COMMENTS_ROOT = path.join(process.cwd(), "data", "comments");

async function loadThread(fileId: string, ver: number) {
  const p = path.join(COMMENTS_ROOT, `${fileId}@${ver}.json`);
  try {
    const txt = await fs.readFile(p, "utf-8");
    return JSON.parse(txt) as Comment[];
  } catch {
    return [];
  }
}

async function saveThread(fileId: string, ver: number, arr: Comment[]) {
  await fs.mkdir(COMMENTS_ROOT, { recursive: true });
  const p = path.join(COMMENTS_ROOT, `${fileId}@${ver}.json`);
  await fs.writeFile(p, JSON.stringify(arr, null, 2));
}


/**
 * User roles for permission control
 */
type Role = "OWNER" | "COLLAB" | "VIEWER";

/**
 * Optional anchor for line or region-based comments
 */
type Anchor =
  | { type: "line"; lineNo: number }
  | { type: "region"; page: number; x: number; y: number; w: number; h: number };

/**
 * Comment object shape
 */
type Comment = {
  id: string;
  fileId: string;
  versionNo: number;
  parentId: string | null;
  userId: string;
  text: string;
  anchor?: Anchor;
  isResolved: boolean;
  createdAt: string;
  updatedAt: string;
};

/**
 * In-memory storage: key = "fileId@versionNo"
 */
const store = new Map<string, Comment[]>();

function key(fileId: string, versionNo: number) {
  return `${fileId}@${versionNo}`;
}

function getUser(req: Request) {
  return (req as any).user as { id: string; role: "OWNER" | "COLLAB" | "VIEWER" } | undefined;
}

/**
 * Check if the current user can write
 */
function mustWritable(role: Role) {
  if (role === "VIEWER") {
    const err = new Error("Permission denied");
    // @ts-ignore add code for easy handling
    err.code = 403;
    throw err;
  }
}

/**
 * Create a new comment or reply
 */
export async function create(req: Request, res: Response) {
  try {
    const user = getUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    mustWritable(user.role);

    const { id, ver } = req.params;
    const versionNo = Number(ver);
    const { text, parentId, anchor } = req.body ?? {};

    if (!text || typeof text !== "string" || !text.trim()) {
      return res.status(400).json({ error: "text required" });
    }

    const c: Comment = {
      id: crypto.randomUUID(),
      fileId: id,
      versionNo,
      parentId: parentId ?? null,
      userId: user.id,
      text: text.trim(),
      anchor,
      isResolved: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // const k = key(id, versionNo);
    // const arr = store.get(k) ?? [];
    // arr.push(c);
    // store.set(k, arr);
    const arr = await loadThread(id, versionNo);
    arr.push(c);
    await saveThread(id, versionNo, arr);

    // NEW: realtime broadcast (SSE)
    broadcastComment(id, versionNo, "comment:created", c);

    return res.json(c);
  } catch (e: any) {
    if (e.code === 403) return res.status(403).json({ error: "Permission denied" });
    return res.status(500).json({ error: "Create failed" });
  }
}

/**
 * List all comments for a specific file version (threaded)
 */
export async function list(req: Request, res: Response) {
  const { id, ver } = req.params;
  const versionNo = Number(ver);
  // const k = key(id, versionNo);
  // const arr = store.get(k) ?? [];
  const arr = await loadThread(id, versionNo);

  // Build a threaded structure (root comment + replies)
  const node = new Map<string, any>();
  const roots: any[] = [];
  for (const c of arr) node.set(c.id, { ...c, replies: [] });

  for (const c of arr) {
    if (c.parentId) {
      node.get(c.parentId)?.replies.push(node.get(c.id));
    } else {
      roots.push(node.get(c.id));
    }
  }

  // Sort by creation time
  roots.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  roots.forEach(t =>
    t.replies.sort((a: any, b: any) => a.createdAt.localeCompare(b.createdAt))
  );

  return res.json(roots);
}

/**
 * Update a comment (author or OWNER only)
 */
export async function update(req: Request, res: Response) {
  try {
    const user = getUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const { commentId } = req.params;
    const { text } = req.body ?? {};
    if (!text || typeof text !== "string" || !text.trim()) {
      return res.status(400).json({ error: "text required" });
    }

    // for (const [, arr] of store) {
    //   const idx = arr.findIndex(c => c.id === commentId);
    //   if (idx >= 0) {
    //     const c = arr[idx];
    //     if (c.userId !== user.id && user.role !== "OWNER") {
    //       return res.status(403).json({ error: "Permission denied" });
    //     }
    //     const updated = { ...c, text: text.trim(), updatedAt: new Date().toISOString() };
    //     arr[idx] = updated;
        
    //     // NEW: realtime broadcast (SSE)
    //     broadcastComment(c.fileId, c.versionNo, "comment:updated", updated);

    //     return res.json(updated);
    //   }
    // }
    const files = await fs.readdir(COMMENTS_ROOT).catch(() => []);
    for (const fname of files) {
      if (!fname.endsWith(".json")) continue;
      const [fileId, verPart] = fname.replace(".json", "").split("@");
      const versionNo = Number(verPart);
      const arr = await loadThread(fileId, versionNo);
      const idx = arr.findIndex(c => c.id === commentId);
      if (idx < 0) continue;

      const c = arr[idx];
      if (c.userId !== user.id && user.role !== "OWNER") {
        return res.status(403).json({ error: "Permission denied" });
      }
      const updated = { ...c, text: text.trim(), updatedAt: new Date().toISOString() };
      arr[idx] = updated;
      await saveThread(fileId, versionNo, arr);

      broadcastComment(fileId, versionNo, "comment:updated", updated);
      return res.json(updated);
    }

    return res.status(404).json({ error: "Comment not found" });
  } catch {
    return res.status(500).json({ error: "Update failed" });
  }
}

/**
 * Delete a comment (author or OWNER only)
 */
export async function remove(req: Request, res: Response) {
  try {
    const user = getUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    
    const { commentId } = req.params;

    // for (const [k, arr] of store) {
    //   const idx = arr.findIndex(c => c.id === commentId);
    //   if (idx >= 0) {
    //     const c = arr[idx];
    //     if (c.userId !== user.id && user.role !== "OWNER") {
    //       return res.status(403).json({ error: "Permission denied" });
    //     }
    //     // Delete itself
    //     arr.splice(idx, 1);
    //     // Cascade delete its replies
    //     for (let i = arr.length - 1; i >= 0; i--) {
    //       if (arr[i].parentId === commentId) arr.splice(i, 1);
    //     }
    //     store.set(k, arr);
        
    //     // NEW: realtime broadcast (SSE)
    //     broadcastComment(c.fileId, c.versionNo, "comment:deleted", { id: c.id });

    //     return res.json({ success: true });
    //   }
    // }

     const files = await fs.readdir(COMMENTS_ROOT).catch(() => []);
    for (const fname of files) {
      if (!fname.endsWith(".json")) continue;
      const [fileId, verPart] = fname.replace(".json", "").split("@");
      const versionNo = Number(verPart);

      const arr = await loadThread(fileId, versionNo);
      const idx = arr.findIndex(c => c.id === commentId);
      if (idx < 0) continue;

      const c = arr[idx];
      if (c.userId !== user.id && user.role !== "OWNER") {
        return res.status(403).json({ error: "Permission denied" });
      }

      // delete self
      arr.splice(idx, 1);
      // cascade delete replies
      for (let i = arr.length - 1; i >= 0; i--) {
        if (arr[i].parentId === commentId) arr.splice(i, 1);
      }

      await saveThread(fileId, versionNo, arr);
      broadcastComment(fileId, versionNo, "comment:deleted", { id: c.id });
      return res.json({ success: true });
    }
    
    return res.status(404).json({ error: "Comment not found" });
  } catch {
    return res.status(500).json({ error: "Delete failed" });
  }
}

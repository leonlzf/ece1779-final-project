"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.create = create;
exports.list = list;
exports.update = update;
exports.remove = remove;
const crypto_1 = __importDefault(require("crypto"));
const sse_1 = require("../../realtime/sse");
const db_1 = require("../../db");
function getUser(req) {
    return req.user;
}
/**
 * Check if the current user can write
 */
function mustWritable(role) {
    if (role === "VIEWER") {
        const err = new Error("Permission denied");
        // @ts-ignore add code for easy handling
        err.code = 403;
        throw err;
    }
}
async function create(req, res) {
    try {
        const user = getUser(req);
        if (!user)
            return res.status(401).json({ error: "Unauthorized" });
        mustWritable(user.role);
        const { id, ver } = req.params;
        const versionNo = Number(ver);
        const { text, parentId, anchor } = req.body ?? {};
        if (!text || typeof text !== "string" || !text.trim()) {
            return res.status(400).json({ error: "text required" });
        }
        const commentId = crypto_1.default.randomUUID();
        const createdAt = new Date().toISOString();
        const insertQuery = `
      INSERT INTO comments (
        id, file_id, version_no, parent_id, user_id, text, anchor, is_resolved, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, false, $8, $8)
      RETURNING *;
    `;
        const result = await db_1.pool.query(insertQuery, [
            commentId,
            id,
            versionNo,
            parentId ?? null,
            user.id,
            text.trim(),
            anchor ? JSON.stringify(anchor) : null,
            createdAt
        ]);
        const comment = result.rows[0];
        (0, sse_1.broadcastComment)(id, versionNo, "comment:created", comment);
        return res.json(comment);
    }
    catch (e) {
        if (e.code === "23503") {
            return res.status(400).json({ error: "Invalid file_id or user_id" });
        }
        if (e.code === 403) {
            return res.status(403).json({ error: "Permission denied" });
        }
        return res.status(500).json({ error: "Create failed" });
    }
}
/**
 * Create a new comment or reply
 
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
*/
/**
 * List all comments for a specific file version (threaded)
 */
async function list(req, res) {
    try {
        const { id, ver } = req.params;
        const versionNo = parseInt(ver, 10);
        console.log(">>> list() called");
        console.log("file_id:", id, "version_no:", versionNo);
        const query = `
      SELECT id, file_id, version_no, parent_id, user_id, text,
             anchor, is_resolved, created_at, updated_at
      FROM comments
      WHERE file_id = $1 AND version_no = $2
      ORDER BY created_at ASC;
    `;
        const result = await db_1.pool.query(query, [id, versionNo]);
        console.log("rowCount:", result.rowCount);
        const rows = result.rows.map((c) => ({
            ...c,
            parent_id: c.parent_id && c.parent_id.trim() !== "" ? c.parent_id : null,
        }));
        const node = new Map();
        const roots = [];
        for (const c of rows)
            node.set(c.id, { ...c, replies: [] });
        for (const c of rows) {
            if (c.parent_id && node.has(c.parent_id)) {
                node.get(c.parent_id).replies.push(node.get(c.id));
            }
            else {
                roots.push(node.get(c.id));
            }
        }
        roots.sort((a, b) => a.created_at.localeCompare(b.created_at));
        for (const r of roots)
            r.replies.sort((a, b) => a.created_at.localeCompare(b.created_at));
        console.log("roots length:", roots.length);
        return res.json(roots);
    }
    catch (err) {
        console.error("List comments failed:", err);
        return res.status(500).json({ error: "List failed" });
    }
}
/**
 * Update a comment (author or OWNER only)
 */
async function update(req, res) {
    try {
        const user = getUser(req);
        if (!user)
            return res.status(401).json({ error: "Unauthorized" });
        const { commentId } = req.params;
        const { text } = req.body ?? {};
        if (!text || typeof text !== "string" || !text.trim()) {
            return res.status(400).json({ error: "text required" });
        }
        const findQuery = `SELECT * FROM comments WHERE id = $1`;
        const found = await db_1.pool.query(findQuery, [commentId]);
        if (found.rowCount === 0) {
            return res.status(404).json({ error: "Comment not found" });
        }
        const comment = found.rows[0];
        if (comment.user_id !== user.id && user.role !== "OWNER") {
            return res.status(403).json({ error: "Permission denied" });
        }
        const updatedAt = new Date().toISOString();
        const updateQuery = `
      UPDATE comments
      SET text = $1, updated_at = $2
      WHERE id = $3
      RETURNING *;
    `;
        const result = await db_1.pool.query(updateQuery, [text.trim(), updatedAt, commentId]);
        const updated = result.rows[0];
        (0, sse_1.broadcastComment)(updated.file_id, updated.version_no, "comment:updated", updated);
        return res.json(updated);
    }
    catch (err) {
        console.error("Update comment failed:", err);
        return res.status(500).json({ error: "Update failed" });
    }
}
/**
 * Delete a comment (author or OWNER only)
 */
async function remove(req, res) {
    try {
        const user = getUser(req);
        if (!user)
            return res.status(401).json({ error: "Unauthorized" });
        const { commentId } = req.params;
        const findQuery = `SELECT * FROM comments WHERE id = $1`;
        const found = await db_1.pool.query(findQuery, [commentId]);
        if (found.rowCount === 0) {
            return res.status(404).json({ error: "Comment not found" });
        }
        const comment = found.rows[0];
        if (comment.user_id !== user.id && user.role !== "OWNER") {
            return res.status(403).json({ error: "Permission denied" });
        }
        const cascadeQuery = `
      DELETE FROM comments
      WHERE id = $1 OR parent_id = $1;
    `;
        await db_1.pool.query(cascadeQuery, [commentId]);
        (0, sse_1.broadcastComment)(comment.file_id, comment.version_no, "comment:deleted", { id: commentId });
        return res.json({ success: true });
    }
    catch (err) {
        console.error("Delete comment failed:", err);
        return res.status(500).json({ error: "Delete failed" });
    }
}
//# sourceMappingURL=controller.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchTags = searchTags;
exports.replaceFileTags = replaceFileTags;
exports.patchFileTags = patchFileTags;
exports.getFileTags = getFileTags;
const db_1 = require("../../db");
/**
 * GET /tags?q=partial
 * Simple tag search (case-insensitive).
 */
async function searchTags(req, res) {
    const q = req.query.q || "";
    try {
        const sql = q
            ? `SELECT file_id, tag FROM files
         WHERE tag IS NOT NULL 
         AND LOWER(tag) LIKE LOWER($1)
         ORDER BY tag ASC
         LIMIT 200`
            : `SELECT file_id, tag FROM files
         WHERE tag IS NOT NULL
         ORDER BY tag ASC
         LIMIT 200`;
        const { rows } = await db_1.pool.query(sql, q ? [`%${q}%`] : []);
        res.json({
            items: rows.map((r) => ({
                fileId: r.file_id,
                tag: r.tag,
            })),
        });
    }
    catch (err) {
        console.error("searchTags error:", err);
        res.status(500).json({ error: "Failed to search tags" });
    }
}
/**
 * PUT /files/:id/tags
 * Replace all tags for a file. Body: { tags: string[] }
 */
async function replaceFileTags(req, res) {
    const fileId = req.params.id;
    const body = req.body;
    const tag = (body.tag || "").trim();
    try {
        await db_1.pool.query(`UPDATE files SET tag = $1 WHERE file_id = $2`, [tag, fileId]);
        res.json({ fileId, tag });
    }
    catch (err) {
        console.error("replaceFileTags error:", err);
        res.status(500).json({ error: "Failed to update tag for file" });
    }
}
/**
 * PATCH /files/:id/tags
 * Add or remove specific tags. Body: { add?: string[], remove?: string[] }
 */
async function patchFileTags(req, res) {
    const fileId = req.params.id;
    const body = req.body;
    const tag = body.tag === null ? null : (body.tag || "").trim() || null;
    try {
        await db_1.pool.query(`UPDATE files SET tag = $1 WHERE file_id = $2`, [tag, fileId]);
        res.json({ fileId, tag });
    }
    catch (err) {
        console.error("patchFileTags error:", err);
        res.status(500).json({ error: "Failed to patch tag for file" });
    }
}
/**
 * GET /files/:id/tags
 * Return tags for a file.
 */
async function getFileTags(req, res) {
    const fileId = req.params.id;
    try {
        const { rows } = await db_1.pool.query(`SELECT tag FROM files WHERE file_id = $1`, [fileId]);
        if (rows.length === 0) {
            return res.status(404).json({ error: "File not found" });
        }
        res.json({ fileId, tag: rows[0].tag });
    }
    catch (err) {
        console.error("getFileTags error:", err);
        res.status(500).json({ error: "Failed to load file tag" });
    }
}
//# sourceMappingURL=controller.js.map
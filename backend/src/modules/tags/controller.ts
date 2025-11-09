import { Request, Response } from "express";
import { pool } from "../../utils/db";

/**
 * Create or find tags by names, return rows.
 * This helper ensures idempotency (unique by lower(name)).
 */
async function ensureTags(client: any, names: string[]): Promise<{ id: number; name: string }[]> {
  const trimmed = Array.from(
    new Set(names.map((n) => n.trim()).filter((n) => n.length > 0))
  );
  if (trimmed.length === 0) return [];

  // Upsert each tag; keep it simple for clarity.
  const results: { id: number; name: string }[] = [];
  for (const name of trimmed) {
    const { rows } = await client.query(
      `
      INSERT INTO tags(name)
      VALUES ($1)
      ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
      RETURNING id, name
      `,
      [name]
    );
    results.push(rows[0]);
  }
  return results;
}

/**
 * GET /tags?q=partial
 * Simple tag search (case-insensitive).
 */
export async function searchTags(req: Request, res: Response) {
  const q = (req.query.q as string) || "";
  try {
    const { rows } = await pool.query(
      q
        ? `SELECT id, name FROM tags WHERE lower(name) LIKE lower($1) ORDER BY name ASC LIMIT 50`
        : `SELECT id, name FROM tags ORDER BY name ASC LIMIT 50`,
      q ? [`%${q}%`] : []
    );
    res.json({ items: rows });
  } catch (err) {
    console.error("searchTags error:", err);
    res.status(500).json({ error: "Failed to search tags" });
  }
}

/**
 * PUT /files/:id/tags
 * Replace all tags for a file. Body: { tags: string[] }
 */
export async function replaceFileTags(req: Request, res: Response) {
  const fileId = req.params.id;
  const body = req.body as { tags?: string[] };
  const tags = Array.isArray(body.tags) ? body.tags : [];

  // Optional: check permission here if you have an auth middleware context
  // e.g. only owner/editor can modify tags

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const tagRows = await ensureTags(client, tags);

    // Clear existing relations
    await client.query(`DELETE FROM file_tags WHERE file_id = $1`, [fileId]);

    // Re-insert relations
    for (const t of tagRows) {
      await client.query(
        `INSERT INTO file_tags(file_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [fileId, t.id]
      );
    }

    await client.query("COMMIT");
    res.json({ fileId, tags: tagRows.map((t) => t.name) });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("replaceFileTags error:", err);
    res.status(500).json({ error: "Failed to update tags for file" });
  } finally {
    client.release();
  }
}

/**
 * PATCH /files/:id/tags
 * Add or remove specific tags. Body: { add?: string[], remove?: string[] }
 */
export async function patchFileTags(req: Request, res: Response) {
  const fileId = req.params.id;
  const body = req.body as { add?: string[]; remove?: string[] };
  const toAdd = Array.isArray(body.add) ? body.add : [];
  const toRemove = Array.isArray(body.remove) ? body.remove : [];

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Handle remove
    if (toRemove.length > 0) {
      await client.query(
        `
        DELETE FROM file_tags
        WHERE file_id = $1 AND tag_id IN (
          SELECT id FROM tags WHERE name = ANY($2)
        )
        `,
        [fileId, toRemove]
      );
    }

    // Handle add
    if (toAdd.length > 0) {
      const tagRows = await ensureTags(client, toAdd);
      for (const t of tagRows) {
        await client.query(
          `INSERT INTO file_tags(file_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [fileId, t.id]
        );
      }
    }

    await client.query("COMMIT");

    // Return the final tag list
    const { rows } = await pool.query(
      `
      SELECT t.name
      FROM file_tags ft
      JOIN tags t ON t.id = ft.tag_id
      WHERE ft.file_id = $1
      ORDER BY t.name ASC
      `,
      [fileId]
    );
    res.json({ fileId, tags: rows.map((r) => r.name) });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("patchFileTags error:", err);
    res.status(500).json({ error: "Failed to patch tags for file" });
  } finally {
    client.release();
  }
}

/**
 * GET /files/:id/tags
 * Return tags for a file.
 */
export async function getFileTags(req: Request, res: Response) {
  const fileId = req.params.id;
  try {
    const { rows } = await pool.query(
      `
      SELECT t.id, t.name
      FROM file_tags ft
      JOIN tags t ON t.id = ft.tag_id
      WHERE ft.file_id = $1
      ORDER BY t.name ASC
      `,
      [fileId]
    );
    res.json({ items: rows });
  } catch (err) {
    console.error("getFileTags error:", err);
    res.status(500).json({ error: "Failed to load file tags" });
  }
}

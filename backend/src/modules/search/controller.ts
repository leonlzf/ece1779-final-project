import { Request, Response } from "express";
import { pool } from "../../utils/db";

/**
 * Build WHERE clauses and params for flexible filters.
 * AND semantics for tags: file must contain all requested tags.
 */
function buildWhere(
  q?: string,
  owner?: string,
  tagList?: string[]
): { where: string; params: any[] } {
  const clauses: string[] = [];
  const params: any[] = [];
  let idx = 1;

  // Name fuzzy search
  if (q && q.trim().length > 0) {
    clauses.push(`lower(f.name) LIKE lower($${idx++})`);
    params.push(`%${q.trim()}%`);
  }

  // Owner filter (uuid string)
  if (owner && owner.trim().length > 0) {
    clauses.push(`f.owner_id = $${idx++}::uuid`);
    params.push(owner.trim());
  }

  // Tags AND filter
  if (tagList && tagList.length > 0) {
    // Ensure file has all requested tags
    // Strategy: count distinct matching tags per file = length of tagList
    clauses.push(`
      f.id IN (
        SELECT ft.file_id
        FROM file_tags ft
        JOIN tags t ON t.id = ft.tag_id
        WHERE lower(t.name) = ANY($${idx++})
        GROUP BY ft.file_id
        HAVING COUNT(DISTINCT lower(t.name)) = $${idx++}
      )
    `);
    params.push(tagList.map((t) => t.toLowerCase()));
    params.push(tagList.length);
  }

  const where = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";
  return { where, params };
}

/**
 * GET /search/files?q=&tags=tag1,tag2&owner=<uuid>&page=1&limit=20
 * Returns paginated items with tag list.
 */
export async function searchFiles(req: Request, res: Response) {
  const q = (req.query.q as string) || "";
  const owner = (req.query.owner as string) || "";
  const tagsParam = (req.query.tags as string) || "";
  const page = Math.max(parseInt((req.query.page as string) || "1", 10), 1);
  const limit = Math.min(
    Math.max(parseInt((req.query.limit as string) || "20", 10), 1),
    100
  );
  const offset = (page - 1) * limit;

  const tagList = tagsParam
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  try {
    const { where, params } = buildWhere(q, owner, tagList);

    // Count for pagination
    const countSql = `
      SELECT COUNT(*) AS total
      FROM files f
      ${where}
    `;
    const countRes = await pool.query(countSql, params);
    const total = parseInt(countRes.rows[0]?.total || "0", 10);

    // Fetch page
    const dataSql = `
      SELECT
        f.id,
        f.name,
        f.owner_id,
        f.size,
        f.mime,
        f.created_at
      FROM files f
      ${where}
      ORDER BY f.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    const dataRes = await pool.query(dataSql, [...params, limit, offset]);
    const items = dataRes.rows;

    // Attach tags for listing (single round-trip for all file ids)
    if (items.length > 0) {
      const fileIds = items.map((r) => r.id);
      const tagRows = await pool.query(
        `
        SELECT ft.file_id, t.name
        FROM file_tags ft
        JOIN tags t ON t.id = ft.tag_id
        WHERE ft.file_id = ANY($1::uuid[])
        ORDER BY t.name ASC
        `,
        [fileIds]
      );
      const tagsByFile = new Map<string, string[]>();
      for (const r of tagRows.rows) {
        const list = tagsByFile.get(r.file_id) || [];
        list.push(r.name);
        tagsByFile.set(r.file_id, list);
      }
      for (const it of items) {
        it.tags = tagsByFile.get(it.id) || [];
      }
    }

    res.json({
      page,
      limit,
      total,
      items,
    });
  } catch (err) {
    console.error("searchFiles error:", err);
    res.status(500).json({ error: "Failed to search files" });
  }
}

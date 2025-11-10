import { Request, Response } from "express";
import { pool } from "../../db";
import { QueryResult } from "pg";

/**
 * WHERE conditions builder for file search
 * Supports: fuzzy name search + files visible to user (owner or with permissions)
 */
function buildFileSearchWhere(
  q?: string,
  userId?: string
): { where: string; params: any[] } {
  const clauses: string[] = [];
  const params: any[] = [];
  let idx = 1;

  if (q && q.trim().length > 0) {
    clauses.push(`LOWER(f.name) LIKE LOWER($${idx++})`);
    params.push(`%${q.trim()}%`);
  }

  if (userId && userId.trim().length > 0) {
    clauses.push(`(
      f.owner_id = $${idx}::uuid OR 
      EXISTS (
        SELECT 1 FROM file_permissions p 
        WHERE p.file_id = f.file_id 
        AND p.user_id = $${idx}::uuid 
        AND (p.can_read = true OR p.can_write = true)
      )
    )`);
    params.push(userId.trim());
    idx++;
  }

  const where = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";
  return { where, params };
}

/**
 * GET /search/files?q=&user=<uuid>&page=1&limit=20
 */
export async function searchFiles(req: Request, res: Response) {
  const q = (req.query.q as string) || "";
  const user = (req.query.user as string) || "";
  const page = Math.max(parseInt((req.query.page as string) || "1", 10), 1);
  const limit = Math.min(
    Math.max(parseInt((req.query.limit as string) || "20", 10), 1),
    100
  );
  const offset = (page - 1) * limit;

  try {
    const { where, params } = buildFileSearchWhere(q, user);

    const countSql = `
      SELECT COUNT(*) AS total
      FROM files f
      ${where}
    `;
    const countRes = await pool.query(countSql, params);
    const total = parseInt(countRes.rows[0]?.total || "0", 10);

    const dataSql = `
      SELECT 
        f.file_id,
        f.name,
        f.owner_id,
        f.latest_version,
        f.tag,
        f.created_at
      FROM files f
      ${where}
      ORDER BY f.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    const dataRes = await pool.query(dataSql, [...params, limit, offset]);

    res.json({
      page,
      limit,
      total,
      items: dataRes.rows,
    });
  } catch (err) {
    console.error("searchFiles error:", err);
    res.status(500).json({ error: "Failed to search files" });
  }
}

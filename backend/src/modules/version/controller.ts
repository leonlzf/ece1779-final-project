import { Request, Response } from "express";
import path from "path";
import fs from "fs/promises";
import { pool } from "../../db";
import { checkPermission } from "../files/controller";
import { nextVersion, ensureDir, versionPath, FILE_ROOT } from "../files/storage";

/**
 * save a new version of the file automatically
 * @param req 
 * @param res 
 * @returns 
 */
export async function autoSaveVersion(req: Request & { user?: { id: string } }, res: Response) {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const { content } = req.body;

    if (!userId) return res.status(401).json({ success: false, message: "unauthenticated" });
    if (!content) return res.status(400).json({ success: false, message: "content required" });
    if (!(await checkPermission(id, userId, "write"))) {
      return res.status(403).json({ success: false, message: "no write permission" });
    }

 
    const ver = await nextVersion(id);
    const dst = versionPath(id, ver, `version_${ver}.txt`);
    await ensureDir(path.dirname(dst));

    await fs.writeFile(dst, content, "utf-8");
    const stat = await fs.stat(dst);

    await pool.query(
      `INSERT INTO file_versions (file_id, version_no, name, size_bytes, uploaded_by)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, ver, `version_${ver}.txt`, stat.size, userId]
    );

    await pool.query(`UPDATE files SET latest_version = $1 WHERE file_id = $2`, [ver, id]);

    return res.json({ success: true, message: "new version saved", versionNo: ver });
  } catch (err) {
    console.error("autoSaveVersion error:", err);
    return res.status(500).json({ success: false, message: "failed to save new version" });
  }
}

/**
 * get metadata of a specific version
 * @param req 
 * @param res 
 * @returns 
 */
export async function getVersionMeta(req: Request, res: Response) {
  try {
    const { id, ver } = req.params;
    const { rows } = await pool.query(
  `SELECT v.version_no, v.name, v.size_bytes, v.uploaded_at,
          u.email AS uploaded_by_email
   FROM file_versions v
   JOIN users u ON v.uploaded_by = u.id
   WHERE v.file_id = $1 AND v.version_no = $2`,
  [id, ver]
);
    if (!rows.length) return res.status(404).json({ success: false, message: "version not found" });
    return res.json({ success: true, ...rows[0] });
  } catch (err) {
    console.error("getVersionMeta error:", err);
    return res.status(500).json({ success: false, message: "failed to get version meta" });
  }
}


/** * list all versions of a file
 * @param req 
 * @param res 
 * @returns 
 */
export async function listVersions(
  req: Request & { user?: { id: string } },
  res: Response
) {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "unauthenticated" });
    }

 
    if (!(await checkPermission(id, userId, "read"))) {
      return res
        .status(403)
        .json({ success: false, message: "no read permission" });
    }


    const { rows } = await pool.query(
      `SELECT v.version_no, v.name, v.size_bytes, v.uploaded_at, u.email AS uploaded_by
       FROM file_versions v
       JOIN users u ON v.uploaded_by = u.id
       WHERE v.file_id = $1
       ORDER BY v.version_no DESC`,
      [id]
    );

    return res.json({
      success: true,
      versions: rows.map((r) => ({
        versionNo: r.version_no,
        name: r.name,
        sizeBytes: r.size_bytes,
        uploadedBy: r.uploaded_by,
        uploadedAt: r.uploaded_at,
      })),
    });
  } catch (err) {
    console.error("listVersions error:", err);
    return res
      .status(500)
      .json({ success: false, message: "failed to list versions" });
  }
}



/** * delete a specific version of a file
 * @param req 
 * @param res 
 * @returns 
 */
export async function deleteVersion(
  req: Request & { user?: { id: string } },
  res: Response
) {
  try {
    const { id, ver } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "unauthenticated" });
    }


    const canDelete = await checkPermission(id, userId, "delete");
    if (!canDelete) {
      return res
        .status(403)
        .json({ success: false, message: "no delete permission" });
    }


    const result = await pool.query(
      `SELECT name FROM file_versions WHERE file_id = $1 AND version_no = $2`,
      [id, ver]
    );
    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: "version not found" });
    }

    const filename = result.rows[0].name;
    const filePath = path.join(FILE_ROOT, id, ver, filename);


    try {
      await fs.unlink(filePath);
    } catch (err: any) {
      if (err.code !== "ENOENT") {
        console.warn("deleteVersion unlink failed:", err);
      } else {
        console.warn("deleteVersion: file not found on disk", filePath);
      }
    }


    await pool.query(
      `DELETE FROM file_versions WHERE file_id = $1 AND version_no = $2`,
      [id, ver]
    );

    return res.json({
      success: true,
      message: `version ${ver} deleted`,
    });
  } catch (err) {
    console.error("deleteVersion error:", err);
    return res
      .status(500)
      .json({ success: false, message: "failed to delete version" });
  }
}



/** * rollback to a specific version by creating a new version with the same content
 * @param req 
 * @param res 
 * @returns 
 */
export async function rollbackVersion(
  req: Request & { user?: { id: string } },
  res: Response
) {
  try {
    const { id, ver } = req.params;
    const userId = req.user?.id;

    if (!userId)
      return res.status(401).json({ success: false, message: "unauthenticated" });

    if (!(await checkPermission(id, userId, "write")))
      return res.status(403).json({ success: false, message: "no write permission" });

    const { rows } = await pool.query(
      `SELECT name FROM file_versions WHERE file_id = $1 AND version_no = $2`,
      [id, ver]
    );
    if (!rows.length)
      return res.status(404).json({ success: false, message: "target version not found" });

    const oldName = rows[0].name;
    const oldPath = path.join(FILE_ROOT, id, ver, oldName);


    const content = await fs.readFile(oldPath, "utf-8");


    const newVer = await nextVersion(id);
    const newName = `${oldName}_v${ver}.txt`;
    const newPath = versionPath(id, newVer, newName);
    await ensureDir(path.dirname(newPath));


    await fs.writeFile(newPath, content, "utf-8");
    const stat = await fs.stat(newPath);


    await pool.query(
      `INSERT INTO file_versions (file_id, version_no, name, size_bytes, uploaded_by)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, newVer, newName, stat.size, userId]
    );

    await pool.query(`UPDATE files SET latest_version = $1 WHERE file_id = $2`, [newVer, id]);

    return res.json({
      success: true,
      message: `rolled back to version ${ver}, new version ${newVer} created`,
      newVersion: newVer,
    });
  } catch (err) {
    console.error("rollbackVersion error:", err);
    return res.status(500).json({ success: false, message: "failed to rollback version" });
  }
}
// backend/src/modules/files/controller.ts

import { Request, Response } from "express";
import { randomUUID } from "crypto";
import path from "path";
import fs from "fs";
import fsp from "fs/promises";
import { pool } from "../../db";
import { ensureDir, nextVersion, versionPath, FILE_ROOT } from "./storage";


async function checkPermission(
  fileId: string,
  userId: string,
  required: "read" | "write" | "delete" = "read"
): Promise<boolean> {
  const column =
    required === "read"
      ? "can_read"
      : required === "write"
      ? "can_write"
      : "can_delete";

  const result = await pool.query(
    `SELECT 1 FROM file_permissions WHERE file_id = $1 AND user_id = $2 AND ${column} = true`,
    [fileId, userId]
  );

  return (result.rowCount ?? 0) > 0;
}


async function moveFile(src: string, dst: string) {
  try {
    await fsp.rename(src, dst); 
  } catch (err: any) {
    if (err.code === "EXDEV") {
      
      await fsp.copyFile(src, dst);
      await fsp.unlink(src);
    } else {
      throw err;
    }
  }
}


export async function createFile(req: Request, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "file required" });
    }

    const ownerId = (req as any).user?.id;
    if (!ownerId) {
      return res.status(401).json({ message: "unauthenticated" });
    }

    const fileId = randomUUID();
    const ver = 1;
    const dst = versionPath(fileId, ver, req.file.originalname);
    await ensureDir(path.dirname(dst));

    console.log("writing to", dst);
    await moveFile(req.file.path, dst);

    const sizeBytes = fs.statSync(dst).size;
    const tag = req.body?.tag || null;

    await pool.query(
      `INSERT INTO files (file_id, name, latest_version, owner_id, tag)
       VALUES ($1, $2, $3, $4, $5)`,
      [fileId, req.file.originalname, ver, ownerId, tag]
    );

    await pool.query(
      `INSERT INTO file_versions (file_id, version_no, name, size_bytes, uploaded_by)
       VALUES ($1, $2, $3, $4, $5)`,
      [fileId, ver, req.file.originalname, sizeBytes, ownerId]
    );

    await pool.query(
      `INSERT INTO file_permissions (file_id, user_id, can_read, can_write, can_delete)
       VALUES ($1, $2, TRUE, TRUE, TRUE)
       ON CONFLICT (file_id, user_id) DO NOTHING`,
      [fileId, ownerId]
    );

    return res.status(201).json({
      success: true,
      fileId,
      versionNo: ver,
      name: req.file.originalname,
      sizeBytes,
      tag,
    });
  } catch (err) {
    console.error("createFile error:", err);
    return res
      .status(500)
      .json({ success: false, error: "failed to create file" });
  }
}


export async function addVersion(
  req: Request & { user?: { id: string } },
  res: Response
) {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthenticated" });
    }

    const file = req.file;
    if (!file) {
      return res
        .status(400)
        .json({ success: false, message: "file required" });
    }

    if (!(await checkPermission(id, userId, "write"))) {
      return res
        .status(403)
        .json({ success: false, message: "No write permission for this file" });
    }

    const ver = await nextVersion(id);
    const dst = versionPath(id, ver, file.originalname);
    await ensureDir(path.dirname(dst));
    await moveFile(file.path, dst);

    const stat = await fsp.stat(dst);
    const sizeBytes = stat.size;

    await pool.query(
      `INSERT INTO file_versions (file_id, version_no, name, size_bytes, uploaded_by)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, ver, file.originalname, sizeBytes, userId]
    );

    await pool.query(`UPDATE files SET latest_version = $1 WHERE file_id = $2`, [
      ver,
      id,
    ]);

    return res.json({
      success: true,
      fileId: id,
      versionNo: ver,
      name: file.originalname,
      sizeBytes,
    });
  } catch (err) {
    console.error("addVersion error:", err);
    return res
      .status(500)
      .json({ success: false, message: "failed to add version" });
  }
}

export async function listFiles(
  req: Request & { user?: { id: string } },
  res: Response
) {
  try {
    const userId = req.user?.id;
    const result = await pool.query(
      `SELECT f.file_id, f.name, f.latest_version, f.tag, f.created_at,
              p.can_read, p.can_write, p.can_delete
       FROM files f
       JOIN file_permissions p ON f.file_id = p.file_id
       WHERE p.user_id = $1 AND p.can_read = true
       ORDER BY f.created_at DESC`,
      [userId]
    );

    return res.json({
      success: true,
      files: result.rows.map((row) => {
        let role = "VIEWER";
        if (row.can_delete) role = "OWNER";
        else if (row.can_write) role = "COLLAB";

        return {
          fileId: row.file_id,
          name: row.name,
          tag: row.tag,
          latestVersion: row.latest_version,
          createdAt: row.created_at,
          role,
        };
      }),
    });
  } catch (err) {
    console.error("listFiles error:", err);
    return res
      .status(500)
      .json({ success: false, message: "failed to list files" });
  }
}


export async function downloadVersion(req: Request, res: Response) {
  try {
    const { id, ver } = req.params;
    const userId = (req as any).user?.id;

    if (!(await checkPermission(id, userId, "read"))) {
      return res
        .status(403)
        .json({ success: false, message: "No read permission for this file" });
    }

    const result = await pool.query(
      `SELECT name FROM file_versions WHERE file_id = $1 AND version_no = $2`,
      [id, ver]
    );

    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ success: false, error: "Version not found" });
    }

    const filename = result.rows[0].name;
    const filePath = path.join(FILE_ROOT, id, ver, filename);

    try {
      await fsp.access(filePath, fs.constants.R_OK);
    } catch {
      return res
        .status(404)
        .json({ success: false, error: "File missing on disk" });
    }

    console.log(`Downloading: ${filePath}`);
    return res.download(filePath, filename, (err) => {
      if (err && !res.headersSent) {
        console.error("Download error:", err);
        res.status(500).json({ success: false, error: "Download failed" });
      }
    });
  } catch (err) {
    console.error("downloadVersion error:", err);
    return res
      .status(500)
      .json({ success: false, error: "Internal server error" });
  }
}

export async function getFileMeta(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    if (!(await checkPermission(id, userId, "read"))) {
      return res
        .status(403)
        .json({ success: false, message: "No read permission for this file" });
    }

    const fileResult = await pool.query(
      `SELECT name, latest_version, tag, created_at FROM files WHERE file_id = $1`,
      [id]
    );

    if (fileResult.rowCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: "file not found" });
    }

    const file = fileResult.rows[0];
    const versionResult = await pool.query(
      `SELECT version_no, name, size_bytes, uploaded_at
       FROM file_versions
       WHERE file_id = $1
       ORDER BY version_no ASC`,
      [id]
    );

    const versions = versionResult.rows.map((v) => ({
      versionNo: v.version_no,
      name: v.name,
      sizeBytes: v.size_bytes,
      uploadedAt: v.uploaded_at,
    }));

    const latest = versions[versions.length - 1];

    return res.json({
      success: true,
      id,
      name: latest.name,
      tag: file.tag,
      latestVersion: file.latest_version,
      sizeBytes: latest.sizeBytes,
      createdAt: file.created_at,
      versions,
    });
  } catch (err) {
    console.error("getFileMeta error:", err);
    return res
      .status(500)
      .json({ success: false, message: "failed to read file metadata" });
  }
}


export async function deleteFile(
  req: Request & { user?: { id: string } },
  res: Response
) {
  const fileId = req.params.id;
  const userId = req.user?.id;

  if (!userId) {
    return res
      .status(401)
      .json({ success: false, message: "unauthenticated" });
  }

  const perm = await pool.query(
    `SELECT 1 FROM file_permissions WHERE file_id = $1 AND user_id = $2 AND can_delete = true`,
    [fileId, userId]
  );

  if ((perm.rowCount ?? 0) === 0) {
    return res
      .status(403)
      .json({ success: false, message: "no delete permission" });
  }

  const exists = await pool.query(`SELECT 1 FROM files WHERE file_id = $1`, [
    fileId,
  ]);
  if ((exists.rowCount ?? 0) === 0) {
    return res.status(404).json({ success: false, message: "file not found" });
  }

  const dir = path.join(FILE_ROOT, fileId);

  try {
    await fsp.rm(dir, { recursive: true, force: true });
  } catch (e) {
    console.error("rm dir error:", e);
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(`DELETE FROM file_versions WHERE file_id = $1`, [
      fileId,
    ]);
    await client.query(`DELETE FROM file_permissions WHERE file_id = $1`, [
      fileId,
    ]);
    await client.query(`DELETE FROM files WHERE file_id = $1`, [fileId]);
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("deleteFile tx error:", err);
    return res
      .status(500)
      .json({ success: false, message: "failed to delete file" });
  } finally {
    client.release();
  }

  return res.status(204).end();
}
/**
 * share a file with another user
 * @param req 
 * @param res 
 * @returns 
 */
export async function shareFile(
  req: Request & { user?: { id: string } },
  res: Response
) {
  try {
    const { id } = req.params; // file_id
    const { targetEmail, role } = req.body;
    const userId = req.user?.id;



    if (!userId) {
      return res.status(401).json({ success: false, message: "unauthenticated" });
    }

    if (!targetEmail || !role) {
      return res
        .status(400)
        .json({ success: false, message: "targetEmail and role are required" });
    }

    const permCheck = await pool.query(
      `SELECT 1 FROM file_permissions WHERE file_id = $1 AND user_id = $2 AND can_delete = true`,
      [id, userId]
    );
    console.log("permCheck result:", permCheck.rowCount);

    if ((permCheck.rowCount ?? 0) === 0) {
      return res
        .status(403)
        .json({ success: false, message: "only OWNER can share this file" });
    }

    const targetUser = await pool.query(
      `SELECT id, email FROM users WHERE email = $1`,
      [targetEmail]
    );
    console.log("targetUser result:", targetUser.rows);

    if (targetUser.rowCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: "target user not found" });
    }

    const targetId = targetUser.rows[0].id;


    if (targetId === userId) {
      return res
        .status(400)
        .json({ success: false, message: "cannot share file with yourself" });
    }

    let can_read = true;
    let can_write = false;
    let can_delete = false;

    if (role === "OWNER") {
      can_write = true;
      can_delete = true;
    } else if (role === "COLLAB") {
      can_write = true;
    } else if (role === "VIEWER") {
    } else {
      return res
        .status(400)
        .json({ success: false, message: "invalid role" });
    }


    await pool.query(
      `INSERT INTO file_permissions (file_id, user_id, can_read, can_write, can_delete)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (file_id, user_id)
       DO UPDATE SET can_read = EXCLUDED.can_read, 
                     can_write = EXCLUDED.can_write, 
                     can_delete = EXCLUDED.can_delete`,
      [id, targetId, can_read, can_write, can_delete]
    );

    console.log("✅ shareFile success");
    return res.json({
      success: true,
      fileId: id,
      sharedWith: targetEmail,
      role,
    });
  } catch (err) {
    console.error("shareFile error:", err);
    return res
      .status(500)
      .json({ success: false, message: "failed to share file", error: String(err) });
  }
}

/**
 * Edit a file if it's of an editable type
 * @param req 
 * @param res 
 * @returns 
 */
export async function editFile(
  req: Request & { user?: { id: string } },
  res: Response
) {
  try {
    const { id, ver } = req.params;
    const userId = req.user?.id;
    if (!userId)
      return res.status(401).json({ success: false, message: "unauthenticated" });

    const { rows } = await pool.query(
      `SELECT name FROM file_versions WHERE file_id=$1 AND version_no=$2`,
      [id, ver]
    );
    if (!rows.length)
      return res.status(404).json({ success: false, message: "file not found" });

    const filename = rows[0].name;
    const filePath = path.join(FILE_ROOT, id, ver, filename);
    const ext = path.extname(filename).toLowerCase();

    if (ext === ".pdf") {
      if (!(await checkPermission(id, userId, "read"))) {
        return res
          .status(403)
          .json({ success: false, message: "no read permission" });
      }
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
      const stream = fs.createReadStream(filePath);
      return stream.pipe(res);
    }


    const canRead = await checkPermission(id, userId, "read");
    if (!canRead) {
      return res
        .status(403)
        .json({ success: false, message: "no read permission" });
    }

    const canWrite = await checkPermission(id, userId, "write");

    if (ext === ".txt" || ext === ".md" || ext === ".json") {
      const content = await fsp.readFile(filePath, "utf-8");
      return res.json({
        success: true,
        editable: canWrite, 
        type: "text",
        content,
      });
    }

    if (ext === ".docx") {
      const buffer = await fsp.readFile(filePath);
      const base64 = buffer.toString("base64");
      return res.json({
        success: true,
        editable: canWrite,
        type: "docx",
        content: base64,
      });
    }

    return res.json({
      success: false,
      message: `file type ${ext} not supported for viewing`,
    });
  } catch (err) {
    console.error("editFile error:", err);
    return res
      .status(500)
      .json({ success: false, message: "failed to open file" });
  }
}


/**
 * save edited file content
 * @param req 
 * @param res 
 * @returns 
 */
export async function saveFile(
  req: Request & { user?: { id: string } },
  res: Response
) {
  try {
    const { id, ver } = req.params;
    const userId = req.user?.id;
    const { content } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: "unauthenticated" });
    }

    if (!content) {
      return res.status(400).json({ success: false, message: "content required" });
    }

    const canWrite = await checkPermission(id, userId, "write");
    if (!canWrite) {
      return res.status(403).json({ success: false, message: "no write permission" });
    }

  
    const { rows } = await pool.query(
      `SELECT name FROM file_versions WHERE file_id=$1 AND version_no=$2`,
      [id, ver]
    );
    if (!rows.length) {
      return res.status(404).json({ success: false, message: "file not found" });
    }

    const filename = rows[0].name;
    const filePath = path.join(FILE_ROOT, id, ver, filename);
    const ext = path.extname(filename).toLowerCase();


    if (ext === ".txt" || ext === ".md" || ext === ".json") {
      await fsp.writeFile(filePath, content, "utf-8");
    } else if (ext === ".docx") {
      const buffer = Buffer.from(content, "base64");
      await fsp.writeFile(filePath, buffer);
    } else {
      return res.json({ success: false, message: `file type ${ext} not supported for save` });
    }

    return res.json({ success: true, message: "file saved successfully" });
  } catch (err) {
    console.error("saveEditedFile error:", err);
    return res
      .status(500)
      .json({ success: false, message: "failed to save file" });
  }
}

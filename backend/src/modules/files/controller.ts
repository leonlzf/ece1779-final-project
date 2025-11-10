import { Request, Response } from "express";
import { randomUUID } from "crypto";
import path from "path";
import fs from "fs";
import fsp from "fs/promises";
import { pool } from "../../db";
import { ensureDir, nextVersion, versionPath, listFileIds, FILE_ROOT } from "./storage";




async function checkPermission(fileId: string, userId: string, required: "read" | "write"| "delete" = "read"): Promise<boolean> {
  const column =
    required === "read" ? "can_read" :
    required === "write" ? "can_write" : 
    "can_delete";

  const result = await pool.query(
    `SELECT 1 FROM file_permissions WHERE file_id = $1 AND user_id = $2 AND ${column} = true`,
    [fileId, userId]
  );

  return (result.rowCount ?? 0) > 0;
}



/* 
export async function createFile(req: Request, res: Response) {
  if (!req.file) return res.status(400).json({ message: "file required" });
  const fileId = randomUUID();  
  const ver = 1;
  const dst = versionPath(fileId, ver, req.file.originalname);
  await ensureDir(path.dirname(dst));
  fs.renameSync(req.file.path, dst);
  return res.json({ fileId, versionNo: ver, name: req.file.originalname });
}
*/


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
    fs.renameSync(req.file.path, dst);

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
    return res.status(500).json({ success: false, error: "failed to create file" });
  }
}

/*
export async function addVersion(req: Request, res: Response) {
  const { id } = req.params;
  if (!req.file) return res.status(400).json({ message: "file required" });
  const ver = await nextVersion(id);
  const dst = versionPath(id, ver, req.file.originalname);
  await ensureDir(path.dirname(dst));
  fs.renameSync(req.file.path, dst);
  return res.json({ fileId: id, versionNo: ver, name: req.file.originalname });
}*/


export async function addVersion(req: Request & { user?: { id: string } }, res: Response) {
  try {
    const { id } = req.params;
    const userId = req.user?.id; 
    if (!userId) {
  return res.status(401).json({ success: false, message: "Unauthenticated" });
}
    const file = req.file;
    if (!file) {
      return res.status(400).json({ success: false, message: "file required" });
    }
    if (!(await checkPermission(id, userId, "write"))) {
      return res.status(403).json({ success: false, message: "No write permission for this file" });
}
    const ver = await nextVersion(id);
    const dst = versionPath(id, ver, file.originalname);
    await ensureDir(path.dirname(dst));
    fs.renameSync(file.path, dst);


    const stat = await fsp.stat(dst);
    const sizeBytes = stat.size;


    await pool.query(
      `INSERT INTO file_versions (file_id, version_no, name, size_bytes, uploaded_by)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, ver, file.originalname, sizeBytes, userId]
    );


    await pool.query(`UPDATE files SET latest_version = $1 WHERE file_id = $2`, [ver, id]);


    return res.json({
      success: true,
      fileId: id,
      versionNo: ver,
      name: file.originalname,
      sizeBytes,
    });
  } catch (err) {
    console.error("addVersion error:", err);
    return res.status(500).json({ success: false, message: "failed to add version" });
  }
}

// selec files accessible by the user
export async function listFiles(req: Request & { user?: { id: string } }, res: Response) {
  try {
    const userId = req.user?.id;
    const result = await pool.query(
      `SELECT f.file_id, f.name, f.latest_version, f.tag, f.created_at
       FROM files f
       JOIN file_permissions p ON f.file_id = p.file_id
       WHERE p.user_id = $1 AND p.can_read = true
       ORDER BY f.created_at DESC`,
      [userId]
    );

    return res.json({
      success: true,
      files: result.rows.map(row => ({
        fileId: row.file_id,
        name: row.name,
        tag: row.tag,
        latestVersion: row.latest_version,
        createdAt: row.created_at,
      })),
    });
  } catch (err) {
    console.error("listFiles error:", err);
    return res.status(500).json({ success: false, message: "failed to list files" });
  }
}
/*
export async function downloadVersion(req: Request, res: Response) {
  try {
    const { id, ver } = req.params;
    const { name } = req.query;

    const dir = path.join(FILE_ROOT, id, ver);
    const entries = await fsp.readdir(dir);

    const filename =
      typeof name === "string" && name.trim() !== ""
        ? name
        : entries.length > 0
        ? entries[0]
        : null;

    if (!filename) {
      return res.status(404).json({ success: false, error: "No file found in this version" });
    }

    const filePath = path.join(dir, filename);
    console.log("Downloading:", filePath);

    return res.download(filePath, filename, (err) => {
      if (err && !res.headersSent) {
        console.error("Download error:", err);
        res.status(500).json({ success: false, error: "Download failed" });
      }
    });
  } catch (err) {
    console.error("Download error:", err);
    res.status(500).json({ success: false, error: "Download failed" });
  }
}*/


export async function downloadVersion(req: Request, res: Response) {
  try {
    const { id, ver } = req.params;

    const userId = (req as any).user?.id;
      if (!(await checkPermission(id, userId, "read"))) {
  return res.status(403).json({ success: false, message: "No read permission for this file" });
}

    const result = await pool.query(
      `SELECT name FROM file_versions WHERE file_id = $1 AND version_no = $2`,
      [id, ver]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, error: "Version not found" });
    }

    const filename = result.rows[0].name;
    const filePath = path.join(FILE_ROOT, id, ver, filename);

 
    try {
      await fsp.access(filePath, fs.constants.R_OK);
    } catch {
      return res.status(404).json({ success: false, error: "File missing on disk" });
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
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}
/*
export async function getFileMeta(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const root = path.join(FILE_ROOT, id);

    // ensure fileId directory exists
    const topEntries = await fsp.readdir(root, { withFileTypes: true }).catch(() => null);
    if (!topEntries) return res.status(404).json({ message: "file not found" });

    // collect numeric version folders
    const versions = topEntries
      .filter(d => d.isDirectory())
      .map(d => Number(d.name))
      .filter(n => !Number.isNaN(n))
      .sort((a, b) => a - b);

    if (versions.length === 0) {
      return res.status(404).json({ message: "no versions for this file" });
    }

    // build version metadata
    const versionMeta: Array<{ versionNo: number; name: string; sizeBytes: number; uploadedAt: string }> = [];

    for (const v of versions) {
      const vDir = path.join(root, String(v));
      const files = await fsp.readdir(vDir).catch(() => []);
      if (files.length === 0) continue;

      // we store one file per version folder; take the first
      const filename = files[0];
      const filePath = path.join(vDir, filename);
      const stat = await fsp.stat(filePath);

      versionMeta.push({
        versionNo: v,
        name: filename,
        sizeBytes: stat.size,
        uploadedAt: stat.mtime.toISOString(),
      });
    }

    if (versionMeta.length === 0) {
      return res.status(404).json({ message: "no files found under versions" });
    }

    const latest = versionMeta[versionMeta.length - 1];

    return res.json({
      id,
      name: latest.name,
      latestVersion: latest.versionNo,
      versions: versionMeta,
    });
  } catch (err) {
    console.error("getFileMeta error:", err);
    return res.status(500).json({ message: "failed to read file metadata" });
  }
}*/

export async function getFileMeta(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;
if (!(await checkPermission(id, userId, "read"))) {
  return res.status(403).json({ success: false, message: "No read permission for this file" });
}

    const fileResult = await pool.query(
      `SELECT name, latest_version, tag, created_at
       FROM files
       WHERE file_id = $1`,
      [id]
    );

    if (fileResult.rowCount === 0) {
      return res.status(404).json({ success: false, message: "file not found" });
    }

    const file = fileResult.rows[0];
    const versionResult = await pool.query(
      `SELECT version_no, name, size_bytes, uploaded_at
       FROM file_versions
       WHERE file_id = $1
       ORDER BY version_no ASC`,
      [id]
    );

    if (versionResult.rowCount === 0) {
      return res.status(404).json({ success: false, message: "no versions found" });
    }

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
      createdAt: file.created_at,
      versions,
    });

  } catch (err) {
    console.error("getFileMeta error:", err);
    return res.status(500).json({ success: false, message: "failed to read file metadata" });
  }
}
import { Request, Response } from "express";
import { randomUUID } from "crypto";
import path from "path";
import fs from "fs";
import fsp from "fs/promises";
import { ensureDir, nextVersion, versionPath, listFileIds, FILE_ROOT } from "./storage";

export async function createFile(req: Request, res: Response) {
  if (!req.file) return res.status(400).json({ message: "file required" });
  const fileId = randomUUID();  
  const ver = 1;
  const dst = versionPath(fileId, ver, req.file.originalname);
  await ensureDir(path.dirname(dst));
  fs.renameSync(req.file.path, dst);
  return res.json({ fileId, versionNo: ver, name: req.file.originalname });
}

export async function addVersion(req: Request, res: Response) {
  const { id } = req.params;
  if (!req.file) return res.status(400).json({ message: "file required" });
  const ver = await nextVersion(id);
  const dst = versionPath(id, ver, req.file.originalname);
  await ensureDir(path.dirname(dst));
  fs.renameSync(req.file.path, dst);
  return res.json({ fileId: id, versionNo: ver, name: req.file.originalname });
}

export async function listFiles(_req: Request, res: Response) {
  const ids = await listFileIds();
  return res.json(ids.map(id => ({ fileId: id })));
}

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
}

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
}


import { Request, Response } from "express";
import { randomUUID } from "crypto";
import path from "path";
import fs from "fs";
import { ensureDir, nextVersion, versionPath, listFileIds } from "./storage";

export async function createFile(req: Request, res: Response) {
  if (!req.file) return res.status(400).json({ message: "file required" });
  const fileId = randomUUID();         // ← 改这里
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
  const { id, ver } = req.params;
  const name = req.query.name as string | undefined;
  if (!name) return res.status(400).json({ message: "query ?name=original.ext required" });
  const p = versionPath(id, Number(ver), name);
  return res.sendFile(path.resolve(p));
}

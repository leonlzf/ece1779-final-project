import fsp from "fs/promises";
import fs from "fs";
import path from "path";

const FILE_ROOT = process.env.FILE_ROOT || "./data/files";

export async function ensureDir(p: string) { await fsp.mkdir(p, { recursive: true }); }

export async function nextVersion(fileId: string) {
  const dir = path.join(FILE_ROOT, fileId);
  try { await fsp.access(dir); } catch { await fsp.mkdir(dir, { recursive: true }); return 1; }
  const entries = await fsp.readdir(dir, { withFileTypes: true });
  const nums = entries.filter(e => e.isDirectory()).map(d => Number(d.name)).filter(n => !isNaN(n));
  return (nums.length ? Math.max(...nums) : 0) + 1;
}

export function versionPath(fileId: string, ver: number, original: string) {
  return path.join(FILE_ROOT, fileId, String(ver), original);
}

export async function listFileIds() {
  try { await fsp.access(FILE_ROOT); } catch { return []; }
  return (await fsp.readdir(FILE_ROOT)).filter(name => fs.statSync(path.join(FILE_ROOT, name)).isDirectory());
}

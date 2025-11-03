import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { randomUUID } from "crypto";
import { sign } from "../../middleware/auth";

// Use the in-memory database first, then replace it with PostgreSQL later.
type UserRow = { id: string; email: string; passwordHash: string; role: "OWNER"|"COLLAB"|"VIEWER" };
const users = new Map<string, UserRow>();

export async function register(req: Request, res: Response) {
  const { email, password } = req.body ?? {};
  if (!email || !password) return res.status(400).json({ message: "email & password required" });
  if ([...users.values()].some(u => u.email === email)) return res.status(409).json({ message: "email exists" });

  const row: UserRow = {
    id: randomUUID(),
    email,
    passwordHash: await bcrypt.hash(password, 10),
    role: "OWNER"
  };
  users.set(row.id, row);
  return res.json({ token: sign({ id: row.id, email: row.email, role: row.role }) });
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body ?? {};
  if (!email || !password) return res.status(400).json({ message: "email & password required" });
  const row = [...users.values()].find(u => u.email === email);
  if (!row) return res.status(401).json({ message: "invalid credentials" });
  const ok = await bcrypt.compare(password, row.passwordHash);
  if (!ok) return res.status(401).json({ message: "invalid credentials" });
  return res.json({ token: sign({ id: row.id, email: row.email, role: row.role }) });
}

export async function me(req: Request & { user?: { id: string; email: string; role?: string } }, res: Response) {
  if (!req.user) return res.status(401).json({ message: "unauthenticated" });
  return res.json({ id: req.user.id, email: req.user.email, role: req.user.role });
}

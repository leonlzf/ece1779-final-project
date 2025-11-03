import { Request, Response } from "express";

const users = new Map<string, string>();

export async function register(req: Request, res: Response) {
  const { email, password } = req.body ?? {};
  if (!email || !password) return res.status(400).json({ message: "email & password required" });
  if (users.has(email)) return res.status(409).json({ message: "email exists" });
  users.set(email, password);
  return res.json({ token: "dev-token" });
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body ?? {};
  if (!email || !password) return res.status(400).json({ message: "email & password required" });
  const ok = users.get(email) === password;
  if (!ok) return res.status(401).json({ message: "incorrect email or password" });
  return res.json({ token: "dev-token" });
}

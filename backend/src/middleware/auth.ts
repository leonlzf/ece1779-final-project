import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";
export interface JwtUser { id: string; email: string; role?: "OWNER"|"COLLAB"|"VIEWER"; }

export function sign(user: JwtUser) {
  return jwt.sign(user, JWT_SECRET, { expiresIn: "7d" });
}

export function requireAuth(req: Request & { user?: JwtUser }, res: Response, next: NextFunction) {
  const h = req.header("authorization");
  if (!h?.startsWith("Bearer ")) return res.status(401).json({ message: "missing token" });
  try {
    req.user = jwt.verify(h.slice(7), JWT_SECRET) as JwtUser;
    next();
  } catch {
    return res.status(401).json({ message: "invalid token" });
  }
}

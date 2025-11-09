import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { randomUUID } from "crypto";
import { signToken } from "../../middleware/auth";
import { pool } from "../../db";
import { QueryResult } from "pg";

// Register & Login controllers


export async function register(req: Request, res: Response) {
  const { email, password } = req.body ?? {};
  if (!email || !password) return res.status(400).json({ message: "email & password required" });
    try {
    
    const existing: QueryResult = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );
    if (existing.rowCount && existing.rowCount > 0) {
      return res.status(409).json({ message: "email exists" });
    }

    const id = randomUUID();
    const passwordHash = await bcrypt.hash(password, 10);

    await pool.query(
      "INSERT INTO users (id, email, password_hash, role) VALUES ($1, $2, $3, $4)",
      [id, email, passwordHash, "OWNER"]
    );

    
    return res.status(201).json({ token: signToken(id) });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ message: "server error" });
  }

}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body ?? {};
  if (!email || !password) return res.status(400).json({ message: "email & password required" });
  try {
    const result: QueryResult = await pool.query(
      "SELECT id, password_hash FROM users WHERE email = $1",
      [email]
    );
   
    if (result.rowCount === 0) {
      return res.status(401).json({ message: "invalid credentials" });
    }

    const user = result.rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ message: "invalid credentials" });
    }

    return res.json({ token: signToken(user.id) });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "server error" });
  }


}

export async function me(req: Request & { user?: { id: string } }, res: Response) {
  if (!req.user)
    return res.status(401).json({ message: "unauthenticated" });

  try {
    const result = await pool.query(
      "SELECT id, email, role FROM users WHERE id = $1",
      [req.user.id]
    );
    if (result.rowCount === 0)
      return res.status(404).json({ message: "user not found" });

    return res.json(result.rows[0]);
  } catch (err) {
    console.error("me() error:", err);
    return res.status(500).json({ message: "server error" });
  }
}
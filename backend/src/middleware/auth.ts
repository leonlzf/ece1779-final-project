import { RequestHandler } from "express";
import jwt, { Secret, SignOptions, JwtPayload } from "jsonwebtoken";
import { env } from "../config/env";

// Temporary, need to be modified
export const requireAuth: RequestHandler = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ success: false, error: "Missing or invalid authorization header" });
  }

  const token = authHeader.split(" ")[1] as string;

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET as Secret) as JwtPayload & {
      uid: string;
      email?: string;
      role?: "OWNER" | "COLLAB" | "VIEWER";
    };

    // Attach a typed user to req; default role ensures comments module works now
    (req as any).user = {
      id: decoded.uid,
      email: decoded.email,
      role: decoded.role ?? "COLLAB",
    };

    next();
  } catch {
    return res.status(401).json({ success: false, error: "Invalid or expired token" });
  }
};

// Sign JWT (you can keep using this as-is)
export const signToken = (userId: string) => {
  const secret: Secret = env.JWT_SECRET as Secret;
  const options: SignOptions = { expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"] };
  return jwt.sign({ uid: userId }, secret, options);
};

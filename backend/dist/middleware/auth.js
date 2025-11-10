"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signToken = exports.requireAuth = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
// Temporary, need to be modified
const requireAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res
            .status(401)
            .json({ success: false, error: "Missing or invalid authorization header" });
    }
    const token = authHeader.split(" ")[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET);
        // Attach a typed user to req; default role ensures comments module works now
        req.user = {
            id: decoded.uid,
            email: decoded.email,
            role: decoded.role ?? "COLLAB",
        };
        next();
    }
    catch {
        return res.status(401).json({ success: false, error: "Invalid or expired token" });
    }
};
exports.requireAuth = requireAuth;
// Sign JWT (you can keep using this as-is)
const signToken = (userId) => {
    const secret = env_1.env.JWT_SECRET;
    const options = { expiresIn: env_1.env.JWT_EXPIRES_IN };
    return jsonwebtoken_1.default.sign({ uid: userId }, secret, options);
};
exports.signToken = signToken;
//# sourceMappingURL=auth.js.map
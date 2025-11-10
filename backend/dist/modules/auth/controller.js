"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
exports.me = me;
const bcrypt_1 = __importDefault(require("bcrypt"));
const crypto_1 = require("crypto");
const auth_1 = require("../../middleware/auth");
const db_1 = require("../../db");
// Register & Login controllers
async function register(req, res) {
    const { email, password } = req.body ?? {};
    if (!email || !password)
        return res.status(400).json({ message: "email & password required" });
    try {
        const existing = await db_1.pool.query("SELECT id FROM users WHERE email = $1", [email]);
        if (existing.rowCount && existing.rowCount > 0) {
            return res.status(409).json({ message: "email exists" });
        }
        const id = (0, crypto_1.randomUUID)();
        const passwordHash = await bcrypt_1.default.hash(password, 10);
        await db_1.pool.query("INSERT INTO users (id, email, password_hash, role) VALUES ($1, $2, $3, $4)", [id, email, passwordHash, "OWNER"]);
        return res.status(201).json({
            token: (0, auth_1.signToken)(id),
            user: {
                id,
                email,
            },
        });
    }
    catch (err) {
        console.error("Register error:", err);
        return res.status(500).json({ message: "server error" });
    }
}
async function login(req, res) {
    const { email, password } = req.body ?? {};
    if (!email || !password)
        return res.status(400).json({ message: "email & password required" });
    try {
        const result = await db_1.pool.query("SELECT id, password_hash FROM users WHERE email = $1", [email]);
        if (result.rowCount === 0) {
            return res.status(401).json({ message: "invalid credentials" });
        }
        const user = result.rows[0];
        const ok = await bcrypt_1.default.compare(password, user.password_hash);
        if (!ok) {
            return res.status(401).json({ message: "invalid credentials" });
        }
        return res.json({
            token: (0, auth_1.signToken)(user.id),
            user: {
                id: user.id,
                email,
            },
        });
    }
    catch (err) {
        console.error("Login error:", err);
        return res.status(500).json({ message: "server error" });
    }
}
async function me(req, res) {
    if (!req.user)
        return res.status(401).json({ message: "unauthenticated" });
    try {
        const result = await db_1.pool.query("SELECT id, email, role FROM users WHERE id = $1", [req.user.id]);
        if (result.rowCount === 0)
            return res.status(404).json({ message: "user not found" });
        return res.json(result.rows[0]);
    }
    catch (err) {
        console.error("me() error:", err);
        return res.status(500).json({ message: "server error" });
    }
}
//# sourceMappingURL=controller.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testConnection = exports.pool = void 0;
const pg_1 = __importDefault(require("pg"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const { Pool } = pg_1.default;
exports.pool = new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
});
const testConnection = async () => {
    try {
        const res = await exports.pool.query('SELECT NOW()');
        console.log('Database connected:', res.rows[0]);
    }
    catch (err) {
        console.error('Database connection failed:', err);
    }
};
exports.testConnection = testConnection;
//# sourceMappingURL=db.js.map
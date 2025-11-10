"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
const pg_1 = require("pg");
const env_1 = require("../config/env");
// Create a singleton Pool to reuse connections
exports.pool = new pg_1.Pool({
    connectionString: env_1.env.DATABASE_URL, // e.g. postgres://user:pass@host:5432/db
    ssl: env_1.env.DB_SSL ? { rejectUnauthorized: false } : undefined,
});
//# sourceMappingURL=db.js.map
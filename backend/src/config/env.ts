import path from "path";

// Temporary, need to be modified
export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: process.env.PORT ? Number(process.env.PORT) : 8080,

  DATABASE_URL: process.env.DATABASE_URL || "postgresql://placeholder",   // need to be implemented db

  DB_SSL: process.env.DB_SSL === "true",

  JWT_SECRET: process.env.JWT_SECRET || "dev-secret-key",
  JWT_EXPIRES_IN: "7d",

  UPLOAD_DIR: process.env.UPLOAD_DIR || path.resolve(__dirname, "../../data/files"),

  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:3000",
};

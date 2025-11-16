import path from "path";

export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: process.env.PORT ? Number(process.env.PORT) : 8080,

  DATABASE_URL: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/app",
  DB_SSL: process.env.DB_SSL === "true",

  JWT_SECRET: process.env.JWT_SECRET || "dev-secret-key",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",

  UPLOAD_DIR: process.env.UPLOAD_DIR || "/mnt/volume_files",

  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5221",
};

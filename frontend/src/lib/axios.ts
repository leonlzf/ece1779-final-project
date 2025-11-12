// src/lib/axios.ts
import axios, { type InternalAxiosRequestConfig } from "axios";

const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const u = config.url ?? "";
  const isAuthNoToken =
    u.startsWith("/auth/login") || u.startsWith("/auth/register");

  if (!isAuthNoToken) {
    const raw = localStorage.getItem("token");
    const token = raw && raw !== "undefined" && raw !== "null" ? raw : "";

    if (token) {
      const hdrs: any = config.headers ?? {};
      if (typeof hdrs.set === "function") {
        hdrs.set("Authorization", `Bearer ${token}`);
      } else {
        config.headers = { ...hdrs, Authorization: `Bearer ${token}` } as any;
      }
    } else {
      const hdrs: any = config.headers;
      if (hdrs) {
        if (typeof hdrs.delete === "function") {
          hdrs.delete("Authorization");
        } else {
          delete hdrs.Authorization;
        }
      }
    }
  } else {
    const hdrs: any = config.headers;
    if (hdrs) {
      if (typeof hdrs.delete === "function") {
        hdrs.delete("Authorization");
      } else {
        delete hdrs.Authorization;
      }
    }
  }

  return config;
});

export default api;
